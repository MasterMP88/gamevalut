import {
  gangRoundPrompts,
  getGangPlaybook,
  type GangGameId,
} from "./playbooks.js";
import { couchPool, couchRange } from "./couch.js";
import { couchGame } from "./experience.js";

/** A round shared by 99 people consumes ONE card, missions consume one per person.
 * These numbers describe decks, not elapsed hours or a promise of infinite content.
 */
export function gangContentCapacity(
  id: GangGameId,
  mode: "private" | "couch" = "private",
) {
  const p = getGangPlaybook(id)!;
  if (p.runtime === "time-drop" || (mode === "couch" && !couchGame(id)))
    return null;
  const suppliedAudio = mode === "couch" && id === "music-drop";
  const maxPlayers = mode === "couch" ? couchRange(id)[1] : p.maxPlayers;
  const perNight =
    mode === "couch"
      ? 13 // 12 + one optional encore
      : id === "secret-missions" || id === "hot-seat"
        ? maxPlayers
        : id === "after-dark" || id === "one-of-you"
          ? p.rounds[1] - 1
          : p.rounds[1];
  const cards = suppliedAudio
    ? 0
    : (mode === "couch" ? couchPool(id) : gangRoundPrompts(id)).length;
  const nights = Math.floor(cards / perNight);
  return {
    id,
    mode,
    maxPlayers,
    cards,
    perNight,
    completeNights: suppliedAudio
      ? null
      : id === "one-of-you"
        ? Math.min(8, nights)
        : nights,
    source: suppliedAudio ? ("own-audio" as const) : ("editorial" as const),
    closingRitual: id === "after-dark",
    separateFinales: id === "one-of-you" ? 8 : 0,
    threeNightReserve: Math.ceil(perNight * 3 * 1.25),
  };
}
