import type { MusicProviderId, MusicTrack } from "./types.js";

export interface MusicProviderCapabilities {
  configured: boolean;
  searchCatalog: boolean;
  catalogPreview: boolean;
  library: boolean;
  fullPlayback: boolean;
  createPlaylist: boolean;
  requiresUserAuthorization: boolean;
}

export interface MusicProvider {
  id: MusicProviderId;
  capabilities(): MusicProviderCapabilities;
  search(query: string, limit?: number): Promise<MusicTrack[]>;
  libraryTracks?(limit?: number): Promise<MusicTrack[]>;
  authorize?(): Promise<void>;
  play?(track: MusicTrack): Promise<void>;
  createPlaylist?(name: string, tracks: MusicTrack[]): Promise<{ id: string; url?: string }>;
}

export interface AppleMusicSongLike {
  id: string;
  attributes?: {
    name?: string;
    artistName?: string;
    artwork?: { url?: string };
    releaseDate?: string;
    genreNames?: string[];
    durationInMillis?: number;
    previews?: { url?: string }[];
  };
}

export function normalizeAppleMusicSong(song: AppleMusicSongLike): MusicTrack | null {
  const a = song.attributes;
  const title = a?.name?.trim();
  const artist = a?.artistName?.trim();
  const previewUrl = a?.previews?.find((p) => Boolean(p.url))?.url;
  if (!title || !artist || !previewUrl) return null;
  const artworkUrl = a?.artwork?.url
    ?.replace("{w}", "600")
    .replace("{h}", "600");
  return {
    id: song.id,
    title,
    artist,
    provider: "apple-music",
    previewUrl,
    ...(artworkUrl ? { artworkUrl } : {}),
    ...(a?.releaseDate ? { releaseDate: a.releaseDate } : {}),
    ...(a?.genreNames ? { genres: a.genreNames } : {}),
    ...(a?.durationInMillis === undefined ? {} : { durationMs: a.durationInMillis }),
  };
}

/**
 * Thin dependency-injected adapter. The app shell owns MusicKit JS loading and token retrieval.
 * No Apple private key or developer secret belongs in the browser bundle.
 */
export interface AppleMusicBridge {
  isConfigured(): boolean;
  isAuthorized(): boolean;
  authorize(): Promise<void>;
  searchSongs(query: string, limit: number): Promise<AppleMusicSongLike[]>;
  librarySongs?(limit: number): Promise<AppleMusicSongLike[]>;
  playSong?(id: string): Promise<void>;
  createPlaylist?(name: string, songIds: string[]): Promise<{ id: string; url?: string }>;
}

export class AppleMusicProvider implements MusicProvider {
  readonly id = "apple-music" as const;
  constructor(private readonly bridge: AppleMusicBridge) {}

  capabilities(): MusicProviderCapabilities {
    const configured = this.bridge.isConfigured();
    const authorized = this.bridge.isAuthorized();
    return {
      configured,
      searchCatalog: configured,
      catalogPreview: configured,
      library: configured && authorized && Boolean(this.bridge.librarySongs),
      fullPlayback: configured && authorized && Boolean(this.bridge.playSong),
      createPlaylist: configured && authorized && Boolean(this.bridge.createPlaylist),
      requiresUserAuthorization: true,
    };
  }

  async authorize(): Promise<void> {
    if (!this.bridge.isConfigured()) throw new Error("Apple Music is not configured");
    await this.bridge.authorize();
  }

  async search(query: string, limit = 12): Promise<MusicTrack[]> {
    if (!this.bridge.isConfigured()) return [];
    const songs = await this.bridge.searchSongs(query.trim(), Math.max(1, Math.min(25, limit)));
    return songs.map(normalizeAppleMusicSong).filter((x): x is MusicTrack => x !== null);
  }

  async libraryTracks(limit = 30): Promise<MusicTrack[]> {
    if (!this.bridge.isConfigured() || !this.bridge.isAuthorized() || !this.bridge.librarySongs) return [];
    const songs = await this.bridge.librarySongs(Math.max(1, Math.min(100, limit)));
    return songs.map(normalizeAppleMusicSong).filter((x): x is MusicTrack => x !== null);
  }

  async play(track: MusicTrack): Promise<void> {
    if (!this.bridge.isAuthorized() || !this.bridge.playSong) throw new Error("Full playback is unavailable");
    await this.bridge.playSong(track.id);
  }

  async createPlaylist(name: string, tracks: MusicTrack[]): Promise<{ id: string; url?: string }> {
    if (!this.bridge.isAuthorized() || !this.bridge.createPlaylist) throw new Error("Playlist creation is unavailable");
    return this.bridge.createPlaylist(name, tracks.filter((t) => t.provider === "apple-music").map((t) => t.id));
  }
}
