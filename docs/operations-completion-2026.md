# Betriebsfunktionen — 26.10.2026

Dieser Schritt baut auf dem bereits gemergten PR #31 und `main`-Stand `52f5d8e` auf. Er veröffentlicht die Lovable-Website noch nicht.

## Implementiert

- Serverseitige gemeinsame Checkout-Reservierung pro Account, eingefrorene Stripe-Parameter und Idempotency-Key. Parallele Tabs, verlorene Antworten, abgelaufene Sessions und noch nicht freigeschaltete Zahlungen sind berücksichtigt. Ein ungeklärter alter Vorgang erzeugt keinen neuen Kauf.
- Checkout bleibt ohne beide Stripe-Secrets und die ausdrückliche Betriebsfreigabe `NOCTURNE_CHECKOUT_ENABLED=true` geschlossen. Die Rückkehrseite behauptet keine erhaltene Zahlung, bevor der Zugang existiert; Polling ist begrenzt und wiederholbar.
- Auth-Start-Race behoben: Abmeldung/Accountwechsel gewinnt gegen eine verspätete Startantwort. Capability-Tokens, lokale Couch-Recovery und GANG-Vorhersagen werden beim Identitätswechsel gelöscht; laufende In-Memory-Ansichten werden neu aufgebaut. Die erste Gast→Account-Übernahme bleibt erhalten.
- Couch-Abende stellen Fragenstapel, Mix-Position, Teams, Punkte und Timer nach Neuladen wieder her. Laufende Runden öffnen pausiert. Der Zwischenstand ist zwölf Stunden wiederherstellbar, liegt nur im Tab und wird beim bewussten Ausstieg gelöscht. Musikdateien werden nicht gespeichert: dieselben Dateien werden anhand lokaler Fingerprints wieder verbunden, ohne Deck/Punkte zurückzusetzen. Unbekannte Felder und defekte oder inkompatible Spielstände werden verworfen.
- AFTER DARK erlaubt den dauerhaften Wechsel in den Zuschauerstatus für den Rest dieses Spiels. Unveröffentlichte eigene Beiträge verschwinden aus der kanonischen Runde; spätere Phasen verlangen keine Eingaben mehr. Unter zwei Teilnehmenden endet das Spiel. Der eigene Wunsch bleibt im Mehrgeräte-Raum über Reload und Hostübernahme erhalten. Die Datenbank blockiert alte Veröffentlichungen, die einen gleichzeitig eingegangenen Ausstieg noch nicht berücksichtigen. Bereits öffentlich geteilte Beiträge lassen sich nicht zurückholen.
- Deployment-Kennung unter `/api/public/health`, reproduzierbarer HTTP-Check ohne Zahlung, SQL-Betriebsabfragen sowie ein konkreter Inhaltsrelease- und Realgeräte-/Spielabend-Prozess.

## Datenbank

Nach erfolgreicher BEGIN/ROLLBACK-Abnahme dauerhaft angewendet:

1. `20261025114820_audit_commerce_reconciliation.sql`
2. `20261026090954_checkout_reservations.sql`
3. `20261026091917_after_dark_withdrawal.sql`

Danach alle acht vorhandenen SQL-Fixtures gemeinsam gegen das aktive Schema erneut erfolgreich in BEGIN/ROLLBACK geprüft. Alle Testidentitäten und Testdaten wurden zurückgerollt. Anschließender Status: 0 Stripe-Events, 0 Stripe-Entitlements, 0 Checkout-Reservierungen, 0 Zuschaueranfragen. Die bisherige Raum- und Paar-Steuerung besteht ebenfalls weiterhin.

## Noch nicht erledigt

- **Lovable-Integration:** keine Git-Verbindung vorhanden. Die angemeldete Oberfläche bietet nur ein neu erstelltes Synchronisations-Repository an; bestehende Repositories lassen sich nicht importieren. `MasterMP88` ist als GitHub-Konto bereits verbunden. Kein neues Repo, keine neue Berechtigung, kein Deployment und keine Lovable-Credits ausgelöst. Der neue Stand muss in dasselbe Projekt gelangen; der isolierte, fehlerhafte Designprototyp wird nicht ungeprüft veröffentlicht.
- **Zahlungsbetrieb:** weder `STRIPE_SECRET_KEY` noch `STRIPE_WEBHOOK_SECRET` im Secret-Store; kein verifizierter Webhook und keine Sandbox-Abnahme. Vor dem Einschalten des Checkouts fehlen reale signierte Zustellung, erfolgreicher Testkauf, verzögerte Zahlart, doppelte Zustellung, Refund, Dispute und Portalprüfung.
- **Betreiber-/Vertragsseiten:** tatsächlicher Anbietername, ladungsfähige Anschrift, Supportkontakt und erforderliche Vertrags-/Datenschutzangaben fehlen. Technische Datenerklärung ist implementiert, vollständige rechtliche Seiten sind nicht erfunden oder abgenommen.
- **Musik/AI:** echte Provider-Voraussetzungen und zulässige Nutzung fehlen; dedizierte FIRST BEAT/TIME DROP-Oberflächen und AI-Kostenfreigabe sind weiter inaktiv. DJ- und Dateimodus bleiben nutzbar.
- **Weitere Produktarbeit:** separater Smartphone-Ferncontroller für Couch/TV und freiwillige Produkttelemetrie sind noch nicht implementiert. Der bestehende Everyone-In-Big-Screen ist eine andere Spielweise. Für monatliche Drops ist der dokumentierte Releaseprozess vorhanden, aber noch keine dauerhaft verantwortete Redaktion oder automatisch gelieferter Monatsinhalt.
- **Abnahme:** echte iPhone-/Android-/TV-/Kameratests, 99 gleichzeitige Netzgeräte und wiederholte menschliche Spieleabende sind weiterhin offen. Automatisierte maximale Spielbesetzung ist kein Netzlast- oder Spaßnachweis.

## Nachweise

- `docs/qa/operations-2026-10-26.json`: 30 Chromium-Partien / 90 Runden plus drei Reload-Szenarien bei 390/1440/1920 px; keine Laufzeitfehler. Tatsächliche lokale WAV-Wiedergabe und unabhängiger DJ-Modus sind weiterhin geprüft.
- `docs/qa/deployment-check-2026-10-26.json`: vorhandene Website antwortet, verwirft unsignierte Webhooks, hat aber noch nicht die neue Privatsphäre-Seite oder Release-Kennung. Der Check schlägt daher erwartungsgemäß fehl; keine Behauptung einer synchronisierten Veröffentlichung.
- Siehe `docs/commerce-operations.md` und `docs/release-and-playtest-2026.md` für die konkreten Anschluss- und Abnahmeschritte.

Lokaler Abschlussstand: **331 App-Tests**, **163 GANG-Core-Tests**, TypeScript und Produktionsbuild bestanden. Fokussiertes ESLint: 0 Fehler; bestehender Fast-Refresh-Hinweis am Auth-Hook. Keine echte Kundenbelastung, kein neuer Stripe-Endpoint und keine Lovable-Credits.


Die Produktionsvorschau startet den erzeugten Cloudflare-Worker jetzt direkt mit einer fest versionierten Wrangler-CLI. Der vorherige Vite-Preview-Befehl suchte eine nicht erzeugte `dist/server/server.js`. Die lokale Sandbox verweigert `uv_interface_addresses`; die Worker-Abnahme läuft deshalb zusätzlich im bestehenden App-CI-Workflow auf dem GitHub-Runner, ausschließlich mit Dummy-Public-Konfiguration und ohne Stripe-Schlüssel.
