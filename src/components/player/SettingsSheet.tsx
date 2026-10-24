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
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border-line bg-[color-mix(in_oklab,var(--popover)_94%,black)] safe-x safe-bottom">
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
          <section className="relative mt-8 border-y border-line py-5">
            <div className="pointer-events-none absolute inset-y-0 left-4 w-px bg-violet/20" aria-hidden />
            <div className="flex items-center justify-between pl-8">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-violet/80">Privates Archiv</p>
                <h3 className="font-display mt-1 text-3xl font-normal">Memory Core · {anchors?.length ?? 0}</h3>
              </div>
              {!!anchors?.length && (
                <Btn variant="ghost" size="sm" onClick={onClearAnchors}>Alle löschen</Btn>
              )}
            </div>
            {!anchors?.length ? (
              <p className="mt-4 pl-8 text-sm leading-relaxed text-muted-foreground">Noch leer. Nur Antworten, die ihr bewusst merkt, landen hier – und verschwinden beim Neuladen.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line pl-8">
                {anchors.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{a.owner} · Szene {String(a.sceneNumber).padStart(2, "0")}{a.sensitivity === "high" ? " · privat" : ""}{a.used ? " · echo" : ""}</p>
                      <p className="font-display mt-2 break-words text-[1.35rem] leading-snug">„{a.shortText}“</p>
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

        <details className="group mt-6 border-b border-line pb-4">
          <summary className="tap flex min-h-12 cursor-pointer list-none items-center justify-between">
            <span className="eyebrow">Verlauf · nur Titel</span>
            <span className="font-display text-2xl transition-transform group-open:rotate-45">+</span>
          </summary>
          {log.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Die Nacht hat gerade erst begonnen.</p>
          ) : (
            <ol className="mt-3 divide-y divide-line text-sm text-muted-foreground">
              {log.slice(-8).reverse().map((l) => (
                <li key={l.n} className="flex justify-between gap-3 py-2">
                  <span className="truncate">{String(l.n).padStart(2, "0")} · {l.title}</span>
                  <span>{l.outcome === "skipped" ? "Skip" : l.player}</span>
                </li>
              ))}
            </ol>
          )}
        </details>

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