import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { stripeLookup } from "@/lib/commerce/stripe.server";
function fixture() {
  let refunded = false,
    disputed = false,
    status = "won";
  const stripe = {
    charges: {
      retrieve: vi.fn(async () => ({
        id: "ch_1",
        payment_intent: "pi_1",
        refunded,
        amount: 999,
        amount_refunded: refunded ? 999 : 200,
        disputed,
      })),
    },
    disputes: {
      list: vi.fn(async () => ({ data: [{ status }], has_more: false })),
    },
    paymentIntents: {
      retrieve: vi.fn(async () => ({ latest_charge: "ch_1" })),
    },
    checkout: {
      sessions: {
        retrieve: vi.fn(async () => ({
          id: "cs_1",
          created: 100,
          payment_intent: "pi_1",
        })),
        list: vi.fn(async () => ({ data: [] })),
        listLineItems: vi.fn(async () => ({ data: [] })),
      },
    },
    subscriptions: {
      retrieve: vi.fn(async () => ({
        id: "sub_1",
        latest_invoice: "in_current",
      })),
    },
    invoicePayments: {
      list: vi.fn(async () => ({
        data: [{ invoice: "in_old", payment: { payment_intent: "pi_1" } }],
        has_more: false,
      })),
    },
    invoices: {
      retrieve: vi.fn(async () => ({
        parent: { subscription_details: { subscription: "sub_1" } },
      })),
    },
  };
  return {
    stripe,
    lookup: stripeLookup(stripe as unknown as Stripe),
    set: (r: boolean, d: boolean, s: string) => {
      refunded = r;
      disputed = d;
      status = s;
    },
  };
}
describe("Stripe latest-object adapter", () => {
  it("preserves access for a partial refund, blocks full refunds and restores won disputes", async () => {
    const f = fixture();
    expect((await f.lookup.currentCheckout!("cs_1")).blocked).toBe(false);
    f.set(true, false, "won");
    expect((await f.lookup.currentCheckout!("cs_1")).blocked).toBe(true);
    f.set(false, true, "under_review");
    expect((await f.lookup.currentCheckout!("cs_1")).blocked).toBe(true);
    f.set(false, true, "won");
    expect((await f.lookup.currentCheckout!("cs_1")).blocked).toBe(false);
  });
  it("resolves a subscription charge and checks the current invoice, not an old refunded period", async () => {
    const f = fixture();
    expect(await f.lookup.chargeSource!("ch_1")).toEqual({
      kind: "subscription",
      id: "sub_1",
    });
    await f.lookup.currentSubscription!("sub_1");
    expect(f.stripe.invoicePayments.list).toHaveBeenLastCalledWith({
      invoice: "in_current",
      status: "paid",
      limit: 10,
    });
  });
});
