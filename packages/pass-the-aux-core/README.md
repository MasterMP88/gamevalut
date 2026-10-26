# PASS//THE AUX core

Provider-neutral domain rules for NOCTURNE Game 09. The app presentation may be richer, but these mechanics define the same player contract and are kept in sync with the runtime.

## Mechanics
- SOLO_PICK: one player picks privately, seals the answer, hands off, then reveals.
- DUET_PICK: both players choose privately; neither selection is exposed until both are sealed. Different songs require a human reveal verdict.
- GUESS / READ//THE TRACK: one hidden selection plus a pre-reveal reason read; the picker judges Treffer or Plot Twist.
- SPEED_PICK / NEEDLE DROP: 20-second instinct prompt. Expiry never fails; it flips the instruction to a deliberate second-thought pick.
- CONSENSUS / ONE SONG: both people openly agree on one track; no artificial privacy handoff.
- Signature cadence in the app: AUX SWAP, RED FLAG, NEEDLE DROP, ONE SONG and LAST TRACK break the standard loop.
- Tonight’s Record: completed picks become the session-local finale.
- Reveal language: Same Brain, Same Energy, Plot Twist, Das erklärt einiges, Keine Fragen and Read: Treffer.

## Privacy
Song titles, artists, provider IDs and predictions stay out of the default account autosave. The durable snapshot stores only structural state and flags whether private music must be restored locally.

## Provider boundary
Manual title/artist entry remains a functional fallback. Apple Music catalog search can resolve a selected track into the same SongPick shape; playback only appears after explicit authorization. Spotify gameplay APIs are not used.

## Verification
- npm run typecheck
- npm test

The package covers hidden handoffs, duet sealing, READ//THE TRACK, speed rule-flip state, consensus, reveal verdicts, Tonight’s Record inputs, privacy-safe autosave and reset.
