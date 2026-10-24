import { useEffect, useState } from "react";
import { SaveSheet, SaveBadge } from "@/components/account/SaveSheet";
import { useAuth } from "@/lib/auth";
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

const STEERS: { id: Exclude<Steer, null>; label: string; arrow: string }[] = [
  { id: "funnier", label: "Lustiger", arrow: "↖" },
  { id: "flirtier", label: "Flirtiger", arrow: "↗" },
  { id: "game", label: "Spiel", arrow: "↙" },
  { id: "hotter", label: "Heißer", arrow: "↘" },
];

export function Player({ game }: { game: GameConfig }) {
  const { sessions, dispatch: d, end } = useSessions();
  const state = sessions[game.id];
  const dispatch = (a: Action) => d(game.id, a);
  const [menu, setMenu] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const status = useDirector(state, !!game.ai, dispatch);
  const { user } = useAuth();
  const { saveStatus } = useSessions();
  const [saveOpen, setSaveOpen] = useState(false);
  const [prompted, setPrompted] = useState(false);
  // Contextual, once: after a few scenes a guest is offered to keep this night.
  useEffect(() => {
    if (!user && !prompted && state && state.sceneNumber >= 4 && !state.finished) { setPrompted(true); setSaveOpen(true); }
  }, [user, prompted, state]);

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
        <div className="flex min-w-0 flex-col items-center">
          <p className="eyebrow truncate">{game.number} · {game.title}</p>
          <SaveBadge status={user ? saveStatus[game.id] ?? "idle" : "guest"} onGuest={() => setSaveOpen(true)} />
        </div>
        <Btn variant="quiet" size="icon" aria-label="Einstellungen" onClick={() => setMenu(true)}>
          <SlidersHorizontal className="size-5" />
        </Btn>
      </header>

      {state.finished ? (
        <EndScreen game={game} state={state} dispatch={dispatch} onEnd={() => end(game.id)} />
      ) : (
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-5 sm:pt-8">
          <div className="flex flex-col-reverse gap-3">
            <div className="min-w-0">
              <p className="eyebrow">
                Szene {state.sceneNumber}
                {game.battle ? ` · Kapitel ${Math.ceil(state.sceneNumber / BATTLE_CHAPTER)}` : ` · ${PHASE_NAMES[targetPhase(state)]}`}
              </p>
              <p className="mt-1 flex min-w-0 items-baseline gap-3">
                <span key={`${state.sceneNumber}-${me}`} className="font-display min-w-0 truncate text-5xl leading-none animate-rise sm:text-6xl">{me}</span>
                <span className="shrink-0 text-sm text-muted-foreground">ist dran</span>
              </p>
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
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3" aria-label={`Spielstand: ${state.players[0]} ${state.sparks[0]}, ${state.players[1]} ${state.sparks[1]} Sparks`}>
                  {state.players.map((n, i) => (
                    <div key={i} className={cn("min-w-0 transition-opacity", i === 1 && "order-3 text-right", state.turn !== i && "opacity-60")}>
                      <p className="eyebrow truncate">{n}{state.turn === i && " · dran"}</p>
                      <p className={cn("font-display mt-1 text-5xl leading-none tabular-nums", state.sparks[i]! > state.sparks[1 - i]! && "text-primary")}>{state.sparks[i]}</p>
                      <p className={cn("mt-1 flex items-center gap-1", i === 1 && "justify-end")} aria-label={`Streak ${state.streaks[i]} von 3, Power-ups ${state.powerUps[i]}`}>
                        {[0, 1, 2].map((s) => <span key={s} className={cn("inline-block size-1.5 rotate-45", s < state.streaks[i]! ? "bg-champagne" : "bg-line")} />)}
                        {state.powerUps[i]! > 0 && <span className="ml-1 inline-flex items-center text-xs text-champagne"><Zap className="size-3" />{state.powerUps[i]}</span>}
                      </p>
                    </div>
                  ))}
                  <span className="order-2 pb-6 font-display text-lg italic text-muted-foreground" aria-hidden>vs</span>
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
            <ol className="mt-5 flex gap-4" aria-label="Gemeinsame Meilensteine">
              {MILESTONES.map((m) => {
                const on = state.milestones.includes(m.id);
                return (
                  <li key={m.id} className={cn("flex items-center gap-1.5 text-xs transition-colors", on ? "text-foreground" : "text-muted-foreground/60")}>
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
            <p className="mt-4 flex items-center gap-2 text-xs text-violet" aria-live="polite">
              <span className="relative inline-flex size-3"><span className="absolute inset-0 rounded-full border border-violet animate-ripple" /><span className="m-auto size-1 rounded-full bg-violet" /></span>
              Ein Echo formt sich · {state.anchors.filter((a) => !a.used).length}
            </p>
          )}

          {(game.ai || game.id === "roxy-night") && (
            <GameArt art={game.art} steer={state.steer} status={status} className="mt-5 h-24 rounded-xl opacity-90" />
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
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STEERS.filter((s) => s.id !== "hotter" || state.settings.sensual).map((s) => {
                  const on = state.steer === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => { haptic(6); dispatch({ type: "STEER", steer: on ? null : s.id }); }}
                      className={cn(
                        "tap group flex min-h-12 items-center justify-between rounded-lg border px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on ? "border-champagne bg-surface-2 text-foreground" : "border-line text-muted-foreground",
                      )}
                    >
                      <span>{s.label}</span>
                      <span aria-hidden className={cn("font-display text-lg transition-transform", on ? "translate-x-0.5 text-champagne" : "opacity-50")}>{s.arrow}</span>
                    </button>
                  );
                })}
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
          {(
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
        gameId={game.id}
        onEnd={() => { setMenu(false); setConfirmEnd(true); }}
      />
      <SaveSheet open={saveOpen} onOpenChange={setSaveOpen} slug={game.slug} state={state} />
      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent className="rounded-3xl border-line bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-3xl font-normal">Nacht wirklich beenden?</AlertDialogTitle>
            <AlertDialogDescription>Der laufende Spielstand und alle Memory-Anker werden aus dieser Session gelöscht. Gesicherte Nächte bleiben in deinem Verlauf.</AlertDialogDescription>
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