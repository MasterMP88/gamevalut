import assert from "node:assert/strict";
import test from "node:test";
import { GANG_GAMES } from "../dist/index.js";

test("all sixteen READY Gang games support the One Phone baseline", () => {
  const ids = GANG_GAMES.map((game) => game.id);
  assert.equal(
    GANG_GAMES.length,
    16,
    `expected 16 catalog entries, got ${GANG_GAMES.length}: ${JSON.stringify(ids)}`,
  );
  assert.equal(new Set(ids).size, 16, `duplicate catalog ids: ${JSON.stringify(ids)}`);
  for (const game of GANG_GAMES) {
    assert.equal(game.status, "ready", `${game.id} is not ready`);
    assert.ok(game.interactionModes.includes("one-phone"), `${game.id} lacks one-phone`);
  }
});
