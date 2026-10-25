import { createServerFn } from "@tanstack/react-start";
import { directorContextSchema } from "./game/ai-schema";
import { z } from "zod";
import { authorizeDirector } from "./director-access";

export const getDirectorScenes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    context: directorContextSchema,
    accessToken: z.string().min(20).max(4096),
  }).strict().parse(input))
  .handler(async ({ data }) => {
    const { verifyUser } = await import("./commerce/stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const identity = await authorizeDirector(data.accessToken, {
      verify: verifyUser,
      entitlements: async (uid) => {
        const { data: rows, error } = await supabaseAdmin.from("entitlements")
          .select("product_key,status,starts_at,ends_at").eq("user_id", uid);
        if (error) throw error;
        return rows ?? [];
      },
      reserve: async (uid) => {
        // No unpriced model calls: an operator must configure the conservative
        // per-call reservation for the deployed model. Existing global kill switch applies.
        const reserve = Number(process.env["AI_DIRECTOR_RESERVATION_MICROUSD"]);
        if (!Number.isSafeInteger(reserve) || reserve <= 0 || reserve > 1_000_000) return false;
        const { data: result, error } = await supabaseAdmin.rpc("ai_reserve_usage" as never, {
          p_user_id: uid, p_capability: "director", p_units: 3,
          p_reserved_microusd: reserve, p_user_call_limit: 48, p_user_unit_limit: 144,
          p_global_reserved_microusd_limit: 50_000_000,
        } as never);
        return !error && (result as { allowed?: boolean } | null)?.allowed === true;
      },
    });
    if (!identity) return { ok: false as const, reason: "unavailable" as const };
    const { runDirector } = await import("./director.server");
    return runDirector(data.context, AbortSignal.timeout(12_000));
  });
