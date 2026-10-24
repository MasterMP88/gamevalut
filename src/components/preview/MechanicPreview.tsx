import { useEffect, useRef, useState } from "react";
import type { GameConfig } from "@/lib/game/games";
import { PREVIEWS, type Frame } from "@/lib/game/previews";
import { GameArt } from "@/components/vault/GameArt";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const STEP_MS = 2400;

function fillNames(t: string) {
  return t.replaceAll("{B}", "B").replaceAll("{A}", "A");
}

function usePrefersReduced() {
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

/** Two-line turn indicator: who acts in this frame. */
function Turn({ who }: { who: Frame["who"] }) {
  const a = who === "A" || who === "both";
  const b = who === "B" || who === "both";
  if (who === "director")
    return (
      <span className="flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.2em] text-champagne">
        <span className="size-1.5 rounded-full bg-champagne animate-slow-pulse" /> DIRECTOR
      </span>
    );
  return (
    <span className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.2em]" aria-label={who === "both" ? "Beide" : `Spieler ${who}`}>
      <span className={cn("flex items-center gap-1.5 transition-colors duration-500", a ? "text-foreground" : "text-muted-foreground/50")}>
        <span className={cn("h-px w-5 transition-all duration-500", a ? "bg-foreground" : "bg-line")} />A
      </span>
      <span className={cn("flex items-center gap-1.5 transition-colors duration-500", b ? "text-primary" : "text-muted-foreground/50")}>
        <span className={cn("h-px w-5 transition-all duration-500", b ? "bg-primary" : "bg-line")} />B
      </span>
    </span>
  );
}

function Readout({ f }: { f: Frame }) {
  if (f.score) {
    const t = Math.max(1, f.score[0] + f.score[1]);
    return (
      <div className="mt-4" aria-label={`Sparks A ${f.score[0]}, B ${f.score[1]}`}>
        <div className="flex justify-between font-mono text-xs"><span>A · {f.score[0]}</span><span className="text-primary">{f.score[1]} · B</span></div>
        <div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-surface-2">
          <span className="h-full bg-foreground transition-all duration-700" style={{ width: `${(f.score[0] / t) * 100}%` }} />
          <span className="h-full flex-1 bg-primary" />
        </div>
      </div>
    );
  }
  if (f.energies) {
    const labels = ["Chaos", "Connection", "Heat"];
    const cols = ["var(--champagne)", "var(--art-07-a)", "var(--primary)"];
    return (
      <div className="mt-4 grid grid-cols-3 gap-3">
        {f.energies.map((v, i) => (
          <div key={i}>
            <div className="h-1 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full transition-all duration-700" style={{ width: `${Math.min(100, (v / 70) * 100)}%`, background: cols[i] }} />
            </div>
            <span className="mt-1 block font-mono text-[0.7rem] text-muted-foreground">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/** A tiny playable trailer: real mechanic, step by step. Auto-advances in view; tap advances one beat. */
export function MechanicPreview({ game, className, tall = false }: { game: GameConfig; className?: string; tall?: boolean }) {
  const p = PREVIEWS[game.id];
  const [i, setI] = useState(0);
  const [inView, setInView] = useState(false);
  const reduced = usePrefersReduced();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reduced) return;
    const t = setTimeout(() => setI((n) => (n + 1) % p.frames.length), STEP_MS);
    return () => clearTimeout(t);
  }, [i, inView, reduced, p.frames.length]);

  const f = p.frames[i]!;
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => { haptic(4); setI((n) => (n + 1) % p.frames.length); }}
      aria-label={`Vorschau ${game.title}, Schritt ${i + 1} von ${p.frames.length}: ${f.tag}. ${fillNames(f.text)}. Tippen für den nächsten Schritt.`}
      className={cn("tap relative block w-full overflow-hidden border border-line bg-surface text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", tall ? "min-h-64" : "min-h-52", className)}
    >
      <GameArt art={game.art} className="absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/75 to-background/95" />
      <div className="relative flex h-full min-h-[inherit] flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <Turn who={f.who} />
          <span className="flex gap-1" aria-hidden>
            {p.frames.map((_, k) => <span key={k} className={cn("h-0.5 w-4 transition-colors duration-500", k === i ? "bg-foreground" : k < i ? "bg-foreground/40" : "bg-line")} />)}
          </span>
        </div>
        <div key={i} className="pt-6 animate-rise" style={{ animationDuration: "450ms" }}>
          <p className="font-mono text-xs tracking-[0.18em] text-champagne">{f.tag}</p>
          <p className="font-display mt-2 text-[1.65rem] leading-[1.08] text-foreground">{fillNames(f.text)}</p>
          {f.options && (
            <div className="mt-4 flex flex-wrap gap-2">
              {f.options.map((o, k) => (
                <span key={o} className={cn("min-h-9 border px-3 py-1.5 text-sm transition-colors duration-500", k === f.pick ? "border-foreground bg-foreground text-background" : "border-line text-muted-foreground")}>{o}</span>
              ))}
            </div>
          )}
          {f.action && <span className="mt-4 inline-flex min-h-9 items-center border border-foreground/70 px-3 text-sm">{f.action}</span>}
          <Readout f={f} />
        </div>
      </div>
    </button>
  );
}