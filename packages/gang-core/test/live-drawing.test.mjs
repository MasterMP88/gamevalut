import test from "node:test";
import assert from "node:assert/strict";
import {
  createGangRuntime,
  advanceGangStage,
  submitGangAction,
  canAdvanceGangStage,
  publicGangView,
  privateGangView,
} from "../dist/index.js";
const players = Array.from({ length: 4 }, (_, i) => ({
  id: `p${i}`,
  name: `Player ${i}`,
}));
const start = () =>
  advanceGangStage(
    createGangRuntime({
      id: "draw",
      gameId: "draw-this",
      players,
      seed: 42,
      interactionMode: "everyone-in",
    }),
  );
test("drawing starts at the same time as repeatable guesses, without leaking the secret", () => {
  let s = start();
  assert.equal(publicGangView(s).stage, "answer");
  assert.equal(publicGangView(s).prompt, "PRIVATE ROUND");
  assert.equal(privateGangView(s, "p1").secret, undefined);
  s = submitGangAction(s, { playerId: "p1", value: "wrong", at: 100 });
  s = submitGangAction(s, { playerId: "p2", value: "also wrong", at: 101 });
  s = submitGangAction(s, { playerId: "p3", value: "still wrong", at: 102 });
  assert.equal(canAdvanceGangStage(s), false);
  s = submitGangAction(s, {
    playerId: "p1",
    value: s.round.prompt.answer,
    at: 103,
  });
  assert.equal(canAdvanceGangStage(s), true);
  assert.equal(
    submitGangAction(s, { playerId: "p1", value: "overwrite", at: 104 }),
    s,
  );
  s = advanceGangStage(advanceGangStage(s));
  assert.equal(s.scores.p1, 2);
  assert.equal(s.scores.p0, 1);
  assert.equal(s.scores.p2, 0);
});
test("all timed-out guesses end drawing without an invented winner", () => {
  let s = start();
  for (const p of players.slice(1))
    s = submitGangAction(s, { playerId: p.id, timedOut: true, at: 500 });
  assert.equal(canAdvanceGangStage(s), true);
  s = advanceGangStage(advanceGangStage(s));
  assert.deepEqual(s.round.resolution.winners, []);
});
test("an older retransmitted wrong guess cannot overwrite a newer attempt", () => {
  let s = submitGangAction(start(), { playerId: "p1", value: "new", at: 101 });
  assert.equal(
    submitGangAction(s, { playerId: "p1", value: "old", at: 100 }),
    s,
  );
});
