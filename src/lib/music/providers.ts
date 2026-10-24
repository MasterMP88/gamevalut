export type MusicCapability = "search" | "authorize" | "playback" | "createPlaylist";

export interface MusicProviderTrack {
  id: string;
  title: string;
  artist?: string;
  url?: string;
  artworkUrl?: string;
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  trackIds: string[];
}

export interface MusicProvider {
  id: string;
  label: string;
  available(): boolean;
  capabilities(): ReadonlySet<MusicCapability>;
  authorize?(): Promise<boolean>;
  search?(query: string): Promise<MusicProviderTrack[]>;
  play?(trackId: string): Promise<void>;
  createPlaylist?(input: CreatePlaylistInput): Promise<{ id: string; url?: string }>;
}

/**
 * Manual mode is the NOCTURNE baseline: it needs no provider and never invents
 * song metadata. It deliberately exposes no search/playback/cloud capabilities.
 */
export const manualMusicProvider: MusicProvider = {
  id: "manual",
  label: "Manuelle Songwahl",
  available: () => true,
  capabilities: () => new Set<MusicCapability>(),
};

export interface AppleMusicBridge {
  available(): boolean;
  authorize(): Promise<boolean>;
  search(query: string): Promise<MusicProviderTrack[]>;
  play(trackId: string): Promise<void>;
  createPlaylist(input: CreatePlaylistInput): Promise<{ id: string; url?: string }>;
}

/**
 * MusicKit-ready adapter. The bridge is injected only by a real MusicKit setup.
 * With no bridge the provider is absent, so the UI can never show a fake
 * “Apple Music verbinden” action.
 */
export function appleMusicProvider(bridge?: AppleMusicBridge): MusicProvider | null {
  if (!bridge || !bridge.available()) return null;
  return {
    id: "apple-music",
    label: "Apple Music",
    available: () => bridge.available(),
    capabilities: () => new Set<MusicCapability>(["authorize", "search", "playback", "createPlaylist"]),
    authorize: () => bridge.authorize(),
    search: (query) => bridge.search(query),
    play: (trackId) => bridge.play(trackId),
    createPlaylist: (input) => bridge.createPlaylist(input),
  };
}

export function usableMusicProviders(appleBridge?: AppleMusicBridge): MusicProvider[] {
  const apple = appleMusicProvider(appleBridge);
  return apple ? [manualMusicProvider, apple] : [manualMusicProvider];
}
