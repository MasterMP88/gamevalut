# PASS//THE AUX core

Provider-neutral logic for NOCTURNE Game 09.

## Mechanics
- SOLO_PICK: one player picks privately, seals the answer, hands off, then reveals.
- DUET_PICK: both players choose privately; neither selection is exposed until both are sealed.
- GUESS: one hidden selection plus a pre-reveal mood prediction.
- SPEED_PICK: 20-second prompt; expiry never causes a fail state.
- Tonight's Tracklist: completed picks are collected in round order.
- Reactions: Match, Plot Twist, Das erklärt einiges.
- 40 editorially authored music prompts.

## Privacy
Song titles, artists, provider IDs and predictions stay out of the default account autosave. The durable snapshot stores only structural state and flags whether private music must be restored locally.

## Provider boundary
Manual title/artist entry is the fully functional baseline. Apple Music can be layered on top later by resolving a selected catalog/library song into the same SongPick shape. Do not add Spotify gameplay APIs.

## Verification
- npm run typecheck
- npm test

The package includes tests for hidden handoff states, duet sealing, prediction reveal, speed timeout behavior, Tonight's Tracklist, privacy-safe autosave, reset and prompt coverage.
