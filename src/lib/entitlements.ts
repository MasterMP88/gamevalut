import type { GameId } from "./game/types";

/**
 * Monetization primitives. No paid plan exists yet: every game is part of the free
 * catalogue. When a payment provider is connected, add product keys here and grant
 * them via the `entitlements` table (written only server-side by the webhook).
 */
export const FREE_GAMES: readonly GameId[] = ["roxy-after-dark", "after-dark-2", "roxy-night", "battle", "coop", "one-two", "night-echo", "ai-director"];

/** Product key that would unlock a game when it is not free. */
export const GAME_PRODUCT: Partial<Record<GameId, string>> = {};

export interface Entitlement { product_key: string; status: string; ends_at: string | null }

export function isUnlocked(id: GameId, ents: Entitlement[], now = Date.now()): boolean {
  if (FREE_GAMES.includes(id)) return true;
  const key = GAME_PRODUCT[id];
  if (!key) return false;
  return ents.some((e) => e.product_key === key && e.status === "active" && (!e.ends_at || Date.parse(e.ends_at) > now));
}