import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { btn, Btn } from "@/components/vault/Btn";
import { useAuth } from "@/lib/auth";
import { useSessions, type SaveStatus } from "@/lib/game/store";
import { supabase } from "@/integrations/supabase/client";
import type { GameId } from "@/lib/game/types";

/** Contextual account prompt — never a wall. The running game stays in memory while signing in. */
export function SaveSheet({ open, onOpenChange, slug }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string }) {
  const back = `/game/${slug}?play=1`;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[2rem] border-line bg-popover safe-x safe-bottom">
        <SheetHeader className="px-0 text-left">
          <p className="eyebrow">Spielstand</p>
          <SheetTitle className="font-display text-4xl font-normal leading-[0.95]">Willst du hier später weitermachen?</SheetTitle>
          <SheetDescription className="text-base">Sichere deinen Spielstand. Mit Account geht es genau bei dieser Szene weiter – auch nach dem Neuladen oder auf einem anderen Gerät.</SheetDescription>
        </SheetHeader>
        <p className="mt-2 text-sm text-muted-foreground">Gesichert wird nur der Spielstand. Was ihr euch sagt oder eintippt, bleibt privat.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/auth" search={{ redirect: back, mode: "signup" }} className={btn({ size: "lg", className: "w-full" })}>Account erstellen &amp; sichern</Link>
          <Link to="/auth" search={{ redirect: back }} className={btn({ variant: "outline", size: "lg", className: "w-full" })}>Ich habe schon einen Account</Link>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Als Gast weiterspielen</Btn>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SaveBadge({ status, onGuest }: { status: SaveStatus; onGuest: () => void }) {
  if (status === "guest") {
    return <button type="button" onClick={onGuest} className="tap min-h-6 font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline">Als Gast · sichern</button>;
  }
  const map = { idle: null, saving: [Loader2, "Wird gesichert …"], saved: [Check, "Gesichert"], error: [CloudOff, "Nicht gesichert"] } as const;
  const v = map[status];
  if (!v) return null;
  const [Icon, label] = v;
  return (
    <span role="status" className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
      <Icon className={status === "saving" ? "size-3 animate-spin motion-reduce:animate-none" : "size-3"} aria-hidden /> {label}
    </span>
  );
}

/** Explicit opt-in: stores exactly this one sentence as a Saved Moment. */
export function SaveMomentButton({ gameId, text, title }: { gameId: GameId; text: string; title: string }) {
  const { user } = useAuth();
  const { dbIds } = useSessions();
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  if (!user) return null;
  if (state === "done") return <p className="mt-2 text-xs text-champagne" role="status">Als Moment gesichert – in Tonight löschbar.</p>;
  return (
    <button
      type="button"
      disabled={state === "busy"}
      onClick={async () => {
        setState("busy");
        const { error } = await supabase.from("saved_moments").insert({ user_id: user.id, game_id: gameId, session_id: dbIds[gameId] ?? null, body: text.slice(0, 500), scene_title: title.slice(0, 120) });
        setState(error ? "err" : "done");
      }}
      className="tap mt-2 min-h-9 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      {state === "err" ? "Nochmal versuchen" : "Diesen Moment dauerhaft sichern"}
    </button>
  );
}