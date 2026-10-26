# GANG MODE — Product & Implementation Contract

Status: binding product contract for the Game project.

## North star
GANG MODE is the group-play operating system for 2–99 players. It is not a folder of question cards. It combines a visible game library, an adaptive Party Director, custom mixes, hybrid multiplayer and real-room interaction.

Positioning:
- **One app. Every game night.**
- **Your night. Directed.**
- Desired habit: people say **“Mach GANG an.”** instead of looking for cards.

## Equal entry points
GANG MODE must always expose three first-class entry paths:

1. **START MY NIGHT** — the Party Director curates the session.
2. **CHOOSE A GAME** — users browse the catalog and launch a specific compatible game.
3. **BUILD A MIX** — users pick multiple games and create their own sequence; the Director may pace the transitions but must respect explicit picks.

The Party Director is not allowed to hide or replace manual game choice.

## Game-first play modes (binding, 2026 revision)

The authored per-game contract in `packages/gang-core/src/experience.ts` decides the recommended mode. Phone availability alone must never make Everyone In the default.

- **BIG SCREEN / TV / COUCH**: a shared laptop, or its mirrored TV, plus the host input on that same computer. No room, QR code or participant phones. Nine games have a dedicated public-room runtime.
- **ONE PHONE**: the same shared-room game for those nine titles; read prompts aloud and keep the phone with the current facilitator. Private games instead use the existing privacy curtain/pass flow.
- **EVERYONE IN**: personal devices when hidden cards, anonymous authored answers, photos or personal consent improve the game. Optional for the nine couch games; recommended for the seven private/media games.
- **HYBRID**: Everyone In plus the existing networked public display. It never exposes private cards on TV.

The new local couch runtime does not promise a separate phone remote or automatic TV discovery. HDMI/casting/mirroring is external to the app. Networking is not necessary for shared play.

### Premium interaction contract

- The room performs the game: speaking, pointing, moving, guessing and team discussion come before menus.
- The host enters only the result after the public action; input forms must not dominate the TV while everyone is playing.
- A secret can be a physical paper commitment for THE MAJORITY/HOT SEAT. Games requiring personal anonymity or consent stay on private devices.
- Large groups play simultaneous teams/sectors, with rotating speakers; do not turn 99 people into a serial phone-passing queue.
- Private input is owner-only until reveal. A hidden-role card must not disclose which variant its owner received.
- Show only real capabilities: MUSIC DROP couch plays local audio files, while its Everyone-In variant is Song-Voting. Do not label either as a streaming integration.

## Party Director
The Director orchestrates a night as:
**Warm-up → Connection → Escalation → Peak → Reset → Final Build → Finale**

Inputs include:
- player count
- requested duration
- selected moods/intensity
- alcohol/spicy/music/camera opt-ins
- available devices
- played mechanics
- skips/participation/energy signals

Rules:
- do not repeat the same mechanic back-to-back unless explicitly requested
- prefer diversity over a long list of similar prompts
- respect player-count and device capabilities
- never select spicy/alcohol/camera/music content unless enabled
- protect explicit user selections in custom mixes
- every longer session gets an intentional finale

## Scale bands
- **2–4:** personal, duel, bluff, story, prediction
- **5–8:** two couch teams or individual private inputs
- **9–15:** three couch teams; parallel private inputs where supported
- **16–30:** four couch teams; game-specific upper limits for private play
- **31–99:** six sectors with bounded stage turns; only explicitly compatible games

A game must declare the player range it truly supports.

## Product direction (not an assertion of completed features)
- Living Secret Missions / Side Quests
- adaptive energy curve
- zero-downtime spectator participation
- physical-room mechanics
- dynamic rivalries
- drop-in / drop-out
- hostless moderation
- optional saved Gang memory for harmless running gags, champions and team names
- personalized finale
- audiovisual/haptic identity

## Safety / consent
Spicy and alcohol layers are optional modules, never prerequisites.
Players must always have a frictionless skip.
Alcohol variants must have an equivalent non-alcohol alternative.
Private roles and votes are only delivered to clients allowed to see them.

## Game module contract
Every catalog game declares:
- stable id + public slug
- title + hook
- min/max players
- expected duration
- mechanics/tags
- energy/intensity
- supported device interaction modes
- capability requirements (music/camera/spicy/alcohol)
- Party Director eligibility
- custom-mix eligibility
- implementation status

New games must be addable through the registry without changing GANG MODE architecture.

## Implementation and verification

See [GANG_PREMIUM_2026.md](GANG_PREMIUM_2026.md) for all 16 game contracts, modes, scoring, content counts, scale decisions, implementation paths and evidence. TIME DROP remains a gated prototype and is not counted as a seventeenth ready game.

## Product quality gates
- room-to-game target < 30 seconds
- Authored game fit decides the setup, with a one-input shared-room route for all couch-compatible games
- ordinary questions never require typed answers; typing is reserved for mechanics where authored text is the fun
- no phone handoff is required when multiple input devices are connected
- guests can join without creating an account
- no regular long idle periods for inactive players
- no static-question-only game counts as a premium mechanic
- Host participates and can rotate; couch scoring still needs brief human judging/counting, which must be explained honestly
- private information remains technically private
- 2–99 is truthful: each game is filtered to its supported range
- manual game choice remains available even when Director Mode exists

## Lovable usage rule
Paid Lovable credits are reserved for UI/UX work. Core logic, registry, data contracts, tests and architecture should be implemented outside Lovable where practical.
