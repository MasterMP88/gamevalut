import test from "node:test";
import assert from "node:assert/strict";
import {
  createGangRuntime,
  advanceGangStage,
  submitGangAction,
  privateGangView,
  publicGangView,
  getGangPlaybook,
} from "../dist/index.js";
import { paceQueue } from "../dist/director.js";
const ps = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
test("team captains alone see secret material, rotate and use bounded quantitative scores", () => {
  const pb = getGangPlaybook("team-chaos");
  assert.equal(pb.prompts.length, 31);
  let s = createGangRuntime({
    id: "team",
    gameId: "team-chaos",
    players: ps(7),
    seed: 8,
    targetRounds: 2,
  });
  const prompt = pb.prompts.find((p) => p.category === "Tabu");
  // Find a seeded taboo round, to test the actual private-payload construction.
  for (let seed = 1; s.round.prompt.category !== "Tabu"; seed++)
    s = createGangRuntime({
      id: "team",
      gameId: "team-chaos",
      players: ps(7),
      seed,
      targetRounds: 2,
    });
  assert.equal(
    Object.values(s.round.privateByPlayer).filter((p) => p.secret).length,
    2,
  );
  assert.ok(
    !JSON.stringify(publicGangView(s)).includes(
      s.round.prompt.teamChallenge.secret,
    ),
  );
  assert.equal(privateGangView(s, "p2").secret, undefined);
  s = advanceGangStage(advanceGangStage(s, { force: true }), { force: true });
  assert.throws(() => submitGangAction(s, { playerId: "p0", quantity: 2 }));
  for (const p of s.players)
    s = submitGangAction(s, {
      playerId: p.id,
      quantity: p.teamId === "A" ? 1 : 0,
    });
  s = advanceGangStage(advanceGangStage(s));
  assert.equal(s.scores.p0, 2);
  assert.equal(s.scores.p1, 0);
  s = advanceGangStage(s);
  assert.equal(privateGangView(s, "p2").active, true);
  assert.equal(privateGangView(s, "p3").active, true);
});
test("a Stop removes the final action and never identifies who stopped", () => {
  let s = createGangRuntime({
    id: "dark",
    gameId: "after-dark",
    players: ps(3),
    targetRounds: 1,
  });
  for (const p of s.players)
    s = submitGangAction(s, { playerId: p.id, success: true });
  s = advanceGangStage(s);
  for (const p of s.players)
    s = submitGangAction(s, {
      playerId: p.id,
      optionId: p.id === "p1" ? "Stop" : "Bold",
    });
  s = advanceGangStage(s);
  assert.equal(publicGangView(s).stage, "reveal");
  s = advanceGangStage(s);
  assert.match(s.round.resolution.headline, /Stop/);
  assert.ok(!JSON.stringify(s.round.resolution).includes("P1"));
  assert.equal(s.scores.p1, 0);
});
test("manual pace accounts for one-phone delays, preserves selections and flags impossible budgets", () => {
  const queue = ["chain-reaction", "panic-button", "team-chaos"];
  const parallel = paceQueue(queue, 99, 30, 99),
    pass = paceQueue(queue, 99, 15, 1);
  assert.ok(parallel.fits);
  assert.ok(parallel.estimatedMinutes <= 30);
  assert.equal(pass.fits, false);
  assert.deepEqual(Object.keys(pass.rounds), queue);
  assert.equal(paceQueue(["hot-seat"], 12, null).rounds["hot-seat"], 12);
});
