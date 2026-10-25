// Generated from packages/gang-core/src/catalog.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import type {
  GameCapability,
  GangGameDefinition,
  GangPreferences,
  MixValidation,
  ScaleBand,
} from "./types.js";

export const GANG_GAMES: readonly GangGameDefinition[] = [
  {
    id: "the-majority",
    slug: "the-majority",
    title: "THE MAJORITY",
    hook: "Guess the room. Then live with the result.",
    minPlayers: 3,
    maxPlayers: 99,
    durationMinutes: [5, 20],
    energy: 3,
    mechanics: ["majority", "social-vote", "prediction"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "mixed"],
    capabilities: [],
    tags: ["social", "fast", "crowd"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "whos-that",
    slug: "whos-that",
    title: "WHO'S THAT?",
    hook: "Everybody points. Somebody has to own it.",
    minPlayers: 3,
    maxPlayers: 99,
    durationMinutes: [5, 20],
    energy: 3,
    mechanics: ["social-vote", "hot-seat"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "mixed"],
    capabilities: [],
    tags: ["social", "reveal", "crowd"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "undercover",
    slug: "undercover",
    title: "UNDERCOVER",
    hook: "Everyone knows the thing. Almost everyone.",
    minPlayers: 4,
    maxPlayers: 30,
    durationMinutes: [8, 25],
    energy: 3,
    mechanics: ["secret-role", "bluff"],
    interactionModes: ["one-phone", "everyone-in", "team-device", "mixed"],
    capabilities: [],
    tags: ["secret", "bluff", "deduction"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "secret-missions",
    slug: "secret-missions",
    title: "SECRET MISSIONS",
    hook: "The game has already started. They just don't know it yet.",
    minPlayers: 3,
    maxPlayers: 30,
    durationMinutes: [20, 60],
    energy: 4,
    mechanics: ["secret-mission", "physical"],
    interactionModes: ["one-phone", "everyone-in", "mixed"],
    capabilities: [],
    tags: ["signature", "background", "chaos"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "bad-answers-only",
    slug: "bad-answers-only",
    title: "BAD ANSWERS ONLY",
    hook: "Correct is boring. Make the room lose it.",
    minPlayers: 3,
    maxPlayers: 30,
    durationMinutes: [5, 20],
    energy: 4,
    mechanics: ["story", "social-vote"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "mixed"],
    capabilities: [],
    tags: ["comedy", "creative"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "bluff",
    slug: "bluff",
    title: "BLUFF",
    hook: "Sell the lie before the room catches you.",
    minPlayers: 3,
    maxPlayers: 20,
    durationMinutes: [8, 25],
    energy: 3,
    mechanics: ["bluff", "prediction"],
    interactionModes: ["everyone-in", "one-phone", "mixed"],
    capabilities: [],
    tags: ["deception", "social"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "the-line",
    slug: "the-line",
    title: "THE LINE",
    hook: "Put yourselves in order. No hiding behind a screen.",
    minPlayers: 4,
    maxPlayers: 99,
    durationMinutes: [5, 15],
    energy: 4,
    mechanics: ["physical", "prediction"],
    interactionModes: ["one-phone", "big-screen", "mixed"],
    capabilities: [],
    tags: ["physical", "crowd"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "hot-seat",
    slug: "hot-seat",
    title: "HOT SEAT",
    hook: "One player. One minute. The whole room involved.",
    minPlayers: 3,
    maxPlayers: 20,
    durationMinutes: [5, 20],
    energy: 3,
    mechanics: ["hot-seat", "prediction"],
    interactionModes: ["one-phone", "everyone-in", "mixed"],
    capabilities: [],
    tags: ["social", "spotlight"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "team-chaos",
    slug: "team-chaos",
    title: "TEAM CHAOS",
    hook: "Your side of the room versus theirs.",
    minPlayers: 6,
    maxPlayers: 99,
    durationMinutes: [10, 30],
    energy: 5,
    mechanics: ["team", "reaction", "prediction"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "team-device", "mixed"],
    capabilities: [],
    tags: ["teams", "crowd", "high-energy"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "photo-hunt",
    slug: "photo-hunt",
    title: "PHOTO HUNT",
    hook: "Thirty seconds. One impossible photo.",
    minPlayers: 3,
    maxPlayers: 30,
    durationMinutes: [5, 20],
    energy: 5,
    mechanics: ["photo", "physical", "team"],
    interactionModes: ["one-phone", "everyone-in", "team-device", "mixed"],
    capabilities: ["camera"],
    tags: ["camera", "physical"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "draw-this",
    slug: "draw-this",
    title: "DRAW THIS",
    hook: "Draw fast. Guess faster. Regret the masterpiece later.",
    minPlayers: 3,
    maxPlayers: 30,
    durationMinutes: [8, 25],
    energy: 4,
    mechanics: ["drawing", "team"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "team-device"],
    capabilities: [],
    tags: ["creative", "teams"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "music-drop",
    slug: "music-drop",
    title: "MUSIC DROP",
    hook: "Know the song before the room does.",
    minPlayers: 2,
    maxPlayers: 99,
    durationMinutes: [8, 30],
    energy: 5,
    mechanics: ["music", "reaction", "team"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "mixed"],
    capabilities: ["music"],
    tags: ["music", "crowd"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "time-drop",
    slug: "time-drop",
    title: "TIME//DROP",
    hook: "Hear the track. Drop it into time. Lock it tighter if you dare.",
    minPlayers: 2,
    maxPlayers: 99,
    durationMinutes: [10, 35],
    energy: 4,
    mechanics: ["music", "prediction", "reaction", "team"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "team-device", "mixed"],
    capabilities: ["music"],
    tags: ["music", "timeline", "crowd", "precision"],
    directorEligible: true,
    mixEligible: true,
    status: "prototype",
  },
  {
    id: "chain-reaction",
    slug: "chain-reaction",
    title: "CHAIN REACTION",
    hook: "One idea enters. The room destroys it beautifully.",
    minPlayers: 3,
    maxPlayers: 30,
    durationMinutes: [5, 20],
    energy: 3,
    mechanics: ["story", "reaction"],
    interactionModes: ["one-phone", "everyone-in", "mixed"],
    capabilities: [],
    tags: ["story", "creative"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "one-of-you",
    slug: "one-of-you",
    title: "ONE OF YOU",
    hook: "Someone got different information. Find them.",
    minPlayers: 4,
    maxPlayers: 30,
    durationMinutes: [8, 25],
    energy: 4,
    mechanics: ["secret-role", "prediction"],
    interactionModes: ["one-phone", "everyone-in", "team-device", "mixed"],
    capabilities: [],
    tags: ["secret", "deduction"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "panic-button",
    slug: "panic-button",
    title: "PANIC BUTTON",
    hook: "Five seconds. Pick one. No committee meeting.",
    minPlayers: 2,
    maxPlayers: 99,
    durationMinutes: [5, 15],
    energy: 5,
    mechanics: ["reaction", "social-vote"],
    interactionModes: ["one-phone", "everyone-in", "big-screen", "mixed"],
    capabilities: [],
    tags: ["fast", "crowd", "high-energy"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
  {
    id: "after-dark",
    slug: "after-dark",
    title: "AFTER DARK",
    hook: "The room decides how far the night goes.",
    minPlayers: 2,
    maxPlayers: 20,
    durationMinutes: [10, 30],
    energy: 4,
    mechanics: ["after-dark", "social-vote", "hot-seat"],
    interactionModes: ["one-phone", "everyone-in", "mixed"],
    capabilities: ["spicy"],
    tags: ["adult", "optional"],
    directorEligible: true,
    mixEligible: true,
    status: "ready",
  },
] as const;

export function getGangGame(idOrSlug: string): GangGameDefinition | undefined {
  return GANG_GAMES.find((game) => game.id === idOrSlug || game.slug === idOrSlug);
}

export function scaleBandFor(playerCount: number): ScaleBand {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 99) {
    throw new RangeError("GANG MODE supports 2–99 players");
  }
  if (playerCount <= 4) return "duo-small";
  if (playerCount <= 12) return "core-party";
  if (playerCount <= 30) return "large-party";
  return "crowd";
}

function capabilitiesAllowed(required: readonly GameCapability[], enabled: readonly GameCapability[]): boolean {
  const allowed = new Set(enabled);
  return required.every((capability) => allowed.has(capability));
}

export function isCompatibleGame(game: GangGameDefinition, preferences: GangPreferences): boolean {
  return (
    preferences.playerCount >= game.minPlayers &&
    preferences.playerCount <= game.maxPlayers &&
    capabilitiesAllowed(game.capabilities, preferences.enabledCapabilities)
  );
}

export function eligibleGangGames(
  preferences: GangPreferences,
  options: { includePlanned?: boolean; directorOnly?: boolean } = {},
): GangGameDefinition[] {
  return GANG_GAMES.filter((game) => {
    if (!options.includePlanned && game.status !== "ready") return false;
    if (options.directorOnly && !game.directorEligible) return false;
    return isCompatibleGame(game, preferences);
  });
}

export function validateMix(gameIds: readonly string[], preferences: GangPreferences): MixValidation {
  const games: GangGameDefinition[] = [];
  const rejected: MixValidation["rejected"] = [];
  const seen = new Set<string>();

  for (const id of gameIds) {
    const game = getGangGame(id);
    if (!game) {
      rejected.push({ id, reason: "unknown-game" });
      continue;
    }
    if (seen.has(game.id)) {
      rejected.push({ id: game.id, reason: "duplicate" });
      continue;
    }
    seen.add(game.id);
    if (!game.mixEligible) {
      rejected.push({ id: game.id, reason: "mix-disabled" });
      continue;
    }
    if (game.status !== "ready") {
      rejected.push({ id: game.id, reason: "not-ready" });
      continue;
    }
    if (!isCompatibleGame(game, preferences)) {
      rejected.push({ id: game.id, reason: "incompatible-with-session" });
      continue;
    }
    games.push(game);
  }

  return { valid: rejected.length === 0 && games.length > 0, games, rejected };
}
