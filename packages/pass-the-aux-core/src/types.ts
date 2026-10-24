export type PlayerIndex = 0 | 1;
export type AuxRoundType = "SOLO_PICK" | "DUET_PICK" | "GUESS" | "SPEED_PICK";
export type AuxStage =
  | "PROMPT"
  | "PICK_A"
  | "HANDOFF_A"
  | "PICK_B"
  | "HANDOFF_B"
  | "PREDICTION"
  | "REVEAL"
  | "REACTION"
  | "COMPLETE";

export type AuxReaction = "MATCH" | "PLOT_TWIST" | "EXPLAINS_A_LOT";
export type AuxPrediction = "nostalgisch" | "guilty-pleasure" | "gefährlich-gut" | "unerwartet";

export interface SongPick {
  title: string;
  artist?: string;
  provider?: "manual" | "apple-music";
  providerId?: string;
}

export interface AuxRound {
  id: string;
  type: AuxRoundType;
  prompt: string;
  activePlayer: PlayerIndex;
  speedSeconds?: number;
}

export interface HiddenPick {
  player: PlayerIndex;
  pick: SongPick;
}

export interface AuxRoundState {
  round: AuxRound;
  stage: AuxStage;
  picks: HiddenPick[];
  prediction: AuxPrediction | null;
  reaction: AuxReaction | null;
  speedExpired: boolean;
}

export interface TracklistEntry {
  roundId: string;
  player: PlayerIndex;
  title: string;
  artist?: string;
  prompt: string;
}

export interface AuxSession {
  players: [string, string];
  roundIndex: number;
  current: AuxRoundState | null;
  tracklist: TracklistEntry[];
  reactions: AuxReaction[];
  finished: boolean;
}

export type AuxAction =
  | { type: "LOAD_ROUND"; round: AuxRound }
  | { type: "START_PICK" }
  | { type: "SUBMIT_PICK"; player: PlayerIndex; pick: SongPick }
  | { type: "CONFIRM_HANDOFF" }
  | { type: "SUBMIT_PREDICTION"; prediction: AuxPrediction }
  | { type: "REVEAL" }
  | { type: "SET_REACTION"; reaction: AuxReaction }
  | { type: "SPEED_EXPIRED" }
  | { type: "COMPLETE_ROUND" }
  | { type: "NEXT_ROUND"; round: AuxRound }
  | { type: "FINISH" }
  | { type: "RESET" };

export interface VisibleAuxRound {
  round: AuxRound;
  stage: AuxStage;
  picks: Array<{ player: PlayerIndex; title?: string; artist?: string }>;
  prediction: AuxPrediction | null;
  reaction: AuxReaction | null;
  speedExpired: boolean;
}
