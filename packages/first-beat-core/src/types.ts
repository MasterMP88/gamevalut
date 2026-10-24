export type PlayerIndex = 0 | 1;
export type GameAudioSource = "owned-pack" | "licensed-catalog" | "local-file" | "demo";
export type GameAudioRights = "owned" | "licensed" | "user-local";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  source: GameAudioSource;
  /** Playable game audio. Must only point at owned/licensed/user-local audio. */
  audioUrl?: string;
  artworkUrl?: string;
  releaseDate?: string;
  genres?: string[];
  durationMs?: number;
  rights?: GameAudioRights;
  /** Set for tracks privately chosen by a player. Never display before reveal. */
  pickedBy?: PlayerIndex;
}

export interface PublicTrackView {
  id: string;
  audioUrl?: string;
  artworkUrl?: string;
  title?: string;
  artist?: string;
  releaseDate?: string;
  genres?: string[];
  pickedBy?: PlayerIndex;
}

export type FirstBeatRoundType =
  | "INTRO_RUSH"
  | "TIME_WARP"
  | "WHO_PICKED_IT"
  | "MOOD_MATCH"
  | "PERSONAL_CUT";

export type FirstBeatStage =
  | "READY"
  | "LISTENING"
  | "BUZZED"
  | "GUESSING"
  | "REVEAL"
  | "COMPLETE";

export type GuessPayload =
  | { kind: "free-text"; text: string }
  | { kind: "era"; decade: number }
  | { kind: "owner"; player: PlayerIndex }
  | { kind: "mood"; value: string };

export interface FirstBeatRound {
  id: string;
  type: FirstBeatRoundType;
  prompt: string;
  track: MusicTrack;
  moodOptions?: string[];
}

export interface FirstBeatRoundState {
  round: FirstBeatRound;
  stage: FirstBeatStage;
  revealLevel: number;
  buzzedBy: PlayerIndex | null;
  guess: GuessPayload | null;
}

export interface FirstBeatRoundResult {
  roundId: string;
  type: FirstBeatRoundType;
  trackId: string;
  recognized: boolean;
  revealedAtMs: number;
  buzzedBy: PlayerIndex | null;
  guess: GuessPayload | null;
  releaseDecade?: number;
}

export interface FirstBeatSession {
  players: [string, string];
  roundIndex: number;
  current: FirstBeatRoundState | null;
  history: FirstBeatRoundResult[];
  signal: number;
  finished: boolean;
}

export type FirstBeatAction =
  | { type: "LOAD_ROUND"; round: FirstBeatRound }
  | { type: "START_AUDIO" }
  | { type: "MORE_AUDIO" }
  | { type: "BUZZ"; player: PlayerIndex }
  | { type: "SUBMIT_GUESS"; guess: GuessPayload }
  | { type: "REVEAL" }
  | { type: "COMPLETE_ROUND"; recognized: boolean }
  | { type: "NEXT_ROUND"; round: FirstBeatRound }
  | { type: "FINISH" }
  | { type: "RESET" };

export interface FirstBeatStats {
  rounds: number;
  recognized: number;
  averageRevealMs: number;
  strongestDecade: number | null;
  signal: number;
}
