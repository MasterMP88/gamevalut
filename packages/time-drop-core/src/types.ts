export type TimeDropMode =
  | "couple-coop"
  | "couple-duel"
  | "gang-solo"
  | "gang-teams";

export type TimeDropDifficulty = "flow" | "precision" | "expert";
export type PrecisionWindow = 2 | 5 | 10;
export type TimeDropStage = "listening" | "guessing" | "revealed" | "complete";

export interface TimeDropTrack {
  id: string;
  title: string;
  artist: string;
  releaseYear: number;
  /** Opaque reference owned by the playback/provider layer. The core never fetches audio. */
  playbackRef?: string;
  providerId?: string;
  externalUrl?: string;
  artworkUrl?: string;
}

export interface TimelineAnchor {
  trackId: string;
  year: number;
  title: string;
  artist: string;
}

export interface TimeDropActor {
  id: string;
  name: string;
  /** Required for gang-teams. Ignored in couple-coop. */
  sideId?: string;
}

export interface TimeDropGuess {
  actorId: string;
  slotIndex: number;
  lockedAt?: number;
  guessedYear?: number;
  precisionWindow?: PrecisionWindow;
  titleGuess?: string;
  artistGuess?: string;
}

export interface GuessResolution {
  actorId: string;
  sideId: string;
  placementCorrect: boolean;
  validSlotIndexes: number[];
  guessedYear?: number;
  yearDelta?: number;
  yearBonus: number;
  titleBonus: number;
  artistBonus: number;
  total: number;
}

export interface CrowdPulse {
  slotCounts: Record<number, number>;
  popularSlotIndexes: number[];
  majorityCorrect: boolean;
}

export interface SyncMoment {
  sameSlot: boolean;
  perfectSync: boolean;
  slotIndex: number | null;
}

export interface TimeDropRoundResolution {
  track: TimeDropTrack;
  results: GuessResolution[];
  scoreDeltaBySide: Record<string, number>;
  crowd: CrowdPulse;
  sync: SyncMoment | null;
}

export interface TimeDropRound {
  number: number;
  track: TimeDropTrack;
  stage: TimeDropStage;
  guesses: Record<string, TimeDropGuess>;
  resolution: TimeDropRoundResolution | null;
}

export interface TimeDropHistoryItem {
  roundNumber: number;
  trackId: string;
  releaseYear: number;
  results: GuessResolution[];
  crowd: CrowdPulse;
  sync: SyncMoment | null;
}

export interface TimeDropSession {
  id: string;
  mode: TimeDropMode;
  actors: TimeDropActor[];
  difficultyByActor: Record<string, TimeDropDifficulty>;
  initialTimeline: TimelineAnchor[];
  timeline: TimelineAnchor[];
  scores: Record<string, number>;
  roundNumber: number;
  round: TimeDropRound;
  history: TimeDropHistoryItem[];
  syncCount: number;
  perfectSyncCount: number;
  finished: boolean;
}

export interface PublicTrackView {
  id: string;
  playbackRef?: string;
  title?: string;
  artist?: string;
  releaseYear?: number;
  externalUrl?: string;
  artworkUrl?: string;
}

export interface TimeDropStats {
  rounds: number;
  guesses: number;
  correctPlacements: number;
  placementRate: number;
  syncCount: number;
  perfectSyncCount: number;
  leaderSideIds: string[];
}
