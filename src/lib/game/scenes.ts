import type { Flavor, Scene, SceneFlags, SceneType } from "./types";

/**
 * Local scene library (German), editorially authored.
 * Placeholders: {me} = active player, {you} = partner. `{me}s` / `{you}s` render as a
 * correct German genitive (e.g. "Jonas’", "Ari"s → "Aris").
 * Every physical/sensual scene is flagged so consent controls can filter it.
 * Shared bank first, then signature scenes owned by exactly one game (`only`).
 */

type Extra = Partial<Omit<Scene, "id" | "type" | "flavor" | "phase" | "title" | "prompt">>;
let n = 0;
const mk =
  (type: SceneType) =>
  (flavor: Flavor, phase: number, title: string, prompt: string, extra: Extra = {}): Scene => ({
    id: `${type.toLowerCase()}-${++n}`,
    type,
    flavor,
    phase,
    title,
    prompt,
    source: "local",
    ...extra,
  });
const q = mk("QUESTION");
const m = mk("MISSION");
const t = mk("TIMER");
const c = mk("CHOICE");
const r = mk("ROULETTE");
const s = mk("SYNC");
const x = mk("SECRET");
const g = mk("GLITCH");
const p = mk("PRIVATE_SIGNAL");
const sd = mk("SHOWDOWN");
const pr = mk("PREDICTION");

const T: SceneFlags = { touch: true };
const TS: SceneFlags = { touch: true, sensual: true };
const SEN: SceneFlags = { sensual: true };
const D: SceneFlags = { drink: true };
const SIG: SceneFlags = { signal: true };
const cap = (label: string, ...tags: string[]) => ({ capture: { label, tags } });

const FS = { only: ["roxy-after-dark" as const] };
const AD = { only: ["after-dark-2" as const] };
const NS = { only: ["roxy-night" as const] };
const HC = { only: ["battle" as const] };
const US = { only: ["coop" as const] };
const OT = { only: ["one-two" as const] };
const EC = { only: ["night-echo" as const] };
const DR = { only: ["ai-director" as const] };
const ECHOISH = { only: ["night-echo" as const, "ai-director" as const] };

export const SCENES: Scene[] = [
  // ——— FUNNY QUESTIONS · First Signal / Mischief
  q("funny", 0, "Zehn Sekunden", "Dein allererster Gedanke über {you}. Ungefiltert, auch wenn er peinlich war.", { emoji: "👀", ...cap("Erster Gedanke", "origin") }),
  q("funny", 0, "Der Film", "Euer erstes Date kommt ins Kino. Titel? Und wer müsste {you} spielen?", { emoji: "🎬", ...cap("Filmtitel", "movie") }),
  q("funny", 0, "Duschkonzert", "Welches Lied singst du allein lauthals mit und würdest es öffentlich leugnen?", { emoji: "🎤", ...cap("Das Lied", "song") }),
  q("funny", 0, "Nutzlose Gabe", "Erfinde eine völlig nutzlose Superkraft, die perfekt zu {you} passt.", { emoji: "🦸" }),
  q("funny", 0, "Ein Zeichen", "Wenn {you} ein Emoji wäre: welches? Begründung in einem Satz.", { emoji: "🙃", ...cap("Emoji", "emoji") }),
  q("funny", 0, "Wochenende 1974", "In welches Jahrzehnt würdest du {you} für ein Wochenende entführen – und was zieht ihr an?", { emoji: "⏳" }),
  q("funny", 0, "Zwei Tiere", "Welches Tier bist du morgens um sieben? Und welches um Mitternacht?", { emoji: "🦉" }),
  q("funny", 0, "Unpopulär", "Eine harmlose Meinung, für die du auf jeder Party verlieren würdest.", { emoji: "🍍", ...cap("Unpopuläre Meinung", "opinion") }),
  q("funny", 0, "Reality-TV", "In welcher Show würde {you} gewinnen – und in welcher nach Folge eins rausfliegen?", { emoji: "📺" }),
  q("funny", 0, "Markenzeichen", "Welche Geste macht nur {you} genau so? Vormachen erlaubt.", { emoji: "✨", ...cap("Markenzeichen", "habit") }),
  q("funny", 1, "Kochshow", "Ihr bekommt eine Kochshow. Name, Signature-Gericht, und wer löst den Feueralarm aus?", { emoji: "🍳" }),
  q("funny", 1, "Ewiges Vorhaben", "Was kündigt {you} seit Monaten an und macht es nie?", { emoji: "🤥" }),
  q("funny", 1, "Verlauf", "Was würde {you}s Suchverlauf der letzten Woche verraten? Rate frech.", { emoji: "🔍" }),
  q("funny", 0, "Partygeschichte", "Die absurdeste Geschichte, die du je auf einer Party gehört hast. Dreißig Sekunden.", { emoji: "🥂" }),
  q("funny", 1, "Slogan", "Euer Werbeslogan als Paar. Ein Satz, der auf ein Plakat passt.", { emoji: "📣", ...cap("Euer Slogan", "slogan") }),
  pr("funny", 0, "Wohin verschwinden wir?", "Strand. Großstadt. Hütte ohne Netz.", { emoji: "🏝️", choices: ["Strand", "Großstadt", "Hütte ohne Netz"], helper: "Wohin würdest du verschwinden?" }),
  q("funny", 1, "Verborgenes Talent", "Welches Talent hast du, das {you} noch nie live gesehen hat?", { emoji: "🎩" }),
  q("funny", 0, "Hungrig", "Imitiere {you}, wenn der Hunger kippt. Zehn Sekunden, volle Hingabe.", { emoji: "🍕" }),
  q("funny", 1, "Pariser Leben", "Gib {you} einen Künstlernamen für ein geheimes zweites Leben in Paris.", { emoji: "🇫🇷", ...cap("Künstlername", "alias") }),
  q("funny", 0, "Schlechtester Spruch", "Der schlechteste Anmachspruch, den du kennst. Mit vollem Ernst vorgetragen.", { emoji: "😏" }),
  q("funny", 1, "Apokalypse", "Zombies vor der Tür. Wer von euch plant, wer improvisiert, wer isst die Vorräte?", { emoji: "🧟" }),
  q("funny", 0, "Drei Wörter", "{you} am Samstag um elf. Genau drei Wörter.", { emoji: "3️⃣", ...cap("Drei Wörter", "words") }),
  q("funny", 1, "Museum", "Es gibt ein Museum über {you}. Welches Exponat hat die längste Schlange?", { emoji: "🖼️" }),
  q("funny", 1, "Direkt aus der Packung", "Was isst du heimlich im Stehen am offenen Kühlschrank?", { emoji: "🍫" }),
  q("funny", 0, "Wetterlage", "Deine Stimmung gerade – als Wetterbericht mit Moderatorinnenstimme.", { emoji: "🌦️" }),
  pr("funny", 1, "Zimmer 214", "Die Tür fällt ins Schloss. Was passiert als Erstes?", { emoji: "🛎️", choices: ["Minibar inspizieren", "Aufs Bett fallen", "Aussicht checken", "Bademantel an"], helper: "Was machst du als Erstes im Hotelzimmer?" }),
  pr("funny", 0, "Last Order", "Später Hunger, eine Bestellung.", { emoji: "🍜", choices: ["Pizza", "Ramen", "Döner", "Etwas Süßes"], helper: "Was bestellst du um zwei Uhr nachts?" }),
  pr("cheeky", 1, "Erster Zug", "Sonntag, kein Plan, niemand muss irgendwohin.", { emoji: "☕", choices: ["Liegen bleiben", "Frühstück im Bett", "Raus ans Licht", "Einfach treiben lassen"], helper: "Wie fängt dein perfekter Sonntag an?" }),
  pr("cheeky", 2, "Unsere Rolle", "Ein Heist-Film. Ihr seid das Team.", { emoji: "🎞️", choices: ["Mastermind", "Ablenkung", "Fahrer:in", "Die mit dem Charme"], helper: "Welche Rolle übernimmst du?" }),
  pr("game", 1, "Heimfahrt", "Nachts, leere Straße, ein Lied.", { emoji: "🎧", choices: ["Laut mitsingen", "Leise, melancholisch", "Peinlicher Hit", "Stille"], helper: "Was läuft bei dir?" }),
  q("funny", 1, "Award", "Verleih {you} einen Award für etwas sehr Spezifisches von heute.", { emoji: "🏆", ...cap("Der Award", "award") }),
  q("funny", 0, "Auftrittsmusik", "Welcher Song soll laufen, wenn {you} einen Raum betritt?", { emoji: "🎶", ...cap("Entrance-Song", "song") }),
  q("funny", 2, "Gerücht", "Erfinde ein glamouröses, völlig harmloses Gerücht über {you}.", { emoji: "🗞️" }),
  q("funny", 1, "Lieblingswort", "Welches Wort benutzt {you} viel zu oft? Es ist ab sofort euer Codewort.", { emoji: "🔤", ...cap("Codewort", "word") }),

  // ——— DEEP QUESTIONS · Patterns
  q("deep", 1, "Hängengeblieben", "Welcher winzige Moment mit {you} ist dir erstaunlich lange im Kopf geblieben?", { emoji: "🕯️", ...cap("Der Moment", "memory") }),
  q("deep", 1, "Zuhause", "Woran merkst du, dass ein Ort dein Zuhause geworden ist?", { emoji: "🏡" }),
  q("deep", 2, "Mutiger als gedacht", "Wann warst du zuletzt mutiger, als du dir zugetraut hättest?", { emoji: "🦁" }),
  q("deep", 2, "Unterschätzt", "Was an {you} unterschätzen andere Menschen – fast immer?", { emoji: "💎", ...cap("Unterschätzt", "trait") }),
  q("deep", 1, "Sonntag", "Euer idealer Sonntag. Erster Kaffee bis letztes Licht.", { emoji: "☕", ...cap("Perfekter Sonntag", "plan") }),
  q("deep", 2, "Abgeschaut", "Was hast du dir von {you} abgeschaut, ohne dass es jemand gemerkt hat?", { emoji: "📖" }),
  q("deep", 2, "Exklusiv", "Welche Version von dir bekommt nur {you} zu sehen?", { emoji: "🌙" }),
  q("deep", 1, "Ein Ort", "Welchen Ort willst du {you} einmal zeigen – und welchen Moment dort genau?", { emoji: "🗺️", ...cap("Wunschort", "place") }),
  q("deep", 2, "Winzig, aber", "Was macht dich glücklich, obwohl es objektiv lächerlich klein ist?", { emoji: "🌱" }),
  q("deep", 3, "Ohne Worte", "Woran merkst du, dass {you} gerade wirklich da ist – ganz ohne Sätze?", { emoji: "🤍" }),
  q("deep", 2, "Zehn Jahre alt", "Was würde dein zehnjähriges Ich über {you} sagen? Wortwörtlich.", { emoji: "🧒" }),
  q("deep", 1, "Dieses Jahr", "Was hat dich dieses Jahr wirklich umgeworfen – ein Buch, ein Mensch, ein Satz?", { emoji: "💡" }),
  q("deep", 2, "Nie gesagt", "Wofür willst du {you} danken, was im Alltag nie ausgesprochen wird?", { emoji: "🙏" }),
  q("deep", 3, "Der lange Traum", "Welchen Traum trägst du schon so lange mit dir, dass er fast Möbel ist?", { emoji: "🌌", ...cap("Der Traum", "dream") }),
  q("deep", 2, "Heimlich bezaubernd", "Welche Angewohnheit von {you} findest du insgeheim großartig?", { emoji: "🪞", ...cap("Bezaubernde Angewohnheit", "habit") }),
  q("deep", 1, "Eines Tages", "Welches Abenteuer steht auf eurer Liste, ohne dass es je jemand aufgeschrieben hat?", { emoji: "🧭", ...cap("Das Abenteuer", "plan") }),
  q("deep", 3, "Nah", "Wann hast du dich {you} zuletzt besonders nah gefühlt – und wo wart ihr?", { emoji: "🫶" }),
  q("deep", 2, "Postkarte", "Lies laut eine Postkarte vor, die ihr euch in fünf Jahren schreibt. Zwei Sätze.", { emoji: "💌", ...cap("Postkarte", "future") }),
  q("deep", 2, "Leihgabe", "Welche Eigenschaft von {you} würdest du dir für eine Woche ausleihen?", { emoji: "🪄" }),
  q("deep", 1, "Ein Geruch", "Welcher Geruch beamt dich sofort an einen bestimmten Ort?", { emoji: "🌸" }),
  q("deep", 3, "Aufgeschoben", "Etwas Schönes, das du {you} schon länger sagen wolltest. Jetzt ist der Moment.", { emoji: "🗝️" }),
  q("deep", 2, "Nur eures", "Welches kleine Ritual sollte es nur bei euch zwei geben?", { emoji: "🕰️", ...cap("Euer Ritual", "ritual") }),
  q("deep", 1, "Ohne Publikum", "Wie würdest du {you} nennen, wenn garantiert niemand mithört?", { emoji: "🐚" }),
  q("deep", 3, "Vertrauen", "Was macht es dir leicht, {you} zu vertrauen? Ein konkretes Beispiel.", { emoji: "⚓" }),
  q("deep", 2, "Bauchschmerzen", "Worüber habt ihr zuletzt gelacht, bis es wehtat?", { emoji: "😂", ...cap("Der Lacher", "memory") }),

  // ——— CHEEKY QUESTIONS · Mischief / Magnetic
  q("cheeky", 1, "Das Knistern", "Wann hast du zum ersten Mal gemerkt: Hier knistert etwas?", { emoji: "⚡", ...cap("Das Knistern", "spark") }),
  q("cheeky", 1, "Gefährliches Outfit", "Welches Outfit von {you} sollte eigentlich einen Warnhinweis tragen?", { emoji: "👗" }),
  q("cheeky", 2, "Flirt-Zeugnis", "{you}s Flirtkünste: Note von eins bis zehn. Mit Begründung und einem Verbesserungsvorschlag.", { emoji: "📝" }),
  q("cheeky", 1, "Unbemerkt", "Wann schaust du {you} an, wenn es niemand merkt?", { emoji: "🫣" }),
  q("cheeky", 2, "Unbewusst", "Was macht {you} völlig unbewusst, das dich jedes Mal aus dem Konzept bringt?", { emoji: "🔥", ...cap("Unwiderstehlich", "spark") }),
  q("cheeky", 2, "Frechstes Date", "Plant in zwei Sätzen das frechste Date, das noch vorzeigbar wäre.", { emoji: "🎟️" }),
  q("cheeky", 1, "Zu ehrlich", "Mach {you} ein Kompliment, das eine Spur zu ehrlich ist.", { emoji: "💬" }),
  q("cheeky", 2, "Die Stimme", "Bei welchem Tonfall von {you} vergisst du, was du sagen wolltest?", { emoji: "🎙️" }),
  q("cheeky", 2, "Kein Nein", "Wobei kannst du {you} einfach nie widerstehen?", { emoji: "🍒" }),
  q("cheeky", 1, "Rate mal", "Was findet {you} an dir am attraktivsten? Rate – {you} löst auf.", { emoji: "🎯" }),
  q("cheeky", 3, "Spontan", "Der spontanste Moment, den ihr zusammen erlebt habt. Wer hat angefangen?", { emoji: "🌃", ...cap("Spontan-Moment", "memory") }),
  q("cheeky", 2, "Ein Gedicht", "Über welches Detail an {you} würdest du ein Gedicht schreiben? Erste Zeile, bitte.", { emoji: "🖋️" }),
  q("cheeky", 2, "Überrasch mich", "{you} sagt jetzt: „Überrasch mich.“ Was passiert in den nächsten fünf Minuten?", { emoji: "🎁" }),
  q("cheeky", 3, "Kussort", "An welchem Ort der Welt würdest du {you} gern einmal küssen?", { emoji: "🗼", flags: SEN, ...cap("Kuss-Ort", "place") }),
  q("cheeky", 1, "Gelesen, gelesen", "Welche Nachricht von {you} hast du öfter gelesen, als du zugeben würdest?", { emoji: "📱" }),
  q("cheeky", 2, "Körpertausch", "Ihr tauscht für einen Tag die Rollen. Was nutzt du als {you} sofort aus?", { emoji: "🔁" }),
  q("cheeky", 2, "Spukt herum", "Welche Idee für heute Nacht geistert dir schon seit dem Abendessen im Kopf herum?", { emoji: "😈" }),
  q("cheeky", 1, "Plötzlich Tanz", "Du fängst jetzt einfach an zu tanzen. Wie reagiert {you}? Testen erlaubt.", { emoji: "💃" }),
  q("cheeky", 3, "Kurz nervös", "Welcher Moment heute hat dich schon ein kleines bisschen nervös gemacht?", { emoji: "🌡️" }),
  q("cheeky", 2, "Der Blick", "Mit welchem Blick bekommt {you} dich zuverlässig rum?", { emoji: "😌" }),
  q("cheeky", 1, "Fremd an der Bar", "Du siehst {you} heute zum ersten Mal an einer Bar. Dein erster Satz?", { emoji: "👋" }),
  q("cheeky", 2, "Drei Sekunden", "Was würdest du flüstern, wenn für drei Sekunden niemand sonst existiert?", { emoji: "🤫", flags: SEN }),
  q("cheeky", 2, "Dresscode", "Leg den Dresscode für euer nächstes Date fest. Ein Wort reicht.", { emoji: "🎩", ...cap("Dresscode", "plan") }),
  q("cheeky", 3, "Noch einmal", "Welche gemeinsame Nacht würdest du sofort noch einmal erleben?", { emoji: "🌒", flags: SEN }),

  // ——— SENSUAL · Magnetic / After Hours (tasteful, optional, mutual)
  q("sensual", 3, "Der perfekte Kuss", "Wie fühlt sich für dich ein perfekter Kuss an? Ein Satz, kein Lehrbuch.", { emoji: "💋", flags: SEN }),
  q("sensual", 3, "Kleine Berührung", "Welche winzige Berührung von {you} wirkt bei dir sofort?", { emoji: "🫧", flags: SEN, ...cap("Die Berührung", "touch") }),
  q("sensual", 4, "Nach Mitternacht", "Beschreib euren Abend nach Mitternacht – nur mit einem Licht, einem Song und einem Duft.", { emoji: "🕯️", flags: SEN }),
  q("sensual", 3, "Leiser Wunsch", "Ein Wunsch für heute Nacht. Nur für {you}s Ohr.", { emoji: "🌹", flags: SEN, helper: "Flüstern zählt." }),
  q("sensual", 4, "Der feinste Sinn", "Hören, Sehen, Riechen, Fühlen – welcher Sinn ist bei dir heute am wachsten?", { emoji: "🖐️", flags: SEN }),
  q("sensual", 3, "Anziehung", "Was hat dich heute Abend an {you} am meisten angezogen?", { emoji: "🧲", flags: SEN, ...cap("Anziehung", "spark") }),
  q("sensual", 4, "Tempo", "Langsam oder plötzlich – was passt heute besser zu euch?", { emoji: "🎚️", flags: SEN }),
  m("sensual", 3, "Nacken", "Ein einziger, langsamer Kuss in {you}s Nacken. Nur wenn ihr beide wollt.", { emoji: "🌙", flags: TS, helper: "Nur wenn ihr beide Lust habt." }),
  m("sensual", 3, "Handlinien", "Augen zu. {me} fährt mit einem Finger die Linien auf {you}s Handfläche nach.", { emoji: "✋", flags: TS }),
  m("sensual", 4, "Rot werden", "Flüstere {you} ein Kompliment, bei dem man ein bisschen rot wird.", { emoji: "🫦", flags: SEN }),
  m("sensual", 3, "Dreißig Sekunden", "Dreißig Sekunden Blickkontakt. Lachen ist erlaubt, Wegschauen nicht.", { emoji: "👁️", flags: SEN, duration: 30 }),
  m("sensual", 4, "Ein Song", "Ein Song, ein langsamer Tanz. {me} wählt die Musik, {you} das Licht.", { emoji: "🎷", flags: TS }),
  m("sensual", 4, "Eine Minute", "Eine Minute Schultern oder Hände – {you} entscheidet, was.", { emoji: "💆", flags: TS, duration: 60 }),
  m("sensual", 3, "Beinahe", "So nah, dass ihr euch fast küsst. Fünf Sekunden halten. Dann entscheidet ihr.", { emoji: "⏸️", flags: TS }),
  m("sensual", 4, "Drei Orte", "{me} verteilt drei Küsse, {you} bestimmt die Stellen. Jugendfrei bleibt Ehrensache.", { emoji: "💫", flags: TS }),
  q("sensual", 4, "Öfter hören", "Was möchtest du öfter von {you} hören?", { emoji: "🔐", flags: SEN, ...cap("Öfter hören", "wish") }),
  m("sensual", 4, "Duftnote", "Augen zu. Beschreib, wie {you} riecht – als stündest du in einer Parfümerie.", { emoji: "🌺", flags: TS }),
  q("sensual", 3, "Morgen danach", "Welcher Moment am Morgen danach ist dein liebster?", { emoji: "🌅", flags: SEN }),
  m("sensual", 4, "Nachhall", "Sag {you} einen Satz, der für den Rest der Nacht nachhallt.", { emoji: "🌘", flags: SEN }),
  m("sensual", 4, "Stirn an Stirn", "Stirn an Stirn. Zehn Atemzüge, ohne zu zählen.", { emoji: "🌬️", flags: TS }),

  // ——— MISSIONS · light, real-world
  m("funny", 0, "Toast", "Zwanzig Sekunden Toast auf {you}. Glas optional, Pathos Pflicht.", { emoji: "🥂" }),
  m("funny", 0, "Italienisch", "Drei liebe Dinge über {you} – im schlechtesten italienischen Akzent, den du hast.", { emoji: "🤌" }),
  m("funny", 1, "Albumcover", "Stellt das Cover eures ersten gemeinsamen Albums nach. Foto erlaubt, nicht Pflicht.", { emoji: "📸" }),
  m("funny", 0, "Breaking News", "Lies deine letzte gesendete Nachricht vor – als Tagesschau-Eilmeldung.", { emoji: "📰" }),
  m("funny", 1, "Ein Klatschen", "Ohne Absprache gleichzeitig klatschen. Drei Versuche.", { emoji: "👏" }),
  m("cheeky", 1, "Masterclass", "Bring {you} deinen besten Flirtblick bei. {you} muss ihn sofort anwenden.", { emoji: "😉" }),
  m("cheeky", 2, "Bedienungsanleitung", "Diktiere {you} einen Liebesbrief im Stil einer Möbel-Aufbauanleitung.", { emoji: "📄" }),
  m("cheeky", 2, "Festhalten", "Haltet euch an den Händen bis zur nächsten Szene. Wer loslässt, verrät ein kleines Geheimnis.", { emoji: "🤝", flags: T }),
  m("cheeky", 2, "Näher", "Rückt zusammen. Näher. Noch ein bisschen. Gut so.", { emoji: "🛋️", flags: T }),
  m("funny", 1, "Rot geworden", "Wer heute schon rot geworden ist: einen Schluck nehmen – oder verraten, warum.", { emoji: "🍷", flags: D, helper: "Wasser zählt genauso." }),
  m("funny", 1, "Ein Wort, ein Klirren", "Anstoßen und gleichzeitig ein Wort sagen, das diesen Abend beschreibt.", { emoji: "🥃", flags: D, helper: "Auch alkoholfrei perfekt." }),
  m("cheeky", 2, "Sperrzone", "Bis zur nächsten Szene ist Küssen verboten. Viel Glück.", { emoji: "🚫", flags: SEN }),
  m("funny", 0, "Spiegel", "Spiegle {you}s Bewegungen zwanzig Sekunden lang. {you} darf gemein sein.", { emoji: "🪞", duration: 20 }),
  m("cheeky", 2, "Zeitlupe", "Ein Kuss auf die Wange – in kompletter Zeitlupe.", { emoji: "🐌", flags: TS }),
  m("funny", 1, "Teleshopping", "Verkauf {you} einen Gegenstand aus diesem Raum, als wäre er limitierte Luxusware.", { emoji: "🛍️" }),
  m("deep", 2, "Drei Beobachtungen", "Drei Dinge, die dir heute an {you} aufgefallen sind. So konkret wie möglich.", { emoji: "🔍" }),
  m("cheeky", 3, "Harmlos verführerisch", "Flüstere {you} die Zutatenliste von irgendwas ins Ohr. So verführerisch, wie es geht.", { emoji: "🐾", flags: SEN }),
  m("funny", 1, "Tatort", "Spielt in dreißig Sekunden nach, wie ihr euch kennengelernt habt – als Krimi.", { emoji: "🕵️" }),
  m("deep", 2, "Zwanzig Sekunden", "Eine Umarmung, die mindestens zwanzig Sekunden dauert. Nicht mitzählen.", { emoji: "🫂", flags: T, duration: 20 }),
  m("cheeky", 2, "Lautlos", "{me} formt lautlos einen Satz. {you} muss ihn von den Lippen lesen.", { emoji: "👄" }),
  m("funny", 1, "Licht aus, Licht an", "Ändert das Licht im Raum. Eine Lampe aus, eine Kerze oder Handylampe an.", { emoji: "💡" }),
  m("funny", 0, "Fenster", "Öffnet kurz ein Fenster. Jeder beschreibt in einem Satz, was er hört.", { emoji: "🪟" }),
  m("funny", 1, "Sockenfrage", "Zeigt eure Socken. Der andere deutet sie wie ein Horoskop.", { emoji: "🧦" }),

  // ——— TIMERS
  t("funny", 0, "Wortkette", "Sechzig Sekunden. Abwechselnd ein Wort, das zu {you} passt. Nach jedem Wort aufs Display tippen. Wer den Antwort-Puls verpasst, verliert.", { emoji: "⏱️", duration: 60, mechanic: "alternating-rush", beatSeconds: 3 }),
  t("funny", 1, "Pokerface", "Dreißig Sekunden ernst bleiben. Sobald jemand bricht, sofort antippen.", { emoji: "😐", duration: 30, mechanic: "standoff" }),
  t("cheeky", 2, "Sprint", "Fünfundvierzig Sekunden Komplimente. Nach jedem Treffer tippen. Keine Wiederholungen.", { emoji: "💨", duration: 45, mechanic: "tap-rush" }),
  t("game", 1, "Nachtaktiv", "Dreißig Sekunden: abwechselnd Dinge, die man nur nachts tut. Nach jeder Antwort tippen. Jugendfrei.", { emoji: "🌃", duration: 30, mechanic: "alternating-rush", beatSeconds: 3 }),
  t("deep", 2, "Stille", "Eine Minute ohne Worte. Nur Blicke, Hände, Grinsen.", { emoji: "🤐", duration: 60 }),
  t("sensual", 3, "Kein Handy", "Neunzig Sekunden: so nah zusammen, wie es sich für euch gut anfühlt. Handy liegt.", { emoji: "🧭", duration: 90, flags: TS }),
  t("funny", 0, "Satz um Satz", "Vierzig Sekunden: eine Geschichte, abwechselnd je ein Satz. Muss mit „und dann der Hund“ enden.", { emoji: "📚", duration: 40 }),
  t("game", 1, "Pantomime", "Fünfundvierzig Sekunden: {me} spielt {you}s Lieblingsfilm. Kein Laut.", { emoji: "🎭", duration: 45 }),
  t("cheeky", 2, "Blind", "Dreißig Sekunden Augen zu. {you} beschreibt, was {me} gerade trägt. Im Detail.", { emoji: "🙈", duration: 30 }),
  t("game", 2, "Summen", "Fünfundvierzig Sekunden: {me} summt, {you} rät. Für jeden Treffer einmal tippen.", { emoji: "🎵", duration: 45, mechanic: "tap-rush" }),
  t("sensual", 4, "Gleicher Atem", "Eine Minute im selben Rhythmus atmen. Hände dürfen sich finden.", { emoji: "🌊", duration: 60, flags: SEN }),
  t("funny", 1, "Rückwärts", "Dreißig Sekunden: Sagt eure Namen rückwärts und erfindet die Herkunftsgeschichte dazu.", { emoji: "🔄", duration: 30 }),
  t("game", 0, "Anfangsbuchstabe", "Fünfundvierzig Sekunden: Dinge mit dem Anfangsbuchstaben von {you}s Namen. Jeder Treffer = ein Tap.", { emoji: "🔠", duration: 45, mechanic: "tap-rush" }),
  t("cheeky", 3, "Fingerspitzen", "Vierzig Sekunden: nur die Fingerspitzen berühren sich. Wer zuerst grinst, erzählt etwas.", { emoji: "☝️", duration: 40, flags: T }),
  t("deep", 2, "Gute Liste", "Eine Minute: abwechselnd Dinge von heute, die gut waren. Auch Kleinigkeiten.", { emoji: "🌻", duration: 60 }),

  // ——— CHOICES
  c("funny", 0, "Entweder oder", "Du entscheidest für euch beide:", { emoji: "⚖️", choices: ["Frühstück im Bett", "Mitternachtssnack am Fenster"] }),
  c("cheeky", 1, "Abendplan", "Was klingt gerade verlockender?", { emoji: "🌆", choices: ["Küche als Tanzfläche", "Kerzen und eine lange Playlist", "Ein Spaziergang im Dunkeln"] }),
  c("funny", 0, "Abflug", "Euer nächster Trip:", { emoji: "✈️", choices: ["Lissabon", "Hütte im Schnee", "Strand ohne WLAN"] }),
  c("cheeky", 2, "Heimlicher Dichter", "Wer von euch schreibt eher heimlich ein Liebesgedicht?", { emoji: "🪶", choices: ["{me}", "{you}"] }),
  c("cheeky", 2, "Filmriss", "Wer schläft eher mitten im Film ein – und behauptet danach, alles gesehen zu haben?", { emoji: "😴", choices: ["{me}", "{you}"] }),
  c("funny", 1, "Gang sieben", "Wer tanzt eher spontan im Supermarkt?", { emoji: "🛒", choices: ["{me}", "{you}"] }),
  c("sensual", 3, "Als Nächstes", "Was soll als Nächstes passieren?", { emoji: "🕯️", choices: ["Ein langer Kuss", "Ein Geständnis", "Ein Lied, zu zweit"], flags: SEN }),
  c("deep", 2, "Paar-Kraft", "Eine Superkraft für euch als Duo:", { emoji: "🌀", choices: ["Gedanken lesen", "Zeit anhalten", "Überallhin teleportieren"] }),
  c("game", 1, "Duell wählen", "Wähle das Mini-Duell:", { emoji: "🥊", choices: ["Daumencatchen", "Starrwettbewerb", "Schere, Stein, Papier"] }),
  c("cheeky", 2, "Geheimwaffe", "Was ist {you}s gefährlichste Waffe?", { emoji: "🗡️", choices: ["Das Lächeln", "Die Stimme", "Der Blick", "Die Hände"] }),
  c("funny", 0, "Snack-Persönlichkeit", "Wenn {you} ein Snack wäre:", { emoji: "🥨", choices: ["Laugenbrezel", "Pralinen", "Scharfe Chips", "Erdbeeren"] }),
  c("deep", 1, "Eure Uhrzeit", "Die Tageszeit, die am meisten nach euch klingt:", { emoji: "🕐", choices: ["Früher Morgen", "Goldene Stunde", "Nach Mitternacht"] }),
  c("cheeky", 3, "Kussstil", "Welcher Kuss passt zu heute?", { emoji: "💋", choices: ["Zart", "Frech", "Filmreif"], flags: SEN }),
  c("game", 1, "Quizshow", "Wer gewinnt eher eine Quizshow im Fernsehen?", { emoji: "🧠", choices: ["{me}", "{you}"] }),
  c("funny", 1, "Kostümfest", "Euer nächstes Paarkostüm:", { emoji: "🎃", choices: ["Bonnie und Clyde", "Salz und Pfeffer", "Zwei Geheimagenten"] }),

  // ——— ROULETTES
  r("game", 0, "Glücksrad", "Das Rad entscheidet, was {me} jetzt tut.", { emoji: "🎡", choices: ["Ein Geheimnis verraten", "Ein Kompliment", "Eine Imitation", "Einen Toast", "Ein Lied summen", "Joker: frei wählen"] }),
  r("cheeky", 2, "Nächster Move", "Der Zufall wählt {me}s nächsten Move.", { emoji: "🌀", choices: ["Zwinkern", "Flüstern", "Wangenkuss", "Ein Satz, der rot macht", "Näher rücken", "Joker"], flags: SEN }),
  r("funny", 0, "Erzählstoff", "Erzähl eine Geschichte über …", { emoji: "🎲", choices: ["Den peinlichsten Moment", "Ein Kindheitsabenteuer", "Den besten Urlaub", "Eine Lieblingsnacht"] }),
  r("game", 1, "Duell-Los", "Der Zufall bestimmt das Mini-Duell.", { emoji: "🎯", choices: ["Starren", "Daumencatchen", "Reimen", "Wer kennt wen besser", "Stimmen imitieren"] }),
  r("sensual", 3, "Wohin", "Der Zufall zeigt, wo der nächste Kuss landet.", { emoji: "🎐", choices: ["Hand", "Stirn", "Wange", "Nacken", "Joker: {you} wählt"], flags: TS }),
  r("funny", 1, "Dialekt", "{me} spricht die nächste Antwort mit …", { emoji: "🌍", choices: ["Französischem Akzent", "Wiener Schmäh", "Britischer Contenance", "Sächsisch", "Cowboy-Drawl"] }),
  r("deep", 2, "Orakel", "{me} beantwortet:", { emoji: "🔮", choices: ["Mein größter Wunsch", "Mein liebster Moment mit dir", "Etwas, das ich nie sage", "Was ich an uns mag"] }),
  r("game", 1, "Gläserritual", "Optional: Der Zufall wählt das Ritual mit dem Glas.", { emoji: "🍹", choices: ["Anstoßen mit Blick", "Ein Schluck Wasser", "Toast auf {you}", "Gar nichts – Joker"], flags: D }),
  r("cheeky", 2, "Pose", "{me} posiert jetzt als …", { emoji: "🕺", choices: ["Filmstar", "Model", "Rockstar", "Statue", "Bösewicht"] }),
  r("funny", 0, "Pflichtwort", "Bau dieses Wort in deinen nächsten Satz ein:", { emoji: "🪅", choices: ["Ananas", "Gefährlich", "Samt", "Mitternacht", "Konfetti"] }),

  // ——— SYNC (private pick → pass → reveal)
  s("game", 0, "Abendessen", "Was wäre heute das perfekte Abendessen?", { emoji: "📡", choices: ["Pizza", "Sushi", "Pasta", "Frühstück um Mitternacht"] }),
  s("game", 1, "Ein Wort für euch", "Welches Wort beschreibt euch zwei am besten?", { emoji: "🪞", choices: ["Chaos", "Magie", "Komfort", "Abenteuer"] }),
  s("cheeky", 2, "Mehr davon", "Was wünschst du dir als Nächstes?", { emoji: "🤞", choices: ["Mehr Lachen", "Mehr Nähe", "Mehr Spiel", "Mehr Mut"] }),
  s("game", 1, "Morgen früh", "Wohin morgen, wenn alles ginge?", { emoji: "🧳", choices: ["Paris", "Berge", "Meer", "Im Bett bleiben"] }),
  s("deep", 2, "Was „wir“ ist", "Was fühlt sich gerade am meisten nach „wir“ an?", { emoji: "💓", choices: ["Insider", "Stille", "Abenteuer", "Berührung"] }),
  s("sensual", 3, "Tempo-Check", "Wie soll der Rest der Nacht laufen?", { emoji: "🌡️", choices: ["Ganz langsam", "Verspielt", "Überrascht mich", "Kuscheln und reden"], flags: SEN }),
  s("funny", 0, "Genre", "Welches Filmgenre heute?", { emoji: "🎞️", choices: ["Romcom", "Thriller", "Doku", "Herrlicher Trash"] }),
  s("cheeky", 2, "Bester Teil", "Welcher Teil des Abends war bisher der beste?", { emoji: "⭐", choices: ["Der Anfang", "Die Lacher", "Ein Blick", "Genau jetzt"] }),
  s("game", 1, "Soundtrack", "Welcher Sound für den Rest des Abends?", { emoji: "🎧", choices: ["Jazz", "Pop", "R&B", "Stille"] }),
  s("deep", 2, "Paar-Stärke", "Was ist eure größte Stärke als Duo?", { emoji: "🛡️", choices: ["Humor", "Vertrauen", "Neugier", "Leidenschaft"] }),
  s("cheeky", 3, "Erster Schritt", "Wer macht heute eher den ersten Schritt?", { emoji: "🧨", choices: ["{me}", "{you}"] }),
  s("funny", 1, "Mitternachtssnack", "Mitternachtssnack?", { emoji: "🍟", choices: ["Süß", "Salzig", "Beides", "Keiner"] }),

  // ——— SECRET (pass the phone)
  x("cheeky", 1, "Das Wort", "Bring {you} innerhalb der nächsten drei Szenen dazu, „Mitternacht“ zu sagen.", { emoji: "🕵️" }),
  x("cheeky", 2, "Beiläufig", "Berühre {you} beiläufig am Arm, bevor die nächste Szene endet. Unauffällig.", { emoji: "🤫", flags: T }),
  x("funny", 1, "Einschmuggeln", "Schmuggle ein Kompliment über {you}s Hände in deine nächste Antwort.", { emoji: "🧤" }),
  x("deep", 2, "Für später", "Denk an einen Moment, in dem du stolz auf {you} warst. Erzähl ihn erst am Ende der Nacht.", { emoji: "📝" }),
  x("cheeky", 2, "Beim Lachen", "Zwinkere {you} zu, sobald {you} das nächste Mal lacht.", { emoji: "😉" }),
  x("sensual", 3, "Ins Ohr", "Flüstere {you} bei der nächsten Gelegenheit einen Wunsch für später ins Ohr.", { emoji: "🌹", flags: SEN }),
  x("funny", 0, "Fabelhaft", "Sag in den nächsten zwei Szenen dreimal „fabelhaft“. Ohne dass es auffällt.", { emoji: "🦄" }),
  x("game", 1, "Prognose", "Merk dir, was {you} bei der nächsten Wahl nimmt. Auflösung, wenn es passiert.", { emoji: "🔮" }),

  // ——— GLITCH rule twists
  g("game", 1, "Nur Fragen", "Bis zur nächsten Szene sprecht ihr ausschließlich in Fragen. Wirklich?", { emoji: "⌁" }),
  g("funny", 0, "Namenstausch", "Ihr heißt jetzt wie der jeweils andere. Bis zur übernächsten Szene.", { emoji: "⌁" }),
  g("funny", 1, "Flüsterzone", "Ab jetzt wird nur noch geflüstert. Auch das Lachen.", { emoji: "⌁" }),
  g("cheeky", 2, "Schulter an Schulter", "Die nächste Szene wird nebeneinander gespielt. Schultern berühren sich.", { emoji: "⌁", flags: T }),
  g("game", 1, "Reimpflicht", "Die nächste Antwort muss sich reimen. Schlecht ist ausdrücklich erlaubt.", { emoji: "⌁" }),
  g("funny", 1, "Superzeitlupe", "Bis zur nächsten Szene bewegt ihr euch nur in Zeitlupe.", { emoji: "⌁" }),
  g("cheeky", 2, "Wer wegschaut", "Wer in der nächsten Szene zuerst wegschaut, verrät ein kleines Geheimnis.", { emoji: "⌁" }),
  g("deep", 2, "Ein Wort", "Die nächste Antwort hat genau ein Wort. Wählt es gut.", { emoji: "⌁" }),
  g("funny", 0, "Late Night", "{me} moderiert die nächste Szene wie eine Late-Night-Show. Mit Applaus vom Band.", { emoji: "⌁" }),
  g("sensual", 3, "Verbunden", "In der nächsten Szene bleiben eure Hände verbunden.", { emoji: "⌁", flags: TS }),

  // ——— PRIVATE SIGNALS
  p("cheeky", 1, "Kusszeichen", "Erfindet ein unauffälliges Zeichen für „Ich will dich küssen“. Partytauglich.", { emoji: "🫰", flags: SIG }),
  p("funny", 0, "Notausgang", "Erfindet ein Signal für „Lass uns hier verschwinden“.", { emoji: "🚪", flags: SIG }),
  p("deep", 2, "Alles gut?", "Erfindet ein stilles Zeichen für „Alles gut bei dir?“ – und eins für „Ja“.", { emoji: "🤙", flags: SIG }),
  p("cheeky", 2, "Codesatz", "Ein harmloser Satz, der heimlich „Du siehst heute unfassbar aus“ heißt.", { emoji: "🗝️", flags: SIG }),
  p("sensual", 3, "Versprochen", "Ein Zeichen für „Heute Nacht noch – versprochen“.", { emoji: "🌒", flags: { signal: true, sensual: true } }),

  // ——— HEATCHECK · competitive only
  sd("game", 1, "Starrduell", "Wer zuerst blinzelt oder lacht, verliert das Kapitel.", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("game", 1, "Komplimentschlacht", "Abwechselnd Komplimente. Wem keins mehr einfällt oder wer wiederholt, verliert.", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("game", 2, "Wer kennt wen", "Je drei Fragen über den anderen. Mehr Treffer gewinnt.", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("game", 1, "Daumencatchen", "Best of three. Fairness ist sexy.", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("game", 2, "Bluff", "Je eine wahre und eine erfundene Geschichte. Wer täuscht besser?", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("game", 2, "Date-Pitch", "Dreißig Sekunden Pitch für euer nächstes Date. Ihr bewertet euch gegenseitig ehrlich.", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("game", 1, "Reimkrieg", "Abwechselnd Reime auf „Nacht“. Wer hängt, verliert.", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("game", 2, "Bloß nicht lachen", "Abwechselnd fünfzehn Sekunden: Bring den anderen zum Lachen.", { emoji: "⚔️", ...HC, sparks: 3 }),
  sd("cheeky", 3, "Letzte Runde Charme", "Jeder hat einen Satz, um den anderen sprachlos zu machen. Wer sprachlos ist, verliert – und gewinnt trotzdem.", { emoji: "⚔️", ...HC, sparks: 3 }),
  m("game", 0, "Farbtest", "Nenne {you}s Lieblingsfarbe. Richtig: Sparks.", { emoji: "🎨", ...HC, sparks: 1 }),
  m("game", 0, "Bestellung", "Wie trinkt {you} Kaffee oder Tee? Exakt, bis zum Zucker.", { emoji: "☕", ...HC, sparks: 1 }),
  m("game", 1, "Berufswunsch", "Was wollte {you} als Kind werden?", { emoji: "🚀", ...HC, sparks: 2 }),
  m("game", 1, "Dauerschleife", "Welcher Song läuft bei {you} gerade in Dauerschleife?", { emoji: "🎧", ...HC, sparks: 2 }),
  m("game", 1, "Kleine Phobie", "Wovor gruselt sich {you} heimlich? Harmlos bitte.", { emoji: "🕷️", ...HC, sparks: 2 }),
  m("game", 0, "Stammbestellung", "Welche Pizza bestellt {you} immer?", { emoji: "🍕", ...HC, sparks: 1 }),
  m("game", 1, "Erstes Konzert", "Was war {you}s erstes Konzert oder Festival?", { emoji: "🎸", ...HC, sparks: 2 }),
  m("game", 2, "Outfit-Gedächtnis", "Was hatte {you} beim ersten Date an? Details geben Bonus-Respekt.", { emoji: "👚", ...HC, sparks: 3 }),
  m("cheeky", 1, "Rotprobe", "Bring {you} in zwanzig Sekunden zum Erröten. {you} entscheidet, ob es zählt.", { emoji: "🌶️", ...HC, sparks: 2 }),
  m("cheeky", 2, "Verkaufsgespräch", "Verkaufe {you} einen Mitternachtssnack so verführerisch, dass es fast unanständig klingt.", { emoji: "🍓", ...HC, sparks: 2 }),
  m("funny", 0, "Das Lachen", "Imitiere {you}s Lachen. {you} bewertet die Ähnlichkeit.", { emoji: "😆", ...HC, sparks: 1 }),
  m("funny", 1, "Fünfzehn Sekunden", "Eine wahre Geschichte in fünfzehn Sekunden, die {you} noch nicht kennt.", { emoji: "⚡", ...HC, sparks: 2 }),
  m("game", 1, "Zahl im Kopf", "{me} denkt an eine Zahl von eins bis zehn. {you} hat zwei Versuche. Daneben: {me} punktet.", { emoji: "🔢", ...HC, sparks: 1 }),
  m("cheeky", 2, "Eiserne Miene", "Sag etwas Freches mit komplett unbewegtem Gesicht. Zuckt etwas, gibt es nichts.", { emoji: "🃏", ...HC, sparks: 2 }),
  m("game", 1, "Handschrift", "Schreib {you}s Unterschrift aus dem Gedächtnis nach. {you} bewertet.", { emoji: "✍️", ...HC, sparks: 2 }),
  m("cheeky", 2, "Taktischer Vorteil", "Nenne eine Schwäche von {you}, die du im nächsten Duell ausnutzen wirst. Laut.", { emoji: "♟️", ...HC, sparks: 1 }),
  m("game", 2, "Lieblingsessen-Ranking", "Nenne {you}s drei Lieblingsessen in der richtigen Reihenfolge.", { emoji: "🥇", ...HC, sparks: 3 }),
  m("funny", 1, "Trash Talk", "Zehn Sekunden liebevoller Trash Talk vor der nächsten Runde. Ohne ein einziges gemeines Wort.", { emoji: "🎤", ...HC, sparks: 1 }),
  x("game", 1, "Sabotage", "Bring {you} in der nächsten Szene dazu, zu lachen, bevor sie vorbei ist.", { emoji: "🕶️", ...HC }),
  c("game", 1, "Einsatz", "Was steht in diesem Kapitel auf dem Spiel?", { emoji: "🎲", ...HC, choices: ["Der Verlierer macht Tee", "Der Gewinner wählt die Musik", "Der Verlierer hält eine Lobrede"] }),

  // ——— FIRST SPARK · effortless, funny-flirty, warm
  q("funny", 0, "Zweiter Blick", "Was hast du heute an {you} bemerkt, bevor ihr überhaupt geredet habt?", { emoji: "🕯️", ...FS }),
  m("funny", 0, "Eröffnung", "Dimmt eine Lampe, macht eine andere an. Der Abend ist offiziell eröffnet.", { emoji: "💡", ...FS }),
  t("cheeky", 1, "Einen Tick zu lang", "Schaut euch an. Wer zuerst wegschaut, verliert den Blickduell-Puls – und verrät, was gerade im Kopf war.", { emoji: "👁️", ...FS, duration: 20, mechanic: "standoff" }),
  q("cheeky", 2, "Später ist jetzt", "Was wolltest du {you} schon länger sagen und hast es auf „später“ geschoben?", { emoji: "⏱️", ...FS }),
  q("funny", 0, "Zufallsfund", "Was ist das Seltsamste, das gerade in deiner Tasche oder Hosentasche steckt? Zeigen.", { emoji: "👜", ...FS }),
  m("funny", 1, "Fanpost", "Schreib {you} eine Autogrammwidmung auf ein Stück Papier oder eine Serviette.", { emoji: "🖊️", ...FS }),
  q("cheeky", 1, "Unfair", "Was machst du, wenn du willst, dass {you} sofort lächelt – und es funktioniert immer?", { emoji: "🙂", ...FS }),
  c("funny", 1, "Heute Abend", "Welche Rolle spielst du heute?", { emoji: "🎭", ...FS, choices: ["Die Charmante", "Der Störenfried", "Die Geheimnisvolle", "Der DJ"] }),
  m("cheeky", 2, "Hand aufs Herz", "Leg die Hand auf {you}s Herz und sag, wie schnell es schlägt. Ehrlich bleiben.", { emoji: "❤️‍🔥", ...FS, flags: T }),
  q("cheeky", 3, "Wofür du bleibst", "Was hält dich heute garantiert noch eine Stunde länger wach?", { emoji: "🌙", ...FS }),

  // ——— AFTER DARK · kinetic mini-game energy
  m("game", 0, "Veto", "{me} wählt sofort den nächsten Song. {you} hat genau ein Veto.", { emoji: "🎚️", ...AD }),
  m("funny", 1, "Sportkommentar", "{me} holt etwas zu trinken – in Zeitlupe. {you} kommentiert wie im Sportfernsehen.", { emoji: "🐢", ...AD }),
  m("game", 1, "Platzwechsel", "Tauscht die Plätze. Neue Sofaseite, neue Perspektive, nächste Runde.", { emoji: "🔁", ...AD }),
  t("game", 0, "Zehn Dinge", "Zwanzig Sekunden: Zehn Dinge im Raum, die mit S beginnen. Für jeden Treffer tippen.", { emoji: "🏃", ...AD, duration: 20, mechanic: "tap-rush", goal: 10 }),
  t("game", 1, "Statue", "Fünfzehn Sekunden: Ihr friert als Statue ein, die „Freitagabend“ heißt.", { emoji: "🗿", ...AD, duration: 15 }),
  r("game", 1, "Raumlotterie", "Der Zufall schickt euch in diese Ecke des Raums für die nächste Szene:", { emoji: "🧭", ...AD, choices: ["Fensterbank", "Boden, Rücken an Rücken", "Küche", "Türrahmen", "Joker: {you} entscheidet"] }),
  s("game", 1, "Zahl blind", "Wählt geheim dieselbe Zahl. Ohne Absprache.", { emoji: "🔢", ...AD, choices: ["Drei", "Sieben", "Elf", "Zweiundvierzig"] }),
  g("game", 2, "Rechtshänder verboten", "Bis zur übernächsten Szene darf nur die schwächere Hand benutzt werden.", { emoji: "⌁", ...AD }),
  t("cheeky", 2, "Countdown-Kuss", "Zehn Sekunden Countdown. Bei null: Kuss, High Five oder Verbeugung – {you} entscheidet.", { emoji: "🔟", ...AD, duration: 10, flags: T }),
  x("game", 2, "Doppelagent", "Lass {you} in den nächsten zwei Szenen dreimal „Okay“ sagen.", { emoji: "🎯", ...AD }),

  // ——— NIGHT SHIFT · free-flow nightlife, unpredictable
  q("deep", 1, "Kurswechsel", "Wohin soll diese Nacht noch abbiegen, wenn du ehrlich bist?", { emoji: "🧭", ...NS }),
  m("funny", 1, "Gastgeberwechsel", "{me} übernimmt für drei Minuten. Stell {you} eine Frage, die dieses Spiel nie stellen würde.", { emoji: "🎙️", ...NS }),
  m("cheeky", 3, "Nachtprogramm", "Flüstere {you} die Überschrift der nächsten Stunde. Nur die Überschrift.", { emoji: "🌘", ...NS, flags: SEN }),
  t("funny", 1, "Türsteher", "{me} ist Türsteher. {you} hat zwanzig Sekunden, sich ins eigene Wohnzimmer zu reden.", { emoji: "🚪", ...NS, duration: 20 }),
  m("funny", 0, "Barkarte", "Erfindet einen Drink, der nach euch heißt. Zutaten dürfen erfunden sein.", { emoji: "🍸", ...NS }),
  q("cheeky", 2, "Letzte Bahn", "Die letzte Bahn ist weg. Wohin gehen wir zwei jetzt?", { emoji: "🚇", ...NS }),
  m("funny", 2, "Afterhour-DJ", "{me} legt drei Songs hintereinander auf, jeweils nur zehn Sekunden. {you} tanzt zu allen.", { emoji: "🪩", ...NS }),
  g("cheeky", 2, "Stromausfall", "Licht so weit runter, wie es geht. Die nächste Szene im Halbdunkel.", { emoji: "⌁", ...NS }),
  q("funny", 1, "Rauchpause", "Draußen vor dem Club, zwei Fremde. Worüber reden wir in den ersten fünf Minuten?", { emoji: "🌃", ...NS }),
  q("deep", 3, "Vier Uhr morgens", "Was erzählst du nur um vier Uhr morgens?", { emoji: "🕓", ...NS, ...cap("Vier-Uhr-Satz", "confession") }),

  // ——— US//AFTER DARK · cooperative shared discoveries
  m("game", 1, "Gemeinsamer Takt", "Klopft einen Rhythmus auf den Tisch, bis er synchron ist. Zählt für euch beide.", { emoji: "🥁", ...US }),
  q("deep", 2, "Heist", "Ihr seid ein Duo in einem Heist-Film. Teamname? Wer knackt, wer lenkt ab?", { emoji: "🗝️", ...US }),
  m("deep", 2, "Gleichzeitig", "Drei tiefe Atemzüge, gleichzeitig. Keiner redet. Dann weiter.", { emoji: "🌬️", ...US }),
  m("game", 0, "Turmbau", "Baut zusammen einen Turm aus Dingen in Reichweite. Höher als eine Flasche zählt als Sieg.", { emoji: "🗼", ...US }),
  s("deep", 1, "Gleicher Gedanke", "Denkt beide an ein Wort für den heutigen Abend.", { emoji: "🔗", ...US, choices: ["Leicht", "Warm", "Wild", "Neu"] }),
  m("funny", 1, "Zwei Stimmen", "Singt gemeinsam eine Zeile eines Songs – einer die Melodie, einer den Bass.", { emoji: "🎼", ...US }),
  q("cheeky", 2, "Teamgeheimnis", "Was sollte nie jemand außer euch beiden über heute erfahren?", { emoji: "🤐", ...US }),
  m("game", 1, "Ein Bild, vier Hände", "Zeichnet zusammen ein Porträt von euch auf ein Blatt. Jeder hält den Stift abwechselnd zehn Sekunden.", { emoji: "🖍️", ...US }),
  m("cheeky", 3, "Wärmequelle", "Findet zusammen die gemütlichste Position im Raum. Fünf Minuten nicht bewegen.", { emoji: "🔥", ...US, flags: T }),
  q("deep", 3, "Gemeinsamer Fund", "Was habt ihr heute übereinander herausgefunden, das ihr vorher nicht wusstet?", { emoji: "🔦", ...US }),

  // ——— ONE//TWO · minimal alternating conversation
  q("deep", 1, "Eine Zeile", "Beschreib {you} in einer Zeile, die in keinem Lebenslauf stehen dürfte.", { emoji: "✒️", ...OT }),
  q("deep", 2, "Die Frage", "Welche Frage wünschst du dir von {you}? Und warum stellst du sie nicht selbst?", { emoji: "🤍", ...OT }),
  q("funny", 0, "Fußnote", "Welches Detail an {you} wäre in einer Biografie nur Fußnote – und ist eigentlich das Beste?", { emoji: "📎", ...OT }),
  q("funny", 0, "Kleinste Sache", "Die kleinste Sache, über die du dich diese Woche gefreut hast.", { emoji: "🔬", ...OT }),
  q("funny", 1, "Gegenteil", "Worin seid ihr zwei komplette Gegenteile – und warum funktioniert es trotzdem?", { emoji: "☯️", ...OT }),
  q("deep", 2, "Bis heute", "Was hat {you} einmal gesagt, das du bis heute nicht vergessen hast?", { emoji: "📌", ...OT }),
  q("cheeky", 2, "Unter vier Augen", "Was würdest du {you} jetzt sagen, wenn dieses Handy nicht zuhören würde?", { emoji: "📵", ...OT }),
  q("deep", 3, "Ein Wunsch für uns", "Ein Wunsch für euch beide. Kein großer. Ein echter.", { emoji: "🕊️", ...OT }),
  m("cheeky", 3, "Nur Hände", "Sag {you} etwas Schönes – ausschließlich mit den Händen.", { emoji: "🤲", ...OT, flags: T }),
  q("funny", 1, "Lieblingslüge", "Welche harmlose Lüge erzählst du regelmäßig? Beispiel: „Bin in fünf Minuten da.“", { emoji: "🤞", ...OT }),
  q("sensual", 4, "Letzte Frage", "Was soll {you} heute als Letztes von dir hören?", { emoji: "🌘", ...OT, flags: SEN }),

  // ——— NIGHT//ECHO · memory-worthy prompts built for callbacks
  q("funny", 0, "Erstes Echo", "Sag einen Satz, den ihr heute Nacht noch mindestens zweimal hören sollt.", { emoji: "🔊", ...ECHOISH, ...cap("Der Satz", "motto") }),
  q("deep", 1, "Wort des Abends", "Welches Wort beschreibt {you} heute – nicht generell, nur heute?", { emoji: "🪞", ...ECHOISH, ...cap("Wort des Abends", "word") }),
  q("funny", 0, "Ein Objekt", "Nimm einen Gegenstand in die Hand, der in der Nähe liegt. Er ist ab jetzt euer Maskottchen. Wie heißt er?", { emoji: "🧸", ...EC, ...cap("Das Maskottchen", "object") }),
  q("funny", 1, "Running Gag", "Erfinde einen Spitznamen für {you}, der nur heute gilt.", { emoji: "🏷️", ...EC, ...cap("Spitzname für heute", "alias") }),
  q("cheeky", 2, "Eine Regel", "Stell eine kleine Regel für den Rest des Abends auf. Sie wird zurückkommen.", { emoji: "📜", ...EC, ...cap("Die Regel", "rule") }),
  q("deep", 2, "Ein Bild", "Beschreib in fünf Wörtern ein Bild von euch, das es noch nicht gibt.", { emoji: "🖼️", ...EC, ...cap("Fünf Wörter", "future") }),
  q("funny", 1, "Prophezeiung", "Sag voraus, was in einer Stunde passiert. Wird überprüft.", { emoji: "🔮", ...EC, ...cap("Die Prophezeiung", "prediction") }),
  q("cheeky", 2, "Das Versprechen", "Versprich {you} etwas Kleines für morgen. Es wird erinnert.", { emoji: "🤙", ...EC, ...cap("Das Versprechen", "promise") }),
  q("funny", 0, "Lieblingsgeräusch", "Mach das Geräusch, das diesen Abend am besten beschreibt. Dann gib ihm einen Namen.", { emoji: "🔉", ...EC, ...cap("Das Geräusch", "sound") }),
  q("deep", 3, "Leise Notiz", "Ein Satz, den du über heute in dein Tagebuch schreiben würdest.", { emoji: "📓", ...EC, ...cap("Tagebuchzeile", "diary") }),

  // ——— DIRECTOR fallback · sophisticated, genre-mixing
  q("deep", 1, "Regieanweisung", "Diese Szene ist ein Arthouse-Film. Beschreib in einem Satz, was die Kamera gerade an {you} zeigt.", { emoji: "🎥", ...DR, ...cap("Kamerablick", "frame") }),
  t("funny", 1, "Synchronfassung", "{me} spricht zwanzig Sekunden alles, was {you} sagt, synchron nach. Wie eine schlechte Übersetzung.", { emoji: "🎞️", ...DR, duration: 20 }),
  g("game", 2, "Genrewechsel", "Die nächste Szene wird als Spionagethriller gespielt. Flüstern, Codenamen, Misstrauen.", { emoji: "⌁", ...DR }),
  q("cheeky", 2, "Deleted Scene", "Welche Szene aus eurer gemeinsamen Geschichte wurde im Director’s Cut leider rausgeschnitten?", { emoji: "✂️", ...DR }),
  x("deep", 2, "Zweite Ebene", "Merk dir einen Satz von {you} aus der nächsten Szene. Am Ende der Nacht gibst du ihn zurück.", { emoji: "🧵", ...DR }),
  s("cheeky", 2, "Abspann", "Welcher Song läuft im Abspann dieser Nacht?", { emoji: "🎬", ...DR, choices: ["Etwas Langsames", "Etwas Lautes", "Etwas Altes", "Gar keiner – Stille"] }),
  m("funny", 2, "Requisite", "Wählt einen Gegenstand im Raum. Er bekommt eine Hintergrundgeschichte und einen Auftritt in der nächsten Szene.", { emoji: "🕰️", ...DR }),
  q("deep", 3, "Off-Stimme", "Die Erzählstimme dieses Films sagt jetzt einen Satz über euch. Sprich ihn.", { emoji: "🎙️", ...DR, ...cap("Off-Stimme", "narration") }),
  p("cheeky", 2, "Regiezeichen", "Erfindet ein Zeichen für „Cut – nochmal, aber langsamer“.", { emoji: "🎬", ...DR, flags: SIG }),
  t("sensual", 4, "Schlussbild", "Arrangiert das Schlussbild dieser Nacht. Licht, Abstand, Blick. Haltet es zehn Sekunden.", { emoji: "🖤", ...DR, flags: TS, duration: 10 }),
];

export const PHASE_NAMES = ["First Signal", "Mischief", "Patterns", "Magnetic", "After Hours"] as const;

/** Echo callback templates — {owner}, {other}, {text}, {scene}. */
export const ECHO_TEMPLATES: { kind: "funny" | "emotional" | "flirty" | "future" | "prediction" | "ritual"; prompt: string }[] = [
  { kind: "future", prompt: "Protokoll, Szene {scene}: „{text}“. {other}, nenn ein Datum. Ein echtes." },
  { kind: "future", prompt: "{owner} hat „{text}“ gesagt. {other}, was ist der allererste kleine Schritt dahin – noch diese Woche?" },
  { kind: "ritual", prompt: "Ab heute offiziell: „{text}“. {other}, führt es jetzt zum ersten Mal gemeinsam auf." },
  { kind: "ritual", prompt: "{owner} hat ein Ritual erfunden: „{text}“. {other}, ergänze einen Schritt, den es noch braucht." },
  { kind: "prediction", prompt: "Wiedervorlage: {owner} sagte „{text}“. {other}, ist es eingetreten? Urteil in einem Wort." },
  { kind: "prediction", prompt: "Die Prophezeiung von vorhin: „{text}“. {other}, wie steht es darum – ehrlich?" },
  { kind: "funny", prompt: "{owner} sagte vorhin: „{text}“. {other}, mach daraus jetzt einen Werbeslogan." },
  { kind: "emotional", prompt: "„{text}“ – das kam von {owner}. {other}, was verrät das über {owner}, das du magst?" },
  { kind: "flirty", prompt: "Zurück zu „{text}“. {other}, wie würdest du das heute Nacht einlösen?" },
  { kind: "funny", prompt: "In zehn Jahren erzählt {owner} diese Geschichte: „{text}“. {other}, spiel die Version vor." },
  { kind: "emotional", prompt: "Die Nacht hat mitgeschrieben: „{text}“. {other}, antworte {owner} darauf – ehrlich und kurz." },
  { kind: "flirty", prompt: "„{text}“. {other}, flüstere {owner} die Fortsetzung." },
  { kind: "funny", prompt: "Offizielles Motto des Abends: „{text}“. {other}, verkünde es mit maximalem Pathos." },
  { kind: "emotional", prompt: "Szene {scene} hallt nach: „{text}“. {other}, was davon willst du öfter erleben?" },
];

export function countPool(filter: (s: Scene) => boolean) {
  return SCENES.filter(filter).length;
}