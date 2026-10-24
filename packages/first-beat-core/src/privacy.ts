import type {
  FirstBeatRoundResult,
  FirstBeatSession,
  FirstBeatRoundType,
  FirstBeatStage,
  PlayerIndex,
} from "./types.js";

export interface DurableFirstBeatCurrent {
  roundId: string;
  type: FirstBeatRoundType;
  stage: FirstBeatStage;
  revealLevel: number;
  buzzedBy: PlayerIndex | null;
  /** Present only for non-private catalog tracks that can be safely re-fetched. */
  trackId?: string;
  privateTrack: boolean;
}

export interface DurableFirstBeatHistoryRow {
  roundId: string;
  type: FirstBeatRoundType;
  recognized: boolean;
  revealedAtMs: number;
  buzzedBy: PlayerIndex | null;
  releaseDecade?: number;
}

export interface DurableFirstBeatSnapshot {
  version: 1;
  roundIndex: number;
  signal: number;
  finished: boolean;
  current: DurableFirstBeatCurrent | null;
  history: DurableFirstBeatHistoryRow[];
  /** True when exact resume needs a locally/private selected track again. */
  requiresPrivateMusicRestore: boolean;
}

function durableHistoryRow(
  row: FirstBeatRoundResult,
): DurableFirstBeatHistoryRow {
  return {
    roundId: row.roundId,
    type: row.type,
    recognized: row.recognized,
    revealedAtMs: row.revealedAtMs,
    buzzedBy: row.buzzedBy,
    ...(row.releaseDecade === undefined
      ? {}
      : { releaseDecade: row.releaseDecade }),
  };
}

/**
 * Safe default for NOCTURNE account auto-save.
 * Excludes titles, artists, artwork, audio URLs, picker identity and guess text.
 * Local/private track IDs are omitted too.
 */
export function toDurableFirstBeatSnapshot(
  state: FirstBeatSession,
): DurableFirstBeatSnapshot {
  const current = state.current;
  const privateTrack =
    current?.round.track.pickedBy !== undefined ||
    current?.round.track.source === "local-file";

  return {
    version: 1,
    roundIndex: state.roundIndex,
    signal: state.signal,
    finished: state.finished,
    current: current
      ? {
          roundId: current.round.id,
          type: current.round.type,
          stage: current.stage,
          revealLevel: current.revealLevel,
          buzzedBy: current.buzzedBy,
          ...(privateTrack ? {} : { trackId: current.round.track.id }),
          privateTrack,
        }
      : null,
    history: state.history.map(durableHistoryRow),
    requiresPrivateMusicRestore: Boolean(privateTrack),
  };
}
