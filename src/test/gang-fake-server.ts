/* In-memory stand-in for the deployed gang_* RPCs (mirrors their SQL semantics closely enough for UI tests). */
import type { Rpc } from "@/lib/gang/room-client";

interface P {
  id: string;
  roomId: string;
  token: string;
  name: string;
  active: boolean;
  canInput: boolean;
  canDisplay: boolean;
  deviceKind: string;
  joinedAt: number;
}
interface R {
  id: string;
  code: string;
  phase: string;
  entryMode: string;
  gameId: string | null;
  roundKey: string | null;
  stage: string | null;
  publicState: Record<string, unknown>;
  version: number;
  maxPlayers: number;
  facilitator: string | null;
  runtime: unknown;
}

let seq = 0;
const uid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

export function fakeServer() {
  const rooms = new Map<string, R>();
  const players = new Map<string, P>();
  const actions = new Map<
    string,
    {
      roomId: string;
      roundKey: string;
      stage: string;
      playerId: string;
      actionType: string;
      payload: Record<string, unknown>;
    }
  >();
  const controls = new Map<string, string[]>();
  const privates = new Map<string, Record<string, unknown>>();
  const attempts: Array<{
    roomId: string;
    roundKey: string;
    stage: string;
    playerId: string;
    actionType: string;
    payload: Record<string, unknown>;
    at: string;
  }> = [];
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];

  const byToken = (t: unknown) => {
    const p = [...players.values()].find((x) => x.token === t);
    if (!p) throw new Error("invalid_player_token");
    return p;
  };
  const roomOf = (p: P) => rooms.get(p.roomId)!;
  const inRoom = (r: R) =>
    [...players.values()]
      .filter((p) => p.roomId === r.id)
      .sort((a, b) => a.joinedAt - b.joinedAt);
  const snapshot = (p: P) => {
    const r = roomOf(p);
    return {
      roomId: r.id,
      code: r.code,
      phase: r.phase,
      entryMode: r.entryMode,
      gameId: r.gameId,
      roundKey: r.roundKey,
      stage: r.stage,
      publicState: structuredClone(r.publicState),
      version: r.version,
      maxPlayers: r.maxPlayers,
      playerId: p.id,
      isFacilitator: r.facilitator === p.id,
      players: inRoom(r).map((x) => ({
        id: x.id,
        name: x.name,
        active: x.active,
        canInput: x.canInput,
        canDisplay: x.canDisplay,
        deviceKind: x.deviceKind,
        isFacilitator: x.id === r.facilitator,
      })),
    };
  };
  const reassign = (r: R) => {
    const f = r.facilitator ? players.get(r.facilitator) : null;
    if (!f || !f.active) {
      r.facilitator = inRoom(r).find((x) => x.active)?.id ?? null;
      r.version++;
    }
  };
  const addPlayer = (r: R, name: string, canInput: boolean, kind: string) => {
    const p: P = {
      id: uid(),
      roomId: r.id,
      token: `tok_${Math.random().toString(36).slice(2)}${seq}`,
      name,
      active: true,
      canInput,
      canDisplay: !canInput,
      deviceKind: kind,
      joinedAt: ++seq,
    };
    players.set(p.id, p);
    return p;
  };
  const required = (r: R) => {
    const ids = r.publicState["requiredPlayerIds"];
    return Array.isArray(ids)
      ? (ids as string[])
      : inRoom(r)
          .filter((p) => p.active && p.canInput)
          .map((p) => p.id);
  };
  const stageActs = (r: R, rk: string, st: string) =>
    [...actions.values()].filter(
      (a) => a.roomId === r.id && a.roundKey === rk && a.stage === st,
    );
  const findRoom = (code: unknown) =>
    [...rooms.values()].find(
      (r) => r.code === String(code).toUpperCase() && r.phase !== "finished",
    );

  const handlers: Record<string, (a: Record<string, unknown>) => unknown> = {
    gang_create_room: (a) => {
      const r: R = {
        id: uid(),
        code: Math.random()
          .toString(16)
          .slice(2, 8)
          .toUpperCase()
          .padEnd(6, "A"),
        phase: "lobby",
        entryMode: String(a["p_entry_mode"]),
        gameId: null,
        roundKey: null,
        stage: null,
        publicState: {},
        version: 1,
        maxPlayers: Number(a["p_max_players"]),
        facilitator: null,
        runtime: null,
      };
      rooms.set(r.id, r);
      const p = addPlayer(r, String(a["p_display_name"]), true, "phone");
      r.facilitator = p.id;
      r.version++;
      return { playerToken: p.token, snapshot: snapshot(p) };
    },
    gang_join_room: (a) => {
      const r = findRoom(a["p_code"]);
      if (!r) throw new Error("room_not_found");
      if (inRoom(r).filter((p) => p.active).length >= r.maxPlayers)
        throw new Error("room_full");
      const p = addPlayer(r, String(a["p_display_name"]), true, "phone");
      r.version++;
      reassign(r);
      return { playerToken: p.token, snapshot: snapshot(p) };
    },
    gang_join_display: (a) => {
      const r = findRoom(a["p_code"]);
      if (!r) throw new Error("room_not_found");
      const p = addPlayer(r, "BIG SCREEN", false, "desktop");
      r.version++;
      return { playerToken: p.token, snapshot: snapshot(p) };
    },
    couple_control: (a) => {
      const p=byToken(a["p_player_token"]),r=roomOf(p);
      if(r.roundKey!==a["p_round_key"] || r.stage!==a["p_stage"]) throw new Error("stale_stage");
      const k=`${r.id}:${r.roundKey}:${r.stage}`,kind=a["p_kind"];
      if(kind) {controls.set(k,[...(controls.get(k)??[]),String(kind)]);r.version++;return {accepted:true};}
      if(r.facilitator!==p.id) throw new Error("facilitator_required");
      return controls.get(k)??[];
    },
    gang_poll: (a) => ({
      snapshot: handlers["gang_room_snapshot"]!(a),
      progress: handlers["gang_stage_progress"]!(a),
    }),
    gang_round_attempt: (a) => {
      const p = byToken(a["p_player_token"]),
        r = roomOf(p);
      if (r.roundKey !== a["p_round_key"] || r.stage !== a["p_stage"])
        throw new Error("stale_stage");
      if (!required(r).includes(p.id)) throw new Error("player_not_required");
      attempts.push({
        roomId: r.id,
        roundKey: r.roundKey!,
        stage: r.stage!,
        playerId: p.id,
        actionType: "attempt",
        payload: { value: a["p_value"] },
        at: new Date().toISOString(),
      });
      return { accepted: true, remaining: 23 };
    },
    gang_round_attempts: (a) => {
      const p = byToken(a["p_player_token"]),
        r = roomOf(p);
      if (r.facilitator !== p.id) throw new Error("facilitator_required");
      return {
        expired: false,
        actions: attempts.filter(
          (x) =>
            x.roomId === r.id &&
            x.roundKey === r.roundKey &&
            x.stage === r.stage,
        ),
      };
    },
    gang_publish_state: (a) => {
      const result = handlers["gang_set_room_state"]!(a);
      handlers["gang_save_runtime"]!(a);
      handlers["gang_set_private_payloads"]!({
        ...a,
        p_payloads: a["p_private_payloads"],
      });
      return result;
    },
    gang_room_snapshot: (a) => {
      const p = byToken(a["p_player_token"]);
      if (p.active || p.canInput) p.active = p.active;
      reassign(roomOf(p));
      return snapshot(p);
    },
    gang_leave_room: (a) => {
      const p = byToken(a["p_player_token"]);
      p.active = false;
      const r = roomOf(p);
      r.facilitator = inRoom(r).find((x) => x.active)?.id ?? null;
      r.version++;
      return snapshot(p);
    },
    gang_set_room_state: (a) => {
      const p = byToken(a["p_player_token"]);
      const r = roomOf(p);
      if (r.facilitator !== p.id) throw new Error("facilitator_required");
      if (r.version !== a["p_expected_version"])
        throw new Error("version_conflict");
      Object.assign(r, {
        phase: a["p_phase"],
        gameId: a["p_game_id"],
        roundKey: a["p_round_key"],
        stage: a["p_stage"],
        publicState: structuredClone(a["p_public_state"]),
      });
      r.version++;
      return snapshot(p);
    },
    gang_submit_action: (a) => {
      const p = byToken(a["p_player_token"]);
      const r = roomOf(p);
      if (!p.active) throw new Error("room_not_active");
      if (r.roundKey !== a["p_round_key"] || r.stage !== a["p_stage"])
        throw new Error("stale_stage");
      actions.set(
        `${r.id}|${r.roundKey}|${r.stage}|${p.id}|${a["p_action_type"]}`,
        {
          roomId: r.id,
          roundKey: r.roundKey!,
          stage: r.stage!,
          playerId: p.id,
          actionType: String(a["p_action_type"]),
          payload: structuredClone(a["p_payload"]) as Record<string, unknown>,
        },
      );
      return { accepted: true };
    },
    gang_stage_progress: (a) => {
      const p = byToken(a["p_player_token"]);
      const r = roomOf(p);
      const req = required(r);
      const acts = stageActs(r, r.roundKey ?? "", r.stage ?? "");
      const submitted = new Set(
        acts.filter((x) => req.includes(x.playerId)).map((x) => x.playerId),
      ).size;
      return {
        roundKey: r.roundKey,
        stage: r.stage,
        required: req.length,
        submitted,
        complete: req.length > 0 && submitted >= req.length,
        youSubmitted: acts.some((x) => x.playerId === p.id),
      };
    },
    gang_collect_stage_actions: (a) => {
      const p = byToken(a["p_player_token"]);
      const r = roomOf(p);
      if (r.facilitator !== p.id) throw new Error("facilitator_required");
      if (r.roundKey !== a["p_round_key"] || r.stage !== a["p_stage"])
        throw new Error("stale_stage");
      const req = required(r);
      const acts = stageActs(r, r.roundKey!, r.stage!);
      if (
        req.length > 0 &&
        new Set(
          acts.filter((x) => req.includes(x.playerId)).map((x) => x.playerId),
        ).size < req.length
      )
        throw new Error("stage_incomplete");
      return acts.map(({ playerId, actionType, payload }) => ({
        playerId,
        actionType,
        payload,
      }));
    },
    gang_set_private_payloads: (a) => {
      const p = byToken(a["p_player_token"]);
      const r = roomOf(p);
      if (r.facilitator !== p.id) throw new Error("facilitator_required");
      if (r.roundKey !== a["p_round_key"]) throw new Error("stale_round");
      for (const k of [...privates.keys()])
        if (k.startsWith(`${r.id}|${a["p_round_key"]}|`)) privates.delete(k);
      for (const item of a["p_payloads"] as Array<{
        playerId: string;
        payload: Record<string, unknown>;
      }>) {
        const t = players.get(item.playerId);
        if (!t || t.roomId !== r.id || !t.active || !t.canInput)
          throw new Error("target_player_invalid");
        privates.set(
          `${r.id}|${a["p_round_key"]}|${item.playerId}`,
          structuredClone(item.payload),
        );
      }
      return { stored: (a["p_payloads"] as unknown[]).length };
    },
    gang_get_private: (a) => {
      const p = byToken(a["p_player_token"]);
      return privates.get(`${p.roomId}|${a["p_round_key"]}|${p.id}`) ?? null;
    },
    gang_save_runtime: (a) => {
      const p = byToken(a["p_player_token"]);
      const r = roomOf(p);
      if (r.facilitator !== p.id) throw new Error("facilitator_required");
      r.runtime = structuredClone(a["p_runtime_state"]);
      return { saved: true };
    },
    gang_load_runtime: (a) => {
      const p = byToken(a["p_player_token"]);
      const r = roomOf(p);
      if (r.facilitator !== p.id) throw new Error("facilitator_required");
      return structuredClone(r.runtime);
    },
  };

  const rpc: Rpc = async (fn, args) => {
    calls.push({ fn, args });
    await Promise.resolve();
    try {
      return { data: handlers[fn]!(args), error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  };
  return { rpc, rooms, players, privates, actions, calls };
}
