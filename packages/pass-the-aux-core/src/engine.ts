import type {
  AuxAction,
  AuxRound,
  AuxRoundState,
  AuxSession,
  HiddenPick,
  SongPick,
  TracklistEntry,
  VisibleAuxRound,
} from "./types.js";

export function sanitizeSongPick(pick: SongPick): SongPick {
  const title = pick.title.trim().slice(0, 120);
  if (!title) throw new Error("Song title is required");
  const artist = pick.artist?.trim().slice(0, 120);
  const providerId = pick.providerId?.trim().slice(0, 200);
  return {
    title,
    ...(artist ? { artist } : {}),
    ...(pick.provider ? { provider: pick.provider } : {}),
    ...(providerId ? { providerId } : {}),
  };
}

export function createAuxSession(players: [string, string]): AuxSession {
  return {
    players,
    roundIndex: 0,
    current: null,
    tracklist: [],
    reactions: [],
    finished: false,
  };
}

function initialRoundState(round: AuxRound): AuxRoundState {
  return {
    round,
    stage: "PROMPT",
    picks: [],
    prediction: null,
    reaction: null,
    speedExpired: false,
  };
}

function hasPick(state: AuxRoundState, player: 0 | 1): boolean {
  return state.picks.some((x) => x.player === player);
}

function addOrReplacePick(picks: HiddenPick[], player: 0 | 1, pick: SongPick): HiddenPick[] {
  return [...picks.filter((x) => x.player !== player), { player, pick: sanitizeSongPick(pick) }];
}

function nextAfterPick(state: AuxRoundState, player: 0 | 1): AuxRoundState["stage"] {
  if (state.round.type === "SOLO_PICK" || state.round.type === "SPEED_PICK") return "HANDOFF_A";
  if (state.round.type === "GUESS") return "HANDOFF_A";
  if (state.round.type === "DUET_PICK") return player === state.round.activePlayer ? "HANDOFF_A" : "HANDOFF_B";
  return "HANDOFF_A";
}

function toTracklist(round: AuxRound, picks: HiddenPick[]): TracklistEntry[] {
  return [...picks]
    .sort((a, b) => a.player - b.player)
    .map(({ player, pick }) => ({
      roundId: round.id,
      player,
      title: pick.title,
      ...(pick.artist ? { artist: pick.artist } : {}),
      prompt: round.prompt,
    }));
}

export function visibleAuxRound(state: AuxSession): VisibleAuxRound | null {
  const current = state.current;
  if (!current) return null;
  const revealed = ["REVEAL", "REACTION", "COMPLETE"].includes(current.stage);
  return {
    round: current.round,
    stage: current.stage,
    picks: current.picks.map((x) =>
      revealed
        ? { player: x.player, title: x.pick.title, ...(x.pick.artist ? { artist: x.pick.artist } : {}) }
        : { player: x.player },
    ),
    prediction: revealed ? current.prediction : null,
    reaction: current.reaction,
    speedExpired: current.speedExpired,
  };
}

export function auxReducer(state: AuxSession, action: AuxAction): AuxSession {
  switch (action.type) {
    case "LOAD_ROUND":
      if (state.finished) return state;
      return { ...state, current: initialRoundState(action.round) };

    case "START_PICK":
      if (!state.current || state.finished || state.current.stage !== "PROMPT") return state;
      return { ...state, current: { ...state.current, stage: "PICK_A" } };

    case "SUBMIT_PICK": {
      const c = state.current;
      if (!c || state.finished) return state;
      const active = c.round.activePlayer;
      const other = (1 - active) as 0 | 1;
      const allowed =
        c.stage === "PICK_A"
          ? action.player === active
          : c.stage === "PICK_B"
            ? action.player === other
            : false;
      if (!allowed) return state;
      const picks = addOrReplacePick(c.picks, action.player, action.pick);
      return { ...state, current: { ...c, picks, stage: nextAfterPick(c, action.player) } };
    }

    case "CONFIRM_HANDOFF": {
      const c = state.current;
      if (!c || state.finished) return state;
      if (c.stage === "HANDOFF_A") {
        if (c.round.type === "DUET_PICK") return { ...state, current: { ...c, stage: "PICK_B" } };
        if (c.round.type === "GUESS") return { ...state, current: { ...c, stage: "PREDICTION" } };
        return { ...state, current: { ...c, stage: "REVEAL" } };
      }
      if (c.stage === "HANDOFF_B") return { ...state, current: { ...c, stage: "REVEAL" } };
      return state;
    }

    case "SUBMIT_PREDICTION":
      if (!state.current || state.finished || state.current.stage !== "PREDICTION") return state;
      return {
        ...state,
        current: { ...state.current, prediction: action.prediction, stage: "REVEAL" },
      };

    case "REVEAL":
      if (!state.current || state.finished) return state;
      if (!["HANDOFF_A", "HANDOFF_B", "PREDICTION"].includes(state.current.stage)) return state;
      return { ...state, current: { ...state.current, stage: "REVEAL" } };

    case "SET_REACTION":
      if (!state.current || state.finished || state.current.stage !== "REVEAL") return state;
      return {
        ...state,
        current: { ...state.current, reaction: action.reaction, stage: "REACTION" },
      };

    case "SPEED_EXPIRED":
      if (!state.current || state.finished || state.current.round.type !== "SPEED_PICK") return state;
      return { ...state, current: { ...state.current, speedExpired: true } };

    case "COMPLETE_ROUND": {
      const c = state.current;
      if (!c || state.finished) return state;
      if (!["REVEAL", "REACTION"].includes(c.stage)) return state;
      if (!hasPick(c, c.round.activePlayer)) return state;
      if (c.round.type === "DUET_PICK" && c.picks.length < 2) return state;
      const additions = toTracklist(c.round, c.picks);
      return {
        ...state,
        current: { ...c, stage: "COMPLETE" },
        tracklist: [...state.tracklist, ...additions],
        reactions: c.reaction ? [...state.reactions, c.reaction] : state.reactions,
      };
    }

    case "NEXT_ROUND":
      if (state.finished) return state;
      if (state.current && state.current.stage !== "COMPLETE") return state;
      return {
        ...state,
        roundIndex: state.roundIndex + 1,
        current: initialRoundState(action.round),
      };

    case "FINISH":
      return { ...state, finished: true };

    case "RESET":
      return createAuxSession(state.players);
  }
}
