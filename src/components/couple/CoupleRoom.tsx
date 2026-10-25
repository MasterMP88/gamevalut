import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Btn } from "@/components/vault/Btn";
import { QrCode } from "@/components/gang/QrCode";
import { HostAccessSheet } from "@/components/commerce/HostAccessSheet";
import { ENDINGS } from "@/components/player/EndScreen";
import { EnergyField } from "@/components/player/EnergyField";
import { fill, nightSignature } from "@/lib/game/engine";
import { GAMES_BY_ID } from "@/lib/game/games";
import type { ConsentSettings, GameId } from "@/lib/game/types";
import { recordSeen, seenIds } from "@/lib/content-history";
import {
  RoomError,
  defaultRoomClient,
  normalizeCode,
  roomErrorText,
  sessionStore,
  type RoomClient,
  type RoomSnapshot,
  type StoredSession,
} from "@/lib/gang/room-client";
import { useRoom } from "@/lib/gang/use-room";
import {
  actPair,
  controlPair,
  pairKey,
  pairLobby,
  pairPublic,
  pairWrite,
  startPair,
  type PairPublic,
  type PairRuntime,
} from "@/lib/couple/online";

export function CoupleEntry({
  gameId = "roxy-after-dark",
  join = "",
  hostAllowed,
  client = defaultRoomClient(),
}: {
  gameId?: GameId;
  join?: string;
  hostAllowed: boolean;
  client?: RoomClient;
}) {
  const [session, setSession] = useState<StoredSession | null>(null),
    [initial, setInitial] = useState<RoomSnapshot | null>(null);
  const [name, setName] = useState(""),
    [code, setCode] = useState(join),
    [duration, setDuration] = useState<15 | 30 | 60 | null>(30);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const saved = sessionStore.get("couple");
    if (!saved || (join && saved.code !== normalizeCode(join))) return;
    let on = true;
    void client
      .snapshot(saved.token)
      .then((s) => {
        if (on && pairPublic(s)) {
          setInitial(s);
          setSession(saved);
        }
      })
      .catch(() => sessionStore.clear("couple"));
    return () => {
      on = false;
    };
  }, [client, join]);
  const enter = async (host: boolean) => {
    setBusy(true);
    setError("");
    try {
      const r = host
        ? await client.create(name.trim(), "catalog", 2, "couple")
        : await client.join(code, name.trim(), "couple");
      let snap = r.snapshot;
      if (host)
        snap = await client.publish(r.session.token, snap, () =>
          pairWrite(pairLobby(gameId, duration)),
        );
      else if (!pairPublic(snap)) {
        await client.leave(r.session.token, "couple");
        throw new Error("wrong_room");
      }
      setInitial(snap);
      setSession(r.session);
    } catch (e) {
      setError(
        e instanceof Error && e.message === "wrong_room"
          ? "Das ist ein Gruppenraum. Öffne ihn über GANG MODE."
          : roomErrorText(e),
      );
    } finally {
      setBusy(false);
    }
  };
  if (session)
    return (
      <CoupleRoom
        client={client}
        session={session}
        initial={initial}
        onLeave={() => {
          setSession(null);
          setInitial(null);
        }}
      />
    );
  return (
    <main className="mx-auto min-h-dvh max-w-xl safe-x safe-top safe-bottom py-8">
      <Link to="/" className="tap inline-flex min-h-11 items-center">
        ← NOCTURNE
      </Link>
      <p className="eyebrow mt-8">Zwei Handys · ein Abend</p>
      <h1 className="font-display mt-3 text-5xl">
        Eure Wahl.
        <br />
        Bis zuletzt geheim.
      </h1>
      <p className="mt-4 text-muted-foreground">
        {GAMES_BY_ID[gameId].title} gemeinsam im selben Raum. Bei Sync und
        Vorhersagen tippt ihr gleichzeitig. Nur eine Person braucht einen
        bezahlten Zugang.
      </p>
      <label className="mt-8 block">
        Dein Name
        <input
          aria-label="Dein Name"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4"
        />
      </label>
      <section className="mt-6 border-y border-line py-6">
        <h2 className="font-display text-2xl">Einladung bekommen?</h2>
        <label className="mt-3 block">
          Raumcode
          <input
            aria-label="Raumcode"
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            maxLength={6}
            autoCapitalize="characters"
            className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4 font-mono"
          />
        </label>
        <Btn
          className="mt-3 w-full"
          disabled={busy || !name.trim() || code.length !== 6}
          onClick={() => void enter(false)}
        >
          Kostenlos beitreten
        </Btn>
      </section>
      {!join && (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Eure Nacht eröffnen</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {([15, 30, 60, null] as const).map((d) => (
              <Btn
                key={d ?? "open"}
                variant={duration === d ? "accent" : "outline"}
                aria-pressed={duration === d}
                onClick={() => setDuration(d)}
              >
                {d ? `${d} min` : "Open End"}
              </Btn>
            ))}
          </div>
          {hostAllowed ? (
            <Btn
              className="mt-4 w-full"
              disabled={busy || !name.trim()}
              onClick={() => void enter(true)}
            >
              Raum für zwei öffnen
            </Btn>
          ) : (
            <HostAccessSheet />
          )}
        </section>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Eingaben und Songtitel werden für die gemeinsame Auflösung im privaten
        Raum übertragen. Der Raum schließt nach 12 Stunden; seine Daten werden
        spätestens fünf Minuten später gelöscht. Persönliche Echo-Notizen
        bleiben ausschließlich im Host-Tab. Das Host-Gerät leitet die Runde und
        ist Teil eures Vertrauensraums.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-primary">
          {error}
        </p>
      )}
    </main>
  );
}

export function CoupleRoom({
  client,
  session,
  initial,
  onLeave,
}: {
  client: RoomClient;
  session: StoredSession;
  initial: RoomSnapshot | null;
  onLeave: () => void;
}) {
  const { snap, setSnap, progress, status, refresh } = useRoom(
    client,
    session.token,
    initial,
    {
      onGone: () => {
        sessionStore.clear("couple");
        onLeave();
      },
    },
  );
  const pub = pairPublic(snap),
    fac = useRef<PairRuntime | null>(null),
    working = useRef(false),
    capture = useRef("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [sealed, setSealed] = useState("");
  const [reaction, setReaction] = useState("");
  const [privateCard, setPrivate] = useState<Record<string, unknown> | null>(
      null,
    ),
    [note, setNote] = useState("");
  const key = `${snap?.roundKey}:${snap?.stage}`;
  const latest = useRef(snap);
  latest.current = snap;
  const publish = async (f: PairRuntime) => {
    const s = latest.current;
    if (!s) return;
    const next = await client.publish(session.token, s, (fresh) => {
      if (fresh.version !== s.version) throw new RoomError("version_conflict");
      return pairWrite(f);
    });
    fac.current = f;
    latest.current = next;
    setSnap(next);
    await refresh();
  };
  useEffect(() => {
    setPrivate(null);
    setNote("");
    setReaction("");
    capture.current = "";
  }, [key]);
  useEffect(() => {
    if (!snap?.roundKey) return;
    let live = true;
    void client
      .getPrivate(session.token, snap.roundKey)
      .then((p) => {
        if (live) setPrivate(p);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [client, session.token, snap?.roundKey, snap?.version]);
  useEffect(() => {
    if (pub?.scene && pub.phase === "answer") recordSeen([pub.scene.id]);
  }, [pub?.scene?.id, pub?.phase]);
  useEffect(() => {
    if (!snap?.isFacilitator || !pub || working.current) return;
    working.current = true;
    void (async () => {
      if (!fac.current || fac.current.epoch !== pub.epoch) {
        const loaded = await client.loadRuntime(session.token);
        if (loaded?.["protocol"] !== "couple-1") return;
        fac.current = loaded as unknown as PairRuntime;
      }
      let f = fac.current!;
      if (f.seats && f.phase !== "end") {
        const controls = await client.pairControl(
          session.token,
          pairKey(f),
          f.phase,
        );
        const next = controlPair(f, Array.isArray(controls) ? controls : []);
        if (next !== f) {
          await publish(next);
          return;
        }
      }
      if (
        progress?.complete &&
        progress.roundKey === snap.roundKey &&
        progress.stage === snap.stage &&
        !(f.phase === "end" && f.state?.ending) &&
        f.phase !== "lobby"
      ) {
        const actions = await client.collect(
          session.token,
          pairKey(f),
          f.phase,
        );
        const next = actPair(
          f,
          actions,
          capture.current.trim()
            ? { text: capture.current.trim(), private: false }
            : undefined,
        );
        if (next !== f) await publish(next);
      }
    })()
      .catch((e) => {
        if (
          e instanceof RoomError &&
          ["version_conflict", "stale_stage", "facilitator_required"].includes(
            e.code,
          )
        ) {
          if (e.code === "facilitator_required") fac.current = null;
          void refresh();
        } else setError(roomErrorText(e));
      })
      .finally(() => {
        working.current = false;
      });
  }, [snap?.version, snap?.isFacilitator, progress, client, session.token]);
  useEffect(() => {
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        delta = Math.min(11000, now - last);
      last = now;
      const f = fac.current;
      if (
        !document.hidden &&
        latest.current?.isFacilitator &&
        f?.state &&
        ["answer", "reveal"].includes(f.phase)
      )
        f.state = { ...f.state, elapsedMs: (f.state.elapsedMs ?? 0) + delta };
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await work();
      await refresh();
    } catch (e) {
      setError(roomErrorText(e));
    } finally {
      setBusy(false);
    }
  };
  const send = (payload: Record<string, unknown>) =>
    void run(async () => {
      if (!snap?.roundKey || !snap.stage) return;
      await client.submit(
        session.token,
        snap.roundKey,
        snap.stage,
        "pair",
        payload,
      );
      setSealed(key);
    });
  const control = (kind: "skip" | "pause" | "finish") =>
    void run(async () => {
      if (snap?.roundKey && snap.stage)
        await client.pairControl(
          session.token,
          snap.roundKey,
          snap.stage,
          kind,
        );
    });
  const leave = () =>
    void run(async () => {
      await client.leave(session.token, "couple");
      onLeave();
    });
  if (!snap || !pub)
    return (
      <p role="status" className="safe-x py-12">
        Euer Raum wird verbunden …
      </p>
    );
  const game = GAMES_BY_ID[pub.gameId],
    index = pub.seats?.indexOf(snap.playerId) ?? -1;
  const submitted =
    sealed === key ||
    (!!progress?.youSubmitted &&
      progress.roundKey === snap.roundKey &&
      progress.stage === snap.stage);
  const readyCount = snap.players.filter((p) => p.active && p.canInput).length;
  const liveState = snap.isFacilitator ? fac.current?.state : null;
  const sc = pub.scene,
    me = pub.names[pub.turn],
    you = pub.names[1 - pub.turn]!;
  const privateMission = privateCard?.["mission"] as {
    player: 0 | 1;
    text: string;
  } | null;
  return (
    <div className="min-h-dvh safe-x safe-top safe-bottom">
      <header className="mx-auto flex max-w-xl items-center justify-between gap-3 py-4">
        <p className="eyebrow">{game.title} · zwei Handys</p>
        <span role="status" className="text-xs text-muted-foreground">
          {status === "live" ? "Verbunden" : "Verbindung wird erneuert …"}
        </span>
      </header>
      <main
        className="world mx-auto flex max-w-xl flex-col pb-8"
        data-world={game.art}
      >
        {pub.phase === "lobby" ? (
          <>
            <h1 className="font-display mt-8 text-5xl">
              Noch ein Platz.
              <br />
              Für dein Gegenüber.
            </h1>
            <p className="mt-4 text-muted-foreground">
              QR scannen oder den Code auf dem zweiten Handy eingeben.{" "}
              {pub.duration ? `${pub.duration} Minuten` : "Open End"} · beide
              bestätigen ihren Rahmen selbst.
            </p>
            <QrCode
              value={`${window.location.origin}/together?join=${snap.code}`}
              label="Einladung für das zweite Handy"
              className="mx-auto my-8 w-56"
            />
            <p className="text-center font-mono text-4xl tracking-[0.25em]">
              {snap.code}
            </p>
            <p className="mt-4 text-center">
              {snap.players
                .filter((p) => p.canInput)
                .map((p) => p.name)
                .join(" & ")}
            </p>
            {snap.isFacilitator && (
              <Btn
                className="mt-8"
                disabled={busy || readyCount !== 2}
                onClick={() =>
                  void run(async () => {
                    const f =
                      fac.current ??
                      ((await client.loadRuntime(
                        session.token,
                      )) as unknown as PairRuntime);
                    await publish(startPair(f, snap, seenIds()));
                  })
                }
              >
                {readyCount === 2
                  ? "Zu zweit starten"
                  : "Warte auf dein Gegenüber"}
              </Btn>
            )}
          </>
        ) : pub.phase === "end" ? (
          <>
            <p className="eyebrow mt-8">Eure Nacht-Signatur</p>
            <h1 className="font-display mt-3 text-5xl">
              {pub.signature?.name ?? "Diese Nacht gehört euch."}
            </h1>
            <p className="mt-5 text-muted-foreground">
              {pub.signature?.done ?? 0} gemeinsam abgeschlossene Szenen ·{" "}
              {pub.names.join(" & ")}. {pub.signature?.line}
            </p>
            {game.battle && (
              <p className="font-display mt-6 text-3xl">
                {pub.sparks[0] === pub.sparks[1]
                  ? "Unentschieden"
                  : `${pub.names[pub.sparks[0] > pub.sparks[1] ? 0 : 1]} gewinnt`}{" "}
                · {pub.sparks.join(" : ")}
              </p>
            )}
            {game.coop && (
              <EnergyField
                energies={pub.energies}
                milestones={pub.milestones.length}
              />
            )}
            {pub.ending && (
              <p className="font-display mt-6 text-3xl">
                {ENDINGS.find((e) => e.id === pub.ending)?.line}
              </p>
            )}
            {!pub.ending && (
              <EndingChoice
                signature={!!game.signature}
                disabled={busy || submitted}
                onSubmit={send}
              />
            )}
            {game.music &&
            snap.isFacilitator &&
            liveState?.tracklist?.length ? (
              <ol className="mt-6 space-y-3">
                {liveState.tracklist.map((t, i) => (
                  <li key={i}>
                    {t.title}
                    {t.artist ? ` — ${t.artist}` : ""}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {pub.names[t.owner]}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
            {snap.isFacilitator && pub.ending && (
              <Btn
                className="mt-8"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    fac.current = null;
                    await publish(pairLobby(pub.gameId, pub.duration));
                  })
                }
              >
                Neue Nacht · neue Auswahl
              </Btn>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              Ungespielte Inhalte kommen zuerst. Nach ausgeschöpfter Auswahl
              kehren die am längsten zurückliegenden Inhalte zurück.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow mt-6">
              Szene {pub.number}
              {pub.target ? ` / ${pub.target}` : ""} · {me} ist dran
            </p>
            {game.battle && (
              <p className="font-display mt-3 text-2xl">
                {pub.names[0]} {pub.sparks[0]} : {pub.sparks[1]} {pub.names[1]}
              </p>
            )}
            {game.coop && (
              <EnergyField
                energies={pub.energies}
                milestones={pub.milestones.length}
              />
            )}
            {pub.tempo && (
              <p className="eyebrow mt-3">
                Tempo:{" "}
                {
                  (
                    {
                      speed: "Schnell",
                      silent: "Stille",
                      swap: "Tausch",
                      rule: "Neue Regel",
                    } as const
                  )[pub.tempo]
                }
              </p>
            )}
            {pub.phase === "consent" || pub.phase === "paused" ? (
              <Consent
                key={key}
                current={pub.settings}
                disabled={busy || submitted}
                paused={pub.phase === "paused"}
                onSubmit={send}
              />
            ) : (
              <>
                <h1 className="font-display mt-6 text-4xl">{sc?.title}</h1>
                <p className="font-display mt-4 text-2xl leading-snug">
                  {fill(
                    sc?.type === "SECRET" &&
                      index === pub.turn &&
                      typeof privateCard?.["secret"] === "string"
                      ? privateCard["secret"]
                      : liveState?.current?.anchorId
                        ? liveState.current.prompt
                        : (sc?.prompt ?? ""),
                    me,
                    you,
                  )}
                </p>
                {sc?.helper && (
                  <p className="mt-3 text-muted-foreground">
                    {fill(sc.helper, me, you)}
                  </p>
                )}
                {pub.phase === "ready" ? (
                  <Ready
                    key={key}
                    pub={pub}
                    index={index}
                    disabled={busy || submitted}
                    onSubmit={send}
                  />
                ) : pub.phase === "reveal" ? (
                  <>
                    <h2 className="font-display mt-8 text-3xl text-primary">
                      {pub.result?.label}
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {pub.result?.lines.map((line, i) => (
                        <li key={i} className="font-display text-2xl">
                          {line}
                        </li>
                      ))}
                    </ul>
                    {snap.isFacilitator &&
                      game.memory &&
                      sc?.type === "QUESTION" &&
                      !submitted && (
                        <label className="mt-6 block text-sm">
                          Ein Echo merken · freiwillig, nur in diesem Host-Tab
                          <input
                            maxLength={220}
                            value={note}
                            onChange={(e) => {
                              setNote(e.target.value);
                              capture.current = e.target.value;
                            }}
                            className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4"
                            placeholder="Nur etwas, das ihr beide wieder aufgreifen möchtet"
                          />
                        </label>
                      )}
                    {sc?.type === "MUSIC" && index !== pub.turn && (
                      <fieldset className="mt-5">
                        <legend>Deine Reaktion · freiwillig</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            ["match", "Match"],
                            ["twist", "Überraschung"],
                            ["explains", "Erklärt einiges"],
                          ].map(([id, label]) => (
                            <Btn
                              key={id}
                              disabled={busy || submitted}
                              variant={reaction === id ? "accent" : "outline"}
                              aria-pressed={reaction === id}
                              onClick={() => setReaction(id!)}
                            >
                              {label}
                            </Btn>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    <Btn
                      className="mt-8"
                      disabled={busy || submitted}
                      onClick={() => send({ ready: true, reaction })}
                    >
                      {submitted
                        ? "Warte auf dein Gegenüber …"
                        : "Gemeinsam weiter"}
                    </Btn>
                  </>
                ) : (
                  <PairInput
                    key={key}
                    pub={pub}
                    index={index}
                    disabled={busy || submitted}
                    submitted={submitted}
                    secretReady={
                      sc?.type !== "SECRET" ||
                      typeof privateCard?.["secret"] === "string"
                    }
                    deadline={snap.deadlineAt ?? null}
                    serverNow={snap.serverNow}
                    mission={privateMission}
                    onSubmit={send}
                  />
                )}
              </>
            )}
            <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-4">
              <Btn
                variant="ghost"
                disabled={
                  busy || pub.phase === "consent" || pub.phase === "paused"
                }
                onClick={() => control("skip")}
              >
                Überspringen
              </Btn>
              <Btn
                variant="outline"
                disabled={busy || pub.phase === "paused"}
                onClick={() => control("pause")}
              >
                Pause & Rahmen
              </Btn>
              <Btn
                variant="ghost"
                disabled={busy}
                onClick={() => control("finish")}
              >
                Nacht abschließen
              </Btn>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Überspringen kostet keine Punkte. Bei einer Pause bestätigt ihr
              beide den Rahmen neu.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="mt-4 text-primary">
            {error}
          </p>
        )}
        <Btn className="mt-8" variant="ghost" disabled={busy} onClick={leave}>
          Raum verlassen
        </Btn>
      </main>
    </div>
  );
}

function Consent({
  current,
  disabled,
  paused,
  onSubmit,
}: {
  current: ConsentSettings;
  disabled: boolean;
  paused: boolean;
  onSubmit: (p: Record<string, unknown>) => void;
}) {
  const [settings, setSettings] = useState(current),
    [adult, setAdult] = useState(false);
  return (
    <section className="mt-6">
      <h1 className="font-display text-4xl">
        {paused ? "Erst wieder wohlfühlen." : "Dein eigener Rahmen."}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Es gilt immer eure gemeinsame, vorsichtigere Auswahl. Du darfst
        jederzeit passen.
      </p>
      {(
        [
          ["touch", "Berührung"],
          ["sensual", "Sinnliches"],
          ["drinks", "Optionale Drinks"],
          ["signals", "Private Signale"],
        ] as const
      ).map(([key, label]) => (
        <label
          key={key}
          className="flex min-h-14 items-center gap-3 border-b border-line"
        >
          <input
            type="checkbox"
            checked={settings[key]}
            onChange={(e) =>
              setSettings({ ...settings, [key]: e.target.checked })
            }
            disabled={disabled}
            className="size-5"
          />
          {label}
        </label>
      ))}
      <label className="mt-4 block">
        Intensität
        <select
          className="ml-3 min-h-11 rounded border border-line bg-surface p-2"
          value={settings.intensityCap}
          disabled={disabled}
          onChange={(e) =>
            setSettings({ ...settings, intensityCap: Number(e.target.value) })
          }
        >
          {["Sanft", "Verspielt", "Mutig", "Magnetisch", "After Hours"].map(
            (l, i) => (
              <option key={l} value={i + 1}>
                {l}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="mt-4 flex min-h-12 items-center gap-3">
        <input
          type="checkbox"
          checked={adult}
          disabled={disabled}
          onChange={(e) => setAdult(e.target.checked)}
          className="size-5"
        />
        Ich bin mindestens 18 und spiele freiwillig mit.
      </label>
      <Btn
        className="mt-6 w-full"
        disabled={disabled || !adult}
        onClick={() =>
          onSubmit({ adult, settings, seen: seenIds().slice(-200) })
        }
      >
        {disabled
          ? "Bestätigt · wartet auf euch beide"
          : "Meinen Rahmen bestätigen"}
      </Btn>
    </section>
  );
}

function Ready({
  pub,
  index,
  disabled,
  onSubmit,
}: {
  pub: PairPublic;
  index: number;
  disabled: boolean;
  onSubmit: (p: Record<string, unknown>) => void;
}) {
  const [powerup, setPowerup] = useState(""),
    [steer, setSteer] = useState("");
  return (
    <section className="mt-6">
      <p className="text-muted-foreground">
        {["SYNC", "PREDICTION"].includes(pub.scene?.type ?? "")
          ? "Ihr wählt gleichzeitig und verdeckt. Erst wenn beide abgegeben haben, seht ihr die Auflösung."
          : "Lest gemeinsam. Die Aufgabe startet erst, wenn ihr beide bereit seid."}
      </p>
      {index === pub.turn &&
        pub.gameId === "battle" &&
        pub.powerUps[index]! > 0 && (
          <label className="mt-4 block">
            Power-up
            <select
              value={powerup}
              onChange={(e) => setPowerup(e.target.value)}
              disabled={disabled}
              className="mt-2 min-h-12 w-full rounded-xl bg-surface p-3"
            >
              <option value="">Kein Power-up</option>
              {(pub.scene?.type === "SHOWDOWN"
                ? [["raise", "Einsatz verdoppeln"]]
                : [
                    ["double", "Eigene Punkte verdoppeln"],
                    ["rebound", "Diese Aufgabe zurückspielen"],
                    ["read", "Auf die nächste Aufgabe des Gegenübers setzen"],
                  ]
              ).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}
      {index === pub.turn &&
        ["roxy-night", "ai-director"].includes(pub.gameId) && (
          <label className="mt-4 block">
            Nächste Richtung
            <select
              value={steer}
              onChange={(e) => setSteer(e.target.value)}
              disabled={disabled}
              className="mt-2 min-h-12 w-full rounded-xl bg-surface p-3"
            >
              <option value="">Den Abend entscheiden lassen</option>
              {[
                ["funnier", "Lustiger"],
                ["flirtier", "Flirtiger"],
                ["game", "Spielerischer"],
                ["hotter", "Heißer · innerhalb eures Rahmens"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}
      <Btn
        className="mt-6 w-full"
        disabled={disabled}
        onClick={() => onSubmit({ ready: true, powerup, steer })}
      >
        {disabled ? "Bereit · wartet auf euch beide" : "Ich bin bereit"}
      </Btn>
    </section>
  );
}

function PairInput({
  pub,
  index,
  disabled,
  submitted,
  secretReady,
  deadline,
  serverNow,
  mission,
  onSubmit,
}: {
  pub: PairPublic;
  index: number;
  disabled: boolean;
  submitted: boolean;
  secretReady: boolean;
  deadline: string | null;
  serverNow?: string | undefined;
  mission: { player: 0 | 1; text: string } | null;
  onSubmit: (p: Record<string, unknown>) => void;
}) {
  const [choice, setChoice] = useState<number | null>(null),
    [own, setOwn] = useState<number | null>(null),
    [value, setValue] = useState(""),
    [artist, setArtist] = useState(""),
    [missionDone, setMissionDone] = useState(false),
    [tick, setTick] = useState(Date.now());
  const offset = useRef(serverNow ? Date.parse(serverNow) - Date.now() : 0);
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setTick(Date.now()), 250);
    return () => clearInterval(t);
  }, [deadline]);
  const sc = pub.scene;
  if (!sc) return null;
  if (!pub.requiredPlayerIds.includes(pub.seats?.[index] ?? ""))
    return (
      <p role="status" className="mt-8 text-muted-foreground">
        {pub.names[pub.turn]} ist dran. Deine Wahl bleibt frei: Überspringen und
        Pause sind jederzeit möglich.
      </p>
    );
  if (submitted)
    return (
      <p role="status" className="mt-8 text-primary">
        Versiegelt. Deine Eingabe bleibt bis zur Auflösung verborgen.
      </p>
    );
  const left = deadline
    ? Math.max(
        0,
        Math.ceil((Date.parse(deadline) - tick - offset.current) / 1000),
      )
    : null;
  const choiceType = ["SYNC", "PREDICTION", "CHOICE"].includes(sc.type);
  const guess =
    sc.type === "MUSIC" && sc.music?.mode === "guess" && index !== pub.turn;
  const textInput = sc.type === "MUSIC";
  return (
    <section className="mt-6">
      {left !== null && (
        <p
          className="font-display text-5xl tabular-nums"
          aria-label={`${left} Sekunden`}
        >
          {left}
          <span className="ml-2 text-sm">Sekunden</span>
        </p>
      )}
      {sc.type === "PREDICTION" && (
        <p className="text-primary">
          {index === pub.turn
            ? `Was wird ${pub.names[1 - pub.turn]} wählen?`
            : "Wähle für dich. Dein Gegenüber sagt deine Wahl voraus."}
        </p>
      )}
      {choiceType && (
        <div
          className="mt-4 space-y-2"
          role="group"
          aria-label="Deine verdeckte Wahl"
        >
          {sc.choices?.map((o, i) => (
            <Btn
              key={i}
              variant={choice === i ? "accent" : "outline"}
              className="h-auto min-h-14 w-full whitespace-normal text-left"
              disabled={disabled}
              aria-pressed={choice === i}
              onClick={() => setChoice(i)}
            >
              {fill(o, pub.names[pub.turn], pub.names[1 - pub.turn]!)}
            </Btn>
          ))}
        </div>
      )}
      {sc.type === "PREDICTION" && index === pub.turn && (
        <label className="mt-4 block">
          Und du selbst? · freiwillig
          <select
            value={own ?? ""}
            disabled={disabled}
            onChange={(e) =>
              setOwn(e.target.value === "" ? null : Number(e.target.value))
            }
            className="mt-2 min-h-12 w-full rounded-xl bg-surface p-3"
          >
            <option value="">Nicht verraten</option>
            {sc.choices?.map((o, i) => (
              <option key={i} value={i}>
                {fill(o, pub.names[pub.turn], pub.names[1 - pub.turn]!)}
              </option>
            ))}
          </select>
        </label>
      )}
      {sc.type === "ROULETTE" && (
        <p className="font-display mt-5 text-3xl">
          {pub.roulette ?? "Gemeinsam ausprobieren."}
        </p>
      )}
      {textInput && (
        <>
          <label className="mt-4 block">
            {guess ? "Deine Vermutung: Song oder Stimmung" : "Dein Songtitel"}
            <input
              maxLength={guess ? 160 : 80}
              disabled={disabled}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4"
            />
          </label>
          {!guess && (
            <label className="mt-4 block">
              Interpret:in · optional
              <input
                maxLength={60}
                disabled={disabled}
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4"
              />
            </label>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Songtitel werden für diese Runde geteilt. Musik spielt ihr auf
            Wunsch in eurer Musik-App ab.
          </p>
        </>
      )}
      {sc.type === "SHOWDOWN" && (
        <>
          <p className="font-display mt-3 text-3xl">
            Einsatz: {pub.stakes} Sparks
          </p>
          <p className="mt-3 text-muted-foreground">
            Wählt beide unabhängig das gemeinsame Ergebnis. Bei Uneinigkeit
            bleibt es unentschieden.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[...pub.names, "Unentschieden"].map((n, i) => (
              <Btn
                key={i}
                aria-pressed={choice === i}
                variant={choice === i ? "accent" : "outline"}
                onClick={() => setChoice(i)}
                disabled={disabled}
              >
                {n}
              </Btn>
            ))}
          </div>
          {mission && (
            <>
              <p className="mt-5">
                Geheime Mission von {pub.names[mission.player]}:{" "}
                {fill(
                  mission.text,
                  pub.names[mission.player],
                  pub.names[1 - mission.player]!,
                )}
              </p>
              <label className="mt-3 flex min-h-12 items-center gap-3">
                <input
                  type="checkbox"
                  checked={missionDone}
                  onChange={(e) => setMissionDone(e.target.checked)}
                  className="size-5"
                />
                Mission erfüllt · zählt nur, wenn beide zustimmen
              </label>
            </>
          )}
        </>
      )}
      <Btn
        className="mt-6 w-full"
        disabled={
          disabled ||
          !secretReady ||
          (choiceType && choice === null) ||
          (textInput && !value.trim()) ||
          (sc.type === "SHOWDOWN" && choice === null)
        }
        onClick={() =>
          onSubmit(
            sc.type === "SHOWDOWN"
              ? { winner: choice === 2 ? null : choice, missionDone }
              : textInput
                ? guess
                  ? { value }
                  : { title: value, artist }
                : choiceType
                  ? { choice, own }
                  : { done: true },
          )
        }
      >
        {choiceType || textInput || sc.type === "SHOWDOWN"
          ? "Verdeckt abgeben"
          : sc.type === "SECRET"
            ? "Gemerkt · geheim halten"
            : "Gemacht / gesagt"}
      </Btn>
    </section>
  );
}

function EndingChoice({
  signature,
  disabled,
  onSubmit,
}: {
  signature: boolean;
  disabled: boolean;
  onSubmit: (p: Record<string, unknown>) => void;
}) {
  const [ending, setEnding] = useState("no-more-game");
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">Wie klingt eure Nacht aus?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ihr wählt beide. Verlängert wird nur, wenn ihr beide After Hours
        möchtet.
      </p>
      <div className="mt-4 space-y-2">
        {[
          ...ENDINGS,
          ...(signature
            ? [
                {
                  id: "after-hours",
                  title: "After Hours",
                  line: "Weiterspielen · vorher bestätigt ihr euren Rahmen neu.",
                },
              ]
            : []),
        ].map((e) => (
          <button
            key={e.id}
            type="button"
            disabled={disabled}
            onClick={() => setEnding(e.id)}
            aria-pressed={ending === e.id}
            className={`tap min-h-16 w-full rounded-xl border p-4 text-left ${ending === e.id ? "border-primary text-primary" : "border-line"}`}
          >
            <span className="block font-display text-xl">{e.title}</span>
            <span className="text-sm">{e.line}</span>
          </button>
        ))}
      </div>
      <Btn
        className="mt-4 w-full"
        disabled={disabled}
        onClick={() => onSubmit({ ending })}
      >
        {disabled ? "Gewählt · wartet auf euch beide" : "Abschluss wählen"}
      </Btn>
    </section>
  );
}
