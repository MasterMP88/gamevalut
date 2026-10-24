import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_AUX_PROMPTS,
  auxReducer,
  buildAuxDeck,
  createAuxSession,
  makeAuxRound,
  sanitizeSongPick,
  toDurableAuxSnapshot,
  visibleAuxRound,
} from "../dist-test/src/index.js";

const solo = makeAuxRound({ id: "r1", type: "SOLO_PICK", promptIndex: 0, activePlayer: 0 });
const duet = makeAuxRound({ id: "r2", type: "DUET_PICK", promptIndex: 0, activePlayer: 0 });
const guess = makeAuxRound({ id: "r3", type: "GUESS", promptIndex: 0, activePlayer: 1 });
const speed = makeAuxRound({ id: "r4", type: "SPEED_PICK", promptIndex: 0, activePlayer: 0 });
const pickA = { title: "Song A", artist: "Artist A" };
const pickB = { title: "Song B", artist: "Artist B" };

test("contains at least 40 editorial music prompts", () => {
  assert.ok(ALL_AUX_PROMPTS.length >= 40);
});

test("song input is sanitized and title is required", () => {
  assert.deepEqual(sanitizeSongPick({ title: "  Song  ", artist: "  Artist  " }), {
    title: "Song",
    artist: "Artist",
  });
  assert.throws(() => sanitizeSongPick({ title: "   " }));
});

test("solo pick remains hidden through handoff and reveals only after handoff confirmation", () => {
  let s = createAuxSession(["A", "B"]);
  s = auxReducer(s, { type: "LOAD_ROUND", round: solo });
  s = auxReducer(s, { type: "START_PICK" });
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 0, pick: pickA });
  assert.equal(s.current?.stage, "HANDOFF_A");
  assert.deepEqual(visibleAuxRound(s)?.picks, [{ player: 0 }]);
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  assert.equal(s.current?.stage, "REVEAL");
  assert.equal(visibleAuxRound(s)?.picks[0]?.title, "Song A");
});

test("duet flow seals A, hands off, seals B and reveals both together", () => {
  let s = createAuxSession(["A", "B"]);
  s = auxReducer(s, { type: "LOAD_ROUND", round: duet });
  s = auxReducer(s, { type: "START_PICK" });
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 0, pick: pickA });
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  assert.equal(s.current?.stage, "PICK_B");
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 1, pick: pickB });
  assert.equal(s.current?.stage, "HANDOFF_B");
  assert.deepEqual(visibleAuxRound(s)?.picks, [{ player: 0 }, { player: 1 }]);
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  assert.deepEqual(visibleAuxRound(s)?.picks.map((x) => x.title), ["Song A", "Song B"]);
});

test("guess round collects prediction before revealing the hidden song", () => {
  let s = createAuxSession(["A", "B"]);
  s = auxReducer(s, { type: "LOAD_ROUND", round: guess });
  s = auxReducer(s, { type: "START_PICK" });
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 1, pick: pickB });
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  assert.equal(s.current?.stage, "PREDICTION");
  assert.equal(visibleAuxRound(s)?.prediction, null);
  s = auxReducer(s, { type: "SUBMIT_PREDICTION", prediction: "unerwartet" });
  assert.equal(s.current?.stage, "REVEAL");
  assert.equal(visibleAuxRound(s)?.prediction, "unerwartet");
});

test("speed expiry never fails or blocks picking", () => {
  let s = createAuxSession(["A", "B"]);
  s = auxReducer(s, { type: "LOAD_ROUND", round: speed });
  s = auxReducer(s, { type: "START_PICK" });
  s = auxReducer(s, { type: "SPEED_EXPIRED" });
  assert.equal(s.current?.speedExpired, true);
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 0, pick: pickA });
  assert.equal(s.current?.stage, "HANDOFF_A");
});

test("completed rounds build Tonight's Tracklist in player order", () => {
  let s = createAuxSession(["A", "B"]);
  s = auxReducer(s, { type: "LOAD_ROUND", round: duet });
  s = auxReducer(s, { type: "START_PICK" });
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 0, pick: pickA });
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 1, pick: pickB });
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  s = auxReducer(s, { type: "SET_REACTION", reaction: "MATCH" });
  s = auxReducer(s, { type: "COMPLETE_ROUND" });
  assert.equal(s.tracklist.length, 2);
  assert.deepEqual(s.tracklist.map((x) => x.title), ["Song A", "Song B"]);
  assert.deepEqual(s.reactions, ["MATCH"]);
});

test("durable autosave strips song titles, artists and predictions", () => {
  let s = createAuxSession(["A", "B"]);
  s = auxReducer(s, { type: "LOAD_ROUND", round: guess });
  s = auxReducer(s, { type: "START_PICK" });
  s = auxReducer(s, {
    type: "SUBMIT_PICK",
    player: 1,
    pick: { title: "Secret Song 987", artist: "Artist 654" },
  });
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  s = auxReducer(s, { type: "SUBMIT_PREDICTION", prediction: "guilty-pleasure" });
  const snap = toDurableAuxSnapshot(s);
  const serialized = JSON.stringify(snap);
  assert.equal(serialized.includes("Secret Song 987"), false);
  assert.equal(serialized.includes("Artist 654"), false);
  assert.equal(serialized.includes("guilty-pleasure"), false);
  assert.equal(snap.requiresPrivateMusicRestore, true);
});

test("reset clears tracklist and private round state", () => {
  let s = createAuxSession(["A", "B"]);
  s = auxReducer(s, { type: "LOAD_ROUND", round: solo });
  s = auxReducer(s, { type: "START_PICK" });
  s = auxReducer(s, { type: "SUBMIT_PICK", player: 0, pick: pickA });
  s = auxReducer(s, { type: "CONFIRM_HANDOFF" });
  s = auxReducer(s, { type: "COMPLETE_ROUND" });
  s = auxReducer(s, { type: "RESET" });
  assert.equal(s.tracklist.length, 0);
  assert.equal(s.current, null);
  assert.equal(s.finished, false);
});

test("deck alternates mechanics and creates requested number of rounds", () => {
  const deck = buildAuxDeck(12);
  assert.equal(deck.length, 12);
  assert.deepEqual(deck.slice(0, 4).map((x) => x.type), [
    "SOLO_PICK",
    "DUET_PICK",
    "GUESS",
    "SPEED_PICK",
  ]);
});
