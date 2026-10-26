import { supabase } from "@/integrations/supabase/client";
import {
  createBillingPortal,
  createCheckoutSession,
} from "./checkout.functions";
import type { PaidOfferKey } from "./offers";

export const checkoutStartPath = (offer: PaidOfferKey) =>
  `/checkout/start?offer=${offer}`;
export const authForOffer = (offer: PaidOfferKey) => ({
  to: "/auth" as const,
  search: { mode: "signup" as const, redirect: checkoutStartPath(offer) },
});

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Bitte melde dich an.");
  return t;
}

/** Signed-in only: opens Stripe-hosted Checkout. Access is granted later by the webhook, never by the redirect. */
export async function goToCheckout(offerKey: PaidOfferKey) {
  const r = await createCheckoutSession({
    data: { offerKey, accessToken: await token() },
  });
  if (r.status === "already_active") {
    // Existing subscription: manage it in the Billing Portal instead of paying twice.
    if (r.reason === "subscription_active") return goToBillingPortal();
    throw new Error("already_active");
  }
  window.location.assign(r.url);
}

export async function goToBillingPortal() {
  const { url } = await createBillingPortal({
    data: { accessToken: await token() },
  });
  window.location.assign(url);
}

export const purchaseErrorText = (e: unknown) =>
  e instanceof Error && e.message === "payment_pending"
    ? "Deine Zahlung wird noch bestätigt. Sieh gleich in Tonight nach; bitte bezahle nicht erneut."
    : e instanceof Error && e.message === "checkout_in_progress"
      ? "Für deinen Account ist bereits ein anderes Angebot im Checkout geöffnet. Schließe diesen Vorgang ab oder warte, bis er abläuft."
      : e instanceof Error && e.message === "checkout_review_required"
        ? "Dein letzter Bezahlvorgang muss erst geprüft werden. Es wird keine weitere Zahlung gestartet."
        : e instanceof Error && e.message === "already_active"
          ? "Dein Night Pass ist bereits aktiv – du hast schon vollen Zugang."
          : e instanceof Error && /eingerichtet/.test(e.message)
            ? "Bezahlen ist gerade noch nicht verfügbar. Versuch es später nochmal."
            : "Der Checkout konnte nicht geöffnet werden. Versuch es nochmal.";
