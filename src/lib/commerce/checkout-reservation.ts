import type { checkoutParams } from "./checkout.functions";

export type CheckoutParams = ReturnType<typeof checkoutParams>;
export interface CheckoutAttempt {
  id: string;
  offerKey: string;
  params: CheckoutParams;
  createdAt: number;
  sessionId: string | null;
}
export interface CheckoutSession {
  id: string;
  url: string | null;
  status: string | null;
  subscription?: string | { id: string } | null;
}
export interface ReservationDeps {
  reserve(params: CheckoutParams): Promise<CheckoutAttempt>;
  retrieve(id: string): Promise<CheckoutSession>;
  create(params: CheckoutParams, key: string): Promise<CheckoutSession>;
  attach(attemptId: string, sessionId: string): Promise<void>;
  release(attemptId: string): Promise<void>;
  reconciled(session: CheckoutSession): Promise<boolean>;
  hasAccess(): Promise<boolean>;
}

/** One durable attempt per account, shared across tabs and workers. Frozen params
 * and one idempotency key also recover a lost Stripe/DB response without charging twice. */
export async function reservedCheckout(
  params: CheckoutParams,
  deps: ReservationDeps,
  now = Date.now(),
): Promise<{ url: string }> {
  for (let retry = 0; retry < 3; retry++) {
    if (await deps.hasAccess()) throw new Error("payment_pending");
    const attempt = await deps.reserve(params);
    let session: CheckoutSession;
    if (attempt.sessionId) session = await deps.retrieve(attempt.sessionId);
    else {
      // Stripe may prune idempotency keys after 24h. An unknown old outcome must
      // be reconciled by operations, never guessed to be an abandoned purchase.
      if (now - attempt.createdAt >= 23 * 3600_000)
        throw new Error("checkout_review_required");
      if (attempt.offerKey !== params.metadata.offer_key)
        throw new Error("checkout_in_progress");
      session = await deps.create(
        attempt.params,
        `nocturne-checkout-${attempt.id}`,
      );
      await deps.attach(attempt.id, session.id);
    }
    if (
      session.status === "expired" ||
      (session.status === "complete" && (await deps.reconciled(session)))
    ) {
      await deps.release(attempt.id);
      continue; // Check current access again before reserving a replacement.
    }
    if (session.status === "complete") throw new Error("payment_pending");
    if (attempt.offerKey !== params.metadata.offer_key)
      throw new Error("checkout_in_progress");
    if (session.status !== "open" || !session.url)
      throw new Error("Checkout nicht verfügbar");
    return { url: session.url };
  }
  throw new Error("checkout_in_progress");
}

export function checkoutEnabled(
  env: Record<string, string | undefined>,
): boolean {
  return (
    env["NOCTURNE_CHECKOUT_ENABLED"] === "true" &&
    !!env["STRIPE_SECRET_KEY"] &&
    !!env["STRIPE_WEBHOOK_SECRET"]
  );
}
