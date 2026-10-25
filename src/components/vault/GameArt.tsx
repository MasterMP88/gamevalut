import type { GameConfig } from "@/lib/game/games";
import type { SceneType, Steer, Tempo } from "@/lib/game/types";

type Props = {
  art: GameConfig["art"];
  className?: string;
  /** Night Shift: the horizon tilts toward the chosen direction. */
  steer?: Steer;
  /** Director: the orbit reacts to the host status. */
  status?: "idle" | "writing" | "live" | "offline";
  /** Heatcheck: thermal meeting point follows the score. */
  scoreA?: number | undefined;
  scoreB?: number | undefined;
  /** US//AFTER DARK: [chaos, connection, heat] shape the shared third form. */
  energies?: { chaos: number; connection: number; heat: number } | undefined;
  /** Director: cue mark reflects the current scene format. */
  sceneType?: SceneType | undefined;
  /** After Dark: active tempo shift. */
  tempo?: Tempo | null | undefined;
};

const TEMPO_WORD: Record<Tempo, string> = { speed: "SPEED", silent: "STILLE", swap: "TAUSCH", rule: "REGEL" };

const VB = "0 0 400 300";
const STEER_TILT: Record<Exclude<Steer, null>, number> = { funnier: -6, flirtier: 4, game: -2, hotter: 8 };

/** Nine bespoke key-art systems — one visual grammar per game, all pure SVG, all token colours. */
export function GameArt({ art, className = "", steer = null, status = "idle", scoreA, scoreB, energies, sceneType, tempo = null }: Props) {
  const total = (scoreA ?? 0) + (scoreB ?? 0);
  const meet = total > 0 ? 130 + ((scoreA ?? 0) / total) * 140 : 200;
  const e = energies;
  const avg = e ? (e.chaos + e.connection + e.heat) / 3 : 0;
  const spread = e ? Math.max(e.chaos, e.connection, e.heat) - Math.min(e.chaos, e.connection, e.heat) : 0;
  const blob = (() => {
    // Organic third form: radius grows with the average, wobble grows with imbalance.
    const r = 30 + Math.min(70, avg) * 0.8;
    const w = Math.min(18, spread * 0.3);
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      const rr = r + (i % 2 ? w : -w * 0.6);
      return [201 + Math.cos(a) * rr * 0.8, 150 + Math.sin(a) * rr];
    });
    const mid = (i: number) => { const [x1 = 0, y1 = 0] = pts[i % 8]!; const [x2 = 0, y2 = 0] = pts[(i + 1) % 8]!; return `${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)}`; };
    return `M ${mid(7)} ` + pts.map(([x = 0, y = 0], i) => `Q ${x.toFixed(1)} ${y.toFixed(1)} ${mid(i)}`).join(" ") + " Z";
  })();
  const c = "absolute inset-0 h-full w-full";
  return (
    <div className={`relative overflow-hidden bg-[var(--onyx)] ${className}`} aria-hidden>
      {art === "wine" && (
        /* 01 FIRST SPARK — two ember lines that meet in one luminous collision point */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="fs-glow" cx="62%" cy="46%" r="40%">
              <stop offset="0" stopColor="var(--art-01-b)" stopOpacity=".55" />
              <stop offset=".35" stopColor="var(--art-01-a)" stopOpacity=".45" />
              <stop offset="1" stopColor="var(--onyx)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="300" fill="url(#fs-glow)" />
          <path d="M-10 250 C 90 230, 180 180, 248 138" stroke="var(--art-01-b)" strokeOpacity=".75" fill="none" strokeWidth="1.2" pathLength={1} className="animate-draw" />
          <path d="M410 40 C 330 70, 290 110, 248 138" stroke="var(--art-01-a)" strokeOpacity=".95" fill="none" strokeWidth="1.2" pathLength={1} className="animate-draw" style={{ animationDelay: "200ms" }} />
          {[[-14, -10], [12, -16], [18, 8], [-8, 16], [22, -2]].map(([dx, dy], i) => (
            <line key={i} x1="248" y1="138" x2={248 + dx! * 1.6} y2={138 + dy! * 1.6} stroke="var(--art-01-b)" strokeOpacity=".6" strokeLinecap="round" />
          ))}
          <circle cx="248" cy="138" r="4" fill="var(--art-01-b)" className="animate-ignite" />
          {[[230, 120, 0], [262, 112, 1.2], [240, 160, 2.1], [270, 150, 0.6]].map(([x, y, d]) => (
            <circle key={`${x}`} cx={x} cy={y} r="1.2" fill="var(--art-01-b)" className="animate-ember" style={{ animationDelay: `${d}s` }} />
          ))}
        </svg>
      )}
      {art === "kinetic" && (
        /* 02 AFTER DARK — running typographic strips and a rotating index */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          {[0, 1, 2].map((row) => (
            <g key={row} transform={`translate(0 ${70 + row * 70}) rotate(-8)`}>
              <g className="animate-strip" style={{ animationDuration: `${18 + row * 7}s`, animationDirection: row === 1 ? "reverse" : "normal" }}>
                <text x="0" y="0" fontFamily="Geist Mono, monospace" fontSize={row === 1 ? 42 : 22} letterSpacing="4" fill={row === 1 ? "var(--art-02-a)" : "var(--art-02-b)"} opacity={row === 1 ? 0.9 : 0.55}>
                  {"TIMER · RAD · SYNC · 3·2·1 · STILLE · TAUSCH · ".repeat(4)}
                </text>
              </g>
            </g>
          ))}
          <g transform="translate(330 60)">
            <circle r="34" fill="none" stroke="var(--art-02-a)" strokeOpacity=".6" />
            <g className="animate-orbit" style={{ animationDuration: tempo === "speed" ? "2.5s" : tempo ? "5s" : "8s" }}>
              <line x1="0" y1="0" x2="0" y2="-30" stroke="var(--art-02-a)" strokeWidth="2" strokeLinecap="round" />
            </g>
            {tempo && <text y="52" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="10" letterSpacing="2" fill="var(--art-02-a)">{TEMPO_WORD[tempo]}</text>}
          </g>
        </svg>
      )}
      {art === "editorial" && (
        /* 03 NIGHT SHIFT — a drifting horizon, coordinate ticks and a route that bends with the steer */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <g className="animate-horizon">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={i} x1="0" x2="400" y1={190 + i * i * 2.2} y2={190 + i * i * 2.2} stroke="var(--art-03-b)" strokeOpacity={0.5 - i * 0.045} />
            ))}
          </g>
          <g style={{ transform: `rotate(${steer ? STEER_TILT[steer] : 0}deg)`, transformOrigin: "200px 300px", transition: "transform 1.2s var(--ease-out-expo)" }}>
            <path d="M200 300 C 200 240, 230 210, 290 186" stroke="var(--art-03-a)" strokeWidth="1.5" fill="none" strokeDasharray="4 6" />
            <circle cx="290" cy="186" r="3.5" fill="var(--art-03-a)" className="animate-slow-pulse" style={{ transformOrigin: "290px 186px" }} />
          </g>
          <circle cx="92" cy="74" r="22" fill="var(--art-03-b)" opacity=".85" />
          <text x="24" y="282" fontFamily="Geist Mono, monospace" fontSize="10" fill="var(--art-03-b)" opacity=".6" letterSpacing="2">52.52°N · 02:14 · DETOUR</text>
        </svg>
      )}
      {art === "battle" && (
        /* 04 HEATCHECK — two thermal signals approaching from opposite sides */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <path d="M0 110 L60 108 L80 80 L100 140 L120 96 L150 112 L190 104" stroke="var(--art-04-a)" strokeWidth="2" fill="none" pathLength={1} className="animate-draw" />
          <path d="M400 190 L340 192 L320 222 L300 160 L280 204 L250 186 L210 196" stroke="var(--art-04-b)" strokeWidth="2" fill="none" pathLength={1} className="animate-draw" style={{ animationDelay: "250ms" }} />
          <line x1={meet} y1="40" x2={meet} y2="260" stroke="var(--art-04-b)" strokeOpacity={total > 0 ? 0.6 : 0.25} strokeDasharray="2 5" style={{ transition: "all .8s var(--ease-out-expo)" }} />
          {total > 0 && <circle cx={meet} cy="150" r="10" fill="var(--art-04-b)" opacity=".35" className="animate-slow-pulse" style={{ transformOrigin: `${meet}px 150px` }} />}
          <circle cx="190" cy="104" r="4" fill="var(--art-04-a)" />
          <circle cx="210" cy="196" r="4" fill="var(--art-04-b)" />
          <text x="200" y="285" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="10" fill="var(--art-04-a)" opacity=".55" letterSpacing="3">01 — VS — 02</text>
        </svg>
      )}
      {art === "coop" && (
        /* 05 US//AFTER DARK — two forms that make a third where they overlap */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <defs>
            <clipPath id="co-a"><circle cx="170" cy="150" r="88" /></clipPath>
          </defs>
          <circle cx="170" cy="150" r="88" fill="none" stroke="var(--art-05-a)" strokeOpacity=".8" />
          <circle cx="232" cy="150" r="88" fill="none" stroke="var(--art-05-b)" strokeOpacity=".8" />
          {e ? (
            <path d={blob} fill="var(--art-05-a)" opacity={0.25 + Math.min(0.45, avg / 160)} style={{ transition: "d .9s var(--ease-out-expo), opacity .9s" }} />
          ) : (
            <g clipPath="url(#co-a)">
              <circle cx="232" cy="150" r="88" fill="var(--art-05-a)" opacity=".5" className="animate-slow-pulse" style={{ transformOrigin: "201px 150px" }} />
            </g>
          )}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={i} x1="201" x2="201" y1={86 + i * 21} y2={96 + i * 21} stroke="var(--art-05-b)" strokeOpacity=".5" />
          ))}
        </svg>
      )}
      {art === "minimal" && (
        /* 06 ONE//TWO — two rules alternating emphasis; type is the art */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="300" fill="var(--art-06-b)" />
          <line x1="150" y1="30" x2="150" y2="270" stroke="var(--art-06-a)" strokeWidth="1" className="animate-beat" />
          <line x1="250" y1="30" x2="250" y2="270" stroke="var(--art-06-a)" strokeWidth="3" className="animate-beat" style={{ animationDelay: "1.2s" }} />
          <text x="132" y="190" textAnchor="end" fontFamily="Instrument Serif, serif" fontSize="120" fill="var(--art-06-a)">1</text>
          <text x="268" y="190" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="120" fill="var(--art-06-a)" opacity=".75">2</text>
        </svg>
      )}
      {art === "echo" && (
        /* 07 NIGHT//ECHO — archival rings, delayed trails and a thin annotation */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          {[28, 52, 80, 112, 150].map((r, i) => (
            <circle key={r} cx="150" cy="150" r={r} fill="none" stroke={i % 2 ? "var(--art-07-b)" : "var(--art-07-a)"} strokeOpacity={0.65 - i * 0.1} strokeDasharray={i === 3 ? "1 5" : undefined} />
          ))}
          <circle cx="150" cy="150" r="30" fill="none" stroke="var(--art-07-a)" className="animate-ripple" style={{ transformOrigin: "150px 150px" }} />
          <circle cx="150" cy="150" r="30" fill="none" stroke="var(--art-07-b)" className="animate-ripple" style={{ transformOrigin: "150px 150px", animationDelay: "1.8s" }} />
          <path d="M150 150 C 220 110, 280 120, 330 84" stroke="var(--art-07-b)" fill="none" pathLength={1} className="animate-trace" />
          <line x1="330" y1="84" x2="380" y2="84" stroke="var(--art-07-b)" strokeOpacity=".6" />
          <text x="330" y="76" fontFamily="Geist Mono, monospace" fontSize="9" fill="var(--art-07-b)" opacity=".75" letterSpacing="1.5">SZ. 07 → 15</text>
        </svg>
      )}
      {art === "aux" && (
        /* 09 PASS//THE AUX — two counter-running frequency fields, a signal trace and a needle on the beat */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <line x1="0" y1="150" x2="400" y2="150" stroke="var(--art-09-a)" strokeOpacity=".35" />
          <g className="animate-aux-wave">
            {Array.from({ length: 60 }, (_, i) => {
              const h = 10 + ((i * 37) % 23) * 2.2;
              return <rect key={`a${i}`} x={i * 8} y={150 - h} width="2" height={h} fill="var(--art-09-a)" opacity={0.25 + ((i * 13) % 10) / 22} />;
            })}
          </g>
          <g className="animate-aux-wave" style={{ animationDirection: "reverse", animationDuration: "12s" }}>
            {Array.from({ length: 60 }, (_, i) => {
              const h = 8 + ((i * 53) % 19) * 2.4;
              return <rect key={`b${i}`} x={i * 8 + 4} y={150} width="2" height={h} fill="var(--art-09-b)" opacity={0.2 + ((i * 7) % 10) / 24} />;
            })}
          </g>
          <line x1="248" y1="60" x2="248" y2="240" stroke="var(--foreground)" strokeOpacity=".8" />
          <circle cx="248" cy="150" r="4" fill="var(--foreground)" className="animate-slow-pulse" style={{ transformOrigin: "248px 150px" }} />
          <text x="256" y="72" fontFamily="Geist Mono, monospace" fontSize="9" fill="var(--art-09-a)" opacity=".8" letterSpacing="1.5">A ⟷ B</text>
        </svg>
      )}
      {art === "living" && (
        /* 08 DIRECTOR — a living orbital system: controlled pulse, editorial cue marks */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="dr-core" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="var(--art-08-a)" stopOpacity=".95" />
              <stop offset=".45" stopColor="var(--art-08-b)" stopOpacity=".3" />
              <stop offset="1" stopColor="var(--onyx)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="150" r="96" fill="url(#dr-core)" className={status === "offline" ? "" : "animate-slow-pulse"} style={{ transformOrigin: "200px 150px", opacity: status === "offline" ? 0.45 : 1 }} />
          {[70, 110, 150].map((rx, i) => (
            <ellipse key={rx} cx="200" cy="150" rx={rx} ry={rx * 0.42} fill="none" stroke="var(--art-08-a)" strokeOpacity={0.5 - i * 0.12} transform={`rotate(${-14 + i * 12} 200 150)`} />
          ))}
          <g className="animate-orbit" style={{ transformOrigin: "200px 150px", animationDuration: status === "writing" ? "14s" : "60s" }}>
            <circle cx="310" cy="150" r="3" fill="var(--art-08-a)" />
            <circle cx="130" cy="150" r="2" fill="var(--art-08-b)" />
          </g>
          {sceneType && <text x="24" y="282" fontFamily="Geist Mono, monospace" fontSize="10" letterSpacing="2" fill="var(--art-08-a)" opacity=".8">CUE · {sceneType}</text>}
        </svg>
      )}
    </div>
  );
}
