import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Btn, btn } from "@/components/vault/Btn";
import { OFFER_COPY, type PaidOfferKey } from "@/lib/commerce/offers";
import { authForOffer, goToCheckout, purchaseErrorText } from "@/lib/commerce/purchase";

/** Landing price row action: guests → sign-up with offer preserved; signed-in → Stripe Checkout. */
export function PriceAction({ offer, best }: { offer: PaidOfferKey; best: boolean }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const label = `${OFFER_COPY[offer].name} wählen`;
  const variant = best ? "primary" : "outline";
  return (
    <div className="mt-2">
      {user ? (
        <Btn variant={variant} disabled={busy} onClick={async () => { setBusy(true); setErr(null); try { await goToCheckout(offer); } catch (e) { setErr(purchaseErrorText(e)); setBusy(false); } }}>
          {busy ? "Checkout wird geöffnet …" : <>{label} <ArrowRight className="size-4" /></>}
        </Btn>
      ) : (
        <Link {...authForOffer(offer)} className={btn({ variant })}>{label} <ArrowRight className="size-4" /></Link>
      )}
      {err && <p role="alert" className="mt-2 text-sm text-primary">{err}</p>}
    </div>
  );
}
