import assert from "node:assert/strict";
import test from "node:test";
import {
  APPLE_DECADE_PLAYLISTS,
  appleTimeDropCatalogRequests,
  belongsToRequestedDecade,
  buildBalancedTimeDropDeck,
  canReveal,
  mapAppleCatalogSong,
  completeRound,
  createTimeDropSession,
  finishTimeDrop,
  insertTrack,
  nextRound,
  openGuessing,
  publicTrackView,
  resetTimeDrop,
  revealRound,
  statsForTimeDrop,
  submitGuess,
  validSlotIndexes,
} from "../dist-test/src/index.js";

const t = (id, year, title = id, artist = "Artist") => ({
  id,
  title,
  artist,
  releaseYear: year,
  playbackRef: `opaque:${id}`,
});

const actors2 = [
  { id: "a", name: "Ari" },
  { id: "b", name: "Nova" },
];

function lockAll(session, guesses) {
  let s = openGuessing(session);
  for (const guess of guesses) s = submitGuess(s, guess);
  return s;
}

test("valid slots preserve chronology and allow adjacent positions for same-year tracks", () => {
  const timeline = [
    { trackId: "a", year: 1990, title: "A", artist: "X" },
    { trackId: "b", year: 2000, title: "B", artist: "X" },
    { trackId: "c", year: 2000, title: "C", artist: "X" },
    { trackId: "d", year: 2010, title: "D", artist: "X" },
  ];
  assert.deepEqual(validSlotIndexes(1980, timeline), [0]);
  assert.deepEqual(validSlotIndexes(1995, timeline), [1]);
  assert.deepEqual(validSlotIndexes(2000, timeline), [1, 2, 3]);
  assert.deepEqual(validSlotIndexes(2020, timeline), [4]);
});

test("track metadata stays hidden before reveal while opaque playback reference remains available", () => {
  const s = createTimeDropSession({
    id: "x",
    mode: "couple-coop",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("secret", 2010, "Secret Song", "Secret Artist"),
  });
  assert.deepEqual(publicTrackView(s), { id: "secret", playbackRef: "opaque:secret" });
  const locked = lockAll(s, [
    { actorId: "a", slotIndex: 1 },
    { actorId: "b", slotIndex: 1 },
  ]);
  const revealed = revealRound(locked);
  assert.equal(publicTrackView(revealed).title, "Secret Song");
  assert.equal(publicTrackView(revealed).releaseYear, 2010);
});

test("couple co-op perfect sync adds a shared bonus", () => {
  let s = createTimeDropSession({
    id: "sync",
    mode: "couple-coop",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("new", 2010),
  });
  s = lockAll(s, [
    { actorId: "a", slotIndex: 1 },
    { actorId: "b", slotIndex: 1 },
  ]);
  s = revealRound(s);
  assert.equal(s.round.resolution?.sync?.sameSlot, true);
  assert.equal(s.round.resolution?.sync?.perfectSync, true);
  assert.equal(s.round.resolution?.scoreDeltaBySide.together, 4);
  assert.equal(s.scores.together, 4);
  assert.equal(s.perfectSyncCount, 1);
});

test("couple duel scores separately and requires no shared difficulty", () => {
  let s = createTimeDropSession({
    id: "duel",
    mode: "couple-duel",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("new", 2010),
    difficultyByActor: { a: "flow", b: "expert" },
  });
  s = lockAll(s, [
    { actorId: "a", slotIndex: 1 },
    { actorId: "b", slotIndex: 1, guessedYear: 2010, titleGuess: "new", artistGuess: "Artist" },
  ]);
  s = revealRound(s);
  assert.equal(s.scores.a, 1);
  assert.equal(s.scores.b, 6);
});

test("precision lock rewards narrower correct windows only after correct placement", () => {
  let s = createTimeDropSession({
    id: "precision",
    mode: "couple-duel",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("new", 2012),
    difficultyByActor: { a: "precision", b: "precision" },
  });
  s = lockAll(s, [
    { actorId: "a", slotIndex: 1, guessedYear: 2010, precisionWindow: 2 },
    { actorId: "b", slotIndex: 0, guessedYear: 2012, precisionWindow: 2 },
  ]);
  s = revealRound(s);
  const a = s.round.resolution.results.find((x) => x.actorId === "a");
  const b = s.round.resolution.results.find((x) => x.actorId === "b");
  assert.equal(a.total, 4);
  assert.equal(a.yearBonus, 3);
  assert.equal(b.total, 0);
  assert.equal(b.yearBonus, 0);
});

test("expert mode can earn exact year, title and artist bonuses", () => {
  let s = createTimeDropSession({
    id: "expert",
    mode: "couple-duel",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("new", 2012, "Call Me Maybe", "Carly Rae Jepsen"),
    difficultyByActor: { a: "expert", b: "flow" },
  });
  s = lockAll(s, [
    { actorId: "a", slotIndex: 1, guessedYear: 2012, titleGuess: "call me maybe", artistGuess: "Carly Rae Jepsen" },
    { actorId: "b", slotIndex: 1 },
  ]);
  s = revealRound(s);
  const a = s.round.resolution.results.find((x) => x.actorId === "a");
  assert.deepEqual(
    { base: a.placementCorrect, year: a.yearBonus, title: a.titleBonus, artist: a.artistBonus, total: a.total },
    { base: true, year: 3, title: 1, artist: 1, total: 6 },
  );
});

test("gang everyone-in resolves crowd distribution simultaneously", () => {
  const actors = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" },
    { id: "d", name: "D" },
  ];
  let s = createTimeDropSession({
    id: "gang",
    mode: "gang-solo",
    actors,
    seedTrack: t("seed", 2000),
    firstTrack: t("new", 1995),
  });
  s = lockAll(s, [
    { actorId: "a", slotIndex: 0 },
    { actorId: "b", slotIndex: 0 },
    { actorId: "c", slotIndex: 1 },
    { actorId: "d", slotIndex: 0 },
  ]);
  s = revealRound(s);
  assert.deepEqual(s.round.resolution.crowd.slotCounts, { 0: 3, 1: 1 });
  assert.deepEqual(s.round.resolution.crowd.popularSlotIndexes, [0]);
  assert.equal(s.round.resolution.crowd.majorityCorrect, true);
  assert.equal(s.scores.a, 1);
  assert.equal(s.scores.c, 0);
});

test("gang team score uses average member result so bigger teams have no automatic advantage", () => {
  const actors = [
    { id: "a1", name: "A1", sideId: "A" },
    { id: "a2", name: "A2", sideId: "A" },
    { id: "a3", name: "A3", sideId: "A" },
    { id: "b1", name: "B1", sideId: "B" },
    { id: "b2", name: "B2", sideId: "B" },
  ];
  let s = createTimeDropSession({
    id: "teams",
    mode: "gang-teams",
    actors,
    seedTrack: t("seed", 2000),
    firstTrack: t("new", 2010),
  });
  s = lockAll(s, [
    { actorId: "a1", slotIndex: 1 },
    { actorId: "a2", slotIndex: 1 },
    { actorId: "a3", slotIndex: 0 },
    { actorId: "b1", slotIndex: 1 },
    { actorId: "b2", slotIndex: 0 },
  ]);
  s = revealRound(s);
  assert.equal(s.round.resolution.scoreDeltaBySide.A, 1);
  assert.equal(s.round.resolution.scoreDeltaBySide.B, 1);
});

test("every actor must lock before reveal", () => {
  let s = createTimeDropSession({
    id: "lock",
    mode: "couple-duel",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("new", 2010),
  });
  s = openGuessing(s);
  s = submitGuess(s, { actorId: "a", slotIndex: 1 });
  assert.equal(canReveal(s), false);
  assert.throws(() => revealRound(s));
  s = submitGuess(s, { actorId: "b", slotIndex: 1 });
  assert.equal(canReveal(s), true);
});

test("timeline grows exactly once per revealed track and next round uses the new anchors", () => {
  let s = createTimeDropSession({
    id: "grow",
    mode: "couple-duel",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("r1", 2010),
  });
  s = revealRound(lockAll(s, [
    { actorId: "a", slotIndex: 1 },
    { actorId: "b", slotIndex: 1 },
  ]));
  assert.deepEqual(s.timeline.map((x) => x.year), [2000, 2010]);
  s = completeRound(s);
  s = nextRound(s, t("r2", 2005));
  assert.equal(s.roundNumber, 2);
  assert.deepEqual(validSlotIndexes(2005, s.timeline), [1]);
});

test("reset clears scores/history but preserves the original seed timeline", () => {
  let s = createTimeDropSession({
    id: "reset",
    mode: "couple-coop",
    actors: actors2,
    seedTrack: t("seed", 1999),
    firstTrack: t("r1", 2005),
  });
  s = revealRound(lockAll(s, [
    { actorId: "a", slotIndex: 1 },
    { actorId: "b", slotIndex: 1 },
  ]));
  s = completeRound(s);
  s = finishTimeDrop(s);
  s = resetTimeDrop(s, t("again", 2010));
  assert.equal(s.finished, false);
  assert.deepEqual(s.timeline.map((x) => [x.trackId, x.year]), [["seed", 1999]]);
  assert.equal(s.history.length, 0);
  assert.equal(s.scores.together, 0);
});

test("stats summarize placement rate, sync and leaders", () => {
  let s = createTimeDropSession({
    id: "stats",
    mode: "couple-duel",
    actors: actors2,
    seedTrack: t("seed", 2000),
    firstTrack: t("r1", 2010),
  });
  s = revealRound(lockAll(s, [
    { actorId: "a", slotIndex: 1 },
    { actorId: "b", slotIndex: 0 },
  ]));
  s = completeRound(s);
  const stats = statsForTimeDrop(s);
  assert.equal(stats.rounds, 1);
  assert.equal(stats.guesses, 2);
  assert.equal(stats.correctPlacements, 1);
  assert.equal(stats.placementRate, 0.5);
  assert.deepEqual(stats.leaderSideIds, ["a"]);
});

test("insertTrack deduplicates the same track id", () => {
  const line = [{ trackId: "a", year: 2000, title: "A", artist: "X" }];
  const once = insertTrack(line, t("b", 2010));
  const twice = insertTrack(once, t("b", 2010));
  assert.equal(twice.length, 2);
});

test("Apple catalog mapping uses release metadata and ignores previews as game audio", () => {
  const mapped = mapAppleCatalogSong({
    id: "635016640",
    attributes: {
      name: "Sweater Weather",
      artistName: "The Neighbourhood",
      releaseDate: "2012-12-03",
      url: "https://music.apple.com/us/album/x/1?i=635016640",
      artwork: { url: "https://img.example/{w}x{h}.jpg" },
      playParams: { id: "635016640", kind: "song" },
      previews: [{ url: "https://should-not-be-used.example/preview.m4a" }],
    },
  });
  assert.equal(mapped.releaseYear, 2012);
  assert.equal(mapped.providerId, "635016640");
  assert.equal(mapped.playbackRef, "apple-music:635016640");
  assert.equal(mapped.artworkUrl, "https://img.example/600x600.jpg");
  assert.equal("previewUrl" in mapped, false);
});

test("balanced deck round-robins decades before filling extra slots", () => {
  const candidates = [
    t("70a", 1978), t("70b", 1979),
    t("80a", 1984), t("80b", 1988),
    t("90a", 1991), t("90b", 1999),
    t("00a", 2004), t("00b", 2009),
    t("10a", 2012), t("10b", 2018),
    t("20a", 2021), t("20b", 2025),
  ];
  const deck = buildBalancedTimeDropDeck({
    candidates,
    size: 6,
    seed: 42,
    decades: [1970, 1980, 1990, 2000, 2010, 2020],
  });
  assert.deepEqual(
    new Set(deck.map((x) => Math.floor(x.releaseYear / 10) * 10)),
    new Set([1970, 1980, 1990, 2000, 2010, 2020]),
  );
  assert.equal(new Set(deck.map((x) => x.id)).size, 6);
});

test("balanced deck excludes already-used tracks and invalid provider rows", () => {
  const candidates = [
    t("used", 1990),
    t("ok", 2000),
    { id: "bad", title: "", artist: "Artist", releaseYear: 2010 },
  ];
  const deck = buildBalancedTimeDropDeck({
    candidates,
    size: 5,
    excludeIds: ["used"],
  });
  assert.deepEqual(deck.map((x) => x.id), ["ok"]);
});


test("Apple pool covers 60s through 10s plus a current 20s chart source", () => {
  assert.deepEqual(Object.keys(APPLE_DECADE_PLAYLISTS).map(Number), [1960, 1970, 1980, 1990, 2000, 2010]);
  const reqs = appleTimeDropCatalogRequests({ storefront: "DE", historicalLimit: 50, currentLimit: 120 });
  assert.equal(reqs.length, 7);
  assert.equal(reqs[0].path, "/v1/catalog/de/playlists/pl.405e6f67264a4a44ba1b0c3a787c78b8/tracks");
  assert.equal(reqs[0].params.limit, 50);
  assert.equal(reqs.at(-1).path, "/v1/catalog/de/charts");
  assert.deepEqual(reqs.at(-1).params, { types: "songs", chart: "most-played", limit: 120 });
});

test("provider rows are checked against their intended decade instead of trusting playlist labels", () => {
  assert.equal(belongsToRequestedDecade(1989, 1980), true);
  assert.equal(belongsToRequestedDecade(1990, 1980), false);
  assert.equal(belongsToRequestedDecade(2026, 2020), true);
});
