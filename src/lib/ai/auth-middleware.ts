import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export const aiAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    if (!isSupabaseConfigured()) return next();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next(
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {},
    );
  })
  .server(async ({ next }) => {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return next({ context: { aiUserId: null as string | null } });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next({ context: { aiUserId: null as string | null } });
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      const userId = error ? null : data.user?.id ?? null;
      return next({ context: { aiUserId: userId } });
    } catch {
      return next({ context: { aiUserId: null as string | null } });
    }
  });
