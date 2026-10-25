// Generated from packages/gang-core/src/transport.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import type { GangRoomPhase } from "./types.js";

export const GANG_ROOM_RPC = {
  createRoom: "gang_create_room",
  joinRoom: "gang_join_room",
  joinDisplay: "gang_join_display",
  snapshot: "gang_room_snapshot",
  leaveRoom: "gang_leave_room",
  setRoomState: "gang_set_room_state",
  submitAction: "gang_submit_action",
  collectStageActions: "gang_collect_stage_actions",
  stageProgress: "gang_stage_progress",
  getPrivate: "gang_get_private",
  setPrivatePayloads: "gang_set_private_payloads",
  saveRuntime: "gang_save_runtime",
  loadRuntime: "gang_load_runtime",
  revealRoundData: "gang_reveal_round_data",
} as const;

export interface GangRoomPlayerPublic {
  id: string;
  name: string;
  active: boolean;
  joinedAt: string;
  lastSeenAt: string;
  deviceKind: "phone" | "tablet" | "desktop" | "tv";
  canInput: boolean;
  canDisplay: boolean;
  isFacilitator: boolean;
}

export interface GangRoomSnapshotV1 {
  roomId: string;
  code: string;
  phase: GangRoomPhase;
  entryMode: "director" | "catalog" | "mix";
  gameId: string | null;
  roundKey: string | null;
  stage: string | null;
  publicState: Record<string, unknown>;
  version: number;
  expiresAt: string;
  maxPlayers: number;
  playerId: string;
  isFacilitator: boolean;
  players: GangRoomPlayerPublic[];
}

export interface GangRoomCredential {
  /** Bearer capability returned once by create/join. Store per session, never in a URL. */
  playerToken: string;
  snapshot: GangRoomSnapshotV1;
}

export interface GangStageProgress {
  roundKey: string | null;
  stage: string | null;
  required: number;
  submitted: number;
  complete: boolean;
  youSubmitted: boolean;
}

export interface GangRevealAction {
  playerId: string;
  actionType: string;
  payload: Record<string, unknown>;
  at: string;
}

export interface GangRevealPrivatePayload {
  playerId: string;
  payload: Record<string, unknown>;
}

export interface GangRevealRoundData {
  actions: GangRevealAction[];
  privatePayloads: GangRevealPrivatePayload[];
}

export interface GangRoomTransport {
  createRoom(input: {
    displayName: string;
    entryMode: "director" | "catalog" | "mix";
    maxPlayers: number;
    deviceKind?: GangRoomPlayerPublic["deviceKind"];
  }): Promise<GangRoomCredential>;

  joinRoom(input: {
    code: string;
    displayName: string;
    deviceKind?: GangRoomPlayerPublic["deviceKind"];
  }): Promise<GangRoomCredential>;

  joinDisplay(input: {
    code: string;
    deviceKind?: "tablet" | "desktop" | "tv";
  }): Promise<GangRoomCredential>;

  snapshot(playerToken: string): Promise<GangRoomSnapshotV1>;
  leaveRoom(playerToken: string): Promise<GangRoomSnapshotV1>;

  setRoomState(input: {
    playerToken: string;
    expectedVersion: number;
    phase: GangRoomPhase;
    gameId: string | null;
    roundKey: string | null;
    stage: string | null;
    publicState: Record<string, unknown>;
  }): Promise<GangRoomSnapshotV1>;

  submitAction(input: {
    playerToken: string;
    roundKey: string;
    stage: string;
    actionType: string;
    payload: Record<string, unknown>;
  }): Promise<{ accepted: true; roundKey: string; stage: string }>;

  collectStageActions(input: {
    playerToken: string;
    roundKey: string;
    stage: string;
  }): Promise<GangRevealAction[]>;

  stageProgress(playerToken: string): Promise<GangStageProgress>;
  getPrivate(playerToken: string, roundKey: string): Promise<Record<string, unknown> | null>;

  setPrivatePayloads(input: {
    playerToken: string;
    roundKey: string;
    payloads: Array<{ playerId: string; payload: Record<string, unknown> }>;
  }): Promise<{ stored: number; roundKey: string }>;

  saveRuntime(playerToken: string, runtimeState: Record<string, unknown>): Promise<{ saved: true }>;
  loadRuntime(playerToken: string): Promise<Record<string, unknown> | null>;


  revealRoundData(input: {
    playerToken: string;
    roundKey: string;
    sourceStage: string;
  }): Promise<GangRevealRoundData>;
}

/**
 * Multiplayer security invariant:
 * - room/player bearer tokens never enter URLs or public room state;
 * - private payloads are readable only through the owning player token before reveal;
 * - completed stage actions can be collected only by the elected facilitator, and
 *   pre-reveal private payloads still remain owner-only;
 * - raw private mappings become available to the elected facilitator only after
 *   the room reaches reveal/score/finished;
 * - display-only clients never count against the room's player-seat limit;
 * - the complete canonical runtime may be persisted only in the private server schema
 *   and can be loaded only by the currently elected facilitator, enabling failover;
 * - clients use optimistic room versions and must recover from version_conflict by
 *   fetching a fresh snapshot rather than force-overwriting state.
 */
export function isGangRoomSnapshot(value: unknown): value is GangRoomSnapshotV1 {
  if (!value || typeof value !== "object") return false;
  const room = value as Partial<GangRoomSnapshotV1>;
  return (
    typeof room.roomId === "string" &&
    typeof room.code === "string" &&
    typeof room.version === "number" &&
    Array.isArray(room.players) &&
    typeof room.playerId === "string" &&
    typeof room.isFacilitator === "boolean"
  );
}
