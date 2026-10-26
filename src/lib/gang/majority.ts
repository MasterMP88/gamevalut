/* THE MAJORITY result view-model: derived only from canonical runtime submissions via resolveMajorityRound. */
import { resolveMajorityRound } from "./core/mechanics";
import type { GangRuntimeState } from "./core/runtime";
import type { GangStageKind } from "./core/playbooks";

export interface MajorityResultData {
  options: string[];
  counts: Record<string, number>;
  winners: string[];
  /** players whose PREDICTION matched the majority (+1, canonical) */
  correct: string[];
  total: number;
  eligible: number;
}

/** Derived only from canonical answer/predict submissions via resolveMajorityRound. Predictions never count as votes. */
export function majorityResult(rt: GangRuntimeState): MajorityResultData | null {
  if (rt.gameId !== "the-majority") return null;
  const subs = (stage: GangStageKind) => rt.round.stageSubmissions[rt.round.stages.indexOf(stage)] ?? {};
  const val = (a: { optionId?: string; value?: string }) => a.optionId ?? a.value ?? "";
  const options = rt.round.prompt.options ?? [];
  const votes = Object.fromEntries(Object.values(subs("answer")).map((a): [string, string] => [a.playerId, val(a)]).filter(([, v]) => options.includes(v)));
  const preds = Object.fromEntries(Object.values(subs("predict")).map((a) => [a.playerId, val(a)]));
  const r = resolveMajorityRound({ playerIds: rt.players.map((p) => p.id), optionIds: options, votes, predictions: preds });
  return { options, counts: r.counts, winners: r.majorityOptionIds, correct: r.correctPredictorIds, total: Object.keys(votes).length, eligible: rt.players.length };
}
