import {
  activateHistoryAccount,
  mergeStoredHistory,
  type SeenContent,
} from "./content-history";
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { reconcileSessionOwner } from "./session-boundary";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  accessToken?: string | undefined;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({
  user: null,
  ready: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string>();
  const [identityEpoch, setIdentityEpoch] = useState(0);
  useEffect(() => {
    let stopped = false;
    let authEventSeen = false;
    let owner: string | null | undefined;
    const accept = (next: User | null, token?: string) => {
      if (stopped) return;
      if (reconcileSessionOwner(next?.id ?? null, owner))
        setIdentityEpoch((v) => v + 1);
      owner = next?.id ?? null;
      setUser(next);
      setAccessToken(token);
      setReady(true);
    };
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      authEventSeen = true;
      accept(session?.user ?? null, session?.access_token);
    });
    // A sign-out or account switch always wins over a slow initial request.
    void supabase.auth
      .getUser()
      .then(({ data: d }) => {
        if (!authEventSeen) accept(d.user ?? null);
      })
      .catch(() => {
        if (!authEventSeen) accept(null);
      });
    return () => {
      stopped = true;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    // Profile row is created on first sign-in (no privileged trigger needed).
    void supabase
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true })
      .then(() => undefined);
  }, [user]);
  const historyUserId = user?.id;
  useEffect(() => {
    if (!historyUserId) {
      activateHistoryAccount();
      return;
    }
    const uid = historyUserId;
    let stopped = false;
    const upload = (rows: SeenContent[]) => {
      if (!rows.length || stopped) return;
      void supabase
        .from("content_history")
        .upsert(
          rows.map((r) => ({
            user_id: uid,
            content_id: r.id,
            seen_at: new Date(r.at).toISOString(),
          })),
          { onConflict: "user_id,content_id" },
        )
        .then(() => undefined);
    };
    activateHistoryAccount(uid, upload);
    void supabase
      .from("content_history")
      .select("content_id,seen_at")
      .eq("user_id", uid)
      .order("seen_at", { ascending: false })
      .limit(20000)
      .then(({ data, error }) => {
        if (stopped || error) return;
        const remote = (data ?? []).map((r) => ({
          id: r.content_id,
          at: Date.parse(r.seen_at),
        }));
        const remoteTimes = new Map(remote.map((r) => [r.id, r.at]));
        const merged = mergeStoredHistory(remote, uid);
        upload(merged.filter((r) => r.at > (remoteTimes.get(r.id) ?? 0)));
      });
    return () => {
      stopped = true;
      activateHistoryAccount();
    };
  }, [historyUserId]);
  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        accessToken,
        signOut: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
        },
      }}
    >
      <Fragment key={identityEpoch}>{children}</Fragment>
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
