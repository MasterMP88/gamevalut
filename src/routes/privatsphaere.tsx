import { createFileRoute, Link } from "@tanstack/react-router";
import { PrivacyFacts } from "@/components/vault/PrivacyFacts";
import { SITE } from "@/lib/seo";

export const Route = createFileRoute("/privatsphaere")({
  head: () => ({ meta: [{ title: "Privatsphäre im Spiel — NOCTURNE" }, { name: "description", content: "Was NOCTURNE während einer Game Night speichert: Spielstände, Inhaltsverlauf, private Räume, Fotos und freiwillig gesicherte Momente." }], links: [{ rel: "canonical", href: `${SITE}/privatsphaere` }] }),
  component: () => <main className="min-h-dvh safe-x safe-top safe-bottom"><div className="mx-auto max-w-2xl pb-10">
    <Link to="/" className="tap inline-flex min-h-14 items-center text-sm">← NOCTURNE</Link>
    <p className="eyebrow mt-8">Eure Daten im Spiel</p>
    <h1 className="font-display mt-3 text-5xl sm:text-6xl">Was bleibt. Was vergeht.</h1>
    <p className="mb-10 mt-5 text-lg text-muted-foreground">Hier seht ihr, wie die Spielfunktionen mit euren Daten umgehen und was ein Gerätewechsel bedeutet.</p>
    <PrivacyFacts />
    <Link to="/tonight" className="tap mt-8 inline-flex min-h-12 items-center text-primary">Gesicherte Spielstände und Momente verwalten →</Link>
  </div></main>,
});
