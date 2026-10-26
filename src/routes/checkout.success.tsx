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
  head: () => ({
    meta: [
      { title: "Zahlung prüfen — NOCTURNE" },
      {
        name: "description",
        content:
          "Hier siehst du, ob dein NOCTURNE-Zugang bereits freigeschaltet ist.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Success,
});

/** Access appears only when the webhook has written the entitlement — the redirect itself grants nothing. */
function Success() {
  const { user, ready } = useAuth();
  const [slow, setSlow] = useState(false);
  const [polling, setPolling] = useState(true);
  const { ents, refetch } = useEntitlements({
    refetchMs: user && polling ? 2500 : false,
  });
  const unlocked = coupleSceneAccess(6, ents).allowed;
  useEffect(() => {
    if (unlocked) {
      setPolling(false);
      return;
    }
    if (!user || !polling) return;
    const slowTimer = setTimeout(() => setSlow(true), 20000);
    const stopTimer = setTimeout(() => setPolling(false), 120000);
    return () => {
      clearTimeout(slowTimer);
      clearTimeout(stopTimer);
    };
  }, [unlocked, user?.id, polling]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center safe-x safe-top safe-bottom">
      <Mark className="size-10 text-champagne" />
      {ready && !user ? (
        <>
          <h1 className="font-display mt-6 text-5xl leading-[0.95]">
            Melde dich an.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Dein Zugang hängt an deinem Account.
          </p>
          <Link
            to="/auth"
            search={{ redirect: "/checkout/success" }}
            className={btn({ size: "lg", className: "mt-6" })}
          >
            Anmelden
          </Link>
        </>
      ) : unlocked ? (
        <>
          <p className="eyebrow mt-6 text-champagne">Freigeschaltet</p>
          <h1 className="font-display mt-2 text-5xl leading-[0.95]">
            Die Nacht gehört euch.
          </h1>
          <p className="mt-3 text-muted-foreground">
            {canHostGang(ents)
              ? "Alle Spiele sind offen – auch GANG MODE als Host."
              : "Alle Paar-Spiele sind offen. Spielt dort weiter, wo ihr wart."}
          </p>
          <Link
            to="/tonight"
            className={btn({ size: "lg", className: "mt-6" })}
          >
            Zu Tonight · weiterspielen <ArrowRight className="size-5" />
          </Link>
        </>
      ) : (
        <>
          <p className="eyebrow mt-6" role="status" aria-live="polite">
            {polling
              ? "Bestätigung wird geprüft"
              : "Bestätigung steht noch aus"}
          </p>
          <h1 className="font-display mt-2 text-5xl leading-[0.95]">
            {polling ? "Einen Moment noch." : "Wir warten noch."}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sobald die Zahlung bestätigt und dein Zugang freigeschaltet ist,
            siehst du ihn hier.
            {slow &&
              " Manche Zahlarten brauchen länger. Bitte bezahle nicht erneut; dein Zugang erscheint nach der Bestätigung auch in Tonight."}
          </p>
          {polling ? (
            <span
              aria-hidden
              className="mt-6 block h-px w-full origin-left bg-champagne/60 motion-safe:animate-pulse"
            />
          ) : (
            <button
              className={btn({ className: "mt-6" })}
              onClick={() => {
                setSlow(false);
                setPolling(true);
                void refetch();
              }}
            >
              Erneut prüfen
            </button>
          )}
          {slow && (
            <Link
              to="/tonight"
              className={btn({ variant: "outline", className: "mt-6" })}
            >
              Zu Tonight
            </Link>
          )}
        </>
      )}
    </main>
  );
}
