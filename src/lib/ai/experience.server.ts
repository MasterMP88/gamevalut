import { AI_POLICIES, type AiCapability } from "./policy";
import { aiCacheKey, withAiCache } from "./cache.server";
import { consumeAiBudget } from "./budget.server";
import {
  experienceRequestSchema,
  judgeResultSchema,
  musicClueResultSchema,
  personalizedPackSchema,
  secretMissionResultSchema,
  type ExperienceRequest,
} from "./experience-schema";
import { extractJsonObject, generateAiText, type AiProfile } from "./provider.server";

export type ExperienceResult =
  | {
      ok: true;
      kind: ExperienceRequest["kind"];
      json: string;
      cacheHit: boolean;
    }
  | {
      ok: false;
      reason: "invalid" | "unavailable" | "credits" | "rate" | "budget";
    };

const COMMON =
  "Du bist die unsichtbare Game-Experience-KI von NOCTURNE. " +
  "Schreibe knapp, modern, witzig und spielbar. Kein Therapie-Ton, kein Fragebogen-Ton. " +
  "Keine Gewalt, Nötigung, Demütigung oder explizite Sexualität. " +
  "Alkohol ist nie Pflicht, Strafe oder Mutprobe. " +
  "Grenzen und Tabuthemen sind absolut. Antworte ausschließlich mit dem verlangten JSON.";

function capabilityFor(request: ExperienceRequest): AiCapability {
  if (request.kind === "personalize-pack") return "personalize-pack";
  if (request.kind === "judge") return "judge";
  if (request.kind === "secret-mission") return "secret-mission";
  return "music-clue";
}

function itemCount(request: ExperienceRequest) {
  if (request.kind === "judge") return request.entries.length;
  return request.count;
}

function profileFor(capability: AiCapability): AiProfile {
  return AI_POLICIES[capability].mode === "ai-premium" ? "premium" : "lite";
}

function maxOutputTokensFor(request: ExperienceRequest) {
  if (request.kind === "personalize-pack") return 3_600;
  if (request.kind === "secret-mission") return 1_200;
  if (request.kind === "judge") return 700;
  return 700;
}

function promptFor(request: ExperienceRequest) {
  if (request.kind === "personalize-pack") {
    return {
      system:
        COMMON +
        " Erzeuge einen personalisierten Party-Pack. Nutze freiwillige Fakten nur subtil; nie wie ein Dossier. " +
        "Mische echte digitale Formate statt nur Fragen. Tabuthemen dürfen weder direkt noch indirekt vorkommen. " +
        'JSON: {"items":[{"id":"...","format":"QUESTION|MISSION|CHOICE|PREDICTION|SYNC|SECRET","title":"...","prompt":"...","intensity":1,"tags":[]}]}',
      user: JSON.stringify(request),
    };
  }

  if (request.kind === "judge") {
    return {
      system:
        COMMON +
        " Du bist ein unterhaltsamer AI Judge. Bewerte nur die Qualität der eingereichten Antworten zur Aufgabe. " +
        "Keine Aussagen über Charakter, Attraktivität, Intelligenz oder reale Eigenschaften der Spieler. " +
        "Die Begründung soll lustig sein, nicht verletzend. " +
        'JSON: {"winnerId":"id","ranking":["id"],"headline":"...","commentary":"..."}',
      user: JSON.stringify(request),
    };
  }

  if (request.kind === "secret-mission") {
    return {
      system:
        COMMON +
        " Erzeuge harmlose geheime Social-Missions, die während anderer Games im Hintergrund funktionieren. " +
        "Keine Mission darf körperlichen Kontakt, Trinken, Bloßstellung, Täuschung mit realen Folgen oder Grenzüberschreitung verlangen. " +
        "Jeder Spieler höchstens eine Mission pro Antwort. " +
        'JSON: {"missions":[{"playerId":"id","mission":"...","reveal":"..."}]}',
      user: JSON.stringify(request),
    };
  }

  return {
    system:
      COMMON +
      " Erzeuge progressive Hinweise für ein Musik-Ratespiel, von kryptisch zu leichter. " +
      "Titel und Künstler dürfen in keinem Hinweis genannt, zitiert, buchstabiert oder eindeutig als Wortspiel verraten werden. " +
      "Nutze nur die gelieferten Metadaten; erfinde keine Chartpositionen, Preise oder biografischen Fakten. " +
      'JSON: {"clues":["..."]}',
    user: JSON.stringify(request),
  };
}

function parseOutput(request: ExperienceRequest, raw: unknown) {
  if (request.kind === "personalize-pack") return personalizedPackSchema.safeParse(raw);
  if (request.kind === "judge") return judgeResultSchema.safeParse(raw);
  if (request.kind === "secret-mission") return secretMissionResultSchema.safeParse(raw);
  return musicClueResultSchema.safeParse(raw);
}

function normalized(value: string) {
  return value
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function musicClueLeaksAnswer(request: ExperienceRequest, raw: unknown) {
  if (request.kind !== "music-clue") return false;
  const parsed = musicClueResultSchema.safeParse(raw);
  if (!parsed.success) return true;

  const title = normalized(request.track.title);
  const artist = normalized(request.track.artist);

  return parsed.data.clues.some((clue) => {
    const candidate = normalized(clue);
    return (
      (title.length >= 3 && candidate.includes(title)) ||
      (artist.length >= 3 && candidate.includes(artist))
    );
  });
}

export async function runExperience(input: unknown): Promise<ExperienceResult> {
  const parsed = experienceRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const request = parsed.data;
  const capability = capabilityFor(request);
  const policy = AI_POLICIES[capability];
  const items = itemCount(request);
  const cacheKey = aiCacheKey(capability, request);

  const generated = await withAiCache(
    cacheKey,
    policy.cacheTtlMs,
    async () => {
      const budget = consumeAiBudget({
        sessionKey: request.sessionKey,
        capability,
        items,
      });

      if (!budget.allowed) {
        return { ok: false as const, reason: "budget" as const };
      }

      const prompt = promptFor(request);
      const result = await generateAiText({
        profile: profileFor(capability),
        system: prompt.system,
        user: prompt.user,
        maxOutputTokens: maxOutputTokensFor(request),
      });

      if (!result.ok) return result;

      const json = extractJsonObject(result.text);
      if (!json || musicClueLeaksAnswer(request, json)) {
        return { ok: false as const, reason: "invalid" as const };
      }

      const output = parseOutput(request, json);
      if (!output.success) {
        return { ok: false as const, reason: "invalid" as const };
      }

      return {
        ok: true as const,
        json: JSON.stringify(output.data),
      };
    },
    (value) => value.ok,
  );

  if (!generated.value.ok) return generated.value;

  return {
    ok: true,
    kind: request.kind,
    json: generated.value.json,
    cacheHit: generated.cacheHit,
  };
}
