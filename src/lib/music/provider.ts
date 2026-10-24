import type { Track } from "@/lib/game/types";

/**
 * Music provider capability layer for PASS//THE AUX.
 *
 * The game is fully playable with the provider-neutral `manual` provider (user types a
 * title, artist optional). A real provider (Apple Music via MusicKit on the web) can add
 * catalog search, playback and playlist creation — but only when genuinely configured
 * and after an explicit user action. The UI must only render a capability when it is true.
 *
 * Spotify is intentionally NOT a provider: its developer policy disallows games. Spotify
 * may only appear as an external search link built from user-entered text.
 */
export interface MusicCapabilities {
  search: boolean;
  library: boolean;
  playback: boolean;
  createPlaylist: boolean;
}

export interface MusicProvider {
  id: "manual" | "apple-music";
  label: string;
  capabilities: MusicCapabilities;
  /** True once the user explicitly authorized (Apple Music) — manual is always true. */
  isAuthorized(): boolean;
  authorize?(): Promise<boolean>;
  search?(term: string, limit?: number): Promise<Track[]>;
  play?(track: Track): Promise<void>;
  createPlaylist?(name: string, tracks: Track[], description?: string): Promise<{ ok: boolean; url?: string | undefined }>;
}

export const NO_CAPABILITIES: MusicCapabilities = { search: false, library: false, playback: false, createPlaylist: false };

export const manualProvider: MusicProvider = {
  id: "manual",
  label: "Manuell",
  capabilities: NO_CAPABILITIES,
  isAuthorized: () => true,
};

/** External "search in app" links from user-entered text only. No API, no OAuth, no metadata fetch. */
export function externalSearchLinks(t: Pick<Track, "title" | "artist">): { label: string; href: string }[] {
  const q = [t.title, t.artist].filter(Boolean).join(" ").trim();
  if (!q) return [];
  const e = encodeURIComponent(q);
  return [
    { label: "Apple Music", href: `https://music.apple.com/search?term=${e}` },
    { label: "Spotify", href: `https://open.spotify.com/search/${e}` },
  ];
}

/** Build-time opt-in: the client only asks the server for MusicKit config when this is set. */
export function appleMusicRequested(): boolean {
  return import.meta.env["VITE_APPLE_MUSIC_ENABLED"] === "true";
}