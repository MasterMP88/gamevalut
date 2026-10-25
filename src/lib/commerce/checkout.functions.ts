import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { isPaidOfferKey, priceIdFor, type PaidOfferKey } from "./offers";

const tokenSchema = z.string().min(20).max(4096);

/** Builds the Stripe Checkout params. Exported for tests; price is resolved only from the allowlist. */
export function checkoutParams(offerKey: PaidOfferKey, user: { id: string; email: string | null }, customer: string | null, origin: string) {
  const subscription = offerKey !== "night_pass_72h";
  const metadata = { user_id: user.id, offer_key: offerKey, app: "nocturne" };
  return {
    mode: subscription ? ("subscription" as const) : ("payment" as const),
    line_items: [{ price: priceIdFor(offerKey), quantity: 1 }],
    client_reference_id: user.id,
    metadata,
    ...(subscription ? { subscription_data: { metadata } } : {}),
    ...(customer ? { customer } : user.email ? { customer_email: user.email } : {}),
    allow_promotion_codes: false,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#preise`,
    locale: "de" as const,
  };
}

function originOf(): string {
  const req = getRequest();
  return new URL(req.url).origin;
}

const LIVE_SUB = new Set(["active", "trialing", "past_due"]);
export type CheckoutConflict = "night_pass_active" | "subscription_active";
interface EntRow { product_key: string; status: string; ends_at: string | null }
interface SubRow { plan_key: string; status: string; current_period_end: string | null }

/** Server-side duplicate-charge guard: never open a second Checkout for access the user already has. */
export function checkoutConflict(offerKey: PaidOfferKey, snap: { entitlements: EntRow[]; subscriptions: SubRow[] }, now = Date.now()): CheckoutConflict | null {
  if (offerKey === "night_pass_72h") {
    const active = snap.entitlements.some((e) => e.product_key === "night_pass_72h" && e.status === "active" && e.ends_at !== null && Date.parse(e.ends_at) > now);
    return active ? "night_pass_active" : null;
  }
  const sub = snap.subscriptions.some((s) => (s.plan_key === "unlimited_monthly" || s.plan_key === "unlimited_annual") && LIVE_SUB.has(s.status)
    && s.current_period_end !== null && Date.parse(s.current_period_end) > now);
  return sub ? "subscription_active" : null;
}

export interface CheckoutDeps {
  snapshot(userId: string): Promise<{ entitlements: EntRow[]; subscriptions: SubRow[] }>;
  customer(userId: string): Promise<string | null>;
  create(params: ReturnType<typeof checkoutParams>): Promise<{ url: string | null }>;
}
export type CheckoutResult = { status: "checkout"; url: string } | { status: "already_active"; reason: CheckoutConflict };

/** Exported for tests: the guard runs before Stripe is ever called. */
export async function runCheckout(offerKey: PaidOfferKey, user: { id: string; email: string | null }, origin: string, deps: CheckoutDeps, now = Date.now()): Promise<CheckoutResult> {
  const conflict = checkoutConflict(offerKey, await deps.snapshot(user.id), now);
  if (conflict) return { status: "already_active", reason: conflict };
  const session = await deps.create(checkoutParams(offerKey, user, await deps.customer(user.id), origin));
  if (!session.url) throw new Error("Checkout nicht verfügbar");
  return { status: "checkout", url: session.url };
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const p = z.object({ offerKey: z.string(), accessToken: tokenSchema }).strict().parse(d);
    if (!isPaidOfferKey(p.offerKey)) throw new Error("Unbekanntes Angebot");
    return { offerKey: p.offerKey, accessToken: p.accessToken };
  })
  .handler(async ({ data }) => {
    const { verifyUser, stripeCustomerFor, stripeClient, accessSnapshot } = await import("./stripe.server");
    const user = await verifyUser(data.accessToken);
    return runCheckout(data.offerKey, user, originOf(), {
      snapshot: accessSnapshot,
      customer: stripeCustomerFor,
      create: (params) => stripeClient().checkout.sessions.create(params),
    });
  });

export const createBillingPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ accessToken: tokenSchema }).strict().parse(d))
  .handler(async ({ data }) => {
    const { verifyUser, stripeCustomerFor, stripeClient } = await import("./stripe.server");
    const user = await verifyUser(data.accessToken);
    const customer = await stripeCustomerFor(user.id);
    if (!customer) throw new Error("Kein Abo gefunden");
    const portal = await stripeClient().billingPortal.sessions.create({ customer, return_url: `${originOf()}/tonight` });
    return { url: portal.url };
  });
