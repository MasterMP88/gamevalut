import assert from "node:assert/strict";
import test from "node:test";
import { GANG_ROOM_RPC, isGangRoomSnapshot } from "../dist/index.js";

test("secure room transport exposes the complete RPC surface", () => {
  assert.deepEqual(Object.values(GANG_ROOM_RPC).sort(), [
    "gang_collect_stage_actions",
    "gang_create_room",
    "gang_get_private",
    "gang_join_display",
    "gang_join_room",
    "gang_leave_room",
    "gang_prepare_private_round",
    "gang_reveal_round_data",
    "gang_room_snapshot",
    "gang_set_private_payloads",
    "gang_set_room_state",
    "gang_stage_progress",
    "gang_submit_action",
  ].sort());
});

test("room snapshot guard accepts the public transport shape only", () => {
  assert.equal(isGangRoomSnapshot({
    roomId: "r",
    code: "ABC123",
    phase: "lobby",
    entryMode: "catalog",
    gameId: null,
    roundKey: null,
    stage: null,
    publicState: {},
    version: 1,
    expiresAt: new Date(0).toISOString(),
    maxPlayers: 8,
    playerId: "p",
    isFacilitator: true,
    players: [],
  }), true);
  assert.equal(isGangRoomSnapshot({ roomId: "r", code: "ABC123" }), false);
});
