import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { createCouchSession, reduceCouch } from "@/lib/gang/core/couch";
import {
  readCouchCheckpoint,
  writeCouchCheckpoint,
  clearCouchCheckpoint,
} from "@/lib/gang/couch-resume";
import { GangSharedNight } from "@/components/gang/CouchPlayer";
const NOW = 1800000000000;
const players = Array.from({ length: 4 }, (_, i) => ({
  id: `p${i}`,
  name: `Person ${i + 1}`,
}));
const fresh = () =>
  createCouchSession({
    gameId: "panic-button",
    playerCount: 4,
    seed: 32,
    rounds: 3,
  });
const save = (state = fresh(), at = NOW) =>
  writeCouchCheckpoint(
    {
      queue: ["the-line", "panic-button"],
      index: 1,
      players,
      display: "couch",
      state,
      audioIds: [],
    },
    at,
  );
beforeEach(() => sessionStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("couch reload recovery", () => {
  it("restores the exact deck, team scores, queue position, and a paused remaining timer", () => {
    const s = reduceCouch(reduceCouch(fresh(), { type: "NEXT", at: NOW }), {
      type: "NEXT",
      at: NOW,
    });
    save({ ...s, scores: { t1: 8, t2: 3, t3: 4, t4: 0 } });
    const r = readCouchCheckpoint(NOW + 5000)!;
    expect(r).not.toBeNull();
    expect(r.index).toBe(1);
    expect(r.state.paused).toBe(true);
    expect(r.state.deck).toEqual(s.deck);
    expect(r.state.scores["t1"]).toBe(8);
    expect(r.state.remaining).toBe(s.deadline! - NOW - 5000);
    expect(
      reduceCouch(r.state, { type: "RESUME", at: NOW + 60000 }).deadline,
    ).toBe(NOW + 60000 + r.state.remaining!);
  });
  it.each(["expired", "future", "broken", "wrong-game", "wrong-shape"])(
    "discards %s checkpoints",
    (kind) => {
      save();
      const v = JSON.parse(sessionStorage.getItem("nocturne.couch.resume")!);
      if (kind === "expired") v.savedAt = NOW - 13 * 3600_000;
      if (kind === "future") v.savedAt = NOW + 120000;
      if (kind === "wrong-game") v.state.gameId = "after-dark";
      if (kind === "wrong-shape") v.state.teams = null;
      sessionStorage.setItem(
        "nocturne.couch.resume",
        kind === "broken" ? "not json" : JSON.stringify(v),
      );
      expect(readCouchCheckpoint(NOW)).toBeNull();
      expect(sessionStorage.getItem("nocturne.couch.resume")).toBeNull();
    },
  );
  it("recovers the active game in a mixed queue, and explicit exit removes recovery", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const s = reduceCouch(reduceCouch(fresh(), { type: "NEXT", at: NOW }), {
      type: "NEXT",
      at: NOW,
    });
    save(s);
    const checkpoint = readCouchCheckpoint()!;
    render(
      <GangSharedNight
        queue={checkpoint.queue}
        players={players}
        checkpoint={checkpoint}
        onExit={() => {}}
      />,
    );
    expect(screen.getByTestId("couch-player")).toHaveAttribute(
      "data-game",
      "panic-button",
    );
    expect(screen.getByText("Kurz durchatmen.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Spiel verlassen" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Spiel verlassen" })[1]!,
    );
    expect(sessionStorage.getItem("nocturne.couch.resume")).toBeNull();
  });
  it("stores no unknown fields, audio bytes, or blob URLs", () => {
    const s = { ...fresh(), privateAnswers: ["secret"], blob: "blob:private" };
    save(s);
    const raw = sessionStorage.getItem("nocturne.couch.resume")!;
    expect(raw).not.toContain("secret");
    expect(raw).not.toContain("blob:");
    clearCouchCheckpoint();
    expect(readCouchCheckpoint(NOW)).toBeNull();
  });
});

it("local music recovery reconnects original files without replacing the deck or scores", async () => {
  const { localAudioId } = await import("@/lib/gang/local-audio");
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => "blob:reconnected",
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: () => {},
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  const files = [
    new File(["a"], "Hidden artist A.wav", {
      type: "audio/wav",
      lastModified: 1,
    }),
    new File(["b"], "Hidden artist B.wav", {
      type: "audio/wav",
      lastModified: 2,
    }),
  ];
  let state = createCouchSession({
    gameId: "music-drop",
    playerCount: 4,
    seed: 12,
    rounds: 2,
    musicMode: "local",
  });
  state = reduceCouch(reduceCouch(state, { type: "NEXT", at: NOW }), {
    type: "NEXT",
    at: NOW,
  });
  state = { ...state, scores: { t1: 6, t2: 0, t3: 2, t4: 0 } };
  writeCouchCheckpoint(
    {
      queue: ["music-drop"],
      index: 0,
      players,
      display: "phone",
      state,
      audioIds: files.map(localAudioId),
    },
    NOW,
  );
  const checkpoint = readCouchCheckpoint(NOW + 1000)!;
  render(
    <GangSharedNight
      queue={checkpoint.queue}
      players={players}
      checkpoint={checkpoint}
      onExit={() => {}}
    />,
  );
  expect(screen.getByRole("button", { name: "Weiter geht’s" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Musikordner wieder verbinden"), {
    target: { files: [files[0]] },
  });
  expect(screen.getByRole("alert").textContent).toContain("fehlen");
  expect(screen.getByRole("button", { name: "Weiter geht’s" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Musikordner wieder verbinden"), {
    target: { files },
  });
  expect(screen.getByRole("button", { name: "Weiter geht’s" })).toBeEnabled();
  expect(document.body.textContent).not.toContain("Hidden artist");
  const saved = JSON.parse(sessionStorage.getItem("nocturne.couch.resume")!);
  expect(saved.state.scores).toEqual(state.scores);
  expect(saved.state.deck).toEqual(state.deck);
  expect(JSON.stringify(saved)).not.toContain("blob:");
  expect(JSON.stringify(saved)).not.toContain("Hidden artist");
});
