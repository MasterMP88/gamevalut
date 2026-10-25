import { describe, expect, it } from "vitest";
import {
  actPair,
  controlPair,
  jointSettings,
  pairLobby,
  pairWrite,
  projectPair,
  savedPair,
  startPair,
  type PairRuntime,
} from "@/lib/couple/online";
import { DEFAULT_SETTINGS } from "@/lib/game/engine";
import { GAMES_BY_ID } from "@/lib/game/games";
import type { GameId, Scene } from "@/lib/game/types";
import type { CollectedAction, RoomSnapshot } from "@/lib/gang/room-client";
const snap = {
  players: [
    { id: "a", name: "Ari", active: true, canInput: true },
    { id: "b", name: "Nova", active: true, canInput: true },
  ],
} as RoomSnapshot;
const actions = (
  a: Record<string, unknown>,
  b: Record<string, unknown> = a,
): CollectedAction[] => [
  { playerId: "a", actionType: "pair", payload: a },
  { playerId: "b", actionType: "pair", payload: b },
];
function session(game: GameId = "coop", scene?: Partial<Scene>) {
  let f = startPair(pairLobby(game, 15, "test"), snap);
  f = actPair(f, actions({ adult: true, settings: DEFAULT_SETTINGS }));
  return {
    ...f,
    phase: "answer" as const,
    state: {
      ...f.state!,
      current: scene
        ? {
            id: "fixture",
            type: "SYNC" as const,
            flavor: "game" as const,
            phase: 0,
            title: "Test",
            prompt: "Wählt",
            choices: ["A", "B"],
            ...scene,
          }
        : f.state!.current,
    },
  };
}
describe("two-phone canonical adapter", () => {
  it("requires both independent adult consents and intersects every boundary", () => {
    const f = startPair(pairLobby("coop", 15, "test"), snap);
    expect(
      actPair(
        f,
        actions(
          { adult: true, settings: DEFAULT_SETTINGS },
          { adult: false, settings: DEFAULT_SETTINGS },
        ),
      ).phase,
    ).toBe("paused");
    const permissive = {
      touch: true,
      sensual: true,
      drinks: true,
      signals: true,
      intensityCap: 5,
    };
    expect(jointSettings(permissive, DEFAULT_SETTINGS)).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(
      actPair(f, [actions({ adult: true, settings: permissive })[0]!]),
    ).toBe(f);
  });
  it("waits for two sealed choices, reveals together, then applies the co-op bonus once", () => {
    const f = session("coop", { type: "SYNC" });
    expect(actPair(f, [actions({ choice: 0 })[0]!])).toBe(f);
    const reveal = actPair(f, actions({ choice: 0 }));
    expect(reveal.result?.match).toBe(true);
    expect(reveal.state!.sceneNumber).toBe(f.state.sceneNumber);
    expect(
      actPair(reveal, actions({ ready: true })).state!.energies.connection,
    ).toBeGreaterThan(f.state.energies.connection);
  });
  it("preserves prediction roles when player two is active", () => {
    let f = session("one-two", { type: "PREDICTION" });
    f.state.turn = 1;
    const r = actPair(f, actions({ choice: 1 }, { choice: 0 }));
    expect(r.result?.lines).toEqual(["Nova tippte: A", "Ari: B"]);
    expect(r.result?.match).toBe(false);
  });
  it("never awards player one a win when both select a tie", () => {
    const f = session("battle", { type: "SHOWDOWN" });
    const reveal = actPair(f, actions({ winner: null }));
    expect(reveal.result?.winner).toBeNull();
    expect(actPair(reveal, actions({ ready: true })).state!.sparks).toEqual([
      0, 0,
    ]);
    expect(
      actPair(f, actions({ winner: 0 }, { winner: 1 })).result?.winner,
    ).toBeNull();
  });
  it("keeps secret tasks private and strips memory, AI and song recovery data", () => {
    const f = session("battle", { type: "SECRET", prompt: "Hidden task" });
    expect(JSON.stringify(projectPair(f))).not.toContain("Hidden task");
    const p = pairWrite(f).payloads;
    expect(p[0]!.payload.secret).toBe("Hidden task");
    expect(p[1]!.payload.secret).toBeNull();
    f.state.anchors = [
      {
        id: "x",
        owner: "Ari",
        shortText: "sensitive memory",
        tags: [],
        sceneNumber: 1,
        sensitivity: "normal",
        dueAt: 5,
        used: false,
      },
    ];
    f.state.current = {
      ...f.state.current!,
      type: "ECHO",
      prompt: "sensitive memory",
      anchorId: "x",
      source: "echo",
    };
    f.state.tracklist = [
      { title: "personal song", n: 1, owner: 0, prompt: "", mode: "solo" },
    ];
    const saved = JSON.stringify(savedPair(f));
    expect(saved).not.toContain("sensitive memory");
    expect(saved).not.toContain("personal song");
    expect(JSON.stringify(projectPair(f))).not.toContain("sensitive memory");
  });
  it("lets either player skip with no penalty and pause before sealed answers resolve", () => {
    const f = session("battle", { type: "MISSION" });
    f.state.sparks = [5, 6];
    expect(controlPair(f, ["skip"]).state!.sparks).toEqual([5, 6]);
    expect(controlPair(f, ["skip", "pause"]).phase).toBe("paused");
    expect(controlPair(f, ["pause", "finish"]).phase).toBe("end");
  });
  it("keeps duet picks in canonical tracklist and preserves all titles through a full short night", () => {
    let f = session("pass-the-aux", { type: "MUSIC", music: { mode: "duet" } });
    f = actPair(
      f,
      actions({ title: "Song A", artist: "Artist A" }, { title: "Song B" }),
    ) as ReturnType<typeof session>;
    const next = actPair(f, actions({ ready: true }));
    expect(next.state!.tracklist?.map((t) => t.title)).toEqual([
      "Song A",
      "Song B",
    ]);
  });
  it.each(Object.keys(GAMES_BY_ID) as GameId[])(
    "%s completes through the canonical engine in a short format",
    (game) => {
      let f: PairRuntime = session(game);
      for (let n = 0; n < 200 && f.phase !== "end"; n++) {
        if (f.phase === "ready") f = actPair(f, actions({ ready: true }));
        else if (f.phase === "reveal") f = actPair(f, actions({ ready: true }));
        else
          f = actPair(
            f,
            actions({
              choice: 0,
              title: "Different song",
              winner: null,
              done: true,
              value: "a vibe",
            }),
          );
      }
      expect(f.phase).toBe("end");
      expect(f.state!.finished).toBe(true);
      expect(f.state!.log.length).toBeGreaterThan(0);
    },
  );
  it("does not invent a successful speed-song input after timeout", () => {
    const f = session("pass-the-aux", {
      type: "MUSIC",
      music: { mode: "speed" },
    });
    const next = actPair(f, actions({ timedOut: true }));
    expect(next.state!.tracklist).toEqual([]);
    expect(next.state!.log.at(-1)?.outcome).toBe("skipped");
  });
  it("timer expiry ends the action but still asks both whether to complete it", () => {
    const f = session("coop", { type: "TIMER", duration: 20 });
    const next = actPair(f, actions({ timedOut: true }));
    expect(next.phase).toBe("reveal");
    expect(next.state!.sceneNumber).toBe(f.state.sceneNumber);
  });
  it("extends only after mutual After Hours choice and renews both personal consents", () => {
    const base = session("ai-director");
    const ended = controlPair(base, ["finish"]);
    const mismatch = actPair(
      ended,
      actions({ ending: "after-hours" }, { ending: "no-more-game" }),
    );
    expect(mismatch.phase).toBe("end");
    expect(mismatch.state!.ending).toBe("no-more-game");
    const extended = actPair(ended, actions({ ending: "after-hours" }));
    expect(extended.phase).toBe("paused");
    expect(extended.state!.afterHours).toBe(true);
  });
  it("records only the partner's explicit music reaction", () => {
    const f = session("pass-the-aux", {
      type: "MUSIC",
      music: { mode: "solo" },
    });
    const reveal = actPair(f, actions({ title: "A song" }));
    const next = actPair(
      reveal,
      actions(
        { ready: true, reaction: "twist" },
        { ready: true, reaction: "match" },
      ),
    );
    expect(next.state!.tracklist?.[0]?.reaction).toBe("match");
  });
});
