import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Entitlement } from "@/lib/entitlements";

/** Current user's entitlements via RLS. Guests get an empty list. */
export function useEntitlements(opts?: { refetchMs?: number | false }) {
  const { user, ready } = useAuth();
  const uid = user?.id;
  const q = useQuery({
    queryKey: ["entitlements", uid],
    enabled: !!uid,
    refetchInterval: opts?.refetchMs ?? false,
    queryFn: async () => {
      const { data, error } = await supabase.from("entitlements").select("product_key, status, starts_at, ends_at").eq("user_id", uid!);
      if (error) throw error;
      return (data ?? []) as Entitlement[];
    },
  });
  return { ents: q.data ?? [], loading: !ready || (!!uid && q.isLoading), signedIn: !!uid, refetch: q.refetch };
}
