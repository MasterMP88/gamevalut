import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoomClient, joinUrl, screenUrl, sessionStore, type Rpc, type RoomSnapshot } from "@/lib/gang/room-client";
import { fakeServer } from "./gang-fake-server";

beforeEach(() => sessionStorage.clear());

describe("GANG room client", () => {
  it("join and screen URLs carry only the room code, never the player token", async () => {
    const srv = fakeServer();
    const c = createRoomClient(srv.rpc);
    const { session, snapshot } = await c.create("Host", "catalog", 12);
    const j = joinUrl("https://x.test", snapshot.code);
    const s = screenUrl("https://x.test", snapshot.code);
    expect(j).toBe(`https://x.test/gang?join=${snapshot.code}`);
    expect(s).toBe(`https://x.test/gang?screen=${snapshot.code}`);
    expect(j).not.toContain(session.token);
    expect(s).not.toContain(session.token);
  });

  it("create + join store the token session-scoped and restore it after reload", async () => {
    const srv = fakeServer();
    const c = createRoomClient(srv.rpc);
    const host = await c.create("Host", "mix", 8);
    expect(sessionStore.get("player")?.token).toBe(host.session.token);
    const guest = await c.join(host.snapshot.code.toLowerCase(), "Mia");
    expect(guest.snapshot.players.filter((p) => p.canInput)).toHaveLength(2);
    const restored = sessionStore.get("player")!;
    expect(restored.code).toBe(host.snapshot.code);
    const snap = await c.snapshot(restored.token);
    expect(snap.playerId).toBe(guest.snapshot.playerId);
    expect(localStorage.length).toBe(0);
  });

  it("version_conflict refetches the snapshot and retries exactly once — never forces", async () => {
    const base = { version: 3, isFacilitator: true } as RoomSnapshot;
    const rpc = vi.fn<Rpc>(async (fn, args) => {
      if (fn === "gang_room_snapshot") return { data: { ...base, version: 7 }, error: null };
      if (fn === "gang_set_room_state") return args["p_expected_version"] === 7 ? { data: { ...base, version: 8 }, error: null } : { data: null, error: { message: "version_conflict" } };
      return { data: null, error: null };
    });
    const c = createRoomClient(rpc);
    const write = { phase: "lobby" as const, gameId: null, roundKey: "lobby-0", stage: "lobby", publicState: {} };
    const out = await c.setState("t", base, () => write);
    expect(out.version).toBe(8);
    expect(rpc.mock.calls.filter(([f]) => f === "gang_set_room_state").map(([, a]) => a["p_expected_version"])).toEqual([3, 7]);
    expect(rpc.mock.calls.filter(([f]) => f === "gang_room_snapshot")).toHaveLength(1);

    const always = vi.fn<Rpc>(async (fn) => fn === "gang_room_snapshot" ? { data: { ...base, version: 9 }, error: null } : { data: null, error: { message: "version_conflict" } });
    await expect(createRoomClient(always).setState("t", base, () => write)).rejects.toMatchObject({ code: "version_conflict" });
    expect(always.mock.calls.filter(([f]) => f === "gang_set_room_state")).toHaveLength(2);
  });

  it("display join is a non-input device and does not consume a player seat or the player session", async () => {
    const srv = fakeServer();
    const c = createRoomClient(srv.rpc);
    const host = await c.create("Host", "catalog", 2);
    const tv = await c.joinDisplay(host.snapshot.code);
    const me = tv.snapshot.players.find((p) => p.id === tv.snapshot.playerId)!;
    expect(me.canInput).toBe(false);
    expect(sessionStore.get("display")?.token).toBe(tv.session.token);
    expect(sessionStore.get("player")?.token).toBe(host.session.token);
    expect(tv.snapshot.players.filter((p) => p.canInput && p.active)).toHaveLength(1);
  });
});
