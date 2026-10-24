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
- Paid access is decided only by `isUnlocked()` in `src/lib/entitlements.ts`; `entitlements`/`subscriptions` are written server-side only.
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
- GANG MODE UI (`/gang`, `src/lib/gang/catalog.ts`) is presentation-only: catalog data and status labels, no rules/runtime — game logic comes from GitHub `packages/gang-core/`.