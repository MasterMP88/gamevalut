import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCouchSession, reduceCouch } from "@/lib/gang/core/couch";
import {
  couchScreenSchema,
  couchScreenWrite,
  projectCouchScreen,
} from "@/lib/gang/couch-screen";
import { GANG_EXPERIENCES } from "@/lib/gang/core/experience";
import type { GangGameId } from "@/lib/gang/core/playbooks";
import { createRoomClient, type RoomSnapshot } from "@/lib/gang/room-client";
import { CouchTVStage } from "@/components/gang/CouchTV";

const controller = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const make = () =>
  createCouchSession({ gameId: "the-majority", playerCount: 8, seed: 42 });
const snapshot = (publicState: unknown = {}, version = 1) =>
  ({
    isFacilitator: true,
    phase: "playing",
    version,
    publicState,
  }) as RoomSnapshot;
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  sessionStorage.clear();
});

describe("Couch TV public projection", () => {
  it("covers all nine supported titles without publishing the deck or raw runtime", () => {
    const games = Object.entries(GANG_EXPERIENCES).filter(([, e]) => e.couch);
    expect(games).toHaveLength(9);
    for (const [id] of games) {
      let state = createCouchSession({
        gameId: id as GangGameId,
        playerCount: 12,
        seed: 42,
      });
      state = reduceCouch(reduceCouch(state, { type: "NEXT", at: 1000 }), {
        type: "NEXT",
        at: 1000,
      });
      const view = projectCouchScreen(state, controller, 500, 2000);
      expect(couchScreenSchema.safeParse(view).success).toBe(true);
      expect(view).not.toHaveProperty("deck");
      expect(view).not.toHaveProperty("history");
      expect(view).not.toHaveProperty("result");
      expect(JSON.stringify(view)).not.toContain(state.deck[1]!.id);
      expect(
        couchScreenSchema.safeParse({ ...view, deck: state.deck }).success,
      ).toBe(false);
    }
  });
  it("does not transmit local song filenames, URLs or titles even during reveal", () => {
    const state = createCouchSession({
      gameId: "music-drop",
      playerCount: 6,
      seed: 1,
      musicMode: "local",
    });
    state.deck[0] = { ...state.deck[0]!, prompt: "PRIVATE_FILE.mp3" };
    for (const phase of ["play", "reveal", "finale"] as const) {
      const view = projectCouchScreen({ ...state, phase }, controller, 0, 1000);
      expect(JSON.stringify(view)).not.toMatch(
        /PRIVATE_FILE|SECRET TITLE|blob:/,
      );
    }
  });
  it("pauses with seconds, never milliseconds, and removes the current options", () => {
    let s = reduceCouch(reduceCouch(make(), { type: "NEXT", at: 1000 }), {
      type: "NEXT",
      at: 1000,
    });
    s = reduceCouch(s, { type: "PAUSE", at: 2000 });
    const view = projectCouchScreen(s, controller, 0, 5000);
    expect(view.seconds).toBe(Math.ceil(s.remaining! / 1000));
    expect(view.options).toEqual([]);
    expect(view.heading).toBe("Kurz durchatmen.");
  });
  it("does not overwrite a newer controller even after a membership CAS conflict", async () => {
    const own = projectCouchScreen(make(), controller, 1000, 2000);
    const newer = { ...own, controller: other, startedAt: 3000 };
    const rpc = vi.fn(async (fn: string) =>
      fn === "gang_set_room_state"
        ? { data: null, error: { message: "version_conflict" } }
        : { data: snapshot(newer, 3), error: null },
    );
    const client = createRoomClient(rpc);
    await expect(
      client.setState("private-token", snapshot(), (s) =>
        couchScreenWrite(s, own),
      ),
    ).rejects.toMatchObject({ code: "controller_changed" });
    expect(
      rpc.mock.calls.filter(([fn]) => fn === "gang_set_room_state"),
    ).toHaveLength(1);
  });
  it("permits a deliberate reload recovery, but never a display or a closed room", () => {
    const old = projectCouchScreen(make(), controller, 1000, 2000);
    const next = { ...old, controller: other, startedAt: 3000 };
    expect(couchScreenWrite(snapshot(old), next).publicState).toEqual(next);
    expect(() =>
      couchScreenWrite({ ...snapshot(), isFacilitator: false }, next),
    ).toThrow();
    expect(() =>
      couchScreenWrite({ ...snapshot(), phase: "finished" }, next),
    ).toThrow();
  });
  it("repeated polls cannot hide a stale controller and a new heartbeat restores the screen", () => {
    vi.useFakeTimers();
    const view = projectCouchScreen(make(), controller, 0, 1000);
    const { rerender } = render(<CouchTVStage view={view} />);
    act(() => vi.advanceTimersByTime(20000));
    rerender(<CouchTVStage view={{ ...view }} />);
    act(() => vi.advanceTimersByTime(11000));
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Verbindung zur Spielleitung unterbrochen",
    );
    rerender(<CouchTVStage view={{ ...view, sentAt: 40000 }} />);
    expect(screen.getByRole("heading")).not.toHaveTextContent("unterbrochen");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
