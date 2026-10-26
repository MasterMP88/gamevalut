/** Two-phone presentation adapter. Every game decision stays in the canonical couple reducer. */
import {
  createSession,
  DEFAULT_SETTINGS,
  fill,
  reducer,
  nightSignature,
} from "../game/engine";
import { GAMES_BY_ID } from "../game/games";\nimport { sameSong } from "../music/provider";
import type { Action } from "../game/engine";
import type {
  ConsentSettings,
  GameId,
  Scene,
  SessionState,
  Track,
  PowerUp,
  MusicReaction,
} from "../game/types";
import type { CollectedAction, RoomSnapshot } from "../gang/room-client";

export type PairPhase =
  "lobby" | "consent" | "ready" | "answer" | "reveal" | "paused" | "end";
export interface PairRuntime {
  protocol: "couple-1";
  key: string;
  epoch: number;
  seats: [string, string] | null;
  gameId: GameId;
  duration: 15 | 30 | 60 | null;
  phase: PairPhase;
  state: SessionState | null;
  result: {
    label: string;
    lines: string[];
    match?: boolean;
    winner?: 0 | 1 | null;
    missionDone?: boolean;
  } | null;
}
export interface PairPublic {
  kind: "couple";
  gameId: GameId;
  phase: PairPhase;
  epoch: number;
  seats: [string, string] | null;
  names: [string, string];
  turn: 0 | 1;
  scene: Scene | null;
  number: number;
  target: number | null;
  duration: 15 | 30 | 60 | null;
  sparks: [number, number];
  powerUps: [number, number];
  energies: SessionState["energies"];
  milestones: string[];
  tempo: SessionState["tempo"];
  settings: ConsentSettings;
  result: PairRuntime["result"];
  roulette: string | null;
  signature: { name: string; line: string; done: number } | null;
  ending: SessionState["ending"];
  stakes: number;
  requiredPlayerIds: string[];
  view: { timed: boolean; seconds: number; input: string };
}
export const pairPublic = (s: RoomSnapshot | null): PairPublic | null =>
  s?.publicState?.["kind"] === "couple"
    ? (s.publicState as unknown as PairPublic)
    : null;
export const pairKey = (f: PairRuntime) => `${f.key}:${f.epoch}`;
export function pairLobby(
  gameId: GameId,
  duration: PairRuntime["duration"],
  key: string = crypto.randomUUID(),
): PairRuntime {
  return {
    protocol: "couple-1",
    key,
    epoch: 0,
    seats: null,
    gameId,
    duration,
    phase: "lobby",
    state: null,
    result: null,
  };
}
function move(f: PairRuntime, phase: PairPhase): PairRuntime {
  return { ...f, phase, epoch: f.epoch + 1 };
}
export function startPair(
  f: PairRuntime,
  snap: RoomSnapshot,
  seenIds: string[] = [],
): PairRuntime {
  const seats = snap.players.filter((p) => p.active && p.canInput).slice(0, 2);
  if (seats.length !== 2 || f.phase !== "lobby") return f;
  return move(
    {
      ...f,
      seats: [seats[0]!.id, seats[1]!.id],
      state: createSession(
        f.gameId,
        [seats[0]!.name, seats[1]!.name],
        DEFAULT_SETTINGS,
        undefined,
        { durationMinutes: f.duration, seenIds },
      ),
    },
    "consent",
  );
}
export function requiredPair(f: PairRuntime): string[] {
  if (
    !f.state ||
    !f.seats ||
    f.phase === "lobby" ||
    (f.phase === "end" && f.state.ending)
  )
    return [];
  const sc = f.state.current;
  if (
    f.phase === "answer" &&
    sc &&
    !["SYNC", "PREDICTION", "SHOWDOWN"].includes(sc.type) &&
    !(sc.type === "MUSIC" && ["duet", "guess"].includes(sc.music?.mode ?? ""))
  )
    return [f.seats[f.state.turn]];
  return [...f.seats];
}
/** Only local, authored content may enter the public snapshot. Echo text stays on its host device. */
function transportScene(sc: Scene | null): Scene | null {
  if (!sc) return null;
  if (sc.source === "echo" || sc.anchorId)
    return {
      id: sc.id,
      type: "ECHO",
      phase: sc.phase,
      flavor: sc.flavor,
      title: "Euer Echo",
      prompt:
        "Auf dem Host-Handy steht euer Echo. Lest es gemeinsam und antwortet laut.",
      source: "local",
    };
  if (sc.source === "ai") return null;
  return { ...sc, capture: undefined };
}
export function projectPair(f: PairRuntime): PairPublic {
  const s = f.state,
    sc = s?.current ?? null;
  const timed =
    f.phase === "answer" &&
    !!sc &&
    (sc.type === "TIMER" ||
      !!sc.duration ||
      (sc.type === "MUSIC" && sc.music?.mode === "speed"));
  const secret = sc?.type === "SECRET";
  const scene = secret
    ? {
        ...transportScene(sc)!,
        prompt:
          "Eine geheime Aufgabe. Nur die Person am Zug sieht sie auf ihrem Handy.",
        helper: undefined,
        choices: undefined,
      }
    : transportScene(sc);
  return {
    kind: "couple",
    gameId: f.gameId,
    phase: f.phase,
    epoch: f.epoch,
    seats: f.seats,
    names: s?.players ?? ["", ""],
    turn: s?.turn ?? 0,
    scene,
    number: s?.sceneNumber ?? 0,
    target: s?.targetScenes ?? null,
    duration: f.duration,
    sparks: s?.sparks ?? [0, 0],
    powerUps: s?.powerUps ?? [0, 0],
    energies: s?.energies ?? { chaos: 0, connection: 0, heat: 0 },
    milestones: s?.milestones ?? [],
    tempo: s?.tempo ?? null,
    settings: s?.settings ?? DEFAULT_SETTINGS,
    result: f.result,
    roulette:
      sc?.type === "ROULETTE" && sc.choices?.length && f.phase !== "ready"
        ? fill(
            sc.choices[(s!.seed >>> 0) % sc.choices.length]!,
            s!.players[s!.turn],
            s!.players[1 - s!.turn]!,
          )
        : null,
    ending: s?.ending ?? null,
    stakes: s?.raise ? 6 : 3,
    signature: s?.finished
      ? (({ name, line, done }) => ({ name, line, done }))(nightSignature(s))
      : null,
    requiredPlayerIds: requiredPair(f),
    view: { timed, seconds: sc?.duration ?? 25, input: "pair" },
  };
}
/** Facilitator recovery contains no typed memories, songs or AI text. They remain in device memory. */
export function savedPair(f: PairRuntime): Record<string, unknown> {
  return {
    ...f,
    result:
      f.state?.current?.type === "MUSIC"
        ? {
            label: "Musikrunde",
            lines: [
              "Songauswahl nach dem Gerätewechsel erneut gemeinsam besprechen.",
            ],
          }
        : f.result,
    state: f.state
      ? {
          ...f.state,
          anchors: [],
          aiQueue: [],
          current: transportScene(f.state.current),
          tracklist: [],
          musicRound: null,
        }
      : null,
  };
}
export function pairWrite(f: PairRuntime) {
  const pub = projectPair(f),
    s = f.state;
  return {
    write: {
      phase:
        f.phase === "lobby"
          ? ("lobby" as const)
          : f.phase === "end"
            ? ("finished" as const)
            : f.phase === "paused"
              ? ("paused" as const)
              : ("playing" as const),
      gameId: `couple/${f.gameId}`,
      roundKey: pairKey(f),
      stage: f.phase,
      publicState: pub as unknown as Record<string, unknown>,
    },
    runtime: savedPair(f),
    payloads: (f.seats ?? []).map((id, i) => ({
      playerId: id,
      payload: {
        secret:
          s?.current?.type === "SECRET" && i === s.turn
            ? s.current.prompt
            : null,
        mission: s?.current?.type === "SHOWDOWN" ? s.secretMission : null,
      },
    })),
  };
}
function settings(p: Record<string, unknown>): ConsentSettings | null {
  const x = p["settings"] as Partial<ConsentSettings> | undefined;
  if (
    p["adult"] !== true ||
    !x ||
    !["touch", "sensual", "drinks", "signals"].every(
      (k) => typeof x[k as keyof ConsentSettings] === "boolean",
    )
  )
    return null;
  return {
    touch: !!x.touch,
    sensual: !!x.sensual,
    drinks: !!x.drinks,
    signals: !!x.signals,
    intensityCap: Math.max(
      1,
      Math.min(5, Number.isInteger(x.intensityCap) ? x.intensityCap! : 3),
    ),
  };
}
export function jointSettings(
  a: ConsentSettings,
  b: ConsentSettings,
): ConsentSettings {
  return {
    touch: a.touch && b.touch,
    sensual: a.sensual && b.sensual,
    drinks: a.drinks && b.drinks,
    signals: a.signals && b.signals,
    intensityCap: Math.min(a.intensityCap, b.intensityCap),
  };
}
const pick = (p: Record<string, unknown>, max: number) =>
  Number.isInteger(p["choice"]) &&
  Number(p["choice"]) >= 0 &&
  Number(p["choice"]) < max
    ? Number(p["choice"])
    : null;
const track = (p: Record<string, unknown>): Track | null =>
  typeof p["title"] === "string" && p["title"].trim()
    ? {
        title: p["title"].trim().slice(0, 80),
        artist:
          typeof p["artist"] === "string"
            ? p["artist"].trim().slice(0, 60)
            : undefined,
      }
    : null;
const text = (p: Record<string, unknown>) =>
  typeof p["value"] === "string" ? p["value"].trim().slice(0, 160) : "";
export function actPair(
  f: PairRuntime,
  actions: CollectedAction[],
  capture?: { text: string; private: boolean },
): PairRuntime {
  if (!f.state || !f.seats) return f;
  const s = f.state,
    sc = s.current;
  const by = new Map(actions.map((a) => [a.playerId, a.payload]));
  if (!requiredPair(f).every((id) => by.has(id))) return f;
  const a = by.get(f.seats[0]) ?? {},
    b = by.get(f.seats[1]) ?? {},
    me = by.get(f.seats[s.turn]) ?? {},
    you = by.get(f.seats[1 - s.turn]!) ?? {};
  const apply = (action: Action) => {
    const state = reducer(s, action);
    return move(
      { ...f, state, result: null },
      state.finished ? "end" : "ready",
    );
  };
  if (f.phase === "end") {
    const endings = ["slow-burn", "beautiful-chaos", "no-more-game"];
    if (
      a["ending"] === "after-hours" &&
      b["ending"] === "after-hours" &&
      GAMES_BY_ID[f.gameId].signature
    )
      return move(
        { ...f, state: reducer(s, { type: "AFTER_HOURS" }) },
        "paused",
      );
    const ending =
      a["ending"] === b["ending"] && endings.includes(String(a["ending"]))
        ? (a["ending"] as NonNullable<SessionState["ending"]>)
        : "no-more-game";
    return move({ ...f, state: reducer(s, { type: "ENDING", ending }) }, "end");
  }
  if (f.phase === "consent" || f.phase === "paused") {
    const x = settings(a),
      y = settings(b);
    if (!x || !y) return move(f, "paused");
    const seen = [a["seen"], b["seen"]].flatMap((v) =>
      Array.isArray(v)
        ? v
            .filter(
              (id): id is string =>
                typeof id === "string" &&
                /^[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,119}$/.test(id),
            )
            .slice(-200)
        : [],
    );
    const state =
      f.phase === "consent"
        ? createSession(f.gameId, s.players, jointSettings(x, y), s.seed, {
            durationMinutes: f.duration,
            seenIds: [...new Set([...(s.seenIds ?? []), ...seen])],
          })
        : reducer(s, { type: "SETTINGS", settings: jointSettings(x, y) });
    return move({ ...f, state }, "ready");
  }
  if (f.phase === "ready") {
    let state = s;
    if (
      ["double", "raise", "rebound", "read"].includes(String(me["powerup"])) &&
      f.gameId === "battle"
    )
      state = reducer(state, {
        type: "USE_POWERUP",
        kind: me["powerup"] as PowerUp,
      });
    if (["funnier", "flirtier", "game", "hotter"].includes(String(me["steer"])))
      state = reducer(state, {
        type: "STEER",
        steer: me["steer"] as SessionState["steer"],
      });
    return move({ ...f, state }, "answer");
  }
  if (f.phase === "reveal") {
    if (sc?.type === "SHOWDOWN")
      return apply({
        type: "SHOWDOWN_WIN",
        winner: f.result?.winner ?? null,
        missionDone: f.result?.missionDone ?? false,
      });
    if (sc?.type === "MUSIC" && s.musicRound) {
      const mode = sc.music?.mode ?? "solo";
      const exactMatch =
        mode === "duet" &&
        sameSong(s.musicRound.picks[0], s.musicRound.picks[1]);
      const reactionOwner = mode === "guess" ? me : you;
      const allowedReactions: MusicReaction[] = [
        "same-energy",
        "twist",
        "explains",
        "no-questions",
        "read-hit",
      ];
      const humanReaction = allowedReactions.includes(
        reactionOwner["reaction"] as MusicReaction,
      )
        ? (reactionOwner["reaction"] as MusicReaction)
        : null;
      const reaction: MusicReaction | null = exactMatch ? "match" : humanReaction;
      // Blind duet differences and READ//THE TRACK need a real human verdict.
      if (mode === "duet" && !exactMatch && !reaction) return f;
      if (mode === "guess" && !reaction) return f;
      const state = reducer(
        reducer(s, { type: "MUSIC", round: { ...s.musicRound, reaction } }),
        { type: "DONE" },
      );
      return move(
        { ...f, state, result: null },
        state.finished ? "end" : "ready",
      );
    }
    return apply({
      type: "DONE",
      ...(f.result?.match !== undefined ? { syncMatch: f.result.match } : {}),
      ...(capture ? { capture } : {}),
    });
  }
  if (f.phase !== "answer" || !sc) return f;
  if (requiredPair(f).some((id) => by.get(id)?.["timedOut"])) {
    if (sc.type === "MUSIC" && sc.music?.mode === "speed") {
      // QUICK DRAW has no fail state. After the deadline, reopen the same scene
      // without a clock and turn the miss into the SECOND THOUGHT rule.
      const expired = reducer(s, {
        type: "MUSIC",
        round: {
          sceneNumber: s.sceneNumber,
          stage: "pick",
          picks: [null, null],
          prediction: null,
          reaction: null,
          speedExpired: true,
        },
      });
      const current = expired.current
        ? {
            ...expired.current,
            duration: undefined,
            helper:
              "SECOND THOUGHT · Der erste Gedanke war zu langsam. Nimm jetzt bewusst deinen zweiten.",
          }
        : null;
      return move(
        { ...f, state: { ...expired, current }, result: null },
        "answer",
      );
    }
    if (sc.type === "TIMER" || (sc.type === "MISSION" && sc.duration))
      return move(
        {
          ...f,
          result: {
            label: "Zeit ist um",
            lines: [
              "Aufgabe beendet? Bestätigt beide oder überspringt ohne Punktverlust.",
            ],
          },
        },
        "reveal",
      );
    return apply({ type: "SKIP" });
  }
  const opts = sc.choices ?? [],
    choice = pick(me, opts.length),
    other = pick(you, opts.length);
  const label = (i: number) =>
    fill(opts[i] ?? "", s.players[s.turn], s.players[1 - s.turn]!);
  let result: PairRuntime["result"] = { label: "Gemeinsam erlebt", lines: [] };
  let state = s;
  if (sc.type === "SYNC" || sc.type === "PREDICTION") {
    if (choice === null || other === null) return apply({ type: "SKIP" });
    const match = choice === other;
    result = {
      label:
        sc.type === "SYNC"
          ? match
            ? "Gleiche Frequenz"
            : "Zwei Richtungen"
          : match
            ? "Zu gut gelesen."
            : "Okay. Plot Twist.",
      match,
      lines: [
        `${s.players[s.turn]}${sc.type === "PREDICTION" ? " tippte" : ""}: ${label(choice)}`,
        `${s.players[1 - s.turn]}: ${label(other)}`,
        ...(sc.type === "PREDICTION" &&
        pick({ choice: me["own"] }, opts.length) !== null
          ? [`${s.players[s.turn]} selbst: ${label(Number(me["own"]))}`]
          : []),
      ],
    };
  } else if (sc.type === "SHOWDOWN") {
    const win =
      typeof a["winner"] === "number" &&
      [0, 1].includes(a["winner"]) &&
      a["winner"] === b["winner"]
        ? (Number(a["winner"]) as 0 | 1)
        : null;
    result = {
      label:
        win === null
          ? "Unentschieden · keine Einigung nötig"
          : `${s.players[win]} gewinnt`,
      lines: [],
      winner: win,
      missionDone: a["missionDone"] === true && b["missionDone"] === true,
    };
  } else if (sc.type === "MUSIC") {
    const mode = sc.music?.mode ?? "solo",
      first = track(me),
      second = mode === "duet" ? track(you) : null;
    if (!first || (mode === "duet" && !second)) return apply({ type: "SKIP" });
    const exactMatch = mode === "duet" && !!second && sameSong(first, second);
    state = reducer(state, {
      type: "MUSIC",
      round: {
        sceneNumber: s.sceneNumber,
        stage: "reveal",
        picks: [first, second],
        prediction: mode === "guess" ? text(you) : null,
        reaction: exactMatch ? "match" : null,
        speedExpired: s.musicRound?.speedExpired ?? false,
      },
    });
    // Song strings are deliberately not copied into the saved runtime. The explicit sealed picks
    // travel through the short-lived room; finished personal tracklists remain on the host device.
    result = {
      label:
        exactMatch
          ? "SAME BRAIN"
          : mode === "guess"
            ? "READ//THE TRACK"
            : mode === "consensus"
              ? "ONE ROOM · ONE TRACK"
              : "Euer Reveal",
      match: exactMatch,
      lines: [
        first.title + (first.artist ? ` — ${first.artist}` : ""),
        ...(second
          ? [second.title + (second.artist ? ` — ${second.artist}` : "")]
          : []),
        ...(mode === "guess" ? [`Read: ${text(you)}`] : []),
      ],
    };
  } else if (sc.type === "CHOICE") {
    if (choice === null) return apply({ type: "SKIP" });
    result = { label: "Eure Wahl", lines: [label(choice)] };
  } else if (sc.type === "ROULETTE" && opts.length)
    result = {
      label: "Der Zufall hat gesprochen",
      lines: [label((s.seed >>> 0) % opts.length)],
    };
  else if (sc.type === "SECRET") return apply({ type: "DONE" });
  return move({ ...f, state, result }, "reveal");
}
export function controlPair(f: PairRuntime, kinds: string[]): PairRuntime {
  if (!f.state || f.phase === "end") return f;
  if (kinds.includes("finish"))
    return move(
      { ...f, state: reducer(f.state, { type: "FINISH" }), result: null },
      "end",
    );
  if (kinds.includes("pause")) return move({ ...f, result: null }, "paused");
  if (kinds.includes("skip") && !["paused", "consent"].includes(f.phase)) {
    const state = reducer(f.state, { type: "SKIP" });
    return move(
      { ...f, state, result: null },
      state.finished ? "end" : "ready",
    );
  }
  return f;
}
