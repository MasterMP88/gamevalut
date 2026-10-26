import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
const mock = vi.hoisted(() => ({
  callback: (_event: string, _s: unknown) => {},
  resolve: (_r: unknown) => {},
  unsubscribe: vi.fn(),
}));
vi.mock("@/lib/content-history", () => ({
  activateHistoryAccount: vi.fn(),
  mergeStoredHistory: () => [],
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: typeof mock.callback) => {
        mock.callback = cb;
        return { data: { subscription: { unsubscribe: mock.unsubscribe } } };
      },
      getUser: () =>
        new Promise((r) => {
          mock.resolve = r;
        }),
      signOut: async () => ({ error: null }),
    },
    from: () => {
      type Result = { data: unknown[]; error: null };
      type Query = {
        upsert(): Query;
        select(): Query;
        eq(): Query;
        order(): Query;
        limit(): Query;
        then(fn: (r: Result) => unknown): Promise<unknown>;
      };
      const q: Query = {
        upsert: () => q,
        select: () => q,
        eq: () => q,
        order: () => q,
        limit: () => q,
        then: (fn: (r: Result) => unknown) =>
          Promise.resolve({ data: [], error: null }).then(fn),
      };
      return q;
    },
  },
}));
import { AuthProvider, useAuth } from "@/lib/auth";
import { reconcileSessionOwner } from "@/lib/session-boundary";
function View() {
  const { user, ready } = useAuth();
  const [privateState, setPrivateState] = useState("");
  return (
    <>
      <output>
        {ready ? (user?.id ?? "guest") : "loading"}:{privateState}
      </output>
      <button onClick={() => setPrivateState("private-night")}>Play</button>
    </>
  );
}
const signIn = (id: string | null) =>
  act(() =>
    mock.callback(
      "CHANGE",
      id ? { user: { id }, access_token: `token-${id}` } : null,
    ),
  );
beforeEach(() => sessionStorage.clear());
afterEach(() => cleanup());
describe("authentication identity boundary", () => {
  it.each([null, "b"])(
    "a late startup request cannot restore A after switching to %s",
    async (next) => {
      render(
        <AuthProvider>
          <View />
        </AuthProvider>,
      );
      signIn("a");
      fireEvent.click(screen.getByText("Play"));
      sessionStorage.setItem("nocturne.gang.player", "private-token");
      sessionStorage.setItem("nocturne.gang.maj.round", "choice");
      signIn(next);
      await act(async () => mock.resolve({ data: { user: { id: "a" } } }));
      expect(screen.getByRole("status").textContent).toBe(
        `${next ?? "guest"}:`,
      );
      expect(sessionStorage.getItem("nocturne.gang.player")).toBeNull();
      expect(sessionStorage.getItem("nocturne.gang.maj.round")).toBeNull();
    },
  );
  it("preserves a guest night on the first login", () => {
    render(
      <AuthProvider>
        <View />
      </AuthProvider>,
    );
    signIn(null);
    fireEvent.click(screen.getByText("Play"));
    signIn("first");
    expect(screen.getByRole("status").textContent).toBe("first:private-night");
  });
  it("removes stored capabilities if logout happened while this tab was closed", () => {
    reconcileSessionOwner("old");
    sessionStorage.setItem("nocturne.couple.player", "private");
    expect(reconcileSessionOwner(null)).toBe(true);
    expect(sessionStorage.getItem("nocturne.couple.player")).toBeNull();
  });
});
