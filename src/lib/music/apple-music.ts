import type { Track } from "@/lib/game/types";
import { appleMusicRequested, manualProvider, type MusicProvider } from "./provider";
import { getMusicKitConfig } from "./musickit.functions";

/* Minimal MusicKit JS v3 surface we use. */
interface MKInstance {
  isAuthorized: boolean;
  authorize(): Promise<string>;
  api: { music(path: string, params?: Record<string, unknown>, opts?: { fetchOptions?: RequestInit }): Promise<{ data: any }> };
  setQueue(o: { song: string; startPlaying?: boolean }): Promise<unknown>;
}
declare global {
  interface Window {
    MusicKit?: { configure(o: unknown): Promise<MKInstance>; getInstance(): MKInstance };
  }
}

let mk: Promise<MKInstance | null> | null = null;

function loadScript(): Promise<void> {
  return new Promise((res, rej) => {
    if (window.MusicKit) return res();
    const el = document.createElement("script");
    el.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    el.async = true;
    el.onload = () => res();
    el.onerror = () => rej(new Error("musickit-load"));
    document.head.appendChild(el);
  });
}

/** Loads + configures MusicKit only when the server says Apple Music is configured. Fail-soft: null. */
async function instance(): Promise<MKInstance | null> {
  if (typeof window === "undefined" || !appleMusicRequested()) return null;
  mk ??= (async () => {
    try {
      const cfg = await getMusicKitConfig();
      if (!cfg.enabled) return null;
      await loadScript();
      return await window.MusicKit!.configure({ developerToken: cfg.developerToken, app: cfg.app });
    } catch {
      return null;
    }
  })();
  return mk;
}

const toTrack = (s: any): Track => ({
  title: s.attributes?.name ?? "",
  artist: s.attributes?.artistName,
  providerId: s.id,
  artworkUrl: s.attributes?.artwork?.url?.replace("{w}", "300").replace("{h}", "300"),
  externalUrl: typeof s.attributes?.url === "string" && s.attributes.url.startsWith("https://music.apple.com/") ? s.attributes.url : undefined,
});

function appleProvider(m: MKInstance): MusicProvider {
  return {
    id: "apple-music",
    label: "Apple Music",
    capabilities: { search: true, library: true, playback: true, createPlaylist: true },
    isAuthorized: () => m.isAuthorized,
    async authorize() {
      try { await m.authorize(); return m.isAuthorized; } catch { return false; }
    },
    async search(term, limit = 8) {
      const r = await m.api.music("/v1/catalog/{{storefrontId}}/search", { term, types: "songs", limit });
      return (r.data?.results?.songs?.data ?? []).map(toTrack);
    },
    async play(t) {
      if (t.providerId) await m.setQueue({ song: t.providerId, startPlaying: true });
    },
    async createPlaylist(name, tracks, description) {
      if (!m.isAuthorized) return { ok: false };
      const data = tracks.filter((t) => t.providerId).map((t) => ({ id: t.providerId!, type: "songs" }));
      await m.api.music("/v1/me/library/playlists", undefined, {
        fetchOptions: { method: "POST", body: JSON.stringify({ attributes: { name, description }, relationships: { tracks: { data } } }) },
      });
      return { ok: true };
    },
  };
}

/** Resolve the best provider available right now. Manual is always the safe default. */
export async function resolveMusicProvider(): Promise<MusicProvider> {
  const m = await instance();
  return m ? appleProvider(m) : manualProvider;
}