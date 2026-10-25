import test from "node:test";
import assert from "node:assert/strict";
import {
  FREE_PREVIEW_LAST_SCENE,
  GANG_GUESTS_REQUIRE_ACCOUNT,
  GANG_GUESTS_REQUIRE_PAYMENT,
  GANG_HOST_PRODUCT_KEYS,
  OFFER_BY_KEY,
  OFFERS,
  accessForCoupleScene,
  accessForGangHost,
  expiresAtForGrant,
  grantForStripePrice,
} from "../dist/index.js";

test("catalog keeps the approved four offers and exact prices", () => {
  assert.equal(OFFERS.length, 4);
  assert.equal(OFFER_BY_KEY.free_preview.amountCents, 0);
  assert.equal(OFFER_BY_KEY.night_pass_72h.amountCents, 699);
  assert.equal(OFFER_BY_KEY.unlimited_monthly.amountCents, 999);
  assert.equal(OFFER_BY_KEY.unlimited_annual.amountCents, 5999);
  assert.equal(OFFER_BY_KEY.unlimited_annual.recommended, true);
});

test("free preview includes scene 5 and gates before scene 6", () => {
  assert.equal(FREE_PREVIEW_LAST_SCENE, 5);
  assert.deepEqual(accessForCoupleScene(5, []), {
    allowed: true,
    reason: "preview",
    gateBeforeScene: 6,
  });
  assert.deepEqual(accessForCoupleScene(6, []), {
    allowed: false,
    reason: "preview_limit",
    gateBeforeScene: 6,
  });
});

test("active paid access bypasses preview limit but expired access does not", () => {
  const now = Date.parse("2026-10-25T08:00:00Z");
  assert.equal(
    accessForCoupleScene(
      99,
      [{ productKey: "night_pass_72h", status: "active", endsAt: "2026-10-26T08:00:00Z" }],
      now,
    ).allowed,
    true,
  );
  assert.equal(
    accessForCoupleScene(
      99,
      [{ productKey: "night_pass_72h", status: "active", endsAt: "2026-10-24T08:00:00Z" }],
      now,
    ).allowed,
    false,
  );
});

test("live Stripe price IDs map only to approved grants", () => {
  assert.deepEqual(grantForStripePrice("price_1UUDZqRGuzgtZTcBJOUzcXy6"), {
    productKey: "night_pass_72h",
    source: "stripe",
    durationHours: 72,
  });
  assert.equal(grantForStripePrice("price_unknown"), null);
});

test("72h pass expiry is deterministic", () => {
  const start = Date.parse("2026-10-25T08:00:00Z");
  const grant = grantForStripePrice("price_1UUDZqRGuzgtZTcBJOUzcXy6");
  assert.ok(grant);
  assert.equal(
    expiresAtForGrant(grant, start),
    "2026-10-28T08:00:00.000Z",
  );
});

test("GANG guests never need an account or payment", () => {
  assert.equal(GANG_GUESTS_REQUIRE_ACCOUNT, false);
  assert.equal(GANG_GUESTS_REQUIRE_PAYMENT, false);
});

test("Night Pass and subscriptions unlock GANG for the host by default", () => {
  assert.deepEqual(GANG_HOST_PRODUCT_KEYS, [
    "night_pass_72h",
    "unlimited_monthly",
    "unlimited_annual",
  ]);
  for (const productKey of GANG_HOST_PRODUCT_KEYS) {
    assert.equal(
      accessForGangHost([{ productKey, status: "active" }]).allowed,
      true,
    );
  }
});

test("unrelated or malformed entitlements fail closed", () => {
  assert.equal(
    accessForCoupleScene(6, [{ productKey: "free_preview", status: "active" }]).allowed,
    false,
  );
  assert.equal(
    accessForCoupleScene(6, [{ productKey: "night_pass_72h", status: "active", endsAt: "invalid" }]).allowed,
    false,
  );
});

test("legacy founder annual Stripe price still maps to annual access", () => {
  assert.deepEqual(grantForStripePrice("price_1UUDZtRGuzgtZTcBkcwhCg10"), {
    productKey: "unlimited_annual",
    source: "stripe",
    durationHours: null,
  });
});
