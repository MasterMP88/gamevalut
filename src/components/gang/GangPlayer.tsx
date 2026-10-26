import { OptionalMechanics } from "./OptionalMechanics";
import type { GangOptionalMechanics } from "@/lib/gang/core/runtime";
import { GangGuide } from "./GangGuide";
import { TitleGallery } from "./TitleGallery";
import { TeamResults } from "./TeamResults";
import { PhotoCapture } from "./PhotoCapture";
import {
  createMissionNight,
  missionQueue,
  applyMissionEvent,
  resolveMissionNight,
  type MissionNight,
  type MissionReport,
} from "@/lib/gang/core/missions";
import { MissionDrawer, MissionFinale } from "./MissionDrawer";
/* GANG PLAYER — ONE PHONE / PASS mode. Pure presentation over the vendored core runtime:
   every state change goes through createGangRuntime / submitGangAction / advanceGangStage. */
import { recordSeen, seenIds } from "@/lib/content-history";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, X } from "lucide-react";
import {
  advanceGangStage,
  skipGangRound as skipCoreRound,
  answerChoiceOwners,
  canAdvanceGangStage,
  createGangRuntime,
  privateGangView,
  publicGangView,
  type GangRoundResolution,
  type GangRuntimePlayer,
  type GangRuntimeState,
} from "@/lib/gang/core/runtime";
import {
  getGangPlaybook,
  type GangGameId,
  type GangStageKind,
} from "@/lib/gang/core/playbooks";
import { fitsPlayers, gangGame, type GangGame } from "@/lib/gang/catalog";
import { btn } from "@/components/vault/Btn";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { MotifArt, hueVars } from "./MotifArt";
import { submitGangAction } from "@/lib/gang/core/runtime";
import { majorityResult, type MajorityResultData } from "@/lib/gang/majority";
export { majorityResult, type MajorityResultData };

const STAGE_LABEL: Record<GangStageKind, string> = {
  private: "Geheim",
  predict: "Tipp",
  answer: "Antwort",
  vote: "Abstimmung",
  perform: "Aktion",
  react: "Reaktion",
  reveal: "Reveal",
  score: "Punkte",
};
const NO_POINTS: GangGameId[] = ["the-line", "after-dark"];
const FINALE_TITLE: Partial<Record<GangGameId, string>> = {
  "the-majority": "Liest den Raum am besten",
  "whos-that": "Hat es zugegeben",
  undercover: "Bester Spürsinn",
  "secret-missions": "Agent der Nacht",
  "bad-answers-only": "Schlechteste beste Antworten",
  bluff: "Bestes Pokerface",
  "hot-seat": "Kennt die Runde am besten",
  "team-chaos": "Siegerteam",
  "photo-hunt": "Auge der Nacht",
  "draw-this": "Schnellste Augen",
  "music-drop": "DJ der Nacht",
  "chain-reaction": "Nie gerissen",
  "one-of-you": "Hat es gesehen",
  "panic-button": "Nervenstark",
};

/** Group stages: one shared screen, the room acts together on one phone. */
const isGroupStage = (g: GangGameId, s: GangStageKind) =>
  (g === "draw-this" && s === "answer") ||
  (g === "the-line" && s === "perform") ||
  (g === "team-chaos" && (s === "perform" || s === "react")) ||
  (g === "secret-missions" && s === "perform");

const PLAYER_VOTE_GAMES: GangGameId[] = [
  "whos-that",
  "undercover",
  "one-of-you",
];
const ANSWER_VOTE_GAMES: GangGameId[] = [
  "bad-answers-only",
  "music-drop",
  "photo-hunt",
  "bluff",
];

const hashOrder = (seed: string, v: string) => {
  let h = 0;
  for (const c of seed + v) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
};

export function GangPlayer({
  queue,
  rounds,
  players,
  onExit,
}: {
  queue: GangGameId[];
  rounds?: Record<string, number> | undefined;
  players: GangRuntimePlayer[];
  onExit: () => void;
}) {
  const playable = useMemo(
    () =>
      missionQueue(queue).filter((id) => {
        const g = gangGame(id);
        return g && fitsPlayers(g, players.length);
      }),
    [queue, players.length],
  );
  const skippedGames = Math.max(0, queue.length - playable.length);
  const [qi, setQi] = useState(0);
  const [missions, setMissions] = useState<MissionNight>();
  const [missionReport, setMissionReport] = useState<MissionReport>();
  const [rt, setRt] = useState<GangRuntimeState | null>(null);
  const [final, setFinal] = useState(false);
  const [done, setDone] = useState<string[]>([]); // players that submitted/skipped/saw in this stage (UI bookkeeping only)
  const [history, setHistory] = useState<GangRoundResolution[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [confirmExit, setConfirmExit] = useState(false);
  /** THE MAJORITY: own answers collected during the single predict turn, keyed round:player. Replayed at "answer". */
  const [ownAnswers, setOwnAnswers] = useState<Record<string, string>>({});
  const gameId = playable[qi];
  const game = gameId ? gangGame(gameId)! : undefined;

  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(
    () => () => {
      Object.values(photosRef.current).forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  useEffect(() => {
    if (rt) recordSeen([rt.round.prompt.id]);
  }, [rt?.round.id]);
  const missionPanel = missions ? (
    <MissionDrawer
      players={players}
      night={missions}
      onEvent={(playerId, kind, payload) =>
        setMissions((n) =>
          n
            ? applyMissionEvent(n, {
                id: crypto.randomUUID(),
                playerId,
                kind,
                at: Date.now(),
                ...payload,
              })
            : n,
        )
      }
    />
  ) : null;
  const finishNight = () => {
    if (missions) setMissionReport(resolveMissionNight(missions));
    else onExit();
  };
  if (missionReport)
    return (
      <Shell game={game} onExit={onExit}>
        <MissionFinale report={missionReport} />
        <button type="button" className={btn({ size: "lg" })} onClick={onExit}>
          Abend abschließen
        </button>
      </Shell>
    );
  if (!game || !gameId) {
    return (
      <Shell game={undefined} onExit={onExit}>
        <div className="flex flex-1 flex-col justify-center">
          <p className="font-mono text-xs tracking-[0.2em] text-signal">
            KEIN PASSENDES SPIEL
          </p>
          <h2 className="font-display mt-3 text-5xl leading-[0.9]">
            Für {players.length} Leute passt hier nichts.
          </h2>
          <button
            type="button"
            onClick={onExit}
            className={cn(
              btn({ size: "lg" }),
              "mt-10 bg-signal text-signal-foreground",
            )}
          >
            Zurück
          </button>
        </div>
      </Shell>
    );
  }

  const apply = (next: GangRuntimeState) => {
    if (
      next.gameId === "secret-missions" &&
      publicGangView(next).stage === "perform" &&
      missions
    ) {
      setRt(null);
      setFinal(false);
      setQi(qi + 1);
      setDone([]);
      return;
    }
    if (next.round.id !== rt?.round.id) {
      setOwnAnswers({});
      Object.values(photosRef.current).forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      setPhotos({});
    }
    if (next.round.resolution && next.round.resolution !== rt?.round.resolution)
      setHistory((h) => [...h, next.round.resolution!]);
    if (
      next.round.id !== rt?.round.id ||
      next.round.stageIndex !== rt?.round.stageIndex
    )
      setDone([]);
    setRt(next);
    if (next.finished) {
      haptic([20, 60, 40]);
      setFinal(true);
    }
  };
  const advance = (s: GangRuntimeState) =>
    apply(advanceGangStage(s, { force: !canAdvanceGangStage(s) }));
  const skipRound = () => {
    if (!rt) return;
    const s = skipCoreRound(rt);
    const res = s.round.resolution;
    if (res && res !== rt.round.resolution) setHistory((h) => [...h, res]);
    setDone([]);
    setOwnAnswers({});
    setRt(s);
  };
  const start = (optionalMechanics: GangOptionalMechanics = {}) => {
    haptic(12);
    setHistory([]);
    setFinal(false);
    setDone([]);
    setOwnAnswers({});
    recordSeen([`game/${gameId}`]);
    const seed = Math.floor(Math.random() * 2 ** 31),
      id = `${gameId}-${Date.now()}`;
    let created = createGangRuntime({
      targetRounds: rounds?.[gameId],
      optionalMechanics,
      seenPromptIds: seenIds(),
      interactionMode: "one-phone",
      id,
      gameId,
      players,
      seed,
    });
    if (gameId === "secret-missions") {
      const n = createMissionNight(id, players, seed, seenIds(), Date.now());
      setMissions(n);
      setMissionReport(undefined);
      created = {
        ...created,
        round: {
          ...created.round,
          privateByPlayer: Object.fromEntries(
            players.map((p) => [
              p.id,
              { role: "AGENT", mission: n.assignments[p.id]!.text },
            ]),
          ),
        },
      };
      recordSeen(Object.values(n.assignments).map((m) => m.id));
    }
    setRt(created);
  };
  const nextGame = () => {
    setOwnAnswers({});
    setRt(null);
    setFinal(false);
    setHistory([]);
    setQi(qi + 1);
  };

  if (!rt)
    return (
      <Shell game={game} onExit={onExit}>
        <Intro
          game={game}
          index={qi}
          total={playable.length}
          players={players.length}
          rounds={rounds?.[gameId]}
          skippedGames={qi === 0 ? skippedGames : 0}
          onStart={start}
        />
        {missionPanel}
      </Shell>
    );
  if (final)
    return (
      <Shell game={game} onExit={onExit}>
        <Finale
          game={game}
          rt={rt}
          history={history}
          next={playable[qi + 1] ? gangGame(playable[qi + 1]!) : undefined}
          onNext={nextGame}
          onAgain={start}
          onExit={finishNight}
        />
        {missionPanel}
      </Shell>
    );

  const view = publicGangView(rt);
  const stage = view.stage;
  const subs = rt.round.stageSubmissions[rt.round.stageIndex] ?? {};
  const name = (id: string) => rt.players.find((p) => p.id === id)?.name ?? id;

  // Who still needs the phone in this stage?
  let pending: string[] = [];
  if (stage === "private" && !["hot-seat", "after-dark"].includes(gameId)) {
    const viewers = rt.players
      .filter((p) => {
        const pv = privateGangView(rt, p.id);
        if (!pv) return false;
        if (gameId === "draw-this") return !!pv.active;
        return true;
      })
      .map((p) => p.id);
    pending = viewers.filter((id) => !done.includes(id));
  } else if (
    stage !== "reveal" &&
    stage !== "score" &&
    !isGroupStage(gameId, stage)
  ) {
    pending = view.requiredPlayerIds.filter(
      (id) => !subs[id] && !done.includes(id),
    );
  }
  const current = pending[0];
  const markDone = (id: string) => {
    const nextDone = [...done, id];
    setDone(nextDone);
  };
  // When everybody had their turn, advance automatically to the next stage.
  const majorityReplay = gameId === "the-majority" && stage === "answer";
  const allDone =
    majorityReplay ||
    (stage !== "reveal" &&
      stage !== "score" &&
      !isGroupStage(gameId, stage) &&
      pending.length === 0);
  /** Replay cached own answers into the canonical answer stage, then advance (missing = skipped). */
  const replayMajority = (s: GangRuntimeState) => {
    let n = s;
    for (const id of publicGangView(s).requiredPlayerIds) {
      const own = ownAnswers[`${s.round.id}:${id}`];
      if (own) {
        try {
          n = submitGangAction(n, { playerId: id, optionId: own, value: own });
        } catch {
          /* invalid → skipped */
        }
      }
    }
    advance(n);
  };

  return (
    <Shell
      game={game}
      onExit={() => setConfirmExit(true)}
      header={<StageHeader game={game} rt={rt} stage={stage} />}
    >
      {missionPanel}
      {allDone ? (
        <AutoAdvance
          key={`${view.id}-${view.stageIndex}`}
          onGo={() => (majorityReplay ? replayMajority(rt) : advance(rt))}
        />
      ) : stage === "reveal" ? (
        <RevealGate
          game={game}
          onReveal={() => {
            haptic([10, 40, 30]);
            advance(rt);
          }}
          prompt={view.prompt === "PRIVATE ROUND" ? undefined : view.prompt}
        />
      ) : stage === "score" ? (
        <ScoreView game={game} rt={rt} onNext={() => advance(rt)} />
      ) : isGroupStage(gameId, stage) ? (
        <GroupStage
          key={`${view.id}-${view.stageIndex}`}
          game={game}
          rt={rt}
          stage={stage}
          onSubmit={(next) => advance(next)}
        />
      ) : current ? (
        <PassTurn
          key={`${view.id}-${view.stageIndex}-${current}`}
          game={game}
          rt={rt}
          stage={stage}
          playerId={current}
          name={name(current)}
          left={pending.length}
          photos={photos}
          onPhoto={(url) => setPhotos((p) => ({ ...p, [current]: url }))}
          onOwnAnswer={(o) =>
            setOwnAnswers((m) => ({ ...m, [`${rt.round.id}:${current}`]: o }))
          }
          onSubmit={(next) => {
            haptic(8);
            if (next) setRt(next);
            markDone(current);
          }}
          onSkip={() => {
            haptic(4);
            markDone(current);
          }}
        />
      ) : null}
      {stage !== "score" && (
        <button
          type="button"
          onClick={skipRound}
          className="tap mx-auto mt-4 flex min-h-11 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Runde überspringen
        </button>
      )}
      {confirmExit && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="exit-h"
          className="fixed inset-0 z-[60] flex items-end bg-room/90 p-4 backdrop-blur safe-bottom sm:items-center sm:justify-center"
        >
          <div className="w-full max-w-md border-t-2 border-signal bg-room p-6">
            <h2 id="exit-h" className="font-display text-4xl leading-none">
              Spiel verlassen?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Der Spielstand dieser Runde wird nicht gespeichert.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={onExit}
                className={cn(
                  btn({ size: "lg" }),
                  "bg-signal text-signal-foreground",
                )}
              >
                Verlassen
              </button>
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className={btn({ variant: "ghost", size: "lg" })}
              >
                Weiterspielen
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function AutoAdvance({ onGo }: { onGo: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      onGo();
    }
  }, [onGo]);
  return <div className="flex-1" aria-hidden />;
}

function Shell({
  game,
  onExit,
  header,
  children,
}: {
  game: GangGame | undefined;
  onExit: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={game ? `${game.title} – GANG MODE` : "GANG MODE"}
      data-signature={game?.signature}
      style={game ? hueVars(game.hue) : undefined}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden bg-room text-foreground safe-x safe-top safe-bottom"
    >
      {game && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(90% 60% at 100% 0%, var(--g-deep), transparent 65%)",
          }}
        />
      )}
      {game && (
        <MotifArt
          motif={game.motif}
          className="pointer-events-none fixed -right-6 top-20 w-56 opacity-[0.12]"
        />
      )}
      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col py-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <span className="truncate font-mono text-xs tracking-[0.2em] text-[var(--g,var(--signal))]">
            {game ? game.title : "GANG MODE"}
          </span>
          <button
            type="button"
            aria-label="Spiel verlassen"
            onClick={onExit}
            className="tap flex size-11 shrink-0 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
        {header}
        <div className="flex flex-1 flex-col pb-4">{children}</div>
      </div>
    </div>
  );
}

function StageHeader({
  game,
  rt,
  stage,
}: {
  game: GangGame;
  rt: GangRuntimeState;
  stage: GangStageKind;
}) {
  return (
    <div className="mt-1">
      <p className="font-mono text-xs tracking-[0.15em] text-muted-foreground">
        RUNDE {rt.roundNumber}/{rt.targetRounds} ·{" "}
        <span className="text-[var(--g)]">
          {STAGE_LABEL[stage].toUpperCase()}
        </span>
      </p>
      <div
        className="mt-2 flex gap-1"
        aria-label={`Phase ${rt.round.stageIndex + 1} von ${rt.round.stages.length}`}
      >
        {rt.round.stages.map((s, i) => (
          <span
            key={i}
            className={cn(
              "h-0.5 flex-1 transition-colors duration-500",
              i <= rt.round.stageIndex ? "bg-[var(--g)]" : "bg-line",
            )}
          />
        ))}
      </div>
      <span className="sr-only">{game.title}</span>
    </div>
  );
}

function Intro({
  game,
  index,
  total,
  players,
  rounds,
  skippedGames,
  onStart,
}: {
  game: GangGame;
  index: number;
  total: number;
  players: number;
  rounds?: number | undefined;
  skippedGames: number;
  onStart: (optionalMechanics: GangOptionalMechanics) => void;
}) {
  const pb = getGangPlaybook(game.id)!;
  const adult = game.id === "after-dark";
  const [age, setAge] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [optionalMechanics, setOptionalMechanics] =
    useState<GangOptionalMechanics>({});
  const ok = !adult || (age && optIn);
  return (
    <div className="flex flex-1 flex-col motion-safe:animate-rise">
      {total > 1 && (
        <p className="mt-6 font-mono text-xs tracking-[0.2em] text-signal">
          SPIEL {index + 1} VON {total}
        </p>
      )}
      {skippedGames > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {skippedGames} {skippedGames === 1 ? "Spiel passt" : "Spiele passen"}{" "}
          nicht zu {players} Leuten und {skippedGames === 1 ? "wird" : "werden"}{" "}
          übersprungen.
        </p>
      )}
      <MotifArt motif={game.motif} className="mt-8 w-32" />
      <h2 className="font-display mt-6 text-[clamp(3rem,15vw,5.5rem)] leading-[0.85] tracking-tight">
        {game.title}
      </h2>
      <p className="mt-4 text-lg text-foreground/90">{pb.promise}</p>
      <p className="mt-3 text-sm text-muted-foreground">{pb.howItFeels}</p>
      <p className="mt-4 font-mono text-xs tracking-[0.15em] text-muted-foreground">
        {rounds ?? (game.id === "hot-seat" ? players : pb.rounds[0])} RUNDEN ·{" "}
        {players} SPIELER · ONE PHONE
      </p>
      <details className="mt-5 border-y border-line py-2">
        <summary className="tap flex min-h-12 cursor-pointer items-center text-sm">
          Kurze Spielanleitung
        </summary>
        <div className="py-4">
          <GangGuide id={game.id} compact deviceRules />
        </div>
      </details>
      {pb.safetyNote && (
        <p className="mt-4 border-l-2 border-[var(--g)] pl-3 text-sm text-foreground/85">
          {pb.safetyNote}
        </p>
      )}
      {adult && (
        <div className="mt-6 grid gap-2">
          <label className="tap flex min-h-12 items-center gap-3 border-b border-line text-base">
            <input
              type="checkbox"
              checked={age}
              onChange={(e) => setAge(e.target.checked)}
              className="size-5 accent-[var(--g)]"
            />
            Alle in dieser Runde sind 18 oder älter.
          </label>
          <label className="tap flex min-h-12 items-center gap-3 border-b border-line text-base">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="size-5 accent-[var(--g)]"
            />
            Wir wollen Spicy – jede:r darf jederzeit ohne Begründung skippen.
          </label>
        </div>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Ein Handy geht reihum. Bei geheimen Phasen sagt der Bildschirm, wer dran
        ist.
      </p>
      <OptionalMechanics
        games={[game.id]}
        value={optionalMechanics}
        onChange={setOptionalMechanics}
      />
      <button
        type="button"
        disabled={!ok}
        onClick={() => onStart(optionalMechanics)}
        className={cn(
          btn({ size: "lg" }),
          "mt-auto w-full bg-signal text-signal-foreground hover:bg-signal/90",
        )}
      >
        Los geht's
      </button>
    </div>
  );
}

/** Hold-to-reveal (or tap to toggle) secret. Hidden by default; gone when the component unmounts. */
export function Secret({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-6">
      <button
        type="button"
        aria-pressed={show}
        onPointerDown={() => {
          setShow(true);
          haptic(6);
        }}
        onPointerUp={() => setShow(false)}
        onPointerLeave={() => setShow(false)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setShow((s) => !s);
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="tap relative flex min-h-44 w-full select-none flex-col items-center justify-center overflow-hidden border border-[var(--g)] bg-[var(--g-deep)] p-6 text-center"
        data-testid="secret"
      >
        {show ? (
          <span className="motion-safe:animate-rise">{children}</span>
        ) : (
          <span className="flex flex-col items-center gap-2 text-foreground/80">
            <Eye className="size-6" aria-hidden />
            <span className="font-mono text-xs tracking-[0.2em]">{label}</span>
            <span className="text-sm text-muted-foreground">
              Gedrückt halten zum Aufdecken
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

function Prompt({
  children,
  game,
}: {
  children: React.ReactNode;
  game: GangGame;
}) {
  return (
    <h2
      className={cn(
        "font-display mt-8 leading-[0.95] tracking-tight",
        game.signature === "pressure"
          ? "text-[clamp(2.6rem,11vw,4rem)]"
          : "text-[clamp(2.2rem,9vw,3.4rem)]",
      )}
    >
      {children}
    </h2>
  );
}

export function Timer({
  seconds,
  game,
  onTimeout,
  deadlineAt,
  serverNow,
}: {
  seconds: number;
  game: GangGame;
  onTimeout?: (() => void) | undefined;
  deadlineAt?: string | null | undefined;
  serverNow?: string | undefined;
}) {
  const fired = useRef(false);
  const callback = useRef(onTimeout);
  callback.current = onTimeout;
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const remaining = deadlineAt
      ? Math.max(
          0,
          Date.parse(deadlineAt) -
            (serverNow ? Date.parse(serverNow) : Date.now()),
        )
      : seconds * 1000;
    const end = performance.now() + remaining;
    const tick = () => {
      const n = Math.max(0, Math.ceil((end - performance.now()) / 1000));
      setLeft(n);
      if (n === 0 && !fired.current) {
        fired.current = true;
        haptic([40, 60, 120]);
        callback.current?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [deadlineAt, seconds]);
  const pressure = game.signature === "pressure";
  return (
    <div
      className="mt-6"
      role="timer"
      aria-live="polite"
      aria-label={left > 0 ? `Noch ${left} Sekunden` : "Zeit ist um"}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-line",
          pressure ? "h-3" : "h-1",
        )}
      >
        <span
          className="absolute inset-y-0 left-0 bg-[var(--g)] transition-[width] duration-1000 ease-linear"
          style={{ width: `${(left / seconds) * 100}%` }}
        />
      </div>
      <p
        className={cn(
          "mt-2 font-display tabular-nums",
          pressure ? "text-6xl" : "text-3xl",
          left <= 3 && "text-primary motion-safe:animate-slow-pulse",
        )}
      >
        {left > 0 ? left : "Zeit!"}
      </p>
    </div>
  );
}

function OptionRows({
  options,
  label,
  onPick,
  game,
}: {
  options: string[];
  label: (o: string) => React.ReactNode;
  onPick: (o: string) => void;
  game: GangGame;
}) {
  const [pick, setPick] = useState<string | null>(null);
  return (
    <>
      <div
        role="radiogroup"
        className={cn(
          "mt-6 border-t border-line",
          game.signature === "point" && "grid grid-cols-2 gap-px border-t-0",
        )}
      >
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={pick === o}
            onClick={() => {
              haptic(5);
              setPick(o);
            }}
            className={cn(
              "tap relative flex min-h-16 w-full items-center gap-4 border-b border-line py-3 pl-1 text-left transition-colors",
              game.signature === "point" && "min-h-20 border bg-room px-3",
              pick !== null && pick !== o && "opacity-45",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[var(--g)] transition-transform duration-300",
                pick === o && "scale-y-100",
              )}
              aria-hidden
            />
            <span className="w-7 shrink-0 pl-2 font-mono text-xs text-muted-foreground">
              {game.signature === "point"
                ? "→"
                : String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 font-display text-2xl leading-tight">
              {label(o)}
            </span>
            {pick === o && (
              <Check className="size-5 shrink-0 text-[var(--g)]" aria-hidden />
            )}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={pick === null}
        onClick={() => pick !== null && onPick(pick)}
        className={cn(
          btn({ size: "lg" }),
          "mt-6 w-full bg-signal text-signal-foreground hover:bg-signal/90",
        )}
      >
        {pick === null ? "Erst wählen" : "Abgeben · weitergeben"}
      </button>
    </>
  );
}

function PassTurn({
  game,
  rt,
  stage,
  playerId,
  name,
  left,
  photos,
  onPhoto,
  onOwnAnswer,
  onSubmit,
  onSkip,
}: {
  game: GangGame;
  rt: GangRuntimeState;
  stage: GangStageKind;
  playerId: string;
  name: string;
  left: number;
  photos: Record<string, string>;
  onPhoto: (url: string) => void;
  onOwnAnswer: (option: string) => void;
  onSubmit: (next: GangRuntimeState | null) => void;
  onSkip: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const view = publicGangView(rt);
  const pv = privateGangView(rt, playerId);
  const gid = game.id;
  const hidden = view.prompt === "PRIVATE ROUND";

  if (!ready) {
    return (
      <div
        className="flex flex-1 flex-col justify-center motion-safe:animate-rise"
        data-testid="curtain"
      >
        <p className="font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          {game.private || stage === "vote" || stage === "predict"
            ? "PRIVAT · NICHT HINSEHEN"
            : "DU BIST DRAN"}
        </p>
        <h2 className="font-display mt-3 text-[clamp(2.6rem,12vw,4.5rem)] leading-[0.9]">
          Gib das Handy an <em className="text-[var(--g)]">{name}</em>.
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          {left === 1
            ? "Letzte Person in dieser Phase."
            : `Noch ${left} in dieser Phase.`}
        </p>
        <button
          type="button"
          onClick={() => {
            haptic(10);
            setReady(true);
          }}
          className={cn(
            btn({ size: "lg" }),
            "mt-10 w-full bg-signal text-signal-foreground hover:bg-signal/90",
          )}
        >
          Ich bin {name}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className={cn(btn({ variant: "ghost", size: "lg" }), "mt-2 w-full")}
        >
          {name} überspringen
        </button>
      </div>
    );
  }

  const submit = (
    a:
      | import("@/lib/gang/core/runtime").GangRuntimeAction
      | Omit<import("@/lib/gang/core/runtime").GangRuntimeAction, "playerId">,
  ) => {
    try {
      onSubmit(submitGangAction(rt, { ...a, playerId, at: Date.now() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte prüfe deine Antwort.");
    }
  };
  const head = (
    <p className="mt-6 font-mono text-xs tracking-[0.2em] text-muted-foreground">
      NUR FÜR {name.toUpperCase()}
    </p>
  );

  if (gid === "after-dark" && stage === "private")
    return (
      <div className="flex flex-1 flex-col">
        {head}
        <Prompt game={game}>Deine Entscheidung zählt.</Prompt>
        <p className="mt-4 text-muted-foreground">{pv?.prompt}</p>
        <button
          type="button"
          onClick={() => submit({ success: true })}
          className={cn(btn({ size: "lg" }), "mt-auto w-full")}
        >
          Ich bin 18+ und möchte mitspielen
        </button>
        <button
          type="button"
          onClick={() => submit({ success: false })}
          className={cn(btn({ variant: "ghost", size: "lg" }), "mt-2 w-full")}
        >
          Heute lieber zuschauen
        </button>
      </div>
    );
  if (gid === "after-dark" && stage === "perform")
    return (
      <div className="flex flex-1 flex-col">
        {head}
        <Prompt game={game}>{pv?.prompt ?? view.prompt}</Prompt>
        <button
          type="button"
          onClick={() => submit({ success: true })}
          className={cn(btn({ size: "lg" }), "mt-auto w-full")}
        >
          Für mich passt's · weiter
        </button>
        <button
          type="button"
          onClick={() => submit({ success: false })}
          className={cn(btn({ variant: "ghost", size: "lg" }), "mt-2 w-full")}
        >
          Auslassen · ohne Begründung
        </button>
      </div>
    );
  // PRIVATE stage: show the personal payload, then hand back.
  if (stage === "private" && gid !== "hot-seat") {
    return (
      <div className="flex flex-1 flex-col">
        {head}
        <Prompt game={game}>
          {gid === "secret-missions"
            ? "Dein versiegelter Auftrag."
            : gid === "draw-this"
              ? "Dein Begriff."
              : "Deine geheime Info."}
        </Prompt>
        <Secret label={gid === "secret-missions" ? "VERSIEGELT" : "GEHEIM"}>
          {pv?.role && gid !== "undercover" && (
            <span className="block font-mono text-xs tracking-[0.2em] text-[var(--g)]">
              {pv.role === "AGENT"
                ? "AGENT"
                : pv.role === "WORD"
                  ? "DEIN WORT"
                  : ["ODD", "ROOM", "QUESTION"].includes(pv.role)
                    ? "DEINE FRAGE"
                    : pv.role}
            </span>
          )}
          {pv?.secret && (
            <span className="mt-2 block font-display text-5xl leading-none">
              {pv.secret}
            </span>
          )}
          {pv?.mission && (
            <span className="mt-2 block font-display text-3xl leading-tight">
              {pv.mission}
            </span>
          )}
          {pv?.prompt && (
            <span className="mt-3 block text-sm text-foreground/85">
              {pv.prompt}
            </span>
          )}
        </Secret>
        <p className="mt-4 text-sm text-muted-foreground">
          Merk es dir. Danach verschwindet es wieder.
        </p>
        <button
          type="button"
          onClick={() => onSubmit(null)}
          className={cn(
            btn({ size: "lg" }),
            "mt-auto w-full bg-signal text-signal-foreground hover:bg-signal/90",
          )}
        >
          Gemerkt · weitergeben
        </button>
      </div>
    );
  }

  // THE MAJORITY: question once, tip + own choice in one private turn.
  if (gid === "the-majority" && stage === "predict") {
    return (
      <div className="flex flex-1 flex-col">
        {head}
        <MajorityDual
          game={game}
          prompt={view.prompt}
          subline={view.subline}
          options={(view.options ?? []).map((o) => ({ key: o, label: o }))}
          cta="Beides abgeben · weitergeben"
          onSubmit={(tip, own) => {
            onOwnAnswer(own);
            submit({ optionId: tip, value: tip });
          }}
        />
      </div>
    );
  }

  // Options and labels
  const opts = view.options ?? [];
  const isPlayerOpts =
    opts.length > 0 &&
    opts.every((o) => o === "__truth__" || rt.players.some((p) => p.id === o));
  const sourceStage = gid === "photo-hunt" ? "perform" : "answer";
  const srcIdx = rt.round.stages.indexOf(sourceStage);
  const answers = srcIdx >= 0 ? (rt.round.stageSubmissions[srcIdx] ?? {}) : {};
  const voteLabel = (o: string): React.ReactNode => {
    if (o === "__truth__") return rt.round.prompt.answer ?? "";
    if (stage === "vote" && ANSWER_VOTE_GAMES.includes(gid)) {
      const v = answers[o]?.value ?? "";
      if (gid === "photo-hunt" && photos[o])
        return (
          <span className="flex items-center gap-3">
            <img src={photos[o]} alt="" className="size-14 object-cover" />
            {v}
          </span>
        );
      return v;
    }
    return o === "__skip__"
      ? "Tipp auslassen"
      : (rt.players.find((p) => p.id === o)?.name ?? o);
  };
  let shown =
    gid === "the-line" && stage === "predict"
      ? opts.filter((o) => o !== playerId)
      : opts;
  if (stage === "vote" && isPlayerOpts) {
    if (
      ANSWER_VOTE_GAMES.includes(gid) ||
      gid === "undercover" ||
      gid === "one-of-you" ||
      gid === "whos-that"
    )
      shown = opts.filter((o) => o !== playerId);
    // anonymise: never in submission order, never with author
    if (ANSWER_VOTE_GAMES.includes(gid))
      shown = shown
        .filter((o) => !answerChoiceOwners(rt, o).includes(playerId))
        .sort((a, b) => hashOrder(rt.round.id, a) - hashOrder(rt.round.id, b));
  }
  const promptText = hidden
    ? gid === "draw-this"
      ? "Was wird da gezeichnet?"
      : stage === "vote"
        ? gid === "undercover"
          ? "Wer hat das andere Wort?"
          : "Wer hatte die andere Frage?"
        : "Deine Antwort – passend zu deiner geheimen Info."
    : view.prompt;

  return (
    <div className="flex flex-1 flex-col">
      {head}
      {gid === "hot-seat" && stage === "private" && (
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          HOT SEAT · GEHEIME ECHTE ANTWORT
        </p>
      )}
      {gid === "hot-seat" && stage === "predict" && (
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          WAS HAT{" "}
          {rt.players
            .find((p) => p.id === rt.round.activePlayerId)
            ?.name.toUpperCase()}{" "}
          GEWÄHLT?
        </p>
      )}
      {gid === "bluff" && stage === "answer" && (
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          ERFINDE EINE GLAUBWÜRDIGE FALSCHE ANTWORT
        </p>
      )}
      {gid === "the-majority" && stage === "predict" && (
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          TIPP: WAS WÄHLT DIE MEHRHEIT?
        </p>
      )}
      {gid === "the-majority" && stage === "answer" && (
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          UND DU SELBST?
        </p>
      )}
      <Prompt game={game}>
        {["chain-reaction", "panic-button"].includes(gid) && pv?.prompt
          ? pv.prompt
          : promptText}
      </Prompt>
      {error && (
        <p role="alert" className="mt-3 text-primary">
          {error}
        </p>
      )}
      {view.subline && !hidden && (
        <p className="mt-3 text-muted-foreground">{view.subline}</p>
      )}
      {hidden &&
        stage === "answer" &&
        pv &&
        (pv.secret || pv.prompt) &&
        gid !== "draw-this" && (
          <Secret label="DEINE INFO">
            {pv.secret && (
              <span className="block font-display text-5xl leading-none">
                {pv.secret}
              </span>
            )}
            {gid === "one-of-you" && pv.prompt && (
              <span className="block font-display text-3xl leading-tight">
                {pv.prompt}
              </span>
            )}
          </Secret>
        )}
      {gid === "draw-this" && stage === "perform" && pv?.secret && (
        <Secret label="DEIN BEGRIFF">
          <span className="block font-display text-5xl leading-none">
            {pv.secret}
          </span>
        </Secret>
      )}
      {view.seconds !== undefined &&
        (stage === "react" ||
          (stage === "perform" &&
            !["chain-reaction", "panic-button"].includes(gid))) && (
          <Timer
            seconds={view.seconds}
            game={game}
            onTimeout={
              stage === "react" ? () => submit({ timedOut: true }) : undefined
            }
          />
        )}

      {["chain-reaction", "panic-button"].includes(gid) &&
      stage === "perform" ? (
        <button
          type="button"
          onClick={() => submit({ success: true })}
          className={cn(btn({ size: "lg" }), "mt-auto w-full")}
        >
          Bereit · Timer starten
        </button>
      ) : gid === "draw-this" && stage === "perform" ? (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            Zeichne auf Papier, Serviette oder in die Luft – ohne Buchstaben
            oder Zahlen.
          </p>
          <div className="mt-auto grid gap-2 pt-6">
            <button
              type="button"
              onClick={() => submit({ success: true })}
              className={cn(
                btn({ size: "lg" }),
                "w-full bg-signal text-signal-foreground",
              )}
            >
              Gezeichnet
            </button>
          </div>
        </>
      ) : shown.length > 0 && stage !== "react" ? (
        <OptionRows
          game={game}
          options={shown}
          label={voteLabel}
          onPick={(o) =>
            isPlayerOpts
              ? submit({ targetPlayerId: o, value: o })
              : submit({ optionId: o, value: o })
          }
        />
      ) : shown.length > 0 ? (
        <OptionRows
          game={game}
          options={shown}
          label={(o) => o}
          onPick={(o) => submit({ value: o })}
        />
      ) : gid === "music-drop" ? (
        <TrackForm onSubmit={(v) => submit({ value: v })} />
      ) : (
        <TextAnswer
          game={game}
          stage={stage}
          photo={
            gid === "photo-hunt"
              ? { url: photos[playerId], onPhoto }
              : undefined
          }
          onSubmit={(v, noFaces) =>
            submit({
              value: v,
              ...(photos[playerId]
                ? { photoId: playerId, noFaces: !!noFaces }
                : {}),
            })
          }
        />
      )}
    </div>
  );
}

const inputCls =
  "mt-6 min-h-14 w-full border-0 border-b-2 border-line bg-transparent px-1 font-display text-3xl text-foreground placeholder:text-muted-foreground/50 focus:border-[var(--g)] focus:outline-none";

function TextAnswer({
  game,
  stage,
  photo,
  onSubmit,
}: {
  game: GangGame;
  stage: GangStageKind;
  photo?: { url: string | undefined; onPhoto: (u: string) => void } | undefined;
  onSubmit: (v: string, noFaces?: boolean) => void;
}) {
  const [noFaces, setNoFaces] = useState(false);
  const [v, setV] = useState("");
  const ph =
    game.id === "photo-hunt"
      ? "Was zeigt dein Foto?"
      : stage === "react"
        ? "Erstes Wort, das kommt"
        : game.id === "bad-answers-only"
          ? "Die schlechteste beste Antwort"
          : "Deine Antwort";
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSubmit(v.trim(), noFaces);
      }}
    >
      <label className="sr-only" htmlFor="gang-answer">
        {ph}
      </label>
      <input
        id="gang-answer"
        autoFocus
        autoComplete="off"
        maxLength={80}
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={ph}
        className={inputCls}
        style={{ fontSize: "max(16px, 1.75rem)" }}
      />
      {photo && <PhotoCapture value={photo.url} onChange={photo.onPhoto} />}
      {photo?.url && (
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={noFaces}
            onChange={(e) => setNoFaces(e.target.checked)}
          />
          Keine erkennbaren Gesichter (+1).
        </label>
      )}
      <button
        type="submit"
        disabled={!v.trim()}
        className={cn(
          btn({ size: "lg" }),
          "mt-auto w-full bg-signal text-signal-foreground hover:bg-signal/90",
        )}
      >
        Abgeben · weitergeben
      </button>
    </form>
  );
}

function TrackForm({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [t, setT] = useState("");
  const [a, setA] = useState("");
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (t.trim())
          onSubmit(a.trim() ? `${t.trim()} — ${a.trim()}` : t.trim());
      }}
    >
      <label className="sr-only" htmlFor="gang-title">
        Songtitel
      </label>
      <input
        id="gang-title"
        autoFocus
        autoComplete="off"
        maxLength={60}
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder="Songtitel"
        className={inputCls}
        style={{ fontSize: "max(16px, 1.75rem)" }}
      />
      <label className="sr-only" htmlFor="gang-artist">
        Artist (optional)
      </label>
      <input
        id="gang-artist"
        autoComplete="off"
        maxLength={60}
        value={a}
        onChange={(e) => setA(e.target.value)}
        placeholder="Artist (optional)"
        className={cn(inputCls, "text-xl")}
        style={{ fontSize: "max(16px, 1.25rem)" }}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Nur eingetippt – kein Musikdienst nötig.
      </p>
      <button
        type="submit"
        disabled={!t.trim()}
        className={cn(
          btn({ size: "lg" }),
          "mt-auto w-full bg-signal text-signal-foreground hover:bg-signal/90",
        )}
      >
        Track versiegeln · weitergeben
      </button>
    </form>
  );
}

function GroupStage({
  game,
  rt,
  stage,
  onSubmit,
}: {
  game: GangGame;
  rt: GangRuntimeState;
  stage: GangStageKind;
  onSubmit: (s: GangRuntimeState) => void;
}) {
  const view = publicGangView(rt);
  const gid = game.id;
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const [drawStarted, setDrawStarted] = useState(false);
  const [drawExpired, setDrawExpired] = useState(false);
  const all = (fn: (id: string) => boolean | undefined) => {
    let s = rt;
    for (const id of view.requiredPlayerIds) {
      const success = fn(id);
      s = submitGangAction(s, {
        playerId: id,
        ...(success === undefined ? {} : { success }),
      });
    }
    onSubmit(s);
  };
  const teamOf = (id: string) => rt.players.find((p) => p.id === id)?.teamId;
  if (gid === "draw-this") {
    const artist = rt.players.find((p) => p.id === rt.round.activePlayerId);
    const finish = (id?: string) => {
      let n = rt;
      if (id)
        n = submitGangAction(n, {
          playerId: id,
          value: rt.round.prompt.answer!,
          at: Date.now(),
        });
      onSubmit(n);
    };
    return (
      <div className="flex flex-1 flex-col">
        <Prompt game={game}>
          {artist?.name} zeichnet. Alle anderen raten laut.
        </Prompt>
        <p className="mt-4 text-muted-foreground">
          Ohne Buchstaben, Zahlen oder gesprochene Hinweise. Zeichnet auf Papier
          und zeigt es allen. Wählt anschließend die zuerst richtige Person.
        </p>
        {!drawStarted ? (
          <button
            type="button"
            className={cn(btn({ size: "lg" }), "mt-auto")}
            onClick={() => setDrawStarted(true)}
          >
            Alle bereit · Timer starten
          </button>
        ) : (
          <>
            <Timer
              seconds={view.seconds ?? 45}
              game={game}
              onTimeout={() => setDrawExpired(true)}
            />
            <p className="mt-4 font-mono text-sm">
              {drawExpired
                ? "ZEIT VORBEI · WER WAR RECHTZEITIG RICHTIG?"
                : "WER HATTE ES ZUERST?"}
            </p>
            <div className="mt-4 grid gap-2">
              {rt.players
                .filter((p) => p.id !== artist?.id)
                .map((p) => (
                  <button
                    key={p.id}
                    className={btn({ size: "lg" })}
                    onClick={() => finish(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
            <button
              type="button"
              className={cn(btn({ variant: "ghost", size: "lg" }), "mt-4")}
              onClick={() => finish()}
            >
              Niemand · auflösen
            </button>
          </>
        )}
      </div>
    );
  }
  if (gid === "secret-missions") {
    return (
      <div className="flex flex-1 flex-col">
        <p className="mt-6 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          MISSIONEN LAUFEN · INHALT VERSIEGELT
        </p>
        <Prompt game={game}>
          Spielt den Abend. Wer hat die eigene Mission geschafft?
        </Prompt>
        <p className="mt-3 text-sm text-muted-foreground">
          Ehrlich abhaken. Die Aufträge selbst sieht der Raum erst beim Reveal.
        </p>
        <ul className="mt-6 border-t border-line">
          {rt.players.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={!!ok[p.id]}
                onClick={() => {
                  haptic(5);
                  setOk({ ...ok, [p.id]: !ok[p.id] });
                }}
                className="tap flex min-h-14 w-full items-center justify-between border-b border-line text-left font-display text-2xl"
              >
                {p.name}
                <span
                  className={cn(
                    "font-mono text-xs tracking-[0.15em]",
                    ok[p.id] ? "text-[var(--g)]" : "text-muted-foreground",
                  )}
                >
                  {ok[p.id] ? "ERFÜLLT ✓" : "OFFEN"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => all((id) => !!ok[id])}
          className={cn(
            btn({ size: "lg" }),
            "mt-auto w-full bg-signal text-signal-foreground",
          )}
        >
          Missionen aufdecken
        </button>
      </div>
    );
  }
  if (gid === "team-chaos" && stage === "react")
    return (
      <div className="flex flex-1 flex-col">
        <Prompt game={game}>{view.prompt}</Prompt>
        <TeamResults
          metric={rt.round.prompt.teamChallenge?.metric ?? "Treffer"}
          max={rt.round.prompt.teamChallenge?.maxResult ?? 30}
          onSubmit={(results) => {
            let n = rt;
            for (const id of view.requiredPlayerIds)
              n = submitGangAction(n, {
                playerId: id,
                quantity: results[teamOf(id) ?? "A"]!,
              });
            onSubmit(n);
          }}
        />
      </div>
    );
  if (gid === "team-chaos") {
    const teams = (["A", "B"] as const).map((t) =>
      rt.players.filter((p) => p.teamId === t).map((p) => p.name),
    );
    return (
      <div className="flex flex-1 flex-col">
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {teams.map((names, i) => (
            <div
              key={i}
              className={cn(
                "border-t-2 pt-2",
                i === 0 ? "border-[var(--g)]" : "border-foreground/60",
              )}
            >
              <p className="font-display text-3xl">
                Team {i === 0 ? "A" : "B"}
              </p>
              <p className="mt-1 text-muted-foreground">{names.join(", ")}</p>
            </div>
          ))}
        </div>
        {view.category && (
          <p className="mt-6 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
            {view.category.toUpperCase()}
          </p>
        )}
        <Prompt game={game}>{view.prompt}</Prompt>
        {view.subline && (
          <p className="mt-3 text-muted-foreground">{view.subline}</p>
        )}
        {view.seconds !== undefined && (
          <Timer
            seconds={view.seconds}
            game={game}
            onTimeout={() => all(() => true)}
          />
        )}
        <button
          type="button"
          onClick={() => all(() => true)}
          className={cn(
            btn({ size: "lg" }),
            "mt-auto w-full bg-signal text-signal-foreground",
          )}
        >
          Gespielt · Ergebnis
        </button>
      </div>
    );
  }
  if (gid === "the-line" && rt.optionalMechanics?.linePredictions)
    return <LineOrder rt={rt} onSubmit={onSubmit} />;
  // the-line / after-dark perform
  return (
    <div className="flex flex-1 flex-col">
      <p className="mt-6 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
        {gid === "the-line" ? "ALLE AUFSTEHEN" : "FREIWILLIG"}
      </p>
      <Prompt game={game}>{view.prompt}</Prompt>
      {gid === "the-line" && (
        <div aria-hidden className="mt-8 flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">NIE</span>
          <span className="relative h-px flex-1 bg-[var(--g)]">
            {[10, 28, 46, 70, 88].map((x, i) => (
              <span
                key={x}
                className="absolute -top-1.5 size-3 rounded-full bg-[var(--g)] motion-safe:animate-rise"
                style={{ left: `${x}%`, animationDelay: `${i * 90}ms` }}
              />
            ))}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            SOFORT
          </span>
        </div>
      )}
      {gid === "after-dark" && (
        <p className="mt-4 text-sm text-muted-foreground">
          Niemand muss. Skip ohne Begründung – kein Alkohol nötig.
        </p>
      )}
      <div className="mt-auto grid gap-2 pt-6">
        <button
          type="button"
          onClick={() => all(() => true)}
          className={cn(
            btn({ size: "lg" }),
            "w-full bg-signal text-signal-foreground",
          )}
        >
          {gid === "the-line" ? "Linie steht" : "Geschafft"}
        </button>
        {gid === "after-dark" && (
          <button
            type="button"
            onClick={() => all(() => false)}
            className={cn(btn({ variant: "ghost", size: "lg" }), "w-full")}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function RevealGate({
  game,
  onReveal,
  prompt,
}: {
  game: GangGame;
  onReveal: () => void;
  prompt: string | undefined;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center motion-safe:animate-rise">
      <p className="font-mono text-xs tracking-[0.2em] text-[var(--g)]">
        ALLE ABGEGEBEN
      </p>
      {prompt && <p className="mt-3 text-muted-foreground">{prompt}</p>}
      <h2 className="font-display mt-4 text-[clamp(3rem,14vw,5rem)] leading-[0.85]">
        Handy in die Mitte.
      </h2>
      <button
        type="button"
        onClick={onReveal}
        className={cn(
          btn({ size: "lg" }),
          "mt-10 w-full bg-signal text-signal-foreground hover:bg-signal/90",
        )}
      >
        {game.signature === "dispatch"
          ? "Siegel brechen"
          : game.signature === "mask"
            ? "Masken ab"
            : "Aufdecken"}
      </button>
    </div>
  );
}

function ScoreView({
  game,
  rt,
  onNext,
}: {
  game: GangGame;
  rt: GangRuntimeState;
  onNext: () => void;
}) {
  const res = rt.round.resolution;
  const name = (id: string) => rt.players.find((p) => p.id === id)?.name ?? id;
  const last = rt.roundNumber >= rt.targetRounds;
  const ranking = [...rt.players]
    .sort((a, b) => (rt.scores[b.id] ?? 0) - (rt.scores[a.id] ?? 0))
    .slice(0, 6);
  const majority = game.id === "the-majority" ? majorityResult(rt) : null;
  return (
    <div
      className="flex flex-1 flex-col"
      aria-live="polite"
      data-testid="score"
    >
      <h2 className="font-display mt-8 text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.88] motion-safe:animate-rise">
        {res?.headline ?? "Runde vorbei."}
      </h2>
      {res?.detail && (
        <p className="mt-3 text-muted-foreground">{res.detail}</p>
      )}
      {res?.sourceUrl && (
        <a
          href={res.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center text-sm text-[var(--g)] underline"
        >
          Faktenquelle öffnen
        </a>
      )}
      {majority && (
        <MajorityResult r={majority} names={(ids) => ids.map(name)} />
      )}
      {!majority && res?.revealItems && res.revealItems.length > 0 && (
        <ul
          className={cn(
            "mt-6",
            game.signature === "wave"
              ? "grid gap-2"
              : "divide-y divide-line border-y border-line",
          )}
        >
          {res.revealItems
            .filter((r) => r.value)
            .map((r, i) =>
              game.signature === "wave" ? (
                <li
                  key={i}
                  className="flex items-center gap-3 border border-line p-3 motion-safe:animate-rise"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span aria-hidden className="flex h-10 items-end gap-0.5">
                    {[5, 9, 4, 8, 6].map((h, k) => (
                      <span
                        key={k}
                        className="w-1 bg-[var(--g)]"
                        style={{ height: `${h * 4}px` }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-xl">
                      {r.value.split(" — ")[0]}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {r.value.split(" — ")[1] ?? ""} · {r.label}
                    </span>
                  </span>
                </li>
              ) : (
                <li
                  key={i}
                  className="flex min-h-12 items-baseline justify-between gap-3 py-2 motion-safe:animate-rise"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="font-mono text-xs tracking-[0.12em] text-muted-foreground">
                    {r.label}
                  </span>
                  <span className="text-right font-display text-xl">
                    {r.value}
                  </span>
                </li>
              ),
            )}
        </ul>
      )}
      {!majority && res && res.winners.length > 0 && (
        <p className="mt-4 text-sm">
          <span className="text-[var(--g)]">Punkte für</span>{" "}
          {res.winners.map(name).join(", ")}
        </p>
      )}
      {(!NO_POINTS.includes(game.id) ||
        (game.id === "the-line" && rt.optionalMechanics?.linePredictions)) && (
        <ol
          className="mt-6 flex flex-wrap gap-x-5 gap-y-2"
          aria-label="Zwischenstand"
        >
          {ranking.map((p, i) => {
            const d = res?.scoreDelta[p.id] ?? 0;
            return (
              <li key={p.id} className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "font-display text-2xl tabular-nums",
                    i === 0 && "text-[var(--g)]",
                  )}
                >
                  {rt.scores[p.id] ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">{p.name}</span>
                {d > 0 && (
                  <span className="font-mono text-xs text-[var(--g)] motion-safe:animate-rise">
                    +{d}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <button
        type="button"
        onClick={() => {
          haptic(10);
          onNext();
        }}
        className={cn(
          btn({ size: "lg" }),
          "mt-auto w-full bg-signal text-signal-foreground hover:bg-signal/90",
        )}
      >
        {last ? "Zum Finale" : "Nächste Runde"}
      </button>
    </div>
  );
}

function Finale({
  game,
  rt,
  history,
  next,
  onNext,
  onAgain,
  onExit,
}: {
  game: GangGame;
  rt: GangRuntimeState;
  history: GangRoundResolution[];
  next: GangGame | undefined;
  onNext: () => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const names = rt.winnerIds.map(
    (id) => rt.players.find((p) => p.id === id)?.name ?? id,
  );
  const anyPoints = Object.values(rt.scores).some((s) => s > 0);
  const titles =
    game.id === "whos-that" ? history.flatMap((h) => h.revealItems ?? []) : [];
  const tracks =
    game.id === "music-drop"
      ? history
          .flatMap((h) =>
            (h.revealItems ?? []).filter(
              (r) =>
                rt.players.length === 2 ||
                (r.playerId && h.winners.includes(r.playerId)),
            ),
          )
          .filter((r) => r.value)
      : [];
  const [inter, setInter] = useState(false);
  if (inter && next) {
    return (
      <div
        className="flex flex-1 flex-col justify-center motion-safe:animate-rise"
        style={hueVars(next.hue)}
        data-testid="intermission"
      >
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
          PAUSE · DURCHATMEN · GLÄSER AUFFÜLLEN
        </p>
        <p className="mt-8 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          ALS NÄCHSTES
        </p>
        <h2 className="font-display mt-2 text-[clamp(3rem,15vw,5.5rem)] leading-[0.85]">
          {next.title}
        </h2>
        <p className="mt-3 text-foreground/85">{next.hook}</p>
        <button
          type="button"
          onClick={onNext}
          className={cn(
            btn({ size: "lg" }),
            "mt-10 w-full bg-signal text-signal-foreground",
          )}
        >
          Weiter zu {next.title}
        </button>
      </div>
    );
  }
  return (
    <div
      className="flex flex-1 flex-col motion-safe:animate-rise"
      data-testid="finale"
    >
      <p className="mt-8 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
        FINALE · {game.title}
      </p>
      <TitleGallery items={titles} />
      {game.id === "music-drop" ? (
        <>
          <h2 className="font-display mt-3 text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.88]">
            Tracklist der Nacht.
          </h2>
          <ol className="mt-6 border-t border-line">
            {tracks.map((t, i) => (
              <li
                key={i}
                className="flex min-h-12 items-baseline gap-3 border-b border-line py-2"
              >
                <span className="w-6 font-mono text-xs text-[var(--g)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate font-display text-xl">
                  {t.value}
                </span>
                <span className="text-xs text-muted-foreground">{t.label}</span>
              </li>
            ))}
            {tracks.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">
                Keine Tracks in dieser Session.
              </li>
            )}
          </ol>
        </>
      ) : (NO_POINTS.includes(game.id) &&
          !(game.id === "the-line" && rt.optionalMechanics?.linePredictions)) ||
        !anyPoints ? (
        <h2 className="font-display mt-3 text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.88]">
          {rt.targetRounds} Runden. Ein Raum, der jetzt mehr übereinander weiß.
        </h2>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {FINALE_TITLE[game.id] ?? "Champion"}
          </p>
          <h2 className="font-display mt-1 text-[clamp(3rem,15vw,5.5rem)] leading-[0.85] text-[var(--g)]">
            {names.join(" & ")}
          </h2>
          <ol className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {[...rt.players]
              .sort((a, b) => (rt.scores[b.id] ?? 0) - (rt.scores[a.id] ?? 0))
              .slice(0, 8)
              .map((p) => (
                <li key={p.id} className="flex items-baseline gap-1.5">
                  <span className="font-display text-2xl tabular-nums">
                    {rt.scores[p.id] ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {p.name}
                  </span>
                </li>
              ))}
          </ol>
        </>
      )}
      <div className="mt-auto grid gap-2 pt-8">
        {next ? (
          <button
            type="button"
            onClick={() => {
              haptic(10);
              setInter(true);
            }}
            className={cn(
              btn({ size: "lg" }),
              "w-full bg-signal text-signal-foreground",
            )}
          >
            Nächstes Spiel
          </button>
        ) : (
          <button
            type="button"
            onClick={onExit}
            className={cn(
              btn({ size: "lg" }),
              "w-full bg-signal text-signal-foreground",
            )}
          >
            Nacht beenden
          </button>
        )}
        <button
          type="button"
          onClick={onAgain}
          className={cn(btn({ variant: "ghost", size: "lg" }), "w-full")}
        >
          Nochmal {game.title}
        </button>
      </div>
    </div>
  );
}

/* ---------- THE MAJORITY presentation (shared by ONE PHONE, EVERYONE IN, BIG SCREEN) ---------- */
export function MajorityResult({
  r,
  names,
  big = false,
}: {
  r: MajorityResultData;
  names: (ids: string[]) => string[];
  big?: boolean;
}) {
  const tie = r.winners.length > 1;
  return (
    <div className={big ? "mt-8" : "mt-6"} data-testid="majority-result">
      <p
        className={cn(
          "font-mono tracking-[0.2em] text-muted-foreground",
          big ? "text-base" : "text-xs",
        )}
      >
        EIGENE STIMMEN · {r.total} VON {r.eligible}{" "}
        {r.eligible === 1 ? "STIMME" : "STIMMEN"}
      </p>
      <ul className={cn("mt-3", big ? "space-y-4" : "space-y-2")}>
        {r.options.map((o, i) => {
          const n = r.counts[o] ?? 0;
          const pct = r.total ? Math.round((n / r.total) * 100) : 0;
          const win = r.winners.includes(o);
          return (
            <li
              key={o}
              data-testid="majority-option"
              data-count={n}
              data-winner={win || undefined}
              className={big ? "text-2xl" : "text-sm"}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn(win && "text-[var(--g)]")}>
                  {o}
                  {win && (
                    <span
                      className={cn(
                        "ml-2 font-mono tracking-[0.15em]",
                        big ? "text-sm" : "text-[0.65rem]",
                      )}
                    >
                      {tie ? "GLEICHSTAND – BEIDE ZÄHLEN" : "MEHRHEIT"}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  {n} · {pct}%
                </span>
              </div>
              <div className={cn("mt-1 bg-line", big ? "h-4" : "h-2")}>
                <span
                  className={cn(
                    "block h-full origin-left motion-safe:animate-[grow_.7s_cubic-bezier(.2,.8,.2,1)_both]",
                    win ? "bg-[var(--g)]" : "bg-foreground/30",
                  )}
                  style={{ width: `${pct}%`, animationDelay: `${i * 80}ms` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {r.total === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Keine gültigen eigenen Stimmen in dieser Runde.
        </p>
      )}
      <div className={cn("mt-6 border-t border-line pt-3", big && "pt-5")}>
        <p
          className={cn(
            "font-mono tracking-[0.2em] text-muted-foreground",
            big ? "text-base" : "text-xs",
          )}
        >
          RICHTIG GETIPPT · +1 PUNKT
        </p>
        <p
          className={cn("mt-1", big ? "font-display text-4xl" : "text-base")}
          data-testid="majority-correct"
        >
          {r.correct.length
            ? names(r.correct).join(", ")
            : "Niemand hat die Mehrheit getippt."}
        </p>
      </div>
    </div>
  );
}

type MajOpt = Array<{ key: string; label: string }>;
function MajorityRow({
  options,
  label,
  step,
  value,
  set,
  testid,
}: {
  options: MajOpt;
  label: string;
  step: string;
  value: string | null;
  set: (k: string) => void;
  testid: string;
}) {
  return (
    <fieldset className="mt-6" data-testid={testid}>
      <legend className="flex items-baseline gap-2 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
        <span className="flex size-6 items-center justify-center border border-[var(--g)] text-[0.65rem]">
          {step}
        </span>
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-3 grid grid-cols-2 gap-px"
      >
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={value === o.key}
            onClick={() => {
              haptic(5);
              set(o.key);
            }}
            className={cn(
              "tap flex min-h-14 items-center justify-between gap-2 border px-3 py-2 text-left font-display text-xl leading-tight transition-colors",
              value === o.key
                ? "border-[var(--g)] bg-[var(--g-deep)]"
                : "border-line",
              value !== null && value !== o.key && "opacity-55",
            )}
          >
            <span className="min-w-0 break-words">{o.label}</span>
            {value === o.key && (
              <Check className="size-4 shrink-0 text-[var(--g)]" aria-hidden />
            )}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** One decision flow: question once, then A) tip for the room, B) own choice. */
export function MajorityDual({
  game,
  prompt,
  subline,
  options,
  cta,
  onSubmit,
  onlyOwn = false,
}: {
  game: GangGame;
  prompt: string;
  subline?: string | undefined;
  options: Array<{ key: string; label: string }>;
  cta: string;
  onSubmit: (tip: string, own: string) => void;
  onlyOwn?: boolean;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const [own, setOwn] = useState<string | null>(null);
  const ready = onlyOwn ? own !== null : tip !== null && own !== null;
  return (
    <div className="flex flex-1 flex-col" data-testid="majority-dual">
      <h2
        data-testid="majority-question"
        className={cn(
          "font-display leading-[0.95] tracking-tight",
          onlyOwn
            ? "mt-4 text-2xl text-foreground/80"
            : "mt-6 text-[clamp(2rem,8.5vw,3.2rem)]",
        )}
      >
        {prompt}
      </h2>
      {subline && !onlyOwn && (
        <p className="mt-2 text-sm text-muted-foreground">{subline}</p>
      )}
      {!onlyOwn && (
        <MajorityRow
          options={options}
          label="DEIN TIPP: WAS WÄHLT DIE MEHRHEIT?"
          step="A"
          value={tip}
          set={setTip}
          testid="majority-tip"
        />
      )}
      {(onlyOwn || tip !== null) && (
        <div className="motion-safe:animate-rise">
          <MajorityRow
            options={options}
            label="DEINE WAHL: WAS WÄHLST DU SELBST?"
            step={onlyOwn ? "→" : "B"}
            value={own}
            set={setOwn}
            testid="majority-own"
          />
        </div>
      )}
      <button
        type="button"
        disabled={!ready}
        onClick={() => ready && onSubmit(tip ?? "", own!)}
        className={cn(
          btn({ size: "lg" }),
          "mt-auto w-full bg-signal text-signal-foreground hover:bg-signal/90",
        )}
      >
        {ready
          ? cta
          : !onlyOwn && tip === null
            ? "Erst tippen"
            : "Jetzt deine Wahl"}
      </button>
      <span className="sr-only">{game.title}</span>
    </div>
  );
}

function LineOrder({
  rt,
  onSubmit,
}: {
  rt: GangRuntimeState;
  onSubmit: (s: GangRuntimeState) => void;
}) {
  const [order, setOrder] = useState(() => rt.players.map((p) => p.id));
  const move = (i: number, by: number) => {
    const next = [...order];
    [next[i], next[i + by]] = [next[i + by]!, next[i]!];
    setOrder(next);
  };
  return (
    <div className="flex flex-1 flex-col">
      <p className="eyebrow mt-6">Die Linie steht</p>
      <h2 className="font-display mt-3 text-4xl">Von links nach rechts</h2>
      <p className="mt-4 text-sm text-muted-foreground">
        Erfasst eure wirkliche Reihenfolge. Die vorher abgegebenen Tipps bleiben
        verdeckt.
      </p>
      <ol className="my-6 divide-y divide-line">
        {order.map((id, i) => (
          <li key={id} className="flex min-h-14 items-center gap-3">
            <span className="w-7 font-mono text-xs">{i + 1}</span>
            <span className="min-w-0 flex-1 break-words">
              {rt.players.find((p) => p.id === id)?.name}
            </span>
            <button
              className="tap size-12 disabled:opacity-30"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label={`${rt.players.find((p) => p.id === id)?.name} nach links`}
            >
              ←
            </button>
            <button
              className="tap size-12 disabled:opacity-30"
              disabled={i === order.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`${rt.players.find((p) => p.id === id)?.name} nach rechts`}
            >
              →
            </button>
          </li>
        ))}
      </ol>
      <button
        className={btn({ size: "lg" })}
        onClick={() => {
          let next = rt;
          for (const [i, id] of order.entries())
            next = submitGangAction(next, {
              playerId: id,
              optionId: String(i + 1),
            });
          onSubmit(next);
        }}
      >
        Reihenfolge bestätigen & Tipps aufdecken
      </button>
    </div>
  );
}
