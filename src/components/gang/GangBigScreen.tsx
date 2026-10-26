import { TitleGallery } from "./TitleGallery";
import { PhotoGallery, useRoomPhotos } from "./PhotoGallery";
import { MissionFinale } from "./MissionDrawer";
/* BIG SCREEN — display-only client (/gang?screen=CODE). Joins via gang_join_display (no player seat),
   renders only the public room state. No text inputs, no scoring controls, never private payloads. */
import { useEffect, useState } from "react";
import { gangGame } from "@/lib/gang/catalog";
import {
  queueRange,
  readPublic,
  type OnlinePublic,
  type OnlineView,
} from "@/lib/gang/online";
import {
  joinUrl,
  roomErrorText,
  sessionStore,
  type RoomClient,
  type RoomSnapshot,
  type StageProgress,
  type StoredSession,
} from "@/lib/gang/room-client";
import { useRoom } from "@/lib/gang/use-room";
import { cn } from "@/lib/utils";
import { MotifArt, hueVars } from "./MotifArt";
import { QrCode } from "./QrCode";
import { ConnDot } from "./GangRoom";
import { CouchTVStage } from "./CouchTV";
import { readCouchScreen } from "@/lib/gang/couch-screen";
import { MajorityResult } from "./GangPlayer";

const STAGE: Record<string, string> = {
  private: "Geheime Phase",
  predict: "Tipp",
  answer: "Antworten",
  vote: "Abstimmung",
  perform: "Aktion",
  react: "Reaktion",
  reveal: "Reveal",
  score: "Punkte",
};

export function GangBigScreen({
  client,
  code,
  pollMs,
}: {
  client: RoomClient;
  code: string;
  pollMs?: number;
}) {
  const [entry, setEntry] = useState<{
    session: StoredSession;
    snap: RoomSnapshot | null;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    (async () => {
      const stored = sessionStore.get("display");
      if (stored && stored.code === code) {
        try {
          const snap = await client.snapshot(stored.token);
          if (!off) setEntry({ session: stored, snap });
          return;
        } catch {
          sessionStore.clear("display");
        }
      }
      try {
        const r = await client.joinDisplay(code);
        if (!off) setEntry({ session: r.session, snap: r.snapshot });
      } catch (e) {
        if (!off) setErr(roomErrorText(e));
      }
    })();
    return () => {
      off = true;
    };
  }, [client, code]);

  if (err)
    return (
      <Stage>
        <p className="font-mono text-sm tracking-[0.25em] text-signal">
          BIG SCREEN · RAUM {code}
        </p>
        <h1 className="font-display mt-6 text-[clamp(3rem,8vw,7rem)] leading-[0.9]">
          {err}
        </h1>
      </Stage>
    );
  if (!entry)
    return (
      <Stage>
        <p className="font-mono text-sm tracking-[0.25em] text-muted-foreground">
          BIG SCREEN VERBINDET …
        </p>
      </Stage>
    );
  return (
    <Screen
      client={client}
      session={entry.session}
      initial={entry.snap}
      pollMs={pollMs}
    />
  );
}

function Stage({
  hue,
  children,
}: {
  hue?: number | undefined;
  children: React.ReactNode;
}) {
  return (
    <main
      style={hue !== undefined ? hueVars(hue) : undefined}
      data-testid="big-screen"
      className="relative flex min-h-svh flex-col overflow-hidden bg-room px-[6vw] py-[5vh] text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70% 70% at 85% 10%, var(--g-deep, transparent), transparent 70%)",
        }}
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </main>
  );
}

function Screen({
  client,
  session,
  initial,
  pollMs,
}: {
  client: RoomClient;
  session: StoredSession;
  initial: RoomSnapshot | null;
  pollMs?: number | undefined;
}) {
  const [gone, setGone] = useState(false);
  const { snap, progress, status } = useRoom(client, session.token, initial, {
    pollMs,
    onGone: () => {
      sessionStore.clear("display");
      setGone(true);
    },
  });
  const pub = readPublic(snap);
  const photos = useRoomPhotos(client, session.token, pub?.view?.cards ?? []);
  if (gone)
    return (
      <Stage>
        <h1 className="font-display text-[clamp(3rem,8vw,7rem)]">
          Der Raum ist geschlossen.
        </h1>
      </Stage>
    );
  const couchView = readCouchScreen(snap?.publicState);
  if (couchView) return <CouchTVStage view={couchView} />;
  if (!snap || !pub)
    return (
      <Stage>
        <ConnDot status={status} code={session.code} />
      </Stage>
    );
  const game = pub.gameId ? gangGame(pub.gameId) : undefined;
  const top = (
    <div className="flex items-center justify-between gap-6">
      <span className="font-mono text-sm tracking-[0.3em] text-signal">
        NOCTURNE · GANG MODE
      </span>
      <ConnDot status={status} code={snap.code} />
    </div>
  );

  if (pub.kind === "lobby")
    return (
      <Stage>
        {top}
        <LobbyStage snap={snap} pub={pub} />
      </Stage>
    );
  if (pub.kind === "end")
    return (
      <Stage>
        {top}
        <h1 className="font-display mt-auto text-[clamp(4rem,11vw,10rem)] leading-[0.85]">
          Danke, Raum.
        </h1>
        <p className="mb-auto mt-6 text-2xl text-muted-foreground">
          Die Nacht ist vorbei.
        </p>
        {pub.missionReport && <MissionFinale report={pub.missionReport} />}
      </Stage>
    );
  return (
    <Stage hue={game?.hue}>
      {top}
      {game && (
        <MotifArt
          motif={game.motif}
          className="pointer-events-none absolute -right-[4vw] top-[12vh] w-[38vw] max-w-xl opacity-20"
        />
      )}
      <div className="mt-[4vh] flex items-baseline gap-6">
        <span className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--g)]">
          {game?.title}
        </span>
        {pub.view && pub.kind === "play" && (
          <span className="font-mono text-sm tracking-[0.25em] text-muted-foreground">
            RUNDE {pub.view.roundNumber}/{pub.view.targetRounds} ·{" "}
            {(STAGE[pub.view.stage] ?? "").toUpperCase()}
          </span>
        )}
      </div>
      {pub.view && <PhotoGallery cards={pub.view.cards} photos={photos} />}
      {pub.kind === "finale" ? (
        <FinaleStage pub={pub} />
      ) : pub.view ? (
        <PlayStage pub={pub} view={pub.view} progress={progress} snap={snap} />
      ) : null}
    </Stage>
  );
}

function LobbyStage({ snap, pub }: { snap: RoomSnapshot; pub: OnlinePublic }) {
  const players = snap.players.filter((p) => p.active && p.canInput);
  const [lo, hi] = queueRange(pub.queue);
  const url = joinUrl(
    typeof window === "undefined" ? "" : window.location.origin,
    snap.code,
  );
  const shown = players.slice(0, 40);
  return (
    <div className="mt-[6vh] grid flex-1 items-center gap-[5vw] lg:grid-cols-[1fr_auto]">
      <div>
        <p className="font-mono text-base tracking-[0.3em] text-muted-foreground">
          HANDY RAUS · QR SCANNEN · ODER CODE EINGEBEN
        </p>
        <p
          className="font-display mt-4 text-[clamp(6rem,18vw,16rem)] leading-[0.8] tracking-[0.06em] text-signal tabular-nums"
          data-testid="screen-code"
        >
          {snap.code}
        </p>
        <p className="mt-6 text-2xl text-foreground/85">
          {pub.queue.map((id) => gangGame(id)?.title).join("  →  ")}
        </p>
        <p
          className="mt-8 font-mono text-lg tracking-[0.2em]"
          aria-live="polite"
        >
          <span className="font-display text-6xl text-signal tabular-nums">
            {players.length}
          </span>{" "}
          <span className="text-muted-foreground">
            IM RAUM · {lo}–{hi}
          </span>
        </p>
        <ul className="mt-4 flex max-w-5xl flex-wrap gap-2">
          {shown.map((p) => (
            <li
              key={p.id}
              className="border border-line px-4 py-2 text-xl motion-safe:animate-rise"
            >
              {p.name}
            </li>
          ))}
          {players.length > shown.length && (
            <li className="px-3 py-2 font-mono text-lg text-muted-foreground">
              +{players.length - shown.length}
            </li>
          )}
        </ul>
      </div>
      <QrCode
        value={url}
        label={`QR-Code zum Beitreten in Raum ${snap.code}`}
        className="w-[min(30vw,22rem)]"
      />
    </div>
  );
}

function PlayStage({
  pub,
  view,
  progress,
  snap,
}: {
  pub: OnlinePublic;
  view: OnlineView;
  progress: StageProgress | null;
  snap: RoomSnapshot;
}) {
  const fresh =
    progress &&
    progress.roundKey === snap.roundKey &&
    progress.stage === snap.stage
      ? progress
      : null;
  const req = fresh?.required ?? pub.requiredPlayerIds.length;
  const done = fresh?.submitted ?? 0;
  const active = pub.roster.find((p) => p.id === view.activePlayerId)?.name;
  if (view.stage === "score") {
    const res = view.resolution;
    const names = (ids: string[]) =>
      ids.map((id) => pub.roster.find((p) => p.id === id)?.name ?? "?");
    return (
      <div className="mt-[4vh] grid flex-1 gap-[4vw] lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="font-display text-[clamp(3.5rem,8vw,8rem)] leading-[0.86] motion-safe:animate-rise">
            {res?.headline ?? "Runde vorbei."}
          </h1>
          {res?.detail && (
            <p className="mt-4 text-2xl text-muted-foreground">{res.detail}</p>
          )}
          {res?.sourceUrl && (
            <a
              href={res.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm text-[var(--g)] underline"
            >
              Faktenquelle öffnen
            </a>
          )}
          {view.majority && (
            <MajorityResult r={view.majority} names={names} big />
          )}
          {!view.majority && res?.revealItems && (
            <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {res.revealItems
                .filter((r) => r.value)
                .slice(0, 12)
                .map((r, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-[var(--g)] pl-4 motion-safe:animate-rise"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span className="block font-mono text-sm text-muted-foreground">
                      {r.label}
                    </span>
                    <span className="font-display text-3xl">{r.value}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
        {!["the-line", "after-dark"].includes(pub.gameId ?? "") && (
          <Board pub={pub} />
        )}
      </div>
    );
  }
  if (view.stage === "reveal") {
    return (
      <h1 className="font-display my-auto text-[clamp(4rem,12vw,11rem)] leading-[0.85] motion-safe:animate-rise">
        Alle drin.
        <br />
        <em className="text-[var(--g)]">Gleich fällt der Vorhang.</em>
      </h1>
    );
  }
  return (
    <div className="mt-[4vh] flex flex-1 flex-col">
      {view.category && (
        <p className="font-mono text-lg tracking-[0.25em] text-[var(--g)]">
          {view.category.toUpperCase()}
        </p>
      )}
      <h1
        className="font-display mt-2 max-w-[22ch] text-[clamp(3.2rem,7.5vw,8rem)] leading-[0.9] tracking-tight"
        data-testid="screen-prompt"
      >
        {view.hidden || view.input === "ack"
          ? view.stage === "vote"
            ? "Wer ist es?"
            : "Geheime Runde. Schaut auf eure Handys."
          : view.prompt}
      </h1>
      {view.subline && !view.hidden && (
        <p className="mt-4 text-2xl text-muted-foreground">{view.subline}</p>
      )}
      {active &&
        ["hot-seat", "draw-this", "bluff"].includes(pub.gameId ?? "") && (
          <p className="mt-4 font-mono text-lg tracking-[0.2em] text-[var(--g)]">
            IM FOKUS: {active.toUpperCase()}
          </p>
        )}
      {view.cards.length > 0 &&
        view.cards.length <= 12 &&
        view.stage !== "predict" &&
        view.stage !== "answer" &&
        view.input === "options" && (
          <ol className="mt-8 grid max-w-6xl gap-3 sm:grid-cols-2">
            {view.cards.map((c, i) => (
              <li
                key={c.key}
                className="flex items-baseline gap-4 border-t border-line pt-3"
              >
                <span className="font-mono text-sm text-[var(--g)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-3xl leading-tight">
                  {c.label}
                </span>
              </li>
            ))}
          </ol>
        )}
      {view.cards.length > 0 &&
        (view.stage === "predict" || view.stage === "answer") &&
        view.input === "options" && (
          <ol className="mt-8 flex max-w-6xl flex-wrap gap-x-10 gap-y-3">
            {view.cards.map((c) => (
              <li
                key={c.key}
                className="font-display text-4xl text-foreground/85"
              >
                {c.label}
              </li>
            ))}
          </ol>
        )}
      <div
        className="mt-auto pt-[4vh]"
        role="status"
        aria-live="polite"
        aria-label={`${done} von ${req} abgegeben`}
      >
        <div className="flex items-baseline justify-between font-mono text-lg tracking-[0.2em] text-muted-foreground">
          <span>
            {view.input === "teams" ? "ERGEBNIS WIRD EINGETRAGEN" : "ABGEGEBEN"}
          </span>
          <span className="font-display text-6xl text-foreground tabular-nums">
            {done}
            <span className="text-muted-foreground">/{req}</span>
          </span>
        </div>
        <div className="mt-3 h-2 bg-line">
          <span
            className="block h-full bg-[var(--g)] transition-[width] duration-500"
            style={{ width: `${req ? (done / req) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Board({ pub }: { pub: OnlinePublic }) {
  const ranking = [...pub.roster].sort(
    (a, b) => (pub.scores[b.id] ?? 0) - (pub.scores[a.id] ?? 0),
  );
  const top = ranking.slice(0, 8);
  return (
    <ol className="self-start border-t border-line" aria-label="Zwischenstand">
      {top.map((p, i) => (
        <li
          key={p.id}
          className="flex min-h-14 items-baseline gap-4 border-b border-line"
        >
          <span className="w-8 font-mono text-sm text-muted-foreground">
            {i + 1}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-display text-3xl",
              i === 0 && "text-[var(--g)]",
            )}
          >
            {p.name}
          </span>
          <span className="font-display text-3xl tabular-nums">
            {pub.scores[p.id] ?? 0}
          </span>
        </li>
      ))}
      {ranking.length > top.length && (
        <li className="py-3 font-mono text-sm text-muted-foreground">
          + {ranking.length - top.length} weitere
        </li>
      )}
    </ol>
  );
}

function FinaleStage({ pub }: { pub: OnlinePublic }) {
  const names = pub.winnerIds
    .map((id) => pub.roster.find((p) => p.id === id)?.name)
    .filter(Boolean);
  const next = pub.queue[pub.qi + 1]
    ? gangGame(pub.queue[pub.qi + 1]!)
    : undefined;
  return (
    <div className="mt-[4vh] grid flex-1 gap-[4vw] lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="font-mono text-lg tracking-[0.25em] text-muted-foreground">
          FINALE
        </p>
        <h1 className="font-display mt-3 text-[clamp(4rem,11vw,10rem)] leading-[0.85] text-[var(--g)] motion-safe:animate-rise">
          {names.join(" & ") || "Alle zusammen."}
        </h1>
        {pub.titles && <TitleGallery items={pub.titles} />}
        {pub.tracks.length > 0 && (
          <ol className="mt-8 columns-2 gap-8">
            {pub.tracks.map((t, i) => (
              <li key={i} className="mb-2 font-display text-2xl">
                <span className="mr-3 font-mono text-sm text-[var(--g)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t}
              </li>
            ))}
          </ol>
        )}
        {next && (
          <p className="mt-10 font-mono text-lg tracking-[0.2em] text-muted-foreground">
            ALS NÄCHSTES · <span className="text-foreground">{next.title}</span>
          </p>
        )}
      </div>
      <Board pub={pub} />
    </div>
  );
}
