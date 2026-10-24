import type {
  FirstBeatAction,
  FirstBeatRound,
  FirstBeatRoundResult,
  FirstBeatSession,
  FirstBeatStats,
  PublicTrackView,
} from "./types.js";

export const REVEAL_WINDOWS_MS = [1000, 3000, 7000, 15000] as const;

export function createFirstBeatSession(players: [string, string]): FirstBeatSession {
  return {
    players,
    roundIndex: 0,
    current: null,
    history: [],
    signal: 0,
    finished: false,
  };
}

export function currentRevealMs(state: FirstBeatSession): number {
  if (!state.current) return REVEAL_WINDOWS_MS[0];
  return REVEAL_WINDOWS_MS[Math.min(state.current.revealLevel, REVEAL_WINDOWS_MS.length - 1)]!;
}

export function visibleTrack(state: FirstBeatSession): PublicTrackView | null {
  const current = state.current;
  if (!current) return null;
  const { track } = current.round;
  const isReveal = current.stage === "REVEAL" || current.stage === "COMPLETE";
  if (isReveal) return { ...track };
  return {
    id: track.id,
    ...(track.previewUrl ? { previewUrl: track.previewUrl } : {}),
  };
}

function clampSignal(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function signalGain(revealMs: number, recognized: boolean): number {
  if (!recognized) return 1;
  if (revealMs <= 1000) return 12;
  if (revealMs <= 3000) return 9;
  if (revealMs <= 7000) return 6;
  return 3;
}

function releaseDecade(round: FirstBeatRound): number | undefined {
  const raw = round.track.releaseDate;
  if (!raw) return undefined;
  const year = Number(raw.slice(0, 4));
  if (!Number.isFinite(year) || year < 1900) return undefined;
  return Math.floor(year / 10) * 10;
}

function makeResult(state: FirstBeatSession, recognized: boolean): FirstBeatRoundResult {
  const current = state.current;
  if (!current) throw new Error("Cannot complete a round when no round is loaded");
  const decade = releaseDecade(current.round);
  return {
    roundId: current.round.id,
    type: current.round.type,
    trackId: current.round.track.id,
    recognized,
    revealedAtMs: currentRevealMs(state),
    buzzedBy: current.buzzedBy,
    guess: current.guess,
    ...(decade === undefined ? {} : { releaseDecade: decade }),
  };
}

export function firstBeatReducer(state: FirstBeatSession, action: FirstBeatAction): FirstBeatSession {
  switch (action.type) {
    case "LOAD_ROUND":
      if (state.finished) return state;
      return {
        ...state,
        current: {
          round: action.round,
          stage: "READY",
          revealLevel: 0,
          buzzedBy: null,
          guess: null,
        },
      };

    case "START_AUDIO":
      if (!state.current || state.finished) return state;
      if (!["READY", "LISTENING"].includes(state.current.stage)) return state;
      return { ...state, current: { ...state.current, stage: "LISTENING" } };

    case "MORE_AUDIO":
      if (!state.current || state.finished) return state;
      if (!["READY", "LISTENING", "GUESSING"].includes(state.current.stage)) return state;
      return {
        ...state,
        current: {
          ...state.current,
          stage: "LISTENING",
          revealLevel: Math.min(state.current.revealLevel + 1, REVEAL_WINDOWS_MS.length - 1),
        },
      };

    case "BUZZ":
      if (!state.current || state.finished || state.current.stage !== "LISTENING") return state;
      return {
        ...state,
        current: { ...state.current, stage: "BUZZED", buzzedBy: action.player },
      };

    case "SUBMIT_GUESS":
      if (!state.current || state.finished) return state;
      if (!["BUZZED", "GUESSING"].includes(state.current.stage)) return state;
      return {
        ...state,
        current: { ...state.current, stage: "GUESSING", guess: action.guess },
      };

    case "REVEAL":
      if (!state.current || state.finished) return state;
      if (!["LISTENING", "BUZZED", "GUESSING"].includes(state.current.stage)) return state;
      return { ...state, current: { ...state.current, stage: "REVEAL" } };

    case "COMPLETE_ROUND": {
      if (!state.current || state.finished) return state;
      if (state.current.stage !== "REVEAL") return state;
      const result = makeResult(state, action.recognized);
      return {
        ...state,
        current: { ...state.current, stage: "COMPLETE" },
        history: [...state.history, result],
        signal: clampSignal(state.signal + signalGain(result.revealedAtMs, action.recognized)),
      };
    }

    case "NEXT_ROUND":
      if (state.finished) return state;
      if (state.current && state.current.stage !== "COMPLETE") return state;
      return {
        ...state,
        roundIndex: state.roundIndex + 1,
        current: {
          round: action.round,
          stage: "READY",
          revealLevel: 0,
          buzzedBy: null,
          guess: null,
        },
      };

    case "FINISH":
      return { ...state, finished: true };

    case "RESET":
      return createFirstBeatSession(state.players);
  }
}

export function statsFor(state: FirstBeatSession): FirstBeatStats {
  const recognized = state.history.filter((x) => x.recognized);
  const averageRevealMs = recognized.length
    ? Math.round(recognized.reduce((sum, x) => sum + x.revealedAtMs, 0) / recognized.length)
    : 0;

  const decadeCounts = new Map<number, number>();
  for (const row of recognized) {
    if (row.releaseDecade === undefined) continue;
    decadeCounts.set(row.releaseDecade, (decadeCounts.get(row.releaseDecade) ?? 0) + 1);
  }
  const strongestDecade = [...decadeCounts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? null;

  return {
    rounds: state.history.length,
    recognized: recognized.length,
    averageRevealMs,
    strongestDecade,
    signal: state.signal,
  };
}
