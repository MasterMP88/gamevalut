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

## Hybrid play
The target experience chooses a device pattern per game and group size. Availability must be declared separately from a design recommendation:
- **BIG SCREEN / COUCH** — TV/laptop plus host controls; suitable games need no guest phones or room join. This is a distinct variant to implement, not a claim that the current TV output already provides it.
- **ONE PHONE / PASS MODE** — a first-class experience for shared prompts and small-group secret turns. Deliberate handoff can be part of the fun, especially for couples.
- **EVERYONE IN** via QR/room code — recommended when parallel private input materially improves the particular game.
- **BIG SCREEN + CONTROLLERS** — shared public stage with private personal/team input; label it distinctly from join-free Couch.
- **TEAM DEVICE / MIXED MODE** — use the fewest devices that preserve the intended mechanic and fair participation.

The product chooses the best interaction mode automatically from player count and available devices. Technical setup must stay out of the critical path. Do not make users understand networking modes before they can play.

### Premium interaction contract (2026)
- **Intentional handoff:** the user's clarification on 2026-10-25 supersedes the blanket zero-handoff rule. A sealed choice, named handoff and joint reveal can be the recommended premium experience. Do not require a handoff for ordinary shared conversation or make large groups wait through unnecessary serial turns.
- **Zero typing by default:** use tap, cards, swipe, ranking, slider, hold-to-reveal, reactions or spoken answers whenever the mechanic does not intrinsically depend on authored text.
- **Creative typing is a mechanic, not admin work:** free text is allowed for games such as bluffing or intentionally funny authored answers, but must be short, confined to the current player's private input view (personal device or sealed pass turn), and never required for ordinary questions.
- **Private input, shared drama:** secrets and predictions are owner-only before reveal; countdown, reveal, score and reactions are synchronized publicly.
- **Big Screen is game-specific:** Couch needs no guest controllers; private multiplayer keeps its controllers. These variants may use different, explicitly explained team/personal scoring. Short host result entry is acceptable; do not falsely claim complete automation.
- **One Phone is first-class:** a privacy curtain and one readiness action support a designed handoff. Availability of extra phones does not automatically make them preferable. Never run an answer timer during physical handoff.

The detailed UI/UX decisions, evidence, per-game variants and acceptance criteria are in [UI/UX Audit & Premium Concepts 2026](ui-ux-audit-premium-2026.md). The accompanying [Concept Atlas](ui-ux-concept-atlas-2026.html) contains illustrative designs, not live features.

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
- **5–12:** full mechanic range
- **13–30:** teams, voting, secret roles, tournaments, simultaneous actions
- **31–99:** crowd voting, team battles, prediction, quiz, music, elimination, collective challenges

A game must declare the player range it truly supports.

## Signature systems
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

## Implementation order
1. Multiplayer/room reliability
2. Game registry + pure mechanics
3. Director selection/planning
4. Secret Missions
5. Crowd/spectator/physical systems
6. Premium motion/sound/haptics
7. Gang memory + retention
8. Music/camera/After Dark/event expansion

## Product quality gates
- room-to-game target < 30 seconds
- Recommended setup follows the game, the group size and the available validated variant; extra devices are not inherently better
- ordinary questions never require typed answers; typing is reserved for mechanics where authored text is the fun
- no unnecessary handoff is required; deliberate pass play remains available and may be recommended
- guests can join without creating an account
- no regular long idle periods for inactive players
- no static-question-only game counts as a premium mechanic
- host plays; host does not become a permanent moderator
- private information remains technically private
- 2–99 is truthful: each game is filtered to its supported range
- manual game choice remains available even when Director Mode exists

## Lovable usage rule
Paid Lovable credits are reserved for UI/UX work. Core logic, registry, data contracts, tests and architecture should be implemented outside Lovable where practical.
