import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Btn, btn } from "@/components/vault/Btn";
import { GameArt } from "@/components/vault/GameArt";
import { battleWinner, nightSignature, type Action } from "@/lib/game/engine";
import type { GameConfig } from "@/lib/game/games";
import type { SessionState } from "@/lib/game/types";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export const ENDINGS = [
  { id: "slow-burn", title: "Slow Burn", line: "Handys weg. Licht runter. Der Rest gehört euch." },
  { id: "beautiful-chaos", title: "Beautiful Chaos", line: "Musik an, Küche als Tanzfläche, kein Plan bis Sonnenaufgang." },
  { id: "no-more-game", title: "No More Game", line: "Ab hier kein Spiel mehr. Nur ihr zwei." },
] as const;

const PRIVACY = "Alles, was ihr heute gemerkt habt, lebt nur in diesem Tab. Neu laden – und es ist weg.";

function Back({ onEnd, className }: { onEnd: () => void; className?: string }) {
  return <Link to="/" onClick={onEnd} className={btn({ size: "lg", className })}>Zurück zu NOCTURNE</Link>;
}

/** Hand-drawn signature stroke — drawn once, the visual seal of the night. */
function SignatureStroke({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
      <path pathLength={1} className="animate-draw" d="M6 58 C 40 10, 62 10, 70 44 S 96 74, 118 36 S 150 6, 160 40 S 190 70, 214 30 S 252 18, 262 46 S 296 60, 314 22" />
    </svg>
  );
}

function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("relative mx-auto flex w-full max-w-xl flex-1 flex-col overflow-hidden py-10", className)}>{children}</main>;
}

export function EndScreen({ game, state, dispatch, onEnd }: { game: GameConfig; state: SessionState; dispatch: (a: Action) => void; onEnd: () => void }) {
  useEffect(() => { haptic([10, 80, 20]); }, [state.ending]);

  if (state.ending) {
    const e = ENDINGS.find((x) => x.id === state.ending)!;
    return (
      <Stage className="justify-center">
        <p className="eyebrow animate-rise">Abspann · {e.title}</p>
        <h1 className="font-display mt-6 text-[3.4rem] leading-[0.95] text-balance animate-sig">{e.line}</h1>
        <SignatureStroke className="mt-10 w-48 text-primary/70" />
        <p className="mt-10 text-sm text-muted-foreground">{PRIVACY}</p>
        <div className="mt-10 flex flex-col gap-3">
          <Back onEnd={onEnd} />
          {game.signature && <Btn variant="ghost" size="lg" onClick={() => dispatch({ type: "AFTER_HOURS" })}>Doch noch After Hours</Btn>}
        </div>
      </Stage>
    );
  }

  if (game.battle) {
    const w = battleWinner(state);
    const [a, b] = state.sparks;
    const lead = Math.max(a, b) || 1;
    return (
      <Stage>
        <GameArt art={game.art} score={state.sparks} className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-30" />
        <div className="relative">
        <p className="eyebrow text-champagne">Heatcheck · Finale</p>
        <h1 className="font-display mt-4 text-[4.2rem] leading-[0.88] text-balance break-words animate-sig">
          {w === null ? "Gleichstand." : <>{state.players[w]}<br /><span className="text-primary">holt die Nacht.</span></>}
        </h1>
        <p className="mt-6 max-w-[34ch] text-muted-foreground">
          {w === null ? "Perfekt ausgeglichen. Verdächtig romantisch." : `Der Preis: ${state.players[(1 - w) as 0 | 1]} erfüllt einen kleinen, charmanten Wunsch – wenn beide mögen.`}
        </p>
        <div className="mt-12 space-y-6">
          {state.players.map((n, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-4">
                <span className={cn("truncate", w === i ? "text-foreground" : "text-muted-foreground")}>{n}</span>
                <span className="font-display text-4xl tabular-nums">{state.sparks[i]}</span>
              </div>
              <div className="mt-2 h-px bg-line">
                <div className={cn("h-[2px] origin-left animate-rise", w === i ? "bg-primary" : "bg-muted-foreground/50")} style={{ width: `${(state.sparks[i]! / lead) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-12"><Back onEnd={onEnd} className="w-full" /></div>
        </div>
      </Stage>
    );
  }

  if (game.coop) {
    const e = state.energies;
    const unlocked = e.chaos >= 70 && e.connection >= 70 && e.heat >= 70;
    const rings = [
      { k: "Chaos", v: e.chaos, r: 92, cls: "text-champagne" },
      { k: "Connection", v: e.connection, r: 72, cls: "text-violet" },
      { k: "Heat", v: e.heat, r: 52, cls: "text-primary" },
    ];
    return (
      <Stage>
        <GameArt art={game.art} energies={state.energies} className="absolute inset-x-0 top-0 h-80 opacity-55" />
        <div className="relative mx-auto mt-2 size-64">
          <svg viewBox="0 0 200 200" className="size-full -rotate-90" fill="none" aria-hidden>
            {rings.map((x) => (
              <g key={x.k} className={x.cls}>
                <circle cx="100" cy="100" r={x.r} stroke="var(--line)" strokeWidth="1" />
                <circle cx="100" cy="100" r={x.r} stroke="currentColor" strokeWidth="2" strokeLinecap="round" pathLength={100} style={{ strokeDasharray: `${Math.min(100, x.v)} 100`, transition: "stroke-dasharray 1.6s" }} />
              </g>
            ))}
          </svg>
          <span className={cn("font-display absolute inset-0 flex items-center justify-center text-4xl", unlocked ? "text-foreground animate-slow-pulse" : "text-muted-foreground")}>{unlocked ? "//" : "·"}</span>
        </div>
        <p className="eyebrow mt-8 text-center">{unlocked ? "Der Vault ist offen" : "Fast offen"}</p>
        <h1 className="font-display mt-3 text-center text-[3.4rem] leading-[0.92] text-balance animate-sig">{unlocked ? "Ihr habt die Nacht gewonnen. Zusammen." : "Nächstes Mal knackt ihr ihn."}</h1>
        <p className="mx-auto mt-6 max-w-[34ch] text-center text-muted-foreground">
          {unlocked
            ? "Letzte Szene, nur für euch: Jeder sagt dem anderen, welcher Moment heute der schönste war. Dann entscheidet ihr, wie es weitergeht."
            : "Chaos, Connection und Heat müssen gemeinsam glühen. Eins fehlte noch ein bisschen."}
        </p>
        <div className="mt-8 flex justify-center gap-5">
          {rings.map((x) => <span key={x.k} className={cn("eyebrow", x.cls)}>{x.k}</span>)}
        </div>
        <div className="mt-auto pt-12"><Back onEnd={onEnd} className="w-full" /></div>
      </Stage>
    );
  }

  if (game.signature) {
    const sig = nightSignature(state);
    return (
      <Stage>
        <p className="eyebrow">Night Signature · {state.players[0]} & {state.players[1]}</p>
        <h1 className="font-display mt-6 text-[4.6rem] leading-[0.86] text-balance animate-sig">{sig.name}</h1>
        <SignatureStroke className="mt-4 w-full max-w-xs text-primary/80" />
        <p className="font-display mt-6 text-2xl italic text-muted-foreground">{sig.line}</p>
        {sig.callbacks.length > 0 && (
          <section className="mt-12" aria-label="Echos des Abends">
            <p className="eyebrow text-violet">Was nachhallt</p>
            <ul className="mt-4 space-y-6">
              {sig.callbacks.map((a, i) => (
                <li key={a.id} className="animate-rise" style={{ animationDelay: `${600 + i * 300}ms` }}>
                  <p className="font-display text-[1.65rem] leading-tight">„{a.shortText.length > 80 ? `${a.shortText.slice(0, 78)}…` : a.shortText}“</p>
                  <p className="eyebrow mt-1">— {a.owner}, Szene {a.sceneNumber}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="eyebrow mt-14">Wie endet diese Nacht?</p>
        <div className="mt-3 border-t border-line">
          {ENDINGS.map((e, i) => (
            <button key={e.id} type="button" onClick={() => { haptic(12); dispatch({ type: "ENDING", ending: e.id }); }} className="tap group flex w-full items-baseline gap-4 border-b border-line py-5 text-left">
              <span className="font-mono w-6 shrink-0 text-xs text-muted-foreground">{["I", "II", "III"][i]}</span>
              <span className="min-w-0">
                <span className="font-display block text-[2rem] leading-none transition-colors group-active:text-primary">{e.title}</span>
                <span className="mt-2 block text-sm text-muted-foreground">{e.line}</span>
              </span>
            </button>
          ))}
        </div>
        <Btn variant="ghost" size="lg" className="mt-6" onClick={() => dispatch({ type: "AFTER_HOURS" })}>After Hours · endlos weiter</Btn>
        <p className="mt-8 text-sm text-muted-foreground">{PRIVACY}</p>
      </Stage>
    );
  }

  return (
    <Stage className="justify-center">
      <h1 className="font-display text-6xl animate-sig">Gute Nacht.</h1>
      <SignatureStroke className="mt-8 w-48 text-primary/70" />
      <p className="mt-8 text-sm text-muted-foreground">{PRIVACY}</p>
      <Back onEnd={onEnd} className="mt-10" />
    </Stage>
  );
}