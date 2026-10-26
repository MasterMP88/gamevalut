import type { MusicMode, Scene } from "./types";

type SongCue = [title: string, prompt: string];
const deck = (mode: MusicMode, cues: SongCue[]): Scene[] =>
  cues.map(([title, prompt], i) => ({
    id: `aux-replay26-${mode}-${i + 1}`,
    type: "MUSIC",
    title,
    prompt,
    music: { mode },
    only: ["pass-the-aux"],
    source: "local",
    // Replay depth must remain available even at the gentlest consent level.
    // PASS//THE AUX pacing is owned by its dedicated mode/signature director, not this phase field.
    phase: 0,
    flavor: i % 3 === 0 ? "deep" : i % 3 === 1 ? "funny" : "cheeky",
    ...(mode === "speed" ? { duration: 20 } : {}),
  }));

// Song choices are supplied by the players. No fabricated catalogue, audio rights,
// lyrics or streaming availability. Each cue has a different narrative job.
export const MUSIC_REPLAY_SCENES: Scene[] = [
  ...deck("solo", [
    [
      "Die freundliche Rückblende",
      "Denk an einen gewöhnlichen Tag, den du gern behalten würdest. Welcher Song gehört dazu?",
    ],
    [
      "Kleine Trophäe",
      "Dein Track für einen winzigen Erfolg, den sonst niemand bemerkt hat.",
    ],
    [
      "Aus einem anderen Regal",
      "Ein Lied aus einem Genre, das du sonst kaum hörst und trotzdem magst.",
    ],
    [
      "Das übersehene Intro",
      "Schon die ersten Sekunden gefallen dir: Welcher Track hat so ein Intro?",
    ],
    [
      "Musikalischer Reiseführer",
      "Mit welchem Track würdest du {you} einen Ort vorstellen, den du magst?",
    ],
    [
      "Gute Gesellschaft im Bus",
      "Das Lied, das eine unspektakuläre Busfahrt angenehmer macht.",
    ],
    [
      "Ein Geschenk ohne Schleife",
      "Schenke {you} einen Song, der keine Botschaft erklären muss und einfach Freude macht.",
    ],
    [
      "Seltsamer Fundort",
      "Ein Track, den du an einem unerwarteten Ort entdeckt hast.",
    ],
    [
      "Lieblingsdetail im Klang",
      "Du wartest jedes Mal auf den Einsatz eines bestimmten Instruments. In welchem Song?",
    ],
    [
      "Ein bisschen größer",
      "Eine kleine Aufgabe klingt plötzlich riesig. Welcher Song macht das möglich?",
    ],
    [
      "Ruhm für die Nebenfigur",
      "Der Soundtrack für die freundliche Nebenfigur, die euren Film heimlich zusammenhält.",
    ],
    [
      "Dauerhafte Entdeckung",
      "Jemand hat dir ein Lied empfohlen, das geblieben ist. Welches war es?",
    ],
    [
      "Nicht aus der Mode",
      "Zeitlos auf deine Art: Welcher Song kann für dich nicht alt werden?",
    ],
    [
      "In anderer Geschwindigkeit",
      "Welchen Track würdest du gern einmal ganz langsam oder akustisch hören?",
    ],
    [
      "Der musikalische Umweg",
      "Der Heimweg ist fast vorbei. Für welchen Track würdest du noch eine Runde drehen?",
    ],
    [
      "Einmal zurück auf Start",
      "Welches Lied würdest du gern noch einmal zum allerersten Mal hören?",
    ],
    [
      "Die falsche Szene",
      "Ein fröhlicher Track für eine völlig unpassend ernste Filmszene.",
    ],
    [
      "Der gute Absender",
      "Jemand hat dir etwas beigebracht. Welches Lied erinnert dich daran? Erzählen bleibt freiwillig.",
    ],
    [
      "Warmer Pullover als Musik",
      "Welches Lied fühlt sich an wie ein Lieblingspullover?",
    ],
    [
      "Ein geretteter Nachmittag",
      "Der Track für einen Tag, der überraschend doch noch gut wurde.",
    ],
    [
      "Winziges Publikum",
      "Welchen Song würdest du nur vor zwei wohlwollenden Menschen auf einer Bühne versuchen?",
    ],
    [
      "Ein Song mit Aussicht",
      "Musik für einen Ort, an dem du gern lange aus dem Fenster schauen würdest.",
    ],
    [
      "Unaufgeregt gut",
      "Ganz ohne Anlass gut: Welches Lied gefällt dir auch zwischen zwei ganz normalen Dingen?",
    ],
    [
      "Aus zweiter Hand",
      "Ein Track, der dir durch eine Coverversion zuerst aufgefallen ist.",
    ],
    [
      "Komfortzone mit Tür",
      "Welchen Song würdest du jemandem zeigen, der deinen Musikgeschmack noch nicht kennt?",
    ],
    [
      "Gute Reise, kleiner Plan",
      "Der Soundtrack für einen Plan, der kleiner wurde und dadurch besser.",
    ],
    [
      "Eine Stimme bleibt",
      "Hier zieht dich vor allem die Stimme hinein. Welcher Song ist gemeint?",
    ],
    [
      "Kino ohne Handlung",
      "Ein Track, der sofort Bilder in deinem Kopf erzeugt, obwohl du keine Geschichte dazu kennst.",
    ],
    [
      "Wieder im Ohr",
      "Lange nicht gehört und plötzlich wieder da: Welches Lied würdest du gern wiederfinden?",
    ],
    [
      "Der sanfte Neustart",
      "Welches Lied passt zu einem neuen Versuch ohne großen Druck?",
    ],
    [
      "Wenig Worte, viel Gefühl",
      "Ein Instrumentalstück oder fast wortloser Track, der dich erreicht.",
    ],
    [
      "Der geheime Arbeitstitel",
      "Welcher Songtitel wäre ein guter Name für ein harmloses Kapitel deines Lebens?",
    ],
    [
      "Kleiner Mutmacher",
      "Musik für den Moment, in dem du etwas zum ersten Mal ausprobierst.",
    ],
    [
      "Besser als angekündigt",
      "Deine Erwartungen waren niedrig, dann hat es dich überzeugt. Welches Lied?",
    ],
    [
      "Die persönliche Zugabe",
      "Welchen Track würdest du bei einem Konzert als unerwartete Zugabe feiern?",
    ],
    [
      "Platz im Reisegepäck",
      "Verschicke musikalische Grüße aus deinem Alltag. Welcher Track kommt mit?",
    ],
    [
      "Der vergessene Tonträger",
      "Du findest eine alte CD oder Kassette ohne Hülle. Über welchen ersten Track würdest du dich freuen?",
    ],
    [
      "Musik für ein Handwerk",
      "Welcher Track passt zu einer Arbeit mit den Händen, bei der du gern die Zeit vergisst?",
    ],
  ]),
  ...deck("duet", [
    [
      "Eröffnung eures Cafés",
      "Euer winziges Café öffnet zum ersten Mal. Welcher Track begrüßt den ersten Gast?",
    ],
    [
      "Zwei freie Fahrräder",
      "Ihr findet zwei Fahrräder und habt den Nachmittag frei. Der erste Song der Tour?",
    ],
    [
      "Mitternacht im Museum",
      "Ihr dürft ein leeres Museum nach Feierabend besuchen. Welche Musik begleitet euch?",
    ],
    [
      "Schlechte Magie, guter Beat",
      "Eure gemeinsame Zaubershow klappt überhaupt nicht. Welcher Song rettet die Stimmung?",
    ],
    [
      "Die langsamste Parade",
      "Ihr führt eine Parade an, die absichtlich sehr langsam geht. Welcher Track läuft?",
    ],
    [
      "Euer kleiner Buchladen",
      "Die erste Platte in eurem gemeinsamen Buchladen: was läuft im Hintergrund?",
    ],
    [
      "Film über einen Dienstag",
      "Ein Film macht euren gewöhnlichen Dienstag erstaunlich interessant. Welcher Song eröffnet ihn?",
    ],
    [
      "Warten mit Stil",
      "Euer Zug hat Verspätung, aber ihr habt beide keinen Stress. Welcher Track passt?",
    ],
    [
      "Ein Balkon voller Sterne",
      "Ihr sitzt auf einem Balkon, die Stadt wird leiser. Ein Song für diesen Moment.",
    ],
    [
      "Zusammen fast berühmt",
      "Ihr gewinnt einen vollkommen belanglosen Preis. Welche Musik begleitet den Gang zur Bühne?",
    ],
    [
      "Winzige gemeinsame Flucht",
      "Ihr nehmt euch spontan eine Stunde nur für euch. Welcher Track markiert den Anfang?",
    ],
    [
      "Eine Fähre ohne Ziel",
      "Eine kleine Fähre trägt euch irgendwohin. Welchen Song hört ihr auf dem Deck?",
    ],
    [
      "Eure Pannenkomödie",
      "Beim gemeinsamen Kochen geht harmlos alles durcheinander. Welcher Track macht daraus eine gute Szene?",
    ],
    [
      "Der erfundene Urlaubsort",
      "Euer Urlaubsort existiert nur in der Fantasie. Welcher Song beschreibt ihn?",
    ],
    [
      "Festival im Wohnzimmer",
      "Euer Festival hat genau zwei Gäste: euch. Mit welchem Lied beginnt es?",
    ],
    [
      "Eine Bank am Wasser",
      "Ihr setzt euch an einen ruhigen Fluss und müsst nirgendwohin. Ein Song dafür.",
    ],
    [
      "Der seltsame Flohmarktfund",
      "Ihr kauft gemeinsam etwas völlig Unnötiges auf einem Flohmarkt. Welche Musik begleitet den triumphalen Heimweg?",
    ],
    [
      "Ein Tag ohne Nachrichten",
      "Alle Benachrichtigungen bleiben aus. Welcher Track eröffnet euren gemeinsamen freien Tag?",
    ],
    [
      "Feierliche Zimmerpflanze",
      "Eure Pflanze bekommt endlich ein neues Blatt. Welches Lied wird zur gemeinsamen Feier gespielt?",
    ],
    [
      "Zwei Plätze im Nachtbus",
      "Ihr fahrt durch eine unbekannte Stadt, draußen ziehen Lichter vorbei. Welcher Track läuft?",
    ],
    [
      "Die freundliche Montage",
      "Ein Film zeigt in einer Montage lauter kleine Dinge, die ihr zusammen gern macht. Welche Musik liegt darunter?",
    ],
    [
      "Sehr kleines Lagerfeuer",
      "Ihr sitzt an einem kleinen Feuer und tauscht harmlose Geschichten aus. Ein Lied für die Pause dazwischen.",
    ],
    [
      "Erster Schnee für zwei",
      "Draußen fällt unerwartet Schnee. Ihr habt Zeit. Welcher Track passt dazu?",
    ],
    [
      "Zwei schlechte Tänzer",
      "Ihr müsst keinen Tanzschritt beherrschen. Welcher Song macht das sofort unwichtig?",
    ],
    [
      "Ein Zimmer wird neu",
      "Ihr stellt gemeinsam ein Zimmer um und es fühlt sich plötzlich anders an. Welche Musik feiert das?",
    ],
    [
      "Die unwichtige Siegesrunde",
      "Ihr habt etwas Einfaches gemeinsam gelöst und seid unverhältnismäßig stolz. Welcher Song läuft?",
    ],
    [
      "Eine offene Haustür",
      "Ihr erwartet zwei gute Freunde zum unkomplizierten Essen. Welcher Track spielt beim Ankommen?",
    ],
    [
      "Ein Horizont für euch",
      "Ihr erreicht gemeinsam einen Aussichtspunkt. Welcher Song passt, ohne den Moment zu überladen?",
    ],
    [
      "Der kleine Schlussapplaus",
      "Eure erfundene Zweier-Show ist vorbei. Mit welchem Track verbeugt ihr euch?",
    ],
    [
      "Straßencafé im Wind",
      "Ihr sitzt in einem fremden Straßencafé, die Speisekarte flattert. Welche Musik sollte dort laufen?",
    ],
    [
      "Ganz langsam los",
      "Ihr startet gemeinsam in einen freien Tag und wollt noch nichts entscheiden. Ein Track dafür.",
    ],
    [
      "Ein unerwarteter Abzweig",
      "Eine gesperrte Straße führt euch zufällig an einen schönen Ort. Welches Lied begleitet die Entdeckung?",
    ],
    [
      "Zwei Plätze auf dem Dach",
      "Ihr sitzt sicher auf einer Dachterrasse über der Stadt. Welcher Song gehört dorthin?",
    ],
    [
      "Gemeinsam unspektakulär",
      "Ein Abend ist gerade deshalb gut, weil nichts Großes passiert. Welche Musik beschreibt das?",
    ],
    [
      "Ein Brief an später",
      "Ihr packt eine kleine Zeitkapsel für euch in fünf Jahren. Welcher Songtitel kommt hinein?",
    ],
    [
      "Das Licht bleibt noch an",
      "Der Abend könnte enden, aber ihr bleibt noch einen Moment. Welcher Track hält euch da?",
    ],
    [
      "Der gemeinsame Kurzfilm",
      "Euer gemeinsamer Kurzfilm hat keine Dialoge. Welches Lied erzählt trotzdem, dass die beiden Figuren gern zusammen sind?",
    ],
    [
      "Tanzen mit den Fingern",
      "Ihr seid beide zu gemütlich zum Aufstehen. Welcher Track reicht für ein kleines Fingerkonzert?",
    ],
  ]),
  ...deck("guess", [
    [
      "Ungewohnter Feiermodus",
      "Welches Lied hörst du gern, wenn du allein etwas Kleines feierst?",
    ],
    [
      "Das stille Lieblingsstück",
      "Du magst ihn, erwähnst ihn aber fast nie: Welcher Track?",
    ],
    [
      "Plötzlich andere Laune",
      "Welches Lied kann bei dir die Stimmung unerwartet drehen?",
    ],
    [
      "Ein sehr alter Favorit",
      "Seit Jahren auf deiner Liste und noch nicht sattgehört: Welcher Track ist das?",
    ],
    [
      "Schublade daneben",
      "Welcher Track würde jemanden überraschen, der dich nur flüchtig kennt?",
    ],
    [
      "Für den letzten Kilometer",
      "Deine Musik, wenn ein langer Weg fast geschafft ist.",
    ],
    [
      "Ein guter Leerlauf im Ohr",
      "Zwischen zwei Dingen bleibt Zeit. Was hörst du dort gern?",
    ],
    [
      "Der unerwartete Refrain",
      "Der Refrain nimmt dich jedes Mal mit, sogar gegen deinen Plan. Aus welchem Lied?",
    ],
    [
      "Lautlos mitgesungen",
      "Bei welchem Track bewegst du fast automatisch die Lippen, auch ohne Ton?",
    ],
    [
      "Musikalische Selbstironie",
      "Nimm dich musikalisch freundlich auf die Schippe. Welcher Track eignet sich?",
    ],
    [
      "Ein sicherer Treffer",
      "Welchen Song würdest du für eine Gruppe anmachen, deren Geschmack du kaum kennst?",
    ],
    [
      "Überraschend entspannt",
      "Musik, die dich beruhigt, obwohl sie für andere vielleicht gar nicht ruhig klingt.",
    ],
    [
      "Aus dem Abspann",
      "Abspann läuft, du suchst sofort den Titel: Welches Lied hast du über Film, Serie oder Spiel entdeckt?",
    ],
    [
      "Für drei gute Minuten",
      "Welcher Song hilft dir bei einer kurzen Pause zwischen zwei Aufgaben?",
    ],
    [
      "Der mutige erste Track",
      "Plötzlich bist du DJ. Mit welchem Track eröffnest du?",
    ],
    [
      "Ein eigener kleiner Film",
      "Allein durch die Stadt, kurz Hauptfigur im eigenen Film: Was läuft darunter?",
    ],
    [
      "Anders als der Titel",
      "Beim ersten Hören klang es ganz anders als erwartet. Welcher Track hat dich so überrascht?",
    ],
    [
      "Kein besonderer Anlass",
      "Welchen Track brauchst du einfach manchmal, ohne einen Grund nennen zu können?",
    ],
    [
      "Musik mit Ecken",
      "Eine ungewöhnliche Stimme oder ein seltsamer Klang macht es für dich gut. Welches Lied?",
    ],
    [
      "Dein freundlicher Auftritt",
      "Welcher Song würde deinen Auftritt in einer harmlosen Quizshow begleiten?",
    ],
    [
      "Die winzige Rebellion",
      "Heute eine kleine Regel anders machen. Welcher Track begleitet deine harmlose Mini-Rebellion?",
    ],
    [
      "Das passende Tempo im Kopf",
      "Welcher Track trifft gerade ungefähr dein inneres Tempo?",
    ],
    [
      "Für einen freien Tisch",
      "Du hast endlich alles weggeräumt. Welches Lied läuft zur kleinen Siegesrunde?",
    ],
    [
      "Besser beim zweiten Hören",
      "Manche Lieder brauchen mehrere Anläufe. Welches mochtest du erst beim späteren Hören?",
    ],
    [
      "Mit ungewöhnlichem Gepäck",
      "Welchen Track würdest du einem freundlichen Alien als erste Hörprobe mitgeben?",
    ],
    [
      "Die musikalische Notiz",
      "Deine To-do-Liste bekommt einen Songtitel als Überschrift. Welchen?",
    ],
    [
      "Ein bisschen Theater",
      "Welchen Song würdest du bei einer übertrieben dramatischen Verabschiedung für fünf Minuten spielen?",
    ],
    [
      "Das überraschende Geschenk",
      "Überrasch mich mit Musik: Welche unerwartete Empfehlung würde dich freuen?",
    ],
    [
      "Ein Lieblingsrhythmus",
      "Dein Fuß kann bei diesem Track kaum stillbleiben. Welcher ist es?",
    ],
    [
      "Die persönliche Wetterlage",
      "Musik, die dein heutiges inneres Wetter beschreibt.",
    ],
    [
      "Unterschätzte B-Seite",
      "Ein weniger bekannter Song von jemandem, dessen große Hits fast alle kennen.",
    ],
    [
      "Die freundliche Übertreibung",
      "Eigentlich ein winziger Erfolg. Welche Musik macht daraus einen Triumphzug?",
    ],
    [
      "Klingt nach Neugier",
      "Neugier braucht einen Soundtrack. Was macht dir Lust auf etwas Unbekanntes?",
    ],
    [
      "Musik zum Sortieren",
      "Dein Track, wenn du Dinge oder Gedanken in Ruhe ordnen möchtest.",
    ],
    [
      "Ein zufälliger Wiederfund",
      "Welcher Song würde dich freuen, wenn er heute überraschend im Radio käme?",
    ],
    [
      "Noch eine letzte Runde",
      "Du wolltest gerade gehen. Welcher Track hält dich noch fünf Minuten da?",
    ],
    [
      "Ein Track mit Kanten",
      "Welche ungewöhnliche musikalische Mischung gefällt dir, obwohl du sie schwer beschreiben kannst?",
    ],
    [
      "Soundtrack für Geduld",
      "Was würdest du hören, während du einer Pflanze beim Wachsen zuschaust?",
    ],
  ]),
  ...deck("speed", [
    ["Farbe als Ton", "Gelb als Klang: Welcher Song fällt dir zuerst ein?"],
    [
      "Sehr kleine Rakete",
      "Die Spielzeugrakete startet. Schnell den Soundtrack dazu.",
    ],
    [
      "Der freundliche Aufzug",
      "Im Aufzug haben ausnahmsweise alle gute Laune. Was läuft?",
    ],
    [
      "Winziger Triumphzug",
      "Das Lied für einen perfekt gelungenen Pfannkuchen.",
    ],
    [
      "Kaffee ist fertig",
      "Frischer Kaffee duftet durch den Raum. Ein passendes Lied?",
    ],
    [
      "Fünf Minuten Frühling",
      "Draußen ist es zum ersten Mal abends mild. Was läuft?",
    ],
    [
      "Ein leerer Bahnsteig",
      "Früher Morgen am leeren Bahnsteig. Nenne einen passenden Song.",
    ],
    [
      "Schirm auf",
      "Plötzlich Regen, zum Glück ein guter Schirm. Der passende Track?",
    ],
    [
      "Ein Hund im Cabrio",
      "Der Soundtrack für einen Hund, der offensichtlich Urlaub hat.",
    ],
    [
      "Koffer schon gepackt",
      "Noch eine Minute bis zur Abfahrt. Welche Musik läuft in deinem Kopf?",
    ],
    [
      "Alle Ampeln grün",
      "Alles geht glatt, jede Ampel ist grün. Welcher Track passt?",
    ],
    [
      "Das verschwundene WLAN",
      "Offline und völlig zufrieden damit. Was ist der Soundtrack?",
    ],
    [
      "Pappkrone auf",
      "Pappkrone auf, königliche Snackpause beginnt. Welche Musik gehört dazu?",
    ],
    [
      "Ein Licht im Fenster",
      "Ankommen, ausatmen, vertrauter Ort. Dein erster musikalischer Gedanke?",
    ],
    [
      "Die tanzende Gießkanne",
      "Die Gießkanne tanzt plötzlich. Zu welchem Song?",
    ],
    [
      "Eis schmilzt schon",
      "Eis in der Sonne, bevor es schmilzt. Nenne den ersten passenden Track.",
    ],
    [
      "Socken auf Parkett",
      "Socken auf Parkett. Welcher Track begleitet den vorsichtigen kleinen Rutscher?",
    ],
    [
      "Der letzte Karton",
      "Der letzte Umzugskarton ist leer. Was hört ihr zur kleinen Feier?",
    ],
    [
      "Heute kein Wecker",
      "Aufwachen und keinen Termin haben. Welcher Song passt sofort?",
    ],
    [
      "Winziger Zirkus",
      "Die Einlaufmusik für einen Zirkus auf einem Esstisch.",
    ],
    [
      "Erster freier Sitz",
      "Gerade noch den letzten Fensterplatz erwischt. Welches Lied feiert das?",
    ],
    [
      "Der rettende Snack",
      "Hunger und plötzlich der perfekte Snack. Der passende Song?",
    ],
    [
      "Unter einer Decke",
      "Draußen pfeift der Wind, drinnen ist es gemütlich. Dein Track?",
    ],
    [
      "Eine Katze regiert",
      "Das Titellied für eine Katze, die sich für die Hausverwaltung hält.",
    ],
    [
      "Zwei Minuten Mut",
      "Du raffst dich zu einem kleinen Schritt auf. Welcher Track hilft?",
    ],
    [
      "Frisch bezogen",
      "Frisch bezogenes Bett, ein kleiner Luxus. Was läuft dazu?",
    ],
    [
      "Blauer Himmel plötzlich",
      "Die Wolken reißen überraschend auf. Was läuft zur Sonne?",
    ],
    [
      "Ein freier Parkplatz",
      "Der übertriebene Soundtrack für einen unerwartet bequemen Parkplatz.",
    ],
    [
      "Brot noch warm",
      "Warmes Brot liegt auf dem Tisch. Welcher Track riecht für dich genauso gut?",
    ],
    [
      "Leeres Postfach",
      "Postfach leer, Kopf frei. Welcher Song hört sich danach an?",
    ],
    [
      "Ein Ballon entkommt",
      "Ein Ballon ist ausgebüxt. Welches Lied begleitet seine Reise?",
    ],
    [
      "Licht aus im Büro",
      "Für heute ist wirklich alles erledigt. Welcher Song setzt den Punkt?",
    ],
    [
      "Die leise Fähre",
      "Eine Fähre gleitet durchs Abendlicht. Nenne einen Track für die Überfahrt.",
    ],
    [
      "Ein geheimes Konfetti",
      "Eine gute Nachricht ist angekommen. Was spielt zur inneren Konfettikanone?",
    ],
    ["Fast schon Urlaub", "Der Track für den Abend vor dem ersten freien Tag."],
    [
      "Ein sehr guter Punkt",
      "Ein guter Tag bekommt einen freundlichen Schlusspunkt. Nenne ein Lied dafür.",
    ],
    [
      "Die höfliche Raketenlandung",
      "Ein freundliches Raumschiff landet im Hinterhof. Deine spontane Begrüßungsmusik?",
    ],
    [
      "Ein Pinsel voller Himmel",
      "Du malst eine Decke voller Sterne. Welcher Track fällt dir dazu zuerst ein?",
    ],
  ]),
];
