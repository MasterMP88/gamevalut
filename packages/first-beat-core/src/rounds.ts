import type { FirstBeatRound, FirstBeatRoundType, MusicTrack, PlayerIndex } from "./types.js";

export const ROUND_COPY: Record<FirstBeatRoundType, string[]> = {
  INTRO_RUSH: [
    "Wie wenig Song braucht ihr, bis es klickt?",
    "Nur der erste Impuls zählt.",
    "Ein Beat. Vielleicht reicht er schon.",
    "Kein Cover, kein Hinweis. Nur hören.",
  ],
  TIME_WARP: [
    "Aus welchem Jahrzehnt kommt dieser Track?",
    "Zeitmaschine an: Wann war das?",
    "Klingt nach welcher Ära?",
    "Ordnet den Track in seine Zeit ein.",
  ],
  WHO_PICKED_IT: [
    "Einer von euch hat diesen Song gewählt. Wer war es?",
    "Dein Song oder meiner?",
    "Wer hat diesen Track heimlich in die Runde geschoben?",
    "Wessen Geschmack verrät sich hier gerade?",
  ],
  MOOD_MATCH: [
    "Welche Stimmung trifft dieser Track am besten?",
    "Was macht dieser Song mit dem Raum?",
    "Welche Szene gehört zu diesem Sound?",
    "Gebt dem Track einen Mood-Stempel.",
  ],
  PERSONAL_CUT: [
    "Dieser Track kommt aus einer persönlichen Auswahl. Erkennt ihr ihn?",
    "Ein Song aus eurem eigenen Kosmos.",
    "Persönlicher Cut: Wer erkennt ihn zuerst?",
    "Nicht irgendein Song. Einer von euren.",
  ],
};

export const DEFAULT_MOODS = ["Roadtrip", "2:17 Uhr", "Kuss-Szene", "Chaos", "Melancholie", "Main Character"] as const;

export function makeRound(args: {
  id: string;
  type: FirstBeatRoundType;
  track: MusicTrack;
  copyIndex?: number;
  pickedBy?: PlayerIndex;
  moodOptions?: string[];
}): FirstBeatRound {
  const copy = ROUND_COPY[args.type];
  const prompt = copy[(args.copyIndex ?? 0) % copy.length]!;
  const track = args.pickedBy === undefined ? args.track : { ...args.track, pickedBy: args.pickedBy };
  const moodOptions = args.type === "MOOD_MATCH" ? (args.moodOptions ?? [...DEFAULT_MOODS].slice(0, 4)) : undefined;
  return {
    id: args.id,
    type: args.type,
    prompt,
    track,
    ...(moodOptions ? { moodOptions } : {}),
  };
}

export function buildFirstBeatDeck(tracks: MusicTrack[], targetRounds = 12): FirstBeatRound[] {
  const playable = tracks.filter((track) => Boolean(track.previewUrl));
  if (playable.length === 0) return [];
  const types: FirstBeatRoundType[] = ["INTRO_RUSH", "TIME_WARP", "INTRO_RUSH", "MOOD_MATCH"];
  const size = Math.max(1, Math.min(targetRounds, playable.length));
  return playable.slice(0, size).map((track, index) => makeRound({
    id: `first-beat-${index + 1}`,
    type: types[index % types.length]!,
    track,
    copyIndex: index,
  }));
}

export function buildPersonalRounds(picks: { track: MusicTrack; pickedBy: PlayerIndex }[]): FirstBeatRound[] {
  return picks
    .filter((x) => Boolean(x.track.previewUrl))
    .map((x, index) => makeRound({
      id: `personal-cut-${index + 1}`,
      type: index % 2 === 0 ? "WHO_PICKED_IT" : "PERSONAL_CUT",
      track: x.track,
      pickedBy: x.pickedBy,
      copyIndex: index,
    }));
}
