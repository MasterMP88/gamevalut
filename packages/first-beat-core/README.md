# FIRST//BEAT music core

Provider-neutral game logic for NOCTURNE Game 10.

## What is implemented
- progressive listening windows: 1s -> 3s -> 7s -> 15s
- one-phone buzz/guess/reveal flow
- round families: INTRO_RUSH, TIME_WARP, WHO_PICKED_IT, MOOD_MATCH, PERSONAL_CUT
- cooperative Signal meter instead of a second competitive score system
- hidden track metadata before reveal
- session reset and aggregate end stats
- Apple Music capability adapter with fail-soft behavior
- Apple Music catalog normalization only accepts tracks with official preview audio

## Privacy
Track title, artist, artwork, release metadata and picker identity are considered hidden game state before reveal. UI must render through `visibleTrack()` instead of reading the underlying round track directly. Personal library selections should follow NOCTURNE's existing privacy model and should not be persisted remotely unless the user explicitly opts in to saving that content.

## Apple Music integration boundary
The core deliberately does not embed Apple private credentials or load MusicKit JS itself. The host app supplies an `AppleMusicBridge` that owns:
- MusicKit configuration
- a short-lived developer token obtained from a trusted server endpoint
- explicit user authorization for library/full-playback/create-playlist capabilities
- catalog search
- library reads
- full playback when authorized
- playlist creation when authorized

Catalog preview gameplay can use the preview URL returned by Apple Music song attributes. If the bridge is not configured, the adapter exposes no capabilities and search returns an empty result instead of rendering a dead connect control.

Do not add Spotify Web API/Playback SDK gameplay to this package. Spotify game integrations are intentionally outside the product architecture.

## UX contract for the NOCTURNE shell
1. READY: show only the round prompt and start control.
2. LISTENING: play the current window; show `ICH WEISS ES` and `MEHR HÖREN`.
3. BUZZED/GUESSING: pause audio and collect the round-specific guess.
4. REVEAL: now and only now may title, artist, artwork, release data or hidden picker be shown.
5. COMPLETE: update Signal and continue.

Browser autoplay rules mean audio should always begin from a deliberate tap.

## Verification
`npm run typecheck`
`npm test`

The core currently has tests for progressive reveal, hidden metadata, cooperative Signal, end statistics, reset, preview filtering, Apple normalization and missing-config fallback.
