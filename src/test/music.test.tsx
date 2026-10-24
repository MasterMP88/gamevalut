import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createSession, DEFAULT_SETTINGS, reducer } from "@/lib/game/engine";
import { sanitizeForSave } from "@/lib/game/persist";
import { MusicRoundView } from "@/components/player/MusicRoundView";
import { MUSIC_PROMPTS } from "@/lib/music/prompts";
import { createMusicState, musicReducer, visibleTracklist } from "@/lib/music/engine";
import type { MusicRoundType } from "@/lib/game/types";

describe("PASS//THE AUX content", () => {
  it("ships at least 45 exclusive prompts with all four round types", () => {
    expect(MUSIC_PROMPTS.length).toBeGreaterThanOrEqual(45);
    expect(new Set(MUSIC_PROMPTS.map((p) => p.id)).size).toBe(MUSIC_PROMPTS.length);
    const types = new Set(MUSIC_PROMPTS.map((p) => p.type));
    expect(types).toEqual(new Set<MusicRoundType>(["SOLO", "DUET", "GUESS", "SPEED"]));
  });

  it("starts as a dedicated music session without a generic scene", () => {
    const s = createSession("pass-the-aux", ["Ari", "Nova"], DEFAULT_SETTINGS, 77);
    expect(s.music).toBeTruthy();
    expect(s.music?.round.type).toBe("SOLO");
    expect(s.current).toBeNull();
    expect(s.sceneNumber).toBe(1);
    expect(s.turn).toBe(0);
  });

  it("never schedules the same music round type three times in a row", () => {
    let music = createMusicState(11);
    const types: MusicRoundType[] = [music.round.type];
    for (let i = 0; i < 30; i++) {
      music = musicReducer(music, { type: "MUSIC_SKIP" });
      types.push(music.round.type);
    }
    for (let i = 2; i < types.length; i++) {
      expect(types[i] === types[i - 1] && types[i] === types[i - 2]).toBe(false);
    }
  });
});

describe("PASS//THE AUX round state", () => {
  it("plays a SOLO round through seal, handoff, reveal and tracklist", () => {
    let music = createMusicState(21);
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "Midnight City", artist: "M83" });
    expect(music.stage).toBe("handoff");
    music = musicReducer(music, { type: "MUSIC_HANDOFF" });
    expect(music.stage).toBe("reveal");
    expect(visibleTracklist(music).map((p) => p.title)).toEqual(["Midnight City"]);
    music = musicReducer(music, { type: "MUSIC_NEXT" });
    expect(music.roundNumber).toBe(2);
    expect(music.tracklist.map((p) => p.title)).toEqual(["Midnight City"]);
  });

  it("keeps DUET picks private until both have chosen and reveals two cards", () => {
    let music = createMusicState(22);
    music = musicReducer(music, { type: "MUSIC_SKIP" }); // round 2 = DUET
    expect(music.round.type).toBe("DUET");
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "Track A", artist: "Artist A" });
    expect(music.stage).toBe("handoff");
    music = musicReducer(music, { type: "MUSIC_HANDOFF" });
    expect(music.stage).toBe("pick-second");
    expect(visibleTracklist(music)).toEqual([]);
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "Track B" });
    expect(music.stage).toBe("reveal");
    expect(visibleTracklist(music).map((p) => p.title)).toEqual(["Track A", "Track B"]);
    music = musicReducer(music, { type: "MUSIC_REACT", reaction: "Plot Twist" });
    expect(music.reaction).toBe("Plot Twist");
    music = musicReducer(music, { type: "MUSIC_NEXT" });
    expect(music.tracklist.map((p) => p.title)).toEqual(["Track A", "Track B"]);
  });

  it("plays GUESS as private song then partner vibe prediction", () => {
    let music = createMusicState(23);
    music = musicReducer(music, { type: "MUSIC_SKIP" }); // duet
    music = musicReducer(music, { type: "MUSIC_SKIP" }); // guess
    expect(music.round.type).toBe("GUESS");
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "A Secret Song" });
    expect(music.stage).toBe("handoff");
    music = musicReducer(music, { type: "MUSIC_HANDOFF" });
    expect(music.stage).toBe("predict");
    music = musicReducer(music, { type: "MUSIC_PREDICT", vibe: "Komplett unerwartet" });
    expect(music.stage).toBe("reveal");
    expect(music.prediction).toBe("Komplett unerwartet");
  });

  it("SPEED remains playable and is just a normal seal/reveal state", () => {
    let music = createMusicState(24);
    music = musicReducer(music, { type: "MUSIC_SKIP" });
    music = musicReducer(music, { type: "MUSIC_SKIP" });
    music = musicReducer(music, { type: "MUSIC_SKIP" });
    expect(music.round.type).toBe("SPEED");
    expect(music.round.speedSeconds).toBe(25);
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "First Thought" });
    expect(music.stage).toBe("reveal");
  });

  it("keeps chronological tracklist order across rounds", () => {
    let music = createMusicState(25);
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "One" });
    music = musicReducer(music, { type: "MUSIC_HANDOFF" });
    music = musicReducer(music, { type: "MUSIC_NEXT" });

    music = musicReducer(music, { type: "MUSIC_SEAL", title: "Two" });
    music = musicReducer(music, { type: "MUSIC_HANDOFF" });
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "Three" });
    music = musicReducer(music, { type: "MUSIC_NEXT" });

    expect(music.tracklist.map((p) => p.title)).toEqual(["One", "Two", "Three"]);
    expect(music.tracklist.map((p) => p.round)).toEqual([1, 2, 2]);
  });

  it("restart creates a fresh empty tracklist", () => {
    let s = createSession("pass-the-aux", ["Ari", "Nova"], DEFAULT_SETTINGS, 26);
    s = reducer(s, { type: "MUSIC_SEAL", title: "Keep Local" });
    s = reducer(s, { type: "MUSIC_HANDOFF" });
    s = reducer(s, { type: "MUSIC_NEXT" });
    expect(s.music?.tracklist.length).toBe(1);
    const fresh = createSession("pass-the-aux", ["Ari", "Nova"], DEFAULT_SETTINGS, 27);
    expect(fresh.music?.tracklist).toEqual([]);
  });

  it("cloud sanitization removes every song title and artist", () => {
    let s = createSession("pass-the-aux", ["Ari", "Nova"], DEFAULT_SETTINGS, 28);
    s = reducer(s, { type: "MUSIC_SEAL", title: "Never Upload This Song", artist: "Private Artist" });
    s = reducer(s, { type: "MUSIC_HANDOFF" });
    s = reducer(s, { type: "MUSIC_NEXT" });
    const json = JSON.stringify(sanitizeForSave(s));
    expect(json).not.toContain("Never Upload This Song");
    expect(json).not.toContain("Private Artist");
    expect(sanitizeForSave(s).music?.tracklist).toEqual([]);
  });

  it("sealed handoff renders no previous song title in visible DOM", () => {
    let music = createMusicState(29);
    music = musicReducer(music, { type: "MUSIC_SEAL", title: "Invisible Secret Track" });
    const onAction = vi.fn();
    render(<MusicRoundView music={music} players={["Ari", "Nova"]} onAction={onAction} />);
    expect(screen.queryByText(/Invisible Secret Track/i)).toBeNull();
    expect(screen.getByText(/Nur für/i)).toBeTruthy();
    expect(screen.getByText(/Nichts davon steht auf diesem Screen/i)).toBeTruthy();
  });
});
