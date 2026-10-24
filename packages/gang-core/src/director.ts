import { eligibleGangGames } from "./catalog.js";
import {
  estimatedGameMinutes,
  preferredInteractionMode,
  targetGameCount,
} from "./session.js";
import type {
  DirectorContext,
  DirectorPick,
  GangGameDefinition,
  GangPlan,
} from "./types.js";

function scoreCandidate(game: GangGameDefinition, context: DirectorContext): number {
  const last = context.history.at(-1);
  const recent = context.history.slice(-4);
  const recentIds = new Set(recent.map((item) => item.gameId));
  const recentMechanics = new Set(recent.map((item) => item.primaryMechanic));

  let score = 100;

  score -= Math.abs(game.energy - context.preferences.energyTarget) * 8;

  if (recentIds.has(game.id)) score -= 45;
  if (last && game.mechanics.includes(last.primaryMechanic)) score -= 32;

  const unseenMechanics = game.mechanics.filter((mechanic) => !recentMechanics.has(mechanic));
  score += unseenMechanics.length * 8;

  if (game.tags.includes("signature")) score += 5;
  if (context.preferences.playerCount >= 31 && game.tags.includes("crowd")) score += 12;
  if (context.preferences.playerCount >= 13 && game.mechanics.includes("team")) score += 6;

  return score;
}

export function pickNextGangGame(context: DirectorContext): DirectorPick | null {
  const candidates = eligibleGangGames(context.preferences, {
    directorOnly: true,
    includePlanned: false,
  });
  if (!candidates.length) return null;

  const ranked = candidates
    .map((game) => ({ game, score: scoreCandidate(game, context) }))
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

export function buildDirectorPlan(context: DirectorContext): GangPlan {
  const count = targetGameCount(context.preferences.durationMinutes);
  const history = [...context.history];
  const gameIds: string[] = [];
  let estimatedMinutes = 0;

  for (let i = 0; i < count; i += 1) {
    const pick = pickNextGangGame({ ...context, history });
    if (!pick) break;

    gameIds.push(pick.game.id);
    estimatedMinutes += estimatedGameMinutes(pick.game);
    history.push({
      gameId: pick.game.id,
      primaryMechanic: pick.game.mechanics[0]!,
      energy: pick.game.energy,
    });

    const available = eligibleGangGames(context.preferences, {
      directorOnly: true,
      includePlanned: false,
    });
    if (new Set(gameIds).size >= available.length) break;
  }

  return {
    entryMode: "director",
    gameIds,
    estimatedMinutes,
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
