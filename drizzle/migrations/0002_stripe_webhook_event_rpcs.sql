CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.stripe_webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stripe_webhook_events TO service_role;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
DROP FUNCTION IF EXISTS public.stripe_claim_event(text, text);
DROP FUNCTION IF EXISTS public.stripe_finish_event(text, text, text);
