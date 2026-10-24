import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Btn, btn } from "@/components/vault/Btn";
import { battleWinner, nightSignature, type Action } from "@/lib/game/engine";
import { visibleTracklist } from "@/lib/music/engine";
import type { GameConfig } from "@/lib/game/games";
import type { SessionState } from "@/lib/game/types";
import { haptic } from "@/lib/haptics";
import { useSessions } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export const ENDINGS = [
  { id: "slow-burn", title: "Slow Burn", line: "Handys weg. Licht runter. Der Rest gehört euch." },
  { id: "beautiful-chaos", title: "Beautiful Chaos", line: "Musik an, Küche als Tanzfläche, kein Plan bis Sonnenaufgang." },
  { id: "no-more-game", title: "No More Game", line: "Ab hier kein Spiel mehr. Nur ihr zwei." },
] as const;

const PRIVACY = "Was ihr euch heute gesagt und gemerkt habt, bleibt in diesem Tab – außer ihr habt einen Moment ausdrücklich gesichert.";

/** Strong next action: replay this game, or back to the collection. */
function Back({ onEnd, game, className }: { onEnd: () => void; game: GameConfig; className?: string }) {
  const { start } = useSessions();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Btn size="lg" className="w-full" onClick={() => { haptic(10); onEnd(); start(game.id); }}>Nochmal {game.title} →</Btn>
      <Link to="/" onClick={onEnd} className={btn({ variant: "ghost", size: "lg", className: "w-full" })}>Anderes Spiel wählen</Link>
    </div>
  );
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
          <Back onEnd={onEnd} game={game} />
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
        <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-20 top-0 size-80 text-champagne/25" fill="none" stroke="currentColor" aria-hidden>
          <path d="M20 180 L180 20 M60 180 L180 60 M100 180 L180 100" strokeWidth="1" />
        </svg>
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
        <div className="mt-auto pt-12"><Back onEnd={onEnd} game={game} className="w-full" /></div>
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
        <div className="mt-auto pt-12"><Back onEnd={onEnd} game={game} className="w-full" /></div>
      </Stage>
    );
  }

  if (game.music && state.music) {
    const tracks = visibleTracklist(state.music);
    return (
      <Stage>
        <div className="flex items-center gap-3 text-champagne/70" aria-hidden>
          <span className="font-display text-xl tracking-[0.16em]">N//</span>
          <span className="h-px flex-1 bg-gradient-to-r from-champagne/60 via-primary/45 to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em]">aux archive</span>
        </div>
        <p className="eyebrow mt-8 text-champagne">PASS//THE AUX · Finale</p>
        <h1 className="font-display mt-3 text-[4.2rem] leading-[0.86] text-balance animate-sig">
          Tonight’s<br /><em className="not-italic text-primary">Tracklist.</em>
        </h1>
        <p className="mt-5 max-w-[34ch] text-muted-foreground">
          {tracks.length ? "Die Songs, mit denen ihr heute geantwortet habt." : "Heute bleibt die Tracklist leer. Auch das ist eine Ansage."}
        </p>

        {tracks.length > 0 && (
          <ol className="mt-10 border-t border-line">
            {tracks.map((track, i) => (
              <li key={[track.round, track.player, track.title, i].join("-")} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-line py-5">
                <span className="font-mono text-xs tabular-nums text-champagne">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="eyebrow">{state.players[track.player]} · Runde {track.round}</p>
                  <p className="font-display mt-2 break-words text-[1.9rem] leading-[0.95]">{track.title}</p>
                  {track.artist && <p className="mt-1 break-words text-sm text-muted-foreground">{track.artist}</p>}
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground/70">{track.prompt}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-8 border-l border-primary/40 pl-3 text-sm text-muted-foreground">
          Diese Tracklist lebt nur in dieser Session. Sie wird nicht automatisch mit eurem Account synchronisiert.
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-10">
          <Btn size="lg" className="w-full" onClick={() => dispatch({ type: "AFTER_HOURS" })}>Noch einen Track →</Btn>
          <Back onEnd={onEnd} game={game} />
        </div>
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

  const played = Math.max(0, state.sceneNumber - 1);
  return (
    <Stage className="justify-center">
      <p className="eyebrow animate-rise">{game.number} · {game.title} · Abspann</p>
      <h1 className="font-display mt-6 text-6xl leading-[0.95] animate-sig">Gute Nacht, {state.players[0]} & {state.players[1]}.</h1>
      <SignatureStroke className="mt-8 w-48 text-primary/70" />
      <p className="font-display mt-6 text-2xl italic text-muted-foreground">{played} {played === 1 ? "Szene" : "Szenen"} gespielt.</p>
      <p className="mt-8 text-sm text-muted-foreground">{PRIVACY}</p>
      <Back onEnd={onEnd} game={game} className="mt-10" />
    </Stage>
  );
}