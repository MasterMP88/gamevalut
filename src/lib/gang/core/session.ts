// Generated from packages/gang-core/src/session.ts by scripts/vendor-cores.mjs. Edit the canonical package.
import type {
  DeviceContext,
  GangGameDefinition,
  GangPreferences,
  InteractionMode,
  ScaleBand,
} from "./types.js";
import { scaleBandFor } from "./catalog.js";

/**
 * Premium device policy:
 * - BIG SCREEN is an enhancement of multi-device play, not a separate host-only mode.
 * - EVERYONE IN is only claimed when every active player has an input device.
 * - MIXED / TEAM DEVICE bridge partial device coverage.
 * - ONE PHONE is the final fallback, never the preferred multi-device experience.
 */
export function preferredInteractionMode(
  game: GangGameDefinition,
  preferences: GangPreferences,
  devices: DeviceContext,
): InteractionMode {
  const allowed = new Set(game.interactionModes);
  const band: ScaleBand = scaleBandFor(preferences.playerCount);
  const everyPlayerHasDevice = devices.connectedDevices >= preferences.playerCount;
  const hasSharedControllers = devices.connectedDevices >= Math.min(2, preferences.playerCount);

  if (devices.hasBigScreen && hasSharedControllers && allowed.has("big-screen")) {
    return "big-screen";
  }
  if (everyPlayerHasDevice && allowed.has("everyone-in")) {
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

  // Defensive fallbacks for unusually constrained game declarations.
  if (band !== "duo-small" && allowed.has("team-device")) return "team-device";
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
