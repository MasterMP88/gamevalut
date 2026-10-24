-- Profiles (one row per auth user, created by the client on first sign-in)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text CHECK (char_length(display_name) <= 40),
  age_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Preferences (consent defaults, player names)
CREATE TABLE public.preferences (
  user_id uuid PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  player_names jsonb NOT NULL DEFAULT '["",""]'::jsonb,
  locale text NOT NULL DEFAULT 'de',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.preferences TO authenticated;
GRANT ALL ON public.preferences TO service_role;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_select_own" ON public.preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "prefs_insert_own" ON public.preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_update_own" ON public.preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Content versions catalog (public, read-only for clients)
CREATE TABLE public.content_versions (
  game_id text NOT NULL,
  version integer NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  PRIMARY KEY (game_id, version)
);
GRANT SELECT ON public.content_versions TO anon, authenticated;
GRANT ALL ON public.content_versions TO service_role;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_versions_public_read" ON public.content_versions FOR SELECT TO anon, authenticated USING (true);

-- Game sessions: structural, versioned state only (never intimate free-text)
CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  game_slug text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  scene_number integer NOT NULL DEFAULT 1,
  chapter integer,
  current_player smallint NOT NULL DEFAULT 0 CHECK (current_player IN (0,1)),
  content_version integer NOT NULL,
  state_version integer NOT NULL DEFAULT 1,
  intensity smallint,
  steer text,
  scores jsonb,
  energies jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  state jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX game_sessions_user_updated_idx ON public.game_sessions (user_id, updated_at DESC);
CREATE UNIQUE INDEX game_sessions_one_active_per_game ON public.game_sessions (user_id, game_id) WHERE status = 'active';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON public.game_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.game_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON public.game_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Stale/duplicate writes (rapid taps, out-of-order requests) are silently dropped.
CREATE OR REPLACE FUNCTION public.game_sessions_guard_revision()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NEW.revision <= OLD.revision THEN
    RETURN NULL;
  END IF;
  NEW.updated_at := now();
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER game_sessions_guard_revision BEFORE UPDATE ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.game_sessions_guard_revision();

-- Saved moments: only what a user explicitly chose to keep
CREATE TABLE public.saved_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  game_id text NOT NULL,
  scene_title text CHECK (char_length(scene_title) <= 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saved_moments_user_idx ON public.saved_moments (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.saved_moments TO authenticated;
GRANT ALL ON public.saved_moments TO service_role;
ALTER TABLE public.saved_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moments_select_own" ON public.saved_moments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "moments_insert_own" ON public.saved_moments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_delete_own" ON public.saved_moments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Monetization readiness: written only by a future payment webhook (service role)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_customer_id text,
  provider_subscription_id text UNIQUE,
  plan_key text NOT NULL,
  status text NOT NULL,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_key text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  source text NOT NULL DEFAULT 'manual',
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_key)
);
GRANT SELECT ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entitlements_select_own" ON public.entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);