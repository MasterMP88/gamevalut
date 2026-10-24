import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { GAMES_BY_SLUG, SLUG_ALIASES } from "@/lib/game/games";
import { haptic } from "@/lib/haptics";
import { GameArt } from "@/components/vault/GameArt";
import { Btn } from "@/components/vault/Btn";
import { Switch } from "@/components/ui/switch";
import { Player } from "@/components/player/Player";
import { useSessions } from "@/lib/game/store";

export const Route = createFileRoute("/game/$slug")({
  beforeLoad: ({ params }) => {
    const to = SLUG_ALIASES[params.slug];
    if (to) throw redirect({ to: "/game/$slug", params: { slug: to }, statusCode: 301 });
  },
  loader: ({ params }) => {
    const game = GAMES_BY_SLUG[params.slug];
    if (!game) throw notFound();
    return { slug: game.slug, title: game.title, hook: game.hook };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — NOCTURNE` : "NOCTURNE — Games for Two";
    const desc = loaderData?.hook ?? "Ein Spiel für zwei.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [{ property: "og:url", content: `https://nocturne-games-for-two.lovable.app/game/${loaderData.slug}` }] : []),
      ],
      links: loaderData ? [{ rel: "canonical", href: `https://nocturne-games-for-two.lovable.app/game/${loaderData.slug}` }] : [],
    };
  },
  component: GamePage,
});

const QUICK = [
  ["touch", "Berührung"],
  ["sensual", "Sinnliches"],
  ["drinks", "Drinks (optional)"],
  ["signals", "Private Signale"],
] as const;

function GamePage() {
  const { slug } = Route.useLoaderData();
  const game = GAMES_BY_SLUG[slug]!;
  const { players, setPlayers, settings, setSettings, sessions, start, end } = useSessions();
  const session = sessions[game.id];
  const [playing, setPlaying] = useState(false);

  if (playing && session) return <Player game={game} />;

  return (
    <div className="min-h-dvh">
      <div className="relative">
        <GameArt art={game.art} className="h-[46svh] min-h-72" />
        <div className="absolute inset-x-0 top-0 safe-x safe-top">
          <Link to="/" className="tap inline-flex min-h-11 items-center gap-2 rounded-full bg-background/70 px-4 text-sm backdrop-blur">
            <ArrowLeft className="size-4" /> <span className="font-display text-base tracking-[0.18em]">NOCTURNE</span>
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <main className="mx-auto -mt-10 max-w-xl safe-x safe-bottom relative">
        <p className="font-mono text-sm text-champagne">{game.number}</p>
        <h1 className="font-display mt-2 text-6xl leading-[0.9] animate-rise">{game.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{game.description}</p>

        <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-line py-5">
          {[["Dauer", game.duration], ["Stil", game.interaction], ["Mood", game.idealMood]].map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 text-sm">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-10" aria-labelledby="feel">
          <h2 id="feel" className="eyebrow">So fühlt es sich an</h2>
          <ol className="mt-4 grid grid-cols-3 gap-3">
            {game.beats.map(([cue, line], i) => (
              <li key={cue} className="relative flex flex-col border-t border-line pt-4">
                <span className="absolute -top-px left-0 h-px w-full origin-left bg-primary animate-beat" style={{ animationDelay: `${i * 0.8}s` }} />
                <span className="font-mono text-xs text-champagne">0{i + 1}</span>
                <span className="font-display mt-2 text-2xl leading-none">{cue}</span>
                <span className="mt-2 text-sm leading-snug text-muted-foreground">{line}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="eyebrow">Wer spielt heute</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <label key={i} className="rounded-2xl border border-line bg-surface px-4 py-3">
                <span className="eyebrow">{i === 0 ? "Du" : "Dein Gegenüber"}</span>
                <input
                  value={players[i]}
                  maxLength={24}
                  onChange={(e) => {
                    const p = [...players] as [string, string];
                    p[i] = e.target.value;
                    setPlayers(p);
                  }}
                  autoComplete="off"
                  placeholder={i === 0 ? "Name · sonst Ari" : "Name · sonst Nova"}
                  className="mt-1 block w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="eyebrow">Euer Rahmen</h2>
          <div className="mt-2 divide-y divide-line">
            {QUICK.map(([k, label]) => (
              <label key={k} className="flex min-h-14 items-center justify-between">
                <span>{label}</span>
                <Switch checked={settings[k]} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Alles jederzeit im Spiel änderbar. Skip ist immer da.</p>
        </section>

        <div className="sticky bottom-0 -mx-5 mt-10 bg-gradient-to-t from-background via-background to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
          {session && !session.finished ? (
            <div className="flex flex-col gap-2">
              <Btn size="lg" className="w-full" onClick={() => setPlaying(true)}>Weiterspielen · Szene {session.sceneNumber}</Btn>
              <Btn variant="ghost" onClick={() => { end(game.id); start(game.id); setPlaying(true); }}>Neu starten</Btn>
            </div>
          ) : (
            <Btn size="lg" className="w-full" onClick={() => { start(game.id); haptic(); setPlaying(true); }}>Die Nacht beginnt</Btn>
          )}
        </div>
      </main>
    </div>
  );
}