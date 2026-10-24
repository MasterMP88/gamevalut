import type { GameAudioRights, GameAudioSource, MusicTrack } from "./types.js";

export interface GameAudioProviderCapabilities {
  configured: boolean;
  playableInGame: boolean;
  rightsCleared: boolean;
  supportsSearch: boolean;
  supportsLocalSelection: boolean;
}

export interface GameAudioProvider {
  id: string;
  source: GameAudioSource;
  capabilities(): GameAudioProviderCapabilities;
  list(limit?: number): Promise<MusicTrack[]>;
  search?(query: string, limit?: number): Promise<MusicTrack[]>;
}

/**
 * FIRST//BEAT must only consume audio that the product is permitted to use as game material.
 * Apple Music/iTunes preview assets are intentionally not modeled as an in-game source here.
 */
export function isRightsClearedGameTrack(track: MusicTrack): boolean {
  return Boolean(
    track.audioUrl &&
      track.rights &&
      ["owned", "licensed", "user-local"].includes(track.rights),
  );
}

export function requireRightsClearedGameTrack(track: MusicTrack): MusicTrack {
  if (!isRightsClearedGameTrack(track)) {
    throw new Error("Track is not cleared for in-game audio use");
  }
  return track;
}

export class StaticRightsClearedProvider implements GameAudioProvider {
  readonly id: string;
  readonly source: GameAudioSource;
  private readonly tracks: MusicTrack[];
  private readonly rights: GameAudioRights;

  constructor(args: {
    id: string;
    source: Exclude<GameAudioSource, "local-file">;
    rights: Exclude<GameAudioRights, "user-local">;
    tracks: MusicTrack[];
  }) {
    this.id = args.id;
    this.source = args.source;
    this.rights = args.rights;
    this.tracks = args.tracks.map((track) => ({
      ...track,
      source: args.source,
      rights: args.rights,
    }));
  }

  capabilities(): GameAudioProviderCapabilities {
    return {
      configured: true,
      playableInGame: true,
      rightsCleared: true,
      supportsSearch: true,
      supportsLocalSelection: false,
    };
  }

  async list(limit = 50): Promise<MusicTrack[]> {
    return this.tracks
      .filter(isRightsClearedGameTrack)
      .slice(0, Math.max(1, Math.min(100, limit)));
  }

  async search(query: string, limit = 20): Promise<MusicTrack[]> {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return this.list(limit);
    return this.tracks
      .filter(isRightsClearedGameTrack)
      .filter((track) =>
        `${track.title} ${track.artist}`.toLocaleLowerCase().includes(q),
      )
      .slice(0, Math.max(1, Math.min(50, limit)));
  }
}

/**
 * Local-file tracks are created by the host app after an explicit user file selection.
 * Object URLs are ephemeral and must never be persisted remotely.
 */
export function makeLocalFileTrack(args: {
  id: string;
  title: string;
  artist?: string;
  objectUrl: string;
  pickedBy?: 0 | 1;
}): MusicTrack {
  return {
    id: args.id,
    title: args.title.trim() || "Lokaler Track",
    artist: args.artist?.trim() || "Eigene Datei",
    source: "local-file",
    audioUrl: args.objectUrl,
    rights: "user-local",
    ...(args.pickedBy === undefined ? {} : { pickedBy: args.pickedBy }),
  };
}
