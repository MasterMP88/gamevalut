import { describe, expect, it } from "vitest";
import { saveRevisioned, type SaveDb } from "@/lib/game/save";
import { buildPending, PENDING_KEY, PENDING_TTL_MS, readPending, stashPending } from "@/lib/game/pending";
import { createSession, DEFAULT_SETTINGS } from "@/lib/game/engine";
import type { SessionState } from "@/lib/game/types";

/** In-memory fake that mirrors the DB: filter by id+revision, guard trigger drops non-increasing revisions. */
function fakeDb() {
  const rows = new Map<string, { revision: number; data: unknown }>();
  let n = 0;
  const db: SaveDb<{ data: unknown }> = {
    async update(id, prev, row) {
      const cur = rows.get(id);
      if (!cur || cur.revision !== prev) return null;
      if (row.revision <= cur.revision) return { id, revision: cur.revision };
      rows.set(id, { revision: row.revision, data: row.data });
      return { id, revision: row.revision };
    },
    async insert(row) {
      const id = `r${++n}`;
      rows.set(id, { revision: row.revision, data: row.data });
      return { id, revision: row.revision };
    },
  };
  return { db, rows };
}

describe("optimistic concurrency", () => {
  it("insert starts at revision 1, serialized saves advance by exactly one", async () => {
    const { db, rows } = fakeDb();
    const a = await saveRevisioned(db, undefined, undefined, { data: 1 });
    expect(a).toEqual({ ok: true, id: "r1", revision: 1 });
    let rev = 1;
    for (let i = 2; i <= 6; i++) {
      const r = await saveRevisioned(db, "r1", rev, { data: i });
      expect(r.ok).toBe(true);
      if (r.ok) rev = r.revision;
    }
    expect(rev).toBe(6);
    expect(rows.get("r1")).toEqual({ revision: 6, data: 6 });
  });

  it("a stale tab cannot be marked saved and cannot overwrite a newer cloud state", async () => {
    const { db, rows } = fakeDb();
    await saveRevisioned(db, undefined, undefined, { data: "A1" });
    // device B moves ahead
    await saveRevisioned(db, "r1", 1, { data: "B2" });
    await saveRevisioned(db, "r1", 2, { data: "B3" });
    // device A still believes revision 1
    const stale = await saveRevisioned(db, "r1", 1, { data: "A2" });
    expect(stale).toEqual({ ok: false, conflict: true });
    expect(rows.get("r1")).toEqual({ revision: 3, data: "B3" });
  });
});

function richSession(): SessionState {
  const s = createSession("night-echo", ["Ari", "Nova"], DEFAULT_SETTINGS, 7);
  return {
    ...s,
    anchors: [{ id: "x", text: "Geheimer Satz", owner: 0 } as never],
    aiQueue: [{ id: "ai", text: "Zitat: Geheimer Satz" } as never],
    current: s.current ? ({ ...s.current, source: "ai", prompt: "Echo: Geheimer Satz" } as never) : s.current,
    tracklist: [{ title: "Private Song" } as never],
  };
}

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
}

describe("pending guest snapshot", () => {
  it("contains no intimate free-text", () => {
    const json = JSON.stringify(buildPending(richSession(), DEFAULT_SETTINGS, 0));
    expect(json).not.toContain("Geheimer Satz");
    expect(json).not.toContain("Private Song");
    const p = buildPending(richSession(), DEFAULT_SETTINGS, 0);
    expect(p.state.anchors).toEqual([]);
    expect(p.state.aiQueue).toEqual([]);
    expect(p.state.current).toBeNull();
  });

  it("restores within 2h with a fresh local scene, expires after", () => {
    const st = mem();
    stashPending(st, richSession(), DEFAULT_SETTINGS, 1000);
    const ok = readPending(st, 1000 + PENDING_TTL_MS - 1);
    expect(ok?.gameId).toBe("night-echo");
    expect(ok?.state.current).not.toBeNull();
    expect(readPending(st, 1000 + PENDING_TTL_MS + 1)).toBeNull();
    expect(st.m.has(PENDING_KEY)).toBe(false);
  });

  it("deletes malformed or incompatible snapshots", () => {
    const st = mem();
    st.setItem(PENDING_KEY, "{not json");
    expect(readPending(st)).toBeNull();
    expect(st.m.has(PENDING_KEY)).toBe(false);
    const p = buildPending(richSession(), DEFAULT_SETTINGS, Date.now());
    st.setItem(PENDING_KEY, JSON.stringify({ ...p, stateVersion: 999 }));
    expect(readPending(st)).toBeNull();
    expect(st.m.has(PENDING_KEY)).toBe(false);
  });
});