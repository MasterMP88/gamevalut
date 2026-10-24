import type { AuxRoundType, AuxSession, AuxStage } from "./types.js";

export interface DurableAuxSnapshot {
  version: 1;
  roundIndex: number;
  finished: boolean;
  current: null | {
    roundId: string;
    type: AuxRoundType;
    stage: AuxStage;
    speedExpired: boolean;
    hasPickA: boolean;
    hasPickB: boolean;
  };
  trackCount: number;
  reactionCount: number;
  requiresPrivateMusicRestore: boolean;
}

export function toDurableAuxSnapshot(state: AuxSession): DurableAuxSnapshot {
  const c = state.current;
  return {
    version: 1,
    roundIndex: state.roundIndex,
    finished: state.finished,
    current: c
      ? {
          roundId: c.round.id,
          type: c.round.type,
          stage: c.stage,
          speedExpired: c.speedExpired,
          hasPickA: c.picks.some((x) => x.player === 0),
          hasPickB: c.picks.some((x) => x.player === 1),
        }
      : null,
    trackCount: state.tracklist.length,
    reactionCount: state.reactions.length,
    requiresPrivateMusicRestore: Boolean(c?.picks.length || state.tracklist.length),
  };
}
