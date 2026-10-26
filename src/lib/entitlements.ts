import type { GameId } from "./game/types";
import { accessForCoupleScene, accessForGangHost, type AccessDecision, type Entitlement as CoreEntitlement } from "./commerce/core";
import { GANG_HOST_PRODUCT_KEYS } from "./commerce/offers";

/**
 * Paid access decisions. Every couple game is in the catalogue; the paywall is
 * scene-based (Free Preview through scene 5) and comes from the vendored commerce core.
 * Rows in `entitlements` are written only by the Stripe webhook (service role).
 */
export const FREE_GAMES: readonly GameId[] = ["roxy-after-dark", "after-dark-2", "roxy-night", "battle", "coop", "one-two", "night-echo", "ai-director", "pass-the-aux"];
export const GAME_PRODUCT: Partial<Record<GameId, string>> = {};

export interface Entitlement { product_key: string; status: string; ends_at: string | null; starts_at?: string | null }

/** Game is listed/startable (preview). */
export function isUnlocked(id: GameId, ents: Entitlement[], now = Date.now()): boolean {
  if (FREE_GAMES.includes(id)) return true;
  const key = GAME_PRODUCT[id];
  if (!key) return false;
  return ents.some((e) => e.product_key === key && e.status === "active" && (!e.ends_at || Date.parse(e.ends_at) > now));
}

export const toCore = (ents: readonly Entitlement[]): CoreEntitlement[] =>
  ents.map((e) => ({ productKey: e.product_key, status: e.status, startsAt: e.starts_at ?? null, endsAt: e.ends_at }));

export function coupleSceneAccess(sceneNumber: number, ents: readonly Entitlement[], now = Date.now()): AccessDecision {
  return accessForCoupleScene(sceneNumber, toCore(ents), now);
}

export function canHostGang(ents: readonly Entitlement[], now = Date.now()): boolean {
  return accessForGangHost(toCore(ents), GANG_HOST_PRODUCT_KEYS, now).allowed;
}
