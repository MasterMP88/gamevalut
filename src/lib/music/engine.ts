import { MUSIC_PROMPTS, promptsFor } from "./prompts";
import type {
  MusicAction,
  MusicReaction,
  MusicRound,
  MusicRoundType,
  MusicState,
  MusicVibe,
  TrackPick,
} from "@/lib/game/types";

const ROUND_PATTERN: readonly MusicRoundType[] = ["SOLO", "DUET", "GUESS", "SPEED", "DUET", "SOLO", "GUESS", "SPEED"];
export const MUSIC_VIBES: readonly MusicVibe[] = ["Nostalgisch", "Guilty Pleasure", "Gefährlich gut", "Komplett unerwartet"];
export const MUSIC_REACTIONS: readonly MusicReaction[] = ["Match", "Plot Twist", "Das erklärt einiges"];

function stepSeed(seed: number): number {
  return (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
}

function pickPrompt(type: MusicRoundType, used: string[], seed: number) {
  const pool = promptsFor(type);
  const available = pool.filter((p) => !used.includes(p.id));
  const source = available.length ? available : pool;
  const next = stepSeed(seed);
  return { prompt: source[next % source.length]!, seed: next };
}

function makeRound(type: MusicRoundType, used: string[], seed: number, roundNumber: number): { round: MusicRound; seed: number } {
  const selected = pickPrompt(type, used, seed);
  return {
    round: {
      id: `music-round-${roundNumber}-${selected.prompt.id}`,
      type,
      promptId: selected.prompt.id,
      prompt: selected.prompt.text,
      ...(type === "SPEED" ? { speedSeconds: 25 } : {}),
    },
    seed: selected.seed,
  };
}

export function createMusicState(seed = Date.now() % 100000): MusicState {
  const first = makeRound("SOLO", [], seed, 1);
  return {
    roundNumber: 1,
    primary: 0,
    round: first.round,
    stage: "pick",
    picks: [],
    prediction: null,
    reaction: null,
    tracklist: [],
    usedPromptIds: [first.round.promptId],
    recentTypes: ["SOLO"],
    seed: first.seed,
  };
}

function nextRound(state: MusicState): MusicState {
  const roundNumber = state.roundNumber + 1;
  let type = ROUND_PATTERN[(roundNumber - 1) % ROUND_PATTERN.length]!;
  const last = state.recentTypes.slice(-2);
  if (last.length === 2 && last[0] === type && last[1] === type) {
    type = ROUND_PATTERN[roundNumber % ROUND_PATTERN.length]!;
  }
  const made = makeRound(type, state.usedPromptIds, state.seed, roundNumber);
  return {
    ...state,
    roundNumber,
    primary: (1 - state.primary) as 0 | 1,
    round: made.round,
    stage: "pick",
    picks: [],
    prediction: null,
    reaction: null,
    usedPromptIds: [...state.usedPromptIds, made.round.promptId].slice(-MUSIC_PROMPTS.length),
    recentTypes: [...state.recentTypes, type].slice(-8),
    seed: made.seed,
  };
}

function makePick(state: MusicState, player: 0 | 1, title: string, artist?: string): TrackPick | null {
  const t = title.trim().slice(0, 120);
  if (!t) return null;
  const a = artist?.trim().slice(0, 120);
  return {
    title: t,
    ...(a ? { artist: a } : {}),
    player,
    promptId: state.round.promptId,
    prompt: state.round.prompt,
    round: state.roundNumber,
  };
}

export function musicActor(state: MusicState): 0 | 1 {
  if (state.round.type === "DUET" && state.stage === "pick-second") return (1 - state.primary) as 0 | 1;
  if (state.round.type === "GUESS" && state.stage === "predict") return (1 - state.primary) as 0 | 1;
  if (state.stage === "handoff") return (1 - state.primary) as 0 | 1;
  return state.primary;
}

export function completedCurrentPicks(state: MusicState): TrackPick[] {
  return state.stage === "reveal" || state.stage === "reaction" ? state.picks : [];
}

export function visibleTracklist(state: MusicState): TrackPick[] {
  return [...state.tracklist, ...completedCurrentPicks(state)];
}

function commitAndNext(state: MusicState): MusicState {
  const committed = completedCurrentPicks(state);
  return nextRound({ ...state, tracklist: [...state.tracklist, ...committed] });
}

export type MusicAction =
  | { type: "MUSIC_SEAL"; title: string; artist?: string }
  | { type: "MUSIC_HANDOFF" }
  | { type: "MUSIC_PREDICT"; vibe: MusicVibe }
  | { type: "MUSIC_REACT"; reaction: MusicReaction }
  | { type: "MUSIC_NEXT" }
  | { type: "MUSIC_SKIP" }
  | { type: "MUSIC_CONTINUE" };

export function isMusicAction(action: { type: string }): action is MusicAction {
  return action.type.startsWith("MUSIC_");
}

export function musicReducer(state: MusicState, action: MusicAction): MusicState {
  switch (action.type) {
    case "MUSIC_SEAL": {
      const actor = musicActor(state);
      const pick = makePick(state, actor, action.title, action.artist);
      if (!pick) return state;

      if (state.round.type === "DUET" && state.stage === "pick-second") {
        return { ...state, picks: [...state.picks, pick], stage: "reveal" };
      }

      if (state.stage !== "pick") return state;
      if (state.round.type === "SPEED") return { ...state, picks: [pick], stage: "reveal" };
      return { ...state, picks: [pick], stage: "handoff" };
    }
    case "MUSIC_HANDOFF":
      if (state.stage !== "handoff") return state;
      if (state.round.type === "DUET") return { ...state, stage: "pick-second" };
      if (state.round.type === "GUESS") return { ...state, stage: "predict" };
      return { ...state, stage: "reveal" };
    case "MUSIC_PREDICT":
      return state.round.type === "GUESS" && state.stage === "predict"
        ? { ...state, prediction: action.vibe, stage: "reveal" }
        : state;
    case "MUSIC_REACT":
      return state.round.type === "DUET" && state.stage === "reveal"
        ? { ...state, reaction: action.reaction, stage: "reaction" }
        : state;
    case "MUSIC_NEXT":
      return state.stage === "reveal" || state.stage === "reaction" ? commitAndNext(state) : state;
    case "MUSIC_SKIP":
      return nextRound({ ...state, picks: [], prediction: null, reaction: null });
    case "MUSIC_CONTINUE":
      return commitAndNext(state);
  }
}
