-- Persistent AI economics guard for NOCTURNE.
-- Runtime remains disabled until ai_budget_config.enabled=true AND
-- NOCTURNE_AI_ENABLED=true AND NOCTURNE_AI_GLOBAL_MONTHLY_USD_CAP > 0.

CREATE TABLE IF NOT EXISTS public.ai_usage_monthly (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  capability text NOT NULL CHECK (capability IN (
    'director','personalize-pack','judge','adaptive-difficulty',
    'secret-mission','music-clue','narration','vision'
  )),
  calls integer NOT NULL DEFAULT 0 CHECK (calls >= 0),
  units integer NOT NULL DEFAULT 0 CHECK (units >= 0),
  reserved_microusd bigint NOT NULL DEFAULT 0 CHECK (reserved_microusd >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_start, capability)
);

CREATE INDEX IF NOT EXISTS ai_usage_monthly_user_period_idx
  ON public.ai_usage_monthly (user_id, period_start DESC);

ALTER TABLE public.ai_usage_monthly ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage_monthly FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ai_usage_monthly TO authenticated;
GRANT ALL ON public.ai_usage_monthly TO service_role;

DROP POLICY IF EXISTS "ai_usage_select_own" ON public.ai_usage_monthly;
CREATE POLICY "ai_usage_select_own"
  ON public.ai_usage_monthly
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.ai_global_usage_monthly (
  period_start date PRIMARY KEY,
  calls integer NOT NULL DEFAULT 0 CHECK (calls >= 0),
  units integer NOT NULL DEFAULT 0 CHECK (units >= 0),
  reserved_microusd bigint NOT NULL DEFAULT 0 CHECK (reserved_microusd >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_global_usage_monthly ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_global_usage_monthly FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_global_usage_monthly TO service_role;

CREATE TABLE IF NOT EXISTS public.ai_budget_config (
  id text PRIMARY KEY CHECK (id = 'global'),
  enabled boolean NOT NULL DEFAULT false,
  monthly_reserved_microusd_cap bigint NOT NULL DEFAULT 0
    CHECK (monthly_reserved_microusd_cap >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_budget_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_budget_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_budget_config TO service_role;

INSERT INTO public.ai_budget_config (id, enabled, monthly_reserved_microusd_cap)
VALUES ('global', false, 50000000)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ai_reserve_usage(
  p_user_id uuid,
  p_capability text,
  p_units integer,
  p_reserved_microusd bigint,
  p_user_call_limit integer,
  p_user_unit_limit integer,
  p_global_reserved_microusd_limit bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_period date := date_trunc('month', now())::date;
  v_user public.ai_usage_monthly%rowtype;
  v_global public.ai_global_usage_monthly%rowtype;
  v_enabled boolean := false;
  v_config_cap bigint := 0;
  v_effective_global_cap bigint := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'missing-user');
  END IF;

  IF p_capability NOT IN (
    'director','personalize-pack','judge','adaptive-difficulty',
    'secret-mission','music-clue','narration','vision'
  ) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid-capability');
  END IF;

  IF p_units <= 0 OR p_reserved_microusd < 0
     OR p_user_call_limit <= 0 OR p_user_unit_limit <= 0
     OR p_global_reserved_microusd_limit < 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid-limit');
  END IF;

  SELECT enabled, monthly_reserved_microusd_cap
    INTO v_enabled, v_config_cap
  FROM public.ai_budget_config
  WHERE id = 'global'
  FOR UPDATE;

  IF NOT coalesce(v_enabled, false) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'disabled');
  END IF;

  v_effective_global_cap :=
    CASE
      WHEN v_config_cap > 0 AND p_global_reserved_microusd_limit > 0
        THEN least(v_config_cap, p_global_reserved_microusd_limit)
      WHEN v_config_cap > 0 THEN v_config_cap
      ELSE p_global_reserved_microusd_limit
    END;

  IF v_effective_global_cap <= 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'global-cap-disabled');
  END IF;

  INSERT INTO public.ai_usage_monthly (user_id, period_start, capability)
  VALUES (p_user_id, v_period, p_capability)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.ai_global_usage_monthly (period_start)
  VALUES (v_period)
  ON CONFLICT DO NOTHING;

  SELECT *
    INTO v_user
  FROM public.ai_usage_monthly
  WHERE user_id = p_user_id
    AND period_start = v_period
    AND capability = p_capability
  FOR UPDATE;

  SELECT *
    INTO v_global
  FROM public.ai_global_usage_monthly
  WHERE period_start = v_period
  FOR UPDATE;

  IF v_user.calls + 1 > p_user_call_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'user-call-limit',
      'remainingCalls', greatest(0, p_user_call_limit - v_user.calls)
    );
  END IF;

  IF v_user.units + p_units > p_user_unit_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'user-unit-limit',
      'remainingUnits', greatest(0, p_user_unit_limit - v_user.units)
    );
  END IF;

  IF v_global.reserved_microusd + p_reserved_microusd > v_effective_global_cap THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'global-spend-cap',
      'remainingGlobalMicrousd',
      greatest(0, v_effective_global_cap - v_global.reserved_microusd)
    );
  END IF;

  UPDATE public.ai_usage_monthly
  SET calls = calls + 1,
      units = units + p_units,
      reserved_microusd = reserved_microusd + p_reserved_microusd,
      updated_at = now()
  WHERE user_id = p_user_id
    AND period_start = v_period
    AND capability = p_capability
  RETURNING * INTO v_user;

  UPDATE public.ai_global_usage_monthly
  SET calls = calls + 1,
      units = units + p_units,
      reserved_microusd = reserved_microusd + p_reserved_microusd,
      updated_at = now()
  WHERE period_start = v_period
  RETURNING * INTO v_global;

  RETURN jsonb_build_object(
    'allowed', true,
    'periodStart', v_period,
    'remainingCalls', greatest(0, p_user_call_limit - v_user.calls),
    'remainingUnits', greatest(0, p_user_unit_limit - v_user.units),
    'remainingGlobalMicrousd',
    greatest(0, v_effective_global_cap - v_global.reserved_microusd)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ai_reserve_usage(
  uuid,text,integer,bigint,integer,integer,bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_reserve_usage(
  uuid,text,integer,bigint,integer,integer,bigint
) TO service_role;

CREATE OR REPLACE FUNCTION public.ai_refund_usage(
  p_user_id uuid,
  p_capability text,
  p_units integer,
  p_reserved_microusd bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_period date := date_trunc('month', now())::date;
BEGIN
  IF p_user_id IS NULL OR p_units <= 0 OR p_reserved_microusd < 0 THEN
    RETURN;
  END IF;

  UPDATE public.ai_usage_monthly
  SET calls = greatest(0, calls - 1),
      units = greatest(0, units - p_units),
      reserved_microusd = greatest(0, reserved_microusd - p_reserved_microusd),
      updated_at = now()
  WHERE user_id = p_user_id
    AND period_start = v_period
    AND capability = p_capability;

  UPDATE public.ai_global_usage_monthly
  SET calls = greatest(0, calls - 1),
      units = greatest(0, units - p_units),
      reserved_microusd = greatest(0, reserved_microusd - p_reserved_microusd),
      updated_at = now()
  WHERE period_start = v_period;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_refund_usage(
  uuid,text,integer,bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_refund_usage(
  uuid,text,integer,bigint
) TO service_role;
