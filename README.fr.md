# ⏱️ KlickZeit - Application de Suivi du Temps de Travail

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Gratuit • Sans Publicité • Open Source**

Suivez vos heures de travail en un seul clic, sauvegardez sur Firebase et exportez au format CSV.

**🌐 Languages / Sprachen:** [🇹🇷 Türkçe](README.md) • [🇬🇧 English](README.en.md) • [🇩🇪 Deutsch](README.de.md) • [🇫🇷 Français](README.fr.md) • [🇵🇹 Português](README.pt.md) • [🇸🇦 العربية](README.ar.md) • [🇨🇳 中文](README.zh.md) • [🇷🇺 Русский](README.ru.md)

[Fonctionnalités](#-fonctionnalités) • [Installation](#-installation) • [Utilisation](#-utilisation) • [Contribuer](#-contribuer) • [Licence](#-licence)

</div>

---

## 📖 À Propos

KlickZeit est une application mobile **totalement gratuite et sans publicité** qui facilite le suivi de vos heures de travail. Avec son interface moderne et conviviale, le suivi de vos heures de travail n'a jamais été aussi simple.

### 🎯 Pourquoi KlickZeit ?

- ✅ **Totalement Gratuit** - Pas de frais, d'abonnements ou de coûts cachés
- ✅ **Sans Publicité** - Pas de publicités ou de notifications non sollicitées
- ✅ **Open Source** - Le code est entièrement ouvert, sécurisé et transparent
- ✅ **Axé sur la Confidentialité** - Vos données restent dans votre compte, jamais partagées
- ✅ **Fonctionne Hors Ligne** - Enregistrez des entrées même sans internet
- ✅ **Sauvegarde Firebase** - Vos données sont stockées en toute sécurité dans le cloud
- ✅ **Export CSV** - Ouvrez vos enregistrements dans Excel

---

## ✨ Fonctionnalités

### 🎨 Expérience Utilisateur
- **Enregistrement en un clic**: Grand bouton facile d'accès pour pointer/dépointer instantanément
- **Affichage de l'Horloge en Direct**: Heure et date en temps réel
- **Suivi de la Durée de Travail**: Affichage de la durée de travail en direct après le pointage
- **Mode Sombre**: Design compatible avec le thème du système, agréable pour les yeux
- **Support Multi-langues**: Turc, Anglais, Allemand, Français, Portugais, Arabe, Chinois, Russe
- **Jeu de Pause**: Mini-jeu intégré (Sudoku, 2048 etc.) pour évacuer le stress pendant les pauses

### 💾 Gestion des Données
- **Sauvegarde Automatique**: Vos enregistrements sont automatiquement sauvegardés sur Firebase
- **Fonctionnement Hors Ligne**: Enregistrez sans internet, synchronisez plus tard
- **Export CSV**: Téléchargez et partagez tous vos enregistrements au format CSV
- **Import CSV**: Chargez des enregistrements existants depuis un fichier CSV
- **Résumé Quotidien**: Résumé des entrées, sorties et durée de travail pour chaque jour

### 📊 Rapports
- **Vue Hebdomadaire**: Heures de travail hebdomadaires et suivi des heures supplémentaires
- **Détails Quotidiens**: Informations détaillées d'entrée/sortie pour chaque jour
- **Jours de Travail Flexibles**: Personnalisez vos jours de travail (Lun-Dim)
- **Marquage des Jours Fériés**: Marquez les jours fériés et enregistrez automatiquement 7 heures
- **Calcul Heures Supplémentaires/Manquantes**: Calcul quotidien et hebdomadaire

### 🔔 Notifications et Mises à Jour
- **Notification de Pointage**: Notification instantanée lorsque vous pointez
- **Rappels**: Notifications de rappel automatique après 6,5 et 7 heures
- **Notification de Dépointage**: Notification récapitulative lorsque vous dépointez
- **Vérification de Mise à Jour Auto**: Vérification des nouvelles versions au démarrage

### 🔐 Sécurité
- **Authentification Firebase**: Support Email/Mot de passe et Google Sign-In
- **Suppression de Compte**: Option pour supprimer définitivement votre compte et toutes les données
- **Règles Firestore Sécurisées**: Les utilisateurs ne peuvent accéder qu'à leurs propres données
- **Validation des Données**: Toutes les données passent une validation de format

---

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Expo CLI
- Android Studio (pour Android) ou Xcode (pour iOS)

### Étapes

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/ttimocin/KlickZeit.git
   cd KlickZeit
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration Firebase**
   
   a. Allez sur [Firebase Console](https://console.firebase.google.com/)
   
   b. Créez un nouveau projet
   
   c. Ajoutez "Web app" et obtenez les informations de configuration
   
   d. Créez une Firestore Database (vous pouvez commencer en mode Test)
   
   e. Activez l'Authentification (Email/Mot de passe et Google)
   
   f. Mettez à jour la configuration dans `config/firebase.ts`:
   
   ```typescript
   const firebaseConfig = {
     apiKey: "VOTRE_API_KEY",
     authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
     projectId: "VOTRE_PROJECT_ID",
     storageBucket: "VOTRE_PROJECT_ID.appspot.com",
     messagingSenderId: "VOTRE_SENDER_ID",
     appId: "VOTRE_APP_ID"
   };
   ```
   
   g. Allez dans l'onglet Firestore Rules dans la Console Firebase et collez les règles depuis `firestore.rules`

4. **Configuration Google Sign-In (Optionnel)**
   
   Téléchargez `google-services.json` depuis la Console Firebase et ajoutez-le au répertoire racine du projet pour Android.

5. **Lancer l'application**
   ```bash
   # Serveur de développement
   npm start
   
   # Pour Android
   npm run android
   
   # Pour iOS
   npm run ios
   ```

---

## 📱 Utilisation

### Écran Principal (Enregistrement)

- **Bouton Vert (POINTER)**: Enregistre votre heure d'entrée
- **Bouton Orange (DÉPOINTER)**: Enregistre votre heure de sortie
- **Minuteur en Direct**: Votre durée de travail est affichée en direct après le pointage
- **Enregistrements d'Aujourd'hui**: Tous les enregistrements faits aujourd'hui sont listés
  - ☁️ = Sauvegardé sur Firebase
  - 📱 = Enregistrement local uniquement (pas encore synchronisé)

### Écran Historique

- **Vue Hebdomadaire**: Heures de travail hebdomadaires sous forme de tableau
- **Détails Quotidiens**: Heures d'entrée/sortie et durée de travail pour chaque jour
- **Heures Supplémentaires/Manquantes**: Affichage quotidien et hebdomadaire
- **Vacances**: Cliquez sur les jours pour ajouter ou supprimer des vacances

### Paramètres

- **Sélection de la Langue**: Turc, Anglais, Allemand, Français, etc.
- **Thème**: Système, Clair, Sombre
- **Synchronisation Firebase**: 
  - Sauvegarder dans le Cloud: Télécharge les enregistrements en attente sur Firebase
  - Charger depuis le Cloud: Télécharge les enregistrements de Firebase sur l'appareil local
- **Opérations CSV**:
  - Télécharger CSV: Partage tous les enregistrements en fichier CSV
  - Importer CSV: Charge des enregistrements depuis un fichier CSV

---

## 🛠️ Technologies

- **React Native** (Expo) - Développement mobile multiplateforme
- **TypeScript** - Sécurité de type
- **Firebase** - Authentification et Firestore
- **Expo Router** - Routage basé sur les fichiers
- **AsyncStorage** - Stockage de données local
- **Expo Notifications** - Gestion des notifications
- **Expo File System & Sharing** - Export/Import CSV

---

## 📁 Structure du Projet

```
KlickZeit/
├── app/                      # Pages Expo Router
│   ├── (tabs)/              # Navigation par onglets
│   │   ├── index.tsx        # Écran principal d'enregistrement
│   │   └── explore.tsx      # Écran d'historique
│   ├── login.tsx            # Écran de connexion
│   ├── settings.tsx         # Écran de paramètres
│   └── _layout.tsx         # Layout racine
├── components/              # Composants réutilisables
├── config/                 # Fichiers de configuration
├── context/                # Contextes React
├── services/               # Couche de service
├── types/                  # Types TypeScript
├── utils/                  # Fonctions utilitaires
├── i18n/                   # Support multi-langues
├── firestore.rules         # Règles de sécurité Firestore
└── app.json                # Configuration Expo
```

---

## 🔒 Sécurité

- **Règles de Sécurité Firestore**: Les utilisateurs ne peuvent accéder qu'à leurs propres données
- **Authentification**: Connexion sécurisée avec Firebase Authentication
- **Validation des Données**: Toutes les données passent une validation de format
- **Confidentialité**: Aucune donnée n'est partagée avec des tiers

---

## 📦 Construction APK

### Avec EAS Build (Recommandé)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
eas build -p ios --profile preview
```

### Build Local

```bash
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

---

## 🤝 Contribuer

Nous accueillons vos contributions ! Veuillez suivre ces étapes :

1. Forker le dépôt
2. Créer une branche de fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Commiter vos changements (`git commit -m 'Add some amazing feature'`)
4. Pusher vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous [Licence MIT](LICENSE).

---

## 👨‍💻 Développeur

**TayTek**

- GitHub: [@ttimocin](https://github.com/ttimocin)

---

<div align="center">

**Suivez vos heures de travail facilement avec KlickZeit !** ⏱️

Made with ❤️ by TayTek

</div>
