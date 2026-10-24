import type {
  DeviceContext,
  GangGameDefinition,
  GangPreferences,
  InteractionMode,
  ScaleBand,
} from "./types.js";
import { scaleBandFor } from "./catalog.js";

export function preferredInteractionMode(
  game: GangGameDefinition,
  preferences: GangPreferences,
  devices: DeviceContext,
): InteractionMode {
  const allowed = new Set(game.interactionModes);
  const band: ScaleBand = scaleBandFor(preferences.playerCount);

  if (band === "crowd" && devices.hasBigScreen && allowed.has("big-screen")) {
    return "big-screen";
  }
  if (
    devices.connectedDevices >= Math.max(2, Math.ceil(preferences.playerCount * 0.7)) &&
    allowed.has("everyone-in")
  ) {
    return "everyone-in";
  }
  if (devices.connectedDevices >= 2 && allowed.has("mixed")) {
    return "mixed";
  }
  if (allowed.has("team-device") && preferences.playerCount >= 6) {
    return "team-device";
  }
  if (allowed.has("one-phone")) {
    return "one-phone";
  }
  return game.interactionModes[0]!;
}

export function estimatedGameMinutes(game: GangGameDefinition): number {
  return Math.round((game.durationMinutes[0] + game.durationMinutes[1]) / 2);
}

export function targetGameCount(durationMinutes: GangPreferences["durationMinutes"]): number {
  if (durationMinutes === null) return 6;
  if (durationMinutes <= 15) return 2;
  if (durationMinutes <= 30) return 4;
  return 7;
}
