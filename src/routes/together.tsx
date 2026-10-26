import { createFileRoute } from "@tanstack/react-router";
import { CoupleEntry } from "@/components/couple/CoupleRoom";
import { useEntitlements } from "@/lib/commerce/use-entitlements";
import { canHostGang } from "@/lib/entitlements";
import { GAMES_BY_ID } from "@/lib/game/games";
import type { GameId } from "@/lib/game/types";
import { normalizeCode } from "@/lib/gang/room-client";

export const Route = createFileRoute("/together")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { game?: GameId; join?: string } => ({
    ...(typeof s["game"] === "string" && Object.hasOwn(GAMES_BY_ID, s["game"])
      ? { game: s["game"] as GameId }
      : {}),
    ...(typeof s["join"] === "string"
      ? { join: normalizeCode(s["join"]) }
      : {}),
  }),
  head: () => ({
    meta: [
      { title: "Zwei Handys · eure Nacht | NOCTURNE" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Together,
});
function Together() {
  const s = Route.useSearch(),
    { ents } = useEntitlements();
  return (
    <CoupleEntry
      {...s}
      gameId={s.game ?? "roxy-after-dark"}
      hostAllowed={canHostGang(ents)}
    />
  );
}
