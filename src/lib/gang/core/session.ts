// Generated from packages/gang-core/src/session.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import { couchGame } from "./experience.js";
import type {
  DeviceContext,
  GangGameDefinition,
  GangPreferences,
  InteractionMode,
  ScaleBand,
} from "./types.js";
import { scaleBandFor } from "./catalog.js";

/** Authored game fit wins over device count. A TV never makes private cards public. */
export function preferredInteractionMode(
  game: GangGameDefinition,
  preferences: GangPreferences,
  devices: DeviceContext,
): InteractionMode {
  const allowed = new Set(game.interactionModes);
  if (couchGame(game.id) && devices.inputPreference !== "individual")
    return devices.hasBigScreen ? "big-screen" : "one-phone";
  if (
    devices.connectedDevices >= preferences.playerCount &&
    allowed.has("everyone-in")
  )
    return "everyone-in";
  if (
    devices.hasBigScreen &&
    devices.connectedDevices >= 2 &&
    allowed.has("big-screen")
  )
    return "big-screen";
  if (devices.connectedDevices >= 2 && allowed.has("team-device"))
    return "team-device";
  if (devices.connectedDevices >= 2 && allowed.has("mixed")) return "mixed";
  return "one-phone";
}

export function estimatedGameMinutes(game: GangGameDefinition): number {
  return Math.round((game.durationMinutes[0] + game.durationMinutes[1]) / 2);
}

export function targetGameCount(
  durationMinutes: GangPreferences["durationMinutes"],
): number {
  if (durationMinutes === null) return 6;
  if (durationMinutes <= 15) return 2;
  if (durationMinutes <= 30) return 4;
  return 7;
}
