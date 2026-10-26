import type { Flavor, MusicMode, Scene } from "./types";

/**
 * PASS//THE AUX — 09. Music is the answer. Every prompt asks for a song the players
 * name themselves; the app never suggests, fetches or displays lyrics.
 */
let n = 0;
const mk = (mode: MusicMode) => (flavor: Flavor, phase: number, title: string, prompt: string, emoji?: string): Scene => ({
  id: `aux-${mode}-${++n}`,
  type: "MUSIC",
  flavor,
  phase,
  title,
  prompt,
  emoji,
  music: { mode },
  only: ["pass-the-aux"],
  ...(mode === "speed" ? { duration: 25 } : {}),
});
const solo = mk("solo");
const duet = mk("duet");
const guess = mk("guess");
const speed = mk("speed");

export const MUSIC_SCENES: Scene[] = [
  // ——— SOLO PICK: one song, hidden, handed over, unsealed
  solo("cheeky", 0, "Erster Eindruck", "Der Song, der gefährlich nah an deinem ersten Eindruck von {you} liegt."),
  solo("funny", 0, "Nie zugetraut", "Ein Track, den du liebst und den {you} dir niemals zugetraut hätte."),
  solo("deep", 1, "Nach zwölf", "Welcher Track beschreibt {you} nach Mitternacht?"),
  solo("funny", 0, "Schlechter Plan", "Soundtrack für einen sehr schlechten gemeinsamen Plan, den ihr trotzdem durchziehen würdet."),
  solo("deep", 2, "Alles geht schief", "In der Filmszene über euch geht gerade alles schief. Was läuft dazu?"),
  solo("cheeky", 1, "Unverteidigt", "Ein Guilty Pleasure, für das du dich heute nicht verteidigst."),
  solo("deep", 2, "Kassette", "Hättest du {you} früher ein Mixtape gemacht: Track eins?"),
  solo("cheeky", 2, "Gefährlich gut", "Ein Song, bei dem du an {you} denkst, obwohl er gar nicht romantisch ist."),
  solo("funny", 1, "Einzugsmusik", "{you} betritt ab heute jeden Raum mit Einlaufmusik. Welche?"),
  solo("deep", 3, "Leiser gedreht", "Den hörst du nur, wenn niemand zuhört. Heute hört jemand zu."),
  solo("sensual", 3, "Licht aus", "Licht runter, Handy weg. Welcher Track darf jetzt noch laufen?"),
  solo("funny", 1, "Karaoke-Waffe", "Mit diesem Lied würdest du {you} beim Karaoke vernichten."),
  solo("deep", 2, "Sommer damals", "Klingt nach einem Sommer, den {you} noch nicht kennt."),
  solo("cheeky", 3, "Kein Kommentar", "Läuft dieser Song, weiß {you} sofort, was du willst."),

  // ——— DUET: same prompt, both pick blind, reveal side by side
  duet("funny", 0, "Roadtrip", "Euer Roadtrip beginnt jetzt. Nur ein Track darf als Erstes laufen."),
  duet("cheeky", 1, "Erster Kuss", "Was hätte nach eurem ersten Kuss laufen sollen?"),
  duet("deep", 2, "Unser Lied", "Wenn ihr ein gemeinsames Lied hättet, das noch keiner von euch ausgesprochen hat."),
  duet("funny", 0, "Sonntagmorgen", "Sonntag, zehn Uhr, Kaffee. Was dreht ihr auf?"),
  duet("funny", 1, "Küchenparty", "Um drei Uhr nachts in der Küche, alle anderen sind gegangen. Welcher Song?"),
  duet("deep", 2, "Zehn Jahre", "Eure Nacht in zehn Jahren, kurz bevor ihr nach Hause fahrt."),
  duet("cheeky", 2, "Hotelzimmer", "Fremde Stadt, Hotelzimmer, die Tür fällt zu. Der erste Track."),
  duet("funny", 1, "Peinlichster Hit", "Euer gemeinsamer Lieblingsfeind: ein Hit, den ihr beide heimlich mitsingt."),
  duet("deep", 3, "Nach dem Streit", "Nach einem Streit, kurz bevor einer lacht."),
  duet("sensual", 3, "Langsam", "Wenn heute Nacht nur noch ein langsamer Song erlaubt ist."),
  duet("funny", 0, "Aufzug", "Eure Musik für einen Aufzug, der zwischen zwei Etagen festhängt."),
  duet("cheeky", 2, "Afterparty", "Die Afterparty findet bei euch statt. Was hören die Nachbarn?"),

  // ——— GUESS: one picks hidden, the other predicts the vibe first
  guess("funny", 0, "Duschkonzert, live", "Was singst du unter der Dusche, wenn du sicher bist, dass {you} nicht da ist?"),
  guess("deep", 1, "Heimweg", "Dein Song für den Heimweg nach einer guten Nacht."),
  guess("cheeky", 1, "Vorspiel", "Ein Track, den du anmachst, bevor {you} klingelt."),
  guess("funny", 1, "Tiefpunkt", "Läuft bei dir, wenn du dich selbst bemitleidest – mit Stil."),
  guess("deep", 2, "Lieblingsjahr", "Ein Lied aus dem Jahr, das du nochmal leben würdest."),
  guess("cheeky", 2, "Rote Flagge", "Ein Song, den du einer Person übel nehmen würdest, wenn sie ihn mag."),
  guess("funny", 0, "Fitnessstudio", "Letzte Wiederholung, nichts geht mehr. Was hilft?"),
  guess("deep", 3, "Zum Weinen", "Ein Lied, bei dem du zuverlässig schlucken musst."),
  guess("cheeky", 3, "Zu laut", "Wird gerne zu laut gedreht, sobald die Tür zu ist."),
  guess("funny", 2, "Bühne frei", "Du hast fünf Minuten auf einer Festivalbühne. Ein Song."),

  // ——— SPEED: 25 seconds, first thing that comes to mind, no fail state
  speed("funny", 0, "Sofort", "Der erste Song, der dir zu {you} einfällt. Nicht nachdenken."),
  speed("funny", 0, "Montag", "Montagmorgen in einem Lied. Schnell."),
  speed("cheeky", 1, "Tanzfläche", "Bringt dich auf jede Tanzfläche, egal wie müde du bist."),
  speed("deep", 1, "Kindheit", "Das Lied aus dem Auto deiner Eltern. Das erste, das kommt."),
  speed("funny", 1, "Ohrwurm", "Steckt gerade in deinem Kopf fest. Gib es zu."),
  speed("cheeky", 2, "Spiegelmoment", "Läuft, wenn du dich vor dem Ausgehen im Spiegel ziemlich gut findest."),
  speed("deep", 2, "Regen", "Regen am Fenster, Tee, kein Plan. Ein Song."),
  speed("sensual", 3, "Kurz davor", "Das Lied für die Sekunde, bevor jemand den ersten Schritt macht."),
];

/** Guess-round vibes the partner predicts before the reveal. */
export const MUSIC_VIBES = ["Nostalgisch", "Guilty Pleasure", "Gefährlich gut", "Komplett unerwartet"] as const;
