import type { z } from "zod";
import type { directorContextSchema } from "./game/ai-schema";
import { AI_POLICIES } from "./ai/policy";
import { consumeAiBudget } from "./ai/budget.server";
import { aiCacheKey, withAiCache } from "./ai/cache.server";
import { extractJsonObject, generateAiText } from "./ai/provider.server";
import {
  refundPersistentAiQuota,
  reservePersistentAiQuota,
} from "./ai/quota.server";

type Ctx = z.infer<typeof directorContextSchema>;

const PHASES = ["First Signal", "Mischief", "Patterns", "Magnetic", "After Hours"];
const BATCH_SIZE = AI_POLICIES.director.maxItemsPerCall;

const INSTRUCTIONS = [
  "Du bist der unsichtbare, witzige Gastgeber (Director) von NOCTURNE, einem Spiel für zwei einvernehmliche Erwachsene. Du schreibst kurze Szenen auf Deutsch.",
  "Ton: klug, konkret, verspielt, überraschend, erwachsen und leicht frech. Umgangssprachlich, kein Fragebogen-Deutsch.",
  "Kein Therapie-Ton, keine Erklärungen und keine Meta-Kommentare. Ein klarer Hook pro Szene.",
  "title: 2–5 Wörter. prompt: maximal 120 Zeichen.",
  "Erotik nur angedeutet, nie explizit. Keine Nötigung, Demütigung oder Gewalt. Alles Körperliche optional und gegenseitig.",
  "Alkohol nie als Strafe oder Pflicht. Halte Consent-Einstellungen und Intensitätsgrenze strikt ein.",
  "targetPlayer wechselt strikt zwischen den beiden Spielern, beginnend mit currentPlayer.",
  "INTERAKTIONSVERTRAG:",
  "QUESTION: laut beantworten; keine Auswahl im Text; choices leer.",
  "CHOICE: 2–4 kurze Optionen nur im choices-Array.",
  "PREDICTION: targetPlayer tippt heimlich eine Vorhersage, dann wählt der andere; 2–4 choices.",
  "SYNC: beide wählen nacheinander verdeckt dieselbe Frage, dann Auflösung; 2–4 choices.",
  "PRIVATE_SIGNAL: geheime Anweisung nur für targetPlayer; choices leer.",
  "MISSION: etwas tun; choices leer. TIMER: wie MISSION mit durationSeconds 20–120. GLITCH: neue kurze Regel. ECHO: Callback mit memoryUse.anchorId.",
  "Alles Geheime ist PRIVATE_SIGNAL, SYNC oder PREDICTION.",
  "DRAMATURGIE: komponiere Formate, nicht nur Fragen. Nutze recentTypes und wantTypes. Kein Typ häufiger als nötig.",
  "Pacing: lustig → Überraschung → Nähe → verspielte Spannung → Erholung → Callback.",
  "Höchstens ein ECHO pro Batch. Nach einer intensiven Szene folgt eine leichtere.",
  'Antwort ausschließlich als JSON: {"scenes":[...]} mit genau ' +
    BATCH_SIZE +
    " Szenen im bestehenden Director-Schema.",
].join("\n");

export type DirectorResult =
  | { ok: true; scenesJson: string; cacheHit: boolean }
  | {
      ok: false;
      reason: "unavailable" | "credits" | "rate" | "invalid" | "budget";
    };

export async function runDirector(
  ctx: Ctx,
  userId?: string | null,
  signal?: AbortSignal,
): Promise<DirectorResult> {
  const sessionKey =
    ctx.sessionKey ||
    "legacy:" + ctx.players.join(":") + ":" + String(ctx.gameId || "director");

  const cacheKey = await aiCacheKey("director", {
    ...ctx,
    batchSize: BATCH_SIZE,
  });

  const generated = await withAiCache(
    cacheKey,
    AI_POLICIES.director.cacheTtlMs,
    async () => {
      const persistent = await reservePersistentAiQuota({
        userId,
        capability: "director",
        units: BATCH_SIZE,
      });
      if (!persistent.allowed) {
        return { ok: false as const, reason: "budget" as const };
      }

      const sessionBudget = consumeAiBudget({
        sessionKey,
        capability: "director",
        items: BATCH_SIZE,
        sceneNumber: ctx.sceneNumber,
      });
      if (!sessionBudget.allowed) {
        await refundPersistentAiQuota({
          userId,
          capability: "director",
          units: BATCH_SIZE,
        });
        return { ok: false as const, reason: "budget" as const };
      }

      const user = JSON.stringify({
        ...ctx,
        phaseName: PHASES[ctx.phase],
        steerHint: ctx.steer,
      });

      const result = await generateAiText({
        profile: "premium",
        system: INSTRUCTIONS,
        user:
          "Kontext: " +
          user +
          "\nSchreibe die nächsten " +
          BATCH_SIZE +
          " Szenen.",
        maxOutputTokens: 1_800,
        ...(signal ? { signal } : {}),
      });

      if (!result.ok) {
        await refundPersistentAiQuota({
          userId,
          capability: "director",
          units: BATCH_SIZE,
        });
        return result;
      }

      const json = extractJsonObject(result.text);
      if (!json || typeof json !== "object") {
        return { ok: false as const, reason: "invalid" as const };
      }

      const scenes = (json as { scenes?: unknown }).scenes;
      if (!Array.isArray(scenes) || scenes.length < 1) {
        return { ok: false as const, reason: "invalid" as const };
      }

      return {
        ok: true as const,
        scenesJson: JSON.stringify(scenes.slice(0, BATCH_SIZE)),
      };
    },
    (value) => value.ok,
  );

  if (!generated.value.ok) return generated.value;
  return {
    ...generated.value,
    cacheHit: generated.cacheHit,
  };
}
