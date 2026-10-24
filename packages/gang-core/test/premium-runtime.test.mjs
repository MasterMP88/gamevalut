import assert from "node:assert/strict";
import test from "node:test";
import {
  GANG_GAMES,
  GANG_PLAYBOOKS,
  advanceGangStage,
  assertCompleteGangPlaybooks,
  canAdvanceGangStage,
  createGangRuntime,
  privateGangView,
  publicGangView,
  requiredPlayerIds,
  submitGangAction,
} from "../dist/index.js";

function players(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}

test("catalog has sixteen ready generic games plus TIME//DROP special runtime", () => {
  assertCompleteGangPlaybooks();
  assert.equal(GANG_PLAYBOOKS.length, 17);
  assert.equal(GANG_GAMES.length, 17);
  const timeDropGame = GANG_GAMES.find((game) => game.id === "time-drop");
  const timeDropPlaybook = GANG_PLAYBOOKS.find((game) => game.id === "time-drop");
  assert.equal(timeDropGame?.status, "prototype");
  assert.equal(timeDropPlaybook?.runtime, "time-drop");
  assert.ok(GANG_GAMES.filter((game) => game.id !== "time-drop").every((game) => game.status === "ready"));
  assert.deepEqual(
    new Set(GANG_GAMES.map((game) => game.id)),
    new Set(GANG_PLAYBOOKS.map((game) => game.id)),
  );
});

test("private role games do not leak their secret into the public view", () => {
  const state = createGangRuntime({
    id: "u1",
    gameId: "undercover",
    players: players(6),
    seed: 42,
  });
  const view = publicGangView(state);
  assert.equal(view.prompt, "PRIVATE ROUND");
  assert.equal(JSON.stringify(view).includes("CIVILIAN"), false);
  const privateView = privateGangView(state, "p1");
  assert.ok(privateView);
  assert.ok(privateView.role === "CIVILIAN" || privateView.role === "UNDERCOVER");
});

test("hot seat accepts exactly the spotlight player in the private choice stage", () => {
  let state = createGangRuntime({
    id: "h1",
    gameId: "hot-seat",
    players: players(4),
    seed: 7,
  });
  const view = publicGangView(state);
  assert.equal(view.stage, "private");
  assert.equal(view.requiredPlayerIds.length, 1);
  const active = view.requiredPlayerIds[0];
  assert.ok(active);
  state = submitGangAction(state, { playerId: active, optionId: state.round.prompt.options[0] });
  assert.equal(canAdvanceGangStage(state), true);
  state = advanceGangStage(state);
  assert.equal(publicGangView(state).stage, "predict");
});

function genericAction(state, playerId, index) {
  const view = publicGangView(state);
  const firstOption = view.options?.[0];
  if (view.stage === "vote") {
    const target =
      view.options?.find((option) => option === "__truth__" || option !== playerId) ??
      state.players.find((player) => player.id !== playerId)?.id ??
      firstOption;
    return {
      playerId,
      ...(target && target !== "__truth__" ? { targetPlayerId: target } : {}),
      value: target ?? "vote",
    };
  }
  if (view.stage === "predict") {
    return { playerId, optionId: firstOption ?? state.round.prompt.options?.[0] ?? "A" };
  }
  if (view.stage === "answer") {
    return {
      playerId,
      optionId: state.round.prompt.options?.[index % Math.max(1, state.round.prompt.options?.length ?? 1)],
      value: state.round.prompt.options?.[index % Math.max(1, state.round.prompt.options?.length ?? 1)] ?? `answer-${playerId}`,
      at: index + 1,
    };
  }
  if (view.stage === "perform") {
    return { playerId, value: `proof-${playerId}`, success: true, at: index + 1 };
  }
  if (view.stage === "react") {
    return { playerId, value: `unique-${playerId}`, success: index % 2 === 0, at: index + 1 };
  }
  if (view.stage === "private") {
    return { playerId, optionId: state.round.prompt.options?.[0] ?? "A", value: state.round.prompt.options?.[0] ?? "A" };
  }
  return { playerId, value: `ok-${playerId}` };
}

test("every generic Gang game can complete a full round without a dead-end", () => {
  for (const playbook of GANG_PLAYBOOKS.filter((playbook) => playbook.runtime !== "time-drop")) {
    let state = createGangRuntime({
      id: `runtime-${playbook.id}`,
      gameId: playbook.id,
      players: players(playbook.minPlayers),
      seed: 1234,
    });
    const firstRound = state.roundNumber;
    let guard = 0;

    while (!state.finished && state.roundNumber === firstRound && guard < 20) {
      guard += 1;
      const view = publicGangView(state);
      for (const [index, playerId] of requiredPlayerIds(state).entries()) {
        state = submitGangAction(state, genericAction(state, playerId, index));
      }
      assert.equal(canAdvanceGangStage(state), true, `${playbook.id} is blocked at ${view.stage}`);
      state = advanceGangStage(state);
    }

    assert.ok(
      state.finished || state.roundNumber > firstRound,
      `${playbook.id} failed to leave its first round`,
    );
  }
});


test("TIME//DROP cannot accidentally start through the generic GANG runtime", () => {
  assert.throws(
    () => createGangRuntime({
      id: "time-drop-wrong-runtime",
      gameId: "time-drop",
      players: players(4),
      seed: 7,
    }),
    /dedicated @nocturne\/time-drop-core runtime/,
  );
});


test("generic Gang sessions do not repeat prompts before the authored pool is exhausted", () => {
  for (const playbook of GANG_PLAYBOOKS.filter((playbook) => playbook.runtime !== "time-drop")) {
    let state = createGangRuntime({
      id: `prompt-integrity-${playbook.id}`,
      gameId: playbook.id,
      players: players(playbook.minPlayers),
      seed: 20261025,
    });
    const seen = new Set();
    const roundsToCheck = Math.min(state.targetRounds, playbook.prompts.length);

    for (let round = 0; round < roundsToCheck; round += 1) {
      assert.equal(
        seen.has(state.round.prompt.id),
        false,
        `${playbook.id} repeated prompt ${state.round.prompt.id} in round ${state.roundNumber}`,
      );
      seen.add(state.round.prompt.id);

      const roundNumber = state.roundNumber;
      let guard = 0;
      while (!state.finished && state.roundNumber === roundNumber && guard < 20) {
        guard += 1;
        for (const [index, playerId] of requiredPlayerIds(state).entries()) {
          state = submitGangAction(state, genericAction(state, playerId, index));
        }
        assert.equal(canAdvanceGangStage(state), true, `${playbook.id} blocked at ${publicGangView(state).stage}`);
        state = advanceGangStage(state);
      }
    }

    assert.equal(seen.size, roundsToCheck, `${playbook.id} did not produce a unique prompt sequence`);
  }
});

test("majority runtime resolves tied room votes and scores only matching predictions", () => {
  let state = createGangRuntime({
    id: "majority-tie-runtime",
    gameId: "the-majority",
    players: players(4),
    seed: 91,
  });
  const options = state.round.prompt.options;
  assert.ok(options && options.length >= 3);
  const [x, y, z] = options;

  const predictions = { p1: x, p2: z, p3: y, p4: y };
  for (const player of state.players) {
    state = submitGangAction(state, { playerId: player.id, optionId: predictions[player.id] });
  }
  state = advanceGangStage(state);

  const votes = { p1: x, p2: y, p3: x, p4: y };
  for (const player of state.players) {
    state = submitGangAction(state, { playerId: player.id, optionId: votes[player.id] });
  }
  state = advanceGangStage(state);
  state = advanceGangStage(state);

  assert.deepEqual(state.scores, { p1: 1, p2: 0, p3: 1, p4: 1 });
  assert.deepEqual(
    new Set(state.round.resolution?.revealItems?.map((item) => item.value)),
    new Set([x, y]),
  );
  assert.deepEqual(new Set(state.round.resolution?.winners), new Set(["p1", "p3", "p4"]));
});

test("majority prediction awards points only after the reveal", () => {
  let state = createGangRuntime({
    id: "m1",
    gameId: "the-majority",
    players: players(3),
    seed: 3,
  });
  const options = state.round.prompt.options;
  assert.ok(options && options.length >= 2);

  for (const player of state.players) {
    state = submitGangAction(state, { playerId: player.id, optionId: options[0] });
  }
  state = advanceGangStage(state);
  for (const player of state.players) {
    state = submitGangAction(state, { playerId: player.id, optionId: options[0] });
  }
  state = advanceGangStage(state);
  assert.deepEqual(state.scores, { p1: 0, p2: 0, p3: 0 });
  state = advanceGangStage(state);
  assert.deepEqual(state.scores, { p1: 1, p2: 1, p3: 1 });
});

test("anonymous creative votes expose player ids as vote tokens only after answers exist", () => {
  let state = createGangRuntime({
    id: "b1",
    gameId: "bad-answers-only",
    players: players(3),
    seed: 99,
  });
  for (const player of state.players) {
    state = submitGangAction(state, { playerId: player.id, value: `bad-${player.id}` });
  }
  state = advanceGangStage(state);
  const view = publicGangView(state);
  assert.equal(view.stage, "vote");
  assert.deepEqual(new Set(view.options), new Set(["p1", "p2", "p3"]));
});


test("SECRET MISSIONS stays unique at its declared 30-player maximum", () => {
  const roster = players(30);
  const state = createGangRuntime({
    id: "missions-max",
    gameId: "secret-missions",
    players: roster,
    seed: 2026,
  });
  const missions = roster.map((player) => privateGangView(state, player.id)?.mission);
  assert.equal(missions.every(Boolean), true);
  assert.equal(new Set(missions).size, 30);
});
