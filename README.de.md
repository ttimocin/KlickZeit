# ⏱️ ZeitLog - Arbeitszeiterfassungs-App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Kostenlos • Werbefrei • Open Source**

Erfassen Sie Ihre Arbeitszeiten mit einem Tipp, sichern Sie sie in Firebase und exportieren Sie sie als CSV.

**🌐 Languages / Sprachen:** [🇹🇷 Türkçe](README.md) • [🇬🇧 English](README.en.md) • [🇩🇪 Deutsch](README.de.md)

[Funktionen](#-funktionen) • [Installation](#-installation) • [Verwendung](#-verwendung) • [Mitwirken](#-mitwirken) • [Lizenz](#-lizenz)

</div>

---

## 📖 Über

ZeitLog ist eine **völlig kostenlose und werbefreie** mobile Anwendung, die es einfach macht, Ihre Arbeitszeiten zu erfassen. Mit ihrer modernen und benutzerfreundlichen Oberfläche war die Erfassung Ihrer Arbeitszeiten noch nie so einfach.

### 🎯 Warum ZeitLog?

- ✅ **Völlig Kostenlos** - Keine Gebühren, Abonnements oder versteckte Kosten
- ✅ **Werbefrei** - Keine Werbung oder unerwünschte Benachrichtigungen
- ✅ **Open Source** - Code ist vollständig offen, sicher und transparent
- ✅ **Datenschutzorientiert** - Ihre Daten bleiben in Ihrem Konto, werden nie geteilt
- ✅ **Funktioniert Offline** - Einträge auch ohne Internet erfassen
- ✅ **Firebase-Backup** - Ihre Daten werden sicher in der Cloud gespeichert
- ✅ **CSV-Export** - Öffnen Sie Ihre Aufzeichnungen in Excel

---

## ✨ Funktionen

### 🎨 Benutzererfahrung
- **Ein-Tipp-Erfassung**: Großer, leicht zugänglicher Button für sofortige Ein-/Ausstempeln
- **Live-Uhr-Anzeige**: Echtzeit-Uhr und Datumsinformationen
- **Arbeitsdauer-Tracking**: Live-Anzeige der Arbeitsdauer nach Einstempeln
- **Dunkler Modus**: Systemthemen-kompatibles, augenfreundliches Design
- **Mehrsprachige Unterstützung**: Türkisch, Englisch, Deutsch

### 💾 Datenverwaltung
- **Automatisches Backup**: Ihre Aufzeichnungen werden automatisch in Firebase gesichert
- **Offline-Betrieb**: Einträge ohne Internet erfassen, später synchronisieren
- **CSV-Export**: Alle Aufzeichnungen im CSV-Format herunterladen und teilen
- **CSV-Import**: Bestehende Aufzeichnungen aus CSV laden
- **Tageszusammenfassung**: Ein-, Ausstempeln und Arbeitsdauer-Zusammenfassung für jeden Tag

### 📊 Berichterstattung
- **Wochenansicht**: Wöchentliche Arbeitsstunden und Überstunden-Tracking
- **Tagesdetails**: Detaillierte Ein-/Ausstempel-Informationen für jeden Tag
- **Feiertagsmarkierung**: Feiertage markieren und automatisch 7 Stunden erfassen
- **Überstunden/Fehlzeit-Berechnung**: Tägliche und wöchentliche Überstunden/Fehlzeit-Berechnung

### 🔔 Benachrichtigungen
- **Einstempel-Benachrichtigung**: Sofortige Benachrichtigung beim Einstempeln
- **Erinnerungen**: Automatische Erinnerungsbenachrichtigungen nach 6,5 und 7 Stunden
- **Ausstempel-Benachrichtigung**: Zusammenfassungsbenachrichtigung beim Ausstempeln

### 🔐 Sicherheit
- **Firebase-Authentifizierung**: E-Mail/Passwort und Google Sign-In Unterstützung
- **Sichere Firestore-Regeln**: Benutzer können nur auf ihre eigenen Daten zugreifen
- **Datenvalidierung**: Alle Daten durchlaufen eine Formatprüfung

---

## 🚀 Installation

### Anforderungen

- Node.js 18+ 
- npm oder yarn
- Expo CLI
- Android Studio (für Android) oder Xcode (für iOS)

### Schritte

1. **Repository klonen**
   ```bash
   git clone https://github.com/ttimocin/ZeitLog.git
   cd ZeitLog
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Firebase-Konfiguration**
   
   a. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/)
   
   b. Erstellen Sie ein neues Projekt
   
   c. Fügen Sie "Web app" hinzu und erhalten Sie Konfigurationsinformationen
   
   d. Erstellen Sie Firestore Database (Sie können im Testmodus beginnen)
   
   e. Aktivieren Sie die Authentifizierung (E-Mail/Passwort und Google)
   
   f. Aktualisieren Sie die Konfiguration in `config/firebase.ts`:
   
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
   
   g. Gehen Sie zur Firestore Rules-Registerkarte in der Firebase Console und fügen Sie die Regeln aus `firestore.rules` ein

4. **Google Sign-In-Konfiguration (Optional)**
   
   Laden Sie `google-services.json` aus der Firebase Console herunter und fügen Sie es für Android zum Projektstammverzeichnis hinzu.

5. **Anwendung starten**
   ```bash
   # Entwicklungsserver
   npm start
   
   # Für Android
   npm run android
   
   # Für iOS
   npm run ios
   ```

---

## 📱 Verwendung

### Hauptbildschirm (Erfassung)

- **Grüner Button (EINSTEMPELN)**: Erfasst Ihre Arbeitsbeginn-Zeit
- **Oranger Button (AUSSTEMPELN)**: Erfasst Ihre Arbeitsende-Zeit
- **Live-Timer**: Ihre Arbeitsdauer wird nach dem Einstempeln live angezeigt
- **Heutige Aufzeichnungen**: Alle heute gemachten Aufzeichnungen werden aufgelistet
  - ☁️ = In Firebase gesichert
  - 📱 = Nur lokale Aufzeichnung (noch nicht synchronisiert)

### Verlauf-Bildschirm

- **Wochenansicht**: Wöchentliche Arbeitsstunden im Tabellenformat
- **Tagesdetails**: Ein-/Ausstempel-Zeiten und Arbeitsdauer für jeden Tag
- **Überstunden/Fehlzeit**: Tägliche und wöchentliche Überstunden/Fehlzeit-Anzeige
- **Feiertag**: Auf Tage klicken, um Feiertage hinzuzufügen oder zu entfernen

### Einstellungen

- **Sprachauswahl**: Türkisch, Englisch, Deutsch
- **Theme**: System, Hell, Dunkel
- **Firebase-Synchronisierung**: 
  - In Cloud sichern: Lädt ausstehende Aufzeichnungen in Firebase hoch
  - Von Cloud laden: Lädt Aufzeichnungen von Firebase auf lokales Gerät herunter
- **CSV-Operationen**:
  - CSV herunterladen: Teilt alle Aufzeichnungen als CSV-Datei
  - CSV importieren: Lädt Aufzeichnungen aus CSV-Datei

---

## 🛠️ Technologien

- **React Native** (Expo) - Plattformübergreifende mobile Entwicklung
- **TypeScript** - Typsicherheit
- **Firebase** - Authentifizierung und Firestore
- **Expo Router** - Dateibasiertes Routing
- **AsyncStorage** - Lokale Datenspeicherung
- **Expo Notifications** - Benachrichtigungsverwaltung
- **Expo File System & Sharing** - CSV-Export/Import

---

## 📁 Projektstruktur

```
ZeitLog/
├── app/                      # Expo Router-Seiten
│   ├── (tabs)/              # Tab-Navigation
│   │   ├── index.tsx        # Haupt-Erfassungsbildschirm
│   │   └── explore.tsx      # Verlauf-Bildschirm
│   ├── login.tsx            # Anmeldebildschirm
│   ├── settings.tsx         # Einstellungsbildschirm
│   └── _layout.tsx         # Root-Layout
├── components/              # Wiederverwendbare Komponenten
│   └── custom-modal.tsx    # Benutzerdefinierte Modal-Komponente
├── config/                 # Konfigurationsdateien
│   └── firebase.ts         # Firebase-Konfiguration
├── context/                # React Contexts
│   ├── AuthContext.tsx     # Authentifizierungs-Context
│   ├── ThemeContext.tsx    # Theme-Context
│   └── LanguageContext.tsx # Sprach-Context
├── services/               # Service-Schicht
│   ├── storage.ts          # AsyncStorage-Operationen
│   ├── firebase-sync.ts    # Firebase-Synchronisierung
│   ├── export.ts           # CSV-Export/Import
│   └── notifications.ts    # Benachrichtigungsverwaltung
├── types/                  # TypeScript-Typen
│   └── index.ts
├── utils/                  # Hilfsfunktionen
│   └── helpers.ts
├── i18n/                   # Mehrsprachige Unterstützung
│   ├── index.ts
│   └── translations.ts
├── firestore.rules         # Firestore-Sicherheitsregeln
└── app.json                # Expo-Konfiguration
```

---

## 🔒 Sicherheit

- **Firestore-Sicherheitsregeln**: Benutzer können nur auf ihre eigenen Daten zugreifen
- **Authentifizierung**: Sichere Anmeldung mit Firebase-Authentifizierung
- **Datenvalidierung**: Alle Daten durchlaufen eine Formatprüfung
- **Datenschutz**: Keine Daten werden an Dritte weitergegeben

---

## 📦 APK erstellen

### Mit EAS Build (Empfohlen)

```bash
# EAS CLI installieren
npm install -g eas-cli

# Bei EAS anmelden
eas login

# Build-Konfiguration erstellen
eas build:configure

# Android APK erstellen
eas build -p android --profile preview

# Für iOS
eas build -p ios --profile preview
```

### Lokaler Build

```bash
# Android APK
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

---

## 🤝 Mitwirken

Wir freuen uns über Ihre Beiträge! Bitte folgen Sie diesen Schritten:

1. Repository forken
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add some amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request öffnen

### Beitragsrichtlinien

- Code-Standards befolgen (ESLint-Regeln)
- TypeScript-Typsicherheit beibehalten
- Tests für neue Funktionen schreiben
- README aktualisieren

---

## 🐛 Fehlermeldungen

Wenn Sie einen Fehler finden, melden Sie ihn bitte auf der [Issues](https://github.com/ttimocin/ZeitLog/issues)-Seite. Geben Sie so viele Details wie möglich an:

- App-Version
- Gerät und Betriebssystem
- Schritte zur Reproduktion
- Erwartetes Verhalten
- Tatsächliches Verhalten
- Screenshots (falls verfügbar)

---

## 📄 Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](LICENSE) lizenziert. Das bedeutet, dass Sie das Projekt frei verwenden, ändern und verteilen können.

---

## 👨‍💻 Entwickler

**TayTek**

- GitHub: [@ttimocin](https://github.com/ttimocin)

---

## 🙏 Danksagungen

- [Expo](https://expo.dev/) - Großartige Entwicklungsplattform
- [Firebase](https://firebase.google.com/) - Zuverlässige Backend-Services
- [React Native Community](https://reactnative.dev/) - Fantastische Community

---

## ⭐ Projekt bewerten

Wenn Ihnen dieses Projekt gefällt, vergessen Sie nicht, einen Stern zu geben! ⭐

---

<div align="center">

**Erfassen Sie Ihre Arbeitszeiten einfach mit ZeitLog!** ⏱️

Made with ❤️ by TayTek

</div>









