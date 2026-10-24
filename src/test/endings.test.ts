import { describe, expect, it } from "vitest";
import { createSession, reducer, DEFAULT_SETTINGS } from "@/lib/game/engine";
import { GAMES } from "@/lib/game/games";

describe("every game can be ended from the player", () => {
  for (const g of GAMES) {
    it(`${g.title}: FINISH reaches an ending screen state`, () => {
      let s = createSession(g.id, ["Ari", "Nova"], DEFAULT_SETTINGS, 3);
      s = reducer(s, { type: "DONE" });
      s = reducer(s, { type: "FINISH" });
      expect(s.finished).toBe(true);
    });
  }
});