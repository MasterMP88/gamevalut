import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({ user: null, ready: false, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setReady(true);
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    supabase.auth.getUser().then(({ data: d }) => { setUser(d.user ?? null); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user) return;
    // Profile row is created on first sign-in (no privileged trigger needed).
    void supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true }).then(() => undefined);
  }, [user]);
  return <Ctx.Provider value={{ user, ready, signOut: async () => { await supabase.auth.signOut(); } }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);