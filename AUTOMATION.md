# Vertrag für die tägliche Recherche

Die Recherche-Automatisierung schreibt ausschließlich in `data.json`. HTML, CSS und JavaScript bleiben unverändert.

## Ablauf pro neuem Fund

1. Das konkrete Ereignis identifizieren, nicht den Artikel.
2. Primärquelle und tatsächliches `ereignisDatum` ermitteln. `veroeffentlichungsDatum` und `erfasstAm` separat setzen.
3. Alle vorhandenen Einträge nach derselben Entwicklung durchsuchen. Dabei Organisation, beteiligte Personen, Ort, technische Schlüsselbegriffe und Quellen-URLs berücksichtigen — nicht nur die Überschrift.
4. Dieselbe zugrundeliegende Entwicklung erhält dieselbe `storyId`.
5. Wiederholt der Fund nur eine vorhandene Entwicklung, wird er verworfen und nicht gespeichert.
6. Nur ein späteres, eigenständiges Ereignis wie klinischer Versuch, Zulassung, reale Inbetriebnahme oder Serienstart wird mit `beziehung: update` und bestehender `storyId` ergänzt. Im Feld `wasIstNeu` den Fortschritt gegenüber dem Ursprung exakt nennen.
7. Wenn die Primär- oder Projektquelle ein eindeutig zuordenbares Ereignisbild anbietet, dieses lokal unter `assets/images/` speichern und im optionalen Objekt `bild` mit Alternativtext, Credit und Quellenlink dokumentieren. Keine generischen Symbolbilder einsetzen.
8. Eintrag ergänzen, `meta.aktualisiertAm` aktualisieren und `npm run check` ausführen.

## Harte Regeln

- Pro `storyId` existiert genau ein `original`.
- Dubletten werden nicht archiviert.
- Ein später publizierter Artikel ist allein kein Update.
- Unbestätigte „world first“-Behauptungen werden nicht als Tatsache formuliert.
- Datumswerte werden als `YYYY-MM-DD` gespeichert.
- Eine fehlende Tatsachenbasis darf nicht durch ein erfundenes Datum ersetzt werden. Solche Funde werden bis zur Klärung nicht automatisch aufgenommen.
- Direkte Links führen möglichst zur Primärquelle; Sekundärquellen gehören in `zusaetzlicheQuellen`.
- Normale Produktvorstellungen und PR ohne technologisch neues Ereignis werden verworfen.

## Technische Übergabe

`data.schema.json` beschreibt das maschinenlesbare Format. `scripts/validate-data.mjs` prüft zusätzlich Regeln, die das JSON-Schema nicht ausreichend ausdrückt: eindeutige IDs, genau einen Ursprung pro Story, konsistente Story-Titel und gültige Beziehungen. Der GitHub-Pages-Workflow veröffentlicht Änderungen nur, wenn diese Prüfung erfolgreich ist.

Die im Projektauftrag formulierte globale Rechercheanweisung kann unverändert als Recherche-Prompt verwendet werden. Ihr Ergebnis muss vor dem Speichern auf das hier definierte JSON-Format normalisiert werden.
