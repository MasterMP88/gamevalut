export interface RevisionPlan {
  previous: number;
  next: number;
}

export function planRevision(current = 0): RevisionPlan {
  const previous = Number.isFinite(current) && current >= 0 ? Math.floor(current) : 0;
  return { previous, next: previous + 1 };
}

export function revisionConfirmed(plan: RevisionPlan, returned: number | null | undefined): boolean {
  return returned === plan.next;
}

export interface EqChain<T> {
  eq(column: string, value: unknown): T;
}

/** Applies the compare-and-swap guard every cloud session update must use. */
export function guardSessionUpdate<T extends EqChain<T>>(query: T, rowId: string, plan: RevisionPlan): T {
  return query.eq("id", rowId).eq("revision", plan.previous);
}
