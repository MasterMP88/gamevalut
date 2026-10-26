/* Client-safe commerce glue over the vendored canonical core (src/lib/commerce/core, verbatim). */
import { OFFER_BY_KEY, type OfferKey } from "./core";

export type PaidOfferKey = Exclude<OfferKey, "free_preview">;
export const PAID_OFFER_KEYS: readonly PaidOfferKey[] = [
  "night_pass_72h",
  "unlimited_monthly",
  "unlimited_annual",
];
/** The existing 72h pass includes hosting. Guests remain free; no new Stripe product. */
export const GANG_HOST_PRODUCT_KEYS: readonly PaidOfferKey[] = PAID_OFFER_KEYS;
export const SUBSCRIPTION_OFFER_KEYS: readonly PaidOfferKey[] = [
  "unlimited_monthly",
  "unlimited_annual",
];

export function isPaidOfferKey(v: unknown): v is PaidOfferKey {
  return (
    typeof v === "string" && (PAID_OFFER_KEYS as readonly string[]).includes(v)
  );
}

export function priceIdFor(key: PaidOfferKey): string {
  const id = OFFER_BY_KEY[key].stripePriceId;
  if (!id) throw new Error("No price");
  return id;
}

export const OFFER_COPY: Record<
  PaidOfferKey,
  { name: string; price: string; per: string; note: string }
> = {
  night_pass_72h: {
    name: "Night Pass",
    price: "6,99 €",
    per: "einmalig",
    note: "72 Stunden alles offen – Games für zwei plus GANG-Hosting. Kein Abo.",
  },
  unlimited_monthly: {
    name: "Unlimited",
    price: "9,99 €",
    per: "pro Monat",
    note: "Alle Games, alle neuen Drops und GANG MODE als Host. Monatlich kündbar.",
  },
  unlimited_annual: {
    name: "Unlimited Year",
    price: "59,99 €",
    per: "pro Jahr",
    note: "Ein Jahr NOCTURNE für rund 5 € pro Monat – inklusive neuer Drops und GANG MODE als Host.",
  },
};
