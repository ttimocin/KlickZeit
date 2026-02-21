# ⏱️ KlickZeit - Work Time Tracking App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Free • Ad-Free • Open Source**

Track your work hours with a single tap, backup to Firebase, and export as CSV.

**🌐 Languages / Sprachen:** [🇹🇷 Türkçe](README.md) • [🇬🇧 English](README.en.md) • [🇩🇪 Deutsch](README.de.md) • [🇫🇷 Français](README.fr.md) • [🇵🇹 Português](README.pt.md) • [🇸🇦 العربية](README.ar.md) • [🇨🇳 中文](README.zh.md) • [🇷🇺 Русский](README.ru.md)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 📖 About

KlickZeit is a **completely free and ad-free** mobile application that makes it easy to track your work hours. With its modern and user-friendly interface, tracking your work hours has never been easier.

### 🎯 Why KlickZeit?

- ✅ **Completely Free** - No fees, subscriptions, or hidden costs
- ✅ **Ad-Free** - No ads or unsolicited notifications
- ✅ **Open Source** - Code is completely open, secure, and transparent
- ✅ **Privacy-Focused** - Your data stays in your account, never shared
- ✅ **Works Offline** - Record entries even without internet
- ✅ **Firebase Backup** - Your data is securely stored in the cloud
- ✅ **CSV Export** - Open your records in Excel

---

## ✨ Features

### 🎨 User Experience
- **One-Tap Recording**: Large, easily accessible button for instant check-in/check-out
- **Live Clock Display**: Real-time clock and date information
- **Work Duration Tracking**: Live work duration display after check-in
- **Dark Mode**: System theme compatible, eye-friendly design
- **Multi-Language Support**: Turkish, English, German, French, Portuguese, Arabic, Chinese, Russian
- **Break Game**: Integrated mini-game (Sudoku, 2048 etc.) to relieve stress during breaks

### 💾 Data Management
- **Automatic Backup**: Your records are automatically backed up to Firebase
- **Offline Operation**: Record entries without internet, sync later
- **CSV Export**: Download and share all your records in CSV format
- **CSV Import**: Load existing records from CSV
- **Daily Summary**: Entry, exit, and work duration summary for each day

### 📊 Reporting
- **Weekly View**: Weekly work hours and overtime tracking
- **Daily Details**: Detailed entry/exit information for each day
- **Flexible Working Days**: Customize your working days (Mon-Sun)
- **Holiday Marking**: Mark holidays and automatically record 7 hours
- **Overtime/Shortage Calculation**: Daily and weekly overtime/shortage calculation

### 🔔 Notifications and Updates
- **Check-In Notification**: Instant notification when you check in
- **Reminders**: Automatic reminder notifications after 6.5 and 7 hours
- **Check-Out Notification**: Summary notification when you check out
- **Auto Update Check**: Check for new versions on app startup

### 🔐 Security
- **Firebase Authentication**: Email/Password and Google Sign-In support
- **Account Deletion**: Option to permanently delete your account and all data
- **Secure Firestore Rules**: Users can only access their own data
- **Data Validation**: All data passes format validation

---

## 🚀 Installation

### Requirements

- Node.js 18+ 
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ttimocin/KlickZeit.git
   cd KlickZeit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   
   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project
   
   c. Add "Web app" and get configuration information
   
   d. Create Firestore Database (you can start in Test mode)
   
   e. Enable Authentication (Email/Password and Google)
   
   f. Update the configuration in `config/firebase.ts`:
   
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
   
   g. Go to Firestore Rules tab in Firebase Console and paste the rules from `firestore.rules`

4. **Google Sign-In Configuration (Optional)**
   
   Download `google-services.json` from Firebase Console and add it to the project root directory for Android.

5. **Start the application**
   ```bash
   # Development server
   npm start
   
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

---

## 📱 Usage

### Main Screen (Recording)

- **Green Button (CHECK IN)**: Records your work entry time
- **Orange Button (CHECK OUT)**: Records your work exit time
- **Live Timer**: Your work duration is displayed live after check-in
- **Today's Records**: All records you made today are listed
  - ☁️ = Backed up to Firebase
  - 📱 = Local record only (not yet synchronized)

### History Screen

- **Weekly View**: Weekly work hours in table format
- **Daily Details**: Entry/exit times and work duration for each day
- **Overtime/Shortage**: Daily and weekly overtime/shortage display
- **Holiday**: Click on days to add or remove holidays

### Settings

- **Language Selection**: Turkish, English, German
- **Theme**: System, Light, Dark
- **Firebase Synchronization**: 
  - Backup to Cloud: Uploads pending records to Firebase
  - Load from Cloud: Downloads records from Firebase to local device
- **CSV Operations**:
  - Download CSV: Shares all records as CSV file
  - Import CSV: Loads records from CSV file

---

## 🛠️ Technologies

- **React Native** (Expo) - Cross-platform mobile development
- **TypeScript** - Type safety
- **Firebase** - Authentication and Firestore
- **Expo Router** - File-based routing
- **AsyncStorage** - Local data storage
- **Expo Notifications** - Notification management
- **Expo File System & Sharing** - CSV export/import

---

## 📁 Project Structure

```
KlickZeit/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Main recording screen
│   │   └── explore.tsx      # History screen
│   ├── login.tsx            # Login screen
│   ├── settings.tsx         # Settings screen
│   └── _layout.tsx         # Root layout
├── components/              # Reusable components
│   └── custom-modal.tsx    # Custom modal component
├── config/                 # Configuration files
│   └── firebase.ts         # Firebase configuration
├── context/                # React Contexts
│   ├── AuthContext.tsx     # Authentication context
│   ├── ThemeContext.tsx    # Theme context
│   └── LanguageContext.tsx # Language context
├── services/               # Service layer
│   ├── storage.ts          # AsyncStorage operations
│   ├── firebase-sync.ts    # Firebase synchronization
│   ├── export.ts           # CSV export/import
│   └── notifications.ts    # Notification management
├── types/                  # TypeScript types
│   └── index.ts
├── utils/                  # Helper functions
│   └── helpers.ts
├── i18n/                   # Multi-language support
│   ├── index.ts
│   └── translations.ts
├── firestore.rules         # Firestore security rules
└── app.json                # Expo configuration
```

---

## 🔒 Security

- **Firestore Security Rules**: Users can only access their own data
- **Authentication**: Secure login with Firebase Authentication
- **Data Validation**: All data passes format validation
- **Privacy**: No data is shared with third parties

---

## 📄 Legal Documents

- **Privacy Policy**: [Web Version](https://ttimocin.github.io/KlickZeit/privacy-policy-en.html) | [In-App](app/privacy-policy.tsx)
- **Terms of Service**: [Web Version](https://ttimocin.github.io/KlickZeit/terms-of-service-en.html) | [In-App](app/terms-of-service.tsx)

---

## 📦 Building APK

### With EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Create build configuration
eas build:configure

# Build Android APK
eas build -p android --profile preview

# For iOS
eas build -p ios --profile preview
```

### Local Build

```bash
# Android APK
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

---

## 🤝 Contributing

We welcome your contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow code standards (ESLint rules)
- Maintain TypeScript type safety
- Write tests for new features
- Update README

---

## 🐛 Bug Reports

If you find a bug, please report it on the [Issues](https://github.com/ttimocin/KlickZeit/issues) page. Provide as much detail as possible:

- App version
- Device and operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if available)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). This means you can freely use, modify, and distribute the project.

---

## 👨‍💻 Developer

**TayTek**

- GitHub: [@ttimocin](https://github.com/ttimocin)

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - Great development platform
- [Firebase](https://firebase.google.com/) - Reliable backend services
- [React Native Community](https://reactnative.dev/) - Amazing community

---

## ⭐ Star This Project

If you like this project, don't forget to give it a star! ⭐

---

<div align="center">

**Track your work hours easily with KlickZeit!** ⏱️

Made with ❤️ by TayTek

</div>









