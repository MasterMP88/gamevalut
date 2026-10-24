import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDirectorPlan,
  buildMixPlan,
  eligibleGangGames,
  getGangGame,
  pickNextGangGame,
  preferredInteractionMode,
  scaleBandFor,
  validateMix,
} from "../dist/index.js";

const base = {
  playerCount: 8,
  durationMinutes: 30,
  energyTarget: 4,
  moods: ["funny", "wild"],
  enabledCapabilities: [],
};

test("scale bands truthfully cover 2–99", () => {
  assert.equal(scaleBandFor(2), "duo-small");
  assert.equal(scaleBandFor(5), "core-party");
  assert.equal(scaleBandFor(13), "large-party");
  assert.equal(scaleBandFor(99), "crowd");
  assert.throws(() => scaleBandFor(1));
  assert.throws(() => scaleBandFor(100));
});

test("catalog filters incompatible capabilities and player ranges", () => {
  const ids = eligibleGangGames(base, { includePlanned: true }).map((g) => g.id);
  assert.ok(ids.includes("the-majority"));
  assert.ok(!ids.includes("music-drop"));
  assert.ok(!ids.includes("photo-hunt"));
  assert.ok(!ids.includes("after-dark"));
});

test("spicy and music titles require explicit opt-in", () => {
  const enabled = eligibleGangGames(
    { ...base, enabledCapabilities: ["spicy", "music"] },
    { includePlanned: true },
  ).map((g) => g.id);
  assert.ok(enabled.includes("after-dark"));
  assert.ok(enabled.includes("music-drop"));
});

test("manual mixes reject unknown, duplicate and incompatible games", () => {
  const result = validateMix(
    ["the-majority", "the-majority", "music-drop", "missing"],
    base,
  );
  assert.equal(result.valid, false);
  assert.deepEqual(result.games.map((g) => g.id), ["the-majority"]);
  assert.deepEqual(
    result.rejected.map((x) => x.reason),
    ["duplicate", "incompatible-with-session", "unknown-game"],
  );
});

test("big crowds prefer a big screen when a title supports it", () => {
  const majority = getGangGame("the-majority");
  assert.ok(majority);
  const mode = preferredInteractionMode(
    majority,
    { ...base, playerCount: 60 },
    { connectedDevices: 20, hasBigScreen: true },
  );
  assert.equal(mode, "big-screen");
});

test("director changes mechanics instead of repeating blindly", () => {
  const pick = pickNextGangGame({
    preferences: base,
    deviceContext: { connectedDevices: 8, hasBigScreen: false },
    history: [{ gameId: "the-majority", primaryMechanic: "majority", energy: 3 }],
  });
  assert.ok(pick);
  assert.notEqual(pick.game.id, "the-majority");
});

test("director builds a playable plan from non-planned titles", () => {
  const plan = buildDirectorPlan({
    preferences: base,
    deviceContext: { connectedDevices: 8, hasBigScreen: false },
    history: [],
  });
  assert.equal(plan.entryMode, "director");
  assert.ok(plan.gameIds.length >= 2);
  for (const id of plan.gameIds) {
    assert.notEqual(getGangGame(id)?.status, "planned");
  }
});

test("custom mix order is preserved", () => {
  const games = ["undercover", "the-majority", "secret-missions"].map(getGangGame);
  assert.ok(games.every(Boolean));
  const plan = buildMixPlan(games);
  assert.deepEqual(plan.gameIds, ["undercover", "the-majority", "secret-missions"]);
});
