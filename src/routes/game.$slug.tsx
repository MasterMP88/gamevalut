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
        <p className="mt-4 flex items-center gap-3 font-display text-xl italic text-foreground/80">
          <span className="h-px w-8 bg-champagne/60" aria-hidden />
          Ideal wenn · {game.idealMood}
        </p>

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
              <li key={cue} className="relative flex min-h-44 flex-col border-t border-line pt-4">
                <span className="absolute -top-px left-0 h-px w-full origin-left bg-primary animate-beat" style={{ animationDelay: `${i * 0.8}s` }} />
                <BeatGlyph art={game.art} index={i} />
                <span className="mt-3 font-mono text-xs text-champagne">0{i + 1}</span>
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
              <label key={i} className="border-y border-line px-1 py-3">
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

        <details className="group mt-8 border-y border-line py-4">
          <summary className="tap flex min-h-11 cursor-pointer list-none items-center justify-between">
            <span>
              <span className="eyebrow block">Euer Rahmen</span>
              <span className="mt-1 block text-sm text-muted-foreground">Berührung, Sinnliches, Drinks & private Signale</span>
            </span>
            <span className="font-display text-2xl text-champagne transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <div className="mt-3 divide-y divide-line border-t border-line">
            {QUICK.map(([k, label]) => (
              <label key={k} className="flex min-h-14 items-center justify-between">
                <span>{label}</span>
                <Switch checked={settings[k]} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Alles jederzeit im Spiel änderbar. Skip ist immer da.</p>
        </details>

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

function BeatGlyph({ art, index }: { art: string; index: number }) {
  const shift = index * 9;
  return (
    <svg viewBox="0 0 88 38" className="h-10 w-24 text-champagne/70" aria-hidden>
      {art === "minimal" ? (
        <>
          <line x1={20 + index * 10} y1="2" x2={20 + index * 10} y2="36" stroke="currentColor" />
          <line x1={58 - index * 8} y1="2" x2={58 - index * 8} y2="36" stroke="currentColor" strokeWidth={index === 1 ? 3 : 1} />
        </>
      ) : art === "echo" || art === "living" ? (
        <>
          <circle cx={30 + shift} cy="19" r="5" fill="none" stroke="currentColor" />
          <circle cx={30 + shift} cy="19" r="12" fill="none" stroke="currentColor" opacity=".45" />
          <path d={`M${42 + shift} 19 H84`} stroke="currentColor" strokeDasharray="2 4" opacity=".6" />
        </>
      ) : art === "battle" ? (
        <>
          <path d="M2 14 H28 L36 5 L44 20" fill="none" stroke="currentColor" />
          <path d="M86 25 H60 L52 34 L44 20" fill="none" stroke="currentColor" opacity=".7" />
        </>
      ) : (
        <>
          <path d={`M2 ${30 - index * 5} C24 ${7 + shift}, 50 ${32 - shift}, 86 ${8 + index * 4}`} fill="none" stroke="currentColor" />
          <circle cx={35 + shift} cy={18 - index * 3} r="2.5" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
