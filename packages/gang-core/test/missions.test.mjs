import assert from "node:assert/strict";
import test from "node:test";
import {
  createMissionNight,
  applyMissionEvent,
  resolveMissionNight,
  missionQueue,
} from "../dist/index.js";
const ps = Array.from({ length: 6 }, (_, i) => ({
  id: `p${i}`,
  name: `P${i}`,
}));
test("missions have unique unseen assignments and survive a different main game", () => {
  const a = createMissionNight("a", ps, 1, [], 100);
  const ids = Object.values(a.assignments).map((p) => p.id);
  const b = createMissionNight("b", ps, 1, ids, 200);
  assert.equal(new Set(ids).size, 6);
  assert.ok(Object.values(b.assignments).every((p) => !ids.includes(p.id)));
  assert.deepEqual(missionQueue(["the-majority", "secret-missions", "bluff"]), [
    "secret-missions",
    "the-majority",
    "bluff",
  ]);
});
test("one correct suspicion before completion catches the agent; later suspicion earns its own bonus", () => {
  let n = createMissionNight("n", ps, 9, [], 100);
  n = applyMissionEvent(n, {
    id: "a",
    playerId: "p0",
    kind: "accuse",
    targetId: "p1",
    missionId: n.assignments.p1.id,
    at: 110,
  });
  n = applyMissionEvent(n, { id: "b", playerId: "p1", kind: "claim", at: 120 });
  n = applyMissionEvent(n, { id: "c", playerId: "p2", kind: "claim", at: 130 });
  n = applyMissionEvent(n, {
    id: "d",
    playerId: "p3",
    kind: "accuse",
    targetId: "p2",
    missionId: n.assignments.p2.id,
    at: 140,
  });
  const r = resolveMissionNight(n);
  assert.equal(r.scores.p0, 1);
  assert.equal(r.scores.p1, 0);
  assert.equal(r.scores.p2, 2);
  assert.equal(r.scores.p3, 1);
  assert.equal(r.timeline.find((t) => t.playerId === "p1").status, "caught");
});
test("claims and accusations are sealed; own role cannot be accused", () => {
  let n = createMissionNight("n", ps, 9, [], 100);
  const event = { id: "a", playerId: "p0", kind: "claim", at: 110 };
  n = applyMissionEvent(n, event);
  assert.equal(applyMissionEvent(n, event), n);
  assert.equal(applyMissionEvent(n, { ...event, id: "b", at: 120 }), n);
  assert.throws(() =>
    applyMissionEvent(n, {
      id: "c",
      playerId: "p0",
      kind: "accuse",
      targetId: "p0",
      missionId: n.assignments.p0.id,
      at: 150,
    }),
  );
});
