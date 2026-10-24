# @game/gang-core

Provider-neutral, UI-independent foundation for **GANG MODE**.

It owns:
- the extensible group-game registry
- 2–99 player scale bands
- capability gating (music/camera/spicy/alcohol)
- manual catalog compatibility
- custom mix validation
- automatic interaction-mode selection
- Party Director candidate scoring and plan building

It intentionally does **not** own rendering, Supabase, Lovable components or transport/realtime implementation.

## Product entry modes

```ts
type GangEntryMode = "director" | "catalog" | "mix";
```

Manual game choice and custom mixes are first-class. Director Mode is an option, not a replacement for the catalog.

## Adding a game

Add one `GangGameDefinition` to `GANG_GAMES`. Do not change Director architecture for each new title. A game declares its real player range, mechanics, device modes, capabilities and readiness.

## Readiness

The initial registry contains prototype and planned titles. Director Mode excludes planned games by default so the runtime never pretends an unfinished game is playable.
