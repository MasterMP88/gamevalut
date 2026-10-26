import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { GAMES } from "@/lib/game/games";
import { SCENES } from "@/lib/game/scenes";
import {
  candidatePool,
  createSession,
  reducer,
  DEFAULT_SETTINGS,
  allowedByConsent,
} from "@/lib/game/engine";
import type { ConsentSettings, GameId } from "@/lib/game/types";
import { GANG_PLAYBOOKS, gangContentCapacity } from "@/lib/gang/core";

const gentle: ConsentSettings = {
  touch: false,
  sensual: false,
  drinks: false,
  signals: false,
  intensityCap: 1,
};
const profiles = [
  {
    name: "all optional content off, lowest intensity",
    settings: gentle,
    nights: 3,
  },
  { name: "default settings", settings: DEFAULT_SETTINGS, nights: 5 },
  {
    name: "all content opted in",
    settings: {
      touch: true,
      sensual: true,
      drinks: true,
      signals: true,
      intensityCap: 5,
    },
    nights: 5,
  },
];
const ritual = (id: string) =>
  id.startsWith("ms-") || id.startsWith("pair-") || id.startsWith("echo-");

function playNights(
  id: GameId,
  settings: ConsentSettings,
  nights: number,
  seed: number,
  skip = false,
) {
  const seen: string[] = [];
  for (let night = 0; night < nights; night++) {
    let s = createSession(id, ["Ari", "Nova"], settings, seed, {
      durationMinutes: 60,
      seenIds: [...seen],
    });
    const shown: string[] = [];
    for (let step = 0; !s.finished && step < 80; step++) {
      expect(s.current).not.toBeNull();
      const scene = s.current!;
      expect(allowedByConsent(scene, settings), scene.id).toBe(true);
      if (!ritual(scene.id)) {
        expect(
          seen,
          id + ": night " + (night + 1) + " " + scene.id,
        ).not.toContain(scene.id);
        expect(shown).not.toContain(scene.id);
      }
      shown.push(scene.id);
      s = skip
        ? reducer(s, { type: "SKIP" })
        : scene.type === "SHOWDOWN"
          ? reducer(s, { type: "SHOWDOWN_WIN", winner: null })
          : reducer(s, { type: "DONE" });
    }
    expect(s.finished).toBe(true);
    expect(shown).toHaveLength(40);
    seen.push(...shown);
  }
  return seen;
}

describe("couple replay capacity through actual 60-minute runtime", () => {
  for (const game of GAMES)
    for (const profile of profiles)
      it(`${game.title}: ${profile.nights} long nights; ${profile.name}`, () => {
        // Same seed makes this a history test, not a statistical shuffle claim.
        for (const seed of [1, 42, 98765])
          playNights(game.id, profile.settings, profile.nights, seed);
      });
  for (const game of GAMES)
    it(`${game.title}: even skipped cards consume history at lowest intensity`, () => {
      playNights(game.id, gentle, 3, 42, true);
    });
  it("every gentle pool holds at least three times 40 beats plus 25% reserve", () => {
    for (const game of GAMES) {
      const pool = candidatePool(createSession(game.id, ["A", "B"], gentle));
      expect(pool.length, game.id).toBeGreaterThanOrEqual(150);
      if (game.battle)
        expect(
          pool.filter((s) => s.type === "SHOWDOWN").length,
        ).toBeGreaterThanOrEqual(15);
    }
  });
  it("content IDs and authored prompts stay distinct across new packs", () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    expect(
      new Set(
        SCENES.map((s) => s.prompt.normalize("NFKC").toLocaleLowerCase("de")),
      ).size,
    ).toBe(SCENES.length);
  });
  it("a different seed changes order without needing AI", () => {
    for (const game of GAMES) {
      const a = playNights(game.id, gentle, 1, 1),
        b = playNights(game.id, gentle, 1, 99);
      expect(a, game.id).not.toEqual(b);
    }
  });
  it("three mixed evenings can sample every title for ten beats without shared-content repeats", () => {
    const seen: string[] = [];
    for (let evening = 0; evening < 3; evening++)
      for (const g of GAMES) {
        let s = createSession(g.id, ["A", "B"], gentle, 42, {
          durationMinutes: 15,
          seenIds: [...seen],
        });
        let steps = 0;
        while (!s.finished && steps++ < 15) {
          const scene = s.current!;
          if (!ritual(scene.id))
            expect(seen, `${g.id} mixed night ${evening + 1}`).not.toContain(
              scene.id,
            );
          seen.push(scene.id);
          s =
            scene.type === "SHOWDOWN"
              ? reducer(s, { type: "SHOWDOWN_WIN", winner: null })
              : reducer(s, { type: "DONE" });
        }
        expect(s.finished).toBe(true);
      }
  });
});

// Explicit maintainer command generates a reproducible report from the same
// exports consumed by the UI. Normal test runs do not write tracked artifacts.
if (process.env["CONTENT_AUDIT_REPORT"] === "1")
  it("write capacity inventory", () => {
    const couples = GAMES.map((g) => ({
      id: g.id,
      title: g.title,
      maxPlayers: 2,
      maxBeats: 40,
      defaultCards: candidatePool(
        createSession(g.id, ["A", "B"], DEFAULT_SETTINGS),
      ).length,
      gentleCards: candidatePool(createSession(g.id, ["A", "B"], gentle))
        .length,
      exclusiveCards: SCENES.filter(
        (s) => s.only?.length === 1 && s.only[0] === g.id,
      ).length,
      testedDefaultNights: 5,
      testedGentleNights: 3,
    }));
    const groups = GANG_PLAYBOOKS.filter((p) => p.runtime !== "time-drop").map(
      (p) => ({
        title: p.title,
        private: gangContentCapacity(p.id),
        couch: gangContentCapacity(p.id, "couch"),
      }),
    );
    writeFileSync(
      "docs/content-capacity-2026.json",
      JSON.stringify(
        {
          date: "2026-10-26",
          coupleScenes: SCENES.length,
          registeredGangCardIds: new Set(
            GANG_PLAYBOOKS.filter((p) => p.runtime !== "time-drop").flatMap(
              (p) => p.prompts.map((c) => c.id),
            ),
          ).size,
          couples,
          groups,
          notes: [
            "Finite decks; retained content history required.",
            "Shared couple pools are not additive; these are per-title nights starting with an otherwise unseen eligible pool.",
            "ONE//TWO returns, co-op milestones and AFTER DARK consent are deliberate rituals, not new content.",
            "Music Drop couch uses manually selected DJ tracks or player-supplied audio; DJ songs have no automatic history and no licensed catalogue is included.",
            "FIRST BEAT and TIME DROP remain outside the released catalogue.",
          ],
        },
        null,
        2,
      ) + "\n",
    );
  });
