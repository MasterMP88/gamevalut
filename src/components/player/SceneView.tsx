import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, Lock } from "lucide-react";
import { Btn } from "@/components/vault/Btn";
import { fill, MAX_ANCHOR_CHARS } from "@/lib/game/engine";
import type { Scene } from "@/lib/game/types";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface SceneProps {
  scene: Scene;
  me: string;
  you: string;
  memory: boolean;
  onDone: (p?: { capture?: { text: string; private: boolean }; syncMatch?: boolean }) => void;
  onSkip: () => void;
  battle?: | {
    players: [string, string];
    missionOwner: string | null;
    onWin: (w: 0 | 1 | null, missionDone: boolean) => void;
    onMissionResult: (success: boolean) => void;
  }
    | undefined;
}

const TYPE_LABEL: Record<Scene["type"], string> = {
  QUESTION: "Frage",
  MISSION: "Mission",
  TIMER: "Countdown",
  CHOICE: "Entscheidung",
  ROULETTE: "Zufall",
  SECRET: "Unter vier Augen",
  SYNC: "Sync",
  ECHO: "Echo",
  GLITCH: "Regelbruch",
  PRIVATE_SIGNAL: "Geheimes Zeichen",
  SHOWDOWN: "Showdown",
  PREDICTION: "Vorhersage",
};

/** Interaction cue: answers "do I speak, tap, hide or pass the phone?" for every scene. */
export function interactionCue(scene: Scene, memory: boolean, battle = false): string {
  if (scene.mechanic === "alternating-rush") return "Abwechselnd sprechen · nach jeder Antwort tippen · die App hält den Puls";
  if (scene.mechanic === "tap-rush") return "Loslegen · jeder Treffer ist ein Tap";
  if (scene.mechanic === "standoff") return "Starten · sobald jemand bricht, Namen antippen";
  if (battle && scene.type === "MISSION" && !scene.duration) return "Tun · danach entscheidet die andere Person";
  switch (scene.type) {
    case "QUESTION":
      return memory && scene.capture ? "Laut antworten · Tippen optional" : "Laut antworten · nichts wird gespeichert";
    case "MISSION": return scene.duration ? "Timer starten · dann tun" : "Tun · dann „Gemacht“";
    case "TIMER": return "Timer starten · dann tun";
    case "CHOICE": return "Tippen · eine Option wählen";
    case "ROULETTE": return "Der Zufall entscheidet";
    case "SECRET": return "Geheim · Handy weitergeben";
    case "PRIVATE_SIGNAL": return "Geheim · nur zwischen euch";
    case "SYNC": return "Beide wählen verdeckt · dann Auflösung";
    case "PREDICTION": return "Heimlich tippen · Handy weitergeben";
    case "ECHO": return "Callback · laut antworten";
    case "GLITCH": return "Neue Regel · gilt sofort";
    case "SHOWDOWN": return "Gemeinsam · Gewinner antippen";
  }
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Prompt({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-display text-[2.1rem] leading-[1.08] text-foreground text-balance sm:text-5xl", className)}>{children}</p>;
}

function Footer({ primary, onPrimary, disabled, onSkip }: { primary: string; onPrimary: () => void; disabled?: boolean; onSkip: () => void }) {
  return (
    <div className="mt-auto flex items-center gap-3 pt-8">
      <Btn variant="ghost" size="lg" className="px-5" onClick={onSkip}>Skip</Btn>
      <Btn size="lg" className="flex-1" onClick={onPrimary} disabled={disabled}>{primary}</Btn>
    </div>
  );
}

export function SceneView(props: SceneProps) {
  const { scene, me, you } = props;
  const text = fill(scene.prompt, me, you);
  const helper = scene.helper ? fill(scene.helper, me, you) : undefined;
  const glitch = scene.type === "GLITCH";
  return (
    <div className="flex flex-1 flex-col animate-rise">
      <div className="flex items-center gap-3">
        <span className={cn("eyebrow", glitch && "text-primary", scene.type === "ECHO" && "text-violet")}>{TYPE_LABEL[scene.type]}</span>
        {scene.source === "ai" && <span className="eyebrow text-champagne">· Director</span>}
      </div>
      <p data-testid="scene-cue" className="mt-1.5 flex items-center gap-2 text-[0.8rem] tracking-wide text-muted-foreground">
        <span className="h-px w-4 bg-current opacity-60" aria-hidden />
        {interactionCue(scene, props.memory, !!props.battle)}
      </p>
      {glitch ? (
        <h2 className="glitch-title font-display mt-3 text-4xl leading-none" data-text={scene.title}>{scene.title}</h2>
      ) : (
        <h2 className="mt-2 text-lg text-muted-foreground">
          {scene.emoji ? <span className="mr-2" aria-hidden>{scene.emoji}</span> : null}
          {scene.title}
        </h2>
      )}
      <Body {...props} text={text} helper={helper} />
    </div>
  );
}

function Body(p: SceneProps & { text: string; helper?: string | undefined }) {
  if (p.scene.mechanic === "alternating-rush") return <AlternatingRushBody {...p} />;
  if (p.scene.mechanic === "tap-rush") return <TapRushBody {...p} />;
  if (p.scene.mechanic === "standoff") return <StandoffBody {...p} />;
  if (p.battle && p.scene.type === "MISSION" && !p.scene.duration) return <BattleMissionBody {...p} />;
  switch (p.scene.type) {
    case "TIMER":
      return <TimerBody {...p} />;
    case "CHOICE":
      return <ChoiceBody {...p} />;
    case "ROULETTE":
      return <RouletteBody {...p} />;
    case "SECRET":
      return <SecretBody {...p} />;
    case "PRIVATE_SIGNAL":
      return <SignalBody {...p} />;
    case "SYNC":
      return <SyncBody {...p} />;
    case "ECHO":
      return <EchoBody {...p} />;
    case "GLITCH":
      return <GlitchBody {...p} />;
    case "SHOWDOWN":
      return <ShowdownBody {...p} />;
    case "PREDICTION":
      return <PredictionBody {...p} />;
    case "MISSION":
      return p.scene.duration ? <TimerBody {...p} /> : <TextBody {...p} />;
    default:
      return <TextBody {...p} />;
  }
}

function Helper({ text }: { text?: string | undefined }) {
  return text ? <p className="mt-4 text-muted-foreground">{text}</p> : null;
}

/** Memory capture: a quiet ruled line that feels like writing in the margin. */
function Capture({ label, value, onChange, priv, onPriv }: { label: string; value: string; onChange: (v: string) => void; priv: boolean; onPriv: (v: boolean) => void }) {
  return (
    <div className="relative mt-10">
      <div className="flex items-center gap-2">
        <EchoGlyph className="size-5 text-violet" />
        <label className="eyebrow text-violet" htmlFor="capture">Für das Echo merken · {label}</label>
      </div>
      <textarea
        id="capture"
        rows={2}
        maxLength={MAX_ANCHOR_CHARS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional. Laut antworten reicht auch."
        className="font-display mt-3 w-full resize-none border-b border-line bg-transparent pb-2 text-[1.35rem] leading-snug text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-violet"
      />
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => { haptic(4); onPriv(!priv); }} className="tap flex min-h-11 items-center gap-2 text-sm text-muted-foreground" aria-pressed={priv}>
          <Lock className={cn("size-4", priv && "text-primary")} /> {priv ? "Privat · kein Rückblick, nie an den Director" : "Als privat markieren"}
        </button>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{value.length}/{MAX_ANCHOR_CHARS}</span>
      </div>
    </div>
  );
}

function EchoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="12" r="6" opacity=".6" />
      <circle cx="12" cy="12" r="10" opacity=".3" />
    </svg>
  );
}

function TextBody({ text, helper, scene, memory, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const [val, setVal] = useState("");
  const [priv, setPriv] = useState(false);
  const capture = memory && scene.capture;
  return (
    <>
      <div className="mt-6">
        <Prompt>{text}</Prompt>
        <Helper text={helper} />
        {capture && <Capture label={scene.capture!.label} value={val} onChange={setVal} priv={priv} onPriv={setPriv} />}
      </div>
      <Footer
        primary={capture && val.trim() ? "Merken & weiter" : scene.type === "MISSION" ? "Gemacht" : "Gesagt →"}
        onPrimary={() => onDone(capture && val.trim() ? { capture: { text: val, private: priv } } : undefined)}
        onSkip={onSkip}
      />
    </>
  );
}


type MicroPhase = "ready" | "count" | "play" | "result";

function AlternatingRushBody({ text, helper, scene, me, you, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const totalMs = (scene.duration ?? 60) * 1000;
  const baseBeat = (scene.beatSeconds ?? 3) * 1000;
  const [phase, setPhase] = useState<MicroPhase>("ready");
  const [countIn, setCountIn] = useState(3);
  const [overall, setOverall] = useState(totalMs);
  const [beat, setBeat] = useState(baseBeat);
  const [speaker, setSpeaker] = useState<0 | 1>(0);
  const [turns, setTurns] = useState<[number, number]>([0, 0]);
  const [streak, setStreak] = useState(0);
  const [loser, setLoser] = useState<0 | 1 | null>(null);

  const names: [string, string] = [me, you];
  const beatFor = (n: number) => baseBeat * (n >= 12 ? 0.67 : n >= 6 ? 0.83 : 1);
  const rule = streak >= 12 ? "NO REPEATS · keine Wiederholung" : streak >= 6 ? "SPEED UP · weniger Zeit pro Antwort" : "KEEP THE PULSE";

  useEffect(() => {
    if (phase !== "count") return;
    const id = setInterval(() => {
      setCountIn((n) => {
        if (n <= 1) {
          clearInterval(id);
          setPhase("play");
          haptic([8, 45, 16]);
          return 0;
        }
        haptic(5);
        return n - 1;
      });
    }, reduced() ? 120 : 650);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      setOverall((v) => Math.max(0, v - 100));
      setBeat((v) => Math.max(0, v - 100));
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    if (overall <= 0) {
      haptic([12, 35, 12]);
      setPhase("result");
      return;
    }
    if (beat <= 0) {
      haptic(180);
      setLoser(speaker);
      setPhase("result");
    }
  }, [overall, beat, phase, speaker]);

  const hit = () => {
    if (phase !== "play") return;
    haptic(5);
    const next = streak + 1;
    setTurns((v) => {
      const n: [number, number] = [...v];
      n[speaker] += 1;
      return n;
    });
    setStreak(next);
    setSpeaker((speaker === 0 ? 1 : 0) as 0 | 1);
    setBeat(beatFor(next));
  };

  const time = Math.ceil(overall / 1000);
  const beatPct = Math.max(0, Math.min(100, (beat / beatFor(streak)) * 100));

  return (
    <>
      <div className="mt-6">
        <Prompt className="text-[1.75rem] sm:text-4xl">{text}</Prompt>
        <Helper text={helper} />
      </div>
      {phase === "ready" && (
        <div className="mt-auto pt-10">
          <p className="eyebrow text-champagne">Microgame · Reaktionspuls</p>
          <p className="font-display mt-2 text-[4rem] leading-none">{scene.beatSeconds ?? 3}s</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Nach jeder Antwort sofort irgendwo auf die Spielfläche tippen. Dann ist die andere Person dran.</p>
          <div className="mt-7 flex gap-3">
            <Btn variant="ghost" size="lg" onClick={onSkip}>Skip</Btn>
            <Btn variant="accent" size="lg" className="flex-1" onClick={() => { setCountIn(3); setPhase("count"); haptic(); }}>3 · 2 · 1</Btn>
          </div>
        </div>
      )}
      {phase === "count" && (
        <button type="button" className="tap mt-auto flex flex-1 flex-col items-center justify-center py-12" aria-label="Countdown läuft">
          <span className="eyebrow">Ready</span>
          <span className="font-display mt-3 text-[9rem] leading-none text-primary tabular-nums">{countIn || "GO"}</span>
        </button>
      )}
      {phase === "play" && (
        <button type="button" onClick={hit} className="tap mt-8 flex min-h-[22rem] flex-1 flex-col rounded-[2rem] border border-line bg-surface-1/40 p-6 text-left" aria-label={`${names[speaker]} hat geantwortet`}>
          <div className="flex w-full items-center justify-between gap-4">
            <span className="eyebrow text-champagne">{rule}</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{time}s</span>
          </div>
          <div className="my-auto">
            <p className="eyebrow">Jetzt</p>
            <p key={`${speaker}-${streak}`} className="font-display mt-2 text-[4.5rem] leading-[0.88] animate-rise">{names[speaker]}</p>
            <p className="mt-4 text-sm text-muted-foreground">Sagen → tippen → weitergeben</p>
          </div>
          <div className="w-full">
            <div className="flex items-end justify-between gap-3"><span className="font-display text-4xl">×{streak}</span><span className="eyebrow">{turns[0]} · {turns[1]}</span></div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-primary transition-[width] duration-100" style={{ width: `${beatPct}%` }} /></div>
          </div>
        </button>
      )}
      {phase === "result" && (
        <div className="mt-auto pt-10 animate-rise">
          <p className="eyebrow text-primary">{loser === null ? "Pulse survived" : "Pulse missed"}</p>
          <p className="font-display mt-3 text-[3.8rem] leading-[0.92]">{loser === null ? `${streak} Antworten.` : `${names[(1 - loser) as 0 | 1]} gewinnt.`}</p>
          <p className="mt-4 text-muted-foreground">{loser === null ? "Kein Zögern. Verdächtig eingespielt." : `${names[loser]} hat den Antwort-Puls verpasst. ${streak} erfolgreiche Wechsel davor.`}</p>
          <dl className="mt-7 grid grid-cols-2 gap-3 border-y border-line py-4"><div><dt className="eyebrow">{me}</dt><dd className="font-display mt-1 text-3xl">{turns[0]}</dd></div><div className="text-right"><dt className="eyebrow">{you}</dt><dd className="font-display mt-1 text-3xl">{turns[1]}</dd></div></dl>
          <Footer primary="Nächste Szene →" onPrimary={() => onDone()} onSkip={onSkip} />
        </div>
      )}
    </>
  );
}

function TapRushBody({ text, helper, scene, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const total = scene.duration ?? 30;
  const [phase, setPhase] = useState<"ready" | "play" | "result">("ready");
  const [left, setLeft] = useState(total);
  const [hits, setHits] = useState(0);
  const goal = scene.goal ?? null;
  useEffect(() => { if (phase !== "play") return; const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000); return () => clearInterval(id); }, [phase]);
  useEffect(() => { if (phase === "play" && left === 0) { haptic(120); setPhase("result"); } }, [left, phase]);
  const register = () => { if (phase !== "play") return; const next = hits + 1; setHits(next); haptic(next % 5 === 0 ? [5, 30, 10] : 4); if (goal && next >= goal) setPhase("result"); };
  return (
    <>
      <div className="mt-6"><Prompt className="text-[1.75rem] sm:text-4xl">{text}</Prompt><Helper text={helper} /></div>
      {phase === "ready" ? (
        <div className="mt-auto pt-10"><p className="eyebrow text-champagne">Microgame · Trefferjagd</p><p className="font-display mt-2 text-[4rem] leading-none">{goal ? `0/${goal}` : "0"}</p><p className="mt-2 text-sm text-muted-foreground">Jede gültige Antwort zählt erst nach einem Tap. Die App hält Zeit und Treffer fest.</p><div className="mt-7 flex gap-3"><Btn variant="ghost" size="lg" onClick={onSkip}>Skip</Btn><Btn variant="accent" size="lg" className="flex-1" onClick={() => { haptic(); setPhase("play"); }}>Start · {total}s</Btn></div></div>
      ) : phase === "play" ? (
        <button type="button" onClick={register} className="tap mt-8 flex min-h-[22rem] flex-1 flex-col rounded-[2rem] border border-line bg-surface-1/40 p-6 text-left" aria-label="Treffer zählen"><div className="flex items-center justify-between"><span className="eyebrow text-champagne">Tap = Treffer</span><span className="font-mono text-sm tabular-nums">{left}s</span></div><div className="my-auto"><p className="font-display text-[7rem] leading-none tabular-nums text-primary">{hits}</p><p className="mt-2 text-muted-foreground">{goal ? `von ${goal} · ` : ""}weitermachen</p></div><div className="h-1 w-full overflow-hidden rounded-full bg-line"><div className="h-full bg-primary transition-all duration-700" style={{ width: `${goal ? Math.min(100, hits / goal * 100) : (1 - left / total) * 100}%` }} /></div></button>
      ) : (
        <div className="mt-auto pt-10 animate-rise"><p className="eyebrow text-primary">{goal && hits >= goal ? "Goal crushed" : "Time"}</p><p className="font-display mt-2 text-[5rem] leading-none">{goal ? `${hits}/${goal}` : hits}</p><p className="mt-3 text-muted-foreground">{goal && hits >= goal ? "Vor der Zeit. Das zählt." : `${hits} Treffer in ${total - left || total} Sekunden.`}</p><Footer primary="Nächste Szene →" onPrimary={() => onDone()} onSkip={onSkip} /></div>
      )}
    </>
  );
}

function StandoffBody({ text, helper, scene, me, you, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const total = scene.duration ?? 20;
  const [phase, setPhase] = useState<"ready" | "play" | "result">("ready");
  const [left, setLeft] = useState(total);
  const [loser, setLoser] = useState<0 | 1 | null>(null);
  const names: [string, string] = [me, you];
  useEffect(() => { if (phase !== "play") return; const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000); return () => clearInterval(id); }, [phase]);
  useEffect(() => { if (phase === "play" && left === 0) { haptic([10, 30, 10]); setPhase("result"); } }, [left, phase]);
  const breaks = (who: 0 | 1) => { setLoser(who); setPhase("result"); haptic(120); };
  return (
    <>
      <div className="mt-6"><Prompt className="text-[1.8rem] sm:text-4xl">{text}</Prompt><Helper text={helper} /></div>
      {phase === "ready" ? (
        <div className="mt-auto pt-10"><p className="eyebrow text-champagne">Standoff</p><p className="font-display mt-2 text-[4rem] leading-none">{total}s</p><p className="mt-2 text-sm text-muted-foreground">Start drücken. Sobald jemand bricht, sofort den Namen antippen. Kein Diskutieren danach.</p><div className="mt-7 flex gap-3"><Btn variant="ghost" size="lg" onClick={onSkip}>Skip</Btn><Btn variant="accent" size="lg" className="flex-1" onClick={() => { haptic(); setPhase("play"); }}>Start</Btn></div></div>
      ) : phase === "play" ? (
        <div className="mt-auto pt-8"><div className="text-center"><span className="font-display text-[7rem] leading-none tabular-nums">{left}</span><p className="eyebrow mt-2 text-primary">Wer bricht?</p></div><div className="mt-8 grid grid-cols-2 gap-3"><Btn variant="outline" className="min-h-24 whitespace-normal text-xl" onClick={() => breaks(0)}>{me}<br/><span className="text-xs opacity-60">bricht</span></Btn><Btn variant="accent" className="min-h-24 whitespace-normal text-xl" onClick={() => breaks(1)}>{you}<br/><span className="text-xs opacity-60">bricht</span></Btn></div></div>
      ) : (
        <div className="mt-auto pt-10 animate-rise"><p className="eyebrow text-primary">{loser === null ? "Dead heat" : "Standoff entschieden"}</p><p className="font-display mt-3 text-[3.8rem] leading-[0.92]">{loser === null ? "Niemand gebrochen." : `${names[(1 - loser) as 0 | 1]} gewinnt.`}</p><p className="mt-4 text-muted-foreground">{loser === null ? `${total} Sekunden. Das war unangenehm stabil.` : `${names[loser]} war zuerst raus.`}</p><Footer primary="Nächste Szene →" onPrimary={() => onDone()} onSkip={onSkip} /></div>
      )}
    </>
  );
}

/** Timer: editorial numerals over a single hairline that drains. */
function TimerBody({ text, helper, scene, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const total = scene.duration ?? 30;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);
  useEffect(() => {
    if (left === 0) {
      setRunning(false);
      haptic(160);
    } else if (running && left <= 3) haptic(6);
  }, [left, running]);
  const pct = left / total;
  const over = left === 0;
  return (
    <>
      <div className="mt-6">
        <Prompt className="text-[1.75rem] sm:text-4xl">{text}</Prompt>
        <Helper text={helper} />
      </div>
      <div className="mt-10" role="timer" aria-live="polite">
        <div className="flex items-end justify-between gap-4">
          <span className={cn("font-display text-[6.5rem] leading-[0.8] tabular-nums tracking-tight transition-colors", over ? "text-primary" : running ? "text-foreground" : "text-foreground/70")}>
            {over ? "Zeit." : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}
          </span>
          <span className="eyebrow pb-2">{over ? "vorbei" : running ? "läuft" : left === total ? "bereit" : "pausiert"}</span>
        </div>
        <div className="relative mt-5 h-px w-full bg-line">
          <div className="absolute inset-y-0 left-0 h-[2px] -translate-y-[0.5px] bg-primary" style={{ width: `${pct * 100}%`, transition: "width 1s linear" }} />
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => { haptic(); setRunning((r) => !r); }}
            disabled={over}
            aria-label={running ? "Pause" : "Start"}
            className="tap flex size-16 items-center justify-center rounded-full border border-foreground/80 text-foreground disabled:opacity-30"
          >
            {running ? <Pause className="size-6" /> : <Play className="ml-0.5 size-6" />}
          </button>
          <span className="text-sm text-muted-foreground">{running ? "Pause" : left === total ? "Start" : over ? "" : "Weiter"}</span>
          <button type="button" onClick={() => { haptic(4); setRunning(false); setLeft(total); }} className="tap ml-auto flex min-h-11 items-center gap-2 px-2 text-sm text-muted-foreground" aria-label="Reset">
            <RotateCcw className="size-4" /> Reset
          </button>
        </div>
      </div>
      <Footer primary="Fertig" onPrimary={() => onDone()} onSkip={onSkip} />
    </>
  );
}


function BattleMissionBody({ text, helper, scene, me, you, battle, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const [judge, setJudge] = useState(false);
  const stake = scene.sparks ?? 1;
  if (!judge) {
    return (
      <>
        <div className="mt-6">
          <p className="eyebrow text-champagne">Heatcheck · {stake} {stake === 1 ? "Spark" : "Sparks"}</p>
          <Prompt>{text}</Prompt>
          <Helper text={helper} />
        </div>
        <div className="mt-auto pt-8">
          <p className="text-sm text-muted-foreground">{you} entscheidet, ob es zählt. Keine Selbstbedienung bei Punkten.</p>
          <div className="mt-4 flex gap-3">
            <Btn variant="ghost" size="lg" onClick={onSkip}>Passen</Btn>
            <Btn size="lg" className="flex-1" onClick={() => { haptic(8); setJudge(true); }}>Bewertung →</Btn>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="mt-10 animate-rise">
        <p className="eyebrow text-primary">{you} ist Referee</p>
        <p className="font-display mt-3 text-[3rem] leading-[0.96]">Zählt der Versuch von {me}?</p>
        <p className="mt-4 text-muted-foreground">Nur das Ergebnis antippen. Diskussionen kosten Würde, aber keine Sparks.</p>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
        <Btn variant="outline" className="min-h-20 text-lg" onClick={() => { haptic(60); battle?.onMissionResult(false); }}>Daneben</Btn>
        <Btn variant="accent" className="min-h-20 text-lg" onClick={() => { haptic([8, 30, 14]); battle?.onMissionResult(true); }}>Treffer · +{stake}</Btn>
      </div>
    </>
  );
}

/** Choice: a numbered editorial index; the chosen line lights up. */
function ChoiceBody({ text, helper, scene, me, you, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <>
      <div className="mt-6">
        <Prompt>{text}</Prompt>
        <Helper text={helper} />
      </div>
      <div className="mt-auto flex flex-col">
        <EditorialOptions options={scene.choices ?? []} me={me} you={you} value={pick} onPick={setPick} />
        <Footer primary={pick === null ? "Erst wählen" : "Entschieden →"} disabled={pick === null} onPrimary={() => onDone()} onSkip={onSkip} />
      </div>
    </>
  );
}

function EditorialOptions({ options, me, you, value, onPick }: { options: string[]; me: string; you: string; value: number | null; onPick: (i: number) => void }) {
  return (
    <div className="mt-8 border-t border-line" role="radiogroup">
      {options.map((o, i) => {
        const on = value === i;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => { haptic(6); onPick(i); }}
            className={cn("tap group relative flex min-h-16 w-full items-center gap-4 border-b border-line py-3 pl-1 text-left transition-colors", value !== null && !on && "opacity-45")}
          >
            <span className={cn("absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 bg-primary transition-transform duration-300", on && "scale-y-100")} aria-hidden />
            <span className={cn("font-mono w-7 shrink-0 pl-2 text-xs tabular-nums", on ? "text-primary" : "text-muted-foreground")}>{String(i + 1).padStart(2, "0")}</span>
            <span className="font-display text-[1.6rem] leading-tight">{fill(o, me, you)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Roulette: a typographic drum — words roll through a single window, then settle. */
function RouletteBody({ text, scene, me, you, onDone, onSkip }: SceneProps & { text: string }) {
  const opts = scene.choices ?? [];
  const [idx, setIdx] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [tick, setTick] = useState(0);
  const spin = () => {
    if (spinning || !opts.length) return;
    setSpinning(true);
    haptic();
    const target = Math.floor(Math.random() * opts.length);
    const steps = reduced() ? 1 : opts.length * 3 + target;
    let i = 0;
    let delay = 55;
    const step = () => {
      setIdx(i % opts.length);
      setTick((k) => k + 1);
      if (i >= steps - 1) {
        setIdx(target);
        setSpinning(false);
        haptic([10, 40, 30]);
        return;
      }
      if (i % 2 === 0) haptic(3);
      i++;
      delay *= 1.085;
      setTimeout(step, delay);
    };
    step();
  };
  const done = idx !== null && !spinning;
  const at = (k: number) => (idx === null ? null : fill(opts[(idx + k + opts.length) % opts.length] ?? "", me, you));
  return (
    <>
      <div className="mt-6">
        <Prompt className="text-[1.75rem] sm:text-4xl">{text}</Prompt>
      </div>
      <div className="relative mt-10 overflow-hidden py-2" aria-live="polite">
        <div className="pointer-events-none flex flex-col items-start gap-1">
          <span className="font-display h-8 truncate text-xl text-muted-foreground/40">{idx === null ? "" : at(-1)}</span>
          <div className="relative w-full border-y border-line py-4">
            <span className={cn("absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 bg-primary transition-opacity", done ? "opacity-100" : "opacity-40")} aria-hidden />
            <span key={tick} className={cn("font-display block pl-4 text-[2.4rem] leading-tight", spinning && "animate-drum", done && "text-primary")}>
              {idx === null ? <span className="text-muted-foreground/60">{opts.length} Möglichkeiten</span> : at(0)}
            </span>
          </div>
          <span className="font-display h-8 truncate text-xl text-muted-foreground/40">{idx === null ? "" : at(1)}</span>
        </div>
      </div>
      {done && <p className="eyebrow mt-4 text-primary animate-rise">Der Zufall hat gesprochen</p>}
      <div className="mt-auto flex items-center gap-3 pt-8">
        <Btn variant="ghost" size="lg" className="px-5" onClick={onSkip}>Skip</Btn>
        {done ? (
          <Btn size="lg" className="flex-1" onClick={() => onDone()}>Gemacht</Btn>
        ) : (
          <Btn variant="accent" size="lg" className="flex-1" onClick={spin} disabled={spinning}>{spinning ? "Rollt …" : "Zufall entscheiden"}</Btn>
        )}
      </div>
    </>
  );
}

/** Full-bleed privacy veil for passing the phone. */
function HandOver({ to, onReady, note, onSkip }: { to: string; onReady: () => void; note: string; onSkip: () => void }) {
  return (
    <div className="mt-6 flex flex-1 flex-col">
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden border-y border-line bg-surface/45 px-5 py-12">
        <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 -top-16 size-72 text-primary/30 animate-slow-pulse" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="100" cy="100" r="40" />
          <circle cx="100" cy="100" r="70" opacity=".5" />
          <circle cx="100" cy="100" r="98" opacity=".25" />
        </svg>
        <div className="mb-8 flex items-center gap-3 text-primary/70" aria-hidden>
          <span className="font-display text-xl tracking-[0.16em]">N//</span>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]">sealed</span>
        </div>
        <p className="eyebrow">Handy weitergeben</p>
        <p className="font-display mt-4 text-[3.2rem] leading-[0.95] text-balance break-words">Nur für<br /><em className="text-primary not-italic">{to}</em>.</p>
        <p className="mt-5 max-w-[30ch] leading-relaxed text-muted-foreground">{note}</p>
        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55">Vorherige Auswahl ist verdeckt</p>
      </div>
      <Btn size="lg" className="mt-6 w-full" onClick={() => { haptic(12); onReady(); }}>Ich bin {to} · aufdecken</Btn>
      <Btn variant="ghost" size="lg" className="mt-2 w-full" onClick={onSkip}>Skip</Btn>
    </div>
  );
}

function Sealed({ children }: { children: ReactNode }) {
  return (
    <div className="relative mt-6 px-5 py-8">
      {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map((c) => (
        <span key={c} className={cn("absolute size-5 border-primary/70", c)} aria-hidden />
      ))}
      {children}
    </div>
  );
}

function SecretBody({ text, me, onDone, onSkip }: SceneProps & { text: string }) {
  const [stage, setStage] = useState<"hand" | "show" | "hidden">("hand");
  if (stage === "hand") return <HandOver to={me} onReady={() => setStage("show")} note="Die andere Person schaut weg. Kein Spicken – das ist Teil des Spiels." onSkip={onSkip} />;
  if (stage === "show")
    return (
      <>
        <p className="eyebrow mt-6 text-primary">Nur für dich, {me}</p>
        <Sealed><Prompt className="text-[1.9rem]">{text}</Prompt></Sealed>
        <Footer primary="Gemerkt · versiegeln" onPrimary={() => { haptic(10); setStage("hidden"); }} onSkip={onSkip} />
      </>
    );
  return (
    <>
      <div className="mt-12 flex flex-col items-start animate-rise">
        <span className="flex size-14 items-center justify-center rounded-full border border-primary/60 text-primary"><Lock className="size-5" /></span>
        <Prompt className="mt-6">Versiegelt.</Prompt>
        <p className="mt-3 text-muted-foreground">Handy zurück in die Mitte. Niemand weiß etwas. Noch nicht.</p>
      </div>
      <Footer primary="Weiter" onPrimary={() => onDone()} onSkip={onSkip} />
    </>
  );
}

function SignalBody({ text, helper, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  return (
    <>
      <div className="mt-6">
        <Prompt>{text}</Prompt>
        <Helper text={helper} />
      </div>
      <div className="mt-10 flex items-center gap-3 text-primary" aria-hidden>
        <span className="size-2 rounded-full bg-current" />
        <span className="h-px flex-1 bg-gradient-to-r from-primary to-violet" />
        <span className="size-2 rounded-full bg-violet" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Bleibt unter euch. Wird nirgends gespeichert.</p>
      <Footer primary="Zeichen steht" onPrimary={() => onDone()} onSkip={onSkip} />
    </>
  );
}

/** Sync: two private picks, a handoff, then a reveal ritual. */
function SyncBody({ text, scene, me, you, onDone, onSkip }: SceneProps & { text: string }) {
  const [stage, setStage] = useState<"a" | "pass" | "b" | "reveal">("a");
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const opts = scene.choices ?? [];
  const steps = ["a", "pass", "b", "reveal"];
  const Rail = () => (
    <div className="mt-5 flex items-center gap-2" aria-hidden>
      {steps.map((s, i) => (
        <span key={s} className={cn("h-[2px] flex-1 rounded-full transition-colors", steps.indexOf(stage) >= i ? "bg-primary" : "bg-line")} />
      ))}
    </div>
  );
  if (stage === "pass") return (<><Rail /><HandOver to={you} onReady={() => setStage("b")} note={`${me} hat gewählt. Die Wahl ist verdeckt.`} onSkip={onSkip} /></>);
  if (stage === "a" || stage === "b") {
    const who = stage === "a" ? me : you;
    const val = stage === "a" ? a : b;
    return (
      <>
        <Rail />
        <p className="eyebrow mt-6">{who} wählt verdeckt</p>
        <Prompt className="mt-2 text-[1.75rem] sm:text-4xl">{text}</Prompt>
        <EditorialOptions options={opts} me={me} you={you} value={val} onPick={stage === "a" ? setA : setB} />
        <Footer
          primary={stage === "a" ? "Verdecken & weitergeben" : "Auflösen"}
          disabled={val === null}
          onPrimary={() => { haptic(10); setStage(stage === "a" ? "pass" : "reveal"); }}
          onSkip={onSkip}
        />
      </>
    );
  }
  const match = a === b;
  return (
    <>
      <Rail />
      <div className="relative mt-8 overflow-x-clip">
        {match && (
          <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-10 -top-12 size-56 text-primary/40" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="80" cy="100" r="60" className="animate-ripple" />
            <circle cx="120" cy="100" r="60" className="animate-ripple" style={{ animationDelay: "600ms" }} />
          </svg>
        )}
        <p className={cn("eyebrow", match && "text-primary")}>{match ? "Gleiche Frequenz" : "Zwei Richtungen"}</p>
        <Prompt className="mt-3 text-[3rem] leading-none">{match ? "Synchron." : "Interessant."}</Prompt>
        <div className="mt-10 space-y-6">
          {([[me, a], [you, b]] as const).map(([n, v], i) => (
            <div key={i} className="animate-rise" style={{ animationDelay: `${i * 260}ms` }}>
              <p className="eyebrow">{n}</p>
              <p className="font-display mt-1 text-[2rem] leading-tight">{fill(opts[v ?? 0] ?? "", me, you)}</p>
            </div>
          ))}
        </div>
        {!match && <p className="mt-8 text-muted-foreground">Jeder verteidigt die eigene Wahl in genau einem Satz.</p>}
      </div>
      <Footer primary="Weiter" onPrimary={() => onDone({ syncMatch: match })} onSkip={onSkip} />
    </>
  );
}

/** Echo: the callback arrives inside a widening trace of rings. */
function EchoBody({ text, onDone, onSkip }: SceneProps & { text: string }) {
  useEffect(() => { haptic([6, 60, 6]); }, []);
  return (
    <>
      <div className="relative mt-8">
        <svg viewBox="0 0 300 300" className="pointer-events-none absolute -left-24 -top-24 size-[22rem] text-violet" fill="none" stroke="currentColor" aria-hidden>
          {[40, 80, 120].map((r, i) => (
            <circle key={r} cx="150" cy="150" r={r} strokeWidth="0.8" className="animate-ripple" style={{ animationDelay: `${i * 900}ms`, transformOrigin: "150px 150px" }} />
          ))}
        </svg>
        <p className="eyebrow relative text-violet">Die Nacht erinnert sich</p>
        <Prompt className="relative mt-4">{text}</Prompt>
      </div>
      <Footer primary="Gesagt →" onPrimary={() => onDone()} onSkip={onSkip} />
    </>
  );
}

function GlitchBody({ text, helper, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  useEffect(() => { haptic([4, 30, 4, 30, 4]); }, []);
  return (
    <>
      <div className="mt-6">
        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px w-10 bg-primary" />
          <span className="font-mono text-xs text-primary">neue Regel</span>
        </div>
        <Prompt className="mt-4">{text}</Prompt>
        <Helper text={helper} />
      </div>
      <Footer primary="Regel gilt" onPrimary={() => onDone()} onSkip={onSkip} />
    </>
  );
}

function ShowdownBody({ text, battle, onSkip }: SceneProps & { text: string }) {
  const [mission, setMission] = useState(false);
  if (!battle) return null;
  return (
    <>
      <div className="mt-6">
        <Prompt>{text}</Prompt>
        <p className="eyebrow mt-5 text-champagne">Gewinner · +3 Sparks</p>
      </div>
      {battle.missionOwner && (
        <button type="button" onClick={() => { haptic(4); setMission(!mission); }} aria-pressed={mission} className="tap mt-8 flex min-h-12 items-center gap-3 border-y border-line py-3 text-left">
          <span className={cn("size-5 rounded-full border border-input transition-colors", mission && "border-primary bg-primary")} />
          Geheime Mission von {battle.missionOwner} erfüllt (+2)
        </button>
      )}
      <div className="mt-auto pt-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
          <Btn size="lg" className="h-auto min-h-16 whitespace-normal break-words px-4" onClick={() => { haptic(14); battle.onWin(0, mission); }}><span className="flex flex-col"><span>{battle.players[0]}</span><span className="text-xs opacity-70">gewinnt</span></span></Btn>
          <span className="font-display self-center text-2xl text-muted-foreground">vs</span>
          <Btn size="lg" variant="accent" className="h-auto min-h-16 whitespace-normal break-words px-4" onClick={() => { haptic(14); battle.onWin(1, mission); }}><span className="flex flex-col"><span>{battle.players[1]}</span><span className="text-xs opacity-70">gewinnt</span></span></Btn>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Btn variant="outline" onClick={() => battle.onWin(null, mission)}>Unentschieden</Btn>
          <Btn variant="ghost" onClick={onSkip}>Skip</Btn>
        </div>
      </div>
    </>
  );
}

type PStage = "predict" | "own" | "pass" | "partner" | "reveal";

/** Prediction: guess the partner's pick in secret, hand over, partner picks, reveal. */
function PredictionBody({ text, helper, scene, me, you, onDone, onSkip }: SceneProps & { text: string; helper?: string | undefined }) {
  const [stage, setStage] = useState<PStage>("predict");
  const [guess, setGuess] = useState<number | null>(null);
  const [own, setOwn] = useState<number | null>(null);
  const [actual, setActual] = useState<number | null>(null);
  const opts = scene.choices ?? [];
  const order: PStage[] = ["predict", "own", "pass", "partner", "reveal"];
  const rail = (
    <div className="mt-5 flex items-center gap-2" aria-hidden>
      {order.map((st, i) => (
        <span key={st} className={cn("h-[2px] flex-1 rounded-full transition-colors duration-500", order.indexOf(stage) >= i ? "bg-primary" : "bg-line")} />
      ))}
    </div>
  );
  const label = (i: number | null) => (i === null ? "" : fill(opts[i] ?? "", me, you));
  if (stage === "pass")
    return (<>{rail}<HandOver to={you} onReady={() => setStage("partner")} note={`${me} hat getippt. Alles verdeckt – nichts verraten, bis aufgelöst wird.`} onSkip={onSkip} /></>);
  if (stage !== "reveal") {
    const cfg = {
      predict: { who: `${me} · heimlich`, q: `Was glaubst du, wählt ${you}?`, val: guess, set: setGuess, cta: "Getippt →", next: "own" as PStage },
      own: { who: `${me} · optional`, q: "Und du?", val: own, set: setOwn, cta: "Verdecken & weitergeben", next: "pass" as PStage },
      partner: { who: `${you} · heimlich`, q: helper ?? "Und du?", val: actual, set: setActual, cta: "Auflösen", next: "reveal" as PStage },
    }[stage];
    return (
      <div key={stage} className="flex flex-1 flex-col animate-rise">
        {rail}
        <Prompt className="mt-6 text-[1.6rem] text-muted-foreground sm:text-3xl">{text}</Prompt>
        <div className="mt-auto flex flex-col pt-8">
          <p className="eyebrow text-primary">{cfg.who}</p>
          <p className="font-display mt-2 text-[2.2rem] leading-[1.05]" data-testid="prediction-question">{cfg.q}</p>
          <EditorialOptions options={opts} me={me} you={you} value={cfg.val} onPick={cfg.set} />
          {stage === "own" ? (
            <div className="mt-auto flex items-center gap-3 pt-8">
              <Btn variant="ghost" size="lg" className="px-4" onClick={() => { setOwn(null); setStage("pass"); }}>Nicht verraten</Btn>
              <Btn size="lg" className="flex-1" disabled={own === null} onClick={() => { haptic(10); setStage("pass"); }}>{own === null ? "Erst wählen" : cfg.cta}</Btn>
            </div>
          ) : (
            <Footer primary={cfg.val === null ? "Erst wählen" : cfg.cta} disabled={cfg.val === null} onPrimary={() => { haptic(10); setStage(cfg.next); }} onSkip={onSkip} />
          )}
        </div>
      </div>
    );
  }
  const hit = guess === actual;
  const same = own !== null && own === actual;
  const head = hit ? "Zu gut gelesen." : "Okay. Plot Twist.";
  const sub = hit && same ? "Und ihr wollt beide dasselbe." : same ? "Gleiche Richtung – nur falsch getippt." : hit ? `${me} kennt ${you} besser als gedacht.` : `${you} bleibt unberechenbar.`;
  return (
    <div className="flex flex-1 flex-col">
      {rail}
      <div className="relative mt-8 overflow-x-clip animate-rise">
        {hit && (
          <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-10 -top-12 size-56 text-primary/40" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="80" cy="100" r="60" className="animate-ripple" />
            <circle cx="120" cy="100" r="60" className="animate-ripple" style={{ animationDelay: "600ms" }} />
          </svg>
        )}
        <p className={cn("eyebrow", hit && "text-primary")}>Auflösung</p>
        <p className="font-display mt-3 text-[2.8rem] leading-none" data-testid="prediction-result">{head}</p>
        <p className="mt-3 text-muted-foreground">{sub}</p>
      </div>
      <dl className="mt-10 space-y-5 border-t border-line pt-6">
        {([[`${me} tippte`, guess], [`${you} wählt`, actual], ...(own !== null ? [[`${me} selbst`, own]] : [])] as [string, number | null][]).map(([k, v], i) => (
          <div key={k} className="animate-rise" style={{ animationDelay: `${(i + 1) * 240}ms` }}>
            <dt className="eyebrow">{k}</dt>
            <dd className="font-display mt-1 text-[1.9rem] leading-tight">{label(v)}</dd>
          </div>
        ))}
      </dl>
      <Footer primary="Weiter" onPrimary={() => onDone({ syncMatch: hit })} onSkip={onSkip} />
    </div>
  );
}