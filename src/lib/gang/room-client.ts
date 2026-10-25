/* GANG MODE multi-device client: thin typed wrapper over the deployed gang_* RPCs.
   Security: the playerToken is a bearer capability. It lives only in sessionStorage and in memory —
   never in URLs, DOM text, logs or publicState. Room codes may appear in URLs/QR. */
import { supabase } from "@/integrations/supabase/client";

export interface RoomPlayer {
  id: string;
  name: string;
  active: boolean;
  canInput: boolean;
  canDisplay: boolean;
  isFacilitator: boolean;
  deviceKind: string;
  joinedAt?: string;
}

export interface RoomSnapshot {
  roomId: string;
  code: string;
  phase: "lobby" | "playing" | "paused" | "finished";
  entryMode: string;
  gameId: string | null;
  roundKey: string | null;
  stage: string | null;
  publicState: Record<string, unknown> | null;
  version: number;
  maxPlayers: number;
  deadlineAt?: string | null;
  serverNow?: string;
  playerId: string;
  isFacilitator: boolean;
  players: RoomPlayer[];
}

export interface StageProgress {
  roundKey: string | null;
  stage: string | null;
  required: number;
  submitted: number;
  complete: boolean;
  youSubmitted: boolean;
}

export interface CollectedAction {
  playerId: string;
  actionType: string;
  payload: Record<string, unknown>;
  at?: string;
}

export type SessionRole = "player" | "display";
export interface StoredSession {
  code: string;
  token: string;
  role: SessionRole;
}

export class RoomError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export type Rpc = (
  fn: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const KEY: Record<SessionRole, string> = {
  player: "nocturne.gang.player",
  display: "nocturne.gang.display",
};

/** Session-scoped token store. Display and player sessions are kept apart so a TV tab never acts as a seat. */
export const sessionStore = {
  get(role: SessionRole): StoredSession | null {
    try {
      const raw =
        typeof sessionStorage === "undefined"
          ? null
          : sessionStorage.getItem(KEY[role]);
      if (!raw) return null;
      const s = JSON.parse(raw) as StoredSession;
      return s && typeof s.token === "string" && typeof s.code === "string"
        ? { ...s, role }
        : null;
    } catch {
      return null;
    }
  },
  set(s: StoredSession) {
    try {
      sessionStorage.setItem(KEY[s.role], JSON.stringify(s));
    } catch {
      /* private mode: memory only */
    }
  },
  clear(role: SessionRole) {
    try {
      sessionStorage.removeItem(KEY[role]);
    } catch {
      /* ignore */
    }
  },
};

/** Room codes are 6 hex chars server-side. */
export const normalizeCode = (s: string) =>
  s
    .toUpperCase()
    .replace(/[^A-F0-9]/g, "")
    .slice(0, 6);
export const joinUrl = (origin: string, code: string) =>
  `${origin}/gang?join=${encodeURIComponent(normalizeCode(code))}`;
export const screenUrl = (origin: string, code: string) =>
  `${origin}/gang?screen=${encodeURIComponent(normalizeCode(code))}`;

const errorCode = (message: string) =>
  message.match(/[a-z][a-z_]+[a-z]/)?.[0] ?? "unknown_error";

export interface RoomStateWrite {
  phase: RoomSnapshot["phase"];
  gameId: string | null;
  roundKey: string | null;
  stage: string | null;
  publicState: Record<string, unknown>;
}

export function createRoomClient(rpc: Rpc) {
  const call = async <T>(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<T> => {
    const { data, error } = await rpc(fn, args);
    if (error) throw new RoomError(errorCode(error.message));
    return data as T;
  };
  const enter = async (
    fn: string,
    args: Record<string, unknown>,
    role: SessionRole,
  ) => {
    const r = await call<{ playerToken: string; snapshot: RoomSnapshot }>(
      fn,
      args,
    );
    const session: StoredSession = {
      code: r.snapshot.code,
      token: r.playerToken,
      role,
    };
    sessionStore.set(session);
    return { session, snapshot: r.snapshot };
  };

  const client = {
    create: (
      displayName: string,
      entryMode: "director" | "catalog" | "mix",
      maxPlayers: number,
    ) =>
      enter(
        "gang_create_room",
        {
          p_display_name: displayName.trim(),
          p_entry_mode: entryMode,
          p_max_players: Math.max(2, Math.min(99, maxPlayers)),
          p_device_kind: "phone",
        },
        "player",
      ),
    join: (code: string, displayName: string) =>
      enter(
        "gang_join_room",
        {
          p_code: normalizeCode(code),
          p_display_name: displayName.trim(),
          p_device_kind: "phone",
        },
        "player",
      ),
    joinDisplay: (code: string) =>
      enter(
        "gang_join_display",
        { p_code: normalizeCode(code), p_device_kind: "desktop" },
        "display",
      ),
    snapshot: (token: string) =>
      call<RoomSnapshot>("gang_room_snapshot", { p_player_token: token }),
    publish: async (
      token: string,
      snap: RoomSnapshot,
      build: (snapshot: RoomSnapshot) => {
        write: RoomStateWrite;
        runtime: Record<string, unknown>;
        payloads: Array<{ playerId: string; payload: Record<string, unknown> }>;
      },
    ): Promise<RoomSnapshot> => {
      const send = (s: RoomSnapshot) => {
        const b = build(s),
          w = b.write;
        return call<RoomSnapshot>("gang_publish_state", {
          p_player_token: token,
          p_expected_version: s.version,
          p_phase: w.phase,
          p_game_id: w.gameId,
          p_round_key: w.roundKey,
          p_stage: w.stage,
          p_public_state: w.publicState,
          p_runtime_state: b.runtime,
          p_private_payloads: b.payloads,
        });
      };
      try {
        return await send(snap);
      } catch (e) {
        if (!(e instanceof RoomError) || e.code !== "version_conflict") throw e;
        const fresh = await client.snapshot(token);
        if (!fresh.isFacilitator) throw new RoomError("facilitator_required");
        return send(fresh);
      }
    },
    leave: async (token: string, role: SessionRole = "player") => {
      sessionStore.clear(role);
      return call<RoomSnapshot>("gang_leave_room", { p_player_token: token });
    },
    /** Optimistic write. On version_conflict: refetch once, rebuild from the fresh snapshot, retry once. Never forces. */
    setState: async (
      token: string,
      snap: RoomSnapshot,
      build: (s: RoomSnapshot) => RoomStateWrite | null,
    ): Promise<RoomSnapshot> => {
      const write = (s: RoomSnapshot, w: RoomStateWrite) =>
        call<RoomSnapshot>("gang_set_room_state", {
          p_player_token: token,
          p_expected_version: s.version,
          p_phase: w.phase,
          p_game_id: w.gameId,
          p_round_key: w.roundKey,
          p_stage: w.stage,
          p_public_state: w.publicState,
        });
      const first = build(snap);
      if (!first) return snap;
      try {
        return await write(snap, first);
      } catch (e) {
        if (!(e instanceof RoomError) || e.code !== "version_conflict") throw e;
        const fresh = await client.snapshot(token);
        if (!fresh.isFacilitator) throw new RoomError("facilitator_required");
        const again = build(fresh);
        if (!again) return fresh;
        return write(fresh, again);
      }
    },
    submit: (
      token: string,
      roundKey: string,
      stage: string,
      actionType: string,
      payload: Record<string, unknown>,
    ) =>
      call<{ accepted: boolean }>("gang_submit_action", {
        p_player_token: token,
        p_round_key: roundKey,
        p_stage: stage,
        p_action_type: actionType,
        p_payload: payload,
      }),
    collect: (token: string, roundKey: string, stage: string) =>
      call<CollectedAction[]>("gang_collect_stage_actions", {
        p_player_token: token,
        p_round_key: roundKey,
        p_stage: stage,
      }),
    poll: (token: string) =>
      call<{ snapshot: RoomSnapshot; progress: StageProgress | null }>(
        "gang_poll",
        { p_player_token: token },
      ),
    attempt: (token: string, roundKey: string, stage: string, value: string) =>
      call<{ accepted: boolean; remaining: number }>("gang_round_attempt", {
        p_player_token: token,
        p_round_key: roundKey,
        p_stage: stage,
        p_value: value,
      }),
    attempts: (token: string, roundKey: string, stage: string) =>
      call<{ actions: CollectedAction[]; expired: boolean }>(
        "gang_round_attempts",
        { p_player_token: token, p_round_key: roundKey, p_stage: stage },
      ),
    progress: (token: string) =>
      call<StageProgress>("gang_stage_progress", { p_player_token: token }),
    getPrivate: (token: string, roundKey: string) =>
      call<Record<string, unknown> | null>("gang_get_private", {
        p_player_token: token,
        p_round_key: roundKey,
      }),
    setPrivate: (
      token: string,
      roundKey: string,
      payloads: Array<{ playerId: string; payload: Record<string, unknown> }>,
    ) =>
      call<{ stored: number }>("gang_set_private_payloads", {
        p_player_token: token,
        p_round_key: roundKey,
        p_payloads: payloads,
      }),
    reveal: (token: string, roundKey: string, sourceStage: string) =>
      call<{ actions: CollectedAction[]; privatePayloads: unknown[] }>(
        "gang_reveal_round_data",
        {
          p_player_token: token,
          p_round_key: roundKey,
          p_source_stage: sourceStage,
        },
      ),
    saveRuntime: (token: string, runtime: Record<string, unknown>) =>
      call<{ saved: boolean }>("gang_save_runtime", {
        p_player_token: token,
        p_runtime_state: runtime,
      }),
    missionEvent: (
      token: string,
      nightKey: string,
      kind: "claim" | "accuse",
      payload: Record<string, unknown> = {},
    ) =>
      call<{ accepted: boolean }>("gang_mission_event", {
        p_player_token: token,
        p_night_key: nightKey,
        p_kind: kind,
        p_payload: payload,
      }),
    missionEvents: (token: string, nightKey: string) =>
      call<
        Array<{
          id: string;
          playerId: string;
          kind: "claim" | "accuse";
          at: string;
          payload: { targetId?: string; missionId?: string };
        }>
      >("gang_mission_events", {
        p_player_token: token,
        p_night_key: nightKey,
      }),
    putPhoto: (token: string, roundKey: string, jpeg: string) =>
      call<{ photoId: string }>("gang_put_photo", {
        p_player_token: token,
        p_round_key: roundKey,
        p_jpeg: jpeg,
      }),
    getPhotos: (token: string, ids: string[]) =>
      call<Array<{ photoId: string; url: string }>>("gang_get_photos", {
        p_player_token: token,
        p_photo_ids: ids,
      }),
    loadRuntime: (token: string) =>
      call<Record<string, unknown> | null>("gang_load_runtime", {
        p_player_token: token,
      }),
  };
  return client;
}

export type RoomClient = ReturnType<typeof createRoomClient>;

let shared: RoomClient | null = null;
export function defaultRoomClient(): RoomClient {
  if (!shared)
    shared = createRoomClient(
      (fn, args) => supabase.rpc(fn as never, args as never) as never,
    );
  return shared;
}

export const ROOM_ERROR_COPY: Record<string, string> = {
  room_not_found: "Diesen Raum gibt es nicht (mehr). Prüf den Code.",
  host_access_required:
    "Für einen neuen Raum brauchst du einen aktiven Host-Zugang. Einladungen bleiben kostenlos.",
  permission: "Bitte melde dich zum Öffnen eines Raums an.",
  answer_too_many_words: "Im Finale sind höchstens fünf Wörter erlaubt.",
  answer_too_long: "Bitte kürze deine Antwort auf 160 Zeichen.",
  player_not_required:
    "Diese Phase ist bereits weiter. Der Spielstand wird aktualisiert.",
  attempt_limit: "24 Versuche abgegeben. Gleich kommt die Auflösung.",
  attempt_rate_limit: "Einen Moment zwischen zwei Versuchen lassen.",
  stale_stage:
    "Die Zeit oder diese Phase ist vorbei. Der Spielstand wird aktualisiert.",
  room_full: "Der Raum ist voll.",
  display_name_invalid: "Bitte einen Namen mit 1–32 Zeichen.",
  invalid_player_token: "Deine Sitzung ist abgelaufen. Tritt neu bei.",
};
export const roomErrorText = (e: unknown) =>
  (e instanceof RoomError && ROOM_ERROR_COPY[e.code]) ||
  "Verbindung hakt. Versuch es gleich nochmal.";
