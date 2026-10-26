import type { GangPrompt } from "./playbooks.js";

// Primary sources reviewed 2026-10-26. Each question tests a distinct fact;
// naming the subject in the question keeps plausible invented answers possible.
const facts = (
  topic: string,
  sourceUrl: string,
  rows: [string, string][],
): GangPrompt[] =>
  rows.map(([prompt, answer], i) => ({
    id: `bluff-everyday26-${topic}-${i + 1}`,
    category: topic,
    prompt,
    answer,
    sourceUrl,
  }));
export const BLUFF_EVERYDAY: GangPrompt[] = [
  ...facts(
    "Spielzeug",
    "https://www.lego.com/en-us/aboutus/lego-group/the-lego-group-history",
    [
      [
        "Der Name LEGO verkürzt zwei dänische Wörter. Was bedeuten sie auf Deutsch?",
        "Spiel gut",
      ],
      [
        "Aus welcher Art kleiner Werkstatt ging die LEGO-Firma hervor?",
        "Aus einer Tischlerwerkstatt",
      ],
      ["In welchem Jahr wurde die LEGO-Firma gegründet?", "1932"],
      [
        "Die heutige Grundform des LEGO-Steins wurde in welchem Jahr eingeführt?",
        "1958",
      ],
    ],
  ),
  ...facts(
    "Alltagserfindungen",
    "https://www.post-it.com/3M/en_US/post-it/contact-us/about-us/",
    [
      [
        "Art Fry suchte eine Lösung für herausfallende Lesezeichen. Bei welchem Hobby störte ihn das?",
        "Beim Singen im Kirchenchor",
      ],
      [
        "Warum wurden die ersten Post-it-Zettel laut Hersteller gerade gelb?",
        "Das Nachbarlabor hatte nur gelbes Restpapier",
      ],
      [
        "Unter welchem anderen Namen testete 3M die späteren Post-it-Zettel zunächst?",
        "Press ’n Peel",
      ],
      [
        "Der spätere Post-it-Kleber war ein überraschender Fund. Was für einen Kleber wollte Spencer Silver eigentlich entwickeln?",
        "Einen stärkeren, festeren Kleber",
      ],
    ],
  ),
  ...facts(
    "Stadtdesign",
    "https://www.londonmuseum.org.uk/collections/london-stories/harry-beck-revolutionised-tube-map/",
    [
      [
        "Harry Beck zeichnete den Londoner U-Bahn-Plan neu. Worauf verzichtete er zugunsten klarer Verbindungen?",
        "Auf geografisch genaue Strecken und Abstände",
      ],
      [
        "In welchem Jahr erschien Harry Becks berühmter Londoner U-Bahn-Plan erstmals im Druck?",
        "1933",
      ],
      [
        "Neben waagerechten und senkrechten Linien verwendete Beck hauptsächlich welchen Diagonalwinkel?",
        "45 Grad",
      ],
      ["Die erste Londoner Untergrundbahn eröffnete in welchem Jahr?", "1863"],
    ],
  ),
];
