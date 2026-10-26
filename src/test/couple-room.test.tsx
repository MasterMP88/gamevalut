import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { CoupleRoom } from "@/components/couple/CoupleRoom";
import { createRoomClient } from "@/lib/gang/room-client";
import { actPair, pairLobby, pairWrite, startPair } from "@/lib/couple/online";
import { DEFAULT_SETTINGS } from "@/lib/game/engine";
import { fakeServer } from "./gang-fake-server";
afterEach(() => cleanup());
describe("two phones", () => {
  it("keeps the first answer sealed, reveals both together, then accepts an out-of-turn pause", async () => {
    const srv = fakeServer(),
      client = createRoomClient(srv.rpc);
    const a = await client.create("Ari", "catalog", 2, "couple"),
      b = await client.join(a.snapshot.code, "Nova", "couple");
    let f = startPair(
      pairLobby("coop", 15),
      await client.snapshot(a.session.token),
    );
    f = actPair(
      f,
      [a, b].map((p) => ({
        playerId: p.snapshot.playerId,
        actionType: "pair",
        payload: { adult: true, settings: DEFAULT_SETTINGS },
      })),
    );
    f = {
      ...f,
      phase: "answer",
      state: {
        ...f.state!,
        current: {
          id: "pair-ui-fixture",
          type: "SYNC",
          flavor: "game",
          phase: 0,
          title: "Gemeinsame Wahl",
          prompt: "Links oder rechts?",
          choices: ["Links", "Rechts"],
        },
      },
    };
    const initial = await client.publish(
      a.session.token,
      await client.snapshot(a.session.token),
      () => pairWrite(f),
    );
    const ar = render(
      <CoupleRoom
        client={client}
        session={a.session}
        initial={initial}
        onLeave={() => {}}
      />,
    );
    const br = render(
      <CoupleRoom
        client={client}
        session={b.session}
        initial={await client.snapshot(b.session.token)}
        onLeave={() => {}}
      />,
    );
    const av = within(ar.container),
      bv = within(br.container);
    fireEvent.click(av.getByRole("button", { name: "Links" }));
    fireEvent.click(av.getByRole("button", { name: "Verdeckt abgeben" }));
    await waitFor(() =>
      expect(av.getByText(/Versiegelt. Deine Eingabe/)).toBeTruthy(),
    );
    expect(bv.queryByText("Gleiche Frequenz")).toBeNull();
    fireEvent.click(bv.getByRole("button", { name: "Links" }));
    fireEvent.click(bv.getByRole("button", { name: "Verdeckt abgeben" }));
    await waitFor(() => expect(av.getByText("Gleiche Frequenz")).toBeTruthy(), {
      timeout: 5000,
    });
    await waitFor(() => expect(bv.getByText("Gleiche Frequenz")).toBeTruthy(), {
      timeout: 5000,
    });
    expect(av.getByText("Ari: Links")).toBeTruthy();
    expect(bv.getByText("Nova: Links")).toBeTruthy();
    fireEvent.click(bv.getByRole("button", { name: "Pause & Rahmen" }));
    await waitFor(
      () => expect(av.getByText("Erst wieder wohlfühlen.")).toBeTruthy(),
      { timeout: 5000 },
    );
    await waitFor(
      () => expect(bv.getByText("Erst wieder wohlfühlen.")).toBeTruthy(),
      { timeout: 5000 },
    );
    expect((await client.loadRuntime(a.session.token))?.["phase"]).toBe(
      "paused",
    );
  }, 15000);
  it("restores only the owner's secret card after remount", async () => {
    const srv = fakeServer(),
      client = createRoomClient(srv.rpc);
    const a = await client.create("Ari", "catalog", 2, "couple"),
      b = await client.join(a.snapshot.code, "Nova", "couple");
    let f = startPair(
      pairLobby("battle", 15),
      await client.snapshot(a.session.token),
    );
    f = {
      ...f,
      phase: "answer",
      state: {
        ...f.state!,
        current: {
          id: "private-fixture",
          type: "SECRET",
          flavor: "game",
          phase: 0,
          title: "Geheimauftrag",
          prompt: "Bring Nova dazu, Mond zu sagen.",
        },
      },
    };
    const initial = await client.publish(
      a.session.token,
      await client.snapshot(a.session.token),
      () => pairWrite(f),
    );
    const ar = render(
      <CoupleRoom
        client={client}
        session={a.session}
        initial={initial}
        onLeave={() => {}}
      />,
    );
    const br = render(
      <CoupleRoom
        client={client}
        session={b.session}
        initial={await client.snapshot(b.session.token)}
        onLeave={() => {}}
      />,
    );
    await waitFor(() =>
      expect(
        within(ar.container).getByText("Bring Nova dazu, Mond zu sagen."),
      ).toBeTruthy(),
    );
    expect(br.container.textContent).not.toContain("Bring Nova dazu");
    ar.unmount();
    const resumed = render(
      <CoupleRoom
        client={client}
        session={a.session}
        initial={await client.snapshot(a.session.token)}
        onLeave={() => {}}
      />,
    );
    await waitFor(() =>
      expect(
        within(resumed.container).getByText("Bring Nova dazu, Mond zu sagen."),
      ).toBeTruthy(),
    );
    expect(br.container.textContent).not.toContain("Bring Nova dazu");
  });
});
