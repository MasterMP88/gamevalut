import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/vault/Btn";
import { MUSIC_VIBES } from "@/lib/game/music-scenes";
import type { MusicMode, MusicReaction, MusicRound, MusicSignature, Track } from "@/lib/game/types";
import { canPlay, manualProvider, sameSong, type MusicProvider } from "@/lib/music/provider";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Footer, HandOver, Prompt, type SceneProps } from "./SceneView";

export function useMusicProvider(override?: MusicProvider): MusicProvider {
  const [p, setP] = useState<MusicProvider>(override ?? manualProvider);
  useEffect(() => {
    if (override) return;
    let live = true;
    import("@/lib/music/apple-music")
      .then((m) => m.resolveMusicProvider())
      .then((r) => { if (live) setP(r); })
      .catch(() => {});
    return () => { live = false; };
  }, [override]);
  return p;
}

const empty = (n: number): MusicRound => ({
  sceneNumber: n,
  stage: "pick",
  picks: [null, null],
  prediction: null,
  reaction: null,
  speedExpired: false,
});

const SIGNATURE_LABEL: Record<MusicSignature, string> = {
  "needle-drop": "NEEDLE DROP",
  "aux-swap": "AUX SWAP",
  "red-flag": "RED FLAG",
  "one-song": "ONE SONG",
  "last-track": "LAST TRACK",
};

const REACTION_META: Record<Exclude<MusicReaction, "match">, { label: string; line: string }> = {
  "same-energy": { label: "SAME ENERGY", line: "Nicht derselbe Track. Aber exakt dieselbe Frequenz." },
  twist: { label: "PLOT TWIST", line: "Okay. Ihr habt denselben Moment komplett anders gehört." },
  explains: { label: "DAS ERKLÄRT EINIGES", line: "Plötzlich ergibt erschreckend viel Sinn." },
  "no-questions": { label: "KEINE FRAGEN", line: "Wir lassen das einfach so im Raum stehen." },
  "read-hit": { label: "TREFFER", line: "Du kennst diesen Musikgeschmack verdächtig gut." },
};

function stages(mode: MusicMode) {
  if (mode === "speed" || mode === "consensus") return ["pick", "reveal"] as const;
  if (mode === "solo") return ["pick", "handoff", "reveal"] as const;
  return ["pick", "handoff", "second", "reveal"] as const;
}

/** PASS//THE AUX changes social rhythm instead of repeating one generic prompt loop. */
export function MusicRoundBody(p: SceneProps & { text: string; helper?: string | undefined; provider?: MusicProvider }) {
  const { scene, me, you, onDone, onSkip, text } = p;
  const mode = scene.music?.mode ?? "solo";
  const signature = scene.music?.signature;
  const sceneNumber = p.music?.sceneNumber ?? 0;
  const [localRound, setLocalRound] = useState<MusicRound>(() => empty(sceneNumber));
  const round = p.music?.round && p.music.round.sceneNumber === sceneNumber ? p.music.round : localRound;
  const set = (r: MusicRound) => { setLocalRound(r); p.music?.setRound(r); };
  const [gate, setGate] = useState(round.stage === "second");
  const provider = useMusicProvider(p.provider);
  const steps = stages(mode);
  const progressIndex = Math.max(0, steps.indexOf(round.stage as never));

  const rail = (
    <div className="mt-5" aria-hidden>
      <div className="flex items-center gap-2">
        {steps.map((st, i) => (
          <span key={st} className={cn("h-[2px] flex-1 rounded-full transition-all duration-500", progressIndex >= i ? "bg-primary" : "bg-line")} />
        ))}
      </div>
      {signature && (
        <p className="mt-3 flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.28em] text-champagne">
          <span className="inline-block size-1.5 rotate-45 bg-champagne" />
          SIGNATURE BEAT · {SIGNATURE_LABEL[signature]}
        </p>
      )}
    </div>
  );

  if (round.stage === "pick") {
    const direct = mode === "speed" || mode === "consensus";
    const who = mode === "consensus" ? me + " + " + you + " · gemeinsam" : me + " · " + (mode === "speed" ? "Instinkt" : "verdeckt");
    return (
      <>
        {rail}
        <PickForm
          key="a"
          provider={provider}
          who={who}
          text={text}
          speed={mode === "speed"}
          speedExpired={round.speedExpired}
          privatePick={!direct}
          cta={mode === "speed" ? "Lock it in" : mode === "consensus" ? "Diesen Track nehmen" : "Auswahl versiegeln"}
          onSpeedExpired={() => { if (!round.speedExpired) set({ ...round, speedExpired: true }); }}
          onSkip={onSkip}
          onPick={(t) => {
            haptic(10);
            set({ ...round, picks: [t, null], stage: direct ? "reveal" : "handoff" });
          }}
        />
      </>
    );
  }

  if (round.stage === "handoff" || gate) {
    const note =
      mode === "duet"
        ? signature === "red-flag"
          ? me + " hat sich festgelegt. Nichts verraten – jetzt kommt deine Red Flag."
          : me + " hat gewählt – versiegelt. Jetzt du, zum selben Moment."
        : mode === "guess"
          ? me + " hat einen Song versteckt. Lies erst den Grund dahinter – dann wird entsiegelt."
          : signature === "aux-swap"
            ? me + " hat einen Song für dich gewählt. Erst nach dem Handoff wird er sichtbar."
            : me + " hat einen Song versiegelt. Jetzt gehört das Display dir.";
    return (
      <>
        {rail}
        <HandOver
          to={you}
          note={note}
          onSkip={onSkip}
          onReady={() => {
            setGate(false);
            if (round.stage === "handoff") set({ ...round, stage: mode === "solo" ? "reveal" : "second" });
          }}
        />
      </>
    );
  }

  if (round.stage === "second" && mode === "duet") {
    return (
      <>
        {rail}
        <PickForm
          key="b"
          provider={provider}
          who={you + " · verdeckt"}
          text={text}
          privatePick
          cta="Beide entsiegeln"
          onSkip={onSkip}
          onPick={(t) => {
            haptic(14);
            set({ ...round, picks: [round.picks[0], t], stage: "reveal" });
          }}
        />
      </>
    );
  }

  if (round.stage === "second") {
    const reads = scene.choices?.length ? scene.choices : [...MUSIC_VIBES];
    return (
      <div className="flex flex-1 flex-col animate-rise">
        {rail}
        <Prompt className="mt-6 text-[1.45rem] text-muted-foreground sm:text-3xl">{text}</Prompt>
        <div className="mt-auto flex flex-col pt-8">
          <p className="eyebrow text-primary">{you} · READ//THE TRACK</p>
          <p className="font-display mt-2 text-[2.1rem] leading-[1.05] text-balance">Warum glaubst du, hat {me} genau diesen Song gewählt?</p>
          <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Grund tippen">
            {reads.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={round.prediction === v}
                onClick={() => { haptic(6); set({ ...round, prediction: v }); }}
                className={cn("min-h-16 rounded-2xl border px-4 py-3 text-left text-base transition-all focus-visible:outline-2 focus-visible:outline-primary", round.prediction === v ? "border-primary bg-primary/15 text-foreground" : "border-line bg-surface/40 text-muted-foreground hover:border-foreground/30")}
              >
                {v}
              </button>
            ))}
          </div>
          <Footer
            primary={round.prediction ? "Read aufdecken" : "Erst festlegen"}
            disabled={!round.prediction}
            onPrimary={() => { haptic(14); set({ ...round, stage: "reveal" }); }}
            onSkip={onSkip}
          />
        </div>
      </div>
    );
  }

  return (
    <Reveal
      round={round}
      mode={mode}
      signature={signature}
      me={me}
      you={you}
      text={text}
      provider={provider}
      rail={rail}
      onReaction={(reaction) => set({ ...round, reaction })}
      onNext={onDone}
      onSkip={onSkip}
    />
  );
}

function ReactionGrid({
  options,
  selected,
  onSelect,
}: {
  options: Exclude<MusicReaction, "match">[];
  selected: MusicReaction | null;
  onSelect: (reaction: MusicReaction) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Reveal einordnen">
      {options.map((reaction) => {
        const meta = REACTION_META[reaction];
        return (
          <button
            key={reaction}
            type="button"
            aria-pressed={selected === reaction}
            data-testid={"music-reaction-" + reaction}
            onClick={() => { haptic(8); onSelect(reaction); }}
            className={cn("min-h-14 rounded-2xl border px-3 py-3 text-left transition-all", selected === reaction ? "border-primary bg-primary/15 text-foreground" : "border-line bg-surface/30 text-muted-foreground hover:border-foreground/30")}
          >
            <span className="block font-mono text-[0.65rem] tracking-[0.16em]">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Reveal({
  round,
  mode,
  signature,
  me,
  you,
  text,
  provider,
  rail,
  onReaction,
  onNext,
  onSkip,
}: {
  round: MusicRound;
  mode: MusicMode;
  signature?: MusicSignature | undefined;
  me: string;
  you: string;
  text: string;
  provider: MusicProvider;
  rail: React.ReactNode;
  onReaction: (reaction: MusicReaction) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [a, b] = round.picks;
  const duet = mode === "duet" && !!b;
  const match = duet && sameSong(a, b);
  const reaction: MusicReaction | null = match ? "match" : round.reaction;
  const verdictRequired = (duet && !match) || mode === "guess";

  useEffect(() => {
    haptic(match ? [12, 60, 12, 60, 24] : [10, 40, 16]);
    if (match && round.reaction !== "match") onReaction("match");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  const verdictLine =
    reaction === "match"
      ? "Okay, das war unheimlich."
      : reaction
        ? REACTION_META[reaction].line
        : null;

  return (
    <div className="flex flex-1 flex-col" data-testid="music-reveal">
      {rail}
      <p className="mt-6 line-clamp-2 text-sm text-muted-foreground">{text}</p>
      <div className={cn("mt-5 grid gap-2", duet && "grid-cols-1 min-[420px]:grid-cols-2")}>
        {a && <TrackCard track={a} owner={mode === "consensus" ? me + " × " + you : me} side="a" provider={provider} />}
        {duet && b && <TrackCard track={b} owner={you} side="b" provider={provider} />}
      </div>

      {duet && (
        <div className="mt-6 border-l-2 border-primary pl-4 motion-safe:animate-rise [animation-delay:350ms]" data-testid="music-compare" aria-live="polite">
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-primary">
            {reaction === "match" ? "SAME BRAIN" : reaction ? REACTION_META[reaction as Exclude<MusicReaction, "match">].label : "REVEAL"}
          </p>
          <p className="font-display mt-1 text-2xl italic text-champagne">{verdictLine ?? "Zwei Songs. Jetzt entscheidet ihr, was das gerade war."}</p>
          {!match && (
            <ReactionGrid
              options={["same-energy", "twist", "explains", "no-questions"]}
              selected={round.reaction}
              onSelect={onReaction}
            />
          )}
        </div>
      )}

      {mode === "guess" && round.prediction && (
        <div className="mt-6 border-l-2 border-primary pl-4 motion-safe:animate-rise [animation-delay:350ms]">
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-primary">READ//THE TRACK</p>
          <p className="font-display mt-1 text-2xl text-balance">{you} tippte <span className="text-champagne">{round.prediction}</span>.</p>
          {verdictLine && <p className="mt-2 text-muted-foreground">{verdictLine}</p>}
          <p className="mt-4 text-sm text-muted-foreground">{me}, war der Read gut?</p>
          <ReactionGrid options={["read-hit", "twist"]} selected={round.reaction} onSelect={onReaction} />
        </div>
      )}

      {mode === "speed" && (
        <div className="mt-6 border-l-2 border-champagne pl-4">
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-champagne">{round.speedExpired ? "SECOND THOUGHT" : "INSTINCT PICK"}</p>
          <p className="font-display mt-1 text-xl italic">{round.speedExpired ? "Der erste Gedanke war zu langsam. Genau deshalb zählt jetzt der zweite." : "Keine Zeit zum Kuratieren. Genau deshalb zählt er."}</p>
        </div>
      )}

      {mode === "consensus" && (
        <div className="mt-6 border-y border-line py-4">
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-champagne">{signature === "last-track" ? "SIDE N// · FINAL CUT" : "ONE ROOM · ONE TRACK"}</p>
          <p className="font-display mt-2 text-2xl italic text-balance">{signature === "last-track" ? "Kein Gewinner. Kein Reveal-Trick. Das ist euer Schlusstrack." : "Kein Blind Pick. Ihr musstet euch wirklich einigen."}</p>
        </div>
      )}

      {mode === "solo" && (
        <div className="mt-6">
          <p className="font-display text-xl italic text-champagne">{signature === "aux-swap" ? you + ", Treffer oder komplette Fehleinschätzung?" : "Warum der? Ein Satz. Keine Verteidigungsrede."}</p>
          <ReactionGrid options={["explains", "no-questions"]} selected={round.reaction} onSelect={onReaction} />
        </div>
      )}

      <div className="action-dock mt-auto flex flex-col items-stretch gap-1 pt-8">
        <Btn
          size="lg"
          className="w-full"
          disabled={verdictRequired && !reaction}
          onClick={() => { haptic(8); onNext(); }}
        >
          {verdictRequired && !reaction ? "Erst einordnen" : signature === "last-track" ? "Tonight’s Record öffnen →" : "Nächste Runde →"}
        </Btn>
        <button type="button" onClick={onSkip} className="tap mx-auto min-h-11 px-4 text-sm text-muted-foreground hover:text-foreground">Skip</button>
      </div>
    </div>
  );
}

export function PickForm({
  who,
  text,
  cta,
  onPick,
  onSkip,
  speed,
  speedExpired,
  onSpeedExpired,
  privatePick = true,
  provider = manualProvider,
}: {
  who: string;
  text: string;
  cta: string;
  onPick: (t: Track) => void;
  onSkip: () => void;
  speed?: boolean;
  speedExpired?: boolean;
  onSpeedExpired?: () => void;
  privatePick?: boolean;
  provider?: MusicProvider;
}) {
  const catalog = provider.capabilities.search && !!provider.search;
  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<Track | null>(null);
  const [left, setLeft] = useState(speed ? (speedExpired ? 0 : 20) : 0);
  const expirySent = useRef(Boolean(speedExpired));
  const seq = useRef(0);

  useEffect(() => {
    if (!speed || left <= 0) return;
    const timer = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // A single interval makes QUICK DRAW deterministic across browser and fake-timer runtimes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  useEffect(() => {
    if (!speed || left !== 0 || expirySent.current) return;
    expirySent.current = true;
    haptic([8, 40, 8]);
    onSpeedExpired?.();
  }, [left, onSpeedExpired, speed]);

  useEffect(() => {
    if (!catalog || manual || chosen) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); setSearching(false); return; }
    const id = ++seq.current;
    setSearching(true);
    const t = setTimeout(() => {
      provider.search!(term, 5)
        .then((r) => { if (id === seq.current) setResults(r.filter((x) => x.title).slice(0, 5)); })
        .catch(() => { if (id === seq.current) setResults([]); })
        .finally(() => { if (id === seq.current) setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [q, catalog, manual, chosen, provider]);

  const useCatalog = catalog && !manual;
  const ok = useCatalog ? !!chosen : title.trim().length > 0;
  const submit = () => {
    if (!ok) return;
    if (useCatalog && chosen) onPick(chosen);
    else onPick({ title: title.trim().slice(0, 80), artist: artist.trim().slice(0, 60) || undefined });
  };
  const inputCls = "w-full border-b border-line bg-transparent py-3 outline-none placeholder:text-muted-foreground/50 focus:border-primary";
  const linkCls = "tap min-h-11 px-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline";
  const expired = speed && left === 0;

  return (
    <form className="flex flex-1 flex-col animate-rise" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Prompt className="mt-6">{text}</Prompt>
      {speed && (
        <div className="mt-5" aria-live="polite">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[0.6rem] tracking-[0.24em] text-muted-foreground">{expired ? "RULE FLIP" : "QUICK DRAW"}</p>
              <span className={cn("font-display text-6xl tabular-nums transition-colors", expired && "text-champagne")} data-testid="speed-left">{left}</span>
            </div>
            <span className="max-w-52 text-right text-sm text-muted-foreground">{left > 0 ? "Sekunden. Erster Gedanke gewinnt." : "Zeit um. Plot Twist: Nimm bewusst deinen zweiten Gedanken."}</span>
          </div>
          <div className="mt-2 h-[2px] overflow-hidden bg-line"><div className="h-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: ((left / 20) * 100) + "%" }} /></div>
        </div>
      )}
      <div className="mt-auto pt-8">
        <p className="eyebrow text-primary">{who}</p>
        {useCatalog ? (
          chosen ? (
            <div className="mt-3" data-testid="catalog-chosen">
              <TrackRow track={chosen} selected />
              <button type="button" className={linkCls} onClick={() => { setChosen(null); setQ(""); }}>Andere Suche</button>
            </div>
          ) : (
            <>
              <label className="mt-3 block">
                <span className="sr-only">Song suchen</span>
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" enterKeyHint="search" placeholder="Song oder Artist suchen" data-testid="catalog-search" className={cn(inputCls, "font-display text-[1.7rem] leading-tight")} />
              </label>
              <ul className="mt-2 divide-y divide-line" aria-label="Suchergebnisse" aria-busy={searching}>
                {results.map((r) => (
                  <li key={r.providerId ?? r.title + "-" + (r.artist ?? "")}>
                    <button type="button" onClick={() => { haptic(6); setChosen(r); }} className="tap block w-full text-left" data-testid="catalog-result"><TrackRow track={r} /></button>
                  </li>
                ))}
              </ul>
              {q.trim().length >= 2 && !searching && results.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Nichts gefunden. Tipp anders – oder trag ihn selbst ein.</p>}
              <button type="button" className={linkCls} onClick={() => { setManual(true); setTitle(q.trim()); }}>Manuell eingeben</button>
            </>
          )
        ) : (
          <>
            <label className="mt-3 block">
              <span className="sr-only">Songtitel</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required autoComplete="off" enterKeyHint="next" placeholder="Songtitel" data-testid="song-title" className={cn(inputCls, "font-display text-[1.9rem] leading-tight")} />
            </label>
            <label className="mt-2 block">
              <span className="sr-only">Artist (optional)</span>
              <input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={60} autoComplete="off" enterKeyHint="done" placeholder="Artist · optional" data-testid="song-artist" className={cn(inputCls, "text-lg")} />
            </label>
            {catalog && <button type="button" className={linkCls} onClick={() => setManual(false)}>Im Katalog suchen</button>}
          </>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {speed ? expired ? "Kein Fail State. Nur eine neue Regel." : "Nicht kuratieren. Reagieren." : privatePick ? "Nur du siehst das. Danach wird versiegelt." : "Ihr entscheidet gemeinsam – nichts wird versteckt."}
        </p>
        <Footer primary={ok ? cta : useCatalog ? "Erst Song wählen" : "Erst Songtitel"} disabled={!ok} onPrimary={submit} onSkip={onSkip} />
      </div>
    </form>
  );
}

function TrackRow({ track, selected }: { track: Track; selected?: boolean }) {
  return (
    <span className={cn("flex min-h-14 items-center gap-3 py-2", selected && "border-l-2 border-primary pl-3")}>
      {track.artworkUrl ? <img src={track.artworkUrl} alt="" width={44} height={44} loading="lazy" className="size-11 shrink-0 rounded-sm object-cover" /> : <span className="size-11 shrink-0 bg-surface-2" aria-hidden />}
      <span className="min-w-0">
        <span className="block truncate text-base">{track.title}</span>
        {track.artist && <span className="block truncate text-sm text-muted-foreground">{track.artist}</span>}
      </span>
    </span>
  );
}

/** Premium reveal card. Real artwork only; no fake waveform, fake player or generic search link. */
export function TrackCard({ track, owner, side, compact, provider }: { track: Track; owner: string; side?: "a" | "b"; compact?: boolean; provider?: MusicProvider }) {
  const [playing, setPlaying] = useState(false);
  const play = canPlay(provider, track);
  return (
    <article className={cn("relative flex flex-col overflow-hidden rounded-[1.4rem] border border-line/80 bg-surface", compact ? "p-4" : "p-5 pb-6", !compact && "motion-safe:animate-unseal", side === "b" && "[animation-delay:180ms]")} data-testid="track-card">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.65rem] tracking-[0.25em] text-primary">{owner.toUpperCase()}</p>
        {side && <span className="font-mono text-[0.55rem] tracking-[0.22em] text-muted-foreground">SIDE {side.toUpperCase()}</span>}
      </div>
      {track.artworkUrl && !compact && <img src={track.artworkUrl} alt={"Cover: " + track.title} width={320} height={320} className="mt-4 aspect-square w-full max-w-64 rounded-lg object-cover shadow-2xl" />}
      <div className={cn("flex items-start gap-3", compact ? "mt-1" : "mt-5")}>
        {track.artworkUrl && compact && <img src={track.artworkUrl} alt="" width={44} height={44} className="size-11 shrink-0 rounded-sm object-cover" />}
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-display leading-[1.02] break-words text-balance", compact ? "text-[1.45rem]" : "text-[clamp(2rem,9vw,2.8rem)]")} data-testid="track-title">{track.title}</h3>
          {track.artist && <p className="mt-1.5 truncate text-sm uppercase tracking-[0.12em] text-muted-foreground">{track.artist}</p>}
        </div>
      </div>
      {!compact && (play || track.externalUrl) && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 border-t border-line pt-4">
          {play && (
            <button type="button" data-testid="track-play" aria-pressed={playing} onClick={() => { haptic(6); setPlaying(true); provider!.play!(track).catch(() => setPlaying(false)); }} className="tap inline-flex min-h-11 items-center gap-2 font-mono text-xs tracking-[0.18em]">
              <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-full border border-primary text-primary">▶</span>{playing ? "LÄUFT" : "PLAY IT"}
            </button>
          )}
          {track.externalUrl && <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline">In Apple Music öffnen ↗</a>}
        </div>
      )}
    </article>
  );
}

export function MusicSetup({ provider: override }: { provider?: MusicProvider }) {
  const provider = useMusicProvider(override);
  const [state, setState] = useState<"idle" | "busy" | "fail">("idle");
  const [, force] = useState(0);
  if (!provider.capabilities.search || !provider.search) return null;
  const authorized = provider.isAuthorized();
  const canConnect = provider.capabilities.playback && !!provider.authorize;
  return (
    <section aria-label="Apple Music" className="mt-10 border-y border-line py-4" data-testid="music-setup">
      <p className="flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.22em] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />APPLE MUSIC KATALOG · IM PICKER VERFÜGBAR
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Songs auswählen klappt ohne Verbinden. Verbinden braucht ihr nur für PLAY IT und die Playlist am Ende.</p>
      {canConnect && (authorized ? (
        <p className="mt-3 text-sm text-foreground" data-testid="playback-on">Playback in NOCTURNE aktiv.</p>
      ) : (
        <Btn variant="outline" size="sm" className="mt-3" disabled={state === "busy"} data-testid="playback-connect"
          onClick={async () => { setState("busy"); const ok = await provider.authorize!().catch(() => false); setState(ok ? "idle" : "fail"); force((n) => n + 1); }}>
          {state === "busy" ? "Verbinde …" : state === "fail" ? "Nicht verbunden – nochmal" : "PLAY IT aktivieren"}
        </Btn>
      ))}
    </section>
  );
}
