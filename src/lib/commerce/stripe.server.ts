import Stripe from "stripe";
import type { CommerceDb } from "./webhook.server";

export function stripeClient(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Stripe ist noch nicht eingerichtet.");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

export async function verifyUser(accessToken: unknown): Promise<{ id: string; email: string | null }> {
  if (typeof accessToken !== "string" || accessToken.split(".").length !== 3) throw new Error("Unauthorized");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Unauthorized");
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function stripeCustomerFor(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("subscriptions").select("provider_customer_id").eq("user_id", userId).eq("provider", "stripe")
    .not("provider_customer_id", "is", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data?.provider_customer_id ?? null;
}

export async function adminCommerceDb(): Promise<CommerceDb> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ok = <T extends { error: unknown }>(r: T) => { if (r.error) throw new Error(String((r.error as { message?: string }).message ?? r.error)); return r; };
  return {
    // Locked table (RLS on, no anon/authenticated grants); only service_role touches it. Race-safe via PK.
    claim: async (id, type) => {
      const ins = await supabaseAdmin.from("stripe_webhook_events").insert({ event_id: id, event_type: type, status: "processing" });
      if (!ins.error) return true;
      if ((ins.error as { code?: string }).code !== "23505") ok(ins);
      const retry = ok(await supabaseAdmin.from("stripe_webhook_events").update({ status: "processing", error: null })
        .eq("event_id", id).eq("status", "failed").select("event_id"));
      return (retry.data?.length ?? 0) > 0;
    },
    finish: async (id, status, error) => {
      ok(await supabaseAdmin.from("stripe_webhook_events").update({ status, error: error ? error.slice(0, 500) : null, processed_at: new Date().toISOString() }).eq("event_id", id));
    },
    upsertEntitlement: async (row) => { ok(await supabaseAdmin.from("entitlements").upsert(row, { onConflict: "user_id,product_key" })); },
    upsertSubscription: async (row) => (ok(await supabaseAdmin.from("subscriptions").upsert(row, { onConflict: "provider_subscription_id" }).select("id").single()).data as { id: string } | null)?.id ?? null,
  };
}

/** Current access rows used by the server-side duplicate-charge guard. */
export async function accessSnapshot(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [e, s] = await Promise.all([
    supabaseAdmin.from("entitlements").select("product_key,status,starts_at,ends_at").eq("user_id", userId),
    supabaseAdmin.from("subscriptions").select("plan_key,status,current_period_end,provider").eq("user_id", userId).eq("provider", "stripe"),
  ]);
  if (e.error || s.error) throw new Error("Zugang konnte nicht geprüft werden");
  return { entitlements: e.data ?? [], subscriptions: s.data ?? [] };
}
