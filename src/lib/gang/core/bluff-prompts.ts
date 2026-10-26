// Generated from packages/gang-core/src/bluff-prompts.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import type { GangPrompt } from "./playbooks.js";
// Independently worded facts. Primary museum/NASA sources reviewed 2026-10-25.
const groups: Array<{
  topic: string;
  url: string;
  rows: Array<[string, string]>;
}> = [
  {
    topic: "Venus",
    url: "https://science.nasa.gov/venus/venus-facts/",
    rows: [
      [
        "Die Venus dreht sich gemütlich. Wie viele Erdtage braucht sie ungefähr für eine Drehung?",
        "243 Erdtage",
      ],
      ["Eine Drehung dauert auf der Venus länger als was?", "Ein Venusjahr"],
      [
        "Auf der Venus wäre selbst der Sonnenaufgang anders. In welcher Himmelsrichtung?",
        "Im Westen",
      ],
      ["Welches Metall könnte an der Venusoberfläche schmelzen?", "Blei"],
      [
        "Aus welcher Säure bestehen die dichten Wolken der Venus vor allem?",
        "Schwefelsäure",
      ],
      ["Welches Gas dominiert die Venusatmosphäre?", "Kohlendioxid"],
    ],
  },
  {
    topic: "Uranus",
    url: "https://science.nasa.gov/uranus/facts/",
    rows: [
      [
        "Welcher Planet wirkt, als würde er seitlich durchs Sonnensystem rollen?",
        "Uranus",
      ],
      ["Wer entdeckte Uranus 1781 mit einem Teleskop?", "William Herschel"],
      [
        "Herschel wollte seinen neuen Planeten nach wem benennen?",
        "König Georg III.",
      ],
      [
        "Ein Geburtstag pro Uranusjahr: Wie viele Erdenjahre lägen dazwischen?",
        "Etwa 84 Jahre",
      ],
    ],
  },
  {
    topic: "Saturn",
    url: "https://science.nasa.gov/saturn/facts/",
    rows: [
      [
        "Welcher Planet hat als einziger eine mittlere Dichte unter der von Wasser?",
        "Saturn",
      ],
      ["Wie lang dauert eine Drehung des Saturn ungefähr?", "10,7 Stunden"],
      [
        "Ein Jahr auf Saturn dauert ungefähr wie viele Erdenjahre?",
        "29,4 Jahre",
      ],
      [
        "Aus welchen beiden Elementen besteht Saturn hauptsächlich?",
        "Wasserstoff und Helium",
      ],
    ],
  },
  {
    topic: "Oktopus",
    url: "https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives",
    rows: [
      ["Wie viele Herzen arbeiten in einem Oktopus?", "Drei"],
      ["Welche Farbe hat sauerstoffreiches Oktopusblut?", "Blau"],
      [
        "Welches Metall übernimmt im Blutfarbstoff eines Oktopus die Rolle unseres Eisens?",
        "Kupfer",
      ],
      ["Wohin pumpen zwei der drei Oktopusherzen das Blut?", "Zu den Kiemen"],
    ],
  },
  {
    topic: "Schmetterlinge",
    url: "https://www.nhm.ac.uk/discover/how-to-make-simple-butterfly-feeder.html",
    rows: [
      [
        "Mit welchem überraschenden Körperteil können Schmetterlinge schmecken?",
        "Mit den Füßen",
      ],
      [
        "Welchen für uns unsichtbaren Lichtbereich können Schmetterlinge sehen?",
        "Ultraviolett",
      ],
      [
        "Wie heißt das lange, aufrollbare Trinkwerkzeug eines Schmetterlings?",
        "Saugrüssel",
      ],
    ],
  },
  {
    topic: "Kuriose Nahrung",
    url: "https://www.nhm.ac.uk/discover/spotlight-great-eggfly.html",
    rows: [
      [
        "Ein Great-Eggfly-Schmetterling landet auf deiner Stirn. Welches Getränk könnte er suchen?",
        "Deinen Schweiß",
      ],
      [
        "Welchen Mineralstoff suchen manche Schmetterlinge in menschlichem Schweiß?",
        "Natrium",
      ],
    ],
  },
  {
    topic: "Vögel",
    url: "https://www.nhm.ac.uk/discover/do-birds-pee.html",
    rows: [
      ["Was macht den weißen Anteil von Vogelkot aus?", "Harnsäure"],
      [
        "Wie heißt die gemeinsame Körperöffnung, über die Vögel Eier und Ausscheidungen abgeben?",
        "Kloake",
      ],
      [
        "Welche unverdaulichen Reste finden sich oft in Eulengewöllen?",
        "Fell und Knochen",
      ],
    ],
  },
  {
    topic: "Seepferdchen",
    url: "https://ocean.si.edu/ocean-life/invertebrates/pregnant-seahorse",
    rows: [
      [
        "Wer trägt bei Seepferdchen die sich entwickelnden Jungen aus?",
        "Das Männchen",
      ],
      [
        "Worin trägt ein männliches Seepferdchen die sich entwickelnden Jungen?",
        "In einer Bruttasche",
      ],
    ],
  },
  {
    topic: "Seepferdchen",
    url: "https://ocean.si.edu/ocean-life/fish/longspine-seahorse",
    rows: [
      [
        "Was können die Augen des Langdorn-Seepferdchens unabhängig voneinander tun?",
        "Sich bewegen",
      ],
    ],
  },
  {
    topic: "Seepferdchen",
    url: "https://ocean.si.edu/ocean-life/invertebrates/seahorse-lovebirds",
    rows: [
      [
        "Welches tägliche Ritual stärkt bei monogamen Seepferdchen die Paarbindung?",
        "Gegenseitige Begrüßungen",
      ],
    ],
  },
];
export const BLUFF_PROMPTS: GangPrompt[] = groups.flatMap((g, i) =>
  g.rows.map(([prompt, answer], j) => ({
    id: `bluff-verified-${i}-${j}`,
    prompt,
    answer,
    category: g.topic,
    sourceUrl: g.url,
  })),
);
