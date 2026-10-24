import type {
  CrowdPulse,
  GuessResolution,
  PrecisionWindow,
  PublicTrackView,
  SyncMoment,
  TimeDropActor,
  TimeDropDifficulty,
  TimeDropGuess,
  TimeDropHistoryItem,
  TimeDropMode,
  TimeDropRound,
  TimeDropRoundResolution,
  TimeDropSession,
  TimeDropStats,
  TimeDropTrack,
  TimelineAnchor,
} from "./types.js";

const PRECISION_BONUS: Record<PrecisionWindow, number> = {
  2: 3,
  5: 2,
  10: 1,
};

function norm(value?: string): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeTrack(track: TimeDropTrack): TimeDropTrack {
  const title = track.title.trim().slice(0, 160);
  const artist = track.artist.trim().slice(0, 160);
  const releaseYear = Math.trunc(track.releaseYear);
  if (!track.id.trim()) throw new Error("Track id is required");
  if (!title || !artist) throw new Error("Track title and artist are required");
  if (!Number.isInteger(releaseYear) || releaseYear < 1900 || releaseYear > 2100) {
    throw new RangeError("releaseYear must be between 1900 and 2100");
  }
  return {
    id: track.id.trim().slice(0, 240),
    title,
    artist,
    releaseYear,
    ...(track.playbackRef ? { playbackRef: track.playbackRef } : {}),
    ...(track.providerId ? { providerId: track.providerId } : {}),
    ...(track.externalUrl ? { externalUrl: track.externalUrl } : {}),
    ...(track.artworkUrl ? { artworkUrl: track.artworkUrl } : {}),
  };
}

export function toAnchor(track: TimeDropTrack): TimelineAnchor {
  const t = normalizeTrack(track);
  return { trackId: t.id, year: t.releaseYear, title: t.title, artist: t.artist };
}

export function sortTimeline(anchors: readonly TimelineAnchor[]): TimelineAnchor[] {
  const seen = new Set<string>();
  return anchors
    .filter((a) => {
      if (!a.trackId || seen.has(a.trackId)) return false;
      seen.add(a.trackId);
      return Number.isInteger(a.year);
    })
    .map((a) => ({ ...a }))
    .sort((a, b) => a.year - b.year || a.trackId.localeCompare(b.trackId));
}

/**
 * Slot 0 is before the first anchor; slot N is after the last.
 * Same-year songs intentionally allow every adjacent position that preserves chronology.
 */
export function validSlotIndexes(releaseYear: number, timeline: readonly TimelineAnchor[]): number[] {
  const sorted = sortTimeline(timeline);
  const out: number[] = [];
  for (let i = 0; i <= sorted.length; i += 1) {
    const lower = i === 0 ? Number.NEGATIVE_INFINITY : sorted[i - 1]!.year;
    const upper = i === sorted.length ? Number.POSITIVE_INFINITY : sorted[i]!.year;
    if (releaseYear >= lower && releaseYear <= upper) out.push(i);
  }
  return out;
}

export function insertTrack(timeline: readonly TimelineAnchor[], track: TimeDropTrack): TimelineAnchor[] {
  const normalized = normalizeTrack(track);
  if (timeline.some((a) => a.trackId === normalized.id)) return sortTimeline(timeline);
  return sortTimeline([...timeline, toAnchor(normalized)]);
}

function sideFor(mode: TimeDropMode, actor: TimeDropActor): string {
  if (mode === "couple-coop") return "together";
  if (mode === "gang-teams") {
    const side = actor.sideId?.trim();
    if (!side) throw new Error("gang-teams requires sideId for every actor");
    return side;
  }
  return actor.id;
}

function validateActors(mode: TimeDropMode, actors: readonly TimeDropActor[]): TimeDropActor[] {
  const seen = new Set<string>();
  const clean = actors
    .map((a) => ({ ...a, id: a.id.trim(), name: a.name.trim().slice(0, 40) }))
    .filter((a) => a.id && a.name && !seen.has(a.id) && seen.add(a.id));

  if (clean.length < 2 || clean.length > 99) throw new RangeError("TIME//DROP supports 2–99 actors");
  if ((mode === "couple-coop" || mode === "couple-duel") && clean.length !== 2) {
    throw new RangeError("Couple modes require exactly two actors");
  }
  if (mode === "gang-teams") {
    const teams = new Set(clean.map((a) => a.sideId?.trim()).filter(Boolean));
    if (teams.size < 2) throw new RangeError("gang-teams requires at least two teams");
    for (const actor of clean) sideFor(mode, actor);
  }
  return clean;
}

function initialScores(mode: TimeDropMode, actors: readonly TimeDropActor[]): Record<string, number> {
  return Object.fromEntries([...new Set(actors.map((a) => sideFor(mode, a)))].map((id) => [id, 0]));
}

function createRound(number: number, track: TimeDropTrack): TimeDropRound {
  return {
    number,
    track: normalizeTrack(track),
    stage: "listening",
    guesses: {},
    resolution: null,
  };
}

export function createTimeDropSession(input: {
  id: string;
  mode: TimeDropMode;
  actors: readonly TimeDropActor[];
  seedTrack: TimeDropTrack;
  firstTrack: TimeDropTrack;
  difficultyByActor?: Readonly<Record<string, TimeDropDifficulty>>;
}): TimeDropSession {
  const actors = validateActors(input.mode, input.actors);
  const seed = normalizeTrack(input.seedTrack);
  const first = normalizeTrack(input.firstTrack);
  if (seed.id === first.id) throw new Error("Seed track and first round track must differ");

  const difficultyByActor: Record<string, TimeDropDifficulty> = {};
  for (const actor of actors) {
    difficultyByActor[actor.id] = input.difficultyByActor?.[actor.id] ?? "flow";
  }
  const initialTimeline = [toAnchor(seed)];

  return {
    id: input.id.trim() || "time-drop",
    mode: input.mode,
    actors,
    difficultyByActor,
    initialTimeline,
    timeline: initialTimeline.map((a) => ({ ...a })),
    scores: initialScores(input.mode, actors),
    roundNumber: 1,
    round: createRound(1, first),
    history: [],
    syncCount: 0,
    perfectSyncCount: 0,
    finished: false,
  };
}

export function publicTrackView(session: TimeDropSession): PublicTrackView {
  const t = session.round.track;
  if (session.round.stage === "revealed" || session.round.stage === "complete") {
    return {
      id: t.id,
      ...(t.playbackRef ? { playbackRef: t.playbackRef } : {}),
      title: t.title,
      artist: t.artist,
      releaseYear: t.releaseYear,
      ...(t.externalUrl ? { externalUrl: t.externalUrl } : {}),
      ...(t.artworkUrl ? { artworkUrl: t.artworkUrl } : {}),
    };
  }
  return {
    id: t.id,
    ...(t.playbackRef ? { playbackRef: t.playbackRef } : {}),
  };
}

export function openGuessing(session: TimeDropSession): TimeDropSession {
  if (session.finished || session.round.stage !== "listening") return session;
  return { ...session, round: { ...session.round, stage: "guessing" } };
}

function sanitizeGuess(session: TimeDropSession, guess: TimeDropGuess): TimeDropGuess {
  const actor = session.actors.find((a) => a.id === guess.actorId);
  if (!actor) throw new Error("Unknown actor");
  if (!Number.isInteger(guess.slotIndex) || guess.slotIndex < 0 || guess.slotIndex > session.timeline.length) {
    throw new RangeError("slotIndex is outside the timeline");
  }
  const difficulty = session.difficultyByActor[actor.id] ?? "flow";
  const guessedYear = guess.guessedYear === undefined ? undefined : Math.trunc(guess.guessedYear);
  if (difficulty !== "flow" && guessedYear !== undefined && (guessedYear < 1900 || guessedYear > 2100)) {
    throw new RangeError("guessedYear must be between 1900 and 2100");
  }
  const precisionWindow =
    difficulty === "precision" && guess.precisionWindow && [2, 5, 10].includes(guess.precisionWindow)
      ? guess.precisionWindow
      : undefined;

  return {
    actorId: actor.id,
    slotIndex: guess.slotIndex,
    ...(guess.lockedAt === undefined ? {} : { lockedAt: guess.lockedAt }),
    ...(guessedYear === undefined ? {} : { guessedYear }),
    ...(precisionWindow === undefined ? {} : { precisionWindow }),
    ...(guess.titleGuess?.trim() ? { titleGuess: guess.titleGuess.trim().slice(0, 160) } : {}),
    ...(guess.artistGuess?.trim() ? { artistGuess: guess.artistGuess.trim().slice(0, 160) } : {}),
  };
}

export function submitGuess(session: TimeDropSession, guess: TimeDropGuess): TimeDropSession {
  if (session.finished) throw new Error("Game is finished");
  if (session.round.stage !== "guessing") throw new Error("Round is not accepting guesses");
  const clean = sanitizeGuess(session, guess);
  if (session.round.guesses[clean.actorId]) throw new Error("Actor already locked a guess");
  return {
    ...session,
    round: {
      ...session.round,
      guesses: { ...session.round.guesses, [clean.actorId]: clean },
    },
  };
}

export function canReveal(session: TimeDropSession): boolean {
  return session.round.stage === "guessing" &&
    session.actors.every((actor) => session.round.guesses[actor.id] !== undefined);
}

function resolveGuess(session: TimeDropSession, guess: TimeDropGuess): GuessResolution {
  const actor = session.actors.find((a) => a.id === guess.actorId)!;
  const difficulty = session.difficultyByActor[actor.id] ?? "flow";
  const valid = validSlotIndexes(session.round.track.releaseYear, session.timeline);
  const placementCorrect = valid.includes(guess.slotIndex);
  const yearDelta = guess.guessedYear === undefined
    ? undefined
    : Math.abs(guess.guessedYear - session.round.track.releaseYear);

  let yearBonus = 0;
  let titleBonus = 0;
  let artistBonus = 0;

  if (placementCorrect && difficulty === "precision" && yearDelta !== undefined && guess.precisionWindow) {
    if (yearDelta <= guess.precisionWindow) yearBonus = PRECISION_BONUS[guess.precisionWindow];
  }
  if (placementCorrect && difficulty === "expert") {
    if (yearDelta === 0) yearBonus = 3;
    if (norm(guess.titleGuess) && norm(guess.titleGuess) === norm(session.round.track.title)) titleBonus = 1;
    if (norm(guess.artistGuess) && norm(guess.artistGuess) === norm(session.round.track.artist)) artistBonus = 1;
  }

  return {
    actorId: actor.id,
    sideId: sideFor(session.mode, actor),
    placementCorrect,
    validSlotIndexes: valid,
    ...(guess.guessedYear === undefined ? {} : { guessedYear: guess.guessedYear }),
    ...(yearDelta === undefined ? {} : { yearDelta }),
    yearBonus,
    titleBonus,
    artistBonus,
    total: (placementCorrect ? 1 : 0) + yearBonus + titleBonus + artistBonus,
  };
}

function crowdPulse(guesses: readonly TimeDropGuess[], valid: readonly number[]): CrowdPulse {
  const counts = new Map<number, number>();
  for (const guess of guesses) counts.set(guess.slotIndex, (counts.get(guess.slotIndex) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  const popularSlotIndexes = max === 0
    ? []
    : [...counts.entries()].filter(([, count]) => count === max).map(([slot]) => slot).sort((a, b) => a - b);
  return {
    slotCounts: Object.fromEntries([...counts.entries()].sort((a, b) => a[0] - b[0])),
    popularSlotIndexes,
    majorityCorrect: popularSlotIndexes.some((slot) => valid.includes(slot)),
  };
}

function syncMoment(session: TimeDropSession, guesses: readonly TimeDropGuess[], valid: readonly number[]): SyncMoment | null {
  if (!session.mode.startsWith("couple") || guesses.length !== 2) return null;
  const sameSlot = guesses[0]!.slotIndex === guesses[1]!.slotIndex;
  return {
    sameSlot,
    perfectSync: sameSlot && valid.includes(guesses[0]!.slotIndex),
    slotIndex: sameSlot ? guesses[0]!.slotIndex : null,
  };
}

function scoreBySide(session: TimeDropSession, results: readonly GuessResolution[], sync: SyncMoment | null): Record<string, number> {
  const grouped = new Map<string, number[]>();
  for (const result of results) {
    const list = grouped.get(result.sideId) ?? [];
    list.push(result.total);
    grouped.set(result.sideId, list);
  }

  const out: Record<string, number> = {};
  for (const [sideId, values] of grouped) {
    if (session.mode === "gang-teams") {
      out[sideId] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    } else {
      out[sideId] = values.reduce((a, b) => a + b, 0);
    }
  }

  if (session.mode === "couple-coop" && sync?.perfectSync) {
    out["together"] = (out["together"] ?? 0) + 2;
  }
  return out;
}

export function revealRound(session: TimeDropSession): TimeDropSession {
  if (session.finished) return session;
  if (!canReveal(session)) throw new Error("Not all actors have locked a guess");
  const guesses = session.actors.map((actor) => session.round.guesses[actor.id]!);
  const results = guesses.map((guess) => resolveGuess(session, guess));
  const valid = validSlotIndexes(session.round.track.releaseYear, session.timeline);
  const crowd = crowdPulse(guesses, valid);
  const sync = syncMoment(session, guesses, valid);
  const scoreDeltaBySide = scoreBySide(session, results, sync);
  const resolution: TimeDropRoundResolution = {
    track: session.round.track,
    results,
    scoreDeltaBySide,
    crowd,
    sync,
  };

  const scores = { ...session.scores };
  for (const [sideId, delta] of Object.entries(scoreDeltaBySide)) {
    scores[sideId] = (scores[sideId] ?? 0) + delta;
  }

  return {
    ...session,
    scores,
    timeline: insertTrack(session.timeline, session.round.track),
    syncCount: session.syncCount + (sync?.sameSlot ? 1 : 0),
    perfectSyncCount: session.perfectSyncCount + (sync?.perfectSync ? 1 : 0),
    round: { ...session.round, stage: "revealed", resolution },
  };
}

export function completeRound(session: TimeDropSession): TimeDropSession {
  if (session.finished || session.round.stage !== "revealed" || !session.round.resolution) return session;
  const item: TimeDropHistoryItem = {
    roundNumber: session.round.number,
    trackId: session.round.track.id,
    releaseYear: session.round.track.releaseYear,
    results: session.round.resolution.results.map((r) => ({ ...r, validSlotIndexes: [...r.validSlotIndexes] })),
    crowd: {
      slotCounts: { ...session.round.resolution.crowd.slotCounts },
      popularSlotIndexes: [...session.round.resolution.crowd.popularSlotIndexes],
      majorityCorrect: session.round.resolution.crowd.majorityCorrect,
    },
    sync: session.round.resolution.sync ? { ...session.round.resolution.sync } : null,
  };
  return {
    ...session,
    history: [...session.history, item],
    round: { ...session.round, stage: "complete" },
  };
}

export function nextRound(session: TimeDropSession, track: TimeDropTrack): TimeDropSession {
  if (session.finished) throw new Error("Game is finished");
  if (session.round.stage !== "complete") throw new Error("Current round is not complete");
  const next = normalizeTrack(track);
  if (session.timeline.some((a) => a.trackId === next.id)) throw new Error("Track is already on the timeline");
  const number = session.roundNumber + 1;
  return {
    ...session,
    roundNumber: number,
    round: createRound(number, next),
  };
}

export function finishTimeDrop(session: TimeDropSession): TimeDropSession {
  return { ...session, finished: true };
}

export function resetTimeDrop(session: TimeDropSession, firstTrack: TimeDropTrack): TimeDropSession {
  const next = normalizeTrack(firstTrack);
  if (session.initialTimeline.some((a) => a.trackId === next.id)) {
    throw new Error("First track cannot equal the seed track");
  }
  return {
    ...session,
    timeline: session.initialTimeline.map((a) => ({ ...a })),
    scores: initialScores(session.mode, session.actors),
    roundNumber: 1,
    round: createRound(1, next),
    history: [],
    syncCount: 0,
    perfectSyncCount: 0,
    finished: false,
  };
}

export function statsForTimeDrop(session: TimeDropSession): TimeDropStats {
  const results = session.history.flatMap((h) => h.results);
  const correctPlacements = results.filter((r) => r.placementCorrect).length;
  const max = Math.max(0, ...Object.values(session.scores));
  return {
    rounds: session.history.length,
    guesses: results.length,
    correctPlacements,
    placementRate: results.length ? correctPlacements / results.length : 0,
    syncCount: session.syncCount,
    perfectSyncCount: session.perfectSyncCount,
    leaderSideIds: max === 0
      ? []
      : Object.entries(session.scores).filter(([, score]) => score === max).map(([id]) => id).sort(),
  };
}
