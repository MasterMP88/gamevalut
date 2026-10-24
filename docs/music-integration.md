# PASS//THE AUX — Music provider integration

PASS//THE AUX is intentionally **provider-neutral by default**. The full game works with manually entered song titles and optional artist names. No music service is required.

## Current production behavior

- Manual song entry is the only visible mode.
- No Spotify OAuth, Web API, Playback SDK, catalogue metadata, artwork or playback is used.
- No Apple Music button is shown without a real MusicKit configuration.
- Song titles, artists and Tonight’s Tracklist remain local to the current browser session and are removed by NOCTURNE's structural cloud-save sanitizer.

## Apple Music / MusicKit extension point

The internal adapter lives in `src/lib/music/providers.ts`.

A real MusicKit implementation must inject an `AppleMusicBridge` that supports:

- explicit user authorization
- catalogue/library search
- playback
- playlist creation

The adapter returns `null` unless the bridge reports itself as actually available. This is deliberate: NOCTURNE must never render a dead “Connect Apple Music” control.

### Required external setup

Before a bridge may be enabled, configure Apple Music / MusicKit for the product in the Apple Developer account and use the current MusicKit web authorization/token setup. Never hard-code Apple private keys or developer-token signing secrets in client JavaScript.

Recommended production shape:

1. Server-side Apple credential/token configuration.
2. Client MusicKit bootstrap only after the user explicitly chooses Apple Music.
3. MusicKit authorization on user action.
4. Map real provider tracks into `MusicProviderTrack`.
5. At Tonight’s Tracklist, offer “Playlist in Apple Music erstellen” only when:
   - the bridge is available,
   - the user is authorized,
   - every chosen track has a real Apple Music catalogue/library ID.
6. Fail soft to manual mode on every provider error.

## Spotify

Do **not** integrate Spotify Platform into PASS//THE AUX. NOCTURNE does not use Spotify OAuth, Web API, Playback SDK, catalogue content or artwork in this game.

If product policy changes later, re-check Spotify's current Developer Policy before any implementation.
