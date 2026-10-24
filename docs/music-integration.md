# PASS//THE AUX — music integration note

## Default: provider-neutral (always on)
Players type a song title (required) and artist (optional). The game is fully playable this way.
Reveal cards never link to generic search pages. With Apple Music configured, PickForm searches the public catalog in-game (no authorization); a revealed catalog track shows "Abspielen" only if MusicKit is already authorized, and "In Apple Music öffnen" only with the exact song URL returned by the catalog.
Tonight's Tracklist lives in session memory only: it is stripped by `sanitizeForSave` and never sent to the database.

## Spotify
Not integrated: Spotify's developer policy disallows games. No Web API, no OAuth, no Playback SDK, no metadata/covers.
Spotify does not appear anywhere in PASS//THE AUX.

## Apple Music (MusicKit on the web) — ready, inactive
Code: `src/lib/music/provider.ts` (capability interface), `src/lib/music/apple-music.ts` (MusicKit JS v3 adapter:
authorize, catalog search, playback, create library playlist), `src/lib/music/musickit.functions.ts` +
`musickit.server.ts` (server-signed ES256 developer token, 12h TTL).

To activate:
1. Apple Developer Program membership → create a **MusicKit key** (Certificates, IDs & Profiles → Keys) and a Media ID.
2. Add server secrets: `APPLE_MUSIC_TEAM_ID`, `APPLE_MUSIC_KEY_ID`, `APPLE_MUSIC_PRIVATE_KEY` (contents of the `.p8`).
3. Set `VITE_APPLE_MUSIC_ENABLED=true` (build-time opt-in so the client asks the server at all).
4. Build the UI for catalog search in the pick form (provider.search) — only render it when `capabilities.search` is true.

Without config the server returns `{ enabled: false }`, the client never loads MusicKit, and no Apple Music control is shown.
User authorization happens only after an explicit tap. "Als Playlist in Apple Music sichern" on the finale appears only
when tracks carry real provider IDs and the provider reports `createPlaylist`.