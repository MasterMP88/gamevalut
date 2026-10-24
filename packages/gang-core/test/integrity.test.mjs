import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceGangStage,
  createGangRuntime,
  publicGangView,
  submitGangAction,
} from "../dist/index.js";

const players = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

test("WHO'S THAT rejects self-votes in the core runtime", () => {
  const state = createGangRuntime({
    id: "self-vote",
    gameId: "whos-that",
    players: players(3),
    seed: 1,
  });
  assert.equal(publicGangView(state).stage, "vote");
  assert.throws(
    () => submitGangAction(state, { playerId: "p1", targetPlayerId: "p1" }),
    /Self voting is not allowed/,
  );
});

test("creative answer games cannot vote for their own answer", () => {
  let state = createGangRuntime({
    id: "creative-self",
    gameId: "bad-answers-only",
    players: players(3),
    seed: 2,
  });
  for (const p of state.players) {
    state = submitGangAction(state, { playerId: p.id, value: `answer-${p.id}` });
  }
  state = advanceGangStage(state);
  assert.equal(publicGangView(state).stage, "vote");
  assert.throws(
    () => submitGangAction(state, { playerId: "p2", targetPlayerId: "p2" }),
    /Self voting is not allowed/,
  );
});

test("vote targets must come from the current runtime options", () => {
  const state = createGangRuntime({
    id: "invalid-target",
    gameId: "undercover",
    players: players(4),
    seed: 3,
  });
  let s = state;
  // private -> answer
  s = advanceGangStage(s, { force: true });
  for (const p of s.players) {
    s = submitGangAction(s, { playerId: p.id, value: `clue-${p.id}` });
  }
  s = advanceGangStage(s);
  assert.equal(publicGangView(s).stage, "vote");
  assert.throws(
    () => submitGangAction(s, { playerId: "p1", targetPlayerId: "ghost" }),
    /Invalid vote target/,
  );
});

test("prompt choices reject values outside the authored option set", () => {
  const state = createGangRuntime({
    id: "invalid-option",
    gameId: "the-majority",
    players: players(3),
    seed: 4,
  });
  assert.equal(publicGangView(state).stage, "predict");
  assert.throws(
    () => submitGangAction(state, { playerId: "p1", optionId: "__cheat__" }),
    /Invalid option/,
  );
});
