# NOCTURNE — Premium 2026 Release Candidate

## Status
This branch is the premium staging line for **NOCTURNE — Games for Two**.

- Branch: `nocturne-premium-2026`
- Production currently remains on Lovable: https://nocturne-games-for-two.lovable.app
- The Lovable production app remains the last stable published release.
- The staging/gameplay changes in this branch are **not production-deployed yet**; production remains the last stable Lovable release until the staging line is deliberately synced/deployed.

## Quality gates
GitHub Actions workflow: `.github/workflows/nocturne-ci.yml`

Current required gates:
- TypeScript strict typecheck
- Vitest
- Production client/SSR/Nitro build
- Chromium mobile audit at 390×844
- Chromium mobile audit at 430×932 with reduced motion
- All 8 game routes
- Start + scene advance/Skip
- Interaction cue present
- horizontal-overflow check
- console/page-error check
- screenshot artifacts

Latest full green audit:
- 7 test files
- **71/71 tests passed**
- Vite client build passed
- SSR build passed
- Nitro build passed
- **16/16 mobile route/viewport checks passed**
- zero horizontal overflow
- zero browser console/page errors

## Product identity
Brand:
- **NOCTURNE**
- **Games for Two**
- “Ein Abend. Zwei Menschen. Kein Skript.”

Games:
1. First Spark
2. After Dark
3. Night Shift
4. Heatcheck
5. US//AFTER DARK
6. ONE//TWO
7. NIGHT//ECHO
8. NIGHT//ECHO — Director

## Award gameplay pass — October 24, 2026
This branch now adds a second, mechanics-first quality bar on top of the visual premium pass.

- passive timer prompts can opt into real microgame mechanics: Alternating Rush, Tap Rush and Standoff
- First Spark guarantees an early live standoff and sealed prediction/reveal
- After Dark SECRET beats persist as Covert missions and return for an explicit reveal
- Heatcheck regular challenges are opponent-refereed; success, failure and voluntary skip are separate outcomes
- US//AFTER DARK surfaces the shared energy reward of the current beat
- ONE//TWO gets a deliberately minimal ONE/TWO turn rail rather than generic game chrome
- Night Shift keeps three-scene steering momentum and recurring detours
- NIGHT//ECHO keeps typed, spaced callbacks; Director keeps validated format orchestration and rare cuts

The product contract is documented in `AWARD_GAMEPLAY_2026.md`.

## What makes each mode distinct
- **First Spark:** effortless playful/flirty ignition; fast movement and low-pressure choices before deeper beats.
- **After Dark:** kinetic mini-game mode with timers, roulette, sync/prediction and multi-scene Tempo Shifts.
- **Night Shift:** steerable Date Night OS; direction momentum persists for several scenes and detours break linearity.
- **Heatcheck:** strategic competitive mode with Sparks, streaks, comeback help, secret missions, showdowns and Edge power-ups.
- **US//AFTER DARK:** cooperative balancing of Chaos / Connection / Heat with milestones, combos and a Vault unlock.
- **ONE//TWO:** strict alternating conversation; pure typography and rhythm rules, no system clutter.
- **NIGHT//ECHO:** selective session-memory anchors, spaced callbacks and an archival Session Archive.
- **Director:** generative composition of interaction formats plus local fallback, privacy-safe context and rare Director Cuts.

## Premium visual system
No stock photography. Game identity is authored through responsive SVG/CSS systems:
- First Spark — ignition / ember collision
- After Dark — kinetic typography / tempo index
- Night Shift — route / horizon / direction signal
- Heatcheck — opposing thermal traces responding to score
- US//AFTER DARK — two organic forms creating a third form, responding to energy balance
- ONE//TWO — extreme editorial typography / dual rules
- NIGHT//ECHO — archival ripple / trace / timestamps
- Director — living orbital cue system reacting to scene type/status

## Privacy invariants
- No intimate free text in localStorage.
- No database for intimate session state.
- Reloading ends memory.
- High-sensitivity/private anchors never go to Director context.
- High-sensitivity/private anchors never appear in Night Signature.
- Deleted anchors never return.
- Skip is always penalty-free outside explicit Heatcheck game mechanics affecting the opponent's optional power-up logic.

## Deployment note
Do not merge/deploy this branch to replace the Lovable production app until either:
1. Lovable build credits are available and the GitHub visual delta is synced into the existing Lovable project, or
2. a server-capable deployment target is configured with the required Director backend environment.

GitHub Pages alone is not the production target because NIGHT//ECHO — Director uses server-side generation.
