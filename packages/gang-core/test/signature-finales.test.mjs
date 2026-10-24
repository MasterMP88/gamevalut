import assert from "node:assert/strict";
import test from "node:test";
import { advanceGangStage, createGangRuntime, getGangPlaybook, publicGangView } from "../dist/index.js";

function players(n) {
  return Array.from({ length: n }, (_, i) => ({ id: "p" + (i + 1), name: "P" + (i + 1) }));
}
function toFinal(gameId, count) {
  const pb = getGangPlaybook(gameId);
  let s = createGangRuntime({ id: "final-" + gameId, gameId, players: players(count), seed: 41, targetRounds: pb.rounds[0] });
  let guard = 0;
  while (s.roundNumber < s.targetRounds && guard++ < 200) s = advanceGangStage(s, { force: true });
  assert.equal(s.roundNumber, s.targetRounds);
  return s;
}

test("signature final rounds are material runtime states", () => {
  const cases = [
    ["the-majority", 4, "finale-blind", undefined],
    ["bad-answers-only", 4, "finale-five-words", undefined],
    ["the-line", 4, "finale-silent", undefined],
    ["photo-hunt", 4, "finale-20s", 20],
    ["draw-this", 4, "finale-wrong-hand", 15],
    ["chain-reaction", 4, "finale-3s", 3],
    ["panic-button", 4, "finale-2s", 2],
    ["one-of-you", 4, "finale-one-word", undefined],
    ["after-dark", 4, "finale-choice", undefined],
  ];
  for (const [id, count, category, seconds] of cases) {
    const s = toFinal(id, count);
    assert.equal(s.round.prompt.category, category, id + " finale category");
    if (seconds !== undefined) assert.equal(s.round.prompt.seconds, seconds, id + " finale seconds");
  }
});

test("Blind Majority hides the final question during prediction", () => {
  const s = toFinal("the-majority", 4);
  const view = publicGangView(s);
  assert.equal(view.stage, "predict");
  assert.equal(view.prompt, "PRIVATE ROUND");
  assert.ok(view.options?.length);
});

test("After Dark finale is a consent-respecting group ending vote", () => {
  const s = toFinal("after-dark", 4);
  assert.deepEqual(s.round.stages, ["vote", "reveal", "score"]);
  assert.deepEqual(s.round.prompt.options, ["Soft", "Bold", "Stop"]);
  assert.match(s.round.prompt.subline ?? "", /valide/);
});

test("One Of You finale differs in exactly one semantic pivot", () => {
  const s = toFinal("one-of-you", 4);
  assert.match(s.round.prompt.prompt, /BESTE/);
  assert.match(s.round.prompt.altPrompt ?? "", /SCHLIMMSTE/);
  assert.equal(s.round.prompt.prompt.replace("BESTE", "X"), (s.round.prompt.altPrompt ?? "").replace("SCHLIMMSTE", "X"));
});
