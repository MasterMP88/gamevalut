import { CONTENT_VERSION, STATE_VERSION, sanitizeForSave } from "./game/persist";
import { GAMES_BY_ID } from "./game/games";
import type { GameId, SessionState } from "./game/types";

export const PENDING_GUEST_KEY = "nocturne.pending-guest.v1";
export const PENDING_GUEST_TTL_MS = 2 * 60 * 60 * 1000;

export interface PendingGuestSnapshot {
  version: 1;
  contentVersion: number;
  stateVersion: number;
  createdAt: number;
  expiresAt: number;
  gameId: GameId;
  slug: string;
  state: SessionState;
}

/**
 * Cross-tab bridge used only while confirming a new account.
 * It deliberately reuses sanitizeForSave: intimate anchors, AI queue and
 * generated/echo current scenes never enter localStorage.
 */
export function createPendingGuestSnapshot(state: SessionState, now = Date.now()): PendingGuestSnapshot {
  const clean = sanitizeForSave(state);
  return {
    version: 1,
    contentVersion: CONTENT_VERSION,
    stateVersion: STATE_VERSION,
    createdAt: now,
    expiresAt: now + PENDING_GUEST_TTL_MS,
    gameId: state.gameId,
    slug: GAMES_BY_ID[state.gameId].slug,
    state: clean,
  };
}

export function stashPendingGuest(state: SessionState, storage: Pick<Storage, "setItem"> = localStorage, now = Date.now()): PendingGuestSnapshot {
  const snapshot = createPendingGuestSnapshot(state, now);
  storage.setItem(PENDING_GUEST_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function clearPendingGuest(storage: Pick<Storage, "removeItem"> = localStorage): void {
  storage.removeItem(PENDING_GUEST_KEY);
}

export function readPendingGuest(
  storage: Pick<Storage, "getItem" | "removeItem"> = localStorage,
  now = Date.now(),
): PendingGuestSnapshot | null {
  const raw = storage.getItem(PENDING_GUEST_KEY);
  if (!raw) return null;
  try {
    const x = JSON.parse(raw) as Partial<PendingGuestSnapshot>;
    const valid =
      x.version === 1 &&
      x.contentVersion === CONTENT_VERSION &&
      x.stateVersion === STATE_VERSION &&
      typeof x.createdAt === "number" &&
      typeof x.expiresAt === "number" &&
      x.expiresAt > now &&
      typeof x.gameId === "string" &&
      x.gameId in GAMES_BY_ID &&
      x.state &&
      typeof x.state === "object" &&
      (x.state as SessionState).gameId === x.gameId &&
      Array.isArray((x.state as SessionState).players);
    if (!valid) {
      storage.removeItem(PENDING_GUEST_KEY);
      return null;
    }
    // Re-sanitize on read as a defense against manually edited browser storage.
    return { ...(x as PendingGuestSnapshot), state: sanitizeForSave(x.state as SessionState) };
  } catch {
    storage.removeItem(PENDING_GUEST_KEY);
    return null;
  }
}
