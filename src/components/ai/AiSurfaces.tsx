import { useState } from "react";
import { Btn } from "@/components/vault/Btn";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/*
 * Presentational AI surfaces. None of these call an AI, persist anything or invent data:
 * each renders only what its props truthfully supply. Backend wiring lives elsewhere.
 */

/* ───────── Director status (real states only) ───────── */
export type HostStatus = "idle" | "writing" | "live" | "offline";
const HOST_COPY: Record<HostStatus, string> = {
  idle: "Director",
  live: "Director · live",
  writing: "Director schreibt mit …",
  offline: "Aus dem Repertoire",
};
export function DirectorStatus({ status, className }: { status: HostStatus; className?: string }) {
  const local = status === "offline";
  return (
    <span className={cn("eyebrow flex min-w-0 items-center gap-2", local ? "text-foreground/70" : "text-champagne", className)} aria-live="polite" data-status={status}>
      <span aria-hidden className="relative inline-flex size-2.5 items-center justify-center">
        {local ? (
          <span className="size-1.5 rotate-45 border border-foreground/60" />
        ) : (
          <>
            <span className={cn("absolute inset-0 rounded-full bg-champagne/40", status === "writing" ? "animate-ripple" : "animate-slow-pulse")} />
            <span className="size-1.5 rounded-full bg-champagne" />
          </>
        )}
      </span>
      {HOST_COPY[status]}
    </span>
  );
}

/* ───────── Optional night setup (UI state → callback) ───────── */
export type Vibe = "chill" | "funny" | "wild" | "flirty" | "mixed";
export interface NightSetupValue { vibe: Vibe | null; intensity: 1 | 2 | 3 | 4 | 5; insiders: string[]; taboo: string[] }
const VIBES: [Vibe, string][] = [["chill", "Chill"], ["funny", "Funny"], ["wild", "Wild"], ["flirty", "Flirty"], ["mixed", "Mixed"]];

function ChipInput({ label, hint, values, onChange, max = 6 }: { label: string; hint: string; values: string[]; onChange: (v: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().slice(0, 60);
    if (!t || values.includes(t) || values.length >= max) return;
    onChange([...values, t]);
    setDraft("");
  };
  return (
    <div>
      <label className="eyebrow block">{label}
        <span className="mt-2 flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={hint}
            className="block min-h-12 w-full min-w-0 border-b border-line bg-transparent text-base normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:border-champagne" />
          <Btn type="button" variant="outline" size="sm" className="min-h-11 shrink-0" onClick={add} disabled={!draft.trim()}>Dazu</Btn>
        </span>
      </label>
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {values.map((v) => (
            <li key={v}>
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`${v} entfernen`} className="tap min-h-9 font-display text-lg italic text-foreground/90">„{v}“ <span aria-hidden className="ml-1 font-sans text-xs not-italic text-muted-foreground">×</span></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NightSetup({ onSubmit, onSkip, initial }: { onSubmit: (v: NightSetupValue) => void; onSkip: () => void; initial?: Partial<NightSetupValue> }) {
  const [v, setV] = useState<NightSetupValue>({ vibe: null, intensity: 3, insiders: [], taboo: [], ...initial });
  return (
    <section aria-labelledby="setup-h" className="flex flex-col">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[0.7rem] tracking-[0.22em] text-champagne">N// SETUP · OPTIONAL</p>
        <button type="button" onClick={() => { haptic(4); onSkip(); }} className="tap min-h-11 px-1 text-sm text-foreground underline-offset-4 hover:underline">Überspringen</button>
      </div>
      <h2 id="setup-h" className="font-display mt-3 text-[2.6rem] leading-[0.95]">Wie soll die Nacht klingen?</h2>

      <div className="mt-6 grid grid-cols-5 border-y border-line" role="radiogroup" aria-label="Vibe">
        {VIBES.map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={v.vibe === k} onClick={() => { haptic(4); setV({ ...v, vibe: v.vibe === k ? null : k }); }}
            className={cn("tap min-h-14 font-display text-lg transition-colors", v.vibe === k ? "italic text-primary" : "text-muted-foreground")}>{l}</button>
        ))}
      </div>

      <div className="mt-6">
        <p className="eyebrow flex justify-between"><span>Intensität</span><span className="text-foreground">{v.intensity} / 5</span></p>
        <div className="mt-2 grid grid-cols-5 gap-1" role="radiogroup" aria-label="Intensität">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={v.intensity === n} aria-label={`Intensität ${n}`} onClick={() => { haptic(4); setV({ ...v, intensity: n }); }}
              className="tap flex min-h-11 items-end"><span className={cn("block w-full transition-all duration-300", n <= v.intensity ? "bg-primary" : "bg-surface-2")} style={{ height: 4 + n * 3 }} /></button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <ChipInput label="Insider · freiwillig" hint="z. B. Lissabon, der Kühlschrank" values={v.insiders} onChange={(insiders) => setV({ ...v, insiders })} />
        <ChipInput label="Tabu heute" hint="z. B. Ex, Arbeit" values={v.taboo} onChange={(taboo) => setV({ ...v, taboo })} />
      </div>

      <p className="mt-5 text-sm leading-snug text-muted-foreground">Gilt nur für diese Nacht. Genutzt wird nur, was ihr hier selbst eintragt – nichts davon wird dauerhaft gespeichert.</p>
      <Btn size="lg" className="mt-6 w-full" onClick={() => { haptic(); onSubmit(v); }}>Nacht einstellen</Btn>
    </section>
  );
}

/* ───────── Judge verdict (renders only a real result) ───────── */
export interface JudgeResult { winnerId: string; ranking: { id: string; name: string; note?: string }[]; headline: string; commentary?: string }
export type JudgeState = { status: "pending" } | { status: "unavailable" } | { status: "ready"; result: JudgeResult };

export function JudgeReveal({ state, onContinue }: { state: JudgeState | null | undefined; onContinue: () => void }) {
  const [open, setOpen] = useState(false);
  if (!state || state.status === "unavailable") return null; // fallback: the caller's curated/local flow continues
  if (state.status === "pending")
    return <p role="status" className="font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground">DAS URTEIL WIRD GESCHRIEBEN · IHR KÖNNT WEITERSPIELEN</p>;
  const { result } = state;
  const winner = result.ranking.find((r) => r.id === result.winnerId);
  if (!winner) return null;
  return (
    <section aria-labelledby="verdict-h" className="border-y border-line py-8" data-testid="judge">
      <p className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.24em] text-champagne"><span className="font-display text-lg tracking-normal">N//</span><span className="h-px flex-1 bg-line" aria-hidden />URTEIL</p>
      {!open ? (
        <Btn size="lg" className="mt-8 w-full" onClick={() => { haptic([10, 40, 20]); setOpen(true); }}>Urteil öffnen</Btn>
      ) : (
        <div className="motion-safe:animate-rise">
          <h2 id="verdict-h" className="font-display mt-6 text-[clamp(2.6rem,12vw,4.5rem)] leading-[0.9] text-balance">{result.headline}</h2>
          <p className="mt-4 font-display text-3xl italic text-primary">{winner.name}</p>
          {result.commentary && <p className="mt-3 max-w-prose text-foreground/85">{result.commentary}</p>}
          <ol className="mt-6 divide-y divide-line border-t border-line">
            {result.ranking.map((r, i) => (
              <li key={r.id} className="flex items-baseline gap-4 py-3 motion-safe:animate-rise" style={{ animationDelay: `${120 + i * 90}ms` }}>
                <span className="w-6 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className={cn("font-display text-2xl", r.id === result.winnerId && "text-champagne")}>{r.name}</span>
                {r.note && <span className="ml-auto text-right text-sm text-muted-foreground">{r.note}</span>}
              </li>
            ))}
          </ol>
          <Btn variant="outline" className="mt-6 w-full" onClick={onContinue}>Weiter</Btn>
        </div>
      )}
    </section>
  );
}

/* ───────── Clue ladder (hard → easier; real clues only) ───────── */
export function ClueLadder({ clues, revealed, onReveal, className }: { clues: string[]; revealed: number; onReveal: () => void; className?: string }) {
  if (!clues.length) return null;
  const shown = Math.max(0, Math.min(revealed, clues.length - 1));
  const more = shown < clues.length - 1;
  return (
    <section aria-label="Hinweise" className={cn("border-y border-line py-5", className)} data-testid="clues">
      <p className="flex items-center justify-between font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground">
        <span>HINWEIS {shown + 1} / {clues.length}</span><span>SCHWER → LEICHT</span>
      </p>
      <div className="mt-3 flex gap-1" aria-hidden>
        {clues.map((_, i) => <span key={i} className={cn("h-0.5 flex-1 transition-colors duration-500", i <= shown ? "bg-[var(--art-09-a)]" : "bg-line")} />)}
      </div>
      <p key={shown} className="font-display mt-5 text-[1.9rem] leading-[1.08] motion-safe:animate-rise">{clues[shown]}</p>
      {more && <Btn variant="outline" className="mt-5 w-full" onClick={() => { haptic(6); onReveal(); }}>Nächster Hinweis · leichter</Btn>}
    </section>
  );
}