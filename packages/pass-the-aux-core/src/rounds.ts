import type { AuxRound, AuxRoundType, PlayerIndex } from "./types.js";

export const AUX_PROMPTS: Record<AuxRoundType, string[]> = {
  SOLO_PICK: [
    "Der Song, der nach eurem ersten Kuss hätte laufen sollen.",
    "Ein Song, den du liebst und {you} dir niemals zugetraut hätte.",
    "Euer Roadtrip beginnt jetzt. Nur ein Track darf als Erstes laufen.",
    "Der Song für einen sehr schlechten gemeinsamen Plan, den ihr trotzdem machen würdet.",
    "Welcher Track beschreibt {you} nach Mitternacht?",
    "Ein Guilty Pleasure, für das du dich heute nicht verteidigst.",
    "Der Track, der einen Raum sofort mehr nach dir klingen lässt.",
    "Der Song, der dich in zehn Sekunden in einen anderen Sommer zurückschickt.",
    "Ein Track, den du {you} heimlich schon längst zeigen wolltest.",
    "Wenn heute Nacht ein Abspann hätte: welcher Song läuft?",
  ],
  DUET_PICK: [
    "Welcher Song klingt am meisten nach euch beiden?",
    "Ein Track für einen spontanen Roadtrip ohne Ziel.",
    "Welcher Song müsste auf eure gemeinsame geheime Playlist?",
    "Der Track für den Moment, in dem ein guter Abend plötzlich sehr gut wird.",
    "Ein Song für Sonntagmorgen mit zu wenig Schlaf.",
    "Welcher Song würde in einer Filmszene über euch laufen, wenn alles schiefgeht?",
    "Euer Song für eine Nacht in einer fremden Stadt.",
    "Der Track, bei dem ihr beide wahrscheinlich sofort lauter drehen würdet.",
    "Ein Song für eine völlig unnötige, aber großartige Entscheidung.",
    "Welcher Track passt zu euch, obwohl er objektiv gar keinen Sinn ergibt?",
  ],
  GUESS: [
    "Wähle einen Song, der {you} überraschen würde.",
    "Wähle einen Track mit maximaler Nostalgie.",
    "Wähle einen Song, den du viel zu gut findest.",
    "Wähle einen Track, der gefährlich gut zu heute passt.",
    "Wähle einen Song, der nach deinem geheimen Main-Character-Moment klingt.",
    "Wähle einen Track, den {you} bei dir nicht vermuten würde.",
    "Wähle einen Song, der ein kleines bisschen peinlich ist.",
    "Wähle einen Track, der sofort eine Geschichte in deinem Kopf startet.",
    "Wähle einen Song, der nach 2:17 Uhr klingt.",
    "Wähle einen Track, der dich sofort in Bewegung bringt.",
  ],
  SPEED_PICK: [
    "Erster Song, der dir bei {you} einfällt. Nicht nachdenken.",
    "Ein Track für jetzt. Du hast 20 Sekunden.",
    "Song für einen spontanen Kuss im Regen. Los.",
    "Ein Track für eine Nachtfahrt ohne Ziel.",
    "Der erste Song, den du jetzt sofort lauter drehen würdest.",
    "Ein Track für Chaos mit sehr gutem Outfit.",
    "Song für den Moment direkt vor einer schlechten Idee.",
    "Ein Track für einen perfekten Morgen danach.",
    "Song für eure imaginäre Filmszene. Schnell.",
    "Ein Track, der heute Nacht noch einmal laufen muss.",
  ],
};

export const ALL_AUX_PROMPTS = Object.values(AUX_PROMPTS).flat();

export function makeAuxRound(args: {
  id: string;
  type: AuxRoundType;
  promptIndex: number;
  activePlayer: PlayerIndex;
}): AuxRound {
  const bank = AUX_PROMPTS[args.type];
  return {
    id: args.id,
    type: args.type,
    prompt: bank[args.promptIndex % bank.length]!,
    activePlayer: args.activePlayer,
    ...(args.type === "SPEED_PICK" ? { speedSeconds: 20 } : {}),
  };
}

export function buildAuxDeck(rounds = 16): AuxRound[] {
  const order: AuxRoundType[] = ["SOLO_PICK", "DUET_PICK", "GUESS", "SPEED_PICK"];
  return Array.from({ length: Math.max(1, rounds) }, (_, index) =>
    makeAuxRound({
      id: `aux-${index + 1}`,
      type: order[index % order.length]!,
      promptIndex: index,
      activePlayer: (index % 2) as PlayerIndex,
    }),
  );
}
