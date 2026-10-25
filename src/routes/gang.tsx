import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GangMode } from "@/components/gang/GangMode";
import { useEntitlements } from "@/lib/commerce/use-entitlements";
import { canHostGang } from "@/lib/entitlements";
import { GangRoom, JoinSheet } from "@/components/gang/GangRoom";
import { GangBigScreen } from "@/components/gang/GangBigScreen";
import { defaultRoomClient, normalizeCode, sessionStore, type RoomSnapshot, type StoredSession } from "@/lib/gang/room-client";

const URL = "https://nocturne-games-for-two.lovable.app/gang";
const TITLE = "GANG MODE — Partyspiele für 2–99 Leute · NOCTURNE";
const DESC = "GANG MODE von NOCTURNE: Partyspiele und Gruppenspiele online für 2–99 Leute. Alle treten per QR-Code bei, optional Big Screen. Host zahlt, Gäste spielen kostenlos mit.";

export const Route = createFileRoute("/gang")({
  validateSearch: (s: Record<string, unknown>): { join?: string; screen?: string } => ({
    ...(typeof s["join"] === "string" && s["join"] ? { join: s["join"] } : {}),
    ...(typeof s["screen"] === "string" && s["screen"] ? { screen: s["screen"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: GangPage,
});

function GangPage() {
  const { join, screen } = Route.useSearch();
  const navigate = useNavigate({ from: "/gang" });
  const client = useMemo(() => defaultRoomClient(), []);
  const home = () => navigate({ to: "/gang", search: {} });
  if (screen) return <GangBigScreen client={client} code={normalizeCode(screen)} />;
  if (join) return <JoinFlow code={normalizeCode(join)} onDone={home} />;
  return <HostedGang back={<Link to="/" className="tap flex min-h-11 items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> NOCTURNE</Link>} />;
}

/** Only the host path checks access; join/screen guests above never mount this. */
function HostedGang({ back }: { back: React.ReactNode }) {
  const { ents } = useEntitlements();
  return <GangMode back={back} hostAllowed={canHostGang(ents)} />;
}

function JoinFlow({ code, onDone }: { code: string; onDone: () => void }) {
  const client = useMemo(() => defaultRoomClient(), []);
  const [room, setRoom] = useState<{ session: StoredSession; snap: RoomSnapshot | null } | null>(null);
  const restored = useRestore(code, (s) => setRoom({ session: s, snap: null }));
  if (room) return <GangRoom client={client} session={room.session} initial={room.snap} onExit={onDone} />;
  if (!restored) return null;
  return <JoinSheet client={client} code={code} onJoined={(session, snap) => setRoom({ session, snap })} onCancel={onDone} />;
}

/** Reload: restore the session-scoped token for this room (useRoom revalidates it via snapshot). */
function useRestore(code: string, onFound: (s: StoredSession) => void) {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const s = sessionStore.get("player");
    if (s && s.code === code) onFound(s);
    setChecked(true);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps
  return checked;
}
