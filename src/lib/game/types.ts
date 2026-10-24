export type SceneType =
  | "QUESTION"
  | "MISSION"
  | "TIMER"
  | "CHOICE"
  | "ROULETTE"
  | "SECRET"
  | "SYNC"
  | "ECHO"
  | "GLITCH"
  | "PRIVATE_SIGNAL"
  | "SHOWDOWN"
  | "PREDICTION"
  /** PASS//THE AUX: a song is the answer (see MusicRound). */
  | "MUSIC";

/** funny = Lustig, deep = Tief, cheeky = Frech, sensual = Sinnlich, game = Spiel */
export type Flavor = "funny" | "deep" | "cheeky" | "sensual" | "game";

export type GameId =
  | "roxy-after-dark"
  | "after-dark-2"
  | "roxy-night"
  | "battle"
  | "coop"
  | "one-two"
  | "night-echo"
  | "ai-director"
  | "pass-the-aux";

export interface SceneFlags {
  touch?: boolean;
  sensual?: boolean;
  drink?: boolean;
  signal?: boolean;
}

export interface Scene {
  id: string;
  type: SceneType;
  flavor: Flavor;
  /** 0..4 — First Signal, Mischief, Patterns, Magnetic, After Hours */
  phase: number;
  title: string;
  /** Uses {me} (current player) and {you} (partner) placeholders. */
  prompt: string;
  helper?: string | undefined;
  emoji?: string | undefined;
  duration?: number | undefined;
  choices?: string[] | undefined;
  flags?: SceneFlags | undefined;
  capture?: { label: string; tags: string[] } | undefined;
  /** Optional: restrict to games. Default: all non-battle games that accept the type. */
  only?: GameId[] | undefined;
  sparks?: number | undefined;
  /** Set on generated echo scenes */
  anchorId?: string | undefined;
  /** One-line contextual cue shown above the scene (tempo shift, Director Cut, return question). Never model reasoning. */
  cue?: string | undefined;
  /** MUSIC scenes: which round pattern. */
  music?: { mode: MusicMode } | undefined;
  /** Source marker */
  source?: "local" | "ai" | "echo" | undefined;
}

export interface ConsentSettings {
  touch: boolean;
  sensual: boolean;
  drinks: boolean;
  signals: boolean;
  /** 1..5 */
  intensityCap: number;
}

export type Steer = "funnier" | "flirtier" | "game" | "hotter" | null;

export interface MemoryAnchor {
  id: string;
  owner: string;
  shortText: string;
  tags: string[];
  sceneNumber: number;
  sensitivity: "normal" | "high";
  dueAt: number;
  used: boolean;
  /** Callback flavour, derived from capture tags. */
  kind?: EchoKind | undefined;
}

export type EchoKind = "funny" | "emotional" | "flirty" | "future" | "prediction" | "ritual";
export type Tempo = "speed" | "silent" | "swap" | "rule";
export type PowerUp = "double" | "raise" | "rebound" | "read";

export interface Energies {
  chaos: number;
  connection: number;
  heat: number;
}

export interface LogEntry {
  n: number;
  title: string;
  type: SceneType;
  player: string;
  outcome: "done" | "skipped";
}

export interface SessionState {
  gameId: GameId;
  players: [string, string];
  turn: 0 | 1;
  sceneNumber: number;
  heat: number;
  skipStreak: number;
  skipCount: number;
  steer: Steer;
  settings: ConsentSettings;
  current: Scene | null;
  recentIds: string[];
  usedIds: string[];
  log: LogEntry[];
  anchors: MemoryAnchor[];
  energies: Energies;
  sparks: [number, number];
  streaks: [number, number];
  powerUps: [number, number];
  doubleNext: boolean;
  secretMission: { player: 0 | 1; text: string } | null;
  aiQueue: Scene[];
  finished: boolean;
  afterHours: boolean;
  ending: "slow-burn" | "beautiful-chaos" | "no-more-game" | null;
  seed: number;
  /** Night Shift / Director: scenes a chosen direction keeps steering. */
  steerLeft: number;
  /** After Dark tempo shift */
  tempo: Tempo | null;
  tempoLeft: number;
  /** ONE//TWO delayed return questions */
  pairQueue: { sceneId: string; dueAt: number; owner: 0 | 1 }[];
  lastEchoAt: number;
  lastCutAt: number;
  /** US//AFTER DARK shared milestones reached */
  milestones: string[];
  /** Heatcheck: next showdown worth double */
  raise: boolean;
  /** Heatcheck REBOUND: the current scene was sent back; skipping it pays the sender. */
  rebound: 0 | 1 | null;
  /** Heatcheck READ: player betting the opponent completes their next scene. */
  read: 0 | 1 | null;
  /** Night Shift: scene number of the last detour. */
  lastDetourAt: number;
  /** ONE//TWO: topics already touched this session (from scene tags, never from answers). */
  themes: string[];
  /** PASS//THE AUX: songs picked this session. Session-local only — never saved remotely. */
  tracklist?: TrackEntry[];
  /** PASS//THE AUX: in-flight round, kept in state so remounts never re-expose a hidden pick. */
  musicRound?: MusicRound | null;
}

export type MusicMode = "solo" | "duet" | "guess" | "speed";
export type MusicReaction = "match" | "twist" | "explains";

/** User-entered song (or, later, real provider data). Never invented by the app. */
export interface Track {
  title: string;
  artist?: string | undefined;
  /** Only set when a real provider returned this track. */
  providerId?: string | undefined;
  artworkUrl?: string | undefined;
  /** Exact Apple Music song URL, only when returned by the catalog. */
  externalUrl?: string | undefined;
}

export interface TrackEntry extends Track {
  n: number;
  owner: 0 | 1;
  prompt: string;
  mode: MusicMode;
  reaction?: MusicReaction | undefined;
}

/**
 * Stages: pick (current player) → handoff → second (partner picks / predicts) → reveal.
 * Solo/guess/duet always pass a handoff; speed reveals straight away (nothing is hidden).
 */
export interface MusicRound {
  sceneNumber: number;
  stage: "pick" | "handoff" | "second" | "reveal";
  picks: [Track | null, Track | null];
  prediction: string | null;
  reaction: MusicReaction | null;
}