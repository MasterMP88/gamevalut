import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, X } from "lucide-react";
import { GANG_GAMES, GANG_TAGS, avgMinutes, mixMinutes, type GangGame, type Motif } from "@/lib/gang/catalog";
import { btn } from "@/components/vault/Btn";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const URL = "https://nocturne-games-for-two.lovable.app/gang";
const TITLE = "GANG MODE — Partyspiele für 2–99 Leute · NOCTURNE";
const DESC = "GANG MODE von NOCTURNE: Gruppenspiele für 2 bis 99 Leute in einem Raum, ohne Vorbereitung. Lass den Party Director starten, wähl ein Spiel oder bau deinen eigenen Mix.";

export const Route = createFileRoute("/gang")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: GangPage,
});

const hueVars = (h: number) => ({ "--g": `oklch(0.78 0.13 ${h})`, "--g-deep": `oklch(0.3 0.07 ${h})` }) as React.CSSProperties;

function MotifArt({ motif, className }: { motif: Motif; className?: string }) {
  const s = { stroke: "var(--g)", fill: "none", strokeWidth: 2 } as const;
  const f = { fill: "var(--g)" } as const;
  const body: Record<Motif, React.ReactNode> = {
    bars: <>{[18, 42, 70, 30, 55].map((h, i) => <rect key={i} x={8 + i * 18} y={90 - h} width="10" height={h} {...f} opacity={i === 2 ? 1 : 0.35} />)}</>,
    point: <>{[[20, 80], [100, 80], [60, 95]].map(([x, y], i) => <line key={i} x1={x} y1={y} x2="60" y2="30" {...s} />)}<circle cx="60" cy="28" r="9" {...f} /></>,
    mask: <><path d="M15 45 Q60 20 105 45 Q95 75 60 70 Q25 75 15 45Z" {...s} /><circle cx="42" cy="48" r="6" {...f} /><circle cx="78" cy="48" r="6" {...f} opacity=".25" /></>,
    seal: <><rect x="22" y="30" width="76" height="50" {...s} /><path d="M22 30 L60 60 L98 30" {...s} /><circle cx="60" cy="62" r="8" {...f} /></>,
    scribble: <path d="M10 70 C30 20 40 90 60 50 S90 20 110 60" {...s} strokeWidth="3" />,
    poker: <><rect x="30" y="20" width="40" height="60" rx="3" {...s} transform="rotate(-10 50 50)" /><rect x="52" y="22" width="40" height="60" rx="3" {...f} opacity=".8" transform="rotate(8 72 52)" /></>,
    line: <><line x1="5" y1="55" x2="115" y2="55" {...s} />{[20, 38, 50, 82, 97].map((x, i) => <circle key={i} cx={x} cy="55" r="5" {...f} />)}</>,
    spot: <><path d="M60 5 L95 95 L25 95Z" fill="var(--g)" opacity=".15" /><circle cx="60" cy="80" r="10" {...f} /></>,
    split: <><rect x="8" y="25" width="48" height="55" {...f} opacity=".8" /><rect x="64" y="25" width="48" height="55" {...s} /></>,
    frame: <><path d="M15 35 V20 H30 M90 20 H105 V35 M105 70 V85 H90 M30 85 H15 V70" {...s} strokeWidth="3" /><circle cx="60" cy="52" r="7" {...f} /></>,
    pen: <path d="M15 80 Q40 30 60 60 T105 30" {...s} strokeWidth="4" strokeLinecap="round" />,
    wave: <>{Array.from({ length: 11 }, (_, i) => <rect key={i} x={6 + i * 10} y={55 - [10, 25, 40, 18, 35, 45, 20, 38, 15, 28, 8][i]!} width="5" height={[10, 25, 40, 18, 35, 45, 20, 38, 15, 28, 8][i]! * 2} {...f} />)}</>,
    chain: <>{[20, 50, 80].map((x) => <ellipse key={x} cx={x + 10} cy="55" rx="18" ry="11" {...s} strokeWidth="3" />)}</>,
    one: <>{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={14 + (i % 6) * 18} cy={i < 6 ? 38 : 68} r="5" {...f} opacity={i === 8 ? 1 : 0.22} />)}</>,
    button: <><circle cx="60" cy="55" r="32" {...s} /><circle cx="60" cy="55" r="20" {...f} /></>,
    moon: <path d="M75 20 A35 35 0 1 0 75 90 A28 28 0 1 1 75 20Z" {...f} opacity=".85" />,
  };
  return <svg viewBox="0 0 120 100" aria-hidden className={className}>{body[motif]}</svg>;
}

function Status({ g }: { g: GangGame }) {
  return g.status === "prototype"
    ? <span className="font-mono text-[0.65rem] tracking-[0.2em] text-signal">PROTOTYPE</span>
    : <span className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground">IN DEVELOPMENT</span>;
}

function GameCard({ g, big, mix, selected, onToggle }: { g: GangGame; big: boolean; mix: boolean; selected: boolean; onToggle: () => void }) {
  const selectable = mix && g.status === "prototype";
  return (
    <li style={hueVars(g.hue)} className={cn("relative flex flex-col overflow-hidden border-t-2 bg-room p-5", big ? "min-h-80 sm:col-span-2" : "min-h-56", selected ? "border-signal" : "border-[var(--g)]")}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(120% 80% at 100% 0%, var(--g-deep), transparent 60%)" }} />
      <MotifArt motif={g.motif} className={cn("absolute right-3 top-8", big ? "w-40 sm:w-52" : "w-24")} />
      <div className="relative flex items-center justify-between gap-2"><Status g={g} /><span className="font-mono text-xs text-muted-foreground">{g.min}–{g.max} · {g.minutes[0]}–{g.minutes[1]} min</span></div>
      <h3 className={cn("relative mt-auto pt-16 font-display leading-[0.9] tracking-tight", big ? "text-[clamp(2.4rem,10vw,4rem)]" : "text-3xl")}>{g.title}</h3>
      <p className="relative mt-2 max-w-sm text-foreground/85">{g.hook}</p>
      <p className="relative mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {g.tags.map((t) => <span key={t} className="text-[var(--g)]">#{t}</span>)}
        {g.modes.map((m) => <span key={m} className="border border-line px-1.5">{m}</span>)}
      </p>
      {mix && (
        selectable ? (
          <button type="button" aria-pressed={selected} onClick={() => { haptic(6); onToggle(); }}
            className={cn(btn({ variant: selected ? "primary" : "outline", size: "sm" }), "relative mt-4 self-start", selected && "bg-signal text-signal-foreground hover:bg-signal/90")}>
            {selected ? <><Check className="size-4" /> Im Mix</> : "Zum Mix"}
          </button>
        ) : <p className="relative mt-4 text-xs text-muted-foreground">Kommt in den Mix, sobald es spielbar ist.</p>
      )}
    </li>
  );
}

const MODES = [
  ["ONE PHONE", "Ein Handy geht reihum. Perfekt für kleine Runden am Tisch."],
  ["EVERYONE IN", "Alle steigen per QR-Code oder Raumcode mit dem eigenen Handy ein."],
  ["BIG SCREEN", "Der Fernseher wird zur Bühne, die Handys zu Controllern."],
] as const;

const VIBES = ["Chill", "Funny", "Wild", "Spicy", "Chaos"] as const;
const DURATIONS = ["15 min", "30 min", "60 min", "Open End"] as const;
const MODULES = ["Music", "Camera", "After Dark", "Drinks"] as const;

function NightSetup({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [vibe, setVibe] = useState<string | null>(null);
  const [dur, setDur] = useState<string | null>(null);
  const [mods, setMods] = useState<string[]>([]);
  const Choice = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button type="button" aria-pressed={on} onClick={() => { haptic(5); onClick(); }}
      className={cn("tap flex min-h-16 w-full items-center justify-between border-b border-line text-left font-display text-[clamp(2rem,9vw,3rem)] leading-none transition-colors", on ? "text-signal" : "text-foreground/80")}>
      {label}{on && <Check className="size-6" />}
    </button>
  );
  const steps = [
    { q: "Welcher Vibe?", body: VIBES.map((v) => <Choice key={v} label={v} on={vibe === v} onClick={() => setVibe(v)} />), ok: !!vibe },
    { q: "Wie lange?", body: DURATIONS.map((d) => <Choice key={d} label={d} on={dur === d} onClick={() => setDur(d)} />), ok: !!dur },
    { q: "Extras? Optional.", body: MODULES.map((m) => <Choice key={m} label={m} on={mods.includes(m)} onClick={() => setMods(mods.includes(m) ? mods.filter((x) => x !== m) : [...mods, m])} />), ok: true },
  ];
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="setup-q" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-room safe-x safe-top safe-bottom">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col py-4">
        <div className="flex items-center justify-between">
          {step > 0 && step < 3 ? <button type="button" onClick={() => setStep(step - 1)} className="tap flex min-h-11 items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />Zurück</button> : <span className="w-11" />}
          <span className="font-mono text-xs tracking-[0.2em] text-signal">START MY NIGHT · {Math.min(step + 1, 3)}/3</span>
          <button type="button" aria-label="Schließen" onClick={onClose} className="tap flex size-11 items-center justify-center"><X className="size-5" /></button>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={cn("h-0.5 flex-1", i <= step ? "bg-signal" : "bg-line")} />)}</div>
        {step < 3 ? (
          <>
            <h2 id="setup-q" className="font-display mt-10 text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.9]">{steps[step]!.q}</h2>
            <div key={step} className="mt-6 motion-safe:animate-rise">{steps[step]!.body}</div>
            <button type="button" disabled={!steps[step]!.ok} onClick={() => { haptic(10); setStep(step + 1); }} className={cn(btn({ size: "lg" }), "mt-auto w-full bg-signal text-signal-foreground hover:bg-signal/90")}>{step === 2 ? "Night zusammenstellen" : "Weiter"}</button>
          </>
        ) : (
          <div className="mt-10 flex flex-1 flex-col motion-safe:animate-rise" aria-live="polite">
            <p className="font-mono text-xs tracking-[0.2em] text-signal">NIGHT SETUP READY</p>
            <h2 id="setup-q" className="font-display mt-3 text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.9]">{vibe}. {dur}.{mods.length > 0 && <> <em className="text-signal">+ {mods.join(", ")}</em></>}</h2>
            <p className="mt-6 max-w-md text-foreground/85">Dein Setup steht. Der Party Director, der daraus live einen Abend baut, und die Multiplayer-Runde sind als Nächstes dran – heute startet hier noch kein Raum.</p>
            <p className="mt-4 font-mono text-xs tracking-[0.2em] text-muted-foreground">MULTIPLAYER RUNTIME · COMING NEXT</p>
            <div className="mt-auto grid gap-3 pt-10">
              <button type="button" onClick={onClose} className={cn(btn({ size: "lg" }), "w-full bg-signal text-signal-foreground hover:bg-signal/90")}>Zurück zu GANG MODE</button>
              <button type="button" onClick={() => { setStep(0); setVibe(null); setDur(null); setMods([]); }} className={btn({ variant: "ghost" })}>Neu einstellen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GangPage() {
  const [setup, setSetup] = useState(false);
  const [mix, setMix] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [tag, setTag] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const list = useMemo(() => (tag ? GANG_GAMES.filter((g) => g.tags.includes(tag)) : GANG_GAMES), [tag]);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const move = (i: number, d: -1 | 1) => { const n = [...sel]; [n[i], n[i + d]] = [n[i + d]!, n[i]!]; setSel(n); };
  const toggle = (id: string) => { setPreview(false); setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]); };

  const PATHS = [
    { k: "01", t: "START MY NIGHT", d: "Vibe und Dauer wählen – der Party Director plant den Abend.", on: () => { haptic(10); setSetup(true); } },
    { k: "02", t: "CHOOSE A GAME", d: "Direkt ein Spiel aus dem Katalog nehmen.", on: () => { setMix(false); go("katalog"); } },
    { k: "03", t: "BUILD A MIX", d: "Mehrere Spiele in deiner Reihenfolge.", on: () => { haptic(6); setMix(true); go("katalog"); } },
  ];

  return (
    <main className="min-h-svh bg-room pb-40 text-foreground">
      <header className="relative overflow-hidden safe-x safe-top">
        <div className="mx-auto max-w-6xl">
          <nav className="flex min-h-14 items-center justify-between">
            <Link to="/" className="tap flex min-h-11 items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Games for Two</Link>
            <span className="font-mono text-xs tracking-[0.25em] text-signal">NOCTURNE</span>
          </nav>
          <div aria-hidden className="mt-6 flex h-16 items-end gap-1">
            {Array.from({ length: 28 }, (_, i) => <span key={i} className="animate-gang-pulse w-full bg-signal" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i * 97) % 1400}ms`, opacity: 0.25 + ((i * 13) % 10) / 14 }} />)}
          </div>
          <p className="mt-6 font-mono text-xs tracking-[0.25em] text-signal">GANG MODE · 2–99 PLAYERS</p>
          <h1 className="font-display mt-3 text-[clamp(3.6rem,17vw,9rem)] leading-[0.82] tracking-tight">Ein Raum.<br /><em className="text-signal">Alle drin.</em></h1>
          <p className="mt-5 max-w-xl text-lg text-foreground/85">Partyspiele für 2 bis 99 Leute. Null Vorbereitung, keine Regeln vorlesen: anfangen, und der Raum wird lebendig.</p>
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
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">SO WIRD GESPIELT · PREVIEW</p>
        <h2 id="modes-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Ein Handy oder alle. Du entscheidest.</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {MODES.map(([t, d], i) => (
            <li key={t} className="border-l border-signal/60 pl-4">
              <svg viewBox="0 0 90 40" aria-hidden className="h-10 w-24">
                {i === 0 && <rect x="35" y="4" width="18" height="32" rx="3" fill="none" stroke="var(--signal)" strokeWidth="2" />}
                {i === 1 && [8, 28, 48, 68].map((x) => <rect key={x} x={x} y="8" width="12" height="24" rx="2" fill="var(--signal)" opacity={x === 28 ? 1 : 0.4} />)}
                {i === 2 && <><rect x="10" y="4" width="70" height="26" fill="none" stroke="var(--signal)" strokeWidth="2" /><line x1="45" y1="30" x2="45" y2="38" stroke="var(--signal)" strokeWidth="2" /></>}
              </svg>
              <h3 className="mt-3 font-display text-3xl">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">Die Multiplayer-Runde mit Raumcode ist in Entwicklung – hier siehst du schon, wie sie funktionieren wird.</p>
      </section>

      <section id="katalog" aria-labelledby="katalog-h" className="mx-auto mt-20 max-w-6xl scroll-mt-4 safe-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-signal">{mix ? "BUILD A MIX" : "CHOOSE A GAME"} · {GANG_GAMES.length} SPIELE · WIRD LAUFEND ERWEITERT</p>
            <h2 id="katalog-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4.5rem)] leading-[0.92]">Der Katalog.</h2>
          </div>
          <button type="button" aria-pressed={mix} onClick={() => { haptic(6); setMix(!mix); }} className={btn({ variant: "outline", size: "sm" })}>{mix ? "Mix beenden" : "Mix bauen"}</button>
        </div>
        <div className="mt-6 -mx-1 flex gap-1 overflow-x-auto pb-2" role="group" aria-label="Nach Gefühl filtern">
          {[null, ...GANG_TAGS].map((t) => (
            <button key={t ?? "all"} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}
              className={cn("tap min-h-11 shrink-0 px-3 font-mono text-xs tracking-[0.15em] transition-colors", tag === t ? "border-b-2 border-signal text-signal" : "text-muted-foreground")}>{t ? t.toUpperCase() : "ALLE"}</button>
          ))}
        </div>
        <ul className="mt-4 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {list.map((g) => <GameCard key={g.id} g={g} big={g.status === "prototype"} mix={mix} selected={sel.includes(g.id)} onToggle={() => toggle(g.id)} />)}
        </ul>
        {list.length === 0 && <p className="py-10 text-muted-foreground">Kein Spiel mit diesem Gefühl – noch.</p>}
        <p className="mt-6 text-sm text-muted-foreground">PROTOTYPE-Spiele sind als Erstes dran, IN DEVELOPMENT folgt. Spielbar ist in GANG MODE heute noch nichts – Games for Two schon.</p>
      </section>

      {mix && (
        <aside aria-label="Dein Mix" className="fixed inset-x-0 bottom-0 z-40 border-t border-signal/40 bg-room/95 backdrop-blur safe-x safe-bottom">
          <div className="mx-auto max-w-6xl py-3">
            {preview && sel.length > 0 && (
              <ol className="mb-3 max-h-[40svh] divide-y divide-line overflow-y-auto">
                {sel.map((id, i) => { const g = GANG_GAMES.find((x) => x.id === id)!; return (
                  <li key={id} className="flex min-h-12 items-center gap-3">
                    <span className="w-6 font-mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate font-display text-xl">{g.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">~{avgMinutes(g)}′</span>
                    <button type="button" aria-label={`${g.title} nach oben`} disabled={i === 0} onClick={() => move(i, -1)} className="tap flex size-11 items-center justify-center disabled:opacity-30"><ArrowUp className="size-4" /></button>
                    <button type="button" aria-label={`${g.title} nach unten`} disabled={i === sel.length - 1} onClick={() => move(i, 1)} className="tap flex size-11 items-center justify-center disabled:opacity-30"><ArrowDown className="size-4" /></button>
                    <button type="button" aria-label={`${g.title} entfernen`} onClick={() => toggle(id)} className="tap flex size-11 items-center justify-center"><X className="size-4" /></button>
                  </li>
                ); })}
                <li className="py-2 text-xs text-muted-foreground">Vorschau deiner Reihenfolge – ein Raum startet erst mit der Multiplayer-Runde.</li>
              </ol>
            )}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1" aria-live="polite">
                <p className="font-mono text-xs tracking-[0.15em] text-signal">{sel.length} {sel.length === 1 ? "SPIEL" : "SPIELE"} · ~{mixMinutes(sel)} MIN</p>
                <p className="truncate text-sm text-muted-foreground">{sel.length ? sel.map((id) => GANG_GAMES.find((g) => g.id === id)!.title).join(" → ") : "Wähle PROTOTYPE-Spiele für deinen Mix."}</p>
              </div>
              <button type="button" disabled={!sel.length} onClick={() => setPreview(!preview)} className={cn(btn({ size: "md" }), "shrink-0 bg-signal text-signal-foreground hover:bg-signal/90")}>{preview ? "Schließen" : "Preview mix"}</button>
            </div>
          </div>
        </aside>
      )}

      {setup && <NightSetup onClose={() => setSetup(false)} />}
    </main>
  );
}