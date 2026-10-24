import type { Track } from "@/lib/game/types";

/**
 * Music provider capability layer for PASS//THE AUX.
 *
 * The game is fully playable with the provider-neutral `manual` provider (user types a
 * title, artist optional). A real provider (Apple Music via MusicKit on the web) can add
 * catalog search, playback and playlist creation — but only when genuinely configured
 * and after an explicit user action. The UI must only render a capability when it is true.
 *
 * Spotify is intentionally NOT a provider and never appears in gameplay.
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

const norm = (x?: string) => (x ?? "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\(.*?\)|\[.*?\]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Exact same song: same catalog id, or same normalized title + artist (artist required on both for manual). */
export function sameSong(a: Track | null | undefined, b: Track | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.providerId && b.providerId) return a.providerId === b.providerId;
  return !!norm(a.title) && norm(a.title) === norm(b.title) && !!norm(a.artist) && norm(a.artist) === norm(b.artist);
}

/** Playback is shown only when real, already authorized and the track came from the catalog. Never prompts login. */
export function canPlay(p: MusicProvider | null | undefined, t: Track): boolean {
  return !!(p && p.capabilities.playback && p.play && t.providerId && p.isAuthorized());
}

/** Build-time opt-in: the client only asks the server for MusicKit config when this is set. */
export function appleMusicRequested(): boolean {
  return import.meta.env["VITE_APPLE_MUSIC_ENABLED"] === "true";
}