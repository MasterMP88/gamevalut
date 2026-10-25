import { describe, expect, it } from "vitest";
import { GAMES } from "@/lib/game/games";
import { PREVIEWS } from "@/lib/game/previews";

describe("Mechanic previews", () => {
  it("every game has a mechanic sentence, Ideal-wenn line and 3–6 frames", () => {
    for (const g of GAMES) {
      const p = PREVIEWS[g.id];
      expect(p.mechanic.length).toBeGreaterThan(20);
      expect(p.idealWhen).toMatch(/^Ideal wenn /);
      expect(p.frames.length).toBeGreaterThanOrEqual(3);
      expect(p.frames.length).toBeLessThanOrEqual(6);
    }
  });
  it("truth labels are only claimed when true", () => {
    for (const g of GAMES) {
      const t = PREVIEWS[g.id].truths;
      expect(t.includes("AI geführt")).toBe(!!g.ai);
      expect(t.includes("gegeneinander")).toBe(!!g.battle);
      if (t.includes("gemeinsam")) expect(g.coop).toBe(true);
      expect(t).toContain("für 2");
    }
  });
  it("only Heatcheck previews a score, only US//AFTER DARK previews energies", () => {
    for (const g of GAMES) {
      const f = PREVIEWS[g.id].frames;
      expect(f.some((x) => x.score)).toBe(!!g.battle);
      expect(f.some((x) => x.energies)).toBe(!!g.coop);
    }
  });
  it("Director preview shows composition, a cut and a callback", () => {
    const tags = PREVIEWS["ai-director"].frames.map((f) => f.tag).join(" ");
    expect(tags).toMatch(/KOMPOSITION/);
    expect(tags).toMatch(/DIRECTOR CUT/);
    expect(tags).toMatch(/CALLBACK/);
  });
});
