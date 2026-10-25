/* Stripe webhook domain logic — pure over injected adapters so it is testable without Stripe/DB. */
import { expiresAtForGrant, grantForStripePrice } from "./core";
import { SUBSCRIPTION_OFFER_KEYS } from "./offers";

export interface EntitlementRow { user_id: string; product_key: string; status: "active" | "expired" | "revoked"; source: "stripe"; starts_at: string; ends_at: string | null; subscription_id?: string | null }
export interface SubscriptionRow { user_id: string; plan_key: string; provider: "stripe"; provider_customer_id: string | null; provider_subscription_id: string; status: string; current_period_end: string | null; updated_at: string }

export interface CommerceDb {
  claim(eventId: string, type: string): Promise<boolean>;
  finish(eventId: string, status: "processed" | "ignored" | "failed", error?: string): Promise<void>;
  upsertEntitlement(row: EntitlementRow): Promise<void>;
  upsertSubscription(row: SubscriptionRow): Promise<string | null>;
}
export interface StripeLookup { checkoutPriceIds(sessionId: string): Promise<string[]> }

// Minimal shapes of the Stripe objects we read.
interface Meta { [k: string]: string | undefined }
export interface StripeEventLike { id: string; type: string; created: number; data: { object: unknown } }
interface CheckoutLike { id: string; mode?: string; payment_status?: string; client_reference_id?: string | null; metadata?: Meta | null; created?: number }
interface SubLike {
  id: string; status: string; customer: string | { id: string } | null; metadata?: Meta | null; current_period_end?: number;
  items?: { data: { price?: { id: string }; current_period_end?: number }[] };
}

const ACTIVE_SUB = new Set(["active", "trialing", "past_due"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const HANDLED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

export type Outcome = "processed" | "ignored" | "duplicate";

export async function handleStripeEvent(ev: StripeEventLike, db: CommerceDb, stripe: StripeLookup, now = Date.now()): Promise<Outcome> {
  if (!(await db.claim(ev.id, ev.type))) return "duplicate";
  try {
    const r = await route(ev, db, stripe, now);
    await db.finish(ev.id, r);
    return r;
  } catch (e) {
    await db.finish(ev.id, "failed", e instanceof Error ? e.message : "error");
    throw e;
  }
}

async function route(ev: StripeEventLike, db: CommerceDb, stripe: StripeLookup, now: number): Promise<"processed" | "ignored"> {
  switch (ev.type) {
    // Delayed one-time payments (e.g. SEPA) settle later; same strict Night Pass checks apply.
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": return nightPass(ev, ev.data.object as CheckoutLike, db, stripe);
    case "customer.subscription.created":
    case "customer.subscription.updated": return subscription(ev.data.object as SubLike, db, now, false);
    case "customer.subscription.deleted": return subscription(ev.data.object as SubLike, db, now, true);
    default: return "ignored";
  }
}

async function nightPass(ev: StripeEventLike, s: CheckoutLike, db: CommerceDb, stripe: StripeLookup) {
  if (s.mode !== "payment" || s.payment_status !== "paid") return "ignored";
  const userId = s.metadata?.["user_id"] ?? s.client_reference_id ?? "";
  if (!UUID.test(userId) || s.metadata?.["app"] !== "nocturne") return "ignored";
  const prices = await stripe.checkoutPriceIds(s.id);
  if (prices.length !== 1) return "ignored";
  const grant = grantForStripePrice(prices[0]!);
  if (!grant || grant.productKey !== "night_pass_72h") return "ignored";
  const start = ev.created * 1000;
  await db.upsertEntitlement({ user_id: userId, product_key: grant.productKey, status: "active", source: "stripe", starts_at: new Date(start).toISOString(), ends_at: expiresAtForGrant(grant, start) });
  return "processed";
}

async function subscription(sub: SubLike, db: CommerceDb, now: number, deleted: boolean) {
  const userId = sub.metadata?.["user_id"] ?? "";
  const offerKey = sub.metadata?.["offer_key"] ?? "";
  const items = sub.items?.data ?? [];
  if (!UUID.test(userId) || items.length !== 1 || !items[0]!.price) return "ignored";
  const grant = grantForStripePrice(items[0]!.price.id);
  // Product is re-derived from the approved price; metadata must agree, never choose.
  if (!grant || !(SUBSCRIPTION_OFFER_KEYS as readonly string[]).includes(grant.productKey) || grant.productKey !== offerKey) return "ignored";
  const endSec = items[0]!.current_period_end ?? sub.current_period_end ?? null;
  const periodEnd = endSec ? endSec * 1000 : null;
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const subId = await db.upsertSubscription({
    user_id: userId, plan_key: grant.productKey, provider: "stripe", provider_customer_id: customer, provider_subscription_id: sub.id,
    status: deleted ? "canceled" : sub.status, current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null, updated_at: new Date(now).toISOString(),
  });
  const live = !deleted && ACTIVE_SUB.has(sub.status) && periodEnd !== null && periodEnd > now;
  await db.upsertEntitlement({
    user_id: userId, product_key: grant.productKey, source: "stripe", subscription_id: subId,
    status: live ? "active" : deleted ? "revoked" : "expired",
    starts_at: new Date(now).toISOString(), ends_at: expiresAtForGrant(grant, now, periodEnd) ?? new Date(now).toISOString(),
  });
  return "processed";
}
