import { describe, expect, it } from "vitest";
import { SCENES, ECHO_TEMPLATES } from "@/lib/game/scenes";
import { GAMES, poolFor } from "@/lib/game/games";
import { fill, genitive } from "@/lib/game/engine";

const norm = (s: string) => s.toLowerCase().replace(/\{(me|you)\}s?/g, "").replace(/[^a-zäöüß ]/g, "").replace(/\s+/g, " ").trim();

describe("scene library editorial audit", () => {
  it("has no duplicate prompts", () => {
    const seen = new Set<string>();
    for (const s of SCENES) {
      const k = norm(s.prompt);
      expect(seen.has(k), s.prompt).toBe(false);
      seen.add(k);
    }
  });

  it("has no duplicate titles", () => {
    const titles = SCENES.map((s) => s.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("does not over-use the same opening", () => {
    const openings: Record<string, number> = {};
    for (const s of SCENES) {
      const k = norm(s.prompt).split(" ").slice(0, 2).join(" ");
      openings[k] = (openings[k] ?? 0) + 1;
    }
    for (const [k, v] of Object.entries(openings)) expect(v, k).toBeLessThanOrEqual(6);
    const meOpen = SCENES.filter((s) => s.prompt.startsWith("{me},")).length;
    expect(meOpen).toBe(0);
  });

  it("never names Roxy or Michal in content", () => {
    for (const s of [...SCENES.map((x) => x.title + x.prompt + (x.choices ?? []).join()), ...ECHO_TEMPLATES.map((e) => e.prompt)]) {
      expect(s).not.toMatch(/roxy|michal/i);
    }
  });

  it("every game has its own signature scenes", () => {
    for (const g of GAMES) expect(SCENES.filter((s) => s.only?.includes(g.id)).length, g.id).toBeGreaterThanOrEqual(10);
    for (const g of GAMES) expect(poolFor(g, SCENES).length).toBeGreaterThan(40);
  });

  it("fills German genitive correctly for any name", () => {
    expect(genitive("Nova")).toBe("Novas");
    expect(genitive("Jonas")).toBe("Jonas’");
    expect(genitive("Max")).toBe("Max’");
    expect(fill("{you}s Hand, {me}", "Jörg", "Björn-Hans")).toBe("Björn-Hans’ Hand, Jörg");
  });
});

import { createSession, nightSignature, DEFAULT_SETTINGS } from "@/lib/game/engine";
describe("night signature", () => {
  it("shows at most 3 distinct, normal-sensitivity callbacks", () => {
    let s = createSession("night-echo", ["Ari", "Nova"], DEFAULT_SETTINGS, 1);
    s = { ...s, anchors: [
      { id: "a", owner: "Ari", shortText: "gleich", tags: [], sceneNumber: 1, sensitivity: "normal", dueAt: 9, used: false },
      { id: "b", owner: "Nova", shortText: "Gleich", tags: [], sceneNumber: 2, sensitivity: "normal", dueAt: 9, used: false },
      { id: "c", owner: "Nova", shortText: "geheim", tags: [], sceneNumber: 3, sensitivity: "high", dueAt: 9, used: false },
    ] } as typeof s;
    const sig = nightSignature(s);
    expect(sig.callbacks.map((a) => a.shortText)).toEqual(["Gleich"]);
  });
});