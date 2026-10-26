# Release- und Spielabnahme

## Nach jedem Deployment

`node scripts/check-deployment.mjs https://nocturne-games-for-two.lovable.app`

Der Check prüft die Release-Kennung, öffentliche Seiten und die Zurückweisung eines unsignierten Stripe-Requests. Er erzeugt keine Zahlung und keinen Zugang. `--expect-payments` zusätzlich erst nach erfolgreicher Zahlungsabnahme verwenden. Ein grüner HTTP-Check beweist keine signierte Zustellung und keinen Spielspaß.

Der Checkout benötigt `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` und `NOCTURNE_CHECKOUT_ENABLED=true`. Das Flag bleibt bis zur erfolgreichen Abnahme aus. Die Release-Kennung verhindert, dass ein erfolgreicher Test einer alten Website mit dem geprüften Git-Stand verwechselt wird.

## Monatlicher Inhalts-Drop

1. Ausgabe, verantwortliche Redaktion, betroffene Spiele und Zielprofile im PR benennen. Pro Spiel den knappsten Pool aus `docs/content-capacity-2026.md` zuerst bearbeiten. Keine reine Umformulierung einer vorhandenen Frage als neuen Inhalt zählen.
2. Neue Inhalte mit stabilen, noch unbenutzten IDs hinzufügen. Konflikte, zurückgezogene Inhalte und History-Migrationen ausdrücklich dokumentieren. Gemeinsame Pools nicht als mehrere unabhängige Vorräte verkaufen.
3. Zwei redaktionelle Durchgänge: Verständlichkeit beim Vorlesen und Unterschied zu vorhandenen Karten; danach Regeln, Freiwilligkeit, Intensitätsgrenzen, Faktenquellen und tatsächlich bedienbare Mechaniken prüfen.
4. `CONTENT_VERSION` für geänderte Paar-Inhalte erhöhen; `node scripts/vendor-cores.mjs` für kanonische Gruppen-Inhalte. Tests nicht abschwächen, um neue Karten durchzulassen.
5. `npm test`, alle betroffenen Core-Tests, TypeScript, Build und Browser-Regression laufen lassen. `src/test/replay-capacity.test.ts` erzeugt den Kapazitätsbericht; neue Zahlen anhand derselben Maximalkonfiguration vergleichen.
6. Eine Blindrunde mit Personen durchführen, die die Karten nicht verfasst haben. Änderungen erst danach freigeben. Ergebnis und problematische Karten im PR festhalten; keine privaten Antworten protokollieren.
7. Quelle mergen, Website integrieren, Deployment-Check durchführen und erst dann den Drop als verfügbar ankündigen.

Dies ist ein ausführbarer Redaktionsprozess, keine automatisch erzeugte monatliche Lieferung. Ein echter monatlicher Erscheinungstermin braucht eine benannte Redaktion und deren Freigabe.

## Reale Geräte und Wiederholungsabende

Je eine Prüfung auf aktuellem iPhone/Safari und Android/Chrome; zusätzlich Laptop→TV und zwei unterschiedliche Mobilgeräte im selben Raum. Dokumentieren: Gerät/OS/Browser, Git-Commit, Datum, Spiel, Größe, Modus, Runden, Fehler, Wiederaufnahme und subjektive Bewertung. Kein Mitschnitt persönlicher Antworten, Fotos oder Songs.

| Szenario | Durchführung | Abnahme |
|---|---|---|
| Paarabend | 15/30/60 Minuten; gleiche zwei Personen an drei Abenden | Verständliche Aufgaben, keine ungeplanten Wiederholungen, Abschluss im gewählten Rahmen |
| Kleine Gruppe | 4–6 Personen; Titelwechsel und Mix, drei Abende | Faire Beteiligung, keine Erklärung durch Entwickler erforderlich |
| Große Gruppe | Erst 12–30 reale Personen; gesondert bis zum beworbenen Maximum | Lesbarkeit, Wartezeiten, Turn-Rotation, keine ausgeschlossenen Teams |
| Intime Grenzen | Skip, Stop, dauerhafter Zuschauerwechsel, weniger als zwei Teilnehmende | Sofort bedienbar; kein Druck, keine offenbarten zurückgezogenen Antworten |
| Mobiltechnik | Hintergrund, Sperrbildschirm, Audio-Geste, Kamera ablehnen, Netzwechsel | Ehrliche Hinweise, kein erfundenes Audio, keine Sackgasse |
| Recovery | Reload, WLAN-Ausfall, Host verlassen, Geräteübernahme | Passender Wiederbeitritt; Punkte/Deck bleiben korrekt; private Notizen werden nicht erfunden |
| Zugänglichkeit | Tastatur, Screenreader, 200% Zoom, reduzierte Bewegung | Fokus sichtbar, Steuerelemente benannt, keine unbedienbaren Dialoge |
| Maximale Netzlast | 99 gleichzeitige Browserverbindungen in autorisierter Testumgebung | Gemessene p95-Latenz, Fehlerrate, DB-Last und Kosten im vereinbarten Budget |

Nach jedem Abend freiwillig und getrennt abfragen: „Würdest du noch eine Runde spielen?“, „Welche Stelle war unklar?“, „Wann hast du gewartet?“, „Welche Aufgabe würdest du entfernen?“ Für Wiederkehr erst tatsächliche zweite/dritte Abende zählen. Ein automatisiertes Wiederholungs- oder Maximalkapazitätsergebnis ersetzt diesen Nachweis nicht.

Automatische Produkttelemetrie ist derzeit nicht aktiviert. Das Testprotokoll ist freiwillig; es behauptet keine vorhandene Analytics-Pipeline.
