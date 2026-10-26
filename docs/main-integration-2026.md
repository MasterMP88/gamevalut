# Integration in main — 26.10.2026

Der Audit-PR #31 enthält die vollständige React-/TanStack-App, neun Paarspiele, 16 GANG-Spiele, Couch-Modus, DJ-Musikmodus und die erweiterten Inhaltsbanken. Vor dieser Integration lag auf `main` (`49938e0`) lediglich der ältere statische Player samt Core-Paketen. „Im Repo umgesetzt“ bedeutete bisher deshalb nicht „auf main“ oder „auf der veröffentlichten Website“.

## Verbindliche Grenzen

| Stand | Bedeutung | Nachweis |
|---|---|---|
| Feature-Branch | Änderung vorbereitet und getestet | Commit, lokale Tests, PR-CI |
| `main` | Geprüfter App- und Core-Quellcode zusammengeführt | Gemergter PR #31 und Commit auf main |
| Lovable-Vorschau | Bestehendes Projekt hat den zusammengeführten Code geladen | Dateivergleich und Browserprüfung im Projekt |
| Live-Website | Geprüfte Vorschau veröffentlicht | Deployment-Ergebnis und Prüfung der öffentlichen URL |

Ein erfolgreicher GitHub-Pages-Deploy prüft nur den älteren statischen Player. Die React-App nutzt Serverfunktionen und kann nicht als statisches Repository-Verzeichnis ausgeliefert werden.

## Vorbereitung der Zusammenführung

- Root-Lockfile ohne lokale Workspace-Links neu erzeugen und mit einer frischen `npm ci`-Installation prüfen; App-CI löscht den Lockfile nicht mehr.
- GitHub Pages aus `.pages-public` statt dem Repository-Root veröffentlichen. Explizite Auswahl: statischer Einstieg, Browsermodule/-assets und kompilierte GANG-Core-JavaScript-Dateien.
- CI prüft die ausgewählte Dateistruktur und alle relativen JavaScript-Imports. SQL, App-Quellen, Tests, Source Maps und installierte Pakete gehören nicht in dieses Artefakt.
- App-, Core-, TypeScript- und Build-Gates auf dem integrierten Stand prüfen, danach #31 mit erhaltener Git-Historie in main übernehmen.
- Änderungen in Lovable nicht mit einer alten Komplettkopie überschreiben. Der zuletzt geprüfte Lovable-Stand `22c724d` besitzt zusätzlich einen separaten Designentwurf unter `/design/experience-2026`; dieser wurde hier weder zur neuen Produktoberfläche erklärt noch gelöscht.

## Noch eigenständig abzunehmen

- Lovable-Projekteinstellungen: GitHub-Ziel und synchronisierter Branch müssen im bestehenden Projekt bestätigt werden. Der Connector liest Dateien, bietet aber keine Einstellung der GitHub-Verbindung. Beim Browsercheck war das private Projekt ohne Anmeldung nicht zugänglich.
- Stripe: ausstehende Commerce-Migration, sichere Server-Secrets, Webhook-Zustellung und Sandbox-Kauf/Refund. Keine echte Kundenbelastung für Prüfungen. Details in `commerce-operations.md`.
- MUSIC DROP: DJ bedient seine Musik-App separat. Keine behauptete direkte Spotify-/Apple-Music-Verbindung; Anbieterbedingungen und echte Aktivierung bleiben eigene Voraussetzungen.
- Reale Mobilgeräte, TV-Lesbarkeit, Kamera/Audio, Reconnect/Hostwechsel, 99-Geräte-Last und menschliche Spieleabende bleiben gesonderte Nachweise.

Für diese Integration werden keine Lovable-Build-Credits und keine neuen Repositories oder Projekte verwendet.

## Verifikation des Integrationsstands

Frische Installation mit npm 11.9.0 über den neu erzeugten Lockfile erfolgreich. 311 App-Tests und 160 GANG-Core-Tests, TypeScript, Produktionsbuild, kanonischer Core-Abgleich und Pages-Artefaktprüfung bestanden. Erneute Browserprüfung mit den frisch installierten Abhängigkeiten: 30 Sessions / 90 Runden / 0 Laufzeitfehler auf 390, 1440 und 1920 Pixeln. Bericht: [main-integration-2026-10-26.json](qa/main-integration-2026-10-26.json).
