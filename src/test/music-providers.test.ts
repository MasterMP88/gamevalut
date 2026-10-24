import { describe, expect, it, vi } from "vitest";
import { appleMusicProvider, manualMusicProvider, usableMusicProviders, type AppleMusicBridge } from "@/lib/music/providers";

function bridge(available = true): AppleMusicBridge {
  return {
    available: () => available,
    authorize: vi.fn(async () => true),
    search: vi.fn(async () => []),
    play: vi.fn(async () => undefined),
    createPlaylist: vi.fn(async () => ({ id: "playlist-1" })),
  };
}

describe("music provider capabilities", () => {
  it("manual mode is always available and advertises no fake capabilities", () => {
    expect(manualMusicProvider.available()).toBe(true);
    expect([...manualMusicProvider.capabilities()]).toEqual([]);
  });

  it("does not expose Apple Music without a working bridge", () => {
    expect(appleMusicProvider()).toBeNull();
    expect(appleMusicProvider(bridge(false))).toBeNull();
    expect(usableMusicProviders()).toEqual([manualMusicProvider]);
  });

  it("exposes Apple Music capabilities only when the real bridge is available", () => {
    const provider = appleMusicProvider(bridge(true));
    expect(provider?.label).toBe("Apple Music");
    expect(new Set(provider ? [...provider.capabilities()] : [])).toEqual(new Set(["authorize", "search", "playback", "createPlaylist"]));
    expect(usableMusicProviders(bridge(true)).map((p) => p.id)).toEqual(["manual", "apple-music"]);
  });
});
