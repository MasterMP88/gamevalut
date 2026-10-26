// Generated from packages/gang-core/src/experience.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import type { GangGameId } from "./playbooks.js";
import type { InteractionMode } from "./types.js";

/** Authored product contracts, consumed by setup, Director and the game help. */
export interface GangExperience {
  fantasy: string;
  rule: string;
  preferred: InteractionMode;
  couch: boolean;
  minutes: [number, number];
  warmup: string;
  escalation: string;
  peak: string;
  finales: [string, string];
  scale: [string, string, string, string, string];
  privateInfo: string;
}
const contract = (x: GangExperience) => x;
export const GANG_EXPERIENCES: Record<GangGameId, GangExperience> = {
  "the-majority": contract({
    fantasy:
      "Du kennst die Leute. Aber kennst du ihren nächsten absurden Konsens?",
    rule: "Tippt gemeinsam verdeckt auf die Mehrheit. Alle stimmen gleichzeitig mit Fingern ab. Richtiger Tipp: ein Punkt.",
    preferred: "big-screen",
    couch: true,
    minutes: [6, 12],
    warmup: "Offensichtliche Alltagsentscheidung; ein Probedurchgang.",
    escalation:
      "Team-Tipp vor dem Finger-Vote, danach kurze Verteidigung der Minderheit.",
    peak: "Überraschende Mehrheiten werden sichtbar, ohne einzelne Stimmen bloßzustellen.",
    finales: [
      "Doppelt oder gar nicht: letzter Tipp zählt zwei.",
      "Gegen den Strom: tippt auf die kleinste besetzte Antwortgruppe.",
    ],
    scale: [
      "Einzeltipps, keine Teams nötig.",
      "Zwei Teams beraten kurz.",
      "Drei Teams tippen; alle stimmen.",
      "Vier Teams tippen, ein Zähler pro Bereich.",
      "Sechs Sektoren; Captains melden nur Summen.",
    ],
    privateInfo:
      "Tipp vor dem Vote auf Papier festlegen. Keine privaten Daten auf dem TV.",
  }),
  "whos-that": contract({
    fantasy: "Der Raum verleiht dir einen Titel, den du nie beantragt hast.",
    rule: "Drei, zwei, eins: alle zeigen. Die meistgenannte Person bekommt den Titel – und zehn Sekunden für ihr Statement.",
    preferred: "big-screen",
    couch: true,
    minutes: [5, 10],
    warmup: "Ein harmloser, schmeichelhafter Titel.",
    escalation: "Mit jedem Titel wächst eure Galerie.",
    peak: "Die Nominierten dürfen in einem Satz widersprechen.",
    finales: ["Die letzte Preisverleihung.", "Dankesrede: genau fünf Wörter."],
    scale: [
      "Alle sind nominiert.",
      "Zwei Teams nominieren wechselnde Vertreter.",
      "Je Team eine wechselnde Nominierung.",
      "Vier wechselnde Teamvertreter; Beratung im Team.",
      "Sechs Sektoren nominieren wechselnde Vertreter.",
    ],
    privateInfo:
      "Keine geheime Stimme versprochen; Zeigen ist öffentlich. Aussetzen erlaubt.",
  }),
  undercover: contract({
    fantasy:
      "Ein beinahe richtiges Wort verrät dich erst, wenn du zu sicher wirst.",
    rule: "Lest euer geheimes Wort. Gebt einen Hinweis, diskutiert kurz und enttarnt die andere Seite.",
    preferred: "everyone-in",
    couch: false,
    minutes: [8, 20],
    warmup: "Nahe, leicht beschreibbare Wortpaare.",
    escalation: "Hinweise werden knapper; jeder erhält genau einen Beitrag.",
    peak: "Gleichstand führt zur Stichwahl.",
    finales: [
      "Zwei Undercover ab acht Personen.",
      "Solo Agent: genau eine andere Karte, 30 Sekunden für kurze Hinweise.",
    ],
    scale: [
      "Ab vier; ein Undercover.",
      "Ein Hinweis pro Person.",
      "Kurze Hinweise, Diskussion begrenzen.",
      "Bis 30; für schnellere Abende kleinere parallele Räume empfohlen.",
      "Nicht verfügbar: keine sinnvolle 99-Personen-Diskussion.",
    ],
    privateInfo:
      "Rollen und beide Wörter bleiben ausschließlich auf privaten Geräten oder hinter der One-Phone-Abdeckung.",
  }),
  "secret-missions": contract({
    fantasy:
      "Der eigentliche Auftrag läuft, während alle etwas anderes spielen.",
    rule: "Lies deinen Auftrag privat. Erfülle ihn im Lauf des Abends. Einmal darfst du jemanden verdächtigen.",
    preferred: "everyone-in",
    couch: false,
    minutes: [20, 60],
    warmup: "Aufträge privat verteilen, Hauptspiel sofort fortsetzen.",
    escalation: "Ein Verdacht pro Person erzeugt Spannung ohne Spam.",
    peak: "Erfüllungen bleiben bis zum Schluss versiegelt.",
    finales: [
      "Die Agenten-Timeline des Abends.",
      "Erst Verdacht, dann Auftrag enthüllen.",
    ],
    scale: [
      "Ab drei; ein Auftrag pro Person.",
      "Einzigartige Aufträge.",
      "Nebenaufgabe, keine eigene Warteschlange.",
      "Bis 30 eindeutige Aufträge und private Meldungen.",
      "Nicht verfügbar; keine 99 seriellen Geheimkarten.",
    ],
    privateInfo:
      "Auftrag, Verdacht und Erfüllung sind vor dem Abschluss privat.",
  }),
  "bad-answers-only": contract({
    fantasy: "Du wirst für die schlechteste Idee im Raum gefeiert.",
    rule: "Teams haben kurz Zeit für eine herrlich falsche Antwort. Nacheinander raushauen. Applaus entscheidet, zwei Punkte für den Sieger.",
    preferred: "big-screen",
    couch: true,
    minutes: [6, 12],
    warmup: "Freie Antwort, kein Leistungsdruck.",
    escalation: "Pitch, trockene Erklärung und Werbeslogan wechseln sich ab.",
    peak: "Jedes Team bekommt dieselbe kurze Bühne; niemand tippt Romane.",
    finales: [
      "Fünf Wörter. Kein sechstes.",
      "Verkauft eure Antwort wie ein Luxusprodukt.",
    ],
    scale: [
      "Ab drei, einzeln antreten.",
      "Zwei Teams; Sprecher wechseln.",
      "Drei Teams entwickeln parallel.",
      "Vier Teams, je ein kurzer Pitch.",
      "Sechs Sektoren arbeiten parallel; je ein Satz auf der Bühne.",
    ],
    privateInfo:
      "Couch-Antworten sind laut; anonyme Texte bleiben eine Everyone-In-Variante.",
  }),
  bluff: contract({
    fantasy: "Deine Lüge klingt seriöser als die Wahrheit.",
    rule: "Erfinde eine plausible Antwort. Finde die Wahrheit zwischen den Lügen. Wer dir glaubt, bringt dir Punkte.",
    preferred: "everyone-in",
    couch: false,
    minutes: [8, 18],
    warmup: "Kurzer überraschender Fakt mit Quellenauflösung.",
    escalation: "Themenwechsel und versiegelte erste Antworten.",
    peak: "Identische Lügen teilen eine Option; Selbstwahl ausgeschlossen.",
    finales: [
      "Wahrheitstreffer zählen doppelt.",
      "Lügentreffer zählen doppelt, Wahrheit bleibt zwei Punkte wert.",
    ],
    scale: [
      "Ab drei; Wahrheitsperson pausiert.",
      "Alle Lügen gleichzeitig.",
      "Gleiche Texte werden zusammengefasst.",
      "Bis 20; darüber nicht angeboten.",
      "Nicht verfügbar.",
    ],
    privateInfo:
      "Wahrheit nur privat bei der wechselnden Wahrheitsperson; Autoren erst nach dem Vote.",
  }),
  "the-line": contract({
    fantasy:
      "Ihr seid euch sicher, wie ihr tickt – bis jemand ganz am anderen Ende steht.",
    rule: "Der Raum ist eure Skala. Positioniert euch, friert ein, dann sprechen zwei weit entfernte Positionen. Sitzenbleiben und Finger zeigen geht genauso.",
    preferred: "big-screen",
    couch: true,
    minutes: [5, 10],
    warmup: "Eine einfache Skala ohne Wettbewerb.",
    escalation: "Erst schweigend positionieren, dann zwei Perspektiven hören.",
    peak: "Positionen dürfen nach einer guten Begründung wechseln.",
    finales: [
      "Silent Line: kein Wort bis zum Freeze.",
      "Spiegelrunde: erklärt eine andere Position fair.",
    ],
    scale: [
      "Ab vier; eine Linie.",
      "Eine Linie im Raum.",
      "Drei Bereiche oder Sitzskala.",
      "Vier kleine Linien gleichzeitig.",
      "Sechs Sektoren statt einer 99er-Schlange.",
    ],
    privateInfo:
      "Keine richtigen Persönlichkeitswerte; keine erfundenen Genauigkeitspunkte.",
  }),
  "hot-seat": contract({
    fantasy:
      "Ein einziger Blick sagt: Du kennst mich offenbar überhaupt nicht.",
    rule: "Die Person im Spotlight legt ihre Wahl verdeckt fest. Ihr tippt. Gemeinsam aufdecken; jeder richtige Team-Tipp zählt.",
    preferred: "big-screen",
    couch: true,
    minutes: [6, 14],
    warmup: "Unverfängliche Viererwahl.",
    escalation: "Spotlight wandert; jede Person kann passen.",
    peak: "Begründung in einem Satz, danach sofort weiter.",
    finales: ["Doppelte Treffer zum Schluss.", "Letzte Wahl ohne Beratung."],
    scale: [
      "Ab drei, rotierendes Spotlight.",
      "Zwei Teams raten.",
      "Drei Teams, Spotlight rotiert.",
      "Bis 20; vier Teams.",
      "Nicht verfügbar.",
    ],
    privateInfo:
      "Spotlight hält seine Wahl auf Papier fest. Die App speichert keine geheimen Couch-Antworten.",
  }),
  "team-chaos": contract({
    fantasy:
      "Aus zufälligen Leuten wird in dreißig Sekunden ein erstaunlich ehrgeiziges Team.",
    rule: "Alle Teams lösen gleichzeitig dieselbe kurze Aufgabe. Gleiche aktive Teamgröße, messbare Ergebnisse, wechselnde Besetzung.",
    preferred: "big-screen",
    couch: true,
    minutes: [8, 16],
    warmup: "Einfache Wort- oder Sortieraufgabe.",
    escalation: "Sprecher und aktive Besetzung wechseln.",
    peak: "Kurze Deadline, Ergebnisse nebeneinander.",
    finales: [
      "Halbe Zeit, doppelte Siegpunkte.",
      "Jeder gültige Eintrag zählt einen Punkt.",
    ],
    scale: [
      "Ab sechs.",
      "Zwei Teams.",
      "Drei Teams.",
      "Vier Teams mit gleich großer aktiver Besetzung.",
      "Sechs Sektoren; höchstens sechs Aktive je Team, Rest prüft und wechselt.",
    ],
    privateInfo:
      "Couch nutzt nur öffentliche Aufgaben. Geheime Captain-Karten bleiben im Geräte-Modus.",
  }),
  "photo-hunt": contract({
    fantasy: "Aus eurem unscheinbaren Raum wird ein absurd gutes Fotostudio.",
    rule: "Setzt das Motiv um. Ein Bild pro Person oder Team, dann anonym abstimmen. Keine eigene Aufnahme wählen.",
    preferred: "everyone-in",
    couch: false,
    minutes: [8, 15],
    warmup: "Ein stilles Objekt, keine Gesichter nötig.",
    escalation: "Perspektive, Farbe und Miniaturwelten wechseln.",
    peak: "Anonyme Galerie statt Upload-Warteschlange.",
    finales: [
      "20 Sekunden für ein gemeinsames Thema.",
      "Farbfinale: eine dominante Farbe, 30 Sekunden.",
    ],
    scale: [
      "Ab drei; ein Bild pro Person.",
      "Parallel fotografieren.",
      "Kleine Teams mit einem Kameragerät.",
      "Bis 30; gleichzeitige Beiträge.",
      "Nicht verfügbar.",
    ],
    privateInfo:
      "Bilder vor der Abstimmung nur für den Besitzer; freiwillige Gesichter, kurzlebiger Raum.",
  }),
  "draw-this": contract({
    fantasy: "Ein völlig falscher Strich wird plötzlich glasklar.",
    rule: "Eine Person zeichnet auf Papier. Alle raten gleichzeitig. Der erste richtige Tipp zählt.",
    preferred: "everyone-in",
    couch: false,
    minutes: [8, 16],
    warmup: "Greifbarer Begriff, klare Konturen.",
    escalation:
      "Zeichner wechseln; weitere Tipps statt Ausscheiden nach einem Fehler.",
    peak: "Papier auf der Bühne, geheimes Wort nur beim Zeichner.",
    finales: [
      "Mit der anderen Hand zeichnen.",
      "Ein-Strich-Finale: 30 Sekunden, möglichst ohne Absetzen.",
    ],
    scale: [
      "Ab drei; ein Zeichenblatt.",
      "One Phone möglich: richtig ratende Person auswählen.",
      "Alle raten auf eigenen Geräten.",
      "Bis 30; Zeichner rotiert.",
      "Nicht verfügbar.",
    ],
    privateInfo:
      "Das Zielwort darf nie auf die gemeinsame Bühne. TV nur zusammen mit privatem Zeichnergerät.",
  }),
  "music-drop": contract({
    fantasy: "Du erkennst den Track – nur eine halbe Sekunde vor dem Rest.",
    rule: "Hört den Ausschnitt. Hand hoch statt Handy raus. Die erste richtige Antwort bringt Punkte; nach einem Fehler darf der Rest übernehmen.",
    preferred: "big-screen",
    couch: true,
    minutes: [8, 16],
    warmup:
      "Euer DJ legt einen bekannten Track in der Musik-App auf. Alternativ spielt ihr mit eigenen Audiodateien.",
    escalation:
      "Schwierigere Tracks und nur ein Versuch pro Rateteam. Bei lokalen Dateien wird die Hörzeit kürzer.",
    peak: "Falscher Zuruf öffnet den Steal für alle anderen.",
    finales: [
      "Letzter Track. Doppelter Drop. Bei lokalen Dateien: zwei Sekunden.",
      "Letzter Steal: eine zweite Chance für den Rest.",
    ],
    scale: [
      "Im DJ-Modus legt eine Person auf, die übrigen raten einzeln. Zu zweit: eine persönliche Musik-Challenge.",
      "DJ spielt nicht mit. Bis vier Ratende einzeln, darüber zwei Teams.",
      "DJ spielt nicht mit. Zwei bis drei Rateteams mit Handzeichen.",
      "DJ spielt nicht mit. Drei bis vier Rateteams, Host entscheidet Reihenfolge.",
      "DJ spielt nicht mit. Vier bis sechs Sektoren, Captains buzzen per Handzeichen.",
    ],
    privateInfo:
      "DJ bedient die Musik-App separat; deren Songanzeige bleibt vor Ratenden verborgen. Keine Dienst-Verbindung, kein Upload. Lokale Dateinamen erscheinen erst beim Reveal. Song-Voting bleibt eine separate Variante.",
  }),
  "time-drop": contract({
    fantasy: "Ein Song landet genau da, wo deine Erinnerung ihn vermutet.",
    rule: "Hört den Song und ordnet ihn in die Timeline ein.",
    preferred: "big-screen",
    couch: false,
    minutes: [10, 25],
    warmup: "Breite Zeitfenster.",
    escalation: "Engere Jahres-Locks.",
    peak: "Gemeinsame Timeline.",
    finales: ["Final Drop.", "Präzisionsbonus."],
    scale: ["Prototyp.", "Prototyp.", "Prototyp.", "Prototyp.", "Prototyp."],
    privateInfo:
      "Bleibt aus dem spielbaren Katalog bis Audio und dedizierter Player integriert sind.",
  }),
  "chain-reaction": contract({
    fantasy:
      "Niemand weiß, wie ihr vom Staubsauger auf Atlantis gekommen seid.",
    rule: "Knüpft laut an das letzte Wort an. Ein Wort, ein Team, wenige Sekunden. Wiederholung oder Hänger beendet den Streak, niemand scheidet aus.",
    preferred: "big-screen",
    couch: true,
    minutes: [5, 10],
    warmup: "Fünf Sekunden, lockere Assoziationen.",
    escalation: "Team-Sprecher wechseln bei jedem Zug.",
    peak: "Die gemeinsame Kette wächst; der Raum bestätigt die Verbindung.",
    finales: [
      "Drei Sekunden pro Glied.",
      "Rückweg: die letzte Verbindung begründen.",
    ],
    scale: [
      "Ab drei, reihum.",
      "Zwei Teams wechseln.",
      "Drei Teams, interne Beratung kurz.",
      "Vier Teamzüge statt 30 Einzelwartezeiten.",
      "Sechs Sektoren, drei wechselnde Sprecher pro Runde.",
    ],
    privateInfo:
      "Gesprochene Wörter werden nicht aufgezeichnet; Wiederholungen prüft der Raum.",
  }),
  "one-of-you": contract({
    fantasy:
      "Alle Antworten passen. Eine davon passt nur zu einer anderen Frage.",
    rule: "Lest privat eure Frage. Antwortet knapp. Findet die Person mit dem anderen Blickwinkel.",
    preferred: "everyone-in",
    couch: false,
    minutes: [8, 16],
    warmup: "Klar unterscheidbare Fragepaare.",
    escalation:
      "Antworten werden gemeinsam sichtbar, Autoren erst mit Verdacht verbinden.",
    peak: "Stichwahl bei Gleichstand.",
    finales: [
      "Nur ein Wort unterscheidet die Fragen.",
      "Ein letzter Verdacht entscheidet.",
    ],
    scale: [
      "Ab vier.",
      "Ein Odd Player.",
      "Kurze Antworten, gemeinsame Diskussion.",
      "Bis 30; kurz moderierte Diskussion.",
      "Nicht verfügbar.",
    ],
    privateInfo: "Normal-/Odd-Frage und Rollen nie öffentlich vor dem Reveal.",
  }),
  "panic-button": contract({
    fantasy:
      "Dein Gehirn kennt hundert Antworten. Der Timer leider nur zwei Sekunden.",
    rule: "Ein Team nennt eine neue Antwort, der Host bestätigt. Der Timer springt weiter. Bei Hängern gibt es einen Strike, keinen Rauswurf.",
    preferred: "big-screen",
    couch: true,
    minutes: [5, 10],
    warmup: "Fünf Sekunden pro Zug, drei Züge je Team.",
    escalation: "Vier, dann drei Sekunden; Sprecher wechseln.",
    peak: "Zwei Sekunden im Schlussdurchgang.",
    finales: [
      "Zwei Sekunden bis zum nächsten Team.",
      "Richtungswechsel zum letzten Durchgang.",
    ],
    scale: [
      "Einzeln, drei Züge pro Person.",
      "Zwei Teams.",
      "Drei Teams.",
      "Vier Teams, drei Sprecher je Runde.",
      "Sechs Sektoren; begrenzte Zugzahl, kein Warten auf 99 Einzelzüge.",
    ],
    privateInfo:
      "Host bestätigt gesprochene Antworten; keine Mikrofonaufnahme oder vermeintliche KI-Prüfung.",
  }),
  "after-dark": contract({
    fantasy:
      "Ein Abend wird persönlicher, ohne dass jemand seine Grenzen erklären muss.",
    rule: "Alle entscheiden privat, ob sie dabei sind. Wählt, fragt oder passt. Ein Stop reicht, um die Aktion zu beenden.",
    preferred: "everyone-in",
    couch: false,
    minutes: [8, 18],
    warmup: "Privates 18+-Opt-in, freundliche Frage.",
    escalation: "Nur gemeinsam freigegebene Intensität.",
    peak: "Persönliche Entscheidungen ohne öffentliche Einzelstimmen.",
    finales: [
      "Soft: ein schöner Satz zum Schluss.",
      "Bold nur einstimmig; Stop beendet sofort.",
    ],
    scale: [
      "Ab zwei, beide stimmen zu.",
      "Private Entscheidungen.",
      "Bis 15, gleichzeitige Grenzen.",
      "Bis 20, keine öffentliche Drucksituation.",
      "Nicht verfügbar.",
    ],
    privateInfo:
      "Zustimmung und Grenzen bleiben privat; keine TV-only-Abfrage persönlicher Grenzen.",
  }),
};
export const couchGame = (id: string): boolean =>
  GANG_EXPERIENCES[id as GangGameId]?.couch === true;
export const groupBand = (n: number): 0 | 1 | 2 | 3 | 4 =>
  n <= 4 ? 0 : n <= 8 ? 1 : n <= 15 ? 2 : n <= 30 ? 3 : 4;
