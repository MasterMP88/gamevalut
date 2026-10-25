import type { Motif } from "@/lib/gang/catalog";

export const hueVars = (h: number) => ({ "--g": `oklch(0.78 0.13 ${h})`, "--g-deep": `oklch(0.3 0.07 ${h})` }) as React.CSSProperties;

const WAVE = [10, 25, 40, 18, 35, 45, 20, 38, 15, 28, 8];

export function MotifArt({ motif, className }: { motif: Motif; className?: string }) {
  const s = { stroke: "var(--g)", fill: "none", strokeWidth: 2 } as const;
  const f = { fill: "var(--g)" } as const;
  const body: Record<Motif, React.ReactNode> = {
    bars: <>{[18, 42, 70, 30, 55].map((h, i) => <rect key={i} x={8 + i * 18} y={90 - h} width="10" height={h} {...f} opacity={i === 2 ? 1 : 0.35} />)}</>,
    point: <>{[[20, 80], [100, 80], [60, 95]].map(([x, y], i) => <line key={i} x1={x} y1={y} x2="60" y2="30" {...s} />)}<circle cx="60" cy="28" r="9" {...f} /></>,
    mask: <><path d="M15 45 Q60 20 105 45 Q95 75 60 70 Q25 75 15 45Z" {...s} /><circle cx="42" cy="48" r="6" {...f} /><circle cx="78" cy="48" r="6" {...f} opacity=".25" /></>,
    seal: <><rect x="22" y="30" width="76" height="50" {...s} /><path d="M22 30 L60 60 L98 30" {...s} /><circle cx="60" cy="62" r="8" {...f} /></>,
    scribble: <path d="M10 70 C30 20 40 90 60 50 S90 20 110 60" {...s} strokeWidth="3" />,
    poker: <><rect x="30" y="20" width="40" height="60" rx="3" {...s} transform="rotate(-10 50 50)" /><rect x="52" y="22" width="40" height="60" rx="3" {...f} opacity=".8" transform="rotate(8 72 52)" /></>,
    line: <><line x1="5" y1="55" x2="115" y2="55" {...s} />{[20, 38, 50, 82, 97].map((x, i) => <circle key={i} cx={x} cy="55" r="5" {...f} />)}</>,
    spot: <><path d="M60 5 L95 95 L25 95Z" fill="var(--g)" opacity=".15" /><circle cx="60" cy="80" r="10" {...f} /></>,
    split: <><rect x="8" y="25" width="48" height="55" {...f} opacity=".8" /><rect x="64" y="25" width="48" height="55" {...s} /></>,
    frame: <><path d="M15 35 V20 H30 M90 20 H105 V35 M105 70 V85 H90 M30 85 H15 V70" {...s} strokeWidth="3" /><circle cx="60" cy="52" r="7" {...f} /></>,
    pen: <path d="M15 80 Q40 30 60 60 T105 30" {...s} strokeWidth="4" strokeLinecap="round" />,
    wave: <>{WAVE.map((h, i) => <rect key={i} x={6 + i * 10} y={55 - h} width="5" height={h * 2} {...f} />)}</>,
    chain: <>{[20, 50, 80].map((x) => <ellipse key={x} cx={x + 10} cy="55" rx="18" ry="11" {...s} strokeWidth="3" />)}</>,
    one: <>{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={14 + (i % 6) * 18} cy={i < 6 ? 38 : 68} r="5" {...f} opacity={i === 8 ? 1 : 0.22} />)}</>,
    button: <><circle cx="60" cy="55" r="32" {...s} /><circle cx="60" cy="55" r="20" {...f} /></>,
    moon: <path d="M75 20 A35 35 0 1 0 75 90 A28 28 0 1 1 75 20Z" {...f} opacity=".85" />,
  };
  return <svg viewBox="0 0 120 100" aria-hidden className={className}>{body[motif]}</svg>;
}
