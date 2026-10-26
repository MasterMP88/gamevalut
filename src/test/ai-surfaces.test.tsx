import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JudgeReveal, ClueLadder, DirectorStatus } from "@/components/ai/AiSurfaces";

describe("AI surfaces render only real data", () => {
  it("judge shows nothing without a result or when unavailable", () => {
    const { container, rerender } = render(<JudgeReveal state={null} onContinue={() => {}} />);
    expect(container.textContent).toBe("");
    rerender(<JudgeReveal state={{ status: "unavailable" }} onContinue={() => {}} />);
    expect(container.textContent).toBe("");
  });
  it("judge keeps verdict sealed until opened", () => {
    render(<JudgeReveal state={{ status: "ready", result: { winnerId: "a", headline: "Knapp, aber klar", ranking: [{ id: "a", name: "Ari" }, { id: "b", name: "Nova" }] } }} onContinue={() => {}} />);
    expect(screen.queryByText("Knapp, aber klar")).toBeNull();
    fireEvent.click(screen.getByText("Urteil öffnen"));
    expect(screen.getByText("Knapp, aber klar")).toBeTruthy();
  });
  it("clue ladder shows exactly one clue and is dormant when empty", () => {
    const { container, rerender } = render(<ClueLadder clues={[]} revealed={0} onReveal={() => {}} />);
    expect(container.textContent).toBe("");
    rerender(<ClueLadder clues={["schwer", "mittel", "leicht"]} revealed={1} onReveal={() => {}} />);
    expect(screen.getByText("mittel")).toBeTruthy();
    expect(screen.queryByText("schwer")).toBeNull();
    expect(screen.queryByText("leicht")).toBeNull();
  });
  it("local fallback never reads like an error", () => {
    render(<DirectorStatus status="offline" />);
    expect(document.body.textContent).toMatch(/Director · lokal/);
    expect(document.body.textContent).not.toMatch(/error|fehler|offline|API/i);
  });
});
