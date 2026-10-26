import { describe, expect, it } from "vitest";
import {
  LEGACY_STRIPE_PRICE_IDS,
  OFFER_BY_KEY,
  OFFER_BY_STRIPE_PRICE_ID,
} from "@/lib/commerce/core/catalog";
import { OFFER_COPY } from "@/lib/commerce/offers";

describe("public 2026 pricing", () => {
  it("uses 59.99 EUR for the public annual plan", () => {
    expect(OFFER_BY_KEY.unlimited_annual.amountCents).toBe(5999);
    expect(OFFER_BY_KEY.unlimited_annual.stripePriceId).toBe("price_1UUPekRGuzgtZTcBS2itbNWR");
    expect(OFFER_COPY.unlimited_annual.price).toBe("59,99 €");
  });

  it("keeps the 49.99 founder price recognized for existing subscriptions", () => {
    const legacy = OFFER_BY_STRIPE_PRICE_ID.get(
      LEGACY_STRIPE_PRICE_IDS.unlimited_annual_founder_4999,
    );
    expect(legacy?.key).toBe("unlimited_annual");
    expect(legacy?.amountCents).toBe(4999);
  });
});
