# Pflichtenheft `Projekt-Titel`

## Inhaltsverzeichnis

- [1. Ausgangslage](#1-ausgangslage)
  - [1.1. Ist-Situation](#11-ist-situation)
  - [1.2. Verbesserungspotenziale](#12-verbesserungspotenziale)
- [2. Zielsetzung](#2-zielsetzung)
- [3. Funktionale Anforderungen](#3-funktionale-anforderungen)
  - [3.1 Use Case A](#31-use-case-a)
  - [3.2 Use Case B](#32-use-case-b)
  - [3.3 Use Case C](#33-use-case-c)
- [4. Nicht-funktionale Anforderungen](#4-nicht-funktionale-anforderungen)
  - [`Usability`: Benutzbarkeitsanforderung](#usability-benutzbarkeitsanforderung)
  - [`Efficiency`: Effizienzanforderung](#efficiency-effizienzanforderung)
  - [`Maintenance`: Wartbarkeits- und Portierbarkeitsanforderung](#maintenance-wartbarkeits--und-portierbarkeitsanforderung)
  - [`Security`: Sicherheitsanforderung](#security-sicherheitsanforderung)
  - [`Legal`: Gesetzliche Anforderung](#legal-gesetzliche-anforderung)
- [5. Mengengerüst](#5-mengengerüst)
- [6. Systemarchitektur](#6-systemarchitektur)
  - [6.1 Deployment-Diagramm](#61-deployment-diagramm)
  - [6.2 Datenmodell](#62-datenmodell)

## 1. Ausgangslage

### 1.1. Ist-Situation

- Siehe Projektantrag

### 1.2. Verbesserungspotenziale

- Siehe Projektantrag

## 2. Zielsetzung

- Siehe Projektantrag

## 3. Funktionale Anforderungen

Zum Einstieg wird ein Überblick über die geplanten Use Cases gegeben, danach werden in den Unterkapiteln die einzelnen Use Cases im Detail beschrieben.

- Erstellen Sie ein **Use Case Diagramm** (UML UCD) mit maximal 7-10 Use Cases (verallgemeinert, nicht zu detailliert)
- Basis dafür ist die Mindmap aus dem Projektantrag => Ergänzen Sie relevante Rollen (für welche User-Gruppe / Persona ist ein Feature wichtig?)

<img src="pics/UCD_Casino.png">

### 3.1 Use Case A (zum Beispiel "User Login", "Dashboard", "Überblick Einnahmen/Ausgaben" etc.)

- GUI-Mockup einbinden (Scribble oder Figma)
- Ablauf verbal beschreiben
- Falls notwendig (weil sehr komplexer Ablauf), mit einem `UML Activity Diagram` visualisieren

### 3.2 Use Case B

### 3.3 Use Case C

...

## 4. Nicht-funktionale Anforderungen

Nicht-funktionale Anforderungen beschreiben Anforderungen an das System, die nicht-fachlicher Natur sind, jedoch entscheidend zur Anwendbarkeit des Systems beitragen. Sie definieren beispielsweise Qualitätsanforderungen, Sicherheitsanforderungen oder Performanceanforderungen.

Nicht-funktionale Anforderungen definieren grundlegende Eigenschaften eines Systems, die im Architekturentwurf berücksichtigt werden müssen. Da diese Anforderungen auch die Entwicklungskosten beeinflussen (können), müssen sie messbar beschrieben werden.

- FALSCH: Das System muss schnell sein.
- RICHTIG: Daten müssen spätestens innerhalb von 500 ms zurückgegeben werden.

Zur einfachen Strukturierung der Anforderungen werden diejenigen Anforderungen, die nicht eindeutig zu den funktionalen Anforderungen gehören, den nicht-funktionalen Anforderungen zugeordnet.

Hier ein Überblick über mögliche nicht-funktionale Anforderungen:

### `Usability`: Benutzbarkeitsanforderung

- Wie muss die Software beschaffen sein, damit die Zielgruppe gerne damit arbeitet?
- Beispiel:
  - Die Software soll dem Erscheinungsbild anderer Produkte des Herstellers entsprechen.

### `Efficiency`: Effizienzanforderung

- Hier geht es sowohl um Laufzeit- als auch um Speichereffizienz. Was wird unter dem sparsamen Einsatz dieser Ressourcen verstanden?
- Beispiel:
  - Die Berechnung darf nicht länger als 0,25 Sekunden dauern.

### `Maintenance`: Wartbarkeits- und Portierbarkeitsanforderung

- Welcher Grad an Änderbarkeit wird gefordert? Hier werden, soweit wie möglich, kommende Anpassungen und Erweiterungen vorhergesehen.
- Beispiel:
  - Das Produkt soll später auch in englischer Sprache verfügbar sein.

### `Security`: Sicherheitsanforderung

- Zu den Sicherheitsanforderungen gehören die Aspekte Vertraulichkeit, Datenintegrität und Verfügbarkeit.
  - Wie sehr müssen die Daten vor dem Zugriff durch Dritte geschützt werden?
  - Ist es entscheidend, die Korrektheit der erfassten Daten und ihre Konsistenz zu gewährleisten?
  - Dürfen Systemausfälle vorkommen?
- Beispiel:
  - Das System muss gewährleisten, dass Daten nie verändert werden können.

### `Legal`: Gesetzliche Anforderung

- Welche Standards und Gesetze müssen beachtet werden?
- Beispiel:
  - Das Produkt muss die ISO 9000 Norm erfüllen.

> **Hinweis:** Erfinden Sie keine künstlichen Anforderungen nur um alle Kategorien abzudecken. Beschränken Sie sich auf die Anforderungen, die für Ihr Projekt relevant sind.

## 5. Mengengerüst

Zur Abschätzung der aufkommenden Datenmengen und damit verbunden der notwendigen Infrastruktur, um die nötige Performance zu erzielen, ist ein Mengengerüst zu erstellen. Mögliche Fragestellungen:

- Wieviele User werden erwartet?
- Wieviele Daten pro User werden erwartet?
- Mit welcher Anfrage-Frequenz wird gerechnet?

## 6. Systemarchitektur

### 6.1 Deployment-Diagramm

- Auflistung der Softwarekomponenten in einem Verteilungsdiagramm (typisch: Client - Server - Datenbank).
- Beispiel:
...

### 6.2 Datenmodell

<img src="pics/ERD_Casino.png">

