# NOCTURNE — GANG AI Engine 2026

## Goal

AI is an experience layer, not the game engine. Core rules, timers, scoring, room state,
voting, turn order, multiplayer sync and consent remain deterministic. Live generation is
used only when it creates a moment a static card deck cannot reproduce.

Lovable credits are reserved for visible UI/UX work only. Gameplay AI runs through the
server provider adapter and falls back to curated local content whenever AI is unavailable.

## Capability map

- **Party Director** — signature live composition, batched and rate-limited.
- **Personalized Pack** — 6–40 scenes generated in one low-cost call from voluntary facts
  and explicit taboo topics.
- **AI Judge** — judges creative answers, never personality or real-world traits.
- **Adaptive Difficulty** — deterministic local algorithm; zero model calls.
- **Secret Missions** — small batches of background missions, with strict social-safety
  constraints.
- **Music Clues** — progressive clue batches; title/artist leakage is rejected.
- **Narration** — sparse commentary/reveals, never used for core scoring.
- **Vision** — deliberately rare and capped; not part of normal game flow.

## Economic defaults

Source of truth: `src/lib/ai/policy.ts`.

- Director: max 10 calls/session, 6 scenes/call, minimum 4 scenes between calls.
- Personalized Pack: max 2 calls/session, up to 40 items/call.
- AI Judge: max 12 calls/session.
- Secret Missions: max 3 calls/session.
- Music Clues: max 8 calls/session.
- Vision: max 2 calls/session.
- Successful generations are cached; failed generations are never cached.
- Retry/backoff never blocks gameplay because curated local scenes remain authoritative.

The provider adapter uses direct OpenAI credentials rather than the Lovable AI gateway:
- `gpt-6-luna` by default for low-cost batch work.
- `gpt-6.1-sol` by default for the signature Director.
- Both can be changed through `NOCTURNE_AI_LITE_MODEL` and
  `NOCTURNE_AI_PREMIUM_MODEL`.
- Paid generation is disabled unless `NOCTURNE_AI_ENABLED=true`.
- Missing `OPENAI_API_KEY` means AI silently becomes unavailable and local gameplay
  continues.
- Before production enablement, bind generated endpoints to authenticated entitlements / persistent quotas and set a provider-level spend cap. The in-memory session budget is a UX/economics guard, not an abuse-proof billing boundary.

## Game mapping

### First Spark
Personalized opening pack + local adaptive difficulty. No need for live AI every scene.

### After Dark
Personalized pack, adaptive difficulty, secret missions and sparse narration.

### Night Shift
Personalized route-style beats, adaptive difficulty and occasional narration.

### Heatcheck
Local scoring/referee authority. AI Judge may add entertainment commentary but never
silently alter deterministic score rules.

### US//AFTER DARK
Local shared-energy logic plus sparse AI narration/personalization.

### ONE//TWO
Minimal AI footprint: batch personalization only. The premium restraint of the mode is
protected.

### NIGHT//ECHO
Session memory remains local/private. AI can personalize or narrate only sanitized,
non-sensitive anchors already allowed by the existing privacy contract.

### Director
The highest-value live AI surface. Generation is now six-scene batches with server
budgeting, caching, client backoff and local fallback.

### GANG MODE (2–99)
The shared contracts already support 2–99-player personalized packs. Expensive features
are generated in bounded batches; large rooms should be chunked by active players/teams
instead of asking the model to create 99 unique items in one live turn.

### PASS//THE AUX / FIRST//BEAT
Core playback and guessing remain deterministic. AI is limited to clue generation,
adaptive difficulty and optional commentary; music itself is not model-generated.

## Lovable UI/UX-only backlog

The engine is intentionally UI-agnostic. Lovable should only be used to implement these
visible moments:

1. **AI Night Setup** — optional facts, vibe, intensity and taboo topics with clear privacy
   language and a fast skip path.
2. **AI Judge Reveal** — theatrical verdict, ranking reveal and one-line commentary.
3. **Secret Mission** — sealed personal card + later mission reveal.
4. **Director Pulse** — subtle status/motion that communicates a live adaptive host without
   exposing model reasoning.
5. **Music Clue Ladder** — progressive reveal with tap-to-unlock timing.
6. **Fallback UX** — no technical error state; local premium content continues seamlessly.

## Non-negotiables

- No model call for timers, scoring, randomization, voting, room codes or sync.
- No AI-generated factual trivia without a verified source layer.
- No intimate/private free text sent unless the existing consent/privacy contract explicitly
  permits it.
- No live AI dependency may block starting or continuing a game.
- No Lovable credits for backend, prompts, schemas, caching, tests or game logic.
