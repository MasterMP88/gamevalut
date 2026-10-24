import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { createSession, DEFAULT_SETTINGS, reducer, type Action } from "./engine";
import type { ConsentSettings, GameId, SessionState } from "./types";

/**
 * In-memory only. Nothing here touches localStorage, cookies or a database:
 * a reload or closing the tab erases every session and every memory anchor.
 */
interface Ctx {
  players: [string, string];
  setPlayers: (p: [string, string]) => void;
  settings: ConsentSettings;
  setSettings: (s: ConsentSettings) => void;
  sessions: Partial<Record<GameId, SessionState>>;
  start: (id: GameId) => void;
  dispatch: (id: GameId, a: Action) => void;
  end: (id: GameId) => void;
}

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<[string, string]>(["", ""]);
  const [settings, setSettings] = useState<ConsentSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<Partial<Record<GameId, SessionState>>>({});

  const start = useCallback(
    (id: GameId) => {
      const p: [string, string] = [players[0].trim() || "Ari", players[1].trim() || "Nova"];
      setSessions((s) => ({ ...s, [id]: createSession(id, p, settings, Math.floor(Math.random() * 1e6)) }));
    },
    [players, settings],
  );
  const dispatch = useCallback((id: GameId, a: Action) => {
    setSessions((s) => {
      const cur = s[id];
      if (!cur) return s;
      return { ...s, [id]: reducer(cur, a) };
    });
    if (a.type === "SETTINGS") setSettings(a.settings);
  }, []);
  const end = useCallback((id: GameId) => {
    setSessions((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  }, []);

  const value = useMemo(
    () => ({ players, setPlayers, settings, setSettings, sessions, start, dispatch, end }),
    [players, settings, sessions, start, dispatch, end],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSessions() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("SessionProvider missing");
  return c;
}