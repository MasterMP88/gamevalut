# Zahlungsabnahme vor Veröffentlichung

Stand 26.10.2026: verbundenes Stripe-Livekonto **GameNights**, `acct_1UUBlYRGuzgtZTcB`.
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
1. Die Commerce-Reconciliation und `20261026090954_checkout_reservations.sql` sind nach erfolgreichen transaktionalen Fixtures am 26.10.2026 dauerhaft angewendet. Die zugehörige neue App muss noch in Lovable integriert werden. Bei einer anderen Datenbank mit bestehenden Stripe-Kunden zuerst deren genaue Kaufquellen übernehmen.
2. Server-Konfiguration verifizieren: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` und der bereits verwendete Supabase-Service-Role-Zugang. Zusätzlich bleibt `NOCTURNE_CHECKOUT_ENABLED` bis zur erfolgreichen Sandbox-/Webhook-Abnahme aus; erst danach auf `true` setzen. Keine Schlüssel in Quelltext, VITE-Variablen oder Chat-Ausgaben.
3. Nach Integration einen signierten Snapshot-Webhook auf `https://nocturne-games-for-two.lovable.app/api/public/stripe/webhook` einrichten. Aktuelle freigegebene Stripe-API-Version verwenden und prüfen. Acht Events:
   - checkout.session.completed
   - checkout.session.async_payment_succeeded
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - charge.refunded
   - charge.dispute.created
   - charge.dispute.closed
4. Den ausgegebenen Signing-Secret ausschließlich im Server-Secret-Store hinterlegen. Erst danach Zustellung und Berechtigung prüfen. Derzeit gibt es über den verfügbaren Lovable-Connector keinen direkten Secret-Write-Endpunkt; die Editor-Sitzung ist inzwischen angemeldet. Die Secrets-Liste enthält derzeit weder `STRIPE_SECRET_KEY` noch `STRIPE_WEBHOOK_SECRET`. Der geheime API-Schlüssel muss durch den Betreiber sicher eingetragen werden.
5. Stripe-Sandbox-Durchlauf mit Testkauf, doppelter Zustellung, Storno/Erstattung und Wiederherstellung. Keine echte Kundenbelastung für Tests auslösen. Aufgezeichnete Fixtures sind kein Ersatz für die Betriebsabnahme.

Die neue Kaufstrecke darf nicht als produktionsfertig bezeichnet werden, bevor diese Verbindung nachgewiesen ist.

## Technische Quellen
- https://docs.stripe.com/webhooks — Reihenfolge nicht garantiert; Sekunden-Zeitstempel sind kein Versionsschlüssel.
- Stripe SDK 23, installierte Typen: Checkout Sessions, InvoicePayments, Subscriptions, Charges, Disputes.


## Parallele Checkouts und Wiederaufnahme

- Eine service-only Reservierung pro Account hält die ursprünglichen Checkout-Parameter fest. Parallele Tabs und wiederholte Requests nutzen denselben Stripe-Idempotency-Key.
- Ein offener Vorgang wird erneut geöffnet. Ein anderes Angebot startet bis zum Ablauf/Abschluss dieses Vorgangs keinen zweiten Checkout.
- Ein abgeschlossener Vorgang wartet auf die signierte Freischaltung. Erst ein nachgewiesener Grant und eine erneute Prüfung aktueller Rechte erlauben einen späteren Ersatzkauf.
- Ein abgelaufener Stripe-Vorgang kann ersetzt werden. Bei unbekanntem Ausgang nach 23 Stunden wird keine womöglich bereits bereinigte Idempotency-ID erneut verwendet: Operations muss den tatsächlichen Stripe-Status auflösen.
- Bei einem ungeklärten Vorgang niemals blind die Reservierung löschen. Stripe anhand der Idempotency-ID, Metadaten und des Accounts prüfen; die konkrete Session-ID nachtragen und ihren Status abgleichen. Erst ein nachweislich abgelaufener Vorgang kann freigegeben werden.
- Die Reservierung enthält nur den letzten ungeklärten Vorgang; sie wird beim Ersatz überschrieben und bei Accountlöschung kaskadiert. Sie ist weder über Browser-RLS noch über öffentliche RPC-Rechte lesbar.
- Die Rückkehrseite meldet vor der echten Freischaltung keine erhaltene Zahlung, beendet automatisches Polling nach zwei Minuten und bietet erneutes Prüfen an.

## Betriebsprüfung (nur privilegiert)

```sql
select status, count(*) from public.stripe_webhook_events group by status;
select count(*) as stale_events from public.stripe_webhook_events
 where status='processing' and started_at < now()-interval '4 minutes';
select count(*) as unknown_checkouts from public.stripe_checkout_attempts
 where session_id is null and created_at < now()-interval '23 hours';
```

Fehlerhafte Events gezielt nach Behebung bei Stripe erneut zustellen; keine selbst erfundenen Event- oder Entitlement-Zeilen eintragen. Das öffentliche `/api/public/health` bestätigt nur den Release-Stand und die konfigurierte Checkout-Freigabe, nicht erfolgreiche Zahlungszustellung.
