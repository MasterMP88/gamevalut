// Generated from packages/gang-core/src/missions.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import {
  getGangPlaybook,
  expandGangSeenIds,
  type GangGameId,
} from "./playbooks.js";
import type { GangRuntimePlayer } from "./runtime.js";
export interface MissionAssignment {
  id: string;
  text: string;
}
export interface MissionEvent {
  id: string;
  playerId: string;
  kind: "claim" | "accuse";
  at: number;
  targetId?: string;
  missionId?: string;
}
export interface MissionNight {
  id: string;
  players: GangRuntimePlayer[];
  assignments: Record<string, MissionAssignment>;
  events: MissionEvent[];
  startedAt: number;
}
export interface MissionReport {
  scores: Record<string, number>;
  timeline: Array<{
    playerId: string;
    name: string;
    mission: string;
    status: "unclaimed" | "caught" | "complete";
    at: number | null;
  }>;
  correctSuspicions: Array<{ playerId: string; targetId: string }>;
}
/** Missions run alongside a playable night, never as a blocking performance stage. */
export function missionQueue(queue: readonly GangGameId[]): GangGameId[] {
  if (!queue.includes("secret-missions")) return [...queue];
  const main = queue.filter((id) => id !== "secret-missions");
  return [
    "secret-missions",
    ...(main.length ? main : (["the-majority", "whos-that"] as GangGameId[])),
  ];
}
export function createMissionNight(
  id: string,
  players: readonly GangRuntimePlayer[],
  seed: number,
  seenIds: readonly string[] = [],
  now = 0,
): MissionNight {
  if (players.length < 3 || players.length > 30)
    throw new Error("Missionen brauchen 3–30 Personen.");
  const prompts = getGangPlaybook("secret-missions")!.prompts;
  const seenHistory = expandGangSeenIds(seenIds);
  let state = seed >>> 0;
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const deck = prompts
    .map((p) => ({
      p,
      seen: seenHistory.includes(p.id),
      tie: rand(),
      age: seenHistory.lastIndexOf(p.id),
    }))
    .sort(
      (a, b) =>
        Number(a.seen) - Number(b.seen) ||
        (a.seen && b.seen ? a.age - b.age : 0) ||
        a.tie - b.tie,
    );
  return {
    id,
    players: [...players],
    events: [],
    startedAt: now,
    assignments: Object.fromEntries(
      players.map((p, i) => [
        p.id,
        { id: deck[i]!.p.id, text: deck[i]!.p.prompt },
      ]),
    ),
  };
}
export function applyMissionEvent(
  night: MissionNight,
  event: MissionEvent,
): MissionNight {
  if (
    !night.assignments[event.playerId] ||
    !Number.isFinite(event.at) ||
    event.at < 0
  )
    throw new Error("Ungültige Missionsmeldung.");
  if (night.events.some((e) => e.id === event.id)) return night;
  if (
    night.events.some(
      (e) => e.playerId === event.playerId && e.kind === event.kind,
    )
  )
    return night; // first sealed claim / one considered suspicion
  if (
    event.kind === "accuse" &&
    (!event.targetId ||
      event.targetId === event.playerId ||
      !night.assignments[event.targetId] ||
      !event.missionId)
  )
    throw new Error("Ungültiger Verdacht.");
  return {
    ...night,
    events: [...night.events, event].sort((a, b) => a.at - b.at),
  };
}
export function resolveMissionNight(night: MissionNight): MissionReport {
  const scores = Object.fromEntries(night.players.map((p) => [p.id, 0]));
  const correct = night.events.filter(
    (e) =>
      e.kind === "accuse" &&
      e.targetId &&
      night.assignments[e.targetId]?.id === e.missionId,
  );
  for (const e of correct) scores[e.playerId] = (scores[e.playerId] ?? 0) + 1;
  const timeline = night.players
    .map((p) => {
      const claim = night.events.find(
        (e) => e.playerId === p.id && e.kind === "claim",
      );
      const caught = correct.some(
        (e) =>
          e.targetId === p.id &&
          (!claim || night.events.indexOf(e) < night.events.indexOf(claim)),
      );
      const status = caught
        ? ("caught" as const)
        : claim
          ? ("complete" as const)
          : ("unclaimed" as const);
      if (status === "complete") scores[p.id] = (scores[p.id] ?? 0) + 2;
      return {
        playerId: p.id,
        name: p.name,
        mission: night.assignments[p.id]!.text,
        status,
        at: claim?.at ?? null,
      };
    })
    .sort(
      (a, b) =>
        (a.at ?? Infinity) - (b.at ?? Infinity) || a.name.localeCompare(b.name),
    );
  return {
    scores,
    timeline,
    correctSuspicions: correct.map((e) => ({
      playerId: e.playerId,
      targetId: e.targetId!,
    })),
  };
}
