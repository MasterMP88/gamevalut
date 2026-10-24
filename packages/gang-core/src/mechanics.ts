/**
 * Pure, provider-neutral mechanics for the first GANG MODE prototypes.
 *
 * No UI, persistence or realtime transport lives here. The same functions can
 * drive One Phone, Everyone In, Team Device or Big Screen shells.
 */

export interface MajorityResolution {
  counts: Record<string, number>;
  majorityOptionIds: string[];
  correctPredictorIds: string[];
  voteCount: number;
  predictionCount: number;
}

export function resolveMajorityRound(input: {
  playerIds: readonly string[];
  optionIds: readonly string[];
  votes: Readonly<Record<string, string>>;
  predictions?: Readonly<Record<string, string>>;
}): MajorityResolution {
  const players = new Set(input.playerIds);
  const options = new Set(input.optionIds);
  if (players.size < 2) throw new Error("Majority requires at least two players");
  if (options.size < 2) throw new Error("Majority requires at least two options");

  const counts: Record<string, number> = Object.fromEntries(
    [...options].map((id) => [id, 0]),
  );

  for (const [playerId, optionId] of Object.entries(input.votes)) {
    if (!players.has(playerId) || !options.has(optionId)) continue;
    counts[optionId] = (counts[optionId] ?? 0) + 1;
  }

  const max = Math.max(0, ...Object.values(counts));
  const majorityOptionIds =
    max === 0
      ? []
      : Object.entries(counts)
          .filter(([, count]) => count === max)
          .map(([id]) => id)
          .sort();

  const correctPredictorIds = Object.entries(input.predictions ?? {})
    .filter(
      ([playerId, optionId]) =>
        players.has(playerId) && majorityOptionIds.includes(optionId),
    )
    .map(([playerId]) => playerId)
    .sort();

  return {
    counts,
    majorityOptionIds,
    correctPredictorIds,
    voteCount: Object.entries(input.votes).filter(
      ([playerId, optionId]) => players.has(playerId) && options.has(optionId),
    ).length,
    predictionCount: Object.entries(input.predictions ?? {}).filter(
      ([playerId, optionId]) => players.has(playerId) && options.has(optionId),
    ).length,
  };
}

export interface WhosThatResolution {
  counts: Record<string, number>;
  selectedPlayerIds: string[];
  nominationCount: number;
}

/**
 * Each active voter nominates one active player. Invalid/stale votes are
 * ignored so realtime reconnects cannot poison the reveal.
 */
export function resolveWhosThatRound(input: {
  playerIds: readonly string[];
  nominations: Readonly<Record<string, string>>;
  allowSelf?: boolean;
}): WhosThatResolution {
  const players = new Set(input.playerIds);
  if (players.size < 3) throw new Error("WHO'S THAT? requires at least three players");

  const counts: Record<string, number> = Object.fromEntries(
    [...players].map((id) => [id, 0]),
  );
  let nominationCount = 0;

  for (const [voterId, targetId] of Object.entries(input.nominations)) {
    if (!players.has(voterId) || !players.has(targetId)) continue;
    if (!input.allowSelf && voterId === targetId) continue;
    counts[targetId] = (counts[targetId] ?? 0) + 1;
    nominationCount += 1;
  }

  const max = Math.max(0, ...Object.values(counts));
  const selectedPlayerIds =
    max === 0
      ? []
      : Object.entries(counts)
          .filter(([, count]) => count === max)
          .map(([id]) => id)
          .sort();

  return { counts, selectedPlayerIds, nominationCount };
}

export type UndercoverRole = "civilian" | "undercover";

export interface UndercoverAssignment {
  roles: Record<string, UndercoverRole>;
  undercoverPlayerIds: string[];
  seed: number;
}

function nextRand(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [r, (seed + 0x6d2b79f5) | 0];
}

function shuffled<T>(items: readonly T[], seed: number): { items: T[]; seed: number } {
  const out = items.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    let r: number;
    [r, s] = nextRand(s);
    const j = Math.floor(r * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return { items: out, seed: s };
}

/**
 * Deterministic role assignment: private delivery belongs to the UI/transport
 * layer, while this function only decides who receives which role.
 */
export function assignUndercoverRoles(
  playerIds: readonly string[],
  seed: number,
  undercoverCount = 1,
): UndercoverAssignment {
  const unique = [...new Set(playerIds)];
  if (unique.length < 4) throw new Error("UNDERCOVER requires at least four players");
  if (!Number.isInteger(undercoverCount) || undercoverCount < 1) {
    throw new Error("At least one undercover player is required");
  }
  if (undercoverCount >= unique.length) {
    throw new Error("At least one civilian must remain");
  }

  const shuffledPlayers = shuffled(unique, seed);
  const undercoverPlayerIds = shuffledPlayers.items
    .slice(0, undercoverCount)
    .sort();
  const undercover = new Set(undercoverPlayerIds);
  const roles: Record<string, UndercoverRole> = Object.fromEntries(
    unique.map((id) => [id, undercover.has(id) ? "undercover" : "civilian"]),
  );

  return { roles, undercoverPlayerIds, seed: shuffledPlayers.seed };
}

export interface SecretMissionAssignment {
  assignments: Record<string, string>;
  seed: number;
}

/**
 * Assigns unique missions without content knowledge. Mission text stays in the
 * content layer; the core only works with opaque mission IDs.
 */
export function assignSecretMissions(input: {
  playerIds: readonly string[];
  missionIds: readonly string[];
  seed: number;
}): SecretMissionAssignment {
  const players = [...new Set(input.playerIds)];
  const missions = [...new Set(input.missionIds)];

  if (players.length < 3) throw new Error("SECRET MISSIONS requires at least three players");
  if (missions.length < players.length) {
    throw new Error("Not enough unique missions for every active player");
  }

  const shuffledMissions = shuffled(missions, input.seed);
  const assignments: Record<string, string> = {};
  players.forEach((playerId, index) => {
    assignments[playerId] = shuffledMissions.items[index]!;
  });

  return { assignments, seed: shuffledMissions.seed };
}

export interface MissionResolution {
  completedPlayerIds: string[];
  failedPlayerIds: string[];
  unresolvedPlayerIds: string[];
}

/**
 * Resolution is explicit: the shell can use voting, self reveal or a Director
 * rule, then feed boolean outcomes here. Missing outcomes stay unresolved.
 */
export function resolveSecretMissions(input: {
  assignments: Readonly<Record<string, string>>;
  outcomes: Readonly<Record<string, boolean>>;
}): MissionResolution {
  const playerIds = Object.keys(input.assignments);
  const completedPlayerIds: string[] = [];
  const failedPlayerIds: string[] = [];
  const unresolvedPlayerIds: string[] = [];

  for (const playerId of playerIds) {
    const outcome = input.outcomes[playerId];
    if (outcome === true) completedPlayerIds.push(playerId);
    else if (outcome === false) failedPlayerIds.push(playerId);
    else unresolvedPlayerIds.push(playerId);
  }

  return {
    completedPlayerIds: completedPlayerIds.sort(),
    failedPlayerIds: failedPlayerIds.sort(),
    unresolvedPlayerIds: unresolvedPlayerIds.sort(),
  };
}
