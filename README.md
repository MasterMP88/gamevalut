# NOCTURNE / GameNights

Aktuelle React-/TanStack-Website und kanonische Spiel- und Commerce-Cores in einem Repository.

Entwicklung mit Node.js 22 und npm 11; die CI verwendet denselben versionierten Lockfile-Stand.

```sh
npm ci
npm test
npm run build
npm run dev
```

Core-Pakete unter `packages/` separat mit `npm test` prüfen. Änderungen an GANG und Commerce zuerst dort vornehmen und mit `node scripts/vendor-cores.mjs` in die Website übernehmen. Die generierten Kopien nicht manuell bearbeiten.

Der vollständige Umsetzungsstand einschließlich noch offener Punkte steht in [docs/AUDIT_IMPLEMENTATION.md](docs/AUDIT_IMPLEMENTATION.md). Datenbankmigrationen unter `supabase/migrations/`, SQL-Regressionen unter `supabase/tests/`.

Lokale Entwicklung benötigt die projektbezogenen Supabase-Umgebungsvariablen. Schlüssel gehören nicht ins Repository. AI läuft nur mit bestätigtem bezahltem Zugang, aktivierter globaler Budgetfreigabe und konservativ konfigurierter `AI_DIRECTOR_RESERVATION_MICROUSD`; andernfalls bleibt der lokale Director verfügbar.

`main` ist der Integrationsstand für App-Quellcode und Core-Pakete. Ein Merge auf `main` ist keine Veröffentlichung der React-Website: Sie benötigt Server-Hosting im bestehenden [Lovable-Projekt](https://lovable.dev/projects/155bbb23-db01-432e-a4f3-287aa8f3e015). Dort müssen Quellcode-Synchronisierung, Vorschau und Veröffentlichung gesondert geprüft werden.

GitHub Pages veröffentlicht weiterhin nur den älteren statischen Einstieg `index.html`, `gang/` und das kompilierte GANG-Core-Paket. `scripts/package-pages.mjs` erstellt dafür eine explizite Dateiauswahl; App-Quellen, SQL, Tests, Source Maps und `node_modules` werden nicht mit hochgeladen. Dieser statische Player ist kein Nachweis für den Stand der React-Website.

Offene Betriebsabnahmen blockieren die jeweilige Produktfreigabe, nicht die Übernahme geprüften Quellcodes in `main`. Insbesondere Zahlungsstrecke, Musikdienste und Live-Veröffentlichung dürfen erst nach ihrer eigenen Verifikation als verfügbar bezeichnet werden. Siehe [Integrations- und Veröffentlichungsstand](docs/main-integration-2026.md).
