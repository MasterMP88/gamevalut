import { paceQueue } from "./core/director";
import {
  createMissionNight,
  missionQueue,
  resolveMissionNight,
  type MissionNight,
  type MissionReport,
} from "./core/missions";
/* EVERYONE IN / BIG SCREEN orchestration. Pure adapter over the vendored canonical runtime:
   the facilitator device owns a GangRuntimeState and uses ONLY createGangRuntime / submitGangAction /
   advanceGangStage / publicGangView / privateGangView. This file maps that runtime onto the room's
   public state and back. No rules of its own. */
import { seenIds, recordSeen } from "@/lib/content-history";
import {
  advanceGangStage,
  answerChoiceOwners,
  canAdvanceGangStage,
  createGangRuntime,
  privateGangView,
  publicGangView,
  submitGangAction,
  type GangRoundResolution,
  type GangRuntimeAction,
  type GangRuntimePlayer,
  type GangRuntimeState,
} from "./core/runtime";
import {
  getGangPlaybook,
  type GangGameId,
  type GangStageKind,
} from "./core/playbooks";
import { majorityResult, type MajorityResultData } from "./majority";
import type {
  CollectedAction,
  RoomSnapshot,
  RoomStateWrite,
} from "./room-client";

export const ANSWER_VOTE_GAMES: GangGameId[] = [
  "bad-answers-only",
  "music-drop",
  "photo-hunt",
  "bluff",
];
export const PLAYER_VOTE_GAMES: GangGameId[] = [
  "whos-that",
  "undercover",
  "one-of-you",
];

/** What a controller renders for the current stage. */
export type InputKind =
  | "consent"
  | "options"
  | "text"
  | "track"
  | "done"
  | "success"
  | "ack"
  | "teams"
  | "none";

export interface PublicCard {
  key: string;
  label: string;
  photoId?: string | undefined;
}

export interface OnlineView {
  roundNumber: number;
  targetRounds: number;
  stage: GangStageKind;
  stageIndex: number;
  totalStages: number;
  prompt: string;
  hidden: boolean;
  subline?: string;
  seconds?: number;
  timed?: boolean;
  repeatable?: boolean;
  maxWords?: number;
  teamResult?: { metric: string; max: number };
  deadlineAt?: string | null | undefined;
  serverNow?: string | undefined;
  category?: string;
  cards: PublicCard[];
  input: InputKind;
  activePlayerId: string | null;
  resolution: GangRoundResolution | null;
  majority: MajorityResultData | null;
}

export interface OnlinePublic {
  v: 1;
  kind: "lobby" | "play" | "finale" | "end";
  queue: GangGameId[];
  qi: number;
  gameId: GangGameId | null;
  roster: GangRuntimePlayer[];
  scores: Record<string, number>;
  /** DB contract: who must submit before the facilitator may collect. */
  requiredPlayerIds: string[];
  view: OnlineView | null;
  winnerIds: string[];
  tracks: string[];
  titles?: Array<{ label: string; value: string; playerId?: string }>;
  adultConsent?: boolean;
  missionKey?: string;
  missionPlayerIds?: string[];
  missionReport?: MissionReport;
  rounds?: Record<string, number> | undefined;
  budgetMinutes?: 15 | 30 | 60 | null | undefined;
}

/** Full facilitator state, saved with gang_save_runtime (facilitator-only readable). */
export interface FacState {
  v: 1;
  queue: GangGameId[];
  qi: number;
  kind: OnlinePublic["kind"];
  rt: GangRuntimeState | null;
  /** anonymous card key -> real option id (player id / __truth__). Never published. */
  cards: Record<string, string>;
  history: GangRoundResolution[];
  missions?: MissionNight;
  adultConsent?: boolean;
  missionKey?: string;
  missionPlayerIds?: string[];
  missionReport?: MissionReport;
  rounds?: Record<string, number> | undefined;
  budgetMinutes?: 15 | 30 | 60 | null | undefined;
}

export const isFacState = (x: unknown): x is FacState =>
  !!x &&
  typeof x === "object" &&
  (x as FacState).v === 1 &&
  Array.isArray((x as FacState).queue);

const stageOf = (rt: GangRuntimeState) => rt.round.stages[rt.round.stageIndex]!;

export function inputKind(rt: GangRuntimeState): InputKind {
  const stage = stageOf(rt);
  const g = rt.gameId;
  if (stage === "reveal" || stage === "score") return "none";
  if (stage === "private" && g === "after-dark") return "consent";
  if (stage === "private" && g !== "hot-seat") return "ack";
  if (["chain-reaction", "panic-button"].includes(g) && stage === "perform")
    return "done";
  if (g === "team-chaos" && stage === "react") return "teams";
  if ((g === "team-chaos" || g === "the-line") && stage === "perform")
    return "done";
  if ((g === "after-dark" || g === "secret-missions") && stage === "perform")
    return "success";
  if (g === "draw-this" && stage === "perform") return "done";
  const opts = publicGangView(rt).options ?? [];
  if (opts.length > 0) return "options";
  if (g === "music-drop") return "track";
  return "text";
}

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
};

/** Cards for option stages. Answer votes are shuffled + anonymised (keys c1..cn, labels = answer text). */
export function buildCards(rt: GangRuntimeState): {
  cards: PublicCard[];
  map: Record<string, string>;
} {
  const view = publicGangView(rt);
  const opts = view.options ?? [];
  const stage = view.stage;
  const name = (id: string) => rt.players.find((p) => p.id === id)?.name ?? "";
  if (
    ["vote", "reveal", "score"].includes(stage) &&
    ANSWER_VOTE_GAMES.includes(rt.gameId)
  ) {
    const src = rt.round.stages.indexOf(
      rt.gameId === "photo-hunt" ? "perform" : "answer",
    );
    const answers = src >= 0 ? (rt.round.stageSubmissions[src] ?? {}) : {};
    const entries =
      stage === "vote"
        ? opts
        : [
            ...(rt.gameId === "bluff" ? ["__truth__"] : []),
            ...Object.values(answers)
              .filter((a) => !a.timedOut && a.value?.trim())
              .map((a) => a.playerId),
          ];
    const shuffled = [...entries].sort(
      (a, b) => hash(rt.round.id + a) - hash(rt.round.id + b),
    );
    const map: Record<string, string> = {};
    const cards = shuffled.map((o, i) => {
      const key = `c${i + 1}`;
      map[key] = o;
      return {
        key,
        label:
          o === "__truth__"
            ? (rt.round.prompt.answer ?? "")
            : (answers[o]?.value ?? ""),
        ...(answers[o]?.photoId ? { photoId: answers[o]!.photoId } : {}),
      };
    });
    return { cards, map };
  }
  const isPlayer =
    opts.length > 0 && opts.every((o) => rt.players.some((p) => p.id === o));
  return {
    cards: opts.map((o) => ({ key: o, label: isPlayer ? name(o) : o })),
    map: {},
  };
}

export const roundKeyOf = (fac: FacState) =>
  fac.rt && fac.kind === "play"
    ? `${fac.rt.id}|${fac.rt.round.id}`.slice(0, 96)
    : `${fac.kind}-${fac.qi}`;
export const stageKeyOf = (fac: FacState) =>
  fac.rt && fac.kind === "play"
    ? `${fac.rt.round.stageIndex}-${stageOf(fac.rt)}`
    : fac.kind;

export function requiredOnline(
  rt: GangRuntimeState,
  input: InputKind,
  facilitatorId: string,
  active: Set<string>,
): string[] {
  let ids: string[];
  if (input === "none") ids = [];
  else if (input === "ack") ids = rt.players.map((p) => p.id);
  else if (input === "teams") ids = [facilitatorId];
  else ids = publicGangView(rt).requiredPlayerIds;
  return ids.filter((id) => active.has(id));
}

export const activeInputIds = (snap: RoomSnapshot) =>
  new Set(snap.players.filter((p) => p.active && p.canInput).map((p) => p.id));

/** Build the public room write + refresh the private card map. Contains no private payloads. */
export function buildPublic(
  fac: FacState,
  snap: RoomSnapshot,
  extra: { requiredOverride?: string[] } = {},
): { write: RoomStateWrite; fac: FacState } {
  const active = activeInputIds(snap);
  const rt = fac.rt;
  const gameId =
    fac.kind === "play" || fac.kind === "finale"
      ? (rt?.gameId ?? null)
      : (fac.queue[fac.qi] ?? null);
  let view: OnlineView | null = null;
  let required: string[] = [];
  let cards: Record<string, string> = {};
  if (rt && fac.kind === "play") {
    const pv = publicGangView(rt);
    const input = inputKind(rt);
    const built = buildCards(rt);
    cards = built.map;
    required =
      extra.requiredOverride ??
      requiredOnline(rt, input, snap.playerId, active);
    view = {
      roundNumber: rt.roundNumber,
      targetRounds: rt.targetRounds,
      stage: pv.stage,
      stageIndex: pv.stageIndex,
      totalStages: pv.totalStages,
      prompt: pv.prompt === "PRIVATE ROUND" ? "" : pv.prompt,
      hidden: pv.prompt === "PRIVATE ROUND",
      ...(pv.subline ? { subline: pv.subline } : {}),
      ...(pv.seconds !== undefined ? { seconds: pv.seconds } : {}),
      ...(pv.category ? { category: pv.category } : {}),
      timed:
        (pv.stage === "react" &&
          ["panic-button", "chain-reaction"].includes(rt.gameId)) ||
        (["photo-hunt", "team-chaos"].includes(rt.gameId) &&
          pv.stage === "perform") ||
        (rt.gameId === "draw-this" && pv.stage === "answer"),
      repeatable: rt.gameId === "draw-this" && pv.stage === "answer",
      ...(rt.round.prompt.teamChallenge
        ? {
            teamResult: {
              metric: rt.round.prompt.teamChallenge.metric,
              max: rt.round.prompt.teamChallenge.maxResult,
            },
          }
        : {}),
      maxWords:
        rt.round.prompt.category === "finale-five-words" &&
        pv.stage === "answer"
          ? 5
          : 0,
      cards: built.cards,
      input,
      activePlayerId: pv.activePlayerId,
      resolution: pv.resolution
        ? {
            ...pv.resolution,
            ...(pv.resolution.revealItems
              ? { revealItems: pv.resolution.revealItems.slice(0, 24) }
              : {}),
          }
        : null,
      majority: pv.stage === "score" ? majorityResult(rt) : null,
    };
  }
  const tracks =
    gameId === "music-drop"
      ? fac.history
          .flatMap((h) =>
            (h.revealItems ?? []).filter(
              (r) =>
                rt?.players.length === 2 ||
                (r.playerId && h.winners.includes(r.playerId)),
            ),
          )
          .map((r) => r.value)
          .filter(Boolean)
      : [];
  const publicState: OnlinePublic = {
    v: 1,
    kind: fac.kind,
    queue: fac.queue,
    rounds: fac.rounds,
    budgetMinutes: fac.budgetMinutes,
    qi: fac.qi,
    gameId,
    roster:
      rt?.players.map((p) => ({
        id: p.id,
        name: p.name,
        ...(p.teamId ? { teamId: p.teamId } : {}),
      })) ?? [],
    scores: rt?.scores ?? {},
    requiredPlayerIds: required,
    view,
    winnerIds: rt?.winnerIds ?? [],
    tracks,
    ...(gameId === "whos-that" && fac.kind === "finale"
      ? { titles: fac.history.flatMap((h) => h.revealItems ?? []) }
      : {}),
    ...(fac.adultConsent ? { adultConsent: true } : {}),
    ...(fac.missions
      ? {
          missionKey: fac.missions.id,
          missionPlayerIds: Object.keys(fac.missions.assignments),
        }
      : {}),
    ...(fac.missionReport ? { missionReport: fac.missionReport } : {}),
  };
  const phase: RoomSnapshot["phase"] =
    fac.kind === "lobby"
      ? "lobby"
      : fac.kind === "end"
        ? "finished"
        : "playing";
  return {
    write: {
      phase,
      gameId,
      roundKey: roundKeyOf(fac),
      stage: stageKeyOf(fac),
      publicState: publicState as unknown as Record<string, unknown>,
    },
    fac: { ...fac, cards },
  };
}

/** Canonical private payloads for this stage (owner-only via gang_set_private_payloads). */
export function privatePayloadsFor(
  fac: FacState,
  active: Set<string>,
): Array<{ playerId: string; payload: Record<string, unknown> }> {
  const rt = fac.rt;
  if (!rt || !["play", "finale"].includes(fac.kind)) return [];
  const ownCard = Object.fromEntries(
    Object.entries(fac.cards).map(([k, v]) => [v, k]),
  );
  const out: Array<{ playerId: string; payload: Record<string, unknown> }> = [];
  for (const p of rt.players) {
    if (!active.has(p.id)) continue;
    const base = fac.kind === "play" ? privateGangView(rt, p.id) : null;
    const own =
      ownCard[p.id] ??
      Object.entries(fac.cards).find(([, option]) =>
        answerChoiceOwners(rt, option).includes(p.id),
      )?.[0];
    const mission = fac.missions?.assignments[p.id];
    if (!base && !own && !mission) continue;
    out.push({
      playerId: p.id,
      payload: {
        ...(base ?? {}),
        ...(own ? { ownCard: own } : {}),
        ...(mission
          ? {
              mission: mission.text,
              missionId: mission.id,
              missionClaimed: fac.missions!.events.some(
                (e) => e.playerId === p.id && e.kind === "claim",
              ),
              missionAccused: fac.missions!.events.some(
                (e) => e.playerId === p.id && e.kind === "accuse",
              ),
            }
          : {}),
      },
    });
  }
  return out;
}

export function startGame(
  fac: FacState,
  players: GangRuntimePlayer[],
  seed: number,
  id: string,
): FacState {
  if (fac.qi === 0 && fac.budgetMinutes !== undefined)
    fac = {
      ...fac,
      rounds: paceQueue(fac.queue, players.length, fac.budgetMinutes).rounds,
    };
  let qi = fac.qi;
  while (qi < fac.queue.length) {
    const pb = getGangPlaybook(fac.queue[qi]!);
    if (
      pb &&
      players.length >= pb.minPlayers &&
      players.length <= pb.maxPlayers
    )
      break;
    qi++;
  }
  const gameId = fac.queue[qi];
  if (!gameId) return { ...fac, qi, kind: "end", rt: null, cards: {} };
  let rt = createGangRuntime({
    id,
    gameId,
    players,
    seed,
    targetRounds: fac.rounds?.[gameId],
    seenPromptIds: seenIds(),
    interactionMode: "everyone-in",
  });
  let missions = fac.missions;
  if (gameId === "secret-missions") {
    missions = createMissionNight(
      id.slice(0, 96),
      players,
      seed,
      seenIds(),
      Date.now(),
    );
    rt = {
      ...rt,
      round: {
        ...rt.round,
        privateByPlayer: Object.fromEntries(
          players.map((p) => [
            p.id,
            { role: "AGENT", mission: missions!.assignments[p.id]!.text },
          ]),
        ),
      },
    };
    recordSeen(Object.values(missions.assignments).map((m) => m.id));
  }
  recordSeen([`game/${gameId}`, rt.round.prompt.id]);
  return {
    ...fac,
    ...(missions ? { missions } : {}),
    qi,
    kind: "play",
    rt,
    cards: {},
    history: [],
  };
}

const clean = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, 120) : undefined;

/** Feed collected room actions back through canonical submitGangAction, then advance the stage. */
export function applyCollected(
  fac: FacState,
  actions: CollectedAction[],
  options: { partial?: boolean; expired?: boolean } = {},
): FacState {
  const rt0 = fac.rt;
  if (!rt0) return fac;
  const input = inputKind(rt0);
  const stage = stageOf(rt0);
  let rt = rt0;
  const opts = publicGangView(rt0).options ?? [];
  const isPlayerOpts =
    opts.length > 0 &&
    opts.every((o) => o === "__truth__" || rt0.players.some((p) => p.id === o));
  const submit = (a: GangRuntimeAction) => {
    try {
      rt = submitGangAction(rt, a);
    } catch {
      /* ineligible / dropped player: ignore */
    }
  };
  for (const [sequence, a] of actions.entries()) {
    const p = a.payload ?? {};
    if (input === "ack") continue;
    if (input === "teams") {
      const teams = (p["teams"] ?? {}) as Record<string, unknown>;
      for (const pl of rt0.players) {
        const result = teams[pl.teamId ?? ""];
        submit({
          playerId: pl.id,
          ...(typeof result === "number"
            ? { quantity: result }
            : { success: result === true }),
        });
      }
      continue;
    }
    const receivedAt = Date.parse(a.at ?? "");
    const action: GangRuntimeAction = {
      playerId: a.playerId,
      sequence,
      ...(Number.isFinite(receivedAt) ? { at: receivedAt } : {}),
    };
    const key = clean(p["key"]);
    if (key) {
      const real = fac.cards[key] ?? key;
      if (!opts.includes(real)) continue;
      if (stage === "vote" && real === a.playerId) continue; // never your own card
      if (isPlayerOpts) {
        action.targetPlayerId = real;
        action.value = real;
      } else {
        action.optionId = real;
        action.value = real;
      }
    }
    const value = clean(p["value"]);
    if (value && !key) action.value = value;
    if (typeof p["success"] === "boolean") action.success = p["success"];
    if (p["timedOut"] === true) action.timedOut = true;
    if (p["noFaces"] === true) action.noFaces = true;
    const photoId = clean(p["photoId"]);
    if (photoId) action.photoId = photoId;
    submit(action);
  }
  if (options.partial && !options.expired && !canAdvanceGangStage(rt))
    return rt === rt0 ? fac : { ...fac, rt };
  const next = advanceGangStage(rt, { force: !canAdvanceGangStage(rt) });
  return withResolution(fac, next);
}

function withResolution(fac: FacState, next: GangRuntimeState): FacState {
  if (
    next.gameId === "secret-missions" &&
    stageOf(next) === "perform" &&
    fac.missions
  ) {
    return startGame(
      { ...fac, qi: fac.qi + 1 },
      next.players,
      next.seed,
      `${fac.missions.id}-game-${fac.qi + 1}`,
    );
  }
  if (next.round.id !== fac.rt?.round.id) recordSeen([next.round.prompt.id]);
  const res = next.round.resolution;
  const history =
    res && res !== fac.rt?.round.resolution && !fac.history.includes(res)
      ? [...fac.history, res]
      : fac.history;
  return { ...fac, rt: next, history, kind: next.finished ? "finale" : "play" };
}

/** Facilitator-only reveal / next-round advance. */
export function advanceShow(fac: FacState): FacState {
  if (!fac.rt) return fac;
  return withResolution(
    fac,
    advanceGangStage(fac.rt, { force: !canAdvanceGangStage(fac.rt) }),
  );
}

export function endNight(fac: FacState): FacState {
  return {
    ...fac,
    kind: "end",
    ...(fac.missions
      ? { missionReport: resolveMissionNight(fac.missions) }
      : {}),
  };
}

export const lobbyFac = (
  queue: GangGameId[],
  rounds?: Record<string, number>,
  budgetMinutes?: 15 | 30 | 60 | null,
): FacState => ({
  v: 1,
  queue: missionQueue(queue),
  rounds,
  budgetMinutes,
  qi: 0,
  kind: "lobby",
  rt: null,
  cards: {},
  history: [],
});

/** Do all games in the queue accept this many input players? */
export function queueFits(queue: GangGameId[], n: number) {
  return (
    queue.length > 0 &&
    queue.every((id) => {
      const pb = getGangPlaybook(id);
      return !!pb && n >= pb.minPlayers && n <= pb.maxPlayers;
    })
  );
}
export function queueRange(queue: GangGameId[]): [number, number] {
  const pbs = queue.map((id) => getGangPlaybook(id)!).filter(Boolean);
  return [
    Math.max(2, ...pbs.map((p) => p.minPlayers)),
    Math.min(99, ...pbs.map((p) => p.maxPlayers)),
  ];
}

export const readPublic = (snap: RoomSnapshot | null): OnlinePublic | null => {
  const p = snap?.publicState as OnlinePublic | null | undefined;
  return p && p.v === 1 ? p : null;
};
