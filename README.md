# EduBet – Projektantrag / Pflichtenheft



**Projektteam:** Metehan, David, Aldin, Sulejman, Hamlet, Osama aus der 3AHIF



---



## Inhaltsverzeichnis



* [1. Ausgangslage](#1-ausgangslage)



  * [1.1 Ist-Situation](#11-ist-situation)

  * [1.2 Verbesserungspotenziale](#12-verbesserungspotenziale)

  * [1.3 SWOT-Analyse](#13-swot-analyse)

* [2. Zielsetzung](#2-zielsetzung)



  * [2.1 Umgesetzte Hauptfunktionen](#21-umgesetzte-hauptfunktionen)

  * [2.2 Umgesetzte Spiele](#22-umgesetzte-spiele)

  * [2.3 Nicht oder nur teilweise umgesetzte Features](#23-nicht-oder-nur-teilweise-umgesetzte-features)

* [3. Systemarchitektur](#3-systemarchitektur)

* [4. Datenmodell](#4-datenmodell)

* [5. Funktionale Anforderungen](#5-funktionale-anforderungen)



  * [5.1 Use Case A – Homepage](#51-use-case-a--homepage)

  * [5.2 Use Case B – Spiele](#52-use-case-b--spiele)

  * [5.3 Use Case C – Leaderboard](#53-use-case-c--leaderboard)

  * [5.4 Use Case D – Friends Page](#54-use-case-d--friends-page)

  * [5.5 Use Case E – Rewards](#55-use-case-e--rewards)

  * [5.6 Use Case F – EduBet+](#56-use-case-f--edubet)

* [6. Spieleübersicht](#6-spieleübersicht)

* [7. Mengengerüst](#7-mengengerüst)

* [8. Fazit](#8-fazit)



---



## 1. Ausgangslage



Viele Casino-Webseiten sind entweder unübersichtlich, kostenpflichtig oder auf echtes Geld ausgelegt. Für unser Schulprojekt wollten wir deshalb eine eigene Casino-Web-App entwickeln, die nur mit virtuellen Coins funktioniert.



Unser Projekt heißt **EduBet**. Es handelt sich um eine browserbasierte Online-Casino-Web-App mit mehreren Spielen, Benutzerprofilen, Leaderboard, Friends Page und Reward-Systemen.



Wichtig ist: In unserer App wird **kein echtes Geld** verwendet. Alle Einsätze und Gewinne passieren nur mit virtuellen Coins.



---



## 1.1 Ist-Situation



* Viele Casino-Seiten sind auf echtes Geld ausgelegt

* Einige Online-Casinos sind unübersichtlich

* Viele Funktionen sind für Anfänger schwer verständlich

* Es gibt oft keine einfache Social-Funktion für Freunde

* Für ein Schulprojekt wollten wir eine sichere und kostenlose Alternative erstellen



---



## 1.2 Verbesserungspotenziale



### Vorteile unseres Projekts



* Kostenlos spielbar

* Keine echten Geldeinsätze

* Mehrere Spiele auf einer Plattform

* Benutzerkonten mit Coinsystem

* Leaderboard für Statistiken

* Friends Page als Social Feature

* Daily Reward und Mystery Box als Belohnungssystem

* EduBet+ als Premium-Feature

* Moderne Benutzeroberfläche



### Mögliche Probleme



* Mehrere Spiele bedeuten mehr Aufwand

* Spiellogik und Animationen sind teilweise komplex

* Frontend, Backend und Datenbank müssen zusammenarbeiten

* Hosting ist schwieriger, weil nicht nur ein Frontend, sondern auch ein Backend und eine SQLite-Datenbank benötigt werden



### Lösungen



* Schrittweise Umsetzung der wichtigsten Features

* Trennung von Frontend, Backend und Datenbank

* Speicherung von Usern, Coins und Spielverlauf in SQLite

* Fokus auf stabile lokale Version für die Präsentation

* Nicht umgesetzte Features wurden entfernt oder vereinfacht



---



## 1.3 SWOT-Analyse



| Stärken                                                | Schwächen                                |

| ------------------------------------------------------ | ---------------------------------------- |

| Mehrere spielbare Games                                | Hosting nicht umgesetzt                  |

| Full-Stack-Projekt mit Frontend, Backend und Datenbank | SQLite nur lokal verwendet               |

| Coinsystem und Spielverlauf                            | Manche Features vereinfacht              |

| Leaderboard, Friends und Rewards                       | Keine echte Zahlung / kein echtes Casino |



| Chancen                                    | Risiken                                   |

| ------------------------------------------ | ----------------------------------------- |

| Gutes Portfolio-Projekt                    | Zeitmangel                                |

| Erweiterbar mit neuen Games                | Fehler in Spiellogik                      |

| Gute Übung für Angular, Express und SQLite | Animationen können aufwendig sein         |

| Präsentierbares Schulprojekt               | Backend-Hosting wäre zusätzlicher Aufwand |



---



## 2. Zielsetzung



Ziel des Projekts war es, eine vollständige Online-Casino-Web-App zu entwickeln. Benutzer sollen sich registrieren, einloggen und mit virtuellen Coins verschiedene Spiele spielen können.



Zusätzlich soll die App nicht nur aus Spielen bestehen, sondern auch moderne Plattform-Features enthalten. Dazu gehören ein Leaderboard, eine Friends Page, Daily Reward, Mystery Box und EduBet+.



---



## 2.1 Umgesetzte Hauptfunktionen



* Registrierung und Login

* Benutzerprofil

* Virtuelles Coinsystem

* Spielverlauf

* Leaderboard

* Friends Page

* Daily Reward

* Mystery Box

* EduBet+ Premium-System

* Profilbild-Funktion

* Speicherung in SQLite

* REST-API mit Express

* Angular Frontend



---



## 2.2 Umgesetzte Spiele



Unsere App enthält fünf Spiele:



* Slot Machine

* Roulette

* Blackjack

* Plinko

* Mines



---



## 2.3 Nicht oder nur teilweise umgesetzte Features



Einige ursprünglich geplante Features wurden angepasst oder nicht umgesetzt, weil der Fokus auf den wichtigsten Funktionen lag.



Nicht umgesetzt oder vereinfacht wurden:



* Shop für Skins und Themes

* Hosting der fertigen Web-App

* erweiterte Leaderboard-Filter

* Blackjack-Funktionen wie Double und Split



Diese Funktionen könnten in einer zukünftigen Version ergänzt werden.



---



## 3. Systemarchitektur



Die App besteht aus drei Hauptteilen:



### Frontend



Das Frontend wurde mit **Angular**, **TypeScript**, **HTML** und **SCSS** umgesetzt.



Es zeigt die Benutzeroberfläche, Spiele, Profile, Leaderboard, Friends Page und Rewards an.



### Backend



Das Backend wurde mit **Node.js**, **Express** und **TypeScript** umgesetzt.



Es verarbeitet API-Requests, führt Logik aus und verbindet das Frontend mit der Datenbank.



### Datenbank



Als Datenbank verwenden wir **SQLite** mit **better-sqlite3**.



Darin speichern wir User, Coins, Spielverläufe, Freunde, Rewards und Premium-Status.



### Einfacher Ablauf



```txt

User → Angular Frontend → Express Backend → SQLite Datenbank

```



---



## 4. Datenmodell



Die wichtigsten Tabellen sind:



### users



In der Tabelle `users` speichern wir Benutzerinformationen.



Beispiele:



* Username

* Passwort

* Coins

* XP

* Premium-Status

* Profilbild

* Wins und Losses



### game_history



In der Tabelle `game_history` speichern wir jede gespielte Runde.



Beispiele:



* User-ID

* Spielname

* Ergebnis

* Einsatz

* gewonnene Coins

* verlorene Coins

* Zeitpunkt



Dadurch können wir Statistiken und das Leaderboard berechnen.



### friends



In der Tabelle `friends` speichern wir Freunde eines Benutzers.



Beispiele:



* User-ID

* Freundesname

* Level

* Wins

* Balance

* Erstellungsdatum



Dadurch kann die Friends Page anzeigen, welche Freunde ein User hat.



### Beispiel `friends` Tabelle



```sql

CREATE TABLE IF NOT EXISTS friends (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id INTEGER NOT NULL,

  friend_name TEXT NOT NULL,

  level INTEGER NOT NULL DEFAULT 1,

  total_wins INTEGER NOT NULL DEFAULT 0,

  balance INTEGER NOT NULL DEFAULT 0,

  last_active TEXT NOT NULL DEFAULT 'just now',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,



  FOREIGN KEY (user_id) REFERENCES users(id)

);

```



---



## 5. Funktionale Anforderungen



---



## 5.1 Use Case A – Homepage



### Beschreibung



Die Homepage ist die Startseite der App. Dort bekommt der Benutzer einen schnellen Überblick über die wichtigsten Funktionen.



### Funktionen



* Anzeige der wichtigsten Spiele

* Navigation zu Games, Profil, Leaderboard und Friends

* Anzeige des Coin-Stands

* Zugriff auf Rewards und andere Features

* Moderner Einstieg in die App



### Ziel



Der Benutzer soll schnell verstehen, was die App bietet, und direkt mit dem Spielen beginnen können.



---



## 5.2 Use Case B – Spiele



### Beschreibung



Der Benutzer kann zwischen mehreren Casino-Spielen wählen und mit virtuellen Coins Einsätze machen.



### Funktionen



* Einsatz auswählen

* Spiel starten

* Gewinn oder Verlust berechnen

* Coins aktualisieren

* Spielverlauf speichern



### Spiele



* Slot Machine

* Roulette

* Blackjack

* Plinko

* Mines



### Ziel



Der Benutzer soll verschiedene Spiele ausprobieren können und durch Gewinne oder Verluste seinen Coin-Stand verändern.



---



## 5.3 Use Case C – Leaderboard



### Beschreibung



Im Leaderboard sieht der Benutzer, wie gut andere Spieler sind.



### Funktionen



* Anzeige der Top-Spieler

* Anzeige von Wins und Losses

* Anzeige von gewonnenen und verlorenen Coins

* Berechnung aus der Spielhistorie

* Vergleich zwischen Spielern



### Ziel



Das Leaderboard soll Benutzer motivieren, öfter zu spielen und bessere Ergebnisse zu erreichen.



---



## 5.4 Use Case D – Friends Page



### Beschreibung



Die Friends Page ist ein Social Feature der App. Benutzer können andere Spieler als Freunde hinzufügen und deren Daten ansehen.



### Funktionen



* Freunde anzeigen

* Freundesanfragen senden

* Freundesanfragen annehmen oder ablehnen

* Freunde entfernen

* Freundesdaten anzeigen



### Ziel



Die App soll dadurch mehr wie eine echte Online-Plattform wirken und nicht nur wie eine Sammlung von Spielen.



---



## 5.5 Use Case E – Rewards



### Beschreibung



Die App enthält Belohnungssysteme, damit Benutzer regelmäßig zurückkommen.



### Funktionen



* Daily Reward

* Mystery Box

* Zufällige Belohnungen

* Bonus-Coins

* Mögliche Buffs oder Vorteile



### Ziel



Rewards sollen die App motivierender und interaktiver machen.



---



## 5.6 Use Case F – EduBet+



### Beschreibung



EduBet+ ist unser Premium-System. Es soll besondere Vorteile für Premium-User darstellen.



### Funktionen



* Premium-Status beim User speichern

* Besondere Markierung

* Bessere Rewards

* Mögliche Bonus-Vorteile



### Ziel



EduBet+ zeigt, wie ein Premium-System in einer Web-App umgesetzt werden kann.



---



## 6. Spieleübersicht



---



## 6.1 Slot Machine



### Beschreibung



Die Slot Machine ist ein Spielautomat mit Walzen und Symbolen.



### Ablauf



1. Spieler wählt Einsatz

2. Spieler klickt auf Spin

3. Walzen drehen sich

4. Symbole stoppen

5. Gewinn wird berechnet



### Umsetzung



* Animierte Walzen

* Verschiedene Symbole

* Gewinnlogik

* Coinsystem

* Spielverlauf speichern



---



## 6.2 Roulette



### Beschreibung



Bei Roulette setzt der Spieler auf Zahlen oder Farben. Danach dreht sich ein Roulette-Rad und eine Gewinnzahl wird bestimmt.



### Ablauf



1. Spieler setzt Coins

2. Rad wird gedreht

3. Gewinnzahl wird erzeugt

4. Auszahlung wird berechnet



### Umsetzung



* Animiertes Roulette-Rad

* Verschiedene Wettmöglichkeiten

* Zufallszahl

* Gewinnberechnung

* Speicherung im Spielverlauf



---



## 6.3 Blackjack



### Beschreibung



Blackjack ist ein Kartenspiel, bei dem der Spieler versucht, näher an 21 Punkte zu kommen als der Dealer, ohne über 21 zu gehen.



### Ablauf



1. Spieler setzt Coins

2. Spieler und Dealer erhalten Karten

3. Spieler entscheidet zwischen Hit und Stand

4. Dealer zieht Karten

5. Gewinner wird berechnet



### Umsetzung



* Kartenlogik

* Handwerte berechnen

* Ass zählt als 1 oder 11

* Hit und Stand

* Auszahlung und Spielverlauf



---



## 6.4 Plinko



### Beschreibung



Bei Plinko fällt ein Ball durch Pins und landet unten in einem Multiplikator-Feld.



### Ablauf



1. Spieler wählt Einsatz

2. Ball fällt nach unten

3. Ball prallt an Pins ab

4. Ball landet in einem Slot

5. Gewinn wird mit Multiplikator berechnet



### Umsetzung



* Ball-Animation

* Einfache Physik

* Kollision mit Pins

* Multiplikatoren

* Gewinnberechnung



---



## 6.5 Mines



### Beschreibung



Mines ist ein Risiko-Spiel, ähnlich wie Minesweeper. Der Spieler muss sichere Felder aufdecken und Minen vermeiden.



### Ablauf



1. Spieler wählt Einsatz

2. Minen werden verteilt

3. Spieler klickt Felder an

4. Sichere Felder erhöhen den Multiplikator

5. Mine bedeutet Verlust



### Umsetzung



* Grid mit Feldern

* Zufällige Minen

* Multiplikator-System

* Cashout-Funktion

* Spielverlauf speichern



---



## 7. Mengengerüst



### Benutzeranzahl



Für das Schulprojekt rechnen wir mit einer kleinen Testumgebung.



* ca. 10 bis 50 Testbenutzer

* Erweiterbar auf mehr Benutzer



### Datenmenge pro Benutzer



Pro Benutzer werden gespeichert:



* Profilinformationen

* Coins

* Premium-Status

* Freunde

* Spielverlauf

* Rewards



Die Datenmenge bleibt gering, da hauptsächlich Text- und Zahlenwerte gespeichert werden.



### Serveranfragen



Pro Sitzung entstehen mehrere Requests, zum Beispiel:



* Login / Registrierung

* Laden des Profils

* Starten eines Spiels

* Speichern des Spielverlaufs

* Laden des Leaderboards

* Laden der Friends Page

* Abholen von Rewards



---



## 8. Fazit



EduBet ist eine vollständige Web-App mit Frontend, Backend und Datenbank. Das Projekt enthält fünf Spiele, ein Coinsystem, Spielverlauf, Leaderboard, Friends Page, Daily Reward, Mystery Box und EduBet+.



Während der Umsetzung haben wir gelernt, wie man eine größere Web-App strukturiert, Angular mit Express verbindet und Daten in SQLite speichert. Besonders herausfordernd waren die Spiellogik, Animationen und das Zusammenspiel von Frontend, Backend und Datenbank.



Nicht alle ursprünglich geplanten Features wurden vollständig umgesetzt. Der Fokus lag am Ende auf einer stabilen lokalen Version mit den wichtigsten Funktionen.

