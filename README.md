# Online Casino – Pflichtenheft

**Projektteam:** Metehan, David, Aldin, Sulejman, Hamlet, Osama aus der 3AHIF

---

## Inhaltsverzeichnis

- [1. Ausgangslage](#1-ausgangslage)
  - [1.1 Ist-Situation](#11-ist-situation)
  - [1.2 Verbesserungspotenziale](#12-verbesserungspotenziale)
- [2. Zielsetzung](#2-zielsetzung)
- [3. Funktionale Anforderungen](#3-funktionale-anforderungen)
  - [3.1 Use Case A – Homepage](#31-use-case-a--homepage)
  - [3.2 Use Case B – Leaderboard](#32-use-case-b--leaderboard)
  - [3.3 Use Case C – Shop](#33-use-case-c--shop)

- [5. Mengengerüst](#5-mengengerüst)

---

## 1. Ausgangslage

Casinos gibt es meistens nur an bestimmten Orten und zu bestimmten Zeiten.  
Oft braucht man dort auch viel Geld. Für viele Leute ist das daher nicht praktisch.

Online-Casinos gibt es zwar, aber viele davon sind kompliziert aufgebaut oder kosten Geld.  
Deshalb wollen wir ein einfaches Online-Casino als Webprojekt umsetzen.

---

### 1.1 Ist-Situation

- Casinos sind ortsgebunden  
- Nicht jederzeit verfügbar  
- Meist hoher Geldeinsatz notwendig  
- Kaum Anpassungsmöglichkeiten  
- Online-Angebote oft unübersichtlich oder kostenpflichtig  

---

### 1.2 Verbesserungspotenziale

#### Vorteile des Projekts

- Jederzeit spielbar (browserbasiert)  
- Komplett kostenlos  
- Mehrere Spiele auf einer Plattform  
- Moderne, übersichtliche Benutzeroberfläche  
- Fortschritt wird gespeichert

#### Mögliche Probleme

- Keine Serverfunktionen  
- Teilweise komplexe Spiellogik  
- Erhöhter Zeitaufwand durch mehrere Spiele  

#### Lösungen

- Speicherung im Server
- Wichtige Funktionen zuerst umsetzen
- Schrittweise Umsetzung  

#### SWOT-Analyse

| **Stärken** | **Schwächen** |
|------------|---------------|
| Motivierendes Projekt | Keine Serveranbindung |
| Gute Übung für HTML/CSS/JS/TS | Daten nur lokal |
| Mehrere Spielarten | Teilweise komplexe Logik |

| **Chancen** | **Risiken** |
|------------|-------------|
| Gutes Portfolio-Projekt | Zeitmangel |
| Erweiterbar | Fehleranfällige Spielmechaniken |

---

## 2. Zielsetzung

Ziel ist es, ein einfaches Online-Casino zu erstellen, das komplett im Browser läuft.  
Der Benutzer soll verschiedene Spiele spielen und Coins gewinnen oder verlieren können.

### Hauptfunktionen

- Benutzerprofil  
- Coins-System  
- Daily Reward  
- Shop für Skins / Themes  
- Level- & Win-Streak-System  
- Leaderboard  

### Spiele

- Mines  
- Roulette  
- Blackjack  
- Plinko  
- Slot Machine  

---

## 3. Funktionale Anforderungen

---

### 3.1 Use Case A – Homepage

**Beschreibung:**  
Die Startseite ist die erste Seite nach dem Öffnen der Website.
Hier bekommt der Benutzer einen schnellen Überblick über das Casino.

**Funktionen:**

- Navigation (Home, Shop, Games, Profil usw.)
- Anzeige des aktuellen Coin-Stands
- Zugriff auf den Shop
- Anzeige des Leaderboards
- Anzeige der Top 3 Games
- Schneller Einstieg in den Top Games

**Ziel:**     
Der Benutzer soll schnell verstehen, was möglich ist, und direkt spielen können.

![Homepage Scribble](pics/homepageScribble.jpg)

---

### 3.2 Use Case B – Leaderboard

**Beschreibung:**  
Im Leaderboard sieht der Benutzer mithilfe der Filter, wie gut er im Vergleich zu anderen Spielern ist.  Er kann sich ein beliebiges Spiel und seine Freunde auswählen, wie auch der aktuelle Ort und wie lang er die Liste haben will.

**Funktionen:**

- Anzeige der Top-Spieler
- Sortierung beliebeige Filter 
- Eigene Position wird angezeigt
- Auswahl von Spielen
- Übersichtliche Listenansicht

**Ziel:**     
Der Benutzer soll motiviert werden, öfter zu spielen und besser zu werden.

![Leaderboard Scribble](pics/leaderboardScribble.jpg)

---

### 3.3 Use Case C – Shop

**Beschreibung:**  
Im Shop kann der Benutzer seine Coins für Skins, Designs oder Extras ausgeben.

**Funktionen:**
- Anzeige verfügbarer Items 
- Anzeige des Preises in Coins  
- Kaufen von Items
- Anzeige gekaufter Items  
- Spezial-Items (z. B. Events oder Themen) 

![Shop Scribble](pics/shopScribble.jpg)

**Ziel:**            
Der Benutzer soll Coins sinnvoll verwenden und sein Casino personalisieren können.

---



## 5. Mengengerüst

- **Benutzeranzahl:**  
  - ca. **1.000+ Benutzer** 
  - optimales Wachstum mit Werbung

- **Datenmenge pro Benutzer:**  
  - Profil, Coins, Fortschritt  
  - unter **3 MB pro Benutzer**

- **Serveranfragen:**  
  - ca. 10-30 Serveranfragen pro Sitzung je nach Gebrauch (z. B. Laden von Daten, Seiten, Spielen, Leaderboards)
