# Zahlungsabnahme vor Veröffentlichung

Stand 25.10.2026: verbundenes Stripe-Livekonto **GameNights**, `acct_1UUBlYRGuzgtZTcB`.
Night Pass 6,99 € und Monthly 9,99 €; der parallel beschlossene öffentliche Jahrestarif beträgt 59,99 €. Der bisherige 49,99-€-Tarif bleibt für bestehende Quellen anerkannt. Night Pass umfasst Paarspiele und GANG-Hosting.

## Verifiziert
- `GET /v1/webhook_endpoints`: keine Endpunkte.
- `GET /v2/core/event_destinations`: keine Event-Destinations.
- Datenbank: null Stripe-Entitlements, null Stripe-Abonnements, null gespeicherte Stripe-Ereignisse.
- Signaturprüfung erfolgt vor Datenbankzugriff. Die Rückkehr von Checkout gewährt keinen Zugang.
- Die neue Reconciliation fragt innerhalb einer exklusiven Source-Lease den aktuellen Stripe-Zustand ab. Event-Zeitstempel werden nicht als Reihenfolge verwendet.
- Ein event_id wird idempotent verarbeitet. Gleichzeitig laufende Zustellungen werden mit Retry beantwortet; eine abgebrochene Verarbeitung kann nach vier Minuten übernommen werden. Alte Worker dürfen eine fremde Lease nicht überschreiben.
- Käufe erhalten jeweils eine eigene Grant-Quelle. Eine spätere Erstattung eines alten Kaufs entzieht keinen separat gültigen neuen Pass. Pass-Laufzeit wird durch doppelte Ereignisse nicht verlängert. Planwechsel räumen veraltete Planrechte atomar auf.
- Vollständige Erstattung sperrt den betroffenen Zugang, teilweise Erstattung nicht automatisch. Offene/verlorene Zahlungsstreitfälle sperren; ein gewonnener Streitfall stellt noch gültigen Zugang wieder her. Bei Abos zählt die aktuelle Rechnung, nicht eine alte erstattete Periode.

## Noch erforderliche Betriebsanbindung
1. Migration `20261025114820_audit_commerce_reconciliation.sql` mit der neuen App integrieren. Sie wurde zusammen mit `supabase/tests/commerce_reconciliation.sql` in BEGIN/ROLLBACK gegen die Projekt-DB geprüft, ist aber noch **nicht dauerhaft angewendet**. Ihre Vorbedingung blockiert eine unbemerkte Migration bestehender Stripe-Kundendaten; bei zwischenzeitlichen Käufen zuerst deren exakte Quellen übernehmen.
2. Server-Konfiguration verifizieren: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` und der bereits verwendete Supabase-Service-Role-Zugang. Keine Schlüssel in Quelltext, VITE-Variablen oder Chat-Ausgaben.
3. Nach Integration einen signierten Snapshot-Webhook auf `https://nocturne-games-for-two.lovable.app/api/public/stripe/webhook` einrichten. Aktuelle freigegebene Stripe-API-Version verwenden und prüfen. Acht Events:
   - checkout.session.completed
   - checkout.session.async_payment_succeeded
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - charge.refunded
   - charge.dispute.created
   - charge.dispute.closed
4. Den ausgegebenen Signing-Secret ausschließlich im Server-Secret-Store hinterlegen. Erst danach Zustellung und Berechtigung prüfen. Derzeit gibt es über den verfügbaren Lovable-Connector keinen direkten Secret-Write-Endpunkt; die Editor-Sitzung war nicht angemeldet.
5. Stripe-Sandbox-Durchlauf mit Testkauf, doppelter Zustellung, Storno/Erstattung und Wiederherstellung. Keine echte Kundenbelastung für Tests auslösen. Aufgezeichnete Fixtures sind kein Ersatz für die Betriebsabnahme.

Die neue Kaufstrecke darf nicht als produktionsfertig bezeichnet werden, bevor diese Verbindung nachgewiesen ist.

## Technische Quellen
- https://docs.stripe.com/webhooks — Reihenfolge nicht garantiert; Sekunden-Zeitstempel sind kein Versionsschlüssel.
- Stripe SDK 23, installierte Typen: Checkout Sessions, InvoicePayments, Subscriptions, Charges, Disputes.
