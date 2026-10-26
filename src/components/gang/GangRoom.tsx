import { OptionalMechanics } from "./OptionalMechanics";
import type { GangOptionalMechanics } from "@/lib/gang/core/runtime";
import { paceQueue } from "@/lib/gang/core/director";
import { TitleGallery } from "./TitleGallery";
import { TeamResults } from "./TeamResults";
import { PhotoGallery, useRoomPhotos } from "./PhotoGallery";
import { PhotoCapture } from "./PhotoCapture";
import { applyMissionEvent } from "@/lib/gang/core/missions";
import { MissionDrawer, MissionFinale } from "./MissionDrawer";
/* EVERYONE IN / BIG SCREEN — phone controller + facilitator orchestrator over the real gang_* RPCs.
   The facilitator is a normal player too; it alone holds the canonical runtime (saved via gang_save_runtime). */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Monitor, Share2, X } from "lucide-react";
import { gangGame, type GangGame } from "@/lib/gang/catalog";
import type { GangGameId } from "@/lib/gang/core/playbooks";
import {
  ANSWER_VOTE_GAMES,
  activeInputIds,
  advanceShow,
  applyCollected,
  applyAfterDarkWithdrawals,
  buildPublic,
  endNight,
  isFacState,
  lobbyFac,
  privatePayloadsFor,
  queueFits,
  queueRange,
  readPublic,
  roundKeyOf,
  stageKeyOf,
  startGame,
  type FacState,
  type OnlinePublic,
  type OnlineView,
} from "@/lib/gang/online";
import {
  joinUrl,
  roomErrorText,
  screenUrl,
  sessionStore,
  type RoomClient,
  type RoomSnapshot,
  type StoredSession,
} from "@/lib/gang/room-client";
import { useRoom, type ConnStatus } from "@/lib/gang/use-room";
import { btn } from "@/components/vault/Btn";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { hueVars } from "./MotifArt";
import { QrCode } from "./QrCode";
import { MajorityDual, MajorityResult, Secret, Timer } from "./GangPlayer";

const primary = cn(
  btn({ size: "lg" }),
  "w-full bg-signal text-signal-foreground hover:bg-signal/90",
);
const STAGE: Record<string, string> = {
  private: "Geheim",
  predict: "Tipp",
  answer: "Antwort",
  vote: "Abstimmung",
  perform: "Aktion",
  react: "Reaktion",
  reveal: "Reveal",
  score: "Punkte",
};
const origin = () =>
  typeof window === "undefined" ? "" : window.location.origin;

export function ConnDot({
  status,
  code,
}: {
  status: ConnStatus;
  code?: string | undefined;
}) {
  return (
    <span
      className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "live"
            ? "bg-signal"
            : "bg-primary motion-safe:animate-pulse",
        )}
      />
      {status === "live" ? (code ? `RAUM ${code}` : "LIVE") : "VERBINDE NEU …"}
    </span>
  );
}

/* ---------------- Host setup (EVERYONE IN / BIG SCREEN) ---------------- */
export function HostSetup({
  client,
  queue,
  rounds,
  budgetMinutes,
  entry,
  bigScreen,
  onReady,
}: {
  client: RoomClient;
  queue: GangGameId[];
  rounds?: Record<string, number> | undefined;
  budgetMinutes?: 15 | 30 | 60 | null | undefined;
  entry: "director" | "catalog" | "mix";
  bigScreen: boolean;
  onReady: (s: StoredSession, snap: RoomSnapshot) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const range = queueRange(queue);
  const open = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const { session, snapshot } = await client.create(
        name,
        entry,
        Math.min(99, range[1] + 2),
      );
      const next = await client.setState(
        session.token,
        snapshot,
        (s) => buildPublic(lobbyFac(queue, rounds, budgetMinutes), s).write,
      );
      haptic(12);
      onReady(session, next);
    } catch (e) {
      setErr(roomErrorText(e));
      setBusy(false);
    }
  };
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        void open();
      }}
    >
      <p className="mt-6 text-sm text-muted-foreground">
        {bigScreen
          ? "Ein TV oder Laptop wird die Bühne, eure Handys die Controller."
          : "Jede:r spielt am eigenen Handy. Du eröffnest den Raum."}
      </p>
      <label
        htmlFor="host-name"
        className="mt-6 font-mono text-xs tracking-[0.2em] text-muted-foreground"
      >
        DEIN NAME
      </label>
      <input
        id="host-name"
        autoComplete="nickname"
        maxLength={32}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Wie heißt du heute?"
        className="mt-2 min-h-14 w-full border-0 border-b-2 border-line bg-transparent px-1 font-display text-3xl text-foreground placeholder:text-muted-foreground/50 focus:border-signal focus:outline-none"
        style={{ fontSize: "max(16px, 1.75rem)" }}
      />
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        {range[0]}–{range[1]} SPIELER · DIE ANDEREN KOMMEN PER QR-CODE
      </p>
      {err && (
        <p role="alert" className="mt-4 text-sm text-primary">
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={!name.trim() || busy}
        className={cn(primary, "mt-auto")}
      >
        {busy ? "Raum wird geöffnet …" : "Raum öffnen"}
      </button>
    </form>
  );
}

/* ---------------- Join sheet (/gang?join=CODE) ---------------- */
export function JoinSheet({
  client,
  code,
  onJoined,
  onCancel,
}: {
  client: RoomClient;
  code: string;
  onJoined: (s: StoredSession, snap: RoomSnapshot) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const join = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await client.join(code, name);
      haptic(12);
      onJoined(r.session, r.snapshot);
    } catch (e) {
      setErr(roomErrorText(e));
      setBusy(false);
    }
  };
  return (
    <main className="flex min-h-svh flex-col overflow-x-hidden bg-room text-foreground safe-x safe-top safe-bottom">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-4">
        <div className="flex min-h-11 items-center justify-between">
          <span className="font-mono text-xs tracking-[0.25em] text-signal">
            NOCTURNE · GANG MODE
          </span>
          <button
            type="button"
            aria-label="Abbrechen"
            onClick={onCancel}
            className="tap flex size-11 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void join();
          }}
        >
          <p className="mt-10 font-mono text-xs tracking-[0.2em] text-muted-foreground">
            DU WURDEST EINGELADEN
          </p>
          <h1 className="font-display mt-2 text-[clamp(3rem,16vw,5rem)] leading-[0.85]">
            Raum <span className="text-signal tabular-nums">{code}</span>
          </h1>
          <label
            htmlFor="join-name"
            className="mt-10 font-mono text-xs tracking-[0.2em] text-muted-foreground"
          >
            DEIN NAME
          </label>
          <input
            id="join-name"
            autoFocus
            autoComplete="nickname"
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="So sehen dich die anderen"
            className="mt-2 min-h-14 w-full border-0 border-b-2 border-line bg-transparent px-1 font-display text-3xl text-foreground placeholder:text-muted-foreground/50 focus:border-signal focus:outline-none"
            style={{ fontSize: "max(16px, 1.75rem)" }}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Kein Account. Nur dein Name ist für den Raum sichtbar.
          </p>
          {err && (
            <p role="alert" className="mt-4 text-sm text-primary">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={!name.trim() || busy}
            className={cn(primary, "mt-auto")}
          >
            {busy ? "Trete bei …" : "Beitreten"}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ---------------- Room (lobby + controller + facilitator) ---------------- */
export function GangRoom({
  client,
  session,
  initial,
  bigScreen = false,
  pollMs,
  onExit,
}: {
  client: RoomClient;
  session: StoredSession;
  initial: RoomSnapshot | null;
  bigScreen?: boolean;
  pollMs?: number | undefined;
  onExit: () => void;
}) {
  const token = session.token;
  const [gone, setGone] = useState(false);
  const { snap, setSnap, progress, status, refresh } = useRoom(
    client,
    token,
    initial,
    {
      pollMs,
      onGone: () => {
        sessionStore.clear(session.role);
        setGone(true);
      },
    },
  );
  const facRef = useRef<FacState | null>(null);
  const busy = useRef(false);
  const missionVersion = useRef(-1);
  const sending = useRef(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [priv, setPriv] = useState<{
    key: string;
    version: number;
    data: Record<string, unknown> | null;
  } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [withdrawnKey, setWithdrawnKey] = useState<string | null>(null);

  const pub = readPublic(snap);
  useEffect(() => {
    if (!pub?.afterDarkKey || pub.kind !== "play" || session.role === "display")
      return;
    let stopped = false;
    const key = pub.afterDarkKey;
    void client
      .afterDarkControl(token, key)
      .then((r) => {
        if (!stopped && r.withdrawn) setWithdrawnKey(key);
      })
      .catch(() => {});
    return () => {
      stopped = true;
    };
  }, [pub?.afterDarkKey, pub?.kind, client, token, session.role]);
  const photos = useRoomPhotos(client, token, pub?.view?.cards ?? []);
  const stageKey = snap ? `${snap.roundKey}#${snap.stage}` : "";

  /** One version-safe transaction for canonical state, public phase and owner-only cards. */
  const publish = useCallback(
    async (fac: FacState, base: RoomSnapshot, requiredOverride?: string[]) => {
      const extra = requiredOverride ? { requiredOverride } : {};
      let published = fac;
      const next = await client.publish(token, base, (s) => {
        const built = buildPublic(fac, s, extra);
        published = built.fac;
        return {
          write: built.write,
          runtime: built.fac as unknown as Record<string, unknown>,
          payloads: privatePayloadsFor(built.fac, activeInputIds(s)),
        };
      });
      facRef.current = published;
      setSnap(next);
      return next;
    },
    [client, token, setSnap],
  );

  const inFlight = useRef<Promise<void> | null>(null);
  const userQueued = useRef(false);
  const run = useCallback(
    async (fn: () => Promise<unknown>, background = false) => {
      if (background && (busy.current || userQueued.current)) return;
      if (!background) {
        if (userQueued.current) return;
        userQueued.current = true;
        if (inFlight.current) await inFlight.current;
      }
      busy.current = true;
      const task = (async () => {
        try {
          await fn();
          setErr(null);
        } catch (e) {
          setErr(roomErrorText(e));
        } finally {
          busy.current = false;
        }
      })();
      inFlight.current = task;
      await task;
      if (inFlight.current === task) inFlight.current = null;
      if (!background) userQueued.current = false;
    },
    [],
  );

  // Facilitator loop: failover load, drop-outs, auto-collect + advance.
  useEffect(() => {
    if (!snap?.isFacilitator || !pub || pub.kind === "lobby" || busy.current)
      return;
    void run(async () => {
      let fac = facRef.current;
      if (!fac && pub.kind !== "lobby") {
        const loaded = await client.loadRuntime(token);
        if (!isFacState(loaded)) return;
        fac = facRef.current = loaded;
      }
      if (!fac || fac.kind !== "play" || !fac.rt) return;
      if (fac.rt.gameId === "after-dark") {
        const controls = await client.afterDarkControl(token, fac.rt.id);
        const next = applyAfterDarkWithdrawals(fac, controls.playerIds);
        if (next !== fac) {
          await publish(next, snap);
          return;
        }
      }
      if (fac.missions && missionVersion.current !== snap.version) {
        const events = await client.missionEvents(token, fac.missions.id);
        missionVersion.current = snap.version;
        let missions = fac.missions;
        for (const e of events)
          missions = applyMissionEvent(missions, {
            id: e.id,
            playerId: e.playerId,
            kind: e.kind,
            at: Date.parse(e.at),
            ...e.payload,
          });
        if (missions !== fac.missions) {
          fac = { ...fac, missions };
          await publish(fac, snap);
          return;
        }
      }
      if (snap.roundKey !== roundKeyOf(fac) || snap.stage !== stageKeyOf(fac)) {
        await publish(fac, snap);
        return;
      }
      const view = pub.view;
      if (!view || view.input === "none") return;
      if (view.repeatable) {
        const batch = await client.attempts(token, snap.roundKey!, snap.stage!);
        const next = applyCollected(fac, batch.actions, {
          partial: true,
          expired: batch.expired,
        });
        if (next !== fac) await publish(next, snap);
        return;
      }
      const active = activeInputIds(snap);
      if (pub.requiredPlayerIds.some((id) => !active.has(id))) {
        await publish(
          fac,
          snap,
          pub.requiredPlayerIds.filter((id) => active.has(id)),
        );
        return;
      }
      const complete =
        progress &&
        progress.roundKey === snap.roundKey &&
        progress.stage === snap.stage &&
        progress.complete;
      if (pub.requiredPlayerIds.length === 0 || complete) {
        const actions = await client.collect(
          token,
          snap.roundKey!,
          snap.stage!,
        );
        await publish(applyCollected(fac, actions), snap);
      }
    }, true);
  }, [snap, progress, pub, client, token, publish, run]);

  // Owner-only private payload for this stage (refetched per stage, retried while not yet synced).
  useEffect(() => {
    if (!snap?.roundKey || !["play", "finale"].includes(pub?.kind ?? ""))
      return;
    if (priv?.key === stageKey && priv.version === snap.version && priv.data)
      return;
    let off = false;
    client
      .getPrivate(token, snap.roundKey)
      .then((data) => {
        if (!off)
          setPriv({ key: stageKey, version: snap.version, data: data ?? null });
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [stageKey, snap, pub?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  if (gone) {
    return (
      <Frame status="reconnecting" onClose={onExit}>
        <h2 className="font-display mt-10 text-5xl leading-[0.9]">
          Dieser Raum ist vorbei.
        </h2>
        <button
          type="button"
          onClick={onExit}
          className={cn(primary, "mt-auto")}
        >
          Zurück zu GANG MODE
        </button>
      </Frame>
    );
  }
  if (!snap || !pub)
    return (
      <Frame status={status} onClose={onExit}>
        <p className="mt-10 text-muted-foreground">Raum wird geladen …</p>
      </Frame>
    );

  const me = snap.playerId;
  const game = pub.gameId ? gangGame(pub.gameId) : undefined;
  const players = snap.players.filter((p) => p.canInput && p.active);
  const fac = snap.isFacilitator;
  const view = pub.view
    ? { ...pub.view, deadlineAt: snap.deadlineAt, serverNow: snap.serverNow }
    : null;
  const submitted =
    !view?.repeatable &&
    (sent === stageKey ||
      (progress?.youSubmitted &&
        progress.roundKey === snap.roundKey &&
        progress.stage === snap.stage));

  const send = async (type: string, payload: Record<string, unknown>) => {
    if (sending.current) return;
    sending.current = true;
    haptic(8);
    try {
      if (view?.repeatable) {
        if (typeof payload["value"] === "string")
          await client.attempt(
            token,
            snap.roundKey!,
            snap.stage!,
            payload["value"],
          );
        setErr(null);
        return;
      }
      const prepared = { ...payload };
      if (typeof prepared["photoData"] === "string") {
        const uploaded = await client.putPhoto(
          token,
          snap.roundKey!,
          prepared["photoData"],
        );
        prepared["photoId"] = uploaded.photoId;
        delete prepared["photoData"];
      }
      await client.submit(token, snap.roundKey!, snap.stage!, type, prepared);
      setSent(stageKey);
      setErr(null);
    } catch (e) {
      setErr(roomErrorText(e));
    } finally {
      sending.current = false;
      await refresh();
    }
  };
  const start = (consent: boolean, optionalMechanics: GangOptionalMechanics) =>
    run(async () => {
      const base = lobbyFac(pub.queue, pub.rounds, pub.budgetMinutes);
      const roster = players.map((p) => ({ id: p.id, name: p.name }));
      const f = startGame(
        { ...base, adultConsent: consent, optionalMechanics },
        roster,
        Math.floor(Math.random() * 2 ** 31),
        `${pub.queue[0]}-${Date.now()}`,
      );
      haptic(14);
      await publish(f, snap);
    });
  const facAct = (fn: (f: FacState) => FacState) =>
    run(async () => {
      let f = facRef.current;
      if (!f) return;
      if (f.missions) {
        const events = await client.missionEvents(token, f.missions.id);
        let missions = f.missions;
        for (const e of events)
          missions = applyMissionEvent(missions, {
            id: e.id,
            playerId: e.playerId,
            kind: e.kind,
            at: Date.parse(e.at),
            ...e.payload,
          });
        f = { ...f, missions };
      }
      haptic(10);
      await publish(fn(f), snap);
    });
  const nextGame = () =>
    facAct((f) =>
      startGame(
        { ...f, qi: f.qi + 1 },
        players.map((p) => ({ id: p.id, name: p.name })),
        Math.floor(Math.random() * 2 ** 31),
        `${f.queue[f.qi + 1] ?? "end"}-${Date.now()}`,
      ),
    );
  const forceOn = () =>
    run(async () => {
      const f = facRef.current;
      if (f) await publish(f, snap, []);
    });
  const leave = () => {
    void client.leave(token).catch(() => {});
    onExit();
  };

  let body: React.ReactNode;
  if (pub.kind === "lobby") {
    body = (
      <Lobby snap={snap} pub={pub} bigScreen={bigScreen} onStart={start} />
    );
  } else if (pub.kind === "end") {
    body = (
      <div className="flex flex-1 flex-col justify-center motion-safe:animate-rise">
        <p className="font-mono text-xs tracking-[0.2em] text-signal">
          NACHT BEENDET
        </p>
        <h2 className="font-display mt-3 text-[clamp(3rem,15vw,5rem)] leading-[0.85]">
          Danke, Raum.
        </h2>
        {pub.missionReport && <MissionFinale report={pub.missionReport} />}
        <button type="button" onClick={leave} className={cn(primary, "mt-10")}>
          Raum verlassen
        </button>
      </div>
    );
  } else if (pub.kind === "finale" && game) {
    const next = pub.queue[pub.qi + 1]
      ? gangGame(pub.queue[pub.qi + 1]!)
      : undefined;
    body = (
      <div
        className="flex flex-1 flex-col motion-safe:animate-rise"
        data-testid="online-finale"
      >
        <p className="mt-8 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          FINALE · {game.title}
        </p>
        <h2 className="font-display mt-3 text-[clamp(2.8rem,13vw,4.5rem)] leading-[0.88] text-[var(--g)]">
          {pub.winnerIds
            .map((id) => pub.roster.find((p) => p.id === id)?.name)
            .filter(Boolean)
            .join(" & ") || "Alle zusammen."}
        </h2>
        {pub.titles && <TitleGallery items={pub.titles} />}
        <Leaders pub={pub} me={me} />
        {pub.tracks.length > 0 && (
          <ol className="mt-6 border-t border-line">
            {pub.tracks.map((t, i) => (
              <li
                key={i}
                className="flex min-h-11 items-baseline gap-3 border-b border-line"
              >
                <span className="w-6 font-mono text-xs text-[var(--g)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="truncate font-display text-xl">{t}</span>
              </li>
            ))}
          </ol>
        )}
        {fac ? (
          <div className="mt-auto grid gap-2 pt-8">
            {next ? (
              <button type="button" onClick={nextGame} className={primary}>
                Weiter zu {next.title}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => facAct(endNight)}
              className={
                next
                  ? cn(btn({ variant: "ghost", size: "lg" }), "w-full")
                  : primary
              }
            >
              Nacht beenden
            </button>
          </div>
        ) : (
          <p className="mt-auto pt-8 text-center text-sm text-muted-foreground">
            {next ? `Als Nächstes: ${next.title}` : "Gleich ist Schluss."}
          </p>
        )}
      </div>
    );
  } else if (view && game) {
    const inRoster = pub.roster.some((p) => p.id === me);
    const mustAct =
      (pub.requiredPlayerIds.includes(me) && !submitted) ||
      (pub.gameId === "draw-this" &&
        view.repeatable &&
        view.activePlayerId === me);
    body =
      !inRoster || (pub.afterDarkKey && pub.afterDarkKey === withdrawnKey) ? (
        <Waiting
          title="Du schaust diese Runde zu."
          sub="Beim nächsten Spiel bist du automatisch dabei."
        />
      ) : view.input === "none" ? (
        <ShowStage
          game={game}
          pub={pub}
          view={view}
          me={me}
          fac={fac}
          onAdvance={() => facAct(advanceShow)}
        />
      ) : mustAct ? (
        <ControllerInput
          key={stageKey}
          photos={photos}
          game={game}
          pub={pub}
          view={view}
          me={me}
          priv={priv?.key === stageKey ? priv.data : null}
          roundKey={snap.roundKey ?? ""}
          onSend={send}
        />
      ) : (
        <>
          <Waiting
            title={
              submitted
                ? "Versiegelt · warte auf die anderen"
                : view.input === "teams"
                  ? "Die Runde trägt das Ergebnis ein."
                  : "Diese Phase spielen die anderen."
            }
            sub={
              progress
                ? `${progress.submitted}/${progress.required} abgegeben`
                : undefined
            }
          />
          {fac && (
            <button
              type="button"
              onClick={forceOn}
              className="tap mx-auto mt-4 flex min-h-11 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Nicht mehr warten · weiter
            </button>
          )}
        </>
      );
  } else body = <Waiting title="Gleich geht's los." />;

  return (
    <Frame
      status={status}
      code={snap.code}
      game={game}
      onClose={() => setConfirmLeave(true)}
      header={
        view && game && pub.kind === "play" ? (
          <StageBar view={view} />
        ) : undefined
      }
    >
      {body}
      {pub.gameId === "after-dark" &&
        pub.kind === "play" &&
        pub.afterDarkKey &&
        pub.afterDarkKey !== withdrawnKey &&
        pub.roster.some((p) => p.id === me) && (
          <button
            type="button"
            className={btn({ variant: "ghost", size: "lg" })}
            onClick={() =>
              void run(async () => {
                await client.afterDarkControl(token, pub.afterDarkKey!, true);
                setWithdrawnKey(pub.afterDarkKey!);
                await refresh();
              })
            }
          >
            Für den Rest von AFTER DARK nur zuschauen
          </button>
        )}
      {pub.gameId === "after-dark" &&
        pub.afterDarkKey !== withdrawnKey &&
        view &&
        !["private", "perform", "reveal", "score"].includes(view.stage) &&
        pub.requiredPlayerIds.includes(me) &&
        !submitted && (
          <button
            type="button"
            className={btn({ variant: "ghost", size: "lg" })}
            onClick={() => send("skip", { success: false })}
          >
            Diese Runde auslassen
          </button>
        )}
      {view && ["reveal", "score"].includes(view.stage) && (
        <PhotoGallery cards={view.cards} photos={photos} />
      )}
      {pub.missionKey &&
        ["play", "finale"].includes(pub.kind) &&
        typeof priv?.data?.["mission"] === "string" && (
          <MissionDrawer
            players={pub.roster.filter((p) =>
              pub.missionPlayerIds?.includes(p.id),
            )}
            me={me}
            own={{
              id: String(priv.data["missionId"] ?? ""),
              text: String(priv.data["mission"]),
            }}
            claimed={priv.data["missionClaimed"] === true}
            accused={priv.data["missionAccused"] === true}
            disabled={!!view?.timed && pub.requiredPlayerIds.includes(me)}
            onEvent={async (_id, kind, payload) => {
              await client.missionEvent(token, pub.missionKey!, kind, payload);
              await refresh();
            }}
          />
        )}
      {err && (
        <p role="alert" className="mt-3 text-center text-sm text-primary">
          {err}
        </p>
      )}
      {confirmLeave && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="leave-h"
          className="fixed inset-0 z-[60] flex items-end bg-room/90 p-4 backdrop-blur safe-bottom sm:items-center sm:justify-center"
        >
          <div className="w-full max-w-md border-t-2 border-signal bg-room p-6">
            <h2 id="leave-h" className="font-display text-4xl leading-none">
              Raum verlassen?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Die anderen spielen ohne dich weiter.
            </p>
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={leave} className={primary}>
                Verlassen
              </button>
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className={btn({ variant: "ghost", size: "lg" })}
              >
                Bleiben
              </button>
            </div>
          </div>
        </div>
      )}
    </Frame>
  );
}

function Frame({
  status,
  code,
  game,
  onClose,
  header,
  children,
}: {
  status: ConnStatus;
  code?: string | undefined;
  game?: GangGame | undefined;
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={game ? `${game.title} – Controller` : "GANG MODE Raum"}
      style={game ? hueVars(game.hue) : undefined}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden bg-room text-foreground safe-x safe-top safe-bottom"
      data-testid="controller"
    >
      {game && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(90% 60% at 100% 0%, var(--g-deep), transparent 65%)",
          }}
        />
      )}
      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col py-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <ConnDot status={status} code={code} />
          <span className="min-w-0 truncate font-mono text-xs tracking-[0.2em] text-[var(--g,var(--signal))]">
            {game?.title}
          </span>
          <button
            type="button"
            aria-label="Raum verlassen"
            onClick={onClose}
            className="tap flex size-11 shrink-0 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
        {header}
        <div className="flex flex-1 flex-col pb-4">{children}</div>
      </div>
    </div>
  );
}

function StageBar({ view }: { view: OnlineView }) {
  return (
    <div className="mt-1">
      <p className="font-mono text-xs tracking-[0.15em] text-muted-foreground">
        RUNDE {view.roundNumber}/{view.targetRounds} ·{" "}
        <span className="text-[var(--g)]">
          {(STAGE[view.stage] ?? view.stage).toUpperCase()}
        </span>
      </p>
      <div
        className="mt-2 flex gap-1"
        aria-label={`Phase ${view.stageIndex + 1} von ${view.totalStages}`}
      >
        {Array.from({ length: view.totalStages }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-0.5 flex-1",
              i <= view.stageIndex ? "bg-[var(--g)]" : "bg-line",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Waiting({ title, sub }: { title: string; sub?: string | undefined }) {
  return (
    <div
      className="flex flex-1 flex-col items-start justify-center motion-safe:animate-rise"
      data-testid="waiting"
    >
      <span aria-hidden className="mb-6 flex h-10 items-end gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1.5 bg-[var(--g,var(--signal))] motion-safe:animate-gang-pulse"
            style={{
              height: `${40 + i * 12}%`,
              animationDelay: `${i * 140}ms`,
            }}
          />
        ))}
      </span>
      <h2 className="font-display text-[clamp(2.4rem,11vw,3.6rem)] leading-[0.92]">
        {title}
      </h2>
      {sub && (
        <p className="mt-3 font-mono text-xs tracking-[0.2em] text-muted-foreground tabular-nums">
          {sub}
        </p>
      )}
    </div>
  );
}

function Lobby({
  snap,
  pub,
  bigScreen,
  onStart,
}: {
  snap: RoomSnapshot;
  pub: OnlinePublic;
  bigScreen: boolean;
  onStart: (consent: boolean, optionalMechanics: GangOptionalMechanics) => void;
}) {
  const players = snap.players.filter((p) => p.active && p.canInput);
  const screens = snap.players.filter((p) => p.active && !p.canInput).length;
  const [lo, hi] = queueRange(pub.queue);
  const pacing =
    pub.budgetMinutes !== undefined
      ? paceQueue(pub.queue, Math.max(2, players.length), pub.budgetMinutes)
      : null;
  const ok = queueFits(pub.queue, players.length) && (pacing?.fits ?? true);
  const adult = pub.queue.includes("after-dark");
  const [consent, setConsent] = useState(false);
  const [optionalMechanics, setOptionalMechanics] =
    useState<GangOptionalMechanics>({});
  const [copied, setCopied] = useState<string | null>(null);
  const jUrl = joinUrl(origin(), snap.code);
  const sUrl = screenUrl(origin(), snap.code);
  const copy = async (what: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(what);
      haptic(6);
    } catch {
      setCopied(null);
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NOCTURNE GANG MODE",
          text: `Komm in Raum ${snap.code}`,
          url: jUrl,
        });
      } catch {
        /* dismissed */
      }
    } else void copy("join", jUrl);
  };
  const shown = players.slice(0, 30);
  return (
    <div
      className="flex flex-1 flex-col motion-safe:animate-rise"
      data-testid="lobby"
    >
      <p className="mt-4 text-sm text-muted-foreground">
        {pub.queue.map((id) => gangGame(id)?.title).join(" → ")}
      </p>
      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
            RAUMCODE
          </p>
          <p
            className="font-display text-[clamp(3.4rem,17vw,5.5rem)] leading-none tracking-[0.06em] text-signal tabular-nums"
            data-testid="room-code"
          >
            {snap.code}
          </p>
        </div>
        <QrCode
          value={jUrl}
          label={`QR-Code zum Beitreten in Raum ${snap.code}`}
          className="size-28 sm:size-36"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={share}
          className={cn(btn({ variant: "outline", size: "md" }), "w-full")}
        >
          <Share2 className="size-4" />
          Einladen
        </button>
        <button
          type="button"
          onClick={() => copy("join", jUrl)}
          className={cn(btn({ variant: "outline", size: "md" }), "w-full")}
        >
          {copied === "join" ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied === "join" ? "Kopiert" : "Link kopieren"}
        </button>
      </div>
      <div
        className={cn(
          "mt-4 border-l-2 pl-3",
          bigScreen ? "border-signal" : "border-line",
        )}
      >
        <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground">
          BIG SCREEN {screens > 0 ? `· ${screens} VERBUNDEN` : "· OPTIONAL"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={sUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              btn({ variant: bigScreen ? "primary" : "outline", size: "sm" }),
              bigScreen && "bg-signal text-signal-foreground",
            )}
          >
            <Monitor className="size-4" />
            Big Screen öffnen
          </a>
          <button
            type="button"
            onClick={() => copy("screen", sUrl)}
            className={btn({ variant: "ghost", size: "sm" })}
          >
            {copied === "screen" ? "Kopiert" : "Screen-Link kopieren"}
          </button>
        </div>
        {bigScreen && (
          <p className="mt-1 text-xs text-muted-foreground">
            Am TV/Laptop öffnen: {sUrl.replace(/^https?:\/\//, "")}
          </p>
        )}
      </div>
      <p className="mt-6 font-mono text-xs tracking-[0.2em]" aria-live="polite">
        <span className="text-signal tabular-nums">{players.length}</span>{" "}
        <span className="text-muted-foreground">
          IM RAUM · {lo}–{hi} NÖTIG
        </span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Spieler im Raum">
        {shown.map((p) => (
          <li
            key={p.id}
            className={cn(
              "min-h-9 border px-3 py-1.5 text-sm motion-safe:animate-rise",
              p.id === snap.playerId
                ? "border-signal text-signal"
                : "border-line",
            )}
          >
            {p.name}
            {p.isFacilitator ? " ★" : ""}
          </li>
        ))}
        {players.length > shown.length && (
          <li className="min-h-9 px-2 py-1.5 font-mono text-xs text-muted-foreground">
            +{players.length - shown.length}
          </li>
        )}
      </ul>
      {pacing && (
        <p className="mt-3 text-sm text-muted-foreground">
          Mit {players.length} Personen: etwa {pacing.estimatedMinutes} Minuten.
          {!pacing.fits &&
            " Diese Auswahl braucht mehr Zeit. Bitte im Setup Zeitrahmen oder Spiele anpassen."}
        </p>
      )}
      {snap.isFacilitator ? (
        <div className="mt-auto pt-8">
          {adult && (
            <label className="tap mb-3 flex min-h-12 items-center gap-3 border-b border-line text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="size-5 accent-[var(--signal)]"
              />
              Ich bin 18+. Alle anderen entscheiden auf ihrem eigenen Handy.
            </label>
          )}
          <OptionalMechanics
            games={pub.queue}
            value={optionalMechanics}
            onChange={setOptionalMechanics}
          />
          {!ok && (
            <p className="mb-2 text-sm text-muted-foreground">
              {players.length < lo
                ? `Noch ${lo - players.length} ${lo - players.length === 1 ? "Person" : "Leute"} fehlen.`
                : `Höchstens ${hi} Spieler für diese Auswahl.`}
            </p>
          )}
          <button
            type="button"
            disabled={!ok || (adult && !consent)}
            onClick={() => onStart(consent, optionalMechanics)}
            className={primary}
          >
            {pub.queue.length > 1 ? "Night starten" : "Spiel starten"}
          </button>
        </div>
      ) : (
        <p className="mt-auto pt-8 text-center font-mono text-xs tracking-[0.2em] text-muted-foreground">
          WARTE AUF DEN START
        </p>
      )}
    </div>
  );
}

function hiddenPrompt(gid: GangGameId, stage: string) {
  if (gid === "draw-this") return "Was wird da gezeichnet?";
  if (stage === "vote")
    return gid === "undercover"
      ? "Wer hat das andere Wort?"
      : "Wer hatte die andere Frage?";
  return "Deine Antwort – passend zu deiner geheimen Info.";
}

const inputCls =
  "mt-6 min-h-14 w-full border-0 border-b-2 border-line bg-transparent px-1 font-display text-3xl text-foreground placeholder:text-muted-foreground/50 focus:border-[var(--g)] focus:outline-none";
const s = (v: unknown) => (typeof v === "string" ? v : undefined);

function ControllerInput({
  game,
  pub,
  view,
  me,
  priv,
  roundKey,
  photos,
  onSend,
}: {
  photos: Record<string, string>;
  game: GangGame;
  pub: OnlinePublic;
  view: OnlineView;
  me: string;
  priv: Record<string, unknown> | null;
  roundKey: string;
  onSend: (type: string, payload: Record<string, unknown>) => void;
}) {
  const gid = game.id;
  const [pick, setPick] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [artist, setArtist] = useState("");
  const [teams, setTeams] = useState<Record<string, boolean>>({});
  const activeName = pub.roster.find((p) => p.id === view.activePlayerId)?.name;
  const title = view.hidden ? hiddenPrompt(gid, view.stage) : view.prompt;
  const cards = useMemo(
    () =>
      view.cards.filter((c) => {
        if (view.stage !== "vote") return true;
        if (gid === "undercover" || gid === "one-of-you") return c.key !== me;
        if (ANSWER_VOTE_GAMES.includes(gid))
          return c.key !== s(priv?.["ownCard"]);
        return true;
      }),
    [view, gid, me, priv],
  );
  const [photoData, setPhotoData] = useState<string>();
  const [noFaces, setNoFaces] = useState(false);
  const secret = s(priv?.["secret"]),
    mission = s(priv?.["mission"]),
    pprompt = s(priv?.["prompt"]),
    role = s(priv?.["role"]);
  const Cue = ({ children }: { children: React.ReactNode }) => (
    <p className="mt-4 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
      {children}
    </p>
  );
  const H = (
    <h2 className="font-display mt-4 text-[clamp(2.2rem,9vw,3.4rem)] leading-[0.95] tracking-tight">
      {["after-dark", "chain-reaction", "panic-button"].includes(gid) && pprompt
        ? pprompt
        : title}
    </h2>
  );

  if (gid === "draw-this" && view.repeatable && view.activePlayerId === me)
    return (
      <div className="flex flex-1 flex-col">
        <Cue>DU ZEICHNEST · ALLE ANDEREN RATEN</Cue>
        <Secret label="DEIN BEGRIFF">
          <span className="font-display text-5xl">{secret}</span>
        </Secret>
        <p className="mt-4 text-muted-foreground">{pprompt}</p>
        <Timer
          seconds={view.seconds ?? 45}
          game={game}
          deadlineAt={view.deadlineAt}
          serverNow={view.serverNow}
        />
      </div>
    );
  if (view.input === "consent")
    return (
      <div className="flex flex-1 flex-col">
        <Cue>NUR DEINE ENTSCHEIDUNG</Cue>
        <h2 className="font-display mt-4 text-4xl">Möchtest du mitspielen?</h2>
        <p className="mt-4 text-muted-foreground">
          18+ und heute Lust auf AFTER DARK? Du darfst zuschauen oder Aufgaben
          jederzeit auslassen.
        </p>
        <button
          type="button"
          onClick={() => onSend("consent", { success: true })}
          className={cn(primary, "mt-auto")}
        >
          Ich bin 18+ und möchte mitspielen
        </button>
        <button
          type="button"
          onClick={() => onSend("consent", { success: false })}
          className={cn(btn({ variant: "ghost", size: "lg" }), "mt-2 w-full")}
        >
          Heute lieber zuschauen
        </button>
      </div>
    );
  if (view.input === "ack") {
    return (
      <div className="flex flex-1 flex-col" data-testid="private-screen">
        <Cue>NUR AUF DEINEM HANDY</Cue>
        <h2 className="font-display mt-4 text-[clamp(2.2rem,9vw,3.4rem)] leading-[0.95]">
          {gid === "secret-missions"
            ? "Dein versiegelter Auftrag."
            : gid === "draw-this"
              ? priv?.["active"]
                ? "Dein Begriff."
                : "Du rätst gleich."
              : "Deine geheime Info."}
        </h2>
        {priv ? (
          <Secret label={gid === "secret-missions" ? "VERSIEGELT" : "GEHEIM"}>
            {role && gid !== "undercover" && (
              <span className="block font-mono text-xs tracking-[0.2em] text-[var(--g)]">
                {["ODD", "ROOM", "QUESTION"].includes(role ?? "")
                  ? "DEINE FRAGE"
                  : role}
              </span>
            )}
            {secret && (
              <span className="mt-2 block font-display text-5xl leading-none">
                {secret}
              </span>
            )}
            {mission && (
              <span className="mt-2 block font-display text-3xl leading-tight">
                {mission}
              </span>
            )}
            {pprompt && (
              <span className="mt-3 block text-sm text-foreground/85">
                {pprompt}
              </span>
            )}
          </Secret>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Dein Geheimnis wird zugestellt …
          </p>
        )}
        <button
          type="button"
          disabled={!priv}
          onClick={() => onSend("ack", {})}
          className={cn(primary, "mt-auto")}
        >
          Gemerkt
        </button>
      </div>
    );
  }
  if (view.input === "teams")
    return (
      <div className="flex flex-1 flex-col">
        <Cue>ERGEBNISSE VERGLEICHEN</Cue>
        {H}
        <TeamResults
          metric={view.teamResult?.metric ?? "Treffer"}
          max={view.teamResult?.max ?? 30}
          onSubmit={(teams) => onSend("teams", { teams })}
        />
      </div>
    );
  if (
    gid === "the-majority" &&
    (view.stage === "predict" || view.stage === "answer")
  ) {
    return (
      <MajorityController
        game={game}
        view={view}
        roundKey={`${roundKey}.${me}`}
        onSend={onSend}
      />
    );
  }
  return (
    <div className="flex flex-1 flex-col">
      {gid === "hot-seat" && view.stage === "predict" && activeName && (
        <Cue>WAS HAT {activeName.toUpperCase()} GEWÄHLT?</Cue>
      )}
      {gid === "hot-seat" && view.stage === "private" && (
        <Cue>HOT SEAT · GEHEIME ECHTE ANTWORT</Cue>
      )}
      {gid === "bluff" && view.stage === "answer" && (
        <Cue>ERFINDE EINE GLAUBWÜRDIGE FALSCHE ANTWORT</Cue>
      )}
      {view.stage === "vote" && ANSWER_VOTE_GAMES.includes(gid) && (
        <Cue>ANONYM · AUTOR:INNEN ERST BEIM REVEAL</Cue>
      )}
      {(view.hidden ||
        ["private", "predict", "answer", "vote"].includes(view.stage)) && (
        <Cue>NUR AUF DEINEM HANDY</Cue>
      )}
      {view.category && <Cue>{view.category.toUpperCase()}</Cue>}
      {H}
      {view.repeatable && pprompt && (
        <p role="status" className="mt-3 text-[var(--g)]">
          {pprompt}
        </p>
      )}
      {view.subline && !view.hidden && (
        <p className="mt-3 text-muted-foreground">{view.subline}</p>
      )}
      {(view.hidden || ["draw-this", "team-chaos"].includes(gid)) &&
        (secret || (gid === "one-of-you" && pprompt)) && (
          <Secret label="DEINE INFO">
            {secret && (
              <span className="block font-display text-5xl leading-none">
                {secret}
              </span>
            )}
            {gid === "one-of-you" && pprompt && (
              <span className="block font-display text-3xl leading-tight">
                {pprompt}
              </span>
            )}
          </Secret>
        )}
      {gid === "team-chaos" && pprompt && (
        <p className="mt-3 text-muted-foreground">{pprompt}</p>
      )}
      {gid === "secret-missions" && mission && (
        <Secret label="DEINE MISSION">
          <span className="block font-display text-3xl leading-tight">
            {mission}
          </span>
        </Secret>
      )}
      {view.seconds !== undefined &&
        (view.timed ||
          (view.stage === "perform" &&
            !["chain-reaction", "panic-button"].includes(gid))) && (
          <Timer
            seconds={view.seconds}
            game={game}
            deadlineAt={view.deadlineAt}
            serverNow={view.serverNow}
            onTimeout={
              view.timed
                ? () => {
                    void onSend("timeout", { timedOut: true });
                  }
                : undefined
            }
          />
        )}

      {view.input === "position" ? (
        <div className="mt-6">
          <label className="block text-sm">
            Dein Platz von links nach rechts
            <select
              className="mt-3 min-h-14 w-full rounded-xl border border-line bg-room px-4 text-foreground"
              value={pick ?? ""}
              onChange={(e) => setPick(e.target.value)}
            >
              <option value="" disabled>
                Position wählen
              </option>
              {cards.map((c) => (
                <option key={c.key} value={c.key}>
                  Position {c.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-sm text-muted-foreground">
            Jede Position darf nur einmal vorkommen. Einigt euch im Raum, bevor
            ihr abgebt.
          </p>
          <button
            disabled={!pick}
            onClick={() => pick && onSend("pick", { key: pick })}
            className={cn(primary, "mt-6")}
          >
            Position bestätigen
          </button>
        </div>
      ) : view.input === "options" ? (
        <>
          <div
            role="radiogroup"
            aria-label="Optionen"
            className="mt-6 border-t border-line"
          >
            {cards
              .filter(
                (c) =>
                  !(
                    gid === "the-line" &&
                    view.stage === "predict" &&
                    c.key === me
                  ),
              )
              .map((c, i) => (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={pick === c.key}
                  onClick={() => {
                    haptic(5);
                    setPick(c.key);
                  }}
                  className={cn(
                    "tap relative flex min-h-16 w-full items-center gap-4 border-b border-line py-3 pl-1 text-left transition-colors",
                    pick !== null && pick !== c.key && "opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[var(--g)] transition-transform duration-300",
                      pick === c.key && "scale-y-100",
                    )}
                    aria-hidden
                  />
                  <span className="w-7 shrink-0 pl-2 font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 break-words font-display text-2xl leading-tight">
                    {c.photoId && photos[c.photoId] && (
                      <img
                        src={photos[c.photoId]}
                        alt={c.label || "Anonymes Fotomotiv"}
                        className="mb-3 max-h-64 w-full rounded-md object-contain"
                      />
                    )}
                    {c.label}
                  </span>
                  {pick === c.key && (
                    <Check
                      className="size-5 shrink-0 text-[var(--g)]"
                      aria-hidden
                    />
                  )}
                </button>
              ))}
          </div>
          <button
            type="button"
            disabled={pick === null}
            onClick={() => pick && onSend("pick", { key: pick })}
            className={cn(primary, "mt-6")}
          >
            {pick === null ? "Erst wählen" : "Abgeben"}
          </button>
        </>
      ) : view.input === "track" ? (
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim())
              onSend("track", {
                value: artist.trim()
                  ? `${text.trim()} — ${artist.trim()}`
                  : text.trim(),
              });
          }}
        >
          <label className="sr-only" htmlFor="on-title">
            Songtitel
          </label>
          <input
            id="on-title"
            autoComplete="off"
            maxLength={60}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Songtitel"
            className={inputCls}
            style={{ fontSize: "max(16px, 1.75rem)" }}
          />
          <label className="sr-only" htmlFor="on-artist">
            Artist
          </label>
          <input
            id="on-artist"
            autoComplete="off"
            maxLength={60}
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist"
            className={cn(inputCls, "text-xl")}
            style={{ fontSize: "max(16px, 1.25rem)" }}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Nur eingetippt – kein Musikdienst, kein Login nötig.
          </p>
          <button
            type="submit"
            disabled={!text.trim()}
            className={cn(primary, "mt-auto")}
          >
            Track versiegeln
          </button>
        </form>
      ) : view.input === "text" ? (
        <form
          className="flex flex-1 flex-col"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              text.trim() &&
              (!view.maxWords ||
                text.trim().split(/\s+/u).length <= view.maxWords)
            ) {
              await onSend("answer", {
                value: text.trim(),
                ...(photoData ? { photoData, noFaces } : {}),
              });
              if (view.repeatable) setText("");
            }
          }}
        >
          <label className="sr-only" htmlFor="on-answer">
            Deine Antwort
          </label>
          <input
            id="on-answer"
            autoComplete="off"
            maxLength={80}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              gid === "photo-hunt"
                ? "Was zeigt dein Motiv?"
                : view.stage === "react"
                  ? "Erstes Wort, das kommt"
                  : "Deine Antwort"
            }
            className={inputCls}
            style={{ fontSize: "max(16px, 1.75rem)" }}
          />
          {!!view.maxWords && (
            <p className="mt-2 text-sm text-muted-foreground">
              {text.trim() ? text.trim().split(/\s+/u).length : 0} /{" "}
              {view.maxWords} Wörter
            </p>
          )}
          {gid === "photo-hunt" && (
            <>
              <PhotoCapture value={photoData} onChange={setPhotoData} />
              {photoData && (
                <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={noFaces}
                    onChange={(e) => setNoFaces(e.target.checked)}
                  />
                  Auf diesem Foto sind keine erkennbaren Gesichter (+1).
                </label>
              )}
            </>
          )}
          <button
            type="submit"
            disabled={
              !text.trim() ||
              (!!view.maxWords &&
                text.trim().split(/\s+/u).length > view.maxWords)
            }
            className={cn(primary, "mt-auto")}
          >
            Abgeben
          </button>
        </form>
      ) : view.input === "success" ? (
        <div className="mt-auto grid gap-2 pt-6">
          <button
            type="button"
            onClick={() => onSend("result", { success: true })}
            className={primary}
          >
            {gid === "secret-missions" ? "Mission erfüllt" : "Geschafft"}
          </button>
          <button
            type="button"
            onClick={() => onSend("result", { success: false })}
            className={cn(btn({ variant: "ghost", size: "lg" }), "w-full")}
          >
            {gid === "secret-missions"
              ? "Nicht geschafft"
              : "Skip – ohne Begründung"}
          </button>
        </div>
      ) : (
        <div className="mt-auto pt-6">
          {gid === "draw-this" && (
            <p className="mb-4 text-sm text-muted-foreground">
              Zeichne auf Papier oder in die Luft – ohne Buchstaben oder Zahlen.
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              onSend("done", gid === "draw-this" ? { success: true } : {})
            }
            className={primary}
          >
            {["chain-reaction", "panic-button"].includes(gid)
              ? "Bereit · Timer starten"
              : gid === "the-line"
                ? "Ich stehe"
                : gid === "draw-this"
                  ? "Gezeichnet"
                  : "Gespielt"}
          </button>
        </div>
      )}
    </div>
  );
}

function Leaders({
  pub,
  me,
  limit = 6,
}: {
  pub: OnlinePublic;
  me?: string;
  limit?: number;
}) {
  const ranking = [...pub.roster].sort(
    (a, b) => (pub.scores[b.id] ?? 0) - (pub.scores[a.id] ?? 0),
  );
  const mine = me ? ranking.findIndex((p) => p.id === me) : -1;
  return (
    <ol
      className="mt-6 flex flex-wrap gap-x-5 gap-y-2"
      aria-label="Zwischenstand"
    >
      {ranking.slice(0, limit).map((p, i) => (
        <li key={p.id} className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-display text-2xl tabular-nums",
              i === 0 && "text-[var(--g)]",
            )}
          >
            {pub.scores[p.id] ?? 0}
          </span>
          <span
            className={cn(
              "text-sm",
              p.id === me ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {p.name}
          </span>
        </li>
      ))}
      {mine >= limit && (
        <li className="text-sm text-muted-foreground">
          … du: Platz {mine + 1}
        </li>
      )}
    </ol>
  );
}

function ShowStage({
  game,
  pub,
  view,
  me,
  fac,
  onAdvance,
}: {
  game: GangGame;
  pub: OnlinePublic;
  view: OnlineView;
  me: string;
  fac: boolean;
  onAdvance: () => void;
}) {
  const res = view.resolution;
  const last = view.roundNumber >= view.targetRounds;
  if (view.stage === "reveal") {
    return (
      <div className="flex flex-1 flex-col justify-center motion-safe:animate-rise">
        <p className="font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          ALLE ABGEGEBEN
        </p>
        {!view.hidden && (
          <p className="mt-3 text-muted-foreground">{view.prompt}</p>
        )}
        <h2 className="font-display mt-4 text-[clamp(3rem,14vw,5rem)] leading-[0.85]">
          Augen nach vorn.
        </h2>
        {fac ? (
          <button
            type="button"
            onClick={onAdvance}
            className={cn(primary, "mt-10")}
          >
            {game.signature === "dispatch"
              ? "Siegel brechen"
              : game.signature === "mask"
                ? "Masken ab"
                : "Aufdecken"}
          </button>
        ) : (
          <p className="mt-10 font-mono text-xs tracking-[0.2em] text-muted-foreground">
            GLEICH WIRD AUFGEDECKT
          </p>
        )}
      </div>
    );
  }
  const names = (ids: string[]) =>
    ids.map((id) => pub.roster.find((p) => p.id === id)?.name ?? "?");
  return (
    <div
      className="flex flex-1 flex-col"
      aria-live="polite"
      data-testid="online-score"
    >
      <h2 className="font-display mt-8 text-[clamp(2.6rem,12vw,4.2rem)] leading-[0.88] motion-safe:animate-rise">
        {res?.headline ?? "Runde vorbei."}
      </h2>
      {res?.detail && (
        <p className="mt-3 text-muted-foreground">{res.detail}</p>
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
      {view.majority && <MajorityResult r={view.majority} names={names} />}
      {!view.majority &&
        res?.revealItems &&
        res.revealItems.filter((r) => r.value).length > 0 && (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {res.revealItems
              .filter((r) => r.value)
              .slice(0, 12)
              .map((r, i) => (
                <li
                  key={i}
                  className="flex min-h-11 items-baseline justify-between gap-3 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {r.label}
                  </span>
                  <span className="text-right font-display text-xl">
                    {r.value}
                  </span>
                </li>
              ))}
          </ul>
        )}
      {res && (res.scoreDelta[me] ?? 0) > 0 && (
        <p className="mt-4 font-mono text-xs tracking-[0.2em] text-[var(--g)]">
          +{res.scoreDelta[me]} FÜR DICH
        </p>
      )}
      {(!["the-line", "after-dark"].includes(game.id) ||
        (game.id === "the-line" && pub.optionalMechanics?.linePredictions)) && (
        <Leaders pub={pub} me={me} />
      )}
      {fac ? (
        <button
          type="button"
          onClick={onAdvance}
          className={cn(primary, "mt-auto")}
        >
          {last ? "Zum Finale" : "Nächste Runde"}
        </button>
      ) : (
        <p className="mt-auto pt-8 text-center font-mono text-xs tracking-[0.2em] text-muted-foreground">
          GLEICH GEHT'S WEITER
        </p>
      )}
    </div>
  );
}

/* THE MAJORITY controller: question once. Tip goes to the predict stage now; own choice is cached
   session-scoped (keyed by round, no token) and auto-submitted exactly once when "answer" opens. */
const majKey = (roundKey: string) => `nocturne.gang.maj.${roundKey}`;
export function readMajorityOwn(roundKey: string): string | null {
  try {
    return sessionStorage.getItem(majKey(roundKey));
  } catch {
    return null;
  }
}
function MajorityController({
  game,
  view,
  roundKey,
  onSend,
}: {
  game: GangGame;
  view: OnlineView;
  roundKey: string;
  onSend: (
    type: string,
    payload: Record<string, unknown>,
  ) => void | Promise<void>;
}) {
  const [cached, setCached] = useState<string | null | undefined>(undefined);
  const fired = useRef(false);
  useEffect(() => {
    if (view.stage === "answer") setCached(readMajorityOwn(roundKey));
  }, [view.stage, roundKey]);
  useEffect(() => {
    if (view.stage !== "answer" || !cached || fired.current) return;
    if (!view.cards.some((c) => c.key === cached)) {
      setCached(null);
      return;
    }
    fired.current = true;
    void onSend("pick", { key: cached });
    try {
      sessionStorage.removeItem(majKey(roundKey));
    } catch {
      /* ignore */
    }
  }, [cached, view.stage, view.cards, roundKey, onSend]);
  if (view.stage === "predict") {
    return (
      <MajorityDual
        game={game}
        prompt={view.prompt}
        subline={view.subline}
        options={view.cards}
        cta="Beides abgeben"
        onSubmit={(tip, own) => {
          try {
            sessionStorage.setItem(majKey(roundKey), own);
          } catch {
            /* memory-less fallback: asked again in answer */
          }
          void onSend("pick", { key: tip });
        }}
      />
    );
  }
  if (cached === undefined || cached)
    return <Waiting title="Versiegelt · warte auf die anderen" />;
  return (
    <MajorityDual
      game={game}
      prompt={view.prompt}
      options={view.cards}
      cta="Abgeben"
      onlyOwn
      onSubmit={(_t, own) => void onSend("pick", { key: own })}
    />
  );
}
