import assert from "node:assert/strict";
import test from "node:test";
import {
  AppleMusicProvider,
  buildFirstBeatDeck,
  createFirstBeatSession,
  currentRevealMs,
  firstBeatReducer,
  makeRound,
  normalizeAppleMusicSong,
  statsFor,
  visibleTrack,
} from "../dist-test/src/index.js";

const track = {
  id: "t1",
  title: "Secret Song",
  artist: "Hidden Artist",
  provider: "demo",
  previewUrl: "https://example.test/preview.m4a",
  artworkUrl: "https://example.test/art.jpg",
  releaseDate: "2009-02-01",
};
const round = makeRound({ id: "r1", type: "INTRO_RUSH", track });

test("progressive reveal uses 1s -> 3s -> 7s -> 15s and never exceeds the cap", () => {
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round });
  assert.equal(currentRevealMs(s), 1000);
  for (const expected of [3000, 7000, 15000, 15000]) {
    s = firstBeatReducer(s, { type: "MORE_AUDIO" });
    assert.equal(currentRevealMs(s), expected);
  }
});

test("track metadata stays sealed before reveal", () => {
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round });
  s = firstBeatReducer(s, { type: "START_AUDIO" });
  assert.deepEqual(visibleTrack(s), { id: "t1", previewUrl: track.previewUrl });
  s = firstBeatReducer(s, { type: "REVEAL" });
  assert.equal(visibleTrack(s)?.title, "Secret Song");
  assert.equal(visibleTrack(s)?.artist, "Hidden Artist");
});

test("buzz, guess, reveal and completion update cooperative signal without player score", () => {
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round });
  s = firstBeatReducer(s, { type: "START_AUDIO" });
  s = firstBeatReducer(s, { type: "BUZZ", player: 1 });
  s = firstBeatReducer(s, { type: "SUBMIT_GUESS", guess: { kind: "free-text", text: "my guess" } });
  s = firstBeatReducer(s, { type: "REVEAL" });
  s = firstBeatReducer(s, { type: "COMPLETE_ROUND", recognized: true });
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0]?.buzzedBy, 1);
  assert.equal(s.signal, 12);
  assert.equal(s.current?.stage, "COMPLETE");
});

test("stats report recognition pace and strongest era", () => {
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round });
  s = firstBeatReducer(s, { type: "START_AUDIO" });
  s = firstBeatReducer(s, { type: "MORE_AUDIO" });
  s = firstBeatReducer(s, { type: "REVEAL" });
  s = firstBeatReducer(s, { type: "COMPLETE_ROUND", recognized: true });
  assert.deepEqual(statsFor(s), { rounds: 1, recognized: 1, averageRevealMs: 3000, strongestDecade: 2000, signal: 9 });
});

test("reset clears all music-game state", () => {
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round });
  s = firstBeatReducer(s, { type: "START_AUDIO" });
  s = firstBeatReducer(s, { type: "REVEAL" });
  s = firstBeatReducer(s, { type: "COMPLETE_ROUND", recognized: true });
  s = firstBeatReducer(s, { type: "RESET" });
  assert.equal(s.history.length, 0);
  assert.equal(s.signal, 0);
  assert.equal(s.current, null);
  assert.equal(s.finished, false);
});

test("deck excludes tracks without official preview audio", () => {
  const noPreview = { ...track, id: "t2" };
  delete noPreview.previewUrl;
  const deck = buildFirstBeatDeck([track, noPreview]);
  assert.equal(deck.length, 1);
  assert.equal(deck[0]?.track.id, "t1");
});

test("Apple Music normalization requires title, artist and preview URL", () => {
  const normalized = normalizeAppleMusicSong({
    id: "apple-1",
    attributes: {
      name: "Track",
      artistName: "Artist",
      previews: [{ url: "https://apple.example/preview.m4a" }],
      artwork: { url: "https://img.example/{w}x{h}.jpg" },
      releaseDate: "1998-01-01",
    },
  });
  assert.equal(normalized?.provider, "apple-music");
  assert.equal(normalized?.artworkUrl, "https://img.example/600x600.jpg");
  assert.equal(normalizeAppleMusicSong({ id: "bad", attributes: { name: "No preview", artistName: "Artist" } }), null);
});

test("Apple adapter remains fail-soft when not configured", async () => {
  const bridge = {
    isConfigured: () => false,
    isAuthorized: () => false,
    authorize: async () => undefined,
    searchSongs: async () => { throw new Error("must not call"); },
  };
  const provider = new AppleMusicProvider(bridge);
  assert.equal(provider.capabilities().configured, false);
  assert.deepEqual(await provider.search("test"), []);
});
