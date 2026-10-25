import { nightSignature } from "./engine";
import { GAMES_BY_ID } from "./games";
import type { SessionState } from "./types";

/** A closed allow-list: no scores, secrets, raw state, room codes or hidden anchors can enter a share. */
export function nightShare(state: SessionState, options: { names?: boolean; momentIds?: readonly string[]; songs?: boolean } = {}): { title: string; text: string; url: string } {
  const game = GAMES_BY_ID[state.gameId];
  const signature = nightSignature(state);
  const lines = [game.title, `${signature.done} gemeinsame Szenen. Ein Abend für uns.`];
  if (options.names) lines.push(`${state.players[0]} & ${state.players[1]}`);
  if (game.signature) lines.push(signature.name, signature.line);
  for (const anchor of state.anchors) {
    if (anchor.sensitivity === "normal" && options.momentIds?.includes(anchor.id)) lines.push(`„${anchor.shortText.slice(0, 160)}“`);
  }
  if (options.songs) {
    for (const track of (state.tracklist ?? []).slice(0, 10)) lines.push(`${track.title}${track.artist ? ` — ${track.artist}` : ""}`);
  }
  return { title: `${game.title} · NOCTURNE`, text: lines.join("\n"), url: `https://nocturne-games-for-two.lovable.app/game/${game.slug}` };
}
