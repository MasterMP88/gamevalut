import { restore, sanitizeForSave, STATE_VERSION, CONTENT_VERSION } from "./persist";
import type { ConsentSettings, GameId, SessionState } from "./types";

/**
 * Pending guest snapshot — bridges the guest → new account handoff when the email
 * confirmation link opens a new tab. Only sanitized *structural* state is stored
 * (same rules as sanitizeForSave: no anchors, AI queue, non-local scenes, tracklist,
 * music picks). Short-lived and deleted after a confirmed account save.
 */
export const PENDING_KEY = "nocturne.pending-guest.v1";
export const PENDING_TTL_MS = 2 * 60 * 60 * 1000;

export interface PendingSnapshot {
  v: 1;
  createdAt: number;
  gameId: GameId;
  stateVersion: number;
  contentVersion: number;
  players: [string, string];
  settings: ConsentSettings;
  state: SessionState;
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function buildPending(s: SessionState, settings: ConsentSettings, now = Date.now()): PendingSnapshot {
  const clean = sanitizeForSave(s);
  // Saved Moments, typed answers and AI text never live in SessionState fields beyond these; strip defensively.
  return { v: 1, createdAt: now, gameId: s.gameId, stateVersion: STATE_VERSION, contentVersion: CONTENT_VERSION, players: [...s.players] as [string, string], settings, state: clean };
}

export function stashPending(store: Store, s: SessionState, settings: ConsentSettings, now = Date.now()) {
  try { store.setItem(PENDING_KEY, JSON.stringify(buildPending(s, settings, now))); } catch { /* storage unavailable: guest keeps playing in memory */ }
}

export function clearPending(store: Store) {
  try { store.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

/** Returns a playable restored snapshot, or null (and deletes the key) when expired/malformed. */
export function readPending(store: Store, now = Date.now()): { gameId: GameId; state: SessionState; players: [string, string]; settings: ConsentSettings } | null {
  let raw: string | null = null;
  try { raw = store.getItem(PENDING_KEY); } catch { return null; }
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<PendingSnapshot>;
    if (p.v !== 1 || typeof p.createdAt !== "number" || now - p.createdAt > PENDING_TTL_MS || now < p.createdAt - 60_000) throw 0;
    const r = restore({ game_id: String(p.gameId), state: p.state, state_version: Number(p.stateVersion), content_version: Number(p.contentVersion) });
    if (!r.ok || !Array.isArray(p.players) || !p.settings) throw 0;
    return { gameId: r.state.gameId, state: r.state, players: p.players as [string, string], settings: p.settings };
  } catch {
    clearPending(store);
    return null;
  }
}