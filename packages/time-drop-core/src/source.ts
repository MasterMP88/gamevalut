import type { TimeDropTrack } from "./types.js";
import { normalizeTrack } from "./engine.js";

export interface TimeDropTrackQuery {
  limit: number;
  decades?: number[];
  excludeIds?: string[];
}

export interface TimeDropTrackSource {
  id: string;
  list(query: TimeDropTrackQuery): Promise<TimeDropTrack[]>;
}

export interface AppleCatalogSongLike {
  id: string;
  attributes?: {
    name?: string;
    artistName?: string;
    releaseDate?: string;
    url?: string;
    artwork?: { url?: string };
    playParams?: { id?: string; kind?: string };
  };
}

/**
 * Maps Apple public-catalog metadata into the provider-neutral TIME//DROP track.
 * Intentionally ignores preview URLs: previews are not game audio.
 */
export function mapAppleCatalogSong(song: AppleCatalogSongLike): TimeDropTrack | null {
  const a = song.attributes;
  const yearText = a?.releaseDate?.slice(0, 4);
  const releaseYear = yearText ? Number(yearText) : NaN;
  const title = a?.name?.trim();
  const artist = a?.artistName?.trim();
  if (!song.id || !title || !artist || !Number.isInteger(releaseYear)) return null;
  if (releaseYear < 1900 || releaseYear > 2100) return null;

  const artworkUrl = a?.artwork?.url
    ?.replace("{w}", "600")
    .replace("{h}", "600");
  const exactUrl =
    typeof a?.url === "string" && a.url.startsWith("https://music.apple.com/")
      ? a.url
      : undefined;
  const playId = a?.playParams?.kind === "song" ? a.playParams.id : undefined;

  return normalizeTrack({
    id: `apple:${song.id}`,
    title,
    artist,
    releaseYear,
    providerId: song.id,
    playbackRef: playId ? `apple-music:${playId}` : `apple-music:${song.id}`,
    ...(artworkUrl ? { artworkUrl } : {}),
    ...(exactUrl ? { externalUrl: exactUrl } : {}),
  });
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function ranked<T extends { id: string }>(rows: readonly T[], seed: number): T[] {
  return [...rows].sort((a, b) => {
    const ah = hash(`${seed}:${a.id}`);
    const bh = hash(`${seed}:${b.id}`);
    return ah - bh || a.id.localeCompare(b.id);
  });
}

/**
 * Produces a deterministic, decade-balanced deck from provider metadata.
 * It round-robins decades before filling remaining slots, preventing a current-chart
 * source from dominating the entire game when older candidates are available.
 */
export function buildBalancedTimeDropDeck(input: {
  candidates: readonly TimeDropTrack[];
  size: number;
  seed?: number;
  decades?: number[];
  excludeIds?: readonly string[];
}): TimeDropTrack[] {
  const size = Math.max(0, Math.trunc(input.size));
  if (size === 0) return [];

  const exclude = new Set(input.excludeIds ?? []);
  const unique = new Map<string, TimeDropTrack>();
  for (const raw of input.candidates) {
    try {
      const track = normalizeTrack(raw);
      if (!exclude.has(track.id) && !unique.has(track.id)) unique.set(track.id, track);
    } catch {
      // Invalid provider rows are dropped instead of poisoning a game.
    }
  }

  const seed = input.seed ?? 1;
  const desired = input.decades?.length
    ? [...new Set(input.decades.map((d) => Math.floor(d / 10) * 10))].sort((a, b) => a - b)
    : [...new Set([...unique.values()].map((t) => decadeOf(t.releaseYear)))].sort((a, b) => a - b);

  const buckets = new Map<number, TimeDropTrack[]>();
  for (const decade of desired) buckets.set(decade, []);
  const overflow: TimeDropTrack[] = [];

  for (const track of unique.values()) {
    const bucket = buckets.get(decadeOf(track.releaseYear));
    if (bucket) bucket.push(track);
    else overflow.push(track);
  }
  for (const [decade, rows] of buckets) buckets.set(decade, ranked(rows, seed + decade));

  const out: TimeDropTrack[] = [];
  let cursor = 0;
  while (out.length < size) {
    let added = false;
    for (const decade of desired) {
      const rows = buckets.get(decade)!;
      const candidate = rows[cursor];
      if (candidate && out.length < size) {
        out.push(candidate);
        added = true;
      }
    }
    if (!added) break;
    cursor += 1;
  }

  if (out.length < size) {
    const used = new Set(out.map((t) => t.id));
    const remaining = ranked(
      [...unique.values(), ...overflow].filter((t) => !used.has(t.id)),
      seed ^ 0x9e3779b9,
    );
    out.push(...remaining.slice(0, size - out.length));
  }

  return out.slice(0, size);
}

export class StaticTimeDropSource implements TimeDropTrackSource {
  readonly id: string;
  constructor(id: string, private readonly candidates: readonly TimeDropTrack[], private readonly seed = 1) {
    this.id = id;
  }

  async list(query: TimeDropTrackQuery): Promise<TimeDropTrack[]> {
    return buildBalancedTimeDropDeck({
      candidates: this.candidates,
      size: query.limit,
      seed: this.seed,
      ...(query.decades ? { decades: query.decades } : {}),
      ...(query.excludeIds ? { excludeIds: query.excludeIds } : {}),
    });
  }
}
