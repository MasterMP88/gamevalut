import { describe, expect, it } from "vitest";
import {
  BATTLE_CHAPTER,
  CUT_MIN_GAP,
  DEFAULT_SETTINGS,
  ECHO_GAP,
  STEER_MOMENTUM,
  buildDirectorContext,
  createSession,
  echoKind,
  reducer,
  vaultUnlocked,
} from "@/lib/game/engine";
import { COMBO_SCENES, DETOURS, DIRECTOR_CUTS, MILESTONES, strongestPair } from "@/lib/game/specials";
import { GAMES_BY_ID } from "@/lib/game/games";
import { pickLocal, weakestEnergy } from "@/lib/game/engine";
import { enforceContract } from "@/lib/game/contract";
import { directorContextSchema } from "@/lib/game/ai-schema";
import type { GameId, SessionState } from "@/lib/game/types";

const P: [string, string] = ["Ari", "Nova"];

function play(id: GameId, n: number, seed = 7) {
  let s = createSession(id, P, DEFAULT_SETTINGS, seed);
  const seen: SessionState[] = [s];
  for (let i = 0; i < n && !s.finished; i++) {
    s = s.current?.type === "SHOWDOWN" ? reducer(s, { type: "SHOWDOWN_WIN", winner: 0 }) : reducer(s, { type: "DONE" });
    seen.push(s);
  }
  return { s, types: seen.map((x) => x.current!.type), seen };
}

describe("After Dark — kinetic", () => {
  it("never plays more than 1 plain QUESTION in any 4 scenes", () => {
    for (const seed of [1, 2, 3, 4]) {
      const { types } = play("after-dark-2", 40, seed);
      for (let i = 0; i + 4 <= types.length; i++) expect(types.slice(i, i + 4).filter((t) => t === "QUESTION").length).toBeLessThanOrEqual(1);
    }
  });
  it("shifts tempo every 5 scenes with a visible cue", () => {
    const { seen } = play("after-dark-2", 12);
    const at5 = seen.find((x) => x.sceneNumber === 5)!;
    expect(at5.tempo).toBe("speed");
    expect(at5.current?.cue).toMatch(/Speedrunde/);
    expect(seen.find((x) => x.sceneNumber === 10)!.tempo).toBe("silent");
  });
});

describe("Night Shift — steering", () => {
  it("a chosen direction holds for 3 scenes, then releases", () => {
    let s = createSession("roxy-night", P, DEFAULT_SETTINGS, 3);
    s = reducer(s, { type: "STEER", steer: "funnier" });
    expect(s.steerLeft).toBe(STEER_MOMENTUM);
    for (let i = 0; i < 2; i++) s = reducer(s, { type: "DONE" });
    expect(s.steer).toBe("funnier");
    s = reducer(s, { type: "DONE" });
    expect(s.steer).toBeNull();
  });
  it("takes detours every 7–11 scenes", () => {
    const { seen } = play("roxy-night", 60);
    const at = seen.filter((x) => x.current!.id.startsWith("detour-")).map((x) => x.sceneNumber);
    expect(at.length).toBeGreaterThanOrEqual(4);
    expect(at[0]).toBeGreaterThanOrEqual(7);
    for (let i = 1; i < at.length; i++) {
      expect(at[i]! - at[i - 1]!).toBeGreaterThanOrEqual(7);
      expect(at[i]! - at[i - 1]!).toBeLessThanOrEqual(11);
    }
  });
});

describe("Heatcheck — strategy", () => {
  it("gives a comeback bonus to a player trailing by 5+", () => {
    let s = createSession("battle", P, DEFAULT_SETTINGS, 5);
    s = { ...s, sparks: [0, 8], turn: 0 };
    const before = s.sparks[0];
    s = reducer(s, { type: "DONE" });
    expect(s.sparks[0] - before).toBeGreaterThanOrEqual(2);
  });
  it("Raise makes a showdown worth 6 and only works on showdowns", () => {
    let s = createSession("battle", P, DEFAULT_SETTINGS, 5);
    s = { ...s, powerUps: [1, 1] };
    expect(reducer(s, { type: "USE_POWERUP", kind: "raise" }).raise).toBe(false);
    while (s.sceneNumber < BATTLE_CHAPTER) s = reducer(s, { type: "DONE" });
    s = { ...s, powerUps: [1, 1] };
    expect(s.current?.type).toBe("SHOWDOWN");
    s = reducer(s, { type: "USE_POWERUP", kind: "raise" });
    expect(s.raise).toBe(true);
    const w = s.sparks[1];
    s = reducer(s, { type: "SHOWDOWN_WIN", winner: 1 });
    expect(s.sparks[1] - w).toBe(6);
    expect(s.raise).toBe(false);
  });
});

describe("US//AFTER DARK — co-op", () => {
  it("plays all 3 shared milestones before the Vault opens", () => {
    const { s, seen } = play("coop", 250, 11);
    expect(s.finished).toBe(true);
    expect(s.milestones).toEqual(MILESTONES.map((m) => m.id));
    const msScenes = seen.filter((x) => x.current?.id.startsWith("ms-"));
    expect(msScenes.length).toBe(3);
    expect(vaultUnlocked({ ...s, milestones: [] })).toBe(false);
  });
});

describe("ONE//TWO — rhythm", () => {
  it("never plays 3 questions in a row and returns a question to the other player", () => {
    for (const seed of [1, 2, 3, 5, 8]) {
      const { types, seen } = play("one-two", 40, seed);
      for (let i = 0; i + 3 <= types.length; i++) expect(types.slice(i, i + 3).every((t) => t === "QUESTION")).toBe(false);
      const pairs = seen.filter((x) => x.current?.id.startsWith("pair-"));
      for (const p of pairs) expect(p.current!.cue).toMatch(/Jetzt du/);
    }
    const anyPair = [1, 2, 3, 5, 8].some((seed) => play("one-two", 40, seed).seen.some((x) => x.current?.id.startsWith("pair-")));
    expect(anyPair).toBe(true);
  });
});

describe("NIGHT//ECHO — callbacks", () => {
  it("spaces callbacks at least 5 scenes apart and maps tags to callback kinds", () => {
    let s = createSession("night-echo", P, DEFAULT_SETTINGS, 9);
    const echoAt: number[] = [];
    for (let i = 0; i < 40; i++) {
      if (s.current?.type === "ECHO") echoAt.push(s.sceneNumber);
      s = i < 6 ? reducer(s, { type: "DONE", capture: { text: `Antwort Nummer ${i}`, private: false } }) : reducer(s, { type: "DONE" });
    }
    expect(echoAt.length).toBeGreaterThan(1);
    for (let i = 1; i < echoAt.length; i++) expect(echoAt[i]! - echoAt[i - 1]!).toBeGreaterThanOrEqual(ECHO_GAP);
    expect(echoKind(["plan"], "deep")).toBe("future");
    expect(echoKind(["prediction"], "funny")).toBe("prediction");
    expect(echoKind(["memory"], "funny")).toBe("emotional");
  });
});

describe("Director — composition", () => {
  it("places Director Cuts at least 8 scenes apart and keeps a mixed format distribution", () => {
    const { seen, types } = play("ai-director", 40, 4);
    const cuts = seen.filter((x) => x.current?.id.startsWith("cut-")).map((x) => x.sceneNumber);
    expect(cuts.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < cuts.length; i++) expect(cuts[i]! - cuts[i - 1]!).toBeGreaterThanOrEqual(CUT_MIN_GAP);
    for (let i = 0; i + 10 <= types.length; i++) {
      const w = types.slice(i, i + 10);
      expect(w.filter((t) => t === "QUESTION").length).toBeLessThanOrEqual(4);
      expect(new Set(w).size).toBeGreaterThanOrEqual(4);
    }
  });
  it("rejects over-represented AI formats and sends a schema-valid context", () => {
    let { s } = play("ai-director", 12, 4);
    const ctx = buildDirectorContext(s);
    expect(directorContextSchema.safeParse(ctx).success).toBe(true);
    expect(ctx.recentTypes.length).toBeLessThanOrEqual(10);
    s = { ...s, log: Array.from({ length: 10 }, (_, n) => ({ n, title: "x", type: "QUESTION" as const, player: "Ari", outcome: "done" as const })) };
    const ai = { id: "ai-q", type: "QUESTION" as const, flavor: "funny" as const, phase: 0, title: "AI", prompt: "Was jetzt?", source: "ai" as const };
    s = reducer(s, { type: "AI_SCENES", scenes: [ai] });
    s = reducer(s, { type: "DONE" });
    expect(s.current?.id).not.toBe("ai-q");
  });
});

describe("Engine-injected scenes", () => {
  it("all pass the interaction contract", () => {
    for (const sc of [...DETOURS, ...DIRECTOR_CUTS, ...MILESTONES.map((m) => m.scene({ chaos: 50, connection: 50, heat: 50 })), ...Object.values(COMBO_SCENES)]) expect(enforceContract(sc)).toEqual(sc);
  });
});

describe("Games are measurably different", () => {
  it("type distributions differ between games", () => {
    const share = (id: GameId, t: string) => {
      const { types } = play(id, 40, 2);
      return types.filter((x) => x === t).length / types.length;
    };
    expect(share("after-dark-2", "QUESTION")).toBeLessThan(share("one-two", "QUESTION"));
    expect(share("one-two", "TIMER")).toBe(0);
    expect(share("battle", "SHOWDOWN")).toBeGreaterThan(0);
  });
});

describe("Game identities", () => {
  it("01 First Spark: movement + playful beat in the first 3 scenes, max 3 QUESTION per 6", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { seen, types } = play("roxy-after-dark", 30, seed);
      const first = seen.slice(0, 3).map((x) => x.current!);
      expect(first.some((sc) => sc.type === "MISSION" || sc.type === "TIMER")).toBe(true);
      expect(first.some((sc) => sc.type !== "QUESTION" || sc.flavor === "funny")).toBe(true);
      expect(first.every((sc) => sc.phase === 0)).toBe(true);
      for (let i = 0; i + 6 <= types.length; i++) expect(types.slice(i, i + 6).filter((t) => t === "QUESTION").length).toBeLessThanOrEqual(3);
      expect(types).not.toContain("SYNC");
    }
  });
  it("02 After Dark: max 2 QUESTION per 8; tempo shifts change selection", () => {
    for (const seed of [1, 2, 3]) {
      const { types, seen } = play("after-dark-2", 40, seed);
      for (let i = 0; i + 8 <= types.length; i++) expect(types.slice(i, i + 8).filter((t) => t === "QUESTION").length).toBeLessThanOrEqual(2);
      const inTempo = seen.filter((x) => x.tempo).map((x) => x.current!.type);
      expect(inTempo.filter((t) => t === "QUESTION").length).toBe(0);
    }
  });
  it("04 Heatcheck: REBOUND hands the scene over; skipping it pays the sender", () => {
    let s = createSession("battle", P, DEFAULT_SETTINGS, 5);
    s = { ...s, powerUps: [1, 0], turn: 0 };
    const id = s.current!.id;
    s = reducer(s, { type: "USE_POWERUP", kind: "rebound" });
    expect(s.turn).toBe(1);
    expect(s.current!.id).toBe(id);
    const before = s.sparks[0];
    s = reducer(s, { type: "SKIP" });
    expect(s.sparks[0] - before).toBe(2);
    expect(s.rebound).toBeNull();
  });
  it("04 Heatcheck: READ pays +2 when the opponent completes, nothing on skip", () => {
    let s = createSession("battle", P, DEFAULT_SETTINGS, 5);
    s = { ...s, powerUps: [1, 0], turn: 0 };
    s = reducer(s, { type: "USE_POWERUP", kind: "read" });
    s = reducer(s, { type: "DONE" }); // reader's own scene
    expect(s.read).toBe(0);
    const before = s.sparks[0];
    s = reducer(s, { type: "DONE" }); // opponent completes
    expect(s.sparks[0] - before).toBe(2);
    expect(s.read).toBeNull();
  });
  it("04 Heatcheck: bigger comeback help for a large gap, and a winner at the end", () => {
    let s = createSession("battle", P, DEFAULT_SETTINGS, 5);
    s = { ...s, sparks: [0, 12], turn: 0, streaks: [0, 0] };
    const b = s.sparks[0];
    s = reducer(s, { type: "DONE" });
    expect(s.sparks[0] - b).toBeGreaterThanOrEqual(3);
    const end = play("battle", 80, 3).s;
    expect(end.finished).toBe(true);
  });
  it("05 US//AFTER DARK: local selection targets the weakest energy", () => {
    let s = createSession("coop", P, DEFAULT_SETTINGS, 2);
    for (const e of [{ chaos: 0, connection: 60, heat: 60 }, { chaos: 60, connection: 0, heat: 60 }, { chaos: 60, connection: 60, heat: 0 }]) {
      s = { ...s, energies: e };
      const want = weakestEnergy(s);
      let hits = 0;
      for (let k = 0; k < 10; k++) if (want.includes(pickLocal({ ...s, seed: k * 97 }).scene.flavor)) hits++;
      expect(hits).toBeGreaterThanOrEqual(7);
    }
    expect(strongestPair({ chaos: 50, connection: 45, heat: 10 })).toBe("chaos+connection");
    expect(strongestPair({ chaos: 10, connection: 45, heat: 50 })).toBe("connection+heat");
    expect(strongestPair({ chaos: 50, connection: 10, heat: 45 })).toBe("chaos+heat");
  });
  it("06 ONE//TWO: strict alternation, only QUESTION/MISSION, recovery after deep", () => {
    const { seen } = play("one-two", 40, 4);
    for (let i = 1; i < seen.length; i++) expect(seen[i]!.turn).not.toBe(seen[i - 1]!.turn);
    expect(seen.every((x) => ["QUESTION", "MISSION"].includes(x.current!.type))).toBe(true);
    let deepAfterDeep = 0, deep = 0;
    for (let i = 1; i < seen.length; i++) if (seen[i - 1]!.current!.flavor === "deep") { deep++; if (seen[i]!.current!.flavor === "deep") deepAfterDeep++; }
    expect(deepAfterDeep).toBeLessThanOrEqual(Math.floor(deep / 2));
    expect(GAMES_BY_ID["one-two"].memory).toBeFalsy();
  });
  it("07 NIGHT//ECHO: callbacks never back-to-back and kinds map to templates", () => {
    expect(echoKind(["ritual"], "funny")).toBe("ritual");
    expect(echoKind(["spark"], "cheeky")).toBe("flirty");
    let s = createSession("night-echo", P, DEFAULT_SETTINGS, 9);
    const types: string[] = [];
    for (let i = 0; i < 40; i++) {
      types.push(s.current!.type);
      s = s.current?.capture ? reducer(s, { type: "DONE", capture: { text: `Notiz ${i}`, private: false } }) : reducer(s, { type: "DONE" });
    }
    for (let i = 1; i < types.length; i++) expect(types[i] === "ECHO" && types[i - 1] === "ECHO").toBe(false);
  });
  it("08 Director: same type never 3 in a row and desired mix is sent", () => {
    const { types, s } = play("ai-director", 40, 6);
    for (let i = 2; i < types.length; i++) expect(types[i] === types[i - 1] && types[i] === types[i - 2]).toBe(false);
    expect(Array.isArray(buildDirectorContext(s).wantTypes)).toBe(true);
  });
});