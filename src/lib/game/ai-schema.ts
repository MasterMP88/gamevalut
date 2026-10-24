import { z } from "zod";
import type { Flavor, Scene, SceneType } from "./types";
import { enforceContract } from "./contract";

const TYPES = ["QUESTION", "MISSION", "TIMER", "CHOICE", "ECHO", "PRIVATE_SIGNAL", "SYNC", "PREDICTION", "GLITCH"] as const;

export const aiSceneSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.enum(TYPES),
  targetPlayer: z.string().max(40),
  emoji: z.string().max(8).optional().default(""),
  title: z.string().min(2).max(60),
  prompt: z.string().min(8).max(320),
  helperText: z.string().max(160).optional().nullable(),
  durationSeconds: z.number().int().min(0).max(300).optional().nullable(),
  choices: z.array(z.string().min(1).max(60)).max(6).optional().nullable(),
  memoryUse: z.object({ anchorId: z.string().max(40), callbackType: z.string().max(20) }).optional().nullable(),
  memoryCapture: z.object({ enabled: z.boolean(), promptLabel: z.string().max(40), tags: z.array(z.string().max(20)).max(4) }).optional().nullable(),
  energyDelta: z
    .object({ humor: z.number(), closeness: z.number(), spark: z.number(), curiosity: z.number() })
    .optional()
    .nullable(),
});
export type AiScene = z.infer<typeof aiSceneSchema>;

export const directorContextSchema = z.object({
  sessionKey: z.string().min(3).max(80).optional(),
  gameId: z.string().min(1).max(40).optional(),
  players: z.tuple([z.string().max(40), z.string().max(40)]),
  currentPlayer: z.string().max(40),
  sceneNumber: z.number().int().min(0).max(10000),
  phase: z.number().int().min(0).max(4),
  consent: z.object({ touch: z.boolean(), sensual: z.boolean(), drinks: z.boolean(), signals: z.boolean(), intensityCap: z.number().int().min(1).max(5) }),
  steer: z.enum(["funnier", "flirtier", "game", "hotter"]).nullable(),
  recent: z.array(z.string().max(120)).max(5),
  anchors: z.array(z.object({ id: z.string().max(40), owner: z.string().max(40), text: z.string().max(120) })).max(6),
  recentTypes: z.array(z.string().max(20)).max(10),
  wantTypes: z.array(z.string().max(20)).max(6).optional(),
  intensityCap: z.number().int().min(1).max(5),
  skipCount: z.number().int().min(0).max(10000),
  personalization: z.object({
    vibe: z.enum(["chill", "funny", "wild", "flirty", "mixed"]).nullable(),
    intensity: z.number().int().min(1).max(5),
    insiders: z.array(z.string().max(60)).max(6),
    taboo: z.array(z.string().max(60)).max(6),
  }).optional(),
});

const BANNED = /(porn|nackt ausziehen|sex haben|zwing|demütig|erniedrig|schlag|würg|betrunken|trink aus|exen)/i;

function flavorOf(s: AiScene): Flavor {
  const d = s.energyDelta;
  if (s.type === "GLITCH" || s.type === "SYNC" || s.type === "PREDICTION" || s.type === "TIMER") return "game";
  if (!d) return "funny";
  const max = Math.max(d.humor, d.closeness, d.spark, d.curiosity);
  if (max === d.spark) return "cheeky";
  if (max === d.closeness) return "deep";
  return "funny";
}

/** Validate + map one AI scene. Returns null when malformed or unsafe. */
export function toScene(raw: unknown, players: [string, string], phase: number, sensualAllowed: boolean): Scene | null {
  const parsed = aiSceneSchema.safeParse(raw);
  if (!parsed.success) return null;
  const s = parsed.data;
  if (BANNED.test(`${s.title} ${s.prompt} ${s.helperText ?? ""}`)) return null;
  if (!players.includes(s.targetPlayer)) return null;
  if (s.type === "TIMER" && !s.durationSeconds) return null;
  const other = players[0] === s.targetPlayer ? players[1] : players[0];
  // Convert names back to placeholders so the shell renders consistently.
  const ph = (txt: string) => txt.replaceAll(s.targetPlayer, "{me}").replaceAll(other, "{you}");
  const type: SceneType = s.type === "PRIVATE_SIGNAL" ? "SECRET" : s.type;
  const sensualHint = /kuss|küss|berühr|nacken|haut|flüster/i.test(s.prompt);
  if (sensualHint && !sensualAllowed) return null;
  return enforceContract({
    id: `ai-${s.id}`.slice(0, 64),
    type,
    flavor: flavorOf(s),
    phase,
    title: s.title,
    prompt: type === "SECRET" && !s.prompt.includes(s.targetPlayer) ? `Nur für {me}: ${ph(s.prompt)}` : ph(s.prompt),
    helper: s.helperText ?? undefined,
    emoji: s.emoji || "✦",
    duration: s.durationSeconds ?? undefined,
    choices: s.choices?.map(ph) ?? undefined,
    capture: s.memoryCapture?.enabled ? { label: s.memoryCapture.promptLabel || "Merken", tags: s.memoryCapture.tags } : undefined,
    flags: sensualHint ? { sensual: true, touch: /berühr|kuss|küss|nacken|haut/i.test(s.prompt) } : undefined,
    source: "ai",
  });
}