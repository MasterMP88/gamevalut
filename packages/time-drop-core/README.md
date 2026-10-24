# TIME//DROP

Provider-neutral music timeline game core for NOCTURNE and GANG MODE.

**Hook:** Hör den Song. Setz ihn in die Zeit. Trau dich genauer.

TIME//DROP deliberately takes only the broadly understandable idea of chronological music knowledge and builds a distinct digital game around simultaneous play, per-player difficulty, precision locks, couple sync and crowd reveals. It does not require physical cards or QR scanning.

## Modes

### Couple · Together
Two people secretly place the same track on one shared timeline.
- correct placement = 1 point each
- same slot = Sync
- same correct slot = Perfect Sync +2 shared bonus
- optional Precision / Expert difficulty per person
- the timeline grows after every reveal, whether the guesses were right or wrong

### Couple · Duel
Both place simultaneously on the same public timeline, but score separately.
Different difficulty levels can be used in the same session.

### GANG · Everyone In
2–99 players place simultaneously on the shared timeline.
The reveal shows:
- exact release year
- every player marker
- crowd distribution
- whether the most popular slot was correct
No waiting for each player to take a turn.

### GANG · Teams
Players can be assigned to teams. Team score uses the average member result so larger teams do not gain points simply by having more people.

## Difficulty

- **Flow:** chronological placement only.
- **Precision:** placement + a year guess with a self-chosen ±2 / ±5 / ±10 year lock. Narrower correct locks score more.
- **Expert:** placement + exact year; optional exact title and artist bonuses.

This lets casual and expert players share one round without forcing a single difficulty on the whole room.

## Core scoring

Placement correct: +1.

Precision bonus, only after a correct placement:
- ±10 years: +1
- ±5 years: +2
- ±2 years: +3

Expert bonuses, only after a correct placement:
- exact year: +3
- title: +1
- artist: +1

Couple Together: Perfect Sync adds +2 to the shared score.

## Audio / rights boundary

The core contains **no songs and no copyrighted audio**. A track carries only metadata and an opaque `playbackRef` for a separate playback layer.

Do not use Apple Music/iTunes preview assets as entertainment/game audio. Commercial playback must use a provider and rights model that is actually permitted for the product. The timeline engine remains fully independent from that decision.

## Product integration

Suggested product position:
- Games for Two: Game 11, after PASS//THE AUX and FIRST//BEAT.
- GANG MODE: music/social category, 2–99 players, Everyone In / Big Screen / One Phone adaptations.

Recommended visual language: one continuous horizontal chronology line, tracks drop physically into slots, player guesses appear as sealed markers, reveal expands the year and pushes neighboring anchors apart. No imitation of physical music cards.

## Verification

`npm run typecheck`
`npm test`
