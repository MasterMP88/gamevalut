import type { GameId, Scene, SceneType } from "./types";

export type Mood = "Lustig" | "Tief" | "Frech" | "Gemeinsam" | "Mit Memory" | "Mit AI";

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
  signature?: boolean;
  arc: "classic" | "free" | "one-two";
  art: "wine" | "kinetic" | "editorial" | "battle" | "coop" | "minimal" | "echo" | "living";
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
    hook: "Der Funke vor allem anderen.",
    description: "Leichte Fragen, kleine Mutproben, ein erster Blick zu lang. Startet harmlos – bleibt es nicht.",
    why: ["Null Erklärung, sofort drin", "Wird Szene für Szene mutiger", "Drinks optional, nie Pflicht"],
    duration: "30–60 Min",
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
    hook: "Timer, Rad, Geheimnisse. Stillsitzen ist nicht vorgesehen.",
    description: "Countdowns, Roulette, verdeckte Wahl und Reaktionsproben. Hier passiert ständig etwas – meistens Lachen.",
    why: ["Timer und Glücksrad", "Geheime Wahl mit Handy-Übergabe", "Kleine Regel-Glitches"],
    duration: "45–90 Min",
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
    hook: "Ihr schreibt die Richtung. Die Nacht folgt.",
    description: "Ein offener Fluss aus Szenen und Mini-Games. Nach jeder Szene lenkt ihr: lustiger, näher, verspielter, heißer.",
    why: ["Ihr steuert jede nächste Szene", "Alles drin: Fragen, Timer, Räder", "Kein Ende, nur Flow"],
    duration: "60 Min – open end",
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
    hook: "Charmant verlieren ist auch eine Kunst. Gewinnen schöner.",
    description: "Der einzige Wettkampf-Modus: Sparks, Streaks, Power-ups, geheime Missionen und Kapitel-Showdowns.",
    why: ["Ein Gewinner am Ende", "Power-ups „Doppelt“ und „Erhöhen“", "Comeback-Bonus für wer zurückliegt"],
    duration: "60–120 Min",
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
    hook: "Kein Gegner. Nur ihr gegen die Langeweile.",
    description: "Kein Gewinner. Baut gemeinsam Chaos, Connection und Heat auf. Sind alle drei hoch genug, öffnet sich euer Vault.",
    why: ["Kooperativ, kein Gegeneinander", "Szenen stärken die schwächste Energie", "Ein geheimes Vault-Ende"],
    duration: "60–180 Min",
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
    duration: "45 Min – open end",
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
    hook: "Das Spiel, das sich merkt, was ihr sagt.",
    description: "Wie ONE//TWO – aber eure Antworten können zu Memory Anchors werden. Ein paar Szenen später kommen sie als Echo zurück.",
    why: ["Entstehende Insider-Witze", "Memory Core: alles sichtbar & löschbar", "Anker werden nie automatisch gespeichert"],
    duration: "60 Min – open end",
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
    description: "Der Director – eine KI im Hintergrund – erfindet Szenen aus dem Verlauf eurer Nacht: Callbacks, Geheimnisse, Glitches. Ohne Netz spielt er lokal weiter.",
    why: ["Szenen, die es nur heute gibt", "Läuft offline lokal weiter", "Sieht nur minimale, bereinigte Daten"],
    duration: "60 Min – open end",
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
  { label: "Überraschen lassen", ids: ["ai-director", "roxy-night"], why: "Ein unsichtbarer Gastgeber entscheidet, was als Nächstes passiert." },
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