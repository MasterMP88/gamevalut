import type { AiCapability } from "./policy";
import { AI_MONTHLY_POLICIES } from "./policy";

export type PersistentQuotaResult =
  | { allowed: true; remainingCalls?: number; remainingUnits?: number }
  | {
      allowed: false;
      reason:
        | "auth"
        | "disabled"
        | "user-call-limit"
        | "user-unit-limit"
        | "global-spend-cap"
        | "unavailable";
    };

function globalCapMicrousd() {
  const raw = Number(process.env["NOCTURNE_AI_GLOBAL_MONTHLY_USD_CAP"] ?? "0");
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.floor(raw * 1_000_000);
}

export async function reservePersistentAiQuota(input: {
  userId: string | null | undefined;
  capability: AiCapability;
  units: number;
}): Promise<PersistentQuotaResult> {
  if (!input.userId) return { allowed: false, reason: "auth" };

  const monthly = AI_MONTHLY_POLICIES[input.capability];
  if (!monthly || monthly.maxCalls <= 0 || monthly.maxUnits <= 0) {
    return { allowed: false, reason: "disabled" };
  }

  const globalCap = globalCapMicrousd();
  if (globalCap <= 0) return { allowed: false, reason: "disabled" };

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).rpc("ai_reserve_usage", {
      p_user_id: input.userId,
      p_capability: input.capability,
      p_units: input.units,
      p_reserved_microusd: monthly.reserveMicrousdPerCall,
      p_user_call_limit: monthly.maxCalls,
      p_user_unit_limit: monthly.maxUnits,
      p_global_reserved_microusd_limit: globalCap,
    });

    if (error || !data || typeof data !== "object") {
      return { allowed: false, reason: "unavailable" };
    }

    const result = data as Record<string, unknown>;
    if (result["allowed"] === true) {
      return {
        allowed: true,
        remainingCalls:
          typeof result["remainingCalls"] === "number"
            ? result["remainingCalls"]
            : undefined,
        remainingUnits:
          typeof result["remainingUnits"] === "number"
            ? result["remainingUnits"]
            : undefined,
      };
    }

    const reason = String(result["reason"] ?? "unavailable");
    if (
      reason === "disabled" ||
      reason === "global-cap-disabled"
    ) {
      return { allowed: false, reason: "disabled" };
    }
    if (reason === "user-call-limit") {
      return { allowed: false, reason: "user-call-limit" };
    }
    if (reason === "user-unit-limit") {
      return { allowed: false, reason: "user-unit-limit" };
    }
    if (reason === "global-spend-cap") {
      return { allowed: false, reason: "global-spend-cap" };
    }
    return { allowed: false, reason: "unavailable" };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}

export async function refundPersistentAiQuota(input: {
  userId: string | null | undefined;
  capability: AiCapability;
  units: number;
}) {
  if (!input.userId) return;
  const monthly = AI_MONTHLY_POLICIES[input.capability];
  if (!monthly || monthly.reserveMicrousdPerCall <= 0) return;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).rpc("ai_refund_usage", {
      p_user_id: input.userId,
      p_capability: input.capability,
      p_units: input.units,
      p_reserved_microusd: monthly.reserveMicrousdPerCall,
    });
  } catch {
    // Fail closed on future calls; a missed refund only makes the budget stricter.
  }
}
