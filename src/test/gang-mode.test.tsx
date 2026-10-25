import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { GangMode } from "@/components/gang/GangMode";
import { GangPlayer } from "@/components/gang/GangPlayer";
import { GANG_GAMES } from "@/lib/gang/catalog";
import { directorNight, roster } from "@/lib/gang/night";
import { getGangPlaybook } from "@/lib/gang/core/playbooks";
import { createGangRuntime } from "@/lib/gang/core/runtime";

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("GANG MODE integration", () => {
  it("has no preview / coming-soon copy", () => {
    const src = readFileSync("src/routes/gang.tsx", "utf8") + readFileSync("src/components/gang/GangMode.tsx", "utf8") + readFileSync("src/components/gang/GangPlayer.tsx", "utf8");
    render(<GangMode hostAllowed />);
    const text = document.body.textContent ?? "";
    for (const bad of ["PROTOTYPE", "IN DEVELOPMENT", "MULTIPLAYER RUNTIME · COMING NEXT", "heute startet hier noch kein Raum", "Spielbar ist in GANG MODE heute noch nichts"]) {
      expect(src).not.toContain(bad);
      expect(text).not.toContain(bad);
    }
  });

  it("every one of the 16 games has a start CTA and a startable runtime at its min size", () => {
    expect(GANG_GAMES).toHaveLength(16);
    render(<GangMode hostAllowed />);
    for (const g of GANG_GAMES) {
      expect(screen.getByRole("button", { name: `${g.title} öffnen` })).toBeTruthy();
      expect(() => createGangRuntime({ id: "t", gameId: g.id, players: roster(g.min, []) })).not.toThrow();
    }
  });

  it("BLUFF recommends EVERYONE IN for sealed lies, with no handoff curtain", () => {
    render(<GangMode hostAllowed />);
    click("BLUFF öffnen");
    click("Spiel starten");
    expect(screen.getByTestId("everyone-in-setup").textContent).toContain("PASST ZU DIESEM GAME");
    expect(screen.getByRole("button", { name: "Raum öffnen" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: /TV\/Laptop als Bühne/ }).getAttribute("aria-checked")).toBe("false");
    expect(screen.queryByTestId("curtain")).toBeNull();
    expect(document.body.textContent).not.toContain("Gib das Handy an");
    expect(screen.queryByText(/SPIELER MÖGLICH/)).toBeNull();
  });

  it("THE MAJORITY starts with one shared phone and remains fully playable", () => {
    render(<GangMode hostAllowed />);
    click("THE MAJORITY öffnen");
    click("Spiel starten");
    expect(screen.queryByTestId("everyone-in-setup")).toBeNull();
    expect(screen.getByText(/3–99 SPIELER MÖGLICH/)).toBeTruthy();
    click("Los");
    click("Los geht's");
    expect(screen.getByTestId("curtain").textContent).toContain("Gib das Handy an");
  });


  it("START MY NIGHT builds a non-empty queue and launches it", () => {
    expect(directorNight({ vibe: "Funny", duration: 30, players: 6, caps: [] }).gameIds.length).toBeGreaterThan(0);
    render(<GangMode hostAllowed />);
    click(/START MY NIGHT/);
    click("Weiter");
    click("Funny");
    click("Weiter");
    click("30 min");
    click("Weiter");
    click("Night zusammenstellen");
    const summary = screen.getByTestId("night-summary");
    expect(within(summary).getAllByRole("listitem").length).toBeGreaterThan(0);
    click("Night starten");
    const sharedPhone = screen.queryByRole("button", { name: "Mit einem Handy spielen" });
    if (sharedPhone) fireEvent.click(sharedPhone);
    click("Night starten");
    expect(screen.getByRole("button", { name: "Los geht's" })).toBeTruthy();
  });

  it("BUILD A MIX keeps the chosen order", () => {
    render(<GangMode hostAllowed />);
    click(/BUILD A MIX/);
    click("WHO'S THAT? zum Mix");
    click("THE MAJORITY zum Mix");
    expect(screen.getByTestId("mix-order").textContent).toBe("WHO'S THAT? → THE MAJORITY");
    click("Mix starten");
    expect(screen.getByRole("dialog", { name: "PLAYER SETUP" }).textContent).toContain("WHO'S THAT? → THE MAJORITY");
  });

  it("a mix transitions from game 1 to game 2 via intermission", () => {
    render(<GangPlayer queue={["the-line", "the-majority"]} players={roster(4, [])} onExit={() => {}} />);
    click("Los geht's");
    for (let i = 0; i < 30 && !screen.queryByTestId("finale"); i++) {
      const skip = screen.queryByRole("button", { name: "Runde überspringen" });
      if (skip) fireEvent.click(skip);
      const next = screen.queryByRole("button", { name: /Nächste Runde|Zum Finale/ });
      if (next) fireEvent.click(next);
    }
    expect(screen.getByTestId("finale")).toBeTruthy();
    click("Nächstes Spiel");
    expect(screen.getByTestId("intermission").textContent).toContain("THE MAJORITY");
    click("Weiter zu THE MAJORITY");
    expect(screen.getByRole("heading", { name: "THE MAJORITY" })).toBeTruthy();
  });

  it("UNDERCOVER never shows a secret word before the player reveals it", () => {
    const pb = getGangPlaybook("undercover")!;
    const words = pb.prompts.flatMap((p) => [p.answer, p.altPrompt]).filter((w): w is string => !!w && w.length > 2);
    render(<GangPlayer queue={["undercover"]} players={roster(4, [])} onExit={() => {}} />);
    click("Los geht's");
    const hasWord = () => words.some((w) => (document.body.textContent ?? "").includes(w));
    expect(screen.getByTestId("curtain")).toBeTruthy();
    expect(hasWord()).toBe(false);
    click("Ich bin Spieler 1");
    expect(hasWord()).toBe(false);
    fireEvent.pointerDown(screen.getByTestId("secret"));
    expect(hasWord()).toBe(true);
    fireEvent.pointerUp(screen.getByTestId("secret"));
    click("Gemerkt · weitergeben");
    // next player's curtain: previous secret is gone
    expect(screen.getByTestId("curtain").textContent).toContain("Spieler 2");
    expect(hasWord()).toBe(false);
  });
});
