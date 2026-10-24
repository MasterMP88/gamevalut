import type { GameId } from "./types";

/**
 * Mechanic previews — tiny trailers that show how each game actually plays.
 * Every frame mirrors a real mechanic from engine.ts / specials.ts; sample copy is
 * written in the voice of the scene library. Nothing here is a promise the player lacks.
 */
export type Who = "A" | "B" | "both" | "director";
export interface Frame {
  /** Mono microtag, e.g. "DEIN ZUG" */
  tag: string;
  who: Who;
  /** Main line, short */
  text: string;
  /** Visible control / outcome chip */
  action?: string;
  /** Optional multi-choice row */
  options?: string[];
  /** index of highlighted option */
  pick?: number;
  /** Heatcheck sparks, coop energies (0..100) */
  score?: [number, number];
  energies?: [number, number, number];
}

export interface Preview {
  /** One human sentence: what you actually do. */
  mechanic: string;
  /** Only true facts. */
  truths: string[];
  /** "Ideal wenn …" */
  idealWhen: string;
  frames: Frame[];
}

export const PREVIEWS: Record<GameId, Preview> = {
  "roxy-after-dark": {
    mechanic: "Ihr wechselt euch ab: kurze Fragen und Mini-Mutproben, die langsam wärmer werden.",
    truths: ["für 2", "abwechselnd"],
    idealWhen: "Ideal wenn ihr sofort lachen wollt, ohne Regeln zu lesen.",
    frames: [
      { tag: "DEIN ZUG · A", who: "A", text: "Welcher Song läuft in deinem Kopf, wenn du flirtest?" },
      { tag: "LAUT ANTWORTEN", who: "A", text: "Sag es deinem Gegenüber.", action: "Gesagt ✓" },
      { tag: "HANDY RÜBER", who: "B", text: "Jetzt du.", action: "Weiter →" },
      { tag: "MINI-MISSION · B", who: "B", text: "Zeig deinen besten Tanzschritt. Fünf Sekunden.", action: "Gemacht ✓" },
    ],
  },
  "after-dark-2": {
    mechanic: "Countdowns, Glücksrad und verdeckte Wahl – alle paar Szenen ändert sich das Tempo.",
    truths: ["für 2", "Timer & Zufall"],
    idealWhen: "Ideal wenn ihr Energie habt und nicht stillsitzen wollt.",
    frames: [
      { tag: "TEMPOWECHSEL", who: "both", text: "Speedrunde – halbe Zeit.", action: "3 · 2 · 1" },
      { tag: "TIMER · 20 S", who: "A", text: "Nenne fünf Dinge, die du an {B} heimlich nachmachst.", action: "Start ▶" },
      { tag: "VERDECKT WÄHLEN", who: "both", text: "Pizza oder Sushi um Mitternacht?", options: ["Pizza", "Sushi"], pick: 0 },
      { tag: "AUFLÖSUNG", who: "both", text: "Beide: Pizza. Gleicher Geschmack.", action: "Match ✦" },
    ],
  },
  "roxy-night": {
    mechanic: "Nach jeder Szene lenkt ihr die Richtung – die nächsten Szenen folgen eurer Wahl.",
    truths: ["für 2", "steuerbar"],
    idealWhen: "Ideal wenn ihr den Abend selbst dirigieren wollt.",
    frames: [
      { tag: "RICHTUNG", who: "both", text: "Wohin soll die Nacht?", options: ["Lustiger", "Flirtiger", "Spiel", "Heißer"], pick: 1 },
      { tag: "NÄCHSTE SZENE · FLIRTIG", who: "A", text: "Beschreib {B} in drei Worten – nur Komplimente.", action: "Gesagt ✓" },
      { tag: "MOMENTUM · 2 ÜBRIG", who: "B", text: "Die Richtung hält noch zwei Szenen.", action: "Weiter →" },
      { tag: "UMWEG", who: "both", text: "Fenster auf, Licht aus. Was hört ihr draußen?", action: "Gemacht ✓" },
    ],
  },
  battle: {
    mechanic: "Sammelt Sparks, baut Streaks, setzt Power-ups – alle zehn Szenen ein Showdown.",
    truths: ["für 2", "gegeneinander", "ein Gewinner"],
    idealWhen: "Ideal wenn ihr beide charmant gewinnen wollt.",
    frames: [
      { tag: "A · STREAK 2/3", who: "A", text: "Imitiere {B} beim Bestellen im Restaurant.", action: "+1 Spark", score: [6, 4] },
      { tag: "POWER-UP", who: "B", text: "„Zurück“ – die Aufgabe geht an A.", action: "Rebound", score: [6, 4] },
      { tag: "SHOWDOWN · ERHÖHT", who: "both", text: "Wer hält länger Blickkontakt ohne zu lachen?", options: ["A gewinnt", "B gewinnt"], pick: 1, score: [6, 10] },
      { tag: "COMEBACK", who: "A", text: "A liegt hinten: +1 pro Szene.", action: "+2 Sparks", score: [8, 10] },
    ],
  },
  coop: {
    mechanic: "Kein Gegner: jede Szene füllt Chaos, Connection oder Heat – sind alle voll, öffnet sich euer Vault.",
    truths: ["für 2", "gemeinsam", "kein Gewinner"],
    idealWhen: "Ideal wenn ihr als Team etwas freispielen wollt.",
    frames: [
      { tag: "CHAOS FEHLT", who: "both", text: "Erfindet einen Werbespot für eure Couch. Dreißig Sekunden.", action: "Gemacht ✓", energies: [20, 35, 30] },
      { tag: "MEILENSTEIN 1/3", who: "both", text: "Erste Balance – erfindet einen Handschlag.", action: "✦", energies: [40, 42, 35] },
      { tag: "KOMBINATION", who: "both", text: "Chaos + Connection: ein Ritual für schiefe Tage.", action: "✦✦", energies: [62, 60, 52] },
      { tag: "VAULT", who: "both", text: "Alle drei Energien voll.", action: "Geöffnet //", energies: [72, 74, 71] },
    ],
  },
  "one-two": {
    mechanic: "Streng abwechselnd: eine Frage oder Aufgabe pro Screen. Sonst nichts.",
    truths: ["für 2", "abwechselnd", "ruhig"],
    idealWhen: "Ideal wenn ihr einfach reden wollt.",
    frames: [
      { tag: "1", who: "A", text: "Was hast du heute fast gesagt, aber nicht?", action: "Gesagt ✓" },
      { tag: "2", who: "B", text: "Ein Lied, das nach uns klingt?", action: "Gesagt ✓" },
      { tag: "1", who: "A", text: "Halt kurz die Hand von {B}. Nur das.", action: "Gemacht ✓" },
      { tag: "2 · ZURÜCKGESPIELT", who: "B", text: "Die Frage von vorhin – jetzt du.", action: "Gesagt ✓" },
    ],
  },
  "night-echo": {
    mechanic: "Gute Antworten könnt ihr kurz notieren – Szenen später kommen sie als Echo zurück.",
    truths: ["für 2", "abwechselnd", "merkt sich nur im Tab"],
    idealWhen: "Ideal wenn ihr Insider-Witze entstehen lassen wollt.",
    frames: [
      { tag: "SZENE 03 · A", who: "A", text: "Euer Motto für heute Nacht?", action: "Gesagt ✓" },
      { tag: "FÜR DAS ECHO MERKEN", who: "A", text: "„Erst Pommes, dann Pläne.“", action: "Merken ✓" },
      { tag: "ANKER · NUR IN DIESEM TAB", who: "both", text: "Ein Echo formt sich …", action: "〰" },
      { tag: "ECHO · SZENE 09", who: "B", text: "„Erst Pommes, dann Pläne.“ – verkünde es mit Pathos.", action: "Gesagt ✓" },
    ],
  },
  "ai-director": {
    mechanic: "Ein unsichtbarer Gastgeber baut aus eurem Abend ein Spiel, das es nur heute gibt.",
    truths: ["für 2", "AI geführt", "läuft auch offline"],
    idealWhen: "Ideal wenn ihr euch überraschen lassen wollt.",
    frames: [
      { tag: "KOMPOSITION", who: "director", text: "Zu viele Fragen. Nächstes Format: Vorhersage.", action: "Director live" },
      { tag: "SZENE · VORHERSAGE", who: "A", text: "Strand. Großstadt. Hütte ohne Netz – was wählt {B}?", options: ["Strand", "Stadt", "Hütte"], pick: 2 },
      { tag: "DIRECTOR CUT", who: "director", text: "Musik an. Der nächste Song ist euer Soundtrack.", action: "Cut ✦" },
      { tag: "CALLBACK", who: "B", text: "„Hütte ohne Netz“ – plant das erste Wochenende dort.", action: "Gesagt ✓" },
    ],
  },
  "pass-the-aux": {
    mechanic: "Statt zu antworten, tippt ihr verdeckt einen Song ein, gebt das Handy weiter und entsiegelt ihn – allein, zu zweit oder mit Vorhersage.",
    truths: ["für 2", "ohne Musikdienst spielbar", "Tracklist nur in der Session"],
    idealWhen: "Ideal wenn ihr lieber mit Songs antwortet als mit Sätzen.",
    frames: [
      { tag: "DUET · A VERDECKT", who: "A", text: "Euer Roadtrip beginnt jetzt. Nur ein Track darf als Erstes laufen.", action: "Auswahl verstecken" },
      { tag: "VERSIEGELT", who: "B", text: "Nur für {B}. Jetzt du, zum selben Prompt.", action: "Ich bin B · aufdecken" },
      { tag: "ENTSIEGELT", who: "both", text: "Zwei Tracks, ein Moment.", options: ["Track von A", "Track von B"], action: "Match" },
      { tag: "FINALE", who: "both", text: "Tonight’s Tracklist – eure Nacht in Songs.", action: "Tracklist ✓" },
    ],
  },
};