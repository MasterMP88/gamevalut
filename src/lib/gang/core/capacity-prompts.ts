// Generated from packages/gang-core/src/capacity-prompts.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import type { GangPrompt } from "./playbooks.js";

// Private HOT SEAT reserve prevents another game's shared choices from consuming
// the whole pool during a mixed multi-night schedule.
export const CAPACITY_HOT: GangPrompt[] = (
  [
    [
      "Bei einer Führung schweift dein Blick zuerst wohin?",
      ["Architektur", "Menschen", "Kleine Details", "Zum nächsten Sitzplatz"],
    ],
    [
      "Du darfst einen Alltagsgeruch als Kerze abfüllen. Welchen?",
      ["Frisches Brot", "Sommerregen", "Neue Bücher", "Waldweg"],
    ],
    [
      "Eine Aufgabe ist fast fertig. Was machst du eher?",
      [
        "Letztes Detail perfektionieren",
        "Direkt abschließen",
        "Jemandem zeigen",
        "Kurz liegen lassen",
      ],
    ],
    [
      "Im Museum bleibt dir eher was im Kopf?",
      [
        "Ein einzelnes Bild",
        "Eine seltsame Geschichte",
        "Die Atmosphäre",
        "Der Museumsshop",
      ],
    ],
    [
      "Welche winzige Verantwortung würdest du in einem Filmteam übernehmen?",
      [
        "Requisiten sortieren",
        "Klappe schlagen",
        "Snacks betreuen",
        "Hintergrundgeräusche machen",
      ],
    ],
    [
      "Eine freie Wand gehört dir. Was kommt hin?",
      ["Ein großes Foto", "Viele kleine Bilder", "Ein Regal", "Gar nichts"],
    ],
    [
      "Bei einer neuen Pflanze interessiert dich zuerst was?",
      [
        "Wie sie aussieht",
        "Ob sie überlebt",
        "Wie sie heißt",
        "Wo sie gut steht",
      ],
    ],
    [
      "Ein Ausflug endet unerwartet früh. Dein nächster Gedanke?",
      [
        "Noch ein Ziel",
        "Kaffee irgendwo",
        "Gut nach Hause",
        "Planlos weiterlaufen",
      ],
    ],
    [
      "Welche Art Erinnerung behältst du von einem guten Essen?",
      ["Den Geschmack", "Das Gespräch", "Den Ort", "Ein lustiges Detail"],
    ],
    [
      "Ein freundlicher Automat schenkt dir etwas Kleines. Was passt?",
      [
        "Eine Postkarte",
        "Ein guter Stift",
        "Ein ungewöhnlicher Snack",
        "Ein Rätsel",
      ],
    ],
    [
      "Du verpasst knapp einen Bus. Was hilft am ehesten?",
      [
        "Zu Fuß weitergehen",
        "Eine Nachricht schreiben",
        "Musik anmachen",
        "Sitzen und schauen",
      ],
    ],
    [
      "Beim Zuhören merkst du dir eher …",
      [
        "Genaue Wörter",
        "Die Stimmung",
        "Das Wichtigste",
        "Ein unerwartetes Detail",
      ],
    ],
    [
      "Welches Fundstück würdest du auf einem Spaziergang fotografieren?",
      [
        "Ein seltsames Schild",
        "Eine schöne Fassade",
        "Ein Tier",
        "Licht und Schatten",
      ],
    ],
    [
      "Für einen Tag ein Handwerk ausprobieren: welches?",
      ["Töpfern", "Buchbinden", "Schreinern", "Glasblasen"],
    ],
    [
      "Jemand erklärt dir ein neues Spiel. Was brauchst du zuerst?",
      ["Das Ziel", "Ein Beispiel", "Alle Regeln", "Einfach die erste Runde"],
    ],
    [
      "Welche kleine Alltagsentscheidung würdest du gern abgeben?",
      [
        "Was es zu essen gibt",
        "Was ich anziehe",
        "Welche Strecke",
        "Wann die Pause ist",
      ],
    ],
    [
      "Ein schöner Ort ist leer. Du möchtest zuerst …",
      [
        "Die Ruhe genießen",
        "Ein Foto machen",
        "Jemanden dazuholen",
        "Alles erkunden",
      ],
    ],
    [
      "Du bekommst ein leeres Notizbuch. Die erste Seite wird …",
      ["Eine Liste", "Eine Skizze", "Ein Gedanke", "Vorerst leer bleiben"],
    ],
    [
      "Welches leise Geräusch macht einen Raum gemütlich?",
      [
        "Regen",
        "Holzknistern",
        "Geschirr aus der Küche",
        "Blättern in einem Buch",
      ],
    ],
    [
      "Ein Nachmittag gehört einem einzigen Thema. Welchem?",
      ["Kochen", "Weltraum", "Stadtgeschichte", "Seltsame Erfindungen"],
    ],
    [
      "Eine kleine Überraschung liegt vor deiner Tür. Deine erste Reaktion?",
      [
        "Sofort öffnen",
        "Absender suchen",
        "Jemandem zeigen",
        "Erst mal staunen",
      ],
    ],
    [
      "Eine harmlose Sammlung beginnen: was wäre es?",
      ["Postkarten", "Steine", "Alte Schlüssel", "Seltsame Verpackungen"],
    ],
    [
      "Du kannst einer Wetterlage einen Namen geben. Was wird daraus?",
      [
        "Etwas Poetisches",
        "Ein schlechter Wortwitz",
        "Ein Personenname",
        "Eine sehr genaue Beschreibung",
      ],
    ],
    [
      "Eine gute Idee kommt unerwartet. Was passiert zuerst?",
      [
        "Notieren",
        "Ausprobieren",
        "Jemandem erzählen",
        "Noch etwas darüber nachdenken",
      ],
    ],
  ] satisfies [string, string[]][]
).map(([prompt, options], i) => ({
  id: `hot-capacity26-${i + 1}`,
  prompt,
  options,
}));

// Independently playable tasks. IDs are append-only, separate from earlier packs.
export const CAPACITY_MUSIC: GangPrompt[] = [
  "Welcher Song begleitet die Eröffnung eines sehr kleinen Freizeitparks?",
  "Die Gruppe übernimmt für einen Abend ein Café. Was läuft beim Ankommen?",
  "Ihr gewinnt eine Medaille für eine völlig unnütze Fähigkeit. Die Einlaufmusik?",
  "Ein Aufzug fährt euch direkt in den Feierabend. Was hört ihr darin?",
  "Eure gemeinsame Kochshow läuft völlig aus dem Ruder. Welcher Track rettet sie?",
  "Der Nachtbus wird kurz zum besten Ort der Stadt. Was läuft dazu?",
  "Eine Regenwolke bestellt einen freien Tag. Welches Lied feiert ihre Pause?",
  "Ihr findet die perfekte Picknickstelle. Ein Track für das Auspacken.",
  "Die Weltmeisterschaft im höflichen Widersprechen beginnt. Womit eröffnet ihr?",
  "Ein Film zeigt die Gruppe beim sehr langsamen Aufräumen. Die Musik macht es episch.",
  "Eine Katze übernimmt die Hausverwaltung. Welchen Song bekommt ihr erster Arbeitstag?",
  "Euer gemeinsamer Laden verkauft gute Laune. Welches Lied spielt vor der Tür?",
].map((prompt, i) => ({ id: `music-capacity26-${i + 1}`, prompt }));

const collect: [string, string][] = [
  [
    "Notiert Dinge, die Schatten spenden können, ohne Gebäude zu sein.",
    "verschiedene passende Dinge",
  ],
  [
    "Sammelt deutsche Wörter, die mit „Vor“ beginnen.",
    "verschiedene gültige Wörter",
  ],
  [
    "Nennt Berufe, bei denen eine Lupe hilfreich sein kann.",
    "verschiedene nachvollziehbare Berufe",
  ],
  [
    "Schreibt Gegenstände auf, die man an einem Band tragen kann.",
    "verschiedene passende Gegenstände",
  ],
  [
    "Findet Lebensmittel, die innen anders aussehen als außen.",
    "verschiedene passende Lebensmittel",
  ],
  [
    "Notiert Orte, an denen man etwas ausleihen kann.",
    "verschiedene passende Orte",
  ],
  [
    "Sammelt Dinge, die man durch Drehen bedient.",
    "verschiedene passende Dinge",
  ],
  [
    "Findet Wörter mit „Wasser“, die kein Gewässer benennen.",
    "verschiedene gültige Wörter",
  ],
  [
    "Nennt Tätigkeiten, bei denen beide Hände Unterschiedliches tun.",
    "verschiedene nachvollziehbare Tätigkeiten",
  ],
  [
    "Schreibt Dinge auf, die man zusammenrollen kann.",
    "verschiedene passende Dinge",
  ],
  [
    "Sammelt Gegenstände, die oft paarweise benutzt werden.",
    "verschiedene passende Gegenstände",
  ],
  [
    "Findet Orte, an denen Nummern Menschen beim Orientieren helfen.",
    "verschiedene passende Orte",
  ],
  [
    "Notiert Wörter, in denen ein Tiername steckt, ohne dass das Wort selbst ein Tier meint.",
    "verschiedene nachvollziehbare Wörter",
  ],
  [
    "Sammelt Dinge, die durch Wärme weich werden können.",
    "verschiedene passende Dinge",
  ],
  [
    "Nennt Gegenstände, mit denen man etwas befestigen kann.",
    "verschiedene passende Gegenstände",
  ],
  [
    "Findet Dinge, die im Dunkeln helfen, einen Weg zu erkennen.",
    "verschiedene passende Dinge",
  ],
  [
    "Schreibt Dinge auf, die einen Deckel besitzen können.",
    "verschiedene passende Dinge",
  ],
  [
    "Sammelt Orte, an denen Menschen freiwillig Schlange stehen.",
    "verschiedene plausible Orte",
  ],
  [
    "Findet Wörter, die sowohl eine Handlung als auch einen Gegenstand bezeichnen können.",
    "verschiedene erklärte Wortpaare",
  ],
  [
    "Notiert Dinge, die ein Geräusch machen, obwohl sie keinen Strom brauchen.",
    "verschiedene passende Dinge",
  ],
];
export const CAPACITY_TEAM: GangPrompt[] = collect.map(
  ([prompt, metric], i) => ({
    id: `team-capacity26-${i + 1}`,
    prompt,
    seconds: 45,
    category: "Sammeln",
    teamChallenge: {
      metric,
      maxResult: 30,
      instruction:
        "Gleich viele aktive Personen pro Team. Notiert eine Liste, das andere Team prüft nach dem Timer. Doppelungen und bloße Farbvarianten zählen nur einmal; Unklarheiten gemeinsam klären.",
    },
  }),
);
