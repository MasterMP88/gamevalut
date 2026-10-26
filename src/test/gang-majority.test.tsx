import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { GangPlayer, MajorityResult } from "@/components/gang/GangPlayer";
import { majorityResult } from "@/lib/gang/majority";
import { advanceGangStage, createGangRuntime, submitGangAction, type GangRuntimeState } from "@/lib/gang/core/runtime";
import { roster } from "@/lib/gang/night";

function withOptions(n: number, options: string[]): GangRuntimeState {
  const rt = createGangRuntime({ id: "t", gameId: "the-majority", players: roster(n, []), seed: 7 });
  return { ...rt, round: { ...rt.round, prompt: { ...rt.round.prompt, options } } };
}
const play = (rt: GangRuntimeState, preds: Record<string, string>, votes: Record<string, string>) => {
  let s = rt;
  for (const [id, o] of Object.entries(preds)) s = submitGangAction(s, { playerId: id, optionId: o, value: o });
  s = advanceGangStage(s, { force: true });
  for (const [id, o] of Object.entries(votes)) s = submitGangAction(s, { playerId: id, optionId: o, value: o });
  s = advanceGangStage(s, { force: true }); // → reveal
  return advanceGangStage(s); // → score, canonical resolution applied
};

describe("THE MAJORITY — canonical result", () => {
  it("Pizza/Pizza/Döner → 2/1, majority Pizza, only Pizza predictors +1", () => {
    const s = play(withOptions(3, ["Pizza", "Döner"]), { p1: "Pizza", p2: "Döner", p3: "Pizza" }, { p1: "Pizza", p2: "Pizza", p3: "Döner" });
    const r = majorityResult(s)!;
    expect(r.counts).toEqual({ Pizza: 2, "Döner": 1 });
    expect(r.winners).toEqual(["Pizza"]);
    expect(r.correct).toEqual(["p1", "p3"]);
    expect(s.scores).toEqual({ p1: 1, p2: 0, p3: 1 });
    render(<MajorityResult r={r} names={(ids) => ids} />);
    const rows = screen.getAllByTestId("majority-option");
    expect(rows.map((x) => x.getAttribute("data-count"))).toEqual(["2", "1"]);
    expect(rows[0]!.textContent).toContain("MEHRHEIT");
    expect(rows[0]!.textContent).toContain("67%");
    expect(screen.getByTestId("majority-correct").textContent).toBe("p1, p3");
  });

  it("2/2 tie → both options count, predictions for either score", () => {
    const s = play(withOptions(4, ["Pizza", "Döner"]), { p1: "Pizza", p2: "Döner", p3: "Pizza", p4: "Döner" }, { p1: "Pizza", p2: "Pizza", p3: "Döner", p4: "Döner" });
    const r = majorityResult(s)!;
    expect(r.winners.sort()).toEqual(["Döner", "Pizza"]);
    expect(Object.values(s.scores)).toEqual([1, 1, 1, 1]);
    render(<MajorityResult r={r} names={(ids) => ids} />);
    expect(screen.getAllByText(/GLEICHSTAND – BEIDE ZÄHLEN/)).toHaveLength(2);
  });

  it("a missing own answer never deadlocks and is excluded from the denominator; predictions never count as votes", () => {
    const s = play(withOptions(3, ["Pizza", "Döner"]), { p1: "Döner", p2: "Döner", p3: "Döner" }, { p1: "Pizza", p2: "Pizza" });
    const r = majorityResult(s)!;
    expect(s.round.stages[s.round.stageIndex]).toBe("score");
    expect(r.total).toBe(2);
    expect(r.eligible).toBe(3);
    expect(r.counts).toEqual({ Pizza: 2, "Döner": 0 });
    render(<MajorityResult r={r} names={(ids) => ids} />);
    expect(screen.getByText(/2 VON 3 STIMMEN/)).toBeTruthy();
  });
});

describe("THE MAJORITY — ONE PHONE single decision flow", () => {
  it("each player sees the question once, gives tip + own choice in one turn, and the phone is not passed again for answers", () => {
    render(<GangPlayer queue={["the-majority"]} players={roster(3, ["Ari", "Nova", "Kai"])} onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Los geht's" }));
    const handoffs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const curtain = screen.getByTestId("curtain");
      handoffs.push(curtain.textContent ?? "");
      fireEvent.click(within(curtain).getByRole("button", { name: /^Ich bin/ }));
      expect(screen.getAllByTestId("majority-question")).toHaveLength(1);
      const cta = screen.getByRole("button", { name: /Erst tippen/ });
      expect(cta).toBeDisabled();
      fireEvent.click(within(screen.getByTestId("majority-tip")).getAllByRole("radio")[0]!);
      fireEvent.click(within(screen.getByTestId("majority-own")).getAllByRole("radio")[i === 2 ? 1 : 0]!);
      fireEvent.click(screen.getByRole("button", { name: "Beides abgeben · weitergeben" }));
    }
    expect(handoffs).toHaveLength(3);
    expect(screen.queryByTestId("curtain")).toBeNull(); // no second loop for the own answer
    fireEvent.click(screen.getByRole("button", { name: "Aufdecken" }));
    const result = screen.getByTestId("majority-result");
    expect(result.textContent).toContain("3 VON 3 STIMMEN");
    expect(screen.getAllByTestId("majority-option").map((x) => Number(x.getAttribute("data-count"))).reduce((a, b) => a + b, 0)).toBe(3);
  });
});
