// Generated from packages/commerce-core/src/catalog.ts by scripts/vendor-cores.mjs. Edit the canonical package.
export type OfferKey =
  | "free_preview"
  | "night_pass_72h"
  | "unlimited_monthly"
  | "unlimited_annual";

export interface Offer {
  key: OfferKey;
  label: string;
  amountCents: number;
  currency: "eur";
  billing: "free" | "one_time" | "month" | "year";
  durationHours: number | null;
  recommended: boolean;
  stripePriceId: string | null;
}

/**
 * Canonical NOCTURNE offer catalog.
 *
 * These are the live GameNights Stripe prices. Price IDs are public identifiers,
 * not secrets. Never put a Stripe secret key in this package or in a browser.
 */
export const OFFERS: readonly Offer[] = [
  {
    key: "free_preview",
    label: "Free Preview",
    amountCents: 0,
    currency: "eur",
    billing: "free",
    durationHours: null,
    recommended: false,
    stripePriceId: null,
  },
  {
    key: "night_pass_72h",
    label: "Night Pass",
    amountCents: 699,
    currency: "eur",
    billing: "one_time",
    durationHours: 72,
    recommended: false,
    stripePriceId: "price_1UUDZqRGuzgtZTcBJOUzcXy6",
  },
  {
    key: "unlimited_monthly",
    label: "Unlimited",
    amountCents: 999,
    currency: "eur",
    billing: "month",
    durationHours: null,
    recommended: false,
    stripePriceId: "price_1UUDZsRGuzgtZTcB9osY658W",
  },
  {
    key: "unlimited_annual",
    label: "Unlimited Year",
    amountCents: 4999,
    currency: "eur",
    billing: "year",
    durationHours: null,
    recommended: true,
    stripePriceId: "price_1UUDZtRGuzgtZTcBkcwhCg10",
  },
] as const;

export const OFFER_BY_KEY = Object.fromEntries(
  OFFERS.map((offer) => [offer.key, offer]),
) as Record<OfferKey, Offer>;

export const PAID_OFFERS = OFFERS.filter(
  (offer): offer is Offer & { stripePriceId: string } => offer.stripePriceId !== null,
);

export const OFFER_BY_STRIPE_PRICE_ID = new Map(
  PAID_OFFERS.map((offer) => [offer.stripePriceId, offer] as const),
);

export const FREE_PREVIEW_LAST_SCENE = 5;

export function formatEuro(amountCents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}
