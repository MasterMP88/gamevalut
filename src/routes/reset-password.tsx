import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Btn } from "@/components/vault/Btn";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Neues Passwort — NOCTURNE" }, { name: "description", content: "Neues Passwort für deinen NOCTURNE-Account festlegen." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr("Der Link ist abgelaufen oder ungültig. Fordere einen neuen an.");
    void nav({ to: "/tonight", replace: true });
  }
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center safe-x">
      <h1 className="font-display text-5xl">Neues Passwort.</h1>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm text-muted-foreground">Neues Passwort
          <input type="password" required minLength={6} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 block min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Btn size="lg" type="submit" disabled={busy}>{busy ? "Einen Moment …" : "Passwort speichern"}</Btn>
      </form>
    </main>
  );
}
