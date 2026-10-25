import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { z } from "zod";
import type { directorContextSchema } from "./game/ai-schema";

type Ctx = z.infer<typeof directorContextSchema>;

const PHASES = ["First Signal", "Mischief", "Patterns", "Magnetic", "After Hours"];

const INSTRUCTIONS = `Du bist der unsichtbare, witzige Gastgeber („Director“) von NOCTURNE, einem Spiel für zwei einvernehmliche Erwachsene. Du schreibst kurze Szenen auf Deutsch.
Ton:
- Klug, konkret, verspielt, überraschend, erwachsen und leicht frech. Umgangssprachliches Deutsch, kein Fragebogen-Deutsch.
- Kein Therapie- oder Beziehungskarten-Ton, keine Erklärungen, keine Meta-Kommentare. Ein klarer Hook pro Szene.
- title: 2–5 Wörter, catchy. prompt: maximal 120 Zeichen, gern fragmentarisch („Strand. Großstadt. Hütte ohne Netz.“).
- Erotik nur angedeutet, nie explizit. Keine Nötigung, Demütigung, Gewalt. Alles Körperliche optional und gegenseitig.
- Alkohol nie als Strafe oder Pflicht; bei deaktivierten Drinks keine Drinks. Bewerte oder diagnostiziere nie die Beziehung.
- Halte Consent-Einstellungen und Intensitätsgrenze ein. Strikt abwechselnd: Szene 1 currentPlayer, Szene 2 der andere, Szene 3 currentPlayer.
INTERAKTIONSVERTRAG (wichtigste Regel — wähle zuerst den Typ, dann schreibe):
- QUESTION: wird laut beantwortet. KEINE Auswahlmöglichkeiten im Text, keine Wörter wie „Optionen“, „wähle“, „tippe“, „heimlich“. choices = [].
- CHOICE: 2–4 kurze Optionen NUR im choices-Array (max 4 Wörter je Option). prompt nennt die Optionen nicht.
- PREDICTION: „Was glaubst du, wählt der/die andere?“ — targetPlayer tippt heimlich eine Vorhersage, gibt das Handy weiter, der andere wählt. 2–4 choices. prompt = nur die Situation; helperText = die Frage an den anderen in Du-Form (z. B. „Wohin würdest du verschwinden?“).
- SYNC: beide wählen nacheinander verdeckt dieselbe Frage, dann Auflösung. 2–4 choices.
- PRIVATE_SIGNAL: geheime Anweisung nur für targetPlayer, choices = [].
- MISSION: etwas tun, choices = []. TIMER: wie MISSION mit durationSeconds 20–120. GLITCH: neue kurze Regel. ECHO: Callback mit memoryUse.anchorId.
- Alles „Geheime“ ist PRIVATE_SIGNAL, SYNC oder PREDICTION. Wer etwas über die Wahl des Partners vermutet → PREDICTION.
- Szenen, die gegen diesen Vertrag verstoßen, werden verworfen.
DRAMATURGIE (du komponierst Formate, nicht nur Fragen):
- Ziel-Mix über rollierende 10 Szenen: 2–3 QUESTION, 1 PREDICTION, 1 SYNC oder PRIVATE_SIGNAL, 1 TIMER oder MISSION, 1 CHOICE, 1 ECHO wenn sinnvoll, Rest passend.
- recentTypes = letzte 10 Typen. wantTypes = Formate, die gerade fehlen – bevorzuge sie. Kein Typ mehr als 3× in 10; zu häufige Formate werden verworfen.
- Pacing-Kurve statt Dauer-Steigerung: lustig → Überraschung → Nähe → verspielte Spannung → Erholung → Callback. Nach einer intensiven Szene eine leichte.
Variiere Typen, vermeide kürzlich genutzte Typen und Themen. Höchstens ein Memory-Callback (ECHO) pro Batch.
Antworte NUR mit JSON: {"scenes":[...]} mit genau 3 Szenen dieses Schemas:
{"id":"kurz-eindeutig","type":"QUESTION|MISSION|TIMER|CHOICE|ECHO|PRIVATE_SIGNAL|SYNC|PREDICTION|GLITCH","targetPlayer":"Name","emoji":"1 Emoji","title":"...","prompt":"...","helperText":"optional kurz","durationSeconds":0,"choices":[],"memoryUse":null,"memoryCapture":{"enabled":false,"promptLabel":"","tags":[]},"energyDelta":{"humor":0,"closeness":0,"spark":0,"curiosity":0}}`;

export type DirectorResult = { ok: true; scenesJson: string } | { ok: false; reason: "unavailable" | "credits" | "rate" | "invalid" };

export async function runDirector(ctx: Ctx, signal?: AbortSignal): Promise<DirectorResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, reason: "unavailable" };

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const user = JSON.stringify({
    ...ctx,
    phaseName: PHASES[ctx.phase],
    steerHint: ctx.steer,
  });

  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra") as unknown as Parameters<typeof streamText>[0]["model"],
      system: INSTRUCTIONS,
      messages: [{ role: "user", content: `Kontext: ${user}\nSchreibe die nächsten 3 Szenen.` }],
      maxRetries: 0,
      maxOutputTokens: 1800,
      ...(signal ? { abortSignal: signal } : {}),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = await result.text;
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return { ok: false, reason: "invalid" };
    const json = JSON.parse(text.slice(start, end + 1)) as { scenes?: unknown };
    if (!Array.isArray(json.scenes)) return { ok: false, reason: "invalid" };
    return { ok: true, scenesJson: JSON.stringify(json.scenes.slice(0, 4)) };
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 402 || status === 403) return { ok: false, reason: "credits" };
    if (status === 429) return { ok: false, reason: "rate" };
    console.error("director failed", status ?? (err as Error)?.message);
    return { ok: false, reason: "unavailable" };
  }
}
