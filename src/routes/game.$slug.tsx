import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { MusicSetup } from "@/components/player/MusicRound";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES_BY_SLUG, SLUG_ALIASES } from "@/lib/game/games";
import { haptic } from "@/lib/haptics";
import { GameArt } from "@/components/vault/GameArt";
import { Btn } from "@/components/vault/Btn";
import { Switch } from "@/components/ui/switch";
import { Player } from "@/components/player/Player";
import { AgeGate, useAgeConfirmed } from "@/components/account/AgeGate";
import { useSessions } from "@/lib/game/store";
import { useAuth } from "@/lib/auth";
import { fetchOpenSession } from "@/lib/resume";
import { restore } from "@/lib/game/persist";
import { GameStage } from "@/components/stage/GameStage";
import { PREVIEWS } from "@/lib/game/previews";
import { SITE, gameDescription, relatedGames } from "@/lib/seo";
import type { GameConfig } from "@/lib/game/games";

export const Route = createFileRoute("/game/$slug")({
  validateSearch: (s: Record<string, unknown>): { play?: 1 } => (s["play"] === 1 || s["play"] === "1" ? { play: 1 } : {}),
  beforeLoad: ({ params }) => {
    const to = SLUG_ALIASES[params.slug];
    if (to) throw redirect({ to: "/game/$slug", params: { slug: to }, statusCode: 301 });
  },
  loader: ({ params }) => {
    const game = GAMES_BY_SLUG[params.slug];
    if (!game) throw notFound();
    return { slug: game.slug, title: game.title, desc: gameDescription(game) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Spiel nicht gefunden — NOCTURNE" }, { name: "robots", content: "noindex" }] };
    const url = `${SITE}/game/${loaderData.slug}`;
    const title = `${loaderData.title} — Spiel für Paare | NOCTURNE`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.desc },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "NOCTURNE", item: `${SITE}/` },
            { "@type": "ListItem", position: 2, name: "Spiele", item: `${SITE}/#sammlung` },
            { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
          ],
        }),
      }],
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
const INTENSITY = ["", "Sanft", "Verspielt", "Mutig"];

function GamePage() {
  const { slug } = Route.useLoaderData();
  const { play } = Route.useSearch();
  const game = GAMES_BY_SLUG[slug]!;
  const { players, setPlayers, settings, setSettings, sessions, start, end, hydrate } = useSessions();
  const { user } = useAuth();
  const session = sessions[game.id];
  const [playing, setPlaying] = useState(!!play);
  const [intro, setIntro] = useState(false);
  const [gate, setGate] = useState(false);
  const [age, confirmAge] = useAgeConfirmed();
  const [remote, setRemote] = useState<{ id: string; scene: number; load: () => void } | null>(null);

  // Signed in, nothing in memory: offer the saved open session for this game (other device / reload).
  useEffect(() => {
    if (!user || session) { setRemote(null); return; }
    let live = true;
    void fetchOpenSession(user.id, game.id).then((row) => {
      if (!live || !row) return;
      setRemote({
        id: row.id,
        scene: row.scene_number,
        load: () => { const r = restore(row); if (r.ok) { hydrate(game.id, r.state, row.id, row.revision); setPlaying(true); } },
      });
    });
    return () => { live = false; };
  }, [user, session, game.id, hydrate]);

  const begin = () => { haptic(); if (age) setIntro(true); else setGate(true); };

  if (gate) return <AgeGate onConfirm={() => { confirmAge(); setGate(false); setIntro(true); }} onBack={() => setGate(false)} />;
  if (intro) return <Intro game={game} onStart={(duration) => { start(game.id, duration); haptic(); setIntro(false); setPlaying(true); }} onBack={() => setIntro(false)} />;
  if (playing && session) return <Player game={game} />;

  const p = PREVIEWS[game.id];
  const related = relatedGames(game);
  return (
    <div className="min-h-dvh">
      <div className="safe-x safe-top">
        <Link to="/" className="tap mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-background/70 px-4 text-sm backdrop-blur">
          <ArrowLeft className="size-4" /> <span className="font-display text-base tracking-[0.18em]">NOCTURNE</span>
        </Link>
      </div>
      <main className="mx-auto mt-4 max-w-xl safe-x safe-bottom relative">
        <nav aria-label="Brotkrumen" className="font-mono text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">NOCTURNE</Link> <span aria-hidden>/</span> Spiel {game.number}
        </nav>
        <h1 className="font-display mt-2 text-6xl leading-[0.9] animate-rise">{game.title}</h1>
        <p className="mt-3 font-display text-2xl italic text-primary">{game.hook}</p>
        <p className="mt-4 text-lg leading-snug">{p.mechanic}</p>
        <div className="-mx-5 mt-6 border-y border-line px-5 py-8 sm:mx-0 sm:border sm:px-8">
          <GameStage game={game} bare />
          <p className="mt-4 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground">TIPPEN FÜR DEN NÄCHSTEN SCHRITT</p>
        </div>
        <p className="mt-4 font-display text-xl italic text-muted-foreground">{p.idealWhen}</p>

        <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-line py-5">
          {[["Dauer", game.duration], ["Intensität", INTENSITY[game.intensity]!], ["Stil", game.interaction]].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 text-sm">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-10" aria-labelledby="how-h">
          <h2 id="how-h" className="font-display text-3xl">So funktioniert {game.title}</h2>
          <p className="mt-3 text-muted-foreground">{game.description}</p>
          <ol className="mt-5 space-y-4">
            {game.beats.map(([cue, line], i) => (
              <li key={cue} className="flex gap-4">
                <span className="font-mono text-sm text-champagne">0{i + 1}</span>
                <div><h3 className="font-display text-xl">{cue}</h3><p className="text-sm text-muted-foreground">{line}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10" aria-labelledby="diff-h">
          <h2 id="diff-h" className="font-display text-3xl">Was dieses Spiel anders macht</h2>
          <ul className="mt-4 space-y-2">
            {game.why.map((w) => <li key={w} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-champagne" aria-hidden />{w}</li>)}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">Ideal: {game.idealMood}. Jede körperliche Aufgabe ist optional, Skip ist immer sichtbar und kostet nichts.</p>
        </section>

        <section className="mt-10" aria-labelledby="who-h">
          <h2 id="who-h" className="eyebrow">Wer spielt heute</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <label key={i} className="rounded-2xl border border-line bg-surface px-4 py-3">
                <span className="eyebrow">{i === 0 ? "Du" : "Dein Gegenüber"}</span>
                <input
                  value={players[i]}
                  maxLength={24}
                  onChange={(e) => { const pl = [...players] as [string, string]; pl[i] = e.target.value; setPlayers(pl); }}
                  autoComplete="off"
                  placeholder={i === 0 ? "Name · sonst Ari" : "Name · sonst Nova"}
                  className="mt-1 block w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </label>
            ))}
          </div>
        </section>

        <details className="group mt-6 border-b border-line">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm text-muted-foreground">
            <span>Euer Rahmen · Berührung, Sinnliches, Drinks</span>
            <span className="transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-2 divide-y divide-line">
            {QUICK.map(([k, label]) => (
              <label key={k} className="flex min-h-14 items-center justify-between">
                <span>{label}</span>
                <Switch checked={settings[k]} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />
              </label>
            ))}
          </div>
          <p className="mt-2 pb-4 text-sm text-muted-foreground">Alles jederzeit im Spiel änderbar. Skip ist immer da.</p>
        </details>

        <section className="mt-12" aria-labelledby="rel-h">
          <h2 id="rel-h" className="eyebrow">Passt auch dazu</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {related.map((g) => (
              <li key={g.id}>
                <Link to="/game/$slug" params={{ slug: g.slug }} className="tap flex min-h-16 items-center justify-between gap-3">
                  <span className="min-w-0"><span className="block truncate font-display text-2xl">{g.title}</span><span className="block truncate text-sm text-muted-foreground">{g.hook}</span></span>
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {game.id === "pass-the-aux" && <MusicSetup />}

        <section className="mt-8 border-y border-line py-5">
          <h2 className="font-display text-2xl">Ein Handy oder zwei?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ein Handy liegt zwischen euch. Mit zwei Handys wählt ihr gleichzeitig und verdeckt; euer Host lädt per QR-Code ein.</p>
          <Link to="/together" search={{game:game.id}} className="tap mt-3 inline-flex min-h-12 items-center text-primary">Mit zwei Handys spielen →</Link>
        </section>
        <div className="sticky bottom-0 -mx-5 mt-10 bg-gradient-to-t from-background via-background to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
          {session && !session.finished ? (
            <div className="flex flex-col gap-2">
              <Btn size="lg" className="w-full" onClick={() => setPlaying(true)}>Weiterspielen · Szene {session.sceneNumber}</Btn>
              <Btn variant="ghost" onClick={() => { end(game.id); start(game.id); setPlaying(true); }}>Neu starten</Btn>
            </div>
          ) : remote ? (
            <div className="flex flex-col gap-2">
              <Btn size="lg" className="w-full" onClick={remote.load}>Gesicherte Nacht fortsetzen · Szene {remote.scene}</Btn>
              <Btn variant="ghost" onClick={() => { end(game.id); setRemote(null); begin(); }}>Neu beginnen</Btn>
            </div>
          ) : (
            <Btn size="lg" className="w-full" onClick={begin}>{game.ai ? "Director starten →" : "Die Nacht beginnt →"}</Btn>
          )}
        </div>
      </main>
    </div>
  );
}

/** "So funktioniert diese Nacht" — three beats, one at a time, then a single clear start. */
function Intro({ game, onStart, onBack }: { game: GameConfig; onStart: (duration: 15 | 30 | 60 | null) => void; onBack: () => void }) {
  const [duration, setDuration] = useState<15 | 30 | 60 | null>(30);
  const [i, setI] = useState(0);
  const last = i === game.beats.length - 1;
  const [cue, line] = game.beats[i]!;
  return (
    <div className="flex min-h-dvh flex-col safe-x safe-top safe-bottom">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="tap inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Zurück</button>
        <button type="button" onClick={() => onStart(duration)} className="tap min-h-11 px-2 text-sm text-muted-foreground">Überspringen</button>
      </div>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-10">
        <p className="eyebrow">So funktioniert diese Nacht · {game.title}</p>
        <fieldset className="mt-5"><legend className="text-sm text-muted-foreground">Wie viel Zeit habt ihr?</legend>
          <div className="mt-2 flex flex-wrap gap-2">{([15, 30, 60, null] as const).map((n) => <button key={n ?? "open"} type="button" aria-pressed={duration === n} onClick={() => setDuration(n)} className={cn("tap min-h-11 rounded-full border px-4", duration === n ? "border-primary text-primary" : "border-line")}>{n ? `${n} min` : "Open End"}</button>)}</div>
          <p className="mt-2 text-xs text-muted-foreground">Ihr beendet die aktuelle Szene in Ruhe. Danach folgt euer Abschluss; verlängern geht immer.</p>
        </fieldset>
        <ol className="mt-4 flex gap-1.5" aria-hidden>
          {game.beats.map((_, k) => <li key={k} className={cn("h-0.5 flex-1 transition-colors duration-500", k <= i ? "bg-foreground" : "bg-line")} />)}
        </ol>
        <div key={i} className="mt-auto mb-auto animate-rise" aria-live="polite">
          <p className="font-mono text-sm text-champagne">0{i + 1} / 0{game.beats.length}</p>
          <h2 className="font-display mt-3 text-[clamp(3rem,15vw,5rem)] leading-[0.9]">{cue}</h2>
          <p className="mt-4 text-xl leading-snug text-muted-foreground">{line}</p>
        </div>
        <div className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Btn size="lg" className="w-full" onClick={() => { haptic(); if (last) onStart(duration); else setI(i + 1); }}>
            {last ? "Los geht's →" : "Weiter →"}
          </Btn>
        </div>
      </main>
    </div>
  );
}
