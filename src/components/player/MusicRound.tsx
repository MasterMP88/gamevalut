import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/vault/Btn";
import { getAiExperience } from "@/lib/ai/experience.functions";
import { musicClueResultSchema } from "@/lib/ai/experience-schema";
import { ClueLadder } from "@/components/ai/AiSurfaces";
import { useAuth } from "@/lib/auth";
import { hashStr } from "@/lib/game/engine";
import { MUSIC_VIBES } from "@/lib/game/music-scenes";
import type { MusicRound, Track } from "@/lib/game/types";
import { canPlay, manualProvider, sameSong, type MusicProvider } from "@/lib/music/provider";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Footer, HandOver, Prompt, type SceneProps } from "./SceneView";

/** Resolve the provider once per round view. Manual unless Apple Music is genuinely configured; never authorizes. */
export function useMusicProvider(override?: MusicProvider): MusicProvider {
  const [p, setP] = useState<MusicProvider>(override ?? manualProvider);
  useEffect(() => {
    if (override) return;
    let live = true;
    import("@/lib/music/apple-music").then((m) => m.resolveMusicProvider()).then((r) => { if (live) setP(r); }).catch(() => {});
    return () => { live = false; };
  }, [override]);
  return p;
}

const empty = (n: number): MusicRound => ({ sceneNumber: n, stage: "pick", picks: [null, null], prediction: null, reaction: null });

/**
 * PASS//THE AUX round: pick (current player, hidden) → handoff → second (partner picks or
 * predicts) → reveal. Round state is held by the session (props.music) so leaving and
 * returning never shows a sealed pick to the wrong person.
 */
export function MusicRoundBody(p: SceneProps & { text: string; helper?: string | undefined; provider?: MusicProvider }) {
  const { scene, me, you, onDone, onSkip, text } = p;
  const { user } = useAuth();
  const mode = scene.music?.mode ?? "solo";
  const sceneNumber = p.music?.sceneNumber ?? 0;
  const [localRound, setLocalRound] = useState<MusicRound>(() => empty(sceneNumber));
  const round = p.music?.round && p.music.round.sceneNumber === sceneNumber ? p.music.round : localRound;
  const set = (r: MusicRound) => { setLocalRound(r); p.music?.setRound(r); };
  // Remounted mid-round on the partner's step: gate it again behind the handoff.
  const [gate, setGate] = useState(round.stage === "second");
  const provider = useMusicProvider(p.provider);
  const [clues, setClues] = useState<string[]>([]);
  const [clueIndex, setClueIndex] = useState(0);
  const [clueBusy, setClueBusy] = useState(false);
  const [clueTried, setClueTried] = useState(false);
  const [clueUnavailable, setClueUnavailable] = useState(false);

  useEffect(() => {
    setClues([]);
    setClueIndex(0);
    setClueBusy(false);
    setClueTried(false);
    setClueUnavailable(false);
  }, [sceneNumber]);

  const loadClues = async () => {
    const track = round.picks[0];
    if (!user || !track || clueBusy || clueTried) return;
    setClueBusy(true);
    setClueTried(true);
    setClueUnavailable(false);
    try {
      const res = await getAiExperience({
        data: {
          kind: "music-clue",
          aiConsent: true,
          sessionKey: `aux-${sceneNumber}-${hashStr(track.title + (track.artist ?? ""))}`,
          locale: "de",
          track: {
            title: track.title,
            ...(track.artist ? { artist: track.artist } : {}),
          },
          difficulty: Math.max(1, Math.min(5, scene.phase + 2)),
          count: 4,
        },
      });
      if (!res.ok) {
        setClueUnavailable(true);
        return;
      }
      const parsed = musicClueResultSchema.safeParse(JSON.parse(res.json));
      if (!parsed.success) {
        setClueUnavailable(true);
        return;
      }
      setClues(parsed.data.clues);
      setClueIndex(0);
    } catch {
      setClueUnavailable(true);
    } finally {
      setClueBusy(false);
    }
  };

  const rail = (
    <div className="mt-5 flex items-center gap-2" aria-hidden>
      {(["pick", "handoff", "second", "reveal"] as const).filter((s) => (mode === "speed" ? s === "pick" || s === "reveal" : mode === "solo" ? s !== "second" : true)).map((st, i, arr) => (
        <span key={st} className={cn("h-[2px] flex-1 rounded-full transition-colors duration-500", arr.indexOf(round.stage as never) >= i ? "bg-primary" : "bg-line")} />
      ))}
    </div>
  );

  if (round.stage === "pick") {
    return (
      <>
        {rail}
        <PickForm
          key="a"
          provider={provider}
          who={`${me} · ${mode === "speed" ? "schnell" : "verdeckt"}`}
          text={text}
          speed={mode === "speed"}
          cta={mode === "speed" ? "Zeigen" : "Auswahl verstecken"}
          onSkip={onSkip}
          onPick={(t) => { haptic(10); set({ ...round, picks: [t, null], stage: mode === "speed" ? "reveal" : "handoff" }); }}
        />
      </>
    );
  }

  if (round.stage === "handoff" || gate) {
    const note = mode === "duet" ? `${me} hat gewählt – versiegelt. Jetzt du, zum selben Prompt.` : mode === "guess" ? `${me} hat einen Song versteckt. Tipp erst den Vibe, dann wird entsiegelt.` : `${me} hat einen Song für dich versiegelt.`;
    return (
      <>
        {rail}
        <HandOver to={you} note={note} onSkip={onSkip} onReady={() => { setGate(false); if (round.stage === "handoff") set({ ...round, stage: mode === "solo" ? "reveal" : "second" }); }} />
      </>
    );
  }

  if (round.stage === "second" && mode === "duet") {
    return (
      <>
        {rail}
        <PickForm key="b" provider={provider} who={`${you} · verdeckt`} text={text} cta="Beide entsiegeln" onSkip={onSkip} onPick={(t) => { haptic(14); set({ ...round, picks: [round.picks[0], t], stage: "reveal" }); }} />
      </>
    );
  }

  if (round.stage === "second") {
    const vibes = scene.choices?.length ? scene.choices : [...MUSIC_VIBES];
    return (
      <div className="flex flex-1 flex-col animate-rise">
        {rail}
        <Prompt className="mt-6 text-[1.5rem] text-muted-foreground sm:text-3xl">{text}</Prompt>
        <div className="mt-auto flex flex-col pt-8">
          <p className="eyebrow text-primary">{you} · Vorhersage</p>
          <p className="font-display mt-2 text-[2.1rem] leading-[1.05]">Welcher Vibe steckt im Song von {me}?</p>
          <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Vibe tippen">
            {vibes.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={round.prediction === v}
                onClick={() => { haptic(6); set({ ...round, prediction: v }); }}
                className={cn("min-h-14 rounded-xl border px-3 py-3 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-primary", round.prediction === v ? "border-primary bg-primary/15 text-foreground" : "border-line text-muted-foreground")}
              >
                {v}
              </button>
            ))}
          </div>
          {user && round.picks[0] && (
            <div className="mt-5">
              {!clueTried && (
                <>
                  <Btn variant="outline" className="w-full" onClick={() => void loadClues()}>
                    KI-Hinweis holen
                  </Btn>
                  <p className="mt-2 text-xs leading-snug text-muted-foreground">
                    Optional · Songtitel und Artist werden nur für diesen Hinweis verwendet.
                  </p>
                </>
              )}
              {clueBusy && (
                <p role="status" className="font-mono text-[0.7rem] tracking-[0.18em] text-muted-foreground">
                  HINWEIS WIRD FORMULIERT · DU KANNST SCHON TIPPEN
                </p>
              )}
              {clues.length > 0 && (
                <ClueLadder
                  clues={clues}
                  revealed={clueIndex}
                  onReveal={() => setClueIndex((i) => Math.min(i + 1, clues.length - 1))}
                />
              )}
              {clueUnavailable && (
                <p className="text-sm italic text-muted-foreground">
                  Heute ohne Zusatzhinweis · dein Tipp zählt.
                </p>
              )}
            </div>
          )}
          <Footer primary={round.prediction ? "Entsiegeln" : "Erst tippen"} disabled={!round.prediction} onPrimary={() => { haptic(14); set({ ...round, stage: "reveal" }); }} onSkip={onSkip} />
        </div>
      </div>
    );
  }

  // ——— reveal
  return <Reveal round={round} mode={mode} me={me} you={you} text={text} provider={provider} rail={rail} onNext={() => { if (mode === "duet" && sameSong(round.picks[0], round.picks[1]) && round.reaction !== "match") set({ ...round, reaction: "match" }); onDone(); }} onSkip={onSkip} />;
}

function Reveal({ round, mode, me, you, text, provider, rail, onNext, onSkip }: { round: MusicRound; mode: string; me: string; you: string; text: string; provider: MusicProvider; rail: React.ReactNode; onNext: () => void; onSkip: () => void }) {
  const [a, b] = round.picks;
  const duet = mode === "duet" && !!b;
  const match = duet && sameSong(a, b);
  useEffect(() => { haptic(match ? [12, 60, 12, 60, 24] : [10, 40, 16]); }, [match]);
  return (
    <div className="flex flex-1 flex-col" data-testid="music-reveal">
      {rail}
      <p className="mt-6 line-clamp-2 text-sm text-muted-foreground">{text}</p>
      <div className={cn("mt-5 grid gap-px", duet && "grid-cols-1 min-[420px]:grid-cols-2")}>
        {a && <TrackCard track={a} owner={me} side="a" provider={provider} />}
        {duet && b && <TrackCard track={b} owner={you} side="b" provider={provider} />}
      </div>
      {duet && (
        <p className="mt-6 flex items-center gap-3 motion-safe:animate-rise [animation-delay:500ms]" data-testid="music-compare" aria-live="polite">
          <span className="h-px w-8 bg-primary" aria-hidden />
          {match
            ? <span><span className="font-mono text-xs tracking-[0.3em] text-primary">MATCH</span> <span className="font-display text-xl italic">· Okay, das war unheimlich.</span></span>
            : <span className="font-display text-xl italic text-champagne">Zwei Songs. Gleicher Moment.</span>}
        </p>
      )}
      {mode === "guess" && round.prediction && (
        <p className="mt-6 border-l-2 border-primary pl-3 text-muted-foreground motion-safe:animate-rise [animation-delay:500ms]">
          {you} tippte <span className="text-foreground">{round.prediction}</span>. Stimmt’s, {me}?
        </p>
      )}
      {!duet && mode !== "guess" && <p className="font-display mt-6 text-xl italic text-champagne">Warum der? Ein Satz, laut.</p>}
      <div className="action-dock mt-auto flex flex-col items-stretch gap-1 pt-8">
        <Btn size="lg" className="w-full" onClick={() => { haptic(8); onNext(); }}>Nächste Runde →</Btn>
        <button type="button" onClick={onSkip} className="tap mx-auto min-h-11 px-4 text-sm text-muted-foreground hover:text-foreground">Skip</button>
      </div>
    </div>
  );
}

export function PickForm({ who, text, cta, onPick, onSkip, speed, provider = manualProvider }: { who: string; text: string; cta: string; onPick: (t: Track) => void; onSkip: () => void; speed?: boolean; provider?: MusicProvider }) {
  const catalog = provider.capabilities.search && !!provider.search;
  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<Track | null>(null);
  const [left, setLeft] = useState(speed ? 25 : 0);
  const seq = useRef(0);
  useEffect(() => {
    if (!speed || left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [speed, left]);
  useEffect(() => {
    if (!catalog || manual || chosen) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); setSearching(false); return; }
    const id = ++seq.current;
    setSearching(true);
    const t = setTimeout(() => {
      provider.search!(term, 5).then((r) => { if (id === seq.current) setResults(r.filter((x) => x.title).slice(0, 5)); })
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
  return (
    <form className="flex flex-1 flex-col animate-rise" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Prompt className="mt-6">{text}</Prompt>
      {speed && (
        <div className="mt-5" aria-live="polite">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-5xl tabular-nums" data-testid="speed-left">{left}</span>
            <span className="text-sm text-muted-foreground">{left > 0 ? "Sekunden · kein Druck" : "Zeit um – wähl trotzdem."}</span>
          </div>
          <div className="mt-2 h-[2px] bg-line"><div className="h-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${(left / 25) * 100}%` }} /></div>
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
                  <li key={r.providerId ?? r.title}>
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
        <p className="mt-3 text-sm text-muted-foreground">{speed ? "Bleibt sichtbar – Speed ist offen." : "Nur du siehst das. Danach wird versiegelt."}</p>
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

/** Editorial track panel: owner → real artwork (catalog only) → title → artist. No fake audio, no search links. */
export function TrackCard({ track, owner, side, compact, provider }: { track: Track; owner: string; side?: "a" | "b"; compact?: boolean; provider?: MusicProvider }) {
  const [playing, setPlaying] = useState(false);
  const play = canPlay(provider, track);
  return (
    <article className={cn("relative flex flex-col overflow-hidden bg-surface", compact ? "p-4" : "p-5 pb-6", !compact && "motion-safe:animate-unseal", side === "b" && "[animation-delay:180ms]")} data-testid="track-card">
      <p className="font-mono text-[0.65rem] tracking-[0.25em] text-primary">{owner.toUpperCase()}</p>
      {track.artworkUrl && !compact && <img src={track.artworkUrl} alt={`Cover: ${track.title}`} width={300} height={300} className="mt-4 aspect-square w-full max-w-56 object-cover" />}
      <div className={cn("flex items-start gap-3", compact ? "mt-1" : "mt-4")}>
        {track.artworkUrl && compact && <img src={track.artworkUrl} alt="" width={44} height={44} className="size-11 shrink-0 object-cover" />}
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-display leading-[1.02] break-words text-balance", compact ? "text-[1.45rem]" : "text-[clamp(2rem,9vw,2.6rem)]")} data-testid="track-title">{track.title}</h3>
          {track.artist && <p className="mt-1.5 truncate text-sm uppercase tracking-[0.12em] text-muted-foreground">{track.artist}</p>}
        </div>
      </div>
      {!compact && (play || track.externalUrl) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4">
          {play && (
            <button type="button" data-testid="track-play" aria-pressed={playing} onClick={() => { haptic(6); setPlaying(true); provider!.play!(track).catch(() => setPlaying(false)); }} className="tap inline-flex min-h-11 items-center gap-2 text-sm">
              <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full border border-primary text-primary">▶</span>{playing ? "Läuft" : "Abspielen"}
            </button>
          )}
          {track.externalUrl && <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline">In Apple Music öffnen ↗</a>}
        </div>
      )}
    </article>
  );
}