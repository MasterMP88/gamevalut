import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { GAMES, GAMES_BY_ID, NIGHT_PICKS, type GameConfig, type Mood } from "@/lib/game/games";
import { GameArt } from "@/components/vault/GameArt";
import { Btn, btn } from "@/components/vault/Btn";
import { PrivacyDialog } from "@/components/vault/PrivacyDialog";
import { Mark, Wordmark } from "@/components/brand/Mark";
import { Reveal } from "@/components/brand/Reveal";
import { useSessions } from "@/lib/game/store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const URL = "https://nocturne-games-for-two.lovable.app/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOCTURNE — Games for Two · Pick your night." },
     { name: "description", content: "NOCTURNE ist eine private, mobile Date-Night-Collection mit acht interaktiven Spielen für zwei Erwachsene — von leicht und lustig bis tief, frech und adaptiv. NIGHT//ECHO — Director ist das Flagship mit Session-Memory und generativer Regie. Kein Login; intime Freitexte bleiben nur in der laufenden Browser-Session." },
     { property: "og:title", content: "NOCTURNE — Games for Two" },
     { property: "og:description", content: "NOCTURNE ist eine private, mobile Date-Night-Collection mit acht interaktiven Spielen für zwei Erwachsene — von leicht und lustig bis tief, frech und adaptiv. NIGHT//ECHO — Director ist das Flagship mit Session-Memory und generativer Regie. Kein Login; intime Freitexte bleiben nur in der laufenden Browser-Session." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Home,
});

const MOODS: Mood[] = ["Lustig", "Tief", "Frech", "Gemeinsam", "Mit Memory", "Mit AI"];
const FEATURED = GAMES_BY_ID["ai-director"];
const INTENSITY = ["", "Sanft", "Verspielt", "Mutig"];
const COLLECTION = GAMES.filter((g) => g.id !== FEATURED.id).concat(FEATURED);

function Home() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [night, setNight] = useState<number | null>(null);
  const pick = night === null ? null : NIGHT_PICKS[night]!;
  const { sessions } = useSessions();
  const list = mood ? COLLECTION.filter((g) => g.moods.includes(mood)) : COLLECTION;
  const live = GAMES.filter((g) => sessions[g.id] && !sessions[g.id]!.finished);

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* HERO — first frame */}
      <section className="relative veil grain safe-x safe-top flex min-h-[92svh] flex-col">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between pt-4">
          <span className="flex items-center gap-2.5 text-foreground">
            <Mark className="size-8" />
            <span className="eyebrow">Games for Two</span>
          </span>
          <PrivacyDialog>
            <button className="tap eyebrow inline-flex min-h-11 items-center gap-2 hover:text-foreground">
              <ShieldCheck className="size-4" /> Privat
            </button>
          </PrivacyDialog>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end pb-12 sm:pb-20">
          <Mark draw className="size-20 text-champagne/80 sm:size-28" />
          <h1 className="mt-8 animate-rise">
            <Wordmark className="block text-[clamp(3.1rem,15.5vw,10.5rem)] leading-[0.85] tracking-[0.06em]" />
          </h1>
          <div className="mt-6 flex items-baseline gap-4 animate-rise" style={{ animationDelay: "140ms" }}>
            <span className="h-px w-10 shrink-0 translate-y-[-0.35em] bg-champagne/70" />
            <p className="font-display text-3xl italic text-foreground/90 sm:text-4xl">Ein Abend. Zwei Menschen. Kein Skript.</p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 animate-rise" style={{ animationDelay: "260ms" }}>
            <Link to="/game/$slug" params={{ slug: FEATURED.slug }} onClick={() => haptic()} className={btn({ size: "lg" })}>
              Pick your night <ArrowRight className="size-5" />
            </Link>
            <a href="#sammlung" className="tap eyebrow inline-flex min-h-11 items-center hover:text-foreground">8 Spiele ansehen</a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl safe-x safe-bottom">
        {live.length > 0 && (
          <section className="mt-12">
            <p className="eyebrow">Noch offen</p>
            <div className="mt-4 flex flex-col divide-y divide-line border-y border-line">
              {live.map((g) => (
                <Link key={g.id} to="/game/$slug" params={{ slug: g.slug }} className="tap flex min-h-16 items-center justify-between gap-4">
                  <span className="min-w-0 truncate">
                    <span className="mr-3 font-mono text-sm text-champagne">{g.number}</span>
                    <span className="font-display text-2xl">{g.title}</span>
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">Szene {sessions[g.id]!.sceneNumber} <ArrowRight className="ml-1 inline size-4" /></span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* WHAT KIND OF NIGHT — one tap, one recommendation */}
        <Reveal className="mt-14">
          <p className="eyebrow">Was für eine Nacht?</p>
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label="Was für eine Nacht?">
            {NIGHT_PICKS.map((n, i) => (
              <Btn key={n.label} variant="chip" size="sm" data-on={night === i} aria-pressed={night === i} onClick={() => { haptic(4); setNight(night === i ? null : i); }} className="shrink-0">
                {n.label}
              </Btn>
            ))}
          </div>
          <div aria-live="polite" className="min-h-6">
            {pick && (
              <div key={pick.label} className="mt-6 animate-rise">
                <p className="font-display text-xl italic text-muted-foreground">{pick.why}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {pick.ids.map((id) => {
                    const g = GAMES_BY_ID[id];
                    return (
                      <Link key={id} to="/game/$slug" params={{ slug: g.slug }} className="tap group relative block overflow-hidden rounded-2xl border border-line">
                        <GameArt art={g.art} className="h-32" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                        <span className="absolute inset-x-3 bottom-3">
                          <span className="block font-mono text-xs text-champagne">{g.number}</span>
                          <span className="block font-display text-2xl leading-none">{g.title}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* FEATURED */}
        <Reveal className="mt-16">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Heute Nacht · Flagship</p>
            <span className="font-mono text-xs text-champagne">AI · live</span>
          </div>
          <Link to="/game/$slug" params={{ slug: FEATURED.slug }} className="group relative mt-4 block overflow-hidden rounded-[2rem] border border-line">
            <GameArt art={FEATURED.art} className="h-[30rem] sm:h-[34rem]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="font-mono text-sm text-champagne">{FEATURED.number}</p>
              <h2 className="font-display mt-2 text-[clamp(2.6rem,11vw,5.5rem)] leading-[0.9]">
                NIGHT//ECHO
                <span className="block italic text-primary">Director</span>
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">{FEATURED.hook}</p>
              <ol className="mt-6 grid max-w-md grid-cols-3 gap-3 border-t border-line pt-4">
                {FEATURED.beats.map(([cue], i) => (
                  <li key={cue} className="min-w-0">
                    <span className="block font-mono text-xs text-champagne">0{i + 1}</span>
                    <span className="block truncate font-display text-lg">{cue}</span>
                  </li>
                ))}
              </ol>
              <span className={btn({ size: "lg", className: "mt-7" })}>
                Director starten <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Reveal>

        {/* COLLECTION */}
        <section id="sammlung" className="mt-24 scroll-mt-6">
          <Reveal>
            <p className="eyebrow">Die Sammlung</p>
            <h2 className="font-display mt-2 text-[clamp(3rem,13vw,6rem)] leading-[0.9]">
              Pick your <em className="text-primary">night.</em>
            </h2>
          </Reveal>

          <div className="-mx-5 mt-8 flex snap-x gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none]" role="group" aria-label="Nach Stimmung filtern">
            <Btn variant="chip" size="sm" data-on={mood === null} aria-pressed={mood === null} onClick={() => { haptic(4); setMood(null); }} className="shrink-0 snap-start">
              Alle
            </Btn>
            {MOODS.map((m) => (
              <Btn key={m} variant="chip" size="sm" data-on={mood === m} aria-pressed={mood === m} onClick={() => { haptic(4); setMood(mood === m ? null : m); }} className="shrink-0 snap-start">
                {m}
              </Btn>
            ))}
          </div>
          <p className="mt-3 font-mono text-xs text-muted-foreground" aria-live="polite">{String(list.length).padStart(2, "0")} / 08</p>

          <ol className="mt-8 flex flex-col gap-14 sm:gap-20">
            {list.map((g, i) => (
              <li key={g.id}>
                <Reveal delay={40}>
                  <CollectionItem g={g} layout={LAYOUTS[GAMES.indexOf(g) % LAYOUTS.length]!} flip={i % 2 === 1} />
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* HOW */}
        <Reveal className="mt-28 border-t border-line pt-12">
          <p className="eyebrow">So geht's</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {[
              ["Ein Handy", "Zwischen euch. Oben steht, wer dran ist."],
              ["Eine Szene", "Spielen, lachen – oder Skip. Skip kostet nie etwas."],
              ["Euer Rahmen", "Berührung, Sinnliches, Drinks: jederzeit an oder aus."],
            ].map(([t, d], i) => (
              <div key={t} className="flex gap-4">
                <span className="font-mono text-sm text-champagne">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-3xl">{t}</h3>
                  <p className="mt-1 text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <footer className="mt-24 flex flex-col gap-6 border-t border-line py-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 text-foreground">
            <Mark className="size-7" />
            <Wordmark className="text-xl" />
          </div>
          <p className="max-w-md">Für einvernehmliche Erwachsene. Alles optional, alles gegenseitig. Kein Login. Neu laden löscht die Nacht.</p>
          <PrivacyDialog>
            <button className="tap min-h-11 self-start underline underline-offset-4 hover:text-foreground">Privatsphäre &amp; Director</button>
          </PrivacyDialog>
        </footer>
      </div>
    </div>
  );
}

/** Each card gets its own silhouette: full-bleed, split, strip or tall poster. */
const LAYOUTS = ["bleed", "split", "strip", "poster", "split", "strip", "bleed", "poster"] as const;

function Meta({ g }: { g: GameConfig }) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-3">
        <span>{g.duration}</span>
        <span className="flex items-center gap-1" aria-label={`Intensität ${INTENSITY[g.intensity]}`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={cn("inline-block size-1.5 rounded-full", n <= g.intensity ? "bg-primary" : "bg-surface-2")} />
          ))}
        </span>
      </span>
      <ArrowUpRight className="size-5 text-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </div>
  );
}

function CollectionItem({ g, layout, flip }: { g: GameConfig; layout: (typeof LAYOUTS)[number]; flip: boolean }) {
  if (layout === "bleed")
    return (
      <Link to="/game/$slug" params={{ slug: g.slug }} className="tap group relative -mx-5 block overflow-hidden sm:mx-0 sm:rounded-[2rem]">
        <GameArt art={g.art} className="h-[26rem] sm:h-[32rem]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-x-5 bottom-5 sm:inset-x-10 sm:bottom-10">
          <p className="eyebrow">{g.number} · {g.interaction}</p>
          <h3 className="font-display mt-2 text-[clamp(2.8rem,13vw,5rem)] leading-[0.9]">{g.title}</h3>
          <p className="mt-3 max-w-md text-lg text-muted-foreground">{g.hook}</p>
          <Meta g={g} />
        </div>
      </Link>
    );
  if (layout === "strip")
    return (
      <Link to="/game/$slug" params={{ slug: g.slug }} className="tap group grid grid-cols-[7.5rem_1fr] items-stretch gap-4 border-y border-line py-4 sm:grid-cols-[14rem_1fr]">
        <div className="relative overflow-hidden rounded-xl">
          <GameArt art={g.art} className="h-full min-h-36" />
        </div>
        <div className="flex min-w-0 flex-col">
          <p className="font-mono text-sm text-champagne">{g.number}</p>
          <h3 className="font-display mt-1 text-[2.1rem] leading-[0.95] sm:text-5xl">{g.title}</h3>
          <p className="mt-2 text-muted-foreground">{g.hook}</p>
          <div className="mt-auto"><Meta g={g} /></div>
        </div>
      </Link>
    );
  if (layout === "poster")
    return (
      <Link to="/game/$slug" params={{ slug: g.slug }} className="tap group mx-auto block max-w-sm">
        <div className="relative overflow-hidden rounded-t-full border border-line">
          <GameArt art={g.art} className="h-[24rem]" />
          <span className="absolute inset-x-0 bottom-4 text-center font-display text-8xl leading-none text-foreground/85">{g.number}</span>
        </div>
        <h3 className="font-display mt-5 text-center text-[2.6rem] leading-[0.95]">{g.title}</h3>
        <p className="mt-2 text-center text-lg text-muted-foreground">{g.hook}</p>
        <Meta g={g} />
      </Link>
    );
  return (
    <Link to="/game/$slug" params={{ slug: g.slug }} className="tap group grid items-end gap-5 sm:grid-cols-12 sm:gap-10">
      <div className={cn("relative overflow-hidden rounded-[1.6rem] border border-line sm:col-span-7", flip && "sm:order-2")}>
        <GameArt art={g.art} className="h-64 sm:h-88" />
        <span className="absolute left-4 top-3 font-display text-7xl leading-none text-foreground/85 sm:text-8xl">{g.number}</span>
      </div>
      <div className={cn("sm:col-span-5", flip && "sm:order-1")}>
        <p className="eyebrow">{g.interaction}</p>
        <h3 className="font-display mt-2 text-[2.6rem] leading-[0.95] sm:text-5xl">{g.title}</h3>
        <p className="mt-3 text-lg text-muted-foreground">{g.hook}</p>
        <Meta g={g} />
      </div>
    </Link>
  );
}