-- NOCTURNE security hardening — Data API least privilege + structural ownership.
-- Idempotent by design so it also documents the already-hardened Lovable Cloud database.

-- Existing public tables: revoke inherited broad Supabase grants, then explicitly opt in.
REVOKE ALL PRIVILEGES ON TABLE public.content_versions FROM anon, authenticated;
GRANT SELECT ON TABLE public.content_versions TO anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.preferences FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.preferences TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.game_sessions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.game_sessions TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.saved_moments FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.saved_moments TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.subscriptions FROM anon, authenticated;
GRANT SELECT ON TABLE public.subscriptions TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.entitlements FROM anon, authenticated;
GRANT SELECT ON TABLE public.entitlements TO authenticated;

-- Internal trigger function is not a public RPC endpoint.
REVOKE ALL PRIVILEGES ON FUNCTION public.game_sessions_guard_revision() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.game_sessions_guard_revision() TO service_role;

-- New postgres-owned public objects are explicit opt-in.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Back the RLS ownership model with actual referential integrity.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'preferences_user_id_fkey') THEN
    ALTER TABLE public.preferences
      ADD CONSTRAINT preferences_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_sessions_user_id_fkey') THEN
    ALTER TABLE public.game_sessions
      ADD CONSTRAINT game_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_moments_user_id_fkey') THEN
    ALTER TABLE public.saved_moments
      ADD CONSTRAINT saved_moments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_fkey') THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entitlements_user_id_fkey') THEN
    ALTER TABLE public.entitlements
      ADD CONSTRAINT entitlements_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS subscriptions_user_updated_idx
  ON public.subscriptions (user_id, updated_at DESC);

-- Baseline content versions for deterministic session restore.
INSERT INTO public.content_versions (game_id, version, notes)
VALUES
  ('roxy-after-dark', 1, 'NOCTURNE 2026 baseline · First Spark'),
  ('after-dark-2', 1, 'NOCTURNE 2026 baseline · After Dark'),
  ('roxy-night', 1, 'NOCTURNE 2026 baseline · Night Shift'),
  ('battle', 1, 'NOCTURNE 2026 baseline · Heatcheck'),
  ('coop', 1, 'NOCTURNE 2026 baseline · US//AFTER DARK'),
  ('one-two', 1, 'NOCTURNE 2026 baseline · ONE//TWO'),
  ('night-echo', 1, 'NOCTURNE 2026 baseline · NIGHT//ECHO'),
  ('ai-director', 1, 'NOCTURNE 2026 baseline · Director')
ON CONFLICT (game_id, version) DO NOTHING;
