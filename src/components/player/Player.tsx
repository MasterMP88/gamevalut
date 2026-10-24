import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, SlidersHorizontal, Zap } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Btn } from "@/components/vault/Btn";
import { SceneView } from "./SceneView";
import { SettingsSheet } from "./SettingsSheet";
import { EndScreen } from "./EndScreen";
import { useSessions } from "@/lib/game/store";
import { haptic } from "@/lib/haptics";
import { useDirector } from "@/lib/game/use-director";
import { BATTLE_CHAPTER, COMEBACK_GAP, VAULT_THRESHOLD, fill, targetPhase, type Action } from "@/lib/game/engine";
import { MILESTONES } from "@/lib/game/specials";
import { GameArt } from "@/components/vault/GameArt";
import { PHASE_NAMES } from "@/lib/game/scenes";
import type { GameConfig } from "@/lib/game/games";
import type { Steer } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const STEERS: { id: Exclude<Steer, null>; label: string }[] = [
  { id: "funnier", label: "Lustiger" },
  { id: "flirtier", label: "Flirtiger" },
  { id: "game", label: "Spiel" },
  { id: "hotter", label: "Heißer" },
];

export function Player({ game }: { game: GameConfig }) {
  const { sessions, dispatch: d, end } = useSessions();
  const state = sessions[game.id];
  const dispatch = (a: Action) => d(game.id, a);
  const [menu, setMenu] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const status = useDirector(state, !!game.ai, dispatch);

  if (!state) return null;
  const me = state.players[state.turn];
  const you = state.players[(1 - state.turn) as 0 | 1];
  const scene = state.current;

  return (
    <div className="flex min-h-dvh flex-col bg-background safe-x safe-top safe-bottom">
      <header className="flex items-center justify-between gap-3">
        <Link to="/" className="tap -ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm text-muted-foreground" aria-label="Zurück zur Übersicht (Spiel bleibt offen)">
          <ArrowLeft className="size-5" /> <span className="font-display tracking-[0.18em]">N//</span>
        </Link>
        <p className="eyebrow truncate">{game.number} · {game.title}</p>
        <Btn variant="quiet" size="icon" aria-label="Einstellungen" onClick={() => setMenu(true)}>
          <SlidersHorizontal className="size-5" />
        </Btn>
      </header>

      {state.finished ? (
        <EndScreen game={game} state={state} dispatch={dispatch} onEnd={() => end(game.id)} />
      ) : (
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-8">
          <div className="flex flex-col-reverse gap-3">
            <div className="min-w-0">
              <p className="eyebrow">
                Szene {state.sceneNumber}
                {game.battle ? ` · Kapitel ${Math.ceil(state.sceneNumber / BATTLE_CHAPTER)}` : ` · ${PHASE_NAMES[targetPhase(state)]}`}
              </p>
              <p key={`${state.sceneNumber}-${me}`} className="font-display mt-1 truncate text-6xl leading-none animate-rise">{me}</p>
            </div>
            {game.ai && (
              <span className={cn("eyebrow flex min-w-0 items-center gap-2", status === "offline" ? "text-muted-foreground" : "text-champagne")} aria-live="polite">
                <span className={cn("size-2 rounded-full", status === "offline" ? "bg-muted-foreground" : "bg-champagne animate-slow-pulse")} />
                {status === "offline" ? "Local mode" : status === "writing" ? "Director schreibt die Nacht weiter …" : "Director live"}
              </span>
            )}
          </div>

          {game.battle && (() => {
            const total = Math.max(1, state.sparks[0] + state.sparks[1]);
            const trailing = state.sparks[(1 - state.turn) as 0 | 1] - state.sparks[state.turn] >= COMEBACK_GAP;
            return (
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-3">
                  {state.players.map((n, i) => (
                    <div key={i} className={cn("min-w-0", i === 1 && "text-right")}>
                      <p className="eyebrow truncate">{n}</p>
                      <p className={cn("mt-1 flex items-baseline gap-2", i === 1 && "justify-end")}>
                        <span className="font-display text-4xl">{state.sparks[i]}</span>
                        <span className="text-sm text-muted-foreground">Streak {state.streaks[i]}/3</span>
                      </p>
                    </div>
                  ))}
                </div>
                {/* two thermal signals pushing toward each other */}
                <div className="relative mt-2 flex h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  <span className="h-full bg-foreground transition-all duration-700" style={{ width: `${(state.sparks[0] / total) * 100}%` }} />
                  <span className="h-full flex-1 bg-primary transition-all duration-700" />
                </div>
                {trailing && <p className="mt-2 text-sm italic text-champagne">Comeback-Bonus aktiv · +1 pro Szene für {me}</p>}
              </div>
            );
          })()}

          {game.coop && (
            <ol className="mt-5 grid grid-cols-3 gap-2 border-y border-line py-3" aria-label="Gemeinsame Meilensteine">
              {MILESTONES.map((m) => {
                const on = state.milestones.includes(m.id);
                return (
                  <li key={m.id} className={cn("flex min-w-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors", on ? "text-foreground" : "text-muted-foreground/50")}>
                    <span className={cn("inline-block size-2 rotate-45 border", on ? "border-champagne bg-champagne" : "border-line")} />
                    {m.label}
                  </li>
                );
              })}
            </ol>
          )}
          {game.coop && (
            <div className="mt-4 flex items-center gap-5" aria-label={`Gemeinsame Energien: Chaos ${state.energies.chaos}, Connection ${state.energies.connection}, Heat ${state.energies.heat} von 100`}>
              {([["chaos", "Chaos", "var(--champagne)"], ["connection", "Connection", "var(--art-07-a)"], ["heat", "Heat", "var(--primary)"]] as const).map(([k, label, col]) => {
                const v = state.energies[k];
                const ready = v >= VAULT_THRESHOLD;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span
                      className={cn("block rounded-full transition-all duration-700", ready && "animate-slow-pulse")}
                      style={{ width: 8 + v / 7, height: 8 + v / 7, background: col, opacity: 0.25 + v / 140, boxShadow: ready ? `0 0 0 3px color-mix(in oklab, ${col} 25%, transparent)` : undefined }}
                    />
                    <span className="eyebrow">{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {game.memory && state.anchors.some((a) => !a.used) && (
            <p className="mt-4 flex items-center gap-2 border-l border-violet/40 pl-3 font-mono text-[10px] uppercase tracking-[0.16em] text-violet" aria-live="polite">
              <span className="relative inline-flex size-3"><span className="absolute inset-0 rounded-full border border-violet animate-ripple" /><span className="m-auto size-1 rounded-full bg-violet" /></span>
              Ein Echo formt sich · {state.anchors.filter((a) => !a.used).length}
            </p>
          )}

          {game.id !== "one-two" && (
            <div className={cn(
              "mt-5 overflow-hidden border-y border-line",
              game.id === "roxy-after-dark" && "h-16 opacity-80",
              game.id === "after-dark-2" && "h-20",
              game.id === "roxy-night" && "h-24",
              game.id === "battle" && "h-20",
              game.id === "coop" && "h-24",
              game.id === "night-echo" && "h-16 opacity-85",
              game.id === "ai-director" && "h-24"
            )}>
              <GameArt
                art={game.art}
                steer={state.steer}
                status={status}
                scoreA={state.sparks[0]}
                scoreB={state.sparks[1]}
                energies={state.energies}
                sceneType={scene?.type}
                className="h-full w-full"
              />
            </div>
          )}

          <div className="mt-8 flex flex-1 flex-col">
            {scene?.cue && (
              <p key={`cue-${state.sceneNumber}`} className="mb-3 font-display text-lg italic text-champagne animate-rise">{fill(scene.cue, me, you)}</p>
            )}
            {scene && (
              <SceneView
                key={`${state.sceneNumber}-${scene.id}`}
                scene={scene}
                me={me}
                you={you}
                memory={!!game.memory}
                onDone={(p) => { haptic(); dispatch({ type: "DONE", ...p }); }}
                onSkip={() => { haptic(4); dispatch({ type: "SKIP" }); }}
                battle={
                  game.battle
                    ? {
                        players: state.players,
                        missionOwner: state.secretMission ? state.players[state.secretMission.player] : null,
                        onWin: (w, missionDone) => dispatch({ type: "SHOWDOWN_WIN", winner: w, missionDone }),
                      }
                    : undefined
                }
              />
            )}
          </div>

          {game.steering && (
            <nav className="mt-6 border-t border-line pt-4" aria-label="Nächste Szene steuern">
              <p className="eyebrow flex items-center justify-between">
                <span>Richtung der Nacht</span>
                {state.steer && (
                  <span className="flex items-center gap-1 normal-case" aria-label={`Wirkt noch ${state.steerLeft} Szenen`}>
                    {[0, 1, 2].map((i) => <span key={i} className={cn("inline-block h-px w-4", i < state.steerLeft ? "bg-champagne" : "bg-line")} />)}
                  </span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STEERS.filter((s) => s.id !== "hotter" || state.settings.sensual).map((s) => (
                  <Btn key={s.id} variant="chip" size="sm" data-on={state.steer === s.id} aria-pressed={state.steer === s.id} onClick={() => dispatch({ type: "STEER", steer: state.steer === s.id ? null : s.id })}>
                    {s.label}
                  </Btn>
                ))}
              </div>
            </nav>
          )}

          {game.battle && state.powerUps[state.turn] > 0 && scene?.type !== "SHOWDOWN" && (
            <Btn variant="outline" className="mt-4" disabled={state.doubleNext} onClick={() => dispatch({ type: "USE_POWERUP", kind: "double" })}>
              <Zap className="size-4" /> {state.doubleNext ? "Doppelt aktiv" : `„Doppelt“ · diese Szene ×2 (${state.powerUps[state.turn]})`}
            </Btn>
          )}
          {game.battle && state.powerUps[state.turn] > 0 && scene && scene.type !== "SHOWDOWN" && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Btn variant="outline" size="sm" disabled={state.rebound !== null} onClick={() => dispatch({ type: "USE_POWERUP", kind: "rebound" })}>
                „Zurück“ · an {you}
              </Btn>
              <Btn variant="outline" size="sm" disabled={state.read !== null} onClick={() => dispatch({ type: "USE_POWERUP", kind: "read" })}>
                {state.read !== null ? "Wette läuft" : `„Lesen“ · ${you} macht's`}
              </Btn>
            </div>
          )}
          {game.battle && state.rebound !== null && state.rebound !== state.turn && (
            <p className="mt-2 text-sm italic text-champagne">Zurückgespielt von {state.players[state.rebound]} · Skip bringt {state.players[state.rebound]} +2</p>
          )}
          {game.battle && scene?.type === "SHOWDOWN" && (state.powerUps[state.turn] > 0 || state.raise) && (
            <Btn variant="outline" className="mt-4" disabled={state.raise} onClick={() => dispatch({ type: "USE_POWERUP", kind: "raise" })}>
              <Zap className="size-4" /> {state.raise ? "Erhöht · Showdown zählt 6" : `„Erhöhen“ · Showdown zählt 6 statt 3 (${state.powerUps[state.turn]})`}
            </Btn>
          )}
          {(game.battle || game.signature || game.coop) && (
            <Btn variant="ghost" size="sm" className="mt-4 self-center" onClick={() => dispatch({ type: "FINISH" })}>
              {game.battle ? "Zum Finale" : "Nacht abschließen"}
            </Btn>
          )}
        </main>
      )}

      <SettingsSheet
        open={menu}
        onOpenChange={setMenu}
        settings={state.settings}
        onSettings={(s) => dispatch({ type: "SETTINGS", settings: s })}
        anchors={state.anchors}
        onDeleteAnchor={(id) => dispatch({ type: "DELETE_ANCHOR", id })}
        onClearAnchors={() => dispatch({ type: "CLEAR_ANCHORS" })}
        log={state.log}
        memory={!!game.memory}
        onEnd={() => { setMenu(false); setConfirmEnd(true); }}
      />
      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent className="rounded-3xl border-line bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-3xl font-normal">Nacht wirklich beenden?</AlertDialogTitle>
            <AlertDialogDescription>Der Spielstand und alle Memory-Anker werden sofort gelöscht.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-12 rounded-full">Weiterspielen</AlertDialogCancel>
            <AlertDialogAction className="min-h-12 rounded-full" onClick={() => end(game.id)}>Beenden &amp; löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}