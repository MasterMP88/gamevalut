/* Signed events trigger reconciliation against current Stripe objects, never delivery order. */
import { expiresAtForGrant, grantForStripePrice } from "./core";
import { SUBSCRIPTION_OFFER_KEYS } from "./offers";

export interface EntitlementRow {
  user_id: string;
  product_key: string;
  status: "active" | "expired" | "revoked";
  source: "stripe";
  starts_at: string;
  ends_at: string | null;
  subscription_id?: string | null;
}
export interface SubscriptionRow {
  user_id: string;
  plan_key: string;
  provider: "stripe";
  provider_customer_id: string | null;
  provider_subscription_id: string;
  status: string;
  current_period_end: string | null;
  updated_at: string;
}
export interface CommerceDb {
  claim(eventId: string, type: string, attempt: string): Promise<boolean>;
  finish(
    eventId: string,
    attempt: string,
    status: "processed" | "ignored" | "failed",
    error?: string,
  ): Promise<void>;
  lock(resource: string, attempt: string): Promise<boolean>;
  release(resource: string, attempt: string): Promise<void>;
  apply(
    resource: string,
    attempt: string,
    entitlement: EntitlementRow,
    subscription?: SubscriptionRow,
  ): Promise<void>;
}
interface Meta {
  [k: string]: string | undefined;
}
export interface StripeEventLike {
  id: string;
  type: string;
  created: number;
  data: { object: unknown };
}
export interface CheckoutLike {
  id: string;
  mode?: string;
  payment_status?: string;
  client_reference_id?: string | null;
  metadata?: Meta | null;
  created?: number;
}
export interface SubLike {
  id: string;
  status: string;
  customer: string | { id: string } | null;
  metadata?: Meta | null;
  current_period_end?: number;
  items?: { data: { price?: { id: string }; current_period_end?: number }[] };
  accessBlocked?: boolean;
}
export interface StripeLookup {
  checkoutPriceIds(sessionId: string): Promise<string[]>;
  /** Mandatory in production. Optional only for pure fixtures using an event as their fake current snapshot. */
  currentCheckout?(
    id: string,
  ): Promise<{ session: CheckoutLike; blocked: boolean; paidAt?: number }>;
  currentSubscription?(id: string): Promise<SubLike>;
  chargeSource?(
    chargeId: string,
  ): Promise<{ kind: "checkout" | "subscription"; id: string } | null>;
}
const ACTIVE_SUB = new Set(["active", "trialing", "past_due"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const HANDLED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
] as const;
export type Outcome = "processed" | "ignored" | "duplicate";

export async function handleStripeEvent(
  ev: StripeEventLike,
  db: CommerceDb,
  stripe: StripeLookup,
  now = Date.now(),
): Promise<Outcome> {
  const attempt = crypto.randomUUID();
  if (!(await db.claim(ev.id, ev.type, attempt))) return "duplicate";
  try {
    const result = await route(ev, db, stripe, now, attempt);
    await db.finish(ev.id, attempt, result);
    return result;
  } catch (e) {
    await db.finish(
      ev.id,
      attempt,
      "failed",
      e instanceof Error ? e.message : "error",
    );
    throw e;
  }
}
async function route(
  ev: StripeEventLike,
  db: CommerceDb,
  stripe: StripeLookup,
  now: number,
  attempt: string,
): Promise<"processed" | "ignored"> {
  if (!(HANDLED_STRIPE_EVENTS as readonly string[]).includes(ev.type))
    return "ignored";
  const obj = ev.data.object as {
    id?: string;
    charge?: string | { id: string };
  };
  let kind: "checkout" | "subscription", id: string;
  if (ev.type.startsWith("checkout.")) {
    kind = "checkout";
    id = obj.id ?? "";
  } else if (ev.type.startsWith("customer.subscription.")) {
    kind = "subscription";
    id = obj.id ?? "";
  } else {
    const charge =
      ev.type === "charge.refunded"
        ? obj.id
        : typeof obj.charge === "string"
          ? obj.charge
          : obj.charge?.id;
    if (!charge || !stripe.chargeSource) return "ignored";
    const source = await stripe.chargeSource(charge);
    if (!source) return "ignored";
    ({ kind, id } = source);
  }
  if (!id) return "ignored";
  const resource = `${kind}:${id}`;
  if (!(await db.lock(resource, attempt)))
    throw new Error("Reconciliation busy; retry this event");
  try {
    if (kind === "checkout") {
      const fresh = await stripe.currentCheckout?.(id);
      if (!fresh && !ev.type.startsWith("checkout."))
        throw new Error("Missing current checkout lookup");
      const s = fresh?.session ?? (ev.data.object as CheckoutLike);
      if (s.mode !== "payment" || s.payment_status !== "paid") return "ignored";
      const userId = s.metadata?.["user_id"] ?? s.client_reference_id ?? "";
      if (!UUID.test(userId) || s.metadata?.["app"] !== "nocturne")
        return "ignored";
      const prices = await stripe.checkoutPriceIds(s.id);
      if (prices.length !== 1) return "ignored";
      const grant = grantForStripePrice(prices[0]!);
      if (!grant || grant.productKey !== "night_pass_72h") return "ignored";
      const start =
        (ev.type.startsWith("checkout.")
          ? ev.created
          : (fresh?.paidAt ?? s.created ?? ev.created)) * 1000;
      await db.apply(resource, attempt, {
        user_id: userId,
        product_key: grant.productKey,
        status: fresh?.blocked ? "revoked" : "active",
        source: "stripe",
        starts_at: new Date(start).toISOString(),
        ends_at: expiresAtForGrant(grant, start),
      });
      return "processed";
    }
    const fresh = await stripe.currentSubscription?.(id);
    if (!fresh && !ev.type.startsWith("customer.subscription."))
      throw new Error("Missing current subscription lookup");
    const sub = fresh ?? (ev.data.object as SubLike),
      userId = sub.metadata?.["user_id"] ?? "",
      offer = sub.metadata?.["offer_key"] ?? "",
      items = sub.items?.data ?? [];
    if (!UUID.test(userId) || items.length !== 1 || !items[0]!.price)
      return "ignored";
    const grant = grantForStripePrice(items[0]!.price.id);
    if (
      !grant ||
      !(SUBSCRIPTION_OFFER_KEYS as readonly string[]).includes(
        grant.productKey,
      ) ||
      grant.productKey !== offer
    )
      return "ignored";
    const endSec =
        items[0]!.current_period_end ?? sub.current_period_end ?? null,
      end = endSec ? endSec * 1000 : null;
    const deleted =
      sub.status === "canceled" ||
      (!fresh && ev.type === "customer.subscription.deleted");
    const active =
      !deleted &&
      !sub.accessBlocked &&
      ACTIVE_SUB.has(sub.status) &&
      end !== null &&
      end > now;
    const customer =
      typeof sub.customer === "string"
        ? sub.customer
        : (sub.customer?.id ?? null);
    await db.apply(
      resource,
      attempt,
      {
        user_id: userId,
        product_key: grant.productKey,
        source: "stripe",
        status: active
          ? "active"
          : deleted || sub.accessBlocked
            ? "revoked"
            : "expired",
        starts_at: new Date(now).toISOString(),
        ends_at:
          expiresAtForGrant(grant, now, end) ?? new Date(now).toISOString(),
      },
      {
        user_id: userId,
        plan_key: grant.productKey,
        provider: "stripe",
        provider_customer_id: customer,
        provider_subscription_id: sub.id,
        status: deleted ? "canceled" : sub.status,
        current_period_end: end ? new Date(end).toISOString() : null,
        updated_at: new Date(now).toISOString(),
      },
    );
    return "processed";
  } finally {
    await db.release(resource, attempt);
  }
}
