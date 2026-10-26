import type { GangOptionalMechanics } from "@/lib/gang/core/runtime";
import type { GangGameId } from "@/lib/gang/core/playbooks";

export function OptionalMechanics({ games, value, onChange }: { games: readonly GangGameId[]; value: GangOptionalMechanics; onChange: (value: GangOptionalMechanics) => void }) {
  if (!games.some(g => g === "the-line" || g === "after-dark")) return null;
  return <fieldset className="my-5 border-y border-line py-3">
    <legend className="eyebrow">Freiwillige Extras</legend>
    {games.includes("the-line") && <label className="flex min-h-14 items-start gap-3 py-3 text-sm"><input className="mt-1 size-5 shrink-0" type="checkbox" checked={!!value.linePredictions} onChange={e=>onChange({...value,linePredictions:e.target.checked})} /><span>THE LINE · Nachbarschaft tippen<span className="mt-1 block text-muted-foreground">Vorher verdeckt eine benachbarte Person tippen. Nach dem Aufstellen erfasst ihr die Reihenfolge. Ein richtiger direkter Nachbar gibt einen Bonuspunkt.</span></span></label>}
    {games.includes("after-dark") && <label className="flex min-h-14 items-start gap-3 py-3 text-sm"><input className="mt-1 size-5 shrink-0" type="checkbox" checked={!!value.afterDarkReactions} onChange={e=>onChange({...value,afterDarkReactions:e.target.checked})} /><span>AFTER DARK · Reaktionen sammeln<span className="mt-1 block text-muted-foreground">Freiwillig Lachen, Überraschung oder Verbundenheit wählen. Nur die Anzahl erscheint – keine Namen und keine Punkte.</span></span></label>}
    <p className="text-xs text-muted-foreground">Extras verlängern die einzelnen Runden. Jede Person darf ihren Tipp oder ihre Reaktion auslassen.</p>
  </fieldset>;
}
