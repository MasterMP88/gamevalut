import { PrivacyFacts } from "./PrivacyFacts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ReactNode } from "react";

export function PrivacyDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl border-line bg-popover">
        <DialogHeader>
          <p className="eyebrow">Privatsphäre &amp; Director</p>
          <DialogTitle className="font-display text-4xl font-normal">Ihr entscheidet, was bleibt.</DialogTitle>
          <DialogDescription className="sr-only">Was NOCTURNE speichert, was privat bleibt und was der Director verarbeitet.</DialogDescription>
        </DialogHeader>
        <PrivacyFacts />
        <a href="/privatsphaere" className="tap inline-flex min-h-12 items-center text-sm underline">Datennutzung auf eigener Seite ansehen →</a>
      </DialogContent>
    </Dialog>
  );
}
