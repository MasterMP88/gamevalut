# NOCTURNE – Umsetzung der Gesamtprüfung vom 25.10.2026

Autorisiert: sämtliche Audit-Punkte und vollständige Spielerfahrung aller bestehenden Titel.
Ausgangsstand Website: `16b8c9f72e19f62683d4b5fee3043a4457b3d9bb`; Core-Repo: `56669aa`.
Dieser Branch führt den aktuellen Website-Code und die kanonischen Core-Pakete zusammen.
Lovable-Credits bleiben UI/UX vorbehalten. Logik, Inhalte, Datenbank und Tests werden direkt implementiert.

## Abnahmebereiche

- [ ] Hostzugang serverseitig; AI-Auth, Budget und Timeout; private Echos ausgeschlossen
- [ ] Vollständige GANG-Mechaniken und Finale für alle 16 sichtbaren Spiele
- [ ] Inhaltsverlauf über Titel, neue Abende und Wiederaufnahme
- [ ] Zeitbudget, kurze Paarformate, skalierte Rundenanzahl und gute Abschlüsse
- [ ] Erweiterte redaktionelle Inhalte und unterschiedliche Dramaturgie aller neun Paarspiele
- [ ] Parallele SECRET MISSIONS, Medien- und Mehrgeräte-Erlebnis
- [ ] FIRST BEAT und TIME DROP integrieren, sobald ihre echten Audiovoraussetzungen erfüllt sind
- [ ] Einstieg, Spielhilfen, deutsche Texte, Zugänglichkeit, SEO und Vertrauensseiten
- [ ] Regressionen, vollständige Spielabläufe, Build und Veröffentlichung prüfen

## Grenzen der technischen Abnahme

Ein bestandener Test beweist keinen Spielspaß oder Preiswürdigkeit. Menschliche Playtests,
echte Safari-/Android-Geräte, Audio-Autorisierung und ein 99-Geräte-Lasttest bleiben eigene Nachweise.
Keine Anbieter-, Rechts- oder Kontaktangaben erfinden. Fehlende externe Voraussetzungen explizit festhalten.

## Änderungsprotokoll

Fortschritt und durchgeführte Prüfungen werden mit der Implementierung ergänzt.

### Validierter Zwischenstand — Grundlage und Rundenlogik
- Aktuellen Lovable-Website-Quelltext im Core-Repository vereinigt; Core-Dateien werden ausschließlich aus `packages` vendort.
- Serverseitiger Host-Zugang und RLS-Inhaltsverlauf live migriert: `20261025095646_audit_access_history.sql`.
- Serveruhr, versiegelte erste Antwort, generische Wortlimits und Timeout-Aktionen live migriert: `20261025101728_audit_room_controls.sql`. Fixture mit transientem Raum testet die Regeln innerhalb einer Transaktion; keine Kundendaten verändert.
- Private Echos ausgeschlossen; optionale körperliche/sinnliche/Alkohol-Inhalte standardmäßig aus. Rebound-Skip ohne Strafpunkte.
- AI-Director prüft Identität, bezahlten Zugang, atomare Budgetreservierung und Timeout. Globale AI-Freigabe bleibt aus; ohne konfigurierte Kostenreservierung läuft der lokale Director.
- Inhalts-IDs auf Gerät und für eingeloggte Accounts gespeichert. Ungespielte Inhalte haben Vorrang, dann die am längsten zurückliegenden.
- Paarformate 15/30/60/Open End mit aktiver Spielzeit und Abschluss an der Szenengrenze. Director-Pläne begrenzen konkrete Runden und werden bis in beide GANG-Player weitergegeben.
- 144 zusätzliche exklusive Paar-Szenen, zusätzliche GANG-Bänke; jede dritte Paar-Szene bevorzugt die eigene Spielidentität.
- BLUFF-Wahrheitsperson pausiert beim Wettbewerb; Fünf-Wort-Finale; echte Stichwahl bei Undercover/One Of You; doppelte Undercover nur im Finale; Hot Seat dreht vollständig durch; Teamwertung nach Anteil und einmaliger Comeback-Bonus; Music Drop mit Duo-Match und Matchbonus; AFTER DARK mit persönlichem Opt-in und individuellem Stop-Veto.
- CHAIN/PANIC mit Bereitschaft, tatsächlichen Zügen und Deadline; PANIC drei Durchgänge pro Runde. Große Everyone-In-Gruppen laufen in parallelen Spuren mit höchstens sechs Personen. 99-Personen-Simulation prüft exakt drei Züge pro Person.
- Stand nach diesen Änderungen: **208/208 App-Tests, 73/73 GANG-Core-Tests, TypeScript und Produktionsbuild bestanden.** Das ist eine technische Zwischenprüfung, keine menschliche Spielspaß- oder Geräteabnahme.

### Validierter Zwischenstand — vollständige Gruppenabläufe
- SECRET MISSIONS laufen als Nebenaufgabe durch die ganze Nacht: eindeutige private Zuteilung, versiegelte Erfüllung, einmaliger Verdacht, serverseitige Ereignisreihenfolge und Abschluss-Timeline. Im Director optional zubuchbar.
- PHOTO HUNT überträgt verkleinerte JPEGs mit entfernten Metadaten. Galerie auf Handys und Big Screen; eigene Bilder bleiben vor der Abstimmung verborgen. Anhänge sind serverseitig an Raum, Runde und Eigentümer gebunden. Kein öffentliches Medien-Bucket.
- DRAW THIS: gleichzeitiges Zeichnen auf Papier und bis zu 24 Rateversuche pro Person am Handy. Erster richtiger, vom Server zeitlich geordneter Tipp zählt. Auf einem Handy wird gemeinsam laut geraten und die zuerst richtige Person ausgewählt. Echte Deadline, kein Warten auf eine bereits fertige Zeichnung.
- TEAM CHAOS: 31 Aufgaben, zwei private Captain-Karten, rotierende Captains, gleiche aktive Teamgröße und tatsächliche quantitative Ergebnisse statt Ja/Nein. Tabu-Wörter und Zeichenvorlagen erscheinen nicht öffentlich.
- AFTER DARK: passende Frage-, Abstimmungs- und Aktionsphasen, Antworten ohne Namen, freiwillige Aufgaben und echte Soft-/Bold-Abschlüsse. Stop oder fehlende Abschlusswahl entfernt die letzte Aktion.
- WHO'S THAT zeigt die gesammelte Titelgalerie. MUSIC DROP übernimmt bei Gruppen nur Crowd-Picks in die Tracklist. Identische Textantworten teilen sich eine Abstimmungsoption und erhalten gemeinsam Punkte; semantische Selbstwahl ist ausgeschlossen.
- BLUFF: 30 neu redigierte Fakten mit verlinkten NASA-/Museumsquellen und Themenwechsel. Unpräzise alte Trivia ersetzt. Unicode-Normalisierung bewahrt internationale Songtitel.
- Manuelle Auswahl und Mix bieten 15/30/60/Open End mit realer Rundenplanung; One Phone berücksichtigt Übergabezeit. Paar-Replay behält das gewählte Zeitformat.
- Polling bündelt Snapshot und Fortschritt in einem RPC, passt Intervalle an, streut Anfragen und verwendet Fehler-Backoff. Private Karten, Runtime und öffentliche Phase werden atomar veröffentlicht, damit niemand veraltete Geheimkarten erhält.
- Weitere live migrierte, transaktional getestete Änderungen: `20261025103440_audit_missions_and_media.sql`, `20261025105258_audit_live_attempts.sql`, `20261025110553_audit_atomic_publish.sql`. Zugehörige SQL-Fixtures prüfen Datenschutz, eigene Fotoanhänge, Deadlines, Versuchslimits-Zugriff und Rollback bei fehlerhaftem Publish.
- Stand: **209/209 App-Tests, 85/85 GANG-Core-Tests, TypeScript und Produktionsbuild bestanden.** Der neue App-Test spielt Zeichnen mit drei Handys, falschem Tipp und erfolgreichem zweiten Versuch durch. Die Website selbst ist weiterhin unverändert; die fünf genannten DB-Migrationen sind aktiv.

### Noch umzusetzen (keine Abnahme vor Abschluss)
- Explizite automatische Löschfrist für Medien/ephemere Raumdaten und Foto-UX auf echten Mobilgeräten prüfen.
- Neue Gruppenabläufe visuell vollständig durchspielen; Anleitungen/Katalogtexte mit den fertigen Regeln abgleichen.
- Paar-Mehrgeräte-Unterstützung; Musik-Provider bzw. FIRST BEAT/TIME DROP nur mit realen Audio-Voraussetzungen.
- Website: SEO-Detailseiten, OG-Assets, Navigation/Overlays/A11y, deutsche Texte, Vertrauen/Kauf-/Account-Flows, Preisempfehlung des Audits.
- Sicherheits- und Lastprüfung inklusive transportbezogener Missbrauchsgrenzen, Reconnect, effizientem Polling, Migrationstests, aktuellen Abhängigkeiten.
- Vollständige Quellcode-/UI-Integration in Lovable und Review/Veröffentlichung. Aktuelle Website bleibt für diesen Zwischenstand unverändert; die fünf genannten DB-Migrationen sind aktiv.
