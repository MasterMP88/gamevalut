/* GANG MODE presentation catalog. Rules, ranges and content come from the vendored core
   (`src/lib/gang/core`, mirrored from GitHub packages/gang-core). This file only adds look & feel. */
import { GANG_GAMES as CORE_GAMES } from "./core/catalog";
import { getGangPlaybook, type GangGameId } from "./core/playbooks";

export type Motif = "bars" | "point" | "mask" | "seal" | "scribble" | "poker" | "line" | "spot" | "split" | "frame" | "pen" | "wave" | "chain" | "one" | "button" | "moon";

/** Per-game signature used by the player shell to vary layout/motion. */
export type Signature = "bars" | "point" | "mask" | "dispatch" | "scribble" | "poker" | "line" | "spotlight" | "split" | "frame" | "pen" | "wave" | "chain" | "odd" | "pressure" | "moon";

export interface GangGame {
  id: GangGameId;
  title: string;
  hook: string;
  /** one-line German 10-second rule */
  rule: string;
  min: number;
  max: number;
  minutes: [number, number];
  energy: number;
  tags: string[];
  capabilities: string[];
  interactionModes: readonly string[];
  motif: Motif;
  signature: Signature;
  hue: number;
  private: boolean;
}

const LOOK: Record<Exclude<GangGameId, "time-drop">, { motif: Motif; signature: Signature; hue: number; tags: string[]; private?: boolean }> = {
  "the-majority": { motif: "bars", signature: "bars", hue: 95, tags: ["Funny", "Social"] },
  "whos-that": { motif: "point", signature: "point", hue: 25, tags: ["Chaos", "Social"] },
  undercover: { motif: "mask", signature: "mask", hue: 260, tags: ["Bluff", "Personal"], private: true },
  "secret-missions": { motif: "seal", signature: "dispatch", hue: 330, tags: ["Chaos", "Bluff"], private: true },
  "bad-answers-only": { motif: "scribble", signature: "scribble", hue: 60, tags: ["Funny"] },
  bluff: { motif: "poker", signature: "poker", hue: 200, tags: ["Bluff"], private: true },
  "the-line": { motif: "line", signature: "line", hue: 150, tags: ["Physical", "Social"] },
  "hot-seat": { motif: "spot", signature: "spotlight", hue: 15, tags: ["Personal"], private: true },
  "team-chaos": { motif: "split", signature: "split", hue: 45, tags: ["Teams", "Chaos", "Physical"] },
  "photo-hunt": { motif: "frame", signature: "frame", hue: 180, tags: ["Physical", "Funny"] },
  "draw-this": { motif: "pen", signature: "pen", hue: 80, tags: ["Funny"], private: true },
  "music-drop": { motif: "wave", signature: "wave", hue: 300, tags: ["Music"] },
  "chain-reaction": { motif: "chain", signature: "chain", hue: 120, tags: ["Funny", "Chaos"] },
  "one-of-you": { motif: "one", signature: "odd", hue: 240, tags: ["Bluff", "Personal"], private: true },
  "panic-button": { motif: "button", signature: "pressure", hue: 30, tags: ["Chaos", "Physical"] },
  "after-dark": { motif: "moon", signature: "moon", hue: 350, tags: ["Personal"] },
};

/* Only ready titles on the generic runtime are listed; TIME//DROP needs its dedicated player (roadmap). */
export const GANG_GAMES: GangGame[] = CORE_GAMES.filter((g) => g.status === "ready" && getGangPlaybook(g.id)?.runtime !== "time-drop").map((g) => {
  const pb = getGangPlaybook(g.id)!;
  const look = LOOK[pb.id as keyof typeof LOOK];
  return {
    id: pb.id,
    title: pb.title,
    hook: g.hook,
    rule: pb.promise,
    // Enforce the stricter of catalog + playbook bounds; the runtime rejects anything outside the playbook.
    min: Math.max(g.minPlayers, pb.minPlayers),
    max: Math.min(g.maxPlayers, pb.maxPlayers),
    minutes: g.durationMinutes,
    energy: g.energy,
    tags: look.tags,
    capabilities: [...g.capabilities],
    interactionModes: [...g.interactionModes],
    motif: look.motif,
    signature: look.signature,
    hue: look.hue,
    private: !!look.private,
  };
});

export const GANG_TAGS = ["Funny", "Chaos", "Bluff", "Social", "Physical", "Music", "Personal", "Teams"] as const;

export const gangGame = (id: string) => GANG_GAMES.find((g) => g.id === id);
export const avgMinutes = (g: GangGame) => Math.round((g.minutes[0] + g.minutes[1]) / 2);
export const mixMinutes = (ids: string[]) => ids.reduce((t, id) => t + (gangGame(id) ? avgMinutes(gangGame(id)!) : 0), 0);
export const fitsPlayers = (g: GangGame, n: number) => n >= g.min && n <= g.max;
