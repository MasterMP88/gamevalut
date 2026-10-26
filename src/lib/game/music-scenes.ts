import type { Flavor, MusicMode, MusicSignature, Scene } from "./types";

/**
 * PASS//THE AUX — 09. Music is the answer.
 *
 * Standard rounds build familiarity. Signature beats deliberately break the loop every
 * few scenes: choose for the other person, expose a red flag, make an instinct pick or
 * agree on one track together. The app never invents songs or displays lyrics.
 */
let n = 0;
const mk =
  (mode: MusicMode) =>
  (flavor: Flavor, phase: number, title: string, prompt: string, emoji?: string): Scene => ({
    id: `aux-${mode}-${++n}`,
    type: "MUSIC",
    flavor,
    phase,
    title,
    prompt,
    emoji,
    music: { mode },
    only: ["pass-the-aux"],
    ...(mode === "speed" ? { duration: 20 } : {}),
  });
const solo = mk("solo");
const duet = mk("duet");
const guess = mk("guess");
const speed = mk("speed");
const consensus = mk("consensus");

type SignatureCue = [title: string, prompt: string, flavor?: Flavor, phase?: number];
const signatureDeck = (
  signature: MusicSignature,
  mode: MusicMode,
  cues: SignatureCue[],
): Scene[] =>
  cues.map(([title, prompt, flavor = "funny", phase = 2], index) => ({
    id: `aux-signature-${signature}-${index + 1}`,
    type: "MUSIC",
    flavor,
    phase,
    title,
    prompt,
    music: { mode, signature },
    only: ["pass-the-aux"],
    source: "local",
    ...(mode === "speed" ? { duration: 20 } : {}),
  }));

export const MUSIC_SCENES: Scene[] = [
  // ——— TUNE IN · quick identity, low friction
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

  // ——— SAME FREQUENCY · both pick blind
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

  // ——— READ ME · one hides, the other reads the reason before reveal
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

  // ——— QUICK DRAW · no fail state; timeout flips the rule
  speed("funny", 0, "Sofort", "Der erste Song, der dir zu {you} einfällt. Nicht nachdenken."),
  speed("funny", 0, "Montag", "Montagmorgen in einem Lied. Schnell."),
  speed("cheeky", 1, "Tanzfläche", "Bringt dich auf jede Tanzfläche, egal wie müde du bist."),
  speed("deep", 1, "Kindheit", "Das Lied aus dem Auto deiner Eltern. Das erste, das kommt."),
  speed("funny", 1, "Ohrwurm", "Steckt gerade in deinem Kopf fest. Gib es zu."),
  speed("cheeky", 2, "Spiegelmoment", "Läuft, wenn du dich vor dem Ausgehen im Spiegel ziemlich gut findest."),
  speed("deep", 2, "Regen", "Regen am Fenster, Tee, kein Plan. Ein Song."),
  speed("sensual", 3, "Kurz davor", "Das Lied für die Sekunde, bevor jemand den ersten Schritt macht."),

  // ——— ONE SONG · together, intentionally not hidden
  consensus("funny", 1, "Ein Raum. Ein Track.", "Ihr bekommt genau einen Song für diesen Raum. Einigt euch."),
  consensus("deep", 2, "Gemeinsamer Nenner", "Ein Song, den ihr beide heute wirklich hören wollt. Keine Ironie."),
  consensus("cheeky", 2, "Keine Ausrede", "Ein Track, bei dem keiner von euch so tun darf, als wäre er zu cool dafür."),
  consensus("deep", 3, "Bleiben", "Nur ein Song darf euch noch fünf Minuten länger hier halten. Welcher?"),

  // ——— SIGNATURE: AUX SWAP · choose for the other person
  ...signatureDeck("aux-swap", "solo", [
    ["AUX SWAP · Main Character", "Wähle die Einlaufmusik für {you}. Nicht nett sein – treffend.", "cheeky", 1],
    ["AUX SWAP · Montag", "Welcher Song würde {you} montags erstaunlich gut retten?", "funny", 1],
    ["AUX SWAP · Geheime Stärke", "Ein Track für eine Seite von {you}, die andere zu selten sehen.", "deep", 2],
    ["AUX SWAP · Karaoke", "Du meldest {you} ungefragt zum Karaoke an. Welcher Song?", "funny", 1],
    ["AUX SWAP · Urlaub", "Der erste Track in {you}s perfektem Urlaub. Du entscheidest.", "funny", 2],
    ["AUX SWAP · Glow-up", "Soundtrack für {you}s völlig übertriebenen Slow-Motion-Auftritt.", "cheeky", 2],
    ["AUX SWAP · Durchhalten", "Ein Song, den du {you} an einem miesen Tag schicken würdest.", "deep", 3],
    ["AUX SWAP · Tanzfläche", "Welcher Track bringt {you} am ehesten freiwillig auf die Tanzfläche?", "funny", 2],
    ["AUX SWAP · Heimlich passend", "Ein Song, der viel besser zu {you} passt, als {you} zugeben würde.", "cheeky", 3],
    ["AUX SWAP · Abspann", "Du schneidest den Film über {you}. Welcher Song läuft im Abspann?", "deep", 3],
  ]),

  // ——— SIGNATURE: RED FLAG · blind duel + judgement
  ...signatureDeck("red-flag", "duet", [
    ["RED FLAG · Sofortiges Urteil", "Ein Song, bei dem du jemanden kurz beurteilen würdest. Beide blind.", "cheeky", 1],
    ["RED FLAG · Auto-DJ", "Ein Track, der beim ersten Date im Auto riskant wäre. Beide wählen.", "funny", 1],
    ["RED FLAG · Hochzeits-DJ", "Welcher Song wäre auf einer Hochzeit unverzeihlich – und trotzdem lustig?", "funny", 2],
    ["RED FLAG · Zu ernst", "Ein Track, den Menschen viel zu ernst nehmen. Beide blind.", "cheeky", 2],
    ["RED FLAG · Ex-Alarm", "Ein Song, bei dem eine sehr spezifische Geschichte im Raum stehen könnte.", "cheeky", 3],
    ["RED FLAG · Gym Crime", "Der Track, bei dem du im Gym innerlich sofort urteilst.", "funny", 1],
    ["RED FLAG · Party vorbei", "Welcher Song kann eine gute Party in zehn Sekunden ruinieren?", "funny", 2],
    ["RED FLAG · Guilty Defense", "Ein Song, den du gegen jede Kritik verteidigen würdest. Leider.", "cheeky", 2],
    ["RED FLAG · Zu viel Gefühl", "Ein Track, der emotional gefährlicher ist, als er klingt.", "deep", 3],
    ["RED FLAG · Kein Kommentar", "Ein Song, bei dem dein Musikgeschmack vor Gericht müsste.", "funny", 3],
  ]),

  // ——— SIGNATURE: NEEDLE DROP · instinct; timeout becomes second-thought
  ...signatureDeck("needle-drop", "speed", [
    ["NEEDLE DROP · 2:17", "Der Song, der nach 2:17 Uhr klingt. Zwanzig Sekunden.", "cheeky", 1],
    ["NEEDLE DROP · Fenster runter", "Nachtfahrt. Fenster runter. Erster Track.", "funny", 1],
    ["NEEDLE DROP · Schlechte Idee", "Direkt vor einer sehr schlechten Idee. Was läuft?", "funny", 2],
    ["NEEDLE DROP · Gänsehaut", "Ein Song mit sofortiger Gänsehaut. Nicht analysieren.", "deep", 2],
    ["NEEDLE DROP · Zu laut", "Der Track, den du immer ein bisschen zu laut hörst.", "cheeky", 2],
    ["NEEDLE DROP · Sommer", "Ein einziger Track für einen Sommer, den du behalten würdest.", "deep", 2],
    ["NEEDLE DROP · Tanz", "Du hast zehn Sekunden Mut. Welcher Song startet ihn?", "funny", 1],
    ["NEEDLE DROP · Textnachricht", "Du bekommst gerade die Nachricht, auf die du gehofft hast. Song?", "deep", 3],
    ["NEEDLE DROP · Mitternacht", "Mitternacht. Neuer Tag. Welcher Track zuerst?", "cheeky", 3],
    ["NEEDLE DROP · Noch einmal", "Der Song, den du heute unbedingt noch einmal hören willst.", "deep", 3],
  ]),

  // ——— SIGNATURE: ONE SONG · negotiation changes the social rhythm
  ...signatureDeck("one-song", "consensus", [
    ["ONE SONG · Roadtrip", "Ihr fahrt jetzt los. Einigt euch auf genau einen ersten Track.", "funny", 1],
    ["ONE SONG · Küche", "Küchenlicht, etwas zu spät, niemand will gehen. Ein Track für euch beide.", "funny", 1],
    ["ONE SONG · Kein Skip", "Ein Song, den heute keiner von euch skippen dürfte. Einigt euch.", "cheeky", 2],
    ["ONE SONG · Erinnerung", "Ein Song, der irgendwann nach genau diesem Abend klingen könnte.", "deep", 3],
    ["ONE SONG · Tanzfläche", "Ihr bekommt gemeinsam genau einen Wunsch beim DJ. Welchen?", "funny", 2],
    ["ONE SONG · Friedensvertrag", "Eure Geschmäcker kollidieren. Findet trotzdem einen Track, den beide unterschreiben.", "funny", 2],
    ["ONE SONG · Langsam", "Ein langsamer Song, bei dem keiner von euch die Augen verdreht.", "sensual", 3],
    ["ONE SONG · Morgen", "Der erste Track morgen früh, wenn diese Nacht noch nachhängt.", "deep", 3],
    ["ONE SONG · Fremde Stadt", "Ihr seid in einer fremden Stadt und kennt niemanden. Dieser Track gehört euch.", "cheeky", 3],
    ["ONE SONG · Bleibt", "Nur dieser Song darf den Abend gerade verlängern. Entscheidet zusammen.", "deep", 3],
  ]),

  // ——— SIGNATURE: LAST TRACK · preferred by the engine for a planned final scene
  ...signatureDeck("last-track", "consensus", [
    ["LAST TRACK · Abspann", "Wenn diese Nacht jetzt endet: Welcher Song läuft im Abspann?", "deep", 3],
    ["LAST TRACK · Licht an", "Gleich geht das Licht an. Welcher Song bekommt die letzten Minuten?", "deep", 3],
    ["LAST TRACK · Noch nicht", "Der letzte Track – aber einer, bei dem ihr eigentlich noch nicht gehen wollt.", "cheeky", 3],
    ["LAST TRACK · Morgen weiß es", "Welcher Song soll morgen sofort wieder nach heute klingen?", "deep", 3],
    ["LAST TRACK · Keine Worte", "Kein Fazit. Nur ein gemeinsamer letzter Song.", "deep", 3],
    ["LAST TRACK · Side N//", "Euer Record braucht einen Schlusstrack. Einigt euch auf den einzigen richtigen.", "cheeky", 3],
  ]),
];

/** GUESS rounds: the partner predicts why this song was chosen, then the picker judges the read. */
export const MUSIC_VIBES = ["Erinnerung", "Guilty Pleasure", "Für dich", "Chaos"] as const;

export const AUX_SIGNATURE_CADENCE = 5;
