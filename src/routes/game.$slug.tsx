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
      <div className="relative min-h-[62svh] overflow-hidden">
        <GameArt art={game.art} className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 safe-x safe-top">
          <Link to="/" className="tap inline-flex min-h-11 items-center gap-2 px-1 text-sm text-foreground/80">
            <ArrowLeft className="size-4" /> <span className="font-display text-base tracking-[0.18em]">NOCTURNE</span>
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 safe-x pb-10">
          <p className="font-mono text-sm text-champagne">{game.number} · {game.interaction}</p>
          <h1 className="font-display mt-2 max-w-[9ch] text-[clamp(3.8rem,16vw,6.5rem)] leading-[0.82] text-balance animate-editorial-in">{game.title}</h1>
          <p className="mt-4 max-w-md text-lg text-foreground/75">{game.hook}</p>
        </div>
      </div>

      <main className="mx-auto max-w-xl safe-x safe-bottom relative">
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{game.description}</p>
        <p className="mt-4 border-l border-champagne/50 pl-4 font-display text-xl italic text-foreground/85">Ideal wenn · {game.idealMood}</p>

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
              <li key={cue} className="relative flex min-w-0 flex-col border-t border-line pt-4">
                <BeatMotif art={game.art} index={i} />
                <span className="mt-4 font-mono text-xs text-champagne">0{i + 1}</span>
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

        <details className="group mt-8 border-y border-line py-1">
          <summary className="tap flex min-h-14 cursor-pointer list-none items-center justify-between py-2">
            <span>
              <span className="eyebrow block">Euer Rahmen</span>
              <span className="mt-1 block text-sm text-muted-foreground">Optional · jederzeit änderbar</span>
            </span>
            <span className="font-display text-2xl transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="divide-y divide-line pb-2">
            {QUICK.map(([k, label]) => (
              <label key={k} className="flex min-h-14 items-center justify-between">
                <span>{label}</span>
                <Switch checked={settings[k]} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />
              </label>
            ))}
          </div>
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
function BeatMotif({ art, index }: { art: string; index: number }) {
  const stroke = index === 1 ? "var(--primary)" : index === 2 ? "var(--violet)" : "var(--champagne)";
  return (
    <svg viewBox="0 0 120 36" className="h-9 w-full overflow-visible" fill="none" aria-hidden>
      {art === "minimal" ? (
        <>
          <line x1="8" y1="10" x2={index === 0 ? 52 : 108} y2="10" stroke={stroke} opacity=".75" />
          <line x1="8" y1="28" x2={index === 2 ? 52 : 108} y2="28" stroke="var(--ivory)" opacity=".3" />
        </>
      ) : art === "echo" || art === "living" ? (
        <>
          <circle cx="18" cy="18" r={4 + index * 4} stroke={stroke} opacity=".9" />
          <circle cx="18" cy="18" r={12 + index * 3} stroke={stroke} opacity=".3" className={index === 1 ? "animate-ripple" : ""} style={{ transformOrigin: "18px 18px" }} />
          <line x1="38" y1="18" x2="112" y2="18" stroke="var(--line)" />
        </>
      ) : (
        <>
          <path d={index === 0 ? "M4 26 C28 4 52 32 76 10 S108 8 116 18" : index === 1 ? "M4 18 H34 L44 6 L54 30 L66 12 L78 18 H116" : "M4 28 C28 26 46 8 64 10 S92 26 116 8"} stroke={stroke} strokeWidth="1.2" opacity=".8" />
          <circle cx={index === 0 ? 76 : index === 1 ? 54 : 92} cy={index === 0 ? 10 : index === 1 ? 30 : 26} r="2.5" fill={stroke} />
        </>
      )}
    </svg>
  );
}
