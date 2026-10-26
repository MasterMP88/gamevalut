import test from "node:test";
import assert from "node:assert/strict";
import {
  GANG_EXPERIENCES,
  couchGame,
  couchRange,
  couchPool,
  couchInput,
  couchActiveTeam,
  couchSpokesperson,
  couchSeconds,
  createCouchSession,
  reduceCouch,
  GANG_PLAYBOOKS,
  preferredInteractionMode,
  getGangGame,
  buildDirectorPlan,
} from "../dist/index.js";
const ids = Object.keys(GANG_EXPERIENCES).filter(couchGame);
const start = (gameId, count = 6, extra = {}) => {
  let s = createCouchSession({
    gameId,
    playerCount: count,
    seed: 13,
    rounds: 4,
    ...extra,
  });
  s = reduceCouch(s, { type: "NEXT", at: 0 });
  return reduceCouch(s, { type: "NEXT", at: 0 });
};
function resolve(s) {
  const kind = couchInput(s.gameId);
  if (kind === "relay") {
    while (s.phase === "play")
      s = reduceCouch(s, { type: "TURN", valid: true, at: s.deadline - 1 });
    return s;
  }
  if (kind === "music") {
    s = reduceCouch(s, { type: "MUSIC_CLAIM", teamId: s.teams[0].id });
    return reduceCouch(s, { type: "MUSIC_JUDGE", correct: true });
  }
  return reduceCouch(s, {
    type: "RESOLVE",
    counts:
      kind === "majority"
        ? s.deck[s.index].options.map((_, i) => (i === 0 ? s.playerCount : 0))
        : s.teams.map(() => 2),
    predictions: s.teams.map(() => 1),
    choice: 1,
    winners: [s.teams[0].id],
  });
}
test("nine couch games have complete authored contracts; private games cannot enter couch runtime", () => {
  assert.equal(ids.length, 9);
  for (const [id, c] of Object.entries(GANG_EXPERIENCES)) {
    assert.equal(c.scale.length, 5);
    assert.equal(c.finales.length, 2);
    assert.ok(c.rule.length > 20);
    if (!c.couch)
      assert.throws(() =>
        createCouchSession({ gameId: id, playerCount: 6, seed: 1 }),
      );
  }
});
test("all couch games finish, score exactly once, encore once, and replay without session repeats in each supported group band", () => {
  for (const id of ids)
    for (const n of [2, 3, 4, 5, 8, 9, 15, 16, 30, 31, 99]) {
      const [min, max] = couchRange(id);
      if (n < min || n > max) continue;
      let s = start(id, n);
      const used = [];
      let guard = 0;
      while (s.phase !== "finale" && guard++ < 40) {
        if (s.phase === "play") {
          used.push(s.deck[s.index].id);
          s = resolve(s);
          assert.equal(s.phase, "reveal", `${id}/${n}`);
          const twice = resolve(s);
          assert.deepEqual(twice.scores, s.scores);
        } else s = reduceCouch(s, { type: "NEXT", at: 0 });
      }
      assert.equal(s.phase, "finale", `${id}/${n}`);
      assert.equal(new Set(used).size, 4);
      assert.equal(s.results.length, 4);
      assert.equal(s.teams.length <= 6, true);
      const replay = start(id, n, { seen: [...s.history], seed: 27 });
      assert.ok(!used.includes(replay.deck[0].id));
      s = reduceCouch(s, { type: "ENCORE", at: 1 });
      assert.equal(s.phase, "transition");
      s = reduceCouch(s, { type: "NEXT", at: 1 });
      assert.ok(!used.includes(s.deck[s.index].id));
      s = resolve(s);
      s = reduceCouch(s, { type: "NEXT", at: 2 });
      s = reduceCouch(s, { type: "NEXT", at: 3 });
      assert.equal(s.phase, "finale");
      assert.equal(reduceCouch(s, { type: "ENCORE", at: 4 }), s);
    }
});
test("majority ties pay both tied predictions, abstentions do not win, invalid counts cannot resolve", () => {
  let s = start("the-majority", 4);
  const n = s.deck[0].options.length;
  const invalid = reduceCouch(s, {
    type: "RESOLVE",
    counts: Array(n).fill(5),
    predictions: [1, 2, 0, 0],
  });
  assert.equal(invalid, s);
  s = reduceCouch(s, {
    type: "RESOLVE",
    counts: Array.from({ length: n }, (_, i) => (i < 2 ? 2 : 0)),
    predictions: [1, 2, 0, 0],
  });
  assert.deepEqual(s.result.winners, ["t1", "t2"]);
  s = reduceCouch(s, { type: "NEXT", at: 1 });
  assert.deepEqual(Object.values(s.scores), [1, 1, 0, 0]);
  const scored = s;
  s = reduceCouch(s, {
    type: "RESOLVE",
    counts: [4, 0],
    predictions: [1, 1, 1, 1],
  });
  assert.deepEqual(s, scored);
});
test("minority finale uses smallest occupied group, never an empty option", () => {
  let s = start("the-majority", 4);
  s = { ...s, index: s.rounds - 1, finaleVariant: 1 };
  const n = s.deck[s.index].options.length;
  s = reduceCouch(s, {
    type: "RESOLVE",
    counts: Array.from({ length: n }, (_, i) =>
      i === 0 ? 3 : i === 1 ? 1 : 0,
    ),
    predictions: [1, 2, n > 2 ? 3 : 0, 0],
  });
  assert.deepEqual(s.result.winners, ["t2"]);
  assert.equal(s.result.delta.t2, 2);
});
test("timers cannot punish a new turn from a stale interval; pause preserves remaining time", () => {
  let s = start("panic-button", 99);
  assert.equal(s.teams.length, 6);
  const first = s.deadline;
  s = reduceCouch(s, { type: "TIMEOUT", at: first - 1 });
  assert.equal(s.turn, 0);
  s = reduceCouch(s, { type: "TIMEOUT", at: first });
  assert.equal(s.turn, 1);
  const next = s;
  s = reduceCouch(s, { type: "TIMEOUT", at: first });
  assert.equal(s, next);
  s = reduceCouch(s, { type: "PAUSE", at: first + 1000 });
  const frozen = s;
  s = reduceCouch(s, { type: "TURN", valid: true, at: first + 2000 });
  assert.equal(s, frozen);
  s = reduceCouch(s, { type: "RESUME", at: 50000 });
  assert.equal(s.deadline, 54000);
  while (s.phase === "play")
    s = reduceCouch(s, { type: "TIMEOUT", at: s.deadline });
  assert.equal(s.turnResults.length, 18);
  assert.equal(s.teams.length, 6);
  assert.ok(s.teams.every((t) => s.result.delta[t.id] === 0));
});
test("every team gets exactly three turns and speakers rotate fairly at 99", () => {
  let s = start("panic-button", 99);
  const spoken = {};
  const teamTurns = {};
  while (s.phase === "play") {
    const team = couchActiveTeam(s);
    const who = couchSpokesperson(s, team);
    (spoken[team.id] ??= []).push(who);
    teamTurns[team.id] = (teamTurns[team.id] ?? 0) + 1;
    s = reduceCouch(s, { type: "TURN", valid: true, at: s.deadline - 1 });
  }
  assert.ok(Object.values(teamTurns).every((n) => n === 3));
  assert.ok(Object.values(spoken).every((xs) => new Set(xs).size === 3));
});
test("music has one claim per team, a wrong claim opens the steal, and resolution is sealed", () => {
  let s = start("music-drop", 8);
  s = reduceCouch(s, { type: "MUSIC_CLAIM", teamId: "t1" });
  s = reduceCouch(s, { type: "MUSIC_JUDGE", correct: false });
  assert.equal(s.musicClaim, null);
  assert.equal(reduceCouch(s, { type: "MUSIC_CLAIM", teamId: "t1" }), s);
  s = reduceCouch(s, { type: "MUSIC_CLAIM", teamId: "t2" });
  s = reduceCouch(s, { type: "MUSIC_JUDGE", correct: true });
  assert.equal(s.result.delta.t2, 1);
  assert.equal(reduceCouch(s, { type: "MUSIC_JUDGE", correct: true }), s);
});
test("external DJ never belongs to a guessing team, at every group boundary and DJ position", () => {
  for (const count of [2, 3, 4, 5, 6, 8, 9, 10, 15, 16, 17, 30, 31, 32, 99]) {
    for (const index of [0, count - 1]) {
      const s = start("music-drop", count, {
        musicMode: "dj",
        musicDjIndex: index,
      });
      const members = s.teams.flatMap((t) => t.members);
      assert.equal(s.musicDj.member, index + 1);
      assert.equal(members.length, count - 1);
      assert.equal(new Set(members).size, count - 1);
      assert.ok(!members.includes(index + 1));
      assert.ok(s.teams.length <= 6);
      assert.ok(
        Math.max(...s.teams.map((t) => t.members.length)) -
          Math.min(...s.teams.map((t) => t.members.length)) <=
          1,
      );
      assert.equal(s.deadline, null, "no simulated external playback clock");
      assert.equal(
        reduceCouch(s, { type: "MUSIC_CLAIM", teamId: s.teams[0].id }),
        s,
      );
      assert.equal(reduceCouch(s, { type: "RESOLVE" }), s);
    }
  }
  for (const index of [-1, 2, 0.5, NaN])
    assert.throws(() =>
      start("music-drop", 2, { musicMode: "dj", musicDjIndex: index }),
    );
});
test("external DJ confirmation resets each round; solo miss, skip, finale and encore cannot deadlock", () => {
  let s = start("music-drop", 2, { musicMode: "dj", rounds: 2 });
  s = reduceCouch(s, { type: "MUSIC_HEARD" });
  s = reduceCouch(s, { type: "MUSIC_CLAIM", teamId: s.teams[0].id });
  s = reduceCouch(s, { type: "MUSIC_JUDGE", correct: false });
  assert.equal(s.phase, "reveal");
  s = reduceCouch(s, { type: "NEXT", at: 1 });
  assert.deepEqual(Object.values(s.scores), [0]);
  s = reduceCouch(s, { type: "NEXT", at: 2 });
  assert.equal(s.musicHeard, false);
  s = reduceCouch(s, { type: "NEXT", at: 3 });
  s = reduceCouch(s, { type: "MUSIC_HEARD" });
  s = resolve(s);
  s = reduceCouch(s, { type: "FINISH" });
  assert.deepEqual(Object.values(s.scores), [4]);
  s = reduceCouch(s, { type: "ENCORE", at: 4 });
  assert.equal(s.musicHeard, false);
  s = reduceCouch(s, { type: "NEXT", at: 5 });
  s = reduceCouch(s, { type: "SKIP" });
  s = reduceCouch(s, { type: "FINISH" });
  assert.equal(s.phase, "finale");
  assert.deepEqual(Object.values(s.scores), [4]);
});
test("skip never awards points, early finish never invents a result, line never invents correct personality scores", () => {
  for (const id of ids) {
    let s = start(id);
    s = reduceCouch(s, { type: "SKIP" });
    assert.deepEqual(s.result.delta, {});
    s = reduceCouch(s, { type: "NEXT", at: 1 });
    assert.ok(Object.values(s.scores).every((n) => n === 0));
    s = reduceCouch(s, { type: "FINISH" });
    assert.equal(s.phase, "finale");
  }
  const line = resolve(start("the-line"));
  assert.ok(Object.values(line.result.delta).every((n) => n === 0));
});
test("shared-device Director excludes secret flows and estimates crowd turns instead of phone handoffs", () => {
  for (const count of [2, 4, 8, 15, 30, 99]) {
    const plan = buildDirectorPlan({
      preferences: {
        playerCount: count,
        durationMinutes: 15,
        energyTarget: 4,
        moods: ["funny"],
        enabledCapabilities: [],
      },
      deviceContext: {
        connectedDevices: 1,
        hasBigScreen: true,
        inputPreference: "shared",
      },
      history: [],
      seed: count,
    });
    assert.ok(plan.gameIds.length);
    assert.ok(plan.estimatedMinutes <= 15);
    assert.ok(plan.gameIds.every(couchGame));
    assert.ok(Object.values(plan.modesByGame).every((m) => m === "big-screen"));
  }
  assert.equal(
    preferredInteractionMode(
      getGangGame("the-majority"),
      { playerCount: 6 },
      { connectedDevices: 1, hasBigScreen: true },
    ),
    "big-screen",
  );
  assert.equal(
    preferredInteractionMode(
      getGangGame("undercover"),
      { playerCount: 6 },
      { connectedDevices: 6, hasBigScreen: true },
    ),
    "everyone-in",
  );
});
test("editorial IDs stay unique in each bank and expanded pools sustain several full sessions", () => {
  for (const p of GANG_PLAYBOOKS) {
    assert.equal(
      new Set(p.prompts.map((x) => x.id)).size,
      p.prompts.length,
      p.id,
    );
    if (
      ![
        "time-drop",
        "secret-missions",
        "music-drop",
        "bluff",
        "team-chaos",
      ].includes(p.id)
    )
      assert.ok(p.prompts.length >= 50, p.id);
  }
  for (const id of ids) {
    const pool = couchPool(id);
    assert.ok(pool.length >= 30, id);
  }
});

test("hard session exclusions survive a fully exhausted cross-session history", async () => {
  const { createGangRuntime, advanceGangStage } =
    await import("../dist/index.js");
  for (const p of GANG_PLAYBOOKS.filter((p) => p.id !== "time-drop")) {
    const players = Array.from(
      { length: Math.max(6, p.minPlayers) },
      (_, i) => ({ id: `p${i}`, name: `P${i}` }),
    );
    let s = createGangRuntime({
      gameId: p.id,
      id: "history",
      players,
      seed: 21,
      targetRounds: p.rounds[1],
      seenPromptIds: p.prompts.map((p) => p.id),
    });
    let guard = 0;
    const used = new Set();
    let last = "";
    while (!s.finished && guard++ < 5000) {
      if (s.round.id !== last) {
        assert.ok(!used.has(s.round.prompt.id), p.id);
        used.add(s.round.prompt.id);
        last = s.round.id;
      }
      s = advanceGangStage(s, { force: true });
    }
    assert.ok(s.finished, p.id);
  }
});
test("skipping a private round cannot farm role or spotlight points", async () => {
  const { createGangRuntime, skipGangRound, advanceGangStage, publicGangView } =
    await import("../dist/index.js");
  for (const gameId of [
    "undercover",
    "one-of-you",
    "hot-seat",
    "bluff",
    "draw-this",
  ]) {
    let s = createGangRuntime({
      gameId,
      id: "skip",
      players: Array.from({ length: 6 }, (_, i) => ({
        id: `p${i}`,
        name: `P${i}`,
      })),
      seed: 41,
      targetRounds: 2,
    });
    s = skipGangRound(s);
    assert.equal(publicGangView(s).stage, "score");
    assert.deepEqual(s.round.resolution.winners, []);
    assert.ok(Object.values(s.scores).every((x) => x === 0));
    s = advanceGangStage(s);
    assert.equal(s.roundNumber, 2);
  }
});
test("role reveal lists the successful detectives as winners, not the caught opponent", async () => {
  const {
    createGangRuntime,
    advanceGangStage,
    submitGangAction,
    publicGangView,
    requiredPlayerIds,
  } = await import("../dist/index.js");
  for (const gameId of ["undercover", "one-of-you"]) {
    let s = createGangRuntime({
      gameId,
      id: "caught",
      players: Array.from({ length: 6 }, (_, i) => ({
        id: `p${i}`,
        name: `P${i}`,
      })),
      seed: 41,
      targetRounds: 2,
    });
    while (publicGangView(s).stage !== "vote")
      s = advanceGangStage(s, { force: true });
    const target =
      gameId === "undercover"
        ? s.round.undercoverPlayerIds[0]
        : s.round.oddPlayerId;
    for (const id of requiredPlayerIds(s))
      s = submitGangAction(s, {
        playerId: id,
        targetPlayerId:
          id === target ? "p" + ((Number(id.slice(1)) + 1) % 6) : target,
      });
    while (publicGangView(s).stage !== "score")
      s = advanceGangStage(s, { force: true });
    assert.ok(s.round.resolution.winners.length);
    assert.ok(!s.round.resolution.winners.includes(target));
    assert.ok(
      s.round.resolution.winners.every(
        (id) => s.round.resolution.scoreDelta[id] > 0,
      ),
    );
  }
});
test("private and creative games have actual alternative finale states", async () => {
  const { createGangRuntime, advanceGangStage } =
    await import("../dist/index.js");
  for (const [gameId, category] of [
    ["undercover", "finale-solo-agent"],
    ["bluff", "finale-bluff-lies"],
    ["photo-hunt", "finale-single-color"],
    ["draw-this", "finale-one-line"],
  ]) {
    let s = createGangRuntime({
      gameId,
      id: "alternate",
      players: Array.from({ length: 8 }, (_, i) => ({
        id: `p${i}`,
        name: `P${i}`,
      })),
      seed: 42,
      targetRounds: 2,
    });
    let guard = 0;
    while (s.roundNumber < 2 && guard++ < 100)
      s = advanceGangStage(s, { force: true });
    assert.equal(s.round.prompt.category, category);
    if (gameId === "undercover")
      assert.equal(s.round.undercoverPlayerIds.length, 1);
  }
});
test("WHO nominates different members and HOT SEAT rotates through each team roster", () => {
  let who = start("whos-that", 9);
  const team = who.teams[0];
  assert.equal(
    new Set(
      [0, 1, 2].map((index) => couchSpokesperson({ ...who, index }, team)),
    ).size,
    3,
  );
  let hot = start("hot-seat", 9);
  assert.equal(
    new Set(
      [0, 3, 6].map((index) =>
        couchSpokesperson({ ...hot, index }, hot.teams[0]),
      ),
    ).size,
    3,
  );
});
test("secret roles rotate before the same person receives the role again", async () => {
  const { createGangRuntime, skipGangRound, advanceGangStage, publicGangView } =
    await import("../dist/index.js");
  for (const gameId of ["undercover", "one-of-you"]) {
    let s = createGangRuntime({
      gameId,
      id: "fair",
      players: Array.from({ length: 6 }, (_, i) => ({
        id: `p${i}`,
        name: `P${i}`,
      })),
      seed: 41,
      targetRounds: 6,
    });
    const roles = [];
    while (!s.finished) {
      roles.push(
        gameId === "undercover"
          ? s.round.undercoverPlayerIds[0]
          : s.round.oddPlayerId,
      );
      const pub = JSON.stringify(publicGangView(s));
      assert.ok(!pub.includes("roleHistory"));
      s = advanceGangStage(skipGangRound(s));
    }
    assert.equal(new Set(roles).size, 6, gameId);
  }
});
test("private question and word cards do not reveal who is the odd player before play", async () => {
  const { createGangRuntime, privateGangView } =
    await import("../dist/index.js");
  for (const gameId of ["undercover", "one-of-you"])
    for (const seed of [1, 2, 5, 42]) {
      const s = createGangRuntime({
        gameId,
        id: "private-contract",
        players: Array.from({ length: 6 }, (_, i) => ({
          id: `p${i}`,
          name: `P${i}`,
        })),
        seed,
      });
      for (const p of s.players) {
        const v = privateGangView(s, p.id);
        assert.equal(v.role, gameId === "undercover" ? "WORD" : "QUESTION");
        assert.ok(!/^(Normal|Odd):/.test(v.prompt ?? ""));
        assert.ok(!/CIVILIAN|UNDERCOVER|"ODD"|"ROOM"/.test(JSON.stringify(v)));
      }
    }
});

test("finishing from reveal commits the resolved score once and preserves the correct title through an early encore", () => {
  let s = resolve(start("whos-that", 6));
  const title = s.deck[s.index].prompt;
  s = reduceCouch(s, { type: "FINISH" });
  assert.equal(s.scores.t1, 1);
  assert.equal(s.results[0].prompt, title);
  s = reduceCouch(s, { type: "FINISH" });
  assert.equal(s.scores.t1, 1);
  assert.equal(s.results.length, 1);
  let early = start("whos-that", 6);
  early = reduceCouch(early, { type: "FINISH" });
  assert.equal(early.results.length, 0);
  early = reduceCouch(early, { type: "ENCORE", at: 0 });
  early = reduceCouch(early, { type: "NEXT", at: 0 });
  const nextTitle = early.deck[early.index].prompt;
  early = resolve(early);
  early = reduceCouch(early, { type: "FINISH" });
  assert.equal(early.results[0].prompt, nextTitle);
});

test("published prompts and answers do not repeat semantically identical cards within a bank", () => {
  for (const p of GANG_PLAYBOOKS) {
    const seen = new Set();
    for (const card of p.prompts) {
      const key = [
        card.prompt,
        card.answer,
        card.altPrompt,
        JSON.stringify(card.teamChallenge ?? {}),
        ...(card.options ?? []),
      ]
        .join("|")
        .normalize("NFKC")
        .toLocaleLowerCase("de")
        .replace(/[^\p{L}\p{N}|]/gu, "");
      assert.ok(!seen.has(key), p.id + ": " + card.prompt);
      seen.add(key);
    }
  }
  const tasks = couchPool("team-chaos");
  assert.equal(new Set(tasks.map((t) => t.prompt)).size, tasks.length);
});

test("three maximum couch sessions including encore consume only unseen cards", () => {
  for (const gameId of ids.filter((id) => id !== "music-drop")) {
    const history = [];
    for (let night = 0; night < 3; night++) {
      const state = createCouchSession({
        gameId,
        playerCount: couchRange(gameId)[1],
        rounds: 12,
        seen: history,
        seed: 42,
      });
      const played = state.deck.slice(0, state.rounds + 1).map((p) => p.id);
      assert.equal(played.length, 13, gameId);
      assert.ok(
        played.every((id) => !history.includes(id)),
        gameId,
      );
      history.push(...played);
    }
  }
});
