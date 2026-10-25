import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import { GangRoom, HostSetup, JoinSheet } from "@/components/gang/GangRoom";
import { GangBigScreen } from "@/components/gang/GangBigScreen";
import { createRoomClient, type RoomClient, type StoredSession } from "@/lib/gang/room-client";
import { lobbyFac, buildPublic, readPublic } from "@/lib/gang/online";
import type { GangGameId } from "@/lib/gang/core/playbooks";
import { fakeServer } from "./gang-fake-server";

const W = { timeout: 4000 };
beforeEach(() => sessionStorage.clear());
afterEach(() => cleanup());

async function room(queue: GangGameId[], names: string[]) {
  const srv = fakeServer();
  const client = createRoomClient(srv.rpc);
  const host = await client.create(names[0]!, "catalog", 99);
  await client.setState(host.session.token, host.snapshot, (s) => buildPublic(lobbyFac(queue), s).write);
  const sessions: StoredSession[] = [host.session];
  for (const n of names.slice(1)) sessions.push((await client.join(host.snapshot.code, n)).session);
  return { srv, client, code: host.snapshot.code, sessions };
}
const mount = (client: RoomClient, session: StoredSession) =>
  render(<GangRoom client={client} session={session} initial={null} pollMs={15} onExit={() => {}} />).container;
const roomOf = (srv: ReturnType<typeof fakeServer>) => [...srv.rooms.values()][0]!;
const btn = (c: HTMLElement, name: string | RegExp) => within(c).getByRole("button", { name });

async function pickAndSend(c: HTMLElement, tip = 0, own = 0) {
  const tipRow = await within(c).findByTestId("majority-tip", {}, W);
  fireEvent.click(within(tipRow).getAllByRole("radio")[tip]!);
  await new Promise((r) => setTimeout(r, 30));
  fireEvent.click(within(await within(c).findByTestId("majority-own", {}, W)).getAllByRole("radio")[own]!);
  fireEvent.click(btn(c, "Beides abgeben"));
}

describe("EVERYONE IN — host, join, lobby", () => {
  it("host creates a real room and sees its code + QR", async () => {
    const srv = fakeServer();
    const client = createRoomClient(srv.rpc);
    const onReady = vi.fn();
    const { getByLabelText, getByRole } = render(<HostSetup client={client} queue={["the-majority"]} entry="catalog" bigScreen={false} onReady={onReady} />);
    fireEvent.change(getByLabelText("DEIN NAME"), { target: { value: "Host" } });
    fireEvent.click(getByRole("button", { name: "Raum öffnen" }));
    await waitFor(() => expect(onReady).toHaveBeenCalled(), W);
    const [session, snap] = onReady.mock.calls[0]!;
    cleanup();
    const c = render(<GangRoom client={client} session={session} initial={snap} pollMs={15} onExit={() => {}} />).container;
    const code = roomOf(srv).code;
    expect(within(c).getByTestId("room-code").textContent).toBe(code);
    expect(c.querySelector("[data-qr]")?.getAttribute("data-qr")).toMatch(new RegExp(`/gang\\?join=${code}$`));
    expect(c.innerHTML).not.toContain(session.token);
    expect(btn(c, "Spiel starten")).toBeDisabled(); // MAJORITY needs 3
  });

  it("join flow submits a name and waits in the lobby", async () => {
    const { client, code } = await room(["the-majority"], ["Host"]);
    const onJoined = vi.fn();
    const { getByLabelText, getByRole } = render(<JoinSheet client={client} code={code} onJoined={onJoined} onCancel={() => {}} />);
    fireEvent.change(getByLabelText("DEIN NAME"), { target: { value: "Mia" } });
    fireEvent.click(getByRole("button", { name: "Beitreten" }));
    await waitFor(() => expect(onJoined).toHaveBeenCalled(), W);
    cleanup();
    const c = mount(client, onJoined.mock.calls[0]![0]);
    await within(c).findByText("WARTE AUF DEN START", {}, W);
    expect(within(c).getByText("Mia")).toBeTruthy();
  });
});

describe("EVERYONE IN — THE MAJORITY over the room", () => {
  it("controllers submit, facilitator collects, advances the canonical runtime and publishes the next stage", async () => {
    const { srv, client, sessions } = await room(["the-majority"], ["Host", "Mia", "Jo"]);
    const [h, a, b] = sessions.map((s) => mount(client, s));
    await waitFor(() => expect(btn(h!, "Spiel starten")).not.toBeDisabled(), W);
    fireEvent.click(btn(h!, "Spiel starten"));
    await waitFor(() => expect(readPublic({ publicState: roomOf(srv).publicState } as never)?.view?.stage).toBe("predict"), W);
    expect(roomOf(srv).runtime).toBeTruthy();
    for (const c of [h!, a!, b!]) await pickAndSend(c);
    // own answers were cached and auto-submitted once when "answer" opened — nobody sees the question twice
    const reveal = await within(h!).findByRole("button", { name: "Aufdecken" }, W);
    expect(within(a!).queryByRole("button", { name: "Aufdecken" })).toBeNull();
    const answers = [...srv.actions.values()].filter((x) => x.stage.endsWith("-answer"));
    expect(answers).toHaveLength(3); // exactly once per player, host included
    expect(new Set(answers.map((x) => x.playerId)).size).toBe(3);
    expect(srv.calls.filter((x) => x.fn === "gang_submit_action" && String(x.args["p_stage"]).endsWith("-answer"))).toHaveLength(3);
    fireEvent.click(reveal);
    await within(a!).findByTestId("online-score", {}, W);
    expect(within(h!).getByRole("button", { name: "Nächste Runde" })).toBeTruthy();
  });

  it("Big Screen shows prompt + progress and has no answer controls", async () => {
    const { srv, client, code, sessions } = await room(["the-majority"], ["Host", "Mia", "Jo"]);
    const h = mount(client, sessions[0]!);
    await waitFor(() => expect(btn(h, "Spiel starten")).not.toBeDisabled(), W);
    fireEvent.click(btn(h, "Spiel starten"));
    const tv = render(<GangBigScreen client={client} code={code} pollMs={15} />).container;
    const prompt = await within(tv).findByTestId("screen-prompt", {}, W);
    expect(prompt.textContent?.length).toBeGreaterThan(5);
    await within(tv).findByRole("status", { name: /0 von 3 abgegeben/ }, W);
    expect(within(tv).queryAllByRole("radio")).toHaveLength(0);
    expect(within(tv).queryAllByRole("textbox")).toHaveLength(0);
    expect(within(tv).queryAllByRole("button")).toHaveLength(0);
    expect(roomOf(srv).publicState["requiredPlayerIds"]).toHaveLength(3); // display took no seat
  });
});

describe("EVERYONE IN — private rounds + failover", () => {
  it("UNDERCOVER secrets are fetched owner-only; Big Screen / public state never contain them", async () => {
    const { srv, client, code, sessions } = await room(["undercover"], ["Host", "Mia", "Jo", "Kai"]);
    const cs = sessions.map((s) => mount(client, s));
    await waitFor(() => expect(btn(cs[0]!, "Spiel starten")).not.toBeDisabled(), W);
    fireEvent.click(btn(cs[0]!, "Spiel starten"));
    const tv = render(<GangBigScreen client={client} code={code} pollMs={15} />).container;
    await within(cs[1]!).findByRole("button", { name: "Gemerkt" }, W);
    await waitFor(() => expect(btn(cs[1]!, "Gemerkt")).not.toBeDisabled(), W);
    // EVERYONE IN: private rounds live on the owner's phone — no pass-the-phone curtain anywhere.
    expect(within(cs[1]!).getByTestId("private-screen").textContent).toContain("NUR AUF DEINEM HANDY");
    for (const c of cs) {
      expect(within(c).queryByTestId("curtain")).toBeNull();
      expect(c.textContent).not.toMatch(/Gib das Handy|weitergeben/);
    }
    const r = roomOf(srv);
    const mia = [...srv.players.values()].find((p) => p.name === "Mia")!;
    const own = srv.privates.get(`${r.id}|${r.roundKey}|${mia.id}`)!;
    fireEvent.pointerDown(within(cs[1]!).getByTestId("secret"));
    expect(within(cs[1]!).getByTestId("secret").textContent).toContain(String(own["secret"]));
    const secrets = [...srv.privates.values()].map((p) => String(p["secret"]));
    const pub = JSON.stringify(r.publicState);
    for (const sec of secrets) { expect(pub).not.toContain(sec); expect(tv.textContent).not.toContain(sec); }
    for (const call of srv.calls.filter((x) => x.fn === "gang_get_private")) {
      const who = [...srv.players.values()].find((p) => p.token === call.args["p_player_token"])!;
      expect(who.canInput).toBe(true);
    }
    expect(srv.calls.some((x) => x.fn === "gang_get_private" && [...srv.players.values()].find((p) => p.token === x.args["p_player_token"])?.canInput === false)).toBe(false);
  });

  it("facilitator failover: the next player loads the saved runtime and the round continues", async () => {
    const { srv, client, sessions } = await room(["the-majority"], ["Host", "Mia", "Jo", "Kai"]);
    const h = mount(client, sessions[0]!);
    await waitFor(() => expect(btn(h, "Spiel starten")).not.toBeDisabled(), W);
    fireEvent.click(btn(h, "Spiel starten"));
    await waitFor(() => expect((roomOf(srv).publicState as { view?: { stage: string } }).view?.stage).toBe("predict"), W);
    cleanup();
    await client.leave(sessions[0]!.token);
    const load = vi.spyOn(client, "loadRuntime");
    const rest = sessions.slice(1).map((s) => mount(client, s));
    await waitFor(() => expect(load).toHaveBeenCalled(), W);
    await waitFor(() => expect(roomOf(srv).publicState["requiredPlayerIds"]).toHaveLength(3), W);
    for (const c of rest) await pickAndSend(c);
    await waitFor(() => expect((roomOf(srv).publicState as { view: { stage: string } }).view.stage).toBe("reveal"), W);
  });
});
