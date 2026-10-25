/**
 * Optimistic-concurrency save. A row is only updated when its stored revision equals
 * the revision this tab last confirmed; otherwise it is a conflict (another device is
 * ahead) and nothing is overwritten. The caller advances its local revision only from
 * the returned, DB-confirmed value.
 */
export interface SaveDb<R> {
  /** UPDATE … WHERE id = rowId AND revision = prev RETURNING id, revision */
  update(rowId: string, prev: number, row: R & { revision: number }): Promise<{ id: string; revision: number } | null>;
  /** INSERT … RETURNING id, revision */
  insert(row: R & { revision: number }): Promise<{ id: string; revision: number }>;
}

export type SaveResult = { ok: true; id: string; revision: number } | { ok: false; conflict: true };

export const FIRST_REVISION = 1;

export async function saveRevisioned<R>(db: SaveDb<R>, rowId: string | undefined, prev: number | undefined, row: R): Promise<SaveResult> {
  if (!rowId) {
    const r = await db.insert({ ...row, revision: FIRST_REVISION });
    return { ok: true, id: r.id, revision: r.revision };
  }
  const base = prev ?? 0;
  const r = await db.update(rowId, base, { ...row, revision: base + 1 });
  if (!r) return { ok: false, conflict: true };
  return { ok: true, id: r.id, revision: r.revision };
}
