import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Btn } from "@/components/vault/Btn";
import { PrivacyDialog } from "@/components/vault/PrivacyDialog";
import type { ConsentSettings, MemoryAnchor, LogEntry } from "@/lib/game/types";
import { Trash2 } from "lucide-react";

const LABELS: { key: keyof Omit<ConsentSettings, "intensityCap">; label: string; hint: string }[] = [
  { key: "touch", label: "Berührung", hint: "Aufgaben mit Körperkontakt" },
  { key: "sensual", label: "Sinnliches", hint: "Flirty & sinnliche Szenen" },
  { key: "drinks", label: "Drinks", hint: "Immer optional, nie Pflicht" },
  { key: "signals", label: "Private Signale", hint: "Geheime Zeichen erfinden" },
];

const INTENSITY = ["Sanft", "Verspielt", "Frech", "Magnetisch", "After Hours"];
const MEMORY_KIND: Record<string, string> = {
  funny: "Running Gag",
  emotional: "Nachhall",
  flirty: "Spannung",
  future: "Später",
  prediction: "Vorhersage",
  ritual: "Ritual",
};

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  onSettings,
  anchors,
  onDeleteAnchor,
  onClearAnchors,
  log,
  memory,
  onEnd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  settings: ConsentSettings;
  onSettings: (s: ConsentSettings) => void;
  anchors?: MemoryAnchor[];
  onDeleteAnchor?: (id: string) => void;
  onClearAnchors?: () => void;
  log: LogEntry[];
  memory: boolean;
  onEnd: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border-line bg-popover safe-x safe-bottom">
        <SheetHeader className="px-0 text-left">
          <p className="eyebrow">Live-Einstellungen</p>
          <SheetTitle className="font-display text-4xl font-normal">Euer Rahmen.</SheetTitle>
          <SheetDescription>Änderungen gelten sofort – auch für die aktuelle Szene.</SheetDescription>
        </SheetHeader>

        <div className="mt-2 divide-y divide-line">
          {LABELS.map((l) => (
            <label key={l.key} className="flex min-h-16 items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-base">{l.label}</span>
                <span className="text-sm text-muted-foreground">{l.hint}</span>
              </span>
              <Switch checked={settings[l.key]} onCheckedChange={(v) => onSettings({ ...settings, [l.key]: v })} />
            </label>
          ))}
          <div className="py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-base">Intensität bis</span>
              <span className="font-display text-2xl">{INTENSITY[settings.intensityCap - 1]}</span>
            </div>
            <Slider
              className="mt-4"
              min={1}
              max={5}
              step={1}
              value={[settings.intensityCap]}
              onValueChange={([v]) => onSettings({ ...settings, intensityCap: v ?? settings.intensityCap })}
              aria-label="Intensität"
            />
          </div>
        </div>

        {memory && (
          <section className="mt-8 border-t border-line pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-violet">Session Archive</p>
                <h3 className="font-display mt-1 text-3xl font-normal">Was nachhallen darf.</h3>
              </div>
              <span className="font-mono text-sm tabular-nums text-violet">{String(anchors?.length ?? 0).padStart(2, "0")}</span>
            </div>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">Nur in diesem Tab. Private Notizen bleiben auch für den Director unsichtbar.</p>
            {!anchors?.length ? (
              <div className="mt-6 border-y border-line py-7">
                <svg viewBox="0 0 120 34" className="h-8 w-28 text-violet/55" fill="none" stroke="currentColor" aria-hidden>
                  <circle cx="18" cy="17" r="3" />
                  <circle cx="18" cy="17" r="9" opacity=".55" />
                  <circle cx="18" cy="17" r="15" opacity=".25" />
                  <path d="M34 17 H116" strokeDasharray="2 5" opacity=".55" />
                </svg>
                <p className="font-display mt-4 text-xl text-muted-foreground">Noch nichts archiviert.</p>
                <p className="mt-1 text-sm text-muted-foreground/75">Bei passenden Szenen könnt ihr eine Antwort optional fürs Echo merken.</p>
              </div>
            ) : (
              <ol className="mt-6 border-y border-line">
                {anchors.map((a, i) => (
                  <li key={a.id} className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-line py-4 last:border-b-0">
                    <span className="font-mono text-[10px] tabular-nums text-violet/75">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="eyebrow">{a.owner} · Szene {a.sceneNumber}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-violet/75">{MEMORY_KIND[a.kind ?? ""] ?? "Notiz"}</span>
                      </div>
                      <p className="font-display mt-2 break-words text-[1.45rem] leading-snug">„{a.shortText}“</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {a.sensitivity === "high" ? "Privat · bleibt nur hier" : a.used ? "Ist bereits nachgehallt" : "Callback-ready"}
                      </p>
                    </div>
                    <button type="button" className="tap flex min-h-11 min-w-11 items-center justify-center self-start text-muted-foreground hover:text-primary" aria-label="Anker löschen" onClick={() => onDeleteAnchor?.(a.id)}>
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {!!anchors?.length && (
              <Btn variant="ghost" size="sm" className="mt-3 px-0" onClick={onClearAnchors}>Archiv leeren</Btn>
            )}
          </section>
        )}

        <section className="mt-6">
          <h3 className="eyebrow">Verlauf · nur Titel</h3>
          {log.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Die Nacht hat gerade erst begonnen.</p>
          ) : (
            <ol className="mt-3 space-y-1 text-sm text-muted-foreground">
              {log.slice(-8).reverse().map((l) => (
                <li key={l.n} className="flex justify-between gap-3">
                  <span className="truncate">{l.n}. {l.title}</span>
                  <span>{l.outcome === "skipped" ? "übersprungen" : l.player}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <PrivacyDialog>
            <Btn variant="outline">Privacy &amp; AI</Btn>
          </PrivacyDialog>
          <Btn variant="outline" onClick={onEnd}>Nacht beenden</Btn>
        </div>
      </SheetContent>
    </Sheet>
  );
}