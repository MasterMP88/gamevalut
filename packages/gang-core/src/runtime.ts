import {
  getGangPlaybook,
  type GangGameId,
  type GangPrompt,
  type GangStageKind,
} from "./playbooks.js";
import { resolveMajorityRound } from "./mechanics.js";

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
  sequence?: number;
  noFaces?: boolean;
  photoId?: string;
  quantity?: number;
  timedOut?: boolean;
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
  sourceUrl?: string;
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
  runoffCandidates?: string[];
  turnOrder?: string[];
  turnLanes?: string[][];
}

export interface GangRuntimeState {
  id: string;
  gameId: GangGameId;
  seed: number;
  players: GangRuntimePlayer[];
  scores: Record<string, number>;
  roundNumber: number;
  targetRounds: number;
  /** Prompt IDs already used in this session. Optional for backward-compatible restored states. */
  promptHistory?: string[];
  interactionMode?: "one-phone" | "everyone-in";
  resolutions?: GangRoundResolution[];
  declinedIds?: string[];
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
  runoffCandidates?: string[];
  turnOrder?: string[];
  turnLanes?: string[][];
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

function uniquePlayers(
  players: readonly GangRuntimePlayer[],
): GangRuntimePlayer[] {
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

function teamPlayers(
  players: readonly GangRuntimePlayer[],
): GangRuntimePlayer[] {
  return players.map((player, index) => ({
    ...player,
    teamId: player.teamId ?? (index % 2 === 0 ? "A" : "B"),
  }));
}

function activePlayerFor(
  gameId: GangGameId,
  players: readonly GangRuntimePlayer[],
  roundNumber: number,
): string | null {
  if (!["hot-seat", "draw-this", "bluff"].includes(gameId)) return null;
  return players[(roundNumber - 1) % players.length]?.id ?? null;
}

function privatePayloads(
  gameId: GangGameId,
  prompt: GangPrompt,
  players: readonly GangRuntimePlayer[],
  roundNumber: number,
  seed: number,
  isFinal: boolean,
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
    const count = players.length >= 8 && isFinal ? 2 : 1;
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
        secret: isUndercover
          ? (prompt.altPrompt ?? "Kein Wort")
          : (prompt.answer ?? ""),
        prompt: isUndercover
          ? "Bleib glaubwürdig. Du hast ein ähnliches, aber anderes Wort."
          : "Finde die Person mit dem anderen Wort.",
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
  } else if (gameId === "team-chaos") {
    const size = Math.min(
      ...(["A", "B"] as const).map(
        (t) => players.filter((p) => p.teamId === t).length,
      ),
    );
    for (const team of ["A", "B"] as const) {
      const members = players.filter((p) => p.teamId === team);
      const captain = members[(roundNumber - 1) % members.length]?.id;
      const active = new Set(
        Array.from(
          { length: size },
          (_, i) => members[(roundNumber - 1 + i) % members.length]!.id,
        ),
      );
      for (const p of members)
        privateByPlayer[p.id] = {
          role: `TEAM ${team}`,
          active: p.id === captain,
          ...(p.id === captain && prompt.teamChallenge?.secret
            ? { secret: prompt.teamChallenge.secret }
            : {}),
          prompt: !active.has(p.id)
            ? "Diese Runde bist du Schiedsrichter:in. Im nächsten Durchgang rotiert die Besetzung, damit gleich viele spielen."
            : p.id === captain
              ? `Du bist Captain. ${prompt.teamChallenge?.instruction ?? ""}${prompt.teamChallenge?.forbidden ? ` Tabu: ${prompt.teamChallenge.forbidden.join(", ")}.` : ""}`
              : `Dein Captain erklärt die Aufgabe. ${size} Personen pro Team spielen aktiv; die übrigen achten auf die Regeln.`,
        };
    }
  } else if (gameId === "draw-this") {
    const active = activePlayerFor(gameId, players, roundNumber);
    for (const player of players) {
      privateByPlayer[player.id] =
        player.id === active
          ? {
              active: true,
              secret: prompt.answer ?? "",
              prompt:
                "Nur du siehst den Begriff. Zeichne, ohne Buchstaben oder Zahlen.",
            }
          : { active: false, prompt: "Rate so schnell wie möglich." };
    }
  } else if (gameId === "hot-seat") {
    const active = activePlayerFor(gameId, players, roundNumber);
    for (const player of players) {
      privateByPlayer[player.id] = {
        active: player.id === active,
        prompt:
          player.id === active
            ? "Wähle geheim deine echte Antwort."
            : "Warte auf die Prognosephase.",
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
  } else if (gameId === "after-dark") {
    for (const player of players)
      privateByPlayer[player.id] = {
        role: "CONSENT",
        prompt:
          "Du entscheidest selbst: 18+ und heute Lust auf dieses Spiel? Nein ist genauso okay. Niemand muss sich erklären.",
      };
  } else if (gameId === "bluff") {
    const active = activePlayerFor(gameId, players, roundNumber);
    for (const player of players) {
      privateByPlayer[player.id] = {
        active: player.id === active,
        prompt:
          player.id === active
            ? `Du kennst die Wahrheit: ${prompt.answer ?? ""}. Du darfst beim Bluffen nicht verraten, welche Antwort echt ist.`
            : "Erfinde eine glaubwürdige falsche Antwort.",
      };
    }
  }

  return {
    privateByPlayer,
    oddPlayerId,
    undercoverPlayerIds,
    seed: currentSeed,
  };
}

function promptForRound(
  gameId: GangGameId,
  seed: number,
  usedPromptIds: readonly string[],
): [GangPrompt, number] {
  const playbook = getGangPlaybook(gameId);
  if (!playbook) throw new Error(`Unknown GANG game: ${gameId}`);

  const used = new Set(usedPromptIds);
  const unseen = playbook.prompts.filter((prompt) => !used.has(prompt.id));
  const previous = usedPromptIds[usedPromptIds.length - 1];
  const oldest = Math.min(
    ...playbook.prompts.map((p) => usedPromptIds.lastIndexOf(p.id)),
  );
  const recycled = playbook.prompts.filter(
    (prompt) =>
      prompt.id !== previous &&
      usedPromptIds.lastIndexOf(prompt.id) <=
        oldest + Math.max(2, Math.floor(playbook.prompts.length / 4)),
  );
  let candidates =
    unseen.length > 0
      ? unseen
      : recycled.length > 0
        ? recycled
        : playbook.prompts;
  if (gameId === "bluff") {
    const previousTopic = playbook.prompts.find(
      (p) => p.id === previous,
    )?.category;
    const varied = candidates.filter((p) => p.category !== previousTopic);
    if (varied.length) candidates = varied;
  }

  let index: number;
  let nextSeed: number;
  [index, nextSeed] = pickIndex(candidates.length, seed);
  return [candidates[index]!, nextSeed];
}

function createRound(
  gameId: GangGameId,
  players: readonly GangRuntimePlayer[],
  roundNumber: number,
  seed: number,
  targetRounds: number,
  usedPromptIds: readonly string[],
  interactionMode: "one-phone" | "everyone-in" = "one-phone",
): { round: GangRuntimeRound; seed: number } {
  const playbook = getGangPlaybook(gameId);
  if (!playbook) throw new Error(`Unknown GANG game: ${gameId}`);
  let prompt: GangPrompt;
  let nextSeed: number;
  [prompt, nextSeed] = promptForRound(gameId, seed, usedPromptIds);
  const isFinal = roundNumber === targetRounds;
  if (isFinal) {
    if (gameId === "the-majority") {
      prompt = {
        ...prompt,
        category: "finale-blind",
        subline:
          "BLIND MAJORITY: Erst prognostizieren, dann wird die Frage sichtbar.",
      };
    } else if (gameId === "bad-answers-only") {
      prompt = {
        ...prompt,
        category: "finale-five-words",
        subline: "FINALE: Maximal fünf Wörter. Kein sechstes.",
      };
    } else if (gameId === "the-line") {
      prompt = {
        ...prompt,
        category: "finale-silent",
        subline: "SILENT LINE: Aufstellen ohne ein einziges Wort.",
      };
    } else if (gameId === "photo-hunt") {
      prompt = {
        ...prompt,
        category: "finale-20s",
        seconds: 20,
        subline: "FINALE: 20 Sekunden. Ein gemeinsames Thema. Los.",
      };
    } else if (gameId === "draw-this") {
      prompt = {
        ...prompt,
        category: "finale-wrong-hand",
        seconds: 15,
        subline: "FINALE: 15 Sekunden. Zeichne mit der falschen Hand.",
      };
    } else if (gameId === "chain-reaction") {
      prompt = {
        ...prompt,
        category: "finale-3s",
        seconds: 3,
        subline: "FINAL CHAIN: Nur drei Sekunden pro Antwort.",
      };
    } else if (gameId === "panic-button") {
      prompt = {
        ...prompt,
        category: "finale-2s",
        seconds: 2,
        subline: "PANIC FINALE: Zwei Sekunden. Nicht nachdenken.",
      };
    } else if (gameId === "one-of-you") {
      const finals = [
        [
          "Was ist das BESTE an einem spontanen Wochenendtrip?",
          "Was ist das SCHLIMMSTE an einem spontanen Wochenendtrip?",
        ],
        ["Was macht einen Abend PERFEKT?", "Was macht einen Abend PEINLICH?"],
        ["Welche Superkraft wäre NÜTZLICH?", "Welche Superkraft wäre NERVIG?"],
        ["Was ist im Urlaub UNVERZICHTBAR?", "Was ist im Urlaub ÜBERFLÜSSIG?"],
        ["Welche kleine Sache ist LUXUS?", "Welche kleine Sache ist STRESS?"],
        ["Was macht eine Party LEGENDÄR?", "Was macht eine Party MERKWÜRDIG?"],
        ["Was ist morgens HILFREICH?", "Was ist morgens FURCHTBAR?"],
        [
          "Was wäre als Haustier GENIAL?",
          "Was wäre als Haustier KATASTROPHAL?",
        ],
      ];
      const unseen = finals
        .map((_, i) => i)
        .filter((i) => !usedPromptIds.includes(`one-finale-${i}`));
      const choices = unseen.length
        ? unseen
        : finals
            .map((_, i) => i)
            .filter((i) => `one-finale-${i}` !== usedPromptIds.at(-1));
      let index: number;
      [index, nextSeed] = pickIndex(choices.length, nextSeed);
      const chosen = choices[index]!;
      const pair = finals[chosen]!;
      prompt = {
        ...prompt,
        id: `one-finale-${chosen}`,
        category: "finale-one-word",
        prompt: pair[0]!,
        altPrompt: pair[1]!,
        subline: "FINALE: Nur ein Wort unterscheidet eure Fragen.",
      };
    } else if (gameId === "after-dark") {
      prompt = {
        id: "after-dark-finale",
        prompt: "Wie soll diese Nacht enden?",
        subline: "SOFT, BOLD oder STOP — jede Option ist ein valides Ende.",
        options: ["Soft", "Bold", "Stop"],
        category: "finale-choice",
      };
    }
  }
  const privateState = privatePayloads(
    gameId,
    prompt,
    players,
    roundNumber,
    nextSeed,
    isFinal,
  );
  nextSeed = privateState.seed;
  const turnOrder = [
    ...players.slice((roundNumber - 1) % players.length),
    ...players.slice(0, (roundNumber - 1) % players.length),
  ].map((p) => p.id);
  const laneSize =
    interactionMode === "everyone-in" && players.length > 8
      ? 6
      : players.length;
  const turnLanes = Array.from(
    { length: Math.ceil(players.length / laneSize) },
    (_, i) => turnOrder.slice(i * laneSize, (i + 1) * laneSize),
  );

  return {
    round: {
      id: `${gameId}-r${roundNumber}-${Math.abs(nextSeed)}`,
      number: roundNumber,
      prompt,
      turnOrder,
      turnLanes,
      stages: ["chain-reaction", "panic-button"].includes(gameId)
        ? [
            ...Array.from(
              { length: laneSize * (gameId === "panic-button" ? 3 : 1) },
              () => ["perform", "react"] as GangStageKind[],
            ).flat(),
            "reveal",
            "score",
          ]
        : gameId === "draw-this"
          ? ["private", "answer", "reveal", "score"]
          : gameId === "music-drop" && players.length === 2
            ? ["answer", "reveal", "score"]
            : gameId === "after-dark"
              ? isFinal || prompt.afterDarkMode === "choice-action"
                ? ["vote", "perform", "reveal", "score"]
                : prompt.afterDarkMode === "action"
                  ? ["perform", "reveal", "score"]
                  : [
                      prompt.options?.length ? "vote" : "answer",
                      "reveal",
                      "score",
                    ]
              : playbook.stages.includes("score")
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
  targetRounds?: number | undefined;
  seenPromptIds?: readonly string[];
  interactionMode?: "one-phone" | "everyone-in";
}): GangRuntimeState {
  const playbook = getGangPlaybook(input.gameId);
  if (!playbook) throw new Error(`Unknown GANG game: ${input.gameId}`);
  if (playbook.runtime === "time-drop") {
    throw new Error(
      "TIME//DROP uses the dedicated @nocturne/time-drop-core runtime",
    );
  }
  let players = uniquePlayers(input.players);
  if (input.gameId === "team-chaos") players = teamPlayers(players);
  if (
    players.length < playbook.minPlayers ||
    players.length > playbook.maxPlayers
  ) {
    throw new RangeError(
      `${playbook.title} supports ${playbook.minPlayers}–${playbook.maxPlayers} players`,
    );
  }
  const targetRounds = Math.max(
    1,
    Math.min(
      input.targetRounds ??
        (input.gameId === "hot-seat" ? players.length : playbook.rounds[0]),
      Math.max(
        playbook.rounds[1],
        input.gameId === "hot-seat" ? players.length : 0,
      ),
    ),
  );
  const seed = input.seed ?? 1;
  const created = createRound(
    input.gameId,
    players,
    1,
    seed,
    targetRounds,
    input.seenPromptIds ?? [],
    input.interactionMode ?? "one-phone",
  );
  if (input.gameId === "after-dark")
    created.round = {
      ...created.round,
      stages: ["private", ...created.round.stages],
    };
  return {
    id: input.id,
    gameId: input.gameId,
    seed: created.seed,
    players,
    scores: Object.fromEntries(players.map((player) => [player.id, 0])),
    roundNumber: 1,
    targetRounds,
    promptHistory: [...(input.seenPromptIds ?? []), created.round.prompt.id],
    interactionMode: input.interactionMode ?? "one-phone",
    resolutions: [],
    round: created.round,
    finished: false,
    winnerIds: [],
  };
}

function stageOf(state: GangRuntimeState): GangStageKind {
  return state.round.stages[state.round.stageIndex]!;
}

function eligibleForStage(
  state: GangRuntimeState,
  stage = stageOf(state),
): string[] {
  const all = state.players
    .filter((player) => !(state.declinedIds ?? []).includes(player.id))
    .map((player) => player.id);
  const active = state.round.activePlayerId;

  if (stage === "reveal" || stage === "score") return [];
  if (
    ["chain-reaction", "panic-button"].includes(state.gameId) &&
    (stage === "react" || stage === "perform")
  ) {
    const order = state.round.turnOrder ?? all;
    const turn = Math.floor(state.round.stageIndex / 2);
    const lanes = state.round.turnLanes ?? [order];
    const size = Math.max(...lanes.map((l) => l.length));
    return lanes.flatMap((lane) =>
      lane[turn % size] ? [lane[turn % size]!] : [],
    );
  }
  if (stage === "private") {
    if (state.gameId === "hot-seat") return active ? [active] : [];
    if (state.gameId === "after-dark") return all;
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
    if (stage === "vote") return all.filter((id) => id !== active);
  }
  if (
    stage === "vote" &&
    ["bad-answers-only", "music-drop", "photo-hunt"].includes(state.gameId)
  ) {
    const options = dynamicVoteOptions(state) ?? [];
    return all.filter((id) =>
      options.some((option) => !answerChoiceOwners(state, option).includes(id)),
    );
  }
  if (state.gameId === "the-line" && stage === "perform") return all;
  return all;
}

export function requiredPlayerIds(state: GangRuntimeState): string[] {
  return eligibleForStage(state);
}

export function submitGangAction(
  state: GangRuntimeState,
  action: GangRuntimeAction,
): GangRuntimeState {
  if (state.finished) throw new Error("Game is already finished");
  if (!state.players.some((player) => player.id === action.playerId)) {
    throw new Error("Unknown player");
  }
  const stage = stageOf(state);
  if (
    stage === "reveal" ||
    stage === "score" ||
    (stage === "private" && !["hot-seat", "after-dark"].includes(state.gameId))
  ) {
    throw new Error(`No submissions are accepted during ${stage}`);
  }
  const eligible = new Set(eligibleForStage(state, stage));
  if (!eligible.has(action.playerId))
    throw new Error("Player cannot act in this stage");

  if (typeof action.value === "string") {
    const value = action.value.trim();
    if (!value || value.length > 160)
      throw new Error("Die Antwort braucht 1–160 Zeichen.");
    if (
      stage === "answer" &&
      state.gameId === "bad-answers-only" &&
      state.round.prompt.category === "finale-five-words" &&
      value.split(/\s+/u).length > 5
    )
      throw new Error("Im Finale sind höchstens fünf Wörter erlaubt.");
    action = { ...action, value };
  }
  const existing =
    state.round.stageSubmissions[state.round.stageIndex]?.[action.playerId];
  if (existing) {
    if (state.gameId !== "draw-this" || stage !== "answer")
      throw new Error("Deine Antwort ist bereits versiegelt.");
    if (isCorrectGuess(state, existing) || existing.timedOut) return state;
    if (existing.value === action.value && existing.at === action.at)
      return state;
    if ((existing.at ?? -1) > (action.at ?? -1)) return state;
  }

  if (
    action.quantity !== undefined &&
    (!Number.isInteger(action.quantity) ||
      action.quantity < 0 ||
      action.quantity > (state.round.prompt.teamChallenge?.maxResult ?? 200))
  )
    throw new Error("Ungültiges Teamergebnis.");

  const validOptions =
    stage === "vote" ? dynamicVoteOptions(state) : state.round.prompt.options;
  if (
    action.optionId &&
    validOptions?.length &&
    !validOptions.includes(action.optionId)
  ) {
    throw new Error("Invalid option");
  }

  if (stage === "vote") {
    const target = action.targetPlayerId ?? action.optionId ?? action.value;
    if (target && validOptions?.length && !validOptions.includes(target)) {
      throw new Error("Invalid vote target");
    }
    const noSelfVoteGames: readonly GangGameId[] = [
      "whos-that",
      "undercover",
      "one-of-you",
      "bad-answers-only",
      "bluff",
      "photo-hunt",
      "music-drop",
    ];
    if (target === action.playerId && noSelfVoteGames.includes(state.gameId)) {
      throw new Error("Self voting is not allowed");
    }
    if (
      target &&
      ["bluff", "bad-answers-only", "music-drop"].includes(state.gameId) &&
      answerChoiceOwners(state, target).includes(action.playerId)
    )
      throw new Error("Self voting is not allowed");
  }

  const stageSubmissions = { ...state.round.stageSubmissions };
  const submissions = { ...(stageSubmissions[state.round.stageIndex] ?? {}) };
  submissions[action.playerId] = { ...action };
  stageSubmissions[state.round.stageIndex] = submissions;
  return { ...state, round: { ...state.round, stageSubmissions } };
}

function currentSubmissions(
  state: GangRuntimeState,
): Record<string, GangRuntimeAction> {
  return state.round.stageSubmissions[state.round.stageIndex] ?? {};
}

export function canAdvanceGangStage(state: GangRuntimeState): boolean {
  if (state.finished) return false;
  const stage = stageOf(state);
  if (stage === "reveal" || stage === "score") return true;
  if (stage === "private" && !["hot-seat", "after-dark"].includes(state.gameId))
    return true;
  if (state.gameId === "secret-missions" && stage === "perform") return true;
  const required = eligibleForStage(state, stage);
  const submissions = currentSubmissions(state);
  if (state.gameId === "draw-this" && stage === "answer") {
    return (
      Object.values(submissions).some((a) => isCorrectGuess(state, a)) ||
      required.every((id) => submissions[id]?.timedOut)
    );
  }
  return required.every((playerId) => submissions[playerId] !== undefined);
}

function allStageSubmissions(
  state: GangRuntimeState,
  stage: GangStageKind,
): Record<string, GangRuntimeAction> {
  if (
    stage === "react" &&
    ["chain-reaction", "panic-button"].includes(state.gameId)
  ) {
    return Object.fromEntries(
      state.round.stages.flatMap((s, i) =>
        s === stage
          ? Object.values(state.round.stageSubmissions[i] ?? {}).map(
              (a) => [`${i}:${a.playerId}`, a] as const,
            )
          : [],
      ),
    );
  }
  const index = state.round.stages.lastIndexOf(stage);
  return index >= 0 ? (state.round.stageSubmissions[index] ?? {}) : {};
}

function mostVoted(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean))
    counts.set(value, (counts.get(value) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  return max === 0
    ? []
    : [...counts.entries()]
        .filter(([, count]) => count === max)
        .map(([value]) => value);
}

function resolveRound(state: GangRuntimeState): GangRoundResolution {
  const { gameId, round, players } = state;
  const delta: Record<string, number> = Object.fromEntries(
    players.map((player) => [player.id, 0]),
  );
  const playerName = (id: string) =>
    players.find((player) => player.id === id)?.name ?? id;
  const award = (id: string, points: number) => {
    delta[id] = (delta[id] ?? 0) + points;
  };

  if (gameId === "the-majority") {
    const predictions = allStageSubmissions(state, "predict");
    const votes = allStageSubmissions(state, "answer");
    const optionValue = (action: GangRuntimeAction) =>
      action.optionId ?? action.value ?? "";
    const majority = resolveMajorityRound({
      playerIds: players.map((player) => player.id),
      optionIds: round.prompt.options ?? [],
      votes: Object.fromEntries(
        Object.values(votes).map((action) => [
          action.playerId,
          optionValue(action),
        ]),
      ),
      predictions: Object.fromEntries(
        Object.values(predictions).map((action) => [
          action.playerId,
          optionValue(action),
        ]),
      ),
    });
    const winners = majority.majorityOptionIds;
    const correct = majority.correctPredictorIds;
    for (const id of correct) delta[id] = 1;
    return {
      headline:
        winners.length > 1
          ? "Der Raum ist gespalten."
          : "Das ist die Mehrheit.",
      detail: correct.length
        ? `${correct.length} Personen haben den Raum richtig gelesen.`
        : "Niemand hat diese Mehrheit kommen sehen.",
      winners: correct,
      scoreDelta: delta,
      revealItems: winners.map((value) => ({ label: "Mehrheit", value })),
    };
  }

  if (gameId === "whos-that") {
    const votes = allStageSubmissions(state, "vote");
    const targets = mostVoted(
      Object.values(votes).map(
        (action) => action.targetPlayerId ?? action.value ?? "",
      ),
    );
    for (const id of targets) award(id, 1);
    return {
      revealItems: targets.map((id) => ({
        label: playerName(id),
        value: round.prompt.prompt,
        playerId: id,
      })),
      headline:
        targets.length > 1
          ? "Unentschieden. Natürlich."
          : `${playerName(targets[0] ?? "")} — der Raum hat entschieden.`,
      detail:
        "Jede Nominierung wird Teil eurer Titelgalerie. Wer erkennt sich wieder?",
      winners: targets,
      scoreDelta: delta,
    };
  }

  if (gameId === "undercover") {
    const votes = allStageSubmissions(state, "vote");
    const accused = mostVoted(
      Object.values(votes).map(
        (action) => action.targetPlayerId ?? action.value ?? "",
      ),
    );
    const caught =
      accused.length === 1 &&
      accused.some((id) => round.undercoverPlayerIds.includes(id));
    if (caught) {
      for (const action of Object.values(votes)) {
        if (
          round.undercoverPlayerIds.includes(
            action.targetPlayerId ?? action.value ?? "",
          )
        )
          award(action.playerId, 1);
      }
    } else {
      for (const id of round.undercoverPlayerIds) award(id, 3);
    }
    return {
      headline: caught ? "UNDERCOVER enttarnt." : "UNDERCOVER kommt davon.",
      detail: `Undercover: ${round.undercoverPlayerIds.map(playerName).join(", ")}.`,
      winners: caught
        ? accused.filter((id) => round.undercoverPlayerIds.includes(id))
        : round.undercoverPlayerIds,
      scoreDelta: delta,
    };
  }

  if (gameId === "secret-missions") {
    const performed = allStageSubmissions(state, "perform");
    const winners = Object.values(performed)
      .filter((action) => action.success)
      .map((action) => action.playerId);
    for (const id of winners) award(id, 2);
    return {
      headline: "Die Missionen fliegen auf.",
      detail: `${winners.length} Missionen wurden als geschafft markiert.`,
      winners,
      scoreDelta: delta,
      revealItems: players.map((player) => ({
        label: player.name,
        value: round.privateByPlayer[player.id]?.mission ?? "",
        playerId: player.id,
      })),
    };
  }

  if (["bad-answers-only", "music-drop", "photo-hunt"].includes(gameId)) {
    const answers = allStageSubmissions(
      state,
      gameId === "photo-hunt" ? "perform" : "answer",
    );
    const votes = allStageSubmissions(state, "vote");
    const targets = mostVoted(
      Object.values(votes).map(
        (action) => action.targetPlayerId ?? action.value ?? "",
      ),
    ).flatMap((id) => answerChoiceOwners(state, id));
    for (const id of targets) award(id, 2);
    if (gameId === "bad-answers-only") {
      const values = Object.values(votes).map(
        (a) => a.targetPlayerId ?? a.value ?? "",
      );
      for (const a of Object.values(votes)) {
        const target = a.targetPlayerId ?? a.value ?? "";
        if (target && values.filter((v) => v === target).length === 1)
          award(a.playerId, 1);
      }
    }
    if (gameId === "photo-hunt")
      for (const a of Object.values(answers))
        if (a.noFaces && a.photoId) award(a.playerId, 1);
    if (gameId === "music-drop") {
      const normalized = Object.values(answers).map(
        (a) => [a.playerId, normalizeAnswer(a.value ?? "")] as const,
      );
      const matching = normalized
        .filter(
          ([, v]) =>
            v && normalized.filter(([, other]) => other === v).length > 1,
        )
        .map(([id]) => id);
      for (const id of matching) award(id, 1);
      if (players.length === 2)
        return {
          headline: matching.length
            ? "Ein Song. Zwei Köpfe."
            : "Zwei Perspektiven auf denselben Moment.",
          detail: matching.length
            ? "+1 Match-Punkt für euch beide."
            : "Zeigt euch eure Songs. Welcher passt besser — und warum?",
          winners: matching,
          scoreDelta: delta,
          revealItems: Object.values(answers).map((a) => ({
            label: playerName(a.playerId),
            value: a.value ?? "",
            playerId: a.playerId,
          })),
        };
    }
    return {
      headline:
        targets.length === 0
          ? "Diese Runde bleibt ohne Crowd-Pick."
          : targets.length > 1
            ? "Der Raum kann sich nicht entscheiden."
            : `${playerName(targets[0] ?? "")} nimmt die Runde.`,
      detail:
        gameId === "music-drop"
          ? "Der Crowd-Pick wandert in die Tracklist."
          : "Crowd-Vote abgeschlossen.",
      winners: targets,
      scoreDelta: delta,
      revealItems: Object.values(answers).map((action) => ({
        label: playerName(action.playerId),
        value: action.value ?? "",
        playerId: action.playerId,
      })),
    };
  }

  if (gameId === "bluff") {
    const lies = allStageSubmissions(state, "answer");
    const votes = allStageSubmissions(state, "vote");
    const truthKey = "__truth__";
    for (const action of Object.values(votes)) {
      const target = action.targetPlayerId ?? action.value ?? "";
      if (target === truthKey)
        award(action.playerId, round.number === state.targetRounds ? 4 : 2);
      else
        for (const owner of answerChoiceOwners(state, target)) award(owner, 1);
    }
    const leaders = Object.entries(delta)
      .sort((a, b) => b[1] - a[1])
      .filter(([, score], _, arr) => score > 0 && score === arr[0]?.[1])
      .map(([id]) => id);
    return {
      headline: "Wahrheit oder sehr gute Lüge?",
      ...(round.prompt.sourceUrl ? { sourceUrl: round.prompt.sourceUrl } : {}),
      detail: `Wahr: ${round.prompt.answer ?? ""}`,
      winners: leaders,
      scoreDelta: delta,
      revealItems: [
        { label: "WAHRHEIT", value: round.prompt.answer ?? "" },
        ...Object.values(lies).map((action) => ({
          label: playerName(action.playerId),
          value: action.value ?? "",
          playerId: action.playerId,
        })),
      ],
    };
  }

  if (gameId === "hot-seat") {
    const choice = Object.values(allStageSubmissions(state, "private"))[0];
    const answer = choice?.optionId ?? choice?.value ?? "";
    const predictions = allStageSubmissions(state, "predict");
    const correct = Object.values(predictions)
      .filter((action) => (action.optionId ?? action.value) === answer)
      .map((action) => action.playerId);
    for (const id of correct)
      award(id, round.number === state.targetRounds ? 2 : 1);
    if (
      round.activePlayerId &&
      correct.length < Math.ceil((players.length - 1) / 2)
    )
      award(round.activePlayerId, round.number === state.targetRounds ? 2 : 1);
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
    const answers = [
      round.prompt.answer ?? "",
      ...(round.prompt.aliases ?? []),
    ].map(normalizeAnswer);
    const correct = Object.values(guesses)
      .filter(
        (action) =>
          answers.includes(normalizeAnswer(action.value ?? "")) &&
          !action.timedOut,
      )
      .sort(
        (a, b) =>
          (a.at ?? Number.MAX_SAFE_INTEGER) -
            (b.at ?? Number.MAX_SAFE_INTEGER) ||
          (a.sequence ?? 0) - (b.sequence ?? 0),
      );
    const first = correct[0]?.playerId;
    const earned =
      state.interactionMode === "everyone-in" ? correct.slice(0, 1) : correct;
    for (const a of earned) award(a.playerId, 2);
    if (first && round.activePlayerId) award(round.activePlayerId, 1);
    return {
      headline: first
        ? state.interactionMode === "everyone-in"
          ? `${playerName(first)} hatte es zuerst.`
          : `${correct.length} richtige Antworten — gemeinsam geknackt.`
        : "Niemand hatte es.",
      detail: `Gesucht: ${round.prompt.answer ?? ""}.`,
      winners: earned.map((a) => a.playerId),
      scoreDelta: delta,
    };
  }

  if (gameId === "one-of-you") {
    const votes = allStageSubmissions(state, "vote");
    const accused = mostVoted(
      Object.values(votes).map(
        (action) => action.targetPlayerId ?? action.value ?? "",
      ),
    );
    const caught = round.oddPlayerId
      ? accused.length === 1 && accused.includes(round.oddPlayerId)
      : false;
    if (caught) {
      for (const action of Object.values(votes))
        if ((action.targetPlayerId ?? action.value) === round.oddPlayerId)
          award(action.playerId, 2);
    } else if (round.oddPlayerId) award(round.oddPlayerId, 3);
    return {
      headline: caught
        ? "ONE OF YOU wurde gefunden."
        : "ONE OF YOU bleibt unsichtbar.",
      detail: round.oddPlayerId
        ? `Odd Player: ${playerName(round.oddPlayerId)}.`
        : "",
      winners: caught
        ? [round.oddPlayerId!].filter(Boolean)
        : round.oddPlayerId
          ? [round.oddPlayerId]
          : [],
      scoreDelta: delta,
    };
  }

  if (gameId === "team-chaos") {
    const actions = allStageSubmissions(state, "react");
    const result = (team: "A" | "B") => {
      const members = players.filter((p) => p.teamId === team);
      const submitted = members
        .map((p) => actions[p.id])
        .filter((a): a is GangRuntimeAction => !!a);
      const quantity = submitted.find(
        (a) => a.quantity !== undefined,
      )?.quantity;
      return (
        quantity ??
        submitted.filter((a) => a.success).length / Math.max(1, members.length)
      );
    };
    const rateA = result("A"),
      rateB = result("B");
    const winningTeam = rateA === rateB ? null : rateA > rateB ? "A" : "B";
    const previous = state.resolutions ?? [];
    const lost =
      winningTeam &&
      previous.slice(-2).length === 2 &&
      previous
        .slice(-2)
        .every(
          (r) =>
            r.winners.length &&
            !r.winners.some(
              (id) => players.find((p) => p.id === id)?.teamId === winningTeam,
            ),
        );
    const comeback =
      !!lost &&
      !previous.some((r) => r.detail.includes(`Comeback-Chip ${winningTeam}`));
    const winners = winningTeam
      ? players
          .filter((player) => player.teamId === winningTeam)
          .map((player) => player.id)
      : [];
    for (const id of winners)
      award(
        id,
        (round.number === state.targetRounds ? 4 : 2) + (comeback ? 1 : 0),
      );
    return {
      headline: winningTeam
        ? `Team ${winningTeam} nimmt ${round.number === state.targetRounds ? "das Finale" : "die Runde"}.`
        : "Dead heat.",
      detail: `Team A ${rateA} · Team B ${rateB} ${round.prompt.teamChallenge?.metric ?? "Erfolgsquote"}${comeback ? ` · Comeback-Chip ${winningTeam}: +1` : ""}`,
      winners,
      scoreDelta: delta,
    };
  }

  if (gameId === "chain-reaction" || gameId === "panic-button") {
    const seenByLane = new Map<number, Set<string>>();
    const streakByLane = new Map<number, number>();
    const strikes: Record<string, number> = {};
    let bestStreak = 0;
    const items: NonNullable<GangRoundResolution["revealItems"]> = [];
    for (let index = 0; index < round.stages.length; index++) {
      if (round.stages[index] !== "react") continue;
      for (const action of Object.values(round.stageSubmissions[index] ?? {})) {
        const id = action.playerId;
        const lane = Math.max(
          0,
          (round.turnLanes ?? []).findIndex((l) => l.includes(id)),
        );
        const seen = seenByLane.get(lane) ?? new Set<string>();
        seenByLane.set(lane, seen);
        const value = normalizeAnswer(action.value ?? "");
        const valid =
          value &&
          !seen.has(value) &&
          !action.timedOut &&
          action.success !== false;
        if (valid) {
          seen.add(value);
          award(id, 1);
          const streak = (streakByLane.get(lane) ?? 0) + 1;
          streakByLane.set(lane, streak);
          bestStreak = Math.max(bestStreak, streak);
        } else {
          streakByLane.set(lane, 0);
          if (action.timedOut || value) strikes[id] = (strikes[id] ?? 0) + 1;
        }
        items.push({
          label: playerName(id),
          value: action.timedOut
            ? "Zeit abgelaufen"
            : (action.value ?? "Übersprungen"),
          playerId: id,
        });
      }
    }
    return {
      headline:
        gameId === "panic-button"
          ? "Panikrunde überlebt."
          : `Längste Kette: ${bestStreak}.`,
      detail:
        gameId === "panic-button"
          ? players
              .map((p) => `${p.name}: ${strikes[p.id] ?? 0}/3 Strikes`)
              .join(" · ") + ". In der nächsten Runde sind alle wieder dabei."
          : "Wiederholungen und Zeitüberschreitungen brechen den gemeinsamen Streak. Die Verbindung zwischen Wörtern beurteilt ihr im Raum.",
      winners: Object.keys(delta).filter((id) => delta[id]! > 0),
      scoreDelta: delta,
      revealItems: items,
    };
  }

  if (gameId === "after-dark" && round.prompt.category === "finale-choice") {
    const votes = allStageSubmissions(state, "vote");
    const choices = Object.values(votes).map((action) =>
      (action.optionId ?? action.value ?? "").toLowerCase(),
    );
    const choice =
      choices.some((c) => !["soft", "bold"].includes(c)) ||
      choices.length <
        players.filter((p) => !(state.declinedIds ?? []).includes(p.id)).length
        ? "Stop"
        : choices.every((c) => c === "bold")
          ? "Bold"
          : "Soft";
    return {
      headline: `Euer Ende: ${choice}.`,
      detail:
        choice === "Stop"
          ? "Ein Stop genügt. Kein Name, keine Begründung, keine weitere Aufgabe."
          : "Bold nur, wenn alle ausdrücklich zustimmen. Sonst bleibt es Soft.",
      winners: [],
      scoreDelta: delta,
      revealItems: [{ label: "Euer Ende", value: choice }],
    };
  }

  if (gameId === "after-dark") {
    const values = Object.values(
      allStageSubmissions(
        state,
        round.prompt.options?.length ? "vote" : "answer",
      ),
    )
      .filter((a) => !a.timedOut)
      .map((a) => a.optionId ?? a.value)
      .filter((v): v is string => !!v && v !== "Skip");
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    const performed = Object.values(
      allStageSubmissions(state, "perform"),
    ).filter((a) => a.success).length;
    return {
      headline:
        round.prompt.afterDarkMode === "action"
          ? "Ein kleiner Moment für euch."
          : "So fühlt der Raum.",
      detail:
        round.prompt.afterDarkMode === "action"
          ? `${performed} freiwillige Beiträge. Keine Wertung, kein Nachfragen bei einem Skip.`
          : "Antworten ohne Namen. Erzählen darf, wer möchte.",
      winners: [],
      scoreDelta: delta,
      revealItems: round.prompt.options?.length
        ? [...counts].map(([value, n]) => ({ label: `${n} Stimmen`, value }))
        : values.map((value) => ({ label: "Aus dem Raum", value })),
    };
  }
  if (gameId === "the-line") {
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

function applyScoreDelta(
  scores: Record<string, number>,
  delta: Record<string, number>,
): Record<string, number> {
  const next = { ...scores };
  for (const [id, value] of Object.entries(delta))
    next[id] = (next[id] ?? 0) + value;
  return next;
}

export function advanceGangStage(
  state: GangRuntimeState,
  options: { force?: boolean } = {},
): GangRuntimeState {
  if (state.finished) return state;
  if (!options.force && !canAdvanceGangStage(state))
    throw new Error("Stage is not complete");

  const currentStage = stageOf(state);
  if (state.gameId === "after-dark" && currentStage === "private") {
    const answers = currentSubmissions(state);
    const declinedIds = state.players
      .filter((p) => answers[p.id]?.success !== true)
      .map((p) => p.id);
    state = { ...state, declinedIds };
    if (state.players.length - declinedIds.length < 2)
      return { ...state, finished: true, winnerIds: [] };
  }
  let round = state.round;
  let scores = state.scores;
  if (
    state.gameId === "after-dark" &&
    currentStage === "vote" &&
    round.prompt.category === "finale-choice"
  ) {
    const choices = Object.values(currentSubmissions(state)).map(
      (a) => a.optionId ?? a.value,
    );
    if (
      choices.some((c) => !["Soft", "Bold"].includes(c ?? "")) ||
      choices.length < eligibleForStage(state).length
    )
      round = { ...round, stages: round.stages.filter((s) => s !== "perform") };
  }

  if (
    currentStage === "vote" &&
    ["undercover", "one-of-you"].includes(state.gameId) &&
    !round.runoffCandidates
  ) {
    const accused = mostVoted(
      Object.values(currentSubmissions(state)).map(
        (a) => a.targetPlayerId ?? a.optionId ?? a.value ?? "",
      ),
    );
    if (accused.length > 1 && accused.length < state.players.length) {
      const stages = [...round.stages];
      stages.splice(round.stageIndex + 1, 0, "vote");
      return {
        ...state,
        round: {
          ...round,
          stages,
          stageIndex: round.stageIndex + 1,
          runoffCandidates: accused,
          prompt: {
            ...round.prompt,
            subline:
              "STICHWAHL · Wählt zwischen den Gleichplatzierten. Bleibt es gleich, ist niemand enttarnt.",
          },
        },
      };
    }
  }
  if (currentStage === "reveal" && !round.resolution) {
    const resolution = resolveRound(state);
    round = { ...round, resolution };
    scores = applyScoreDelta(scores, resolution.scoreDelta);
  }

  if (currentStage === "score") {
    if (state.roundNumber >= state.targetRounds) {
      const max = Math.max(...Object.values(scores));
      const winnerIds =
        max > 0
          ? Object.entries(scores)
              .filter(([, score]) => score === max)
              .map(([id]) => id)
          : [];
      return { ...state, scores, finished: true, winnerIds, round };
    }
    const nextNumber = state.roundNumber + 1;
    const promptHistory = state.promptHistory ?? [state.round.prompt.id];
    const created = createRound(
      state.gameId,
      state.players,
      nextNumber,
      state.seed,
      state.targetRounds,
      promptHistory,
      state.interactionMode,
    );
    return {
      ...state,
      seed: created.seed,
      scores,
      roundNumber: nextNumber,
      promptHistory: [...promptHistory, created.round.prompt.id],
      resolutions: [
        ...(state.resolutions ?? []),
        ...(round.resolution ? [round.resolution] : []),
      ],
      round: created.round,
    };
  }

  return {
    ...state,
    scores,
    round: {
      ...round,
      stageIndex: Math.min(round.stageIndex + 1, round.stages.length - 1),
    },
  };
}

export function privateGangView(
  state: GangRuntimeState,
  playerId: string,
): GangPrivatePayload | null {
  if (!state.players.some((player) => player.id === playerId)) return null;
  if (state.gameId === "draw-this" && stageOf(state) === "answer") {
    const base = state.round.privateByPlayer[playerId] ?? {};
    if (base.active)
      return {
        ...base,
        prompt:
          "Zeichne jetzt auf Papier. Alle anderen raten gleichzeitig am Handy. Keine Buchstaben, Zahlen oder gesprochenen Hinweise.",
      };
    const last = currentSubmissions(state)[playerId];
    return {
      ...base,
      prompt: last
        ? isCorrectGuess(state, last)
          ? "Richtig!"
          : last.timedOut
            ? "Zeit vorbei."
            : `Noch nicht: ${last.value ?? ""}. Versuch es erneut.`
        : "Rate jetzt. Du hast bis zu 24 Versuche innerhalb des Timers.",
    };
  }
  if (["chain-reaction", "panic-button"].includes(state.gameId)) {
    const lanes = state.round.turnLanes ?? [state.players.map((p) => p.id)];
    const lane = lanes.findIndex((l) => l.includes(playerId));
    const previous = Object.values(allStageSubmissions(state, "react"))
      .filter(
        (a) => lanes[lane]?.includes(a.playerId) && !a.timedOut && a.value,
      )
      .at(-1)?.value;
    return {
      prompt: `${lanes.length > 1 ? `Spur ${lane + 1} von ${lanes.length}. ` : ""}${state.gameId === "chain-reaction" && previous ? `Verbinde dein Wort mit: ${previous}` : state.round.prompt.prompt}`,
    };
  }
  if (state.gameId === "after-dark" && stageOf(state) === "perform") {
    if (state.round.prompt.category === "finale-choice") {
      const bold = Object.values(allStageSubmissions(state, "vote")).every(
        (a) => (a.optionId ?? a.value) === "Bold",
      );
      return {
        prompt: bold
          ? "BOLD: Erfinde in einem Satz euer ungewöhnlichstes fiktives Date. Teile es, wenn du möchtest. Keine echte Verabredung, keine Pflicht."
          : "SOFT: Wenn du möchtest, sag einen Satz darüber, was diesen Abend schön gemacht hat. Danach gehört die Nacht wieder euch.",
      };
    }
    const action = allStageSubmissions(state, "vote")[playerId];
    const picked = action?.optionId ?? action?.value;
    const tasks: Record<string, string> = {
      Kompliment:
        "Sag einer Person etwas Freundliches über ihre Art. Auslassen ist genauso okay.",
      Challenge:
        "Erfinde einen charmanten Werbeslogan für dich selbst. Maximal ein Satz.",
      Blickkontakt:
        "Frage eine Person, ob sie zehn Sekunden Blickkontakt möchte. Nur bei zwei ausdrücklichen Ja — sonst einfach weiter.",
      "Ehrliche Frage":
        "Frag eine Person, was ihr heute gute Laune gemacht hat. Jede Antwort ist freiwillig.",
      Skip: "Du setzt diese Aufgabe aus. Ohne Erklärung und ohne Punktverlust.",
    };
    return {
      prompt: picked
        ? (tasks[picked] ??
          `Deine Wahl: ${picked}. Du musst daraus keine Aufgabe machen.`)
        : state.round.prompt.prompt,
    };
  }
  return state.round.privateByPlayer[playerId] ?? null;
}

function dynamicVoteOptions(state: GangRuntimeState): string[] | undefined {
  const stage = stageOf(state);
  if (stage !== "vote") return state.round.prompt.options?.slice();
  if (state.round.runoffCandidates) return state.round.runoffCandidates.slice();

  if (["bad-answers-only", "music-drop", "photo-hunt"].includes(state.gameId)) {
    const sourceStage = state.gameId === "photo-hunt" ? "perform" : "answer";
    const submissions = allStageSubmissions(state, sourceStage);
    const valid = Object.values(submissions).filter(
      (action) => !action.timedOut && !!action.value?.trim(),
    );
    return valid
      .filter(
        (a, i) =>
          state.gameId === "photo-hunt" ||
          valid.findIndex(
            (b) => normalizeAnswer(a.value!) === normalizeAnswer(b.value!),
          ) === i,
      )
      .map((a) => a.playerId);
  }
  if (state.gameId === "bluff") {
    const lies = allStageSubmissions(state, "answer");
    const valid = Object.values(lies).filter(
      (a) =>
        !a.timedOut &&
        a.value?.trim() &&
        normalizeAnswer(a.value) !==
          normalizeAnswer(state.round.prompt.answer ?? ""),
    );
    return [
      "__truth__",
      ...valid
        .filter(
          (a, i) =>
            valid.findIndex(
              (b) => normalizeAnswer(a.value!) === normalizeAnswer(b.value!),
            ) === i,
        )
        .map((a) => a.playerId),
    ];
  }
  if (["whos-that", "undercover", "one-of-you"].includes(state.gameId)) {
    return state.players.map((player) => player.id);
  }
  return state.round.prompt.options?.slice();
}

/** Identical text shares one anonymous ballot entry and its credit; photos stay separate. */
export function answerChoiceOwners(
  state: GangRuntimeState,
  option: string,
): string[] {
  if (option === "__truth__") return [];
  const answers = allStageSubmissions(
    state,
    state.gameId === "photo-hunt" ? "perform" : "answer",
  );
  if (state.gameId === "photo-hunt") return answers[option] ? [option] : [];
  const value = answers[option]?.value;
  return value
    ? Object.values(answers)
        .filter(
          (a) =>
            !a.timedOut &&
            a.value &&
            normalizeAnswer(a.value) === normalizeAnswer(value),
        )
        .map((a) => a.playerId)
    : [];
}

export function publicGangView(state: GangRuntimeState): GangPublicRoundView {
  const stage = stageOf(state);
  const promptHidden =
    (state.gameId === "the-majority" &&
      state.round.prompt.category === "finale-blind" &&
      stage === "predict") ||
    (state.gameId === "one-of-you" &&
      stage !== "reveal" &&
      stage !== "score") ||
    (state.gameId === "undercover" &&
      stage !== "reveal" &&
      stage !== "score") ||
    (state.gameId === "secret-missions" &&
      stage !== "reveal" &&
      stage !== "score") ||
    (state.gameId === "draw-this" && stage !== "reveal" && stage !== "score");

  const submissions = currentSubmissions(state);
  const options = dynamicVoteOptions(state);
  const previousWord =
    state.gameId === "chain-reaction"
      ? Object.values(allStageSubmissions(state, "react"))
          .filter((a) => !a.timedOut && a.value)
          .at(-1)?.value
      : undefined;
  return {
    id: state.round.id,
    number: state.round.number,
    prompt: promptHidden
      ? state.gameId === "secret-missions"
        ? "SECRET MISSIONS laufen im Hintergrund"
        : "PRIVATE ROUND"
      : previousWord
        ? `Verbinde dein Wort mit: ${previousWord}`
        : state.round.prompt.prompt,
    ...(state.round.prompt.teamChallenge
      ? { subline: state.round.prompt.teamChallenge.instruction }
      : state.round.prompt.subline
        ? { subline: state.round.prompt.subline }
        : {}),
    ...(options ? { options } : {}),
    ...(state.round.prompt.seconds !== undefined
      ? { seconds: state.round.prompt.seconds }
      : {}),
    ...(state.round.prompt.category
      ? { category: state.round.prompt.category }
      : {}),
    stage,
    stageIndex: state.round.stageIndex,
    totalStages: state.round.stages.length,
    submittedPlayerIds: Object.keys(submissions),
    requiredPlayerIds: eligibleForStage(state, stage),
    activePlayerId: state.round.activePlayerId,
    resolution: state.round.resolution,
  };
}

/** Unicode/punctuation insensitive; aliases stay authored to avoid accepting unrelated guesses. */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("de")
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function isCorrectGuess(
  state: GangRuntimeState,
  action: GangRuntimeAction,
): boolean {
  return (
    !action.timedOut &&
    !!action.value?.trim() &&
    [state.round.prompt.answer ?? "", ...(state.round.prompt.aliases ?? [])]
      .map(normalizeAnswer)
      .includes(normalizeAnswer(action.value))
  );
}
