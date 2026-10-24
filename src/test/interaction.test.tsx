import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SceneView } from "@/components/player/SceneView";
import { SCENES } from "@/lib/game/scenes";
import { contractIssues, enforceContract } from "@/lib/game/contract";
import { toScene } from "@/lib/game/ai-schema";
import type { Scene } from "@/lib/game/types";

const P: [string, string] = ["Ari", "Nova"];
const base = (o: Partial<Scene>): Scene => ({ id: "t", type: "QUESTION", flavor: "funny", phase: 0, title: "T", prompt: "Was war dein peinlichster Moment?", source: "local", ...o });
const ai = (o: Record<string, unknown>) => ({ id: "x1", type: "QUESTION", targetPlayer: "Ari", title: "Titel", prompt: "Was war heute dein bester Moment?", choices: [], ...o });
const renderScene = (scene: Scene, onDone = vi.fn()) => {
  render(<SceneView scene={scene} me="Ari" you="Nova" memory={false} onDone={onDone} onSkip={vi.fn()} />);
  return onDone;
};

describe("interaction contract", () => {
  it("every local scene satisfies the contract", () => {
    const bad = SCENES.filter((s) => contractIssues(s).length).map((s) => `${s.id}: ${s.prompt}`);
    expect(bad).toEqual([]);
  });

  it("repairs a QUESTION with structured choices into CHOICE", () => {
    expect(enforceContract(base({ prompt: "Welcher Snack?", choices: ["Chips", "Schoko"] }))?.type).toBe("CHOICE");
  });

  it("repairs a partner-guess QUESTION with choices into PREDICTION", () => {
    expect(enforceContract(base({ prompt: "Was wählt {you}?", choices: ["Strand", "Stadt"] }))?.type).toBe("PREDICTION");
  });

  it("rejects the screenshot scene: options only embedded in prompt text", () => {
    expect(enforceContract(base({ prompt: "Strand, Großstadt, Hütte ohne Netz: Was wählt {you}? Und was würdest du heimlich wählen?" }))).toBeNull();
  });

  it("AI: rejects choice language without choices", () => {
    expect(toScene(ai({ prompt: "Drei Optionen: wähle eine für Nova." }), P, 0, true)).toBeNull();
  });

  it("AI: rejects CHOICE / PREDICTION / SYNC with fewer than two choices", () => {
    for (const type of ["CHOICE", "PREDICTION", "SYNC"]) expect(toScene(ai({ type, choices: ["Nur eins"] }), P, 0, true)).toBeNull();
  });

  it("AI: accepts a valid PREDICTION", () => {
    const s = toScene(ai({ type: "PREDICTION", prompt: "Strand. Großstadt. Hütte ohne Netz.", choices: ["Strand", "Großstadt", "Hütte"] }), P, 0, true);
    expect(s?.type).toBe("PREDICTION");
  });
});

describe("scene UI", () => {
  it("verbal question shows a clear 'laut antworten' cue", () => {
    renderScene(base({}));
    expect(screen.getByTestId("scene-cue").textContent).toMatch(/Laut antworten/);
  });

  it("choice CTA is disabled until a selection is made", () => {
    renderScene(base({ type: "CHOICE", prompt: "Welcher Snack?", choices: ["Chips", "Schoko"] }));
    const cta = screen.getByRole("button", { name: "Erst wählen" });
    expect(cta).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Chips/ }));
    expect(screen.getByRole("button", { name: /Entschieden/ })).toBeEnabled();
  });

  it("prediction: full flow, secret hidden on handoff, reveal shows hit", () => {
    const scene = SCENES.find((s) => s.title === "Wohin verschwinden wir?")!;
    const onDone = renderScene(scene);
    expect(screen.getByTestId("prediction-question").textContent).toBe("Was glaubst du, wählt Nova?");
    expect(screen.getByRole("button", { name: "Erst wählen" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Großstadt/ }));
    fireEvent.click(screen.getByRole("button", { name: /Getippt/ }));
    expect(screen.getByTestId("prediction-question").textContent).toBe("Und du?");
    fireEvent.click(screen.getByRole("radio", { name: /Strand/ }));
    fireEvent.click(screen.getByRole("button", { name: /weitergeben/ }));
    // handoff: no secret value visible
    expect(screen.queryByText("Großstadt")).toBeNull();
    expect(screen.queryByText("Strand")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Ich bin Nova/ }));
    expect(screen.getByTestId("prediction-question").textContent).toBe("Wohin würdest du verschwinden?");
    fireEvent.click(screen.getByRole("radio", { name: /Großstadt/ }));
    fireEvent.click(screen.getByRole("button", { name: "Auflösen" }));
    expect(screen.getByTestId("prediction-result").textContent).toBe("Zu gut gelesen.");
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(onDone).toHaveBeenCalledWith({ syncMatch: true });
  });

  it("alternating rush is a real microgame, not a passive timer", () => {
    const scene = SCENES.find((s) => s.title === "Wortkette")!;
    renderScene(scene);
    expect(screen.getByTestId("scene-cue").textContent).toMatch(/App hält den Puls/);
    expect(screen.getByRole("button", { name: "3 · 2 · 1" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Fertig" })).toBeNull();
  });

  it("tap rush exposes a live hit counter start instead of a generic timer", () => {
    const scene = SCENES.find((s) => s.title === "Zehn Dinge")!;
    renderScene(scene);
    expect(screen.getByTestId("scene-cue").textContent).toMatch(/Treffer/);
    expect(screen.getByRole("button", { name: /Start · 20s/ })).toBeEnabled();
  });

  it("Heatcheck missions are judged by the opponent before Sparks are awarded", () => {
    const scene = SCENES.find((s) => s.title === "Berufswunsch")!;
    const onDone = vi.fn();
    const onSkip = vi.fn();
    render(
      <SceneView
        scene={scene}
        me="Ari"
        you="Nova"
        memory={false}
        onDone={onDone}
        onSkip={onSkip}
        battle={{ players: P, missionOwner: null, onWin: vi.fn(), onMissionResult: (success) => success ? onDone() : onSkip() }}
      />,
    );
    expect(screen.getByText(/Nova entscheidet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Bewertung/ }));
    expect(screen.getByText(/Nova ist Referee/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Treffer/ }));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("prediction mismatch reads as plot twist", () => {
    renderScene(base({ type: "PREDICTION", prompt: "Kaffee oder Tee.", helper: "Was trinkst du?", choices: ["Kaffee", "Tee"] }));
    fireEvent.click(screen.getByRole("radio", { name: /Kaffee/ }));
    fireEvent.click(screen.getByRole("button", { name: /Getippt/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nicht verraten" }));
    fireEvent.click(screen.getByRole("button", { name: /Ich bin Nova/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Tee/ }));
    fireEvent.click(screen.getByRole("button", { name: "Auflösen" }));
    expect(screen.getByTestId("prediction-result").textContent).toBe("Okay. Plot Twist.");
  });

  it("sync: A's pick is hidden after handoff, reveal shows both", () => {
    const onDone = renderScene(base({ type: "SYNC", prompt: "Perfekter Abend?", choices: ["Kino", "Sofa"] }));
    fireEvent.click(screen.getByRole("radio", { name: /Kino/ }));
    fireEvent.click(screen.getByRole("button", { name: /Verdecken/ }));
    expect(screen.queryByText("Kino")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Ich bin Nova/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Sofa/ }));
    fireEvent.click(screen.getByRole("button", { name: "Auflösen" }));
    expect(screen.getByText("Kino")).toBeInTheDocument();
    expect(screen.getByText("Sofa")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(onDone).toHaveBeenCalledWith({ syncMatch: false });
  });
});