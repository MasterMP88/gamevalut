import { ECHO_TEMPLATES, SCENES } from "./scenes";
import { DETOURS, DIRECTOR_CUTS, MILESTONES, TEMPO_CUES, TEMPO_ORDER } from "./specials";
import { GAMES_BY_ID, poolFor } from "./games";
import { AUX_SIGNATURE_CADENCE } from "./music-scenes";
import { sameSong } from "@/lib/music/provider";
import type {
  MusicRound,
  TrackEntry,
  ConsentSettings,
  EchoKind,
  Flavor,
  PowerUp,
  GameId,
  MemoryAnchor,
  Scene,
  SessionState,
  Steer,
} from "./types";

export const MAX_ANCHOR_CHARS = 220;
export const BATTLE_CHAPTER = 10;
export const BATTLE_FINAL_SCENE = 40;
export const VAULT_THRESHOLD = 70;
/** Night Shift: a direction keeps steering this many scenes. */
export const STEER_MOMENTUM = 3;
/** After Dark: a tempo shift starts every N scenes and lasts TEMPO_LENGTH. */
export const TEMPO_EVERY = 5;
export const TEMPO_LENGTH = 3;
/** Night Shift: a detour every N scenes. */
export const DETOUR_EVERY = 7;
/** Night Shift: detours land every 7–11 scenes. */
export const DETOUR_JITTER = 5;
/** First Spark / After Dark: plain-QUESTION ceilings in rolling windows. */
export const SPARK_Q_WINDOW = 6;
export const SPARK_Q_MAX = 3;
export const KINETIC_Q_WINDOW = 8;
export const KINETIC_Q_MAX = 2;
/** Heatcheck: big lead gap doubles comeback help. */
export const COMEBACK_BIG_GAP = 10;
/** NIGHT//ECHO / Director: minimum scenes between two callbacks. */
export const ECHO_GAP = 5;
/** Director: Director Cuts at most every 8–12 scenes. */
export const CUT_MIN_GAP = 8;
/** Heatcheck: trailing by this many Sparks earns a comeback bonus. */
export const COMEBACK_GAP = 5;
/** Director rolling-10 target mix. */
export const DIRECTOR_MIX: { types: string[]; max: number; min: number }[] = [
  { types: ["QUESTION"], min: 2, max: 3 },
  { types: ["PREDICTION"], min: 1, max: 2 },
  { types: ["SYNC", "SECRET", "PRIVATE_SIGNAL"], min: 1, max: 2 },
  { types: ["TIMER", "MISSION"], min: 1, max: 3 },
  { types: ["CHOICE", "ROULETTE"], min: 1, max: 2 },
  { types: ["GLITCH", "ECHO"], min: 0, max: 2 },
];
/** Director pacing curve — deliberately not a straight heat ramp. */
const DIRECTOR_CURVE: Flavor[][] = [["funny"], ["game"], ["deep"], ["cheeky"], ["funny", "game"], ["deep"]];

export const DEFAULT_SETTINGS: ConsentSettings = {
  touch: false,
  sensual: false,
  drinks: false,
  signals: true,
  intensityCap: 3,
};

// ——— deterministic RNG
export function nextRand(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [r, (seed + 0x6d2b79f5) | 0];
}

export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** German genitive for arbitrary names: "Nova" → "Novas", "Jonas" → "Jonas’", "Max" → "Max’". */
export function genitive(name: string) {
  return /(s|ß|x|z|ce)$/i.test(name.trim()) ? `${name}’` : `${name}s`;
}

export function fill(text: string, me: string, you: string) {
  return text
    .replaceAll("{me}s", genitive(me))
    .replaceAll("{you}s", genitive(you))
    .replaceAll("{me}", me)
    .replaceAll("{you}", you);
}

export function allowedByConsent(s: Scene, set: ConsentSettings) {
  const f = s.flags ?? {};
  if (f.touch && !set.touch) return false;
  if ((f.sensual || s.flavor === "sensual") && !set.sensual) return false;
  if (f.drink && !set.drinks) return false;
  if (f.signal && !set.signals) return false;
  if (s.phase > set.intensityCap - 1) return false;
  return true;
}

export function maxPhase(state: SessionState) {
  let cap = state.settings.intensityCap - 1;
  if (!state.settings.sensual) cap = Math.min(cap, 2);
  return Math.max(0, cap);
}

export function targetPhase(state: SessionState) {
  if (state.afterHours) return maxPhase(state);
  return Math.min(Math.floor(state.heat), maxPhase(state));
}

const ARC_FLAVORS: Record<"classic" | "free" | "one-two", Flavor[][]> = {
  classic: [["funny"], ["funny", "cheeky"], ["cheeky", "game"], ["cheeky", "sensual"], ["sensual", "cheeky"]],
  free: [["funny", "game"], ["funny", "cheeky", "game"], ["deep", "cheeky", "game"], ["cheeky", "sensual", "deep"], ["sensual", "cheeky"]],
  "one-two": [["funny"], ["deep", "funny"], ["cheeky", "deep"], ["sensual", "cheeky"], ["sensual", "deep"]],
};

const STEER_FLAVORS: Record<Exclude<Steer, null>, Flavor[]> = {
  funnier: ["funny"],
  flirtier: ["cheeky"],
  game: ["game"],
  hotter: ["sensual", "cheeky"],
};

export function weakestEnergy(state: SessionState): Flavor[] {
  const { chaos, connection, heat } = state.energies;
  const min = Math.min(chaos, connection, heat);
  if (min === chaos) return ["funny", "game"];
  if (min === connection) return ["deep"];
  return state.settings.sensual ? ["cheeky", "sensual"] : ["cheeky"];
}

export function preferredFlavors(state: SessionState): Flavor[] {
  const game = GAMES_BY_ID[state.gameId];
  if (state.steer) return STEER_FLAVORS[state.steer];
  if (game.coop) return weakestEnergy(state);
  if (game.ai) {
    const f = DIRECTOR_CURVE[state.sceneNumber % DIRECTOR_CURVE.length]!;
    return targetPhase(state) >= 3 && state.settings.sensual && f.includes("cheeky") ? ["cheeky", "sensual"] : f;
  }
  return ARC_FLAVORS[game.arc][targetPhase(state)] ?? ["funny"];
}

function lastFlavor(state: SessionState): Flavor | null {
  return state.current?.flavor ?? null;
}

export function candidatePool(state: SessionState): Scene[] {
  const game = GAMES_BY_ID[state.gameId];
  return poolFor(game, SCENES).filter((s) => allowedByConsent(s, state.settings));
}

/** Score-based local picker. Pure given state.seed. */
export function pickLocal(state: SessionState): { scene: Scene; seed: number } {
  const game = GAMES_BY_ID[state.gameId];
  let seed = state.seed;
  let pool = candidatePool(state);

  // Battle: chapter showdowns
  if (game.battle) {
    const next = state.sceneNumber + 1;
    if ((next % Math.max(2, Math.round((state.targetScenes ?? BATTLE_FINAL_SCENE) / 4)) === 0 || next === state.targetScenes)) pool = pool.filter((s) => s.type === "SHOWDOWN");
    else pool = pool.filter((s) => s.type !== "SHOWDOWN" && !(s.type === "SECRET" && state.secretMission));
  }

  // Conversational recovery takes priority over scoring bonuses.
  if (game.id === "one-two" && state.current?.type === "QUESTION" && state.log.at(-1)?.type === "QUESTION") {
    const active = pool.filter((s) => s.type !== "QUESTION");
    if (active.length) pool = active;
  }
  // Unseen is a hard boundary. Scoring only orders candidates within that boundary.
  const already = new Set([...(state.seenIds ?? []), ...state.usedIds]);
  const unseen = pool.filter((s) => !already.has(s.id));
  if (unseen.length) pool = unseen;
  else {
    const notThisNight = pool.filter((s) => !state.usedIds.includes(s.id));
    if (notThisNight.length) pool = notThisNight;
    const order = [...(state.seenIds ?? []), ...state.usedIds];
    const oldest = Math.min(...pool.map((s) => order.lastIndexOf(s.id)));
    const oldestPool = pool.filter((s) => order.lastIndexOf(s.id) <= oldest + Math.max(2, Math.floor(pool.length / 5)));
    if (oldestPool.length) pool = oldestPool;
  }
  // PASS//THE AUX owns its rhythm: every fifth beat deliberately breaks the normal loop.
  // Planned final scenes prefer LAST TRACK so a timed night lands instead of merely stopping.
  if (game.id === "pass-the-aux") {
    const next = state.sceneNumber + 1;
    const finalBeat = !!state.targetScenes && next === state.targetScenes;
    if (finalBeat) {
      const finals = pool.filter((s) => s.music?.signature === "last-track");
      if (finals.length) pool = finals;
    } else if (next >= AUX_SIGNATURE_CADENCE && next % AUX_SIGNATURE_CADENCE === 0) {
      const signatures = pool.filter((s) => s.music?.signature && s.music.signature !== "last-track");
      if (signatures.length) pool = signatures;
    } else {
      const regular = pool.filter((s) => !s.music?.signature);
      if (regular.length) pool = regular;
      // Four regular beats deliberately change social rhythm before each signature beat:
      // instinct/identity → read → blind duel → open choice. If a mode's unseen
      // stock is exhausted, the unseen boundary wins and the broader regular pool remains.
      const slot = next % AUX_SIGNATURE_CADENCE;
      const directedModes =
        slot === 1
          ? ["speed", "solo"]
          : slot === 2
            ? ["guess"]
            : slot === 3
              ? ["duet"]
              : ["solo", "consensus", "guess"];
      const directed = pool.filter(
        (s) => s.music && directedModes.includes(s.music.mode),
      );
      if (directed.length) pool = directed;
    }
  } else if (state.sceneNumber % 3 === 0) {
    // Other games keep the general owned-signature cadence.
    const owned = pool.filter((s) => s.only?.length === 1 && s.only[0] === game.id);
    if (owned.length) pool = owned;
  }
  const tp = targetPhase(state);
  const prefer = preferredFlavors(state);
  const avoid = state.skipStreak >= 2 ? lastFlavor(state) : null;
  const recentTypes = state.log.slice(-2).map((l) => l.type);
  const last3 = state.log.slice(-3).map((l) => l.type);
  const last = state.log[state.log.length - 1];
  const lastScene = state.current;
  const mixCounts = game.ai ? typeCounts(state) : null;
  const recentAuxModes =
    game.id === "pass-the-aux"
      ? state.usedIds
          .slice(-3)
          .map((id) => SCENES.find((scene) => scene.id === id)?.music?.mode)
          .filter((mode): mode is NonNullable<typeof mode> => !!mode)
      : [];
  const auxPreferredModes =
    tp <= 0
      ? ["speed", "solo"]
      : tp === 1
        ? ["guess", "duet", "speed"]
        : tp === 2
          ? ["duet", "guess", "consensus"]
          : ["duet", "consensus", "solo"];

  let best: Scene | null = null;
  let bestScore = -Infinity;
  for (const s of pool) {
    let score = 0;
    score -= Math.abs(s.phase - tp) * 2.2;
    if (s.phase > tp + 1 && !state.afterHours) score -= 6;
    if (prefer.includes(s.flavor)) score += 4;
    if (avoid && s.flavor === avoid) score -= 6;
    if (state.usedIds.includes(s.id)) score -= 12;
    if (state.recentIds.includes(s.id)) score -= 40;
    if (recentTypes.includes(s.type) && s.type !== "QUESTION") score -= 2;
    if (game.id === "pass-the-aux" && s.music) {
      if (auxPreferredModes.includes(s.music.mode)) score += 5;
      const lastMode = recentAuxModes.at(-1);
      if (lastMode === s.music.mode) score -= 5;
      if (recentAuxModes.length >= 2 && recentAuxModes.slice(-2).every((mode) => mode === s.music!.mode)) score -= 30;
      // READ ME should appear early enough to teach the social read mechanic; consensus lands later.
      if (state.sceneNumber >= 2 && state.sceneNumber <= 6 && s.music.mode === "guess") score += 4;
      if (state.sceneNumber < 3 && s.music.mode === "consensus") score -= 12;
    }
    // ——— game-specific dramaturgy
    if (game.id === "roxy-after-dark") {
      if (s.type === "QUESTION" && qIn(state, SPARK_Q_WINDOW - 1) >= SPARK_Q_MAX) score -= 50;
      if (["CHOICE", "PREDICTION", "MISSION", "TIMER"].includes(s.type)) score += 1.5;
      // first 3 scenes: guarantee one movement beat and one playful beat
      if (state.sceneNumber < 3) {
        const hadMove = state.log.some((l) => l.type === "MISSION" || l.type === "TIMER") || ["MISSION", "TIMER"].includes(lastScene?.type ?? "");
        const hadPlay = state.log.some((l) => l.type !== "QUESTION") || (lastScene && lastScene.flavor === "funny");
        if (!hadMove && state.sceneNumber >= 1 && (s.type === "MISSION" || s.type === "TIMER")) score += 30;
        if (!hadPlay && s.flavor === "funny") score += 10;
        if (s.phase > 0) score -= 20;
      }
    }
    if (game.id === "after-dark-2") {
      if (s.type === "QUESTION" && qIn(state, KINETIC_Q_WINDOW - 1) >= KINETIC_Q_MAX) score -= 50;
      if (s.type === "QUESTION" && last3.includes("QUESTION")) score -= 50;
      if (state.tempo === "speed" && s.type === "TIMER") score += 6;
      if (state.tempo === "silent" && ["MISSION", "CHOICE", "SYNC", "TIMER"].includes(s.type)) score += 4;
      if (state.tempo === "swap" && ["CHOICE", "ROULETTE", "PREDICTION"].includes(s.type)) score += 4;
      if (state.tempo === "rule" && ["TIMER", "ROULETTE", "SYNC"].includes(s.type)) score += 4;
      if (state.tempo && s.type === "QUESTION") score -= 6;
    }
    if (game.id === "one-two" && lastScene) {
      if (s.type === "QUESTION" && last?.type === "QUESTION" && state.log[state.log.length - 2]?.type === "QUESTION") score -= 50;
      if (lastScene.flavor === "deep") score += s.flavor === "funny" ? 5 : s.flavor === "deep" ? -5 : 0;
      if (topicOf(s) && state.themes.filter((t) => t === topicOf(s)).length >= 2) score -= 6;
      if (lastScene.flavor === "sensual" || lastScene.flags?.sensual) {
        if (s.phase > lastScene.phase) score -= 8;
        if (s.flavor === "sensual") score -= 4;
      }
    }
    if (game.id === "night-echo" && s.capture && state.anchors.filter((a) => !a.used).length >= 3) score -= 3;
    if (mixCounts) {
      score += mixScore(s.type, mixCounts);
      if (sameTypeRun(state, s.type)) score -= 40;
    }
    if (state.steer && state.steerLeft > 0 && prefer.includes(s.flavor)) score += 3;
    if (state.steer === "game" && ["TIMER", "ROULETTE", "SYNC", "CHOICE", "PREDICTION", "GLITCH"].includes(s.type)) score += 3;
    let r: number;
    [r, seed] = nextRand(seed);
    score += r * 3.5;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  if (!best) best = SCENES.find((s) => s.type === "QUESTION" && s.phase === 0)!;
  return { scene: best, seed };
}

function qIn(state: SessionState, window: number) {
  const types = state.log.slice(-window).map((l) => l.type);
  return types.filter((t) => t === "QUESTION").length;
}

/** Director: true if picking `type` would make it 3 in a row. */
export function sameTypeRun(state: SessionState, type: string) {
  const l = state.log.slice(-2);
  return l.length === 2 && l.every((x) => x.type === type);
}

/** Lightweight topic of a scene, derived from authored tags/flavour — never from user answers. */
export function topicOf(s: Scene): string | null {
  return s.capture?.tags[0] ?? (s.flavor === "deep" ? "deep" : null);
}

function typeCounts(state: SessionState) {
  const c: Record<string, number> = {};
  for (const l of state.log.slice(-10)) c[l.type] = (c[l.type] ?? 0) + 1;
  return c;
}

function mixScore(type: string, counts: Record<string, number>) {
  const bucket = DIRECTOR_MIX.find((b) => b.types.includes(type));
  if (!bucket) return 0;
  const have = bucket.types.reduce((n, t) => n + (counts[t] ?? 0), 0);
  if (have >= bucket.max) return -8;
  if (have < bucket.min) return 4;
  return 0;
}

/** Types the Director should favour next (under-represented in the rolling 10). */
export function wantedTypes(state: SessionState): string[] {
  const counts = typeCounts(state);
  return DIRECTOR_MIX.filter((b) => b.min > 0 && b.types.reduce((n, t) => n + (counts[t] ?? 0), 0) < b.min).map((b) => b.types[0]!);
}

/** Director: an AI scene is rejected if its format is already saturated in the rolling 10. */
export function overMix(state: SessionState, type: string) {
  const bucket = DIRECTOR_MIX.find((b) => b.types.includes(type));
  if (!bucket) return false;
  const counts = typeCounts(state);
  return bucket.types.reduce((n, t) => n + (counts[t] ?? 0), 0) >= bucket.max;
}

export function echoKind(tags: string[], flavor: Flavor): EchoKind {
  if (tags.includes("prediction")) return "prediction";
  if (tags.some((t) => ["ritual", "rule", "slogan", "word", "motto"].includes(t))) return "ritual";
  if (tags.some((t) => ["plan", "future", "promise", "place", "dream", "wish"].includes(t))) return "future";
  if (tags.some((t) => ["spark", "touch"].includes(t)) || flavor === "cheeky" || flavor === "sensual") return "flirty";
  if (tags.some((t) => ["memory", "trait", "habit", "confession", "origin"].includes(t)) || flavor === "deep") return "emotional";
  return "funny";
}

export function dueAnchor(state: SessionState): MemoryAnchor | null {
  const game = GAMES_BY_ID[state.gameId];
  if (!game.memory) return null;
  const next = state.sceneNumber + 1;
  if (state.lastEchoAt > 0 && next - state.lastEchoAt < ECHO_GAP) return null;
  return state.anchors.find((a) => a.sensitivity === "normal" && !a.used && a.dueAt <= next) ?? null;
}

export function buildEcho(anchor: MemoryAnchor, players: [string, string]): Scene {
  if (anchor.sensitivity !== "normal") throw new Error("Private memories cannot become echoes");
  const other = players[0] === anchor.owner ? players[1] : players[0];
  const kind = anchor.kind ?? "funny";
  const matching = ECHO_TEMPLATES.filter((e) => e.kind === kind);
  const pool = matching.length ? matching : ECHO_TEMPLATES.filter((e) => e.kind === "emotional");
  const tpl = pool[hashStr(anchor.id) % pool.length] ?? ECHO_TEMPLATES[0]!;
  const short = anchor.shortText.length > 90 ? `${anchor.shortText.slice(0, 88)}…` : anchor.shortText;
  return {
    id: `echo-${anchor.id}`,
    type: "ECHO",
    flavor: tpl.kind === "flirty" ? "cheeky" : tpl.kind === "emotional" || tpl.kind === "future" ? "deep" : tpl.kind === "ritual" ? "game" : "funny",
    cue: tpl.kind === "future" ? "Echo · ein Plan von vorhin" : tpl.kind === "prediction" ? "Echo · Wiedervorlage" : tpl.kind === "ritual" ? "Echo · euer Ritual" : "Echo · das habt ihr vorhin gesagt",
    phase: 1,
    title: "Echo",
    emoji: "〰️",
    prompt: tpl.prompt
      .replaceAll("{owner}", anchor.owner)
      .replaceAll("{other}", other)
      .replaceAll("{text}", short)
      .replaceAll("{scene}", String(anchor.sceneNumber)),
    anchorId: anchor.id,
    source: "echo",
  };
}

export function createSession(gameId: GameId, players: [string, string], settings: ConsentSettings, seed = Date.now() % 100000, options: { seenIds?: string[]; durationMinutes?: 15 | 30 | 60 | null; now?: number } = {}): SessionState {
  const base: SessionState = {
    gameId,
    seenIds: options.seenIds ?? [],
    durationMinutes: options.durationMinutes ?? null,
    targetScenes: options.durationMinutes ? ({ 15: 10, 30: 20, 60: 40 } as const)[options.durationMinutes] : null,
    startedAt: options.now ?? Date.now(),
    elapsedMs: 0,
    players,
    turn: 0,
    sceneNumber: 0,
    heat: 0,
    skipStreak: 0,
    skipCount: 0,
    steer: null,
    settings,
    current: null,
    recentIds: [],
    usedIds: [],
    log: [],
    anchors: [],
    energies: { chaos: 0, connection: 0, heat: 0 },
    sparks: [0, 0],
    streaks: [0, 0],
    powerUps: [0, 0],
    doubleNext: false,
    secretMission: null,
    aiQueue: [],
    finished: false,
    afterHours: false,
    ending: null,
    seed,
    steerLeft: 0,
    tempo: null,
    tempoLeft: 0,
    pairQueue: [],
    lastEchoAt: 0,
    lastCutAt: 0,
    milestones: [],
    raise: false,
    rebound: null,
    read: null,
    lastDetourAt: 0,
    themes: [],
    tracklist: [],
    musicRound: null,
  };
  return advance(base);
}

/** Move to next scene (turn flips except on first scene). */
export function advance(state: SessionState): SessionState {
  const game = GAMES_BY_ID[state.gameId];
  if (state.current && !state.afterHours && ((state.targetScenes && state.sceneNumber >= state.targetScenes) || (state.durationMinutes && (state.elapsedMs ?? 0) >= state.durationMinutes * 60000))) return { ...state, finished: true };
  const first = state.current === null;
  const turn = first ? state.turn : ((1 - state.turn) as 0 | 1);
  const next = state.sceneNumber + 1;

  // steering momentum decays per scene
  let steer = state.steer;
  let steerLeft = state.steerLeft;
  if (!first && steer && game.steering) {
    steerLeft = Math.max(0, steerLeft - 1);
    if (steerLeft === 0) steer = null;
  }

  // After Dark tempo shifts
  let tempo = state.tempo;
  let tempoLeft = state.tempoLeft;
  if (game.id === "after-dark-2") {
    if (tempo) tempoLeft -= 1;
    if (tempoLeft <= 0) tempo = null;
    if (next % TEMPO_EVERY === 0) {
      tempo = TEMPO_ORDER[(next / TEMPO_EVERY - 1) % TEMPO_ORDER.length]!;
      tempoLeft = TEMPO_LENGTH;
    }
  }

  const s1: SessionState = { ...state, turn, steer, steerLeft, tempo, tempoLeft };

  let scene: Scene | null = null;
  let seed = state.seed;
  let aiQueue = state.aiQueue;
  let anchors = state.anchors;
  let pairQueue = state.pairQueue;
  let lastEchoAt = state.lastEchoAt;
  let lastCutAt = state.lastCutAt;
  let milestones = state.milestones;
  // Editorial detours/cuts are new content too. When their small bank has been
  // seen, use the main deck instead of injecting the same special every night.
  const usable = (sc: Scene) => allowedByConsent(sc, state.settings) && !state.usedIds.includes(sc.id) && !(state.seenIds ?? []).includes(sc.id);

  // 1) US//AFTER DARK milestones
  if (game.coop) {
    const ms = MILESTONES.find((m) => !milestones.includes(m.id) && m.when(state.energies));
    if (ms) {
      scene = ms.scene(state.energies);
      milestones = [...milestones, ms.id];
    }
  }
  // 2) memory echoes
  if (!scene) {
    const echo = dueAnchor(s1);
    if (echo) {
      scene = buildEcho(echo, state.players);
      anchors = anchors.map((a) => (a.id === echo.id ? { ...a, used: true } : a));
      lastEchoAt = next;
    }
  }
  // 3) ONE//TWO return questions
  if (!scene && game.id === "one-two") {
    const twoQ = state.log.slice(-2).filter((l) => l.type === "QUESTION").length === 2;
    const due = twoQ ? undefined : pairQueue.find((pq) => pq.dueAt <= next && pq.owner !== turn);
    const orig = due && SCENES.find((x) => x.id === due.sceneId);
    if (due && orig && allowedByConsent(orig, state.settings)) {
      scene = { ...orig, id: `pair-${orig.id}`, title: "Zurückgespielt", cue: `Vor ein paar Szenen hat ${state.players[due.owner]} das beantwortet. Jetzt du.` };
    }
    if (due) pairQueue = pairQueue.filter((pq) => pq !== due);
  }
  // 4) Director Cuts
  if (!scene && game.ai && next >= 6 && next - state.lastCutAt >= CUT_MIN_GAP + (Math.abs(state.seed) % 5)) {
    const cut = DIRECTOR_CUTS.find(usable);
    if (cut) {
      scene = cut;
      lastCutAt = next;
    }
  }
  // 5) Night Shift detours
  let lastDetourAt = state.lastDetourAt;
  if (!scene && game.id === "roxy-night" && next - state.lastDetourAt >= DETOUR_EVERY + (hashStr(String(state.lastDetourAt)) % DETOUR_JITTER)) {
    const options = DETOURS.filter(usable);
    if (options.length) {
      const [r, sd] = nextRand(seed);
      seed = sd;
      scene = { ...options[Math.floor(r * options.length)]!, cue: "Umweg · die Nacht biegt kurz ab" };
      lastDetourAt = next;
    }
  }
  // 6) Director queue, then local picker
  if (!scene) {
    const aiIdx = game.ai ? aiQueue.findIndex((x) => allowedByConsent(x, state.settings) && !state.recentIds.includes(x.id) && !overMix(state, x.type) && !sameTypeRun(state, x.type)) : -1;
    if (aiIdx >= 0) {
      scene = aiQueue[aiIdx]!;
      aiQueue = aiQueue.filter((_, i) => i !== aiIdx);
    } else {
      const picked = pickLocal(s1);
      scene = picked.scene;
      seed = picked.seed;
    }
  }
  if (tempo && !scene.cue) {
    scene = {
      ...scene,
      cue: TEMPO_CUES[tempo],
      ...(tempo === "speed" && scene.duration ? { duration: Math.max(10, Math.round(scene.duration / 2)) } : {}),
    };
  }

  return {
    ...s1,
    seed,
    aiQueue,
    anchors,
    pairQueue,
    lastEchoAt,
    lastCutAt,
    lastDetourAt,
    milestones,
    themes: game.id === "one-two" && topicOf(scene) ? [...state.themes, topicOf(scene)!].slice(-20) : state.themes,
    current: scene,
    sceneNumber: next,
    recentIds: [...state.recentIds, scene.id].slice(-30),
    usedIds: state.usedIds.includes(scene.id) ? state.usedIds : [...state.usedIds, scene.id],
  };
}

function logCurrent(state: SessionState, outcome: "done" | "skipped") {
  if (!state.current) return state.log;
  return [
    ...state.log,
    { n: state.sceneNumber, title: state.current.title, type: state.current.type, player: state.players[state.turn], outcome },
  ];
}

export function energyGain(flavor: Flavor) {
  switch (flavor) {
    case "funny":
    case "game":
      return { chaos: 12, connection: 2, heat: 0 };
    case "deep":
      return { chaos: 0, connection: 12, heat: 2 };
    case "cheeky":
      return { chaos: 4, connection: 2, heat: 9 };
    case "sensual":
      return { chaos: 0, connection: 4, heat: 12 };
  }
}

export function vaultUnlocked(state: SessionState) {
  const e = state.energies;
  return state.milestones.length >= MILESTONES.length && e.chaos >= VAULT_THRESHOLD && e.connection >= VAULT_THRESHOLD && e.heat >= VAULT_THRESHOLD;
}

export type Action =
  | { type: "DONE"; capture?: { text: string; private: boolean }; syncMatch?: boolean }
  | { type: "SKIP" }
  | { type: "STEER"; steer: Steer }
  | { type: "SETTINGS"; settings: ConsentSettings }
  | { type: "DELETE_ANCHOR"; id: string }
  | { type: "CLEAR_ANCHORS" }
  | { type: "SHOWDOWN_WIN"; winner: 0 | 1 | null; missionDone?: boolean }
  | { type: "USE_POWERUP"; kind?: PowerUp }
  | { type: "AI_SCENES"; scenes: Scene[] }
  | { type: "TICK"; elapsedMs: number }
  | { type: "FINISH" }
  | { type: "ENDING"; ending: SessionState["ending"] }
  | { type: "AFTER_HOURS" }
  | { type: "MUSIC"; round: MusicRound };

/** Replace the current scene without flipping turn or counting a scene. */
function reroll(state: SessionState): SessionState {
  return advance({ ...state, turn: (1 - state.turn) as 0 | 1, sceneNumber: state.sceneNumber - 1 });
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** PASS//THE AUX: picks of the finished round, in reveal order. Only user-entered songs. */
export function roundTracks(state: SessionState): TrackEntry[] {
  const r = state.musicRound;
  const scene = state.current;
  if (!r || !scene || scene.type !== "MUSIC" || r.sceneNumber !== state.sceneNumber) return [];
  const mode = scene.music?.mode ?? "solo";
  const prompt = fill(scene.prompt, state.players[state.turn], state.players[1 - state.turn]!);
  const owners: (0 | 1)[] = [state.turn, (1 - state.turn) as 0 | 1];
  const out: TrackEntry[] = [];
  r.picks.forEach((t, i) => {
    const title = t?.title.trim().slice(0, 80);
    if (!t || !title) return;
    if (i === 1 && mode !== "duet") return;
    const artist = t.artist?.trim().slice(0, 60) || undefined;
    const reaction =
      r.reaction ??
      (mode === "duet" && sameSong(r.picks[0], r.picks[1]) ? "match" : null);
    out.push({
      ...t,
      title,
      artist,
      n: state.sceneNumber,
      owner: owners[i]!,
      prompt,
      mode,
      ...(scene.music?.signature ? { signature: scene.music.signature } : {}),
      ...(reaction ? { reaction } : {}),
    });
  });
  return out;
}

export function reducer(state: SessionState, action: Action): SessionState {
  if (action.type === "TICK") {
    if (state.finished || !Number.isFinite(action.elapsedMs) || action.elapsedMs <= 0) return state;
    return { ...state, elapsedMs: (state.elapsedMs ?? 0) + Math.min(11000, action.elapsedMs) };
  }
  if (action.type === "MUSIC") {
    if (state.current?.type !== "MUSIC" || action.round.sceneNumber !== state.sceneNumber || state.finished) return state;
    return { ...state, musicRound: action.round };
  }
  const pre = action.type === "DONE" && state.current?.type === "MUSIC" ? { ...state, tracklist: [...(state.tracklist ?? []), ...roundTracks(state)] } : state;
  const next = coreReducer(pre, action);
  if (next.current?.id !== state.current?.id || next.sceneNumber !== state.sceneNumber || next.finished !== state.finished) return { ...next, musicRound: null };
  return next;
}

function coreReducer(state: SessionState, action: Action): SessionState {
  const game = GAMES_BY_ID[state.gameId];
  switch (action.type) {
    case "MUSIC":
    case "TICK":
      return state;
    case "DONE": {
      const scene = state.current;
      if (!scene) return state;
      let next: SessionState = { ...state, log: logCurrent(state, "done"), skipStreak: 0 };
      next.heat = clamp(state.heat + (state.steer === "hotter" ? 0.55 : state.targetScenes ? Math.max(0.1, 4 / state.targetScenes) : 0.32), 0, 4.99);

      // memory capture
      const text = action.capture?.text.trim().slice(0, MAX_ANCHOR_CHARS);
      if (game.memory && text && text.length >= 2) {
        const id = `a${state.sceneNumber}-${hashStr(text) % 10000}`;
        const sensitive = action.capture!.private || scene.flavor === "sensual" || !!scene.flags?.sensual;
        next.anchors = [
          ...state.anchors,
          {
            id,
            owner: state.players[state.turn],
            shortText: text,
            tags: scene.capture?.tags ?? [],
            sceneNumber: state.sceneNumber,
            sensitivity: sensitive ? "high" : "normal",
            dueAt: state.sceneNumber + 5 + (hashStr(text) % 4),
            used: false,
            kind: echoKind(scene.capture?.tags ?? [], scene.flavor),
          },
        ];
      }

      // ONE//TWO: schedule a delayed return of this question to the other player
      if (game.id === "one-two" && scene.type === "QUESTION" && !scene.id.startsWith("pair-") && hashStr(scene.id + state.seed) % 3 === 0 && state.pairQueue.length < 2) {
        next.pairQueue = [...state.pairQueue, { sceneId: scene.id, owner: state.turn, dueAt: state.sceneNumber + 4 + (hashStr(scene.id) % 7) }];
      }

      if (game.coop) {
        const g = energyGain(scene.flavor);
        const bonus = action.syncMatch ? 8 : 0;
        next.energies = {
          chaos: clamp(state.energies.chaos + g.chaos, 0, 100),
          connection: clamp(state.energies.connection + g.connection + bonus, 0, 100),
          heat: clamp(state.energies.heat + g.heat, 0, 100),
        };
        // In a timed night the Vault is earned early, then awaits the agreed
        // closing beat. Open-ended co-op retains its goal-based ending.
        if (!state.targetScenes && vaultUnlocked(next) && !vaultUnlocked(state)) return { ...next, finished: true };
      }

      if (game.battle) {
        const p = state.turn;
        const base = (scene.sparks ?? 1) * (state.doubleNext ? 2 : 1);
        const streak = state.streaks[p] + 1;
        const lead = state.sparks[(1 - p) as 0 | 1] - state.sparks[p];
        const bonus = (streak >= 3 ? 1 : 0) + (lead >= COMEBACK_BIG_GAP ? 2 : lead >= COMEBACK_GAP ? 1 : 0);
        const sparks = [...state.sparks] as [number, number];
        const before = sparks[p];
        sparks[p] += base + bonus;
        // READ pays out when the opponent completes the scene the reader bet on
        if (state.read !== null && state.read !== p) sparks[state.read] += 2;
        const streaks = [...state.streaks] as [number, number];
        streaks[p] = streak >= 3 ? 0 : streak;
        const powerUps = [...state.powerUps] as [number, number];
        if (Math.floor(sparks[p] / 6) > Math.floor(before / 6)) powerUps[p] += 1;
        next = { ...next, sparks, streaks, powerUps, doubleNext: false, rebound: null, read: state.read === p ? state.read : null };
        if (scene.type === "SECRET") next.secretMission = { player: p, text: scene.prompt };
        if (state.sceneNumber >= (state.targetScenes ?? BATTLE_FINAL_SCENE)) return { ...next, finished: true };
      }
      return advance(next);
    }
    case "SKIP": {
      const streak = state.skipStreak + 1;
      const next: SessionState = {
        ...state,
        log: logCurrent(state, "skipped"),
        skipStreak: streak,
        skipCount: state.skipCount + 1,
        heat: clamp(state.heat - (streak >= 2 ? 0.8 : 0.25), 0, 4.99),
        steer: streak >= 3 ? null : state.steer,
        doubleNext: false,
      };
      if (game.battle) {
        const streaks = [...state.streaks] as [number, number];
        // A skipped optional scene leaves both players' earned progress intact.
        next.streaks = streaks;
        next.rebound = null;
        if (state.read !== null && state.read !== state.turn) next.read = null;
      }
      return advance(next);
    }
    case "STEER":
      return { ...state, steer: action.steer, steerLeft: action.steer ? STEER_MOMENTUM : 0, heat: action.steer === "hotter" ? clamp(state.heat + 0.6, 0, 4.99) : state.heat };
    case "SETTINGS": {
      const next = { ...state, settings: action.settings };
      if (next.current && next.current.source !== "echo" && !allowedByConsent(next.current, action.settings)) return reroll(next);
      return next;
    }
    case "DELETE_ANCHOR": {
      const next = { ...state, anchors: state.anchors.filter((a) => a.id !== action.id) };
      return state.current?.anchorId === action.id ? reroll(next) : next;
    }
    case "CLEAR_ANCHORS": {
      const clean = { ...state, anchors: [] };
      return state.current?.anchorId ? reroll(clean) : clean;
    }
    case "SHOWDOWN_WIN": {
      const sparks = [...state.sparks] as [number, number];
      if (action.winner !== null) sparks[action.winner] += state.raise ? 6 : 3;
      let secretMission = state.secretMission;
      if (action.missionDone && secretMission) {
        sparks[secretMission.player] += 2;
      }
      if (secretMission) secretMission = null;
      const next = { ...state, sparks, secretMission, raise: false, log: logCurrent(state, "done") };
      if (state.sceneNumber >= (state.targetScenes ?? BATTLE_FINAL_SCENE)) return { ...next, finished: true };
      return advance(next);
    }
    case "USE_POWERUP": {
      const p = state.turn;
      const kind: PowerUp = action.kind ?? "double";
      if (state.powerUps[p] < 1) return state;
      const showdown = state.current?.type === "SHOWDOWN";
      if (kind === "double" && (state.doubleNext || showdown)) return state;
      if (kind === "raise" && (state.raise || !showdown)) return state;
      if (kind === "rebound" && (showdown || state.rebound !== null)) return state;
      if (kind === "read" && (showdown || state.read !== null)) return state;
      const powerUps = [...state.powerUps] as [number, number];
      powerUps[p] -= 1;
      if (kind === "raise") return { ...state, powerUps, raise: true };
      // REBOUND: the same scene goes to the opponent, no new scene drawn
      if (kind === "rebound") return { ...state, powerUps, rebound: p, turn: (1 - p) as 0 | 1 };
      // READ: bet that the opponent completes their next scene
      if (kind === "read") return { ...state, powerUps, read: p };
      return { ...state, powerUps, doubleNext: true };
    }
    case "AI_SCENES": {
      const known = new Set([...state.usedIds, ...state.aiQueue.map((s) => s.id)]);
      const fresh = action.scenes.filter((s) => !known.has(s.id));
      return { ...state, aiQueue: [...state.aiQueue, ...fresh].slice(-6) };
    }
    case "FINISH":
      return { ...state, finished: true };
    case "ENDING":
      return { ...state, ending: action.ending };
    case "AFTER_HOURS":
      return advance({ ...state, finished: false, ending: null, afterHours: true, heat: Math.max(state.heat, 3) });
  }
}

// ——— Night Signature
export function nightSignature(state: SessionState) {
  const done = state.log.filter((l) => l.outcome === "done").length;
  const counts: Record<string, number> = {};
  for (const id of state.usedIds) {
    const sc = SCENES.find((s) => s.id === id);
    if (sc) counts[sc.flavor] = (counts[sc.flavor] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  let name = "Unfinished Story";
  let line = "Ihr habt gerade erst angefangen. Das Beste kommt noch.";
  if (done >= 6) {
    if (top === "sensual") [name, line] = ["Slow Burn", "Langsam, warm, und noch lange nicht vorbei."];
    else if (top === "cheeky") [name, line] = ["Magnetic", "Ihr zieht euch an, auch wenn ihr es leugnet."];
    else if (top === "deep") [name, line] = ["Our Frequency", "Ihr hört Dinge, die sonst niemand hört."];
    else [name, line] = ["Beautiful Trouble", "Chaos mit Stil. Genau eure Sorte."];
  }
  const seenText = new Set<string>();
  const callbacks = state.anchors
    .filter((a) => a.sensitivity === "normal")
    .reverse()
    .filter((a) => {
      const k = a.shortText.trim().toLowerCase();
      if (seenText.has(k)) return false;
      seenText.add(k);
      return true;
    })
    .slice(0, 3)
    .reverse();
  return { name, line, callbacks, done };
}

export function battleWinner(state: SessionState): 0 | 1 | null {
  if (state.sparks[0] === state.sparks[1]) return null;
  return state.sparks[0] > state.sparks[1] ? 0 : 1;
}

// ——— AI context (minimal + sanitized)
export function sanitize(text: string, max = 120) {
  return text.replace(/[\u0000-\u001f<>{}`]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function buildDirectorContext(state: SessionState) {
  return {
    players: state.players,
    currentPlayer: state.players[state.turn],
    sceneNumber: state.sceneNumber,
    phase: targetPhase(state),
    consent: { ...state.settings },
    steer: state.steer,
    recent: state.log.slice(-5).map((l) => `${l.type}: ${sanitize(l.title, 60)} (${l.outcome})`),
    anchors: state.anchors
      .filter((a) => a.sensitivity === "normal")
      .slice(-6)
      .map((a) => ({ id: a.id, owner: a.owner, text: sanitize(a.shortText, 120) })),
    recentTypes: state.log.slice(-10).map((l) => l.type),
    wantTypes: wantedTypes(state),
    intensityCap: state.settings.intensityCap,
    skipCount: state.skipCount,
  };
}
export type DirectorContext = ReturnType<typeof buildDirectorContext>;
