# NOCTURNE / GameNights

Aktuelle React-/TanStack-Website und kanonische Spiel- und Commerce-Cores in einem Repository.

```sh
npm ci
npm test
npm run build
npm run dev
```

Core-Pakete unter `packages/` separat mit `npm test` prüfen. Änderungen an GANG und Commerce zuerst dort vornehmen und mit `node scripts/vendor-cores.mjs` in die Website übernehmen. Die generierten Kopien nicht manuell bearbeiten.

Der vollständige Umsetzungsstand einschließlich noch offener Punkte steht in [docs/AUDIT_IMPLEMENTATION.md](docs/AUDIT_IMPLEMENTATION.md). Datenbankmigrationen unter `supabase/migrations/`, SQL-Regressionen unter `supabase/tests/`.

Lokale Entwicklung benötigt die projektbezogenen Supabase-Umgebungsvariablen. Schlüssel gehören nicht ins Repository. AI läuft nur mit bestätigtem bezahltem Zugang, aktivierter globaler Budgetfreigabe und konservativ konfigurierter `AI_DIRECTOR_RESERVATION_MICROUSD`; andernfalls bleibt der lokale Director verfügbar.

Die Website wird über das bestehende Lovable-Projekt integriert. Dieser Branch wird nicht über GitHub Pages veröffentlicht.
