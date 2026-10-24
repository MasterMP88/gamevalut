import { AI_POLICIES, type AiCapability } from "./policy";

type Usage = {
  calls: number;
  items: number;
  openedAt: number;
  lastScene: number;
};

const SESSION_WINDOW_MS = 6 * 60 * 60_000;
const usage = new Map<string, Usage>();

function usageKey(sessionKey: string, capability: AiCapability) {
  return sessionKey + ":" + capability;
}

function getUsage(
  sessionKey: string,
  capability: AiCapability,
  now: number,
) {
  const key = usageKey(sessionKey, capability);
  const current = usage.get(key);

  if (!current || now - current.openedAt > SESSION_WINDOW_MS) {
    const fresh: Usage = {
      calls: 0,
      items: 0,
      openedAt: now,
      lastScene: -10_000,
    };
    usage.set(key, fresh);
    return fresh;
  }

  return current;
}

export type AiBudgetDecision =
  | { allowed: true; remainingCalls: number }
  | {
      allowed: false;
      reason: "calls" | "batch" | "cooldown" | "local-only";
    };

export function consumeAiBudget(input: {
  sessionKey: string;
  capability: AiCapability;
  items: number;
  sceneNumber?: number;
}): AiBudgetDecision {
  const policy = AI_POLICIES[input.capability];

  if (policy.mode === "local" || policy.maxCallsPerSession <= 0) {
    return { allowed: false, reason: "local-only" };
  }

  if (input.items < 1 || input.items > policy.maxItemsPerCall) {
    return { allowed: false, reason: "batch" };
  }

  const now = Date.now();
  const current = getUsage(input.sessionKey, input.capability, now);
  const sceneNumber = input.sceneNumber;

  if (
    sceneNumber !== undefined &&
    policy.minScenesBetweenCalls > 0 &&
    current.calls > 0 &&
    sceneNumber - current.lastScene < policy.minScenesBetweenCalls
  ) {
    return { allowed: false, reason: "cooldown" };
  }

  if (current.calls >= policy.maxCallsPerSession) {
    return { allowed: false, reason: "calls" };
  }

  current.calls += 1;
  current.items += input.items;
  if (sceneNumber !== undefined) current.lastScene = sceneNumber;

  return {
    allowed: true,
    remainingCalls: Math.max(
      0,
      policy.maxCallsPerSession - current.calls,
    ),
  };
}

export function __resetAiBudgetForTests() {
  usage.clear();
}
