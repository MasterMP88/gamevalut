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
- Game state lives only in React memory (`src/lib/game/store.tsx`); never persist sessions or free-text to storage or a DB — privacy requirement.
- Game logic is a pure reducer in `src/lib/game/engine.ts`, tested in `src/test/engine.test.ts` — keep rules testable without UI.
- Scenes live in `src/lib/game/scenes.ts`; games select pools via `types`/`only` in `games.ts` — content is data, not code.
- Per-game dramaturgy (tempo shifts, steer momentum, detours, Director Cuts, co-op milestones, ONE//TWO return questions, echo spacing) lives in `advance`/`pickLocal` in `engine.ts`, injected scenes in `specials.ts`, rules tested in `src/test/dramaturgy.test.ts` — each game must stay measurably different.
- AI Director runs server-side (`director.server.ts` via `director.functions.ts`), returns JSON validated by `ai-schema.ts`; any failure falls back to local scenes silently.
- Only non-private anchors go into `buildDirectorContext`; Night Signature shows only normal-sensitivity anchors.
- Internal GameIds are stable; public slugs may change, with old slugs kept in `SLUG_ALIASES` (301 in `game.$slug.tsx` beforeLoad) — old links must never break.
- Scene copy uses `{me}`/`{you}` (and `{me}s`/`{you}s` for genitive, resolved by `fill()`); `src/test/content.test.ts` audits duplicates, repeated openings and per-game signatures — keep it green when editing scenes.
- Every scene must pass `enforceContract` (`src/lib/game/contract.ts`): wording may never promise an interaction the UI lacks; AI scenes are repaired or rejected, local scenes audited in `interaction.test.tsx`.