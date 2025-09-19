# Wochen-Power – Gamifizierter Wochenplaner

## Projektprofil

Wochen-Power ist eine browserbasierte Wochenplan-App, die klassische Aufgabenplanung mit spielerischer Motivation verbindet. Nutzer:innen erstellen Tages- und Wochenaufgaben, tracken Bildschirmzeit und werden mit Coins, Erfolgen, Konfetti und Sounds belohnt. Das Produkt laeuft komplett im Browser, speichert Daten lokal und laesst sich als Progressive Web App installieren.

## Zielgruppe und Nutzen

- Schueler:innen sowie Lernende, die Struktur fuer Schule, PC-Zeit und Freizeit suchen.
- Familien, die Bildschirmzeit und Pflichten transparent organisieren wollen.
- Paedagog:innen oder Coaches, die Gamification als Motivationsfaktor einsetzen moechten.

## Funktionskern

- Wochenkalender mit Drag-and-drop-Aufgaben, Kategorien (Schule, PC-Zeit, Freizeit) und Tagespunkten.
- Fortschritts-Widgets fuer PC-Spielzeit, Wochenziele, Tages-Streaks und Achievement-Uebersicht.
- Gamification-Layer mit Coins, Mini-Spielen (Memory, Quiz), Konfetti-Effekten, Sounds und Motivationsspruechen.
- PWA-Funktionen inklusive Manifest, Installierbarkeit, optionalen Browser-Benachrichtigungen sowie Export und Druck des Plans.
- Individuelle Themes (Sky, Dark, Pastell, Neon, Forest) samt ARIA-gestuetztem Theme-Menue und responsivem Layout.

## Technikstack

- Vanilla JavaScript Modules ohne Build-Tool, dynamische Imports fuer Tone.js (Audio) und SortableJS (Drag-and-drop).
- Strukturierte State-Verwaltung (`state.js`) mit Observer-Pattern, lokaler Persistenz ueber `localStorage` und formatierenden Utilities.
- Styling per Tailwind-CDN plus umfangreicher individueller Stylesheet (`style.css`) mit Light/Dark-Varianten.
- Test-Setup mit Node Test Runner (Unit-Tests), jsdom (DOM-Simulation) und Playwright (E2E-Szenarien) fuer Stabilitaet.

## Besonderheiten und Qualitaet

- Hoher Fokus auf Kindgerechte UX: Emojis, freundliche Sprache, grosse Klickflaechen, Tastatur- und Screenreader-Support.
- Sicherheit durch sanitisiertes State-Handling, defensives Cloning und Validierung aller Nutzereingaben.
- Offline-faehig und datenschutzfreundlich, da keine Server-Backends erforderlich sind.

## Potenzial und naechste Schritte

- Erweiterte Statistikseiten (Trendvergleiche, CSV-Export) fuer Eltern oder Coaches.
- Optionale Synchronisation zwischen Geraeten (z. B. ueber WebAuthn, Supabase oder lokale P2P-Loesungen).
- Erweiterung der Mini-Spiele und Achievements, um Langzeitmotivation weiter zu staerken.
