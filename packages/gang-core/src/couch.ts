import {
  getGangPlaybook,
  type GangGameId,
  type GangPrompt,
} from "./playbooks.js";
import { couchGame, GANG_EXPERIENCES, groupBand } from "./experience.js";

export type CouchPhase =
  "ready" | "explain" | "play" | "reveal" | "score" | "transition" | "finale";
export type CouchVibe = "relaxed" | "lively";
export type CouchInput =
  | "majority"
  | "titles"
  | "line"
  | "applause"
  | "spotlight"
  | "quantity"
  | "music"
  | "relay";
export interface CouchTeam {
  id: string;
  name: string;
  members: number[];
}
export interface CouchResult {
  prompt?: string;
  headline: string;
  winners: string[];
  delta: Record<string, number>;
  counts?: number[];
  skipped?: boolean;
  revealText?: string;
}
export interface CouchState {
  version: 1;
  gameId: GangGameId;
  phase: CouchPhase;
  playerCount: number;
  teams: CouchTeam[];
  seed: number;
  deck: GangPrompt[];
  index: number;
  rounds: number;
  scores: Record<string, number>;
  history: string[];
  results: CouchResult[];
  result: CouchResult | null;
  vibe: CouchVibe;
  turn: number;
  turnResults: boolean[];
  deadline: number | null;
  paused: boolean;
  remaining: number | null;
  musicClaim: string | null;
  musicMisses: string[];
  encore: boolean;
  finaleVariant: 0 | 1;
}
export type CouchAction =
  | { type: "NEXT"; at: number }
  | { type: "PAUSE"; at: number }
  | { type: "RESUME"; at: number }
  | { type: "SKIP" }
  | { type: "FINISH" }
  | { type: "ENCORE"; at: number }
  | {
      type: "RESOLVE";
      counts?: number[];
      predictions?: number[];
      choice?: number;
      winners?: string[];
    }
  | { type: "TURN"; valid: boolean; at: number }
  | { type: "TIMEOUT"; at: number }
  | { type: "MUSIC_CLAIM"; teamId: string }
  | { type: "MUSIC_JUDGE"; correct: boolean };

export const couchRange = (id: GangGameId): [number, number] => {
  const p = getGangPlaybook(id)!;
  return [
    p.minPlayers,
    ["bad-answers-only", "chain-reaction"].includes(id) ? 99 : p.maxPlayers,
  ];
};
export function couchInput(id: GangGameId): CouchInput {
  return (
    {
      "the-majority": "majority",
      "whos-that": "titles",
      "the-line": "line",
      "bad-answers-only": "applause",
      "hot-seat": "spotlight",
      "team-chaos": "quantity",
      "music-drop": "music",
      "chain-reaction": "relay",
      "panic-button": "relay",
    } as Record<string, CouchInput>
  )[id]!;
}
export function couchTeams(
  count: number,
  names: readonly string[] = [],
): CouchTeam[] {
  const amount = count <= 4 ? count : [2, 3, 4, 6][groupBand(count) - 1]!;
  return Array.from({ length: amount }, (_, i) => ({
    id: `t${i + 1}`,
    name:
      names[i]?.trim().slice(0, 24) ||
      (count <= 4 ? `Person ${i + 1}` : `Team ${String.fromCharCode(65 + i)}`),
    members: Array.from({ length: count }, (_, j) => j + 1).filter(
      (_, j) => j % amount === i,
    ),
  }));
}
function hash(seed: number, id: string): number {
  let h = seed | 0;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  return (h ^ (h >>> 13)) >>> 0;
}
const teamTasks: GangPrompt[] = [
  [
    "Schreibt Dinge auf, die rollen, aber keine Fahrzeuge sind.",
    "gültige verschiedene Dinge",
  ],
  ["Findet Wörter, die mit „Nach“ anfangen.", "gültige verschiedene Wörter"],
  [
    "Findet Dinge, die man öffnen kann, ohne sie kaputtzumachen.",
    "gültige verschiedene Dinge",
  ],
  [
    "Schreibt Tiere mit höchstens fünf Buchstaben auf.",
    "gültige verschiedene Tiere",
  ],
  [
    "Findet Orte, an denen man normalerweise leise ist.",
    "gültige verschiedene Orte",
  ],
  [
    "Schreibt zusammengesetzte Wörter mit „Haus“.",
    "gültige verschiedene Wörter",
  ],
  [
    "Findet Lebensmittel, die natürlich gelb sind.",
    "gültige verschiedene Lebensmittel",
  ],
  [
    "Findet Dinge mit genau zwei gleichen Hälften.",
    "gültige verschiedene Dinge",
  ],
  ["Schreibt Wörter auf, die mit „ung“ enden.", "gültige verschiedene Wörter"],
  [
    "Findet Tätigkeiten, für die man keinen Strom braucht.",
    "gültige verschiedene Tätigkeiten",
  ],
  ["Findet Dinge, die man falten kann.", "gültige verschiedene Dinge"],
  [
    "Findet Dinge, die gleichzeitig rund und hohl sind.",
    "gültige verschiedene Dinge",
  ],
  [
    "Schreibt Berufe auf, in denen man oft draußen ist.",
    "gültige verschiedene Berufe",
  ],
  [
    "Findet Dinge, die schwimmen können, aber keine Boote sind.",
    "gültige verschiedene Dinge",
  ],
  ["Schreibt Wörter mit genau zwei Silben auf.", "gültige verschiedene Wörter"],
  [
    "Findet Dinge, die es sowohl im Büro als auch in der Küche gibt.",
    "gültige verschiedene Dinge",
  ],
  [
    "Findet Gegenstände, die kleiner als eine Münze sein können.",
    "gültige verschiedene Gegenstände",
  ],
  [
    "Findet Wörter, in denen ein Tiername steckt.",
    "gültige verschiedene Wörter",
  ],
  [
    "Schreibt Dinge auf, die man teilen kann, ohne weniger davon zu haben.",
    "nachvollziehbare verschiedene Ideen",
  ],
  [
    "Findet Wörter, die sowohl Ding als auch Tätigkeit sein können.",
    "gültige verschiedene Wörter",
  ],
  ["Findet Dinge, die sich ohne Motor bewegen.", "gültige verschiedene Dinge"],
  [
    "Schreibt Wörter mit drei verschiedenen Vokalen auf.",
    "gültige verschiedene Wörter",
  ],
  [
    "Findet Gegenstände mit Griff, aber ohne Klinge.",
    "gültige verschiedene Gegenstände",
  ],
  [
    "Findet Gründe, warum eine Tür offen bleiben sollte.",
    "nachvollziehbare verschiedene Gründe",
  ],
  [
    "Findet Tiere, deren Name mit einem Vokal beginnt.",
    "gültige verschiedene Tiere",
  ],
  ["Findet Dinge, die durchsichtig sind.", "gültige verschiedene Dinge"],
  [
    "Schreibt Ortsnamen ohne den Buchstaben E auf.",
    "gültige verschiedene Orte",
  ],
  [
    "Findet Dinge, die gleichzeitig nützlich und völlig unauffällig sind.",
    "nachvollziehbare verschiedene Dinge",
  ],
  [
    "Schreibt Wörter auf, die rückwärts ein anderes Wort ergeben.",
    "gültige verschiedene Wörter",
  ],
  ["Findet Dinge, die man aufziehen kann.", "gültige verschiedene Dinge"],
  [
    "Findet unterschiedliche Geräusche, die man mit Papier erzeugen kann.",
    "vorgeführte unterschiedliche Geräusche",
  ],
  [
    "Erfindet neue Namen für einen Regenschirm. Jeder Name muss seinen Zweck erklären.",
    "nachvollziehbare verschiedene Namen",
  ],
  [
    "Zeichnet gemeinsam ein Haus. Jede Person darf immer nur einen Strich ergänzen. Wie viele erkennbare Details schafft ihr?",
    "unterschiedliche erkennbare Hausdetails",
  ],
  [
    "Faltet aus Papier eine Ziehharmonika. Bei jeder Falte wechselt die Person. Zählt vollständige Falten.",
    "vollständige Falten",
  ],
  [
    "Reißt aus einem Blatt Papier kleine zusammenhängende Ringe. Keine Schere. Das Nachbarteam prüft, welche Ringe geschlossen sind.",
    "geschlossene Papierringe",
  ],
  [
    "Zeichnet eine Stadt, ohne den Stift abzusetzen. Bei jedem Gebäude übernimmt jemand anderes. Zählt klar getrennte Gebäude.",
    "erkennbare Gebäude",
  ],
  [
    "Baut aus Papier kleine Figuren, die ohne Hilfe stehen bleiben. Unterschiedliche Formen zählen, Kopien nicht.",
    "unterschiedliche freistehende Papierfiguren",
  ],
  [
    "Zeichnet ein Tieralphabet: ein erkennbares Tier je Anfangsbuchstabe. Jede Person ergänzt genau eine Zeichnung pro Zug.",
    "verschiedene Anfangsbuchstaben mit erkennbarem Tier",
  ],
  [
    "Legt aus gefalteten Papierstreifen erkennbare Buchstaben. Jeder Buchstabe darf nur einmal vorkommen.",
    "erkennbare unterschiedliche Buchstaben",
  ],
  [
    "Zeichnet ein Monster gemeinsam. Eine Person zeichnet nur Köpfe, eine nur Beine, andere nur Arme. Zählt vollständige Monster mit allem dran.",
    "vollständige Monster mit Kopf, Armen und Beinen",
  ],
  [
    "Findet Wörter, die im Deutschen ohne Vokalwechsel zur Mehrzahl werden: ein Tier, viele Tiere zählt. Das Nachbarteam prüft.",
    "gültige unterschiedliche Wortpaare",
  ],
  [
    "Sammelt Dinge, die zugleich Werkzeug und Musikinstrument sein könnten. Führt das Geräusch kurz vor, ohne Gegenstände zu beschädigen.",
    "nachvollziehbare unterschiedliche Beispiele",
  ],
  [
    "Erfindet Zweizeiler, in denen sich ein Essen auf etwas im Raum reimt. Jede Reimpaarung zählt nur einmal.",
    "unterschiedliche verständliche Reimpaare",
  ],
  [
    "Schreibt Mini-Geschichten aus genau drei Wörtern. In jeder muss ein anderer Gegenstand aus diesem Raum vorkommen.",
    "verständliche Drei-Wort-Geschichten mit verschiedenen Gegenständen",
  ],
  [
    "Findet deutsche Wörter, die mit demselben Buchstaben anfangen und enden.",
    "gültige unterschiedliche Wörter",
  ],
  [
    "Erfindet Geräuschwörter für Dinge, die eigentlich lautlos sind. Nennt jeweils das Ding dazu.",
    "unterschiedliche nachvollziehbare Geräusch-Ideen",
  ],
  [
    "Sammelt Alltagsdinge, deren Name auch eine Person beschreiben kann. Zum Beispiel eine Leuchte.",
    "gültige unterschiedliche Doppeldeutigkeiten",
  ],
  [
    "Zeichnet neue Verkehrszeichen für euren Spieleabend. Das Nachbarteam muss die Bedeutung ohne Erklärung verstehen.",
    "ohne Erklärung erkannte Zeichen",
  ],
].map(([prompt, metric], i) => ({
  id: `team-couch-${i + 1}`,
  prompt: prompt!,
  category: "couch",
  teamChallenge: {
    metric: metric!,
    maxResult: 30,
    instruction:
      "Gleiche aktive Teamgröße. Nach dem Timer prüft ein anderes Team eure Liste.",
  },
}));
export function couchPool(id: GangGameId): GangPrompt[] {
  return id === "team-chaos" ? teamTasks : getGangPlaybook(id)!.prompts;
}
export function createCouchSession(input: {
  gameId: GangGameId;
  playerCount: number;
  seed: number;
  rounds?: number | undefined;
  seen?: readonly string[];
  names?: readonly string[];
  vibe?: CouchVibe;
}): CouchState {
  if (!couchGame(input.gameId))
    throw new RangeError("This game needs private devices.");
  const [min, max] = couchRange(input.gameId);
  if (
    !Number.isInteger(input.playerCount) ||
    input.playerCount < min ||
    input.playerCount > max
  )
    throw new RangeError("Invalid group size.");
  if (!Number.isFinite(input.seed)) throw new RangeError("Invalid seed.");
  const history = [...(input.seen ?? [])];
  const pool = couchPool(input.gameId);
  const unique = [
    ...new Map(
      pool.map((p) => [p.prompt.trim().toLocaleLowerCase("de"), p]),
    ).values(),
  ];
  const deck = unique.slice().sort((a, b) => {
    const ai = history.lastIndexOf(a.id),
      bi = history.lastIndexOf(b.id);
    // Oldest first, with seeded variation across the oldest quarter after exhaustion.
    const bucket = (i: number) =>
      i < 0 ? -1 : Math.floor(i / Math.max(1, Math.floor(unique.length / 4)));
    return (
      bucket(ai) - bucket(bi) || hash(input.seed, a.id) - hash(input.seed, b.id)
    );
  });
  const teams = couchTeams(input.playerCount, input.names);
  const requested =
    input.rounds ??
    (input.gameId === "hot-seat" ? Math.min(input.playerCount, 12) : 6);
  const rounds = Math.max(
    2,
    Math.min(
      Number.isFinite(requested) ? Math.floor(requested) : 6,
      12,
      deck.length,
    ),
  );
  return {
    version: 1,
    gameId: input.gameId,
    phase: "ready",
    playerCount: input.playerCount,
    teams,
    seed: input.seed,
    deck,
    index: 0,
    rounds,
    scores: Object.fromEntries(teams.map((t) => [t.id, 0])),
    history,
    results: [],
    result: null,
    vibe: input.vibe ?? "lively",
    turn: 0,
    turnResults: [],
    deadline: null,
    paused: false,
    remaining: null,
    musicClaim: null,
    musicMisses: [],
    encore: false,
    finaleVariant: (hash(input.seed, "finale") % 2) as 0 | 1,
  };
}
export const couchPrompt = (s: CouchState): GangPrompt => s.deck[s.index]!;
export const couchIsFinal = (s: CouchState): boolean =>
  s.index === s.rounds - 1;
export const couchBeat = (s: CouchState): string =>
  couchIsFinal(s)
    ? "FINALE"
    : s.index === 0
      ? "WARM-UP"
      : s.index >= s.rounds - 2
        ? "PEAK"
        : "JETZT WIRD’S ERNST";
export function couchSeconds(s: CouchState): number {
  if (couchInput(s.gameId) === "relay")
    return s.vibe === "relaxed"
      ? 8
      : couchIsFinal(s)
        ? s.gameId === "panic-button"
          ? 2
          : 3
        : s.index === 0
          ? 5
          : s.index < 3
            ? 4
            : 3;
  return s.gameId === "the-line"
    ? 40
    : s.gameId === "team-chaos"
      ? couchIsFinal(s)
        ? 20
        : 40
      : s.gameId === "bad-answers-only"
        ? 30
        : s.gameId === "music-drop"
          ? couchIsFinal(s)
            ? 2
            : s.index === 0
              ? 12
              : 6
          : 20;
}
export function couchActiveTeam(s: CouchState): CouchTeam {
  const direction =
    couchIsFinal(s) && s.finaleVariant === 1 && s.gameId === "panic-button"
      ? -1
      : 1;
  return s.teams[
    (((s.index + direction * s.turn) % s.teams.length) + s.teams.length) %
      s.teams.length
  ]!;
}
export function couchSpokesperson(s: CouchState, t: CouchTeam): number {
  const appearance =
    couchInput(s.gameId) === "relay"
      ? s.index * 3 + Math.floor(s.turn / s.teams.length)
      : s.gameId === "hot-seat"
        ? Math.floor(s.index / s.teams.length)
        : s.index;
  return t.members[appearance % t.members.length]!;
}

export function couchCue(s: CouchState): string {
  if (couchIsFinal(s))
    return GANG_EXPERIENCES[s.gameId].finales[s.finaleVariant];
  return (
    {
      "the-majority": `Tipp auf Papier festhalten. Dann alle gleichzeitig Finger zeigen: 1 bis ${couchPrompt(s).options?.length ?? 4}.`,
      "whos-that":
        "Alle zeigen gleichzeitig. Die Titelträger bekommen zehn Sekunden für ihr Statement.",
      "the-line":
        "Erst Position beziehen, dann Freeze. Sitzenbleiben und Finger von 1 bis 5 zeigen geht genauso.",
      "bad-answers-only":
        s.index % 3 === 1
          ? "Verkauft eure schlechte Idee als Werbeslogan."
          : s.index % 3 === 2
            ? "Erklärt eure Antwort mit komplett ernstem Gesicht."
            : "Kurz beraten. Ein Satz pro Team. Applaus entscheidet.",
      "hot-seat":
        "Spotlight notiert seine Wahl verdeckt. Teams legen ihren Tipp fest, dann gemeinsam aufdecken.",
      "team-chaos":
        "Gleiche aktive Teamgröße. Listen nach dem Timer vom Nachbarteam prüfen lassen.",
      "music-drop":
        "Hand hoch, wenn ihr den Track erkennt. Der Host wählt das erste Team; ein Versuch pro Team.",
      "chain-reaction":
        "Knüpft an das letzte gesprochene Wort an. Der Raum prüft Verbindungen und Wiederholungen.",
      "panic-button":
        "Neue Antwort laut sagen. Der Host bestätigt. Nach jedem Zug wechselt der Sprecher.",
    } as Record<string, string>
  )[s.gameId]!;
}
const integers = (v: unknown, length: number, max: number): v is number[] =>
  Array.isArray(v) &&
  v.length === length &&
  v.every((x) => Number.isInteger(x) && x >= 0 && x <= max);
function finishRound(s: CouchState, r: CouchResult): CouchState {
  return {
    ...s,
    phase: "reveal",
    result: { ...r, prompt: couchPrompt(s).prompt },
    deadline: null,
    paused: false,
    remaining: null,
  };
}
function result(
  s: CouchState,
  winners: string[],
  headline: string,
  points = 1,
  counts?: number[],
): CouchResult {
  return {
    headline,
    winners,
    delta: Object.fromEntries(
      s.teams.map((t) => [t.id, winners.includes(t.id) ? points : 0]),
    ),
    ...(counts ? { counts } : {}),
  };
}
export function reduceCouch(s: CouchState, a: CouchAction): CouchState {
  if (a.type === "FINISH")
    return {
      ...s,
      ...(s.phase === "reveal" && s.result
        ? {
            scores: Object.fromEntries(
              s.teams.map((t) => [
                t.id,
                (s.scores[t.id] ?? 0) + (s.result!.delta[t.id] ?? 0),
              ]),
            ),
            results: [...s.results, s.result],
          }
        : {}),
      phase: "finale",
      deadline: null,
      paused: false,
      remaining: null,
    };
  if (a.type === "PAUSE")
    return s.phase === "play" && !s.paused
      ? {
          ...s,
          paused: true,
          remaining:
            s.deadline === null ? null : Math.max(0, s.deadline - a.at),
          deadline: null,
        }
      : s;
  if (a.type === "RESUME")
    return s.paused
      ? {
          ...s,
          paused: false,
          deadline: s.remaining === null ? null : a.at + s.remaining,
          remaining: null,
        }
      : s;
  if (s.paused) return s;
  if (a.type === "SKIP")
    return ["ready", "explain", "play"].includes(s.phase)
      ? finishRound(s, {
          headline: "Neue Runde. Kein Punktverlust.",
          winners: [],
          delta: {},
          skipped: true,
        })
      : s;
  if (a.type === "ENCORE") {
    if (s.phase !== "finale" || s.encore || s.index + 1 >= s.deck.length)
      return s;
    const index = s.index + 1;
    return {
      ...s,
      phase: "transition",
      index,
      rounds: index + 1,
      encore: true,
      result: null,
      turn: 0,
      turnResults: [],
      musicClaim: null,
      musicMisses: [],
    };
  }
  if (a.type === "NEXT") {
    if (s.phase === "ready") return { ...s, phase: "explain" };
    if (s.phase === "explain" || s.phase === "transition")
      return {
        ...s,
        phase: "play",
        history: [...s.history, couchPrompt(s).id],
        deadline:
          couchInput(s.gameId) === "music"
            ? null
            : a.at + couchSeconds(s) * 1000,
      };
    if (s.phase === "reveal")
      return {
        ...s,
        phase: "score",
        scores: Object.fromEntries(
          s.teams.map((t) => [
            t.id,
            (s.scores[t.id] ?? 0) + (s.result?.delta[t.id] ?? 0),
          ]),
        ),
        results: [...s.results, s.result!],
      };
    if (s.phase === "score") {
      if (s.index + 1 >= s.rounds) return { ...s, phase: "finale" };
      return {
        ...s,
        phase: "transition",
        index: s.index + 1,
        result: null,
        turn: 0,
        turnResults: [],
        musicClaim: null,
        musicMisses: [],
      };
    }
    return s;
  }
  if (s.phase !== "play") return s;
  const kind = couchInput(s.gameId),
    isFinal = couchIsFinal(s);
  if ((a.type === "TURN" || a.type === "TIMEOUT") && kind === "relay") {
    if (
      !Number.isFinite(a.at) ||
      s.deadline === null ||
      (a.type === "TIMEOUT" && a.at < s.deadline)
    )
      return s;
    const valid = a.type === "TURN" && a.valid && a.at < s.deadline;
    const outcomes = [...s.turnResults, valid];
    if (outcomes.length >= s.teams.length * 3) {
      const delta = Object.fromEntries(s.teams.map((t) => [t.id, 0]));
      outcomes.forEach((ok, i) => {
        if (ok) delta[couchActiveTeam({ ...s, turn: i }).id]! += 1;
      });
      const best = Math.max(...Object.values(delta));
      const streak = outcomes.reduce(
        (acc, ok) =>
          ok
            ? { now: acc.now + 1, best: Math.max(acc.best, acc.now + 1) }
            : { now: 0, best: acc.best },
        { now: 0, best: 0 },
      ).best;
      return finishRound(
        { ...s, turnResults: outcomes },
        {
          headline:
            s.gameId === "chain-reaction"
              ? `Eure längste Kette: ${streak} Verbindungen.`
              : `${outcomes.filter(Boolean).length} Antworten. ${outcomes.filter((x) => !x).length} Hänger. Alle bleiben drin.`,
          winners:
            best > 0
              ? s.teams.filter((t) => delta[t.id] === best).map((t) => t.id)
              : [],
          delta,
        },
      );
    }
    return {
      ...s,
      turn: s.turn + 1,
      turnResults: outcomes,
      deadline: a.at + couchSeconds(s) * 1000,
    };
  }
  if (a.type === "MUSIC_CLAIM" && kind === "music") {
    return !s.musicClaim &&
      !s.musicMisses.includes(a.teamId) &&
      s.teams.some((t) => t.id === a.teamId)
      ? { ...s, musicClaim: a.teamId }
      : s;
  }
  if (a.type === "MUSIC_JUDGE" && kind === "music" && s.musicClaim) {
    if (a.correct)
      return finishRound(
        s,
        result(
          s,
          [s.musicClaim],
          s.musicMisses.length ? "Geklaut. Sauber." : "Erkannt. Abgeräumt.",
          (s.musicMisses.length ? 1 : 2) * (isFinal ? 2 : 1),
        ),
      );
    const misses = [...s.musicMisses, s.musicClaim];
    return misses.length === s.teams.length
      ? finishRound(
          { ...s, musicMisses: misses, musicClaim: null },
          result(s, [], "Der Track hat euch erwischt."),
        )
      : { ...s, musicMisses: misses, musicClaim: null };
  }
  if (a.type !== "RESOLVE") return s;
  const multiplier = isFinal ? 2 : 1;
  if (kind === "line")
    return finishRound(
      s,
      result(s, [], "Gleicher Raum. Erstaunlich andere Welt.", 0),
    );
  if (kind === "music")
    return finishRound(s, result(s, [], "Ein Track für die Wiederentdeckung."));
  if (kind === "majority") {
    const n = couchPrompt(s).options?.length ?? 0;
    if (
      !integers(a.counts, n, s.playerCount) ||
      a.counts.reduce((x, y) => x + y, 0) > s.playerCount ||
      !integers(a.predictions, s.teams.length, n)
    )
      return s;
    const positive = a.counts.filter((n) => n > 0);
    const target = positive.length
      ? isFinal && s.finaleVariant === 1
        ? Math.min(...positive)
        : Math.max(...positive)
      : 0;
    const wins = s.teams
      .filter(
        (t, i) =>
          target > 0 &&
          a.predictions![i]! > 0 &&
          a.counts![a.predictions![i]! - 1] === target,
      )
      .map((t) => t.id);
    return finishRound(
      s,
      result(
        s,
        wins,
        positive.length
          ? "So tickt der Raum."
          : "Alle passen. Auch ein Statement.",
        multiplier,
        a.counts,
      ),
    );
  }
  if (kind === "spotlight") {
    const n = couchPrompt(s).options?.length ?? 0;
    if (
      !Number.isInteger(a.choice) ||
      a.choice! < 1 ||
      a.choice! > n ||
      !integers(a.predictions, s.teams.length, n)
    )
      return s;
    const active = s.teams[s.index % s.teams.length]!.id;
    const wins = s.teams
      .filter((t, i) => t.id !== active && a.predictions![i] === a.choice)
      .map((t) => t.id);
    return finishRound(s, {
      ...result(s, wins, "Gekannt oder komplett verschätzt?", multiplier),
      revealText: couchPrompt(s).options![a.choice! - 1]!,
    });
  }
  if (kind === "quantity") {
    if (!integers(a.counts, s.teams.length, 30)) return s;
    const max = Math.max(...a.counts);
    const wins =
      max > 0
        ? s.teams.filter((_, i) => a.counts![i] === max).map((t) => t.id)
        : [];
    if (isFinal && s.finaleVariant === 1)
      return finishRound(s, {
        headline: "Jeder Eintrag zählt.",
        winners: wins,
        delta: Object.fromEntries(s.teams.map((t, i) => [t.id, a.counts![i]!])),
        counts: a.counts,
      });
    return finishRound(
      s,
      result(s, wins, "Chaos mit Ergebnis.", 2 * multiplier, a.counts),
    );
  }
  if (kind === "titles" || kind === "applause") {
    if (
      !Array.isArray(a.winners) ||
      !a.winners.every((id) => s.teams.some((t) => t.id === id))
    )
      return s;
    return finishRound(
      s,
      result(
        s,
        [...new Set(a.winners)],
        kind === "titles"
          ? "Titel verliehen. Einspruch zwecklos."
          : "Offiziell die beste schlechte Idee.",
        kind === "titles" ? 1 : 2 * multiplier,
      ),
    );
  }
  return s;
}
