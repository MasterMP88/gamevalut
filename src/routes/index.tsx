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
import { PriceAction } from "@/components/commerce/PriceAction";

const URL = "https://nocturne-games-for-two.lovable.app/";

const TITLE = "NOCTURNE — Spiele für Paare & Partyspiele für Gruppen · Game Night online";
const DESC = "Interaktive Game Night im Browser: neun Date-Night-Spiele für Paare und GANG MODE mit Gruppenspielen für 2–99 Leute. Sofort spielbar, kein Download. Im GANG MODE zahlt nur der Host.";

export const FAQ: [string, string][] = [
  ["Was ist NOCTURNE?", "NOCTURNE ist eine Plattform für interaktive Spieleabende im Browser. Zu zweit spielt ihr neun Date-Night-Spiele mit Fragen, Timern, geheimen Wahlen, Duellen und einem Director. Im GANG MODE spielen 2 bis 99 Leute Partyspiele gemeinsam."],
  ["Ist NOCTURNE nur für Paare?", "Nein. Es gibt zwei Welten: neun Spiele für zwei Erwachsene und GANG MODE für Freunde, Partys und Gruppen von 2 bis 99 Personen."],
  ["Wie funktioniert GANG MODE?", "Der Host öffnet einen Raum. Alle anderen treten per QR-Code oder Raumcode mit dem eigenen Handy bei – geheime Antworten bleiben so auf dem eigenen Gerät. Optional läuft eine Big-Screen-Ansicht auf dem Fernseher. Wenn nötig, geht es auch mit nur einem Handy zum Weitergeben. Der Party Director plant die Nacht, oder ihr wählt Spiele selbst."],
  ["Braucht jeder einen Account?", "Nein. Gäste im GANG MODE treten ohne Account bei. Ein Account ist für den Host bzw. für euch zu zweit sinnvoll, um Zugang zu verwalten und Spielstände auf jedem Gerät fortzusetzen."],
  ["Was kostet NOCTURNE?", "Die Free Preview ist kostenlos und lässt euch in ein Spiel bis Szene 5 hineinspielen – ohne Karte. Danach gibt es den Night Pass für 6,99 € einmalig (72 Stunden voller Zugang zu zweit), Unlimited für 9,99 € pro Monat oder Unlimited Year für 49,99 € pro Jahr."],
  ["Zahlt im GANG MODE jeder?", "Nein. Ein Host zahlt, alle spielen. Gäste treten kostenlos per QR-Code oder Raumcode bei und brauchen weder Account noch Abo."],
  ["Brauchen wir mehrere Handys?", "Zu zweit reicht ein Handy. Im GANG MODE ist jedes eigene Handy der empfohlene Weg; wenn nötig, spielt ihr auch mit einem Handy, das herumgereicht wird."],
  ["Was wird gespeichert?", "Mit Account nur der Spielstand: Spiel, Szene, Punkte und Einstellungen. Was ihr euch sagt oder eintippt, wird nicht automatisch gespeichert – außer du sicherst einen Moment ausdrücklich."],
  ["Können wir später fortsetzen?", "Ja, mit Account. NOCTURNE sichert nach jeder Szene automatisch und bringt euch beim nächsten Mal zur selben Szene zurück – auch auf einem anderen Gerät."],
  ["Sind Aufgaben überspringbar?", "Immer. Skip ist auf jedem Bildschirm sichtbar und kostet nie etwas. Berührung, Sinnliches und Drinks lassen sich jederzeit ausschalten."],
];

const OFFERS = [
  { name: "Free Preview", price: "0 €", per: "", note: "Spielt in ein Spiel hinein – bis Szene 5. Keine Karte nötig.", tag: "" },
  { name: "Night Pass", key: "night_pass_72h" as const, price: "6,99 €", per: "einmalig", note: "72 Stunden voller Zugang zu zweit. Kein Abo.", tag: "Für heute Nacht" },
  { name: "Unlimited", key: "unlimited_monthly" as const, price: "9,99 €", per: "pro Monat", note: "Alle Spiele, jede Nacht, monatlich kündbar.", tag: "" },
  { name: "Unlimited Year", key: "unlimited_annual" as const, price: "49,99 €", per: "pro Jahr", note: "Alle Spiele, ein Jahr lang. Entspricht 4,17 €/Monat, jährlich abgerechnet.", tag: "Best Value" },
] as const;

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
        { "@context": "https://schema.org", "@type": "WebApplication", name: "NOCTURNE — Game Night für Paare & Gruppen", url: URL, applicationCategory: "GameApplication", operatingSystem: "Web", inLanguage: "de", description: DESC },
      ]),
    }],
  }),
  component: Home,
});

const DIRECTOR_SLUG = GAMES_BY_ID["ai-director"].slug;

function Home() {
  const [night, setNight] = useState<number | null>(null);
  const pick = night === null ? null : NIGHT_PICKS[night]!;
  const { sessions } = useSessions();
  const { user } = useAuth();
  const live = GAMES.filter((g) => sessions[g.id] && !sessions[g.id]!.finished);

  return (
    <div className="snap-home min-h-dvh overflow-x-clip">
      {/* HERO — two worlds, two human choices */}
      <section className="relative veil grain safe-x safe-top flex min-h-[62svh] flex-col">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between pt-4">
          <span className="flex items-center gap-2.5 text-foreground">
            <Mark className="size-8" />
            <span className="eyebrow hidden sm:inline">Game Night · Zu zweit &amp; Gang</span>
          </span>
          <nav className="flex items-center gap-1" aria-label="Konto">
            <a href="#preise" className="tap eyebrow inline-flex min-h-11 items-center px-2 hover:text-foreground">Preise</a>
            <PrivacyDialog>
              <button className="tap eyebrow inline-flex min-h-11 items-center gap-2 px-2 hover:text-foreground">
                <ShieldCheck className="size-4" /> <span className="hidden sm:inline">Privat</span>
              </button>
            </PrivacyDialog>
            {user ? (
              <Link to="/tonight" className="tap eyebrow inline-flex min-h-11 items-center px-2 text-foreground">Tonight</Link>
            ) : (
              <Link to="/auth" className="tap eyebrow inline-flex min-h-11 items-center px-2 hover:text-foreground">Anmelden</Link>
            )}
          </nav>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end pb-10 sm:pb-14">
          <p className="animate-rise"><Wordmark className="block text-[clamp(2.2rem,10vw,5.5rem)] leading-[0.85] tracking-[0.06em]" /></p>
          <h1 className="font-display mt-4 max-w-4xl text-[clamp(2.1rem,8.6vw,4.8rem)] leading-[0.95] text-balance animate-rise" style={{ animationDelay: "120ms" }}>
            Eine Nacht. Zwei Menschen. <em className="text-primary">Oder der ganze Raum.</em>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-snug text-foreground/80 animate-rise sm:text-lg" style={{ animationDelay: "200ms" }}>
            Interaktive Spiele für Paare und Gruppen – direkt im Browser, ohne Download. Neun Date-Night-Spiele zu zweit oder GANG MODE für 2–99 Leute.
          </p>
          <div className="mt-7 flex flex-col gap-3 animate-rise sm:flex-row" style={{ animationDelay: "280ms" }}>
            <a href="#zu-zweit" onClick={() => haptic()} className={btn({ size: "lg" })}>Zu zweit spielen <ArrowRight className="size-5" /></a>
            <Link to="/gang" onClick={() => haptic()} className={cn(btn({ size: "lg" }), "bg-signal text-signal-foreground hover:bg-signal/90")}>GANG MODE <ArrowRight className="size-5" /></Link>
          </div>
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

        {/* TWO WORLDS */}
        <section aria-labelledby="worlds-h" className="mt-12">
          <h2 id="worlds-h" className="eyebrow">Zwei Welten, eine Plattform</h2>
          <div className="mt-4 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
            <a href="#zu-zweit" className="tap group flex flex-col bg-background p-6 sm:p-8">
              <span className="font-mono text-xs tracking-[0.25em] text-champagne">FOR TWO · 9 SPIELE · AB 18</span>
              <span className="font-display mt-3 text-[clamp(2.4rem,9vw,3.6rem)] leading-[0.9]">Zu zweit. <em className="text-primary">Ganz nah.</em></span>
              <span className="mt-3 text-foreground/80">Date-Night-Spiele für Paare: intim, verspielt, kooperativ oder im Duell. Ein Handy liegt zwischen euch, der Director spielt mit.</span>
              <span className="eyebrow mt-6 inline-flex items-center gap-2 text-foreground">Spiele zu zweit <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </a>
            <Link to="/gang" className="tap group relative flex flex-col overflow-hidden bg-room p-6 sm:p-8">
              <span aria-hidden className="absolute inset-x-0 top-0 flex h-8 items-start gap-1 opacity-40">
                {Array.from({ length: 18 }, (_, i) => <span key={i} className="animate-gang-pulse w-full bg-signal" style={{ height: `${25 + ((i * 41) % 75)}%`, animationDelay: `${(i * 113) % 1500}ms` }} />)}
              </span>
              <span className="relative mt-4 font-mono text-xs tracking-[0.25em] text-signal">GANG MODE · 2–99 PLAYER</span>
              <span className="font-display relative mt-3 text-[clamp(2.4rem,9vw,3.6rem)] leading-[0.9]">Der ganze Raum. <em className="text-signal">Jedes Handy.</em></span>
              <span className="relative mt-3 text-foreground/85">Partyspiele für Freunde und Gruppen. Alle treten per QR-Code bei, der Party Director plant die Nacht. Host zahlt · Gäste spielen kostenlos mit.</span>
              <span className="eyebrow relative mt-6 inline-flex items-center gap-2 text-foreground">GANG MODE öffnen <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </section>

        {/* TONIGHT CHOOSER — couples context */}
        <section id="zu-zweit" aria-labelledby="tonight-h" className="mt-16 grid scroll-mt-4 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="eyebrow text-champagne">Zu zweit</p>
            <h2 id="tonight-h" className="eyebrow mt-1">Heute Nacht wollt ihr zwei …</h2>
            <ul className="mt-3" role="group" aria-label="Was für eine Nacht zu zweit?">
              {NIGHT_PICKS.map((n, i) => (
                <li key={n.label}>
                  <button type="button" aria-pressed={night === i} onClick={() => { haptic(6); setNight(night === i ? null : i); }}
                    className={cn("tap group flex min-h-14 w-full items-baseline gap-4 border-b border-line py-2 text-left transition-colors", night === i ? "text-foreground" : night === null ? "text-foreground/85" : "text-muted-foreground")}>
                    <span className="w-6 font-mono text-xs text-champagne">{String(i + 1).padStart(2, "0")}</span>
                    <span className={cn("font-display text-[clamp(2rem,9vw,3rem)] leading-none transition-transform duration-500", night === i && "translate-x-2 italic text-primary")}>{n.label}</span>
                  </button>
                </li>
              ))}
              <li>
                <Link to="/gang" className="tap flex min-h-14 w-full items-baseline gap-4 border-b border-line py-2 text-left text-foreground/85">
                  <span className="w-6 font-mono text-xs text-signal">+</span>
                  <span className="font-display text-[clamp(1.6rem,7vw,2.4rem)] leading-none">… mehr als zwei sein? <em className="text-signal">GANG MODE</em></span>
                </Link>
              </li>
            </ul>
          </div>
          <div aria-live="polite" className="lg:col-span-7 lg:pt-8">
            <Recommendation key={pick?.label ?? "default"} ids={pick ? pick.ids : ["ai-director"]} why={pick ? pick.why : "Noch unentschlossen? Der Director stellt euch den Abend live zusammen."} />
          </div>
        </section>
      </div>

      {/* COLLECTION — nine authored worlds */}
      <section id="sammlung" aria-labelledby="sammlung-h" className="relative mt-20 scroll-mt-4">
        <div className="mx-auto max-w-6xl safe-x">
          <p className="eyebrow">For Two · Die Sammlung</p>
          <h2 id="sammlung-h" className="font-display mt-2 text-[clamp(2.6rem,11vw,5.5rem)] leading-[0.9]">
            Neun Spiele zu zweit. <em className="text-primary">Neun Welten.</em>
          </h2>
        </div>
        <Rail />
        <div className="divide-y divide-line">
          {GAMES.map((g) => <GameStage key={g.id} game={g} />)}
        </div>
      </section>

      <div className="mx-auto max-w-6xl safe-x safe-bottom">
        {/* GANG MODE SHOWCASE */}
        <section aria-labelledby="gang-h" className="relative mt-24 overflow-hidden border-t-2 border-signal bg-room px-5 py-10 sm:px-10">
          <div aria-hidden className="absolute inset-x-0 top-0 flex h-10 items-start gap-1 opacity-50">
            {Array.from({ length: 24 }, (_, i) => <span key={i} className="animate-gang-pulse w-full bg-signal" style={{ height: `${25 + ((i * 41) % 75)}%`, animationDelay: `${(i * 113) % 1500}ms` }} />)}
          </div>
          <p className="relative mt-8 font-mono text-xs tracking-[0.25em] text-signal">GANG MODE · 2–99 PLAYER</p>
          <h2 id="gang-h" className="font-display relative mt-2 text-[clamp(2.6rem,11vw,5rem)] leading-[0.9]">Mehr als zwei? <em className="text-signal">Der ganze Raum.</em></h2>
          <p className="relative mt-3 max-w-xl text-foreground/85">Gruppenspiele online für Freunde, Partys und Game Nights – ohne Vorbereitung. Lass den Party Director die Nacht planen, wähl ein Spiel aus dem Katalog oder bau deinen eigenen Mix.</p>
          <ol className="relative mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["Everyone In", "Empfohlen", "Jeder tritt per QR-Code oder Raumcode mit dem eigenen Handy bei. Geheime Rollen und Stimmen bleiben auf dem eigenen Gerät."],
              ["Big Screen", "Optional", "Ein Fernseher oder Laptop zeigt die Bühne für alle: Fragen, Countdowns, Ergebnisse. Er belegt keinen Spielerplatz."],
              ["Ein Handy", "Wenn nötig", "Kein Netz, keine Lust auf Beitritt? Dann wandert ein Handy durch die Runde – mit Sichtschutz bei geheimen Zügen."],
            ].map(([t, tag, d], i) => (
              <li key={t} className="border-t border-signal/40 pt-4">
                <span className="font-mono text-xs text-signal">0{i + 1} · {tag!.toUpperCase()}</span>
                <h3 className="font-display mt-1 text-3xl leading-tight">{t}</h3>
                <p className="mt-1 text-foreground/75">{d}</p>
              </li>
            ))}
          </ol>
          <p className="relative mt-8 font-display text-2xl italic text-foreground">Host zahlt · Gäste spielen kostenlos mit.</p>
          <p className="relative mt-1 max-w-xl text-sm text-foreground/70">Gäste brauchen weder Account noch Abo. Nur wer den Raum öffnet, braucht Zugang.</p>
          <Link to="/gang" className={cn(btn({ size: "lg" }), "relative mt-6 bg-signal text-signal-foreground hover:bg-signal/90")}>GANG MODE öffnen <ArrowRight className="size-4" /></Link>
        </section>

        {/* HOW — both contexts */}
        <Reveal className="mt-28 border-t border-line pt-12">
          <section aria-labelledby="how-h">
            <p className="eyebrow">So funktioniert NOCTURNE</p>
            <h2 id="how-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Browser auf, Spiel an. Kein Download.</h2>
            <div className="mt-10 grid gap-12 lg:grid-cols-2">
              <div>
                <h3 className="eyebrow text-champagne">Zu zweit · ein Handy</h3>
                <ol className="mt-4 space-y-6">
                  {[
                    ["Wer dran ist, steht oben", "Der Name ist groß. Die Aufgabe darunter sagt genau, was jetzt zu tun ist: laut antworten, tippen, Timer starten."],
                    ["Handy weitergeben", "Bei geheimen Wahlen sagt das Spiel, wann ihr übergebt und wer kurz wegschaut."],
                    ["Euer Rahmen", "Berührung, Sinnliches, Drinks: jederzeit an oder aus. Skip ist immer sichtbar und kostet nie etwas."],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex gap-4"><span className="font-mono text-sm text-champagne">0{i + 1}</span><div><p className="font-display text-2xl leading-tight">{t}</p><p className="mt-1 text-muted-foreground">{d}</p></div></li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="eyebrow text-signal">GANG MODE · jedes Handy</h3>
                <ol className="mt-4 space-y-6">
                  {[
                    ["Host öffnet den Raum", "Director-Nacht, einzelnes Spiel oder eigener Mix – der Host wählt und öffnet einen Raum."],
                    ["Alle scannen den QR-Code", "Gäste treten mit dem eigenen Handy bei, ohne Account. Optional läuft die Bühne auf dem Fernseher."],
                    ["Spielen, abstimmen, lachen", "Geheime Wahlen bleiben privat, Ergebnisse kommen für alle gleichzeitig. Skip gibt es auch hier."],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex gap-4"><span className="font-mono text-sm text-signal">0{i + 1}</span><div><p className="font-display text-2xl leading-tight">{t}</p><p className="mt-1 text-muted-foreground">{d}</p></div></li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </Reveal>

        {/* PRICING */}
        <section id="preise" aria-labelledby="price-h" className="mt-24 scroll-mt-4">
          <p className="eyebrow">Zugang</p>
          <h2 id="price-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Erst reinspielen. <em className="text-primary">Dann entscheiden.</em></h2>
          <p className="mt-3 max-w-xl text-muted-foreground">Die Free Preview führt euch bis Szene 5. Keine Unterbrechung mitten in einer Runde: Erst wenn die Vorschau endet, erscheint die Wahl, wie ihr weiterspielen wollt.</p>
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {OFFERS.map((o) => {
              const best = o.tag === "Best Value";
              return (
                <li key={o.name} className={cn("grid gap-2 py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6", best && "-mx-4 bg-primary/10 px-4 ring-1 ring-primary/40")}>
                  <div className="sm:col-span-4">
                    {o.tag && <span className={cn("font-mono text-[0.7rem] tracking-[0.2em]", best ? "text-primary" : "text-champagne")}>{o.tag.toUpperCase()}{best && " · EMPFOHLEN"}</span>}
                    <h3 className="font-display text-3xl leading-tight">{o.name}</h3>
                  </div>
                  <p className="sm:col-span-3"><span className="font-display text-4xl">{o.price}</span>{o.per && <span className="ml-2 text-sm text-muted-foreground">{o.per}</span>}</p>
                  <p className="text-muted-foreground sm:col-span-5">{o.note}</p>
                  {"key" in o && <div className="sm:col-span-12"><PriceAction offer={o.key} best={best} /></div>}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">Im GANG MODE gilt: Ein Host zahlt, alle spielen. Gäste treten kostenlos bei.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/game/$slug" params={{ slug: DIRECTOR_SLUG }} className={btn({ size: "lg" })}>Free Preview starten <ArrowRight className="size-5" /></Link>
            <Link to={user ? "/tonight" : "/auth"} className={btn({ variant: "outline", size: "lg" })}>Konto &amp; Zugang</Link>
          </div>
        </section>

        {/* SAVE / RESUME */}
        <Reveal className="mt-24">
          <section aria-labelledby="save-h" className="grid gap-8 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="eyebrow">Spielstand</p>
              <h2 id="save-h" className="font-display mt-2 text-[clamp(2.4rem,10vw,4rem)] leading-[0.95]">Deine Nacht merkt sich, wo ihr wart.</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>Mit Account sichert NOCTURNE nach jeder Szene automatisch – leise, ohne Speichern-Knopf. Dort verwaltest du auch deinen Zugang.</p>
              <p>Beim nächsten Mal öffnet „Tonight“ genau die Szene, bei der ihr aufgehört habt. Auch nach dem Neuladen und auf einem anderen Gerät.</p>
              {user ? (
                <Link to="/tonight" className={btn({ variant: "outline" })}>Zu Tonight <ArrowRight className="size-4" /></Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }} className={btn({ variant: "outline" })}>Account erstellen <ArrowRight className="size-4" /></Link>
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
                ["Was privat bleibt", "Getippte Antworten und Memory-Anker leben nur im laufenden Spiel. Im GANG MODE sieht nur ihr eure geheimen Rollen und Stimmen."],
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
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/game/$slug" params={{ slug: DIRECTOR_SLUG }} onClick={() => haptic()} className={btn({ size: "lg" })}>Zu zweit <ArrowRight className="size-5" /></Link>
            <Link to="/gang" onClick={() => haptic()} className={cn(btn({ size: "lg" }), "bg-signal text-signal-foreground hover:bg-signal/90")}>GANG MODE <ArrowRight className="size-5" /></Link>
          </div>
        </section>

        <footer className="mt-24 flex flex-col gap-6 border-t border-line py-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 text-foreground">
            <Mark className="size-7" />
            <Wordmark className="text-xl" />
          </div>
          <p className="max-w-md">Game Night für Paare und Gruppen. Die Spiele zu zweit sind für einvernehmliche Erwachsene ab 18. Alles optional, Skip immer möglich.</p>
          <nav aria-label="Spiele zu zweit" className="flex flex-wrap gap-x-4 gap-y-1">
            {GAMES.map((g) => <Link key={g.id} to="/game/$slug" params={{ slug: g.slug }} className="tap min-h-9 hover:text-foreground">{g.title}</Link>)}
            <Link to="/gang" className="tap min-h-9 text-foreground hover:text-signal">GANG MODE</Link>
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
