// Generated from packages/gang-core/src/playbooks.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import { EXTRA_PROMPTS } from "./extra-prompts.js";
import type { GameCapability, GameMechanic } from "./types.js";

export type GangGameId =
  | "the-majority"
  | "whos-that"
  | "undercover"
  | "secret-missions"
  | "bad-answers-only"
  | "bluff"
  | "the-line"
  | "hot-seat"
  | "team-chaos"
  | "photo-hunt"
  | "draw-this"
  | "music-drop"
  | "time-drop"
  | "chain-reaction"
  | "one-of-you"
  | "panic-button"
  | "after-dark";

export type GangStageKind =
  | "private"
  | "predict"
  | "answer"
  | "vote"
  | "perform"
  | "react"
  | "reveal"
  | "score";

export interface GangPrompt {
  id: string;
  prompt: string;
  subline?: string;
  options?: string[];
  answer?: string;
  aliases?: string[];
  altPrompt?: string;
  seconds?: number;
  category?: string;
}

export interface GangPlaybook {
  id: GangGameId;
  title: string;
  /** Dedicated runtimes bypass the generic stage engine. */
  runtime?: "generic" | "time-drop";
  promise: string;
  howItFeels: string;
  mechanic: GameMechanic;
  minPlayers: number;
  maxPlayers: number;
  rounds: [number, number];
  stages: GangStageKind[];
  scoring: string;
  finale: string;
  capabilities: GameCapability[];
  safetyNote?: string;
  prompts: GangPrompt[];
}

const prompts = (game: string, rows: Array<Omit<GangPrompt, "id">>): GangPrompt[] =>
  rows.map((row, index) => ({ id: `${game}-${String(index + 1).padStart(2, "0")}`, ...row }));

export const GANG_PLAYBOOKS: readonly GangPlaybook[] = [
  {
    id: "the-majority",
    title: "THE MAJORITY",
    promise: "Du gewinnst nicht, wenn du recht hast. Du gewinnst, wenn du den Raum lesen kannst.",
    howItFeels: "Schnelle Bauchentscheidungen, dann ein Reveal, über den garantiert diskutiert wird.",
    mechanic: "majority",
    minPlayers: 3,
    maxPlayers: 99,
    rounds: [5, 12],
    stages: ["predict", "answer", "reveal", "score"],
    scoring: "1 Punkt für jede richtige Mehrheits-Prognose; bei Gleichstand zählen alle Spitzenoptionen.",
    finale: "Die letzte Runde ist Blind Majority: Erst prognostizieren, dann erscheint die Frage.",
    capabilities: [],
    prompts: prompts("majority", [
      { prompt: "Was rettet einen komplett verkorksten Abend eher?", options: ["Essen", "Musik", "Ein Ortswechsel", "Eine absurde Idee"] },
      { prompt: "Was wäre für diese Runde schlimmer?", options: ["Handy 24h weg", "Kaffee 7 Tage weg", "Streaming 30 Tage weg", "Nie wieder Sprachnachrichten"] },
      { prompt: "Welches Talent hätte der Raum am liebsten sofort?", options: ["Jede Sprache", "Perfekt kochen", "Menschen lesen", "Nie müde sein"] },
      { prompt: "Was ist die gefährlichste Party-Lüge?", options: ["Nur ein Drink", "Ich bleibe kurz", "Ich kenne den Weg", "Morgen bin ich fit"] },
      { prompt: "Wofür gibt die Runde am ehesten zu viel Geld aus?", options: ["Reisen", "Essen", "Technik", "Klamotten"] },
      { prompt: "Welche Superkraft wäre nach 48 Stunden schon nervig?", options: ["Gedanken lesen", "Unsichtbar sein", "Zeit stoppen", "Fliegen"] },
      { prompt: "Was macht jemanden sofort sympathischer?", options: ["Humor", "Selbstironie", "Neugier", "Gute Geschichten"] },
      { prompt: "Welche Nachricht löst am meisten Chaos aus?", options: ["Bin gleich da", "Wir müssen reden", "Ich hab da eine Idee", "Bring nichts mit"] },
      { prompt: "Was ist der beste Mitternachts-Snack?", options: ["Pizza", "Pommes", "Döner", "Etwas Süßes"] },
      { prompt: "Womit würde diese Runde eher viral gehen?", options: ["Tanz", "Fail", "Hot Take", "Komplett absurde Aktion"] },
    ]),
  },
  {
    id: "whos-that",
    title: "WHO'S THAT?",
    promise: "Eine Frage. Alle zeigen auf jemanden. Niemand kann sich verstecken.",
    howItFeels: "Sofort sozial, ein bisschen frech, mit maximal kurzem Regelweg.",
    mechanic: "social-vote",
    minPlayers: 3,
    maxPlayers: 99,
    rounds: [6, 14],
    stages: ["vote", "reveal"],
    scoring: "Kein klassischer Gewinner. Titel und Streaks entstehen aus den Reveals.",
    finale: "Am Ende vergibt das Spiel drei Live-Titel aus den häufigsten Nominierungen.",
    capabilities: [],
    prompts: prompts("whos-that", [
      { prompt: "Wer würde am ehesten spontan einen Flug für morgen buchen?" },
      { prompt: "Wer könnte am überzeugendsten so tun, als wäre absolut nichts passiert?" },
      { prompt: "Wer würde in einer Zombie-Apokalypse überraschend lange durchhalten?" },
      { prompt: "Wer hat die höchste Chance, aus Versehen in einer fremden Hochzeit zu landen?" },
      { prompt: "Wer würde am ehesten eine komplett unnötige Wette gewinnen wollen?" },
      { prompt: "Wer könnte einen geheimen Doppelleben-Plot am längsten verbergen?" },
      { prompt: "Wer wäre als Reality-TV-Teilnehmer sofort quotenstark?" },
      { prompt: "Wer würde am ehesten drei Stunden zu früh am Flughafen sein?" },
      { prompt: "Wer kann am schlechtesten Pokerface?" },
      { prompt: "Wer wäre der gefährlichste Mitspieler in einem Escape Room?" },
    ]),
  },
  {
    id: "undercover",
    title: "UNDERCOVER",
    promise: "Fast alle kennen dasselbe Wort. Eine Person muss reden, ohne zu wissen, worüber.",
    howItFeels: "Bluff, Deduktion und diese eine Sekunde, in der alle plötzlich dieselbe Person anschauen.",
    mechanic: "secret-role",
    minPlayers: 4,
    maxPlayers: 30,
    rounds: [3, 7],
    stages: ["private", "answer", "vote", "reveal", "score"],
    scoring: "Zivilisten erhalten 1 Punkt fürs Enttarnen; Undercover erhält 3 Punkte, wenn die Runde überlebt wird.",
    finale: "Finale mit zwei Undercover-Spielern ab 8 Personen.",
    capabilities: [],
    prompts: prompts("undercover", [
      { prompt: "ORT", answer: "Flughafen", altPrompt: "Bahnhof" },
      { prompt: "ESSEN", answer: "Pizza", altPrompt: "Flammkuchen" },
      { prompt: "URLAUB", answer: "Strand", altPrompt: "Pool" },
      { prompt: "ALLTAG", answer: "Supermarkt", altPrompt: "Drogerie" },
      { prompt: "NACHT", answer: "Club", altPrompt: "Bar" },
      { prompt: "REISE", answer: "Hotel", altPrompt: "Ferienwohnung" },
      { prompt: "SOMMER", answer: "Eis", altPrompt: "Cocktail" },
      { prompt: "EVENT", answer: "Festival", altPrompt: "Konzert" },
      { prompt: "WOCHENENDE", answer: "Brunch", altPrompt: "Frühstück" },
      { prompt: "STADT", answer: "Taxi", altPrompt: "Uber" },
    ]),
  },
  {
    id: "secret-missions",
    title: "SECRET MISSIONS",
    promise: "Das Spiel läuft im Hintergrund weiter, während alle glauben, gerade etwas anderes zu spielen.",
    howItFeels: "Lebendige Side-Quests, die den echten Raum statt nur den Bildschirm zum Spielfeld machen.",
    mechanic: "secret-mission",
    minPlayers: 3,
    maxPlayers: 30,
    rounds: [1, 3],
    stages: ["private", "perform", "reveal", "score"],
    scoring: "2 Punkte pro unentdeckt erfüllter Mission; 1 Bonuspunkt für einen korrekten Verdacht.",
    finale: "Alle Missionen werden als Timeline mit den besten unbemerkten Momenten aufgedeckt.",
    capabilities: [],
    prompts: prompts("mission", [
      { prompt: "Bring jemanden dazu, innerhalb der nächsten 15 Minuten das Wort „wirklich“ zweimal zu sagen." },
      { prompt: "Sorge dafür, dass jemand dir freiwillig etwas reicht, ohne direkt danach zu fragen." },
      { prompt: "Baue unauffällig einen Filmtitel in ein normales Gespräch ein." },
      { prompt: "Bring zwei andere Personen dazu, gleichzeitig auf ihr Handy zu schauen." },
      { prompt: "Löse einen Toast aus, ohne selbst zuerst dein Glas zu heben.", altPrompt: "Löse einen gemeinsamen Cheers-Moment ohne Alkohol aus." },
      { prompt: "Bring jemanden dazu, deine Sitzposition zu übernehmen." },
      { prompt: "Sorge dafür, dass jemand ein Foto von etwas völlig Alltäglichem macht." },
      { prompt: "Bring die Gruppe dazu, über eine Person zu reden, die heute gar nicht da ist." },
      { prompt: "Verwende drei Minuten lang kein Wort mit dem Buchstaben E – und lass es niemanden merken." },
      { prompt: "Starte eine Mini-Diskussion über etwas komplett Unwichtiges und beende sie wieder friedlich." },
      { prompt: "Bring jemanden dazu, eine Zahl zwischen 1 und 10 laut zu sagen." },
      { prompt: "Sorge dafür, dass zwei Personen ihre Plätze tauschen." },
      { prompt: "Bring jemanden dazu, dir eine Frage zu stellen, die mit „Warum“ beginnt." },
      { prompt: "Sorge dafür, dass mindestens drei Personen gleichzeitig lachen." },
      { prompt: "Bring jemanden dazu, ein Lied anzusummen, ohne selbst zuerst zu singen." },
      { prompt: "Sorge dafür, dass jemand die Uhrzeit nachschaut." },
      { prompt: "Bring jemanden dazu, von einer Reise zu erzählen." },
      { prompt: "Lass eine andere Person das Wort „Chaos“ benutzen." },
      { prompt: "Bring jemanden dazu, dir einen Spitznamen zu geben." },
      { prompt: "Sorge dafür, dass die Gruppe kurz über Essen spricht." },
      { prompt: "Bring jemanden dazu, eine Person im Raum freundlich zu imitieren." },
      { prompt: "Sorge dafür, dass jemand aufsteht und kurz den Platz verlässt." },
      { prompt: "Bring zwei Personen dazu, sich gegenseitig High Five zu geben." },
      { prompt: "Sorge dafür, dass jemand einen Gegenstand im Raum genauer betrachtet." },
      { prompt: "Bring jemanden dazu, einen Film oder eine Serie zu empfehlen." },
      { prompt: "Lass jemanden freiwillig eine kleine Geschichte aus der Schulzeit erzählen." },
      { prompt: "Bring jemanden dazu, das Wort „ehrlich“ in einem Satz zu benutzen." },
      { prompt: "Sorge dafür, dass die Gruppe für zehn Sekunden komplett still ist, ohne die Mission zu verraten." },
      { prompt: "Bring jemanden dazu, dir zu widersprechen und danach zu lachen." },
      { prompt: "Sorge dafür, dass jemand einen Gegenstand an eine andere Person weitergibt." },
    ]),
  },
  {
    id: "bad-answers-only",
    title: "BAD ANSWERS ONLY",
    promise: "Die richtige Antwort ist verboten. Die beste falsche gewinnt.",
    howItFeels: "Schnell, kreativ und dank anonymem Reveal auch für Leute gut, die sonst nie laut improvisieren.",
    mechanic: "story",
    minPlayers: 3,
    maxPlayers: 30,
    rounds: [5, 10],
    stages: ["answer", "vote", "reveal", "score"],
    scoring: "2 Punkte für den meistgewählten schlechten Antwort-Gag; 1 Bonuspunkt für einen einzigartigen Vote.",
    finale: "Finale: Eine Antwort pro Person, aber nur fünf Wörter.",
    capabilities: [],
    prompts: prompts("bad", [
      { prompt: "Warum ist der Kühlschrank nachts lauter?" },
      { prompt: "Was ist der wahre Grund für Flugmodus?" },
      { prompt: "Was sollte auf keinem Bewerbungsgespräch fehlen?" },
      { prompt: "Warum gibt es eigentlich Kreisverkehre?" },
      { prompt: "Was macht WLAN nachts, wenn alle schlafen?" },
      { prompt: "Wofür wurde der Montag ursprünglich erfunden?" },
      { prompt: "Was ist das geheime vierte Ampel-Signal?" },
      { prompt: "Warum dauert „bin in fünf Minuten da“ immer länger?" },
      { prompt: "Was passiert wirklich mit verschwundenen Socken?" },
      { prompt: "Was ist die wichtigste Zutat in einem Meeting?" },
    ]),
  },
  {
    id: "bluff",
    title: "BLUFF",
    promise: "Jede Person erfindet eine plausible Lüge. Dann versucht der Raum, die Wahrheit wiederzufinden.",
    howItFeels: "Fibbage-Energie ohne Trivia-Staub: kurze Fakten, gute Lügen, sofortige Schadenfreude.",
    mechanic: "bluff",
    minPlayers: 3,
    maxPlayers: 20,
    rounds: [5, 9],
    stages: ["private", "answer", "vote", "reveal", "score"],
    scoring: "Die wechselnde Wahrheitsperson pausiert. 2 Punkte für die Wahrheit, 1 Punkt pro Person, die auf deine Lüge fällt.",
    finale: "Finale: Treffer auf die Wahrheit zählen doppelt — gute Lügen bleiben trotzdem gefährlich.",
    capabilities: [],
    prompts: prompts("bluff", [
      { prompt: "Wie viele Herzen hat ein Oktopus?", answer: "Drei" },
      { prompt: "Welches Tier kann beim Schlafen eine Gehirnhälfte wach lassen?", answer: "Delfin" },
      { prompt: "Was ist älter: Oxford University oder das Aztekenreich?", answer: "Oxford University" },
      { prompt: "Welches Land hat mehr Pyramiden als Ägypten?", answer: "Sudan" },
      { prompt: "Wie heißt die Angst vor langen Wörtern ironischerweise?", answer: "Hippopotomonstrosesquipedaliophobie" },
      { prompt: "Welches Lebensmittel kann bei richtiger Lagerung praktisch ewig haltbar bleiben?", answer: "Honig" },
      { prompt: "Welches Säugetier kann nicht springen?", answer: "Elefant" },
      { prompt: "Welche Farbe ist die Haut eines Eisbären unter dem Fell?", answer: "Schwarz" },
      { prompt: "Welcher Planet dreht sich fast liegend um die Sonne?", answer: "Uranus" },
      { prompt: "Welches Tier produziert würfelförmigen Kot?", answer: "Wombat" },
    ]),
  },
  {
    id: "the-line",
    title: "THE LINE",
    promise: "Keine Buttons reichen: Der Raum selbst wird zur Skala.",
    howItFeels: "Alle stehen auf, ordnen sich wortlos und sehen dann, wie sehr sie sich selbst oder die anderen falsch eingeschätzt haben.",
    mechanic: "physical",
    minPlayers: 4,
    maxPlayers: 99,
    rounds: [4, 9],
    stages: ["perform", "reveal"],
    scoring: "Optional 1 Punkt für exakte Nachbarschaften; standardmäßig spielt ihr um den Reveal, nicht um Tabellen.",
    finale: "Silent Line: komplett ohne Sprechen, erst danach darf diskutiert werden.",
    capabilities: [],
    prompts: prompts("line", [
      { prompt: "Stellt euch auf: Wer würde am spontansten morgen verreisen? Links = nie, rechts = sofort." },
      { prompt: "Stellt euch nach Morgenmensch-Faktor auf." },
      { prompt: "Stellt euch nach „würde in einer Quizshow weit kommen“ auf." },
      { prompt: "Stellt euch nach Chaos im eigenen Browser-Tab-Leben auf." },
      { prompt: "Stellt euch nach Wahrscheinlichkeit auf, heute noch Essen zu bestellen." },
      { prompt: "Stellt euch nach „kann ein Geheimnis behalten“ auf." },
      { prompt: "Stellt euch nach Abenteuerlust auf." },
      { prompt: "Stellt euch nach Pünktlichkeit auf." },
      { prompt: "Stellt euch nach „würde eher ohne Plan losfahren“ auf." },
      { prompt: "Stellt euch nach „hat die wildeste Story, erzählt sie aber nicht“ auf." },
    ]),
  },
  {
    id: "hot-seat",
    title: "HOT SEAT",
    promise: "Eine Person entscheidet geheim. Alle anderen wetten darauf, wie gut sie diese Person kennen.",
    howItFeels: "Spotlight ohne Verhör: kurze Wahl, verdeckte Prognose, knackiger Reveal.",
    mechanic: "hot-seat",
    minPlayers: 3,
    maxPlayers: 20,
    rounds: [6, 12],
    stages: ["private", "predict", "reveal", "score"],
    scoring: "1 Punkt für richtige Prognose; Hot-Seat-Spieler bekommt 1 Punkt, wenn weniger als die Hälfte richtig liegt.",
    finale: "Finale: Die letzten Hot-Seat-Prognosen zählen doppelt.",
    capabilities: [],
    prompts: prompts("hot", [
      { prompt: "Du bekommst spontan 500 €. Was nimmst du?", options: ["Kurztrip", "Essen gehen", "Technik", "Sparen"] },
      { prompt: "Freier Sonntag. Was zuerst?", options: ["Ausschlafen", "Rausgehen", "Sport", "Brunch"] },
      { prompt: "Welche Rolle nimmst du im Escape Room?", options: ["Rätsel", "Organisation", "Chaos", "Motivation"] },
      { prompt: "Was wäre dein unnötig luxuriöses Upgrade?", options: ["Hotel", "Küche", "Kleidung", "Transport"] },
      { prompt: "Wenn du heute noch wegfliegst: wohin?", options: ["Meer", "Großstadt", "Berge", "Irgendwo warm"] },
      { prompt: "Was nervt dich auf Reisen zuerst?", options: ["Warten", "Planung", "Menschen", "Schlechtes Essen"] },
      { prompt: "Welche Nachricht beantwortest du am schnellsten?", options: ["„Essen?“", "„Bist du da?“", "„Notfall“", "„Hab eine Idee“"] },
      { prompt: "Was würdest du eher gewinnen?", options: ["Quiz", "Poker", "Karaoke", "Kochduell"] },
      { prompt: "Welche Fähigkeit würdest du sofort nehmen?", options: ["Teleportieren", "Sprachen", "Nie müde", "Perfektes Gedächtnis"] },
      { prompt: "Was ist dein gefährlichster Impulskauf?", options: ["Reise", "Essen", "Technik", "Deko"] },
    ]),
  },
  {
    id: "team-chaos",
    title: "TEAM CHAOS",
    promise: "Zwei Seiten des Raums. Sehr kurze Aufgaben. Sehr laute Reaktionen.",
    howItFeels: "TV-Show-Energie ohne Moderator: schnelle Teamwechsel, Comebacks und Aufgaben, bei denen niemand lange zuschaut.",
    mechanic: "team",
    minPlayers: 6,
    maxPlayers: 99,
    rounds: [6, 12],
    stages: ["perform", "react", "reveal", "score"],
    scoring: "Rundensieg = 2 Punkte; Underdog-Team bekommt nach zwei Niederlagen einen 1-Punkt-Comeback-Chip, automatisch beim nächsten Sieg nach zwei Niederlagen (einmal je Team).",
    finale: "Finale: Die letzte Team-Challenge zählt doppelt.",
    capabilities: [],
    prompts: prompts("team", [
      { prompt: "Nennt abwechselnd Dinge, die man im Hotelzimmer findet. 5 Sekunden pro Antwort.", seconds: 5, category: "Kette" },
      { prompt: "Eine Person pro Team beschreibt denselben Begriff ohne die drei offensichtlichen Wörter.", answer: "Urlaub", subline: "Begriff: Urlaub. Tabu: Reise, frei, Ferien. Je Team beschreibt eine Person, die anderen raten. Nur die Beschreibenden schauen aufs Display.", category: "Tabu" },
      { prompt: "Beide Teams wählen geheim 0–5 Finger. Welches Team trifft die Gesamtsumme besser?", category: "Prediction" },
      { prompt: "30 Sekunden: Baut aus Gegenständen am Tisch den höchsten freistehenden Turm.", seconds: 30, category: "Build" },
      { prompt: "Eine Person mimt drei Begriffe. Wie viele schafft das Team in 30 Sekunden?", seconds: 30, subline: "Begriffe für die Darstellenden: Zahnarzt · Pinguin · Waschmaschine. Alle anderen schauen weg. Pro erkanntem Begriff ein Treffer.", category: "Mime" },
      { prompt: "Nennt Songs mit einer Farbe im Titel. Kein Titel doppelt.", seconds: 5, category: "Music" },
      { prompt: "Schätzt gemeinsam: Wie viele ungelesene Nachrichten hat euer Team zusammen?", category: "Estimate" },
      { prompt: "Eine Person zeichnet mit geschlossenen Augen einen Gegenstand, Team muss ihn erkennen.", seconds: 25, subline: "Begriff für die Zeichnenden: Gießkanne. Ratende schauen weg.", category: "Draw" },
      { prompt: "Findet in 20 Sekunden fünf Gegenstände, die mit demselben Buchstaben beginnen.", seconds: 20, category: "Hunt" },
      { prompt: "Sagt abwechselnd Städte. Wer länger als 4 Sekunden braucht, verliert die Runde.", seconds: 4, category: "Chain" },
    ]),
  },
  {
    id: "photo-hunt",
    title: "PHOTO HUNT",
    promise: "Die Kamera ist nicht Deko. Der echte Raum wird zur Challenge.",
    howItFeels: "Kurze kreative Foto-Missionen, dann anonymer Gallery-Reveal und Crowd-Vote.",
    mechanic: "photo",
    minPlayers: 3,
    maxPlayers: 30,
    rounds: [4, 8],
    stages: ["perform", "vote", "reveal", "score"],
    scoring: "2 Punkte für Crowd-Favorit, 1 Bonuspunkt für eine Einreichung ohne erkennbare Gesichter.",
    finale: "Finale mit nur 20 Sekunden und einem gemeinsamen Thema.",
    capabilities: ["camera"],
    safetyNote: "Kamera ist optional. Alternativ kann jede Runde mit „Mission erledigt“ ohne Foto gespielt werden.",
    prompts: prompts("photo", [
      { prompt: "Fotografiere etwas, das wie ein Albumcover aussieht.", seconds: 30 },
      { prompt: "Finde im Raum ein Gesicht, das gar kein Gesicht ist.", seconds: 30 },
      { prompt: "Mach ein Foto, das „Montagmorgen“ schreit, ohne Menschen zu zeigen.", seconds: 35 },
      { prompt: "Baue in 40 Sekunden die luxuriöseste Mini-Szene aus drei Gegenständen.", seconds: 40 },
      { prompt: "Fotografiere den dramatischsten Schatten im Raum.", seconds: 30 },
      { prompt: "Mach ein Bild, das wie ein Tatort aussieht, aber komplett harmlos ist.", seconds: 35 },
      { prompt: "Fotografiere etwas maximal Alltägliches wie ein Kunstwerk.", seconds: 30 },
      { prompt: "Erzeuge mit Perspektive eine optische Täuschung.", seconds: 45 },
    ]),
  },
  {
    id: "draw-this",
    title: "DRAW THIS",
    promise: "Ein Wort bleibt geheim. Eine Person zeichnet. Alle anderen raten gleichzeitig.",
    howItFeels: "Null Kunstanspruch, schnelle Guesses und ein Reveal, bei dem schlechte Zeichnungen besser sind als gute.",
    mechanic: "drawing",
    minPlayers: 3,
    maxPlayers: 30,
    rounds: [6, 12],
    stages: ["private", "perform", "answer", "reveal", "score"],
    scoring: "Erster richtiger Guess = 2 Punkte; Zeichner = 1 Punkt, wenn jemand es schafft.",
    finale: "Finale: 15 Sekunden, falsche Hand oder Augen halb geschlossen.",
    capabilities: [],
    prompts: prompts("draw", [
      { prompt: "Nur für den Zeichner", answer: "Flamingo", seconds: 30 },
      { prompt: "Nur für den Zeichner", answer: "Koffer", seconds: 30 },
      { prompt: "Nur für den Zeichner", answer: "Achterbahn", seconds: 35 },
      { prompt: "Nur für den Zeichner", answer: "Espressomaschine", seconds: 35 },
      { prompt: "Nur für den Zeichner", answer: "Vulkan", seconds: 30 },
      { prompt: "Nur für den Zeichner", answer: "Selfie-Stick", seconds: 30 },
      { prompt: "Nur für den Zeichner", answer: "Campingplatz", seconds: 35 },
      { prompt: "Nur für den Zeichner", answer: "Roboterstaubsauger", seconds: 35 },
      { prompt: "Nur für den Zeichner", answer: "Karaoke", seconds: 30 },
      { prompt: "Nur für den Zeichner", answer: "Flughafenkontrolle", seconds: 40 },
    ]),
  },
  {
    id: "music-drop",
    title: "MUSIC DROP",
    promise: "Die Antwort ist ein Song. Nicht erklären – auswählen, locken, reveal.",
    howItFeels: "Musik wird zur sozialen Antwort. Voll spielbar ohne Streaming-Login; Provider sind nur ein Komfort-Layer.",
    mechanic: "music",
    minPlayers: 2,
    maxPlayers: 99,
    rounds: [5, 10],
    stages: ["answer", "vote", "reveal", "score"],
    scoring: "2 Punkte für Crowd-Pick; 1 Match-Punkt, wenn zwei oder mehr denselben Track wählen.",
    finale: "Aus den Gewinnern entsteht die Tracklist der Runde.",
    capabilities: ["music"],
    safetyNote: "Ohne verbundenen Musikdienst werden Titel/Artist manuell eingegeben; das Spiel bleibt vollständig spielbar.",
    prompts: prompts("music", [
      { prompt: "Welcher Song würde jetzt den Raum sofort verändern?" },
      { prompt: "Welcher Track gehört in einen Film über diese Gruppe?" },
      { prompt: "Song für 02:17 Uhr, wenn niemand heim will." },
      { prompt: "Welcher Song ist heimlich besser, als du zugeben willst?" },
      { prompt: "Track für einen maximal unnötig dramatischen Auftritt." },
      { prompt: "Welcher Song wäre die falsche, aber perfekte Hochzeitsmusik?" },
      { prompt: "Song, den du nach drei Sekunden erkennst." },
      { prompt: "Welcher Track macht aus Küche sofort Tanzfläche?" },
      { prompt: "Song für einen Roadtrip, wenn noch 400 km fehlen." },
      { prompt: "Welcher Track beendet die Nacht richtig?" },
    ]),
  },
  {
    id: "time-drop",
    title: "TIME//DROP",
    runtime: "time-drop",
    promise: "Hör den Track. Setz ihn in die Zeit. Je enger du lockst, desto mehr zählt.",
    howItFeels: "Eine lebende Musik-Timeline, auf der alle gleichzeitig setzen. Kein DJ, kein QR-Scan, kein Warten auf zehn Einzelzüge.",
    mechanic: "music",
    minPlayers: 2,
    maxPlayers: 99,
    rounds: [8, 16],
    stages: ["answer", "reveal", "score"],
    scoring: "Eigener TIME//DROP-Core: Placement + Precision/Expert-Boni; Teams werden nach Durchschnitt gewertet.",
    finale: "Final Drop: letzter Track, alle dürfen vor dem Reveal auf ±2 Jahre locken.",
    capabilities: ["music"],
    safetyNote: "Der Runtime-Core enthält keine Musikdateien. Playback kommt ausschließlich aus einer separat erlaubten Provider-/Rechte-Schicht.",
    prompts: prompts("time-drop", [
      { prompt: "FLOW · Nur in die Timeline setzen.", category: "Flow" },
      { prompt: "PRECISION · Setzen + ±10 Jahre locken.", category: "Precision" },
      { prompt: "PRECISION · Setzen + ±5 Jahre locken.", category: "Precision" },
      { prompt: "PRECISION · Setzen + ±2 Jahre locken.", category: "Precision" },
      { prompt: "EXPERT · Setzen + exaktes Jahr.", category: "Expert" },
      { prompt: "EXPERT · Jahr + Titel-Bonus.", category: "Expert" },
      { prompt: "CROWD · Alle gleichzeitig, dann Raum-Reveal.", category: "Crowd" },
      { prompt: "FINAL DROP · Engster Lock der Nacht.", category: "Finale" },
    ]),
  },
  {
    id: "chain-reaction",
    title: "CHAIN REACTION",
    promise: "Ein Wort startet. Danach hat jede Person nur Sekunden, die Kette am Leben zu halten.",
    howItFeels: "Kein Nachdenken, nur Assoziation – bis jemand den Raum mit einer völlig absurden Verbindung zerstört.",
    mechanic: "reaction",
    minPlayers: 3,
    maxPlayers: 30,
    rounds: [4, 8],
    stages: ["react", "reveal", "score"],
    scoring: "1 Punkt pro gültiger Antwort im Team-Streak; Wiederholung oder Timeout bricht die Kette.",
    finale: "Final Chain mit 3-Sekunden-Limit.",
    capabilities: [],
    prompts: prompts("chain", [
      { prompt: "Startwort: Urlaub", seconds: 5 },
      { prompt: "Startwort: Nacht", seconds: 5 },
      { prompt: "Startwort: Essen", seconds: 5 },
      { prompt: "Startwort: Berlin", seconds: 5 },
      { prompt: "Startwort: Liebe", seconds: 5 },
      { prompt: "Startwort: Internet", seconds: 5 },
      { prompt: "Startwort: Sommer", seconds: 5 },
      { prompt: "Startwort: Party", seconds: 5 },
      { prompt: "Startwort: Chef", seconds: 5 },
      { prompt: "Startwort: Montag", seconds: 5 },
    ]),
  },
  {
    id: "one-of-you",
    title: "ONE OF YOU",
    promise: "Alle beantworten fast dieselbe Frage. Eine Person hat eine andere bekommen.",
    howItFeels: "Subtiler als klassisches Undercover: Nicht das Wort verrät dich, sondern wie du antwortest.",
    mechanic: "secret-role",
    minPlayers: 4,
    maxPlayers: 30,
    rounds: [4, 8],
    stages: ["private", "answer", "vote", "reveal", "score"],
    scoring: "2 Punkte fürs Enttarnen; Odd Player bekommt 3 Punkte, wenn er nicht gewählt wird.",
    finale: "Im Finale unterscheiden sich die Fragen nur in einem einzigen Wort.",
    capabilities: [],
    prompts: prompts("one", [
      { prompt: "Normal: Was ist ein perfekter Sonntag?", altPrompt: "Odd: Was ist ein perfekter Samstag?" },
      { prompt: "Normal: Was ist auf Reisen unverzichtbar?", altPrompt: "Odd: Was ist auf Reisen völlig überbewertet?" },
      { prompt: "Normal: Welche Eigenschaft macht jemanden sympathisch?", altPrompt: "Odd: Welche Eigenschaft macht jemanden interessant?" },
      { prompt: "Normal: Was würdest du spontan kaufen?", altPrompt: "Odd: Was würdest du niemals spontan kaufen?" },
      { prompt: "Normal: Was ist ein gutes erstes Date?", altPrompt: "Odd: Was ist ein gutes drittes Date?" },
      { prompt: "Normal: Welches Essen geht immer?", altPrompt: "Odd: Welches Essen geht nur selten?" },
      { prompt: "Normal: Was macht einen guten Urlaub aus?", altPrompt: "Odd: Was macht eine gute Geschäftsreise aus?" },
      { prompt: "Normal: Was ist eine gute Partygröße?", altPrompt: "Odd: Was ist eine gute Reisegruppe?" },
    ]),
  },
  {
    id: "panic-button",
    title: "PANIC BUTTON",
    promise: "Der Timer läuft. Antwort geben, Button drücken, weiterreichen. Denkst du zu lange, bleibt die Panik bei dir.",
    howItFeels: "Hot-Potato auf dem Handy mit Kategorien, Streaks und sehr wenig Zeit für gute Entscheidungen.",
    mechanic: "reaction",
    minPlayers: 2,
    maxPlayers: 99,
    rounds: [5, 10],
    stages: ["react", "reveal", "score"],
    scoring: "Timeout oder Wiederholung = Strike. Drei Strikes raus aus der Runde, aber nicht aus dem Spiel.",
    finale: "2-Sekunden-Finale für alle Verbliebenen.",
    capabilities: [],
    prompts: prompts("panic", [
      { prompt: "Nenne eine Stadt in Europa.", seconds: 5 },
      { prompt: "Nenne etwas, das in einen Kühlschrank gehört.", seconds: 5 },
      { prompt: "Nenne einen Songtitel mit einer Zahl.", seconds: 5 },
      { prompt: "Nenne eine App, die fast jeder kennt.", seconds: 5 },
      { prompt: "Nenne etwas, das man am Flughafen hört.", seconds: 5 },
      { prompt: "Nenne ein Getränk ohne Alkohol.", seconds: 5 },
      { prompt: "Nenne einen Beruf mit Uniform.", seconds: 5 },
      { prompt: "Nenne ein Land am Meer.", seconds: 5 },
      { prompt: "Nenne etwas, das man nicht im Bett essen sollte.", seconds: 5 },
      { prompt: "Nenne ein Wort, das mit „Sch“ beginnt.", seconds: 5 },
    ]),
  },
  {
    id: "after-dark",
    title: "AFTER DARK",
    promise: "Erwachsen, opt-in und sozial – ohne dass jemand zu etwas gedrängt wird.",
    howItFeels: "Freche Votes, geheime Entscheidungen und kleine Mutproben mit sichtbarem Skip und Intensitätsregler.",
    mechanic: "after-dark",
    minPlayers: 2,
    maxPlayers: 20,
    rounds: [6, 12],
    stages: ["vote", "perform", "reveal"],
    scoring: "Standardmäßig ohne Punkte. Optional kann die Gruppe Reactions sammeln.",
    finale: "Die Runde wählt gemeinsam zwischen Soft, Bold oder Stop – jede Option ist ein valides Ende.",
    capabilities: ["spicy"],
    safetyNote: "Nur für Erwachsene. Jede Aufgabe ist freiwillig, Skip ist ohne Begründung möglich; Alkohol ist nie Voraussetzung.",
    prompts: prompts("after", [
      { prompt: "Wer hat heute die gefährlichste Flirt-Energie im Raum?" },
      { prompt: "Geheime Wahl: Kompliment, Challenge oder Skip?", options: ["Kompliment", "Challenge", "Skip"] },
      { prompt: "Sag einer Person etwas Charmantes, das nicht ihr Aussehen betrifft." },
      { prompt: "Wer würde am ehesten beim ersten Date den ersten Schritt machen?" },
      { prompt: "Wähle geheim: 10 Sekunden intensiver Blickkontakt, ehrliche Frage oder Skip.", options: ["Blickkontakt", "Ehrliche Frage", "Skip"] },
      { prompt: "Welche Eigenschaft ist für dich sofort attraktiv? Maximal drei Wörter." },
      { prompt: "Die Gruppe stimmt ab: eher Slow Burn oder sofort Funken?", options: ["Slow Burn", "Sofort Funken"] },
      { prompt: "Gib einer Person im Raum einen neuen, charmanten Spitznamen – oder skippe." },
      { prompt: "Was ist für dich spannender: Humor, Stimme, Blick oder Selbstvertrauen?", options: ["Humor", "Stimme", "Blick", "Selbstvertrauen"] },
      { prompt: "Final Choice: Soft, Bold oder Stop?", options: ["Soft", "Bold", "Stop"] },
    ]),
  },
].map((p) => ({ ...p, prompts: [...p.prompts, ...(EXTRA_PROMPTS[p.id as GangGameId] ?? [])] })) as GangPlaybook[];

export function getGangPlaybook(id: string): GangPlaybook | undefined {
  return GANG_PLAYBOOKS.find((playbook) => playbook.id === id);
}

export function assertCompleteGangPlaybooks(): void {
  if (GANG_PLAYBOOKS.length !== 17) throw new Error("All 17 GANG games must have a playbook");
  const ids = new Set<string>();
  for (const playbook of GANG_PLAYBOOKS) {
    if (ids.has(playbook.id)) throw new Error(`Duplicate GANG playbook: ${playbook.id}`);
    ids.add(playbook.id);
    if (playbook.prompts.length < 8) throw new Error(`${playbook.id} needs at least 8 authored prompts`);
    if (!playbook.stages.includes("reveal")) throw new Error(`${playbook.id} needs a reveal stage`);
    if (playbook.minPlayers < 2 || playbook.maxPlayers > 99 || playbook.minPlayers > playbook.maxPlayers) {
      throw new Error(`Invalid player range for ${playbook.id}`);
    }
  }
}
