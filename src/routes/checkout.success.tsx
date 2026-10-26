import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEntitlements } from "@/lib/commerce/use-entitlements";
import { canHostGang, coupleSceneAccess } from "@/lib/entitlements";
import { Mark } from "@/components/brand/Mark";
import { btn } from "@/components/vault/Btn";

export const Route = createFileRoute("/checkout/success")({
  ssr: false,
  head: () => ({ meta: [{ title: "Zahlung erhalten — NOCTURNE" }, { name: "description", content: "Dein NOCTURNE-Zugang wird freigeschaltet." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Success,
});

/** Access appears only when the webhook has written the entitlement — the redirect itself grants nothing. */
function Success() {
  const { user, ready } = useAuth();
  const [slow, setSlow] = useState(false);
  const { ents } = useEntitlements({ refetchMs: 2500 });
  const unlocked = coupleSceneAccess(6, ents).allowed;
  useEffect(() => { const t = setTimeout(() => setSlow(true), 20000); return () => clearTimeout(t); }, []);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center safe-x safe-top safe-bottom">
      <Mark className="size-10 text-champagne" />
      {ready && !user ? (
        <>
          <h1 className="font-display mt-6 text-5xl leading-[0.95]">Melde dich an.</h1>
          <p className="mt-3 text-muted-foreground">Dein Zugang hängt an deinem Account.</p>
          <Link to="/auth" search={{ redirect: "/checkout/success" }} className={btn({ size: "lg", className: "mt-6" })}>Anmelden</Link>
        </>
      ) : unlocked ? (
        <>
          <p className="eyebrow mt-6 text-champagne">Freigeschaltet</p>
          <h1 className="font-display mt-2 text-5xl leading-[0.95]">Die Nacht gehört euch.</h1>
          <p className="mt-3 text-muted-foreground">{canHostGang(ents) ? "Alle Spiele sind offen – auch GANG MODE als Host." : "Alle Paar-Spiele sind offen. Spielt dort weiter, wo ihr wart."}</p>
          <Link to="/tonight" className={btn({ size: "lg", className: "mt-6" })}>Zu Tonight · weiterspielen <ArrowRight className="size-5" /></Link>
        </>
      ) : (
        <>
          <p className="eyebrow mt-6" role="status" aria-live="polite">Zahlung erhalten · wird synchronisiert</p>
          <h1 className="font-display mt-2 text-5xl leading-[0.95]">Einen Moment noch.</h1>
          <p className="mt-3 text-muted-foreground">Sobald Stripe die Zahlung bestätigt, ist dein Zugang hier sichtbar.{slow && " Das dauert länger als üblich – du kannst die Seite offen lassen oder später in Tonight nachsehen."}</p>
          <span aria-hidden className="mt-6 block h-px w-full origin-left bg-champagne/60 motion-safe:animate-pulse" />
          {slow && <Link to="/tonight" className={btn({ variant: "outline", className: "mt-6" })}>Zu Tonight</Link>}
        </>
      )}
    </main>
  );
}
