/**
 * Public Apple Music catalog sources for TIME//DROP.
 *
 * These are catalog metadata sources only. Do not use preview assets as game audio.
 * Full playback stays behind the host app's MusicKit authorization.
 */
export const APPLE_DECADE_PLAYLISTS = {
  1960: "pl.405e6f67264a4a44ba1b0c3a787c78b8",
  1970: "pl.1745c21b5f084936ad637b4cd5cbd99a",
  1980: "pl.af4d982795c6472ea48579eb147cd726",
  1990: "pl.0d70b7c9be8e4e0b95ebbf5578aaf7a2",
  2000: "pl.e50ccee7318043eaaf8e8e28a2a55114",
  2010: "pl.6b1b5dfda067443481265436811002f1",
} as const;

export type HistoricalAppleDecade = keyof typeof APPLE_DECADE_PLAYLISTS;

export interface AppleCatalogRequestDescriptor {
  decade: number;
  path: string;
  params: Record<string, string | number>;
  source: "playlist" | "charts";
}

export function appleTimeDropCatalogRequests(input: {
  storefront?: string;
  historicalLimit?: number;
  currentLimit?: number;
} = {}): AppleCatalogRequestDescriptor[] {
  const storefront = (input.storefront ?? "de").trim().toLocaleLowerCase();
  const historicalLimit = Math.max(1, Math.min(100, Math.trunc(input.historicalLimit ?? 50)));
  const currentLimit = Math.max(1, Math.min(200, Math.trunc(input.currentLimit ?? 100)));

  const historical = Object.entries(APPLE_DECADE_PLAYLISTS).map(([decade, playlistId]) => ({
    decade: Number(decade),
    path: `/v1/catalog/${storefront}/playlists/${playlistId}/tracks`,
    params: { limit: historicalLimit },
    source: "playlist" as const,
  }));

  return [
    ...historical,
    {
      decade: 2020,
      path: `/v1/catalog/${storefront}/charts`,
      params: { types: "songs", chart: "most-played", limit: currentLimit },
      source: "charts" as const,
    },
  ];
}

/** Accept only rows whose actual release year belongs to the intended decade. */
export function belongsToRequestedDecade(releaseYear: number, decade: number): boolean {
  return Number.isInteger(releaseYear) && releaseYear >= decade && releaseYear <= decade + 9;
}
