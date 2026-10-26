import { defaultRoomClient, sessionStore } from "./room-client";
import { readCouchScreen } from "./couch-screen";

let activeController: string | null = null;
export const activateCouchController = (id: string) => {
  activeController = id;
};

export async function disconnectCouchTV() {
  const stored = sessionStore.get("couch");
  sessionStore.clear("couch");
  if (!stored) return;
  const client = defaultRoomClient();
  const controller = activeController;
  activeController = null;
  if (!controller) return;
  try {
    const snap = await client.snapshot(stored.token);
    const closed = await client.setState(stored.token, snap, (s) =>
      s.isFacilitator &&
      readCouchScreen(s.publicState)?.controller === controller
        ? {
            phase: "finished",
            gameId: null,
            roundKey: null,
            stage: null,
            publicState: {
              v: 1,
              kind: "end",
              queue: [],
              queueIndex: 0,
              gameId: null,
              view: null,
            },
          }
        : null,
    );
    if (closed.phase === "finished") await client.leave(stored.token, "couch");
  } catch {
    /* expiry still closes the display; do not block local exit */
  }
}
