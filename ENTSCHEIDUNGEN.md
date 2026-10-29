# Entscheidungen

Kurzes Protokoll, damit spätere Änderungen nachvollziehbar bleiben.

| Thema | Entscheidung | Begründung |
| --- | --- | --- |
| Lizenz | MIT, Schriften unter SIL OFL 1.1 | Kurz, verbreitet, Haftungsausschluss enthalten. |
| Auslieferung | Eine einzige HTML-Datei, Schriften als Base64 eingebettet | Funktioniert offline per Doppelklick, keine Anfragen an Dritte. |
| Schriften | Nur die verwendeten Schnitte, Latin-Subset: Big Shoulders Display 700/800, Hanken Grotesk 400/600/700 (Quelle: Fontsource 5.3.0) | Datei bleibt bei rund 123 KB. |
| GitHub Pages | Build schreibt `docs/` (index.html, Manifest, Service Worker, Icons), Pages-Quelle `main` / `docs` | Die Download-Datei bleibt ohne PWA-Teile, weil Service Worker bei `file://` nicht laufen. |
| Service Worker | Seite network-first, Icons und Manifest cache-first, Cache-Name mit Inhalts-Hash | Online kommt jede neue Fassung beim ersten Neuladen an, offline läuft die letzte. |
| Design | Umsetzung des Design-Handoffs (Training 400 × 700 ohne Scrollen, Region 260 px für Eingabe oder Ergebnis, eine Hauptaktion) | |
| „Nicht checkbar" | Knopf nur im Bereich 101–170; bei „Alles" werden Bogeys nicht abgefragt | In den übrigen Bereichen ist jede Zahl checkbar. |
| Vertippt | Nimmt eine falsche Wertung zurück (Box, Tageszähler, Serie), Darts bleiben stehen | |
| Datenschutzhinweis | In der Fußnote der Übersicht, nur in der Pages-Fassung | Im Training würde er das Höhenbudget sprengen. |
| Abhängigkeiten | Keine, nur Node für Build und Tests | |
| Tageszähler | Eigenes Modul `src/daycount.js`, eigener Schlüssel `checkout-trainer-day-v1` | Bestehendes Speicherformat `checkout-trainer-v1` bleibt unverändert. |
| „Heute x/y" | Pro Kalendertag in Ortszeit, neuer Tag um 0 Uhr | |
| Serie | Läuft über Tage weiter, fällt nur bei einem Fehler auf 0 | Ein reiner Tageswert wäre doppelt zu „Heute x/y". |
| Antworten mit Tipp | Zählen im Tageszähler als richtig, die Box wird nicht befördert | Bisheriges Verhalten. |
| „Fortschritt zurücksetzen" | Setzt nur die Boxen zurück, nicht den Tageszähler | Bisheriges Verhalten. |

## Bekannte Grenzen

- Bleibt die Seite über Mitternacht offen, springt die Anzeige erst bei der nächsten Aktion auf den neuen Tag.
- Bei lokal geöffneten Dateien hängt der Speicher am Ort der Datei.
- Zwischen 360 und 399 px Breite bricht die Fußnote im Training in drei Zeilen um, der Inhalt ist dann 708 statt 690 px hoch.
- Das Latin-Subset enthält kein „→" (Box-Hinweis nach einer Antwort). Das Zeichen kommt aus der Systemschrift, wie schon vorher bei Google Fonts.

## Offen

- JSON-Export/-Import als Sicherung.
