import { OfferPicker } from "./AccessGate";
import { GANG_HOST_PRODUCT_KEYS } from "@/lib/commerce/offers";

/** GANG host gate — Night Pass or Unlimited. Guests joining by QR/code never see this. */
export function HostAccessSheet() {
  return (
    <section
      data-testid="host-access"
      aria-labelledby="host-gate-h"
      className="mt-6"
    >
      <p className="font-mono text-[0.65rem] tracking-[0.2em] text-signal">
        HOST-ZUGANG
      </p>
      <h3
        id="host-gate-h"
        className="font-display mt-2 text-[clamp(2rem,8vw,3rem)] leading-[0.92]"
      >
        Ein Host zahlt · alle anderen treten kostenlos bei.
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Um eine Gruppen-Nacht zu starten, wählst du den einmaligen Night Pass
        oder Unlimited. Gäste brauchen weder Account noch Zahlung.
      </p>
      <div className="mt-4">
        <OfferPicker offers={GANG_HOST_PRODUCT_KEYS} tone="room" />
      </div>
    </section>
  );
}
