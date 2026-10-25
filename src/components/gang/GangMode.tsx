/* GANG MODE surface: CHOOSE A GAME / BUILD A MIX / START MY NIGHT → Player Setup → GangPlayer (ONE PHONE). */
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Minus, Plus, X } from "lucide-react";
import { GANG_GAMES, GANG_TAGS, avgMinutes, fitsPlayers, gangGame, mixMinutes, type GangGame } from "@/lib/gang/catalog";
import { DURATIONS, MODULES, NAMED_LIMIT, VIBES, directorNight, roster, type Vibe } from "@/lib/gang/night";
import type { GangGameId } from "@/lib/gang/core/playbooks";
import type { GameCapability } from "@/lib/gang/core/types";
import type { GangRuntimePlayer } from "@/lib/gang/core/runtime";
import { btn } from "@/components/vault/Btn";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { GangPlayer } from "./GangPlayer";
import { GangRoom, HostSetup } from "./GangRoom";
import { HostAccessSheet } from "@/components/commerce/HostAccessSheet";
import { defaultRoomClient, sessionStore, type RoomClient, type RoomSnapshot, type StoredSession } from "@/lib/gang/room-client";
import { MotifArt, hueVars } from "./MotifArt";

type Entry = "director" | "catalog" | "mix";
export type PlayMode = "one-phone" | "everyone-in" | "big-screen";

const CAP_LABEL: Record<string, string> = { music: "Musik (manuell)", camera: "Kamera optional", spicy: "18+ · Opt-in", alcohol: "Drinks optional" };
const primary = cn(btn({ size: "lg" }), "w-full bg-signal text-signal-foreground hover:bg-signal/90");

type RoundPlan = Record<string, number>;
type Flow =
  | { k: "sheet"; id: GangGameId }
  | { k: "setup"; queue: GangGameId[]; range: [number, number]; count: number; entry: Entry; rounds?: RoundPlan | undefined }
  | { k: "play"; queue: GangGameId[]; players: GangRuntimePlayer[]; rounds?: RoundPlan | undefined }
  | { k: "room"; session: StoredSession; snap: RoomSnapshot | null; bigScreen: boolean }
  | null;

function Overlay({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden bg-room safe-x safe-top safe-bottom">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col py-3">
        <div className="flex min-h-11 items-center justify-between">
          <span className="font-mono text-xs tracking-[0.2em] text-signal">{label}</span>
          <button type="button" aria-label="Schließen" onClick={onClose} className="tap flex size-11 items-center justify-center"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-4" role="group" aria-label={label}>
      <button type="button" aria-label="Weniger Spieler" disabled={value <= min} onClick={() => { haptic(4); onChange(value - 1); }} className="tap flex size-12 items-center justify-center border border-line disabled:opacity-30"><Minus className="size-5" /></button>
      <output aria-live="polite" className="w-20 text-center font-display text-6xl tabular-nums leading-none">{value}</output>
      <button type="button" aria-label="Mehr Spieler" disabled={value >= max} onClick={() => { haptic(4); onChange(value + 1); }} className="tap flex size-12 items-center justify-center border border-line disabled:opacity-30"><Plus className="size-5" /></button>
    </div>
  );
}

const PlayableBadge = () => <span className="font-mono text-[0.65rem] tracking-[0.2em] text-signal">ALLE DRIN · PER QR</span>;

function GameSheet({ g, onStart, onClose }: { g: GangGame; onStart: () => void; onClose: () => void }) {
  return (
    <Overlay label="CHOOSE A GAME" onClose={onClose}>
      <div style={hueVars(g.hue)} className="flex flex-1 flex-col motion-safe:animate-rise">
        <MotifArt motif={g.motif} className="mt-6 w-32" />
        <PlayableBadge />
        <h2 className="font-display mt-3 text-[clamp(3rem,15vw,5.5rem)] leading-[0.85] tracking-tight">{g.title}</h2>
        <p className="mt-3 text-lg text-[var(--g)]">{g.hook}</p>
        <p className="mt-4 text-foreground/90">{g.rule}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
          <div><dt className="font-mono text-xs text-muted-foreground">SPIELER</dt><dd className="font-display text-2xl">{g.min}–{g.max}</dd></div>
          <div><dt className="font-mono text-xs text-muted-foreground">DAUER</dt><dd className="font-display text-2xl">{g.minutes[0]}–{g.minutes[1]} min</dd></div>
          {g.capabilities.length > 0 && <div className="col-span-2"><dt className="font-mono text-xs text-muted-foreground">EXTRAS</dt><dd>{g.capabilities.map((c) => CAP_LABEL[c] ?? c).join(" · ")}</dd></div>}
        </dl>
        <button type="button" onClick={() => { haptic(10); onStart(); }} className={cn(primary, "mt-auto")}>Spiel starten</button>
      </div>
    </Overlay>
  );
}

function PlayerSetup({ queue, rounds, range, initial, entry, client, hostAllowed, onStart, onRoom, onClose }: {
  queue: GangGameId[]; rounds?: RoundPlan | undefined; range: [number, number]; initial: number; entry: Entry; client: RoomClient | null; hostAllowed: boolean;
  onStart: (p: GangRuntimePlayer[]) => void; onRoom: (s: StoredSession, snap: RoomSnapshot, bigScreen: boolean) => void; onClose: () => void;
}) {
  // EVERYONE IN is the default whenever a room client exists; ONE PHONE is a fallback.
  const [solo, setSolo] = useState(false);
  const [stage, setStage] = useState(false);
  const onePhone = solo || !client;
  const [count, setCount] = useState(Math.min(Math.max(initial, range[0]), range[1]));
  const [names, setNames] = useState<string[]>([]);
  const ok = count >= range[0] && count <= range[1];
  return (
    <Overlay label="PLAYER SETUP" onClose={onClose}>
      <div className="flex flex-1 flex-col">
        <p className="mt-4 text-sm text-muted-foreground">{queue.map((id) => gangGame(id)?.title).join(" → ")}</p>
        {!onePhone && client ? (<>
          <div data-testid="everyone-in-setup" className="mt-5 border-l-2 border-signal pl-4">
            <p className="font-mono text-[0.65rem] tracking-[0.2em] text-signal">EMPFOHLEN · ALLE DRIN</p>
            <h2 className="font-display mt-2 text-[clamp(2.4rem,10vw,3.8rem)] leading-[0.9]">Alle mit eigenem Handy.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Du öffnest den Raum, die anderen scannen den QR-Code. Geheime Antworten bleiben auf dem eigenen Handy – niemand muss weitergeben.</p>
          </div>
          <button type="button" role="switch" aria-checked={stage} onClick={() => { haptic(5); setStage(!stage); }}
            className="tap mt-5 flex min-h-14 w-full items-center justify-between gap-4 border-y border-line py-3 text-left">
            <span><span className="block text-sm text-foreground">TV/Laptop als Bühne</span><span className="block text-xs text-muted-foreground">Optional · Handys bleiben die Controller</span></span>
            <span aria-hidden className={cn("relative h-6 w-11 shrink-0 rounded-full border transition-colors", stage ? "border-signal bg-signal/30" : "border-line")}>
              <span className={cn("absolute top-0.5 size-4 rounded-full bg-foreground transition-transform motion-reduce:transition-none", stage ? "translate-x-6" : "translate-x-0.5")} />
            </span>
          </button>
          {hostAllowed ? <HostSetup client={client} queue={queue} rounds={rounds} entry={entry} bigScreen={stage} onReady={(s, snap) => onRoom(s, snap, stage)} /> : <HostAccessSheet />}
          <button type="button" onClick={() => { haptic(5); setSolo(true); }} className="tap mx-auto mt-3 flex min-h-11 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline">Nur ein Handy? Reihum spielen</button>
        </>) : (<>
        {client && <button type="button" onClick={() => setSolo(false)} className="tap mt-3 flex min-h-11 items-center text-left text-sm text-signal underline-offset-4 hover:underline">Lieber alle mit eigenem Handy? Raum öffnen</button>}
        <p className="mt-3 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground">EIN HANDY · REIHUM</p>

        <h2 className="font-display mt-6 text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.9]">Wer spielt mit?</h2>
        <div className="mt-6"><Stepper value={count} min={range[0]} max={range[1]} onChange={setCount} label="Anzahl Spieler" /></div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{range[0]}–{range[1]} SPIELER MÖGLICH</p>
        {count <= NAMED_LIMIT ? (
          <ul className="mt-6 grid gap-1 sm:grid-cols-2">
            {Array.from({ length: count }, (_, i) => (
              <li key={i}>
                <label className="sr-only" htmlFor={`gp-${i}`}>Name Spieler {i + 1}</label>
                <input id={`gp-${i}`} value={names[i] ?? ""} maxLength={24} autoComplete="off" placeholder={`Spieler ${i + 1}`}
                  onChange={(e) => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                  className="min-h-12 w-full border-0 border-b border-line bg-transparent px-1 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-signal focus:outline-none" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Ab {NAMED_LIMIT + 1} Leuten heißt ihr automatisch Spieler 1–{count}. Merkt euch eure Nummer.</p>
        )}
        {hostAllowed ? <button type="button" disabled={!ok} onClick={() => { haptic(12); onStart(roster(count, names)); }} className={cn(primary, "mt-auto pt-0")}>{queue.length > 1 ? "Night starten" : "Los"}</button> : <div className="mt-auto pt-6"><HostAccessSheet /></div>}
        </>)}
      </div>
    </Overlay>
  );
}

function NightSetup({ onLaunch, onClose }: { onLaunch: (queue: GangGameId[], count: number, rounds?: RoundPlan) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(6);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [dur, setDur] = useState<number | null | undefined>(undefined);
  const [mods, setMods] = useState<GameCapability[]>([]);
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const plan = useMemo(() => (step === 4 && vibe ? directorNight({ vibe, duration: (dur ?? null) as 15 | 30 | 60 | null, players: count, caps: mods, seed }) : null), [step, vibe, dur, count, mods, seed]);
  const queue = (plan?.gameIds ?? []) as GangGameId[];
  const Choice = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button type="button" aria-pressed={on} onClick={() => { haptic(5); onClick(); }}
      className={cn("tap flex min-h-16 w-full items-center justify-between border-b border-line text-left font-display text-[clamp(2rem,9vw,3rem)] leading-none transition-colors", on ? "text-signal" : "text-foreground/80")}>
      {label}{on && <Check className="size-6" />}
    </button>
  );
  const steps = [
    { q: "Wie viele seid ihr?", body: <Stepper value={count} min={2} max={99} onChange={setCount} label="Anzahl Spieler" />, ok: true },
    { q: "Welcher Vibe?", body: VIBES.map((v) => <Choice key={v} label={v} on={vibe === v} onClick={() => setVibe(v)} />), ok: !!vibe },
    { q: "Wie lange?", body: DURATIONS.map((d) => <Choice key={d.label} label={d.label} on={dur === d.v} onClick={() => setDur(d.v)} />), ok: dur !== undefined },
    { q: "Extras? Optional.", body: MODULES.map((m) => <Choice key={m.label} label={m.label} on={mods.includes(m.cap)} onClick={() => setMods(mods.includes(m.cap) ? mods.filter((x) => x !== m.cap) : [...mods, m.cap])} />), ok: true },
  ];
  return (
    <Overlay label={`START MY NIGHT · ${Math.min(step + 1, 5)}/5`} onClose={onClose}>
      <div className="mt-1 flex gap-1" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <span key={i} className={cn("h-0.5 flex-1", i <= step ? "bg-signal" : "bg-line")} />)}</div>
      {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="tap mt-2 flex min-h-11 items-center gap-2 self-start text-sm text-muted-foreground"><ArrowLeft className="size-4" />Zurück</button>}
      {step < 4 ? (
        <div className="flex flex-1 flex-col">
          <h2 className="font-display mt-6 text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.9]">{steps[step]!.q}</h2>
          <div key={step} className="mt-6 motion-safe:animate-rise">{steps[step]!.body}</div>
          <button type="button" disabled={!steps[step]!.ok} onClick={() => { haptic(10); setStep(step + 1); }} className={cn(primary, "mt-auto")}>{step === 3 ? "Night zusammenstellen" : "Weiter"}</button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col motion-safe:animate-rise" data-testid="night-summary">
          <p className="mt-6 font-mono text-xs tracking-[0.2em] text-signal">TONIGHT · {count} SPIELER · ~{plan?.estimatedMinutes ?? 0} MIN</p>
          <ol className="mt-4 border-t border-line">
            {queue.map((id, i) => { const g = gangGame(id)!; return (
              <li key={id} style={hueVars(g.hue)} className="flex min-h-14 items-center gap-3 border-b border-line">
                <span className="w-6 font-mono text-xs text-[var(--g)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate font-display text-2xl">{g.title}</span>
                <MotifArt motif={g.motif} className="w-10" />
              </li>
            ); })}
          </ol>
          {queue.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Für diese Kombination passt kein Spiel. Ändere Gruppengröße oder Extras.</p>}
          <button type="button" disabled={!queue.length} onClick={() => onLaunch(queue, count, plan?.roundsByGame)} className={cn(primary, "mt-auto")}>Night starten</button>
        </div>
      )}
    </Overlay>
  );
}

function GameCard({ g, big, mix, mixCount, selected, onOpen, onToggle }: { g: GangGame; big: boolean; mix: boolean; mixCount: number; selected: boolean; onOpen: () => void; onToggle: () => void }) {
  const fits = fitsPlayers(g, mixCount);
  const reason = mixCount < g.min ? `Ab ${g.min} Spielern` : `Bis ${g.max} Spieler`;
  return (
    <li style={hueVars(g.hue)} className={cn("relative flex flex-col overflow-hidden border-t-2 bg-room p-5", big ? "min-h-80 sm:col-span-2" : "min-h-56", selected ? "border-signal" : "border-[var(--g)]", mix && !fits && "opacity-50")}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(120% 80% at 100% 0%, var(--g-deep), transparent 60%)" }} />
      <MotifArt motif={g.motif} className={cn("absolute right-3 top-8", big ? "w-40 sm:w-52" : "w-24")} />
      <div className="relative flex items-center justify-between gap-2"><PlayableBadge /><span className="font-mono text-xs text-muted-foreground">{g.min}–{g.max} · {g.minutes[0]}–{g.minutes[1]} min</span></div>
      <h3 className={cn("relative mt-auto pt-16 font-display leading-[0.9] tracking-tight", big ? "text-[clamp(2.4rem,10vw,4rem)]" : "text-3xl")}>{g.title}</h3>
      <p className="relative mt-2 max-w-sm text-foreground/85">{g.hook}</p>
      <p className="relative mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">{g.tags.map((t) => <span key={t} className="text-[var(--g)]">#{t}</span>)}</p>
      {mix ? (
        fits ? (
          <button type="button" aria-pressed={selected} onClick={() => { haptic(6); onToggle(); }}
            className={cn(btn({ variant: selected ? "primary" : "outline", size: "sm" }), "relative mt-4 self-start", selected && "bg-signal text-signal-foreground hover:bg-signal/90")}>
            {selected ? <><Check className="size-4" /> Im Mix</> : `${g.title} zum Mix`}
          </button>
        ) : <p className="relative mt-4 text-xs text-muted-foreground">{reason} – passt nicht zu {mixCount}.</p>
      ) : (
        <button type="button" onClick={() => { haptic(6); onOpen(); }} aria-label={`${g.title} öffnen`} className={cn(btn({ size: "sm" }), "relative mt-4 self-start bg-signal text-signal-foreground hover:bg-signal/90")}>Spielen</button>
      )}
    </li>
  );
}

const MODES = [
  ["ALLE DRIN", "EMPFOHLEN", "Raum öffnen, QR-Code zeigen – in Sekunden ist jede:r mit dem eigenen Handy drin. Geheimes bleibt nur auf deinem Handy."],
  ["TV ALS BÜHNE", "OPTIONAL", "Dazuschalten: TV oder Laptop zeigt Frage, Fortschritt und Punkte. Die Handys bleiben Controller."],
  ["NUR EIN HANDY", "WENN NÖTIG", "Kein Netz, nur ein Gerät? Dann geht ein Handy reihum – mit Sichtschutz für geheime Phasen."],
] as const;

export function GangMode({ back, hostAllowed = false }: { back?: React.ReactNode; hostAllowed?: boolean }) {
  const [flow, setFlow] = useState<Flow>(null);
  const [client, setClient] = useState<RoomClient | null>(null);
  const [resume, setResume] = useState<StoredSession | null>(null);
  useEffect(() => { setClient(defaultRoomClient()); setResume(sessionStore.get("player")); }, []);
  const [night, setNight] = useState(false);
  const [mix, setMix] = useState(false);
  const [mixCount, setMixCount] = useState(5);
  const [sel, setSel] = useState<GangGameId[]>([]);
  const [tag, setTag] = useState<string | null>(null);
  const list = useMemo(() => (tag ? GANG_GAMES.filter((g) => g.tags.includes(tag)) : GANG_GAMES), [tag]);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView?.({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const move = (i: number, d: -1 | 1) => { const n = [...sel]; [n[i], n[i + d]] = [n[i + d]!, n[i]!]; setSel(n); };
  const toggle = (id: GangGameId) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const changeCount = (n: number) => { setMixCount(n); setSel((s) => s.filter((id) => fitsPlayers(gangGame(id)!, n))); };
  const mixRange = (): [number, number] => {
    const gs = sel.map((id) => gangGame(id)!);
    return [Math.max(2, ...gs.map((g) => g.min)), Math.min(99, ...gs.map((g) => g.max))];
  };

  const PATHS = [
    { k: "01", t: "START MY NIGHT", d: "Gruppe, Vibe, Dauer – der Party Director baut euren Abend.", on: () => { haptic(10); setNight(true); } },
    { k: "02", t: "CHOOSE A GAME", d: "Ein Spiel antippen, Spieler eintragen, los.", on: () => { setMix(false); go("katalog"); } },
    { k: "03", t: "BUILD A MIX", d: "Mehrere Spiele in deiner Reihenfolge.", on: () => { haptic(6); setMix(true); go("katalog"); } },
  ];

  return (
    <main className="min-h-svh overflow-x-hidden bg-room pb-40 text-foreground">
      <header className="relative overflow-hidden safe-x safe-top">
        <div className="mx-auto max-w-6xl">
          <nav className="flex min-h-14 items-center justify-between">{back}<span className="font-mono text-xs tracking-[0.25em] text-signal">NOCTURNE</span></nav>
          <div aria-hidden className="mt-6 flex h-16 items-end gap-1">
            {Array.from({ length: 28 }, (_, i) => <span key={i} className="animate-gang-pulse w-full bg-signal" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i * 97) % 1400}ms`, opacity: 0.25 + ((i * 13) % 10) / 14 }} />)}
          </div>
          <p className="mt-6 font-mono text-xs tracking-[0.25em] text-signal">GANG MODE · 2–99 PLAYERS · 16 SPIELE</p>
          <h1 className="font-display mt-3 text-[clamp(3.6rem,17vw,9rem)] leading-[0.82] tracking-tight">Ein Raum.<br /><em className="text-signal">Alle drin.</em></h1>
          <p className="mt-5 max-w-xl text-lg text-foreground/85">Partyspiele für 2 bis 99 Leute – jede:r mit dem eigenen Handy, per QR in Sekunden drin, optional mit TV als Bühne. Null Vorbereitung, keine Regeln vorlesen: antippen, Namen rein, und der Raum wird lebendig.</p>
        </div>
      </header>

      <section aria-labelledby="paths-h" className="mx-auto mt-12 max-w-6xl safe-x">
        <h2 id="paths-h" className="sr-only">Drei Wege in die Nacht</h2>
        <ul className="grid border-t border-line sm:grid-cols-3 sm:border-t-0">
          {PATHS.map((p) => (
            <li key={p.k}>
              <button type="button" onClick={p.on} className="tap group flex min-h-32 w-full flex-col border-b border-line py-5 text-left sm:min-h-56 sm:border-b-0 sm:border-t-2 sm:border-t-signal sm:pr-6">
                <span className="font-mono text-xs text-signal">{p.k}</span>
                <span className="font-display mt-2 text-[clamp(2.2rem,9vw,3.2rem)] leading-[0.9] transition-transform duration-300 group-hover:translate-x-1">{p.t}</span>
                <span className="mt-2 text-sm text-muted-foreground">{p.d}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="modes-h" className="mx-auto mt-20 max-w-6xl safe-x">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">SO WIRD GESPIELT</p>
        <h2 id="modes-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Alle drin. Jede:r am eigenen Handy.</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {MODES.map(([t, tag, d]) => (
            <li key={t} className="border-l border-signal pl-4">
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-signal">{tag}</p>
              <h3 className="mt-2 font-display text-3xl">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="katalog" aria-labelledby="katalog-h" className="mx-auto mt-20 max-w-6xl scroll-mt-4 safe-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-signal">{mix ? "BUILD A MIX" : "CHOOSE A GAME"} · {GANG_GAMES.length} SPIELE</p>
            <h2 id="katalog-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4.5rem)] leading-[0.92]">Der Katalog.</h2>
          </div>
          <button type="button" aria-pressed={mix} onClick={() => { haptic(6); setMix(!mix); }} className={btn({ variant: "outline", size: "sm" })}>{mix ? "Mix beenden" : "Mix bauen"}</button>
        </div>
        {mix && (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-mono text-xs tracking-[0.15em] text-muted-foreground">IHR SEID</span>
            <Stepper value={mixCount} min={2} max={99} onChange={changeCount} label="Spieler im Mix" />
          </div>
        )}
        <div className="mt-6 -mx-1 flex gap-1 overflow-x-auto pb-2" role="group" aria-label="Nach Gefühl filtern">
          {[null, ...GANG_TAGS].map((t) => (
            <button key={t ?? "all"} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}
              className={cn("tap min-h-11 shrink-0 px-3 font-mono text-xs tracking-[0.15em] transition-colors", tag === t ? "border-b-2 border-signal text-signal" : "text-muted-foreground")}>{t ? t.toUpperCase() : "ALLE"}</button>
          ))}
        </div>
        <ul className="mt-4 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {list.map((g, i) => <GameCard key={g.id} g={g} big={i < 2} mix={mix} mixCount={mixCount} selected={sel.includes(g.id)} onOpen={() => setFlow({ k: "sheet", id: g.id })} onToggle={() => toggle(g.id)} />)}
        </ul>
        {list.length === 0 && <p className="py-10 text-muted-foreground">Kein Spiel mit diesem Gefühl.</p>}
      </section>

      {mix && (
        <aside aria-label="Dein Mix" className="fixed inset-x-0 bottom-0 z-40 border-t border-signal/40 bg-room/95 backdrop-blur safe-x safe-bottom">
          <div className="mx-auto max-w-6xl py-3">
            {sel.length > 0 && (
              <ol className="mb-3 max-h-[36svh] divide-y divide-line overflow-y-auto">
                {sel.map((id, i) => { const g = gangGame(id)!; return (
                  <li key={id} className="flex min-h-12 items-center gap-2">
                    <span className="w-6 font-mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate font-display text-xl">{g.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">~{avgMinutes(g)}′</span>
                    <button type="button" aria-label={`${g.title} nach oben`} disabled={i === 0} onClick={() => move(i, -1)} className="tap flex size-11 items-center justify-center disabled:opacity-30"><ArrowUp className="size-4" /></button>
                    <button type="button" aria-label={`${g.title} nach unten`} disabled={i === sel.length - 1} onClick={() => move(i, 1)} className="tap flex size-11 items-center justify-center disabled:opacity-30"><ArrowDown className="size-4" /></button>
                    <button type="button" aria-label={`${g.title} entfernen`} onClick={() => toggle(id)} className="tap flex size-11 items-center justify-center"><X className="size-4" /></button>
                  </li>
                ); })}
              </ol>
            )}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1" aria-live="polite">
                <p className="font-mono text-xs tracking-[0.15em] text-signal">{sel.length} {sel.length === 1 ? "SPIEL" : "SPIELE"} · ~{mixMinutes(sel)} MIN · {mixCount} SPIELER</p>
                <p className="truncate text-sm text-muted-foreground" data-testid="mix-order">{sel.length ? sel.map((id) => gangGame(id)!.title).join(" → ") : "Wähle Spiele für deinen Mix."}</p>
              </div>
              <button type="button" disabled={!sel.length} onClick={() => { haptic(10); setFlow({ k: "setup", queue: sel, range: mixRange(), count: mixCount, entry: "mix" }); }} className={cn(btn({ size: "md" }), "shrink-0 bg-signal text-signal-foreground hover:bg-signal/90")}>Mix starten</button>
            </div>
          </div>
        </aside>
      )}

      {night && <NightSetup onClose={() => setNight(false)} onLaunch={(queue, count, rounds) => { setNight(false); setFlow({ k: "setup", queue, rounds, range: [count, count], count, entry: "director" }); }} />}
      {flow?.k === "sheet" && (() => { const g = gangGame(flow.id)!; return <GameSheet g={g} onClose={() => setFlow(null)} onStart={() => setFlow({ k: "setup", queue: [g.id], range: [g.min, g.max], count: Math.max(g.min, 4), entry: "catalog" })} />; })()}
      {flow?.k === "setup" && <PlayerSetup queue={flow.queue} rounds={flow.rounds} range={flow.range} initial={flow.count} entry={flow.entry} client={client} hostAllowed={hostAllowed} onClose={() => setFlow(null)} onStart={(players) => setFlow({ k: "play", queue: flow.queue, players, rounds: flow.rounds })} onRoom={(session, snap, bigScreen) => { setResume(null); setFlow({ k: "room", session, snap, bigScreen }); }} />}
      {flow?.k === "room" && client && <GangRoom client={client} session={flow.session} initial={flow.snap} bigScreen={flow.bigScreen} onExit={() => { setResume(sessionStore.get("player")); setFlow(null); }} />}
      {resume && !flow && client && (
        <div className="fixed inset-x-0 top-0 z-40 border-b border-signal/40 bg-room/95 backdrop-blur safe-x safe-top">
          <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-signal">RAUM {resume.code} LÄUFT NOCH</span>
            <span className="flex gap-1">
              <button type="button" onClick={() => setFlow({ k: "room", session: resume, snap: null, bigScreen: false })} className={cn(btn({ size: "sm" }), "bg-signal text-signal-foreground")}>Zurück in den Raum</button>
              <button type="button" aria-label="Hinweis schließen" onClick={() => setResume(null)} className="tap flex size-11 items-center justify-center"><X className="size-4" /></button>
            </span>
          </div>
        </div>
      )}
      {flow?.k === "play" && <GangPlayer queue={flow.queue} rounds={flow.rounds} players={flow.players} onExit={() => setFlow(null)} />}
    </main>
  );
}
