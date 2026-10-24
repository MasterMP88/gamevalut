import { useEffect, useRef, useState } from "react";
import { getDirectorScenes } from "@/lib/director.functions";
import { AI_POLICIES } from "@/lib/ai/policy";
import { toScene } from "./ai-schema";
import { buildDirectorContext, targetPhase, type Action } from "./engine";
import type { Scene, SessionState } from "./types";

export type DirectorStatus = "idle" | "writing" | "live" | "offline";

export interface DirectorPersonalization {
  vibe: "chill" | "funny" | "wild" | "flirty" | "mixed" | null;
  intensity: 1 | 2 | 3 | 4 | 5;
  insiders: string[];
  taboo: string[];
}

export function useDirector(
  state: SessionState | undefined,
  enabled: boolean,
  dispatch: (a: Action) => void,
  personalization?: DirectorPersonalization | null,
) {
  const [status, setStatus] = useState<DirectorStatus>("idle");
  const inflight = useRef(false);
  const failures = useRef(0);
  const retryAt = useRef(0);
  const calls = useRef(0);

  const sceneNumber = state?.sceneNumber ?? 0;
  const queueLen = state?.aiQueue.length ?? 0;
  const sessionKey = state
    ? "s_" + state.gameId + "_" + Math.abs(state.seed).toString(36)
    : "";

  useEffect(() => {
    calls.current = 0;
    failures.current = 0;
    retryAt.current = 0;
    inflight.current = false;
    setStatus("idle");
  }, [sessionKey]);

  useEffect(() => {
    if (!enabled || !state || state.finished || inflight.current) return;
    if (queueLen >= 2) return;
    if (calls.current >= AI_POLICIES.director.maxCallsPerSession) return;
    if (failures.current > 0 && sceneNumber < retryAt.current) return;

    inflight.current = true;
    calls.current += 1;
    setStatus("writing");

    const ctx = {
      ...buildDirectorContext(state),
      sessionKey,
      gameId: state.gameId,
      ...(personalization ? { personalization } : {}),
    };

    getDirectorScenes({ data: ctx })
      .then((res) => {
        if (!res.ok) throw new Error(res.reason);

        const raws = JSON.parse(res.scenesJson) as unknown[];
        const scenes = raws
          .map((raw) =>
            toScene(
              raw,
              state.players,
              targetPhase(state),
              state.settings.sensual,
            ),
          )
          .filter((scene): scene is Scene => !!scene);

        if (!scenes.length) throw new Error("invalid");

        failures.current = 0;
        dispatch({ type: "AI_SCENES", scenes });
        setStatus("live");
      })
      .catch(() => {
        failures.current += 1;
        retryAt.current =
          sceneNumber + Math.min(6 * failures.current, 24);
        setStatus("offline");
      })
      .finally(() => {
        inflight.current = false;
      });
  }, [
    enabled,
    sceneNumber,
    queueLen,
    state?.finished,
    sessionKey,
    state,
    dispatch,
    personalization,
  ]);

  return status;
}
