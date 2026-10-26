import { localAudioDeck, MAX_LOCAL_AUDIO_FILES } from "@/lib/gang/local-audio";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MotifArt } from "./MotifArt";
import {
  ArrowLeft,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import {
  createCouchSession,
  couchActiveTeam,
  couchBeat,
  couchCue,
  couchInput,
  couchIsFinal,
  couchPrompt,
  couchSeconds,
  couchSpokesperson,
  reduceCouch,
  type CouchAction,
  type CouchState,
  type CouchVibe,
  type CouchMusicMode,
} from "@/lib/gang/core/couch";
import { GANG_EXPERIENCES, groupBand } from "@/lib/gang/core/experience";
import type { GangGameId } from "@/lib/gang/core/playbooks";
import { recordSeen, seenIds } from "@/lib/content-history";
import { gangGame } from "@/lib/gang/catalog";
import { cn } from "@/lib/utils";
import { GangPlayer } from "./GangPlayer";
import { couchGame } from "@/lib/gang/core/experience";
import type { GangRuntimePlayer } from "@/lib/gang/core/runtime";

const actionClass =
  "min-h-12 rounded-xl border border-white/20 px-5 py-3 text-base font-medium transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300 disabled:opacity-35";
const primary =
  actionClass +
  " bg-[var(--couch-accent)] text-black hover:brightness-110 border-[var(--couch-accent)]";

/** One queue, explicit mechanics per title. Secret games keep their private player. */
export function GangSharedNight({
  queue,
  players,
  rounds,
  onExit,
  display = "couch",
}: {
  queue: GangGameId[];
  players: GangRuntimePlayer[];
  rounds?: Record<string, number> | undefined;
  onExit: () => void;
  display?: "couch" | "phone";
}) {
  const [index, setIndex] = useState(0);
  const id = queue[index];
  const advance = () =>
    index + 1 < queue.length ? setIndex(index + 1) : onExit();
  if (!id) return null;
  if (!couchGame(id))
    return (
      <GangPlayer
        key={`${index}-${id}`}
        queue={[id]}
        players={players}
        rounds={rounds}
        onExit={advance}
      />
    );
  return (
    <CouchPlayer
      key={`${index}-${id}`}
      gameId={id}
      count={players.length}
      names={players.length <= 4 ? players.map((p) => p.name) : []}
      rounds={rounds?.[id]}
      onExit={onExit}
      onNext={index + 1 < queue.length ? advance : undefined}
      nextTitle={gangGame(queue[index + 1] ?? "")?.title}
      display={display}
    />
  );
}

interface LocalTrack {
  id: string;
  title: string;
  url: string;
}
function Quantity({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/15 p-3">
      <span className="break-words text-sm sm:text-base">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={0}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(
            Math.min(max, Math.max(0, Math.floor(Number(e.target.value) || 0))),
          )
        }
        className="min-h-12 w-20 shrink-0 rounded-lg bg-white/10 p-2 text-center text-xl"
      />
    </label>
  );
}

export function CouchPlayer({
  gameId,
  count,
  names = [],
  rounds,
  onExit,
  onNext,
  nextTitle,
  display = "couch",
}: {
  gameId: GangGameId;
  count: number;
  names?: string[];
  rounds?: number | undefined;
  onExit: () => void;
  onNext?: (() => void) | undefined;
  nextTitle?: string | undefined;
  display?: "couch" | "phone";
}) {
  const [seed, setSeed] = useState(() =>
    Math.floor(Math.random() * 2147483647),
  );
  const [vibe, setVibe] = useState<CouchVibe>("lively");
  const [musicMode, setMusicMode] = useState<CouchMusicMode>("dj");
  const [musicDjIndex, setMusicDjIndex] = useState(0);
  const [state, dispatch] = useReducer(
    (
      s: CouchState,
      a:
        | CouchAction
        | {
            type: "RESTART";
            seed: number;
            rounds?: number | undefined;
            vibe: CouchVibe;
            musicMode?: CouchMusicMode;
            musicDjIndex?: number;
          },
    ) =>
      a.type === "RESTART"
        ? createCouchSession({
            gameId,
            playerCount: count,
            names,
            rounds: a.rounds,
            seed: a.seed,
            seen: seenIds(),
            vibe: a.vibe,
            musicMode: a.musicMode ?? musicMode,
            musicDjIndex: a.musicDjIndex ?? musicDjIndex,
          })
        : reduceCouch(s, a),
    null,
    () =>
      createCouchSession({
        gameId,
        playerCount: count,
        names,
        rounds,
        seed,
        seen: seenIds(),
        musicMode,
        musicDjIndex,
      }),
  );
  const [clock, setClock] = useState(Date.now());
  const [counts, setCounts] = useState<number[]>([]);
  const [collecting, setCollecting] = useState(false);
  const [predictions, setPredictions] = useState<number[]>([]);
  const [choice, setChoice] = useState(0);
  const [winners, setWinners] = useState<string[]>([]);
  const [confirmExit, setConfirmExit] = useState(false);
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [audioError, setAudioError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const [screenError, setScreenError] = useState("");
  const root = useRef<HTMLDivElement>(null),
    audio = useRef<HTMLAudioElement>(null);
  const trackRef = useRef(tracks);
  trackRef.current = tracks;
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const stopAudio = () => {
    audio.current?.pause();
    setPlaying(false);
    if (stopRef.current) clearTimeout(stopRef.current);
  };
  const title = gangGame(gameId)?.title ?? gameId,
    contract = GANG_EXPERIENCES[gameId],
    prompt = couchPrompt(state),
    kind = couchInput(gameId);
  const djMode = kind === "music" && state.musicMode === "dj";
  const track = !djMode ? tracks[state.index] : undefined;
  const musicReady = djMode ? state.musicHeard : heard;
  const guessingCount = state.teams.reduce(
    (sum, t) => sum + t.members.length,
    0,
  );
  const selectedRounds =
    kind === "music" && musicMode === "local"
      ? Math.min(rounds ?? 6, tracks.length)
      : rounds;
  const next = () => dispatch({ type: "NEXT", at: Date.now() });
  const seconds =
    state.deadline === null
      ? couchSeconds(state)
      : Math.min(
          couchSeconds(state),
          Math.max(0, Math.ceil((state.deadline - clock) / 1000)),
        );
  const optionCount = prompt.options?.length ?? 0;
  const scores = state.teams
    .slice()
    .sort((a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0));
  const remainingAudio =
    kind !== "music" || djMode || state.index + 1 < tracks.length;

  useEffect(() => {
    setCounts([]);
    setCollecting(false);
    setPredictions([]);
    setChoice(0);
    setWinners([]);
    setHeard(false);
    setAudioError("");
  }, [state.index, seed]);
  useEffect(() => {
    if (state.phase === "play") {
      recordSeen([...(kind === "music" ? [] : [prompt.id]), `game/${gameId}`]);
    }
  }, [state.index, state.phase, gameId, prompt.id, kind]);
  useEffect(() => {
    if (state.phase !== "play" || state.paused) return;
    const id = setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (kind === "relay") dispatch({ type: "TIMEOUT", at: now });
    }, 100);
    return () => clearInterval(id);
  }, [state.phase, state.paused, kind]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        // Switching to the DJ's independent music app is part of this mode.
        if (stateRef.current.musicMode === "dj") return;
        dispatch({ type: "PAUSE", at: Date.now() });
        stopAudio();
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  useEffect(() => {
    if (state.phase !== "play" || state.paused) stopAudio();
  }, [state.phase, state.paused]);
  useEffect(
    () => () => {
      trackRef.current.forEach((t) => URL.revokeObjectURL(t.url));
      if (stopRef.current) clearTimeout(stopRef.current);
    },
    [],
  );
  useEffect(() => {
    const el = root.current;
    el?.querySelector<HTMLElement>("[data-phase-heading]")?.focus();
  }, [state.phase, state.index]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dispatch({ type: "PAUSE", at: Date.now() });
        stopAudio();
        setConfirmExit(true);
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = items[0],
        last = items.at(-1);
      if (!first || !last) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !root.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function selectFiles(files: FileList | null) {
    stopAudio();
    tracks.forEach((t) => URL.revokeObjectURL(t.url));
    const seen = seenIds();
    const chosen = localAudioDeck(Array.from(files ?? []), seen, seed);
    setTracks(
      chosen.map(({ id, file }) => ({
        id,
        title: file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "),
        url: URL.createObjectURL(file),
      })),
    );
    setAudioError(
      chosen.length < 2
        ? "Wählt mindestens zwei Audiodateien. MP3, M4A, OGG oder WAV; höchstens 100 MB pro Datei."
        : "",
    );
    dispatch({
      type: "RESTART",
      seed,
      rounds: Math.min(rounds ?? 6, chosen.length),
      vibe,
    });
  }
  async function playAudio() {
    const el = audio.current;
    if (!el || !track) return;
    setAudioError("");
    try {
      if (el.readyState < 1)
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            cleanup();
            reject(new Error("load"));
          }, 8000);
          const cleanup = () => {
            clearTimeout(timer);
            el.removeEventListener("loadedmetadata", loaded);
            el.removeEventListener("error", failed);
          };
          const loaded = () => {
            cleanup();
            resolve();
          };
          const failed = () => {
            cleanup();
            reject(new Error("audio"));
          };
          el.addEventListener("loadedmetadata", loaded);
          el.addEventListener("error", failed);
        });
      if (stateRef.current.phase !== "play" || stateRef.current.paused) return;
      el.currentTime = Number.isFinite(el.duration)
        ? Math.min(30, el.duration * 0.2)
        : 0;
      await el.play();
      setPlaying(true);
      setHeard(true);
      recordSeen([track.id]);
      if (stopRef.current) clearTimeout(stopRef.current);
      stopRef.current = setTimeout(stopAudio, couchSeconds(state) * 1000);
    } catch {
      setAudioError(
        "Der Ausschnitt lässt sich gerade nicht abspielen. Versucht es erneut oder überspringt den Track.",
      );
      setPlaying(false);
    }
  }
  const doResolve = () =>
    dispatch({
      type: "RESOLVE",
      counts:
        kind === "majority"
          ? Array.from({ length: optionCount }, (_, i) => counts[i] ?? 0)
          : state.teams.map((_, i) => counts[i] ?? 0),
      predictions: state.teams.map((_, i) => predictions[i] ?? 0),
      choice,
      winners,
    });
  const total = counts.reduce((a, b) => a + b, 0);
  const validResolve =
    kind === "majority"
      ? total <= count
      : kind === "spotlight"
        ? choice > 0
        : true;
  const canEncore =
    !state.encore && state.index + 1 < state.deck.length && remainingAudio;

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} · ${display === "couch" ? "Couch" : "One Phone"}`}
      data-testid="couch-player"
      data-phase={state.phase}
      data-game={gameId}
      style={
        {
          "--g": "var(--couch-accent)",
          "--couch-accent": `hsl(${gangGame(gameId)?.hue ?? 95} 85% 72%)`,
        } as CSSProperties
      }
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#101113] text-white"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-lime-300/10 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-5 p-4 pb-8 sm:p-8 lg:p-12">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <p className="text-xs font-mono tracking-[.2em] text-[var(--couch-accent)]">
              {display === "couch"
                ? "DER RAUM SPIELT"
                : "EIN GERÄT. ALLE DABEI."}
            </p>
            <p className="outline-none font-sans font-semibold tracking-tight text-2xl sm:text-3xl">
              {title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={actionClass + " p-3"}
              aria-label="Vollbild"
              onClick={async () => {
                try {
                  if (document.fullscreenElement)
                    await document.exitFullscreen();
                  else await root.current?.requestFullscreen();
                } catch {
                  setScreenError(
                    "Vollbild ist hier nicht verfügbar. Die große Ansicht funktioniert trotzdem.",
                  );
                }
              }}
            >
              <Maximize className="size-5" />
            </button>
            {state.phase === "play" && (
              <button
                className={actionClass + " p-3"}
                aria-label={state.paused ? "Weiterspielen" : "Pause"}
                onClick={() => {
                  stopAudio();
                  dispatch({
                    type: state.paused ? "RESUME" : "PAUSE",
                    at: Date.now(),
                  });
                }}
              >
                {state.paused ? (
                  <Play className="size-5" />
                ) : (
                  <Pause className="size-5" />
                )}
              </button>
            )}
            <button
              className={actionClass + " p-3"}
              aria-label="Spiel verlassen"
              onClick={() => {
                dispatch({ type: "PAUSE", at: Date.now() });
                stopAudio();
                setConfirmExit(true);
              }}
            >
              <X className="size-5" />
            </button>
          </div>
        </header>
        {screenError && (
          <p role="status" className="text-sm text-white/60">
            {screenError}
          </p>
        )}
        {confirmExit ? (
          <section className="my-auto mx-auto w-full max-w-xl rounded-3xl border border-white/20 bg-[#181a1d] p-6">
            <h2 className="text-3xl font-sans font-semibold tracking-tight">
              Schluss für heute?
            </h2>
            <p className="my-4 text-white/70">
              Ihr könnt den Zwischenstand feiern oder direkt aussteigen.
              {djMode && " Die Musik stoppt ihr in eurer Musik-App."}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className={primary}
                onClick={() => {
                  setConfirmExit(false);
                  dispatch({ type: "RESUME", at: Date.now() });
                }}
              >
                Weiterspielen
              </button>
              <button
                className={actionClass}
                onClick={() => {
                  setConfirmExit(false);
                  dispatch({ type: "FINISH" });
                }}
              >
                Zum Abschluss
              </button>
              <button className={actionClass} onClick={onExit}>
                Spiel verlassen
              </button>
            </div>
          </section>
        ) : (
          <>
            {state.phase === "ready" && (
              <section className="my-auto grid gap-8 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <p className="font-mono text-xs text-[var(--couch-accent)]">
                    {count} MENSCHEN · {state.rounds} RUNDEN · KEIN BEITRITT
                    NÖTIG
                  </p>
                  <h1
                    data-phase-heading
                    tabIndex={-1}
                    className="outline-none mt-5 font-sans font-semibold tracking-tight text-[clamp(2.2rem,4.5vw,4rem)] leading-[.95]"
                  >
                    {contract.fantasy}
                  </h1>
                  <p className="mt-6 text-lg text-white/65">
                    {djMode
                      ? "NOCTURNE auf den TV oder Laptop. Euer DJ bedient die Musik-App separat, die anderen raten. Auf einem Handy geht’s mit App-Wechsel."
                      : "Laptop öffnen oder auf den TV spiegeln. Eine Person bedient, alle spielen. Keine Handys weiterreichen."}
                  </p>
                </div>
                <div className="self-center rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8">
                  <h2 className="text-xl font-semibold">Eure Aufstellung</h2>
                  <p className="mt-3 text-white/70">
                    {djMode
                      ? `${state.musicDj!.name} legt auf und zählt nicht zu den Rateteams. ${guessingCount === 1 ? "Zu zweit: Wie viele Tracks erkennst du?" : `${guessingCount} raten mit.`}`
                      : kind === "music"
                        ? guessingCount <= 4
                          ? "Alle raten einzeln. Hand hoch, wenn ihr den Track kennt."
                          : `${state.teams.length} Rateteams. Sprecher wechseln; Handzeichen entscheidet, wer beginnt.`
                        : contract.scale[groupBand(count)]}
                  </p>
                  <div className="my-4 flex flex-wrap gap-2">
                    {state.teams.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-white/10 px-3 py-2 text-sm"
                      >
                        {t.name}
                        {guessingCount > 4 ? ` · ${t.members.length}` : ""}
                      </span>
                    ))}
                  </div>
                  {guessingCount > 4 && (
                    <p className="text-sm text-white/65">
                      {djMode ? "Ohne DJ: " : ""}Zählt reihum von 1 bis{" "}
                      {state.teams.length}. Gleiche Nummer, gleiches Team.
                      Sprecher wechseln bei jedem Auftritt.
                    </p>
                  )}
                  {kind !== "music" && (
                    <fieldset className="mt-6">
                      <legend className="mb-2 text-sm text-white/65">
                        Euer Tempo
                      </legend>
                      <div className="flex gap-2">
                        {(["relaxed", "lively"] as const).map((v) => (
                          <button
                            key={v}
                            className={cn(
                              actionClass,
                              v === vibe &&
                                "border-lime-300 text-[var(--couch-accent)]",
                            )}
                            aria-pressed={v === vibe}
                            onClick={() => {
                              setVibe(v);
                              dispatch({
                                type: "RESTART",
                                seed,
                                rounds: selectedRounds,
                                vibe: v,
                              });
                            }}
                          >
                            {v === "relaxed" ? "Entspannt" : "Mit Druck"}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  {kind === "music" && (
                    <div className="mt-6 border-t border-white/15 pt-5">
                      <fieldset>
                        <legend className="mb-3 font-semibold">
                          Wo läuft eure Musik?
                        </legend>
                        <div className="flex flex-wrap gap-2">
                          {(["dj", "local"] as const).map((mode) => (
                            <button
                              key={mode}
                              className={cn(
                                actionClass,
                                musicMode === mode &&
                                  "border-lime-300 text-[var(--couch-accent)]",
                              )}
                              aria-pressed={musicMode === mode}
                              onClick={() => {
                                stopAudio();
                                setAudioError("");
                                setHeard(false);
                                setMusicMode(mode);
                                dispatch({
                                  type: "RESTART",
                                  seed,
                                  vibe,
                                  musicMode: mode,
                                  rounds:
                                    mode === "local"
                                      ? Math.min(rounds ?? 6, tracks.length)
                                      : rounds,
                                });
                              }}
                            >
                              {mode === "dj"
                                ? "Musik-App · DJ legt auf"
                                : "Eigene Audiodateien"}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      {djMode ? (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-white/70">
                            Euer DJ spielt Musik in der gewohnten App, etwa
                            Apple Music oder Spotify. Play, Pause und Songwahl
                            bleiben dort. NOCTURNE verbindet sich nicht mit dem
                            Dienst.
                          </p>
                          <label className="flex flex-col gap-2 text-sm">
                            Wer legt auf?
                            <select
                              value={musicDjIndex}
                              className="min-h-12 rounded-lg bg-[#282a2f] p-3"
                              onChange={(e) => {
                                const index = Number(e.target.value);
                                setMusicDjIndex(index);
                                dispatch({
                                  type: "RESTART",
                                  seed,
                                  vibe,
                                  rounds,
                                  musicDjIndex: index,
                                });
                              }}
                            >
                              {Array.from({ length: count }, (_, i) => (
                                <option key={i} value={i}>
                                  {names[i] || `Person ${i + 1}`}
                                </option>
                              ))}
                            </select>
                          </label>
                          <p className="text-sm text-white/65">
                            Wählt Tracks, die heute noch nicht dran waren.
                            Musik-App und Songanzeige bleiben vor den Ratenden
                            verborgen. Bei Bildschirmspiegelung die Musik über
                            ein separates Gerät bedienen.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <label
                            className="block text-base font-semibold"
                            htmlFor="couch-audio"
                          >
                            Eure Musik mitbringen
                          </label>
                          <p className="my-2 text-sm text-white/65">
                            Wählt 2–{MAX_LOCAL_AUDIO_FILES} eigene Audiodateien.
                            Dateinamen sind die Auflösung – am besten „Artist –
                            Titel“. Alles bleibt auf diesem Gerät. Kein Upload.
                            Downloads aus Streaming-Apps sind keine
                            importierbaren Audiodateien. Für drei volle Partien
                            mit Zugabe braucht ihr 39 verschiedene Tracks.
                          </p>
                          <input
                            id="couch-audio"
                            className="w-full min-w-0 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-lime-300 file:px-3 file:py-3 file:text-black"
                            type="file"
                            accept="audio/*,.mp3,.m4a,.ogg,.wav,.flac,.aac"
                            multiple
                            onChange={(e) => selectFiles(e.target.files)}
                          />
                          <p className="mt-2 text-sm text-[var(--couch-accent)]">
                            {tracks.length
                              ? `${tracks.length} Tracks bereit · ${state.rounds} Drops`
                              : "Ohne Audio startet kein Hörspiel."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    disabled={kind === "music" && !djMode && tracks.length < 2}
                    className={primary + " mt-6 w-full"}
                    onClick={next}
                  >
                    Los geht’s
                  </button>
                </div>
              </section>
            )}
            {(state.phase === "explain" || state.phase === "transition") && (
              <section className="my-auto mx-auto max-w-4xl py-8 text-center">
                <p className="font-mono tracking-[.2em] text-[var(--couch-accent)]">
                  {state.phase === "explain"
                    ? "IN ZEHN SEKUNDEN DRIN"
                    : couchBeat(state)}
                </p>
                <h2
                  data-phase-heading
                  tabIndex={-1}
                  className="outline-none mt-6 font-sans font-semibold tracking-tight text-[clamp(1.8rem,4vw,3.4rem)] leading-tight"
                >
                  {state.phase === "explain"
                    ? djMode
                      ? "DJ legt auf. Hand hoch, Titel oder Interpret nennen. Zwei Punkte für den Ersttreffer, einen für den Steal. DJ löst laut auf."
                      : contract.rule
                    : couchCue(state)}
                </h2>
                {kind === "majority" || kind === "spotlight" ? (
                  <p className="mt-6 text-lg text-white/65">
                    Papier und Stift oder Finger verdeckt halten: Eure Tipps
                    stehen fest, bevor jemand aufzählt. Der Host trägt sie erst
                    danach ein.
                  </p>
                ) : null}
                <p className="mt-5 text-white/60">
                  Runde {state.index + 1} von {state.rounds}
                  {state.encore ? " · ENCORE" : ""}
                </p>
                <button className={primary + " mt-8"} onClick={next}>
                  {state.phase === "explain" ? "Runde starten" : "Bereit. Los."}
                </button>
              </section>
            )}
            {state.phase === "play" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs tracking-widest text-[var(--couch-accent)]">
                    {couchBeat(state)} · {state.index + 1}/{state.rounds}
                  </p>
                  {kind !== "music" && (
                    <span
                      aria-label="Verbleibende Sekunden"
                      className={cn(
                        "font-sans font-semibold tracking-tight text-4xl tabular-nums",
                        seconds <= 3 ? "text-orange-300" : "text-white/70",
                      )}
                    >
                      {state.paused ? "PAUSE" : `${seconds}s`}
                    </span>
                  )}
                </div>
                {state.paused ? (
                  <section className="my-auto text-center">
                    <h2
                      data-phase-heading
                      tabIndex={-1}
                      className="outline-none font-sans font-semibold tracking-tight text-6xl"
                    >
                      Kurz durchatmen.
                    </h2>
                    {djMode && (
                      <p className="mt-4 text-white/65">
                        Die Musik pausiert ihr separat in eurer Musik-App.
                      </p>
                    )}
                    <button
                      className={primary + " mt-6"}
                      onClick={() =>
                        dispatch({ type: "RESUME", at: Date.now() })
                      }
                    >
                      Weiter geht’s
                    </button>
                  </section>
                ) : (
                  <>
                    <section
                      className={collecting ? "py-2" : "flex-1 py-3 sm:py-6"}
                    >
                      <h2
                        data-phase-heading
                        tabIndex={-1}
                        className={cn(
                          "outline-none mx-auto max-w-6xl break-words font-sans font-semibold tracking-tight leading-[1.06]",
                          collecting
                            ? "text-xl sm:text-2xl"
                            : "text-[clamp(1.8rem,4.3vw,4rem)]",
                        )}
                      >
                        {kind === "music"
                          ? "Ihr kennt diesen Track. Oder?"
                          : prompt.prompt}
                      </h2>
                      <p className="mt-5 max-w-4xl text-base text-white/65 sm:text-xl">
                        {couchCue(state)}
                      </p>
                      {prompt.options && !collecting && (
                        <ol className="mt-7 grid gap-3 sm:grid-cols-2">
                          {prompt.options.map((o, i) => (
                            <li
                              key={o}
                              className="flex items-center gap-4 rounded-2xl border border-white/15 p-4 text-xl sm:text-2xl"
                            >
                              <span className="font-mono text-[var(--couch-accent)]">
                                {i + 1}
                              </span>
                              {o}
                            </li>
                          ))}
                        </ol>
                      )}
                      {kind === "relay" && (
                        <div className="mt-6 rounded-3xl border border-orange-300/30 bg-orange-300/5 p-5">
                          <p className="text-sm text-orange-200">
                            ZUG {state.turn + 1} / {state.teams.length * 3}
                          </p>
                          <h3 className="mt-2 font-sans font-semibold tracking-tight text-5xl">
                            {couchActiveTeam(state).name}
                          </h3>
                          <p className="mt-2 text-white/65">
                            {count > 4
                              ? `Jetzt spricht Person ${couchSpokesperson(state, couchActiveTeam(state))}. `
                              : ""}
                            Der Raum prüft: neu, passend, rechtzeitig?
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              className={primary}
                              onClick={() =>
                                dispatch({
                                  type: "TURN",
                                  valid: true,
                                  at: Date.now(),
                                })
                              }
                            >
                              Gültig · weiter
                            </button>
                            <button
                              className={actionClass}
                              onClick={() =>
                                dispatch({
                                  type: "TURN",
                                  valid: false,
                                  at: Date.now(),
                                })
                              }
                            >
                              Wiederholt / passt nicht
                            </button>
                          </div>
                        </div>
                      )}
                      {kind === "music" && (
                        <div className="mt-6">
                          {djMode ? (
                            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                              <p className="font-semibold">
                                {state.musicDj!.name} am DJ-Pult
                              </p>
                              <p className="mt-2 text-white/65">
                                Wählt einen neuen Track in eurer Musik-App.
                                Starten und Stoppen übernimmt euer DJ. Die
                                Songanzeige bleibt verdeckt.
                              </p>
                              {!state.musicHeard ? (
                                <button
                                  className={primary + " mt-4"}
                                  onClick={() =>
                                    dispatch({ type: "MUSIC_HEARD" })
                                  }
                                >
                                  Musik läuft · Raten öffnen
                                </button>
                              ) : (
                                <p
                                  role="status"
                                  className="mt-3 text-[var(--couch-accent)]"
                                >
                                  Ohren auf. Wer weiß es?
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              className={primary + " flex items-center gap-3"}
                              onClick={() =>
                                playing ? stopAudio() : void playAudio()
                              }
                            >
                              <Volume2 className="size-5" />
                              {playing
                                ? "Ausschnitt stoppen"
                                : `${couchSeconds(state)} Sekunden hören`}
                            </button>
                          )}
                          <p className="mt-4 text-white/65">
                            {state.musicClaim
                              ? `${state.teams.find((t) => t.id === state.musicClaim)?.name}: Titel oder Interpret nennen.`
                              : "Wer war zuerst? Host wählt nach dem Handzeichen."}
                          </p>
                          {state.musicClaim ? (
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                className={primary}
                                onClick={() =>
                                  dispatch({
                                    type: "MUSIC_JUDGE",
                                    correct: true,
                                  })
                                }
                              >
                                Richtig erkannt
                              </button>
                              <button
                                className={actionClass}
                                onClick={() =>
                                  dispatch({
                                    type: "MUSIC_JUDGE",
                                    correct: false,
                                  })
                                }
                              >
                                {state.teams.length - state.musicMisses.length >
                                1
                                  ? "Daneben · Steal öffnen"
                                  : "Daneben · auflösen"}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-3">
                              {state.teams.map((t) => (
                                <button
                                  key={t.id}
                                  className={actionClass}
                                  disabled={
                                    !musicReady ||
                                    state.musicMisses.includes(t.id)
                                  }
                                  onClick={() => {
                                    stopAudio();
                                    dispatch({
                                      type: "MUSIC_CLAIM",
                                      teamId: t.id,
                                    });
                                  }}
                                >
                                  {t.name}
                                  {state.musicMisses.includes(t.id)
                                    ? " · versucht"
                                    : ""}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {kind === "spotlight" && (
                        <p className="mt-5 rounded-2xl bg-lime-300/10 p-4 text-xl text-lime-200">
                          Spotlight:{" "}
                          {state.teams[state.index % state.teams.length]!.name}{" "}
                          · Person{" "}
                          {couchSpokesperson(
                            state,
                            state.teams[state.index % state.teams.length]!,
                          )}
                        </p>
                      )}
                      {kind === "quantity" && (
                        <p className="mt-5 text-white/70">
                          Je Team{" "}
                          {Math.min(
                            6,
                            ...state.teams.map((t) => t.members.length),
                          )}{" "}
                          Aktive, ab Person {state.index + 1} im Team reihum.
                          Die anderen prüfen. Gezählt werden:{" "}
                          {prompt.teamChallenge?.metric}.
                        </p>
                      )}
                    </section>
                    {kind !== "relay" &&
                      (collecting || kind === "line" || kind === "music") && (
                        <section
                          className="rounded-2xl border border-white/15 bg-white/[.04] p-4 sm:p-5"
                          aria-label="Host-Steuerung"
                        >
                          <p className="mb-4 font-mono text-xs tracking-widest text-white/50">
                            {kind === "line"
                              ? "DER REVEAL GEHÖRT EUCH"
                              : "HOST · NACH DER AKTION EINTRAGEN"}
                          </p>
                          {(kind === "majority" || kind === "quantity") && (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {(kind === "majority"
                                ? prompt.options!
                                : state.teams.map((t) => t.name)
                              ).map((label, i) => (
                                <Quantity
                                  key={`${state.index}-${i}`}
                                  label={
                                    kind === "majority"
                                      ? `Stimmen ${i + 1}: ${label}`
                                      : `Ergebnis ${label}`
                                  }
                                  value={counts[i] ?? 0}
                                  max={kind === "majority" ? count : 30}
                                  onChange={(v) =>
                                    setCounts((old) =>
                                      Array.from(
                                        {
                                          length:
                                            kind === "majority"
                                              ? optionCount
                                              : state.teams.length,
                                        },
                                        (_, j) => (j === i ? v : (old[j] ?? 0)),
                                      ),
                                    )
                                  }
                                />
                              ))}
                            </div>
                          )}
                          {kind === "majority" && (
                            <p
                              className={cn(
                                "mt-3 text-sm",
                                total > count
                                  ? "text-orange-300"
                                  : "text-white/60",
                              )}
                            >
                              {total} von {count} Stimmen
                              {total > count
                                ? " · Das sind zu viele."
                                : " · Enthaltungen sind okay."}
                            </p>
                          )}
                          {(kind === "majority" || kind === "spotlight") && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {kind === "spotlight" && (
                                <label className="flex flex-col gap-2 text-sm">
                                  Spotlight hat gewählt
                                  <select
                                    className="min-h-12 rounded-lg bg-[#282a2f] p-3"
                                    value={choice}
                                    onChange={(e) =>
                                      setChoice(Number(e.target.value))
                                    }
                                  >
                                    <option value={0}>Auflösung wählen</option>
                                    {prompt.options?.map((o, i) => (
                                      <option key={o} value={i + 1}>
                                        {i + 1} · {o}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                              {state.teams.map((t, i) =>
                                kind === "spotlight" &&
                                i ===
                                  state.index % state.teams.length ? null : (
                                  <label
                                    key={t.id}
                                    className="flex flex-col gap-2 text-sm"
                                  >
                                    Tipp {t.name}
                                    <select
                                      className="min-h-12 w-full rounded-lg bg-[#282a2f] p-3"
                                      value={predictions[i] ?? 0}
                                      onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setPredictions((old) =>
                                          state.teams.map((_, j) =>
                                            j === i ? v : (old[j] ?? 0),
                                          ),
                                        );
                                      }}
                                    >
                                      <option value={0}>Kein Tipp</option>
                                      {prompt.options?.map((o, i) => (
                                        <option key={o} value={i + 1}>
                                          {i + 1} · {o}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                ),
                              )}
                            </div>
                          )}
                          {(kind === "titles" || kind === "applause") && (
                            <>
                              <p className="mb-3 text-white/65">
                                {kind === "titles"
                                  ? "Wen hat die Runde gewählt? Bei großen Gruppen: euren aktuellen Teamvertreter."
                                  : "Welcher Auftritt bekommt den Applaus? Gleichstand darf stehen bleiben."}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {state.teams.map((t) => (
                                  <button
                                    className={cn(
                                      actionClass,
                                      winners.includes(t.id) &&
                                        "border-lime-300 text-[var(--couch-accent)]",
                                    )}
                                    aria-pressed={winners.includes(t.id)}
                                    key={t.id}
                                    onClick={() =>
                                      setWinners((old) =>
                                        old.includes(t.id)
                                          ? old.filter((id) => id !== t.id)
                                          : [...old, t.id],
                                      )
                                    }
                                  >
                                    {t.name}
                                    {count > 8
                                      ? ` · Person ${couchSpokesperson(state, t)}`
                                      : ""}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          {kind === "line" && (
                            <p className="mb-3 text-white/65">
                              Freeze. Zwei entgegengesetzte Positionen bekommen
                              je einen Satz. Kein Punktestand bewertet euch.
                            </p>
                          )}
                          <button
                            className={primary + " mt-5"}
                            disabled={
                              !validResolve || (kind === "music" && !musicReady)
                            }
                            onClick={doResolve}
                          >
                            {kind === "music"
                              ? "Niemand erkannt · auflösen"
                              : kind === "line"
                                ? "Alle stehen · auflösen"
                                : "Auflösen"}
                          </button>
                        </section>
                      )}
                    {!collecting &&
                      !["relay", "line", "music"].includes(kind) && (
                        <button
                          className={primary + " self-start"}
                          onClick={() => setCollecting(true)}
                        >
                          {kind === "majority"
                            ? "Alle abgestimmt · zählen"
                            : kind === "titles"
                              ? "Alle gezeigt · Titel vergeben"
                              : kind === "applause"
                                ? "Auftritte durch · entscheiden"
                                : kind === "quantity"
                                  ? "Ergebnisse eintragen"
                                  : "Alle festgelegt · aufdecken"}
                        </button>
                      )}
                    <button
                      className={actionClass + " self-start text-white/60"}
                      onClick={() => dispatch({ type: "SKIP" })}
                    >
                      <SkipForward className="mr-2 inline size-4" />
                      Runde überspringen
                    </button>
                  </>
                )}
              </>
            )}
            {state.phase === "reveal" && (
              <section className="my-auto py-8 text-center">
                <p className="font-mono text-[var(--couch-accent)]">
                  {state.result?.skipped
                    ? "NÄCHSTE CHANCE"
                    : "DER MOMENT DER WAHRHEIT"}
                </p>
                <h2
                  data-phase-heading
                  tabIndex={-1}
                  className="outline-none mt-5 font-sans font-semibold tracking-tight text-[clamp(2rem,5vw,4rem)] leading-[.95]"
                >
                  {state.result?.headline}
                </h2>
                {kind === "music" && track && !state.result?.skipped && (
                  <p className="mx-auto mt-7 max-w-4xl break-words text-2xl text-lime-200 sm:text-4xl">
                    {track.title}
                  </p>
                )}
                {djMode && !state.result?.skipped && (
                  <p className="mx-auto mt-7 max-w-4xl text-2xl text-lime-200 sm:text-4xl">
                    {state.musicDj!.name}, Bühne frei: Titel und Interpret laut
                    auflösen.
                  </p>
                )}
                {state.result?.revealText && (
                  <p className="mt-6 text-3xl text-[var(--couch-accent)]">
                    {state.result.revealText}
                  </p>
                )}
                {state.result?.counts && (
                  <div className="mx-auto mt-8 grid max-w-4xl gap-3 text-left">
                    {state.result.counts.map((n, i) => (
                      <div key={i} className="rounded-xl bg-white/5 p-3">
                        <div className="flex justify-between gap-3">
                          <span>
                            {kind === "majority"
                              ? prompt.options?.[i]
                              : state.teams[i]?.name}
                          </span>
                          <strong>{n}</strong>
                        </div>
                        <div
                          className="mt-2 h-2 rounded-full bg-lime-300"
                          style={{
                            width: `${Math.max(1, (n / Math.max(1, ...state.result!.counts!)) * 100)}%`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {kind === "titles" && (
                  <p className="mt-6 text-white/70">
                    {prompt.prompt} ·{" "}
                    {couchIsFinal(state) && state.finaleVariant === 1
                      ? "Dankesrede in fünf Wörtern."
                      : "Zehn Sekunden für eure Dankesrede."}
                  </p>
                )}
                <p className="mt-7 text-2xl">
                  {state.result?.winners
                    .map((id) => state.teams.find((t) => t.id === id)?.name)
                    .join(" + ")}
                </p>
                <button className={primary + " mt-8"} onClick={next}>
                  {kind === "line" ? "Weiter" : "Punkte zeigen"}
                </button>
              </section>
            )}
            {state.phase === "score" && (
              <section className="my-auto py-8 text-center">
                <h2
                  data-phase-heading
                  tabIndex={-1}
                  className="outline-none font-sans font-semibold tracking-tight text-5xl"
                >
                  {kind === "line"
                    ? "Mehr verstanden. Weiter geht’s."
                    : "Das steht jetzt auf der Uhr."}
                </h2>
                {kind !== "line" && (
                  <ol className="mx-auto mt-8 max-w-xl space-y-2 text-left">
                    {scores.map((t) => (
                      <li
                        key={t.id}
                        className="flex justify-between rounded-xl bg-white/5 p-4"
                      >
                        <span>{t.name}</span>
                        <strong>
                          {state.scores[t.id]}
                          {(state.result?.delta[t.id] ?? 0) > 0 && (
                            <span className="ml-3 text-[var(--couch-accent)]">
                              +{state.result?.delta[t.id]}
                            </span>
                          )}
                        </strong>
                      </li>
                    ))}
                  </ol>
                )}
                <button className={primary + " mt-8"} onClick={next}>
                  {couchIsFinal(state) ? "Zum Finale" : "Nächste Runde"}
                </button>
              </section>
            )}
            {state.phase === "finale" && (
              <section
                data-testid="couch-finale"
                className="my-auto py-8 text-center"
              >
                <p className="font-mono text-[var(--couch-accent)]">
                  {state.results.filter((r) => !r.skipped).length} GESPIELTE
                  RUNDEN
                </p>
                <h2
                  data-phase-heading
                  tabIndex={-1}
                  className="outline-none mt-5 font-sans font-semibold tracking-tight text-[clamp(2.5rem,6vw,5rem)] leading-[.95]"
                >
                  {kind === "line"
                    ? "Ihr steht euch näher."
                    : Math.max(...Object.values(state.scores)) === 0
                      ? "Der Abend zählt."
                      : scores
                          .filter(
                            (t) =>
                              state.scores[t.id] ===
                              state.scores[scores[0]!.id],
                          )
                          .map((t) => t.name)
                          .join(" + ")}
                </h2>
                <p className="mt-5 text-xl text-white/65">
                  {kind === "titles"
                    ? "Eure Galerie für die Geschichtsbücher."
                    : "Das war eine Runde wert."}
                </p>
                {kind !== "line" && (
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {scores.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full border border-white/20 px-4 py-2"
                      >
                        {t.name} · {state.scores[t.id]}
                      </span>
                    ))}
                  </div>
                )}
                {kind === "titles" && (
                  <ul className="mx-auto mt-6 max-w-3xl space-y-3 text-left">
                    {state.results.map((r, i) => (
                      <li key={i} className="rounded-xl bg-white/5 p-3">
                        {r.prompt}
                        <br />
                        <strong className="text-lime-200">
                          {r.winners
                            .map(
                              (id) =>
                                state.teams.find((t) => t.id === id)?.name,
                            )
                            .join(" + ") || "Titel blieb offen"}
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  {canEncore && (
                    <button
                      className={primary}
                      onClick={() =>
                        dispatch({ type: "ENCORE", at: Date.now() })
                      }
                    >
                      Noch eine. Genau eine.
                    </button>
                  )}
                  <button
                    className={actionClass}
                    onClick={() => {
                      stopAudio();
                      const fresh = seed + 1;
                      setSeed(fresh);
                      dispatch({
                        type: "RESTART",
                        seed: fresh,
                        rounds: selectedRounds,
                        vibe,
                      });
                      if (kind === "music" && !djMode)
                        setTracks((old) => {
                          const history = seenIds();
                          return [...old].sort(
                            (a, b) =>
                              history.lastIndexOf(a.id) -
                              history.lastIndexOf(b.id),
                          );
                        });
                    }}
                  >
                    <RotateCcw className="mr-2 inline size-4" />
                    Neu mischen
                  </button>
                  {onNext && (
                    <button className={primary} onClick={onNext}>
                      Weiter zu {nextTitle}
                    </button>
                  )}
                  <button className={actionClass} onClick={onExit}>
                    <ArrowLeft className="mr-2 inline size-4" />
                    Zur Spieleauswahl
                  </button>
                </div>
              </section>
            )}
          </>
        )}
        {kind === "music" && track && (
          <audio
            ref={audio}
            src={track.url}
            preload="metadata"
            onEnded={() => setPlaying(false)}
            onError={() => {
              setAudioError(
                "Diese Audiodatei kann der Browser nicht lesen. Überspringt sie oder wählt andere Dateien.",
              );
              setPlaying(false);
            }}
          />
        )}
        {audioError && (
          <p
            role="alert"
            className="rounded-xl border border-orange-300/30 p-4 text-orange-200"
          >
            {audioError}
          </p>
        )}
      </div>
    </div>
  );
}
