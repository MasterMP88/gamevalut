# PASS//THE AUX — music integration note

## Default: provider-neutral (always on)
Players type a song title (required) and artist (optional). The game is fully playable this way.
Reveal cards never link to generic search pages. With Apple Music configured, PickForm searches the public catalog in-game (no authorization); a revealed catalog track shows "Abspielen" only if MusicKit is already authorized, and "In Apple Music öffnen" only with the exact song URL returned by the catalog.
Tonight's Tracklist lives in session memory only: it is stripped by `sanitizeForSave` and never sent to the database.

## Spotify
Not integrated: Spotify's developer policy disallows games. No Web API, no OAuth, no Playback SDK, no metadata/covers.
Spotify does not appear anywhere in PASS//THE AUX.

## MUSIC DROP: personal music app, without mandatory files

The default couch/one-phone entry is **Musik-App · DJ legt auf**. One person uses their normal music app independently (e.g. Apple Music or Spotify); NOCTURNE manages guesses, steals and scores. This is **not a connected streaming provider**, account linking, catalog import or an embedded player. No provider API/SDK, generic service link, preview, audio recording or service data is involved.

- Select the DJ from the group. That person is excluded from every guessing team for the whole session. Remaining people form at most six balanced teams; at two people the sole guesser plays for a personal score. The DJ can change on replay.
- A round has no external playback clock. The DJ confirms **Musik läuft · Raten öffnen** after starting music in their own app. Switching apps does not auto-pause the game. NOCTURNE pause/exit never claims to stop the external app.
- DJ keeps title/artist private and announces the answer at reveal. A mirrored screen cannot hide another app: use a separate music device in that setup. One-phone play uses app switching with the screen kept from guessers.
- First correct guess earns 2, a steal 1, both doubled in the final round. Each guessing team gets one attempt. Solo misses resolve immediately. Skip, early finish, encore and replay work without file imports.
- No song identities are entered or inferred; avoiding repeated external songs is the DJ's responsibility. The app must not promise automated history or duplicate prevention for this mode.
- **Eigene Audiodateien** remains optional. It retains local file deduplication, listening history and timed clips. Offline downloads inside subscription apps are not importable audio files.

### Direct connection: remaining boundary (checked 2026-10-26)

[Spotify Developer Policy](https://developer.spotify.com/policy), III.2, expressly disallows games, including trivia. The normal SDK/API is therefore not a valid direct MUSIC DROP integration. The independent DJ flow is not presented as Spotify authorization or partnership.

[MusicKit](https://developer.apple.com/musickit/) supports authorized subscriber playback on websites, and the adapter below already implements normal user-started playback. However, the [Apple Developer Program License Agreement](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), MusicKit section, requires full-song playback and standard user controls, restricts synchronization with other content and monetizing service access. Apple preview assets are not game audio. A MusicKit key alone does not establish permission for automated quiz clips; obtain an applicable permitted playback/rights model before adding that capability. The DJ change does not activate MusicKit or request credentials.

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

## DJ-mode verification (2026-10-26)

268 app tests, 114 GANG core tests, TypeScript, focused lint and production build passed. Browser regression completed 30 sessions / 90 rounds at 390, 1440 and 1920px with no page errors. The three additional DJ scenarios cover 2, 8 and 99 people; local audio remains covered separately. Unit tests cover DJ exclusion at every team-size boundary, no guesses before music confirmation, app switching, explicit pause, solo misses, steals, final scoring, abort, skip, encore and changing DJ on replay. This does not certify native streaming-app playback or real iOS/Android app switching; no service account was connected.

Evidence: [browser report](qa/gang-music-dj-2026-10-26.json), [TV setup](qa/gang-music-dj-tv.png), [one-phone play](qa/gang-music-dj-phone.png).
