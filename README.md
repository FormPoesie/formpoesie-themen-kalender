# FormPoesie — Themen-Kalender

Ein statisches, responsives Archiv für weltweit recherchierte Entwicklungen rund um 3D-Druck und additive Fertigung. Die Seite zeigt Ereignisse nach ihrem **tatsächlichen Ereignisdatum** und hält Veröffentlichungs- und Erfassungsdatum separat fest.

## Was enthalten ist

- Monatskalender mit Vor-/Zurücknavigation
- Suche und Kategorienfilter
- barrierearme Tagesdetailansicht mit Ereignisbildern, Tastaturbedienung und Fokusführung
- anklickbare Primär- und Zusatzquellen
- farbcodierte Kategorien
- persistente `storyId` pro zugrundeliegender Story
- bereinigter Bestand ohne Dubletten; spätere reale Fortschritte bleiben als Update verknüpfbar
- getrennte Datenhaltung in `data.json`
- maschinenlesbares Schema und Konsistenzprüfung
- automatische HTTPS-Veröffentlichung über GitHub Pages

## Projektstruktur

```text
formpoesie-kalender/
├── index.html
├── data.json
├── data.schema.json
├── AUTOMATION.md
├── assets/
│   ├── styles.css
│   ├── app.js
│   └── images/
├── scripts/
│   └── validate-data.mjs
└── .github/workflows/pages.yml
```

## Lokal öffnen

`data.json` wird per `fetch` geladen. Deshalb die Seite nicht per Doppelklick als `file://` öffnen, sondern im Projektordner einen kleinen Webserver starten:

```bash
npm start
```

Danach `http://localhost:8080` öffnen.

Die Daten und das JavaScript lassen sich ohne zusätzliche Pakete prüfen:

```bash
npm run check
```

## Daten pflegen

Neue Ereignisse werden ausschließlich an das Array `eintraege` in `data.json` angehängt. Alle Pflichtfelder stehen in `data.schema.json`.

Die drei Datumsfelder bedeuten:

- `ereignisDatum`: Wann der konkrete Fortschritt tatsächlich geschah. Dieses Datum bestimmt die Kalenderposition.
- `veroeffentlichungsDatum`: Wann die hinterlegte Quelle veröffentlicht wurde.
- `erfasstAm`: Wann das Recherchesystem den Fund aufgenommen hat.

`id` bezeichnet genau diesen Archiveintrag. `storyId` bezeichnet dagegen die zugrundeliegende Entwicklung und bleibt über andere Überschriften, Quellen und spätere Updates hinweg gleich.

Für `beziehung` gelten zwei Werte:

- `original`: der erste gespeicherte Eintrag einer Story;
- `update`: ein neues reales Ereignis innerhalb derselben Story.

Ein Update bekommt eine neue `id`, behält aber die vorhandene `storyId`. Eine bloße Wiederholung wird nicht gespeichert. Das optionale Objekt `bild` enthält ein lokal gespeichertes Ereignisbild samt Alternativtext, Credit und Link zur Bildquelle. Details für eine tägliche Recherche stehen in [AUTOMATION.md](AUTOMATION.md).

## Hinweise zu den migrierten Bestandsdaten

Die Bestandsdaten wurden auf je einen Ursprungseintrag pro Story bereinigt. Wiederholte Fassungen ohne neuen Entwicklungsschritt wurden vollständig entfernt.

Am 03.09.2026 wurden nach einer erneuten Recherche für die vorausgegangenen drei Monate sieben zusätzliche, durch Originalpublikationen oder offizielle Institutionsquellen belegte Ereignisse ergänzt. Das Archiv enthält damit 24 eigenständige Storys. Für 13 Ereignisse sind eindeutig zuordenbare Bilder der jeweiligen Quellen lokal hinterlegt und direkt in der Tagesdetailansicht sichtbar.

Mehrere Alteinträge enthielten nur ein Publikations- oder früheres Kalenderdatum. Sie sind nicht stillschweigend als sicher behandelt: Der jeweilige `status` und `flag` nennen die offene Datums- oder Quellenfrage. Die spätere Recherche sollte diese Fälle mit Primärquellen nachvalidieren.

## GitHub Pages veröffentlichen

1. Den Inhalt dieses Ordners in ein GitHub-Repository mit Standardbranch `main` übertragen.
2. Im Repository unter **Settings → Pages → Build and deployment** als Quelle **GitHub Actions** auswählen.
3. Auf `main` pushen oder den Workflow **Daten prüfen und GitHub Pages veröffentlichen** manuell starten.

GitHub stellt anschließend automatisch eine öffentliche HTTPS-Adresse nach dem Muster `https://BENUTZERNAME.github.io/REPOSITORY/` bereit. Jeder spätere Push prüft zuerst Daten und JavaScript; nur ein gültiger Stand wird veröffentlicht.

Die statische Architektur ist hier sinnvoller als Vercel oder Netlify: Das Archiv benötigt zur Laufzeit keinen Server. Persistenz entsteht nachvollziehbar durch versionierte Änderungen an `data.json`, und die Recherche-Automatisierung kann diese Datei per Commit erweitern.
