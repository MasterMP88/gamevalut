import { describe, expect, it } from "vitest";
import { GAMES } from "@/lib/game/games";
import { SCENES } from "@/lib/game/scenes";
import { GANG_GAMES } from "@/lib/gang/core/catalog";
import { GANG_PLAYBOOKS } from "@/lib/gang/core/playbooks";

const FORCED_TREND_SLANG = /\b(?:omg|lol|slay|rizz|delulu|no cap)\b/i;
const CUSTOMER_JARGON = /Memory Core|Provider(?:-| )Layer|Runtime-Core|Fibbage|Crowd-Vote|schnelle Guesses|Handy-Übergabe/i;

describe("2026 brand voice contract", () => {
  it("keeps game marketing concise and free of implementation jargon", () => {
    for (const game of GAMES) {
      const copy = [game.title, game.hook, game.description, ...game.why, ...game.beats.flat()].join(" ");
      expect(copy, game.title).not.toMatch(CUSTOMER_JARGON);
      expect(copy, game.title).not.toMatch(FORCED_TREND_SLANG);
      expect(game.hook.length, game.title).toBeLessThanOrEqual(100);
    }
  });

  it("keeps authored couple scenes out of forced trend slang and shouty copy", () => {
    for (const scene of SCENES) {
      const copy = [scene.title, scene.prompt, scene.helper ?? "", ...(scene.choices ?? [])].join(" ");
      expect(copy, scene.title).not.toMatch(FORCED_TREND_SLANG);
      expect(copy, scene.title).not.toMatch(/!{2,}/);
    }
  });

  it("keeps GANG hooks and rules customer-facing", () => {
    for (const game of GANG_GAMES) {
      expect(game.hook, game.title).not.toMatch(CUSTOMER_JARGON);
      expect(game.hook, game.title).not.toMatch(FORCED_TREND_SLANG);
      expect(game.hook.length, game.title).toBeLessThanOrEqual(120);
    }
    for (const playbook of GANG_PLAYBOOKS) {
      const copy = [playbook.promise, playbook.howItFeels, playbook.scoring, playbook.finale].join(" ");
      expect(copy, playbook.title).not.toMatch(CUSTOMER_JARGON);
      expect(copy, playbook.title).not.toMatch(FORCED_TREND_SLANG);
    }
  });
});
