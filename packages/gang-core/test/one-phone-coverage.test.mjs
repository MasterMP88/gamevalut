import assert from "node:assert/strict";
import test from "node:test";
import { GANG_GAMES } from "../dist/index.js";

test("all sixteen READY Gang games support the One Phone baseline", () => {
  const ready = GANG_GAMES.filter((game) => game.status === "ready");
  const ids = ready.map((game) => game.id);
  assert.equal(
    ready.length,
    16,
    `expected 16 READY catalog entries, got ${ready.length}: ${JSON.stringify(ids)}`,
  );
  assert.equal(new Set(ids).size, 16, `duplicate READY catalog ids: ${JSON.stringify(ids)}`);
  for (const game of ready) {
    assert.ok(game.interactionModes.includes("one-phone"), `${game.id} lacks one-phone`);
  }
  const future = GANG_GAMES.filter((game) => game.status !== "ready");
  assert.ok(future.every((game) => !ids.includes(game.id)));
});
