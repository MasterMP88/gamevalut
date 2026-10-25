import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Btn } from "@/components/vault/Btn";
import { OFFER_COPY, type PaidOfferKey } from "@/lib/commerce/offers";
import { authForOffer, goToCheckout, purchaseErrorText } from "@/lib/commerce/purchase";
import { cn } from "@/lib/utils";

const RECOMMENDED: PaidOfferKey = "unlimited_annual";

/** Offer list + purchase action. Guests go to sign-up with the offer preserved; signed-in users go to Stripe Checkout. */
export function OfferPicker({ offers, onBeforeAuth, tone = "night" }: { offers: readonly PaidOfferKey[]; onBeforeAuth?: (() => void) | undefined; tone?: "night" | "room" }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState<PaidOfferKey | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const buy = async (k: PaidOfferKey) => {
    setErr(null);
    if (!user) { onBeforeAuth?.(); void nav(authForOffer(k)); return; }
    setBusy(k);
    try { await goToCheckout(k); } catch (e) { setErr(purchaseErrorText(e)); setBusy(null); }
  };
  return (
    <div>
      <ul className="divide-y divide-line border-y border-line">
        {offers.map((k) => {
          const o = OFFER_COPY[k];
          const best = k === RECOMMENDED;
          return (
            <li key={k} className={cn("py-4", best && "-mx-3 bg-primary/10 px-3 ring-1 ring-primary/40", best && tone === "room" && "bg-signal/10 ring-signal/40")}>
              {best && <p className={cn("font-mono text-[0.65rem] tracking-[0.2em]", tone === "room" ? "text-signal" : "text-primary")}>BEST VALUE · EMPFOHLEN</p>}
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl leading-tight">{o.name}</h3>
                <p className="shrink-0"><span className="font-display text-2xl">{o.price}</span> <span className="text-xs text-muted-foreground">{o.per}</span></p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{o.note}</p>
              <Btn variant={best ? "primary" : "outline"} className="mt-3 w-full" disabled={busy !== null} onClick={() => void buy(k)} data-offer={k}>
                {busy === k ? "Checkout wird geöffnet …" : <>{o.name} wählen <ArrowRight className="size-4" /></>}
              </Btn>
            </li>
          );
        })}
      </ul>
      {!user && <p className="mt-3 text-xs text-muted-foreground">Zum Bezahlen brauchst du einen Account. Euer Spielstand bleibt dabei erhalten.</p>}
      {err && <p role="alert" className="mt-3 text-sm text-primary">{err}</p>}
      <p className="mt-3 text-xs text-muted-foreground">Sichere Zahlung über Stripe. Der Zugang wird freigeschaltet, sobald die Zahlung bestätigt ist.</p>
    </div>
  );
}

/** Shown instead of scene 6+ when there is no paid couple access. Never mid-scene. */
export function CoupleAccessGate({ onBeforeAuth }: { onBeforeAuth?: (() => void) | undefined }) {
  return (
    <section data-testid="access-gate" aria-labelledby="gate-h" className="flex flex-1 flex-col animate-rise">
      <p className="eyebrow">Free Preview beendet · Szene 5 geschafft</p>
      <h2 id="gate-h" className="font-display mt-3 text-[clamp(2.6rem,11vw,4rem)] leading-[0.92]">Die Nacht geht weiter. <em className="text-primary">Wenn ihr wollt.</em></h2>
      <p className="mt-3 text-muted-foreground">Euer Spielstand ist hier pausiert – mit Zugang spielt ihr direkt ab Szene 6 weiter.</p>
      <div className="mt-6"><OfferPicker offers={["night_pass_72h", "unlimited_monthly", "unlimited_annual"]} onBeforeAuth={onBeforeAuth} /></div>
    </section>
  );
}
