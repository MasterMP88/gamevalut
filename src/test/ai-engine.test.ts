import { beforeEach, describe, expect, it } from "vitest";
import { adaptDifficulty } from "../lib/ai/adaptive";
import { adaptiveTargetPhase, createSession, DEFAULT_SETTINGS } from "../lib/game/engine";
import {
  AI_POLICIES,
  aiModeFor,
  clampedBatchSize,
  isLiveAi,
} from "../lib/ai/policy";
import {
  __resetAiBudgetForTests,
  consumeAiBudget,
} from "../lib/ai/budget.server";
import {
  __clearAiCacheForTests,
  aiCacheKey,
  withAiCache,
} from "../lib/ai/cache.server";
import {
  experienceRequestSchema,
  musicClueResultSchema,
} from "../lib/ai/experience-schema";

describe("GANG AI policy", () => {
  it("keeps common adaptation local and reserves live AI for high-value moments", () => {
    expect(aiModeFor("gang-mode", "adaptive-difficulty")).toBe("local");
    expect(aiModeFor("gang-mode", "judge")).toBe("ai-lite");
    expect(aiModeFor("gang-mode", "director")).toBe("ai-premium");
    expect(isLiveAi(aiModeFor("one-two", "adaptive-difficulty"))).toBe(false);
    expect(AI_POLICIES.vision.maxCallsPerSession).toBeLessThanOrEqual(2);
  });

  it("clamps generated batches to the economic policy", () => {
    expect(clampedBatchSize("director", 99)).toBe(6);
    expect(clampedBatchSize("personalize-pack", 99)).toBe(40);
    expect(clampedBatchSize("adaptive-difficulty", 5)).toBe(0);
  });
});

describe("zero-cost adaptive difficulty", () => {
  it("eases off when the round creates friction", () => {
    expect(
      adaptDifficulty({
        currentDifficulty: 3,
        skipRate: 0.4,
        successRate: 0.5,
        averageResponseMs: 9_000,
        streak: 0,
        recentFails: 2,
      }),
    ).toEqual({
      difficulty: 2.3,
      pace: "ease",
      reason: "friction",
    });
  });


  it("feeds structural friction back into the real local scene picker", () => {
    const state = createSession(
      "after-dark-2",
      ["Ari", "Nova"],
      DEFAULT_SETTINGS,
      42,
    );

    const warmed = {
      ...state,
      heat: 3.4,
      log: [
        { n: 1, title: "A", type: "MISSION" as const, player: "Ari", outcome: "skipped" as const },
        { n: 2, title: "B", type: "TIMER" as const, player: "Nova", outcome: "done" as const },
        { n: 3, title: "C", type: "QUESTION" as const, player: "Ari", outcome: "skipped" as const },
        { n: 4, title: "D", type: "CHOICE" as const, player: "Nova", outcome: "skipped" as const },
      ],
    };

    expect(adaptiveTargetPhase(warmed)).toBeLessThan(3);
  });

  it("pushes strong fast players without a model call", () => {
    const result = adaptDifficulty({
      currentDifficulty: 3,
      skipRate: 0,
      successRate: 0.95,
      averageResponseMs: 3_000,
      streak: 4,
      recentFails: 0,
    });

    expect(result.difficulty).toBe(3.6);
    expect(result.pace).toBe("push");
    expect(result.reason).toBe("mastery");
  });
});

describe("AI session budget", () => {
  beforeEach(() => __resetAiBudgetForTests());

  it("enforces Director batch size and scene cooldown", () => {
    expect(
      consumeAiBudget({
        sessionKey: "session-a",
        capability: "director",
        items: 7,
        sceneNumber: 0,
      }),
    ).toEqual({ allowed: false, reason: "batch" });

    expect(
      consumeAiBudget({
        sessionKey: "session-a",
        capability: "director",
        items: 6,
        sceneNumber: 0,
      }).allowed,
    ).toBe(true);

    expect(
      consumeAiBudget({
        sessionKey: "session-a",
        capability: "director",
        items: 6,
        sceneNumber: 1,
      }),
    ).toEqual({ allowed: false, reason: "cooldown" });

    expect(
      consumeAiBudget({
        sessionKey: "session-a",
        capability: "director",
        items: 6,
        sceneNumber: 4,
      }).allowed,
    ).toBe(true);
  });

  it("does not apply scene cooldown to non-scene batch APIs", () => {
    for (let i = 0; i < AI_POLICIES.judge.maxCallsPerSession; i += 1) {
      expect(
        consumeAiBudget({
          sessionKey: "judge-session",
          capability: "judge",
          items: 2,
        }).allowed,
      ).toBe(true);
    }

    expect(
      consumeAiBudget({
        sessionKey: "judge-session",
        capability: "judge",
        items: 2,
      }),
    ).toEqual({ allowed: false, reason: "calls" });
  });

  it("never spends AI budget on local-only capabilities", () => {
    expect(
      consumeAiBudget({
        sessionKey: "local",
        capability: "adaptive-difficulty",
        items: 1,
      }),
    ).toEqual({ allowed: false, reason: "local-only" });
  });
});

describe("AI cache", () => {
  beforeEach(() => __clearAiCacheForTests());

  it("uses stable collision-resistant keys regardless of object key order", async () => {
    const a = await aiCacheKey("x", { a: 1, b: 2 });
    const b = await aiCacheKey("x", { b: 2, a: 1 });
    expect(a).toBe(b);
    expect(a).toMatch(/^x:[a-f0-9]{32}$/);
  });

  it("reuses successful work and can avoid caching failures", async () => {
    let calls = 0;
    const first = await withAiCache(
      "success",
      10_000,
      async () => {
        calls += 1;
        return { ok: true };
      },
      (value) => value.ok,
    );
    const second = await withAiCache(
      "success",
      10_000,
      async () => {
        calls += 1;
        return { ok: true };
      },
      (value) => value.ok,
    );

    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe(true);
    expect(calls).toBe(1);

    await withAiCache(
      "failure",
      10_000,
      async () => {
        calls += 1;
        return { ok: false };
      },
      (value) => value.ok,
    );
    const retry = await withAiCache(
      "failure",
      10_000,
      async () => {
        calls += 1;
        return { ok: true };
      },
      (value) => value.ok,
    );

    expect(retry.cacheHit).toBe(false);
    expect(calls).toBe(3);
  });
});

describe("AI experience contracts", () => {
  it("rejects AI experience requests without explicit opt-in", () => {
    const result = experienceRequestSchema.safeParse({
      kind: "music-clue",
      sessionKey: "music-consent",
      locale: "de",
      track: { title: "Test", artist: "Artist" },
      difficulty: 2,
      count: 3,
    });
    expect(result.success).toBe(false);
  });

  it("supports 2–99 player personalization while keeping generation bounded", () => {
    const base = {
      kind: "personalize-pack" as const,
      aiConsent: true as const,
      sessionKey: "gang-99",
      locale: "de" as const,
      playerCount: 99,
      names: [],
      vibe: "mixed" as const,
      intensity: 3,
      optedInFacts: [],
      tabooTopics: [],
      count: 40,
    };

    expect(experienceRequestSchema.safeParse(base).success).toBe(true);
    expect(
      experienceRequestSchema.safeParse({ ...base, playerCount: 100 }).success,
    ).toBe(false);
    expect(
      experienceRequestSchema.safeParse({ ...base, count: 41 }).success,
    ).toBe(false);
  });

  it("requires progressive music clue batches to stay small", () => {
    expect(
      musicClueResultSchema.safeParse({
        clues: [
          "Ein Jahrzehnt, in dem Klingeltöne noch Status waren.",
          "Mehr Tanzfläche als Wohnzimmer.",
        ],
      }).success,
    ).toBe(true);

    expect(
      musicClueResultSchema.safeParse({ clues: ["Nur ein Hinweis"] }).success,
    ).toBe(false);
  });
});
