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


### Validierter Zwischenstand — Paar-Handys und spontaner Host-Zugang
- Eigener Einstieg `/together` für alle neun Paarspiele, persönliche 18+-Bestätigung und gemeinsame Schnittmenge der Grenzen. Sync/Vorhersagen und Duette werden gleichzeitig verdeckt abgegeben und gemeinsam aufgelöst.
- Dieselbe kanonische Paar-Engine entscheidet weiterhin Rhythmus, Heatcheck-Punkte/Power-ups, Co-op-Energien, Rückfragen, Tempo, Director-Richtungen und Abschlüsse. Roulette ist auf beiden Geräten identisch; Showdown-Ergebnisse und Missionserfüllung erfordern Übereinstimmung. Ein beiderseitiges Unentschieden vergibt keine Gewinnpunkte.
- Eigener sicherer Steuerkanal ermöglicht Überspringen/Pause/Abschluss unabhängig vom eigenen Zug. Antworten sind versiegelt; Sicherheitswünsche werden vor einer Auflösung verarbeitet. Erneute Zustimmung nach Pause und nur gemeinsam gewählte After Hours.
- Intime Echo-Notizen bleiben ausschließlich im Host-Tab. Runtime-Recovery enthält weder Notizen, Echo-Text, AI-Queue noch persönliche Tracklist. Nach Geräteübernahme sind diese Notizen nicht wiederherstellbar. Ausdrücklich eingegebene Songtitel reisen für die Runde durch den kurzlebigen privaten Raum; diese Übertragung wird vor dem Einstieg erklärt.
- Night Pass erweitert ohne Preisänderung auf GANG-Hosting. Unlimited-Mitglieder können keinen redundanten Night Pass kaufen; unbekannte Produkte und ungültige Zeitfenster gewähren keinen Zugang.
- Zwei weitere Migrationen live: `20261025112320_audit_host_pass_retention.sql` (fünf offene Räume pro Host; 12h Raumlaufzeit, automatische Löschung mit FK-Kaskaden alle fünf Minuten) und `20261025112558_audit_pair_controls.sql` (persönliche Steueranfragen). Transaktionales Fixture prüft Host-Pass, Raumgrenze, Steuerrechte, alte Phasen und Löschkaskade.
- Vollständiger App-Lauf nach dieser Integration: **231/231 Tests**, Commerce-Core **7/7**, TypeScript und Build erfolgreich. Die anschließende Erweiterung auf 22/22 Paar-Tests prüft auch Abschlusswahl/After-Hours-Zustimmung und Musikreaktion (damit 233 App-Tests insgesamt). Das ist weiterhin keine reale Mobilgeräte- oder Lastabnahme.
- Noch offen: Zahlungsereignis-Reihenfolge/Erstattungen/Streitfälle, Website-/Anleitungs-/SEO-/A11y-Finalisierung, Visual-QA und Integration/Veröffentlichung. Die Website ist noch auf dem ursprünglichen Stand; sieben additive DB-Migrationen sind aktiv.

### Validierter Zwischenstand — Zahlungs-Reconciliation
- Aktueller Stripe-Zustand statt Reihenfolge alter Webhook-Snapshots; Ressourcen-Lease und atomare Grants/Subscription-Updates.
- Volle/teilweise Erstattung, offene/gewonnene Streitfälle, doppelte Ereignisse, verlorene Leases und Planwechsel behandelt. Separate Kaufquellen schützen einen neueren Pass vor der Erstattung eines alten.
- Vollständige App-Prüfung **239/239**, TypeScript und Build bestanden. Neues SQL-Fixture inklusive Zugriffsrechten, zeitlicher Übernahme und Idempotenz besteht in einer zurückgerollten Transaktion.
- **Betriebsblocker entdeckt:** GameNights hat weder klassische Webhooks noch v2-Event-Destinations konfiguriert. Die Datenbank hat bisher keine Stripe-Käufe. Die neue Commerce-Migration ist vorbereitet und transaktional getestet, aber bis zur integrierten Bereitstellung nicht dauerhaft angewendet. Exakte Anbindungsschritte stehen in `docs/commerce-operations.md`.

### Validierter Zwischenstand — Anleitungen, Replay, Extras und Teilen
- Alle 16 veröffentlichten Gruppentitel haben eigenständige, indexierbare Detailseiten unter `/gang/:slug`, eine Beispielrunde sowie Ziel, Ablauf, echte Wertung, Finale, Zeit- und Gerätehinweise. Dieselbe Kurzanleitung begleitet den Spielstart.
- 129 weitere eigenständige Karten: insgesamt 90 SECRET MISSIONS, 60 HOT-SEAT-Fragen sowie Ergänzungen für MAJORITY, WHO'S THAT, TEAM CHAOS, DRAW THIS und AFTER DARK. Jeder sichtbare generische Gruppentitel besitzt jetzt Karten für mindestens drei Abende mit maximaler Rundenzahl; SECRET MISSIONS und HOT SEAT sind am maximalen Personenlimit durchsimuliert. Feste Abschlussrituale bleiben bewusste Wiederkehr, keine neuen Fragen.
- THE LINE: optional verdeckte Vorhersage eines direkten Nachbarn; tatsächliche Reihenfolge wird auf einem Handy geordnet bzw. auf mehreren Handys als Position bestätigt. Nur vollständige, eindeutige Positionen erlauben Bonuspunkte. AFTER DARK: optionale freiwillige, namenlose Reaktionszählung ohne Rangliste. Ein Stop erzeugt auch keine weitere Reaktionsphase.
- Die zusätzliche THE-LINE-Prüfung durchläuft vier gerenderte Controller einschließlich verdeckter Wahl, Positionsabgabe und gemeinsamer Punkteauflösung. Ein dabei gefundener Start-Race ist behoben: Bedienaktionen gehen während Hintergrundarbeit nicht mehr still verloren.
- GANG-Setup verwendet einen fokussierten Dialog mit Escape und Fokus-Rückgabe sowie drei klar wählbaren Gerätevarianten. Zeitplanung und alle bisherigen Geräteempfehlungen bleiben erhalten. Separater Tastaturtest bestätigt Öffnen/Schließen/Fokus.
- Die fünf kostenlosen Paar-Szenen bekommen vor der Kaufentscheidung einen eigenen freiwilligen Abschlussmoment pro Titel. Ein abgelaufener Zugang später im Spiel wird korrekt als pausiert bezeichnet.
- Night Signature lässt sich ausdrücklich teilen/kopieren. Die exakte Vorschau enthält standardmäßig weder Namen noch Antworten noch Songs. Nur einzeln gewählte normale Momente sowie separat freigegebene Namen/Songs gelangen hinein; private/sensible Anker bleiben ausgeschlossen. Schließen setzt Auswahl zurück.
- Accountwechsel/Logout löschen private In-Memory-Paarstände und ausstehende Saves; verspätete Präferenzantworten eines alten Accounts werden verworfen. Gast→Account bleibt erhalten. Drei gezielte Identitätsprüfungen bestehen.
- Datenschutzhinweise erklären Inhaltsverlauf, Mehrgeräte-Verarbeitung, vertrauenswürdigen Host, Fotos und 12h-Raumlaufzeit plus Bereinigung. `/privatsphaere` ist eine technische Datenerklärung, kein erfundenes vollständiges Anbieter-/Rechtsdokument.
- Social Preview als echte 1200×630-PNG ergänzt und visuell geprüft. Browser-Rasterprüfung der ganzen App ist hier noch offen: Der lokale Browser-Download schlug fehl; DOM-/Controller-Tests sind kein Ersatz für Geräteprüfung.
- Parallel eingegangene Brand-Voice-, Copy- und Pricing-Änderungen aus `fd8f195` integriert; öffentlicher Jahrestarif **59,99 €**, alter **49,99-€**-Tarif bleibt anerkannt. Die drei Geräteoptionen und die Membership-Section aus dem zwischenzeitlich aktualisierten Lovable-Stand ebenfalls übernommen. Paar-Content-Version wegen redaktioneller Szenenänderungen erhöht.
- Nach Zusammenführung: **252 App-Tests**, **92 GANG-Core**, **7 Commerce-Core**, **9 FIRST-BEAT-Core**, **18 TIME-DROP-Core**, **12 PASS-THE-AUX-Core** bestanden (390 insgesamt); TypeScript und Produktionsbuild bestanden. Die Membership-Copy wurde anschließend ergänzt und wird im abschließenden Build erneut geprüft.

### Tatsächlich noch offen
- Commerce-Migration und sichere Stripe-Webhook-/Secret-Anbindung samt Sandbox-End-to-End-Abnahme. Der neu geprüfte Live-Account hat weiterhin keine klassischen Webhook-Endpunkte. Gleichzeitige offene Checkout-Vorgänge benötigen noch eine gemeinsame Reservierung; die vorhandene Sperre verhindert bereits redundante Käufe bei aktivem Zugang.
- Vollständige Integration dieses Branches in das aktuelle Lovable-Projekt; die dort parallel eingegangenen Änderungen sind kein Nachweis, dass die neue Runtime bereits veröffentlicht ist. Keine Veröffentlichung dieses Audit-Branches erfolgt.
- Reale iPhone-/Android-/TV- und Mehrgeräte-Abnahme einschließlich Kamera, Reconnect, Hostwechsel, Tastatur/Zoom/Kontrast; 99-Geräte-Lastprüfung und menschliche Wiederholungsabende.
- Anbieter-/Kontakt-/Vertragsangaben aus verifizierten Betreiberinformationen, vollständige Vertrauensseiten und fachliche Prüfung. Keine Betreiberidentität oder Adresse erfunden.
- Aktives Apple-Music-Audio und dedizierte FIRST BEAT/TIME DROP-Oberflächen erst mit echten Provider-Voraussetzungen; lokale Core-Tests sind keine Audiofreigabe. AI-Erweiterung bleibt serverseitig deaktiviert; lokaler Director funktioniert.
- Datenschutzarme, freiwillige Produkttelemetrie und redaktioneller Monats-Drop-Betrieb sind noch kein abgeschlossener Betriebsnachweis. AFTER-DARK-Ausstieg aus einer einzelnen Runde funktioniert; ein dauerhafter Wechsel in den Zuschauerstatus während einer laufenden Nacht ist noch separat zu ergänzen.


### GANG Couch / Premium-2026 — eigener Umsetzungsschritt
- Verbindliche Empfehlungen für alle 16 spielbaren GANG-Titel in `experience.ts`; vollständige Einzelverträge, Regeln, Größenbänder und Nachweise in [GANG_PREMIUM_2026.md](GANG_PREMIUM_2026.md). TIME DROP bleibt Prototyp.
- Neun öffentliche Raumspiele mit eigenem reinen Reducer und gemeinsamer Bühne ohne Raumbeitritt: THE MAJORITY, WHO’S THAT, THE LINE, BAD ANSWERS ONLY, MUSIC DROP, PANIC BUTTON, HOT SEAT, TEAM CHAOS, CHAIN REACTION.
- TV/Laptop oder gemeinsames Handy, höchstens sechs Teams/Sektoren, rotierende Sprecher, echte Timer/Pause, Skip ohne Punkte, verlässlicher Abschluss, einmaliger Encore und neues Deck beim Replay. Auf dem TV zunächst Aufgabe und Aktion, Ergebniseingabe erst danach.
- MUSIC DROP erkennt lokal mitgebrachte Audiodateien im Handbuzzer-/Steal-Spiel; keine behauptete Streaming-Anbindung. Dateinamen bleiben vor Reveal aus dem Spielbild. Die bestehende Song-Voting-Variante bleibt gesondert auswählbar.
- Director verwendet Geräte, TV, Energie, Vibe, Zeit und Spielehistorie; die gemeinsame Gerätewahl bleibt ohne private Spiele und Beitrittszwang. Private Spiele behalten Everyone In/Hybrid bzw. One Phone mit Abdeckung.
- Neue Content-Edition, 24 weitere BLUFF-Fakten mit Primärquellen, 32 öffentliche TEAM-CHAOS-Aufgaben; harter Session-Ausschluss unabhängig von älterer History. Rollenverteilung rotiert. UNDERCOVER/ONE OF YOU verraten die Sonderrolle nicht mehr durch Kartenmetadaten/Präfixe.
- Korrekte Detektiv-Sieger statt des enttarnten Gegners; kein Punkte-Farming durch Skip oder fehlende Stimmen; zusätzliche Finalvarianten für UNDERCOVER, BLUFF, PHOTO HUNT, DRAW THIS.
- Abnahme: **104/104 GANG-Core-Tests, 251/251 App-Tests, TypeScript und Produktionsbuild bestanden**. Browser: **27 Sessions / 81 Runden / 0 Laufzeitfehler** in 390/1440/1920px, inklusive echter WAV-Decodierung, Skip/Finale/Encore/Replay.
- Dieser Schritt ändert keine Live-Datenbank und veröffentlicht die Website nicht. Couch-Reload-Recovery, separates Smartphone als TV-Ferncontroller, reale Mobilgeräte-/Safari-/99-Geräte-Tests und menschliche Spielspaßtests sind nicht durch diese technische Abnahme abgedeckt. Keine Lovable-Credits verbraucht.


### Zusammengeführter GANG-Stand — 26.10.2026
- Audit-Stand `4c38a2c` vollständig integriert; neue öffentliche Spielanleitungen, optionale Geräte-Mechaniken, Marken-/Preisänderungen und Paar-/Account-Korrekturen bleiben erhalten.
- Couch- und Geräteanleitungen getrennt, damit MUSIC DROP keine Song-Eingabe als Hörspiel erklärt und öffentliche TEAM-CHAOS-Aufgaben keine geheimen Captain-Karten versprechen.
- Beide redaktionellen Erweiterungen zusammengeführt; neue Couch-Karten erhalten kollisionsfreie IDs. 122 Missionen, 92 HOT-SEAT-Fragen und 48 öffentliche TEAM-CHAOS-Aufgaben. Eine doppelte Zeichenvorlage wurde ersetzt.
- Zusätzlicher Nachweis: drei maximale Couch-Abende mit jeweils zwölf Runden plus Encore verwenden keine Karte doppelt. MUSIC DROP hängt ausdrücklich vom eigenen Audiostapel ab.
- Gemeinsame Abnahme: **265/265 App-Tests**, **112/112 GANG-Core-Tests**, TypeScript und Produktionsbuild bestanden. Browser erneut **27 Sessions / 81 Runden / 0 Laufzeitfehler**. [Bericht](qa/gang-couch-2026-10-26.json) und Bildschirmnachweise liegen im Repo.
- CI nutzt den vorhandenen App-Workflow, ergänzt um den Abgleich generierter und kanonischer Core-Dateien. Kein zweiter konkurrierender App-Workflow.


### Inhaltskapazität und Replay — 26.10.2026
- Die bisherige Drei-Abende-Aussage wurde anhand tatsächlicher vollständiger Abläufe neu geprüft. Dabei fielen frühe Paar-Wiederholungen, wiederkehrende Detours/Director Cuts, vorzeitig endendes zeitbegrenztes Co-op und Engpässe bei gemeinsamen GANG-Pools auf; alle sind in diesem Schritt korrigiert.
- 344 neue Paar-Szenen bringen den Gesamtbestand auf **833**. Alle neun Titel bestehen **fünf lange Partien im Standardprofil**, alle zusätzlich **drei bei niedrigster Intensität ohne optionale Inhalte**, jeweils bis 40 Szenen. Die gemeinsamen Pools sind nicht additiv. Content-Version auf 4 erhöht.
- Alle 16 freigegebenen GANG-Titel bestehen **vier maximale Partien bei ihrer maximalen Besetzung**, sowohl One Phone als auch Everyone In. Acht textbasierte Couch-Titel bestehen vier mal zwölf Runden plus Zugabe. Auch wechselnde GANG-Titel mit gemeinsamem Verlauf sind über vier vollständige Durchläufe geprüft.
- Weitere HOT-SEAT-, TEAM-CHAOS-, Song-Voting- und BLUFF-Inhalte ergänzt; ID-Kollisionen mit erhaltener Legacy-History migriert, semantische Dubletten und falsche Zeichen-Aliasse entfernt. Bestehende redaktionelle Qualitätsprüfungen bleiben unverändert.
- MUSIC DROP im Couch-Modus wählt aus bis zu 120 lokalen Audiodateien zuerst ungehörte. Drei vollständige Partien einschließlich Zugabe erfordern 39 unterschiedliche Dateien. Kein eingebauter lizenzierter Katalog und keine akustische Duplikaterkennung behauptet.
- Alle parallelen Couch-/Anleitungsänderungen und der eigenständige MUSIC-DROP-DJ-Modus bis `3bf333d` integriert. Im DJ-Modus übernimmt die auflegende Person die Auswahl neuer Songs; automatische Audio-History gilt nur für importierte Dateien. Der vorhandene App-CI-Workflow bleibt allein zuständig; ein beim Zusammenführen wiederaufgetauchter doppelter Workflow wurde entfernt.
- Technische Abnahme: **312 App-Tests inklusive Berichtsgenerierung, 160 GANG-Core-Tests**, TypeScript und Produktionsbuild bestanden. Chromium: **30 Sessions / 90 Runden / 0 Laufzeitfehler**, zusätzlich visuelle Stichproben auf Handy- und TV-Breite. Reale Geräte, Netzlast und menschliche Wiederholungsabende sind damit nicht abgenommen.
- Vollständige Bestands-/Verbrauchstabellen, Grenzen und reproduzierbare Nachweise: [content-capacity-2026.md](content-capacity-2026.md). Keine Veröffentlichung, neue Live-Migration oder Lovable-Credits in diesem Schritt. Die oben aufgeführten Betriebsblocker bleiben offen.
