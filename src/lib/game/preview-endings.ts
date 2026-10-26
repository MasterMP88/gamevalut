import type { GameId } from "./types";
/** A free, voluntary closing beat before the purchase choice. No scene-six content. */
export const PREVIEW_ENDINGS: Record<GameId, [string, string]> = {
  "roxy-after-dark": ["Der erste Funke", "Nennt beide einen kleinen Moment aus diesen fünf Szenen, den ihr gern in den nächsten Abend mitnehmen würdet."],
  "after-dark-2": ["Kurzer Nachhall", "Wählt gleichzeitig: noch etwas Chaos, einen ruhigen Moment oder für heute genug. Jede Richtung ist ein gutes Ende."],
  "roxy-night": ["Euer nächster Halt", "Gebt diesem kleinen Auftakt einen Filmtitel. Er darf großspurig sein – und völlig daneben."],
  "battle": ["Respekt zum Schluss", "Gebt einander einen übertriebenen Titel für den bisherigen Spielstil. Die nächste Revanche braucht keine ernste Siegerehrung."],
  "coop": ["Unser kleines Team", "Vervollständigt gemeinsam einen Satz: Als Duo sind wir heute besonders gut in …"],
  "one-two": ["Eine Sache bleibt", "Sagt freiwillig je eine Sache, die ihr gerade neu am Gegenüber entdeckt habt. Zuhören reicht als Antwort."],
  "night-echo": ["Was soll nachhallen?", "Welche kleine Beobachtung von eben darf bleiben? Ein Blick oder ein Satz genügt. Ihr müsst nichts eintippen oder sichern."],
  "ai-director": ["Der erste Abspann", "Wählt den Ton eures Abspanns: sanft, albern oder überraschend. Gebt dem Auftakt zusammen einen letzten Satz."],
  "pass-the-aux": ["Ein letzter Refrain", "Welcher eurer bisherigen Picks wäre der Abspann? Einigt euch auf einen Song – hören könnt ihr ihn in eurer Musik-App."],
};
