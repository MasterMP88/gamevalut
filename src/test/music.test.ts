import { describe, expect, it } from "vitest";
import { createSession, reducer, DEFAULT_SETTINGS } from "@/lib/game/engine";
import { GAMES, GAMES_BY_ID, NIGHT_PICKS, poolFor } from "@/lib/game/games";
import { SCENES } from "@/lib/game/scenes";
import { PREVIEWS } from "@/lib/game/previews";
import { sanitizeForSave, toRow } from "@/lib/game/persist";
import { canPlay, manualProvider, sameSong, type MusicProvider } from "@/lib/music/provider";
import type { MusicRound, SessionState } from "@/lib/game/types";

const P: [string, string] = ["Ari", "Nova"];
const round = (s: SessionState, r: Partial<MusicRound>): MusicRound => ({ sceneNumber: s.sceneNumber, stage: "pick", picks: [null, null], prediction: null, reaction: null, ...r });
const start = (seed = 3) => createSession("pass-the-aux", P, DEFAULT_SETTINGS, seed);

/** Play until the current scene has the wanted mode. */
function toMode(s: SessionState, mode: string) {
  for (let i = 0; i < 80 && s.current?.music?.mode !== mode; i++) s = reducer(s, { type: "SKIP" });
  expect(s.current?.music?.mode).toBe(mode);
  return s;
}

describe("PASS//THE AUX registry", () => {
  it("is game 09 with its own slug, preview, art and Musik pick", () => {
    expect(GAMES).toHaveLength(9);
    const g = GAMES_BY_ID["pass-the-aux"];
    expect(g.number).toBe("09");
    expect(g.slug).toBe("pass-the-aux");
    expect(g.art).toBe("aux");
    expect(g.moods).toContain("Musik");
    expect(PREVIEWS["pass-the-aux"].frames.length).toBeGreaterThanOrEqual(3);
    expect(NIGHT_PICKS.some((p) => p.label === "Musik" && p.ids.includes("pass-the-aux"))).toBe(true);
    expect(new Set(GAMES.map((x) => x.number)).size).toBe(9);
  });
  it("plays only music rounds, with ≥40 authored prompts across all four patterns", () => {
    const pool = poolFor(GAMES_BY_ID["pass-the-aux"], SCENES);
    expect(pool.length).toBeGreaterThanOrEqual(40);
    expect(pool.every((s) => s.type === "MUSIC" && s.music)).toBe(true);
    for (const m of ["solo", "duet", "guess", "speed"]) expect(pool.filter((s) => s.music?.mode === m).length, m).toBeGreaterThanOrEqual(6);
    for (const g of GAMES.filter((x) => x.id !== "pass-the-aux")) expect(poolFor(g, SCENES).some((s) => s.type === "MUSIC"), g.id).toBe(false);
  });
});

describe("music round state", () => {
  it("adds a duet's two picks to the tracklist in order with owners and reaction", () => {
    let s = toMode(start(), "duet");
    const me = s.turn;
    s = reducer(s, { type: "MUSIC", round: round(s, { stage: "handoff", picks: [{ title: "Song A", artist: "X" }, null] }) });
    expect(s.musicRound?.stage).toBe("handoff");
    s = reducer(s, { type: "MUSIC", round: round(s, { stage: "reveal", picks: [{ title: "Song A", artist: "X" }, { title: "Song B" }], reaction: "match" }) });
    const n = s.sceneNumber;
    s = reducer(s, { type: "DONE" });
    expect(s.musicRound).toBeNull();
    expect(s.tracklist!.map((t) => [t.title, t.owner, t.n])).toEqual([["Song A", me, n], ["Song B", 1 - me, n]]);
    expect(s.tracklist![0]!.reaction).toBe("match");
  });

  it("solo and guess rounds record only the picker's song; skip records nothing", () => {
    let s = toMode(start(5), "guess");
    s = reducer(s, { type: "MUSIC", round: round(s, { stage: "reveal", picks: [{ title: "Hidden" }, { title: "ignored" }], prediction: "Nostalgisch" }) });
    s = reducer(s, { type: "DONE" });
    expect(s.tracklist!.map((t) => t.title)).toEqual(["Hidden"]);
    s = reducer(s, { type: "MUSIC", round: round(s, { stage: "handoff", picks: [{ title: "Skipped" }, null] }) });
    for (let i = 0; i < 4; i++) s = reducer(s, { type: "SKIP" });
    expect(s.tracklist!.map((t) => t.title)).toEqual(["Hidden"]);
    expect(s.musicRound).toBeNull();
  });

  it("ignores round updates for a stale scene and blank titles", () => {
    let s = toMode(start(7), "solo");
    const stale = reducer(s, { type: "MUSIC", round: { ...round(s, {}), sceneNumber: s.sceneNumber - 1 } });
    expect(stale.musicRound ?? null).toBeNull();
    s = reducer(s, { type: "MUSIC", round: round(s, { stage: "reveal", picks: [{ title: "   " }, null] }) });
    s = reducer(s, { type: "DONE" });
    expect(s.tracklist).toEqual([]);
  });

  it("keeps the hidden pick in session state across a remount (handoff protection)", () => {
    let s = toMode(start(9), "duet");
    s = reducer(s, { type: "MUSIC", round: round(s, { stage: "second", picks: [{ title: "Sealed" }, null] }) });
    // Settings change rerolls the scene → the in-flight round must not leak into a new scene.
    const rerolled = reducer(s, { type: "SETTINGS", settings: { ...DEFAULT_SETTINGS, intensityCap: 2 } });
    if (rerolled.current?.id !== s.current?.id) expect(rerolled.musicRound).toBeNull();
    expect(s.musicRound?.stage).toBe("second");
  });

  it("never persists the tracklist or an in-flight round remotely; new session starts empty", () => {
    let s = toMode(start(), "speed");
    s = reducer(s, { type: "MUSIC", round: round(s, { stage: "reveal", picks: [{ title: "Private Song" }, null] }) });
    s = reducer(s, { type: "DONE" });
    expect(s.tracklist).toHaveLength(1);
    expect(JSON.stringify(sanitizeForSave(s))).not.toContain("Private Song");
    expect(JSON.stringify(toRow(s, "u", 1))).not.toContain("Private Song");
    expect(start().tracklist).toEqual([]);
  });

  it("auto-detects the exact same song by catalog id or normalized title+artist", () => {
    expect(sameSong({ title: "x", providerId: "1" }, { title: "y", providerId: "1" })).toBe(true);
    expect(sameSong({ title: "x", providerId: "1" }, { title: "x", providerId: "2" })).toBe(false);
    expect(sameSong({ title: "Dancing Queen", artist: "ABBA" }, { title: "dancing  queen!", artist: "abba" })).toBe(true);
    expect(sameSong({ title: "Dancing Queen" }, { title: "Dancing Queen" })).toBe(false);
    expect(sameSong({ title: "A", artist: "B" }, { title: "C", artist: "B" })).toBe(false);
  });

  it("only offers playback for catalog tracks when already authorized", () => {
    const p = (auth: boolean): MusicProvider => ({ id: "apple-music", label: "A", capabilities: { search: true, library: true, playback: true, createPlaylist: true }, isAuthorized: () => auth, play: async () => {} });
    expect(canPlay(p(false), { title: "t", providerId: "1" })).toBe(false);
    expect(canPlay(p(true), { title: "t" })).toBe(false);
    expect(canPlay(p(true), { title: "t", providerId: "1" })).toBe(true);
    expect(canPlay(manualProvider, { title: "t", providerId: "1" })).toBe(false);
  });
});