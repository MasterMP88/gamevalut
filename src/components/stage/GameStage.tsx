import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { GameConfig } from "@/lib/game/games";
import type { GameId } from "@/lib/game/types";
import { PREVIEWS } from "@/lib/game/previews";
import { btn } from "@/components/vault/Btn";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/*
 * GameStage — "9 worlds, 1 NOCTURNE".
 * Each game owns its composition, motion grammar and accent field. Shared here is only
 * plumbing: the in-view sequence, tap-to-advance, accessibility and the CTA link.
 * Every beat mirrors a real frame from previews.ts (which mirrors engine mechanics).
 */

const fill = (t: string) => t.replaceAll("{B}", "B").replaceAll("{A}", "A");

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

type Stage = { ref: React.RefObject<HTMLButtonElement | null>; step: number; next: () => void; active: boolean; reduced: boolean; n: number };

/** Plays the sequence once when the stage enters view, then settles. Tap advances / replays. */
function useStage(n: number, ms = 1500, buzz: (step: number) => number | number[] | null = () => 4): Stage {
  const ref = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [played, setPlayed] = useState(false);
  const reduced = useReduced();
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setActive(!!e?.isIntersecting), { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!active || reduced || played) return;
    if (step >= n - 1) { setPlayed(true); return; }
    const t = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(t);
  }, [active, reduced, played, step, n, ms]);
  const next = () => {
    setPlayed(true);
    setStep((s) => {
      const v = (s + 1) % n;
      const b = buzz(v);
      if (b) haptic(b);
      return v;
    });
  };
  // Reduced motion: the most informative (final) beat is the designed static state.
  return { ref, step: reduced && !played ? n - 1 : step, next, active, reduced, n };
}

function Canvas({ s, g, className, children, style }: { s: Stage; g: GameConfig; className?: string; children: ReactNode; style?: CSSProperties }) {
  const f = PREVIEWS[g.id].frames[s.step]!;
  return (
    <button
      ref={s.ref}
      type="button"
      onClick={s.next}
      data-active={s.active}
      aria-label={`So spielt sich ${g.title}. Schritt ${s.step + 1} von ${s.n}: ${f.tag}. ${fill(f.text)}. Tippen für den nächsten Schritt.`}
      className={cn("tap relative block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", className)}
      style={style}
    >
      {children}
    </button>
  );
}

function Beats({ s, className, tone = "bg-foreground" }: { s: Stage; className?: string; tone?: string }) {
  return (
    <span className={cn("flex gap-1", className)} aria-hidden>
      {Array.from({ length: s.n }, (_, k) => <span key={k} className={cn("h-px w-5 transition-all duration-500", k <= s.step ? tone : "bg-line")} />)}
    </span>
  );
}

function Go({ g, label, className, variant }: { g: GameConfig; label: string; className?: string; variant?: "primary" | "outline" }) {
  return (
    <Link to="/game/$slug" params={{ slug: g.slug }} onClick={() => haptic()} aria-label={`${g.title}: ${label}`} className={btn({ size: "lg", variant, className: cn("w-full justify-between sm:w-auto", className) })}>
      {label} <ArrowRight className="size-5" />
    </Link>
  );
}

function Details({ g, className }: { g: GameConfig; className?: string }) {
  return (
    <Link to="/game/$slug" params={{ slug: g.slug }} className={cn("tap eyebrow inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline", className)}>
      So spielt es sich
    </Link>
  );
}

function Meta({ g, className }: { g: GameConfig; className?: string }) {
  return <p className={cn("font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground", className)}>{g.number} · {g.duration.toUpperCase()} · {g.interaction.toUpperCase()}</p>;
}

type V = { g: GameConfig; bare?: boolean | undefined };

/** Section shell: full stage height, gentle snap, own field. Layout is entirely the variant's. */
function Shell({ g, bare, className, style, children }: V & { className?: string | undefined; style?: CSSProperties | undefined; children: ReactNode }) {
  if (bare) return <div className={cn("stage relative overflow-hidden", className)} style={style}>{children}</div>;
  return (
    <article id={`spiel-${g.slug}`} data-stage={g.number} aria-labelledby={`t-${g.id}`} className={cn("stage relative flex min-h-[84svh] snap-start flex-col overflow-hidden safe-x py-14 sm:py-20", className)} style={style}>
      {children}
    </article>
  );
}

/* ───────────── 01 FIRST SPARK — collision / handoff ───────────── */
function FirstSpark({ g, bare }: V) {
  const s = useStage(4, 1500, (v) => (v === 2 ? [6, 40, 14] : 4));
  const f = PREVIEWS[g.id].frames[s.step]!;
  const near = [0.15, 0.35, 1, 0.55][s.step]!;
  const b = f.who === "B";
  return (
    <Shell g={g} bare={bare} style={{ background: "radial-gradient(70% 45% at 10% 18%, color-mix(in oklab, var(--art-01-a) 45%, transparent), transparent 70%), radial-gradient(60% 40% at 95% 90%, color-mix(in oklab, var(--art-01-b) 18%, transparent), transparent 70%)" }}>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 lg:grid-cols-12 lg:items-center">
        {!bare && (
          <header className="lg:col-span-5">
            <Meta g={g} />
            <h3 id={`t-${g.id}`} className="font-display mt-4 text-[clamp(4.6rem,24vw,10rem)] leading-[0.78] tracking-tight">
              First<br /><em className="ml-[22%] text-[var(--art-01-b)]">Spark</em>
            </h3>
            <p className="mt-6 max-w-xs font-display text-2xl italic leading-tight text-primary">{g.hook}</p>
          </header>
        )}
        <Canvas s={s} g={g} className={cn("min-h-[22rem]", bare ? "h-[50svh]" : "lg:col-span-7 lg:min-h-[30rem]")}>
          {/* two player fields drift toward each other */}
          {(["A", "B"] as const).map((p) => {
            const isA = p === "A";
            const on = isA ? !b : b;
            const d = near * 22;
            return (
              <span key={p} aria-hidden className="absolute grid size-36 place-items-center rounded-full transition-all duration-[1100ms] ease-[var(--ease-out-expo)] sm:size-48"
                style={{
                  left: isA ? `${4 + d}%` : undefined, right: isA ? undefined : `${4 + d}%`,
                  top: isA ? "4%" : undefined, bottom: isA ? undefined : "4%",
                  background: `radial-gradient(circle, color-mix(in oklab, ${isA ? "var(--art-01-a)" : "var(--art-01-b)"} ${on ? 70 : 28}%, transparent), transparent 68%)`,
                }}>
                <span className={cn("font-display text-6xl transition-opacity duration-500", on ? "opacity-100" : "opacity-35")}>{p}</span>
              </span>
            );
          })}
          {/* the spark at the handoff */}
          <span aria-hidden className={cn("absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-champagne transition-all duration-700", s.step === 2 ? "scale-[2.4] opacity-100 shadow-[0_0_40px_10px_color-mix(in_oklab,var(--champagne)_55%,transparent)]" : "scale-50 opacity-40")} />
          <div key={s.step} className="absolute inset-x-[12%] top-1/2 -translate-y-1/2 text-center animate-rise" style={{ animationDuration: "500ms" }}>
            <p className="font-mono text-[0.7rem] tracking-[0.22em] text-champagne">{f.tag}</p>
            <p className="font-display mt-2 text-[1.7rem] leading-[1.05] text-balance">{fill(f.text)}</p>
            {f.action && <span className="mt-3 inline-block font-mono text-xs tracking-[0.18em] text-foreground/80">{f.action}</span>}
          </div>
          <span aria-hidden className="absolute bottom-0 left-0 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground">{b ? "A → B" : "A"}</span>
        </Canvas>
      </div>
      {!bare && (
        <div className="mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center gap-4">
          <Go g={g} label="Funken starten" />
          <Details g={g} />
        </div>
      )}
    </Shell>
  );
}

/* ───────────── 02 AFTER DARK — tempo machine ───────────── */
function AfterDark({ g, bare }: V) {
  const s = useStage(4, 1150, (v) => (v === 3 ? [10, 30, 10, 30, 30] : 6));
  const f = PREVIEWS[g.id].frames[s.step]!;
  const counts = ["3", "2", "1"];
  return (
    <Shell g={g} bare={bare} className="bg-[color-mix(in_oklab,var(--art-02-b)_14%,var(--background))]">
      {/* ambient kinetic strips — one pass, then still */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -skew-y-6 opacity-60">
        {[18, 46, 74].map((t, i) => (
          <span key={t} className="absolute -left-1/4 h-6 w-[150%] transition-transform duration-[1400ms] ease-[var(--ease-out-expo)]"
            style={{ top: `${t}%`, background: i === 1 ? "var(--art-02-a)" : "color-mix(in oklab, var(--art-02-b) 50%, transparent)", opacity: i === 1 ? 0.22 : 0.3, transform: `translateX(${(s.step - 1.5) * (i % 2 ? -8 : 8)}%)` }} />
        ))}
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 gap-6 lg:grid-cols-2 lg:items-center">
        {!bare && (
          <header className="lg:order-2">
            <h3 id={`t-${g.id}`} className="font-sans text-[clamp(3.6rem,19vw,8.5rem)] font-semibold uppercase leading-[0.82] tracking-[-0.04em]">
              After<span className="block text-[var(--art-02-a)]">Dark.</span>
            </h3>
            <p className="mt-4 max-w-xs font-mono text-xs uppercase tracking-[0.18em] text-foreground/80">{g.hook}</p>
          </header>
        )}
        <Canvas s={s} g={g} className="min-h-[22rem] lg:min-h-[28rem]">
          <div className="flex items-center justify-between font-mono text-[0.7rem] tracking-[0.2em]"><span className="text-[var(--art-02-a)]">{f.tag}</span><Beats s={s} tone="bg-[var(--art-02-a)]" /></div>
          <div key={s.step} className="mt-6 animate-rise" style={{ animationDuration: "320ms" }}>
            {s.step === 0 && (
              <p className="flex items-end gap-3 font-sans text-[clamp(6rem,30vw,11rem)] font-semibold leading-none tracking-[-0.06em]" aria-hidden>
                {counts.map((c, i) => <span key={c} className="animate-rise" style={{ animationDelay: `${i * 260}ms`, opacity: 1 - i * 0.28 }}>{c}</span>)}
              </p>
            )}
            {s.step === 1 && (
              <div className="flex items-center gap-5">
                <svg viewBox="0 0 40 40" className="size-24 shrink-0 -rotate-90" aria-hidden>
                  <circle cx="20" cy="20" r="17" fill="none" stroke="var(--line)" strokeWidth="2" />
                  <circle cx="20" cy="20" r="17" fill="none" stroke="var(--art-02-a)" strokeWidth="2.5" strokeDasharray="107" strokeDashoffset="38" strokeLinecap="round" />
                </svg>
                <p className="font-display text-[1.7rem] leading-[1.05]">{fill(f.text)}</p>
              </div>
            )}
            {s.step >= 2 && (
              <>
                <p className="font-display text-[1.7rem] leading-[1.05]">{fill(f.text)}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {["Pizza", "Sushi"].map((o, k) => (
                    <span key={o} className={cn("grid min-h-24 place-items-center text-2xl font-semibold uppercase tracking-tight transition-all duration-500",
                      s.step === 2 ? "bg-surface-2 text-transparent [text-shadow:0_0_14px_var(--foreground)]" : k === 0 ? "bg-[var(--art-02-a)] text-background" : "bg-surface-2 text-muted-foreground")}>
                      {o}
                    </span>
                  ))}
                </div>
                {s.step === 3 && <p className="mt-4 font-sans text-4xl font-semibold uppercase tracking-tight text-[var(--art-02-a)]">Match ✦</p>}
              </>
            )}
          </div>
        </Canvas>
      </div>
      {!bare && <div className="relative mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center gap-4"><Go g={g} label="Tempo machen" /><Details g={g} /></div>}
    </Shell>
  );
}

/* ───────────── 03 NIGHT SHIFT — directional night ───────────── */
const DIRS = [
  { k: "Lustiger", x: 0, y: -1, scene: "Erzähl {B} deinen peinlichsten Ausrutscher – mit Gestik." },
  { k: "Flirtiger", x: 1, y: 0, scene: "Beschreib {B} in drei Worten – nur Komplimente." },
  { k: "Spiel", x: 0, y: 1, scene: "Schere, Stein, Papier. Wer verliert, wählt die Musik." },
  { k: "Heißer", x: -1, y: 0, scene: "Sag {B} leise, was dir heute zuerst aufgefallen ist." },
];
const SHIFT_ORDER = [1, 3, 0, 2];
function NightShift({ g, bare }: V) {
  const s = useStage(4, 1600, () => [4, 20, 4]);
  const d = DIRS[SHIFT_ORDER[s.step]!]!;
  const bend = { transform: `translate(${d.x * 14}%, ${d.y * 12}%)` };
  return (
    <Shell g={g} bare={bare} style={{ background: `radial-gradient(60% 50% at ${50 + d.x * 30}% ${50 + d.y * 30}%, color-mix(in oklab, var(--art-03-a) 30%, transparent), transparent 70%)`, transition: "background 1s" }}>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 lg:grid-cols-12 lg:items-center">
        {!bare && (
          <header className="lg:col-span-4">
            <Meta g={g} />
            <h3 id={`t-${g.id}`} className="font-display mt-3 text-[clamp(3.6rem,17vw,7rem)] leading-[0.85]">
              Night <span className="inline-block italic text-[var(--art-03-a)] transition-transform duration-1000" style={{ transform: `translateX(${d.x * 10}px) rotate(${d.x * -3}deg)` }}>Shift</span>
            </h3>
            <p className="mt-4 max-w-xs text-muted-foreground">{g.hook}</p>
          </header>
        )}
        <Canvas s={s} g={g} className="aspect-square w-full max-w-[34rem] justify-self-center lg:col-span-8">
          <svg viewBox="-100 -100 200 200" className="absolute inset-0 size-full" aria-hidden>
            <circle r="62" fill="none" stroke="var(--line)" strokeDasharray="1 5" />
            <circle r="92" fill="none" stroke="var(--line)" />
            <path d={`M0 0 Q ${d.y * 30} ${d.x * -30} ${d.x * 74} ${d.y * 74}`} fill="none" stroke="var(--art-03-a)" strokeWidth="1.5" className="transition-all duration-1000" />
            <circle cx={d.x * 74} cy={d.y * 74} r="3" fill="var(--art-03-a)" className="transition-all duration-1000" />
          </svg>
          {DIRS.map((o) => {
            const on = o === d;
            return (
              <span key={o.k} className={cn("absolute font-display text-2xl transition-all duration-700 sm:text-3xl", on ? "italic text-[var(--art-03-a)]" : "text-muted-foreground/70")}
                style={{ left: `${50 + o.x * 40}%`, top: `${50 + o.y * 43}%`, transform: `translate(-50%,-50%) scale(${on ? 1.15 : 1})` }}>
                {o.k}
              </span>
            );
          })}
          <div className="absolute inset-[24%] grid place-items-center text-center transition-transform duration-1000 ease-[var(--ease-out-expo)]" style={bend}>
            <div key={s.step} className="animate-rise" style={{ animationDuration: "600ms" }}>
              <p className="font-mono text-[0.65rem] tracking-[0.22em] text-champagne">NÄCHSTE SZENE · {d.k.toUpperCase()}</p>
              <p className="font-display mt-2 text-lg leading-tight sm:text-2xl">{fill(d.scene)}</p>
            </div>
          </div>
        </Canvas>
      </div>
      {!bare && <div className="mx-auto mt-6 flex w-full max-w-6xl flex-wrap items-center gap-4"><Go g={g} label="Richtung wählen" /><Details g={g} /></div>}
    </Shell>
  );
}

/* ───────────── 04 HEATCHECK — duel ───────────── */
function Heatcheck({ g, bare }: V) {
  const s = useStage(4, 1500, (v) => (v === 1 ? [8, 30, 8] : v === 2 ? [20, 40, 20] : 6));
  const f = PREVIEWS[g.id].frames[s.step]!;
  const [a, b] = f.score!;
  const show = s.step === 2;
  return (
    <Shell g={g} bare={bare} className={cn(!bare && "px-0")}>
      {!bare && (
        <header className="safe-x mx-auto w-full max-w-6xl text-center">
          <Meta g={g} />
          <h3 id={`t-${g.id}`} className="mt-3 font-sans text-[clamp(2.8rem,14vw,8rem)] font-semibold uppercase leading-[0.85] tracking-[-0.05em]">Heat<span className="text-[var(--art-04-b)]">check</span></h3>
          <p className="mt-2 font-display text-xl italic text-muted-foreground">{g.hook}</p>
        </header>
      )}
      <Canvas s={s} g={g} className="mt-8 grid min-h-[26rem] w-full grid-cols-[1fr_auto_1fr] lg:min-h-[30rem]">
        {/* A field */}
        <div className={cn("relative flex flex-col justify-between bg-[var(--art-04-a)] p-5 text-background transition-all duration-700", f.who === "A" ? "opacity-100" : "opacity-80")}>
          <span className="font-mono text-xs tracking-[0.2em]">A {s.step === 0 && "· STREAK ●●○"}</span>
          <span className="font-sans text-[clamp(5rem,26vw,10rem)] font-semibold leading-none tracking-[-0.06em] tabular-nums">{a}</span>
          <span className="font-mono text-[0.65rem] tracking-[0.2em]">SPARKS</span>
        </div>
        {/* seam */}
        <div className={cn("relative transition-all duration-700", show ? "w-2 bg-champagne shadow-[0_0_40px_8px_color-mix(in_oklab,var(--art-04-b)_60%,transparent)]" : "w-px bg-foreground/40")} aria-hidden />
        {/* B field */}
        <div className={cn("relative flex flex-col items-end justify-between bg-[var(--art-04-b)] p-5 text-foreground transition-all duration-700", f.who === "B" ? "opacity-100" : "opacity-85")}>
          <span className="font-mono text-xs tracking-[0.2em]">{s.step === 1 && "POWER-UP · "}B</span>
          <span className="font-sans text-[clamp(5rem,26vw,10rem)] font-semibold leading-none tracking-[-0.06em] tabular-nums">{b}</span>
          <span className="font-mono text-[0.65rem] tracking-[0.2em]">SPARKS</span>
        </div>
        <div key={s.step} className="pointer-events-none absolute inset-x-4 bottom-12 animate-rise text-center" style={{ animationDuration: "380ms" }}>
          <span className="inline-block bg-background px-4 py-3 shadow-soft">
            <span className="block font-mono text-[0.65rem] tracking-[0.22em] text-champagne">{f.tag}</span>
            <span className="font-display mt-1 block max-w-[16rem] text-xl leading-tight text-foreground">{fill(f.text)}</span>
            {f.action && <span className="mt-1 block font-mono text-xs text-[var(--art-04-b)]">{f.action}</span>}
          </span>
        </div>
      </Canvas>
      {!bare && <div className="safe-x mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center justify-center gap-4"><Go g={g} label="Duell eröffnen" /><Details g={g} /></div>}
    </Shell>
  );
}

/* ───────────── 05 US//AFTER DARK — shared field ───────────── */
function UsAfterDark({ g, bare }: V) {
  const s = useStage(4, 1600, (v) => (v === 3 ? [10, 40, 10, 40, 60] : 6));
  const f = PREVIEWS[g.id].frames[s.step]!;
  const [c, n, h] = f.energies!;
  const near = Math.round(((c + n + h) / 3 / 70) * 100);
  const r = (v: number) => 18 + v * 0.7;
  return (
    <Shell g={g} bare={bare}>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 lg:grid-cols-12 lg:items-center">
        <Canvas s={s} g={g} className="aspect-square w-full max-w-[32rem] justify-self-center lg:col-span-7">
          <svg viewBox="-100 -100 200 200" className="absolute inset-0 size-full" aria-hidden>
            <defs>
              <filter id="us-goo"><feGaussianBlur stdDeviation="7" /><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9" /></filter>
            </defs>
            <circle r="92" fill="none" stroke="var(--champagne)" strokeOpacity="0.5" strokeDasharray={`${near * 5.78} 999`} transform="rotate(-90)" className="transition-all duration-1000" />
            <circle r="92" fill="none" stroke="var(--line)" strokeDasharray="1 4" />
            <g filter="url(#us-goo)" style={{ mixBlendMode: "screen" }}>
              <circle cx={-22} cy={-14} r={r(c)} fill="var(--champagne)" fillOpacity="0.55" className="transition-all duration-1000" />
              <circle cx={22} cy={-14} r={r(n)} fill="var(--art-07-a)" fillOpacity="0.6" className="transition-all duration-1000" />
              <circle cx={0} cy={22} r={r(h)} fill="var(--primary)" fillOpacity="0.55" className="transition-all duration-1000" />
            </g>
          </svg>
          {[["Chaos", c, "left-[6%] top-[10%]"], ["Connection", n, "right-[6%] top-[10%] text-right"], ["Heat", h, "bottom-[4%] left-1/2 -translate-x-1/2 text-center"]].map(([l, v, pos]) => (
            <span key={l as string} className={cn("absolute font-mono text-[0.7rem] tracking-[0.18em]", pos as string)}>{(l as string).toUpperCase()}<span className="block text-lg text-foreground tabular-nums">{v as number}</span></span>
          ))}
          <div className="absolute inset-[30%] grid place-items-center text-center">
            <p className="font-mono text-[0.65rem] tracking-[0.22em] text-background/90 mix-blend-normal">{s.step === 3 ? "VAULT · OFFEN" : `VAULT · ${near}%`}</p>
          </div>
        </Canvas>
        <div className="lg:col-span-5">
          {!bare && (
            <>
              <Meta g={g} />
              <h3 id={`t-${g.id}`} className="font-display mt-3 text-[clamp(3.2rem,15vw,6rem)] leading-[0.88]">US<span className="text-[var(--art-05-a)]">//</span><br />After Dark</h3>
            </>
          )}
          <div key={s.step} className="mt-5 animate-rise border-l border-[var(--art-05-a)] pl-4" style={{ animationDuration: "500ms" }}>
            <p className="font-mono text-[0.7rem] tracking-[0.2em] text-[var(--art-05-a)]">{f.tag} · BEIDE</p>
            <p className="font-display mt-1 text-2xl leading-tight">{fill(f.text)}</p>
          </div>
          {!bare && <div className="mt-8 flex flex-wrap items-center gap-4"><Go g={g} label="Zusammen aufbauen" /><Details g={g} /></div>}
        </div>
      </div>
    </Shell>
  );
}

/* ───────────── 06 ONE//TWO — radical quiet ───────────── */
function OneTwo({ g, bare }: V) {
  const s = useStage(4, 2200, () => 3);
  const f = PREVIEWS[g.id].frames[s.step]!;
  const one = f.who === "A";
  return (
    <Shell g={g} bare={bare} className="bg-[color-mix(in_oklab,var(--ivory)_4%,var(--background))]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        {!bare && <h3 id={`t-${g.id}`} className="font-mono text-xs tracking-[0.4em] text-foreground/70">ONE//TWO <span className="text-muted-foreground">· {g.number}</span></h3>}
        <Canvas s={s} g={g} className="mt-6 flex flex-1 flex-col justify-center">
          <div className="flex items-baseline justify-between font-display leading-[0.7]" aria-hidden>
            <span className={cn("text-[clamp(9rem,46vw,22rem)] transition-colors duration-700", one ? "text-foreground" : "text-transparent [-webkit-text-stroke:1px_var(--line)]")}>1</span>
            <span className={cn("text-[clamp(9rem,46vw,22rem)] transition-colors duration-700", !one ? "text-foreground" : "text-transparent [-webkit-text-stroke:1px_var(--line)]")}>2</span>
          </div>
          <span className="mt-6 block h-px w-full bg-line" aria-hidden>
            <span className="block h-px w-1/2 bg-foreground transition-transform duration-700" style={{ transform: `translateX(${one ? 0 : 100}%)` }} />
          </span>
          <p key={s.step} className={cn("font-display mt-8 max-w-xl text-[1.9rem] leading-[1.1] animate-rise sm:text-4xl", !one && "ml-auto text-right")} style={{ animationDuration: "700ms" }}>{fill(f.text)}</p>
          <p className="mt-3 font-mono text-[0.65rem] tracking-[0.3em] text-muted-foreground" aria-hidden>{f.tag.includes("ZURÜCK") ? "ZURÜCKGESPIELT" : one ? "EINS SPRICHT" : "ZWEI SPRICHT"}</p>
        </Canvas>
        {!bare && <div className="mt-10 flex flex-wrap items-center gap-4"><Go g={g} label="Erste Frage" variant="outline" /><Details g={g} /></div>}
      </div>
    </Shell>
  );
}

/* ───────────── 07 NIGHT//ECHO — memory trace ───────────── */
function NightEcho({ g, bare }: V) {
  const s = useStage(4, 1700, (v) => (v === 3 ? [4, 60, 4, 60, 4] : 4));
  const pr = PREVIEWS[g.id].frames;
  const back = s.step === 3;
  return (
    <Shell g={g} bare={bare} style={{ background: "radial-gradient(70% 55% at 85% 20%, color-mix(in oklab, var(--art-07-a) 26%, transparent), transparent 70%), radial-gradient(50% 40% at 10% 90%, color-mix(in oklab, var(--art-07-b) 14%, transparent), transparent 70%)" }}>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 lg:grid-cols-12 lg:items-center">
        {!bare && (
          <header className="lg:col-span-5 lg:order-2">
            <h3 id={`t-${g.id}`} className="font-display text-[clamp(3.4rem,16vw,6.5rem)] leading-[0.86]">
              Night<span className="text-[var(--art-07-a)]">//</span>
              <span className="relative block italic">Echo<span aria-hidden className="absolute left-2 top-2 -z-10 text-[var(--art-07-a)] opacity-40 blur-[1px]">Echo</span></span>
            </h3>
            <p className="mt-4 max-w-xs text-muted-foreground">{g.hook}</p>
          </header>
        )}
        <Canvas s={s} g={g} className="min-h-[26rem] lg:col-span-7">
          {/* original — top */}
          <div className={cn("transition-all duration-700", s.step >= 2 ? "opacity-45" : "opacity-100")}>
            <p className="font-mono text-[0.65rem] tracking-[0.22em] text-muted-foreground">SZENE 03 · A</p>
            <p className="font-display mt-1 text-2xl">{pr[0]!.text}</p>
          </div>
          {/* anchor note */}
          <div className={cn("mt-5 inline-block border-l-2 border-[var(--art-07-a)] bg-[color-mix(in_oklab,var(--art-07-a)_12%,transparent)] px-4 py-3 transition-all duration-700", s.step >= 1 ? "opacity-100" : "translate-y-2 opacity-0")}>
            <p className="font-display text-2xl italic">„Erst Pommes, dann Pläne.“</p>
            <p className="mt-1 font-mono text-[0.6rem] tracking-[0.22em] text-[var(--art-07-b)]">ANKER · BLEIBT NUR IN DIESEM TAB</p>
          </div>
          {/* the trace */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-24 w-full" aria-hidden>
            <path d="M8 0 C 8 50, 60 30, 60 100" fill="none" stroke="var(--art-07-a)" strokeWidth="0.8" vectorEffect="non-scaling-stroke"
              strokeDasharray="160" strokeDashoffset={s.step >= 2 ? 0 : 160} style={{ transition: "stroke-dashoffset 1.4s var(--ease-out-expo)" }} />
            {[0.3, 0.6].map((o) => <path key={o} d="M8 0 C 8 50, 60 30, 60 100" fill="none" stroke="var(--art-07-b)" strokeOpacity={o * 0.6} strokeWidth="0.5" vectorEffect="non-scaling-stroke" transform={`translate(${o * 6} 0)`} strokeDasharray="160" strokeDashoffset={s.step >= 2 ? 0 : 160} style={{ transition: "stroke-dashoffset 1.8s var(--ease-out-expo)" }} />)}
          </svg>
          {/* the echo — returns later */}
          <div className={cn("ml-[30%] transition-all duration-700", back ? "opacity-100" : s.step === 2 ? "opacity-30 blur-[2px]" : "opacity-0")}>
            <p className="font-mono text-[0.65rem] tracking-[0.22em] text-[var(--art-07-a)]">ECHO · SZENE 09 · B</p>
            <p className="font-display mt-1 text-2xl leading-tight">„Erst Pommes, dann Pläne.“ – verkünde es mit Pathos.</p>
          </div>
        </Canvas>
      </div>
      {!bare && <div className="mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center gap-4"><Go g={g} label="Echo beginnen" /><Details g={g} /></div>}
    </Shell>
  );
}

/* ───────────── 08 DIRECTOR — live direction ───────────── */
function Director({ g, bare }: V) {
  const s = useStage(4, 1800, (v) => (v === 2 ? [6, 30, 6] : 4));
  const fr = PREVIEWS[g.id].frames;
  const f = fr[s.step]!;
  const cues = ["Komposition", "Szene", "Director Cut", "Callback"];
  return (
    <Shell g={g} bare={bare} className={cn(!bare && "min-h-[92svh]")} style={{ background: "radial-gradient(90% 60% at 100% 0%, color-mix(in oklab, var(--art-08-b) 30%, transparent), transparent 65%), radial-gradient(60% 45% at 0% 100%, color-mix(in oklab, var(--art-08-a) 16%, transparent), transparent 70%)" }}>
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-24 -top-16 size-[30rem] opacity-50 animate-drift sm:size-[44rem]">
        {[90, 70, 50].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="var(--art-08-a)" strokeOpacity={0.25} strokeDasharray="1 6" />)}
        <circle cx="100" cy={100 - 70} r="2.5" fill="var(--champagne)" />
      </svg>
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-14">
        {!bare && (
          <header className="lg:col-span-7">
            <p className="flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.2em] text-champagne"><span className="size-1.5 rounded-full bg-champagne animate-slow-pulse" />FLAGSHIP · {g.number} · AI LIVE, SONST LOKAL</p>
            <h3 id={`t-${g.id}`} className="font-display mt-4 text-[clamp(3.4rem,15vw,6rem)] leading-[0.84]">
              NIGHT//ECHO<span className="block italic text-primary">Director</span>
            </h3>
            <p className="mt-5 max-w-sm text-lg leading-snug text-foreground/85">{PREVIEWS[g.id].mechanic}</p>
          </header>
        )}
        <Canvas s={s} g={g} className="lg:col-span-5">
          {/* time sequence */}
          <ol className="grid grid-cols-4 gap-2" aria-hidden>
            {cues.map((c, k) => (
              <li key={c} className="min-w-0">
                <span className={cn("block h-0.5 transition-all duration-700", k < s.step ? "bg-champagne/60" : k === s.step ? "bg-champagne" : "bg-line")} />
                <span className={cn("mt-2 block truncate font-mono text-[0.6rem] tracking-[0.14em]", k === s.step ? "text-champagne" : "text-muted-foreground")}>{c.toUpperCase()}</span>
              </li>
            ))}
          </ol>
          <div key={s.step} className="mt-8 min-h-[13rem] animate-rise" style={{ animationDuration: "500ms" }}>
            <p className="font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground">{f.who === "director" ? "DIRECTOR → EUCH" : `SZENE · ${f.who}`}</p>
            <p className={cn("font-display mt-2 leading-[1.05]", f.who === "director" ? "text-[2.2rem] italic text-champagne" : "text-[1.9rem]")}>{fill(f.text)}</p>
            {f.options && (
              <p className="mt-4 flex gap-4 font-display text-xl">
                {f.options.map((o, k) => <span key={o} className={k === f.pick ? "border-b border-primary text-primary" : "text-muted-foreground"}>{o}</span>)}
              </p>
            )}
            {f.action && <p className="mt-4 font-mono text-xs tracking-[0.18em] text-foreground/80">{f.action}</p>}
          </div>
        </Canvas>
      </div>
      {!bare && <div className="relative mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center gap-4"><Go g={g} label="Director starten" /><Details g={g} /></div>}
    </Shell>
  );
}

/* ───────────── 09 PASS//THE AUX — frequency fields ───────────── */
function PassTheAux({ g, bare }: V) {
  const s = useStage(4, 1600, (v) => (v === 2 ? [6, 30, 6, 30, 10] : 4));
  const f = PREVIEWS[g.id].frames[s.step]!;
  const open = s.step >= 2;
  const bars = (seed: number, gain: number) => Array.from({ length: 34 }, (_, i) => 6 + ((i * seed) % 17) * gain);
  return (
    <Shell g={g} bare={bare}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-28 items-start justify-between gap-px opacity-60">
        {bars(7, s.step === 0 || open ? 2.4 : 0.7).map((h, i) => <span key={i} className="w-full bg-[var(--art-09-a)] transition-all duration-700" style={{ height: h, opacity: 0.25 + (i % 5) / 10 }} />)}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-between gap-px opacity-60">
        {bars(11, s.step === 1 || open ? 2.4 : 0.7).map((h, i) => <span key={i} className="w-full bg-[var(--art-09-b)] transition-all duration-700" style={{ height: h, opacity: 0.25 + (i % 4) / 9 }} />)}
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 gap-8 pt-10 lg:grid-cols-12 lg:items-center">
        {!bare && (
          <header className="lg:col-span-5">
            <p className="font-mono text-[0.7rem] tracking-[0.2em] text-champagne">NEU · {g.number} · MUSIK</p>
            <h3 id={`t-${g.id}`} className="mt-3 font-mono text-[clamp(2.6rem,13vw,5rem)] font-medium uppercase leading-[0.9] tracking-[-0.04em]">Pass<span className="text-[var(--art-09-b)]">//</span><br />the Aux</h3>
            <p className="mt-4 font-display text-2xl italic text-[var(--art-09-a)]">{g.hook}</p>
          </header>
        )}
        <Canvas s={s} g={g} className="min-h-[20rem] lg:col-span-7">
          <p className="font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground">{f.tag}</p>
          <p className="font-display mt-2 text-[1.6rem] leading-[1.08]">{fill(PREVIEWS[g.id].frames[0]!.text)}</p>
          <div className="relative mt-6 h-36">
            {(["A", "B"] as const).map((p, k) => {
              const sealed = k === 0 && s.step === 1;
              const x = open ? (k === 0 ? "-2%" : "52%") : k === 0 ? "0%" : "10%";
              const show = k === 0 || s.step >= 1;
              return (
                <div key={p} className={cn("absolute top-0 w-[48%] min-w-[9rem] border bg-surface p-4 transition-all duration-[900ms] ease-[var(--ease-out-expo)]", k === 0 ? "border-[var(--art-09-a)]" : "border-[var(--art-09-b)]", !show && "opacity-0")}
                  style={{ left: x, top: open ? 0 : k * 10, zIndex: k }}>
                  <p className="font-mono text-[0.6rem] tracking-[0.22em] text-muted-foreground">TRACK · {p}</p>
                  {sealed ? (
                    <p className="mt-2 font-mono text-sm tracking-[0.3em] text-muted-foreground">▮▮▮▮▮ VERSIEGELT</p>
                  ) : (
                    <>
                      <p className="mt-2 font-display text-2xl leading-none">{k === 0 ? "Midnight City" : "Dreams"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{k === 0 ? "M83" : "Fleetwood Mac"}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-xs tracking-[0.18em] text-[var(--art-09-a)]">{s.step === 3 ? "→ TONIGHT’S TRACKLIST · 2 TRACKS" : f.action}</p>
          <p className="mt-1 text-xs text-muted-foreground">Beispiel-Songs. Im Spiel tippt ihr eure eigenen ein.</p>
        </Canvas>
      </div>
      {!bare && <div className="relative mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center gap-4 pb-10"><Go g={g} label="Aux übernehmen" /><Details g={g} /></div>}
    </Shell>
  );
}

const STAGES: Record<GameId, (p: V) => ReactNode> = {
  "roxy-after-dark": FirstSpark,
  "after-dark-2": AfterDark,
  "roxy-night": NightShift,
  battle: Heatcheck,
  coop: UsAfterDark,
  "one-two": OneTwo,
  "night-echo": NightEcho,
  "ai-director": Director,
  "pass-the-aux": PassTheAux,
};

/** One authored world per game. `bare` renders only the mechanic canvas (for detail pages). */
export function GameStage({ game, bare }: { game: GameConfig; bare?: boolean | undefined }) {
  const C = STAGES[game.id];
  return <C g={game} bare={bare} />;
}