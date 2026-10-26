import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getGangPlaybook } from "@/lib/gang/core/playbooks";
import type {
  MissionNight,
  MissionReport,
  MissionAssignment,
} from "@/lib/gang/core/missions";
import type { GangRuntimePlayer } from "@/lib/gang/core/runtime";
import { Secret } from "./GangPlayer";
import { btn } from "@/components/vault/Btn";
import { cn } from "@/lib/utils";

export function MissionDrawer({
  players,
  me,
  own,
  night,
  claimed = false,
  accused = false,
  disabled = false,
  onEvent,
}: {
  players: GangRuntimePlayer[];
  me?: string | undefined;
  own?: MissionAssignment | undefined;
  night?: MissionNight | undefined;
  claimed?: boolean;
  accused?: boolean;
  disabled?: boolean;
  onEvent: (
    playerId: string,
    kind: "claim" | "accuse",
    payload: Record<string, unknown>,
  ) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [person, setPerson] = useState(me ?? ""),
    [target, setTarget] = useState(""),
    [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [sent, setSent] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  const id = me ?? person;
  const mission = night?.assignments[id] ?? own;
  const didClaim =
    claimed ||
    sent[`${id}:claim`] ||
    night?.events.some((e) => e.playerId === id && e.kind === "claim");
  const didAccuse =
    accused ||
    sent[`${id}:accuse`] ||
    night?.events.some((e) => e.playerId === id && e.kind === "accuse");
  const submit = async (
    kind: "claim" | "accuse",
    payload: Record<string, unknown>,
  ) => {
    if (busy || !id) return;
    setBusy(true);
    setError(null);
    try {
      await onEvent(id, kind, payload);
      setSent((s) => ({ ...s, [`${id}:${kind}`]: true }));
    } catch {
      setError(
        "Die Meldung konnte nicht versiegelt werden. Versuch es nochmal.",
      );
    } finally {
      setBusy(false);
    }
  };
  const selectClass =
    "mt-2 min-h-12 w-full rounded-md border border-line bg-background px-3 text-base";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(btn({ variant: "outline", size: "sm" }), "mt-4 w-full")}
        >
          Geheime Mission · läuft nebenbei
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Deine Nebenmission</DialogTitle>
          <DialogDescription>
            2 Punkte für unbemerktes Erfüllen. Ein gut begründeter Verdacht ist
            pro Person möglich; ein Treffer zählt 1 Punkt. Auflösung erst am
            Ende.
          </DialogDescription>
        </DialogHeader>
        {!me && (
          <label className="text-sm">
            Handy an …
            <select
              className={selectClass}
              value={person}
              onChange={(e) => {
                setPerson(e.target.value);
                setTarget("");
                setGuess("");
              }}
            >
              <option value="">Deinen Namen auswählen</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {mission && id && (
          <>
            <Secret label="NUR FÜR DICH">
              <span className="font-display text-2xl">{mission.text}</span>
            </Secret>
            <button
              type="button"
              disabled={busy || !!didClaim}
              onClick={() => void submit("claim", {})}
              className={cn(btn({ size: "lg" }), "mt-3 w-full")}
            >
              {didClaim
                ? "Erfüllung versiegelt ✓"
                : "Mission unbemerkt erfüllt"}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Ehrlich melden, sobald es passiert ist. Spätere Enttarnung nimmt
              dir die bereits erfüllte Mission nicht weg.
            </p>
            {didAccuse ? (
              <p className="mt-4 text-sm">
                Dein Verdacht ist versiegelt. Auflösung am Ende.
              </p>
            ) : (
              <fieldset className="mt-5 border-t border-line pt-4">
                <legend className="text-sm">Eine Person durchschaut?</legend>
                <label className="mt-2 block text-sm">
                  Wer?
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Person auswählen</option>
                    {players
                      .filter((p) => p.id !== id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="mt-3 block text-sm">
                  Welche Mission vermutest du?
                  <select
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Vermuteten Auftrag auswählen</option>
                    {getGangPlaybook("secret-missions")!.prompts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.prompt}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busy || !target || !guess}
                  onClick={() =>
                    void submit("accuse", {
                      targetId: target,
                      missionId: guess,
                    })
                  }
                  className={cn(
                    btn({ variant: "outline", size: "lg" }),
                    "mt-3 w-full",
                  )}
                >
                  Einmaligen Verdacht versiegeln
                </button>
              </fieldset>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-primary">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MissionFinale({ report }: { report: MissionReport }) {
  return (
    <section className="my-6" aria-labelledby="mission-recap">
      <p className="font-mono text-xs tracking-widest text-signal">
        DAS LIEF DIE GANZE ZEIT
      </p>
      <h2 id="mission-recap" className="font-display mt-2 text-4xl">
        Die Missionen fliegen auf.
      </h2>
      <ol className="mt-5 divide-y divide-line">
        {report.timeline.map((t) => (
          <li key={t.playerId} className="py-4">
            <p className="flex justify-between gap-3">
              <strong>{t.name}</strong>
              <span>{report.scores[t.playerId] ?? 0} Punkte</span>
            </p>
            <p className="mt-2 text-sm">{t.mission}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.status === "complete"
                ? "Unbemerkt geschafft"
                : t.status === "caught"
                  ? "Vorher durchschaut"
                  : "Diesmal offen geblieben"}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">
        {report.correctSuspicions.length} richtige Verdachtsmeldungen. Welche
        Szene habt ihr jetzt erst verstanden?
      </p>
    </section>
  );
}
