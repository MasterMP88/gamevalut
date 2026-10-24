import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSession, DEFAULT_SETTINGS, reducer, type Action } from "./engine";
import { restore, toRow } from "./persist";
import type { ConsentSettings, GameId, SessionState } from "./types";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { clearPendingGuest, readPendingGuest } from "@/lib/pending-guest";
import { guardSessionUpdate, planRevision, revisionConfirmed } from "./revision";

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
  const pendingGame = useRef<GameId | null>(null);
  latest.current = sessions;

  const setId = (id: GameId, v: string | undefined) => {
    if (v) dbId.current[id] = v; else delete dbId.current[id];
    setDbIds({ ...dbId.current });
  };

  const persist = useCallback(async (id: GameId, uid: string) => {
    const state = latest.current[id];
    if (!state || saved.current[id] === state) return;
    setSaveStatus((x) => ({ ...x, [id]: "saving" }));
    try {
      const rowId = dbId.current[id];
      let previousRevision = rev.current[id] ?? 0;

      if (!rowId) {
        // Never silently overwrite an already-active cloud session with a new local/guest run.
        const { data: open, error: openError } = await supabase
          .from("game_sessions")
          .select("id, revision")
          .eq("user_id", uid)
          .eq("game_id", id)
          .eq("status", "active")
          .maybeSingle();
        if (openError) throw openError;
        if (open) {
          setSaveStatus((x) => ({ ...x, [id]: "conflict" }));
          return;
        }
        previousRevision = 0;
      }

      const plan = planRevision(previousRevision);
      const row = toRow(state, uid, plan.next);

      if (rowId) {
        const guarded = guardSessionUpdate(
          supabase.from("game_sessions").update(row as never),
          rowId,
          plan,
        );
        const { data, error } = await guarded.select("id, revision").maybeSingle();
        if (error) throw error;
        if (!data || !revisionConfirmed(plan, data.revision)) {
          setSaveStatus((x) => ({ ...x, [id]: "conflict" }));
          return;
        }
        rev.current[id] = data.revision;
      } else {
        const { data, error } = await supabase
          .from("game_sessions")
          .insert(row as never)
          .select("id, revision")
          .single();
        if (error) {
          if ((error as { code?: string }).code === "23505") {
            setSaveStatus((x) => ({ ...x, [id]: "conflict" }));
            return;
          }
          throw error;
        }
        setId(id, data.id);
        rev.current[id] = data.revision;
      }

      saved.current[id] = state;
      if (state.finished) setId(id, undefined);

      if (pendingGame.current === id) {
        clearPendingGuest();
        pendingGame.current = null;
        setSaveStatus((x) => ({ ...x, [id]: "migrated" }));
      } else {
        setSaveStatus((x) => ({ ...x, [id]: "saved" }));
      }
    } catch {
      setSaveStatus((x) => ({ ...x, [id]: "error" }));
    }
  }, []);

  // A confirmed sign-up may return in a new tab. Recover only the sanitized structural guest state.
  useEffect(() => {
    if (!user) return;
    const pending = readPendingGuest();
    if (!pending) return;
    const restored = restore({
      game_id: pending.gameId,
      state: pending.state,
      state_version: pending.stateVersion,
      content_version: pending.contentVersion,
    });
    if (!restored.ok) {
      clearPendingGuest();
      return;
    }
    pendingGame.current = pending.gameId;
    setPlayers(restored.state.players);
    setSettings(restored.state.settings);
    setSessions((current) => current[pending.gameId] ? current : { ...current, [pending.gameId]: restored.state });
  }, [user]);

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
      const plan = planRevision(rev.current[id] ?? 0);
      const guarded = guardSessionUpdate(
        supabase.from("game_sessions").update({ status: "abandoned", revision: plan.next }),
        row,
        plan,
      );
      void guarded
        .eq("status", "active")
        .select("id, revision")
        .maybeSingle()
        .then(({ data }) => {
          if (data) rev.current[id] = data.revision;
        });
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