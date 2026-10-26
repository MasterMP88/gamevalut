/* Modest room polling: ~900ms, paused while the tab is hidden, immediate refresh after local actions.
   Connection status is exposed for a subtle indicator; no spinner per poll. */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RoomError,
  type RoomClient,
  type RoomSnapshot,
  type StageProgress,
} from "./room-client";
import { readPublic } from "./online";

export type ConnStatus = "live" | "reconnecting";

export function useRoom(
  client: RoomClient,
  token: string,
  initial: RoomSnapshot | null,
  opts: { pollMs?: number | undefined; onGone?: (() => void) | undefined } = {},
) {
  const pollMs = opts.pollMs;
  const currentSnap = useRef(initial);
  const [snap, setSnap] = useState<RoomSnapshot | null>(initial);
  const [progress, setProgress] = useState<StageProgress | null>(null);
  const [status, setStatus] = useState<ConnStatus>("live");
  const inflight = useRef(false);
  const again = useRef(false);
  const goneRef = useRef(opts.onGone);
  goneRef.current = opts.onGone;
  const failures = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    if (inflight.current) {
      again.current = true;
      return;
    }
    inflight.current = true;
    try {
      const packet =
        typeof client.poll === "function" ? await client.poll(token) : null;
      const s = packet?.snapshot ?? (await client.snapshot(token));
      const pub = readPublic(s);
      const needsProgress =
        pub?.kind === "play" && !!pub.view && pub.view.input !== "none";
      const p = packet
        ? packet.progress
        : needsProgress
          ? await client.progress(token)
          : null;
      currentSnap.current = s;
      setSnap(s);
      setProgress(p);
      failures.current = 0;
      setStatus("live");
    } catch (e) {
      if (
        e instanceof RoomError &&
        (e.code === "invalid_player_token" || e.code === "room_not_found")
      )
        goneRef.current?.();
      else if (++failures.current >= 2) setStatus("reconnecting");
    } finally {
      inflight.current = false;
      if (again.current) {
        again.current = false;
        void refresh();
      }
    }
  }, [client, token]);

  useEffect(() => {
    void refresh();
    let off = false;
    let id: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const pub = readPublic(currentSnap.current);
      const fast = currentSnap.current?.isFacilitator || pub?.view?.timed;
      const base = pollMs ?? (fast ? 900 : pub?.kind === "lobby" ? 1500 : 1800);
      id = setTimeout(
        async () => {
          if (!document.hidden) await refresh();
          if (!off) schedule();
        },
        Math.min(15000, base * 2 ** Math.min(failures.current, 4)) +
          (pollMs ? 0 : Math.floor(Math.random() * 180)),
      );
    };
    schedule();
    const onVis = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onVis);
    return () => {
      off = true;
      clearTimeout(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onVis);
    };
  }, [refresh, pollMs]);

  return { snap, setSnap, progress, status, refresh };
}
