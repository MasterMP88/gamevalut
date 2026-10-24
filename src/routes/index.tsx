import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { GAMES, GAMES_BY_ID, NIGHT_PICKS, type GameConfig, type Mood } from "@/lib/game/games";
import { GameArt } from "@/components/vault/GameArt";
import { MechanicPreview } from "@/components/preview/MechanicPreview";
import { PREVIEWS } from "@/lib/game/previews";
import { Btn, btn } from "@/components/vault/Btn";
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

const MOODS: Mood[] = ["Lustig", "Tief", "Frech", "Gemeinsam", "Musik", "Mit Memory", "Mit AI"];
const FEATURED = GAMES_BY_ID["ai-director"];
const INTENSITY = ["", "Sanft", "Verspielt", "Mutig"];
const COLLECTION = GAMES.filter((g) => g.id !== FEATURED.id);

function Home() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [night, setNight] = useState<number | null>(null);
  const pick = night === null ? null : NIGHT_PICKS[night]!;
  const { sessions } = useSessions();
  const { user } = useAuth();
  const list = mood ? GAMES.filter((g) => g.moods.includes(mood)) : COLLECTION;
  const live = GAMES.filter((g) => sessions[g.id] && !sessions[g.id]!.finished);

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* HERO — first frame */}
      <section className="relative veil grain safe-x safe-top flex min-h-[92svh] flex-col">
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

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end pb-12 sm:pb-20">
          <Mark draw className="hidden size-24 text-champagne/80 sm:block" />
          <p className="mt-6 animate-rise"><Wordmark className="block text-[clamp(2.4rem,11vw,6rem)] leading-[0.85] tracking-[0.06em]" /></p>
          <h1 className="font-display mt-5 max-w-3xl text-[clamp(2.4rem,10vw,5.5rem)] leading-[0.95] text-balance animate-rise" style={{ animationDelay: "120ms" }}>
            Ein Handy. Zwei Menschen. <em className="text-primary">Eine Nacht, die mitspielt.</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-snug text-foreground/85 animate-rise" style={{ animationDelay: "200ms" }}>
            Neun interaktive Date-Night-Spiele für Paare – für zwei Erwachsene auf einem Handy. Jedes Spiel hat eigene Regeln, und der Abend passt sich eurer Stimmung an.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-rise" style={{ animationDelay: "280ms" }}>
            <Link to="/game/$slug" params={{ slug: COLLECTION[0]!.slug }} onClick={() => haptic()} className={btn({ size: "lg" })}>
              Als Gast starten <ArrowRight className="size-5" />
            </Link>
            <a href="#sammlung" className="tap eyebrow inline-flex min-h-11 items-center hover:text-foreground">9 Spiele ansehen</a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground animate-rise" style={{ animationDelay: "340ms" }}>
            Kein Account nötig. {user ? "Eure Spielstände werden gesichert." : <>Mit <Link to="/auth" search={{ mode: "signup" }} className="underline underline-offset-4 hover:text-foreground">kostenlosem Account</Link> spielt ihr später genau dort weiter.</>}
          </p>
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
          <h2 className="eyebrow">Was passiert heute Nacht? Wählt eure Stimmung</h2>
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
                <p className="font-display text-2xl italic leading-snug text-foreground">„{pick.why}“</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">Unser Vorschlag für heute</p>
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

        {/* FEATURED — live director booth */}
        <Reveal className="mt-16">
          <section aria-labelledby="flagship" className="-mx-5 border-y border-line bg-surface/40 px-5 py-8 sm:mx-0 sm:border sm:p-10">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Heute Nacht · Flagship</p>
              <span className="flex items-center gap-2 font-mono text-xs text-champagne"><span className="size-1.5 rounded-full bg-champagne animate-slow-pulse" />AI · live</span>
            </div>
            <div className="mt-6 grid gap-8 sm:grid-cols-2 sm:items-end">
              <div>
                <p className="font-mono text-sm text-champagne">{FEATURED.number}</p>
                <h2 id="flagship" className="font-display mt-1 text-[clamp(3rem,14vw,5.5rem)] leading-[0.88]">
                  NIGHT//ECHO
                  <span className="block italic text-primary">Director</span>
                </h2>
                <p className="mt-5 max-w-sm text-lg leading-snug">{PREVIEWS[FEATURED.id].mechanic}</p>
              </div>
              <MechanicPreview game={FEATURED} tall />
            </div>
            <Link to="/game/$slug" params={{ slug: FEATURED.slug }} onClick={() => haptic()} className={btn({ size: "lg", className: "mt-8 w-full sm:w-auto" })}>
              Director starten <ArrowRight className="size-5" />
            </Link>
          </section>
        </Reveal>

        {/* COLLECTION */}
        <section id="sammlung" className="mt-24 scroll-mt-6">
          <Reveal>
            <p className="eyebrow">Die Sammlung</p>
            <h2 className="font-display mt-2 text-[clamp(3rem,13vw,6rem)] leading-[0.9]">
              Neun Spiele. <em className="text-primary">Neun Arten, die Nacht zu spielen.</em>
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
          <p className="mt-3 font-mono text-xs text-muted-foreground" aria-live="polite">{String(list.length).padStart(2, "0")} Spiele</p>

          <ol className="mt-8 flex flex-col gap-14 sm:gap-20">
            {list.map((g, i) => (
              <li key={g.id}>
                <Reveal delay={40}>
                  <CollectionItem g={g} flip={i % 2 === 1} />
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

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
            <Link to="/game/$slug" params={{ slug: FEATURED.slug }} onClick={() => haptic()} className={btn({ size: "lg" })}>Mit dem Director starten <ArrowRight className="size-5" /></Link>
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

function Truths({ g }: { g: GameConfig }) {
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
      <span>{g.duration}</span>
      <span className="flex items-center gap-1" aria-label={`Intensität ${INTENSITY[g.intensity]}`}>
        {[1, 2, 3].map((n) => <span key={n} className={cn("inline-block size-1.5 rounded-full", n <= g.intensity ? "bg-primary" : "bg-surface-2")} />)}
      </span>
      {PREVIEWS[g.id].truths.map((t) => <span key={t}>· {t}</span>)}
    </p>
  );
}

/** Information first: title, hook, what you actually do, a playable trailer, facts, one clear CTA. */
function CollectionItem({ g, flip }: { g: GameConfig; flip: boolean }) {
  const p = PREVIEWS[g.id];
  return (
    <article aria-labelledby={`t-${g.id}`} className="grid gap-5 sm:grid-cols-12 sm:items-center sm:gap-10">
      <div className={cn("sm:col-span-6", flip && "sm:order-2")}>
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground">{g.number} · {g.interaction}</p>
        <h3 id={`t-${g.id}`} className="font-display mt-2 text-[clamp(2.4rem,11vw,3.5rem)] leading-[0.92]">{g.title}</h3>
        <p className="mt-2 font-display text-xl italic text-primary">{g.hook}</p>
        <p className="mt-3 text-base leading-snug text-muted-foreground">{p.mechanic}</p>
        <Truths g={g} />
      </div>
      <div className={cn("sm:col-span-6", flip && "sm:order-1")}>
        <MechanicPreview game={g} />
        <Link to="/game/$slug" params={{ slug: g.slug }} onClick={() => haptic()} className={btn({ variant: "outline", className: "mt-3 w-full justify-between" })} aria-label={`${g.title} spielen`}>
          {g.title} spielen <ArrowRight className="size-5" />
        </Link>
      </div>
    </article>
  );
}