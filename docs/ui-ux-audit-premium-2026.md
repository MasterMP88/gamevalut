# NOCTURNE — UI/UX-Audit und Erlebnisentwurf 2026

Stand: 25. Oktober 2026 · Projekt Game · ausschließlich `MasterMP88/gamevalut` und das bestehende Lovable-Projekt.

**Ergebnis:** Die Marke und mehrere Mechaniken besitzen eine tragfähige Eigenständigkeit. Ein durchgehend hochwertiges Spielerlebnis ist noch nicht belegt. Die größten Lücken liegen zwischen Spielversprechen, tatsächlicher Gerätebedienung, verständlichen Regeln und individuellen Auflösungen. Mehr Bewegung oder mehr Geräte schließen diese Lücken nicht.

Dieses Dokument ist ein ausgearbeiteter Produktentwurf, keine Behauptung einer bereits umgesetzten oder preisgekrönten Version. Es enthält eine vollständige Konzeptabdeckung für **9 sichtbare Paarspiele, 16 sichtbare GANG-Spiele sowie die vorhandenen Kerne FIRST//BEAT und TIME//DROP**. TIME//DROP wird trotz Paar- und Gruppenvarianten einmal gezählt. Die beiden After-Dark-Titel sind verschiedene Spiele.

## Prüfgrundlage und Grenzen

| Quelle | Stand | Was wurde geprüft? |
| --- | --- | --- |
| Veröffentlichte Website | `https://nocturne-games-for-two.lovable.app/`, Abruf am 25.10.2026 | Landingpage, alle neun Paar-Detailseiten, alle 16 GANG-Spielvorstellungen, THE-MAJORITY-Setup inklusive TV-Wahl, Musikspiel-Start bis Altersabfrage; repräsentative Desktop-Screenshots |
| Lovable-Quelltext | Projekt `155bbb23-db01-432e-a4f3-287aa8f3e015`, Snapshot `6488e2fa4a2994a6b6147d60cf6abfbbeb6c72f5` | Spielregister, Detailseite, alle Spieloberflächen über SceneView/Player/GangPlayer/GangRoom/GangBigScreen, Musikansicht, Endings, GameStage und CSS |
| Kanonisches Repo | main `cd09b198…` | GANG-Playbooks, Produktvertrag, Musikkerne und Preismasterplan |
| Laufende Umsetzung | `feat/audit-completion-2026` bei `44f483d…`, PR #31 | Bereits ergänzte Abläufe, Inhaltsverlauf, Kurzformate, Paartransport und noch offene Integration |
| Brand Voice | `feat/brand-copy-audit-2026` bei `a7089de…`, `docs/brand-voice-2026.md` | SMART MISCHIEF, klare Aktionen, situationsbezogener Humor, respektvolle Grenzen |

**Prüftiefe:** UI-Beobachtung der öffentlichen Einstiege plus heuristischer und quellenbasierter Audit der Spielabläufe. Der anonyme Browser erreichte im GANG-Setup die Host-Zugangsschranke; beim Paarstart die Altersbestätigung. Es wurden keine Käufe, Altersbestätigungen oder vollständigen bezahlten Sessions vorgenommen. Reale Mobilgeräte, akustische Qualität, Gruppendynamik und 99 gleichzeitige Geräte sind nicht validiert. Quelltextbefunde werden ausdrücklich nicht als live durchgespielte Fehler ausgegeben. Die sichtbare Website wurde keinem vollständigen Code-Commit technisch zugeordnet; der Lovable-Snapshot und die Live-Beobachtungen sind getrennte Belege.

Die früheren erfolgreichen Tests aus PR #31 sind vorhandene Projektnachweise, keine in diesem Audit neu ausgeführten Tests. Für diesen dokumentarischen Entwurf wurden Katalogabdeckung, interne Links, Datenschema, JavaScript-Syntax und reproduzierbare Dateierzeugung geprüft. Eine gerenderte Sichtprüfung des lokalen Konzeptatlas war im verfügbaren Browser nicht möglich: dessen URL-Sicherheitsregel blockiert lokale Dateien. Der Atlas ist deshalb ein technisch geprüfter Entwurf, keine visuell abgenommene Oberfläche.

## Maßgebliche Korrektur: Übergabe kann Premium sein

Die Nutzerklärung in diesem Audit ersetzt jede pauschale Auslegung von „Zero Handoff“: **Handy-Übergabe ist erlaubt und bei geeigneten Paarspielen ausdrücklich erwünscht.** Ein Gerät kann mehr Nähe und einen besseren gemeinsamen Reveal schaffen als zwei Controller. Mehrgerätebetrieb ist kein Qualitätsmerkmal an sich.

Entscheidungsregel je Szene:

1. Gemeinsames Gespräch oder gemeinsame Aktion: Gerät liegt zwischen den Menschen.
2. Abwechselnde Geheimwahl mit gemeinsamem Reveal: ein Gerät mit inszenierter Übergabe ist eine vollwertige Empfehlung.
3. Viele gleichzeitige geheime Eingaben: persönliche oder Teamgeräte verbessern Tempo und Unabhängigkeit.
4. Mündliche, körperliche oder räumliche Gruppenaktion: TV/Laptop oder ein Handy genügt; Gäste-Join entfällt.
5. Freie Texteingabe nur, wenn der selbst erfundene Text oder Song die Mechanik trägt. Eine freiwillige Notiz ist ebenfalls sinnvoll. Kein Abtippen normaler Gespräche.

### Die hochwertige Übergabe

**Wählen → Versiegeln → „Jetzt Nova“ → „Ich bin bereit“ → nächste private Aktion → gemeinsam aufdecken.**

- „Versiegeln“ bestätigt die Wahl und verdeckt sie atomar. Ein zusätzliches „Bist du sicher?“ ist im normalen Ablauf unnötig.
- Der Übergabeschirm zeigt nur den nächsten Namen, den Grund und einen eindeutigen Bereitschaftsbutton. Keine Antwort in Hintergrund, Animation, zugänglichem Text oder Zurück-Vorschau.
- Die Information bleibt bis zur bewussten Freigabe verdeckt. Eine Haltegeste kann angeboten werden, darf aber keine Pflicht sein.
- Kein laufender Antworttimer während der physischen Übergabe; nach „bereit“ beginnt die eigene Zeit.
- Derselbe Handoff funktioniert mit Tastatur und Screenreader. Namen werden sichtbar und lesbar angezeigt; Farben allein reichen nicht.
- Doppel-Taps dürfen weder zwei Züge auslösen noch das Reveal überspringen. Verlassen, Resume und Remount müssen wieder hinter dem Sichtschutz landen.
- Beim gemeinsamen Aufdecken liegt das Handy wieder zwischen euch. Eine kurze Animation ist überspringbar und enthält keine zusätzliche Bedienhürde.
- Ehrlicher Schutzumfang: Sichtschutz auf einem geteilten Gerät ist keine technische Geheimhaltung gegenüber dessen Besitzer oder Entwicklerwerkzeugen. Eigene Geräte erlauben stärkere Zugriffsgrenzen. Diese Unterscheidung gehört in interne Architekturentscheidungen, nicht als technische Textwand in den Spielfluss.

**Produktziele für Tests, noch nicht gemessen:** normale Übergabe in einem Bereitschaftstap; p90 unter fünf Sekunden ohne Eingabezeit; keine unbeabsichtigte Offenlegung in Back-/Reload-/Remount-Prüfungen; Übergaben nur an tatsächlichen Besitz- oder Geheimniswechseln.

## Befunde mit nachvollziehbaren Belegen

Prioritäten: **P0** = vor Freigabe einer betroffenen Variante klären; **P1** = zentraler Erlebnis- oder Verständlichkeitsbruch; **P2** = gezielte Verfeinerung. Kein P0-Eintrag ist ohne Prüfung automatisch eine bestätigte Sicherheitslücke.

| ID | Priorität / Beleg | Befund und Wirkung | Verbindliche Entwurfsantwort |
| --- | --- | --- | --- |
| UX-01 | P1 · live + `GameStage.tsx`, FirstSpark | First-Spark-Detailvorschau am Desktop extrem schmal, Text nahezu Wort für Wort. `bare` blendet den Header aus, der äußere Desktop-Grid bleibt mit zwölf Spalten; Canvas erhält dort keine volle Spaltenbreite. | Detailvorschau auf verfügbare Containerbreite auslegen; responsive Vorschauen getrennt vom Landingpage-Layout prüfen. |
| UX-02 | P1 · live THE MAJORITY, BIG SCREEN | „TV als Bühne“ verlangt weiterhin QR-Controller. Der gewünschte TV-/Couch-Modus ohne Beitritt ist damit nicht eingelöst. | `Couch` und `TV + Controller` als verschiedene Varianten implementieren. Eine TV-Ausgabe allein ist kein Couch-Modus. |
| UX-03 | P1 · `GangPlayer.tsx`, PassTurn/Intro; live Katalog | 15 von 16 sichtbaren GANG-Titeln empfehlen One Phone; im Code führen viele Phasen durch serielle Einzelzüge. Die Geräteempfehlung aus der ersten Registeroption berücksichtigt Gruppengröße und konkrete Variante nicht ausreichend. | Empfehlung aus Spielmechanik, Gruppengröße und Gerätelage. Kleine Pass-Runden behalten, große geheime Runden parallelisieren. |
| UX-04 | P1 · live MUSIC DROP + Playbook | Englischer Hook verspricht Song-Erkennen, deutsche Regel fordert Song-Picks zum Prompt. | MUSIC DROP als Songbattle positionieren; FIRST//BEAT ist das Erkennungsspiel. Namen nicht austauschbar verwenden. |
| UX-05 | P1 · live Paar-Detailseiten + `games.ts` | Viele Titel nennen 45 Minuten bis drei Stunden oder Open End als Einstieg. Das erhöht die wahrgenommene Verpflichtung. | Kurzes empfohlenes Format zuerst; längere Formate optional. Bereits im offenen Zweig eingeführte 15/30/60-Logik in alle sichtbaren Texte übernehmen. |
| UX-06 | P1 · `Player.tsx`, Rebound-Hinweis | Quelltext sagt „Skip bringt … +2“, während Detailtexte „Skip kostet nie etwas“ versprechen. PR #31 dokumentiert bereits eine Korrektur. | Korrigierte Regel auf jedem Gerätepfad integrieren. Grenzen dürfen auch indirekt keinen Wettbewerbsnachteil erzeugen. Kein erneuter Neubau einer bereits korrigierten Engine. |
| UX-07 | P1 · live + `MusicRound.tsx` | Songwahl und Tracklist sind real; tatsächliche Wiedergabe hängt von konfigurierter Fähigkeit ab. Darstellung darf Songtitel-Eingabe nicht als eingebettetes Hörspiel verkaufen. | Verfügbarkeit vor Beginn, echte Playerzustände, klarer Song-Talk-Modus. Keine dekorative Pseudo-Wiedergabe. |
| UX-08 | P1 · live Director + Implementierungsbericht | Demo sagt „Director live“ und beschreibt generative Einmaligkeit; Bericht nennt ausgeschaltete globale KI-Freigabe. Aktuelle Laufzeitfähigkeit ist dadurch nicht belegt. | Lokale Regie als vollständiges Produkt kommunizieren; generative Aussagen nur bei tatsächlich nutzbarer Funktion. |
| UX-09 | P1 · `GangPlayer.tsx`, ScoreView; `GangBigScreen.tsx` | Gemeinsame Shell und allgemeine Ergebnislisten tragen viele verschiedene Spiele. Eigene Motive allein erklären deren Entscheidungen und Auflösung nicht. | Pro Titel eigener Schwerpunkt, Reihenfolge und Ergebnisinhalt. Wiederverwendung von Controls bleibt, aber nicht eine einzige Dramaturgie. |
| UX-10 | P1 · live PHOTO HUNT, DRAW THIS + Zweig | „Kamera optional“ und Zeichnen ohne explizite Materialangabe können ein anderes Erlebnis erwarten lassen. Erweiterte Medienabläufe sind noch nicht als live abgenommen. | Benötigtes Material vor Start nennen; echte Bilder, echte Ratephase. Ohne Voraussetzung passendes anderes Spiel anbieten. |
| UX-11 | P2 · live Hooks, Tags, Detailtexte | Englische Gebrauchstexte, interne Namen wie Memory Core und wechselnde Sprache stören eine deutsche, klare Bedienung. Paar-/GANG-AFTER-DARK können verwechselt werden. | Bestehende SMART-MISCHIEF-Stimme anwenden, Handlungen deutsch; Titel dürfen englisch bleiben. Weltzusatz bei gleichen Titeln. |
| UX-12 | P1 · `EndScreen.tsx` + GANG-Finale | Mehrere Paarspiele enden allgemein mit Szenenzahl; ein guter letzter Moment muss aus der jeweiligen Mechanik entstehen. | Eigene Abschlüsse und passende Revanche pro Titel. Keine automatisch veröffentlichten persönlichen Erinnerungen. |
| UX-13 | P0 · vorhandene Musikkerne, Katalogstatus | FIRST//BEAT und TIME//DROP sind Kerne/Prototypen, keine vollständig integrierten Audio-Games. | Im Konzept vollständig ausarbeiten, als unfertig kennzeichnen; kein spielbarer Launch vor Audio-, Rechte-, Metadaten- und Geräteabnahme. |
| UX-14 | P1 · Gesamtarchitektur + Gruppenlimits | „2–99“ ist Produktspanne, nicht Eignung jedes Titels und jeder Variante. Serielle Aufgaben skalieren nicht automatisch. | Zulässige Zahl je Variante; Teams/Teilgruppen bei großen Runden. Keine 99-Personen-Freigabe aus reinen Simulationsresultaten ableiten. |

**Bereits gut und zu bewahren:** eigene Paar-Art-Direction, sichtbare Spielauswahl neben Director/Mix, reale Regeln in kanonischen Kernen, optionaler Einstieg ohne Gastkonto, versiegelte Eingaben, Grenzen-/Skip-Ansatz, echte Mehrheitsberechnung, adaptive Dramaturgie und vorhandene reduzierte Bewegung. Diese Grundlagen werden geschärft, nicht durch ein neues Parallelprodukt ersetzt.

## Gemeinsames Erlebnisdesign

### Spielauswahl

Jede Karte beantwortet unmittelbar: Was machen wir? Wie viele spielen sinnvoll? Welches Gerät brauchen wir? Wie lange dauert ein gutes kurzes Spiel? Danach folgt eine drei- bis fünfsekündige **klar markierte Mechanikvorschau**. Sie darf keine Live-Antworten oder schon laufende Musik vortäuschen.

Filter: **Zu zweit / GANG**, **ein Gerät / TV ohne Gäste-Handys / private Geräte**, Dauer und gewünschtes Gefühl. Nicht zuerst technische Transportmodi erklären. Ein gut sichtbarer direkter Start bleibt neben der Director-Empfehlung. Kein obligatorischer Stimmungstest.

### Einstieg und Bedienung

Ziel: vom ausgewählten, zugänglichen Spiel zur ersten sinnvollen Aktion in weniger als 30 Sekunden. Kauf, notwendige Autorisierung und ausführliche private Grenzsetzung werden separat gemessen und nicht heimlich aus einem Gesamtversprechen entfernt. Namen sind bei Couch-Games nur erforderlich, wenn die Mechanik sie wirklich verwendet. Beispielnamen oder Teams erlauben sofortigen Beginn.

Eine Zeile Regel plus eine ungewertete erste Aktion. Details bei Bedarf. Eine Hauptaktion pro Zustand, jederzeit sichtbares Skip/Pause. Spielzustände nennen konkrete Verben: „Wählen“, „Warten auf zwei“, „Gemeinsam aufdecken“, „Nächste Runde“. Humor steht nach der Handlung oder im Reveal, nicht in Fehlermeldungen.

### Vier bewusst verschiedene Darstellungen

| Fläche | Informationshierarchie | Was dort nicht erscheint |
| --- | --- | --- |
| Paar / gemeinsames Handy | Aktive Person → Aufgabe → Entscheidung → leiser Fortschritt | Verpflichtende Tastatur bei normalen Gesprächen, dauernde Punkte in ruhigen Spielen |
| Private Eingabe | Eigene Aufgabe/Geheimkarte → Eingabe → versiegelt | Fremde Antworten, öffentliche Vorabtrends, irrelevante Hoststeuerung |
| TV-Bühne | Frage/Aktion → Countdown oder freigegebenes Ergebnis → gemeinsame Reaktion | Private Rollen, kleine Einstellungsmenüs, lange Tabellen |
| Host-/Teamsteuerung | Nächste erlaubte Aktion → Erfassung echter Resultate → Pause/Korrektur | Erfundene Messwerte oder vollständige Neuerfassung aller Gäste nach jeder Runde |

### Rhythmus, Audio, Bewegung

Bewegung erklärt Zustandswechsel: versiegeln, aufdecken, eine Position setzen, einen Punkt übertragen. Ein Reveal hat eine klare Reihenfolge und höchstens einen Höhepunkt. Mikrofeedback circa 120–220 ms, Übergänge circa 250–450 ms, besonderer Reveal circa 600–1200 ms sind Entwurfswerte, keine gemessenen Idealwerte. Lesezeit bleibt unbegrenzt oder wird separat fair bemessen; ein Effekt darf sie nicht verkürzen.

Sound beginnt nach bewusster Aktivierung. Paar-Gespräche bleiben standardmäßig ruhig. Gruppen-Cues sind kurz; Musik, Sprache und Effekte erhalten getrennte Lautstärken. Kein Informationskanal hängt allein an Ton, Farbe oder Haptik. Reduced Motion behält alle Informationen ohne Kamerafahrt, Schütteln oder Stroboskop.

### Lesbarkeit und Zugänglichkeit

Produktziele: Haupt-Touchflächen 48 CSS-Pixel, Fließtext mobil ab 18 CSS-Pixel, kurze großzügige Aufgabenzeilen, sichtbarer Fokus, Textvergrößerung bis 200 Prozent, Tastaturbedienung, Alternativen zu Ziehen/Halten, stabile Layouts bei Bildschirmtastatur. TV-Aufgaben als Ausgangsentwurf 48–80 px, Optionen 28–40 px bei 1080p, anschließend auf echtem Fernseher aus 2–3 Metern prüfen. Das sind eigene Gestaltungswerte, keine pauschale Gerätegarantie.

Als externe Grundlage gelten WCAG 2.2 und Xbox Accessibility Guidelines: normaler Text mindestens 4,5:1 Kontrast, großer Text 3:1; Fokus sichtbar, Ziehoperationen mit Alternative. Die 48-Pixel-Produktregel ist bewusst strenger als das allgemeine WCAG-2.2-Minimum von 24×24 CSS-Pixeln mit Ausnahmen. Konformität muss am fertigen Produkt geprüft werden, nicht aus einer Checkliste behauptet werden.

- W3C: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Kontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Microsoft: [XAG 101 — Text display](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101).

### Replay und wirtschaftlicher Content

Ein neuer Abend braucht neue Eröffnungen, Themen und Abfolgen, nicht ausschließlich neue Farben oder dieselben Karten in anderer Reihenfolge. Priorität: ungespielte Inhalte, dann lange nicht gespielte; geplante Callbacks ausdrücklich separat markieren. Wiederholungen zwischen verwandten Spielen vermeiden, soweit dieselben Inhalte geteilt werden. Gibt es zu wenig passende Inhalte, offen eine neue Variante anbieten statt „nie dieselbe Nacht“ technisch zu garantieren.

Pro neuem Titel oder Drop zuerst ein redaktionell belastbares Kurzformat. Testziel: drei Kurzsessions hintereinander ohne versehentliche Prompt-Duplikate, sofern der erlaubte Pool ausreicht; genaue Poolgröße und verwendete Inhalte im Testprotokoll nennen. KI ist Ergänzung, nicht Voraussetzung für flüssigen Ablauf und Replay.

Monatliche Drops sind sichtbare neue Themen, Twists oder nachweisbare Verbesserungen. Keine künstliche Pflicht zu einem unfertigen neuen Game pro Monat. Das bestehende Preismodell wird durch diesen UI/UX-Auftrag nicht neu definiert.

### Gruppengröße und Party Director

| Gruppe | Empfohlene Inszenierung |
| --- | --- |
| 2 | Paarregeln oder ausdrücklich geeignete GANG-Duovarianten; keine Mehrheitswahl vortäuschen |
| 3–4 | Direkte Runden, wenige Handgriffe; Mindestspielerzahl pro Titel beachten |
| 5–12 | Couch als starke Standardoption bei öffentlichen Mechaniken; Geheimwahl bei Bedarf parallel |
| 13–30 | Teams, Heats, kleine parallele Ketten; gleiche Lese-/Auftrittszeit |
| 31–99 | Nur dafür geeignete Crowd-/Teamvarianten; aggregierte Ergebnisse, keine Namenswand oder 99 Einzelzüge |

Party Director: leichter gemeinsamer Start, erste Überraschung, intensiverer Höhepunkt, kurze Erholung, passendes Finale. Nicht zwei Tipp-/Schreibspiele direkt hintereinander ohne bewussten Wunsch. Material, Audio und Grenzen vor Auswahl beachten. Keine spontane Gerätepflicht mitten im Mix. Bei Gerätewechsel klarer Übergang zwischen Spielen; die Gruppe bleibt erhalten. Explizit gewählte Reihenfolge bleibt respektiert.

Eine manuell bestätigte Couch-Runde ist kein vollständig hostloses Spiel. Der Host soll mitspielen und nur kurze Ergebnisaktionen übernehmen. Wo mehr Moderation nötig bleibt, muss das Konzept diese Arbeit nennen und im Playtest messen.

## Zustände, die jedes Konzept mitliefert

| Zustand | Verhalten und konkrete Copy-Richtung |
| --- | --- |
| Bereit | Wer handelt, was passiert, eine Hauptaktion. „Ari wählt. Nova schaut kurz weg.“ |
| Versiegelt / Übergabe | Inhalt wirklich entfernt; nächster Name. „Versiegelt. Jetzt Nova.“ |
| Warten | Echte Fortschrittszahl ohne geheime Inhalte. „Sechs von acht sind bereit.“ Keine beschämende Liste langsamer Personen. |
| Timeout | Vorher bekannte Regel; fehlende Antwort ist keine erfundene Stimme. Wiederaufnahme an sicherer Grenze. |
| Verbindungsverlust | „Verbindung unterbrochen. Deine bestätigte Wahl bleibt erhalten.“ Nur sagen, wenn Speicherung bestätigt ist; sonst „Deine Wahl ist noch nicht angekommen.“ |
| Zu wenige Personen | Pausieren, passende Variante anbieten; keine automatische Regelverletzung. |
| Pause / Grenze | Alle relevanten Timer anhalten; eine Stop-Anfrage hat Vorrang vor Reveal. Neutraler Text. |
| Audio-/Kamerafehler | Ursache verständlich, Wiederholen oder passendes anderes Spiel; keine leere Attrappe. |
| Inhaltsende | „Diese Auswahl habt ihr durch. Neues Thema wählen oder bekannte Runden neu mischen.“ |
| Gleichstand | Spielgerechte Auflösung: geteilter Titel, Stichwahl oder angekündigte Extra-Runde. |
| Abschluss | Tatsächliche Momente, klarer Ende-Button, gezielte Revanche. Kein automatisches Sharing. |

## Umsetzungspakete und Abnahme

1. **Vertrag und Wahrheit:** Gerätevarianten registrieren; Übergabe-Klarstellung übernehmen; MUSIC-DROP-Hook, Director-Verfügbarkeit, Material- und Dauertexte angleichen. Vorhandene Korrekturen aus PR #31 integrieren, nicht doppelt implementieren.
2. **Einstieg und Lesbarkeit:** First-Spark-Grid, containerabhängige Vorschauen, kurze Startformate, deutsche Handlungslabels, klare Paar-/GANG-Titel.
3. **Couch-Bühne:** THE MAJORITY, WHO’S THAT?, THE LINE, BAD ANSWERS ONLY, MUSIC DROP und PANIC BUTTON mit echten Join-freien Varianten. Danach TEAM CHAOS und HOT SEAT. Persönliche und manuelle Teamwertung nicht stillschweigend vermischen.
4. **Paar-Player:** Handoff-Ritual, reduzierte Gesprächsoberfläche, Heatcheck-Punkteklarheit, erreichbar kurzes Co-op-Finale und gezielte Echo-Regie.
5. **Private/Medien-Games:** UNDERCOVER, SECRET MISSIONS, BLUFF, PHOTO HUNT, DRAW THIS, ONE OF YOU und AFTER DARK mit passender Privatsphäre, Wiederaufnahme und Gruppenvariante.
6. **Musikfreigabe:** FIRST//BEAT und TIME//DROP erst nach echten Audio-, Metadaten- und Integrationsnachweisen. Bestehende Audio-Nutzungsgrenzen nicht durch UI-Design umgehen.
7. **Spieltests und Feinschliff:** echte Personen, echte Geräte, reale Zeit und Stimmung; danach erst Award-/Premium-Release beurteilen.

Lovable-Credits bleiben für tatsächliche UI-/UX-Umsetzung reserviert. Dieser Audit und die Konzepterstellung lösen keinen Lovable-Build aus. Regeln, Tests, Inhaltsauswahl und Datenverträge bleiben im bestehenden Repo.

### Messbare Freigabekriterien

Diese Schwellen sind Arbeitsziele und Hypothesen, keine Ergebnisse oder wissenschaftlich bewiesenen Spaßwerte:

- Mindestens fünf unabhängige Erstnutzer-Durchläufe je Spielkonzept/zentraler Variante als formative Runde; Paare und Gruppen getrennt. Auffällige Ergebnisse mit weiteren Gruppen prüfen.
- Mindestens vier von fünf Gruppen erklären nach der ersten Runde korrekt, was als Nächstes zu tun ist und wie die Wertung entsteht. Keine führende Moderation während der Aufgabe.
- Median vom ausgewählten zugänglichen Game bis erster Aktion unter 30 Sekunden; p90 gesondert berichten. Kauf-/Autorisierungszeiten zusätzlich erfassen.
- In schnell getakteten GANG-Spielen keine unbeabsichtigte Wartezeit über 20 Sekunden; bewusstes Gespräch/Performance ist keine Wartezeit. 13–30 und 31–99 separat messen.
- Zweite Session freiwillig anbieten; tatsächliche Wiederwahl, Abbruchgründe und Langeweile qualitativ erfassen. Kein erzwungener Replay-CTA als Erfolgsnachweis.
- Je Titel mindestens eine komplette Runde plus Finale, Replay, Skip, Pause und Unterbrechung auf jedem freigegebenen Gerätepfad. Private Eingaben zusätzlich gegen Fehlanzeige prüfen.
- 390×844, 375×667, Tablet, Desktop, 1080p-TV; echte Safari-/Android-Tests mit Tastatur, Textzoom und Reduced Motion. Keine erfundenen Pass-Resultate.
- Remote-Teilnahme, Couch-Teams und 99-Geräte-Transport sind verschiedene Prüfungen. Eine Simulation ersetzt nicht den jeweiligen Erfahrungs- oder Lasttest.
- Jede beworbene Mechanik ist tatsächlich bedienbar. Kein Spiel erhält das Fertig-Siegel allein wegen bestandener Unit-Tests.

## Einzelkonzepte

Die folgenden Profile werden aus `ui-ux-game-concepts-2026.json` erzeugt. Das ergänzende `ui-ux-concept-atlas-2026.html` ist ein lokales visuelles Entwurfsboard mit ausdrücklich fiktiven Beispieldaten, keine laufende NOCTURNE-Session.

<!-- GAME_PROFILES -->

| # | Spiel | Empfohlene Spielweise | Format |
| --- | --- | --- | --- |
| 01 | First Spark | ONE PHONE | 15 Minuten empfohlen · 15/30/60/Open End |
| 02 | After Dark | ONE PHONE | 20–30 Minuten empfohlen · Kurzformat verfügbar |
| 03 | Night Shift | ONE PHONE | 30 Minuten empfohlen · Open End optional |
| 04 | Heatcheck | HYBRID | 15–30 Minuten · kurze Duelle |
| 05 | US//AFTER DARK | ONE PHONE | 30 Minuten empfohlen · 15/30/60 |
| 06 | ONE//TWO | ONE PHONE | 15 Minuten oder so lange das Gespräch trägt |
| 07 | NIGHT//ECHO | ONE PHONE | 20–30 Minuten · erster Echo-Moment im Kurzformat |
| 08 | NIGHT//ECHO — Director | ONE PHONE / optional HYBRID | 30 Minuten empfohlen · 15/30/60/Open End |
| 09 | PASS//THE AUX | ONE PHONE mit inszenierter Übergabe | 15–30 Minuten · 5–8 Song-Momente |
| 10 | THE MAJORITY | HYBRID · Couch empfohlen | 8–12 Minuten · 3–99, Crowd als Teams |
| 11 | WHO’S THAT? | BIG SCREEN / ONE PHONE | 6–10 Minuten · 3–99 in passenden Gruppen |
| 12 | UNDERCOVER | EVERYONE IN · ONE PHONE für kleine Runden | 10–15 Minuten · 4–30 |
| 13 | SECRET MISSIONS | HYBRID · private Zuteilung, danach Raumspiel | 20–45 Minuten neben anderen Spielen · 3–30 |
| 14 | BAD ANSWERS ONLY | HYBRID · Couch oder anonyme Schreibedition | 8–12 Minuten · 3–30 |
| 15 | BLUFF | EVERYONE IN | 10–15 Minuten · 3–20 |
| 16 | THE LINE | BIG SCREEN / ONE PHONE | 6–10 Minuten · 4–99 mit Zonen |
| 17 | HOT SEAT | HYBRID | 8–15 Minuten · 3–20 |
| 18 | TEAM CHAOS | BIG SCREEN + höchstens Teamgeräte | 15–20 Minuten · 6–99 |
| 19 | PHOTO HUNT | HYBRID · ein Kameragerät pro Team | 8–12 Minuten · 3–30 |
| 20 | DRAW THIS | HYBRID · Papier-Couch als Startvariante | 10–15 Minuten · 3–30 |
| 21 | MUSIC DROP | HYBRID · Couch-Songbattle / private Picks | 10–15 Minuten · 2–99 als Teams |
| 22 | CHAIN REACTION | ONE PHONE / BIG SCREEN | 5–8 Minuten · 3–30 in kleinen Ketten |
| 23 | ONE OF YOU | EVERYONE IN · Pass-Modus für kleine Gruppen | 10–15 Minuten · 4–30 |
| 24 | PANIC BUTTON | ONE PHONE / BIG SCREEN | 4–7 Minuten · 2–99 in Teams/Spuren |
| 25 | AFTER DARK · GANG | HYBRID · private Grenzen, gemeinsamer Screen | 10–20 Minuten · 2–20 Erwachsene |
| 26 | FIRST//BEAT | HYBRID · Paar ONE PHONE, GANG TV/Teams | 10–15 Minuten · Verfügbarkeit noch gesperrt |
| 27 | TIME//DROP | HYBRID · Paar ONE PHONE / GANG TV+Teams | 12–20 Minuten · 2–99 mit geeigneter Variante |

### 01 · First Spark

**Zu zweit · ONE PHONE**

15 Minuten empfohlen · 15/30/60/Open End

**Auditbefund.** Ein klares, leichtes Wechselspiel ist vorhanden. Die öffentliche Detailvorschau bricht am Desktop fast wortweise um; die ausgewiesenen 30–60 Minuten erhöhen unnötig die Einstiegshürde. Im Implementierungszweig sind Kurzformate bereits angelegt.

**Core Fantasy.** Aus zwei Leuten wird ein gemeinsamer Rhythmus: erst lachen, dann etwas Unerwartetes voneinander erfahren.

**10-Sekunden-Regel.** Ihr wechselt euch ab: eine Frage, eine kleine Aktion, eine überraschende Vorhersage.

**Beste Spielweise und Übergabe.** Das Handy liegt zwischen euch. Nur bei einer geheimen Vorhersage wird gewählt, versiegelt und einmal übergeben. Kein QR-Setup im empfohlenen Einstieg.

**UI und Art Direction.** Warme Papierfläche mit Korall-Akzent, zwei kleine Namensmarken und eine große Frage. Die aktive Person ist mit Namen und Position markiert. Dekorative Lichtflächen reagieren nur auf den Wechsel und konkurrieren nicht mit dem Text.

**Einstieg und Game Loop.** Mit zwei optionalen Namen und 15 Minuten starten. Eine leichte Mini-Aktion eröffnet; danach abwechselnd Frage, Vorhersage und gemeinsame Aufgabe. Nach drei Szenen ein kleiner überraschender Perspektivwechsel. Gesprächszeit hat keinen Countdown.

**Reveal.** Vorhersage und tatsächliche Wahl erscheinen nebeneinander. Bei normalen Gesprächsfragen gibt es keinen künstlichen Ergebnisbildschirm.

**Finale.** Eine letzte gemeinsame Wahl: Welchen Moment würdet ihr wiederholen? Danach Abschluss oder drei neue Szenen; keine Bewertung der Beziehung.

**Wiederspielwert.** Andere Eröffnungsfamilie und ungespielte Fragen bevorzugen; beantwortete Karten nicht nur neu sortieren. Intensität nur innerhalb eures gewählten Rahmens.

**Sonderfälle und Grenzen.** Skip tauscht die Szene ohne Kommentar. An einem Handy werden private Inhalte bei Übergabe vollständig verdeckt; nach Reload kein versehentliches Wiederanzeigen.

**Abnahme.** Beide können nach der ersten Szene den Wechsel erklären. Die Vorschau bleibt bei 390, 768 und 1440 Pixeln lesbar. Erste Aktion im bezahlten oder freien zugänglichen Einstieg unter 30 Sekunden.

**Beispiel-Copy:** „Was wäre unser völlig unnötiges gemeinsames Talent?“ → **Gesagt · jetzt du** → „Okay. Unerwartet gutes Team.“

### 02 · After Dark

**Zu zweit · ONE PHONE**

20–30 Minuten empfohlen · Kurzformat verfügbar

**Auditbefund.** Timer, Roulette und Tempowechsel sind eigenständige Mechaniken. Die Detailseite nennt 45–90 Minuten und teilt den Namen mit dem anders funktionierenden GANG-Spiel; Übergänge müssen besser erklären, welche Regel gerade gilt.

**Core Fantasy.** Eine kleine private Gameshow, deren nächste Wendung ihr beide noch nicht kennt.

**10-Sekunden-Regel.** Kurze Challenges, ein Zufallsrad und neue Regeln: Macht mit, solange es euch Spaß macht.

**Beste Spielweise und Übergabe.** Ein Handy als gemeinsames Requisit; Übergabe bei verdeckter Wahl gehört dazu. Das Gerät liegt bei körperlichen Aufgaben sicher ab. Zwei Controller sind eine optionale Variante.

**UI und Art Direction.** Kinetische, breite Typografie; bernsteinfarbener Timer; eine klar beschriftete Regelkarte am oberen Rand. Der aktive Countdown ist der Hauptgegenstand, nicht ein zusätzliches Widget unter langer Erklärung.

**Einstieg und Game Loop.** Erste 20-Sekunden-Challenge als Einführung. Abwechselnd Aktion, freie Reaktion und kurze geheime Wahl. Neue Sonderregel immer vor dem Start zeigen; Timer erst nach Bereitschaft. Keine drei hektischen Runden hintereinander.

**Reveal.** Das Rad stoppt einmal eindeutig. Regelwechsel erhalten einen kurzen Cut; die neue Regel bleibt bis zum Ende ihrer Gültigkeit sichtbar.

**Finale.** Ein gemeinsamer 45-Sekunden-Mix aus zwei bekannten Mechaniken, dann ruhiger Abspann. Verlängerung startet einen neuen Bogen.

**Wiederspielwert.** Mechanikfolgen und Aufgabenfamilien variieren, bekannte Regeln später kombinieren. Kein Zufall, der ausschließlich mehr Hektik produziert.

**Sonderfälle und Grenzen.** Timer pausierbar, Effekte und Haptik abschaltbar; entspannter Modus verlängert Zeiten vor dem Start. Kein Punktverlust für Grenzen oder Skip.

**Abnahme.** Die nächste Aktion ist in jeder Phase ohne Erklärung erkennbar. Pause hält den Timer tatsächlich an. Der Paarzusatz verhindert Verwechslung mit AFTER DARK im GANG MODE.

**Beispiel-Copy:** „Verkauft euch gegenseitig diesen völlig normalen Stuhl.“ → **Challenge starten** → „Starker Pitch. Fragwürdiges Produkt.“

### 03 · Night Shift

**Zu zweit · ONE PHONE**

30 Minuten empfohlen · Open End optional

**Auditbefund.** Die Engine hält eine Richtung über drei Szenen; UI und Copy versprechen teilweise Steuerung nach jeder Szene. Der Nutzen muss sichtbar werden, ohne ständig vier Entscheidungen abzufragen.

**Core Fantasy.** Ihr könnt den Abend lenken und euch trotzdem überraschen lassen.

**10-Sekunden-Regel.** Wählt eine Richtung. Drei Szenen folgen ihr; dann könnt ihr neu abbiegen.

**Beste Spielweise und Übergabe.** Ein gemeinsames Handy mit optionaler Übergabe für geheime Szenen. Die Richtungswahl erfolgt gemeinsam; zwei Geräte dürfen keine widersprüchlichen Richtungen auslösen.

**UI und Art Direction.** Dunkelblaue Editorial-Fläche, ein klarer Drei-Szenen-Pfad und drei oder vier zulässige Richtungen. Die aktuell gewählte Richtung ist beschriftet; keine abstrakte Strecke ohne Bedeutung.

**Einstieg und Game Loop.** Mit einer kurzen Szene beginnen; danach freiwillig lustiger, näher oder spielerischer wählen. Drei Szenen bilden einen Mini-Bogen. Eine passende Orts- oder Perspektivänderung kann angeboten werden; nicht automatisch voraussetzen.

**Reveal.** Der Pfad biegt sichtbar ab und die nächste Szene löst die Wahl ein. Geheime Szenen verwenden denselben verlässlichen Übergabeschutz wie First Spark.

**Finale.** Der gewählte Zeitrahmen führt zu einem Abschluss an der Szenengrenze. Zeigt die gemeinsame Route ohne sensible Antworten und bietet einen neuen Abzweig an.

**Wiederspielwert.** Andere Abzweigfolgen, Themenwechsel und seltene Umwege. Nicht nur dieselben Fragen unter einer anderen Richtung.

**Sonderfälle und Grenzen.** Eine neue Grenze wirkt sofort, auch während eines laufenden Bogens. Unpassender Ortswechsel wird durch eine sitzende Alternative ersetzt.

**Abnahme.** Jede Richtungswahl verändert nachvollziehbar die nächsten drei Szenen. Ein 15-Minuten-Format endet ohne abrupt abgeschnittenes Gespräch.

**Beispiel-Copy:** „Wohin soll der nächste Teil eures Abends?“ → **Richtung wählen** → „Drei Szenen. Ein kleiner Umweg.“

### 04 · Heatcheck

**Zu zweit · HYBRID**

15–30 Minuten · kurze Duelle

**Auditbefund.** Punktestand, Streaks und Power-ups sind vorhanden, aber viele Signale konkurrieren. Im Lovable-Player steht noch, dass Rebound-Skip dem Gegenüber +2 bringt; der offene Implementierungszweig dokumentiert die Korrektur bereits.

**Core Fantasy.** Ein freches Duell, das durch kluge Einsätze kippen kann und nach einer Revanche verlangt.

**10-Sekunden-Regel.** Gewinnt kurze Challenges. Setzt euren Bonus vor der Aktion. Das Finale kann den Abend drehen.

**Beste Spielweise und Übergabe.** Ein Handy ist der vollwertige Standard für abwechselnde Duelle. Verdeckte Einsätze werden versiegelt übergeben. Zwei Geräte gezielt für gleichzeitige Vorhersagen anbieten, nicht beim Start erzwingen.

**UI und Art Direction.** Zwei kontrastierende Spielfeldhälften; Punktestand kompakt oben, Challenge mittig. Höchstens ein kontextuell relevanter Power-up-CTA neben der Hauptaktion. Streaks erst erklären, wenn sie entstehen.

**Einstieg und Game Loop.** Ein Probeduell ohne Einsatz, dann kurze Sets aus drei Challenges. Bonuswirkung vor Bestätigung numerisch zeigen. Zwischen Sets kurzer Zwischenstand; Comeback-Regel offen erklären.

**Reveal.** Erst beide Entscheidungen, dann nachvollziehbares Punkte-Delta. Nicht gleichzeitig Konfetti, Streak-Banner, Power-up und Rangwechsel animieren.

**Finale.** Angekündigter Showdown mit vorher sichtbarem Einsatz. Danach Matchverlauf und Revanche mit vertauschter Startperson.

**Wiederspielwert.** Neue Duellfamilien, faire Startrotation und wechselnde taktische Möglichkeiten; keine versteckten Handicap-Eingriffe.

**Sonderfälle und Grenzen.** Grenzen-Skip neutralisiert Einsätze und vergibt niemandem einen Vorteil. Uneinigkeit über eine Aufgabe führt zu Wiederholung oder ungewerteter Runde, nicht Host-Willkür.

**Abnahme.** Beide können jeden Punktewechsel erklären. Ein privater Einsatz ist vor Reveal nicht sichtbar. Skip gewährt auf keinem Gerätepfad einen Bonus.

**Beispiel-Copy:** „Wer bringt den anderen zuerst zum Lachen?“ → **Duell starten** → „Comeback? Offenbar.“

### 05 · US//AFTER DARK

**Zu zweit · ONE PHONE**

30 Minuten empfohlen · 15/30/60

**Auditbefund.** Drei Energien und Vault-Ende geben ein klares gemeinsames Ziel. Prozentwerte und abstrakte Form erklären jedoch nicht von selbst, was als Nächstes hilft; die live genannten 60–180 Minuten wirken verpflichtend lang.

**Core Fantasy.** Gemeinsam etwas öffnen, das keiner allein freispielen kann.

**10-Sekunden-Regel.** Sammelt gemeinsame Momente in drei Bereichen und öffnet euren Vault.

**Beste Spielweise und Übergabe.** Ein Handy zwischen euch. Nur private Wünsche werden mit Übergabe geschützt. Gemeinsames Entscheiden braucht keine separaten Controller.

**UI und Art Direction.** Drei verständlich benannte Segmente um einen zentralen Vault. Jede Aufgabe nennt ihren Beitrag. Die organische Form bleibt als Belohnung erhalten, nicht als einzige Fortschrittsanzeige.

**Einstieg und Game Loop.** Erste gemeinsame Aufgabe füllt sichtbar ein Segment. Szenen wechseln zwischen Lachen, Nähe und Spannung. Zeitformat bestimmt erreichbare Etappen; intime Inhalte sind für keinen Bereich zwingend.

**Reveal.** Nach einer Aufgabe ein Segmentfortschritt mit konkreter Begründung. Meilensteine öffnen kleine gemeinsame Entscheidungen statt bloß höherer Zahlen.

**Finale.** Vault öffnet eine eigens geschriebene gemeinsame Abschlussaufgabe. Ein vorzeitiger Abschluss würdigt Erlebtes und nennt euch nicht gescheitert.

**Wiederspielwert.** Mehrere Vault-Abschlüsse und unterschiedliche Wege dorthin. Nicht dauerhaft die schwächste Kategorie erzwingen.

**Sonderfälle und Grenzen.** Alle drei Bereiche bleiben mit ausgeschaltetem Sinnlichkeits- und Berührungsmodul erreichbar. Keine moralische Bewertung geringer Heat-Werte.

**Abnahme.** Ein Kurzspiel erreicht ein befriedigendes Ende ohne optionale Intimität. Beide wissen, welche gemeinsame Aktion gerade Fortschritt erzeugt hat.

**Beispiel-Copy:** „Erfindet einen Werbespot für eure Couch. Gemeinsam.“ → **Unsere Challenge starten** → „Das letzte Stück passt nur zu zweit.“

### 06 · ONE//TWO

**Zu zweit · ONE PHONE**

15 Minuten oder so lange das Gespräch trägt

**Auditbefund.** Die reduzierte Frage-und-Wechsel-Mechanik ist die Stärke. Zusätzliche globale Bedienelemente, Endlos-Versprechen und universelle Abschlussmuster dürfen diese Ruhe nicht verwässern.

**Core Fantasy.** Eine Frage stellt plötzlich etwas in Bewegung, ohne dass die App das Gespräch übernimmt.

**10-Sekunden-Regel.** Eine Frage für dich. Eine für mich. Ihr nehmt euch die Zeit, die ihr wollt.

**Beste Spielweise und Übergabe.** Das Handy bleibt liegen. Wer vorliest, kann es freiwillig nehmen; kein vorgeschriebener Übergabe-Screen. Keine Registrierung des Gesagten.

**UI und Art Direction.** Helles warmes Papier als bewusster Kontrast zur Nachtmarke. Ein Name, eine großzügig gesetzte Frage, ein leiser Weiter-Button und sichtbares Skip. Keine Punktestände, Zähler oder animierten Hintergründe.

**Einstieg und Game Loop.** Eine leichte Frage eröffnet, eine Antwort führt direkt zur anderen Person. Nach mehreren Fragen greift eine Gegenfrage einen Blickwinkel wieder auf. Gespräch wird niemals automatisch unterbrochen.

**Reveal.** Hier ist die gesprochene Antwort der Höhepunkt. Die UI bleibt still und benötigt keinen Ergebnis-Screen.

**Finale.** Eine beidseitige Schlussfrage, dann ein ausdrücklicher Ende-Button. Weitere Fragen nur auf Wunsch, nicht als Schuldgefühl-CTA.

**Wiederspielwert.** Themen und Perspektiven variieren; bewusst gekennzeichnete Rückfragen unterscheiden sich von versehentlichen Duplikaten.

**Sonderfälle und Grenzen.** Skip wechselt die Frage ohne Rollenchaos. Großschrift und Screenreader funktionieren ohne Informationsverlust. Pause hat keine Kosten.

**Abnahme.** Vom zweiten Zug an nur ein Tap pro Gesprächswechsel. Kein Pflichttextfeld, kein Pflicht-Timer, keine behauptete Erfassung gesprochener Antworten.

**Beispiel-Copy:** „Was sollten wir öfter machen, obwohl es nichts kostet?“ → **Jetzt du** → „Die nächste Frage kann warten.“

### 07 · NIGHT//ECHO

**Zu zweit · ONE PHONE**

20–30 Minuten · erster Echo-Moment im Kurzformat

**Auditbefund.** Optionale Notizen und spätere Echos sind implementiert. Der Hook kann nach automatischem Zuhören klingen; Memory Core und Anchors sind intern verständlich, für Gäste aber unnötig technisch.

**Core Fantasy.** Ein beiläufiger Satz kommt später perfekt getimt zurück und wird zu eurem Insider.

**10-Sekunden-Regel.** Merkt euch auf Wunsch einen kurzen Satz. Später macht das Spiel etwas Neues daraus.

**Beste Spielweise und Übergabe.** Ein gemeinsames Handy. Optionales Notieren ist sinnvoller Teil des Spiels, kein Protokollzwang. Private Notizen nur verdeckt erfassen; Übergabe nur bei echten Geheimnissen.

**UI und Art Direction.** Eine ruhige Frage und ein eingeklappter Randbereich „Für später merken“. Beim Echo erscheint derselbe Satz in neuer typografischer Umgebung mit klarer Herkunft, nicht als Chatverlauf.

**Einstieg und Game Loop.** Gespräch beginnen, freiwillig ein kurzes Motto notieren, einige andere Szenen spielen, dann ein passender Callback. Ohne Notiz bleibt ein vollwertiges Gesprächsspiel; keine erfundenen Erinnerungen.

**Reveal.** Ein einziges Echo setzt den früheren Satz in eine überraschende Aufgabe. Keine gleichzeitige Liste aller Notizen.

**Finale.** Bis zu drei freigegebene harmlose Erinnerungen. Dauerhaft sichern nur einzeln und ausdrücklich; leerer Rückblick wird ohne Defizittext behandelt.

**Wiederspielwert.** Neue Callback-Formen und Abstand zwischen Wiederaufnahmen; nur in der Session erlaubte Notizen nutzen.

**Sonderfälle und Grenzen.** Löschen entfernt auch geplante Echos. Private Notizen werden weder auf TV noch in KI-Kontext oder automatischem Sharing verwendet.

**Abnahme.** Menschen verstehen vor Eingabe, dass kein Mikrofon mithört und was gespeichert wird. Ein gelöschter Satz taucht später nicht wieder auf.

**Beispiel-Copy:** „Eben noch euer Motto. Jetzt eure Oscar-Rede.“ → **Echo spielen** → „Das habt ihr selbst gesagt.“

### 08 · NIGHT//ECHO — Director

**Zu zweit · ONE PHONE / optional HYBRID**

30 Minuten empfohlen · 15/30/60/Open End

**Auditbefund.** Adaptive Szenenmischung und lokaler Ersatz sind vorgesehen. Öffentliche Demo und Beschreibung sprechen pauschal von live generierten Szenen; im Implementierungsbericht bleibt die globale KI-Freigabe aus. Laufzeitverfügbarkeit ist nicht allein durch den Text belegt.

**Core Fantasy.** Ein aufmerksamer Gastgeber trifft überraschend oft den richtigen nächsten Moment.

**10-Sekunden-Regel.** Sagt, worauf ihr Lust habt. Der Director mischt Szenen und reagiert auf eure Entscheidungen.

**Beste Spielweise und Übergabe.** Ein Handy mit gezielten Übergaben. Zwei Geräte nur bei gewünschter gleichzeitiger Geheimwahl. Der Director wechselt Geräteanforderungen nicht überraschend mitten im Abend.

**UI und Art Direction.** Eine Szenenbühne, darüber ein kleiner Kapitelhinweis. Die Regie tritt nur bei einem wirklichen Wendepunkt hervor. Kein dauerhafter KI-Chat, keine internen Modell- oder Budgetmeldungen.

**Einstieg und Game Loop.** Lokale Einstiegsszene sofort verfügbar. Drei bis fünf Szenen pro Bogen; Tempo und Formate wechseln anhand nicht sensibler Spielereignisse. Nur gelegentlich fragt eine klare Richtungsauswahl nach.

**Reveal.** Ein Director Cut inszeniert Stille, Rollentausch oder einen freigegebenen Callback. Der Wechsel muss in der nächsten Aufgabe erlebbar sein.

**Finale.** Passender Abschluss aus tatsächlich gespielten Mechaniken; keine automatisch erfundene Beziehungsauswertung. Optional ein weiterer kurzer Akt.

**Wiederspielwert.** Neue Kombinationen und redaktionelle Varianten zuerst; KI ergänzt nur bei verfügbarer Funktion. Keine Einzigartigkeitsgarantie für jede Szene.

**Sonderfälle und Grenzen.** Ausfall führt ohne blockierende Warteschleife zur lokalen Szene. Wenn eine ausdrücklich aktivierte KI-Option nicht verfügbar ist, erklären die Einstellungen den Zustand ehrlich.

**Abnahme.** Ein kompletter Kurzabend funktioniert bei deaktivierter KI. Alle angebotenen Cut-Aktionen sind ausführbar; private Echos verlassen das Gerät nicht.

**Beispiel-Copy:** „Drei Fragen waren genug. Jetzt wird getauscht.“ → **Nächste Szene** → „Ein kleiner Schnitt. Ein anderer Abend.“

### 09 · PASS//THE AUX

**Zu zweit · ONE PHONE mit inszenierter Übergabe**

15–30 Minuten · 5–8 Song-Momente

**Auditbefund.** Versiegelte Songwahl, Duett und Tracklist bestehen. Der Standard ist manuelle Eingabe; Audio hängt an real konfigurierten Fähigkeiten. Der Unterschied zwischen Song nennen und Song hören muss vor Beginn klar sein.

**Core Fantasy.** Mit einem Song etwas über euch sagen, das als normale Antwort nie herausgekommen wäre.

**10-Sekunden-Regel.** Wählt einen Song zum Moment. Versteckt die Wahl, gebt das Handy weiter und deckt gemeinsam auf.

**Beste Spielweise und Übergabe.** Die Übergabe ist das Ritual: auswählen, versiegeln, an die namentlich genannte Person geben. Beide wählen nur im Duett; Solo-Song erfordert keine zweite Pflichtantwort. Zwei Geräte als Komfortvariante.

**UI und Art Direction.** Plattenhüllen mit echter Metadatenquelle, große Songtitel und eine sichtbare Versiegelung. Keine laufende Wellenform ohne Ton. Suche mit eindeutiger Auswahl statt mehreren administrativen Titel-/Interpret-Schritten.

**Einstieg und Game Loop.** Audiofähigkeit vor der ersten Runde verständlich anzeigen. Prompt, Songwahl, geschützter Handoff, zweite Wahl oder Vibe-Tipp, gemeinsames Reveal. Danach Raum für die Geschichte zum Song; Reaktionsbutton freiwillig.

**Reveal.** Beide Hüllen öffnen gleichzeitig. Ein echter identischer Track erzeugt Match; unterschiedliche Songs werden gleichwertig gezeigt. Wiedergabe nur mit tatsächlichem Play-Zustand.

**Finale.** Tracklist der gemeinsamen Momente. Export oder Playlist nur bei vorhandener Funktion und ausdrücklicher Aktion.

**Wiederspielwert.** Neue Situationen und Rollen; Duett, Widmung und Vibe-Tipp wechseln. Musikgeschmack erweitert den Inhalt, ersetzt aber nicht gute Prompts.

**Sonderfälle und Grenzen.** Keine Abfahrt auf Login-/Suchseiten als vermeintliche Wiedergabe. Ohne Audio ehrlicher Song-Talk-Modus; bei fehlendem Track überspringen oder manuell benennen.

**Abnahme.** Kein geheimer Titel blitzt bei Übergabe/Reload auf. Jede Play-Schaltfläche spielt tatsächlich oder erklärt den Fehler. Match wird nicht vom Nutzer als Verwaltungsaufgabe bestätigt.

**Beispiel-Copy:** „Unser Abspann. Genau ein Song.“ → **Song versiegeln** → „Zwei Songs. Eine ziemlich gute Geschichte.“

### 10 · THE MAJORITY

**GANG MODE · HYBRID · Couch empfohlen**

8–12 Minuten · 3–99, Crowd als Teams

**Auditbefund.** Prognose und eigene Wahl sind getrennt modelliert. Live verlangt BIG SCREEN weiterhin QR-Controller; One Phone sammelt Einzelzüge. Das ist keine echte Couch-Variante.

**Core Fantasy.** Den Raum besser lesen als der Raum sich selbst.

**10-Sekunden-Regel.** Tippt zuerst die Mehrheitsantwort. Dann entscheidet jeder selbst. Jetzt zeigt sich, wer euch kennt.

**Beste Spielweise und Übergabe.** TV/Laptop mit Hostgerät ohne Gäste-Join als neue Couch-Variante. Teams nennen vorab öffentlich ihre Prognose; danach alle gleichzeitig Fingerzeichen 1–4, Host zählt. Bei 3–12 gehen auch persönliche offene Tipps. Everyone In bewahrt individuelle geheime Prognosen.

**UI und Art Direction.** Vier sehr große Antwortfelder, getrennte Kennzeichnung „Euer Tipp“ und „Deine Wahl“. Ergebnis als beschriftete Verteilung; keine erfundenen Prozentwerte bei nur grob erfasstem Couch-Ergebnis.

**Einstieg und Game Loop.** Eine ungewertete Beispielrunde; Prognosen festhalten, Countdown, gleichzeitige Wahl, Ergebnis erfassen und aufdecken. Teams reduzieren Host-Arbeit bei großen Gruppen.

**Reveal.** Erst die reale Verteilung, dann richtige Prognosen und ein trockener Kommentar. Gleichstand zeigt alle Spitzenoptionen.

**Finale.** Blind Majority: Optionsset sichtbar, Frage erst nach Prognose. Als ausdrücklich angekündigter Twist, nicht als kaputte Informationsreihenfolge.

**Wiederspielwert.** Polarisierende und verbindende Themen mischen; keine Wiederholung derselben Frage in einem Abend. Neue Gruppe erzeugt neue Verteilungen.

**Sonderfälle und Grenzen.** Couch-Teamwertung und digitale Einzelwertung getrennt erklären. Unklare Handzeichen nachzählen; fehlende Stimmen nicht als Wahl erfinden.

**Abnahme.** Eine komplette Couch-Session startet ohne Gastgerät. Eigene Wahl und Prognose werden von allen unterschieden; jede Ergebniszahl stammt aus einer Eingabe.

**Beispiel-Copy:** „Was rettet einen verkorksten Abend?“ → **Alle zeigen in 3 · 2 · 1** → „Fast einstimmig. Einer hat Fragen.“

### 11 · WHO’S THAT?

**GANG MODE · BIG SCREEN / ONE PHONE**

6–10 Minuten · 3–99 in passenden Gruppen

**Auditbefund.** Zeigen auf Personen passt bereits zur Fantasie; der One-Phone-Player verwendet jedoch die allgemeine private Eingaberoutine. Die Titelgalerie wird im offenen Zweig ergänzt.

**Core Fantasy.** Alle denken an dieselbe Person – und genau das ist der Witz.

**10-Sekunden-Regel.** Lest die Frage. Zeigt gleichzeitig. Die Runde vergibt ihren Titel.

**Beste Spielweise und Übergabe.** Gemeinsamer Screen ohne Join. Host trägt nur nominierte Person oder Gleichstand ein. Everyone In für anonyme Stimmen optional. Ab 13 in bekannte Teilgruppen oder Teams; bei 99 nicht 99 Namen einzeln suchen lassen.

**UI und Art Direction.** Frage als Bühnenplakat, kurze Namenskarten, sichtbarer 3–2–1-Moment. Ein Spotlight wandert erst nach dem Reveal; keine suggestive Animation vor Abstimmung.

**Einstieg und Game Loop.** Frage, gleichzeitig zeigen, Sieger oder geteilter Titel, freiwillige kurze Reaktion, nächste Frage. Unterschiedliche Themen verhindern eine dauernde Zielperson.

**Reveal.** Ein humorvoller, harmloser Titel statt Rangliste vermeintlich schlechter Eigenschaften.

**Finale.** Drei echte Titel des Abends als Galerie. Gruppe entscheidet, ob sie sie sehen oder sichern möchte.

**Wiederspielwert.** Andere Nominierungsdimensionen und ausgewogene Verteilung der Aufmerksamkeit. Kein garantierter Titel für alle ohne tatsächliche Stimmen.

**Sonderfälle und Grenzen.** Nominierung ablehnen möglich; Fragen austauschbar. Kein Kommentar zu Nichtmitmachen und keine sensiblen Persönlichkeitsdiagnosen.

**Abnahme.** Bei acht Personen eine Runde ohne acht Bildschirm-Eingaben. Gleichstand erhält einen eigenen Zustand, keine zufällige Auflösung.

**Beispiel-Copy:** „Wer würde aus Versehen auf einer fremden Hochzeit landen?“ → **Gemeinsam zeigen** → „Der Raum hat einen Verdacht.“

### 12 · UNDERCOVER

**GANG MODE · EVERYONE IN · ONE PHONE für kleine Runden**

10–15 Minuten · 4–30

**Auditbefund.** Geheimrollen, Hinweise, Abstimmung und Finale existieren. One Phone wird live generell empfohlen; für 20–30 Personen entsteht dabei eine lange Verteilrunde. Die genaue Rolleninformation muss mit der Regel übereinstimmen.

**Core Fantasy.** Bluffen, obwohl du weniger weißt – und durch ein einziges seltsames Wort auffallen.

**10-Sekunden-Regel.** Lest eure geheime Karte. Gebt reihum einen Hinweis. Findet die Person mit der anderen Information.

**Beste Spielweise und Übergabe.** Private Karten auf eigenen Handys, danach Geräte ablegen und sprechen. Für 4–8 ist eine einmalige geschützte Verteilung auf einem Handy vollwertig. TV zeigt nur Redeordnung und Abstimmung.

**UI und Art Direction.** Violette Geheimkarte mit neutraler Rückseite, Namensring für die Redeordnung und klare geheime Wahl. Kein Rollenwort in Übergabebanner, URL oder öffentlicher Zusammenfassung.

**Einstieg und Game Loop.** Karte lesen und verdecken; ein Hinweis je Person; kurze offene Diskussion; gleichzeitiger Verdacht; Reveal. Ab 13 kleinere parallele Tische statt minutenlangem Vorlesen aller Hinweise.

**Reveal.** Zuerst Verdacht, dann beide tatsächlichen Wortinformationen nebeneinander und Rollenauflösung.

**Finale.** Ab acht Personen optional angekündigtes Doppel-Undercover; klare abweichende Siegbedingung vor Beginn.

**Wiederspielwert.** Wortpaare, Startperson und Rollenvergabe variieren. Niemand erhält dieselbe Sonderrolle systematisch mehrfach.

**Sonderfälle und Grenzen.** Bei Gleichstand kurze Stichwahl. Nach Abbruch geheime Karte wieder verdeckt; Abwesenheit stoppt nicht endlos die Runde.

**Abnahme.** TV und fremde Clients erhalten keine Rolleninformation. Die Kartenregel stimmt mit der tatsächlich ausgegebenen Information überein.

**Beispiel-Copy:** „Deine Karte ist privat. Dein nächstes Wort nicht.“ → **Karte ansehen** → „Ein Wort war eines zu viel.“

### 13 · SECRET MISSIONS

**GANG MODE · HYBRID · private Zuteilung, danach Raumspiel**

20–45 Minuten neben anderen Spielen · 3–30

**Auditbefund.** Die Fantasie ist ein Nebenbei-Spiel. Der Live-Player führt noch einen linearen Perform-Ablauf; der offene Zweig enthält bereits einen sessionweiten Missionszustand und einen Missionsbereich.

**Core Fantasy.** Am Ende erfahren, dass die seltsamen kleinen Momente des Abends alle einen Grund hatten.

**10-Sekunden-Regel.** Erfülle deinen geheimen Auftrag im echten Raum. Bleib unentdeckt bis zur Auflösung.

**Beste Spielweise und Übergabe.** Private eigene Karte bevorzugt; in kleinen Gruppen einmalige Handy-Übergabe. Danach wird kein permanenter Blick aufs Handy verlangt. Als Director-Zusatz optional.

**UI und Art Direction.** Eine diskrete versiegelte Mission mit „Erfüllt“ und „Auftrag tauschen“. Auf dem TV nur ein neutrales Missionssymbol, kein individueller Fortschritt.

**Einstieg und Game Loop.** Zuteilen, in andere Games zurückkehren, bei Gelegenheit erledigt melden; begrenzter Verdacht. Keine Zwischenansage, die jemanden als Missionsträger verrät.

**Reveal.** Chronologischer Rückblick auf gemeldete Ereignisse, mit Spielerklärung: „Deshalb wolltest du plötzlich …“. Zeiten als gemeldet kennzeichnen, nicht als automatisch beobachtet.

**Finale.** Missionen einzeln aufdecken, kurze Geschichten zulassen; unerledigte Aufträge ohne Bloßstellung abschließen.

**Wiederspielwert.** Missionsfamilien, Zielpersonen und Bedingungen wechseln; nur passende, ungefährliche Alltagsaktionen. Innerhalb der Nacht keine doppelten Aufträge.

**Sonderfälle und Grenzen.** Verbindungsabbruch zeigt keine fremde Karte. Keine Aufträge mit heimlicher Aufnahme, Druck, Berührung oder Alkoholkonsum als Voraussetzung.

**Abnahme.** Mission überlebt den Wechsel zu einem anderen Game. Niemand sieht auf dem TV, wer gerade Erfüllung gemeldet hat.

**Beispiel-Copy:** „Bring jemanden dazu, einen Filmtitel ganz beiläufig zu sagen.“ → **Auftrag merken** → „Das war also kein Zufall.“

### 14 · BAD ANSWERS ONLY

**GANG MODE · HYBRID · Couch oder anonyme Schreibedition**

8–12 Minuten · 3–30

**Auditbefund.** Das Spiel verspricht anonyme Gags, sammelt auf One Phone aber seriell Text. Eine spontane mündliche Variante kann die Gruppe schneller ins Spiel bringen, verliert jedoch bewusst die Anonymität.

**Core Fantasy.** Mit genau einer absurden Antwort den ganzen Raum erwischen.

**10-Sekunden-Regel.** Beantwortet eine einfache Frage möglichst falsch. Die Runde kürt ihren Lieblingsunsinn.

**Beste Spielweise und Übergabe.** Couch-Edition: TV/Handy zeigt Prompt, drei wechselnde Personen antworten laut, Publikum zeigt gleichzeitig. Schreibedition: alle tippen einen kurzen Gag auf eigenem Gerät; anonymer Reveal. Vor Start Unterschied klar benennen.

**UI und Art Direction.** Gelbe Editorial-Comedy-Bühne. Jeder Gag bekommt einen eigenen großen Moment statt einer dicht gedrängten Antwortliste. Namen erst nach der anonymen Wahl.

**Einstieg und Game Loop.** Prompt, kurze Denkpause, drei Auftritte oder parallele Texte, identische Lesezeit, Vote. Bei 13–30 Schreibbeiträge in fair verteilten Heats mit gleicher Sichtbarkeit.

**Reveal.** Gag zuerst, Urheber später. Kein automatischer Sound soll die Pointe vorwegnehmen.

**Finale.** Fünf-Wörter-Finale mit sichtbarer Wortzahl nur in der Schreibedition; mündlich zählt die Runde. Ein bestes Zitat nur auf Wunsch behalten.

**Wiederspielwert.** Andere Frageformen, Perspektiven und Einschränkungen. Gleiche Antworttexte bilden eine gemeinsame Option statt willkürlich getrennten Stimmen.

**Sonderfälle und Grenzen.** Keine Idee: neutral aussetzen oder eine Inspiration erhalten; keine KI schreibt ungefragt den Siegergag. Selbstwahl ausgeschlossen, bei drei Personen alternative neutrale Juryregel erklären.

**Abnahme.** Couch startet ohne Textfeld. Anonyme Edition zeigt keine Autoren vor Vote. Jede eingereichte Antwort bekommt gleichwertige Lesezeit.

**Beispiel-Copy:** „Warum gibt es eigentlich Flugmodus?“ → **Die falschen Antworten bitte** → „Falsch. Leider hervorragend.“

### 15 · BLUFF

**GANG MODE · EVERYONE IN**

10–15 Minuten · 3–20

**Auditbefund.** Hier ist kurzes Schreiben Teil der Mechanik. Der offene Zweig verbessert Faktenquellen und Wahrheitsperson; Wahrheit und Lügen müssen visuell wirklich gleich behandelt werden.

**Core Fantasy.** Die eigene Lüge klingt so glaubwürdig, dass Freunde dafür stimmen.

**10-Sekunden-Regel.** Erfinde eine plausible Antwort. Finde dann die echte zwischen den Lügen der anderen.

**Beste Spielweise und Übergabe.** Eigene Geräte für gleichzeitige Lügen und geheime Wahl, TV für die Auflösung. Kleine Runden können einmal reihum schreiben; langsamerer Pass-Modus ausdrücklich sichtbar, keine öffentliche Fake-Anonymität.

**UI und Art Direction.** Sachliche hellblaue Antworttafel, identische Schrift, Länge und Reihenfolgebehandlung für alle Karten. Die Quellenauflösung erscheint erst nach dem Vote.

**Einstieg und Game Loop.** Faktfrage, ein kurzer erfundener Satz, anonymisierte Mischung, Wahl ohne eigene Lüge, Reveal. Eine notwendige Wahrheitsperson pausiert fair rotierend und wird nicht zum Dauerhost.

**Reveal.** Erst die Verführungsleistung der Lügen zeigen, dann die Wahrheit samt knapper Erklärung und geprüfter Quelle.

**Finale.** Angekündigte Doppelwertung der Wahrheit; bestes Bluff-Manöver mit realer Stimmenzahl würdigen.

**Wiederspielwert.** Fakten nach Thema und Bekanntheit kuratieren, Autorenmuster wechseln. Veraltete oder strittige Behauptungen redaktionell sperren.

**Sonderfälle und Grenzen.** Wahrheitsgleiche oder identische Eingaben fair zusammenführen. Nicht wählbare eigene Antwort als solche kennzeichnen, ohne anderen den Autor zu verraten.

**Abnahme.** Die Wahrheit ist nicht an Formatierung erkennbar. Punkte lassen sich aus echten Stimmen rekonstruieren. Unklare Fakten erhalten keinen erfundenen Wahrheitsanspruch.

**Beispiel-Copy:** „Welche Antwort klingt verdächtig vernünftig?“ → **Meine Lüge versiegeln** → „Sehr überzeugend. Vollständig erfunden.“

### 16 · THE LINE

**GANG MODE · BIG SCREEN / ONE PHONE**

6–10 Minuten · 4–99 mit Zonen

**Auditbefund.** Die räumliche Skala ist eine echte Eigenständigkeit. Der allgemeine Screen- und Reveal-Ablauf muss zugunsten großer Pole und einer kurzen gemeinsamen Auswertung zurücktreten.

**Core Fantasy.** Die Gruppe sortiert sich selbst – und merkt, wie unterschiedlich sie sich eingeschätzt hat.

**10-Sekunden-Regel.** Stellt euch zwischen die zwei Pole. Erst danach erklärt ihr eure Position.

**Beste Spielweise und Übergabe.** Nur gemeinsamer Screen plus Hostbedienung; niemand tritt bei. Bei 31–99 klare Zonen oder Teamvertreter. Sitzende Variante mit Handzeichen oder Nummern ist gleichwertig.

**UI und Art Direction.** Zwei sehr große beschriftete Pole und eine Linie, die die räumliche Richtung korrekt abbildet. Keine vermeintlich automatisch erfassten Personenmarker.

**Einstieg und Game Loop.** Pole lesen, frei positionieren, alle fertig, zwei freiwillige Begründungen, nächste Skala. Objektive Sortieraufgaben erst danach mit echten Angaben prüfen.

**Reveal.** Subjektive Skalen haben keine richtige Lösung. Bei überprüfbaren Reihenfolgen zeigen die Menschen ihre Werte; Host erfasst nur bei gewünschter Wertung.

**Finale.** Silent Line: wortlos sortieren, dann eine gemeinsame Auflösung. Kein langes individuelles Reporting.

**Wiederspielwert.** Andere Dimensionen und Wechsel zwischen Selbstbild, Vorhersage und überprüfbaren Fakten. Sensible Eigenschaften sind keine Standardkategorien.

**Sonderfälle und Grenzen.** Kein Platz oder eingeschränkte Mobilität: sitzende Skala vorab wählen. Keine Aufgabe verlangt Berührung oder riskante Bewegung.

**Abnahme.** Das gesamte Spiel funktioniert ohne Namensliste oder Gäste-QR. Niemand verwechselt subjektive Positionen mit einem automatisch bewerteten Ergebnis.

**Beispiel-Copy:** „Spontan losfahren — oder drei Tabellen vorher?“ → **Alle stehen · auflösen** → „Eine Linie. Erstaunlich viele Erklärungen.“

### 17 · HOT SEAT

**GANG MODE · HYBRID**

8–15 Minuten · 3–20

**Auditbefund.** Geheime Eigenwahl und Prognosen sind vorhanden; die Kernfrage muss schon im Einstieg als Vorhersagespiel erkennbar sein, damit Spotlight nicht wie ein Verhör wirkt.

**Core Fantasy.** Alle glauben dich zu kennen – bis du deine Wahl zeigst.

**10-Sekunden-Regel.** Eine Person wählt geheim. Alle tippen ihre Antwort. Dann wird aufgedeckt.

**Beste Spielweise und Übergabe.** Couch: Hot-Seat-Person wählt kurz verdeckt am Hosthandy, dann Gäste gleichzeitig mit Handzeichen; Host erfasst Teamsieger. Everyone In für individuelle versiegelte Tipps. Ein Handy ist bei kleinen Runden ausreichend.

**UI und Art Direction.** Ein Namens-Spotlight, höchstens vier klare Optionen und verdeckte Antwortkachel. Die anderen Personen sehen ihre Aufgabe „Tipp ihre Wahl“.

**Einstieg und Game Loop.** Frage durch Hot-Seat-Person akzeptieren oder tauschen, geheim wählen, Tipps, Reveal, freiwillige Erklärung. Rotation vorab sichtbar; kleine Sets statt endloser Einzelvorstellungen.

**Reveal.** Erst ihre tatsächliche Wahl, dann die Treffer. Überraschung ist der Höhepunkt, nicht die öffentliche Bewertung der Person.

**Finale.** Letzte Prognose angekündigt doppelt; gemeinsamer Rückblick auf den überraschendsten Ausgang.

**Wiederspielwert.** Neue Entscheidungsdilemmata, verschiedene Rollen und faire Rotation. Bei 13–20 kurze parallele Gruppen oder freiwillig drei Spotlights, transparent vor Start.

**Sonderfälle und Grenzen.** Niemand muss intime Fragen beantworten oder seinen Tipp begründen. Hot Seat kann ohne Kommentar weitergegeben werden.

**Abnahme.** Geheime Eigenwahl ist vor Tipps versiegelt. Alle wissen, wer als Nächstes dran ist. Kein heimliches Vorziehen derselben Person.

**Beispiel-Copy:** „Worauf würde Ari auf keinen Fall verzichten?“ → **Tipps aufdecken** → „Ihr wart euch sicher. Ari offenbar auch.“

### 18 · TEAM CHAOS

**GANG MODE · BIG SCREEN + höchstens Teamgeräte**

15–20 Minuten · 6–99

**Auditbefund.** Zwei Teams passen zur Raumfantasie. Im offenen Zweig sind Captain-Karten, echte quantitative Ergebnisse und rotierende Rollen vorhanden; diese brauchen eine eindeutige Bühnenhierarchie.

**Core Fantasy.** Euer Teil des Raums feiert einen gemeinsamen, knappen Sieg.

**10-Sekunden-Regel.** Zwei Teams, kurze Challenges. Jede Runde braucht andere Leute; das Finale zählt doppelt.

**Beste Spielweise und Übergabe.** TV/Laptop mit Hostbedienung, bei geheimen Captain-Infos höchstens ein Gerät pro Team oder kurze geschützte Übergabe. Nicht 99 einzelne QR-Beitritte verlangen.

**UI und Art Direction.** Zwei gleichwertige Flächen mit Farbe plus Teamnamen und Symbol. Aufgabenfläche zentral, kleine Anzeige der aktiven Spielerzahl. Keine große Punktetafel während einer Erklärung.

**Einstieg und Game Loop.** Teams in einem Schritt, Beispielchallenge, kurze wechselnde Wettkämpfe, Ergebnis beider Seiten bestätigen, Rollen rotieren. Gleiche aktive Teamgrößen oder nachvollziehbare normalisierte Wertung.

**Reveal.** Rohleistung und Wertung nacheinander zeigen. Comeback-Chip wird angekündigt und bleibt einmalig nachvollziehbar.

**Finale.** Bekannte Fähigkeiten in einer letzten kurzen Staffel kombinieren. Keine neue komplexe Regel im Schlussmoment.

**Wiederspielwert.** Challengefamilien, Captains und Partner wechseln. Director setzt anschließend eine ruhigere Runde.

**Sonderfälle und Grenzen.** Kein Schreien, Rennen oder motorisches Können als einzige Beteiligung. Bei ungerader Teamgröße gleich viele Aktive, übrige übernehmen Rate-/Juryrolle.

**Abnahme.** Ein 30-Personen-Set erfordert höchstens zwei Teamcontroller. Ergebnis und Bonus sind verständlich; niemand bleibt mehrere Challenges nur Zuschauer.

**Beispiel-Copy:** „Zwei Teams. Dreißig Sekunden. Verkauft den schlechtesten Urlaub.“ → **Teams bereit · starten** → „Knapp. Laut. Zählt.“

### 19 · PHOTO HUNT

**GANG MODE · HYBRID · ein Kameragerät pro Team**

8–12 Minuten · 3–30

**Auditbefund.** Der öffentliche Einstieg nennt Kamera optional, während das Spiel von echten Fotos lebt. Live-One-Phone speichert lokale Bilder; der offene Zweig bringt eine Raumgalerie. Textantworten sind kein gleichwertiger Foto-Reveal.

**Core Fantasy.** Der langweiligste Gegenstand im Raum wird zum absurdesten Bild des Abends.

**10-Sekunden-Regel.** Macht ein Foto zum Auftrag. Wählt gemeinsam das beste Bild.

**Beste Spielweise und Übergabe.** Ein Handy pro Team für gleichzeitige Aufnahmen, TV für Galerie. Ein einziges Kamerahandy nur als klar benannte Staffelvariante. Ohne Kamera anderes Game empfehlen.

**UI und Art Direction.** Großer Sucher, Auftrag am Rand, sichtbare Restzeit. Danach echte gleich große Bildkacheln mit neutralen Kennungen. Keine Galerie nur aus Dateinamen oder Bildbeschreibungen.

**Einstieg und Game Loop.** Kamerazugriff vor Start prüfen, Motiv suchen, einmal aufnehmen oder ersetzen, Bild ausdrücklich einreichen, anonyme Galerie, Vote. Uploadzeit zählt nicht als kreative Denkzeit.

**Reveal.** Gewinnerbild groß, daneben die anderen Motive. Namen erst nach Wahl; Bilder können vor Anzeige zurückgezogen werden.

**Finale.** Ein gemeinsames Thema und eine freiwillige Collage. Export nur nach Zustimmung, nicht automatisch aus Raumdaten.

**Wiederspielwert.** Neue Perspektiven, Gegenstände und Bildideen. Keine Aufträge, die Fremde fotografieren oder gefährliche Orte aufsuchen lassen.

**Sonderfälle und Grenzen.** Kameraverweigerung, Uploadfehler und fehlende Einreichung haben klare Auswege. Metadaten entfernen; Aufbewahrungsdauer an der Einreichung benennen und technisch einhalten.

**Abnahme.** Keine Namen oder eigene Bilder vor anonymer Wahl. Verweigerter Kamerazugriff erzeugt keinen leeren Spielscreen. Reale mobile Foto- und Löschtests erforderlich.

**Beispiel-Copy:** „Macht einen völlig normalen Gegenstand verdächtig.“ → **Foto aufnehmen** → „Dieses Bild wirft Fragen auf.“

### 20 · DRAW THIS

**GANG MODE · HYBRID · Papier-Couch als Startvariante**

10–15 Minuten · 3–30

**Auditbefund.** Der offene Zweig setzt auf Papierzeichnen und Live-Rateversuche. Ein Stift-Motiv darf keine digitale Zeichenfläche versprechen, solange diese nicht existiert.

**Core Fantasy.** Eine katastrophale Zeichnung löst plötzlich bei jemandem die richtige Erkenntnis aus.

**10-Sekunden-Regel.** Eine Person zeichnet das geheime Wort. Alle anderen raten.

**Beste Spielweise und Übergabe.** Papier oder Whiteboard plus gemeinsamer Timer, ein Handy zeigt das geheime Wort. Alle raten laut; Host bestätigt ersten richtigen Tipp. Digitales Zeichnen auf Teamgerät mit TV-Übertragung ist eine gesonderte spätere Variante.

**UI und Art Direction.** Wortkarte privat, öffentlicher Timer groß. In einer späteren Canvas-Version nimmt die Zeichnung mindestens zwei Drittel der Bühne ein; Tools bleiben beim Zeichner.

**Einstieg und Game Loop.** Material vor Beginn nennen, Zeichner dreht das Handy zu sich, Wort ansehen, bereit, zeichnen und gleichzeitig raten. Nicht erst das fertige Bild abwarten.

**Reveal.** Wort und Zeichnung gemeinsam zeigen, Zeichner und Ratende würdigen. Papierbilder nicht automatisch als digitale Galerie vortäuschen.

**Finale.** Kurze letzte Zeichnung mit freiwilliger Einschränkung, etwa nur drei Linien; keine Pflicht zur schwächeren Hand oder geschlossenen Augen.

**Wiederspielwert.** Wörter nach Zeichenschwierigkeit, Themen und Gruppe variieren; Zeichner fair rotieren. 13–30 Personen in Teams oder parallele Zeichenrunden.

**Sonderfälle und Grenzen.** Bei gleichzeitigem richtigen Zuruf geteilte Wertung oder Wiederholung. Motorische Alternative als Beschreibungsrolle anbieten; Timer einstellbar.

**Abnahme.** Regel nennt Papier, solange Papier nötig ist. Raten ist während des Zeichnens möglich. Geheimes Wort erscheint nie vorzeitig auf dem TV.

**Beispiel-Copy:** „Du zeichnest. Der Raum rät. Kunst ist optional.“ → **Zeichner bereit** → „Man erkennt es. Jetzt jedenfalls.“

### 21 · MUSIC DROP

**GANG MODE · HYBRID · Couch-Songbattle / private Picks**

10–15 Minuten · 2–99 als Teams

**Auditbefund.** Live sagt der Hook „Know the song“, die tatsächliche Regel ist Songwahl zum Prompt mit Crowd-Vote. Das vermischt Musikraten und Songbattle und erzeugt eine falsche Erwartung.

**Core Fantasy.** Dein Song trifft den Raum genau im richtigen Moment.

**10-Sekunden-Regel.** Wählt den passendsten Song zur Situation. Die Runde entscheidet, welcher sie trifft.

**Beste Spielweise und Übergabe.** Couch: wechselnde Teams nominieren je einen Song, gemeinsamer Screen zeigt die Auswahl, alle stimmen per Handzeichen ab. Private Picks auf eigenen Geräten nur in der anonymen Edition. Ab 13 Heats oder Teams.

**UI und Art Direction.** Zwei bis vier Songkacheln mit Titel und Interpret, echte Cover nur aus erlaubter Quelle. Ein gemeinsamer Audioplayer bei verfügbarer Wiedergabe, kein Audio von jedem Handy.

**Einstieg und Game Loop.** Situation, kurze Songwahl, gleichwertige Vorstellung, gleichzeitiger Vote, Gewinner. Bei zwei Personen gemeinsamer Match-/Abgleichmodus statt sinnloser Selbstwahl.

**Reveal.** Crowd-Pick und identische Nominierungen zeigen. Song-Erkennen wird ausdrücklich FIRST//BEAT zugeordnet.

**Finale.** Tracklist aus wirklichen Gewinnern. Bei fehlendem Playback als Song-Talk kenntlich, nicht als vollständiges Audioerlebnis verkaufen.

**Wiederspielwert.** Situationen, Rollen, Jahrzehnte und Teamkonstellationen variieren; nicht dieselben Hits erzwingen.

**Sonderfälle und Grenzen.** Audioausfall pausiert die Runde ohne Punkteverlust. Identische Songs bündeln; Gastgerät und TV verraten vor dem Reveal keine Picks.

**Abnahme.** Hook, Vorschau und Runde versprechen dieselbe Mechanik. 99 Personen erfordern nicht 99 Songs nacheinander. Jeder sichtbare Play-Zustand ist echt.

**Beispiel-Copy:** „Welcher Song rettet die Tanzfläche um halb zwei?“ → **Songs aufdecken** → „Der Raum hat seinen Soundtrack.“

### 22 · CHAIN REACTION

**GANG MODE · ONE PHONE / BIG SCREEN**

5–8 Minuten · 3–30 in kleinen Ketten

**Auditbefund.** Die Wortkette ist mündlich stark, während Texteingaben unter Zeitdruck sie ausbremsen. Der offene Zweig hat echte Zugfristen und bei großen Online-Runden parallele Spuren.

**Core Fantasy.** Ein harmloses Wort landet durch eure Assoziationen an einem völlig anderen Ort.

**10-Sekunden-Regel.** Sag ein passendes neues Wort. Die nächste Person knüpft daran an.

**Beste Spielweise und Übergabe.** Handy in der Mitte oder TV; ein Tap markiert den Zugwechsel. Weitergabe nur wenn die Gruppe sie ausdrücklich als Staffel möchte. Keine automatische Spracherkennung behaupten.

**UI und Art Direction.** Aktueller Name und Countdown zentral, jüngste bestätigte Wörter optional als Kette. Ohne Mitschrift zeigt die UI nur echte Zugzahl und Kategorie, keine erfundenen Wörter.

**Einstieg und Game Loop.** Startwort, fünf Sekunden pro Person, laute Assoziation, nächster Zug. Wiederholung oder Timeout setzt nur die Kette zurück. Ab 13 parallele Kreise von vier bis sechs.

**Reveal.** Längste tatsächlich gezählte Kette und freiwilliges Nacherzählen des absurdesten Sprungs.

**Finale.** Letzte Kette mit vorher gewähltem Drei-Sekunden-Modus; entspannte Variante bleibt verfügbar.

**Wiederspielwert.** Neue Startwörter, Kategorien und gelegentliche Einschränkungen wie Ortsnamen oder Geräusche.

**Sonderfälle und Grenzen.** Zweifelhafte Assoziation kurz gemeinsam akzeptieren oder neu starten. Sprechpause und Skip nicht öffentlich kommentieren.

**Abnahme.** Kein Tippen während der Zeitrunde nötig. Die UI erfindet keinen Mitschnitt gesprochener Wörter. Nach Fehler sofortige Rückkehr in die nächste Kette.

**Beispiel-Copy:** „Aus Urlaub wird …?“ → **Wort gesagt · weiter** → „Wie sind wir hier gelandet?“

### 23 · ONE OF YOU

**GANG MODE · EVERYONE IN · Pass-Modus für kleine Gruppen**

10–15 Minuten · 4–30

**Auditbefund.** Abweichende Fragen schaffen eine andere Deduktionsmechanik als UNDERCOVER. Die Präsentation braucht einen eigenen Reveal, der die Fragen semantisch vergleichbar macht.

**Core Fantasy.** Eine Antwort klingt seltsam; erst später merkt ihr, dass jemand eine andere Frage hatte.

**10-Sekunden-Regel.** Beantwortet eure geheime Frage. Findet heraus, wer eine andere bekommen hat.

**Beste Spielweise und Übergabe.** Eigene Handys für private Fragen und gleichzeitig kurze Antworten. 4–8 Personen können einmal reihum lesen und antworten. TV zeigt nur freigegebene Antworten.

**UI und Art Direction.** Neutrale private Fragekarten, danach anonyme oder gleichwertig beschriftete Antworten; zum Reveal zwei Fragen nebeneinander, das abweichende Wort hervorgehoben.

**Einstieg und Game Loop.** Frage lesen, kurze Antwort, gemeinsam Antworten betrachten, kurze Diskussion, Verdacht abgeben, beide Fragen aufdecken. Kein Wissensvorsprung durch Reihenfolge der Darstellung.

**Reveal.** Erst der Textunterschied, dann Identität der abweichenden Person und Stimmen. Der Grund der Überraschung wird lesbar.

**Finale.** Nur ein Wort verändert die Frage. Schwierigkeit muss subtil, aber fair sein; keine doppeldeutige Übersetzung als Trick.

**Wiederspielwert.** Fragepaare nach Thema und Antwortformat variieren; ausgeteilte Rollen und bekannte Paare berücksichtigen.

**Sonderfälle und Grenzen.** Gleichstand als Stichwahl, leere Antwort neutral auslassen. Bei 13–30 parallele kleinere Runden statt 30 langer Texte.

**Abnahme.** Die abweichende Frage ist vor Reveal nirgends öffentlich sichtbar. Nach Reveal kann jeder erklären, worin sich die Fragen unterschieden.

**Beispiel-Copy:** „Alle antworten ehrlich. Auf fast dieselbe Frage.“ → **Antwort versiegeln** → „Ein einziges Wort. Große Wirkung.“

### 24 · PANIC BUTTON

**GANG MODE · ONE PHONE / BIG SCREEN**

4–7 Minuten · 2–99 in Teams/Spuren

**Auditbefund.** Kern ist eine schnelle Wort-/Reaktionsstaffel, nicht bloß eine Abstimmung. Der offene Zweig verbessert Deadlines; striktes Telefon-Weiterreichen kann bei großen Gruppen und teuren Geräten störend sein.

**Core Fantasy.** Die Antwort wissen, aber unter lächerlich wenig Zeit plötzlich daran zweifeln.

**10-Sekunden-Regel.** Nenn etwas zur Kategorie und drück weiter, bevor die Zeit abläuft.

**Beste Spielweise und Übergabe.** Ein stabil liegendes Handy als Button oder TV mit Host-/Teamsteuerung. Weiterreichen ist eine freiwillige Staffelvariante, nie Werfen. Keine persönlichen QR-Controller nötig.

**UI und Art Direction.** Ein riesiger Button, eine Kategorie und eine klare Zugmarke. Zeitdruck durch Ziffern und kurze Signale statt Blitzlicht oder ständig bebendem Screen.

**Einstieg und Game Loop.** Eine Proberunde, fünf Sekunden je Zug, laute Antwort, Button, nächste Person. Drei kurze Durchgänge; Fehler erzeugt eine kurze Pause und sofortige Rückkehr.

**Reveal.** Nach einem Durchgang eine knappe Zusammenfassung; kein dauerhafter Pranger für langsame Antworten.

**Finale.** Optional zwei Sekunden, ausdrücklich vorab gewählt. Ausgeschiedene kehren spätestens im nächsten kurzen Durchgang zurück oder werden aktive Zeitrichter.

**Wiederspielwert.** Neue Kategorien und unerwartete Richtungswechsel. 31–99 in parallelen Teamspuren, nie eine einzige 99-Personen-Warteschlange.

**Sonderfälle und Grenzen.** Sprach- und motorikfreundliches Zeitprofil; Gleichzeitigkeit wird vorab geregelt. App kann bei rein mündlicher Runde keine automatische inhaltliche Korrektheit behaupten.

**Abnahme.** Eine spielbare Runde ohne Texteingabe. Button zeigt tatsächlichen Zugwechsel; Handoff-Zeit läuft nicht heimlich als Antwortzeit.

**Beispiel-Copy:** „Dinge, die im Urlaub immer fehlen.“ → **Gesagt · weiter** → „Du wusstest es. Vor fünf Sekunden.“

### 25 · AFTER DARK · GANG

**GANG MODE · HYBRID · private Grenzen, gemeinsamer Screen**

10–20 Minuten · 2–20 Erwachsene

**Auditbefund.** Individuelles Opt-in und Stop-Veto sind im offenen Zweig verbessert. Die alte Raumformulierung kann Mehrheitsdruck vermitteln; die Paarvariante gleichen Namens ist ein anderes Spiel.

**Core Fantasy.** Gemeinsam mutiger werden, weil jede Person ihre Grenzen zuverlässig kontrolliert.

**10-Sekunden-Regel.** Ihr entscheidet euren Rahmen. Freche Fragen und freiwillige Aktionen bleiben jederzeit austauschbar.

**Beste Spielweise und Übergabe.** Private Grenzen auf eigenem Gerät oder diskret nacheinander am einen Handy setzen. Danach Couch mit gemeinsamem Screen. Öffentliche Gruppenbestätigung ersetzt kein persönliches Einverständnis.

**UI und Art Direction.** Ruhige, warme Bühne; Intensität klar benannt, Skip und Pause gleich gut erreichbar. Keine roten Warnungen oder spöttischen Kommentare für niedrige Intensität.

**Einstieg und Game Loop.** Persönliches Opt-in, gemeinsame Schnittmenge, leichte Frage, freiwillige Aktion, kurzer Wechsel. Intensität steigt nur mit Zustimmung, nicht als Belohnung fürs Aushalten.

**Reveal.** Nur zur Veröffentlichung bestimmte Antworten erscheinen. Zustimmung selbst wird nicht zum Publikumsergebnis.

**Finale.** Soft, Bold oder Stop privat wählen; Stop oder fehlende Zustimmung verhindert die zusätzliche Aktion. Ein normales gutes Ende bleibt immer möglich.

**Wiederspielwert.** Neue Szenen und Rollen innerhalb der gemeinsamen Grenzen; keine Gleichsetzung von Premium mit immer expliziteren Aufgaben.

**Sonderfälle und Grenzen.** Kein Alkoholzwang, keine Punktstrafe, kein Nachfragen nach Gründen. Auf einem geteilten Handy keine technisch unmögliche Anonymitätsgarantie.

**Abnahme.** Jede Person kann die laufende Aktion stoppen. Eine Mehrheitswahl kann Grenzen nicht überstimmen. Paar-/GANG-Version ist vor Start eindeutig.

**Beispiel-Copy:** „Wie frech darf dieser Teil des Abends werden?“ → **Meinen Rahmen wählen** → „Euer Abend. Eure Grenzen.“

### 26 · FIRST//BEAT

**Musik · vorhandener Core · HYBRID · Paar ONE PHONE, GANG TV/Teams**

10–15 Minuten · Verfügbarkeit noch gesperrt

**Auditbefund.** Ein eigener Core mit 1/3/7/15-Sekunden-Hörfenstern existiert; das Spiel ist nicht in den neun Paarspielen integriert. Echtes geeignetes Audio ist Voraussetzung, keine kosmetische Nachrüstung.

**Core Fantasy.** Der eine winzige Klang reicht dir, bevor alle anderen den Song überhaupt erkennen.

**10-Sekunden-Regel.** Hört kurz rein. Riskiert einen Tipp oder nehmt das nächste Hörfenster.

**Beste Spielweise und Übergabe.** Zu zweit ein gemeinsames Hörgerät mit zwei gut getrennten Buzzern oder abwechselndem Tipp. GANG auf TV mit Teams oder optional eigenen Buzzern. Alle hören dieselbe Audioquelle.

**UI und Art Direction.** Vier klar beschriftete Hörfenster, neutraler Track-Slot, dominante Buzzer. Titel, Cover und Dateinamen bleiben bis zur Auflösung verborgen. Audioindikator nur während realer Wiedergabe.

**Einstieg und Game Loop.** Soundcheck, erstes Hörfenster, freiwilliger Tipp, nächstes längeres Fenster bei Bedarf, endgültige Antwort, Reveal. Keine wiederholte Autorisierung mitten in der Runde.

**Reveal.** Titel, Interpret und tatsächlich genutztes Hörfenster gemeinsam zeigen. Signal-Fortschritt im Paar-Co-op an echte Treffer binden.

**Finale.** Ein letzter gemeinsamer Track oder Teamduell; Treffermomente nach Hörfenster statt bloßer Gesamtpunktzahl würdigen.

**Wiederspielwert.** Genre, Ära und Bekanntheit balancieren; jüngst gespielte Tracks ausschließen. Wer Tracks bereitstellt und kennt, hat keine unfaire Rate-Rolle.

**Sonderfälle und Grenzen.** Playbackfehler annulliert den Versuch. Keine auf Previewclips oder ungeprüften Rechten beruhende Freigabe; bestehende Audio-Grenzen beibehalten, Providerfreigabe separat prüfen.

**Abnahme.** Kein spielbarer CTA ohne funktionierende Audioquelle. Autoplay, iOS-Unterbrechung und Metadaten-Leaks auf echten Geräten prüfen. Client-Latenz entscheidet nicht ungeprüft einen Buzzer-Sieg.

**Beispiel-Copy:** „Eine Sekunde. Reicht dir das schon?“ → **Erstes Hörfenster** → „Kaum gehört. Schon gewusst.“

### 27 · TIME//DROP

**Musik · vorhandener Core · HYBRID · Paar ONE PHONE / GANG TV+Teams**

12–20 Minuten · 2–99 mit geeigneter Variante

**Auditbefund.** Ein eigener Timeline-Core samt Flow/Precision/Expert ist vorhanden, im GANG-Katalog aber als Prototyp ausgefiltert. Das Produkt benötigt eine eigene Oberfläche und reale Audiointegration.

**Core Fantasy.** Nicht nur den Song kennen, sondern mutig entscheiden, wie genau du seine Zeit einordnen kannst.

**10-Sekunden-Regel.** Hört den Song. Setzt ihn zwischen bekannte Jahre. Wer sicher ist, tippt genauer.

**Beste Spielweise und Übergabe.** Paar: gemeinsame Timeline, bei verdecktem Duell versiegelte Übergabe; eigener Controller optional. GANG: TV plus Teamgeräte für parallele Tipps. TV-only als offene Teamrunde mit anderer Wertung klar kennzeichnen.

**UI und Art Direction.** Große chronologische Anker, ein Track-Slot und auswählbare Lücken. Auf kleinen Displays fokussierter Ausschnitt mit Jahresnachbarn statt endlos winzigen Karten. Ziehen ist optional; Tipp auf Lücke funktioniert gleichwertig.

**Einstieg und Game Loop.** Drei bekannte Anker, Audio, Lücke wählen, optional Jahresfenster ±10/±5/±2 setzen, versiegeln, gemeinsamer Reveal. Flow braucht keine Jahreszahl oder Textantwort.

**Reveal.** Jahr erscheint, eigene Position und echte Crowd-Verteilung werden getrennt markiert. Die Timeline wächst auch bei Fehlversuchen.

**Finale.** Final Drop bietet freiwillig engere Präzision. Danach eure gemeinsam entstandene Timeline und eine Revanche mit anderer Ära.

**Wiederspielwert.** Trackhistorie, Schwierigkeitsmix und neue Anker verhindern identische Reihenfolgen. Persönliche Schwierigkeit kann in derselben Runde variieren.

**Sonderfälle und Grenzen.** Gleiches Veröffentlichungsjahr, Remaster und Original müssen nach einer dokumentierten Jahresregel bewertet werden. Unklare Metadaten nicht in gewertete Runden nehmen.

**Abnahme.** Flow funktioniert ohne Tippen und ohne Drag-Geste. Quelle/Jahr sind nachvollziehbar. Kein Release ohne Audio- und Metadatenabnahme; 99-Personen-Modus separat validieren.

**Beispiel-Copy:** „Vor diesem Song. Nach jenem. Wie sicher bist du?“ → **Hier einordnen** → „Gutes Jahrzehnt. Präziser Treffer.“
