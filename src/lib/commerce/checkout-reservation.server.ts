import type { SupabaseClient } from "@supabase/supabase-js";
import { checkoutConflict } from "./checkout.functions";
import {
  checkoutEnabled,
  reservedCheckout,
  type CheckoutAttempt,
  type CheckoutParams,
} from "./checkout-reservation";
import { accessSnapshot, stripeClient } from "./stripe.server";

export async function createReservedCheckout(
  params: CheckoutParams,
): Promise<{ url: string }> {
  if (!checkoutEnabled(process.env))
    throw new Error("Stripe ist noch nicht eingerichtet.");
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as SupabaseClient;
  const stripe = stripeClient();
  const uid = params.client_reference_id;
  const checked = <T extends { error: unknown }>(r: T) => {
    if (r.error) throw new Error("checkout_unavailable");
    return r;
  };
  return reservedCheckout(params, {
    hasAccess: async () =>
      !!checkoutConflict(params.metadata.offer_key, await accessSnapshot(uid)),
    reserve: async (frozen) => {
      const { data } = checked(
        await db.rpc("stripe_reserve_checkout", {
          p_user: uid,
          p_offer: frozen.metadata.offer_key,
          p_params: frozen,
        }),
      );
      if (!data) throw new Error("checkout_unavailable");
      return {
        id: data.attempt_id,
        offerKey: data.offer_key,
        params: data.params,
        createdAt: Date.parse(data.created_at),
        sessionId: data.session_id,
      } as CheckoutAttempt;
    },
    retrieve: (id) => stripe.checkout.sessions.retrieve(id),
    create: (frozen, key) =>
      stripe.checkout.sessions.create(frozen, { idempotencyKey: key }),
    attach: async (attempt, session) => {
      const { data } = checked(
        await db
          .from("stripe_checkout_attempts")
          .update({ session_id: session })
          .eq("user_id", uid)
          .eq("attempt_id", attempt)
          .select("attempt_id")
          .maybeSingle(),
      );
      if (!data) throw new Error("checkout_in_progress");
    },
    release: async (attempt) => {
      checked(
        await db
          .from("stripe_checkout_attempts")
          .delete()
          .eq("user_id", uid)
          .eq("attempt_id", attempt),
      );
    },
    reconciled: async (session) => {
      const subscription =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      const resource = subscription
        ? `subscription:${subscription}`
        : `checkout:${session.id}`;
      const { data } = checked(
        await db
          .from("stripe_access_grants")
          .select("resource")
          .eq("user_id", uid)
          .eq("resource", resource)
          .maybeSingle(),
      );
      return !!data;
    },
  });
}
