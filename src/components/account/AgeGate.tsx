import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Btn } from "@/components/vault/Btn";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const KEY = "nocturne.age18";

/** Remembers the 18+ confirmation on this device (a flag, never any game content). */
export function useAgeConfirmed(): [boolean, () => void] {
  const { user } = useAuth();
  const [ok, setOk] = useState(false);
  useEffect(() => { try { setOk(localStorage.getItem(KEY) === "1"); } catch { /* private mode */ } }, []);
  const confirm = useCallback(() => {
    setOk(true);
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    if (user) void supabase.from("profiles").update({ age_confirmed_at: new Date().toISOString() }).eq("id", user.id).then(() => undefined);
  }, [user]);
  return [ok, confirm];
}

export function AgeGate({ onConfirm, onBack }: { onConfirm: () => void; onBack: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col safe-x safe-top safe-bottom">
      <button type="button" onClick={onBack} className="tap inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Zurück</button>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <p className="eyebrow">Kurz vorab</p>
        <h1 className="font-display mt-4 text-5xl leading-[0.95]">Seid ihr beide 18 oder älter?</h1>
        <p className="mt-4 text-muted-foreground">NOCTURNE ist für einvernehmliche Erwachsene. Manche Szenen sind flirty oder sinnlich – alles optional, Skip ist immer da.</p>
        <div className="mt-10 flex flex-col gap-2">
          <Btn size="lg" onClick={onConfirm}>Ja, wir sind beide 18+</Btn>
          <Btn variant="ghost" onClick={onBack}>Nein</Btn>
        </div>
      </main>
    </div>
  );
}
