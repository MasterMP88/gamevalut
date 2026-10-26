import { useState } from "react";
import { GANG_GUIDES, DEVICE_GUIDES } from "@/lib/gang/guides";
import { getGangPlaybook, type GangGameId } from "@/lib/gang/core/playbooks";

/** The same instructions accompany discovery and the actual game. */
export function GangGuide({
  id,
  compact = false,
  deviceRules = false,
}: {
  id: GangGameId;
  compact?: boolean;
  deviceRules?: boolean;
}) {
  const guide =
    id === "time-drop" ? null : (deviceRules ? DEVICE_GUIDES : GANG_GUIDES)[id];
  const pb = getGangPlaybook(id);
  if (!guide || !pb) return null;
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <ol className="space-y-3">
        {guide.steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="font-mono text-signal" aria-hidden>
              0{i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <dl className="space-y-4">
        <div>
          <dt className="eyebrow">Wertung</dt>
          <dd className="mt-1 text-muted-foreground">
            {guide.scoring ?? pb.scoring}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Finale</dt>
          <dd className="mt-1 text-muted-foreground">
            {guide.finale ?? pb.finale}
          </dd>
        </div>
        {!compact && (
          <div>
            <dt className="eyebrow">Nächster Abend</dt>
            <dd className="mt-1 text-muted-foreground">{guide.replay}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/** An authored, spoiler-free three-beat example, with no timer or autoplay. */
export function GangExample({ id }: { id: GangGameId }) {
  const [step, setStep] = useState(0);
  const guide = id === "time-drop" ? null : GANG_GUIDES[id];
  if (!guide) return null;
  return (
    <section
      aria-label="Beispielrunde"
      className="border border-line bg-surface p-6 sm:p-8"
    >
      <p className="eyebrow">Beispielrunde · {step + 1} / 3</p>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-5 min-h-28 font-display text-3xl leading-snug"
      >
        {guide.example[step]}
      </p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="tap min-h-12 px-2 text-sm disabled:opacity-30"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={() => setStep((step + 1) % 3)}
          className="tap min-h-12 px-4 text-sm text-signal"
        >
          {step === 2 ? "Noch einmal ansehen ↻" : "Nächster Schritt →"}
        </button>
      </div>
    </section>
  );
}
