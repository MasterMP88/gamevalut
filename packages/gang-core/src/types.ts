export type GangEntryMode = "director" | "catalog" | "mix";

export type InteractionMode =
  | "one-phone"
  | "everyone-in"
  | "big-screen"
  | "team-device"
  | "mixed";

export type ScaleBand = "duo-small" | "core-party" | "large-party" | "crowd";

export type GameStatus = "ready" | "prototype" | "planned";

export type Energy = 1 | 2 | 3 | 4 | 5;

export type GameCapability = "music" | "camera" | "spicy" | "alcohol";

export type GameMechanic =
  | "social-vote"
  | "majority"
  | "secret-role"
  | "secret-mission"
  | "bluff"
  | "physical"
  | "team"
  | "photo"
  | "drawing"
  | "music"
  | "story"
  | "prediction"
  | "reaction"
  | "hot-seat"
  | "after-dark";

export interface GangGameDefinition {
  id: string;
  slug: string;
  title: string;
  hook: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: [number, number];
  energy: Energy;
  mechanics: GameMechanic[];
  interactionModes: InteractionMode[];
  capabilities: GameCapability[];
  tags: string[];
  directorEligible: boolean;
  mixEligible: boolean;
  status: GameStatus;
}

export interface GangPreferences {
  playerCount: number;
  durationMinutes: 15 | 30 | 60 | null;
  energyTarget: Energy;
  moods: string[];
  enabledCapabilities: GameCapability[];
}

export interface DeviceContext {
  connectedDevices: number;
  hasBigScreen: boolean;
}

export interface DirectorHistoryItem {
  gameId: string;
  primaryMechanic: GameMechanic;
  energy: Energy;
}

export interface DirectorContext {
  preferences: GangPreferences;
  history: DirectorHistoryItem[];
  deviceContext: DeviceContext;
}

export interface DirectorPick {
  game: GangGameDefinition;
  interactionMode: InteractionMode;
  reason: string;
}

export interface MixValidation {
  valid: boolean;
  games: GangGameDefinition[];
  rejected: Array<{ id: string; reason: string }>;
}

export interface GangPlan {
  entryMode: GangEntryMode;
  gameIds: string[];
  estimatedMinutes: number;
}
