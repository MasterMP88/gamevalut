import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { GAMES, GAMES_BY_ID, NIGHT_PICKS } from "@/lib/game/games";
import type { GameId } from "@/lib/game/types";
import { GameArt } from "@/components/vault/GameArt";
import { GameStage } from "@/components/stage/GameStage";
import { btn } from "@/components/vault/Btn";
import { PrivacyDialog } from "@/components/vault/PrivacyDialog";
import { Mark, Wordmark } from "@/components/brand/Mark";
import { Reveal } from "@/components/brand/Reveal";
import { useSessions } from "@/lib/game/store";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const URL = "https://nocturne-games-for-two.lovable.app/";

const TITLE = "NOCTURNE — Date-Night-Spiele für Paare · Spiele zu zweit";
const DESC = "Neun interaktive Paarspiele für zwei Erwachsene auf einem Handy: Fragen, Timer, Duelle, geheime Wahlen und ein Director, der mitspielt. Als Gast starten, mit Account später weiterspielen.";

export const FAQ: [string, string][] = [
  ["Was ist NOCTURNE?", "NOCTURNE ist eine Sammlung von neun interaktiven Date-Night-Spielen für Paare. Ihr spielt zu zweit auf einem Handy: Fragen, kleine Missionen, Timer, geheime Wahlen, Duelle und ein Director, der den Abend live zusammenstellt."],
  ["Brauchen wir zwei Handys?", "Nein. Ein Handy reicht. Oben steht immer, wer dran ist, und bei geheimen Wahlen sagt euch das Spiel, wann ihr das Handy weitergebt und wer wegschaut."],
  ["Muss ich einen Account erstellen?", "Nein. Alle Spiele lassen sich als Gast starten. Ein kostenloser Account lohnt sich, wenn ihr später genau dort weiterspielen wollt – auch auf einem anderen Gerät."],
  ["Wird gespeichert, was wir antworten?", "Nein, nicht automatisch. Mit Account sichern wir nur den Spielstand: welches Spiel, welche Szene, Punkte und Einstellungen. Was ihr euch sagt oder eintippt, bleibt im laufenden Spiel – außer du sicherst einen Moment ausdrücklich."],
  ["Können wir ein Spiel später fortsetzen?", "Ja, mit Account. NOCTURNE sichert nach jeder Szene automatisch und bringt euch beim nächsten Mal zur selben Szene zurück."],
  ["Sind Aufgaben überspringbar?", "Immer. Skip ist auf jedem Bildschirm sichtbar und kostet nie etwas. Berührung, Sinnliches und Drinks lassen sich jederzeit ausschalten."],
  ["Für wen ist NOCTURNE gedacht?", "Für zwei einvernehmliche Erwachsene ab 18 – frisch verliebt oder seit Jahren zusammen –, die einen Abend lang mehr wollen als Serie und Handy."],
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify([
        { "@context": "https://schema.org", "@type": "WebSite", name: "NOCTURNE", url: URL, inLanguage: "de" },
        { "@context": "https://schema.org", "@type": "Organization", name: "NOCTURNE", url: URL, logo: `${URL}favicon.svg` },
        { "@context": "https://schema.org", "@type": "WebApplication", name: "NOCTURNE — Games for Two", url: URL, applicationCategory: "GameApplication", operatingSystem: "Web", inLanguage: "de", description: DESC, audience: { "@type": "PeopleAudience", suggestedMinAge: 18 } },
      ]),
    }],
  }),
  component: Home,
});


function Home() {
  const [night, setNight] = useState<number | null>(null);
  const pick = night === null ? null : NIGHT_PICKS[night]!;
  const { sessions } = useSessions();
  const { user } = useAuth();
  const live = GAMES.filter((g) => sessions[g.id] && !sessions[g.id]!.finished);

  return (
    <div className="snap-home min-h-dvh overflow-x-clip">
      {/* HERO — short: brand, promise, one action */}
      <section className="relative veil grain safe-x safe-top flex min-h-[46svh] flex-col">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between pt-4">
          <span className="flex items-center gap-2.5 text-foreground">
            <Mark className="size-8" />
            <span className="eyebrow hidden sm:inline">Games for Two</span>
          </span>
          <nav className="flex items-center gap-1" aria-label="Konto">
            <PrivacyDialog>
              <button className="tap eyebrow inline-flex min-h-11 items-center gap-2 px-2 hover:text-foreground">
                <ShieldCheck className="size-4" /> Privat
              </button>
            </PrivacyDialog>
            {user ? (
              <Link to="/tonight" className="tap eyebrow inline-flex min-h-11 items-center px-2 text-foreground">Tonight</Link>
            ) : (
              <Link to="/auth" className="tap eyebrow inline-flex min-h-11 items-center px-2 hover:text-foreground">Anmelden</Link>
            )}
          </nav>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end pb-8 sm:pb-14">
          <p className="animate-rise"><Wordmark className="block text-[clamp(2.2rem,10vw,5.5rem)] leading-[0.85] tracking-[0.06em]" /></p>
          <h1 className="font-display mt-4 max-w-3xl text-[clamp(2.1rem,8.6vw,4.8rem)] leading-[0.95] text-balance animate-rise" style={{ animationDelay: "120ms" }}>
            Ein Handy. Zwei Menschen. <em className="text-primary">Eine Nacht, die mitspielt.</em>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-snug text-foreground/80 animate-rise sm:text-lg" style={{ animationDelay: "200ms" }}>
            Neun interaktive Date-Night-Spiele für Paare – jedes mit eigenen Regeln. Als Gast sofort spielbar, {user ? "eure Spielstände werden gesichert." : <>mit <Link to="/auth" search={{ mode: "signup" }} className="underline underline-offset-4 hover:text-foreground">kostenlosem Account</Link> später weiterspielen.</>}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl safe-x">
        {live.length > 0 && (
          <section className="mt-10">
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

        {/* TONIGHT CHOOSER — big emotional choices, one cinematic recommendation */}
        <section aria-labelledby="tonight-h" className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <h2 id="tonight-h" className="eyebrow">Heute Nacht wollt ihr …</h2>
            <ul className="mt-3" role="group" aria-label="Was für eine Nacht?">
              {NIGHT_PICKS.map((n, i) => (
                <li key={n.label}>
                  <button type="button" aria-pressed={night === i} onClick={() => { haptic(6); setNight(night === i ? null : i); }}
                    className={cn("tap group flex min-h-14 w-full items-baseline gap-4 border-b border-line py-2 text-left transition-colors", night === i ? "text-foreground" : night === null ? "text-foreground/85" : "text-muted-foreground")}>
                    <span className="w-6 font-mono text-xs text-champagne">{String(i + 1).padStart(2, "0")}</span>
                    <span className={cn("font-display text-[clamp(2rem,9vw,3rem)] leading-none transition-transform duration-500", night === i && "translate-x-2 italic text-primary")}>{n.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div aria-live="polite" className="lg:col-span-7 lg:pt-8">
            <Recommendation key={pick?.label ?? "default"} ids={pick ? pick.ids : ["ai-director"]} why={pick ? pick.why : "Noch unentschlossen? Der Director stellt euch den Abend live zusammen."} />
          </div>
        </section>

        {/* GANG MODE — group play entry, own social visual language */}
        <section aria-labelledby="gang-h" className="relative mt-16 overflow-hidden border-t-2 border-signal bg-room px-5 py-8 sm:px-10">
          <div aria-hidden className="absolute inset-x-0 top-0 flex h-10 items-start gap-1 opacity-50">
            {Array.from({ length: 24 }, (_, i) => <span key={i} className="animate-gang-pulse w-full bg-signal" style={{ height: `${25 + ((i * 41) % 75)}%`, animationDelay: `${(i * 113) % 1500}ms` }} />)}
          </div>
          <p className="relative mt-8 font-mono text-xs tracking-[0.25em] text-signal">NEU · GANG MODE · 2–99 PLAYERS</p>
          <h2 id="gang-h" className="font-display relative mt-2 text-[clamp(2.6rem,11vw,5rem)] leading-[0.9]">Mehr als zwei? <em className="text-signal">Der ganze Raum.</em></h2>
          <p className="relative mt-3 max-w-xl text-foreground/85">Partyspiele für Gruppen – ohne Vorbereitung. Lass dir die Nacht planen, wähl ein Spiel oder bau deinen eigenen Mix.</p>
          <Link to="/gang" className={cn(btn({ size: "lg" }), "relative mt-6 bg-signal text-signal-foreground hover:bg-signal/90")}>GANG MODE ansehen <ArrowRight className="size-4" /></Link>
        </section>
      </div>

      {/* COLLECTION — nine authored worlds */}
      <section id="sammlung" aria-labelledby="sammlung-h" className="relative mt-20 scroll-mt-4">
        <div className="mx-auto max-w-6xl safe-x">
          <p className="eyebrow">Die Sammlung</p>
          <h2 id="sammlung-h" className="font-display mt-2 text-[clamp(2.6rem,11vw,5.5rem)] leading-[0.9]">
            Neun Spiele. <em className="text-primary">Neun Welten.</em>
          </h2>
        </div>
        <Rail />
        <div className="divide-y divide-line">
          {GAMES.map((g) => <GameStage key={g.id} game={g} />)}
        </div>
      </section>

      <div className="mx-auto max-w-6xl safe-x safe-bottom">
        {/* HOW */}
        <Reveal className="mt-28 border-t border-line pt-12">
          <section aria-labelledby="how-h">
            <p className="eyebrow">So spielt ihr</p>
            <h2 id="how-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Ein Handy liegt zwischen euch.</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Wer dran ist, steht oben", "Der Name ist groß. Die Aufgabe darunter sagt genau, was jetzt zu tun ist: laut antworten, tippen, Timer starten."],
                ["Handy weitergeben", "Bei geheimen Wahlen sagt das Spiel, wann ihr übergebt und wer kurz wegschaut. Nichts wird vorher verraten."],
                ["Timer, Rad, Duell", "Countdowns, ein Zufallsrad, Sparks im Duell und gemeinsame Energien – je nach Spiel eine andere Mechanik."],
                ["Euer Rahmen", "Berührung, Sinnliches, Drinks: jederzeit an oder aus. Skip ist immer sichtbar und kostet nie etwas."],
              ].map(([t, d], i) => (
                <div key={t} className="flex gap-4">
                  <span className="font-mono text-sm text-champagne">0{i + 1}</span>
                  <div><h3 className="font-display text-2xl leading-tight">{t}</h3><p className="mt-1 text-muted-foreground">{d}</p></div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* SAVE / RESUME */}
        <Reveal className="mt-24">
          <section aria-labelledby="save-h" className="grid gap-8 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="eyebrow">Spielstand</p>
              <h2 id="save-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Deine Nacht merkt sich, wo ihr wart.</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>Als Gast spielt ihr sofort los. Mit einem kostenlosen Account sichert NOCTURNE nach jeder Szene automatisch – leise, ohne Speichern-Knopf.</p>
              <p>Beim nächsten Mal öffnet „Tonight“ genau die Szene, bei der ihr aufgehört habt. Auch nach dem Neuladen und auf einem anderen Gerät. Abgeschlossene Nächte landen im Verlauf.</p>
              {user ? (
                <Link to="/tonight" className={btn({ variant: "outline" })}>Zu Tonight <ArrowRight className="size-4" /></Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }} className={btn({ variant: "outline" })}>Kostenlosen Account erstellen <ArrowRight className="size-4" /></Link>
              )}
            </div>
          </section>
        </Reveal>

        {/* PRIVACY */}
        <Reveal className="mt-24 border-y border-line py-12">
          <section aria-labelledby="priv-h">
            <p className="eyebrow">Privatsphäre</p>
            <h2 id="priv-h" className="font-display mt-2 text-[clamp(2.2rem,9vw,3.5rem)] leading-[0.95]">Gesichert wird der Spielstand. Nicht, was ihr euch sagt.</h2>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                ["Was wir sichern", "Spiel, Szene, Kapitel, Punkte, Energien, Einstellungen und Spielernamen – nur mit Account."],
                ["Was privat bleibt", "Getippte Antworten und Memory-Anker leben nur im laufenden Spiel. Neu laden, und sie sind weg."],
                ["Nur auf Wunsch", "Einen einzelnen Satz könnt ihr ausdrücklich als Moment sichern – und jederzeit wieder löschen."],
              ].map(([t, d]) => (
                <div key={t}><dt className="font-display text-2xl">{t}</dt><dd className="mt-1 text-muted-foreground">{d}</dd></div>
              ))}
            </dl>
          </section>
        </Reveal>

        {/* FAQ */}
        <section aria-labelledby="faq-h" className="mt-24">
          <p className="eyebrow">Fragen</p>
          <h2 id="faq-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Kurz beantwortet.</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <h3 className="font-display text-2xl leading-tight">{q}</h3>
                  <span className="shrink-0 text-xl text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="max-w-2xl pb-5 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section aria-labelledby="cta-h" className="mt-24 text-center">
          <Mark className="mx-auto size-12 text-champagne" />
          <h2 id="cta-h" className="font-display mx-auto mt-6 max-w-2xl text-[clamp(2.6rem,11vw,5rem)] leading-[0.92]">Heute Nacht spielt ihr.</h2>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link to="/game/$slug" params={{ slug: GAMES_BY_ID["ai-director"].slug }} onClick={() => haptic()} className={btn({ size: "lg" })}>Mit dem Director starten <ArrowRight className="size-5" /></Link>
            <a href="#sammlung" className="tap eyebrow inline-flex min-h-11 items-center hover:text-foreground">Oder ein Spiel aussuchen</a>
          </div>
        </section>

        <footer className="mt-24 flex flex-col gap-6 border-t border-line py-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 text-foreground">
            <Mark className="size-7" />
            <Wordmark className="text-xl" />
          </div>
          <p className="max-w-md">Spiele für zwei einvernehmliche Erwachsene ab 18. Alles optional, alles gegenseitig.</p>
          <nav aria-label="Alle Spiele" className="flex flex-wrap gap-x-4 gap-y-1">
            {GAMES.map((g) => <Link key={g.id} to="/game/$slug" params={{ slug: g.slug }} className="tap min-h-9 hover:text-foreground">{g.title}</Link>)}
          </nav>
          <PrivacyDialog>
            <button className="tap min-h-11 self-start underline underline-offset-4 hover:text-foreground">Privatsphäre &amp; Director</button>
          </PrivacyDialog>
        </footer>
      </div>
    </div>
  );
}

/** Cinematic recommendation: first pick large, second as a quieter companion. */
function Recommendation({ ids, why }: { ids: GameId[]; why: string }) {
  const [main, alt] = ids.map((id) => GAMES_BY_ID[id]);
  return (
    <div className="animate-rise">
      <Link to="/game/$slug" params={{ slug: main!.slug }} onClick={() => haptic()} className="tap group relative block overflow-hidden">
        <GameArt art={main!.art} className="h-56 sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <span className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
          <span className="block font-mono text-[0.7rem] tracking-[0.2em] text-champagne">{main!.number} · UNSER VORSCHLAG</span>
          <span className="mt-1 block font-display text-[clamp(2.4rem,10vw,4rem)] leading-[0.9]">{main!.title}</span>
          <span className="mt-2 flex items-center justify-between gap-4">
            <span className="font-display text-lg italic leading-snug text-foreground/85">„{why}“</span>
            <ArrowRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1" />
          </span>
        </span>
      </Link>
      {alt && (
        <Link to="/game/$slug" params={{ slug: alt.slug }} className="tap mt-3 flex min-h-14 items-center justify-between gap-4 border-b border-line">
          <span><span className="mr-3 font-mono text-xs text-champagne">{alt.number}</span><span className="font-display text-2xl">oder {alt.title}</span></span>
          <ArrowRight className="size-5 text-muted-foreground" />
        </Link>
      )}
      <a href="#sammlung" className="tap eyebrow mt-2 inline-flex min-h-11 items-center hover:text-foreground">Alle neun Spiele ↓</a>
    </div>
  );
}

/** Subtle 01–09 orientation rail; jumps to a stage, highlights the one in view. */
function Rail() {
  const [on, setOn] = useState<string | null>(null);
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-stage]");
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setOn(e.target.getAttribute("data-stage"))), { rootMargin: "-45% 0px -45% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label="Spiele-Index" className="sticky top-0 z-20 mt-6 border-y border-line bg-background/85 backdrop-blur-sm">
      <ol className="mx-auto flex max-w-6xl items-center justify-between safe-x">
        {GAMES.map((g) => (
          <li key={g.id}>
            <a href={`#spiel-${g.slug}`} aria-label={`${g.number} ${g.title}`} aria-current={on === g.number ? "true" : undefined}
              className={cn("tap relative inline-flex min-h-11 min-w-8 items-center justify-center font-mono text-[0.7rem] tracking-[0.1em] transition-colors", on === g.number ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground")}>
              {g.number}
              <span aria-hidden className={cn("absolute inset-x-1 bottom-1.5 h-px bg-primary transition-transform duration-500", on === g.number ? "scale-x-100" : "scale-x-0")} />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}