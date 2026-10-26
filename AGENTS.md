<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Game state lives in React memory (`src/lib/game/store.tsx`); signed-in users get a debounced auto-save of `sanitizeForSave` output (`persist.ts`: no anchors, AI queue or non-local scenes) to `game_sessions` with a monotonically increasing `revision` (DB trigger drops stale writes) — intimate free-text is only stored via explicit Saved Moments.
- Bump `CONTENT_VERSION`/`STATE_VERSION` in `persist.ts` when scene banks/state shape change; `restore()` rejects incompatible shapes and re-picks the scene on content changes.
- Account routes live under `src/routes/_authenticated/` (ssr:false, noindex); public SEO routes are listed only via `publicPaths()` in `src/lib/seo.ts` (sitemap).
- Paid access is decided only via `src/lib/entitlements.ts` (`coupleSceneAccess`, `canHostGang`) over the vendored verbatim `src/lib/commerce/core/` (re-vendor, never edit); `entitlements`/`subscriptions` are written only by the signature-verified Stripe webhook (`/api/public/stripe/webhook`, idempotent via the locked service-role-only `public.stripe_webhook_events` table, no privileged public RPCs), never by the checkout redirect; checkout refuses server-side when equivalent access is already active.
- Game logic is a pure reducer in `src/lib/game/engine.ts`, tested in `src/test/engine.test.ts` — keep rules testable without UI.
- Scenes live in `src/lib/game/scenes.ts`; games select pools via `types`/`only` in `games.ts` — content is data, not code.
- Per-game dramaturgy (tempo shifts, steer momentum, detours, Director Cuts, co-op milestones, ONE//TWO return questions, echo spacing) lives in `advance`/`pickLocal` in `engine.ts`, injected scenes in `specials.ts`, rules tested in `src/test/dramaturgy.test.ts` — each game must stay measurably different.
- AI Director runs server-side (`director.server.ts` via `director.functions.ts`), returns JSON validated by `ai-schema.ts`; any failure falls back to local scenes silently.
- Only non-private anchors go into `buildDirectorContext`; Night Signature shows only normal-sensitivity anchors.
- Internal GameIds are stable; public slugs may change, with old slugs kept in `SLUG_ALIASES` (301 in `game.$slug.tsx` beforeLoad) — old links must never break.
- Scene copy uses `{me}`/`{you}` (and `{me}s`/`{you}s` for genitive, resolved by `fill()`); `src/test/content.test.ts` audits duplicates, repeated openings and per-game signatures — keep it green when editing scenes.
- Every scene must pass `enforceContract` (`src/lib/game/contract.ts`): wording may never promise an interaction the UI lacks; AI scenes are repaired or rejected, local scenes audited in `interaction.test.tsx`.
- PASS//THE AUX (game 09) uses the `MUSIC` scene type with `scene.music.mode`; round state lives in `SessionState.musicRound` (set via the `MUSIC` action) so remounts never re-expose a sealed pick; picks enter `tracklist` on DONE, both stripped by `sanitizeForSave` — personal song choices stay session-local.
- Music providers sit behind `src/lib/music/provider.ts`; manual entry is the default, Apple Music (MusicKit) only activates with server secrets + `VITE_APPLE_MUSIC_ENABLED` (see `docs/music-integration.md`) — UI renders a capability only when it is real; Spotify is never a provider.
- Home collection and game detail previews render per-game authored compositions from `src/components/stage/GameStage.tsx` (one variant per GameId, shared only sequencing/a11y/CTA) — games must stay visually distinct, not one templated card.
- Auto-save uses optimistic concurrency (`src/lib/game/save.ts`): UPDATE filters id+revision and only DB-returned revisions advance local state; a missed row is a "conflict" (never overwrite newer cloud state) — tested in `src/test/save-pending.test.ts`.
- Guest→account handoff uses a 2h localStorage snapshot (`src/lib/game/pending.ts`) holding only `sanitizeForSave` output; it is deleted only after a confirmed account save, because email confirmation opens a new tab.
- Supabase query builders are lazy: fire-and-forget writes must still call `.then()`, otherwise nothing is sent.
- DB privileges are least-privilege and default privileges in `public` are revoked: every new table/function must GRANT explicitly in its migration.
- GANG MODE rules come only from `src/lib/gang/core/` (vendored verbatim from GitHub `packages/gang-core/`; re-vendor, never edit); `src/lib/gang/catalog.ts`/`night.ts` and `src/components/gang/` are presentation adapters over it — authored device recommendations live in `experience.ts`. Nine public room games use the local `couch.ts` reducer through `CouchPlayer` (TV/mirrored laptop or shared phone, no room/join); secret games retain private cards and secure multiplayer.
- Networked GANG EVERYONE IN and its optional separate BIG SCREEN go only through `src/lib/gang/room-client.ts` (gang_* RPCs); the facilitator device runs the canonical core via `src/lib/gang/online.ts` and saves it with gang_save_runtime — the DB never decides game rules, and player tokens live only in sessionStorage (never URL/DOM/publicState).
