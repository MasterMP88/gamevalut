import { z } from "zod";

const sessionKey = z.string().min(3).max(80);
const safeShort = z.string().trim().min(1).max(120);

export const personalizePackRequestSchema = z.object({
  kind: z.literal("personalize-pack"),
  aiConsent: z.literal(true),
  sessionKey,
  locale: z.enum(["de", "en"]).default("de"),
  playerCount: z.number().int().min(2).max(99),
  names: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  vibe: z.enum(["chill", "funny", "wild", "flirty", "mixed"]),
  intensity: z.number().int().min(1).max(5),
  optedInFacts: z.array(safeShort).max(12).default([]),
  tabooTopics: z.array(safeShort).max(12).default([]),
  count: z.number().int().min(6).max(40).default(24),
});

export const judgeRequestSchema = z.object({
  kind: z.literal("judge"),
  aiConsent: z.literal(true),
  sessionKey,
  locale: z.enum(["de", "en"]).default("de"),
  prompt: z.string().trim().min(4).max(240),
  tone: z.enum(["witty", "chaotic", "dry", "warm"]).default("witty"),
  entries: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        label: z.string().trim().min(1).max(40),
        answer: z.string().trim().min(1).max(320),
      }),
    )
    .min(2)
    .max(12),
});

export const secretMissionRequestSchema = z.object({
  kind: z.literal("secret-mission"),
  aiConsent: z.literal(true),
  sessionKey,
  locale: z.enum(["de", "en"]).default("de"),
  players: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        name: z.string().trim().min(1).max(40),
      }),
    )
    .min(2)
    .max(12),
  vibe: z.enum(["funny", "wild", "flirty", "mixed"]),
  intensity: z.number().int().min(1).max(5),
  tabooTopics: z.array(safeShort).max(12).default([]),
  count: z.number().int().min(1).max(12),
});

export const musicClueRequestSchema = z.object({
  kind: z.literal("music-clue"),
  aiConsent: z.literal(true),
  sessionKey,
  locale: z.enum(["de", "en"]).default("de"),
  track: z.object({
    title: z.string().trim().min(1).max(160),
    artist: z.string().trim().min(1).max(160),
    year: z.number().int().min(1900).max(2100).optional(),
    genre: z.string().trim().max(80).optional(),
  }),
  difficulty: z.number().int().min(1).max(5),
  count: z.number().int().min(2).max(8).default(4),
});

export const experienceRequestSchema = z.discriminatedUnion("kind", [
  personalizePackRequestSchema,
  judgeRequestSchema,
  secretMissionRequestSchema,
  musicClueRequestSchema,
]);

export const personalizedPackSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        format: z.enum([
          "QUESTION",
          "MISSION",
          "CHOICE",
          "PREDICTION",
          "SYNC",
          "SECRET",
        ]),
        title: z.string().min(2).max(60),
        prompt: z.string().min(4).max(260),
        intensity: z.number().int().min(1).max(5),
        tags: z.array(z.string().max(30)).max(5).default([]),
      }),
    )
    .min(1)
    .max(40),
});

export const judgeResultSchema = z.object({
  winnerId: z.string().min(1).max(40),
  ranking: z.array(z.string().min(1).max(40)).min(2).max(12),
  headline: z.string().min(2).max(100),
  commentary: z.string().min(4).max(420),
});

export const secretMissionResultSchema = z.object({
  missions: z
    .array(
      z.object({
        playerId: z.string().min(1).max(40),
        mission: z.string().min(4).max(220),
        reveal: z.string().min(2).max(140),
      }),
    )
    .min(1)
    .max(12),
});

export const musicClueResultSchema = z.object({
  clues: z.array(z.string().min(3).max(160)).min(2).max(8),
});

export type ExperienceRequest = z.infer<typeof experienceRequestSchema>;
