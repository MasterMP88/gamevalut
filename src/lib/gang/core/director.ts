// Generated from packages/gang-core/src/director.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import { getGangPlaybook } from "./playbooks.js";
import { eligibleGangGames } from "./catalog.js";
import { estimatedGameMinutes, preferredInteractionMode } from "./session.js";
import type {
  DirectorContext,
  DirectorPick,
  GangGameDefinition,
  GangPlan,
} from "./types.js";

function scoreCandidate(
  game: GangGameDefinition,
  context: DirectorContext,
): number {
  const last = context.history.at(-1);
  const recent = context.history.slice(-4);
  const recentIds = new Set(recent.map((item) => item.gameId));
  const recentMechanics = new Set(recent.map((item) => item.primaryMechanic));

  let score = 100;

  score -= Math.abs(game.energy - context.preferences.energyTarget) * 8;

  if (recentIds.has(game.id)) score -= 45;
  if (context.history.some((h) => h.gameId === game.id)) score -= 18;
  const moodTags: Record<string, string[]> = {
    chill: ["social-vote", "prediction"],
    funny: ["story", "bluff"],
    wild: ["physical", "photo"],
    spicy: ["after-dark"],
    chaos: ["reaction", "team"],
  };
  for (const mood of context.preferences.moods)
    if (game.mechanics.some((m) => moodTags[mood]?.includes(m))) score += 10;
  if (last && game.mechanics.includes(last.primaryMechanic)) score -= 32;

  const unseenMechanics = game.mechanics.filter(
    (mechanic) => !recentMechanics.has(mechanic),
  );
  score += unseenMechanics.length * 8;

  if (game.tags.includes("signature")) score += 5;
  if (context.preferences.playerCount >= 31 && game.tags.includes("crowd"))
    score += 12;
  if (context.preferences.playerCount >= 13 && game.mechanics.includes("team"))
    score += 6;

  return score;
}

export function pickNextGangGame(
  context: DirectorContext,
): DirectorPick | null {
  const candidates = eligibleGangGames(context.preferences, {
    directorOnly: true,
    includePlanned: false,
  });
  if (!candidates.length) return null;

  const ranked = candidates
    .map((game) => ({
      game,
      score:
        scoreCandidate(game, context) + jitter(game.id, context.seed ?? 1) * 14,
    }))
    .sort((a, b) => b.score - a.score || a.game.id.localeCompare(b.game.id));

  const game = ranked[0]!.game;
  const interactionMode = preferredInteractionMode(
    game,
    context.preferences,
    context.deviceContext,
  );

  const last = context.history.at(-1);
  const reason = last
    ? `Keeps the pace at energy ${game.energy} and changes the mechanic after ${last.primaryMechanic}.`
    : `Fits ${context.preferences.playerCount} players and starts at energy ${game.energy}.`;

  return { game, interactionMode, reason };
}

/** Conservative pacing model, including reveal time and onboarding. Physical play can run longer. */
export function roundSeconds(
  gameId: string,
  playerCount: number,
  devices = playerCount,
): number {
  const base: Record<string, number> = {
    "the-majority": 65,
    "whos-that": 50,
    undercover: 145,
    "secret-missions": 600,
    "bad-answers-only": 95,
    bluff: 100,
    "the-line": 75,
    "hot-seat": 60,
    "team-chaos": 110,
    "photo-hunt": 100,
    "draw-this": 85,
    "music-drop": 110,
    "chain-reaction":
      30 + (devices >= playerCount && playerCount > 8 ? 6 : playerCount) * 8,
    "one-of-you": 110,
    "panic-button":
      25 +
      (devices >= playerCount && playerCount > 8 ? 6 : playerCount) * 3 * 7,
    "after-dark": 80,
  };
  const pass = devices < playerCount ? Math.max(0, playerCount - 2) * 7 : 0;
  return (base[gameId] ?? 90) + pass;
}
function jitter(id: string, seed: number): number {
  let h = seed | 0;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  return (h >>> 0) / 4294967296;
}
export function buildDirectorPlan(context: DirectorContext): GangPlan {
  const budget = context.preferences.durationMinutes;
  const seconds = (budget ?? 60) * 60;
  const available = eligibleGangGames(context.preferences, {
    directorOnly: true,
    includePlanned: false,
  }).filter((g) => g.id !== "secret-missions"); // background side quest, never a blocking slot
  const history = [...context.history];
  const gameIds: string[] = [];
  const roundsByGame: Record<string, number> = {};
  let spent = 0;
  const maxTitles = budget === 15 ? 2 : budget === 30 ? 3 : 5;
  while (gameIds.length < maxTitles) {
    const remaining = available.filter((g) => !gameIds.includes(g.id));
    const energy =
      gameIds.length === 0
        ? Math.min(3, context.preferences.energyTarget)
        : context.preferences.energyTarget;
    const ranked = remaining
      .map((game) => ({
        game,
        score:
          scoreCandidate(game, {
            ...context,
            history,
            preferences: {
              ...context.preferences,
              energyTarget: energy as 1 | 2 | 3 | 4 | 5,
            },
          }) +
          jitter(game.id, context.seed ?? 1) * 14,
      }))
      .sort((a, b) => b.score - a.score || a.game.id.localeCompare(b.game.id));
    const candidate = ranked.find(
      ({ game }) =>
        spent +
          45 +
          2 *
            roundSeconds(
              game.id,
              context.preferences.playerCount,
              context.deviceContext.connectedDevices,
            ) <=
        seconds,
    );
    if (!candidate) break;
    const game = candidate.game;
    gameIds.push(game.id);
    roundsByGame[game.id] = 2;
    spent +=
      45 +
      2 *
        roundSeconds(
          game.id,
          context.preferences.playerCount,
          context.deviceContext.connectedDevices,
        );
    history.push({
      gameId: game.id,
      primaryMechanic: game.mechanics[0]!,
      energy: game.energy,
    });
  }
  // Fill the remaining budget evenly, without adding repetitive titles.
  let added = true;
  while (added) {
    added = false;
    for (const id of gameIds) {
      const cost = roundSeconds(
        id,
        context.preferences.playerCount,
        context.deviceContext.connectedDevices,
      );
      const max = getGangPlaybook(id)?.rounds[1] ?? 12;
      if (roundsByGame[id]! < max && spent + cost <= seconds) {
        roundsByGame[id]!++;
        spent += cost;
        added = true;
      }
    }
  }
  return {
    entryMode: "director",
    gameIds,
    roundsByGame,
    estimatedMinutes: Math.ceil(spent / 60),
    budgetMinutes: budget,
  };
}

export function buildMixPlan(games: readonly GangGameDefinition[]): GangPlan {
  return {
    entryMode: "mix",
    gameIds: games.map((game) => game.id),
    estimatedMinutes: games.reduce(
      (sum, game) => sum + estimatedGameMinutes(game),
      0,
    ),
  };
}

/** Keep a hand-picked queue intact; report when even one round per title exceeds the budget. */
export function paceQueue(
  ids: readonly string[],
  players: number,
  minutes: 15 | 30 | 60 | null,
  devices = players,
) {
  const unique = [...new Set(ids)];
  const rounds: Record<string, number> = {};
  let spent = 0;
  for (const id of unique) {
    const pb = getGangPlaybook(id);
    if (!pb) continue;
    rounds[id] =
      id === "secret-missions"
        ? 1
        : minutes === null
          ? id === "hot-seat"
            ? Math.min(players, 20)
            : pb.rounds[0]
          : 1;
    spent +=
      id === "secret-missions"
        ? 60
        : 45 + rounds[id]! * roundSeconds(id, players, devices);
  }
  const budget = minutes === null ? Infinity : minutes * 60;
  if (minutes !== null) {
    let added = true;
    while (added) {
      added = false;
      for (const id of unique) {
        const pb = getGangPlaybook(id);
        if (!pb || id === "secret-missions") continue;
        const max = id === "hot-seat" ? Math.min(players, 20) : pb.rounds[1];
        const cost = roundSeconds(id, players, devices);
        if (rounds[id]! < max && spent + cost <= budget) {
          rounds[id]!++;
          spent += cost;
          added = true;
        }
      }
    }
  }
  return {
    rounds,
    estimatedMinutes: Math.ceil(spent / 60),
    fits: spent <= budget,
  };
}
