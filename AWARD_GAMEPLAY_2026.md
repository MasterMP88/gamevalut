# NOCTURNE — Award Gameplay Standard 2026

This document is the product contract for the eight NOCTURNE game modes. A mode is not “different” because it has different copy; it must create a different player behavior, tension curve and payoff.

## Universal interaction contract

Every scene must make the next action understandable in roughly two seconds.

A scene that claims to be a game must be moderated by the product where practical:
- choices are tappable, not hidden in prose;
- private picks are sealed before hand-off;
- predictions resolve with a reveal;
- sync compares both players;
- roulette resolves visibly;
- timed challenges have a real countdown;
- competitive challenges distinguish win, fail and voluntary skip;
- multi-scene secret missions come back for resolution;
- skips remain available and consent settings always win.

Core loop: **setup → action → tension → change → reveal/payoff → next beat**.

## 01 — First Spark

**Job:** effortless ignition.  
**Signature:** curated early beats instead of a random deck.

- Scene 2: live standoff.
- Scene 4: sealed prediction/reveal.
- Ignition sequence communicates progression without points.
- Opening stays low-intensity before the arc warms up.

Success criterion: the first five minutes already contain movement, a reveal and a small piece of tension.

## 02 — After Dark

**Job:** kinetic mini-game collection.  
**Signature:** tempo shifts + real microgames.

- Alternating Rush: app-controlled response pulse, turn switch, streak and fail state.
- Tap Rush: hit counter, optional goal, time pressure.
- Standoff: live referee moment.
- Roulette / Sync / Prediction use their own interaction rituals.
- SECRET scenes become persistent Covert missions and return two scenes later for a reveal.
- Tempo modes prevent the session from becoming a question deck.

Success criterion: players should regularly touch, pass or react to the device; plain questions are a minority.

## 03 — Night Shift

**Job:** steerable Date Night OS.  
**Signature:** player direction has momentum.

- Funnier / Flirtier / Game / Hotter steer three scenes.
- Direction is visible while active.
- Detours break the linear flow every 7–11 scenes.
- Authored timed beats use actual timers.

Success criterion: changing direction must measurably alter the following scene mix.

## 04 — Heatcheck

**Job:** playful strategy competition.  
**Signature:** Sparks + referee + comeback strategy.

- Regular judged missions are resolved by the opponent.
- Success, failed attempt and voluntary skip are distinct outcomes.
- Streaks, comeback bonuses and Edge power-ups create decisions.
- REBOUND and READ create interaction between turns.
- Every tenth scene is a showdown; Raise can increase the stake.
- Final state produces a winner.

Success criterion: the optimal decision is not always “press continue”; players should care about timing power-ups and judging outcomes.

## 05 — US//AFTER DARK

**Job:** cooperative night-building.  
**Signature:** balance three shared energies.

- Chaos / Connection / Heat are shared, not individual scores.
- Scene selection targets the weakest energy.
- The next reward is surfaced before completion.
- Three authored milestones create shared rituals.
- The Vault only opens after milestones and balanced thresholds.

Success criterion: the pair can explain what they are building together and why the next scene helps.

## 06 — ONE//TWO

**Job:** premium conversational minimalism.  
**Signature:** radical restraint.

- Strict alternation.
- Only question / mission formats.
- ONE/TWO rail makes turn ownership unmistakable.
- Delayed return questions hand selected themes back to the other player.
- Recovery beats prevent emotional monotony.

Success criterion: removing UI is a feature; every visible element must support rhythm or attention.

## 07 — NIGHT//ECHO

**Job:** create callbacks and inside jokes from the current night.  
**Signature:** selective memory.

- Optional captures become typed memory anchors.
- Echoes are spaced; never back-to-back.
- Callback kinds include funny, emotional, flirty, future, prediction and ritual.
- Private/high-sensitivity anchors never reach Director context.
- Memory is session-only and deletable.

Success criterion: a later scene should feel authored specifically for this pair even without generative AI.

## 08 — NIGHT//ECHO — Director

**Job:** invisible live host / composition engine.  
**Signature:** dynamic format orchestration.

- Rolling format mix prevents repetition.
- Director Cuts interrupt the normal grammar every 8–12 scenes.
- AI scenes are schema-validated and interaction-contract checked.
- Local scenes silently take over on failure/offline.
- Covert missions and memory callbacks persist across scene boundaries.
- Consent and sensitivity filtering happen before selection/context.

Success criterion: the Director changes *how* the pair plays, not merely the wording of questions.

## Release gates

No gameplay release is premium unless all of these are green:

1. strict TypeScript;
2. full Vitest suite;
3. client + SSR/Nitro production build;
4. no local-scene interaction-contract violations;
5. game-identity dramaturgy tests;
6. iPhone 390×844 and 430×932 route audit for all eight games;
7. zero horizontal overflow;
8. zero browser console/page errors;
9. an interaction cue is present in every audited active scene.

The target is not “a beautiful card deck.” The target is a set of eight recognisably different digital experiences that could only work this well because they are software.
