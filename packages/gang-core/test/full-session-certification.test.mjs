import assert from "node:assert/strict";
import test from "node:test";
import {
  GANG_PLAYBOOKS,
  advanceGangStage,
  canAdvanceGangStage,
  createGangRuntime,
  privateGangView,
  publicGangView,
  requiredPlayerIds,
  submitGangAction,
} from "../dist/index.js";

function players(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

function actionFor(state, playerId, index) {
  const view = publicGangView(state);
  const options = view.options ?? state.round.prompt.options ?? [];
  const first = options[0];

  if (view.stage === "vote") {
    const target =
      options.find((option) => option === "__truth__" || option !== playerId) ??
      state.players.find((player) => player.id !== playerId)?.id;
    return {
      playerId,
      ...(target && target !== "__truth__" ? { targetPlayerId: target } : {}),
      value: target ?? `vote-${playerId}`,
    };
  }

  if (view.stage === "predict" || view.stage === "private") {
    const optionId = first ?? state.round.prompt.options?.[0] ?? "A";
    return { playerId, optionId, value: optionId };
  }

  if (view.stage === "answer") {
    const optionId = state.round.prompt.options?.[index % Math.max(1, state.round.prompt.options?.length ?? 1)];
    const answer =
      state.gameId === "draw-this"
        ? index === 0
          ? state.round.prompt.answer ?? "guess"
          : `guess-${playerId}`
        : optionId ?? `answer-${playerId}-r${state.roundNumber}`;
    return { playerId, ...(optionId ? { optionId } : {}), value: answer, at: index + 1 };
  }

  if (view.stage === "perform") {
    return {
      playerId,
      value: `proof-${playerId}-r${state.roundNumber}`,
      success: true,
      at: index + 1,
    };
  }

  if (view.stage === "react") {
    return {
      playerId,
      value: `reaction-${playerId}-r${state.roundNumber}`,
      success: true,
      at: index + 1,
    };
  }

  return { playerId, value: `ok-${playerId}` };
}

function completeSession(playbook, playerCount, seed) {
  let state = createGangRuntime({
    id: `cert-${playbook.id}-${playerCount}`,
    gameId: playbook.id,
    players: players(playerCount),
    seed,
    targetRounds: Math.min(playbook.rounds[0] + 1, playbook.rounds[1]),
  });

  const expectedRounds = state.targetRounds;
  let guard = 0;
  let lastRound = 1;

  while (!state.finished && guard < expectedRounds * 20) {
    guard += 1;

    // Public payloads for secret-role games must never contain any private payload.
    if (
      ["undercover", "one-of-you", "draw-this", "secret-missions"].includes(state.gameId) &&
      !["reveal", "score"].includes(publicGangView(state).stage)
    ) {
      const serialized = JSON.stringify(publicGangView(state));
      for (const player of state.players) {
        const priv = privateGangView(state, player.id);
        if (priv?.secret) assert.equal(serialized.includes(priv.secret), false);
        if (priv?.mission) assert.equal(serialized.includes(priv.mission), false);
      }
    }

    const required = requiredPlayerIds(state);
    for (const [index, playerId] of required.entries()) {
      state = submitGangAction(state, actionFor(state, playerId, index));
    }

    assert.equal(
      canAdvanceGangStage(state),
      true,
      `${playbook.id} blocked at round ${state.roundNumber}, stage ${publicGangView(state).stage}, players=${playerCount}`,
    );

    const beforeScores = { ...state.scores };
    const beforeRound = state.roundNumber;
    state = advanceGangStage(state);

    for (const [id, score] of Object.entries(state.scores)) {
      assert.ok(Number.isFinite(score), `${playbook.id}: non-finite score for ${id}`);
      assert.ok(score >= 0, `${playbook.id}: negative score for ${id}`);
      assert.ok(score >= (beforeScores[id] ?? 0), `${playbook.id}: score regressed for ${id}`);
    }

    if (state.roundNumber !== beforeRound) {
      assert.equal(state.roundNumber, beforeRound + 1);
      lastRound = state.roundNumber;
    }
  }

  assert.equal(state.finished, true, `${playbook.id} did not finish; last round ${lastRound}`);
  assert.equal(state.roundNumber, expectedRounds, `${playbook.id} finished on wrong round`);
  assert.ok(state.winnerIds.length >= 1, `${playbook.id} must resolve at least one winner/tied leader`);
  assert.ok(state.winnerIds.every((id) => state.players.some((p) => p.id === id)));
  return state;
}

for (const playbook of GANG_PLAYBOOKS.filter((playbook) => playbook.runtime !== "time-drop")) {
  test(`${playbook.id}: full session completes at minimum player count`, () => {
    completeSession(playbook, playbook.minPlayers, 1001);
  });

  test(`${playbook.id}: full session completes at representative upper scale`, () => {
    const representative = Math.min(
      playbook.maxPlayers,
      playbook.maxPlayers >= 31 ? 40 : playbook.maxPlayers,
    );
    completeSession(playbook, representative, 9001);
  });
}

test("full-session certification covers 16 generic games plus one special TIME//DROP runtime", () => {
  assert.equal(GANG_PLAYBOOKS.length, 17);
  assert.equal(GANG_PLAYBOOKS.filter((playbook) => playbook.runtime !== "time-drop").length, 16);
  assert.equal(GANG_PLAYBOOKS.filter((playbook) => playbook.runtime === "time-drop").length, 1);
});
