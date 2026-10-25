// Generated from packages/gang-core/src/team-prompts.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import type { GangPrompt } from "./playbooks.js";

const taboo = [
  ["Urlaub", "Reise", "frei", "Ferien"],
  ["Popcorn", "Kino", "Mais", "knallen"],
  ["Regenschirm", "Regen", "nass", "Schirm"],
  ["Kühlschrank", "kalt", "Essen", "Küche"],
  ["Karaoke", "singen", "Mikrofon", "Lied"],
  ["Rolltreppe", "Treppe", "Stufe", "fahren"],
  ["Zahnbürste", "Zähne", "putzen", "Bad"],
  ["Sonnenbrille", "Sonne", "Augen", "Brille"],
];
const mime = [
  "Zahnarzt · Pinguin · Waschmaschine",
  "Astronaut · Staubsauger · Dirigent",
  "Koch · Känguru · Wecker",
  "Schlafwandler · Roboter · Surfer",
  "Torwart · Giraffe · Fotograf",
  "Zauberer · Schnecke · Kellner",
  "Cowboy · Qualle · Mixer",
  "Detektiv · Eule · Gärtner",
];
const draw = [
  "Gießkanne",
  "Leuchtturm",
  "Waffeleisen",
  "Seilbahn",
  "Hängematte",
  "Saxofon",
];
const collect = [
  [
    "Nennt Lebensmittel, deren Name mit B beginnt.",
    "gültige verschiedene Lebensmittel",
  ],
  [
    "Findet Gegenstände mit genau zwei sichtbaren Farben.",
    "verschiedene passende Gegenstände",
  ],
  ["Nennt Tiere mit mindestens vier Beinen.", "gültige verschiedene Tiere"],
  [
    "Sammelt Wörter, die sich auf Haus reimen.",
    "verschiedene gültige Reimwörter",
  ],
  [
    "Nennt Film- oder Serientitel mit einem Vornamen darin.",
    "gültige verschiedene Titel",
  ],
  [
    "Findet Gegenstände, die in eine geschlossene Hand passen.",
    "verschiedene passende Gegenstände",
  ],
  ["Nennt Berufe, die mit K beginnen.", "gültige verschiedene Berufe"],
  ["Nennt Dinge, die einen Griff haben.", "verschiedene passende Dinge"],
];

export const TEAM_PROMPTS: GangPrompt[] = [
  ...taboo.map(([answer, ...forbidden], i): GangPrompt => ({
    id: `team-taboo-v2-${i}`,
    category: "Tabu",
    prompt: "Die Captains erklären. Welches Team errät den Begriff?",
    seconds: 45,
    teamChallenge: {
      secret: answer!,
      forbidden,
      metric: "Begriff erraten (0 oder 1)",
      maxResult: 1,
      instruction:
        "Beide Teams spielen gleichzeitig. Nur Captains sehen den Begriff. Keine Wortteile, Übersetzungen oder Tabuwörter. Ein Regelverstoß bedeutet 0 Treffer für diese Runde.",
    },
  })),
  ...mime.map((secret, i): GangPrompt => ({
    id: `team-mime-v2-${i}`,
    category: "Pantomime",
    prompt: "Drei Begriffe, keine Stimme. Wie viele knackt euer Team?",
    seconds: 30,
    teamChallenge: {
      secret,
      metric: "erkannte Begriffe (0–3)",
      maxResult: 3,
      instruction:
        "Captains stellen die drei Begriffe der Reihe nach dar. Ohne Laute, Lippenlesen oder Buchstaben. Jeder Begriff zählt einmal; ein schwieriger Begriff darf ausgelassen werden.",
    },
  })),
  ...draw.map((secret, i): GangPrompt => ({
    id: `team-draw-v2-${i}`,
    category: "Zeichnen",
    prompt: "Die ungewohnte Hand zeichnet. Die Teams raten gleichzeitig.",
    seconds: 35,
    teamChallenge: {
      secret,
      metric: "Begriff erraten (0 oder 1)",
      maxResult: 1,
      instruction:
        "Captains zeichnen mit der ungewohnten Hand auf Papier. Keine Zahlen, Buchstaben oder gesprochenen Hinweise. Gleiche Zeit für beide Teams.",
    },
  })),
  ...collect.map(([prompt, metric], i): GangPrompt => ({
    id: `team-collect-v2-${i}`,
    category: "Sammeln",
    prompt: prompt!,
    seconds: 30,
    teamChallenge: {
      metric: metric!,
      maxResult: 30,
      instruction:
        "Beide Teams sammeln gleichzeitig. Captains notieren die Antworten. Nach dem Timer laut vergleichen: innerhalb eines Teams zählt jede Antwort nur einmal. Zweifelsfälle gemeinsam streichen; kein Googeln.",
    },
  })),
  {
    id: "team-tower-v2",
    category: "Bauen",
    prompt: "Baut den höchsten frei stehenden Turm aus Gegenständen am Tisch.",
    seconds: 45,
    teamChallenge: {
      metric: "Höhe in ganzen Zentimetern",
      maxResult: 200,
      instruction:
        "Drei Gegenstände pro Team, keine zerbrechlichen oder gefährlichen Dinge. Nach dem Timer Hände weg: Der Turm muss fünf Sekunden stehen. Dann mit demselben Maßband messen. Ein gestürzter Turm zählt 0.",
    },
  },
];
