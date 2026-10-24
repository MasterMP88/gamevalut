import { getGangPlaybook, type GangGameId, type GangPrompt, type GangStageKind } from "./playbooks.js";

export interface GangRuntimePlayer {
  id: string;
  name: string;
  teamId?: "A" | "B";
}

export interface GangRuntimeAction {
  playerId: string;
  value?: string;
  targetPlayerId?: string;
  optionId?: string;
  success?: boolean;
  at?: number;
}

export interface GangPrivatePayload {
  role?: string;
  secret?: string;
  prompt?: string;
  mission?: string;
  active?: boolean;
}

export interface GangRoundResolution {
  headline: string;
  detail: string;
  winners: string[];
  scoreDelta: Record<string, number>;
  revealItems?: Array<{ label: string; value: string; playerId?: string }>;
}

export interface GangRuntimeRound {
  id: string;
  number: number;
  prompt: GangPrompt;
  stages: GangStageKind[];
  stageIndex: number;
  stageSubmissions: Record<number, Record<string, GangRuntimeAction>>;
  privateByPlayer: Record<string, GangPrivatePayload>;
  activePlayerId: string | null;
  oddPlayerId: string | null;
  undercoverPlayerIds: string[];
  resolution: GangRoundResolution | null;
}

export interface GangRuntimeState {
  id: string;
  gameId: GangGameId;
  seed: number;
  players: GangRuntimePlayer[];
  scores: Record<string, number>;
  roundNumber: number;
  targetRounds: number;
  round: GangRuntimeRound;
  finished: boolean;
  winnerIds: string[];
}

export interface GangPublicRoundView {
  id: string;
  number: number;
  prompt: string;
  subline?: string;
  options?: string[];
  seconds?: number;
  category?: string;
  stage: GangStageKind;
  stageIndex: number;
  totalStages: number;
  submittedPlayerIds: string[];
  requiredPlayerIds: string[];
  activePlayerId: string | null;
  resolution: GangRoundResolution | null;
}

function nextRand(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [r, (seed + 0x6d2b79f5) | 0];
}

function pickIndex(length: number, seed: number): [number, number] {
  if (length < 1) throw new Error("Cannot pick from an empty list");
  const [r, next] = nextRand(seed);
  return [Math.floor(r * length), next];
}

function uniquePlayers(players: readonly GangRuntimePlayer[]): GangRuntimePlayer[] {
  const seen = new Set<string>();
  const out: GangRuntimePlayer[] = [];
  for (const player of players) {
    const id = player.id.trim();
    const name = player.name.trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ ...player, id, name: name.slice(0, 32) });
  }
  return out;
}

function teamPlayers(players: readonly GangRuntimePlayer[]): GangRuntimePlayer[] {
  return players.map((player, index) => ({
    ...player,
    teamId: player.teamId ?? (index % 2 === 0 ? "A" : "B"),
  }));
}

function activePlayerFor(gameId: GangGameId, players: readonly GangRuntimePlayer[], roundNumber: number): string | null {
  if (!["hot-seat", "draw-this", "bluff"].includes(gameId)) return null;
  return players[(roundNumber - 1) % players.length]?.id ?? null;
}

function privatePayloads(
  gameId: GangGameId,
  prompt: GangPrompt,
  players: readonly GangRuntimePlayer[],
  roundNumber: number,
  seed: number,
): {
  privateByPlayer: Record<string, GangPrivatePayload>;
  oddPlayerId: string | null;
  undercoverPlayerIds: string[];
  seed: number;
} {
  const privateByPlayer: Record<string, GangPrivatePayload> = {};
  let currentSeed = seed;
  let oddPlayerId: string | null = null;
  let undercoverPlayerIds: string[] = [];

  if (gameId === "undercover") {
    const count = players.length >= 8 ? (roundNumber % 3 === 0 ? 2 : 1) : 1;
    const pool = players.map((player) => player.id);
    const selected = new Set<string>();
    while (selected.size < Math.min(count, players.length - 1)) {
      let index: number;
      [index, currentSeed] = pickIndex(pool.length, currentSeed);
      selected.add(pool[index]!);
    }
    undercoverPlayerIds = [...selected];
    for (const player of players) {
      const isUndercover = selected.has(player.id);
      privateByPlayer[player.id] = {
        role: isUndercover ? "UNDERCOVER" : "CIVILIAN",
        secret: isUndercover ? (prompt.altPrompt ?? "Kein Wort") : (prompt.answer ?? ""),
        prompt: isUndercover ? "Bleib glaubwürdig. Du hast ein ähnliches, aber anderes Wort." : "Finde die Person mit dem anderen Wort.",
      };
    }
  } else if (gameId === "one-of-you") {
    let index: number;
    [index, currentSeed] = pickIndex(players.length, currentSeed);
    oddPlayerId = players[index]!.id;
    for (const player of players) {
      const odd = player.id === oddPlayerId;
      privateByPlayer[player.id] = {
        role: odd ? "ODD" : "ROOM",
        prompt: odd ? (prompt.altPrompt ?? prompt.prompt) : prompt.prompt,
      };
    }
  } else if (gameId === "draw-this") {
    const active = activePlayerFor(gameId, players, roundNumber);
    for (const player of players) {
      privateByPlayer[player.id] = player.id === active
        ? { active: true, secret: prompt.answer ?? "", prompt: "Nur du siehst den Begriff. Zeichne, ohne Buchstaben oder Zahlen." }
        : { active: false, prompt: "Rate so schnell wie möglich." };
    }
  } else if (gameId === "hot-seat") {
    const active = activePlayerFor(gameId, players, roundNumber);
    for (const player of players) {
      privateByPlayer[player.id] = {
        active: player.id === active,
        prompt: player.id === active ? "Wähle geheim deine echte Antwort." : "Warte auf die Prognosephase.",
      };
    }
  } else if (gameId === "secret-missions") {
    const playbook = getGangPlaybook(gameId)!;
    const available = playbook.prompts.slice();
    const used = new Set<number>();
    for (const player of players) {
      let index: number;
      do {
        [index, currentSeed] = pickIndex(available.length, currentSeed);
      } while (used.has(index) && used.size < available.length);
      used.add(index);
      const mission = available[index]!;
      privateByPlayer[player.id] = {
        role: "AGENT",
        mission: mission.prompt,
        ...(mission.altPrompt ? { prompt: mission.altPrompt } : {}),
      };
    }
  } else if (gameId === "bluff") {
    const active = activePlayerFor(gameId, players, roundNumber);
    for (const player of players) {
      privateByPlayer[player.id] = {
        active: player.id === active,
        prompt: player.id === active
          ? `Du kennst die Wahrheit: ${prompt.answer ?? ""}. Du darfst beim Bluffen nicht verraten, welche Antwort echt ist.`
          : "Erfinde eine glaubwürdige falsche Antwort.",
      };
    }
  }

  return { privateByPlayer, oddPlayerId, undercoverPlayerIds, seed: currentSeed };
}

function promptForRound(gameId: GangGameId, roundNumber: number, seed: number): [GangPrompt, number] {
  const playbook = getGangPlaybook(gameId);
  if (!playbook) throw new Error(`Unknown GANG game: ${gameId}`);
  const offset = (roundNumber - 1) % playbook.prompts.length;
  let start: number;
  let nextSeed: number;
  [start, nextSeed] = pickIndex(playbook.prompts.length, seed);
  const prompt = playbook.prompts[(start + offset) % playbook.prompts.length]!;
  return [prompt, nextSeed];
}

function createRound(
  gameId: GangGameId,
  players: readonly GangRuntimePlayer[],
  roundNumber: number,
  seed: number,
): { round: GangRuntimeRound; seed: number } {
  const playbook = getGangPlaybook(gameId);
  if (!playbook) throw new Error(`Unknown GANG game: ${gameId}`);
  let prompt: GangPrompt;
  let nextSeed: number;
  [prompt, nextSeed] = promptForRound(gameId, roundNumber, seed);
  const privateState = privatePayloads(gameId, prompt, players, roundNumber, nextSeed);
  nextSeed = privateState.seed;

  return {
    round: {
      id: `${gameId}-r${roundNumber}-${Math.abs(nextSeed)}`,
      number: roundNumber,
      prompt,
      stages: playbook.stages.includes("score")
        ? playbook.stages.slice()
        : [...playbook.stages, "score"],
      stageIndex: 0,
      stageSubmissions: {},
      privateByPlayer: privateState.privateByPlayer,
      activePlayerId: activePlayerFor(gameId, players, roundNumber),
      oddPlayerId: privateState.oddPlayerId,
      undercoverPlayerIds: privateState.undercoverPlayerIds,
      resolution: null,
    },
    seed: nextSeed,
  };
}

export function createGangRuntime(input: {
  id: string;
  gameId: GangGameId;
  players: readonly GangRuntimePlayer[];
  seed?: number;
  targetRounds?: number;
}): GangRuntimeState {
  const playbook = getGangPlaybook(input.gameId);
  if (!playbook) throw new Error(`Unknown GANG game: ${input.gameId}`);
  let players = uniquePlayers(input.players);
  if (input.gameId === "team-chaos") players = teamPlayers(players);
  if (players.length < playbook.minPlayers || players.length > playbook.maxPlayers) {
    throw new RangeError(`${playbook.title} supports ${playbook.minPlayers}–${playbook.maxPlayers} players`);
  }
  const targetRounds = Math.max(
    playbook.rounds[0],
    Math.min(input.targetRounds ?? playbook.rounds[0], playbook.rounds[1]),
  );
  const seed = input.seed ?? 1;
  const created = createRound(input.gameId, players, 1, seed);
  return {
    id: input.id,
    gameId: input.gameId,
    seed: created.seed,
    players,
    scores: Object.fromEntries(players.map((player) => [player.id, 0])),
    roundNumber: 1,
    targetRounds,
    round: created.round,
    finished: false,
    winnerIds: [],
  };
}

function stageOf(state: GangRuntimeState): GangStageKind {
  return state.round.stages[state.round.stageIndex]!;
}

function eligibleForStage(state: GangRuntimeState, stage = stageOf(state)): string[] {
  const all = state.players.map((player) => player.id);
  const active = state.round.activePlayerId;

  if (stage === "reveal" || stage === "score") return [];
  if (stage === "private") {
    if (state.gameId === "hot-seat") return active ? [active] : [];
    return [];
  }
  if (state.gameId === "hot-seat") {
    if (stage === "predict") return all.filter((id) => id !== active);
    return active ? [active] : all;
  }
  if (state.gameId === "draw-this") {
    if (stage === "perform") return active ? [active] : [];
    if (stage === "answer") return all.filter((id) => id !== active);
  }
  if (state.gameId === "bluff") {
    if (stage === "answer") return all.filter((id) => id !== active);
    if (stage === "vote") return all;
  }
  if (state.gameId === "the-line" && stage === "perform") return all;
  return all;
}

export function requiredPlayerIds(state: GangRuntimeState): string[] {
  return eligibleForStage(state);
}

export function submitGangAction(state: GangRuntimeState, action: GangRuntimeAction): GangRuntimeState {
  if (state.finished) throw new Error("Game is already finished");
  if (!state.players.some((player) => player.id === action.playerId)) {
    throw new Error("Unknown player");
  }
  const stage = stageOf(state);
  if (stage === "reveal" || stage === "score" || (stage === "private" && state.gameId !== "hot-seat")) {
    throw new Error(`No submissions are accepted during ${stage}`);
  }
  const eligible = new Set(eligibleForStage(state, stage));
  if (!eligible.has(action.playerId)) throw new Error("Player cannot act in this stage");
  const stageSubmissions = { ...state.round.stageSubmissions };
  const submissions = { ...(stageSubmissions[state.round.stageIndex] ?? {}) };
  submissions[action.playerId] = { ...action };
  stageSubmissions[state.round.stageIndex] = submissions;
  return { ...state, round: { ...state.round, stageSubmissions } };
}

function currentSubmissions(state: GangRuntimeState): Record<string, GangRuntimeAction> {
  return state.round.stageSubmissions[state.round.stageIndex] ?? {};
}

export function canAdvanceGangStage(state: GangRuntimeState): boolean {
  if (state.finished) return false;
  const stage = stageOf(state);
  if (stage === "reveal" || stage === "score") return true;
  if (stage === "private" && state.gameId !== "hot-seat") return true;
  if (state.gameId === "secret-missions" && stage === "perform") return true;
  const required = eligibleForStage(state, stage);
  const submissions = currentSubmissions(state);
  return required.every((playerId) => submissions[playerId] !== undefined);
}

function allStageSubmissions(state: GangRuntimeState, stage: GangStageKind): Record<string, GangRuntimeAction> {
  const index = state.round.stages.indexOf(stage);
  return index >= 0 ? (state.round.stageSubmissions[index] ?? {}) : {};
}

function mostVoted(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  return max === 0 ? [] : [...counts.entries()].filter(([, count]) => count === max).map(([value]) => value);
}

function resolveRound(state: GangRuntimeState): GangRoundResolution {
  const { gameId, round, players } = state;
  const delta: Record<string, number> = Object.fromEntries(players.map((player) => [player.id, 0]));
  const playerName = (id: string) => players.find((player) => player.id === id)?.name ?? id;
  const award = (id: string, points: number) => {
    delta[id] = (delta[id] ?? 0) + points;
  };

  if (gameId === "the-majority") {
    const predictions = allStageSubmissions(state, "predict");
    const votes = allStageSubmissions(state, "answer");
    const winners = mostVoted(Object.values(votes).map((action) => action.optionId ?? action.value ?? ""));
    const correct = Object.values(predictions)
      .filter((action) => winners.includes(action.optionId ?? action.value ?? ""))
      .map((action) => action.playerId);
    for (const id of correct) delta[id] = 1;
    return {
      headline: winners.length > 1 ? "Der Raum ist gespalten." : "Das ist die Mehrheit.",
      detail: correct.length ? `${correct.length} Personen haben den Raum richtig gelesen.` : "Niemand hat diese Mehrheit kommen sehen.",
      winners: correct,
      scoreDelta: delta,
      revealItems: winners.map((value) => ({ label: "Mehrheit", value })),
    };
  }

  if (gameId === "whos-that") {
    const votes = allStageSubmissions(state, "vote");
    const targets = mostVoted(Object.values(votes).map((action) => action.targetPlayerId ?? action.value ?? ""));
    return {
      headline: targets.length > 1 ? "Unentschieden. Natürlich." : `${playerName(targets[0] ?? "")} — der Raum hat entschieden.`,
      detail: "Keine Diskussion nötig. Die Diskussion passiert sowieso.",
      winners: targets,
      scoreDelta: delta,
    };
  }

  if (gameId === "undercover") {
    const votes = allStageSubmissions(state, "vote");
    const accused = mostVoted(Object.values(votes).map((action) => action.targetPlayerId ?? action.value ?? ""));
    const caught = accused.some((id) => round.undercoverPlayerIds.includes(id));
    if (caught) {
      for (const action of Object.values(votes)) {
        if (round.undercoverPlayerIds.includes(action.targetPlayerId ?? action.value ?? "")) award(action.playerId, 1);
      }
    } else {
      for (const id of round.undercoverPlayerIds) award(id, 3);
    }
    return {
      headline: caught ? "UNDERCOVER enttarnt." : "UNDERCOVER kommt davon.",
      detail: `Undercover: ${round.undercoverPlayerIds.map(playerName).join(", ")}.`,
      winners: caught ? accused.filter((id) => round.undercoverPlayerIds.includes(id)) : round.undercoverPlayerIds,
      scoreDelta: delta,
    };
  }

  if (gameId === "secret-missions") {
    const performed = allStageSubmissions(state, "perform");
    const winners = Object.values(performed).filter((action) => action.success).map((action) => action.playerId);
    for (const id of winners) award(id, 2);
    return {
      headline: "Die Missionen fliegen auf.",
      detail: `${winners.length} Missionen wurden als geschafft markiert.`,
      winners,
      scoreDelta: delta,
      revealItems: players.map((player) => ({ label: player.name, value: round.privateByPlayer[player.id]?.mission ?? "" , playerId: player.id })),
    };
  }

  if (["bad-answers-only", "music-drop", "photo-hunt"].includes(gameId)) {
    const answers = allStageSubmissions(state, gameId === "photo-hunt" ? "perform" : "answer");
    const votes = allStageSubmissions(state, "vote");
    const targets = mostVoted(Object.values(votes).map((action) => action.targetPlayerId ?? action.value ?? ""));
    for (const id of targets) award(id, 2);
    return {
      headline: targets.length > 1 ? "Der Raum kann sich nicht entscheiden." : `${playerName(targets[0] ?? "")} nimmt die Runde.`,
      detail: gameId === "music-drop" ? "Der Crowd-Pick wandert in die Tracklist." : "Crowd-Vote abgeschlossen.",
      winners: targets,
      scoreDelta: delta,
      revealItems: Object.values(answers).map((action) => ({ label: playerName(action.playerId), value: action.value ?? "", playerId: action.playerId })),
    };
  }

  if (gameId === "bluff") {
    const lies = allStageSubmissions(state, "answer");
    const votes = allStageSubmissions(state, "vote");
    const truthKey = "__truth__";
    for (const action of Object.values(votes)) {
      const target = action.targetPlayerId ?? action.value ?? "";
      if (target === truthKey) award(action.playerId, 2);
      else if (delta[target] !== undefined) award(target, 1);
    }
    const leaders = Object.entries(delta).sort((a, b) => b[1] - a[1]).filter(([, score], _, arr) => score === arr[0]?.[1]).map(([id]) => id);
    return {
      headline: "Wahrheit oder sehr gute Lüge?",
      detail: `Wahr: ${round.prompt.answer ?? ""}`,
      winners: leaders,
      scoreDelta: delta,
      revealItems: [
        { label: "WAHRHEIT", value: round.prompt.answer ?? "" },
        ...Object.values(lies).map((action) => ({ label: playerName(action.playerId), value: action.value ?? "", playerId: action.playerId })),
      ],
    };
  }

  if (gameId === "hot-seat") {
    const choice = Object.values(allStageSubmissions(state, "private"))[0];
    const answer = choice?.optionId ?? choice?.value ?? "";
    const predictions = allStageSubmissions(state, "predict");
    const correct = Object.values(predictions).filter((action) => (action.optionId ?? action.value) === answer).map((action) => action.playerId);
    for (const id of correct) award(id, 1);
    if (round.activePlayerId && correct.length < Math.ceil((players.length - 1) / 2)) award(round.activePlayerId, 1);
    return {
      headline: `${round.activePlayerId ? playerName(round.activePlayerId) : "Hot Seat"} hat gewählt.`,
      detail: `${correct.length} Prognosen waren richtig.`,
      winners: correct,
      scoreDelta: delta,
      revealItems: [{ label: "Antwort", value: answer }],
    };
  }

  if (gameId === "draw-this") {
    const guesses = allStageSubmissions(state, "answer");
    const answer = (round.prompt.answer ?? "").trim().toLocaleLowerCase();
    const correct = Object.values(guesses)
      .filter((action) => (action.value ?? "").trim().toLocaleLowerCase() === answer)
      .sort((a, b) => (a.at ?? Number.MAX_SAFE_INTEGER) - (b.at ?? Number.MAX_SAFE_INTEGER));
    const first = correct[0]?.playerId;
    if (first) award(first, 2);
    if (first && round.activePlayerId) award(round.activePlayerId, 1);
    return {
      headline: first ? `${playerName(first)} hatte es zuerst.` : "Niemand hatte es.",
      detail: `Gesucht: ${round.prompt.answer ?? ""}.`,
      winners: first ? [first] : [],
      scoreDelta: delta,
    };
  }

  if (gameId === "one-of-you") {
    const votes = allStageSubmissions(state, "vote");
    const accused = mostVoted(Object.values(votes).map((action) => action.targetPlayerId ?? action.value ?? ""));
    const caught = round.oddPlayerId ? accused.includes(round.oddPlayerId) : false;
    if (caught) {
      for (const action of Object.values(votes)) if ((action.targetPlayerId ?? action.value) === round.oddPlayerId) award(action.playerId, 2);
    } else if (round.oddPlayerId) award(round.oddPlayerId, 3);
    return {
      headline: caught ? "ONE OF YOU wurde gefunden." : "ONE OF YOU bleibt unsichtbar.",
      detail: round.oddPlayerId ? `Odd Player: ${playerName(round.oddPlayerId)}.` : "",
      winners: caught ? [round.oddPlayerId!].filter(Boolean) : (round.oddPlayerId ? [round.oddPlayerId] : []),
      scoreDelta: delta,
    };
  }

  if (gameId === "team-chaos") {
    const actions = allStageSubmissions(state, "react");
    const successA = Object.values(actions).filter((action) => players.find((p) => p.id === action.playerId)?.teamId === "A" && action.success).length;
    const successB = Object.values(actions).filter((action) => players.find((p) => p.id === action.playerId)?.teamId === "B" && action.success).length;
    const winningTeam = successA === successB ? null : (successA > successB ? "A" : "B");
    const winners = winningTeam ? players.filter((player) => player.teamId === winningTeam).map((player) => player.id) : [];
    for (const id of winners) award(id, 2);
    return {
      headline: winningTeam ? `Team ${winningTeam} nimmt die Runde.` : "Dead heat.",
      detail: `Team A ${successA} · Team B ${successB}`,
      winners,
      scoreDelta: delta,
    };
  }

  if (gameId === "chain-reaction" || gameId === "panic-button") {
    const actions = allStageSubmissions(state, "react");
    const seen = new Set<string>();
    const winners: string[] = [];
    for (const player of players) {
      const value = (actions[player.id]?.value ?? "").trim().toLocaleLowerCase();
      if (value && !seen.has(value)) {
        seen.add(value);
        award(player.id, 1);
        winners.push(player.id);
      }
    }
    return {
      headline: gameId === "panic-button" ? "Panik überlebt." : "Kette gehalten.",
      detail: `${winners.length} gültige, eindeutige Antworten.`,
      winners,
      scoreDelta: delta,
    };
  }

  if (gameId === "the-line" || gameId === "after-dark") {
    return {
      headline: gameId === "the-line" ? "Positionen stehen." : "Reveal.",
      detail: "Der eigentliche Punkt ist das Gespräch danach.",
      winners: [],
      scoreDelta: delta,
    };
  }

  return {
    headline: "Runde beendet.",
    detail: "Weiter zur nächsten Runde.",
    winners: [],
    scoreDelta: delta,
  };
}

function applyScoreDelta(scores: Record<string, number>, delta: Record<string, number>): Record<string, number> {
  const next = { ...scores };
  for (const [id, value] of Object.entries(delta)) next[id] = (next[id] ?? 0) + value;
  return next;
}

export function advanceGangStage(state: GangRuntimeState, options: { force?: boolean } = {}): GangRuntimeState {
  if (state.finished) return state;
  if (!options.force && !canAdvanceGangStage(state)) throw new Error("Stage is not complete");

  const currentStage = stageOf(state);
  let round = state.round;
  let scores = state.scores;

  if (currentStage === "reveal" && !round.resolution) {
    const resolution = resolveRound(state);
    round = { ...round, resolution };
    scores = applyScoreDelta(scores, resolution.scoreDelta);
  }

  if (currentStage === "score") {
    if (state.roundNumber >= state.targetRounds) {
      const max = Math.max(...Object.values(scores));
      const winnerIds = Object.entries(scores).filter(([, score]) => score === max).map(([id]) => id);
      return { ...state, scores, finished: true, winnerIds, round };
    }
    const nextNumber = state.roundNumber + 1;
    const created = createRound(state.gameId, state.players, nextNumber, state.seed);
    return {
      ...state,
      seed: created.seed,
      scores,
      roundNumber: nextNumber,
      round: created.round,
    };
  }

  return {
    ...state,
    scores,
    round: { ...round, stageIndex: Math.min(round.stageIndex + 1, round.stages.length - 1) },
  };
}

export function privateGangView(state: GangRuntimeState, playerId: string): GangPrivatePayload | null {
  if (!state.players.some((player) => player.id === playerId)) return null;
  return state.round.privateByPlayer[playerId] ?? null;
}

function dynamicVoteOptions(state: GangRuntimeState): string[] | undefined {
  const stage = stageOf(state);
  if (stage !== "vote") return state.round.prompt.options?.slice();

  if (["bad-answers-only", "music-drop", "photo-hunt"].includes(state.gameId)) {
    const sourceStage = state.gameId === "photo-hunt" ? "perform" : "answer";
    const submissions = allStageSubmissions(state, sourceStage);
    return Object.values(submissions).map((action) => action.playerId);
  }
  if (state.gameId === "bluff") {
    const lies = allStageSubmissions(state, "answer");
    return ["__truth__", ...Object.values(lies).map((action) => action.playerId)];
  }
  if (["whos-that", "undercover", "one-of-you"].includes(state.gameId)) {
    return state.players.map((player) => player.id);
  }
  return state.round.prompt.options?.slice();
}

export function publicGangView(state: GangRuntimeState): GangPublicRoundView {
  const stage = stageOf(state);
  const promptHidden =
    (state.gameId === "one-of-you" && stage !== "reveal" && stage !== "score") ||
    (state.gameId === "undercover" && stage !== "reveal" && stage !== "score") ||
    (state.gameId === "secret-missions" && stage !== "reveal" && stage !== "score") ||
    (state.gameId === "draw-this" && stage !== "reveal" && stage !== "score");

  const submissions = currentSubmissions(state);
  const options = dynamicVoteOptions(state);
  return {
    id: state.round.id,
    number: state.round.number,
    prompt: promptHidden
      ? state.gameId === "secret-missions"
        ? "SECRET MISSIONS laufen im Hintergrund"
        : "PRIVATE ROUND"
      : state.round.prompt.prompt,
    ...(state.round.prompt.subline ? { subline: state.round.prompt.subline } : {}),
    ...(options ? { options } : {}),
    ...(state.round.prompt.seconds !== undefined ? { seconds: state.round.prompt.seconds } : {}),
    ...(state.round.prompt.category ? { category: state.round.prompt.category } : {}),
    stage,
    stageIndex: state.round.stageIndex,
    totalStages: state.round.stages.length,
    submittedPlayerIds: Object.keys(submissions),
    requiredPlayerIds: eligibleForStage(state, stage),
    activePlayerId: state.round.activePlayerId,
    resolution: state.round.resolution,
  };
}
