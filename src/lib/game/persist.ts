import { BATTLE_CHAPTER, pickLocal } from "./engine";
import { GAMES_BY_ID } from "./games";
import type { GameId, SessionState } from "./types";

/**
 * Bump when scene banks change in a way that could invalidate saved scene ids.
 * STATE_VERSION bumps when the SessionState shape changes.
 */
export const CONTENT_VERSION = 4;
export const STATE_VERSION = 2;

/**
 * Structural state only. Removes everything that may contain intimate free-text:
 * memory anchors, the AI queue, and any current scene not taken from the local bank
 * (AI/echo scenes can quote what someone said).
 */
export function sanitizeForSave(s: SessionState): SessionState {
  const current = s.current && (s.current.source ?? "local") === "local" ? s.current : null;
  return { ...s, anchors: [], aiQueue: [], current, tracklist: [], musicRound: null };
}

export interface SessionRow {
  user_id: string;
  game_id: string;
  game_slug: string;
  status: "active" | "completed" | "abandoned";
  scene_number: number;
  chapter: number | null;
  current_player: number;
  content_version: number;
  state_version: number;
  intensity: number;
  steer: string | null;
  scores: { sparks: [number, number]; streaks: [number, number] } | null;
  energies: SessionState["energies"] | null;
  history: string[];
  state: SessionState;
  revision: number;
  completed_at: string | null;
}

export function toRow(s: SessionState, userId: string, revision: number): SessionRow {
  const g = GAMES_BY_ID[s.gameId];
  const clean = sanitizeForSave(s);
  return {
    user_id: userId,
    game_id: s.gameId,
    game_slug: g.slug,
    status: s.finished ? "completed" : "active",
    scene_number: s.sceneNumber,
    chapter: g.battle ? Math.ceil(s.sceneNumber / Math.max(2, Math.round((s.targetScenes ?? 40) / 4))) : null,
    current_player: s.turn,
    content_version: CONTENT_VERSION,
    state_version: STATE_VERSION,
    // smallint column: heat is fractional in state (full value stays in `state`).
    intensity: Math.round(s.heat),
    steer: s.steer,
    scores: g.battle ? { sparks: s.sparks, streaks: s.streaks } : null,
    energies: g.coop ? s.energies : null,
    history: s.usedIds.slice(-200),
    state: clean,
    revision,
    completed_at: s.finished ? new Date().toISOString() : null,
  };
}

export type RestoreResult = { ok: true; state: SessionState; migrated: boolean } | { ok: false; reason: "unknown-game" | "incompatible" | "malformed" };

/** Rebuilds a playable session from a stored row. Never silently loads an incompatible shape. */
export function restore(row: { game_id: string; state: unknown; state_version: number; content_version: number }): RestoreResult {
  if (!(row.game_id in GAMES_BY_ID)) return { ok: false, reason: "unknown-game" };
  if (row.state_version !== 1 && row.state_version !== STATE_VERSION) return { ok: false, reason: "incompatible" };
  const s = row.state as SessionState | null;
  if (!s || typeof s !== "object" || s.gameId !== (row.game_id as GameId) || !Array.isArray(s.players) || typeof s.sceneNumber !== "number") {
    return { ok: false, reason: "malformed" };
  }
  let state: SessionState = { ...s, anchors: [], aiQueue: [], tracklist: [], musicRound: null };
  const migrated = row.content_version !== CONTENT_VERSION || row.state_version !== STATE_VERSION;
  // A scene stripped for privacy (or from an older content bank) is replaced by a fresh local one.
  if (!state.finished && (!state.current || migrated)) {
    const { scene, seed } = pickLocal(state);
    state = { ...state, current: scene, seed };
  }
  return { ok: true, state, migrated };
}
