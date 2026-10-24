export interface AdaptiveSignals {
  currentDifficulty: number;
  skipRate: number;
  successRate: number;
  averageResponseMs: number;
  streak: number;
  recentFails: number;
}

export interface AdaptiveDecision {
  difficulty: number;
  pace: "ease" | "hold" | "push";
  reason: "friction" | "flow" | "mastery" | "steady";
}

function clampDifficulty(value: number) {
  return Math.max(1, Math.min(5, Math.round(value * 10) / 10));
}

export function adaptDifficulty(signals: AdaptiveSignals): AdaptiveDecision {
  const current = clampDifficulty(signals.currentDifficulty);
  const skipRate = Math.max(0, Math.min(1, signals.skipRate));
  const successRate = Math.max(0, Math.min(1, signals.successRate));
  const responseMs = Math.max(0, signals.averageResponseMs);

  if (skipRate >= 0.35 || signals.recentFails >= 2) {
    return { difficulty: clampDifficulty(current - 0.7), pace: "ease", reason: "friction" };
  }

  if (successRate >= 0.85 && responseMs > 0 && responseMs <= 4_500 && signals.streak >= 3) {
    return { difficulty: clampDifficulty(current + 0.6), pace: "push", reason: "mastery" };
  }

  if (successRate >= 0.65 && skipRate <= 0.1) {
    return { difficulty: clampDifficulty(current + 0.2), pace: "hold", reason: "flow" };
  }

  return { difficulty: current, pace: "hold", reason: "steady" };
}
