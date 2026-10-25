import { useEffect, useRef, useState } from "react";
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
import { BATTLE_CHAPTER, COMEBACK_GAP, fill, targetPhase, type Action } from "@/lib/game/engine";
import { EnergyField } from "./EnergyField";
import { GameArt } from "@/components/vault/GameArt";
import { DirectorStatus } from "@/components/ai/AiSurfaces";
import { PHASE_NAMES } from "@/lib/game/scenes";
import type { GameConfig } from "@/lib/game/games";
import type { Steer } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { CoupleAccessGate } from "@/components/commerce/AccessGate";
import { useEntitlements } from "@/lib/commerce/use-entitlements";
import { coupleSceneAccess } from "@/lib/entitlements";
import { stashPending } from "@/lib/game/pending";

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
  const { user, accessToken } = useAuth();
  const { saveStatus, settings } = useSessions();
  const { ents, loading: entsLoading } = useEntitlements();
  const status = useDirector(state, !!game.ai && !entsLoading && coupleSceneAccess(6, ents).allowed, dispatch, accessToken);
  const [saveOpen, setSaveOpen] = useState(false);
  const [prompted, setPrompted] = useState(false);
  // Contextual, once: after a few scenes a guest is offered to keep this night.
  useEffect(() => {
    if (!user && !prompted && state && state.finished) { setPrompted(true); setSaveOpen(true); }
  }, [user, prompted, state]);
  // Heatcheck: read the real spark delta after each scene and show a brief Treffer/Daneben beat.
  const prevSparks = useRef<[number, number] | null>(null);
  const [verdict, setVerdict] = useState<{ who: string; d: number; k: number } | null>(null);
  const s0 = state?.sparks[0] ?? 0;
  const s1 = state?.sparks[1] ?? 0;
  const sn = state?.sceneNumber ?? 0;
  useEffect(() => {
    if (!game.battle || !state) return undefined;
    const p = prevSparks.current;
    prevSparks.current = [s0, s1];
    if (!p) return undefined;
    const d0 = s0 - p[0];
    const d1 = s1 - p[1];
    const i = Math.abs(d0) >= Math.abs(d1) ? 0 : 1;
    const d = i === 0 ? d0 : d1;
    setVerdict({ who: state.players[i]!, d, k: sn });
    const t = setTimeout(() => setVerdict(null), 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sn]);

  // Active foreground play only. Pauses, settings and paywall do not spend the budget.
  useEffect(() => {
    if (!state || state.finished || menu || confirmEnd || !coupleSceneAccess(state.sceneNumber, ents).allowed) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now(); const delta = Math.min(11000, now - last); last = now;
      if (!document.hidden) d(game.id, { type: "TICK", elapsedMs: delta });
    }, 10000);
    return () => window.clearInterval(id);
  }, [state?.startedAt, state?.finished, state?.sceneNumber, menu, confirmEnd, ents, d, game.id]);
  if (!state) return null;
  const me = state.players[state.turn];
  const you = state.players[(1 - state.turn) as 0 | 1];
  const scene = state.current;
  // Gate sits before scene 6 (never mid-scene); scene 6+ content is not rendered without paid access.
  const gated = entsLoading ? state.sceneNumber > 5 : !coupleSceneAccess(state.sceneNumber, ents).allowed;


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
        <main className="world mx-auto flex w-full max-w-xl flex-1 flex-col pt-5 sm:pt-8" data-world={game.art} data-tempo={state.tempo ?? undefined} data-steer={state.steer ?? undefined}
          data-comeback={game.battle && Math.abs(state.sparks[0] - state.sparks[1]) >= COMEBACK_GAP ? "" : undefined} style={{ "--world-phase": targetPhase(state) } as React.CSSProperties}>
          <div className="flex flex-col-reverse gap-3">
            <div className="min-w-0">
              <p className="eyebrow">
                Szene {state.sceneNumber}{state.targetScenes ? ` / ${state.targetScenes}` : ""}{state.durationMinutes ? ` · ${Math.max(0, state.durationMinutes - Math.floor((state.elapsedMs ?? 0) / 60000))} min übrig` : " · Open End"}
                {game.battle ? ` · Kapitel ${Math.ceil(state.sceneNumber / Math.max(2, Math.round((state.targetScenes ?? 40) / 4)))}` : ` · ${PHASE_NAMES[targetPhase(state)]}`}
              </p>
              <p className="mt-1 flex min-w-0 items-baseline gap-3">
                <span key={`${state.sceneNumber}-${me}`} className="font-display min-w-0 truncate text-5xl leading-none animate-rise sm:text-6xl">{me}</span>
                <span className="shrink-0 text-sm text-muted-foreground">ist dran</span>
              </p>
            </div>
            {game.ai && <DirectorStatus status={status} />}
          </div>

          {game.id === "one-two" && (
            <div className="mt-5" data-testid="rhythm" aria-label={`Rhythmus: Person ${state.turn + 1} von 2`}>
              <p className="flex items-end gap-4 font-display leading-none">
                <span className={cn("transition-all duration-500", state.turn === 0 ? "text-4xl text-foreground" : "text-lg text-muted-foreground/40")}>ONE</span>
                <span className="mb-2 h-px w-10 bg-line" aria-hidden />
                <span className={cn("ml-auto italic transition-all duration-500", state.turn === 1 ? "text-4xl text-foreground" : "text-lg text-muted-foreground/40")}>TWO</span>
              </p>
              {scene?.id.startsWith("pair-") && (
                <p className="mt-3 font-display text-sm italic text-champagne motion-safe:animate-rise">↺ kam zurück</p>
              )}
            </div>
          )}

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
                {verdict && (
                  <p key={verdict.k} role="status" className={cn("mt-2 flex items-baseline gap-2 font-display text-xl motion-safe:animate-rise", verdict.d > 0 ? "text-primary" : "text-muted-foreground")} data-testid="verdict">
                    <span className="eyebrow">{verdict.d > 0 ? "Treffer" : "Daneben"}</span>
                    {verdict.who} {verdict.d > 0 ? `+${verdict.d}` : verdict.d < 0 ? verdict.d : "±0"}
                  </p>
                )}
                {trailing && <p className="mt-2 text-sm italic text-champagne motion-safe:animate-slow-pulse">Comeback-Bonus aktiv · +1 pro Szene für {me}</p>}
              </div>
            );
          })()}

          {game.battle && state.secretMission && scene?.type !== "SHOWDOWN" && (
            <p className="mt-4 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground" data-testid="mission-active">
              <span className="font-display text-sm tracking-normal text-primary">N//</span>
              EINE GEHEIME MISSION LÄUFT · INHALT VERSIEGELT
            </p>
          )}

          {game.coop && <EnergyField energies={state.energies} milestones={state.milestones.length} />}

          {game.memory && state.anchors.some((a) => !a.used) && (
            <p className="mt-4 flex items-center gap-2 text-xs text-violet" aria-live="polite">
              <span className="relative inline-flex size-3"><span className="absolute inset-0 rounded-full border border-violet animate-ripple" /><span className="m-auto size-1 rounded-full bg-violet" /></span>
              Ein Echo formt sich · {state.anchors.filter((a) => !a.used).length}
            </p>
          )}

          {/* ONE//TWO stays pure type; PASS//THE AUX shows no waveform-like art in play, it would imply live audio. */}
          {game.id !== "one-two" && game.id !== "pass-the-aux" && (
            <GameArt art={game.art} steer={state.steer} status={status} scoreA={game.battle ? state.sparks[0] : undefined} scoreB={game.battle ? state.sparks[1] : undefined}
              energies={game.coop ? state.energies : undefined} sceneType={game.ai ? scene?.type : undefined} tempo={state.tempo}
              className="mt-5 h-16 opacity-80 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]" />
          )}
          {state.tempo && (
            <p className="mt-2 flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.2em] text-[var(--art-02-a)]" aria-live="polite">
              <span className="h-px flex-1 bg-[var(--art-02-a)]/50" aria-hidden />
              TEMPO SHIFT · {({ speed: "SPEED", silent: "STILLE", swap: "TAUSCH", rule: "REGEL" } as const)[state.tempo]} · NOCH {state.tempoLeft}
            </p>
          )}

          <div className="mt-8 flex flex-1 flex-col">
            {gated ? <CoupleAccessGate onBeforeAuth={() => stashPending(window.localStorage, state, settings)} /> : (<>
            {scene?.cue && (
              <p key={`cue-${state.sceneNumber}`} className="mb-3 font-display text-lg italic text-champagne animate-rise">{fill(scene.cue, me, you)}</p>
            )}
            {scene && (
              <div key={`stage-${state.sceneNumber}-${scene.id}`} className="scene-stage flex flex-1 flex-col" data-type={scene.type} data-source={scene.source ?? undefined} data-cut={game.ai && scene.id.startsWith("cut-") ? "" : undefined}>
              <SceneView
                key={`${state.sceneNumber}-${scene.id}`}
                scene={scene}
                me={me}
                you={you}
                memory={!!game.memory}
                director={!!game.ai}
                echoOf={(() => {
                  const a = scene.anchorId ? state.anchors.find((x) => x.id === scene.anchorId && x.sensitivity === "normal") : undefined;
                  return a ? { text: a.shortText, sceneNumber: a.sceneNumber, owner: a.owner } : undefined;
                })()}
                onDone={(p) => { haptic(); dispatch({ type: "DONE", ...p }); }}
                onSkip={() => { haptic(4); dispatch({ type: "SKIP" }); }}
                music={scene.type === "MUSIC" ? { round: state.musicRound ?? null, sceneNumber: state.sceneNumber, setRound: (round) => dispatch({ type: "MUSIC", round }) } : undefined}
                battle={
                  game.battle
                    ? {
                        players: state.players,
                        missionOwner: state.secretMission ? state.players[state.secretMission.player] : null,
                        missionText: state.secretMission ? fill(state.secretMission.text, state.players[state.secretMission.player], state.players[1 - state.secretMission.player]!) : null,
                        stakes: state.raise ? 6 : 3,
                        onWin: (w, missionDone) => dispatch({ type: "SHOWDOWN_WIN", winner: w, missionDone }),
                      }
                    : undefined
                }
              />
              </div>
            )}
            </>)}
          </div>

          {!gated && game.steering && (
            <nav className="mt-6 border-t border-line pt-4" aria-label="Nächste Szene steuern">
              <p className="eyebrow flex items-center justify-between">
                <span>Richtung der Nacht</span>
                {state.steer && (
                  <span className="flex items-center gap-1 normal-case" aria-label={`Wirkt noch ${state.steerLeft} Szenen`}>
                    {[0, 1, 2].map((i) => <span key={i} className={cn("inline-block h-px w-4", i < state.steerLeft ? "bg-champagne" : "bg-line")} />)}
                  </span>
                )}
              </p>
              <RouteLine steer={state.steer} left={state.steerLeft} />
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

          {!gated && game.battle && state.powerUps[state.turn] > 0 && scene && scene.type !== "SHOWDOWN" && (
            <section aria-label="Edge" className="mt-5 border-y border-line py-3">
              <p className="flex items-baseline justify-between font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground">
                <span>EDGE · {me.toUpperCase()}</span>
                <span className="text-champagne">{"◆".repeat(state.powerUps[state.turn])} {state.powerUps[state.turn]} {state.powerUps[state.turn] === 1 ? "Ladung" : "Ladungen"}</span>
              </p>
              <div className="mt-2 grid grid-cols-3 divide-x divide-line">
                {([
                  ["double", "×2", state.doubleNext ? "aktiv" : "diese Szene doppelt", state.doubleNext],
                  ["rebound", "Rebound", `an ${you}`, state.rebound !== null],
                  ["read", "Read", state.read !== null ? "Wette läuft" : `wetten: ${you} macht's`, state.read !== null],
                ] as const).map(([k, t, d, used]) => (
                  <button key={k} type="button" disabled={used} onClick={() => { haptic([6, 30, 6]); dispatch({ type: "USE_POWERUP", kind: k }); }}
                    data-armed={used || undefined} className="tap edge-slot flex min-h-14 flex-col items-start justify-center px-3 text-left first:pl-0 disabled:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className={cn("font-display text-2xl leading-none", used && "text-champagne")}>{t}</span>
                    <span className="mt-1 text-[0.7rem] leading-tight text-muted-foreground">{d}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {game.battle && state.rebound !== null && state.rebound !== state.turn && (
            <p className="mt-2 text-sm italic text-champagne">Zurückgespielt von {state.players[state.rebound]} · Skip bleibt ohne Punktverlust</p>
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
      <SaveSheet open={saveOpen} onOpenChange={setSaveOpen} slug={game.slug} />
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

const BEND: Record<string, number> = { funnier: -26, flirtier: 26, game: -12, hotter: 12 };
/** Night Shift: the chosen direction visibly bends the next three beats of the route. */
function RouteLine({ steer, left }: { steer: string | null; left: number }) {
  const d = steer ? BEND[steer] ?? 0 : 0;
  const pts = [0, 1, 2, 3].map((i) => [20 + i * 80, 30 + (i === 0 ? 0 : d * (left >= i ? 1 : 0.15) * (i / 3 + 0.4))]);
  const path = `M ${pts.map((p) => p.join(" ")).join(" L ")}`;
  return (
    <svg viewBox="0 0 280 60" className="mt-3 h-12 w-full overflow-visible" aria-hidden data-testid="route">
      <path d="M 20 30 L 260 30" stroke="var(--line)" strokeDasharray="2 6" fill="none" />
      <path key={steer ?? "none"} d={path} stroke="var(--champagne)" strokeWidth="1.5" fill="none" pathLength={1} className="route-draw" style={{ transition: "d 500ms ease" }} />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 ? 4 : 3} fill={i === 0 || (steer && i <= left) ? "var(--champagne)" : "var(--background)"} stroke="var(--champagne)" strokeWidth="1" />)}
    </svg>
  );
}
