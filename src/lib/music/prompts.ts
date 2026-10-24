import type { MusicRoundType } from "@/lib/game/types";

export interface MusicPrompt {
  id: string;
  type: MusicRoundType;
  text: string;
}

export const MUSIC_PROMPTS: readonly MusicPrompt[] = [
  // SOLO — one private pick, then reveal
  { id: "solo-01", type: "SOLO", text: "Der Song, der gefährlich nah an deinem ersten Eindruck von {you} liegt." },
  { id: "solo-02", type: "SOLO", text: "Der Track, der nach eurem ersten Kuss hätte laufen sollen." },
  { id: "solo-03", type: "SOLO", text: "Ein Song, den du liebst und {you} dir niemals zugetraut hätte." },
  { id: "solo-04", type: "SOLO", text: "Der Song für einen sehr schlechten gemeinsamen Plan, den ihr trotzdem machen würdet." },
  { id: "solo-05", type: "SOLO", text: "Welcher Track beschreibt {you} nach Mitternacht?" },
  { id: "solo-06", type: "SOLO", text: "Ein Guilty Pleasure, für das du dich heute nicht verteidigst." },
  { id: "solo-07", type: "SOLO", text: "Der Song, der laufen müsste, wenn ihr gerade dramatisch aus einem Hotel verschwindet." },
  { id: "solo-08", type: "SOLO", text: "Der Track, der sich nach eurem besten völlig normalen Sonntag anfühlt." },
  { id: "solo-09", type: "SOLO", text: "Ein Song, bei dem du sofort weißt: den muss {you} lauter machen." },
  { id: "solo-10", type: "SOLO", text: "Der Track für den Moment, in dem ihr beide wisst, dass ihr heute zu spät ins Bett kommt." },
  { id: "solo-11", type: "SOLO", text: "Welcher Song ist heimlich mehr eure Beziehung als jeder offizielle Lovesong?" },
  { id: "solo-12", type: "SOLO", text: "Der Song, den du {you} auf einer leeren Tanzfläche vorspielen würdest." },

  // DUET — both answer the same prompt separately
  { id: "duet-01", type: "DUET", text: "Euer Roadtrip beginnt jetzt. Nur ein Track darf als Erstes laufen." },
  { id: "duet-02", type: "DUET", text: "Ihr bekommt eine komplett leere Bar für eine Nacht. Welcher Song eröffnet?" },
  { id: "duet-03", type: "DUET", text: "Welcher Track gehört in den Abspann eines Films über euch?" },
  { id: "duet-04", type: "DUET", text: "Der erste Song am Morgen nach einer ziemlich guten Nacht." },
  { id: "duet-05", type: "DUET", text: "Ihr müsst gemeinsam auf eine Hochzeit einlaufen. Welcher Track wäre maximal ihr?" },
  { id: "duet-06", type: "DUET", text: "Ein Song für eine spontane Autofahrt ohne Ziel und ohne vernünftige Uhrzeit." },
  { id: "duet-07", type: "DUET", text: "Welcher Track macht aus eurer Küche für vier Minuten einen Club?" },
  { id: "duet-08", type: "DUET", text: "Ein Song, der auf keiner romantischen Playlist stehen müsste – aber auf eurer schon." },
  { id: "duet-09", type: "DUET", text: "Ihr dürft einen einzigen Song aus eurer gemeinsamen Geschichte behalten. Welchen?" },
  { id: "duet-10", type: "DUET", text: "Der Track für einen Abend, an dem der ursprüngliche Plan definitiv nicht mehr gilt." },
  { id: "duet-11", type: "DUET", text: "Welcher Song würde euch beide in weniger als zehn Sekunden auf die Tanzfläche bekommen?" },
  { id: "duet-12", type: "DUET", text: "Ein Track für das perfekte 'Wir bleiben nur kurz'-Desaster." },

  // GUESS — private pick plus partner predicts the vibe
  { id: "guess-01", type: "GUESS", text: "Wähle einen Song, der eine Seite von dir verrät, die {you} vielleicht unterschätzt." },
  { id: "guess-02", type: "GUESS", text: "Ein Track aus deiner Vergangenheit, den du heute immer noch ohne Ironie hörst." },
  { id: "guess-03", type: "GUESS", text: "Wähle einen Song, der dich sofort an eine bestimmte Nacht denken lässt." },
  { id: "guess-04", type: "GUESS", text: "Ein Song, den du in einem völlig unpassenden Moment trotzdem laut hören würdest." },
  { id: "guess-05", type: "GUESS", text: "Der Track, bei dem {you} deine Musikbiografie neu bewerten könnte." },
  { id: "guess-06", type: "GUESS", text: "Wähle einen Song, der dir viel zu schnell gute Laune macht." },
  { id: "guess-07", type: "GUESS", text: "Ein Track, den du jahrelang verteidigen würdest, obwohl niemand danach gefragt hat." },
  { id: "guess-08", type: "GUESS", text: "Der Song für deine heimliche Hauptfigur-Energie." },
  { id: "guess-09", type: "GUESS", text: "Ein Song, der überraschend gut zu deinem Leben gerade passt." },
  { id: "guess-10", type: "GUESS", text: "Der Track, den du niemals aus einer alten Playlist löschen würdest." },
  { id: "guess-11", type: "GUESS", text: "Wähle einen Song, der bei dir sofort eine sehr konkrete Erinnerung öffnet." },
  { id: "guess-12", type: "GUESS", text: "Ein Track, bei dem {you} wahrscheinlich sagt: 'Okay, damit habe ich nicht gerechnet.'" },

  // SPEED — first track that comes to mind, timer has no failure state
  { id: "speed-01", type: "SPEED", text: "25 Sekunden: ein Song für einen Kuss im Regen. Nicht nachdenken." },
  { id: "speed-02", type: "SPEED", text: "25 Sekunden: der erste Track für einen Nachtflug nach irgendwo." },
  { id: "speed-03", type: "SPEED", text: "25 Sekunden: ein Song, der sofort Sommer kann." },
  { id: "speed-04", type: "SPEED", text: "25 Sekunden: welcher Track rettet eine schlechte Party?" },
  { id: "speed-05", type: "SPEED", text: "25 Sekunden: ein Song für 'Noch ein Drink und dann wirklich heim'." },
  { id: "speed-06", type: "SPEED", text: "25 Sekunden: der Track für einen völlig übertriebenen Auftritt." },
  { id: "speed-07", type: "SPEED", text: "25 Sekunden: ein Song, der nachts besser klingt als tagsüber." },
  { id: "speed-08", type: "SPEED", text: "25 Sekunden: ein Track, zu dem du sofort mitsingen würdest – egal wer zuhört." },
  { id: "speed-09", type: "SPEED", text: "25 Sekunden: ein Song für den Moment kurz bevor etwas Dummes eine gute Idee wird." },
  { id: "speed-10", type: "SPEED", text: "25 Sekunden: der erste Song für eine leere Autobahn um zwei Uhr." },
  { id: "speed-11", type: "SPEED", text: "25 Sekunden: ein Track, der dich ohne Vorwarnung in eine andere Zeit wirft." },
  { id: "speed-12", type: "SPEED", text: "25 Sekunden: ein Song, den du heute noch mit {you} hören willst." },
];

export function promptsFor(type: MusicRoundType): MusicPrompt[] {
  return MUSIC_PROMPTS.filter((p) => p.type === type);
}
