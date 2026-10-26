import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Btn } from "@/components/vault/Btn";
import { nightShare } from "@/lib/game/share";
import type { SessionState } from "@/lib/game/types";

/** Sharing is explicit; the preview is exactly the payload handed to the browser. */
export function ShareNight({ state }: { state: SessionState }) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState(false);
  const [songs, setSongs] = useState(false);
  const [moments, setMoments] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const allowed = state.anchors.filter(a => a.sensitivity === "normal").slice(-6);
  const payload = nightShare(state, { names, songs, momentIds: moments });
  const text = `${payload.text}\n\n${payload.url}`;
  const toggle = (value: boolean) => {
    setOpen(value);
    if (!value) { setNames(false); setSongs(false); setMoments([]); setStatus(""); }
  };
  const copy = async () => {
    setBusy(true);
    try { await navigator.clipboard.writeText(text); setStatus("In die Zwischenablage kopiert."); }
    catch { setStatus("Kopieren ist hier nicht verfügbar. Du kannst den Vorschautext markieren und selbst kopieren."); }
    finally { setBusy(false); }
  };
  const share = async () => {
    if (!navigator.share) { await copy(); return; }
    setBusy(true);
    try { await navigator.share(payload); setStatus("An die ausgewählte App übergeben."); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("Teilen hat nicht geklappt. Kopiere stattdessen den Vorschautext."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={toggle}>
    <DialogTrigger asChild><Btn variant="outline" className="w-full">Abend teilen · Vorschau</Btn></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto border-line bg-popover">
      <DialogHeader><DialogTitle className="font-display pr-7 text-3xl font-normal">Eure kleine Night Signature</DialogTitle><DialogDescription>Standardmäßig bleiben Namen, Antworten und Songs draußen. Wählt gemeinsam, was ihr weitergeben möchtet.</DialogDescription></DialogHeader>
      <label className="flex min-h-12 items-center gap-3"><input className="size-5" type="checkbox" checked={names} onChange={e => setNames(e.target.checked)} />Unsere Namen ergänzen</label>
      {(state.tracklist?.length ?? 0) > 0 && <label className="flex min-h-12 items-center gap-3"><input className="size-5" type="checkbox" checked={songs} onChange={e => setSongs(e.target.checked)} />Bis zu zehn Songs ergänzen</label>}
      {allowed.length > 0 && <fieldset><legend className="eyebrow">Einzelne freigegebene Momente</legend>{allowed.map(a => <label key={a.id} className="flex min-h-12 items-start gap-3 py-3 text-sm"><input className="mt-0.5 size-5 shrink-0" type="checkbox" checked={moments.includes(a.id)} onChange={e => setMoments(e.target.checked ? [...moments, a.id] : moments.filter(id => id !== a.id))} /><span>{a.shortText}</span></label>)}</fieldset>}
      <div className="border border-line bg-surface p-4"><p className="eyebrow mb-3">Das wird geteilt</p><p className="select-text whitespace-pre-wrap break-words text-sm" data-testid="share-preview">{text}</p></div>
      <p className="text-xs text-muted-foreground">Private und sensible Notizen können hier nicht ausgewählt werden. Ein Empfänger kann geteilte Inhalte behalten.</p>
      <Btn disabled={busy} onClick={() => void share()}>Jetzt teilen</Btn>
      <Btn variant="ghost" disabled={busy} onClick={() => void copy()}>Text kopieren</Btn>
      <p role="status" className="text-sm text-muted-foreground">{status}</p>
    </DialogContent>
  </Dialog>;
}
