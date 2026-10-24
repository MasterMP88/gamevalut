import assert from "node:assert/strict";
import test from "node:test";
import {
  StaticRightsClearedProvider,
  buildFirstBeatDeck,
  createFirstBeatSession,
  currentRevealMs,
  firstBeatReducer,
  isRightsClearedGameTrack,
  makeLocalFileTrack,
  makeRound,
  requireRightsClearedGameTrack,
  statsFor,
  toDurableFirstBeatSnapshot,
  visibleTrack,
} from "../dist-test/src/index.js";

const track = {
  id: "t1",
  title: "Secret Song",
  artist: "Hidden Artist",
  source: "demo",
  audioUrl: "blob:owned-demo-audio",
  artworkUrl: "https://example.test/art.jpg",
  releaseDate: "2009-02-01",
  rights: "owned",
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
  assert.deepEqual(visibleTrack(s), { id: "t1", audioUrl: track.audioUrl });
  s = firstBeatReducer(s, { type: "REVEAL" });
  assert.equal(visibleTrack(s)?.title, "Secret Song");
  assert.equal(visibleTrack(s)?.artist, "Hidden Artist");
});

test("buzz, guess, reveal and completion update cooperative signal without player score", () => {
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round });
  s = firstBeatReducer(s, { type: "START_AUDIO" });
  s = firstBeatReducer(s, { type: "BUZZ", player: 1 });
  s = firstBeatReducer(s, {
    type: "SUBMIT_GUESS",
    guess: { kind: "free-text", text: "my guess" },
  });
  s = firstBeatReducer(s, { type: "REVEAL" });
  s = firstBeatReducer(s, { type: "COMPLETE_ROUND", recognized: true });
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0]?.buzzedBy, 1);
  assert.equal(s.signal, 12);
});

test("stats report recognition pace and strongest era", () => {
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round });
  s = firstBeatReducer(s, { type: "START_AUDIO" });
  s = firstBeatReducer(s, { type: "MORE_AUDIO" });
  s = firstBeatReducer(s, { type: "REVEAL" });
  s = firstBeatReducer(s, { type: "COMPLETE_ROUND", recognized: true });
  assert.deepEqual(statsFor(s), {
    rounds: 1,
    recognized: 1,
    averageRevealMs: 3000,
    strongestDecade: 2000,
    signal: 9,
  });
});

test("deck excludes tracks without rights-cleared game audio", () => {
  const unauthorized = { ...track, id: "t2" };
  delete unauthorized.rights;
  const deck = buildFirstBeatDeck([track, unauthorized]);
  assert.equal(deck.length, 1);
  assert.equal(deck[0]?.track.id, "t1");
  assert.equal(isRightsClearedGameTrack(unauthorized), false);
  assert.throws(() => requireRightsClearedGameTrack(unauthorized));
});

test("static provider returns only rights-cleared owned/licensed tracks", async () => {
  const provider = new StaticRightsClearedProvider({
    id: "owned-demo-pack",
    source: "owned-pack",
    rights: "owned",
    tracks: [track],
  });
  const rows = await provider.list();
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.rights, "owned");
  assert.equal(provider.capabilities().rightsCleared, true);
});

test("local-file tracks are marked user-local and playable but ephemeral", () => {
  const local = makeLocalFileTrack({
    id: "local-1",
    title: "My file",
    objectUrl: "blob:local",
    pickedBy: 0,
  });
  assert.equal(local.source, "local-file");
  assert.equal(local.rights, "user-local");
  assert.equal(isRightsClearedGameTrack(local), true);
});

test("durable snapshot strips hidden and private song content from autosave", () => {
  const personal = makeLocalFileTrack({
    id: "private-track",
    title: "Secret Song 987",
    artist: "Artist 654",
    objectUrl: "blob:private",
    pickedBy: 0,
  });
  const personalRound = makeRound({
    id: "personal",
    type: "WHO_PICKED_IT",
    track: personal,
    pickedBy: 0,
  });
  let s = createFirstBeatSession(["A", "B"]);
  s = firstBeatReducer(s, { type: "LOAD_ROUND", round: personalRound });
  s = firstBeatReducer(s, { type: "START_AUDIO" });
  s = firstBeatReducer(s, { type: "BUZZ", player: 1 });
  s = firstBeatReducer(s, {
    type: "SUBMIT_GUESS",
    guess: { kind: "free-text", text: "very private guess" },
  });
  const snap = toDurableFirstBeatSnapshot(s);
  const serialized = JSON.stringify(snap);
  assert.equal(snap.current?.privateTrack, true);
  assert.equal("trackId" in (snap.current ?? {}), false);
  assert.equal(serialized.includes("Secret Song 987"), false);
  assert.equal(serialized.includes("Artist 654"), false);
  assert.equal(serialized.includes("very private guess"), false);
  assert.equal(serialized.includes("private-track"), false);
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
});
