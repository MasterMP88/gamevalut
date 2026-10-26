import type { GameId, Scene, SceneType } from "./types";

export type Mood = "Lustig" | "Tief" | "Frech" | "Gemeinsam" | "Mit Memory" | "Mit AI" | "Musik";

export interface GameConfig {
  id: GameId;
  slug: string;
  number: string;
  title: string;
  hook: string;
  description: string;
  why: string[];
  duration: string;
  interaction: string;
  idealMood: string;
  intensity: 1 | 2 | 3;
  moods: Mood[];
  types: SceneType[];
  /** Feature switches for the player shell */
  steering?: boolean;
  battle?: boolean;
  coop?: boolean;
  memory?: boolean;
  ai?: boolean;
  /** PASS//THE AUX: music rounds + Tonight's Tracklist finale */
  music?: boolean;
  signature?: boolean;
  arc: "classic" | "free" | "one-two";
  art: "wine" | "kinetic" | "editorial" | "battle" | "coop" | "minimal" | "echo" | "living" | "aux";
  /** "So fühlt es sich an" — three beats: [cue, line]. */
  beats: [string, string][];
}

const ALL_PLAY: SceneType[] = ["PREDICTION", "QUESTION", "MISSION", "TIMER", "CHOICE", "ROULETTE", "SECRET", "SYNC", "GLITCH", "PRIVATE_SIGNAL"];

export const GAMES: GameConfig[] = [
  {
    id: "roxy-after-dark",
    slug: "first-spark",
    number: "01",
    title: "First Spark",
    hook: "Harmlos anfangen. War der Plan.",
    description: "Leichte Fragen, kleine Mutproben, ein erster Blick zu lang. Startet harmlos – bleibt es nicht.",
    why: ["Kein Anlauf. Einfach los.", "Wird Szene für Szene mutiger", "Drinks optional, nie Pflicht"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Klassisch · abwechselnd",
    idealMood: "Gute Laune, Lust auf mehr",
    intensity: 2,
    moods: ["Lustig", "Frech"],
    types: ["QUESTION", "MISSION", "TIMER", "CHOICE", "PREDICTION"],
    arc: "classic",
    art: "wine",
    beats: [["Lachen", "Eine Mini-Mutprobe in Minute eins."], ["Raten", "Was würde dein Gegenüber wählen? Tipp verdeckt."], ["Funke", "Es wird wärmer – ganz langsam."]],
  },
  {
    id: "after-dark-2",
    slug: "after-dark",
    number: "02",
    title: "After Dark",
    hook: "Timer, Rad, Geheimnisse. Ruhig wird anders.",
    description: "Countdowns, Roulette, verdeckte Wahl und Reaktionsproben. Hier passiert ständig etwas – meistens Lachen.",
    why: ["Timer und Glücksrad", "Geheime Wahl – auf einem oder zwei Geräten", "Kleine Regel-Glitches"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Interaktiv · Timer & Zufall",
    idealMood: "Verspielt, energiegeladen",
    intensity: 2,
    moods: ["Lustig", "Gemeinsam"],
    types: ["TIMER", "CHOICE", "PREDICTION", "ROULETTE", "SYNC", "GLITCH", "SECRET", "MISSION"],
    arc: "classic",
    art: "kinetic",
    beats: [["3·2·1", "Countdown läuft, Hände hoch."], ["Tempowechsel", "Speedrunde, Stille Runde, Rollentausch."], ["Reveal", "Beide verdeckt – dann Auflösung."]],
  },
  {
    id: "roxy-night",
    slug: "night-shift",
    number: "03",
    title: "Night Shift",
    hook: "Ihr entscheidet die Richtung. Die Nacht macht den Rest.",
    description: "Ein offener Fluss aus Szenen und Mini-Games. Nach jeder Szene lenkt ihr: lustiger, näher, verspielter, heißer.",
    why: ["Ihr steuert jede nächste Szene", "Alles drin: Fragen, Timer, Räder", "Zeitformat oder Open End"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Steuerbar · Date Night OS",
    idealMood: "Offen für alles",
    intensity: 3,
    moods: ["Lustig", "Frech", "Gemeinsam"],
    types: ALL_PLAY,
    steering: true,
    arc: "free",
    art: "editorial",
    beats: [["Steuern", "Lustiger, Flirtiger, Spiel, Heißer."], ["Momentum", "Die Richtung hält drei Szenen."], ["Umweg", "Küche, Fenster, Spätkauf – plötzlich."]],
  },
  {
    id: "battle",
    slug: "heatcheck",
    number: "04",
    title: "Heatcheck",
    hook: "Charmant verlieren ist eine Kunst. Leider gibt’s Punkte.",
    description: "Der einzige Wettkampf-Modus: Sparks, Streaks, Power-ups, geheime Missionen und Kapitel-Showdowns.",
    why: ["Ein Gewinner am Ende", "Power-ups „Doppelt“ und „Erhöhen“", "Comeback-Bonus für wer zurückliegt"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Kompetitiv · Punkte",
    idealMood: "Ehrgeizig, aber charmant",
    intensity: 2,
    moods: ["Lustig", "Frech"],
    types: ["QUESTION", "MISSION", "TIMER", "CHOICE", "ROULETTE", "SECRET", "SHOWDOWN"],
    battle: true,
    arc: "classic",
    art: "battle",
    beats: [["Sparks", "Jede Szene zählt, Streaks zählen mehr."], ["Power-ups", "Doppelt oder Erhöhen – im richtigen Moment."], ["Showdown", "Alle zehn Szenen. Wer zurückliegt, holt auf."]],
  },
  {
    id: "coop",
    slug: "us-after-dark",
    number: "05",
    title: "US//AFTER DARK",
    hook: "Kein Gegner. Nur ihr gegen einen langweiligen Abend.",
    description: "Kein Gewinner. Baut gemeinsam Chaos, Connection und Heat auf. Sind alle drei hoch genug, öffnet sich euer Vault.",
    why: ["Kooperativ, kein Gegeneinander", "Szenen stärken die schwächste Energie", "Ein geheimes Vault-Ende"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Kooperativ · 3 Energien",
    idealMood: "Verbunden, neugierig",
    intensity: 2,
    moods: ["Gemeinsam", "Tief", "Frech"],
    types: ALL_PLAY,
    coop: true,
    arc: "free",
    art: "coop",
    beats: [["Energie", "Die Nacht füllt, was euch fehlt."], ["Meilenstein", "Drei gemeinsame Momente."], ["Vault", "Erst alle drei – dann öffnet er sich."]],
  },
  {
    id: "one-two",
    slug: "one-two",
    number: "06",
    title: "ONE//TWO",
    hook: "Eine Frage. Ein Zug. Kein Lärm.",
    description: "Streng abwechselnd, genau eine Frage oder Aufgabe pro Screen. Keine Punkte, kein Lärm.",
    why: ["Minimalistisch und ruhig", "Lustig → persönlich → frech → sinnlich", "Perfekt endlos"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Abwechselnd · eins nach dem anderen",
    idealMood: "Reden wollen",
    intensity: 2,
    moods: ["Tief", "Lustig"],
    types: ["QUESTION", "MISSION"],
    signature: true,
    arc: "one-two",
    art: "minimal",
    beats: [["Eins", "Eine Frage für dich."], ["Zwei", "Eine für dich. Immer im Wechsel."], ["Zurück", "Manche Fragen kommen später umgekehrt wieder."]],
  },
  {
    id: "night-echo",
    slug: "night-echo",
    number: "07",
    title: "NIGHT//ECHO",
    hook: "Das Spiel merkt sich die guten Stellen.",
    description: "Wie ONE//TWO – aber gute Antworten dürfen später als Echo zurückkommen. Genau dann, wenn ihr nicht mehr damit rechnet.",
    why: ["Insider, die im Spiel entstehen", "Gemerkte Momente: sichtbar & löschbar", "Nichts wird ungefragt dauerhaft gespeichert"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Abwechselnd · mit Erinnerung",
    idealMood: "Verspielt-nah",
    intensity: 2,
    moods: ["Tief", "Mit Memory"],
    types: ["QUESTION", "MISSION", "PRIVATE_SIGNAL", "PREDICTION"],
    memory: true,
    signature: true,
    arc: "one-two",
    art: "echo",
    beats: [["Antworten", "Ein Satz, der hängen bleibt."], ["Spur", "Die Nacht merkt sich ihn – nur im Browser."], ["Echo", "Ein paar Szenen später kommt er zurück."]],
  },
  {
    id: "ai-director",
    slug: "director",
    number: "08",
    title: "NIGHT//ECHO — Director",
    hook: "Eure Nacht, live inszeniert.",
    description: "Der Director komponiert Szenen aus dem Verlauf eurer Nacht: Callbacks, Geheimnisse, Glitches. Fällt die Verbindung aus, spielt die lokale Bibliothek weiter.",
    why: ["Szenen, die es nur heute gibt", "Fällt leise auf die lokale Bibliothek zurück", "Verarbeitet nur minimale, bereinigte Daten"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Generativ · abwechselnd",
    idealMood: "Neugierig auf Überraschungen",
    intensity: 3,
    moods: ["Mit AI", "Mit Memory", "Frech"],
    types: ALL_PLAY,
    steering: true,
    memory: true,
    ai: true,
    signature: true,
    arc: "free",
    art: "living",
    beats: [["Komposition", "Fragen, Wetten, Geheimnisse – live gemischt."], ["Director Cut", "Plötzlich: Stille, Musik, Platztausch."], ["Callback", "Was ihr sagt, kehrt elegant wieder."]],
  },
  {
    id: "pass-the-aux",
    slug: "pass-the-aux",
    number: "09",
    title: "PASS//THE AUX",
    hook: "Hört ihr denselben Moment – oder komplett verschiedene Welten?",
    description: "Ihr antwortet mit Songs statt Sätzen: blind wählen, den anderen lesen, gemeinsam einen Track aushandeln und bei Signature Beats plötzlich die Regeln wechseln. Jeder Reveal zeigt, wie ähnlich – oder herrlich unterschiedlich – ihr einen Moment hört. Am Ende wird daraus Tonight’s Record.",
    why: ["Blind Reveals mit echtem Payoff", "Signature Beats statt Prompt-Schleife", "Tonight’s Record aus euren Picks"],
    duration: "15 / 30 / 60 Min · Open End",
    interaction: "Blind Picks · Reads · gemeinsame Tracks",
    idealMood: "Musik, Insider und überraschend ehrliche Reveals",
    intensity: 2,
    moods: ["Musik", "Lustig", "Gemeinsam"],
    types: ["MUSIC"],
    music: true,
    signature: true,
    arc: "free",
    art: "aux",
    beats: [["Pick", "Blind wählen oder gemeinsam festlegen."], ["Reveal", "Same Brain, Plot Twist oder keine Fragen."], ["Signature Beat", "AUX SWAP, RED FLAG, NEEDLE DROP – plötzlich gelten andere Regeln."]],
  },
];

/** Old public slugs keep resolving (redirected to the new slug). */
export const SLUG_ALIASES: Record<string, string> = {
  "roxy-after-dark": "first-spark",
  "after-dark-2": "after-dark",
  "roxy-night": "night-shift",
  battle: "heatcheck",
  coop: "us-after-dark",
  "ai-director": "director",
};

/** "Was für eine Nacht?" — single-tap recommendation. */
export const NIGHT_PICKS: { label: string; ids: GameId[]; why: string }[] = [
  { label: "Lachen", ids: ["roxy-after-dark", "after-dark-2"], why: "Kein Anlauf nötig – die erste Szene bringt euch schon zum Lachen." },
  { label: "Reden", ids: ["one-two", "night-echo"], why: "Eine Frage nach der anderen, und die guten Antworten kommen wieder." },
  { label: "Spielen", ids: ["after-dark-2", "battle"], why: "Timer, Rad, Punkte – hier sitzt niemand still." },
  { label: "Überraschen lassen", ids: ["ai-director", "roxy-night"], why: "Der Director mischt live. Ihr müsst nur noch mitmachen." },
  { label: "Musik", ids: ["pass-the-aux", "one-two"], why: "Antwortet mit Songs statt mit Sätzen – am Ende steht eure Tracklist." },
  { label: "Mehr Spannung", ids: ["coop", "battle"], why: "Gemeinsam etwas freischalten – oder charmant gegeneinander." },
];

export const GAMES_BY_SLUG = Object.fromEntries(GAMES.map((g) => [g.slug, g])) as Record<string, GameConfig>;
export const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, GameConfig>;

export function poolFor(game: GameConfig, scenes: Scene[]): Scene[] {
  return scenes.filter((s) => {
    if (s.only) return s.only.includes(game.id);
    if (s.type === "SHOWDOWN") return false;
    return game.types.includes(s.type);
  });
}
