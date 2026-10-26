import { z } from "zod";
import { couchGame } from "./core/experience";
import { couchRange, reduceCouch, type CouchState } from "./core/couch";
import type { GangGameId } from "./core/playbooks";
import type { GangRuntimePlayer } from "./core/runtime";
const KEY = "nocturne.couch.resume";
const TTL = 12 * 3600_000;
const text = z.string().max(2000),
  id = z.string().min(1).max(160);
const finite = z.number().finite();
const integer = finite.int().min(0).max(10000);
const game = z
  .string()
  .refine((v) => couchGame(v))
  .transform((v) => v as GangGameId);
const result = z.object({
  prompt: text.optional(),
  headline: text,
  winners: z.array(id).max(6),
  delta: z.record(finite),
  counts: z.array(integer).max(100).optional(),
  skipped: z.boolean().optional(),
  revealText: text.optional(),
});
const stateSchema = z.object({
  version: z.literal(1),
  gameId: game,
  phase: z.enum([
    "ready",
    "explain",
    "play",
    "reveal",
    "score",
    "transition",
    "finale",
  ]),
  playerCount: integer.min(2).max(99),
  teams: z
    .array(
      z.object({
        id,
        name: z.string().min(1).max(32),
        members: z.array(integer.min(1).max(99)).min(1).max(99),
      }),
    )
    .min(1)
    .max(6),
  seed: finite.int(),
  deck: z
    .array(
      z.object({
        id,
        prompt: text,
        subline: text.optional(),
        options: z.array(text).max(100).optional(),
        answer: text.optional(),
        seconds: integer.optional(),
        category: text.optional(),
        teamChallenge: z
          .object({ metric: text, maxResult: integer, instruction: text })
          .optional(),
      }),
    )
    .min(1)
    .max(200),
  index: integer,
  rounds: integer.min(1).max(200),
  scores: z.record(finite),
  history: z.array(id).max(20000),
  results: z.array(result).max(200),
  result: result.nullable(),
  vibe: z.enum(["relaxed", "lively"]),
  turn: integer,
  turnResults: z.array(z.boolean()).max(200),
  deadline: finite.nullable(),
  paused: z.boolean(),
  remaining: finite.min(0).nullable(),
  musicClaim: id.nullable(),
  musicMisses: z.array(id).max(6),
  musicMode: z.enum(["dj", "local"]),
  musicDj: z
    .object({ member: integer.min(1).max(99), name: z.string().max(32) })
    .nullable(),
  musicHeard: z.boolean(),
  encore: z.boolean(),
  finaleVariant: z.union([z.literal(0), z.literal(1)]),
});
const schema = z.object({
  version: z.literal(1),
  savedAt: finite,
  queue: z.array(game).min(1).max(20),
  index: integer.max(19),
  players: z
    .array(z.object({ id, name: z.string().min(1).max(32) }))
    .min(2)
    .max(99),
  rounds: z.record(integer.min(1).max(200)).optional(),
  display: z.enum(["couch", "phone"]),
  state: stateSchema,
  audioIds: z.array(z.string().regex(/^audio\/[a-f0-9]+$/)).max(120),
});
export interface CouchCheckpoint {
  version: 1;
  savedAt: number;
  queue: GangGameId[];
  index: number;
  players: GangRuntimePlayer[];
  rounds?: Record<string, number> | undefined;
  display: "couch" | "phone";
  state: CouchState;
  audioIds: string[];
}
export function clearCouchCheckpoint() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* memory only */
  }
}
export function readCouchCheckpoint(now = Date.now()): CouchCheckpoint | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    if (raw.length > 500000) throw new Error("oversize");
    const v = schema.parse(JSON.parse(raw));
    if (
      now - v.savedAt > TTL ||
      v.savedAt > now + 60000 ||
      v.queue[v.index] !== v.state.gameId ||
      v.players.length !== v.state.playerCount ||
      v.state.index >= v.state.deck.length ||
      v.state.rounds > v.state.deck.length
    )
      throw new Error("stale");
    const [min, max] = couchRange(v.state.gameId);
    if (v.players.length < min || v.players.length > max)
      throw new Error("count");
    if (
      new Set(v.players.map((p) => p.id)).size !== v.players.length ||
      new Set(v.state.teams.map((t) => t.id)).size !== v.state.teams.length
    )
      throw new Error("duplicate");
    const s = reduceCouch(v.state as CouchState, { type: "PAUSE", at: now });
    // Playing a new local clip always needs an actual user gesture after recovery.
    return {
      ...v,
      state: {
        ...s,
        musicHeard: s.musicMode === "local" ? false : s.musicHeard,
      },
    };
  } catch {
    clearCouchCheckpoint();
    return null;
  }
}
export function writeCouchCheckpoint(
  value: Omit<CouchCheckpoint, "version" | "savedAt">,
  now = Date.now(),
) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify(schema.parse({ ...value, version: 1, savedAt: now })),
    );
  } catch {
    /* storage unavailable: current night remains playable */
  }
}
