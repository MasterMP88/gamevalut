import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EnergyField } from "@/components/player/EnergyField";
import { SceneView } from "@/components/player/SceneView";
import type { Scene } from "@/lib/game/types";

const noop = () => {};

describe("in-game visual states", () => {
  it("energy field shows the real values and the changed energy", () => {
    const { rerender } = render(<EnergyField energies={{ chaos: 10, connection: 20, heat: 30 }} milestones={1} />);
    expect(screen.getByTestId("energy-field").getAttribute("aria-label")).toContain("Chaos 10, Connection 20, Heat 30");
    expect(screen.getByText("1/3 Meilensteine · Chaos braucht euch")).toBeTruthy();
    rerender(<EnergyField energies={{ chaos: 18, connection: 20, heat: 30 }} milestones={1} />);
    expect(screen.getByText("+8")).toBeTruthy();
    expect(screen.queryByText("+0")).toBeNull();
  });

  it("vault only reads as opening with 3 milestones and all energies at threshold", () => {
    render(<EnergyField energies={{ chaos: 80, connection: 75, heat: 69 }} milestones={3} />);
    expect(screen.queryByText("Vault öffnet sich")).toBeNull();
  });

  it("timer runs a 3-2-1 lead-in before going live", () => {
    vi.useFakeTimers();
    const scene: Scene = { id: "t", type: "TIMER", flavor: "game", phase: 0, title: "T", prompt: "Los", duration: 20 };
    render(<SceneView scene={scene} me="Ari" you="Nova" memory={false} onDone={noop} onSkip={noop} />);
    const timer = screen.getByRole("timer");
    expect(timer.getAttribute("data-phase")).toBe("ready");
    fireEvent.click(screen.getByLabelText("Start"));
    expect(screen.getByRole("timer").getAttribute("data-phase")).toBe("countdown");
    act(() => { vi.advanceTimersByTime(800); });
    act(() => { vi.advanceTimersByTime(800); });
    act(() => { vi.advanceTimersByTime(800); });
    expect(screen.getByRole("timer").getAttribute("data-phase")).toBe("live");
    vi.useRealTimers();
  });

  it("energy field marks a balanced field", () => {
    render(<EnergyField energies={{ chaos: 40, connection: 45, heat: 48 }} milestones={1} />);
    expect(screen.getByTestId("energy-field").getAttribute("data-balanced")).toBe("true");
  });

  it("returned echo links to the scene it was remembered in", () => {
    const scene: Scene = { id: "echo-a", type: "ECHO", flavor: "funny", phase: 1, title: "Echo", prompt: "Weißt du noch?", anchorId: "a", source: "echo" };
    render(<SceneView scene={scene} me="Ari" you="Nova" memory echoOf={{ text: "x", sceneNumber: 4, owner: "Nova" }} onDone={noop} onSkip={noop} />);
    expect(screen.getByTestId("echo-trace").textContent).toContain("Szene 4");
  });

  it("director cut gets its own interrupt state only in the Director", () => {
    const scene: Scene = { id: "cut-2", type: "MISSION", flavor: "funny", phase: 1, title: "Director Cut: Soundtrack", prompt: "Musik an." };
    const { container, rerender } = render(<SceneView scene={scene} me="Ari" you="Nova" memory={false} director onDone={noop} onSkip={noop} />);
    expect(container.querySelector("[data-cut]")).toBeTruthy();
    rerender(<SceneView scene={scene} me="Ari" you="Nova" memory={false} onDone={noop} onSkip={noop} />);
    expect(container.querySelector("[data-cut]")).toBeNull();
  });
});
