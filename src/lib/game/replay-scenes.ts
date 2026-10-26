import type { Scene, SceneType, Flavor } from "./types";

// Append-only editorial release. These are distinct activities, not permutations
// of names or adjectives. Phase 0 deliberately keeps a full deck available when
// every optional consent switch is off. Higher intensity remains an addition.
type Row = [title: string, prompt: string];
const rows = (type: SceneType, content: Row[], flavors: Flavor[]): Scene[] =>
  content.map(([title, prompt], i) => ({
    id: `replay26-${type.toLowerCase()}-${i + 1}`,
    type,
    title,
    prompt,
    phase: 0,
    flavor: flavors[i % flavors.length]!,
    source: "local",
  }));

const missions: Row[] = [
  [
    "Hotel für Krümel",
    "Begrüße {you} an der Rezeption eines Hotels, das ausschließlich Krümel beherbergt. Eine Sonderleistung gehört dazu.",
  ],
  [
    "Durchsage mit Würde",
    "Eine Rolltreppe hat heute frei. Formuliere ihre offizielle Abwesenheitsnotiz.",
  ],
  [
    "Der Ersatzplanet",
    "Euer neuer Planet ist nur so groß wie dieser Raum. Legt gemeinsam seine wichtigste Verkehrsregel fest.",
  ],
  [
    "Untermieter im Schuh",
    "Ein winziger Drache zieht in deinen Schuh. Verhandle mit {you}, seiner Maklerin, eine harmlose Hausregel.",
  ],
  [
    "Wetter aus der Tasche",
    "Sage das Wetter in deiner Jackentasche voraus, als warteten Millionen Menschen darauf.",
  ],
  [
    "Das Geräuschmuseum",
    "Führe ein erfundenes Geräusch vor. {you} gibt dem Ausstellungsstück einen Namen.",
  ],
  [
    "Sehr wichtige Sitzung",
    "Haltet eine Zweiersitzung über die Frage, ob Kissen Urlaub brauchen. Jede Person hat genau einen Satz.",
  ],
  [
    "Fahrkarte ins Gestern",
    "Verkaufe {you} eine Fahrkarte zu einem angenehmen, völlig alltäglichen Moment von gestern.",
  ],
  [
    "Ungewöhnliche Garderobe",
    "Beschreibe ein Outfit für einen höflichen Vulkan. {you} ergänzt das Accessoire.",
  ],
  [
    "Panne im Märchen",
    "Ein Märchenheld verpasst den Bus. Spielt das kurze Telefonat mit seiner sehr ungeduldigen Erzählerin.",
  ],
  [
    "Zwei Sätze Zukunft",
    "Erfindet abwechselnd zwei Sätze aus einer Bedienungsanleitung für das Jahr 3026. Sie erklärt Frühstück.",
  ],
  [
    "Kopfkino ohne Bild",
    "Beschreibe ein erfundenes Landschaftsfoto, ohne Farben zu nennen. {you} nennt danach dessen Titel.",
  ],
  [
    "Der freundliche Bösewicht",
    "Halte eine Schurkenrede über deinen Plan, alle kalten Füße der Welt zu versorgen.",
  ],
  [
    "Eilantrag auf Quatsch",
    "Beantrage bei {you} offiziell fünf Minuten Unsinn. Ein überzeugender Grund genügt.",
  ],
  [
    "Ein Möbelstück kündigt",
    "Übernimm die Rolle eines Möbelstücks, das seinen Job wechseln möchte. {you} bietet ihm einen anderen an.",
  ],
  [
    "Gute Ausrede, falscher Anlass",
    "Erkläre feierlich, warum du leider nicht zur Krönung des Brotkorbs kommen kannst.",
  ],
  [
    "Spaziergang auf Papier",
    "Plant mündlich einen Spaziergang mit drei Stopps, die nur in eurer Fantasie existieren.",
  ],
  [
    "Souffleur für Alltag",
    "Sprich einen normalen Satz über deinen Tag. {you} wiederholt ihn wie eine Nachricht von historischer Bedeutung.",
  ],
  [
    "Ein Stern weniger",
    "Gib dem Montag eine sachliche Hotelbewertung mit einem Lob und einem Verbesserungsvorschlag.",
  ],
  [
    "Die geheime Behörde",
    "Erfindet den Namen und die einzige Aufgabe einer Behörde für verlorene Gedanken.",
  ],
  [
    "Team Unsichtbar",
    "Transportiert pantomimisch gemeinsam ein sehr wertvolles, unsichtbares Tablett. Niemand muss aufstehen.",
  ],
  [
    "Doppeltes Echo ohne Ton",
    "Bewege nur die Augenbrauen. {you} antwortet mit den Schultern. Drei höfliche Gesprächswechsel reichen.",
  ],
  [
    "Wortschmiede",
    "Verschmelzt zwei harmlose Alltagswörter zu einem neuen. Erklärt zusammen, was es bedeutet.",
  ],
  [
    "Verspätete Fanfare",
    "Erzähle eine winzige Leistung von heute. {you} liefert dazu eine angemessen übertriebene Fanfare.",
  ],
  [
    "Rätsel aus drei Spuren",
    "Beschreibe einen sichtbaren Gegenstand mit drei Hinweisen, ohne seine Funktion zu nennen. {you} rät einmal.",
  ],
  [
    "Blitzbiografie",
    "Erfinde in drei Sätzen die Lebensgeschichte eines Radiergummis, der nie etwas bereut hat.",
  ],
  [
    "Das neue Verb",
    "Dein aktuelles Befinden bekommt ein erfundenes Verb. Führe es in einem Beispielsatz vor.",
  ],
  [
    "Ferienvertretung",
    "Die Sonne hat einen freien Tag. Ihr seid ihre Vertretung. Verteilt zwei Aufgaben unter euch.",
  ],
  [
    "Etikette für Außerirdische",
    "Bringe {you} als neu angekommenem Alien bei, wie man höflich um den letzten Keks bittet.",
  ],
  [
    "Die verlorene Pointe",
    "Beginne eine harmlose Geschichte mit ‚Es war wirklich nur ein Löffel‘. {you} liefert den letzten Satz.",
  ],
  [
    "Büro der Möglichkeiten",
    "Entwerft einen Beruf, bei dem eure beiden harmlosesten Talente zusammen unverzichtbar wären.",
  ],
  [
    "Ein Bild, zwei Stimmen",
    "Eine Person beschreibt ein Fantasietier. Die andere spricht dessen ersten Gedanken laut aus.",
  ],
  [
    "Zehn Zentimeter Abenteuer",
    "Erzähle eine Expedition über den Tisch aus Sicht einer Ameise. {you} meldet eine überraschende Entdeckung.",
  ],
  [
    "Ein Königreich für Ruhe",
    "Entwirf ein winziges Königreich, dessen größte Errungenschaft ungestörte Pausen sind.",
  ],
  [
    "Anleitung zur Vorfreude",
    "Erkläre in drei einfachen Schritten, wie man sich auf etwas Kleines freuen kann. {you} ergänzt einen unnötigen vierten.",
  ],
  [
    "Die höfliche Reklamation",
    "Reklamiere beim Universum einen völlig harmlosen Konstruktionsfehler, etwa krümelnden Toast.",
  ],
  [
    "Was die Pflanze denkt",
    "Eine Zimmerpflanze kommentiert euren Abend. Gib ihr einen einzigen, überraschend sachlichen Satz.",
  ],
  [
    "Post aus dem Kühlschrank",
    "Lies eine erfundene Postkarte vor, die ein Lebensmittel aus dem Gemüsefach geschickt hat.",
  ],
  [
    "Falsch übersetzt",
    "Sag einen normalen Satz. {you} übersetzt ihn in übertrieben kompliziertes Amtsdeutsch.",
  ],
  [
    "Winzige Eröffnung",
    "Eröffnet gemeinsam ein Museum für Dinge, die fast gut gegangen wären. Erfindet sein erstes Ausstellungsstück.",
  ],
  [
    "Der Abspann spricht",
    "Nennt euch abwechselnd je eine lustige Funktion, die ihr heute im Abspann verdient hättet.",
  ],
  [
    "Einladung an die Wolken",
    "Lade eine Wolke zum Abendessen ein. {you} antwortet mit deren ungewöhnlichem Essenswunsch.",
  ],
  [
    "Das Komplimentlabor",
    "Finde ein ehrliches Kompliment für {you}, das sich auf eine Fähigkeit und nicht auf das Aussehen bezieht.",
  ],
  [
    "Die angenehme Wiederholung",
    "Beschreibe eine alltägliche Routine so, dass {you} Lust bekommt, sie einmal mitzumachen.",
  ],
  [
    "Fünf Wörter Zuhause",
    "Vervollständigt gemeinsam den Satz ‚Gemütlich wird es, wenn …‘ mit insgesamt fünf Wörtern.",
  ],
  [
    "Rettungsring für Langeweile",
    "Erfindet zusammen ein Spiel, für das nur zwei Finger und eine absurde Regel nötig sind. Probiert eine Runde.",
  ],
  [
    "Eine Sache weniger",
    "Nennt je eine kleine Aufgabe, die ein freundlicher Haushaltsroboter morgen übernehmen dürfte.",
  ],
  [
    "Der Miniaturpark",
    "Plant einen Freizeitpark auf einem Kuchenteller. Jede Person erfindet eine Attraktion.",
  ],
  [
    "Bibliothek der Ausreden",
    "Formuliert gemeinsam den Titel eines Buches, das sich für seine verspätete Rückgabe selbst entschuldigt.",
  ],
  [
    "Applaus für das Unscheinbare",
    "Bedanke dich bei einem gewöhnlichen Gegenstand für seine jahrelange unauffällige Arbeit.",
  ],
  [
    "Beratung für einen Geist",
    "Ein freundlicher Geist hat Lampenfieber. {you} spielt ihn, du gibst einen praktischen Rat.",
  ],
  [
    "Die falsche Richtung",
    "Erkläre den Weg zum imaginären Bahnhof ausschließlich mit angenehmen Gerüchen als Orientierung.",
  ],
  [
    "Feierabend für Zahlen",
    "Die Zahl Sieben möchte weniger arbeiten. Verfasst ihre Abwesenheitsmeldung in einem Satz.",
  ],
  [
    "Der winzige Bauausschuss",
    "Plant eine Brücke für Schnecken. Eine Person denkt an Sicherheit, die andere an gute Aussicht.",
  ],
  [
    "Brief ans Geräusch",
    "Beginne einen freundlichen Brief an ein Alltagsgeräusch, das du überraschend gern hörst.",
  ],
  [
    "Die spontane Legende",
    "Erkläre, weshalb dieser Raum in hundert Jahren angeblich berühmt sein wird.",
  ],
  [
    "Hochachtung fürs Scheitern",
    "Erfindet einen Preis für einen völlig harmlosen missglückten Versuch. Mit Name und kurzem Jubel.",
  ],
  [
    "Ganz kleine Magie",
    "Führe pantomimisch einen Zaubertrick vor, dessen Ergebnis absichtlich sehr unspektakulär ist.",
  ],
  [
    "Zwischen zwei Terminen",
    "Baut mündlich ein perfektes Zehn-Minuten-Abenteuer ohne Einkauf oder Fahrt zusammen.",
  ],
  [
    "Der Gegenstand antwortet",
    "Stelle einer Tasse eine Interviewfrage. {you} antwortet aus ihrer Sicht.",
  ],
  [
    "Lesezeichen im Tag",
    "Gib deinem heutigen Tag einen Kapiteltitel. {you} ergänzt eine freundliche Unterzeile.",
  ],
  [
    "Schaufenster der Ruhe",
    "Verkaufe einen Moment völliger Ruhe, ohne die Wörter ‚Ruhe‘, ‚leise‘ oder ‚entspannen‘ zu verwenden.",
  ],
  [
    "Ein Detail groß machen",
    "Nenne ein kleines sichtbares Detail im Raum. Beschreibt gemeinsam, wie es als riesiges Denkmal aussehen würde.",
  ],
  [
    "Der falsche Reiseführer",
    "Empfiehl eine Attraktion in einer erfundenen Stadt, in der jede Straße nach einem Frühstück benannt ist.",
  ],
  [
    "Geduld auf Bestellung",
    "Bestelle bei {you} eine Portion Geduld. Die Bedienung fragt nach einer sehr ungewöhnlichen Beilage.",
  ],
  [
    "Die freundliche Fußnote",
    "Ergänze einen normalen Satz über dich um eine lustige Fußnote, die alles angenehm verkompliziert.",
  ],
  [
    "Klingelton für ein Tier",
    "Imitiere einen erfundenen Klingelton für einen besonders seriösen Pinguin.",
  ],
  [
    "Die nächste kleine Sache",
    "Nächste Tage, kleine Vorfreude: Jede Person nennt eine unkomplizierte Sache, die ansteht.",
  ],
  [
    "Ein Raum bekommt Urlaub",
    "Beschreibt gemeinsam, wohin dieses Zimmer gern reisen würde, wenn es Beine hätte.",
  ],
  [
    "Katalog ohne Waren",
    "Erfinde einen Katalogeintrag für einen schönen Zufall. {you} ergänzt die Lieferbedingungen.",
  ],
  [
    "Sehr kleines Heldentum",
    "Verleihe {you} einen Fantasietitel für eine hilfreiche alltägliche Eigenschaft.",
  ],
  [
    "Die letzte Durchsage",
    "Sage das Ende einer erfundenen Ausstellung über Socken so freundlich wie möglich an.",
  ],
  [
    "Ein Wort Urlaub",
    "Sechs Wörter reichen für diese Mini-Reise. Sagt im Wechsel etwas, das sich nach Urlaub anhört.",
  ],
  [
    "Regel für den Zufall",
    "Erfindet gemeinsam eine Regel für gute Zufälle, die sich selbstverständlich nicht kontrollieren lassen.",
  ],
  [
    "Zwei neue Straßennamen",
    "Benennt je eine Straße nach einem angenehmen Gefühl, das öfter im Alltag auftauchen dürfte.",
  ],
  [
    "Das freundlichste Schild",
    "Formuliert ein Hinweisschild, das Menschen zum Schmunzeln bringt und trotzdem einen klaren Zweck erfüllt.",
  ],
  [
    "Lieferung für den Mond",
    "Packe gedanklich ein Paket mit drei alltäglichen Dingen für einen einsamen Mondbewohner.",
  ],
  [
    "Die kleine Wiedergutmachung",
    "Eine Socke hat ihren Partner verloren. {you} spielt sie, du organisierst einen absurd freundlichen Ersatzabend.",
  ],
  [
    "Platz für eine Idee",
    "Erfindet eine Sitzbank, die eine einzige ungewöhnliche Zusatzfunktion hat. Gebt ihr einen Namen.",
  ],
  [
    "Feierliche Unterschrift",
    "Verfasst mündlich einen sehr kurzen Vertrag für einen guten Restabend. Jede Person bringt eine freiwillige Klausel ein.",
  ],
];

const questions: Row[] = [
  [
    "Der angenehme Anfang",
    "Woran merkst du in den ersten fünf Minuten, dass du dich irgendwo wohlfühlst?",
  ],
  [
    "Winziges Fachwissen",
    "Über welchen Alltagsgegenstand weißt du erstaunlich viel?",
  ],
  [
    "Ein guter Leerlauf",
    "Wann hat Nichtstun zuletzt besser funktioniert als ein Plan?",
  ],
  [
    "Kleine Gegenbewegung",
    "Welche harmlose Mode hast du nie mitgemacht und trotzdem überlebt?",
  ],
  [
    "Geschmack mit Geschichte",
    "Welches Essen hat dich erst beim zweiten Versuch überzeugt?",
  ],
  [
    "Der unterschätzte Ort",
    "Wo in deiner Nähe könnte man einen guten Nachmittag verbringen, ohne etwas zu kaufen?",
  ],
  [
    "Leichter als gedacht",
    "Welche Alltagssache war nach dem ersten Versuch viel weniger kompliziert als erwartet?",
  ],
  [
    "Eine gute Pause",
    "Welche Art von Pause macht dich tatsächlich wieder wach?",
  ],
  [
    "Wiederentdeckung",
    "Worüber hast du dich als Kind gefreut und heute immer noch?",
  ],
  [
    "Nutzlos, aber schön",
    "Welchen Gegenstand magst du allein deshalb, weil er schön oder lustig ist?",
  ],
  [
    "Das freundliche Geräusch",
    "Bei welchem Geräusch weißt du sofort: Jetzt beginnt etwas Angenehmes?",
  ],
  [
    "Erstaunlich geduldig",
    "Bei welcher Beschäftigung kannst du länger dranbleiben als erwartet?",
  ],
  [
    "Ein Zeichen von Sommer",
    "Welches winzige Detail kündigt für dich den Sommer an?",
  ],
  ["Regenbonus", "Was wird durch Regen tatsächlich besser?"],
  [
    "Der gute Geruch",
    "Welcher Geruch bringt dich gedanklich an einen angenehmen Ort?",
  ],
  [
    "Fast eine Sammlung",
    "Von welchen kleinen Dingen hast du mehr, als du geplant hattest?",
  ],
  [
    "Ungeplante Hilfe",
    "Welche kleine Hilfe von jemandem hat deinen Tag leichter gemacht?",
  ],
  [
    "Weniger ist fein",
    "Wovon reicht dir eine kleine Portion, um zufrieden zu sein?",
  ],
  ["Das gute Fenster", "Worauf würdest du gern beim Abwaschen schauen?"],
  [
    "Eigenwilliges Lob",
    "Welches ungewöhnliche Kompliment würde dir besonders gefallen?",
  ],
  [
    "Ein anderer Maßstab",
    "Was wird deiner Meinung nach zu selten als kleine Leistung gefeiert?",
  ],
  ["Weg ohne Eile", "Auf welchem Weg bist du gern etwas langsamer unterwegs?"],
  [
    "Nette Überraschung",
    "Was war zuletzt besser, als die Verpackung oder Ankündigung versprach?",
  ],
  [
    "Der bequeme Fehler",
    "Welche unperfekte Lösung funktioniert für dich überraschend gut?",
  ],
  [
    "Lieblingsnebensache",
    "Welche Nebensache an einem Ausflug gefällt dir manchmal besser als das eigentliche Ziel?",
  ],
  [
    "Gern erklärt",
    "Was könntest du einem neugierigen Menschen mit Freude in zehn Minuten zeigen?",
  ],
  [
    "Ein freundlicher Standard",
    "Welche Kleinigkeit sollte in jedem Gästezimmer selbstverständlich sein?",
  ],
  [
    "Die seltene Gelegenheit",
    "Bei welcher einfachen Gelegenheit sagst du fast immer spontan zu?",
  ],
  [
    "Ordnung mit Ausnahme",
    "Was darf bei dir ruhig ein bisschen unordentlich bleiben?",
  ],
  [
    "Unverdientes Misstrauen",
    "Welches Gericht oder Hobby hat einen schlechteren Ruf, als es verdient?",
  ],
  [
    "Abkürzung zur Laune",
    "Was kann deine Stimmung in unter einer Minute verbessern?",
  ],
  [
    "Ein schöner Schlusspunkt",
    "Woran erkennst du einen gelungenen Feierabend?",
  ],
  [
    "Handwerk im Kleinen",
    "Bei welcher ganz normalen Arbeit schaust du anderen gern zu?",
  ],
  [
    "Versehentlich gelernt",
    "Was hast du nebenbei gelernt, ohne es dir vorgenommen zu haben?",
  ],
  [
    "Vorrat an Vorfreude",
    "Welche Kleinigkeit hebst du manchmal absichtlich für später auf?",
  ],
  [
    "Das passende Licht",
    "Bei welcher Beleuchtung gefällt dir ein gewöhnlicher Raum plötzlich viel besser?",
  ],
  [
    "Sehr lokale Expertise",
    "Welche Strecke oder Ecke kennst du so gut, dass du dort mühelos führen könntest?",
  ],
  [
    "Ein guter Tausch",
    "Welche lästige Kleinigkeit würdest du gern gegen eine andere lästige Kleinigkeit tauschen?",
  ],
  [
    "Seltene Gemütlichkeit",
    "An welchem ungewöhnlichen Ort war es einmal erstaunlich gemütlich?",
  ],
  [
    "Der erste freie Meter",
    "Wohin gehst du als Erstes, wenn du in einer unbekannten Stadt eine Stunde frei hast?",
  ],
  [
    "Unnötiger Stolz",
    "Auf welche sehr kleine Fähigkeit bist du ein bisschen stolz?",
  ],
  [
    "Einfach behalten",
    "Welchen guten Tipp hast du so oft benutzt, dass du die Quelle fast vergessen hast?",
  ],
  [
    "Freundlicher Zufall",
    "Welche zufällige Begegnung hat dir eine harmlose neue Idee gegeben?",
  ],
  [
    "Selten genug gemacht",
    "Welche unaufwendige Aktivität macht dir fast immer Freude, obwohl du selten daran denkst?",
  ],
  [
    "Der kleine Unterschied",
    "Welches Detail macht für dich aus einem gewöhnlichen Frühstück ein gutes?",
  ],
  [
    "Angenehmes Staunen",
    "Was findest du bei genauerem Hinsehen immer noch erstaunlich?",
  ],
  [
    "Zeit ohne Rechnung",
    "Wobei vergisst du gern, wie lange du schon dabei bist?",
  ],
  [
    "Eine gute Randnotiz",
    "Was von heute würde in einem besonders freundlichen Tagebuch stehen?",
  ],
];

type ChoiceRow = [title: string, prompt: string, choices: string[]];
const choices: ChoiceRow[] = [
  [
    "Ungeplante Stunde",
    "Eine Stunde fällt überraschend frei. Was macht ihr daraus?",
    ["Spazieren", "Kaffee trinken", "Etwas spielen", "Gar nichts"],
  ],
  [
    "Haus mit Extra",
    "Euer Fantasiehaus bekommt einen unnötigen Raum. Welchen?",
    ["Kissenkino", "Mini-Sternwarte", "Teelabor", "Zimmer für Regen"],
  ],
  [
    "Kleine Zeitreise",
    "Welche Alltagssache würdet ihr Menschen vor hundert Jahren zuerst zeigen?",
    ["Videoanruf", "Spülmaschine", "Navigation", "Noise Cancelling"],
  ],
  [
    "Ein neuer Feiertag",
    "Welcher Anlass verdient euren gemeinsamen freien Tag?",
    [
      "Erster warmer Abend",
      "Leerer Wäschekorb",
      "Gute Idee",
      "Einfach Dienstag",
    ],
  ],
  [
    "Der freundliche Roboter",
    "Wobei soll euer kleiner Roboter helfen?",
    [
      "Schlüssel finden",
      "Pflanzen pflegen",
      "Tee machen",
      "Termine vergessen lassen",
    ],
  ],
  [
    "Snacklabor für zwei",
    "Welches Snack-Experiment klingt am ehesten nach euch?",
    ["Alles knusprig", "Alles winzig", "Alles rund", "Alles überraschend"],
  ],
  [
    "Winziges Abenteuerteam",
    "Womit startet eure Expedition durchs Wohnzimmer?",
    ["Karte zeichnen", "Proviant planen", "Teamnamen finden", "Sofort los"],
  ],
  [
    "Bequeme Magie",
    "Welcher kleine Zauber wäre im Alltag besonders angenehm?",
    [
      "Tee bleibt warm",
      "Socken bleiben zusammen",
      "Pflanzen gedeihen",
      "Nie kalte Hände",
    ],
  ],
  [
    "Euer Laden",
    "Was würde euer winziger Laden anbieten?",
    [
      "Gute Pausen",
      "Kuriose Fundstücke",
      "Bücher mit Snacks",
      "Reparierte Lieblingsdinge",
    ],
  ],
  [
    "Abend ohne Steckdose",
    "Der Strom ist weg, alles ist sicher. Was macht ihr zuerst?",
    ["Geschichten", "Kerzenlicht", "Spaziergang", "Früh schlafen"],
  ],
  [
    "Stadt für einen Tag",
    "Welche Regel gilt in eurer Stadt?",
    [
      "Mehr Bänke",
      "Kein Hupen",
      "Gratis Trinkwasser",
      "Ein gemeinsamer Pausenton",
    ],
  ],
  [
    "Winziger Weltrekord",
    "Welchen absurden Rekord würdet ihr gemeinsam versuchen?",
    [
      "Längstes Frühstück",
      "Kleinste Party",
      "Höflichster Streit",
      "Gemütlichste Wartezeit",
    ],
  ],
  [
    "Schatz ohne Gold",
    "Was steckt in eurer idealen Schatzkiste?",
    [
      "Ein guter Brief",
      "Ein unbekannter Weg",
      "Ein freier Tag",
      "Ein sehr guter Snack",
    ],
  ],
  [
    "Euer Fantasiefestival",
    "Womit lockt euer Festival?",
    [
      "Musik im Sitzen",
      "Essen aus aller Welt",
      "Seltsame Wettbewerbe",
      "Geschichten am Feuer",
    ],
  ],
  [
    "Geteilte Superkraft",
    "Nur zusammen könnt ihr einen kleinen Zauber nutzen. Welchen?",
    [
      "Regen verschieben",
      "Ampeln grün machen",
      "Pflanzen verstehen",
      "Verlorenes finden",
    ],
  ],
  [
    "Kurzurlaub im Kopf",
    "Welcher Ort passt gerade zu eurer Stimmung?",
    ["Windiges Meer", "Stille Hütte", "Buntes Viertel", "Eigener Balkon"],
  ],
  [
    "Die erste Ausstellung",
    "Euer gemeinsames Museum bekommt ein Thema. Welches?",
    [
      "Gute Fehlversuche",
      "Winzige Erfindungen",
      "Vergessene Alltagsdinge",
      "Schöne Zufälle",
    ],
  ],
  [
    "Absurde Dienstleistung",
    "Welche erfundene Dienstleistung würdet ihr ausprobieren?",
    [
      "Wolkenreservierung",
      "Gedankenentwirrung",
      "Ausredenprüfung",
      "Pausenlieferung",
    ],
  ],
  [
    "Eine gute Warteschlange",
    "Womit wird Warten erträglicher?",
    [
      "Gute Musik",
      "Ein Sitzplatz",
      "Ein witziges Gespräch",
      "Ein klarer Countdown",
    ],
  ],
  [
    "Der tragbare Luxus",
    "Welcher winzige Luxus begleitet euch überall?",
    ["Warme Decke", "Frisches Brot", "Perfekter Stift", "Lieblingsduft"],
  ],
  [
    "Tierische Verwaltung",
    "Welches Tier leitet eure Fantasie-WG?",
    [
      "Geduldiger Elefant",
      "Ordentlicher Rabe",
      "Neugieriger Otter",
      "Schläfriger Dachs",
    ],
  ],
  [
    "Euer Pausensignal",
    "Welches Zeichen heißt ab sofort kurz durchatmen?",
    ["Teekessel", "Wolke", "Kissen", "Anker"],
  ],
  [
    "Spontaner Mini-Kurs",
    "Was würdet ihr heute gemeinsam ausprobieren?",
    ["Origami", "Geräusche machen", "Sterne erkennen", "Schlechte Skizzen"],
  ],
  [
    "Die gute Zugabe",
    "Was soll nach diesem Spielabend Platz haben?",
    [
      "Eine Geschichte",
      "Ein Snack",
      "Ein Spaziergang",
      "Einfach Zusammensitzen",
    ],
  ],
];

const timers: Row[] = [
  [
    "Verben auf Reisen",
    "Im Sitzen geht mehr als gedacht. Sammelt abwechselnd passende Tätigkeiten. Keine Wiederholung; eine Pause kostet nichts.",
  ],
  [
    "Nur runde Dinge",
    "Sammelt gemeinsam so viele runde Dinge wie möglich, die keine Bälle sind. Laut nennen reicht.",
  ],
  [
    "Berufe für Wolken",
    "Erfindet abwechselnd Berufe, in denen eine Wolke überraschend nützlich wäre.",
  ],
  [
    "Das Küchenalphabet",
    "Küchendinge in alphabetischer Folge: Jede Person nennt im Wechsel eines. Der nächste Anfangsbuchstabe soll später im Alphabet liegen; Überspringen ist erlaubt.",
  ],
  [
    "Die höfliche Debatte",
    "Diskutiert feierlich, ob ein Kissen einen eigenen Stuhl braucht. Jede Person beginnt mit ‚Mit größtem Respekt‘.",
  ],
  [
    "Doppelte Beschriftung",
    "Findet nacheinander neue, absurde Namen für sichtbare Gegenstände. Jede Idee darf nur zwei Wörter lang sein.",
  ],
  [
    "Wortloses Wetter",
    "Spielt nacheinander Wetterlagen nur mit dem Gesicht. Die andere Person kommentiert wie im Radio.",
  ],
  [
    "Lauter kleine Freuden",
    "Sammelt im Wechsel Dinge, über die man sich freuen kann und die nichts kosten.",
  ],
  [
    "Nützlicher Unsinn",
    "Erfindet gemeinsam eine Maschine, die ein winziges Problem auf sehr umständliche Weise löst.",
  ],
  [
    "Eine Minute ohne Ich",
    "Erzähle von deinem heutigen Tag, ohne ‚ich‘ zu sagen. {you} darf freundlich mitdenken; es gibt keine Strafe.",
  ],
  [
    "Pantomime in Zeitlupe",
    "Stelle langsam das Einpacken eines Geschenks dar, das ständig seine Form verändert.",
  ],
  [
    "Geräusche der Zukunft",
    "Eine Person erfindet ein Geräusch, die andere ein Gerät dazu. Wechselt bis zum Signal.",
  ],
  [
    "Gemeinsame Ortskunde",
    "Eine Sitzbank fehlt: Sammelt im Wechsel Orte, an denen sie eine gute Idee wäre.",
  ],
  [
    "Komplizierter Toast",
    "Beschreibe möglichst feierlich das Belegen eines Brotes. {you} fragt nach einem unwichtigen technischen Detail.",
  ],
  [
    "Sätze ohne Ende",
    "Baut gemeinsam eine Geschichte, in der jeder Satz eine angenehme Überraschung bringt.",
  ],
  [
    "Fünf neue Tiernamen",
    "Erfindet Spitznamen für fünf Tiere. Jeder Name soll zu einer menschlichen Marotte passen.",
  ],
  [
    "Sprachkurs für Möbel",
    "Bringe einem erfundenen Möbelstück drei höfliche Sätze bei. {you} prüft die Aussprache.",
  ],
  [
    "Unmöglicher Lieferdienst",
    "Nehmt abwechselnd Bestellungen für Dinge an, die man nicht einpacken kann. Eine Lieferzeit gehört dazu.",
  ],
  [
    "Papierloser Stadtplan",
    "Erfindet mündlich eine Stadt mit drei Straßen und einem sehr ungewöhnlichen zentralen Platz.",
  ],
  [
    "Wortschlange mit Licht",
    "Sammelt abwechselnd Wörter, in denen ‚Licht‘ vorkommt. Neue erfundene Wörter sind erlaubt, wenn ihr sie erklärt.",
  ],
  [
    "Winzige gute Nachrichten",
    "Verlest abwechselnd erfreuliche Nachrichten aus der Welt der ganz kleinen Dinge.",
  ],
  [
    "Nur die Hände erzählen",
    "Deine Hände spielen eine kleine Begegnung zwischen zwei neugierigen Figuren. {you} übernimmt die Geräusche.",
  ],
  [
    "Falsche Saison",
    "Plant zusammen ein sommerliches Fest mitten im Winter, das vollständig drinnen stattfinden kann.",
  ],
  [
    "Ein sehr guter letzter Satz",
    "Erfindet nacheinander harmlose letzte Sätze für Filme, die vermutlich niemand drehen wird.",
  ],
];

const showdowns: Row[] = [
  [
    "Runder Wortwechsel",
    "Rund, aber kein Ball: Nennt im Wechsel passende Dinge. Eine Wiederholung oder fünf Sekunden Pause beendet das Duell. Wer die letzte gültige Antwort gab, gewinnt.",
  ],
  [
    "Wörter mit Dach",
    "Rund ums Wort ‚Haus‘: Sammelt im Wechsel Zusammensetzungen. Wiederholung oder fünf Sekunden Pause verliert. Bei strittigem Wort gibt es Gleichstand.",
  ],
  [
    "Das stille Tierduell",
    "Stellt nacheinander je ein Tier nur mit den Händen dar. Wird es innerhalb von drei Versuchen erkannt, gibt es einen Treffer. Mehr Treffer gewinnt; sonst Gleichstand.",
  ],
  [
    "Unmögliche Produkte",
    "Erfindet je einen Produktnamen für tragbare Langeweile. Bestimmt gemeinsam den witzigeren; bei Uneinigkeit Gleichstand.",
  ],
  [
    "Blick zurück zum Tisch",
    "Schaut zehn Sekunden auf den Tisch, dann weg. Nennt nacheinander je fünf Details. Mehr richtige Details gewinnt; gleiche Anzahl bedeutet Gleichstand.",
  ],
  [
    "Kleiner Reimkampf",
    "Sagt abwechselnd echte Reimwörter auf ‚Haus‘. Wiederholung oder fünf Sekunden Pause verliert. Beginnt danach eine zweite Runde auf ‚Zeit‘; bei je einem Sieg Gleichstand.",
  ],
  [
    "Sehr schlechte Apps",
    "Erfindet je eine App, die ein Problem schafft statt löst. Die gemeinsam gewählte absurdere Idee gewinnt; Uneinigkeit ist Gleichstand.",
  ],
  [
    "Fünf Buchstaben Mut",
    "Fünf Buchstaben genau: Sagt im Wechsel ein deutsches Wort. Zählt im Zweifel gemeinsam nach. Wiederholung oder fünf Sekunden Pause verliert.",
  ],
  [
    "Ein Satz verkauft alles",
    "Jede Person wirbt mit einem Satz für einen leeren Karton. Entscheidet gemeinsam, welche Werbung besser war; bei Uneinigkeit Gleichstand.",
  ],
  [
    "Wortloser Beruf",
    "Spielt nacheinander einen Beruf ohne Stimme. Die andere Person hat drei Rateversuche. Ein erkannter Beruf gibt einen Treffer; gleiche Trefferzahl bedeutet Gleichstand.",
  ],
  [
    "Alphabet mit Geschmack",
    "Essbares im Alphabet: Nennt im Wechsel Lebensmittel mit immer späterem Anfangsbuchstaben. Buchstaben dürfen übersprungen werden. Wer fünf Sekunden nichts Neues findet, verliert.",
  ],
  [
    "Die große Kleinigkeit",
    "Erfindet je eine Schlagzeile über einen umgefallenen Bleistift. Einigt euch auf die dramatischere; sonst Gleichstand.",
  ],
  [
    "Doppelte Tierkunde",
    "Abheben erlaubt: Nennt im Wechsel Tiere, die fliegen können. Wiederholung oder fünf Sekunden Pause verliert; bei uneiniger Faktenlage endet es unentschieden.",
  ],
  [
    "Gleiche Endung",
    "Sagt abwechselnd Wörter, die auf ‚ung‘ enden. Wiederholung oder fünf Sekunden Pause verliert.",
  ],
  [
    "Ein Ding, drei Gründe",
    "Gebt nacheinander drei möglichst absurde Gründe, warum ein Handtuch Bürgermeister werden sollte. Gemeinsame Jury; bei Uneinigkeit Gleichstand.",
  ],
  [
    "Die freundlichste Absage",
    "Sagt nacheinander höflich eine Einladung zur Weltmeisterschaft im Warten ab. Entscheidet gemeinsam über die charmanteste Absage; sonst Gleichstand.",
  ],
];

export const REPLAY_SCENES: Scene[] = [
  ...rows("MISSION", missions, ["funny", "game", "cheeky"]),
  ...rows("QUESTION", questions, ["deep", "funny", "cheeky"]),
  ...rows("TIMER", timers, ["game", "funny"]).map((s) => ({
    ...s,
    duration: 30,
  })),
  ...choices.map(([title, prompt, choices], i): Scene => ({
    id: `replay26-choice-${i + 1}`,
    title,
    prompt,
    choices,
    type: i % 3 === 0 ? "CHOICE" : i % 3 === 1 ? "SYNC" : "PREDICTION",
    phase: 0,
    flavor: i % 2 ? "game" : "cheeky",
    source: "local",
  })),
  ...rows("SHOWDOWN", showdowns, ["game"]).map((s) => ({
    ...s,
    only: ["battle" as const],
    sparks: 3,
  })),
];
