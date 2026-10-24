import { useEffect, useState } from "react";
import { Btn } from "@/components/vault/Btn";
import { hashStr } from "@/lib/game/engine";
import { MUSIC_VIBES } from "@/lib/game/music-scenes";
import type { MusicReaction, MusicRound, Track } from "@/lib/game/types";
import { externalSearchLinks } from "@/lib/music/provider";
import { getAiExperience } from "@/lib/ai/experience.functions";
import { musicClueResultSchema } from "@/lib/ai/experience-schema";
import { ClueLadder } from "@/components/ai/AiSurfaces";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Footer, HandOver, Prompt, type SceneProps } from "./SceneView";

const REACTIONS: [MusicReaction, string][] = [["match", "Match"], ["twist", "Plot Twist"], ["explains", "Das erklärt einiges"]];

const empty = (n: number): MusicRound => ({ sceneNumber: n, stage: "pick", picks: [null, null], prediction: null, reaction: null });

/**
 * PASS//THE AUX round: pick (current player, hidden) → handoff → second (partner picks or
 * predicts) → reveal. Round state is held by the session (props.music) so leaving and
 * returning never shows a sealed pick to the wrong person.
 */
export function MusicRoundBody(p: SceneProps & { text: string; helper?: string | undefined }) {
  const { scene, me, you, onDone, onSkip, text } = p;
  const { user } = useAuth();
  const mode = scene.music?.mode ?? "solo";
  const sceneNumber = p.music?.sceneNumber ?? 0;
  const [localRound, setLocalRound] = useState<MusicRound>(() => empty(sceneNumber));
  const round = p.music?.round && p.music.round.sceneNumber === sceneNumber ? p.music.round : localRound;
  const set = (r: MusicRound) => { setLocalRound(r); p.music?.setRound(r); };
  // Remounted mid-round on the partner's step: gate it again behind the handoff.
  const [gate, setGate] = useState(round.stage === "second");
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
        <PickForm key="b" who={`${you} · verdeckt`} text={text} cta="Beide entsiegeln" onSkip={onSkip} onPick={(t) => { haptic(14); set({ ...round, picks: [round.picks[0], t], stage: "reveal" }); }} />
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
  const [a, b] = round.picks;
  const duet = mode === "duet" && b;
  return (
    <div className="flex flex-1 flex-col">
      {rail}
      <p className="eyebrow mt-6 text-primary" data-testid="music-reveal">Entsiegelt</p>
      <div className={cn("mt-4 grid gap-3", duet && "grid-cols-1 min-[420px]:grid-cols-2")}>
        {a && <TrackCard track={a} owner={me} side="a" />}
        {duet && <TrackCard track={b} owner={you} side="b" />}
      </div>
      {mode === "guess" && round.prediction && (
        <p className="mt-4 border-l-2 border-primary pl-3 text-muted-foreground animate-rise" style={{ animationDelay: "500ms" }}>
          {you} tippte: <span className="text-foreground">{round.prediction}</span>. Stimmt’s, {me}?
        </p>
      )}
      {duet ? (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Reaktion (optional)">
          {REACTIONS.map(([id, label]) => (
            <Btn key={id} variant="chip" size="sm" data-on={round.reaction === id} aria-pressed={round.reaction === id} onClick={() => { haptic(5); set({ ...round, reaction: round.reaction === id ? null : id }); }}>
              {label}
            </Btn>
          ))}
        </div>
      ) : (
        <p className="font-display mt-6 text-2xl italic text-champagne">Warum der? Ein Satz, {mode === "guess" || mode === "solo" ? me : "laut"}.</p>
      )}
      <Footer primary="Nächste Runde →" onPrimary={() => onDone()} onSkip={onSkip} />
    </div>
  );
}

function PickForm({ who, text, cta, onPick, onSkip, speed }: { who: string; text: string; cta: string; onPick: (t: Track) => void; onSkip: () => void; speed?: boolean }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [left, setLeft] = useState(speed ? 25 : 0);
  useEffect(() => {
    if (!speed || left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [speed, left]);
  const ok = title.trim().length > 0;
  const submit = () => ok && onPick({ title: title.trim().slice(0, 80), artist: artist.trim().slice(0, 60) || undefined });
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
        <label className="mt-3 block">
          <span className="sr-only">Songtitel</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            required
            autoComplete="off"
            enterKeyHint="next"
            placeholder="Songtitel"
            data-testid="song-title"
            className="w-full border-b border-line bg-transparent py-3 font-display text-[1.9rem] leading-tight outline-none placeholder:text-muted-foreground/50 focus:border-primary"
          />
        </label>
        <label className="mt-2 block">
          <span className="sr-only">Artist (optional)</span>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            maxLength={60}
            autoComplete="off"
            enterKeyHint="done"
            placeholder="Artist · optional"
            data-testid="song-artist"
            className="w-full border-b border-line bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground/50 focus:border-primary"
          />
        </label>
        <p className="mt-3 text-sm text-muted-foreground">{speed ? "Bleibt sichtbar – Speed ist offen." : "Nur du siehst das. Danach wird versiegelt."}</p>
        <Footer primary={ok ? cta : "Erst Songtitel"} disabled={!ok} onPrimary={submit} onSkip={onSkip} />
      </div>
    </form>
  );
}

/** Typographic track card with a signal trace derived from the title. Covers only from real provider data. */
export function TrackCard({ track, owner, side, compact }: { track: Track; owner: string; side?: "a" | "b"; compact?: boolean }) {
  const h = hashStr(track.title + (track.artist ?? ""));
  const bars = Array.from({ length: 24 }, (_, i) => 4 + (Math.abs((h >> (i % 16)) + i * 7) % 18));
  const links = externalSearchLinks(track);
  return (
    <article className={cn("relative overflow-hidden rounded-2xl border border-line bg-surface", compact ? "p-4" : "p-5", !compact && "animate-unseal", side === "b" && "[animation-delay:180ms]")}>
      <div className="flex items-start gap-4">
        {track.artworkUrl && <img src={track.artworkUrl} alt="" width={56} height={56} className="size-14 shrink-0 rounded-md" />}
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{owner}</p>
          <h3 className={cn("font-display mt-1 leading-[1.05] break-words", compact ? "text-[1.45rem]" : "text-[1.9rem]")} data-testid="track-title">{track.title}</h3>
          {track.artist && <p className="mt-1 truncate font-mono text-sm uppercase tracking-wider text-muted-foreground">{track.artist}</p>}
        </div>
      </div>
      <svg viewBox="0 0 96 24" className={cn("w-full text-primary/70", compact ? "mt-3 h-4" : "mt-4 h-6")} preserveAspectRatio="none" aria-hidden>
        {bars.map((v, i) => <rect key={i} x={i * 4} y={12 - v / 2} width="2" height={v} rx="1" fill="currentColor" />)}
      </svg>
      {!compact && links.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground">
          <span>Suchen in</span>
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary">
              {l.label} ↗
            </a>
          ))}
        </p>
      )}
    </article>
  );
}