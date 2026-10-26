import { z } from "zod";
import {
  couchBeat,
  couchActiveTeam,
  couchSpokesperson,
  couchCue,
  couchInput,
  couchPrompt,
  couchSeconds,
  type CouchState,
} from "./core/couch";
import { GANG_EXPERIENCES } from "./core/experience";
import { gangGame } from "./catalog";
import {
  RoomError,
  type RoomSnapshot,
  type RoomStateWrite,
} from "./room-client";

const label = z.string().max(2000);
export const couchScreenSchema = z
  .object({
    kind: z.literal("couch-screen"),
    version: z.literal(1),
    controller: z.string().uuid(),
    startedAt: z.number().finite(),
    sentAt: z.number().finite(),
    gameId: z.string().max(64),
    title: label,
    heading: label,
    detail: label,
    options: z.array(label).max(12),
    phase: z.enum([
      "ready",
      "explain",
      "play",
      "reveal",
      "score",
      "transition",
      "finale",
    ]),
    round: z.number().int().min(1).max(100),
    rounds: z.number().int().min(1).max(100),
    paused: z.boolean(),
    seconds: z.number().finite().min(0).max(600).nullable(),
    teams: z
      .array(
        z
          .object({ name: z.string().max(32), score: z.number().finite() })
          .strict(),
      )
      .max(6),
    requiredPlayerIds: z.array(z.never()).max(0),
  })
  .strict();
export type CouchScreenView = z.infer<typeof couchScreenSchema>;

/** Explicit public projection. Never spread runtime, deck, file metadata, predictions or answers. */
export function projectCouchScreen(
  state: CouchState,
  controller: string,
  startedAt: number,
  now: number,
): CouchScreenView {
  const phase = state.phase,
    prompt = couchPrompt(state),
    kind = couchInput(state.gameId),
    music = kind === "music";
  const rule =
    music && state.musicMode === "dj"
      ? "DJ legt auf. Hand hoch, Titel oder Interpret nennen. Der DJ löst laut auf."
      : GANG_EXPERIENCES[state.gameId].rule;
  let heading = gangGame(state.gameId)?.title ?? state.gameId,
    detail = rule;
  if (phase === "play") {
    heading = music ? "Ohren auf. Wer kennt den Track?" : prompt.prompt;
    detail = couchCue(state);
    if (kind === "relay" || kind === "spotlight") {
      const team = couchActiveTeam(state);
      detail = `${kind === "spotlight" ? "Spotlight" : "Jetzt dran"}: ${team.name} · Person ${couchSpokesperson(state, team)}. ${detail}`;
    }
    if (kind === "quantity")
      detail += ` Je Team ${Math.min(6, ...state.teams.map((t) => t.members.length))} Aktive, ab Person ${state.index + 1} im Team reihum. Gezählt werden: ${prompt.teamChallenge?.metric ?? "gültige Ergebnisse"}.`;
    if (kind === "titles")
      detail += ` Nominiert: ${state.teams.map((t) => `${t.name} · Person ${couchSpokesperson(state, t)}`).join("; ")}.`;
  }
  if (phase === "explain") heading = rule;
  if (phase === "transition") {
    heading = couchCue(state);
    detail = "Auf das Zeichen der Spielleitung geht es weiter.";
  }
  if (phase === "reveal") {
    heading = state.result?.headline ?? "Auflösung";
    detail = state.result?.revealText ?? "";
  }
  if (phase === "score") {
    heading = "So steht’s.";
    detail = "Die nächste Runde wartet.";
  }
  if (phase === "finale") {
    heading = "Das war euer Abend.";
    detail = "Noch eine Runde? Eure Spielleitung entscheidet am Handy.";
  }
  return couchScreenSchema.parse({
    kind: "couch-screen",
    version: 1,
    controller,
    startedAt,
    sentAt: now,
    gameId: state.gameId,
    title: gangGame(state.gameId)?.title ?? state.gameId,
    heading: state.paused ? "Kurz durchatmen." : heading,
    detail: state.paused
      ? "Die Spielleitung setzt am Handy fort."
      : `${couchBeat(state)} · ${detail}`,
    options:
      phase === "play" && !music && !state.paused ? (prompt.options ?? []) : [],
    phase,
    round: state.index + 1,
    rounds: state.rounds,
    paused: state.paused,
    seconds:
      phase === "play" && !music
        ? state.paused
          ? state.remaining === null
            ? couchSeconds(state)
            : Math.ceil(state.remaining / 1000)
          : state.deadline === null
            ? couchSeconds(state)
            : Math.max(0, Math.ceil((state.deadline - now) / 1000))
        : null,
    teams: state.teams.map((t) => ({
      name: t.name,
      score: state.scores[t.id] ?? 0,
    })),
    requiredPlayerIds: [],
  });
}

/** Rebuild against CAS retries: another controller's newer claim always wins. */
export function couchScreenWrite(
  snap: RoomSnapshot,
  view: CouchScreenView,
): RoomStateWrite {
  if (!snap.isFacilitator || snap.phase === "finished")
    throw new RoomError("facilitator_required");
  const old = couchScreenSchema.safeParse(snap.publicState);
  if (
    old.success &&
    old.data.controller !== view.controller &&
    old.data.startedAt >= view.startedAt
  )
    throw new RoomError("controller_changed");
  if (snap.publicState && !old.success && Object.keys(snap.publicState).length)
    throw new RoomError("controller_changed");
  return {
    phase: view.paused ? "paused" : "playing",
    gameId: view.gameId,
    roundKey: `couch-${view.round}`,
    stage: view.phase,
    publicState: view,
  };
}

export const readCouchScreen = (value: unknown): CouchScreenView | null => {
  const r = couchScreenSchema.safeParse(value);
  return r.success ? r.data : null;
};
