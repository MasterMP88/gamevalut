import { describe, expect, it } from "vitest";
import { GAMES, GAMES_BY_SLUG, SLUG_ALIASES } from "@/lib/game/games";
import { SCENES } from "@/lib/game/scenes";

describe("NOCTURNE branding", () => {
  it("no game title contains personal names", () => {
    for (const g of GAMES) expect(g.title).not.toMatch(/roxy|michal/i);
  });
  it("exposes the clean public slugs", () => {
    expect(GAMES.map((g) => g.slug)).toEqual(["first-spark", "after-dark", "night-shift", "heatcheck", "us-after-dark", "one-two", "night-echo", "director", "pass-the-aux"]);
  });
  it("every old slug aliases to an existing new slug", () => {
    for (const old of ["roxy-after-dark", "after-dark-2", "roxy-night", "battle", "coop", "ai-director"]) {
      expect(GAMES_BY_SLUG[SLUG_ALIASES[old]!]).toBeDefined();
    }
  });
  it("flagship is titled NIGHT//ECHO — Director", () => {
    expect(GAMES_BY_SLUG["director"]!.title).toBe("NIGHT//ECHO — Director");
  });
  it("no scene text hard-codes personal names", () => {
    for (const s of SCENES) expect(`${s.title} ${s.prompt}`).not.toMatch(/roxy|michal/i);
  });
  it("every non-battle game has its own signature scenes", () => {
    for (const id of ["roxy-after-dark", "after-dark-2", "roxy-night", "coop", "one-two", "night-echo"] as const) {
      expect(SCENES.filter((s) => s.only?.includes(id)).length).toBeGreaterThanOrEqual(2);
    }
  });
});
