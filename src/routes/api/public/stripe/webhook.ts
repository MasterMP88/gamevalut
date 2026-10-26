import { createFileRoute } from "@tanstack/react-router";

/** Stripe webhook — the only writer of Stripe subscriptions/entitlements. Signature verified on the raw body. */
export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        const sig = request.headers.get("stripe-signature");
        const body = await request.text();
        if (!secret || !sig) return new Response("Invalid signature", { status: 400 });
        const { default: Stripe } = await import("stripe");
        const { stripeClient, adminCommerceDb, stripeLookup } = await import("@/lib/commerce/stripe.server");
        const { handleStripeEvent } = await import("@/lib/commerce/webhook.server");
        const stripe = stripeClient();
        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, secret, undefined, Stripe.createSubtleCryptoProvider());
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }
        try {
          const outcome = await handleStripeEvent(event, await adminCommerceDb(), stripeLookup(stripe));
          return Response.json({ received: true, outcome });
        } catch (e) {
          console.error("[stripe webhook]", e instanceof Error ? e.message : e);
          return new Response("Processing failed", { status: 500 });
        }
      },
    },
  },
});
