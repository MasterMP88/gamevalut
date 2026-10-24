import { describe, expect, it } from "vitest";
import { guardSessionUpdate, planRevision, revisionConfirmed } from "@/lib/game/revision";

class MockQuery {
  filters: [string, unknown][] = [];
  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }
}

describe("session revision contract", () => {
  it("plans a strictly increasing revision", () => {
    expect(planRevision(7)).toEqual({ previous: 7, next: 8 });
    expect(planRevision()).toEqual({ previous: 0, next: 1 });
  });

  it("guards every update by row id and previous revision", () => {
    const q = new MockQuery();
    const plan = planRevision(12);
    expect(guardSessionUpdate(q, "row-1", plan)).toBe(q);
    expect(q.filters).toEqual([["id", "row-1"], ["revision", 12]]);
  });

  it("only confirms exactly the requested next revision", () => {
    const plan = planRevision(4);
    expect(revisionConfirmed(plan, 5)).toBe(true);
    expect(revisionConfirmed(plan, undefined)).toBe(false);
    expect(revisionConfirmed(plan, 4)).toBe(false);
    expect(revisionConfirmed(plan, 6)).toBe(false);
  });
});
