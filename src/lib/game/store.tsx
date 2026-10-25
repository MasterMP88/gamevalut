import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSession, DEFAULT_SETTINGS, reducer, type Action } from "./engine";
import { toRow } from "./persist";
import { saveRevisioned } from "./save";
import { clearPending, readPending } from "./pending";
import type { ConsentSettings, GameId, SessionState } from "./types";
import { recordSeen, seenIds } from "@/lib/content-history";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sessions live in React memory. Signed-in users additionally get a debounced
 * auto-save of the *structural* state (see persist.ts) — memory anchors and other
 * free-text never leave this tab unless saved explicitly as a Saved Moment.
 */
export type SaveStatus = "guest" | "idle" | "saving" | "saved" | "migrated" | "conflict" | "error";

interface Ctx {
  players: [string, string];
  setPlayers: (p: [string, string]) => void;
  settings: ConsentSettings;
  setSettings: (s: ConsentSettings) => void;
  sessions: Partial<Record<GameId, SessionState>>;
  start: (id: GameId, durationMinutes?: 15 | 30 | 60 | null) => void;
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

  const conflict = useRef<Partial<Record<GameId, boolean>>>({});
  const pendingGame = useRef<GameId | null>(null);

  const persist = useCallback(async (id: GameId, uid: string, attempt = 0): Promise<void> => {
    const s = latest.current[id];
    if (!s || saved.current[id] === s || conflict.current[id]) return;
    setSaveStatus((x) => ({ ...x, [id]: "saving" }));
    try {
      let rowId = dbId.current[id];
      if (!rowId) {
        // Adopt an open session for this game (another device, or a guest run being migrated).
        const { data: open } = await supabase.from("game_sessions").select("id, revision").eq("user_id", uid).eq("game_id", id).eq("status", "active").maybeSingle();
        if (open) { rowId = open.id; rev.current[id] = open.revision; }
      }
      const row = toRow(s, uid, 0);
      const res = await saveRevisioned(
        {
          update: async (rid, prev, r) => {
            const { data, error } = await supabase.from("game_sessions").update(r as never).eq("id", rid).eq("revision", prev).select("id, revision");
            if (error) throw error;
            const hit = data?.[0];
            // The guard trigger silently drops stale writes: verify the stored revision really advanced.
            return hit && hit.revision === r.revision ? hit : null;
          },
          insert: async (r) => {
            const { data, error } = await supabase.from("game_sessions").insert(r as never).select("id, revision").single();
            if (error) throw error;
            return data;
          },
        },
        rowId,
        rev.current[id],
        row,
      );
      if (!res.ok) {
        conflict.current[id] = true;
        setSaveStatus((x) => ({ ...x, [id]: "conflict" }));
        return;
      }
      rev.current[id] = res.revision;
      setId(id, res.id);
      saved.current[id] = s;
      if (s.finished) setId(id, undefined);
      if (pendingGame.current === id) {
        pendingGame.current = null;
        clearPending(window.localStorage);
        setSaveStatus((x) => ({ ...x, [id]: "migrated" }));
      } else {
        setSaveStatus((x) => ({ ...x, [id]: "saved" }));
      }
    } catch (e) {
      // Another tab/device opened the active row first (unique active-per-game): adopt it once.
      if (attempt === 0 && (e as { code?: string })?.code === "23505") return persist(id, uid, 1);
      setSaveStatus((x) => ({ ...x, [id]: "error" }));
    }
  }, []);

  // Guest → account handoff (e.g. confirmation link opened in a new tab): adopt the sanitized snapshot.
  useEffect(() => {
    if (!user) return;
    const p = readPending(window.localStorage);
    if (!p) return;
    pendingGame.current = p.gameId;
    if (!latest.current[p.gameId]) {
      setSessions((x) => ({ ...x, [p.gameId]: p.state }));
      setPlayers((cur) => (cur[0] || cur[1] ? cur : p.players));
      setSettings(p.settings);
    } else {
      // Same tab: the live session is already in memory; force one save so the key can be cleared.
      delete saved.current[p.gameId];
      setSessions((x) => ({ ...x }));
    }
  }, [user]);

  const lastRecorded = useRef(new Set<string>());
  useEffect(() => {
    const ids = Object.values(sessions).flatMap((s) => s?.current?.source === "local" || (s?.current && !s.current.source) ? [s.current.id] : []);
    const changed = ids.filter((id) => !lastRecorded.current.has(id));
    lastRecorded.current = new Set(ids);
    if (changed.length) recordSeen(changed);
  }, [sessions]);

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
      void supabase.from("preferences").upsert({ user_id: user.id, settings: settings as never, player_names: players as never, updated_at: new Date().toISOString() }).then(() => undefined);
    }, 1200);
    return () => clearTimeout(t);
  }, [user, players, settings]);

  const start = useCallback(
    (id: GameId, durationMinutes: 15 | 30 | 60 | null = 30) => {
      const p: [string, string] = [players[0].trim() || "Ari", players[1].trim() || "Nova"];
      setSessions((s) => ({ ...s, [id]: createSession(id, p, settings, Math.floor(Math.random() * 1e9), { seenIds: seenIds(), durationMinutes }) }));
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
    if (row && user && !conflict.current[id]) {
      const prev = rev.current[id] ?? 0;
      // Builders are lazy: .then() actually sends the request.
      void supabase.from("game_sessions").update({ status: "abandoned", revision: prev + 1 }).eq("id", row).eq("revision", prev).eq("status", "active").then(() => undefined);
    }
    delete conflict.current[id];
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
    delete conflict.current[id];
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
