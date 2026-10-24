import assert from "node:assert/strict";
import test from "node:test";
import { GANG_GAMES } from "../dist/index.js";

test("all sixteen READY Gang games support the One Phone baseline", () => {
  assert.equal(GANG_GAMES.length, 16);
  for (const game of GANG_GAMES) {
    assert.equal(game.status, "ready", `${game.id} is not ready`);
    assert.ok(game.interactionModes.includes("one-phone"), `${game.id} lacks one-phone`);
  }
});
