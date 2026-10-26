import { couchGame } from "@/lib/gang/core/experience";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GANG_GAMES, gangGame } from "@/lib/gang/catalog";
import { GANG_GUIDES } from "@/lib/gang/guides";
import { getGangPlaybook } from "@/lib/gang/core/playbooks";
import { GangExample, GangGuide } from "@/components/gang/GangGuide";
import { MotifArt, hueVars } from "@/components/gang/MotifArt";
import { SITE } from "@/lib/seo";
import { btn } from "@/components/vault/Btn";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gang_/$slug")({
  loader: ({ params }) => {
    const game = gangGame(params.slug);
    if (!game || game.id === "time-drop") throw notFound();
    return {
      id: game.id,
      title: game.title,
      description: `${game.title}: ${GANG_GUIDES[game.id].goal} Für ${game.min}–${game.max} Personen. Regeln, Wertung und Beispielrunde.`,
    };
  },
  head: ({ loaderData: g }) => {
    if (!g)
      return {
        meta: [
          { title: "Spiel nicht gefunden — NOCTURNE" },
          { name: "robots", content: "noindex" },
        ],
      };
    const url = `${SITE}/gang/${g.id}`;
    const title = `${g.title} — Regeln & Partyspiel | NOCTURNE`;
    return {
      meta: [
        { title },
        { name: "description", content: g.description },
        { property: "og:title", content: title },
        { property: "og:description", content: g.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "NOCTURNE",
                item: `${SITE}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "GANG MODE",
                item: `${SITE}/gang`,
              },
              { "@type": "ListItem", position: 3, name: g.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: GangDetail,
});

function GangDetail() {
  const { id } = Route.useLoaderData();
  const game = gangGame(id)!;
  const guide = GANG_GUIDES[id];
  const pb = getGangPlaybook(id)!;
  const related = GANG_GAMES.filter(
    (g) => g.id !== id && g.tags.some((t) => game.tags.includes(t)),
  ).slice(0, 3);
  return (
    <main
      style={hueVars(game.hue)}
      className="min-h-dvh bg-room text-foreground safe-x safe-top safe-bottom"
    >
      <div className="mx-auto max-w-3xl pb-8">
        <Link
          to="/gang"
          className="tap inline-flex min-h-14 items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" /> Alle Gruppenspiele
        </Link>
        <div className="mt-8 flex items-center justify-between gap-6">
          <p className="eyebrow text-signal">
            GANG MODE · {game.min}–{game.max} Personen
          </p>
          <MotifArt motif={game.motif} className="w-20 shrink-0" />
        </div>
        <h1 className="font-display mt-6 break-words text-[clamp(3rem,12vw,7rem)] leading-[0.9]">
          {game.title}
        </h1>
        <p className="mt-5 font-display text-3xl italic text-[var(--g)]">
          {game.hook}
        </p>
        <p className="mt-4 max-w-xl text-lg">{guide.goal}</p>
        <dl className="my-8 grid grid-cols-2 gap-6 border-y border-line py-5">
          <div>
            <dt className="eyebrow">Dauer eines Spiels</dt>
            <dd className="mt-1">
              ca. {game.minutes[0]}–{game.minutes[1]} Minuten
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Eure Eingaben</dt>
            <dd className="mt-1 text-sm">{guide.input}</dd>
          </div>
        </dl>
        <GangExample key={id} id={id} />
        <section className="mt-12" aria-labelledby="rules-heading">
          <h2 id="rules-heading" className="font-display mb-6 text-4xl">
            So spielt ihr
          </h2>
          <GangGuide id={id} />
          {couchGame(id) && (
            <details className="mt-6 border-t border-line pt-4">
              <summary className="tap min-h-12 cursor-pointer">
                Variante mit eigenen Handys
              </summary>
              <div className="pt-4">
                <GangGuide id={id} deviceRules />
              </div>
            </details>
          )}
          {pb.safetyNote && (
            <p className="mt-6 border-l-2 border-signal pl-4 text-sm text-muted-foreground">
              {pb.safetyNote}
            </p>
          )}
        </section>
        <section className="mt-10 border-y border-line py-6">
          <h2 className="font-display text-3xl">Passt an euren Tisch</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {couchGame(id)
              ? "TV oder Laptop plus Hostbedienung reichen. Ein gemeinsames Handy geht ebenfalls. Ihr spielt laut im Raum; niemand muss per QR-Code beitreten."
              : game.interactionModes[0] === "everyone-in"
                ? "Eigene Handys machen die verdeckten Eingaben besonders flüssig. Gäste treten kostenlos per QR-Code bei."
                : "Ein gemeinsames Handy reicht. Geheime Karten oder Antworten werden mit einer Übergabe verdeckt; die Auflösung erlebt ihr gemeinsam."}{" "}
            Bei der Variante mit eigenen Handys kann ein zweiter Bildschirm die
            gemeinsame Bühne zeigen.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Für einen ganzen Spieleabend wählt ihr 15, 30, 60 Minuten oder Open
            End. Runden und Gruppengröße bestimmen die tatsächliche Dauer. Ein
            Host braucht einen Night Pass oder Unlimited; Gäste brauchen keinen
            Account.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Ungespielte Inhalte kommen zuerst. Danach verwendet NOCTURNE die am
            längsten zurückliegenden Inhalte. Ohne gespeicherten Verlauf, auf
            einem neuen Gerät oder nach geleertem Browser-Speicher kann eine
            bekannte Frage wieder auftauchen.
          </p>
        </section>
        {related.length > 0 && (
          <nav className="mt-10" aria-label="Ähnliche Gruppenspiele">
            <h2 className="eyebrow mb-3">Passt auch in euren Mix</h2>
            {related.map((g) => (
              <Link
                key={g.id}
                to="/gang/$slug"
                params={{ slug: g.id }}
                className="tap flex min-h-16 items-center justify-between gap-4 border-b border-line font-display text-2xl"
              >
                {g.title}
                <ArrowRight className="size-4" />
              </Link>
            ))}
          </nav>
        )}
        <div className="sticky bottom-0 mt-10 bg-room/95 py-4 backdrop-blur safe-bottom">
          <Link
            to="/gang"
            search={{ game: id }}
            className={cn(
              btn({ size: "lg" }),
              "w-full bg-signal text-signal-foreground hover:bg-signal/90",
            )}
          >
            Dieses Spiel starten <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
