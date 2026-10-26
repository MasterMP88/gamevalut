import test from "node:test";
import assert from "node:assert/strict";
import {
  createGangRuntime,
  submitGangAction,
  advanceGangStage,
  requiredPlayerIds,
  withdrawAfterDark,
  privateGangView,
} from "../dist/index.js";
const players = Array.from({ length: 4 }, (_, i) => ({
  id: `p${i}`,
  name: `P${i}`,
}));
const initial = () =>
  createGangRuntime({
    id: "night",
    gameId: "after-dark",
    players,
    targetRounds: 3,
  });
test("withdrawal removes a sealed contribution, works out of turn and persists through future rounds", () => {
  let s = initial();
  for (const p of players)
    s = submitGangAction(s, { playerId: p.id, success: true });
  s = advanceGangStage(s);
  s = {
    ...s,
    round: {
      ...s.round,
      stageSubmissions: {
        ...s.round.stageSubmissions,
        1: { p0: { playerId: "p0", value: "private unrevealed answer" } },
      },
    },
  };
  s = withdrawAfterDark(s, "p0");
  assert.ok(!requiredPlayerIds(s).includes("p0"));
  assert.equal(privateGangView(s, "p0"), null);
  assert.ok(!JSON.stringify(s.round).includes("private unrevealed answer"));
  assert.equal(withdrawAfterDark(s, "p0"), s);
  assert.throws(() => submitGangAction(s, { playerId: "p0", success: true }));
  for (let i = 0; i < 10 && s.roundNumber === 1; i++)
    s = advanceGangStage(s, { force: true });
  assert.equal(s.roundNumber, 2);
  assert.ok(!requiredPlayerIds(s).includes("p0"));
  assert.ok(s.declinedIds.includes("p0"));
});
test("fewer than two willing participants closes the game without points or pressure", () => {
  let s = initial();
  s = withdrawAfterDark(s, "p0");
  s = withdrawAfterDark(s, "p1");
  s = withdrawAfterDark(s, "p2");
  assert.equal(s.finished, true);
  assert.deepEqual(s.winnerIds, []);
  assert.deepEqual(Object.values(s.scores), [0, 0, 0, 0]);
});
test("withdrawal cannot target an unknown player or alter another game", () => {
  const s = initial();
  assert.equal(withdrawAfterDark(s, "outsider"), s);
  const other = createGangRuntime({
    id: "other",
    gameId: "the-majority",
    players,
  });
  assert.equal(withdrawAfterDark(other, "p0"), other);
});
