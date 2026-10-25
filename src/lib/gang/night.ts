/* Thin presentation adapter: maps START MY NIGHT choices onto the core Director contract. No own rules. */
import { seenIds } from "@/lib/content-history";
import { GANG_GAMES } from "./core/catalog";
import { buildDirectorPlan } from "./core/director";
import type { Energy, GameCapability, GangPreferences } from "./core/types";
import type { GangGameId } from "./core/playbooks";

export const VIBES = ["Chill", "Funny", "Wild", "Spicy", "Chaos"] as const;
export const DURATIONS = [
  { label: "15 min", v: 15 },
  { label: "30 min", v: 30 },
  { label: "60 min", v: 60 },
  { label: "Open End", v: null },
] as const;
export const MODULES = [
  { label: "Music", cap: "music" },
  { label: "Camera", cap: "camera" },
  { label: "After Dark", cap: "spicy" },
  { label: "Drinks", cap: "alcohol" },
] as const;

export type Vibe = (typeof VIBES)[number];
const ENERGY: Record<Vibe, Energy> = { Chill: 2, Funny: 3, Wild: 4, Spicy: 4, Chaos: 5 };

export function directorNight(input: { vibe: Vibe; duration: 15 | 30 | 60 | null; players: number; caps: GameCapability[]; seed?: number }): import("./core/types").GangPlan {
  const preferences: GangPreferences = {
    playerCount: input.players,
    durationMinutes: input.duration,
    energyTarget: ENERGY[input.vibe],
    moods: [input.vibe.toLowerCase()],
    enabledCapabilities: input.caps,
  };
  const plan = buildDirectorPlan({ preferences, history: seenIds().filter((id) => id.startsWith("game/")).flatMap((id) => { const g = GANG_GAMES.find((g) => g.id === id.slice(5)); return g ? [{ gameId: g.id, primaryMechanic: g.mechanics[0]!, energy: g.energy }] : []; }), seed: input.seed ?? 1, deviceContext: { connectedDevices: input.players, hasBigScreen: false } });
  return plan;
}

/** Auto-named roster: names for up to 12, then "Spieler N" so no 99-field form is needed. */
export const NAMED_LIMIT = 12;
export function roster(count: number, names: string[]) {
  return Array.from({ length: count }, (_, i) => {
    const n = (i < NAMED_LIMIT ? names[i] : "")?.trim();
    return { id: `p${i + 1}`, name: n || `Spieler ${i + 1}` };
  });
}
