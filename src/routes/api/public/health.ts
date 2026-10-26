import { createFileRoute } from "@tanstack/react-router";
import { checkoutEnabled } from "@/lib/commerce/checkout-reservation";

/** Deployment identification only: never exposes credentials, customer data or logs. */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            app: "nocturne",
            release: "operations-2026-10-26",
            payments: checkoutEnabled(process.env) ? "enabled" : "disabled",
          },
          {
            headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
          },
        ),
    },
  },
});
