-- Register PASS//THE AUX content baseline for deterministic resume.
INSERT INTO public.content_versions (game_id, version, notes)
VALUES ('pass-the-aux', 1, 'NOCTURNE 2026 baseline · PASS//THE AUX')
ON CONFLICT (game_id, version) DO NOTHING;
