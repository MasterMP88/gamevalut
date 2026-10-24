import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export type AiProfile = "lite" | "premium";
export type AiProviderFailure = "unavailable" | "credits" | "rate" | "invalid";

export type AiProviderResult =
  | { ok: true; text: string }
  | { ok: false; reason: AiProviderFailure };

function modelFor(profile: AiProfile) {
  if (profile === "lite") {
    return process.env["NOCTURNE_AI_LITE_MODEL"] || "gpt-6-luna";
  }
  return process.env["NOCTURNE_AI_PREMIUM_MODEL"] || "gpt-6.1-sol";
}

export async function generateAiText(input: {
  profile: AiProfile;
  system: string;
  user: string;
  signal?: AbortSignal;
  maxOutputTokens?: number;
}): Promise<AiProviderResult> {
  if (process.env["NOCTURNE_AI_ENABLED"] !== "true") {
    return { ok: false, reason: "unavailable" };
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return { ok: false, reason: "unavailable" };

  const provider = createOpenAI({ apiKey });

  try {
    const result = streamText({
      model: provider.responses(modelFor(input.profile)) as unknown as Parameters<
        typeof streamText
      >[0]["model"],
      system: input.system,
      messages: [{ role: "user", content: input.user }],
      maxRetries: 0,
      maxOutputTokens:
        input.maxOutputTokens ?? (input.profile === "lite" ? 3_600 : 2_000),
      ...(input.signal ? { abortSignal: input.signal } : {}),
      providerOptions:
        input.profile === "premium"
          ? {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            }
          : {
              openai: {
                store: false,
              },
            },
    });

    return { ok: true, text: await result.text };
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 402 || status === 403) return { ok: false, reason: "credits" };
    if (status === 429) return { ok: false, reason: "rate" };

    console.error("ai provider failed", status ?? (error as Error)?.message);
    return { ok: false, reason: "unavailable" };
  }
}

export function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}
