import { describe, expect, it, vi } from "vitest";
import { checkoutParams } from "@/lib/commerce/checkout.functions";
import {
  checkoutEnabled,
  reservedCheckout,
  type CheckoutAttempt,
  type CheckoutSession,
  type ReservationDeps,
} from "@/lib/commerce/checkout-reservation";
const NOW = 1800000000000;
const params = checkoutParams(
  "night_pass_72h",
  { id: "user", email: "old@example.invalid" },
  null,
  "https://example.invalid",
);
function fixture() {
  let attempt: CheckoutAttempt | null = null;
  let sequence = 0;
  const stripe = new Map<string, CheckoutSession>();
  const deps: ReservationDeps = {
    hasAccess: vi.fn(async () => false),
    reserve: async (p) =>
      (attempt ??= {
        id: `attempt-${++sequence}`,
        offerKey: p.metadata.offer_key,
        params: p,
        createdAt: NOW,
        sessionId: null,
      }),
    retrieve: async (id) => [...stripe.values()].find((s) => s.id === id)!,
    create: vi.fn(async (_p, key) => {
      if (!stripe.has(key))
        stripe.set(key, {
          id: `cs_${stripe.size}`,
          status: "open",
          url: "https://checkout.stripe.com/test",
        });
      return stripe.get(key)!;
    }),
    attach: vi.fn(async (id, session) => {
      if (attempt && attempt.id === id) attempt.sessionId = session;
    }),
    release: async (id) => {
      if (attempt?.id === id) attempt = null;
    },
    reconciled: vi.fn(async () => false),
  };
  return {
    deps,
    stripe,
    get attempt() {
      return attempt;
    },
  };
}
describe("durable checkout reservation", () => {
  it("parallel tabs share one Stripe session and one frozen request", async () => {
    const f = fixture();
    const results = await Promise.all(
      Array.from({ length: 12 }, () => reservedCheckout(params, f.deps, NOW)),
    );
    expect(new Set(results.map((r) => r.url)).size).toBe(1);
    expect(f.stripe.size).toBe(1);
    expect(
      new Set(vi.mocked(f.deps.create).mock.calls.map((c) => c[1])).size,
    ).toBe(1);
  });
  it("recovers after Stripe succeeds but saving its response fails", async () => {
    const f = fixture();
    vi.mocked(f.deps.attach).mockRejectedValueOnce(new Error("db offline"));
    await expect(reservedCheckout(params, f.deps, NOW)).rejects.toThrow(
      "db offline",
    );
    await reservedCheckout(
      { ...params, customer_email: "new@example.invalid" },
      f.deps,
      NOW,
    );
    expect(f.stripe.size).toBe(1);
    expect(vi.mocked(f.deps.create).mock.calls[1]?.[0]).toMatchObject({
      customer_email: "old@example.invalid",
    });
  });
  it("does not open a different plan while the first checkout is payable", async () => {
    const f = fixture();
    await reservedCheckout(params, f.deps, NOW);
    const other = checkoutParams(
      "unlimited_annual",
      { id: "user", email: null },
      null,
      "https://example.invalid",
    );
    await expect(reservedCheckout(other, f.deps, NOW)).rejects.toThrow(
      "checkout_in_progress",
    );
    expect(f.stripe.size).toBe(1);
  });
  it("waits for fulfillment after completed checkout instead of charging again", async () => {
    const f = fixture();
    await reservedCheckout(params, f.deps, NOW);
    [...f.stripe.values()][0]!.status = "complete";
    await expect(reservedCheckout(params, f.deps, NOW)).rejects.toThrow(
      "payment_pending",
    );
    expect(f.stripe.size).toBe(1);
  });
  it("replaces an expired session, and rechecks current access before replacement", async () => {
    const f = fixture();
    await reservedCheckout(params, f.deps, NOW);
    [...f.stripe.values()][0]!.status = "expired";
    await reservedCheckout(params, f.deps, NOW);
    expect(f.stripe.size).toBe(2);
    [...f.stripe.values()][1]!.status = "complete";
    vi.mocked(f.deps.reconciled).mockResolvedValue(true);
    vi.mocked(f.deps.hasAccess)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    await expect(reservedCheckout(params, f.deps, NOW)).rejects.toThrow(
      "payment_pending",
    );
    expect(f.stripe.size).toBe(2);
  });
  it("does not retry unknown payment outcomes after Stripe may have pruned the key", async () => {
    const f = fixture();
    vi.mocked(f.deps.attach).mockRejectedValue(new Error("offline"));
    await expect(reservedCheckout(params, f.deps, NOW)).rejects.toThrow();
    await expect(
      reservedCheckout(params, f.deps, NOW + 24 * 3600_000),
    ).rejects.toThrow("checkout_review_required");
    expect(f.stripe.size).toBe(1);
  });
  it("requires both secrets and an explicit completed-release gate", () => {
    expect(
      checkoutEnabled({
        STRIPE_SECRET_KEY: "key",
        STRIPE_WEBHOOK_SECRET: "secret",
      }),
    ).toBe(false);
    expect(
      checkoutEnabled({
        STRIPE_SECRET_KEY: "key",
        NOCTURNE_CHECKOUT_ENABLED: "true",
      }),
    ).toBe(false);
    expect(
      checkoutEnabled({
        STRIPE_SECRET_KEY: "key",
        STRIPE_WEBHOOK_SECRET: "secret",
        NOCTURNE_CHECKOUT_ENABLED: "true",
      }),
    ).toBe(true);
  });
});
