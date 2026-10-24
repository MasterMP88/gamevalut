
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Btn } from "@/components/vault/Btn";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  MUSIC_REACTIONS,
  MUSIC_VIBES,
  musicActor,
  type MusicAction,
} from "@/lib/music/engine";
import type { MusicState, TrackPick } from "@/lib/game/types";

function promptText(text: string, players: [string, string], primary: 0 | 1) {
  return text
    .replaceAll("{me}", players[primary])
    .replaceAll("{you}", players[(1 - primary) as 0 | 1]);
}

function TrackCard({ pick, players, index }: { pick: TrackPick; players: [string, string]; index: number }) {
  return (
    <article className="relative min-w-0 border-y border-line py-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-champagne">
          {String(index + 1).padStart(2, "0")} · {players[pick.player]}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground">{"R" + String(pick.round).padStart(2, "0")}</span>
      </div>
      <h3 className="font-display mt-3 break-words text-[2rem] leading-[0.95]">{pick.title}</h3>
      {pick.artist && <p className="mt-2 break-words text-sm text-muted-foreground">{pick.artist}</p>}
    </article>
  );
}

function SignalRail({ stage }: { stage: string }) {
  return (
    <div className="mt-4 flex items-center gap-2" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-champagne/60 to-primary/60" />
      <span className="size-1.5 rounded-full bg-primary animate-slow-pulse motion-reduce:animate-none" />
      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{stage}</span>
      <span className="size-1.5 rounded-full bg-champagne/70" />
      <span className="h-px flex-1 bg-gradient-to-r from-champagne/60 via-violet/40 to-transparent" />
    </div>
  );
}

function TrackInput({
  music,
  players,
  onAction,
  onSkip,
}: {
  music: MusicState;
  players: [string, string];
  onAction: (a: MusicAction) => void;
  onSkip: () => void;
}) {
  const actor = musicActor(music);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const speed = music.round.type === "SPEED";
  const total = music.round.speedSeconds ?? 25;
  const [left, setLeft] = useState(total);

  useEffect(() => {
    if (!speed) return;
    const id = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [speed]);

  useEffect(() => {
    if (speed && left > 0 && left <= 3) haptic(4);
  }, [left, speed]);

  const second = music.round.type === "DUET" && music.stage === "pick-second";
  return (
    <div className="flex flex-1 flex-col">
      <SignalRail stage={speed ? "speed pick" : second ? "duet · zweite wahl" : "private pick"} />
      <p className="eyebrow mt-6 text-champagne">{players[actor]} · nur für dich</p>
      <h2 className="font-display mt-3 text-[2.45rem] leading-[1.02] text-balance">
        {promptText(music.round.prompt, players, music.primary)}
      </h2>

      {speed && (
        <div className="mt-7 border-y border-line py-4" role="timer" aria-live="polite">
          <div className="flex items-end justify-between gap-4">
            <span className={cn("font-display text-6xl leading-none tabular-nums", left === 0 && "text-primary")}>
              {left === 0 ? "Zeit." : "0:" + String(left).padStart(2, "0")}
            </span>
            <span className="max-w-28 text-right text-xs text-muted-foreground">
              {left === 0 ? "Kein Fail. Nimm einfach jetzt den ersten Track." : "Erster Gedanke gewinnt."}
            </span>
          </div>
          <div className="mt-3 h-px bg-line">
            <div className="h-[2px] bg-primary transition-[width] duration-1000" style={{ width: ((left / total) * 100) + "%" }} />
          </div>
        </div>
      )}

      <div className="mt-8 space-y-5">
        <label className="block">
          <span className="eyebrow">Songtitel</span>
          <input
            autoFocus
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Welcher Track?"
            className="font-display mt-2 block min-h-14 w-full border-b border-line bg-transparent py-2 text-[1.8rem] leading-tight text-foreground outline-none placeholder:text-muted-foreground/45 focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Artist · optional</span>
          <input
            value={artist}
            maxLength={120}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Falls ihr ihn wisst"
            className="mt-2 block min-h-12 w-full border-b border-line bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground/45 focus:border-champagne"
          />
        </label>
      </div>

      <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden /> Noch privat · wird erst beim Reveal sichtbar.
      </p>

      <div className="mt-auto flex items-center gap-3 pt-8">
        <Btn variant="ghost" size="lg" className="px-4" onClick={onSkip}>Skip</Btn>
        <Btn
          size="lg"
          className="flex-1"
          disabled={!title.trim()}
          onClick={() => {
            haptic(10);
            onAction({ type: "MUSIC_SEAL", title, ...(artist.trim() ? { artist } : {}) });
          }}
        >
          {title.trim() ? (speed ? "Track festhalten" : "Auswahl versiegeln") : "Songtitel fehlt"}
        </Btn>
      </div>
    </div>
  );
}

function HandOff({
  music,
  players,
  onAction,
  onSkip,
}: {
  music: MusicState;
  players: [string, string];
  onAction: (a: MusicAction) => void;
  onSkip: () => void;
}) {
  const receiver = players[(1 - music.primary) as 0 | 1];
  return (
    <div className="flex flex-1 flex-col">
      <SignalRail stage="sealed" />
      <div className="relative mt-8 flex flex-1 flex-col justify-center overflow-hidden border-y border-line bg-surface/35 py-12">
        <div className="mb-8 flex items-center gap-3 text-primary/70" aria-hidden>
          <span className="font-display text-xl tracking-[0.16em]">N//</span>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]">aux sealed</span>
        </div>
        <p className="eyebrow">Handy rüber</p>
        <h2 className="font-display mt-4 text-[3.4rem] leading-[0.9]">
          Nur für<br /><em className="not-italic text-primary">{receiver}</em>.
        </h2>
        <p className="mt-6 max-w-[29ch] leading-relaxed text-muted-foreground">
          Die vorige Songwahl ist versiegelt. Nichts davon steht auf diesem Screen.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Btn variant="ghost" size="lg" className="px-4" onClick={onSkip}>Skip</Btn>
        <Btn size="lg" className="flex-1" onClick={() => { haptic(12); onAction({ type: "MUSIC_HANDOFF" }); }}>
          Ich bin {receiver} →
        </Btn>
      </div>
    </div>
  );
}

function Guess({
  music,
  players,
  onAction,
  onSkip,
}: {
  music: MusicState;
  players: [string, string];
  onAction: (a: MusicAction) => void;
  onSkip: () => void;
}) {
  const actor = (1 - music.primary) as 0 | 1;
  return (
    <div className="flex flex-1 flex-col">
      <SignalRail stage="vibe prediction" />
      <p className="eyebrow mt-7 text-champagne">{players[actor]} · dein Read</p>
      <h2 className="font-display mt-3 text-[2.6rem] leading-[0.98]">Was für ein Song wartet hinter dem Siegel?</h2>
      <p className="mt-3 text-muted-foreground">Nicht den Titel raten. Nur die Energie.</p>
      <div className="mt-8 border-t border-line">
        {MUSIC_VIBES.map((v, i) => (
          <button
            key={v}
            type="button"
            onClick={() => { haptic(8); onAction({ type: "MUSIC_PREDICT", vibe: v }); }}
            className="tap flex min-h-16 w-full items-center gap-4 border-b border-line py-3 text-left"
          >
            <span className="w-7 font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-display text-[1.65rem]">{v}</span>
          </button>
        ))}
      </div>
      <Btn variant="ghost" size="lg" className="mt-auto self-start px-0" onClick={onSkip}>Skip</Btn>
    </div>
  );
}

function Reveal({
  music,
  players,
  onAction,
  onSkip,
}: {
  music: MusicState;
  players: [string, string];
  onAction: (a: MusicAction) => void;
  onSkip: () => void;
}) {
  const duet = music.round.type === "DUET";
  const guess = music.round.type === "GUESS";
  return (
    <div className="flex flex-1 flex-col">
      <SignalRail stage="reveal" />
      <p className="eyebrow mt-7 text-primary">{duet ? "Dual signal" : guess ? "Prediction Reveal" : "Now playing · in eurem Kopf"}</p>
      <h2 className="font-display mt-3 text-[3rem] leading-[0.92]">
        {duet ? "Zwei Antworten. Zwei Tracks." : guess ? "Siegel offen." : "Der Track."}
      </h2>

      {guess && music.prediction && (
        <div className="mt-7 border-y border-line py-4">
          <p className="eyebrow">{players[(1 - music.primary) as 0 | 1]} tippte</p>
          <p className="font-display mt-1 text-2xl italic text-champagne">{music.prediction}</p>
        </div>
      )}

      <div className={cn("mt-7", duet && "grid gap-5 sm:grid-cols-2")}>
        {music.picks.map((p, i) => <TrackCard key={[p.player, p.title, i].join("-")} pick={p} players={players} index={i} />)}
      </div>

      {duet && music.stage === "reveal" && (
        <div className="mt-7">
          <p className="eyebrow">Euer Urteil</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MUSIC_REACTIONS.map((reaction) => (
              <button
                key={reaction}
                type="button"
                onClick={() => { haptic(6); onAction({ type: "MUSIC_REACT", reaction }); }}
                className="tap min-h-11 rounded-full border border-line px-4 text-sm"
              >
                {reaction}
              </button>
            ))}
          </div>
        </div>
      )}

      {music.reaction && <p className="font-display mt-6 text-3xl italic text-primary">{music.reaction}.</p>}
      {!duet && <p className="mt-6 text-muted-foreground">Warum genau der? Sagt es euch – oder lasst den Track einfach für sich sprechen.</p>}

      <div className="mt-auto flex items-center gap-3 pt-8">
        <Btn variant="ghost" size="lg" className="px-3" onClick={onSkip}>Nicht in Tracklist</Btn>
        <Btn size="lg" className="flex-1" onClick={() => { haptic(); onAction({ type: "MUSIC_NEXT" }); }}>
          Nächste Runde →
        </Btn>
      </div>
    </div>
  );
}

export function MusicRoundView({
  music,
  players,
  onAction,
}: {
  music: MusicState;
  players: [string, string];
  onAction: (action: MusicAction) => void;
}) {
  const skip = () => { haptic(4); onAction({ type: "MUSIC_SKIP" }); };

  if (music.stage === "handoff") return <div data-testid="music-round" className="flex flex-1 flex-col"><HandOff music={music} players={players} onAction={onAction} onSkip={skip} /></div>;
  if (music.stage === "predict") return <div data-testid="music-round" className="flex flex-1 flex-col"><Guess music={music} players={players} onAction={onAction} onSkip={skip} /></div>;
  if (music.stage === "reveal" || music.stage === "reaction") return <div data-testid="music-round" className="flex flex-1 flex-col"><Reveal music={music} players={players} onAction={onAction} onSkip={skip} /></div>;
  return <div data-testid="music-round" className="flex flex-1 flex-col"><TrackInput key={[music.roundNumber, music.stage].join("-")} music={music} players={players} onAction={onAction} onSkip={skip} /></div>;
}
