# NOCTURNE Copy Audit 2026

Status: **redaktionell umgesetzt und technisch validiert**  
Datum: 2026-10-25  
Voice Contract: [brand-voice-2026.md](./brand-voice-2026.md)

## Ziel

Alle zentralen Customer-Texte gegen den verbindlichen NOCTURNE-Standard prüfen:

- sofort verständlich
- eigenständig und wiedererkennbar
- frech, trocken und modern, ohne künstliche Jugendsprache
- Humor dort, wo er Spannung oder Unterhaltung erhöht
- bewusst nüchtern bei Consent, Privacy, Checkout und Fehlern
- keine internen Architektur-/Entwicklerbegriffe in Customer Copy
- keine Widersprüche zwischen Marketingversprechen und tatsächlicher Spielmechanik

## Geprüfte Flächen

### Marketing & Conversion
- Landingpage Hero / SEO Description
- Couple- und GANG-Positionierung
- Game Cards / Hooks / „Warum dieses Game“
- Replay-/Membership-Kommunikation
- Pricing / Free Preview / Night Pass / Unlimited / Annual
- finale CTAs

### Couple
- Game-Katalog
- Intro / Setup / Namen / Dauer
- Ein-Handy- und Zwei-Handy-Erklärung
- Szenenlabels und Interaktionshinweise
- Consent / Skip / Pause / Abschluss
- NIGHT//ECHO / Director / gemerkte Momente
- Ergebnisse / Nacht-Signatur / Endings
- PASS//THE AUX / Musik-Empty- und Reveal-States

### GANG MODE
- Katalog aller 17 Games
- Hooks und Versprechen
- Player Setup
- One Phone / Everyone In / Big Screen
- Playbooks / Regeln / Scoring-Erklärungen
- Reveals / Ties / Crowd-Ergebnisse
- After Dark / Nebenmissionen / Musik / Team- und Foto-Flows

### Trust & Utility
- Auth
- Alters-Gate
- Privacy / Director
- Account / Save
- Checkout Start / Success
- Access Gates
- Error / Waiting / Empty States
- Tonight / gespeicherte Momente

## Wesentliche Korrekturen

### 1. Brand statt generischer Party-App
Die Copy folgt jetzt **SMART MISCHIEF / THE PLAYFUL INSTIGATOR**. Kurze, trockene Reaktionen ersetzen generisches Marketing- oder Entwicklerdeutsch.

Beispiele:
- „Harmlos anfangen. War der Plan.“
- „Ruhig wird anders.“
- „Leider gibt’s Punkte. Jetzt wird’s persönlich.“
- „Der Raum hat entschieden.“
- „Unentschieden. Natürlich.“

### 2. Geräte-Story korrigiert
Marketing und Game-Detailseiten behaupten nicht mehr, dass das Handy grundsätzlich weitergereicht werden muss.

- Ein Gerät funktioniert weiterhin.
- Zwei Geräte werden als bessere Option für verdeckte Sync-/Prediction-/Secret-Momente erklärt.
- „Handy weitergeben“ bleibt **nur** dort stehen, wo tatsächlich der bewusst gewählte One-Phone-Flow gerade eine Übergabe verlangt.

### 3. Interne Sprache entfernt
Customer Copy wurde u. a. bereinigt von:
- Memory Core
- Session Archive
- Runtime-Core
- Provider Layer
- Repertoire
- Fibbage-/Konkurrenzreferenzen
- Crowd-Vote/Guesses als technische Labels
- „AI LIVE, SONST LOKAL“
- „PLAYER SETUP“

Interne IDs und Typnamen dürfen im Code bestehen bleiben, solange sie nicht gerendert werden.

### 4. Consent & Spicy präzisiert
Körperliche/sinnliche Szenen sind weiterhin durch Consent-Flags geschützt. Zusätzlich wurden einzelne Formulierungen entzwungen:
- kein „du musst“
- körperliche Vorschläge werden ausdrücklich optional
- Roulette/Randomness entscheidet nie über Consent
- Skip bleibt neutral und folgenlos

### 5. Pricing auf reale Commerce-Wahrheit gebracht
Öffentliches Unlimited Year:
- **59,99 € / Jahr**
- Stripe Live Price: `price_1UUPekRGuzgtZTcBS2itbNWR`

Legacy/Founder:
- **49,99 € / Jahr**
- `price_1UUDZtRGuzgtZTcBkcwhCg10`
- bleibt ausschließlich als erkannter Altpreis für bestehende Abos erhalten

Damit zeigen Landingpage, Offer Copy und neuer Checkout denselben öffentlichen Preis, ohne bestehende Founder-Zugänge zu brechen.

### 6. Consumer Brand vereinheitlicht
**NOCTURNE** ist die sichtbare Consumer Brand.  
**GameNights** bleibt zulässig als Merchant-/Stripe-/Operations-Bezeichnung, wo technisch oder kaufmännisch erforderlich.

## Bewusste Ausnahmen

### One-Phone-Handoff
Texte wie „Handy weitergeben“ sind kein genereller Brand-Satz mehr. Sie bleiben ausschließlich in einem tatsächlich laufenden One-Phone-Schritt sichtbar, wenn die Übergabe Teil der Mechanik ist.

### Technische IDs
Legacy-IDs wie `roxy-night` oder `ai-director` bleiben intern, sofern eine Änderung Routing, Persistenz oder gespeicherte Sessions gefährden würde. Sichtbare Titel verwenden ausschließlich die aktuelle Brand.

### Englisch
Englisch bleibt für definierte Produkt-/Game-Namen und wenige etablierte Brand-Tags erlaubt, z. B. GANG MODE, NIGHT//ECHO, PASS//THE AUX, Slow Burn. Zufälliges Denglisch wird vermieden.

## Automatische Release-Gates

Neu:
- `src/test/brand-voice.test.ts`
  - blockiert ausgewählten Entwicklerjargon in Game-Marketing und GANG-Regeln
  - blockiert erzwungenen Trend-Slang
  - schützt vor überlangen Hooks und „!!“-Shoutiness
- `src/test/pricing-2026.test.ts`
  - fixiert 59,99 € als öffentlichen Jahrespreis
  - fixiert die aktuelle Stripe Price-ID
  - stellt sicher, dass der 49,99-€-Founder-Preis weiterhin als Legacy-Alias erkannt wird

## Technische Validierung

Der Copy-Pass wird durch vier CI-Gates abgesichert:
- **App quality:** Vitest, TypeScript und Production Build
- **Commerce core**
- **GANG core**
- **GANG browser**

Alle vier Gates waren bei der Abnahme dieses Audits grün.

### Infrastruktur-Hinweis

Bei dieser Copy-Abnahme enthielt das Root-`package-lock.json` lokale Links auf ein anderes Arbeitsverzeichnis. Der Integrationsschritt vom 26.10.2026 ersetzt diese durch reguläre Registry-Pakete und prüft eine vollständig frische `npm ci`-Installation. Das App-Quality-Gate verwendet anschließend den versionierten Lockfile, statt ihn zu löschen. Siehe `docs/main-integration-2026.md`.

## Release-Kriterium

Copy gilt als fertig, wenn beides gleichzeitig stimmt:

1. **Der Nutzer versteht die Handlung sofort.**
2. **Der Satz könnte auch ohne Logo nach NOCTURNE klingen.**

Bei Zahlung, Consent, Privacy und Fehlern hat Punkt 1 immer Vorrang.
