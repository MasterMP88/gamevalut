import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommerceDb, StripeLookup, SubLike } from "./webhook.server";

export function stripeClient(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Stripe ist noch nicht eingerichtet.");
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    timeout: 15000,
    maxNetworkRetries: 1,
  });
}

export async function verifyUser(
  accessToken: unknown,
): Promise<{ id: string; email: string | null }> {
  if (typeof accessToken !== "string" || accessToken.split(".").length !== 3)
    throw new Error("Unauthorized");
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Unauthorized");
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function stripeCustomerFor(
  userId: string,
): Promise<string | null> {
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .not("provider_customer_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.provider_customer_id ?? null;
}

export async function adminCommerceDb(): Promise<CommerceDb> {
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");
  // The new service-only schema is not a browser capability.
  const service = supabaseAdmin as unknown as SupabaseClient;
  const ok = <T extends { error: unknown }>(r: T) => {
    if (r.error)
      throw new Error(
        String((r.error as { message?: string }).message ?? r.error),
      );
    return r;
  };
  return {
    claim: async (id, type, attempt) =>
      !!ok(
        await service.rpc("stripe_claim_event", {
          p_id: id,
          p_type: type,
          p_attempt: attempt,
        }),
      ).data,
    finish: async (id, attempt, status, error) => {
      ok(
        await service
          .from("stripe_webhook_events")
          .update({
            status,
            error: error ? error.slice(0, 500) : null,
            processed_at: new Date().toISOString(),
          })
          .eq("event_id", id)
          .eq("attempt_id", attempt),
      );
    },
    lock: async (resource, attempt) =>
      !!ok(
        await service.rpc("stripe_lock_resource", {
          p_resource: resource,
          p_attempt: attempt,
        }),
      ).data,
    release: async (resource, attempt) => {
      ok(
        await service
          .from("stripe_resource_leases")
          .delete()
          .eq("resource", resource)
          .eq("attempt_id", attempt),
      );
    },
    apply: async (resource, attempt, entitlement, subscription) => {
      ok(
        await service.rpc("stripe_apply_access", {
          p_resource: resource,
          p_attempt: attempt,
          p_entitlement: entitlement,
          p_subscription: subscription ?? null,
        }),
      );
    },
  };
}

const objectId = (v: string | { id: string } | null | undefined) =>
  typeof v === "string" ? v : (v?.id ?? null);
/** Latest Stripe state is fetched while holding a source lease; snapshots from old events never win. */
export function stripeLookup(stripe: Stripe): StripeLookup {
  const blockedCharge = async (id: string): Promise<boolean> => {
    const charge = await stripe.charges.retrieve(id);
    if (
      charge.refunded ||
      (charge.amount > 0 && charge.amount_refunded >= charge.amount)
    )
      return true;
    if (!charge.disputed) return false;
    const disputes = await stripe.disputes.list({ charge: id, limit: 10 });
    if (disputes.has_more)
      throw new Error("Dispute reconciliation needs full history");
    return disputes.data.some(
      (d) =>
        ![
          "won",
          "warning_closed",
          "warning_needs_response",
          "warning_under_review",
        ].includes(d.status),
    );
  };
  const paymentCharge = async (id: string) => {
    const pi = await stripe.paymentIntents.retrieve(id);
    return objectId(pi.latest_charge);
  };
  return {
    checkoutPriceIds: async (id) =>
      (await stripe.checkout.sessions.listLineItems(id, { limit: 5 })).data
        .map((x) => x.price?.id ?? "")
        .filter(Boolean),
    currentCheckout: async (id) => {
      const session = await stripe.checkout.sessions.retrieve(id);
      const pi = objectId(session.payment_intent),
        charge = pi ? await paymentCharge(pi) : null;
      return {
        session,
        blocked: charge ? await blockedCharge(charge) : false,
        paidAt: session.created,
      };
    },
    currentSubscription: async (id) => {
      const sub = await stripe.subscriptions.retrieve(id),
        invoice = objectId(sub.latest_invoice);
      let accessBlocked = false;
      if (invoice) {
        const payments = await stripe.invoicePayments.list({
          invoice,
          status: "paid",
          limit: 10,
        });
        if (payments.has_more)
          throw new Error("Invoice reconciliation needs all payments");
        for (const p of payments.data) {
          const pi = objectId(p.payment.payment_intent),
            charge = pi ? await paymentCharge(pi) : objectId(p.payment.charge);
          if (charge && (await blockedCharge(charge))) accessBlocked = true;
        }
      }
      return { ...sub, accessBlocked } as SubLike;
    },
    chargeSource: async (id) => {
      const charge = await stripe.charges.retrieve(id),
        pi = objectId(charge.payment_intent);
      if (!pi) return null;
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: pi,
        limit: 5,
      });
      const session = sessions.data.find(
        (s) => s.mode === "payment" && s.metadata?.["app"] === "nocturne",
      );
      if (session) return { kind: "checkout", id: session.id };
      const payments = await stripe.invoicePayments.list({
        payment: { type: "payment_intent", payment_intent: pi },
        limit: 5,
      });
      for (const p of payments.data) {
        const invoice = await stripe.invoices.retrieve(objectId(p.invoice)!);
        const sub = objectId(
          invoice.parent?.subscription_details?.subscription,
        );
        if (sub) return { kind: "subscription", id: sub };
      }
      return null;
    },
  };
}

/** Current access rows used by the server-side duplicate-charge guard. */
export async function accessSnapshot(userId: string) {
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");
  const [e, s] = await Promise.all([
    supabaseAdmin
      .from("entitlements")
      .select("product_key,status,starts_at,ends_at")
      .eq("user_id", userId),
    supabaseAdmin
      .from("subscriptions")
      .select("plan_key,status,current_period_end,provider")
      .eq("user_id", userId)
      .eq("provider", "stripe"),
  ]);
  if (e.error || s.error) throw new Error("Zugang konnte nicht geprüft werden");
  return { entitlements: e.data ?? [], subscriptions: s.data ?? [] };
}
