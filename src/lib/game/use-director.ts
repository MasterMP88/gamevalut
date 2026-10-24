import { useEffect, useRef, useState } from "react";
import { getDirectorScenes } from "@/lib/director.functions";
import { toScene } from "./ai-schema";
import { buildDirectorContext, targetPhase, type Action } from "./engine";
import type { Scene, SessionState } from "./types";

export type DirectorStatus = "idle" | "writing" | "live" | "offline";

/** Keeps a small batch of AI scenes queued ahead. Never blocks: the local library always plays on. */
export function useDirector(state: SessionState | undefined, enabled: boolean, dispatch: (a: Action) => void) {
  const [status, setStatus] = useState<DirectorStatus>("idle");
  const inflight = useRef(false);
  const failures = useRef(0);
  const retryAt = useRef(0);

  const sceneNumber = state?.sceneNumber ?? 0;
  const queueLen = state?.aiQueue.length ?? 0;

  useEffect(() => {
    if (!enabled || !state || state.finished || inflight.current) return;
    if (queueLen >= 2) return;
    if (failures.current > 0 && sceneNumber < retryAt.current) return;
    inflight.current = true;
    setStatus("writing");
    const ctx = buildDirectorContext(state);
    getDirectorScenes({ data: ctx })
      .then((res) => {
        if (!res.ok) throw new Error(res.reason);
        const raws = JSON.parse(res.scenesJson) as unknown[];
        const scenes = raws
          .map((raw) => toScene(raw, state.players, targetPhase(state), state.settings.sensual))
          .filter((s): s is Scene => !!s);
        if (!scenes.length) throw new Error("invalid");
        failures.current = 0;
        dispatch({ type: "AI_SCENES", scenes });
        setStatus("live");
      })
      .catch(() => {
        failures.current += 1;
        // bounded backoff measured in scenes, not time — never hammer the gateway
        retryAt.current = sceneNumber + Math.min(6 * failures.current, 24);
        setStatus("offline");
      })
      .finally(() => {
        inflight.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sceneNumber, queueLen, state?.finished]);

  return status;
}