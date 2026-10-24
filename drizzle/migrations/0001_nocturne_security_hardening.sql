-- Least-privilege grants: revoke broad/inherited privileges, then re-grant exactly what RLS policies need.
REVOKE ALL ON public.content_versions, public.profiles, public.preferences, public.game_sessions, public.saved_moments, public.subscriptions, public.entitlements FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.content_versions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_moments TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.entitlements TO authenticated;

GRANT ALL ON public.content_versions, public.profiles, public.preferences, public.game_sessions, public.saved_moments, public.subscriptions, public.entitlements TO service_role;

-- Trigger function is never called directly; the trigger keeps working without EXECUTE for clients.
REVOKE EXECUTE ON FUNCTION public.game_sessions_guard_revision() FROM PUBLIC, anon, authenticated;

-- Future objects in public are not auto-exposed; every migration must grant explicitly.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Ownership FKs (idempotent: only add where absent).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['preferences','game_sessions','saved_moments','subscriptions','entitlements'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f' AND c.conrelid = format('public.%I', t)::regclass
        AND c.confrelid = 'auth.users'::regclass AND a.attname = 'user_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE', t, t || '_user_id_fkey');
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS subscriptions_user_updated_idx ON public.subscriptions (user_id, updated_at DESC);