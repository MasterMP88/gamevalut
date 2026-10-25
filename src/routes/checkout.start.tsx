import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { isPaidOfferKey, OFFER_COPY, type PaidOfferKey } from "@/lib/commerce/offers";
import { authForOffer, goToCheckout, purchaseErrorText } from "@/lib/commerce/purchase";
import { Mark } from "@/components/brand/Mark";
import { btn } from "@/components/vault/Btn";

export const Route = createFileRoute("/checkout/start")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { offer?: PaidOfferKey } => (isPaidOfferKey(s["offer"]) ? { offer: s["offer"] } : {}),
  head: () => ({ meta: [{ title: "Zum Checkout — NOCTURNE" }, { name: "description", content: "Weiter zur sicheren Zahlung." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Start,
});

function Start() {
  const { offer } = Route.useSearch();
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const fired = useRef(false);
  useEffect(() => {
    if (!ready || !offer || fired.current) return;
    fired.current = true;
    if (!user) { void nav({ ...authForOffer(offer), replace: true }); return; }
    goToCheckout(offer).catch((e) => setErr(purchaseErrorText(e)));
  }, [ready, user, offer, nav]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center safe-x">
      <Mark className="size-10 text-champagne" />
      <h1 className="font-display mt-6 text-5xl leading-[0.95]">{offer ? OFFER_COPY[offer].name : "Kein Angebot gewählt"}</h1>
      {err ? <p role="alert" className="mt-4 text-primary">{err}</p> : offer && <p className="mt-4 text-muted-foreground" role="status">Sichere Zahlung wird geöffnet …</p>}
      {(err || !offer) && <Link to="/" hash="preise" className={btn({ variant: "outline", className: "mt-6" })}>Zu den Preisen</Link>}
    </main>
  );
}
