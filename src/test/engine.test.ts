import { describe, expect, it } from "vitest";
import { createSession, reducer, DEFAULT_SETTINGS, buildDirectorContext, candidatePool, BATTLE_CHAPTER } from "@/lib/game/engine";
import { GAMES, poolFor } from "@/lib/game/games";
import { SCENES } from "@/lib/game/scenes";
import { toScene } from "@/lib/game/ai-schema";
import type { SessionState } from "@/lib/game/types";

const P: [string, string] = ["Ari", "Nova"];
const run = (s: SessionState, n: number) => {
  for (let i = 0; i < n; i++) s = reducer(s, { type: "DONE" });
  return s;
};

describe("scene library", () => {
  it("meets minimum fallback counts per game", () => {
    const min: Record<string, number> = { "roxy-after-dark": 60, "after-dark-2": 60, "roxy-night": 70, battle: 50, coop: 70, "one-two": 100, "night-echo": 80, "ai-director": 80, "pass-the-aux": 40 };
    for (const g of GAMES) expect(poolFor(g, SCENES).length, g.id).toBeGreaterThanOrEqual(min[g.id]!);
  });
});

describe("session engine", () => {
  it("strictly alternates players", () => {
    let s = createSession("one-two", P, DEFAULT_SETTINGS, 1);
    const turns = [s.turn];
    for (let i = 0; i < 5; i++) {
      s = reducer(s, { type: "DONE" });
      turns.push(s.turn);
    }
    expect(turns).toEqual([0, 1, 0, 1, 0, 1]);
  });

  it("never serves touch or sensual scenes when disabled", () => {
    let s = createSession("roxy-night", P, { ...DEFAULT_SETTINGS, touch: false, sensual: false }, 7);
    for (let i = 0; i < 60; i++) {
      expect(s.current?.flags?.touch).toBeFalsy();
      expect(s.current?.flavor).not.toBe("sensual");
      s = reducer(s, { type: "DONE" });
    }
  });

  it("never serves drink scenes when drinks are off", () => {
    const s = createSession("roxy-after-dark", P, { ...DEFAULT_SETTINGS, drinks: false }, 3);
    expect(candidatePool(s).some((x) => x.flags?.drink)).toBe(false);
  });

  it("skips de-escalate heat", () => {
    let s = run(createSession("one-two", P, DEFAULT_SETTINGS, 2), 8);
    const before = s.heat;
    s = reducer(reducer(s, { type: "SKIP" }), { type: "SKIP" });
    expect(s.heat).toBeLessThan(before);
    expect(s.skipCount).toBe(2);
  });

  it("battle serves a showdown every chapter", () => {
    let s = createSession("battle", P, DEFAULT_SETTINGS, 5);
    while (s.sceneNumber < BATTLE_CHAPTER) s = reducer(s, { type: "DONE" });
    expect(s.current?.type).toBe("SHOWDOWN");
  });

  it("memory anchor echoes 5–20 scenes later and deleted anchors are never sent", () => {
    let s = createSession("night-echo", P, DEFAULT_SETTINGS, 9);
    s = reducer(s, { type: "DONE", capture: { text: "Ananas auf Pizza ist Kunst", private: false } });
    const a = s.anchors[0]!;
    expect(a.dueAt - a.sceneNumber).toBeGreaterThanOrEqual(5);
    expect(a.dueAt - a.sceneNumber).toBeLessThanOrEqual(20);
    expect(buildDirectorContext(s).anchors.map((x) => x.id)).toContain(a.id);
    let echoed = false;
    for (let i = 0; i < 25 && !echoed; i++) {
      if (s.current?.anchorId === a.id) echoed = true;
      else s = reducer(s, { type: "DONE" });
    }
    expect(echoed).toBe(true);
    s = reducer(s, { type: "DELETE_ANCHOR", id: a.id });
    expect(buildDirectorContext(s).anchors).toHaveLength(0);
  });

  it("director context names the active player as currentPlayer", () => {
    let s = createSession("ai-director", P, DEFAULT_SETTINGS, 4);
    expect(buildDirectorContext(s).currentPlayer).toBe("Ari");
    s = reducer(s, { type: "DONE" });
    expect(buildDirectorContext(s).currentPlayer).toBe("Nova");
  });

  it("private anchors are never sent to the AI", () => {
    let s = createSession("ai-director", P, DEFAULT_SETTINGS, 4);
    s = reducer(s, { type: "DONE", capture: { text: "Geheim", private: true } });
    expect(s.anchors[0]!.sensitivity).toBe("high");
    expect(buildDirectorContext(s).anchors).toHaveLength(0);
  });

  it("disabling a setting replaces a blocked current scene immediately", () => {
    let s = createSession("roxy-night", P, { ...DEFAULT_SETTINGS, touch: true }, 1);
    for (let i = 0; i < 80 && !s.current?.flags?.touch; i++) s = reducer(s, { type: "DONE" });
    expect(s.current?.flags?.touch).toBe(true);
    const turn = s.turn;
    s = reducer(s, { type: "SETTINGS", settings: { ...DEFAULT_SETTINGS, touch: false } });
    expect(s.current?.flags?.touch).toBeFalsy();
    expect(s.turn).toBe(turn);
  });

  it("battle reaches a final winner", () => {
    let s = createSession("battle", P, DEFAULT_SETTINGS, 5);
    for (let i = 0; i < 60 && !s.finished; i++)
      s = s.current?.type === "SHOWDOWN" ? reducer(s, { type: "SHOWDOWN_WIN", winner: 0 }) : reducer(s, { type: "DONE" });
    expect(s.finished).toBe(true);
    expect(s.sparks[0]).toBeGreaterThan(s.sparks[1]);
  });

  it("caps captured text at 220 chars", () => {
    let s = createSession("night-echo", P, DEFAULT_SETTINGS, 4);
    s = reducer(s, { type: "DONE", capture: { text: "x".repeat(400), private: false } });
    expect(s.anchors[0]!.shortText.length).toBe(220);
  });

  it("coop unlocks the vault when all energies reach the threshold", () => {
    let s = createSession("coop", P, DEFAULT_SETTINGS, 11);
    for (let i = 0; i < 200 && !s.finished; i++) s = reducer(s, { type: "DONE" });
    expect(s.finished).toBe(true);
    expect(Math.min(s.energies.chaos, s.energies.connection, s.energies.heat)).toBeGreaterThanOrEqual(70);
  });
});

describe("AI validation", () => {
  const good = { id: "x1", type: "QUESTION", targetPlayer: "Nova", emoji: "✨", title: "Test", prompt: "Nova, was bringt Ari heute zum Lachen?" };
  it("accepts a valid scene and rejects malformed ones", () => {
    expect(toScene(good, P, 1, true)?.prompt).toBe("{me}, was bringt {you} heute zum Lachen?");
    expect(toScene({ ...good, type: "NOPE" }, P, 1, true)).toBeNull();
    expect(toScene({ ...good, targetPlayer: "Fremd" }, P, 1, true)).toBeNull();
    expect(toScene({ ...good, type: "SYNC", choices: ["a"] }, P, 1, true)).toBeNull();
  });
});
