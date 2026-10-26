import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PickForm, TrackCard } from "@/components/player/MusicRound";
import type { MusicProvider } from "@/lib/music/provider";
import type { Track } from "@/lib/game/types";

const apple = (authorized: boolean, results: Track[] = []) => {
  const authorize = vi.fn(async () => true);
  const search = vi.fn(async () => results);
  const p: MusicProvider = { id: "apple-music", label: "Apple Music", capabilities: { search: true, library: true, playback: true, createPlaylist: true }, isAuthorized: () => authorized, authorize, search, play: vi.fn(async () => {}) };
  return { p, authorize, search };
};

describe("PASS//THE AUX reveal & picker UI", () => {
  it("renders no generic Apple Music / Spotify search links and no fake waveform", () => {
    const { container } = render(<TrackCard track={{ title: "Song", artist: "Artist" }} owner="Ari" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/music\.apple\.com\/search|spotify/i);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("hides playback when not authorized and shows it when authorized — without calling authorize", () => {
    const t = { title: "Song", providerId: "123" };
    const a = apple(false);
    const { rerender } = render(<TrackCard track={t} owner="Ari" provider={a.p} />);
    expect(screen.queryByTestId("track-play")).toBeNull();
    const b = apple(true);
    rerender(<TrackCard track={t} owner="Ari" provider={b.p} />);
    expect(screen.getByTestId("track-play")).toBeTruthy();
    expect(a.authorize).not.toHaveBeenCalled();
    expect(b.authorize).not.toHaveBeenCalled();
  });

  it("only links to an exact returned song URL", () => {
    render(<TrackCard track={{ title: "S", providerId: "1", externalUrl: "https://music.apple.com/de/song/s/1" }} owner="Ari" />);
    expect(screen.getByText(/In Apple Music öffnen/).getAttribute("href")).toBe("https://music.apple.com/de/song/s/1");
  });

  it("catalog search fills the track with providerId/artwork/url without authorization", async () => {
    vi.useFakeTimers();
    const hit: Track = { title: "Midnight City", artist: "M83", providerId: "99", artworkUrl: "https://x/a.jpg", externalUrl: "https://music.apple.com/de/song/1" };
    const { p, authorize, search } = apple(false, [hit]);
    const onPick = vi.fn();
    render(<PickForm who="Ari" text="Prompt" cta="Auswahl verstecken" onPick={onPick} onSkip={() => {}} provider={p} />);
    fireEvent.change(screen.getByTestId("catalog-search"), { target: { value: "mid" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    vi.useRealTimers();
    fireEvent.click(screen.getByTestId("catalog-result"));
    fireEvent.click(screen.getByText("Auswahl verstecken"));
    expect(search).toHaveBeenCalledWith("mid", 5);
    expect(onPick).toHaveBeenCalledWith(hit);
    expect(authorize).not.toHaveBeenCalled();
  });

  it("manual mode is the only UI when no catalog exists", () => {
    render(<PickForm who="Ari" text="P" cta="Go" onPick={() => {}} onSkip={() => {}} />);
    expect(screen.getByTestId("song-title")).toBeTruthy();
    expect(screen.queryByTestId("catalog-search")).toBeNull();
    expect(screen.queryByText(/Apple Music/)).toBeNull();
  });
});

import { MusicRoundBody } from "@/components/player/MusicRound";
import { manualProvider } from "@/lib/music/provider";
import type { MusicRound, Scene } from "@/lib/game/types";

function duet(a: Track, b: Track) {
  const scene = { id: "m", type: "MUSIC", flavor: "funny", phase: 0, title: "T", prompt: "Prompt", music: { mode: "duet" } } as unknown as Scene;
  let round: MusicRound | null = null;
  const onDone = vi.fn();
  const music = { round, sceneNumber: 1, setRound: (r: MusicRound) => { round = r; } };
  render(<MusicRoundBody scene={scene} me="Ari" you="Nova" memory={false} onDone={onDone} onSkip={() => {}} text="Prompt" music={music} provider={manualProvider} />);
  const pick = (t: Track, cta: string) => {
    fireEvent.change(screen.getByTestId("song-title"), { target: { value: t.title } });
    fireEvent.change(screen.getByTestId("song-artist"), { target: { value: t.artist ?? "" } });
    fireEvent.click(screen.getByText(cta));
  };
  pick(a, "Auswahl versiegeln");
  // handoff: nothing of A's pick is visible
  expect(document.body.textContent).not.toContain(a.title);
  if (a.artist) expect(document.body.textContent).not.toContain(a.artist);
  fireEvent.click(screen.getByRole("button", { name: /bereit|ich bin|los/i }));
  expect(document.body.textContent).not.toContain(a.title);
  pick(b, "Beide entsiegeln");
  return { onDone, getRound: () => round };
}

describe("PASS//THE AUX duet", () => {
  it("requires a reveal verdict for different songs and turns it into payoff", () => {
    const { onDone, getRound } = duet({ title: "Alpha Song", artist: "One" }, { title: "Beta Song", artist: "Two" });
    expect(screen.getByTestId("music-compare").textContent).toContain("Zwei Songs");
    expect(screen.getByText("Erst einordnen")).toBeDisabled();
    fireEvent.click(screen.getByTestId("music-reaction-twist"));
    expect(screen.getByTestId("music-compare").textContent).toContain("PLOT TWIST");
    expect(getRound()?.reaction).toBe("twist");
    fireEvent.click(screen.getByText("Nächste Runde →"));
    expect(onDone).toHaveBeenCalled();
  });

  it("exact same song becomes SAME BRAIN automatically", () => {
    const { getRound } = duet({ title: "Same Song", artist: "Band" }, { title: "same song", artist: "BAND" });
    expect(screen.getByTestId("music-compare").textContent).toContain("SAME BRAIN");
    fireEvent.click(screen.getByText("Nächste Runde →"));
    expect(getRound()?.reaction).toBe("match");
  });
});

describe("PASS//THE AUX rhythm changes", () => {
  it("speed expiry flips the rule without blocking the pick", async () => {
    vi.useFakeTimers();
    const expired = vi.fn();
    render(<PickForm who="Ari" text="Schnell" cta="Lock it in" speed onSpeedExpired={expired} onPick={() => {}} onSkip={() => {}} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(20_500); });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/zweiten Gedanken/i)).toBeTruthy();
    expect(screen.getByText(/Kein Fail State/i)).toBeTruthy();
    vi.useRealTimers();
  });

  it("consensus is openly negotiated and skips the privacy handoff", () => {
    const scene = { id: "one", type: "MUSIC", flavor: "deep", phase: 2, title: "ONE SONG", prompt: "Einigt euch.", music: { mode: "consensus", signature: "one-song" } } as unknown as Scene;
    const onDone = vi.fn();
    render(<MusicRoundBody scene={scene} me="Ari" you="Nova" memory={false} onDone={onDone} onSkip={() => {}} text="Einigt euch." provider={manualProvider} />);
    expect(screen.getByText(/Ari \+ Nova · gemeinsam/)).toBeTruthy();
    fireEvent.change(screen.getByTestId("song-title"), { target: { value: "Shared Song" } });
    fireEvent.click(screen.getByText("Diesen Track nehmen"));
    expect(screen.getByText(/ONE ROOM · ONE TRACK/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /bereit|ich bin|los/i })).toBeNull();
  });
});

import { MusicSetup } from "@/components/player/MusicRound";
describe("PASS//THE AUX music setup", () => {
  it("renders nothing without a configured catalog", () => {
    const { container } = render(<MusicSetup provider={manualProvider} />);
    expect(container.textContent).toBe("");
  });
  it("authorize is called only from the explicit playback action", async () => {
    const { p, authorize } = apple(false);
    render(<MusicSetup provider={p} />);
    expect(screen.getByTestId("music-setup")).toBeTruthy();
    expect(authorize).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByTestId("playback-connect")); });
    expect(authorize).toHaveBeenCalledTimes(1);
  });
});
