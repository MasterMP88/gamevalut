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
  createGangRoom,
  applyGangRoomEvent,
  activeGangPlayers,
  electFacilitator,
  expireGangPresence,
  roomDeviceContext,
  roomReadyForGame,
  resolveMajorityRound,
  resolveWhosThatRound,
  assignUndercoverRoles,
  assignSecretMissions,
  resolveSecretMissions,
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
  assert.ok(enabled.includes("time-drop"));
});


test("TIME//DROP is visible when prototypes are requested but excluded from director and mixes until its dedicated UI ships", () => {
  const withMusic = { ...base, enabledCapabilities: ["music"] };
  const readyIds = eligibleGangGames(withMusic).map((g) => g.id);
  const allIds = eligibleGangGames(withMusic, { includePlanned: true }).map((g) => g.id);
  assert.equal(readyIds.includes("time-drop"), false);
  assert.equal(allIds.includes("time-drop"), true);

  const mix = validateMix(["time-drop"], withMusic);
  assert.equal(mix.valid, false);
  assert.deepEqual(mix.rejected, [{ id: "time-drop", reason: "not-ready" }]);
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

test("shared social games do not prefer EVERYONE IN merely because phones exist", () => {
  const majority = getGangGame("the-majority");
  assert.ok(majority);
  const mode = preferredInteractionMode(
    majority,
    { ...base, playerCount: 3 },
    { connectedDevices: 3, hasBigScreen: false },
  );
  assert.equal(mode, "one-phone");
});

test("one phone remains a fallback when there is only one input device", () => {
  const majority = getGangGame("the-majority");
  assert.ok(majority);
  const mode = preferredInteractionMode(
    majority,
    { ...base, playerCount: 3 },
    { connectedDevices: 1, hasBigScreen: false },
  );
  assert.equal(mode, "one-phone");
});

test("big screen upgrades multi-device play even outside crowd scale", () => {
  const majority = getGangGame("the-majority");
  assert.ok(majority);
  const mode = preferredInteractionMode(
    majority,
    { ...base, playerCount: 6 },
    { connectedDevices: 6, hasBigScreen: true },
  );
  assert.equal(mode, "big-screen");
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
    assert.equal(getGangGame(id)?.status, "ready");
    assert.notEqual(id, "time-drop");
  }
});

test("custom mix order is preserved", () => {
  const games = ["undercover", "the-majority", "secret-missions"].map(getGangGame);
  assert.ok(games.every(Boolean));
  const plan = buildMixPlan(games);
  assert.deepEqual(plan.gameIds, ["undercover", "the-majority", "secret-missions"]);
});


test("hostless room elects and re-elects a temporary facilitator", () => {
  let room = createGangRoom({
    id: "room-1",
    code: "gang42",
    createdAt: 1000,
    preferences: { ...base, playerCount: 3 },
    entryMode: "director",
  });
  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "p2",
    displayName: " Nova ",
    deviceId: "d2",
    at: 1200,
  });
  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "p1",
    displayName: "Ari",
    deviceId: "d1",
    at: 1100,
  });
  assert.equal(room.code, "GANG42");
  assert.equal(room.facilitatorPlayerId, "p1");
  assert.equal(electFacilitator(room.players), "p1");

  room = applyGangRoomEvent(room, { type: "PLAYER_LEAVE", playerId: "p1", at: 2000 });
  assert.equal(room.facilitatorPlayerId, "p2");

  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "p1",
    displayName: "Ari",
    deviceId: "d1",
    at: 2200,
  });
  assert.equal(room.facilitatorPlayerId, "p1");
  assert.equal(activeGangPlayers(room).length, 2);
});

test("room start requires two active players and keeps drop-in records", () => {
  let room = createGangRoom({
    id: "room-2",
    code: "NITE",
    createdAt: 0,
    preferences: { ...base, playerCount: 2 },
    entryMode: "catalog",
  });
  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "a",
    displayName: "A",
    at: 1,
  });
  assert.equal(roomReadyForGame(room), false);
  assert.throws(() =>
    applyGangRoomEvent(room, { type: "SET_PHASE", phase: "playing", at: 2 }),
  );

  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "b",
    displayName: "B",
    at: 3,
  });
  assert.equal(roomReadyForGame(room), true);
  room = applyGangRoomEvent(room, { type: "SET_PHASE", phase: "playing", at: 4 });
  assert.equal(room.phase, "playing");

  room = applyGangRoomEvent(room, { type: "PLAYER_LEAVE", playerId: "b", at: 5 });
  assert.equal(room.players.length, 2);
  assert.equal(room.players.find((p) => p.id === "b").active, false);
});

test("presence expiry supports drop-out and deterministic rejoin", () => {
  let room = createGangRoom({
    id: "room-3",
    code: "LIVE",
    createdAt: 0,
    preferences: { ...base, playerCount: 2 },
    entryMode: "mix",
  });
  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "a",
    displayName: "A",
    deviceId: "phone-a",
    at: 1000,
  });
  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "b",
    displayName: "B",
    deviceId: "phone-b",
    at: 2000,
  });
  room = applyGangRoomEvent(room, {
    type: "DEVICE_JOIN",
    device: {
      id: "phone-a",
      connected: true,
      joinedAt: 1000,
      lastSeenAt: 1000,
      kind: "phone",
      canDisplay: true,
      canInput: true,
    },
    at: 1000,
  });
  room = applyGangRoomEvent(room, {
    type: "DEVICE_JOIN",
    device: {
      id: "screen",
      connected: true,
      joinedAt: 1500,
      lastSeenAt: 1500,
      kind: "tv",
      canDisplay: true,
      canInput: false,
    },
    at: 1500,
  });

  const ctx = roomDeviceContext(room);
  assert.equal(ctx.connectedDevices, 1);
  assert.equal(ctx.hasBigScreen, true);

  room = expireGangPresence(room, 100_000, 90_000);
  assert.equal(activeGangPlayers(room).length, 0);
  assert.equal(room.facilitatorPlayerId, null);
  assert.equal(room.devices.every((d) => !d.connected), true);

  room = applyGangRoomEvent(room, {
    type: "PLAYER_JOIN",
    playerId: "b",
    displayName: "B",
    deviceId: "phone-b",
    at: 101_000,
  });
  assert.equal(activeGangPlayers(room).length, 1);
  assert.equal(room.players.length, 2);
  assert.equal(room.facilitatorPlayerId, "b");
});


test("THE MAJORITY resolves ties and prediction hits without trusting stale votes", () => {
  const result = resolveMajorityRound({
    playerIds: ["a", "b", "c", "d"],
    optionIds: ["x", "y", "z"],
    votes: { a: "x", b: "y", c: "x", d: "y", stale: "z" },
    predictions: { a: "x", b: "z", c: "y", d: "y", stale: "x" },
  });
  assert.deepEqual(result.majorityOptionIds, ["x", "y"]);
  assert.deepEqual(result.correctPredictorIds, ["a", "c", "d"]);
  assert.equal(result.voteCount, 4);
  assert.equal(result.predictionCount, 4);
});

test("WHO'S THAT ignores self nominations by default and supports a tied reveal", () => {
  const result = resolveWhosThatRound({
    playerIds: ["a", "b", "c", "d"],
    nominations: { a: "b", b: "a", c: "b", d: "a" },
  });
  assert.deepEqual(result.selectedPlayerIds, ["a", "b"]);
  assert.equal(result.counts.a, 2);
  assert.equal(result.counts.b, 2);

  const selfIgnored = resolveWhosThatRound({
    playerIds: ["a", "b", "c"],
    nominations: { a: "a", b: "a", c: "b" },
  });
  assert.equal(selfIgnored.nominationCount, 2);
  assert.deepEqual(selfIgnored.selectedPlayerIds, ["a", "b"]);
});

test("UNDERCOVER role assignment is deterministic and always leaves civilians", () => {
  const a = assignUndercoverRoles(["p1", "p2", "p3", "p4", "p5"], 42, 2);
  const b = assignUndercoverRoles(["p1", "p2", "p3", "p4", "p5"], 42, 2);
  assert.deepEqual(a, b);
  assert.equal(a.undercoverPlayerIds.length, 2);
  assert.equal(Object.values(a.roles).filter((r) => r === "civilian").length, 3);
  assert.throws(() => assignUndercoverRoles(["p1", "p2", "p3"], 1));
  assert.throws(() => assignUndercoverRoles(["p1", "p2", "p3", "p4"], 1, 4));
});

test("SECRET MISSIONS assigns unique opaque missions and resolves explicit outcomes", () => {
  const a = assignSecretMissions({
    playerIds: ["a", "b", "c"],
    missionIds: ["m1", "m2", "m3", "m4"],
    seed: 99,
  });
  const b = assignSecretMissions({
    playerIds: ["a", "b", "c"],
    missionIds: ["m1", "m2", "m3", "m4"],
    seed: 99,
  });
  assert.deepEqual(a, b);
  assert.equal(new Set(Object.values(a.assignments)).size, 3);

  const result = resolveSecretMissions({
    assignments: a.assignments,
    outcomes: { a: true, b: false },
  });
  assert.deepEqual(result.completedPlayerIds, ["a"]);
  assert.deepEqual(result.failedPlayerIds, ["b"]);
  assert.deepEqual(result.unresolvedPlayerIds, ["c"]);
});
