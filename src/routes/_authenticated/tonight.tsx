import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, LogOut, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSessions } from "@/lib/game/store";
import { GAMES, GAMES_BY_ID } from "@/lib/game/games";
import { GameArt } from "@/components/vault/GameArt";
import { Mark } from "@/components/brand/Mark";
import { Btn, btn } from "@/components/vault/Btn";
import { loadSession, relTime, type SessionSummary } from "@/lib/resume";
import { isUnlocked, type Entitlement } from "@/lib/entitlements";
import type { GameId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tonight")({
  head: () => ({ meta: [{ title: "Tonight — NOCTURNE" }, { name: "description", content: "Dein persönlicher NOCTURNE-Abend." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Tonight,
});

const STATUS: Record<string, string> = { completed: "Abgeschlossen", abandoned: "Beendet", active: "Offen" };

function Tonight() {
  const { user, signOut } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const nav = useNavigate();
  const { hydrate } = useSessions();
  const [resuming, setResuming] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ["sessions", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("game_sessions").select("id, game_id, game_slug, status, scene_number, chapter, updated_at, completed_at, started_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data as SessionSummary[];
    },
  });
  const moments = useQuery({
    queryKey: ["moments", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_moments").select("id, game_id, scene_title, body, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });
  const ents = useQuery({
    queryKey: ["entitlements", uid],
    queryFn: async () => ((await supabase.from("entitlements").select("product_key, status, ends_at").eq("user_id", uid)).data ?? []) as Entitlement[],
  });

  const open = (sessions.data ?? []).filter((s) => s.status === "active");
  const history = (sessions.data ?? []).filter((s) => s.status !== "active").slice(0, 8);
  const last = open[0];

  async function resume(s: SessionSummary) {
    setResuming(s.id);
    const r = await loadSession(s.id);
    setResuming(null);
    if (!r) return;
    hydrate(r.gameId, r.state, s.id, r.revision);
    void nav({ to: "/game/$slug", params: { slug: s.game_slug }, search: { play: 1 } });
  }
  async function deleteMoment(id: string) {
    await supabase.from("saved_moments").delete().eq("id", id);
    void qc.invalidateQueries({ queryKey: ["moments", uid] });
  }
  async function out() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    void nav({ to: "/", replace: true });
  }

  const rec = GAMES_BY_ID["ai-director"];
  return (
    <div className="min-h-dvh safe-x safe-top safe-bottom">
      <header className="mx-auto flex max-w-3xl items-center justify-between pt-3">
        <Link to="/" className="tap flex min-h-11 items-center gap-2.5" aria-label="NOCTURNE Startseite"><Mark className="size-7" /><span className="eyebrow">Tonight</span></Link>
        <a href="#profil" className="tap eyebrow inline-flex min-h-11 items-center">Profil</a>
      </header>

      <main className="mx-auto max-w-3xl pb-16">
        <section className="pt-10" aria-labelledby="tonight-h">
          <p className="eyebrow">{last ? "Weiter, wo ihr wart" : "Heute Nacht"}</p>
          {last ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-line">
              <GameArt art={GAMES_BY_ID[last.game_id as GameId].art} className="h-32" />
              <div className="p-5">
                <p className="font-mono text-xs text-champagne">{GAMES_BY_ID[last.game_id as GameId].number} · {relTime(last.updated_at)}</p>
                <h1 id="tonight-h" className="font-display mt-1 text-5xl leading-[0.95]">{GAMES_BY_ID[last.game_id as GameId].title}</h1>
                <p className="mt-2 text-muted-foreground">Szene {last.scene_number}{last.chapter ? ` · Kapitel ${last.chapter}` : ""}</p>
                <Btn size="lg" className="mt-5 w-full" disabled={resuming === last.id} onClick={() => resume(last)}>{resuming === last.id ? "Wird geladen …" : "Weiterspielen →"}</Btn>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h1 id="tonight-h" className="font-display text-5xl leading-[0.95]">{rec.title}</h1>
              <p className="mt-2 font-display text-xl italic text-primary">{rec.hook}</p>
              <Link to="/game/$slug" params={{ slug: rec.slug }} className={btn({ size: "lg", className: "mt-5 w-full" })}>Director starten <ArrowRight className="size-5" /></Link>
            </div>
          )}
          {open.length > 1 && (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {open.slice(1).map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => resume(s)} className="tap flex min-h-14 w-full items-center justify-between gap-3 text-left">
                    <span className="min-w-0 truncate font-display text-2xl">{GAMES_BY_ID[s.game_id as GameId].title}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">Szene {s.scene_number} <ArrowRight className="ml-1 inline size-4" /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14" aria-labelledby="lib-h">
          <h2 id="lib-h" className="eyebrow">Eure Spiele</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GAMES.map((g) => {
              const unlocked = isUnlocked(g.id, ents.data ?? []);
              return (
                <li key={g.id}>
                  <Link to="/game/$slug" params={{ slug: g.slug }} className="tap group relative block overflow-hidden rounded-xl border border-line">
                    <GameArt art={g.art} className="h-24" />
                    <span className="block p-3">
                      <span className="block font-mono text-xs text-champagne">{g.number}{!unlocked && " · Gesperrt"}</span>
                      <span className={cn("block truncate font-display text-xl leading-tight", !unlocked && "opacity-60")}>{g.title}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="mom-h">
          <h2 id="mom-h" className="eyebrow">Gesicherte Momente</h2>
          {moments.data?.length ? (
            <ul className="mt-4 space-y-4">
              {moments.data.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 border-b border-line pb-4">
                  <div className="min-w-0">
                    <p className="font-display text-2xl leading-snug break-words">„{m.body}“</p>
                    <p className="eyebrow mt-1">{GAMES_BY_ID[m.game_id as GameId]?.title ?? m.game_id}{m.scene_title ? ` · ${m.scene_title}` : ""}</p>
                  </div>
                  <Btn variant="quiet" size="icon" aria-label="Moment löschen" onClick={() => deleteMoment(m.id)}><Trash2 className="size-4" /></Btn>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 max-w-md text-sm text-muted-foreground">Noch nichts gesichert. In NIGHT//ECHO könnt ihr einen gemerkten Satz ausdrücklich als Moment sichern – sonst bleibt alles nur im laufenden Spiel.</p>
          )}
        </section>

        {history.length > 0 && (
          <section className="mt-14" aria-labelledby="hist-h">
            <h2 id="hist-h" className="eyebrow">Letzte Nächte</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {history.map((s) => (
                <li key={s.id} className="flex min-h-14 items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-display text-xl">{GAMES_BY_ID[s.game_id as GameId]?.title}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">{STATUS[s.status]} · {s.scene_number} Szenen · {relTime(s.updated_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Profile uid={uid} email={user!.email ?? ""} onSignOut={out} />
      </main>
    </div>
  );
}

function Profile({ uid, email, onSignOut }: { uid: string; email: string; onSignOut: () => void }) {
  const { players, setPlayers } = useSessions();
  const prof = useQuery({ queryKey: ["profile", uid], queryFn: async () => (await supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle()).data });
  const [name, setName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const value = name ?? prof.data?.display_name ?? "";
  return (
    <section id="profil" className="mt-16 scroll-mt-6 border-t border-line pt-10" aria-labelledby="prof-h">
      <h2 id="prof-h" className="eyebrow">Profil &amp; Vorlieben</h2>
      <p className="mt-2 text-sm text-muted-foreground">{email}</p>
      <form className="mt-5 grid gap-3 sm:grid-cols-3" onSubmit={async (e) => { e.preventDefault(); await supabase.from("profiles").upsert({ id: uid, display_name: value.slice(0, 40), updated_at: new Date().toISOString() }); setSaved(true); }}>
        <label className="text-sm text-muted-foreground">Anzeigename
          <input value={value} maxLength={40} onChange={(e) => { setName(e.target.value); setSaved(false); }} className="mt-1 block min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
        {[0, 1].map((i) => (
          <label key={i} className="text-sm text-muted-foreground">{i === 0 ? "Spieler 1" : "Spieler 2"}
            <input value={players[i]} maxLength={24} onChange={(e) => { const p = [...players] as [string, string]; p[i] = e.target.value; setPlayers(p); }} className="mt-1 block min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
        ))}
        <div className="flex items-center gap-3 sm:col-span-3">
          <Btn type="submit" variant="outline">Speichern</Btn>
          {saved && <span className="text-sm text-champagne" role="status">Gesichert</span>}
        </div>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Spielernamen und Einstellungen werden automatisch für dich gesichert.</p>
      <button type="button" onClick={onSignOut} className="tap mt-10 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut className="size-4" /> Abmelden</button>
    </section>
  );
}