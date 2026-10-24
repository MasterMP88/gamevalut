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
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="eyebrow">Memory Core · {anchors?.length ?? 0}</h3>
              {!!anchors?.length && (
                <Btn variant="ghost" size="sm" onClick={onClearAnchors}>Alle löschen</Btn>
              )}
            </div>
            {!anchors?.length ? (
              <p className="mt-3 text-sm text-muted-foreground">Noch keine Anker. Tippt bei einer Frage eure Antwort ein, um sie für ein Echo zu merken.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {anchors.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 rounded-2xl bg-surface p-4">
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow">{a.owner} · Szene {a.sceneNumber}{a.sensitivity === "high" ? " · privat" : ""}{a.used ? " · echoed" : ""}</p>
                      <p className="mt-1 break-words">„{a.shortText}“</p>
                    </div>
                    <Btn variant="ghost" size="icon" aria-label="Anker löschen" onClick={() => onDeleteAnchor?.(a.id)}>
                      <Trash2 className="size-4" />
                    </Btn>
                  </li>
                ))}
              </ul>
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