import type {
  DeviceContext,
  GangDevice,
  GangEntryMode,
  GangPlayer,
  GangPreferences,
  GangRoomEvent,
  GangRoomState,
} from "./types.js";

export const MAX_GANG_PLAYERS = 99;
export const DEFAULT_PRESENCE_TTL_MS = 90_000;

export interface CreateGangRoomInput {
  id: string;
  code: string;
  createdAt: number;
  preferences: GangPreferences;
  entryMode: GangEntryMode;
}

function cleanName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ").slice(0, 32);
  if (!name) throw new Error("Player displayName is required");
  return name;
}

export function normalizeRoomCode(value: string): string {
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (code.length < 4) throw new Error("Room code must contain 4–6 letters or digits");
  return code;
}

export function activeGangPlayers(room: GangRoomState): GangPlayer[] {
  return room.players.filter((player) => player.active);
}

export function connectedGangDevices(room: GangRoomState): GangDevice[] {
  return room.devices.filter((device) => device.connected);
}

/**
 * Hostless does not mean "nobody coordinates UI hand-offs". The facilitator is
 * a temporary deterministic role. It automatically moves when somebody leaves
 * and carries no product authority or special permissions.
 */
export function electFacilitator(players: readonly GangPlayer[]): string | null {
  const active = players
    .filter((player) => player.active)
    .slice()
    .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
  return active[0]?.id ?? null;
}

function withMeta(room: GangRoomState, at: number): GangRoomState {
  const facilitatorPlayerId = electFacilitator(room.players);
  return {
    ...room,
    facilitatorPlayerId,
    revision: room.revision + 1,
    updatedAt: Math.max(room.updatedAt, at),
  };
}

export function createGangRoom(input: CreateGangRoomInput): GangRoomState {
  if (!input.id.trim()) throw new Error("Room id is required");
  return {
    id: input.id,
    code: normalizeRoomCode(input.code),
    phase: "lobby",
    revision: 0,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    preferences: input.preferences,
    entryMode: input.entryMode,
    players: [],
    devices: [],
    facilitatorPlayerId: null,
  };
}

function attachDevice(player: GangPlayer, deviceId: string | undefined): GangPlayer {
  if (!deviceId || player.deviceIds.includes(deviceId)) return player;
  return { ...player, deviceIds: [...player.deviceIds, deviceId] };
}

export function applyGangRoomEvent(room: GangRoomState, event: GangRoomEvent): GangRoomState {
  switch (event.type) {
    case "PLAYER_JOIN": {
      const index = room.players.findIndex((player) => player.id === event.playerId);
      if (index >= 0) {
        const players = room.players.slice();
        const current = players[index]!;
        players[index] = attachDevice(
          {
            ...current,
            displayName: cleanName(event.displayName),
            active: true,
            lastSeenAt: event.at,
          },
          event.deviceId,
        );
        return withMeta({ ...room, players }, event.at);
      }

      if (activeGangPlayers(room).length >= MAX_GANG_PLAYERS) {
        throw new RangeError("GANG MODE supports at most 99 active players");
      }

      const player: GangPlayer = {
        id: event.playerId,
        displayName: cleanName(event.displayName),
        active: true,
        joinedAt: event.at,
        lastSeenAt: event.at,
        deviceIds: event.deviceId ? [event.deviceId] : [],
      };
      return withMeta({ ...room, players: [...room.players, player] }, event.at);
    }

    case "PLAYER_LEAVE": {
      if (!room.players.some((player) => player.id === event.playerId)) return room;
      const players = room.players.map((player) =>
        player.id === event.playerId
          ? { ...player, active: false, lastSeenAt: event.at }
          : player,
      );
      return withMeta({ ...room, players }, event.at);
    }

    case "PLAYER_SEEN": {
      if (!room.players.some((player) => player.id === event.playerId)) return room;
      const players = room.players.map((player) =>
        player.id === event.playerId
          ? { ...player, active: true, lastSeenAt: event.at }
          : player,
      );
      return withMeta({ ...room, players }, event.at);
    }

    case "DEVICE_JOIN": {
      const index = room.devices.findIndex((device) => device.id === event.device.id);
      const device: GangDevice = {
        ...event.device,
        connected: true,
        lastSeenAt: event.at,
      };
      const devices = room.devices.slice();
      if (index >= 0) devices[index] = { ...devices[index]!, ...device };
      else devices.push(device);
      return withMeta({ ...room, devices }, event.at);
    }

    case "DEVICE_LEAVE": {
      if (!room.devices.some((device) => device.id === event.deviceId)) return room;
      const devices = room.devices.map((device) =>
        device.id === event.deviceId
          ? { ...device, connected: false, lastSeenAt: event.at }
          : device,
      );
      return withMeta({ ...room, devices }, event.at);
    }

    case "SET_PHASE": {
      if (event.phase === room.phase) return room;
      if (event.phase === "playing" && activeGangPlayers(room).length < 2) {
        throw new Error("At least two active players are required to start");
      }
      return withMeta({ ...room, phase: event.phase }, event.at);
    }
  }
}

export function roomDeviceContext(room: GangRoomState): DeviceContext {
  const connected = connectedGangDevices(room);
  return {
    connectedDevices: connected.filter((device) => device.canInput).length,
    hasBigScreen: connected.some(
      (device) =>
        device.canDisplay &&
        (device.kind === "tv" || device.kind === "desktop"),
    ),
  };
}

export function roomReadyForGame(room: GangRoomState): boolean {
  return activeGangPlayers(room).length >= 2;
}

export function stalePlayerIds(
  room: GangRoomState,
  now: number,
  ttlMs = DEFAULT_PRESENCE_TTL_MS,
): string[] {
  return room.players
    .filter((player) => player.active && now - player.lastSeenAt > ttlMs)
    .map((player) => player.id);
}

/**
 * Presence cleanup is explicit and deterministic so any realtime transport can
 * call it. Players are retained as inactive records to support drop-in/rejoin.
 */
export function expireGangPresence(
  room: GangRoomState,
  now: number,
  ttlMs = DEFAULT_PRESENCE_TTL_MS,
): GangRoomState {
  const stale = new Set(stalePlayerIds(room, now, ttlMs));
  const staleDevices = new Set(
    room.devices
      .filter((device) => device.connected && now - device.lastSeenAt > ttlMs)
      .map((device) => device.id),
  );

  if (!stale.size && !staleDevices.size) return room;

  const players = room.players.map((player) =>
    stale.has(player.id) ? { ...player, active: false } : player,
  );
  const devices = room.devices.map((device) =>
    staleDevices.has(device.id) ? { ...device, connected: false } : device,
  );
  return withMeta({ ...room, players, devices }, now);
}
