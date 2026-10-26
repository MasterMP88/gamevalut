import test from "node:test";
import assert from "node:assert/strict";
import {
  createGangRuntime,
  advanceGangStage,
  submitGangAction,
  publicGangView,
  normalizeAnswer,
  getGangPlaybook,
} from "../dist/index.js";
const players = Array.from({ length: 4 }, (_, i) => ({
  id: `p${i}`,
  name: `P${i}`,
}));
test("identical bluffs share one ballot option and credit, never allowing a semantic self-vote", () => {
  let s = advanceGangStage(
    createGangRuntime({ id: "b", gameId: "bluff", players, seed: 3 }),
  );
  s = submitGangAction(s, { playerId: "p1", value: "Einhornstaub" });
  s = submitGangAction(s, { playerId: "p2", value: "Einhornstaub!" });
  s = submitGangAction(s, { playerId: "p3", value: "Konfetti" });
  s = advanceGangStage(s);
  assert.deepEqual(publicGangView(s).options, ["__truth__", "p1", "p3"]);
  assert.throws(
    () => submitGangAction(s, { playerId: "p2", value: "p1" }),
    /Self/,
  );
  s = submitGangAction(s, { playerId: "p1", value: "__truth__" });
  s = submitGangAction(s, { playerId: "p2", value: "__truth__" });
  s = submitGangAction(s, { playerId: "p3", value: "p1" });
  s = advanceGangStage(advanceGangStage(s));
  assert.equal(s.scores.p1, 3);
  assert.equal(s.scores.p2, 3);
});
test("empty creative submissions produce no blank ballot cards or fake winners", () => {
  let s = createGangRuntime({
    id: "bad",
    gameId: "bad-answers-only",
    players,
    seed: 3,
  });
  for (const p of players)
    s = submitGangAction(s, { playerId: p.id, timedOut: true });
  s = advanceGangStage(s);
  assert.deepEqual(publicGangView(s).options, []);
  assert.deepEqual(publicGangView(s).requiredPlayerIds, []);
  s = advanceGangStage(advanceGangStage(s));
  assert.deepEqual(s.round.resolution.winners, []);
});
test("international song titles remain distinct; every revised bluff has a source", () => {
  assert.notEqual(normalizeAnswer("星空"), normalizeAnswer("海洋"));
  const facts = getGangPlaybook("bluff").prompts;
  assert.ok(facts.length >= 54);
  assert.ok(facts.every((p) => p.sourceUrl?.startsWith("https://")));
});
