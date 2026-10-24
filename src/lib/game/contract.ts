import type { Scene, SceneType } from "./types";

/**
 * Interaction contract: a scene's wording must never promise an interaction the UI
 * does not provide. Used for local scenes (audited in tests) and AI scenes (runtime).
 */

/** Wording that implies tapping/selecting from options. */
export const CHOICE_LANGUAGE = /(optionen|wähle\b|wählst|was würdest du wählen|tippen|tippe\b|entscheide dich|eins davon|a oder b)/i;
/** Wording that implies hidden information. */
export const SECRET_LANGUAGE = /(heimlich (wählen|tippen|antworten|notieren|aufschreiben)|verdeckt|ohne dass .* sieht)/i;
/** Wording that implies predicting the partner. */
export const PREDICTION_LANGUAGE = /(was (wählt|nimmt|sagt|tippt) \{you\}|was glaubst du,? (wählt|nimmt)|tipp(e|t)? auf \{you\})/i;
/** Enumerated options inside a prompt: "A, B, C:" or "A oder B?" lists. */
const ENUMERATION = /^[^.?!,]{2,30},\s[^.?!,]{2,30},\s[^.?!,]{2,30}[:?]/;

const NEEDS_CHOICES: SceneType[] = ["CHOICE", "SYNC", "PREDICTION", "ROULETTE"];
const VERBAL: SceneType[] = ["QUESTION", "MISSION", "ECHO", "TIMER", "GLITCH"];

export type ContractIssue = "missing-choices" | "too-many-choices" | "choices-on-verbal" | "choice-language-without-choices" | "enumeration-in-question";

export function contractIssues(s: Scene): ContractIssue[] {
  const out: ContractIssue[] = [];
  const n = s.choices?.length ?? 0;
  if (NEEDS_CHOICES.includes(s.type)) {
    if (n < 2) out.push("missing-choices");
    if (s.type !== "ROULETTE" && n > 4) out.push("too-many-choices");
  }
  if (VERBAL.includes(s.type)) {
    if (n > 0) out.push("choices-on-verbal");
    else if (CHOICE_LANGUAGE.test(s.prompt) || SECRET_LANGUAGE.test(s.prompt) || PREDICTION_LANGUAGE.test(s.prompt))
      out.push("choice-language-without-choices");
    if (s.type === "QUESTION" && ENUMERATION.test(s.prompt)) out.push("enumeration-in-question");
  }
  return out;
}

/**
 * Repair what can be repaired safely, reject the rest.
 * - verbal scene with 2–4 structured choices → CHOICE (or PREDICTION when it asks about the partner)
 * - anything still violating the contract → null (caller falls back locally)
 */
export function enforceContract(s: Scene): Scene | null {
  let scene = s;
  const n = s.choices?.length ?? 0;
  if (VERBAL.includes(s.type) && s.type !== "TIMER" && n >= 2 && n <= 4) {
    scene = { ...s, type: PREDICTION_LANGUAGE.test(s.prompt) ? "PREDICTION" : "CHOICE" };
  }
  return contractIssues(scene).length ? null : scene;
}