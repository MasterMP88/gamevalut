import { describe, expect, it } from "vitest";
import { createSession, DEFAULT_SETTINGS } from "@/lib/game/engine";
import {
  PENDING_GUEST_KEY,
  PENDING_GUEST_TTL_MS,
  createPendingGuestSnapshot,
  readPendingGuest,
  stashPendingGuest,
} from "@/lib/pending-guest";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}

function sensitiveSession() {
  const s = createSession("night-echo", ["Ari", "Nova"], DEFAULT_SETTINGS, 7);
  return {
    ...s,
    anchors: [{
      id: "private-1",
      owner: "Ari",
      shortText: "dieser Satz darf niemals in localStorage",
      tags: ["future"],
      sceneNumber: 1,
      sensitivity: "high" as const,
      dueAt: 8,
      used: false,
    }],
    aiQueue: [{
      ...s.current!,
      id: "ai-private",
      source: "ai" as const,
      prompt: "KI zitiert diesen privaten Satz",
    }],
    current: { ...s.current!, source: "echo" as const, prompt: "Echo mit privatem Inhalt" },
  };
}

describe("guest -> account bridge", () => {
  it("stores only sanitized structural state", () => {
    const snapshot = createPendingGuestSnapshot(sensitiveSession(), 1000);
    const raw = JSON.stringify(snapshot);
    expect(raw).not.toContain("dieser Satz darf niemals");
    expect(raw).not.toContain("KI zitiert");
    expect(raw).not.toContain("Echo mit privatem Inhalt");
    expect(snapshot.state.anchors).toEqual([]);
    expect(snapshot.state.aiQueue).toEqual([]);
    expect(snapshot.state.current).toBeNull();
    expect(snapshot.expiresAt - snapshot.createdAt).toBe(PENDING_GUEST_TTL_MS);
  });

  it("round-trips a valid snapshot and re-sanitizes it on read", () => {
    const storage = new MemoryStorage();
    const state = sensitiveSession();
    stashPendingGuest(state, storage as unknown as Storage, 5000);
    const p = readPendingGuest(storage as unknown as Storage, 5001);
    expect(p?.gameId).toBe("night-echo");
    expect(p?.state.anchors).toEqual([]);
    expect(p?.state.aiQueue).toEqual([]);
  });

  it("deletes expired and malformed snapshots", () => {
    const storage = new MemoryStorage();
    stashPendingGuest(sensitiveSession(), storage as unknown as Storage, 100);
    expect(readPendingGuest(storage as unknown as Storage, 100 + PENDING_GUEST_TTL_MS + 1)).toBeNull();
    expect(storage.getItem(PENDING_GUEST_KEY)).toBeNull();

    storage.setItem(PENDING_GUEST_KEY, "{broken");
    expect(readPendingGuest(storage as unknown as Storage, 200)).toBeNull();
    expect(storage.getItem(PENDING_GUEST_KEY)).toBeNull();
  });
});
