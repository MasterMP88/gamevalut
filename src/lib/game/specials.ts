import type { Scene, Tempo } from "./types";

/**
 * Engine-injected scenes: they are not drawn from the random pool but placed by
 * game-specific dramaturgy (tempo shifts, detours, Director Cuts, co-op milestones).
 */

const base = { source: "local" as const, phase: 0 };

export const TEMPO_CUES: Record<Tempo, string> = {
  speed: "Tempowechsel · Speedrunde – halbe Zeit, keine Diskussion",
  silent: "Tempowechsel · Stille Runde – kein Wort, nur Gesten",
  swap: "Tempowechsel · Rollentausch – {you} entscheidet für {me}",
  rule: "Tempowechsel · Mini-Regel – wer „ja“ oder „nein“ sagt, steht kurz auf",
};
export const TEMPO_ORDER: Tempo[] = ["speed", "silent", "swap", "rule"];

/** Night Shift: nocturnal micro-adventures that break the line. */
export const DETOURS: Scene[] = [
  { ...base, id: "detour-1", type: "MISSION", flavor: "funny", phase: 0, title: "Umweg: Balkon", emoji: "🌙", prompt: "Fenster auf, Licht aus. Beschreibt euch gegenseitig, was ihr draußen hört – wie ein Nachtreporter." },
  { ...base, id: "detour-2", type: "MISSION", flavor: "game", phase: 0, title: "Umweg: Küche", emoji: "🍳", prompt: "Ihr habt 3 Zutaten aus dem Kühlschrank. Erfindet daraus einen Snack mit absurdem Namen." },
  { ...base, id: "detour-3", type: "MISSION", flavor: "funny", phase: 1, title: "Umweg: Plattenladen", emoji: "💿", prompt: "{me} legt einen Song auf, {you} muss in 10 Sekunden sagen, in welchem Film er läuft." },
  { ...base, id: "detour-4", type: "MISSION", flavor: "cheeky", phase: 1, title: "Umweg: Spätkauf", emoji: "🛒", prompt: "Spielt in einer Minute: zwei Fremde treffen sich nachts um drei beim Spätkauf. Einer hat nur Kleingeld." },
  { ...base, id: "detour-5", type: "MISSION", flavor: "deep", phase: 1, title: "Umweg: Dachkante", emoji: "🌃", prompt: "Stellt euch ans Fenster. Jeder zeigt auf ein Licht da draußen und erfindet, wer dort gerade wach ist." },
  { ...base, id: "detour-6", type: "MISSION", flavor: "game", phase: 0, title: "Umweg: Sitzplatz", emoji: "🪑", prompt: "Tauscht die Plätze. Die nächste Szene spielt ihr aus der Perspektive des anderen." },
];

/** Director Cuts: rare format breaks, spaced 8–12 scenes apart. */
export const DIRECTOR_CUTS: Scene[] = [
  { ...base, id: "cut-1", type: "TIMER", flavor: "deep", title: "Director Cut: Stille", emoji: "🤫", duration: 30, prompt: "Dreißig Sekunden. Kein Wort, kein Handy. Nur hinsehen.", cue: "Director Cut · zu viel geredet, kurz Stille." },
  { ...base, id: "cut-2", type: "MISSION", flavor: "funny", title: "Director Cut: Soundtrack", emoji: "🎧", prompt: "Musik an. Der nächste Song ist ab jetzt der Soundtrack eurer Nacht – egal, was kommt.", cue: "Director Cut · die Nacht braucht Musik." },
  { ...base, id: "cut-3", type: "MISSION", flavor: "game", title: "Director Cut: Raumwechsel", emoji: "🚪", prompt: "Neuer Drehort. Ihr wechselt jetzt den Raum – oder zumindest die Ecke.", cue: "Director Cut · Szenenwechsel." },
  { ...base, id: "cut-4", type: "MISSION", flavor: "cheeky", title: "Director Cut: Plätze tauschen", emoji: "🔁", prompt: "Plätze tauschen. Wer jetzt wo sitzt, bleibt so bis zum nächsten Cut.", cue: "Director Cut · neue Perspektive." },
  { ...base, id: "cut-5", type: "TIMER", flavor: "deep", title: "Director Cut: Handy weg", emoji: "📵", duration: 60, prompt: "Handy mit dem Display nach unten. Eine Minute nur ihr zwei, dann geht's weiter.", cue: "Director Cut · der Bildschirm macht Pause." },
  { ...base, id: "cut-6", type: "MISSION", flavor: "funny", title: "Director Cut: Licht", emoji: "🕯️", prompt: "Licht runter, eine Lampe bleibt. Ab jetzt spielt ihr im Halbdunkel.", cue: "Director Cut · Beleuchtung angepasst." },
];

/** US//AFTER DARK: three shared milestones before the Vault. The combo milestone picks the scene for the two strongest energies. */
type E = { chaos: number; connection: number; heat: number };
const ms = (id: string, flavor: Scene["flavor"], title: string, prompt: string, cue: string): Scene => ({ ...base, id, type: "MISSION", flavor, title, emoji: "✦", prompt, cue });
export const COMBO_SCENES: Record<"chaos+connection" | "connection+heat" | "chaos+heat", Scene> = {
  "chaos+connection": ms("ms-combo-cc", "funny", "Meilenstein: Seltsames Ritual", "Chaos trifft Nähe: Erfindet ein Ritual für Tage, an denen alles schiefgeht. Führt es einmal komplett auf.", "Chaos + Connection · Meilenstein 2 von 3"),
  "connection+heat": ms("ms-combo-ch", "cheeky", "Meilenstein: Leises Signal", "Einigt euch auf ein unauffälliges Zeichen, das nur ihr versteht – für „lass uns gehen“ auf jeder Party.", "Connection + Heat · Meilenstein 2 von 3"),
  "chaos+heat": ms("ms-combo-xh", "game", "Meilenstein: Falsche Fährte", "Spielt zehn Sekunden lang ein Paar, das sich gerade erst kennenlernt – mit maximal schlechter Anmache.", "Chaos + Heat · Meilenstein 2 von 3"),
};
export function strongestPair(e: E): keyof typeof COMBO_SCENES {
  const order = (["chaos", "connection", "heat"] as const).slice().sort((a, b) => e[b] - e[a]);
  const pair = [order[0], order[1]].sort().join("+");
  return (pair === "chaos+connection" ? "chaos+connection" : pair === "connection+heat" ? "connection+heat" : "chaos+heat");
}
export const MILESTONES: { id: string; label: string; when: (e: E) => boolean; scene: (e: E) => Scene }[] = [
  {
    id: "balance",
    label: "Erste Balance",
    when: (e) => e.chaos >= 20 && e.connection >= 20 && e.heat >= 15,
    scene: () => ms("ms-balance", "deep", "Meilenstein: Erster Pakt", "Erfindet zusammen einen Handschlag mit genau drei Schritten. Er gilt ab jetzt als Unterschrift.", "Erste Balance · Meilenstein 1 von 3"),
  },
  {
    id: "combo",
    label: "Kombination",
    when: (e) => [e.chaos, e.connection, e.heat].filter((v) => v >= 40).length >= 2,
    scene: (e) => COMBO_SCENES[strongestPair(e)],
  },
  {
    id: "near",
    label: "Kurz vor dem Vault",
    when: (e) => e.chaos >= 55 && e.connection >= 55 && e.heat >= 55,
    scene: () => ms("ms-near", "deep", "Meilenstein: Der Schlüssel", "Der Vault ist fast offen. Sagt beide gleichzeitig ein Wort, das diese Nacht beschreibt. Zählt bis drei.", "Fast da · Meilenstein 3 von 3"),
  },
];