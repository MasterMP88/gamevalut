import {
  FREE_PREVIEW_LAST_SCENE,
  OFFER_BY_STRIPE_PRICE_ID,
  type OfferKey,
} from "./catalog.js";

export type ProductKey =
  | "night_pass_72h"
  | "unlimited_monthly"
  | "unlimited_annual";

export interface Entitlement {
  productKey: ProductKey | string;
  status: "active" | "expired" | "revoked" | string;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface AccessDecision {
  allowed: boolean;
  reason: "paid" | "preview" | "preview_limit" | "no_host_access";
  gateBeforeScene: number | null;
}

export const GANG_GUESTS_REQUIRE_ACCOUNT = false;
export const GANG_GUESTS_REQUIRE_PAYMENT = false;

/** An active paid entitlement is usable only inside its optional time window. */
export function isActiveEntitlement(
  entitlement: Entitlement,
  nowMs = Date.now(),
): boolean {
  if (entitlement.status !== "active") return false;
  if (entitlement.startsAt && Date.parse(entitlement.startsAt) > nowMs) return false;
  if (entitlement.endsAt && Date.parse(entitlement.endsAt) <= nowMs) return false;
  return true;
}

export function hasPaidAccess(
  entitlements: readonly Entitlement[],
  nowMs = Date.now(),
): boolean {
  return entitlements.some((entitlement) => isActiveEntitlement(entitlement, nowMs));
}

/**
 * Free users can finish scene 5. The access gate belongs before scene 6,
 * never in the middle of an active scene/round.
 */
export function accessForCoupleScene(
  sceneNumber: number,
  entitlements: readonly Entitlement[],
  nowMs = Date.now(),
): AccessDecision {
  if (hasPaidAccess(entitlements, nowMs)) {
    return { allowed: true, reason: "paid", gateBeforeScene: null };
  }

  if (sceneNumber <= FREE_PREVIEW_LAST_SCENE) {
    return { allowed: true, reason: "preview", gateBeforeScene: FREE_PREVIEW_LAST_SCENE + 1 };
  }

  return {
    allowed: false,
    reason: "preview_limit",
    gateBeforeScene: FREE_PREVIEW_LAST_SCENE + 1,
  };
}

/**
 * GANG MODE guests never need an entitlement. The host entitlement mapping is
 * deliberately supplied by the product integration so a future standalone
 * GANG offer can be launched without silently changing commercial terms here.
 */
export function accessForGangHost(
  entitlements: readonly Entitlement[],
  allowedHostProductKeys: readonly string[],
  nowMs = Date.now(),
): AccessDecision {
  const allowed = entitlements.some(
    (entitlement) =>
      allowedHostProductKeys.includes(entitlement.productKey) &&
      isActiveEntitlement(entitlement, nowMs),
  );

  return allowed
    ? { allowed: true, reason: "paid", gateBeforeScene: null }
    : { allowed: false, reason: "no_host_access", gateBeforeScene: null };
}

export interface EntitlementGrant {
  productKey: ProductKey;
  source: "stripe";
  durationHours: number | null;
}

/**
 * Maps only the three approved live Stripe prices. Unknown prices are rejected
 * instead of accidentally granting access.
 */
export function grantForStripePrice(priceId: string): EntitlementGrant | null {
  const offer = OFFER_BY_STRIPE_PRICE_ID.get(priceId);
  if (!offer) return null;

  const productKey = offer.key as Exclude<OfferKey, "free_preview">;
  return {
    productKey,
    source: "stripe",
    durationHours: offer.durationHours,
  };
}

export function expiresAtForGrant(
  grant: EntitlementGrant,
  startsAtMs: number,
  subscriptionPeriodEndMs?: number | null,
): string | null {
  if (grant.durationHours !== null) {
    return new Date(startsAtMs + grant.durationHours * 60 * 60 * 1000).toISOString();
  }
  if (subscriptionPeriodEndMs != null) {
    return new Date(subscriptionPeriodEndMs).toISOString();
  }
  return null;
}
