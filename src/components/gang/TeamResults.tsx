import { useState } from "react";
import { btn } from "@/components/vault/Btn";
export function TeamResults({
  metric,
  max,
  onSubmit,
}: {
  metric: string;
  max: number;
  onSubmit: (results: Record<string, number>) => void;
}) {
  const [values, setValues] = useState({ A: "", B: "" });
  const valid = Object.values(values).every(
    (v) =>
      v !== "" &&
      Number.isInteger(Number(v)) &&
      Number(v) >= 0 &&
      Number(v) <= max,
  );
  return (
    <form
      className="mt-6 flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ A: Number(values.A), B: Number(values.B) });
      }}
    >
      <p className="text-sm text-muted-foreground">
        Vergleicht gemeinsam: {metric}. Gleichstand bleibt Gleichstand.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {(["A", "B"] as const).map((team) => (
          <label key={team} className="font-display text-3xl">
            Team {team}
            <input
              aria-label={`Ergebnis Team ${team}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              step={1}
              value={values[team]}
              onChange={(e) => setValues({ ...values, [team]: e.target.value })}
              className="mt-3 min-h-14 w-full border-b-2 border-line bg-transparent p-2 text-4xl"
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={!valid}
        className={btn({ size: "lg", className: "mt-auto w-full" })}
      >
        Ergebnis eintragen
      </button>
    </form>
  );
}
