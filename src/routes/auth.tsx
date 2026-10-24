import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Btn } from "@/components/vault/Btn";
import { Mark } from "@/components/brand/Mark";

type Mode = "signin" | "signup" | "forgot";

/** Only same-origin paths are allowed as post-login destinations. */
export function safeRedirect(r: unknown): string {
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/tonight";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; mode?: Mode } => ({
    ...(typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
    ...(s["mode"] === "signup" || s["mode"] === "forgot" ? { mode: s["mode"] as Mode } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Anmelden — NOCTURNE" },
      { name: "description", content: "Melde dich bei NOCTURNE an, um Spielstände zu sichern und später weiterzuspielen." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const input = "mt-1 block min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AuthPage() {
  const search = Route.useSearch();
  const to = safeRedirect(search.redirect);
  const nav = useNavigate();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (ready && user) void nav({ to, replace: true });
  }, [ready, user, to, nav]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/tonight` } });
        if (error) throw error;
        if (!data.session) setMsg({ kind: "ok", text: "Fast geschafft: Wir haben dir einen Bestätigungslink geschickt. Danach bist du angemeldet." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMsg({ kind: "ok", text: "Wenn es ein Konto mit dieser Adresse gibt, ist der Link unterwegs." });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setMsg({ kind: "err", text: /invalid login/i.test(m) ? "E-Mail oder Passwort stimmen nicht." : /already registered/i.test(m) ? "Diese E-Mail hat schon ein Konto. Melde dich an." : /not allowed|invalid.*email/i.test(m) ? "Diese E-Mail-Adresse kann keine Mails empfangen. Bitte nutze eine echte Adresse." : /rate limit/i.test(m) ? "Zu viele Versuche. Warte kurz und versuch es dann nochmal." : /password/i.test(m) ? "Das Passwort braucht mindestens 6 Zeichen." : "Das hat nicht geklappt. Versuch es nochmal." });
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Willkommen zurück." : mode === "signup" ? "Sichere eure Nächte." : "Passwort vergessen?";
  return (
    <div className="flex min-h-dvh flex-col safe-x safe-top safe-bottom">
      <Link to="/" className="tap -ml-2 inline-flex min-h-11 items-center gap-2 self-start px-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> NOCTURNE</Link>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <Mark className="size-10 text-champagne" />
        <h1 className="font-display mt-6 text-5xl leading-[0.95]">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          {mode === "forgot" ? "Wir schicken dir einen Link zum Zurücksetzen." : "Mit Account spielt ihr später genau dort weiter, wo ihr aufgehört habt – auch auf einem anderen Gerät."}
        </p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm text-muted-foreground">E-Mail
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </label>
          {mode !== "forgot" && (
            <label className="text-sm text-muted-foreground">Passwort
              <input type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </label>
          )}
          {msg && <p role={msg.kind === "err" ? "alert" : "status"} className={msg.kind === "err" ? "text-sm text-destructive" : "text-sm text-champagne"}>{msg.text}</p>}
          <Btn size="lg" type="submit" disabled={busy} className="mt-2 w-full">
            {busy ? "Einen Moment …" : mode === "signin" ? "Anmelden" : mode === "signup" ? "Account erstellen" : "Link senden"}
          </Btn>
        </form>
        <div className="mt-6 flex flex-col items-start gap-1 text-sm">
          {mode !== "signin" && <button type="button" onClick={() => { setMode("signin"); setMsg(null); }} className="tap min-h-11 text-muted-foreground underline-offset-4 hover:underline">Ich habe schon einen Account</button>}
          {mode !== "signup" && <button type="button" onClick={() => { setMode("signup"); setMsg(null); }} className="tap min-h-11 text-muted-foreground underline-offset-4 hover:underline">Neu hier? Account erstellen</button>}
          {mode === "signin" && <button type="button" onClick={() => { setMode("forgot"); setMsg(null); }} className="tap min-h-11 text-muted-foreground underline-offset-4 hover:underline">Passwort vergessen</button>}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">Gesichert wird der Spielstand – nicht, was ihr euch sagt. Intime Antworten bleiben privat, außer du sicherst einen Moment ausdrücklich.</p>
      </main>
    </div>
  );
}