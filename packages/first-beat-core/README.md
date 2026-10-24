# FIRST//BEAT music core

Rights-safe provider-neutral game logic for NOCTURNE Game 10.

## What is implemented
- progressive listening windows: 1s -> 3s -> 7s -> 15s
- one-phone buzz/guess/reveal flow
- round families: INTRO_RUSH, TIME_WARP, WHO_PICKED_IT, MOOD_MATCH, PERSONAL_CUT
- cooperative Signal meter
- hidden track metadata before reveal
- privacy-safe durable autosave
- owned/licensed/local-file audio provider boundary

## Critical rights rule
FIRST//BEAT must not use Apple Music or iTunes preview clips as entertainment/game audio. Apple currently restricts preview assets from entertainment use, and deeper MusicKit integrations can require additional rights when a specific song is played at a specific moment.

The in-game audio source therefore accepts only:
- audio owned by NOCTURNE,
- audio explicitly licensed for this game use, or
- an ephemeral local audio file explicitly selected by the user.

Apple Music may still be used elsewhere as a companion for normal user-initiated playback, search/library features or playlist creation, subject to Apple's rules and any additional rights required. It is not the default FIRST//BEAT game-audio provider.

## Privacy
Track metadata remains sealed until reveal. Local-file object URLs and private song identity never belong in durable account autosave.

## Verification
- npm run typecheck
- npm test
