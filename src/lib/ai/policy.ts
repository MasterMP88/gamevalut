import type { GameId } from "../game/types";

export type AiCapability =
  | "director"
  | "personalize-pack"
  | "judge"
  | "adaptive-difficulty"
  | "secret-mission"
  | "music-clue"
  | "narration"
  | "vision";

export type AiExecutionMode = "local" | "ai-lite" | "ai-premium";
export type AiCostClass = "zero" | "low" | "medium" | "high";

export interface AiCapabilityPolicy {
  mode: AiExecutionMode;
  costClass: AiCostClass;
  maxCallsPerSession: number;
  maxItemsPerCall: number;
  minScenesBetweenCalls: number;
  cacheTtlMs: number;
}

export const AI_POLICIES: Record<AiCapability, AiCapabilityPolicy> = {
  director: { mode: "ai-premium", costClass: "medium", maxCallsPerSession: 10, maxItemsPerCall: 6, minScenesBetweenCalls: 4, cacheTtlMs: 15 * 60_000 },
  "personalize-pack": { mode: "ai-lite", costClass: "low", maxCallsPerSession: 2, maxItemsPerCall: 40, minScenesBetweenCalls: 0, cacheTtlMs: 15 * 60_000 },
  judge: { mode: "ai-lite", costClass: "low", maxCallsPerSession: 12, maxItemsPerCall: 12, minScenesBetweenCalls: 1, cacheTtlMs: 2 * 60_000 },
  "adaptive-difficulty": { mode: "local", costClass: "zero", maxCallsPerSession: 0, maxItemsPerCall: 0, minScenesBetweenCalls: 0, cacheTtlMs: 0 },
  "secret-mission": { mode: "ai-lite", costClass: "low", maxCallsPerSession: 3, maxItemsPerCall: 12, minScenesBetweenCalls: 4, cacheTtlMs: 15 * 60_000 },
  "music-clue": { mode: "ai-lite", costClass: "low", maxCallsPerSession: 8, maxItemsPerCall: 8, minScenesBetweenCalls: 1, cacheTtlMs: 24 * 60 * 60_000 },
  narration: { mode: "ai-lite", costClass: "low", maxCallsPerSession: 6, maxItemsPerCall: 6, minScenesBetweenCalls: 3, cacheTtlMs: 30 * 60_000 },
  vision: { mode: "ai-premium", costClass: "high", maxCallsPerSession: 2, maxItemsPerCall: 1, minScenesBetweenCalls: 8, cacheTtlMs: 0 },
};

export type AiGameId = GameId | "gang-mode" | "pass-the-aux" | "first-beat";
type CapabilityMap = Partial<Record<AiCapability, AiExecutionMode>>;

export const GAME_AI_CAPABILITIES: Record<AiGameId, CapabilityMap> = {
  "roxy-after-dark": { "personalize-pack": "ai-lite", "adaptive-difficulty": "local" },
  "after-dark-2": { "personalize-pack": "ai-lite", "adaptive-difficulty": "local", "secret-mission": "ai-lite", narration: "ai-lite" },
  "roxy-night": { "personalize-pack": "ai-lite", "adaptive-difficulty": "local", narration: "ai-lite" },
  battle: { "adaptive-difficulty": "local", "secret-mission": "ai-lite", judge: "ai-lite", narration: "ai-lite" },
  coop: { "adaptive-difficulty": "local", narration: "ai-lite", "personalize-pack": "ai-lite" },
  "one-two": { "adaptive-difficulty": "local", "personalize-pack": "ai-lite" },
  "night-echo": { "adaptive-difficulty": "local", "personalize-pack": "ai-lite", narration: "ai-lite" },
  "ai-director": { director: "ai-premium", "adaptive-difficulty": "local", "personalize-pack": "ai-lite", "secret-mission": "ai-lite", narration: "ai-lite" },
  "gang-mode": { director: "ai-premium", "personalize-pack": "ai-lite", judge: "ai-lite", "adaptive-difficulty": "local", "secret-mission": "ai-lite", "music-clue": "ai-lite", narration: "ai-lite" },
  "pass-the-aux": { "adaptive-difficulty": "local", "music-clue": "ai-lite", narration: "ai-lite" },
  "first-beat": { "adaptive-difficulty": "local", "music-clue": "ai-lite" },
};

export function aiModeFor(gameId: AiGameId, capability: AiCapability): AiExecutionMode | null {
  return GAME_AI_CAPABILITIES[gameId]?.[capability] ?? null;
}

export function isLiveAi(mode: AiExecutionMode | null) {
  return mode === "ai-lite" || mode === "ai-premium";
}

export function clampedBatchSize(capability: AiCapability, requested: number) {
  const max = AI_POLICIES[capability].maxItemsPerCall;
  if (max <= 0) return 0;
  return Math.max(1, Math.min(max, Math.floor(requested)));
}
