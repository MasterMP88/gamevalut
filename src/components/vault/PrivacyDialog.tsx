import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ReactNode } from "react";

export function PrivacyDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl border-line bg-popover">
        <DialogHeader>
          <p className="eyebrow">Privacy &amp; AI</p>
          <DialogTitle className="font-display text-4xl font-normal">Gesichert wird der Spielstand. Nicht, was ihr euch sagt.</DialogTitle>
          <DialogDescription className="sr-only">Wie NOCTURNE mit euren Antworten umgeht.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
          <li><span className="text-foreground">Als Gast:</span> Der Spielstand lebt nur in diesem Tab. Neu laden = alles weg. Ausnahme: Tippst du „Account erstellen &amp; sichern“, merkt sich dieser Browser den Spielstand ohne Antworten bis zu 2 Stunden, damit er nach der E-Mail-Bestätigung übernommen wird.</li>
          <li><span className="text-foreground">Mit Account:</span> Wir sichern nur den Spielstand – Spiel, Szene, Punkte, Einstellungen, Namen. Eure getippten Antworten und Memory-Anker werden nicht automatisch gespeichert.</li>
          <li><span className="text-foreground">Momente sichern:</span> Nur wenn du ausdrücklich „Diesen Moment dauerhaft sichern“ tippst. In Tonight jederzeit löschbar.</li>
          <li><span className="text-foreground">Session Archive.</span> In NIGHT//ECHO seht ihr jeden gemerkten Satz und könnt ihn sofort löschen.</li>
          <li><span className="text-foreground">Director (KI).</span> Nur im Spiel 08. Er bekommt eure Namen, Einstellungen, Titel der letzten Szenen und höchstens 6 kurze, nicht-private Anker – nie das ganze Gespräch. Private Anker und gelöschte Anker werden nie gesendet.</li>
          <li><span className="text-foreground">Offline?</span> Dann spielt die lokale Bibliothek nahtlos weiter.</li>
          <li><span className="text-foreground">Consent first.</span> Jede körperliche Aufgabe ist optional und gegenseitig. Skip kostet nie etwas.</li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}