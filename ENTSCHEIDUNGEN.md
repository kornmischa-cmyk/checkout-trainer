# Entscheidungen

Kurzes Protokoll, damit spätere Änderungen nachvollziehbar bleiben.

| Thema | Entscheidung | Begründung |
| --- | --- | --- |
| Lizenz | MIT, Schriften unter SIL OFL 1.1 | Kurz, verbreitet, Haftungsausschluss enthalten. |
| Auslieferung | Eine einzige HTML-Datei, Schriften als Base64 eingebettet | Funktioniert offline per Doppelklick, keine Anfragen an Dritte. |
| Schriften | Nur die verwendeten Schnitte, Latin-Subset: Big Shoulders Display 700/800, Hanken Grotesk 400/600/700 (Quelle: Fontsource 5.3.0) | Datei bleibt bei rund 115 KB. |
| GitHub Pages | Build schreibt zusätzlich `docs/index.html`, Pages-Quelle wäre `main` / `docs` | Gleicher Inhalt wie die Download-Datei. |
| Abhängigkeiten | Keine, nur Node für Build und Tests | |
| Tageszähler | Eigenes Modul `src/daycount.js`, eigener Schlüssel `checkout-trainer-day-v1` | Bestehendes Speicherformat `checkout-trainer-v1` bleibt unverändert. |
| „Heute x/y" | Pro Kalendertag in Ortszeit, neuer Tag um 0 Uhr | |
| Serie | Läuft über Tage weiter, fällt nur bei einem Fehler auf 0 | Ein reiner Tageswert wäre doppelt zu „Heute x/y". |
| Antworten mit Tipp | Zählen im Tageszähler als richtig, die Box wird nicht befördert | Bisheriges Verhalten. |
| „Fortschritt zurücksetzen" | Setzt nur die Boxen zurück, nicht den Tageszähler | Bisheriges Verhalten. |

## Bekannte Grenzen

- Bleibt die Seite über Mitternacht offen, springt die Anzeige erst bei der nächsten Aktion auf den neuen Tag.
- Bei lokal geöffneten Dateien hängt der Speicher am Ort der Datei.
- Das Latin-Subset enthält kein „→" (Box-Hinweis nach einer Antwort). Das Zeichen kommt aus der Systemschrift, wie schon vorher bei Google Fonts.

## Offen

- Neues Design und Datenschutzhinweis im Footer der App (mit dem Design-Export).
- PWA (Manifest, Service Worker, Icon).
- JSON-Export/-Import als Sicherung.
