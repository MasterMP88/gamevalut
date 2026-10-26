export type GangEntryMode = "director" | "catalog" | "mix";

export type InteractionMode =
  "one-phone" | "everyone-in" | "big-screen" | "team-device" | "mixed";

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
  inputPreference?: "shared" | "individual";
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
  seed?: number;
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
  /** Actual round limits consumed by every runtime adapter. */
  roundsByGame?: Record<string, number>;
  budgetMinutes?: number | null;
  modesByGame?: Record<string, InteractionMode>;
}

export type GangRoomPhase = "lobby" | "playing" | "paused" | "finished";

export interface GangPlayer {
  id: string;
  displayName: string;
  active: boolean;
  joinedAt: number;
  lastSeenAt: number;
  deviceIds: string[];
}

export interface GangDevice {
  id: string;
  connected: boolean;
  joinedAt: number;
  lastSeenAt: number;
  kind: "phone" | "tablet" | "desktop" | "tv";
  canDisplay: boolean;
  canInput: boolean;
}

export interface GangRoomState {
  id: string;
  code: string;
  phase: GangRoomPhase;
  revision: number;
  createdAt: number;
  updatedAt: number;
  preferences: GangPreferences;
  entryMode: GangEntryMode;
  players: GangPlayer[];
  devices: GangDevice[];
  /** Deterministic temporary facilitator; not a permanent host role. */
  facilitatorPlayerId: string | null;
}

export type GangRoomEvent =
  | {
      type: "PLAYER_JOIN";
      playerId: string;
      displayName: string;
      deviceId?: string;
      at: number;
    }
  | { type: "PLAYER_LEAVE"; playerId: string; at: number }
  | { type: "PLAYER_SEEN"; playerId: string; at: number }
  | { type: "DEVICE_JOIN"; device: GangDevice; at: number }
  | { type: "DEVICE_LEAVE"; deviceId: string; at: number }
  | { type: "SET_PHASE"; phase: GangRoomPhase; at: number };
