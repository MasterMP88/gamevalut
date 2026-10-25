import { describe, expect, it } from "vitest";
import { createSession, reducer, DEFAULT_SETTINGS } from "@/lib/game/engine";
import { CONTENT_VERSION, STATE_VERSION, restore, sanitizeForSave, toRow } from "@/lib/game/persist";
import { isUnlocked } from "@/lib/entitlements";
import { publicPaths, sitemapXml } from "@/lib/seo";
import { safeRedirect } from "@/routes/auth";
import type { SessionState } from "@/lib/game/types";

function played(): SessionState {
  let s = createSession("night-echo", ["Ari", "Nova"], DEFAULT_SETTINGS, 5);
  s = reducer(s, { type: "DONE" });
  return {
    ...s,
    anchors: [{ id: "a1", owner: "Ari", shortText: "sehr privater Satz", tags: [], sceneNumber: 1, sensitivity: "normal", dueAt: 4, used: false }],
    aiQueue: [{ ...s.current!, id: "ai1", source: "ai", prompt: "zitiert sehr privater Satz" }],
  };
}

describe("auto-save never stores intimate free-text", () => {
  it("drops anchors and the AI queue", () => {
    const row = toRow(played(), "u1", 1);
    expect(JSON.stringify(row)).not.toContain("sehr privater Satz");
    expect(row.state.anchors).toEqual([]);
    expect(row.state.aiQueue).toEqual([]);
  });
  it("drops a current scene that is not from the local bank", () => {
    const s = played();
    expect(sanitizeForSave({ ...s, current: { ...s.current!, source: "echo" } }).current).toBeNull();
  });
});

describe("resume restores the exact playable state", () => {
  it("round-trips scene, turn and current scene", () => {
    const s = played();
    const row = toRow(s, "u1", 3);
    const r = restore({ game_id: row.game_id, state: JSON.parse(JSON.stringify(row.state)), state_version: row.state_version, content_version: row.content_version });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.sceneNumber).toBe(s.sceneNumber);
    expect(r.state.turn).toBe(s.turn);
    expect(r.state.current?.id).toBe(s.current?.id);
    expect(r.migrated).toBe(false);
  });
  it("re-picks a scene when one was stripped for privacy", () => {
    const s = played();
    const r = restore({ game_id: "night-echo", state: { ...sanitizeForSave(s), current: null }, state_version: STATE_VERSION, content_version: CONTENT_VERSION });
    expect(r.ok && r.state.current).toBeTruthy();
  });
  it("rejects an incompatible state version instead of corrupting it", () => {
    expect(restore({ game_id: "night-echo", state: played(), state_version: STATE_VERSION + 1, content_version: CONTENT_VERSION })).toEqual({ ok: false, reason: "incompatible" });
  });
  it("rejects a mismatched game", () => {
    expect(restore({ game_id: "battle", state: played(), state_version: STATE_VERSION, content_version: CONTENT_VERSION }).ok).toBe(false);
  });
  it("finished sessions are saved as completed, not active", () => {
    const row = toRow(reducer(played(), { type: "FINISH" }), "u1", 2);
    expect(row.status).toBe("completed");
    expect(row.completed_at).not.toBeNull();
  });
  it("battle rows carry scores, chapter and the current player", () => {
    const row = toRow(createSession("battle", ["A", "B"], DEFAULT_SETTINGS, 1), "u1", 1);
    expect(row.scores).not.toBeNull();
    expect(row.chapter).toBe(1);
    expect(row.current_player).toBe(0);
  });
});

describe("entitlements", () => {
  it("all eight games are free today", () => {
    for (const id of ["roxy-after-dark", "after-dark-2", "roxy-night", "battle", "coop", "one-two", "night-echo", "ai-director"] as const) expect(isUnlocked(id, [])).toBe(true);
  });
});

describe("public vs private routes", () => {
  it("sitemap lists home, /gang and all 9 game pages, never private routes", () => {
    expect(publicPaths()).toHaveLength(11);
    expect(publicPaths()).toContain("/game/pass-the-aux");
    expect(publicPaths()).toContain("/gang");
    const xml = sitemapXml();
    for (const p of ["/tonight", "/auth", "/reset-password"]) expect(xml).not.toContain(p);
  });
  it("login redirect only accepts same-origin paths", () => {
    expect(safeRedirect("https://evil.example")).toBe("/tonight");
    expect(safeRedirect("//evil.example")).toBe("/tonight");
    expect(safeRedirect("/game/heatcheck?play=1")).toBe("/game/heatcheck?play=1");
  });
});
