import {
  activateCouchController,
  disconnectCouchTV,
} from "@/lib/gang/couch-tv-client";
import { useEffect, useRef, useState } from "react";
import {
  couchScreenWrite,
  projectCouchScreen,
  type CouchScreenView,
} from "@/lib/gang/couch-screen";
import type { CouchState } from "@/lib/gang/core/couch";
import {
  defaultRoomClient,
  RoomError,
  roomErrorText,
  screenUrl,
  sessionStore,
  type RoomSnapshot,
  type StoredSession,
} from "@/lib/gang/room-client";
import { QrCode } from "./QrCode";

const button = "min-h-11 rounded-xl border border-white/20 px-4 py-2 text-sm";
/** The existing paid host channel carries a read-only, allowlisted projection.
 * Commands and audio stay on the phone; no per-guest joining is needed. */
export function CouchTVControls({ state }: { state: CouchState }) {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [connecting, setConnecting] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const channel = useRef<{
    session: StoredSession;
    snap: RoomSnapshot;
    controller: string;
    startedAt: number;
  } | null>(null);
  const mounted = useRef(true),
    sending = useRef(false),
    creating = useRef(false);
  const lastState = useRef<CouchState | null>(null),
    lastSent = useRef(0);
  const generation = useRef(0);
  const lastConnect = useRef(0);
  const retryAt = useRef(0);
  useEffect(() => {
    if (state.phase === "play") setOpen(false);
  }, [state.phase]);
  async function connect(auto = false) {
    if (creating.current || channel.current) return;
    creating.current = true;
    setConnecting(true);
    setStatus("");
    lastConnect.current = Date.now();
    const run = ++generation.current;
    const client = defaultRoomClient();
    try {
      const stored = sessionStore.get("couch");
      let entry: { session: StoredSession; snapshot: RoomSnapshot } | null =
        null;
      if (stored) {
        try {
          const snapshot = await client.snapshot(stored.token);
          if (snapshot.isFacilitator && snapshot.phase !== "finished")
            entry = { session: stored, snapshot };
        } catch {
          /* reconnect explicitly creates a fresh channel after expiry */
        }
      }
      entry ??= await client.create("Spielleitung", "catalog", 2, "couch");
      if (!mounted.current || run !== generation.current) return;
      channel.current = {
        session: entry.session,
        snap: entry.snapshot,
        controller: crypto.randomUUID(),
        startedAt: Date.now(),
      };
      activateCouchController(channel.current.controller);
      setCode(entry.session.code);
      setOpen(!auto);
      lastState.current = null;
    } catch (e) {
      if (mounted.current) setStatus(roomErrorText(e));
    } finally {
      creating.current = false;
      if (mounted.current) setConnecting(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    if (sessionStore.get("couch")) void connect(true);
    const tick = async () => {
      const ch = channel.current;
      if (
        !ch &&
        !creating.current &&
        sessionStore.get("couch") &&
        Date.now() - lastConnect.current > 5000
      ) {
        void connect(true);
        return;
      }
      if (
        !ch ||
        sending.current ||
        Date.now() < retryAt.current ||
        (lastState.current === stateRef.current &&
          Date.now() - lastSent.current < 10000)
      )
        return;
      const source = stateRef.current,
        run = generation.current;
      sending.current = true;
      try {
        const view = projectCouchScreen(
          source,
          ch.controller,
          ch.startedAt,
          Date.now(),
        );
        const snap = await defaultRoomClient().setState(
          ch.session.token,
          ch.snap,
          (fresh) => couchScreenWrite(fresh, view),
        );
        if (run !== generation.current || !mounted.current) return;
        ch.snap = snap;
        lastState.current = source;
        lastSent.current = Date.now();
        setStatus("Verbunden");
      } catch (e) {
        if (run !== generation.current || !mounted.current) return;
        retryAt.current = Date.now() + 5000;
        if (
          e instanceof RoomError &&
          [
            "controller_changed",
            "facilitator_required",
            "room_not_found",
            "invalid_player_token",
          ].includes(e.code)
        ) {
          channel.current = null;
          sessionStore.clear("couch");
          setCode("");
          setStatus(
            "Die TV-Verbindung wurde beendet oder übernommen. Verbinde bei Bedarf einen neuen Bildschirm.",
          );
        } else
          setStatus(
            "TV-Verbindung hakt. Wir verbinden erneut; am Handy könnt ihr weiterspielen.",
          );
      } finally {
        sending.current = false;
      }
    };
    const timer = setInterval(() => void tick(), 750);
    const invalidate = () => {
      ++generation.current;
    };
    return () => {
      mounted.current = false;
      invalidate();
      clearInterval(timer);
    };
  }, []); // the current game state is read through stateRef, never captured by the timer
  async function disconnect() {
    ++generation.current;
    channel.current = null;
    setCode("");
    setStatus("");
    await disconnectCouchTV();
  }
  return (
    <section className="w-full rounded-xl border border-white/15 p-3 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={button}
          disabled={connecting}
          onClick={() => (code ? setOpen(!open) : void connect())}
        >
          {connecting
            ? "TV wird verbunden …"
            : code
              ? `TV · ${code}`
              : "Handy steuert · TV verbinden"}
        </button>
        {status && (
          <span role="status" className="text-sm text-white/70">
            {status}
          </span>
        )}
      </div>
      {code && open && (
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <QrCode
            value={screenUrl(window.location.origin, code)}
            label="TV-Anzeige öffnen"
            className="size-28 shrink-0"
          />
          <div className="min-w-0 flex-1 text-sm">
            <p>
              Öffnet diesen Link im Browser am TV oder auf einem verbundenen
              Laptop. Dieses Handy bleibt die Spielleitung.
            </p>
            <a
              className="mt-2 block break-all underline"
              href={screenUrl(window.location.origin, code)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {screenUrl(window.location.origin, code)}
            </a>
            <p className="my-3 text-white/60">
              Nur öffentliche Aufgaben und Punkte werden übertragen. Musik
              spielt ihr am Handy oder über euren Lautsprecher. Kein
              automatisches Casting.
            </p>
            <button className={button} onClick={() => void disconnect()}>
              TV trennen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function CouchTVStage({ view }: { view: CouchScreenView }) {
  const [now, setNow] = useState(Date.now());
  const receipt = useRef({ sentAt: view.sentAt, receivedAt: Date.now() });
  if (receipt.current.sentAt !== view.sentAt)
    receipt.current = { sentAt: view.sentAt, receivedAt: Date.now() };
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const age = Math.max(0, now - receipt.current.receivedAt);
  const stale = age > 30000;
  const seconds =
    view.seconds === null
      ? null
      : Math.max(0, view.seconds - (view.paused ? 0 : Math.floor(age / 1000)));
  return (
    <main
      data-testid="couch-tv"
      className="flex min-h-svh flex-col gap-8 overflow-hidden bg-[#101113] p-[5vw] text-white"
    >
      <header className="flex flex-wrap justify-between gap-4 text-lime-200">
        <span>NOCTURNE · {view.title}</span>
        <span>
          RUNDE {view.round}/{view.rounds} · HANDY STEUERT
        </span>
      </header>
      <section className="my-auto">
        <h1 className="break-words font-display text-[clamp(2.5rem,6vw,7rem)] leading-tight">
          {stale ? "Verbindung zur Spielleitung unterbrochen." : view.heading}
        </h1>
        <p className="mt-6 text-[clamp(1.1rem,2.2vw,2.2rem)] text-white/65">
          {stale
            ? "Öffnet das Steuerhandy. Die Anzeige aktualisiert sich, sobald es wieder verbunden ist."
            : view.detail}
        </p>
        {!stale && view.options.length > 0 && (
          <ol className="mt-8 grid gap-3 sm:grid-cols-2">
            {view.options.map((o, i) => (
              <li key={i} className="rounded-xl bg-white/10 p-4 text-2xl">
                {i + 1}. {o}
              </li>
            ))}
          </ol>
        )}
        {!stale && seconds !== null && (
          <p className="mt-6 text-5xl tabular-nums text-lime-200">
            {view.paused ? "PAUSE" : `${seconds}s`}
          </p>
        )}
      </section>
      <footer className="flex flex-wrap gap-5">
        {view.teams.map((t, i) => (
          <span key={i} className="rounded-xl bg-white/5 px-4 py-3 text-xl">
            {t.name} <strong className="ml-3 text-lime-200">{t.score}</strong>
          </span>
        ))}
      </footer>
    </main>
  );
}
