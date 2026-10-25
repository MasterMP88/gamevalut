import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OFFER_BY_STRIPE_PRICE_ID, GANG_GUESTS_REQUIRE_ACCOUNT, GANG_GUESTS_REQUIRE_PAYMENT } from "@/lib/commerce/core";
import { isPaidOfferKey, priceIdFor, PAID_OFFER_KEYS } from "@/lib/commerce/offers";
import { canHostGang, coupleSceneAccess, type Entitlement } from "@/lib/entitlements";
import { handleStripeEvent, HANDLED_STRIPE_EVENTS, type CommerceDb, type EntitlementRow, type StripeEventLike } from "@/lib/commerce/webhook.server";
import { checkoutParams, runCheckout } from "@/lib/commerce/checkout.functions";
import { createSession, DEFAULT_SETTINGS } from "@/lib/game/engine";
import type { SessionState } from "@/lib/game/types";

const NIGHT = "price_1UUDZqRGuzgtZTcBJOUzcXy6";
const MONTH = "price_1UUDZsRGuzgtZTcB9osY658W";
const YEAR = "price_1UUDZtRGuzgtZTcBkcwhCg10";
const UID = "11111111-2222-4333-8444-555555555555";
const NOW = Date.parse("2026-10-25T10:00:00Z");
const H = 3600_000;
const ent = (product_key: string, ends: number | null, status = "active"): Entitlement => ({ product_key, status, ends_at: ends === null ? null : new Date(ends).toISOString() });

describe("offers", () => {
  it("allowlists exactly three paid offers with the live price IDs", () => {
    expect([...PAID_OFFER_KEYS]).toEqual(["night_pass_72h", "unlimited_monthly", "unlimited_annual"]);
    expect(priceIdFor("night_pass_72h")).toBe(NIGHT);
    expect(priceIdFor("unlimited_monthly")).toBe(MONTH);
    expect(priceIdFor("unlimited_annual")).toBe(YEAR);
    expect(OFFER_BY_STRIPE_PRICE_ID.size).toBe(3);
  });
  it("rejects arbitrary offers and raw price ids", () => {
    for (const v of ["free_preview", NIGHT, "gang_pass", "", null, 5]) expect(isPaidOfferKey(v)).toBe(false);
  });
  it("checkout params: payment for Night Pass, subscription with metadata for Unlimited, quantity 1", () => {
    const u = { id: UID, email: "a@b.de" };
    const p = checkoutParams("night_pass_72h", u, null, "https://x.app");
    expect(p.mode).toBe("payment");
    expect(p.line_items).toEqual([{ price: NIGHT, quantity: 1 }]);
    expect(p.client_reference_id).toBe(UID);
    expect(p.metadata).toEqual({ user_id: UID, offer_key: "night_pass_72h", app: "nocturne" });
    expect(p).toMatchObject({ customer_email: "a@b.de" });
    const s = checkoutParams("unlimited_annual", u, "cus_1", "https://x.app");
    expect(s.mode).toBe("subscription");
    expect(s).toMatchObject({ customer: "cus_1", subscription_data: { metadata: { user_id: UID, offer_key: "unlimited_annual" } } });
    expect("customer_email" in s).toBe(false);
    expect(s.success_url).toBe("https://x.app/checkout/success?session_id={CHECKOUT_SESSION_ID}");
  });
});

describe("access matrix", () => {
  it("free preview allows scene 5 and gates scene 6", () => {
    expect(coupleSceneAccess(5, [], NOW).allowed).toBe(true);
    expect(coupleSceneAccess(6, [], NOW).allowed).toBe(false);
  });
  it("active Night Pass unlocks scene 6; expired does not", () => {
    expect(coupleSceneAccess(6, [ent("night_pass_72h", NOW + H)], NOW).allowed).toBe(true);
    expect(coupleSceneAccess(6, [ent("night_pass_72h", NOW - 1)], NOW).allowed).toBe(false);
  });
  it("Every active paid offer unlocks GANG hosting", () => {
    expect(canHostGang([ent("unlimited_monthly", NOW + H)], NOW)).toBe(true);
    expect(canHostGang([ent("unlimited_annual", NOW + H)], NOW)).toBe(true);
    expect(canHostGang([ent("night_pass_72h", NOW + H)], NOW)).toBe(true);
    expect(canHostGang([ent("night_pass_72h", NOW - 1)], NOW)).toBe(false);
    expect(canHostGang([ent("unlimited_monthly", NOW + H, "revoked")], NOW)).toBe(false);
  });
  it("GANG guests need neither account nor payment", () => {
    expect(GANG_GUESTS_REQUIRE_ACCOUNT).toBe(false);
    expect(GANG_GUESTS_REQUIRE_PAYMENT).toBe(false);
  });
});

function fakeDb() {
  const ents: EntitlementRow[] = [];
  const seen = new Set<string>();
  const status: Record<string, string> = {};
  const db: CommerceDb = {
    claim: async (id) => (seen.has(id) ? false : (seen.add(id), true)),
    finish: async (id, _attempt, s) => { status[id] = s; },
    lock: async () => true,
    release: async () => {},
    apply: async (_resource,_attempt,r) => { const i = ents.findIndex((e) => e.user_id === r.user_id && e.product_key === r.product_key); if (i >= 0) ents[i] = r; else ents.push(r); },
  };
  return { db, ents, status };
}
const checkout = (id: string): StripeEventLike => ({ id, type: "checkout.session.completed", created: NOW / 1000, data: { object: { id: "cs_1", mode: "payment", payment_status: "paid", client_reference_id: UID, metadata: { user_id: UID, offer_key: "night_pass_72h", app: "nocturne" } } } });
const sub = (id: string, type: string, status: string, price = MONTH, offer = "unlimited_monthly"): StripeEventLike => ({ id, type, created: NOW / 1000, data: { object: { id: "sub_1", status, customer: "cus_1", metadata: { user_id: UID, offer_key: offer }, items: { data: [{ price: { id: price }, current_period_end: (NOW + 30 * 24 * H) / 1000 }] } } } });

describe("webhook domain", () => {
  it("Night Pass ends exactly 72h after completion and is idempotent", async () => {
    const { db, ents } = fakeDb();
    expect(await handleStripeEvent(checkout("evt_1"), db, { checkoutPriceIds: async () => [NIGHT] }, NOW)).toBe("processed");
    expect(Date.parse(ents[0]!.ends_at!) - Date.parse(ents[0]!.starts_at)).toBe(72 * H);
    expect(await handleStripeEvent(checkout("evt_1"), db, { checkoutPriceIds: async () => [NIGHT] }, NOW)).toBe("duplicate");
  });
  it("unknown price grants nothing and is recorded as ignored", async () => {
    const { db, ents, status } = fakeDb();
    expect(await handleStripeEvent(checkout("evt_2"), db, { checkoutPriceIds: async () => ["price_unknown"] }, NOW)).toBe("ignored");
    expect(await handleStripeEvent(sub("evt_3", "customer.subscription.created", "active", "price_unknown"), db, { checkoutPriceIds: async () => [] }, NOW)).toBe("ignored");
    expect(ents).toHaveLength(0);
    expect(status["evt_2"]).toBe("ignored");
  });
  it("metadata cannot pick a product the price does not match", async () => {
    const { db, ents } = fakeDb();
    expect(await handleStripeEvent(sub("evt_4", "customer.subscription.created", "active", MONTH, "unlimited_annual"), db, { checkoutPriceIds: async () => [] }, NOW)).toBe("ignored");
    expect(ents).toHaveLength(0);
  });
  it("active subscription grants until period end; canceled and deleted revoke", async () => {
    const { db, ents } = fakeDb();
    const lk = { checkoutPriceIds: async () => [] };
    await handleStripeEvent(sub("e1", "customer.subscription.created", "active"), db, lk, NOW);
    expect(canHostGang(ents, NOW)).toBe(true);
    await handleStripeEvent(sub("e2", "customer.subscription.updated", "canceled"), db, lk, NOW);
    expect(canHostGang(ents, NOW)).toBe(false);
    await handleStripeEvent(sub("e3", "customer.subscription.updated", "active"), db, lk, NOW);
    await handleStripeEvent(sub("e4", "customer.subscription.deleted", "canceled"), db, lk, NOW);
    expect(ents[0]!.status).toBe("revoked");
    expect(coupleSceneAccess(6, ents, NOW).allowed).toBe(false);
  });
});

vi.mock("@/lib/commerce/stripe.server", async () => {
  const { default: Stripe } = await import("stripe");
  return {
    stripeClient: () => new Stripe("sk_test_dummy", { httpClient: Stripe.createFetchHttpClient() }),
    adminCommerceDb: async () => { throw new Error("db must not be reached"); },
    stripeLookup: () => { throw new Error("lookup must not be reached"); },
    verifyUser: async (t: unknown) => { if (t !== "a.b.c") throw new Error("Unauthorized"); return { id: UID, email: null }; },
  };
});

describe("webhook route", () => {
  it("rejects a bad signature before touching the database", async () => {
    process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test";
    const { Route } = await import("@/routes/api/public/stripe/webhook");
    const post = (Route.options as unknown as { server: { handlers: { POST: (c: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
    const res = await post({ request: new Request("http://x/api/public/stripe/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "t=1,v1=bad" } }) });
    expect(res.status).toBe(400);
    const none = await post({ request: new Request("http://x", { method: "POST", body: "{}" }) });
    expect(none.status).toBe(400);
  });
  it("unauthenticated token is rejected by the server auth check", async () => {
    const { verifyUser } = await import("@/lib/commerce/stripe.server");
    await expect(verifyUser("not-a-token")).rejects.toThrow("Unauthorized");
  });
});

// ---- Player gate: scene 6 content is not rendered without access ----
let session: SessionState;
let entsMock: Entitlement[] = [];
vi.mock("@/lib/game/store", () => ({ useSessions: () => ({ sessions: { "ai-director": session }, dispatch: vi.fn(), end: vi.fn(), saveStatus: {}, settings: DEFAULT_SETTINGS }) }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: { id: UID }, ready: true, signOut: vi.fn() }) }));
vi.mock("@/lib/commerce/use-entitlements", () => ({ useEntitlements: () => ({ ents: entsMock, loading: false, signedIn: true, refetch: vi.fn() }) }));
vi.mock("@/lib/game/use-director", () => ({ useDirector: () => "local" }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, useNavigate: () => vi.fn(), createFileRoute: () => (o: unknown) => ({ options: o }) }));

describe("couple player gate", () => {
  beforeEach(() => { entsMock = []; });
  async function renderAt(n: number) {
    const { GAMES_BY_ID } = await import("@/lib/game/games");
    const { Player } = await import("@/components/player/Player");
    session = { ...createSession("ai-director", ["Ari", "Nova"], DEFAULT_SETTINGS, 7), sceneNumber: n };
    return render(<Player game={GAMES_BY_ID["ai-director"]} />);
  }
  it("scene 5 renders the scene", async () => {
    const r = await renderAt(5);
    expect(screen.queryByTestId("access-gate")).toBeNull();
    expect(r.container.querySelector(".scene-stage")).not.toBeNull();
  });
  it("scene 6 shows the gate and no scene content", async () => {
    const r = await renderAt(6);
    expect(screen.getByTestId("access-gate")).toBeTruthy();
    expect(r.container.querySelector(".scene-stage")).toBeNull();
    expect(r.container.textContent).not.toContain(session.current!.title);
  });
  it("scene 6 with an active Night Pass renders the scene", async () => {
    entsMock = [ent("night_pass_72h", Date.now() + H)];
    const r = await renderAt(6);
    expect(r.container.querySelector(".scene-stage")).not.toBeNull();
  });
});

describe("GANG host gate", () => {
  it("without access the host sees the 72h pass and subscriptions and cannot open a room", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const { GangMode } = await import("@/components/gang/GangMode");
    const r = render(<GangMode hostAllowed={false} />);
    fireEvent.click(screen.getByRole("button", { name: "THE MAJORITY öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
    expect(screen.getByTestId("host-access").textContent).toContain("Ein Host zahlt · alle anderen treten kostenlos bei.");
    expect(screen.queryByRole("button", { name: "Raum öffnen" })).toBeNull();
    expect(r.container.querySelector('[data-offer="night_pass_72h"]')).not.toBeNull();
    expect(r.container.querySelector('[data-offer="unlimited_annual"]')).not.toBeNull();
  });
});

describe("payment edges", () => {
  it("handles the eight documented webhook events", () => {
    expect([...HANDLED_STRIPE_EVENTS]).toEqual(["checkout.session.completed", "checkout.session.async_payment_succeeded", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "charge.refunded", "charge.dispute.created", "charge.dispute.closed"]);
  });
  it("async_payment_succeeded grants a 72h Night Pass with the same checks", async () => {
    const { db, ents } = fakeDb();
    const ev = { ...checkout("evt_async"), type: "checkout.session.async_payment_succeeded" };
    expect(await handleStripeEvent(ev, db, { checkoutPriceIds: async () => [NIGHT] }, NOW)).toBe("processed");
    expect(Date.parse(ents[0]!.ends_at!) - Date.parse(ents[0]!.starts_at)).toBe(72 * H);
    const unpaid = { ...ev, id: "evt_async2", data: { object: { ...(ev.data.object as object), payment_status: "unpaid" } } };
    expect(await handleStripeEvent(unpaid, fakeDb().db, { checkoutPriceIds: async () => [NIGHT] }, NOW)).toBe("ignored");
  });
  it("async_payment_failed never grants", async () => {
    const { db, ents } = fakeDb();
    expect(await handleStripeEvent({ ...checkout("evt_f"), type: "checkout.session.async_payment_failed" }, db, { checkoutPriceIds: async () => [NIGHT] }, NOW)).toBe("ignored");
    expect(ents).toHaveLength(0);
  });
  const user = { id: UID, email: "a@b.de" };
  const deps = (snap: Parameters<typeof runCheckout>[3] extends { snapshot(u: string): Promise<infer S> } ? S : never) => {
    const create = vi.fn(async () => ({ url: "https://checkout.stripe.com/x" }));
    return { create, d: { snapshot: async () => snap, customer: async () => null, create } };
  };
  it("active Night Pass blocks a second Night Pass checkout before Stripe", async () => {
    const { create, d } = deps({ entitlements: [{ product_key: "night_pass_72h", status: "active", ends_at: new Date(NOW + H).toISOString() }], subscriptions: [] });
    expect(await runCheckout("night_pass_72h", user, "https://x.app", d, NOW)).toEqual({ status: "already_active", reason: "night_pass_active" });
    expect(create).not.toHaveBeenCalled();
  });
  it("expired Night Pass allows a new checkout", async () => {
    const { create, d } = deps({ entitlements: [{ product_key: "night_pass_72h", status: "active", ends_at: new Date(NOW - H).toISOString() }], subscriptions: [] });
    expect((await runCheckout("night_pass_72h", user, "https://x.app", d, NOW)).status).toBe("checkout");
    expect(create).toHaveBeenCalledOnce();
  });
  it("live monthly OR annual subscription blocks any Unlimited checkout", async () => {
    for (const [plan, status] of [["unlimited_monthly", "active"], ["unlimited_annual", "trialing"], ["unlimited_monthly", "past_due"]] as const) {
      const { create, d } = deps({ entitlements: [], subscriptions: [{ plan_key: plan, status, current_period_end: new Date(NOW + H).toISOString() }] });
      for (const offer of ["unlimited_monthly", "unlimited_annual"] as const)
        expect(await runCheckout(offer, user, "https://x.app", d, NOW)).toEqual({ status: "already_active", reason: "subscription_active" });
      expect(create).not.toHaveBeenCalled();
    }
  });
  it("canceled or lapsed subscription allows a new Unlimited checkout", async () => {
    const { create, d } = deps({ entitlements: [], subscriptions: [
      { plan_key: "unlimited_monthly", status: "canceled", current_period_end: new Date(NOW + H).toISOString() },
      { plan_key: "unlimited_annual", status: "active", current_period_end: new Date(NOW - H).toISOString() },
    ] });
    expect((await runCheckout("unlimited_annual", user, "https://x.app", d, NOW)).status).toBe("checkout");
    expect(create).toHaveBeenCalledOnce();
  });
});


describe("equivalent access protection", () => {
 it("blocks a redundant pass for active Unlimited before creating Stripe Checkout", async () => {
   const create = vi.fn();
   const result = await runCheckout("night_pass_72h", {id:UID,email:null}, "https://x.app", {
     snapshot: async () => ({entitlements: [ent("unlimited_annual",NOW+H)],subscriptions: []}),
     customer: async () => null, create,
   }, NOW);
   expect(result).toEqual({status:"already_active",reason:"subscription_active"});
   expect(create).not.toHaveBeenCalled();
 });
 it("does not grant access for an unknown offer or an invalid time window", () => {
   expect(coupleSceneAccess(6,[ent("unknown",NOW+H)],NOW).allowed).toBe(false);
   expect(coupleSceneAccess(6,[{...ent("night_pass_72h",NOW+H),ends_at:"invalid"}],NOW).allowed).toBe(false);
 });
});


describe("current Stripe state reconciliation",()=>{
 it("an old active event cannot revive a currently canceled subscription, even at the same second",async()=>{
  const {db,ents}=fakeDb();
  const fresh=sub("fresh","customer.subscription.updated","canceled").data.object as import("@/lib/commerce/webhook.server").SubLike;
  await handleStripeEvent(sub("late","customer.subscription.created","active"),db,{checkoutPriceIds:async()=>[],currentSubscription:async()=>fresh},NOW);
  expect(ents[0]!.status).toBe("revoked");
 });
 it("refund and dispute events reconcile the original purchase and a won dispute can restore it",async()=>{
  const {db,ents}=fakeDb();let blocked=true;
  const lookup={checkoutPriceIds:async()=>[NIGHT],chargeSource:async()=>({kind:"checkout" as const,id:"cs_1"}),currentCheckout:async()=>({session:checkout("x").data.object as import("@/lib/commerce/webhook.server").CheckoutLike,blocked,paidAt:NOW/1000})};
  await handleStripeEvent({id:"refund",type:"charge.refunded",created:NOW/1000,data:{object:{id:"ch_1"}}},db,lookup,NOW);
  expect(ents[0]!.status).toBe("revoked");
  blocked=false;
  await handleStripeEvent({id:"won",type:"charge.dispute.closed",created:NOW/1000,data:{object:{id:"dp_1",charge:"ch_1"}}},db,lookup,NOW);
  expect(ents[0]!.status).toBe("active");
 });
 it("never applies an event if current-state retrieval fails, and releases its lease",async()=>{
  const {db,ents,status}=fakeDb();const release=vi.fn(async()=>{});db.release=release;
  await expect(handleStripeEvent(sub("broken","customer.subscription.updated","active"),db,{checkoutPriceIds:async()=>[],currentSubscription:async()=>{throw new Error("Stripe unavailable");}},NOW)).rejects.toThrow("Stripe unavailable");
  expect(ents).toHaveLength(0);expect(status["broken"]).toBe("failed");expect(release).toHaveBeenCalledOnce();
 });
 it("a busy source is retried instead of concurrently overwriting another delivery",async()=>{
  const {db,ents,status}=fakeDb();db.lock=async()=>false;
  await expect(handleStripeEvent(checkout("busy"),db,{checkoutPriceIds:async()=>[NIGHT]},NOW)).rejects.toThrow("Reconciliation busy");
  expect(ents).toHaveLength(0);expect(status["busy"]).toBe("failed");
 });
});
