import type { GameConfig } from "@/lib/game/games";
import type { Steer } from "@/lib/game/types";

type Props = {
  art: GameConfig["art"];
  className?: string;
  /** Night Shift: the horizon tilts toward the chosen direction. */
  steer?: Steer;
  /** Director: the orbit reacts to the host status. */
  status?: "idle" | "writing" | "live" | "offline";
  /** Heatcheck: optional live score shifts the meeting point of both traces. */
  scoreA?: number;
  scoreB?: number;
  /** US//AFTER DARK: optional live energy values deepen the shared third form. */
  energies?: { chaos: number; connection: number; heat: number };
  /** Director: current interaction type changes the editorial cue glyph. */
  sceneType?: string | undefined;
};

const VB = "0 0 400 300";
const STEER_TILT: Record<Exclude<Steer, null>, number> = { funnier: -6, flirtier: 4, game: -2, hotter: 8 };

/** Eight bespoke key-art systems — one visual grammar per game, all pure SVG, all token colours. */
export function GameArt({ art, className = "", steer = null, status = "idle", scoreA = 0, scoreB = 0, energies, sceneType }: Props) {
  const c = "absolute inset-0 h-full w-full";
  const scoreTotal = Math.max(1, scoreA + scoreB);
  const heatX = scoreA + scoreB > 0 ? 74 + (scoreA / scoreTotal) * 252 : 200;
  const coopAvg = energies ? (energies.chaos + energies.connection + energies.heat) / 3 : 42;
  const coopBalance = energies ? 1 - (Math.max(energies.chaos, energies.connection, energies.heat) - Math.min(energies.chaos, energies.connection, energies.heat)) / 100 : .72;
  const coopOpacity = Math.max(.18, Math.min(.72, .18 + (coopAvg / 100) * .54)) * Math.max(.55, coopBalance);
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
          {[[-36, 20, 1.7], [-24, -12, 1.2], [22, -25, 1.4], [36, 8, 1.1], [13, 27, 1.5]].map(([dx, dy, r], i) => (
            <circle key={`ember-${i}`} cx={248 + dx!} cy={138 + dy!} r={r} fill="var(--art-01-b)" opacity={0.28 + i * .08} className="animate-slow-pulse" style={{ transformOrigin: `${248 + dx!}px ${138 + dy!}px`, animationDelay: `${i * 420}ms` }} />
          ))}
          <circle cx="248" cy="138" r="4" fill="var(--art-01-b)" className="animate-ignite" />
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
            <g className="animate-orbit" style={{ animationDuration: "8s" }}>
              <line x1="0" y1="0" x2="0" y2="-30" stroke="var(--art-02-a)" strokeWidth="2" strokeLinecap="round" />
            </g>
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
          <path d={`M0 110 L60 108 L80 80 L100 140 L120 96 L150 112 L${Math.max(155, heatX - 10)} 104`} stroke="var(--art-04-a)" strokeWidth="2" fill="none" pathLength={1} className="animate-draw" />
          <path d={`M400 190 L340 192 L320 222 L300 160 L280 204 L250 186 L${Math.min(245, heatX + 10)} 196`} stroke="var(--art-04-b)" strokeWidth="2" fill="none" pathLength={1} className="animate-draw" style={{ animationDelay: "250ms" }} />
          <line x1={heatX} y1="40" x2={heatX} y2="260" stroke="var(--art-04-a)" strokeOpacity=".28" strokeDasharray="2 5" style={{ transition: "all 700ms var(--ease-out-expo)" }} />
          <circle cx={Math.max(155, heatX - 10)} cy="104" r="4" fill="var(--art-04-a)" style={{ transition: "all 700ms var(--ease-out-expo)" }} />
          <circle cx={Math.min(245, heatX + 10)} cy="196" r="4" fill="var(--art-04-b)" style={{ transition: "all 700ms var(--ease-out-expo)" }} />
          <text x="200" y="285" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="10" fill="var(--art-04-a)" opacity=".55" letterSpacing="3">01 — VS — 02</text>
        </svg>
      )}
      {art === "coop" && (
        /* 05 US//AFTER DARK — two forms that make a third where they overlap */
        <svg className={c} viewBox={VB} preserveAspectRatio="xMidYMid slice">
          <defs>
            <clipPath id="co-a"><circle cx="170" cy="150" r="88" /></clipPath>
          </defs>
          <path d="M78 150 C78 87 122 55 177 69 C222 80 238 119 218 165 C198 211 144 235 102 206 C79 190 70 171 78 150Z" fill="none" stroke="var(--art-05-a)" strokeOpacity=".82" />
          <path d="M322 150 C322 87 278 55 223 69 C178 80 162 119 182 165 C202 211 256 235 298 206 C321 190 330 171 322 150Z" fill="none" stroke="var(--art-05-b)" strokeOpacity=".82" />
          <path d="M168 83 C198 70 233 84 246 113 C262 149 238 197 201 218 C164 197 140 149 156 113 C160 102 164 92 168 83Z" fill="var(--art-05-a)" opacity={coopOpacity} className="animate-slow-pulse" style={{ transformOrigin: "201px 150px", transition: "opacity 800ms var(--ease-out-expo)" }} />
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
          {["CUE", sceneType ? sceneType.slice(0, 4).toUpperCase() : "CUT", "ECHO"].map((t, i) => (
            <text key={`${t}-${i}`} x={34 + i * 128} y="276" fontFamily="Geist Mono, monospace" fontSize="9" letterSpacing="3" fill="var(--art-08-a)" opacity={i === 1 && sceneType ? .78 : .5}>{`0${i + 1} ${t}`}</text>
          ))}
        </svg>
      )}
    </div>
  );
}