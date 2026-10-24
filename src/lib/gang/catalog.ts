/* GANG MODE presentation catalog. Display data only — rules/engines live in packages/gang-core (GitHub). */
export type GangStatus = "prototype" | "dev";
export type GangMode = "One Phone" | "Everyone In" | "Big Screen" | "Teams";
export type Motif = "bars" | "point" | "mask" | "seal" | "scribble" | "poker" | "line" | "spot" | "split" | "frame" | "pen" | "wave" | "chain" | "one" | "button" | "moon";

export interface GangGame {
  id: string; title: string; hook: string; min: number; max: number;
  minutes: [number, number]; tags: string[]; modes: GangMode[]; status: GangStatus;
  motif: Motif; hue: number;
}

export const GANG_GAMES: GangGame[] = [
  { id: "majority", title: "THE MAJORITY", hook: "Guess the room. Then live with the result.", min: 3, max: 99, minutes: [10, 20], tags: ["Funny", "Voting"], modes: ["Everyone In", "Big Screen"], status: "prototype", motif: "bars", hue: 95 },
  { id: "whos-that", title: "WHO'S THAT?", hook: "Everybody points. Somebody has to own it.", min: 4, max: 30, minutes: [10, 15], tags: ["Chaos", "Social"], modes: ["One Phone", "Everyone In"], status: "prototype", motif: "point", hue: 25 },
  { id: "undercover", title: "UNDERCOVER", hook: "Everyone knows the thing. Almost everyone.", min: 4, max: 20, minutes: [15, 25], tags: ["Bluff", "Secret role"], modes: ["One Phone", "Everyone In"], status: "prototype", motif: "mask", hue: 260 },
  { id: "secret-missions", title: "SECRET MISSIONS", hook: "The game has already started. They just don't know it yet.", min: 3, max: 99, minutes: [30, 120], tags: ["Covert", "All night"], modes: ["Everyone In"], status: "prototype", motif: "seal", hue: 330 },
  { id: "bad-answers", title: "BAD ANSWERS ONLY", hook: "Wrong on purpose. Funny by accident.", min: 3, max: 30, minutes: [10, 20], tags: ["Funny"], modes: ["Everyone In", "Big Screen"], status: "dev", motif: "scribble", hue: 60 },
  { id: "bluff", title: "BLUFF", hook: "Straight face. Crooked story.", min: 3, max: 12, minutes: [15, 20], tags: ["Bluff"], modes: ["One Phone"], status: "dev", motif: "poker", hue: 200 },
  { id: "the-line", title: "THE LINE", hook: "Everyone takes a position. Literally.", min: 4, max: 99, minutes: [10, 15], tags: ["Physical", "Social"], modes: ["Big Screen"], status: "dev", motif: "line", hue: 150 },
  { id: "hot-seat", title: "HOT SEAT", hook: "One chair. Every question.", min: 3, max: 20, minutes: [10, 20], tags: ["Personal"], modes: ["One Phone", "Big Screen"], status: "dev", motif: "spot", hue: 15 },
  { id: "team-chaos", title: "TEAM CHAOS", hook: "Two teams. No plan.", min: 6, max: 99, minutes: [20, 30], tags: ["Teams", "Chaos"], modes: ["Teams", "Big Screen"], status: "dev", motif: "split", hue: 45 },
  { id: "photo-hunt", title: "PHOTO HUNT", hook: "The room is the scavenger list.", min: 3, max: 40, minutes: [15, 30], tags: ["Camera", "Physical"], modes: ["Everyone In"], status: "dev", motif: "frame", hue: 180 },
  { id: "draw-this", title: "DRAW THIS", hook: "Talent optional. Confidence mandatory.", min: 3, max: 20, minutes: [15, 20], tags: ["Creative"], modes: ["Everyone In", "Big Screen"], status: "dev", motif: "pen", hue: 80 },
  { id: "music-drop", title: "MUSIC DROP", hook: "First beat wins the room.", min: 3, max: 99, minutes: [10, 20], tags: ["Music"], modes: ["Big Screen", "Teams"], status: "dev", motif: "wave", hue: 300 },
  { id: "chain-reaction", title: "CHAIN REACTION", hook: "One word sets off the next.", min: 3, max: 30, minutes: [10, 15], tags: ["Fast"], modes: ["One Phone"], status: "dev", motif: "chain", hue: 120 },
  { id: "one-of-you", title: "ONE OF YOU", hook: "Somebody here did this.", min: 4, max: 40, minutes: [10, 20], tags: ["Personal", "Voting"], modes: ["Everyone In"], status: "dev", motif: "one", hue: 240 },
  { id: "panic-button", title: "PANIC BUTTON", hook: "Hold it. Pass it. Don't be last.", min: 3, max: 20, minutes: [5, 10], tags: ["Fast", "Physical"], modes: ["One Phone"], status: "dev", motif: "button", hue: 30 },
  { id: "after-dark", title: "AFTER DARK", hook: "Late, opt-in and on your terms.", min: 3, max: 20, minutes: [20, 40], tags: ["Spicy", "Opt-in"], modes: ["One Phone", "Everyone In"], status: "dev", motif: "moon", hue: 350 },
];

export const GANG_TAGS = ["Funny", "Chaos", "Bluff", "Social", "Physical", "Music", "Personal", "Teams"] as const;

export const avgMinutes = (g: GangGame) => Math.round((g.minutes[0] + g.minutes[1]) / 2);
export const mixMinutes = (ids: string[]) => ids.reduce((t, id) => t + avgMinutes(GANG_GAMES.find((g) => g.id === id)!), 0);