import { GAMES, type GameConfig } from "./game/games";

export const SITE = "https://nocturne-games-for-two.lovable.app";

/** Public, indexable paths only. Account, auth and session routes are never listed. */
export function publicPaths(): string[] {
  return ["/", "/gang", ...GAMES.map((g) => `/game/${g.slug}`)];
}

export function sitemapXml(): string {
  const urls = publicPaths().map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function gameDescription(g: GameConfig): string {
  const base = `${g.title}: ${g.hook} Ein interaktives Date-Night-Spiel für Paare auf einem Handy, ${g.duration}.`;
  return base.length > 158 ? `${base.slice(0, 155)}…` : base;
}

/** 3 related games: most shared moods first, never itself. */
export function relatedGames(g: GameConfig): GameConfig[] {
  return GAMES.filter((x) => x.id !== g.id)
    .map((x) => ({ x, score: x.moods.filter((m) => g.moods.includes(m)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.x);
}
