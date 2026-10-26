import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CouchPlayer } from "@/components/gang/CouchPlayer";
import { GANG_EXPERIENCES, couchGame } from "@/lib/gang/core/experience";
import { couchRange } from "@/lib/gang/core/couch";
import type { GangGameId } from "@/lib/gang/core/playbooks";
import { GangMode } from "@/components/gang/GangMode";
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("shared-room gameplay", () => {
  it.each(
    Object.keys(GANG_EXPERIENCES).filter(
      (id) => couchGame(id) && id !== "music-drop",
    ),
  )("%s starts without QR, completes skipped rounds, and replays", (id) => {
    const gameId = id as GangGameId;
    render(
      <CouchPlayer
        gameId={gameId}
        count={Math.max(4, couchRange(gameId)[0])}
        rounds={2}
        onExit={() => {}}
      />,
    );
    click("Los geht’s");
    click("Runde starten");
    expect(screen.getByTestId("couch-player")).toHaveAttribute(
      "data-phase",
      "play",
    );
    expect(screen.queryByTestId("curtain")).toBeNull();
    expect(document.body.textContent).not.toContain("Raumcode");
    for (let i = 0; i < 2; i++) {
      click("Runde überspringen");
      click(id === "the-line" ? "Weiter" : "Punkte zeigen");
      click(i === 0 ? "Nächste Runde" : "Zum Finale");
      if (i === 0) click("Bereit. Los.");
    }
    expect(screen.getByTestId("couch-finale")).toBeTruthy();
    click("Noch eine. Genau eine.");
    click("Bereit. Los.");
    click("Runde überspringen");
    click(id === "the-line" ? "Weiter" : "Punkte zeigen");
    click("Zum Finale");
    expect(
      screen.queryByRole("button", { name: "Noch eine. Genau eine." }),
    ).toBeNull();
    click("Neu mischen");
    expect(screen.getByTestId("couch-player")).toHaveAttribute(
      "data-phase",
      "ready",
    );
  });
  it("MUSIC DROP refuses an imaginary playback experience and keeps filenames out of play", () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: () => "",
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: () => {},
    });
    const objectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:audio-test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(
      <CouchPlayer
        gameId="music-drop"
        count={6}
        rounds={2}
        onExit={() => {}}
      />,
    );
    click("Eigene Audiodateien");
    expect(screen.getByRole("button", { name: "Los geht’s" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Eure Musik mitbringen"), {
      target: {
        files: [
          new File(["audio"], "SecretArtist - HiddenTitle.wav", {
            type: "audio/wav",
          }),
          new File(["audio2"], "OtherHiddenTrack.wav", { type: "audio/wav" }),
        ],
      },
    });
    click("Los geht’s");
    click("Runde starten");
    expect(document.body.textContent).not.toContain("HiddenTitle");
    expect(document.body.textContent).not.toContain("OtherHiddenTrack");
    expect(screen.getByRole("button", { name: "Team A" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "12 Sekunden hören" }),
    ).toBeTruthy();
    objectUrl.mockRestore();
  });
  it("DJ mode starts without files, excludes the DJ, scores steals and supports finale, encore and a new DJ", () => {
    render(
      <CouchPlayer
        gameId="music-drop"
        count={3}
        names={["Mina", "Bo", "Ada"]}
        rounds={2}
        onExit={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Los geht’s" })).toBeEnabled();
    expect(screen.queryByLabelText("Eure Musik mitbringen")).toBeNull();
    expect(document.querySelector("input[type=file]")).toBeNull();
    expect(document.body.textContent).toContain("Apple Music oder Spotify");
    click("Los geht’s");
    click("Runde starten");
    expect(document.querySelector("audio")).toBeNull();
    expect(screen.queryByRole("button", { name: "Mina" })).toBeNull();
    expect(screen.getByRole("button", { name: "Bo" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Niemand erkannt · auflösen" }),
    ).toBeDisabled();
    click("Musik läuft · Raten öffnen");
    click("Bo");
    click("Daneben · Steal öffnen");
    expect(
      screen.getByRole("button", { name: "Bo · versucht" }),
    ).toBeDisabled();
    click("Ada");
    click("Richtig erkannt");
    expect(screen.getByText(/Mina, Bühne frei/)).toBeTruthy();
    click("Punkte zeigen");
    expect(screen.getByText("+1")).toBeTruthy();
    click("Nächste Runde");
    click("Bereit. Los.");
    expect(screen.getByRole("button", { name: "Bo" })).toBeDisabled();
    click("Musik läuft · Raten öffnen");
    click("Bo");
    click("Richtig erkannt");
    click("Punkte zeigen");
    expect(screen.getByText("+4")).toBeTruthy();
    click("Zum Finale");
    click("Noch eine. Genau eine.");
    click("Bereit. Los.");
    click("Runde überspringen");
    click("Punkte zeigen");
    click("Zum Finale");
    click("Neu mischen");
    fireEvent.change(screen.getByLabelText("Wer legt auf?"), {
      target: { value: "1" },
    });
    click("Los geht’s");
    click("Runde starten");
    expect(screen.getByRole("button", { name: "Mina" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Bo" })).toBeNull();
  });
  it("DJ mode permits app switching, explains separate pausing and ends after the only guesser's miss", () => {
    render(
      <CouchPlayer
        gameId="music-drop"
        count={2}
        rounds={2}
        display="phone"
        onExit={() => {}}
      />,
    );
    click("Los geht’s");
    click("Runde starten");
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.queryByText("Kurz durchatmen.")).toBeNull();
    click("Pause");
    expect(screen.getByText(/Die Musik pausiert ihr separat/)).toBeTruthy();
    click("Weiter geht’s");
    click("Musik läuft · Raten öffnen");
    click("Person 2");
    click("Daneben · auflösen");
    expect(screen.getByTestId("couch-player")).toHaveAttribute(
      "data-phase",
      "reveal",
    );
    click("Punkte zeigen");
    expect(screen.queryByText(/\+\d/)).toBeNull();
  });
  it("99-player DJ session keeps 98 guessers in six teams and has a clean abort", () => {
    const exit = vi.fn();
    render(
      <CouchPlayer gameId="music-drop" count={99} rounds={2} onExit={exit} />,
    );
    expect(screen.getByText(/98 raten mit/)).toBeTruthy();
    click("Los geht’s");
    click("Runde starten");
    click("Musik läuft · Raten öffnen");
    for (const name of ["A", "B", "C", "D", "E", "F"])
      expect(
        screen.getByRole("button", { name: `Team ${name}` }),
      ).toBeEnabled();
    click("Spiel verlassen");
    expect(
      screen.getByText(/Die Musik stoppt ihr in eurer Musik-App/),
    ).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Spiel verlassen" }).at(-1)!,
    );
    expect(exit).toHaveBeenCalledOnce();
  });
  it("99 players use six teams, real deadline, pause, and an accessible exit", () => {
    vi.useFakeTimers();
    render(
      <CouchPlayer
        gameId="panic-button"
        count={99}
        rounds={2}
        onExit={() => {}}
      />,
    );
    click("Los geht’s");
    click("Runde starten");
    expect(screen.getByText("ZUG 1 / 18")).toBeTruthy();
    click("Pause");
    vi.advanceTimersByTime(10000);
    click("Weiter geht’s");
    expect(screen.getByText("ZUG 1 / 18")).toBeTruthy();
    click("Gültig · weiter");
    expect(screen.getByText("ZUG 2 / 18")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByText("Schluss für heute?")).toBeTruthy();
    click("Zum Abschluss");
    expect(screen.getByTestId("couch-finale")).toBeTruthy();
  });
  it("direct TV route makes no participant join a room", () => {
    render(<GangMode hostAllowed />);
    click("THE MAJORITY öffnen");
    click("Spiel starten");
    expect(
      screen.getByRole("button", { name: "TV / Couch · ohne Beitritt" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Raum öffnen" })).toBeNull();
    click("Los");
    expect(screen.getByTestId("couch-player")).toBeTruthy();
  });
  it("Director preserves an explicit everyone-in selection for private games", () => {
    render(<GangMode hostAllowed />);
    click(/START MY NIGHT/);
    click("Alle haben ein eigenes Handy");
    click("Weiter");
    click("Funny");
    click("Weiter");
    click("30 min");
    click("Weiter");
    click("Night zusammenstellen");
    click("Night starten");
    expect(screen.getByTestId("everyone-in-setup")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Raum öffnen" })).toBeTruthy();
  });
});

it("public MUSIC DROP help explains independent music apps while the device variant remains song voting", async () => {
  const { GangGuide } = await import("@/components/gang/GangGuide");
  const { unmount } = render(<GangGuide id="music-drop" />);
  expect(document.body.textContent).toContain("Musik-App");
  expect(document.body.textContent).toContain(
    "NOCTURNE steuert die Musik-App nicht.",
  );
  expect(document.body.textContent).toContain("Steal");
  expect(document.body.textContent).not.toContain("Songtitel");
  unmount();
  render(<GangGuide id="music-drop" deviceRules />);
  expect(document.body.textContent).toContain("Songtitel");
  expect(document.body.textContent).not.toContain("Audiodateien");
});
