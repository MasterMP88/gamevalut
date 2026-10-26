import type { GangGameId } from "./core/playbooks";
export interface GangGuide {
  goal: string;
  steps: [string, string, string];
  example: [string, string, string];
  replay: string;
  input: string;
  scoring?: string;
  finale?: string;
}
export const DEVICE_GUIDES: Record<
  Exclude<GangGameId, "time-drop">,
  GangGuide
> = {
  "the-majority": {
    goal: "Lies die Runde besser, als sie sich selbst kennt.",
    steps: [
      "Tippe verdeckt, welche Option die Mehrheit wählen wird.",
      "Danach wählt jede Person ihre eigene Antwort.",
      "Erst jetzt erscheint das Ergebnis. Richtige Prognosen bringen Punkte.",
    ],
    example: [
      "Was rettet den Abend: Essen, Musik oder Ortswechsel?",
      "Du tippst auf Musik, wählst selbst aber Essen.",
      "Musik gewinnt die Abstimmung: Dein Tipp bekommt einen Punkt.",
    ],
    replay:
      "Neue Dilemmas und eine andere Gruppendynamik verändern die Mehrheiten. Im Blind-Finale kennt ihr beim Tippen die Frage noch nicht.",
    input: "Verdeckter Mehrheitstipp, dann persönliche Auswahl.",
  },
  "whos-that": {
    goal: "Sammelt die Geschichten und Titel, die nur diese Runde vergeben kann.",
    steps: [
      "Lest eine überraschende „Wer würde …?“-Frage.",
      "Alle nominieren eine andere Person.",
      "Die häufigsten Nominierungen werden aufgedeckt und landen in eurer Titelgalerie.",
    ],
    example: [
      "Wer würde einen freien Tag komplett verplanen?",
      "Ari und Nova werden gleich oft genannt.",
      "Beide bekommen den Titel – und erklären, warum der Raum natürlich falsch liegt.",
    ],
    replay:
      "Neue Fragen treffen auf andere Mitspielende. Aus jedem Abend entsteht eine andere Titelgalerie.",
    input: "Eine Person nominieren, anschließend gemeinsam auflösen.",
    scoring:
      "Die meistgenannten Personen erhalten je einen Nominierungspunkt. Bei Gleichstand bekommen alle Spitzenreiter den Titel.",
    finale:
      "Die gesammelten Titel des Abends erscheinen gemeinsam in eurer Galerie.",
  },
  undercover: {
    goal: "Findet die Person mit dem anderen Wort – ohne euer eigenes zu verraten.",
    steps: [
      "Jede Person sieht ihre geheime Wortkarte.",
      "Gebt kurze Hinweise und hört genau auf verdächtige Formulierungen.",
      "Stimmt ab. Bei Gleichstand folgt eine Stichwahl zwischen den Verdächtigen.",
    ],
    example: [
      "Fast alle lesen „Hotel“, eine Person „Hostel“.",
      "„Frühstück“ klingt unauffällig. „Stockbett“ macht die Runde hellhörig.",
      "Ein Verdacht reicht nicht: Der Raum muss sich auf eine Person einigen.",
    ],
    replay:
      "Andere Wortpaare und fair wechselnde Rollen. Im Finale warten zwei Undercover ab acht Personen oder ein Solo Agent mit kürzerer Hinweisrunde.",
    input: "Private Karte lesen, Hinweis geben, Verdacht wählen.",
  },
  "secret-missions": {
    goal: "Erfülle deinen geheimen Auftrag, während die anderen ganz normal weiterspielen.",
    steps: [
      "Jede Person erhält eine eigene Mission für die Nacht.",
      "Spielt die anderen Games. Melde deine Erfüllung, sobald sie gelungen ist.",
      "Du darfst einmal eine konkrete Mission einer anderen Person verdächtigen. Am Ende wird die Reihenfolge aufgedeckt.",
    ],
    example: [
      "Dein Auftrag: Jemand soll dir einen erfundenen Ehrentitel geben.",
      "Mitten in THE MAJORITY wirst du „Minister für Snacks“. Du meldest die Erfüllung.",
      "Ein späterer Verdacht nimmt dir diese bereits geschaffte Mission nicht wieder weg.",
    ],
    replay:
      "Andere Aufträge und neue Zuteilungen verändern den ganzen Abend. Die Mission läuft neben eurem Hauptspiel.",
    input:
      "Eigene Geheimkarte, eine Erfüllungsmeldung und ein überlegter Verdacht.",
    finale:
      "Die Abschluss-Timeline zeigt, was unbemerkt gelang und was vorher enttarnt wurde.",
  },
  "bad-answers-only": {
    goal: "Finde die falsche Antwort, die der Raum am liebsten glauben würde.",
    steps: [
      "Alle schreiben einen kurzen, absichtlich falschen Einfall.",
      "Die Antworten erscheinen ohne Namen. Wählt euren Favoriten; die eigene Antwort zählt nicht als Wahl.",
      "Die Urheber werden aufgelöst. Im Finale habt ihr nur fünf Wörter.",
    ],
    example: [
      "Warum knackt der Kühlschrank nachts?",
      "„Er übt heimlich Stepptanz.“",
      "Der Raum stimmt ab. Erst danach sieht man, von wem der Einfall stammt.",
    ],
    replay:
      "Die Fragen wechseln, die Pointen erfindet ihr selbst. Gleiche Antworten werden zu einer gemeinsamen Wahl zusammengefasst.",
    input: "Kurze Texteingabe, dann anonyme Abstimmung.",
  },
  bluff: {
    goal: "Verstecke die Wahrheit zwischen glaubwürdigen Lügen.",
    steps: [
      "Eine wechselnde Wahrheitsperson sieht die echte Antwort und pausiert beim Wettbewerb.",
      "Alle anderen erfinden eine plausible falsche Antwort.",
      "Wählt aus Wahrheit und anonymen Lügen. Danach seht ihr die Erklärung mit Quelle.",
    ],
    example: [
      "Eine ungewöhnliche Tierfrage erscheint. Nur die Wahrheitsperson kennt die Lösung.",
      "Du platzierst eine überzeugende falsche Zahl.",
      "Wer auf deine Lüge hereinfällt, bringt dir Punkte; ein eigener Wahrheitstreffer zählt ebenfalls.",
    ],
    replay:
      "Neue Fakten, andere Lügen und wechselnde Wahrheitspersonen verändern das Bluff-Spiel.",
    input: "Private Wissenskarte, Lüge schreiben, Wahrheit auswählen.",
  },
  "the-line": {
    goal: "Entdeckt, wie unterschiedlich derselbe Raum eine Frage beantwortet.",
    steps: [
      "Lest die beiden Endpunkte einer Skala.",
      "Ordnet euch im Raum ein – oder zeigt eure Position im Sitzen.",
      "Wenn alle stehen, erklärt ihr die überraschendsten Nachbarschaften.",
    ],
    example: [
      "Links: Spontan buchen. Rechts: Erst alles vergleichen.",
      "Ihr stellt euch auf und verschiebt euch beim Blick auf die anderen.",
      "Im Finale entsteht die Reihe ohne ein einziges gesprochenes Wort.",
    ],
    replay:
      "Andere Skalen zeigen neue Seiten derselben Menschen. Die tatsächlichen Positionen werden nicht als Persönlichkeitsprofil gespeichert.",
    input:
      "Bewegen oder auf eine Position zeigen, dann Bereitschaft bestätigen.",
    scoring:
      "Standardmäßig ohne Punkte. Optional tippt ihr vorher verdeckt auf eine direkt benachbarte Person. Nach dem Aufstellen erfasst ihr die echte Reihenfolge: Jeder richtige Nachbar gibt einen Bonuspunkt. Bei fehlenden oder doppelten Positionen entfällt der Bonus.",
  },
  "hot-seat": {
    goal: "Beweise, wie gut du die Person im Mittelpunkt wirklich kennst.",
    steps: [
      "Die Person im Hot Seat entscheidet sich verdeckt.",
      "Alle anderen sagen ihre Entscheidung voraus.",
      "Gemeinsame Auflösung, dann wandert der Hot Seat weiter. Jede Person kommt dran.",
    ],
    example: [
      "Würdest du spontan lieber Konzert, Kurztrip oder freien Tag nehmen?",
      "Nova wählt heimlich den freien Tag. Ari tippt Konzert.",
      "Die Auflösung überrascht. Jetzt ist die nächste Person im Hot Seat.",
    ],
    replay:
      "Jede Person bringt andere Gründe mit. Neue Entscheidungssituationen machen eingespielte Erwartungen wieder unsicher.",
    input: "Eine geheime Wahl; alle anderen geben eine Prognose ab.",
  },
  "team-chaos": {
    goal: "Gewinnt als Team kurze Erklär-, Zeichen-, Pantomime- und Sammelaufgaben.",
    steps: [
      "Zwei Teams, gleiche aktive Teamgröße und wechselnde Captains. Überzählige Personen helfen als Schiedsrichter.",
      "Nur die Captains sehen gegebenenfalls Begriffe oder Tabu-Wörter. Beide Teams spielen dieselbe Aufgabe auf Zeit.",
      "Vergleicht echte Ergebnisse: Treffer, Gegenstände oder die geforderte Messgröße.",
    ],
    example: [
      "Beide Captains müssen „Kino“ erklären, ohne „Film“ oder „Leinwand“ zu sagen.",
      "Die Teams haben gleich viel Zeit und gleich viele aktive Personen.",
      "Das bessere Ergebnis gewinnt; nach zwei Niederlagen kann ein einmaliger Comeback-Bonus helfen.",
    ],
    replay:
      "Andere Aufgabentypen und rotierende Captains verändern Rollen und Teamstärken.",
    input: "Captain-Karte, gemeinsamer Timer, vergleichbare Ergebniszahlen.",
  },
  "photo-hunt": {
    goal: "Mach aus dem echten Raum das Bild, das niemand erwartet.",
    steps: [
      "Ein Fotothema erscheint und der Timer startet.",
      "Nimm ein passendes Foto auf oder wähle eines aus. Markiere ehrlich, ob erkennbare Gesichter fehlen.",
      "Alle sehen die Galerie und wählen einen fremden Favoriten.",
    ],
    example: [
      "Das Thema heißt „Ein Albumcover für diesen Abend“.",
      "Eine Lampe, eine Socke und der richtige Winkel werden zur Bandgeschichte.",
      "Die Galerie wird gemeinsam aufgedeckt; der Crowd-Favorit gewinnt.",
    ],
    replay:
      "Neue Themen treffen auf andere Räume, Requisiten und Perspektiven. Bilder werden nicht zu einem dauerhaften Profil gesammelt.",
    input: "Kamera oder Bildauswahl, dann Galerie-Abstimmung.",
  },
  "draw-this": {
    goal: "Erkennt das geheime Motiv, während es gerade erst entsteht.",
    steps: [
      "Die zeichnende Person liest ihr Wort geheim und legt Papier und Stift bereit.",
      "Zeichnen und Raten laufen gleichzeitig. Auf eigenen Handys dürft ihr nach einem falschen Tipp erneut raten.",
      "Der erste richtige Tipp entscheidet. Mit einem gemeinsamen Gerät nennt ihr die zuerst richtige Person.",
    ],
    example: [
      "Auf dem Papier erscheinen erst zwei Kreise.",
      "„Fahrrad?“ ist falsch. Ein dritter Kreis macht daraus „Schneemann“.",
      "Die erste richtige Person bekommt zwei Punkte, die zeichnende Person einen.",
    ],
    replay:
      "Wechselnde Motive, Zeichnende und das kurze Finale mit der falschen Hand halten die Runde unberechenbar.",
    input: "Papier und Stift; Antworten am Handy oder gemeinsam laut raten.",
    finale:
      "15 Sekunden mit der anderen Hand – oder 30 Sekunden für eine Zeichnung möglichst ohne Absetzen. Die anderen raten gleichzeitig.",
  },
  "music-drop": {
    goal: "Finde den Song, der zur Situation und zur Runde passt.",
    steps: [
      "Jede Person wählt verdeckt einen Songtitel; Interpret:in ist optional.",
      "Die Tracks werden gemeinsam enthüllt. Ab drei Personen stimmt ihr über fremde Picks ab.",
      "Crowd-Picks und musikalische Matches ergeben eure Tracklist. Zu zweit entfällt die Abstimmung.",
    ],
    example: [
      "Welcher Song wäre der Abspann dieses Abends?",
      "Zwei Personen wählen unabhängig denselben Track: ein Match.",
      "Der Crowd-Pick landet auf der Tracklist; hören könnt ihr ihn in eurer Musik-App.",
    ],
    replay:
      "Andere Situationen, neue Gäste und euer persönlicher Musikgeschmack liefern die Antworten.",
    input:
      "Song und optional Interpret:in eingeben; keine automatische Musikwiedergabe.",
  },
  "chain-reaction": {
    goal: "Haltet eine gemeinsame Wortkette unter Zeitdruck am Leben.",
    steps: [
      "Eine Kategorie oder ein Startwort gibt die Richtung vor.",
      "Wenn du bereit bist, beginnt dein eigener kurzer Zug. Verbinde ein neues Wort mit dem vorherigen.",
      "Wiederholungen oder abgelaufene Zeit brechen die Kette. Große Gruppen spielen auf mehreren kleinen Spuren.",
    ],
    example: [
      "„Urlaub“ → „Koffer“ → „Rollen“ → „Kino“.",
      "Der Raum entscheidet, ob eure gedankliche Verbindung passt.",
      "Die längste ungebrochene Kette wird aufgelöst.",
    ],
    replay:
      "Startpunkte wechseln; eure Assoziationen bestimmen den Verlauf. Die gleiche Kategorie führt selten zum gleichen Weg.",
    input:
      "Eigenen Zug starten, kurzes Wort eintippen oder auf einem Gerät laut nennen.",
  },
  "one-of-you": {
    goal: "Entdeckt die Person, die eine fast gleiche Frage beantwortet hat.",
    steps: [
      "Jede Person liest ihre eigene Frage geheim. Eine weicht ab.",
      "Gebt eure kurzen Antworten ab und vergleicht, was nicht ganz hineinpasst.",
      "Stimmt über den Verdacht ab; bei Gleichstand gibt es eine Stichwahl.",
    ],
    example: [
      "Die meisten nennen den besten Snack für einen Filmabend.",
      "Eine Person nennt den besten Snack für eine Zugfahrt.",
      "„Popcorn“ und „Brezel“ sind beide plausibel. Wer hatte die andere Frage?",
    ],
    replay:
      "Neue Fragenpaare und wechselnde Rollen verändern die Hinweise. Im Finale entscheidet ein einziges anderes Wort.",
    input: "Private Frage, kurze Antwort, gemeinsamer Verdacht.",
  },
  "panic-button": {
    goal: "Bleib unter Zeitdruck kreativ, ohne dich zu wiederholen.",
    steps: [
      "Eine Kategorie steht fest. Jeder Zug beginnt erst mit deinem Bereitschaftssignal.",
      "Nenne einen neuen passenden Begriff und gib den Zug ab. Drei Durchgänge pro Person bilden eine Runde.",
      "Wiederholungen und Timeouts bringen Strikes; mit der nächsten Kategorie sind alle wieder dabei.",
    ],
    example: [
      "Kategorie: Dinge, die Geräusche machen.",
      "„Wecker“, „Staubsauger“, „Keksdose“ – plötzlich ist dein Kopf leer.",
      "Zeit vorbei: ein Strike. Die nächste Kategorie ist deine neue Chance.",
    ],
    replay:
      "Neue Kategorien, wechselnde Reihenfolge und ein schnelleres Finale verhindern routiniertes Aufsagen.",
    input:
      "Bereit drücken, antworten, Zug abgeben. Große Gruppen nutzen parallele Spuren.",
  },
  "after-dark": {
    goal: "Findet gemeinsam heraus, wie mutig dieser Abend werden darf.",
    steps: [
      "Jede Person bestätigt selbst 18+ und freiwillige Teilnahme oder schaut zu.",
      "Fragen, anonyme Wahlen und freiwillige Aktionen wechseln sich ab. Überspringen ist immer möglich.",
      "Zum Abschluss wählt ihr Soft, Bold oder Stop. Bold braucht Einstimmigkeit; ein Stop beendet die letzte Aktion.",
    ],
    example: [
      "Eine Frage stellt drei mögliche Flirt-Stile gegenüber.",
      "Ihr wählt anonym und seht nur die Verteilung. Erzählen darf, wer möchte.",
      "Eine Person wählt Stop. Der Abend endet ohne letzte Aufgabe und ohne Namen zu nennen.",
    ],
    replay:
      "Neue Fragen und wechselnde Gruppengrenzen verändern den Ton. Mehr Mut ist kein Fortschrittszwang.",
    input:
      "Persönliches Opt-in, anonyme Auswahl oder kurze Antwort; freiwillige Aktion.",
    scoring:
      "Ohne Rangliste oder Punkte. Optional sammelt ihr freiwillige Reaktionen: Lachen, Überraschung oder Verbundenheit erscheinen nur als anonyme Anzahl.",
  },
};

/** Public discovery explains the authored default; private-player help keeps its actual device variant. */
const COUCH_GUIDES: Partial<typeof DEVICE_GUIDES> = {
  "the-majority": {
    goal: "Lies den Raum, bevor er sich selbst entscheidet.",
    steps: [
      "Notiert euren Mehrheitstipp verdeckt auf Papier. Ab fünf Personen tippt ihr in Teams.",
      "Alle zeigen gleichzeitig mit Fingern ihre eigene Antwort. Der Host zählt nur die Summen.",
      "Deckt eure Tipps auf. Richtige Prognosen punkten; bei Gleichstand zählen beide Spitzenoptionen.",
    ],
    example: [
      "Was rettet den Abend: Essen oder Musik?",
      "Team A notiert Musik. Trotzdem stimmen alle persönlich ab.",
      "Musik gewinnt. Team A bekommt einen Punkt – auch wenn sein Sprecher für Essen war.",
    ],
    input:
      "Papier-Tipp, Finger-Vote und eine gemeinsame Ergebniseingabe. Keine eigenen Handys nötig.",
    replay:
      "Andere Dilemmas, neue Mehrheiten und zwei Finalvarianten. Bekannte Fragen kommen erst nach ungesehenen zurück.",
    scoring:
      "Ein Punkt je richtigem Tipp, im Finale zwei. Aussetzen bringt keine Punkte.",
    finale:
      "Der letzte Tipp zählt doppelt. Oder ihr tippt auf die kleinste tatsächlich besetzte Antwortgruppe.",
  },
  "whos-that": {
    goal: "Der Raum verleiht Titel. Die Nominierten dürfen kurz widersprechen.",
    steps: [
      "Bis vier Personen stehen alle zur Wahl. Größere Gruppen nominieren je Team eine wechselnde Person.",
      "Drei, zwei, eins: alle zeigen gleichzeitig. Der Host markiert den oder die Titelträger.",
      "Zehn Sekunden für ein Statement. Der Titel bleibt in eurer Galerie, dann wechseln die Nominierten.",
    ],
    example: [
      "Wer würde aus einem freien Nachmittag ein Großprojekt machen?",
      "Zwei Nominierte bekommen gleich viele Fingerzeichen.",
      "Beide teilen den Titel. Die Dankesrede fällt überraschend ausführlich aus.",
    ],
    input:
      "Zeigen, kurze Statements, gemeinsame Titelvergabe. Kein Raumbeitritt.",
    replay: "Neue Titel, wechselnde Nominierte und eure eigene Titelgalerie.",
    scoring:
      "Ein Punkt für jedes ausgezeichnete Team oder jede Einzelperson. Geteilte Titel sind möglich.",
    finale:
      "Letzte Preisverleihung oder eine Dankesrede in genau fünf Wörtern. Danach eure gesamte Titelgalerie.",
  },
  "the-line": {
    goal: "Eine Skala. Überraschend viele Sichtweisen.",
    steps: [
      "Die beiden Enden des Raums stehen für die Endpunkte der Skala. Sitzenbleiben und eins bis fünf Finger zeigen geht genauso.",
      "Position beziehen, dann Freeze. In großen Gruppen bildet ihr mehrere kleine Linien gleichzeitig.",
      "Zwei weit entfernte Positionen erklären sich kurz. Eine gute Begründung darf euch bewegen.",
    ],
    example: [
      "Links: spontan buchen. Rechts: erst alles vergleichen.",
      "Ihr bezieht Position. Die vermeintlich spontane Person steht plötzlich ganz rechts.",
      "Ihre Erklärung verändert die Reihe. Niemand muss die richtige Persönlichkeit haben.",
    ],
    input: "Positionieren, zeigen, zuhören. Ein Bildschirm reicht.",
    replay:
      "Andere Skalen machen neue Unterschiede sichtbar. Keine Speicherung eines Persönlichkeitsprofils.",
    scoring:
      "Im Couch-Spiel ohne Punkte. Perspektivwechsel zählt hier mehr als ein Sieg.",
    finale:
      "Silent Line ohne Worte bis zum Freeze, oder die Position einer anderen Person fair erklären.",
  },
  "bad-answers-only": {
    goal: "Die schlechteste Idee bekommt den besten Auftritt.",
    steps: [
      "Bis vier Personen spielt ihr einzeln, darüber in Teams. Alle entwickeln gleichzeitig eine herrlich falsche Antwort.",
      "Jede Person oder jedes Team bekommt einen kurzen Auftritt. Mal als Werbeslogan, mal vollkommen ernst.",
      "Applaus entscheidet. Der Host markiert die Sieger; ein geteilter Sieg ist erlaubt.",
    ],
    example: [
      "Warum knackt der Kühlschrank nachts?",
      "Team A: Er übt heimlich Stepptanz. Team B verkauft die Antwort wie ein Luxusprodukt.",
      "Der Raum entscheidet per Applaus. Niemand muss seine Pointe eintippen.",
    ],
    input:
      "Kurz beraten, laut pitchen, applaudieren. Keine eigenen Handys nötig.",
    replay:
      "Fragen, Auftrittsformen und Sprecher wechseln. Die Antworten erfindet ihr selbst.",
    scoring:
      "Zwei Punkte für den Sieger, im Finale vier. Bei Gleichstand teilen die Sieger die Auszeichnung.",
    finale: "Genau fünf Wörter – oder ein letzter luxuriöser Verkaufspitch.",
  },
  "hot-seat": {
    goal: "Du kennst diese Person. Behauptest du zumindest.",
    steps: [
      "Das Spotlight wandert zwischen Personen und Teams. Die Person notiert ihre Wahl verdeckt auf Papier.",
      "Alle anderen Einzelpersonen oder Teams legen ihre Vorhersage fest. Das Spotlight-Team setzt bei dieser Wertung aus.",
      "Gemeinsam aufdecken. Richtige Tipps punkten; nach einer kurzen Erklärung wandert das Spotlight weiter.",
    ],
    example: [
      "Konzert, Kurztrip oder ein freier Tag?",
      "Die Person im Spotlight notiert den freien Tag. Team B tippt Konzert.",
      "Der Raum liegt daneben. Das Spotlight lächelt erstaunlich zufrieden.",
    ],
    input: "Papier-Wahl, Team-Tipp, gemeinsames Aufdecken. Ein Gerät genügt.",
    replay:
      "Neue Situationen und wechselnde Personen. In kurzen Sessions kommt nicht zwingend jede Person ins Spotlight.",
    scoring:
      "Ein Punkt je richtigem Tipp, im Finale zwei. Kein Punkt für das Spotlight-Team selbst.",
    finale:
      "Doppelte Treffer, optional ohne Team-Beratung bei der letzten Wahl.",
  },
  "team-chaos": {
    goal: "Kurze Aufgabe. Plötzlich erstaunlich ehrgeizige Teams.",
    steps: [
      "Zwei bis sechs Teams arbeiten gleichzeitig. Gleiche aktive Teamgröße, höchstens sechs Aktive je Team; weitere Personen prüfen und wechseln sich ab.",
      "Löst die öffentliche Sammel-, Wort- oder Ideenaufgabe vor Ablauf des Timers.",
      "Das Nachbarteam prüft die Liste. Der Host trägt die gültigen Ergebnisse ein.",
    ],
    example: [
      "Findet Dinge, die rollen, aber keine Fahrzeuge sind.",
      "Alle Teams haben gleich viel Zeit und gleich viele aktive Personen.",
      "Vier gültige Dinge schlagen drei. Danach wechselt die aktive Besetzung.",
    ],
    input:
      "Zusammen lösen, prüfen, Ergebniszahl eintragen. Keine geheimen Captain-Karten im Couch-Spiel.",
    replay:
      "48 öffentliche Aufgaben, wechselnde Besetzung und zwei unterschiedliche Finalwertungen.",
    scoring:
      "Zwei Punkte für das höchste gültige Ergebnis. Gleichstand erlaubt; ohne gültigen Beitrag kein Sieger.",
    finale:
      "Halbe Zeit und doppelte Siegpunkte – oder jeder gültige Eintrag zählt einen Punkt.",
  },
  "music-drop": {
    goal: "Du erkennst den Song. Eine halbe Sekunde vor den anderen.",
    steps: [
      "Eine Person legt in ihrer gewohnten Musik-App auf, etwa Apple Music oder Spotify. Sie rät in dieser Session nicht mit. NOCTURNE steuert die Musik-App nicht.",
      "Die Musik läuft? Raten öffnen, Hand hoch. Der DJ gibt dem ersten Rateteam den Versuch und hält die Songanzeige verborgen. Bei TV-Spiegelung die Musik auf einem separaten Gerät bedienen.",
      "Ein Fehler öffnet den Steal für die übrigen Teams. Pro Team ein Versuch, dann auflösen.",
    ],
    example: [
      "Euer DJ startet einen bekannten Track. Die Teams hören gemeinsam.",
      "Team A hebt zuerst die Hand, liegt aber falsch.",
      "Team B erkennt den Song und holt den Steal. Der DJ löst laut auf. Im Finale zählen die Punkte doppelt.",
    ],
    input:
      "Musik-App separat bedienen, Handzeichen und gesprochene Antwort. Auf einem Handy per App-Wechsel; keine automatische Dienst-Verbindung. Alternativ eigene Audiodateien direkt abspielen.",
    replay:
      "DJ wählt neue Tracks und vermeidet Wiederholungen selbst; NOCTURNE kennt diese Songauswahl nicht. Nach der Session könnt ihr den DJ wechseln. Bei lokalen Dateien werden ungehörte bevorzugt und keine innerhalb der Session wiederholt.",
    scoring:
      "Ersttreffer zwei Punkte, Steal einen. Im Finale beides doppelt. Wer falsch lag, wartet auf den nächsten Track. DJ bekommt keine Punkte; zu zweit sammelt die ratende Person ihren eigenen Score.",
    finale:
      "Letzter Track, doppelte Punkte. Bei lokalen Dateien nur zwei Sekunden hören. Danach optional ein weiterer Track. Euer DJ steuert die Musik weiterhin selbst.",
  },
  "chain-reaction": {
    goal: "Vom Staubsauger nach Atlantis. Hauptsache, die Verbindung hält.",
    steps: [
      "Ein Startpunkt gibt die Richtung vor. Bis vier Personen spielt ihr einzeln, größere Gruppen in maximal sechs Teams.",
      "Ein neues Wort verbindet sich mit dem vorherigen. Der Raum prüft Sinn und Wiederholung; der Host bestätigt den Zug.",
      "Drei wechselnde Sprecher je Team und Runde. Ein Hänger bricht den Streak, aber niemand scheidet aus.",
    ],
    example: [
      "Urlaub → Koffer → Rollen → Kino.",
      "Die Verbindung ist gewagt. Der Raum lässt sie gelten.",
      "Ein Hänger beendet die Serie, der nächste Zug geht trotzdem sofort weiter.",
    ],
    input:
      "Laut sprechen und den Zug bestätigen. Keine Aufnahme, kein Tippen pro Person.",
    replay:
      "Andere Startpunkte, wechselnde Sprecher und immer neue Assoziationen.",
    scoring:
      "Ein Punkt je gültigem Zug. Zusätzlich seht ihr die längste ungebrochene Kette der Runde.",
    finale:
      "Drei Sekunden pro Glied, oder die letzte Verbindung auf dem Rückweg begründen.",
  },
  "panic-button": {
    goal: "Du kennst hundert Antworten. Der Timer wartet auf eine.",
    steps: [
      "Eine Kategorie, bis zu sechs Teams. Bis vier Personen spielt ihr einzeln.",
      "Neue Antwort laut sagen, der Host bestätigt sofort. Der Timer springt zum nächsten Team; die Sprecher wechseln.",
      "Drei Züge je Team bilden eine Runde. Ein Hänger wird zum Strike, niemand fliegt raus.",
    ],
    example: [
      "Dinge, die Geräusche machen: Wecker, Staubsauger, Keksdose.",
      "Die Zeit ist um, bevor die nächste Antwort kommt. Ein Strike.",
      "Das nächste Team ist sofort dran. Im Finale bleiben nur zwei Sekunden.",
    ],
    input:
      "Antwort zurufen, gültigen Zug bestätigen. Keine eigenen Handys nötig.",
    replay:
      "Neue Kategorien, wechselnde Sprecher und Reihenfolge. Mit entspanntem Tempo bleiben acht Sekunden pro Zug.",
    scoring:
      "Ein Punkt je gültiger Antwort. Höchstens 18 Züge pro Runde auch bei 99 Personen.",
    finale:
      "Zwei Sekunden pro Zug; eine Variante dreht die Reihenfolge um. Entspanntes Tempo bleibt entspannt.",
  },
};
export const GANG_GUIDES: typeof DEVICE_GUIDES = {
  ...DEVICE_GUIDES,
  ...COUCH_GUIDES,
};
