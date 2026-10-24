import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSession, DEFAULT_SETTINGS, reducer, type Action } from "./engine";
import { toRow } from "./persist";
import type { ConsentSettings, GameId, SessionState } from "./types";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sessions live in React memory. Signed-in users additionally get a debounced
 * auto-save of the *structural* state (see persist.ts) — memory anchors and other
 * free-text never leave this tab unless saved explicitly as a Saved Moment.
 */
export type SaveStatus = "guest" | "idle" | "saving" | "saved" | "error";

interface Ctx {
  players: [string, string];
  setPlayers: (p: [string, string]) => void;
  settings: ConsentSettings;
  setSettings: (s: ConsentSettings) => void;
  sessions: Partial<Record<GameId, SessionState>>;
  start: (id: GameId) => void;
  dispatch: (id: GameId, a: Action) => void;
  end: (id: GameId) => void;
  hydrate: (id: GameId, state: SessionState, dbId: string, revision: number) => void;
  saveStatus: Partial<Record<GameId, SaveStatus>>;
  dbIds: Partial<Record<GameId, string>>;
}

const SessionCtx = createContext<Ctx | null>(null);
const SAVE_DELAY = 600;

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<[string, string]>(["", ""]);
  const [settings, setSettings] = useState<ConsentSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<Partial<Record<GameId, SessionState>>>({});
  const [saveStatus, setSaveStatus] = useState<Partial<Record<GameId, SaveStatus>>>({});
  const [dbIds, setDbIds] = useState<Partial<Record<GameId, string>>>({});

  const dbId = useRef<Partial<Record<GameId, string>>>({});
  const rev = useRef<Partial<Record<GameId, number>>>({});
  const saved = useRef<Partial<Record<GameId, SessionState>>>({});
  const timers = useRef<Partial<Record<GameId, ReturnType<typeof setTimeout>>>>({});
  const chain = useRef<Partial<Record<GameId, Promise<void>>>>({});
  const latest = useRef(sessions);
  latest.current = sessions;

  const setId = (id: GameId, v: string | undefined) => {
    if (v) dbId.current[id] = v; else delete dbId.current[id];
    setDbIds({ ...dbId.current });
  };

  const persist = useCallback(async (id: GameId, uid: string) => {
    const s = latest.current[id];
    if (!s || saved.current[id] === s) return;
    setSaveStatus((x) => ({ ...x, [id]: "saving" }));
    try {
      let rowId = dbId.current[id];
      if (!rowId) {
        // Adopt an open session for this game (another device, or a guest run being migrated).
        const { data: open } = await supabase.from("game_sessions").select("id, revision").eq("user_id", uid).eq("game_id", id).eq("status", "active").maybeSingle();
        if (open) { rowId = open.id; rev.current[id] = Math.max(rev.current[id] ?? 0, open.revision); }
      }
      const r = (rev.current[id] ?? 0) + 1;
      rev.current[id] = r;
      const row = toRow(s, uid, r);
      if (rowId) {
        const { error } = await supabase.from("game_sessions").update(row as never).eq("id", rowId);
        if (error) throw error;
        setId(id, rowId);
      } else {
        const { data, error } = await supabase.from("game_sessions").insert(row as never).select("id").single();
        if (error) throw error;
        setId(id, data.id);
      }
      saved.current[id] = s;
      if (s.finished) setId(id, undefined);
      setSaveStatus((x) => ({ ...x, [id]: "saved" }));
    } catch {
      setSaveStatus((x) => ({ ...x, [id]: "error" }));
    }
  }, []);

  // Debounced auto-save, serialized per game so rapid taps never race.
  useEffect(() => {
    if (!user) return;
    (Object.keys(sessions) as GameId[]).forEach((id) => {
      if (saved.current[id] === sessions[id]) return;
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => {
        chain.current[id] = (chain.current[id] ?? Promise.resolve()).then(() => persist(id, user.id));
      }, SAVE_DELAY);
    });
  }, [sessions, user, persist]);

  // Preferences: load once on sign-in, then keep in sync.
  const prefsLoaded = useRef<string | null>(null);
  useEffect(() => {
    if (!user || prefsLoaded.current === user.id) return;
    prefsLoaded.current = user.id;
    void supabase.from("preferences").select("settings, player_names").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      const names = data.player_names as unknown as [string, string];
      if (Array.isArray(names)) setPlayers((p) => (p[0] || p[1] ? p : [names[0] ?? "", names[1] ?? ""]));
      if (data.settings && typeof data.settings === "object" && Object.keys(data.settings).length) setSettings({ ...DEFAULT_SETTINGS, ...(data.settings as object) });
    });
  }, [user]);
  useEffect(() => {
    if (!user || prefsLoaded.current !== user.id) return;
    const t = setTimeout(() => {
      void supabase.from("preferences").upsert({ user_id: user.id, settings: settings as never, player_names: players as never, updated_at: new Date().toISOString() });
    }, 1200);
    return () => clearTimeout(t);
  }, [user, players, settings]);

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
    const row = dbId.current[id];
    clearTimeout(timers.current[id]);
    if (row && user) {
      const r = (rev.current[id] ?? 0) + 1;
      rev.current[id] = r;
      void supabase.from("game_sessions").update({ status: "abandoned", revision: r }).eq("id", row).eq("status", "active");
    }
    setId(id, undefined);
    delete saved.current[id];
    delete rev.current[id];
    setSessions((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  }, [user]);
  const hydrate = useCallback((id: GameId, state: SessionState, rowId: string, revision: number) => {
    setId(id, rowId);
    rev.current[id] = revision;
    saved.current[id] = state;
    setSaveStatus((x) => ({ ...x, [id]: "saved" }));
    setSessions((s) => ({ ...s, [id]: state }));
  }, []);

  const value = useMemo(
    () => ({ players, setPlayers, settings, setSettings, sessions, start, dispatch, end, hydrate, saveStatus: user ? saveStatus : {}, dbIds }),
    [players, settings, sessions, start, dispatch, end, hydrate, saveStatus, user, dbIds],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSessions() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("SessionProvider missing");
  return c;
}