import { useEffect, useRef, useState } from "react";
import { VAULT_THRESHOLD } from "@/lib/game/engine";
import { MILESTONES } from "@/lib/game/specials";
import type { Energies } from "@/lib/game/types";
import { cn } from "@/lib/utils";

type K = keyof Energies;
const AXES: { k: K; label: string; col: string; angle: number }[] = [
  { k: "chaos", label: "Chaos", col: "var(--champagne)", angle: -90 },
  { k: "connection", label: "Connection", col: "var(--art-07-a)", angle: 150 },
  { k: "heat", label: "Heat", col: "var(--primary)", angle: 30 },
];
const C = 60;
const R = 46;
const pt = (angle: number, v: number) => {
  const a = (angle * Math.PI) / 180;
  return [C + Math.cos(a) * R * (v / 100), C + Math.sin(a) * R * (v / 100)] as const;
};

/** US//AFTER DARK: one shared triangle built from the real energies; the vault ring is the dashed 70-line. */
export function EnergyField({ energies, milestones }: { energies: Energies; milestones: number }) {
  const prev = useRef(energies);
  const [delta, setDelta] = useState<Partial<Record<K, number>>>({});
  useEffect(() => {
    const d: Partial<Record<K, number>> = {};
    for (const { k } of AXES) if (energies[k] !== prev.current[k]) d[k] = energies[k] - prev.current[k];
    prev.current = energies;
    if (Object.keys(d).length) {
      setDelta(d);
      const t = setTimeout(() => setDelta({}), 1800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [energies]);

  const poly = AXES.map(({ angle, k }) => pt(angle, Math.max(4, energies[k])).join(",")).join(" ");
  const ring = AXES.map(({ angle }) => pt(angle, VAULT_THRESHOLD).join(",")).join(" ");
  const outer = AXES.map(({ angle }) => pt(angle, 100).join(",")).join(" ");
  const weakest = AXES.reduce((a, b) => (energies[b.k] < energies[a.k] ? b : a));
  const ready = AXES.filter(({ k }) => energies[k] >= VAULT_THRESHOLD).length;

  return (
    <section className="mt-5 grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4" aria-label={`Gemeinsame Energien: Chaos ${energies.chaos}, Connection ${energies.connection}, Heat ${energies.heat} von 100. Meilensteine ${milestones} von ${MILESTONES.length}.`} data-testid="energy-field">
      <svg viewBox="0 0 120 120" className="size-[7.5rem]" aria-hidden>
        <polygon points={outer} fill="none" stroke="var(--muted-foreground)" strokeOpacity=".45" strokeWidth="0.6" />
        <polygon points={ring} fill="none" stroke="var(--muted-foreground)" strokeWidth="0.6" strokeDasharray="2 2" opacity=".7" />
        {AXES.map(({ angle, k }) => {
          const [x, y] = pt(angle, 100);
          return <line key={k} x1={C} y1={C} x2={x} y2={y} stroke="var(--muted-foreground)" strokeOpacity=".3" strokeWidth="0.5" />;
        })}
        <polygon points={poly} fill="color-mix(in oklab, var(--champagne) 22%, transparent)" stroke="var(--foreground)" strokeWidth="1" strokeLinejoin="round" style={{ transition: "all .7s cubic-bezier(.2,.8,.2,1)" }} />
        {AXES.map(({ angle, k, col }) => {
          const [x, y] = pt(angle, Math.max(4, energies[k]));
          const hit = delta[k] !== undefined;
          return (
            <g key={k}>
              {hit && <circle cx={x} cy={y} r="6" fill="none" stroke={col} strokeWidth="1" className="motion-safe:animate-ripple" style={{ transformOrigin: `${x}px ${y}px` }} />}
              <circle cx={x} cy={y} r={energies[k] >= VAULT_THRESHOLD ? 3.5 : 2.5} fill={col} style={{ transition: "all .7s cubic-bezier(.2,.8,.2,1)" }} />
            </g>
          );
        })}
      </svg>
      <div className="min-w-0">
        <ul className="space-y-1.5">
          {AXES.map(({ k, label, col }) => (
            <li key={k} className="flex items-baseline gap-2 text-sm">
              <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: col }} aria-hidden />
              <span className={cn("min-w-0 flex-1 truncate", k === weakest.k ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              {delta[k] ? <span className="text-xs tabular-nums text-champagne motion-safe:animate-rise">{delta[k]! > 0 ? `+${delta[k]}` : delta[k]}</span> : null}
              <span className="font-display w-8 text-right text-lg leading-none tabular-nums">{energies[k]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {Array.from({ length: MILESTONES.length }, (_, i) => (
            <span key={i} className={cn("inline-block size-1.5 rotate-45 border", i < milestones ? "border-champagne bg-champagne" : "border-line")} aria-hidden />
          ))}
          <span className="ml-1">
            {milestones >= MILESTONES.length && ready === 3 ? "Vault öffnet sich" : milestones >= MILESTONES.length ? `Vault: alle drei über ${VAULT_THRESHOLD}` : `${milestones}/${MILESTONES.length} Meilensteine · ${weakest.label} braucht euch`}
          </span>
        </p>
      </div>
    </section>
  );
}