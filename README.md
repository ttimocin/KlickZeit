# ⏱️ ZeitLog - İş Takip Uygulaması

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Ücretsiz • Reklamsız • Açık Kaynak**

Tek tuşla işe giriş-çıkış saatlerinizi kaydedin, Firebase'e yedekleyin ve CSV olarak dışa aktarın.

**🌐 Diller / Languages:** [🇹🇷 Türkçe](README.md) • [🇬🇧 English](README.en.md) • [🇩🇪 Deutsch](README.de.md) • [🇫🇷 Français](README.fr.md) • [🇵🇹 Português](README.pt.md) • [🇸🇦 العربية](README.ar.md) • [🇨🇳 中文](README.zh.md) • [🇷🇺 Русский](README.ru.md)

[Özellikler](#-özellikler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [Katkıda Bulun](#-katkıda-bulun) • [Lisans](#-lisans)

</div>

---

## 📖 Hakkında

ZeitLog, işe giriş-çıkış saatlerinizi kolayca takip etmenizi sağlayan, **tamamen ücretsiz ve reklamsız** bir mobil uygulamadır. Modern ve kullanıcı dostu arayüzü ile çalışma saatlerinizi kaydetmek hiç bu kadar kolay olmamıştı.

### 🎯 Neden ZeitLog?

- ✅ **Tamamen Ücretsiz** - Hiçbir ücret, abonelik veya gizli maliyet yok
- ✅ **Reklamsız** - Hiçbir reklam veya izinsiz bildirim yok
- ✅ **Açık Kaynak** - Kodlar tamamen açık, güvenli ve şeffaf
- ✅ **Gizlilik Odaklı** - Verileriniz sadece sizin hesabınızda, kimseyle paylaşılmaz
- ✅ **Çevrimdışı Çalışır** - İnternet olmasa bile kayıt yapabilirsiniz
- ✅ **Firebase Yedekleme** - Verileriniz bulutta güvenle saklanır
- ✅ **CSV Dışa Aktarma** - Kayıtlarınızı Excel'de açabilirsiniz

---

## ✨ Özellikler

### 🎨 Kullanıcı Deneyimi
- **Tek Tuşla Kayıt**: Büyük, kolay erişilebilir buton ile anında giriş/çıkış kaydı
- **Canlı Saat Gösterimi**: Gerçek zamanlı saat ve tarih bilgisi
- **Çalışma Süresi Takibi**: Giriş yaptıktan sonra canlı çalışma süresi gösterimi
- **Karanlık Mod**: Sistem temasına uyumlu, göz dostu tasarım
- **Çoklu Dil Desteği**: Türkçe, İngilizce, Almanca, Fransızca, Portekizce, Arapça, Çince, Rusça
- **Mola Oyunu**: Molalarınızda stres atmak için entegre mini oyun (Sudoku, 2048 vb.)

### 💾 Veri Yönetimi
- **Otomatik Yedekleme**: Kayıtlarınız Firebase'e otomatik olarak yedeklenir
- **Çevrimdışı Çalışma**: İnternet olmasa da kayıt yapabilir, sonra senkronize edebilirsiniz
- **CSV Dışa Aktarma**: Tüm kayıtlarınızı CSV formatında indirip paylaşabilirsiniz
- **CSV İçe Aktarma**: Mevcut kayıtlarınızı CSV'den yükleyebilirsiniz
- **Günlük Özet**: Her gün için giriş, çıkış ve çalışma süresi özeti

### 📊 Raporlama
- **Haftalık Görünüm**: Haftalık çalışma saatleri ve fazla mesai takibi
- **Günlük Detaylar**: Her gün için detaylı giriş/çıkış bilgileri
- **Esnek Çalışma Günleri**: Çalışma günlerinizi (Pzt-Paz) özelleştirebilme
- **Tatil Günü İşaretleme**: Tatil günlerini işaretleyip otomatik 7 saat kaydı
- **Fazla/Eksik Süre Hesaplama**: Günlük ve haftalık fazla/eksik çalışma süresi

### 🔔 Bildirimler ve Güncellemeler
- **Giriş Bildirimi**: Giriş yaptığınızda anında bildirim
- **Hatırlatmalar**: 6.5 ve 7 saat sonra otomatik hatırlatma bildirimleri
- **Çıkış Bildirimi**: Çıkış yaptığınızda özet bildirimi
- **Otomatik Güncelleme Kontrolü**: Uygulama açılışında yeni versiyon kontrolü

### 🔐 Güvenlik
- **Firebase Authentication**: Email/Password ve Google Sign-In desteği
- **Hesap Silme**: Hesabınızı ve tüm verilerinizi kalıcı olarak silme seçeneği
- **Güvenli Firestore Kuralları**: Kullanıcılar sadece kendi verilerine erişebilir
- **Veri Doğrulama**: Tüm veriler format kontrolünden geçer

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Expo CLI
- Android Studio (Android için) veya Xcode (iOS için)

### Adımlar

1. **Repository'yi klonlayın**
   ```bash
   git clone https://github.com/ttimocin/ZeitLog.git
   cd ZeitLog
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Firebase Yapılandırması**
   
   a. [Firebase Console](https://console.firebase.google.com/) adresine gidin
   
   b. Yeni bir proje oluşturun
   
   c. "Web app" ekleyin ve konfigürasyon bilgilerini alın
   
   d. Firestore Database oluşturun (Test modunda başlayabilirsiniz)
   
   e. Authentication'ı etkinleştirin (Email/Password ve Google)
   
   f. `config/firebase.ts` dosyasındaki konfigürasyonu güncelleyin:
   
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
   
   g. Firebase Console'da Firestore Rules sekmesine gidin ve `firestore.rules` dosyasındaki kuralları yapıştırın

4. **Google Sign-In Yapılandırması (Opsiyonel)**
   
   Android için `google-services.json` dosyasını Firebase Console'dan indirip proje kök dizinine ekleyin.

5. **Uygulamayı başlatın**
   ```bash
   # Geliştirme sunucusu
   npm start
   
   # Android için
   npm run android
   
   # iOS için
   npm run ios
   ```

---

## 📱 Kullanım

### Ana Ekran (Kayıt)

- **Yeşil Buton (GİRİŞ YAP)**: İşe giriş saatinizi kaydeder
- **Turuncu Buton (ÇIKIŞ YAP)**: İşten çıkış saatinizi kaydeder
- **Canlı Timer**: Giriş yaptıktan sonra çalışma süreniz canlı olarak gösterilir
- **Bugünün Kayıtları**: Bugün yaptığınız tüm kayıtlar listelenir
  - ☁️ = Firebase'e yedeklendi
  - 📱 = Sadece yerel kayıt (henüz senkronize edilmedi)

### Geçmiş Ekranı

- **Haftalık Görünüm**: Haftalık çalışma saatleri tablo formatında
- **Günlük Detaylar**: Her gün için giriş/çıkış saatleri ve çalışma süresi
- **Fazla/Eksik Süre**: Günlük ve haftalık fazla/eksik çalışma süresi gösterimi
- **Tatil Günü**: Günlere tıklayarak tatil günü ekleyebilir veya kaldırabilirsiniz

### Ayarlar

- **Dil Seçimi**: Türkçe, İngilizce, Almanca
- **Tema**: Sistem, Açık, Koyu
- **Firebase Senkronizasyon**: 
  - Buluta Yedekle: Bekleyen kayıtları Firebase'e yükler
  - Buluttan Yükle: Firebase'deki kayıtları yerel cihaza indirir
- **CSV İşlemleri**:
  - CSV İndir: Tüm kayıtları CSV dosyası olarak paylaşır
  - CSV İçe Aktar: CSV dosyasından kayıtları yükler

---

## 🛠️ Teknolojiler

- **React Native** (Expo) - Cross-platform mobil geliştirme
- **TypeScript** - Tip güvenliği
- **Firebase** - Authentication ve Firestore
- **Expo Router** - Dosya tabanlı routing
- **AsyncStorage** - Yerel veri depolama
- **Expo Notifications** - Bildirim yönetimi
- **Expo File System & Sharing** - CSV export/import

---

## 📁 Proje Yapısı

```
ZeitLog/
├── app/                      # Expo Router sayfaları
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Ana kayıt ekranı
│   │   └── explore.tsx      # Geçmiş kayıtlar ekranı
│   ├── login.tsx            # Giriş ekranı
│   ├── settings.tsx         # Ayarlar ekranı
│   └── _layout.tsx         # Root layout
├── components/              # Reusable bileşenler
│   └── custom-modal.tsx    # Özel modal bileşeni
├── config/                 # Yapılandırma dosyaları
│   └── firebase.ts         # Firebase yapılandırması
├── context/                # React Context'ler
│   ├── AuthContext.tsx     # Authentication context
│   ├── ThemeContext.tsx    # Tema context
│   └── LanguageContext.tsx # Dil context
├── services/               # Servis katmanı
│   ├── storage.ts          # AsyncStorage işlemleri
│   ├── firebase-sync.ts    # Firebase senkronizasyon
│   ├── export.ts           # CSV dışa/içe aktarma
│   └── notifications.ts    # Bildirim yönetimi
├── types/                  # TypeScript tipleri
│   └── index.ts
├── utils/                  # Yardımcı fonksiyonlar
│   └── helpers.ts
├── i18n/                   # Çoklu dil desteği
│   ├── index.ts
│   └── translations.ts
├── firestore.rules         # Firestore güvenlik kuralları
└── app.json                # Expo yapılandırması
```

---

## 🔒 Güvenlik

- **Firestore Security Rules**: Kullanıcılar sadece kendi verilerine erişebilir
- **Authentication**: Firebase Authentication ile güvenli giriş
- **Veri Doğrulama**: Tüm veriler format kontrolünden geçer
- **Gizlilik**: Hiçbir veri üçüncü taraflarla paylaşılmaz

## 📄 Yasal Belgeler

- **Gizlilik Politikası**: [Web Versiyonu](https://ttimocin.github.io/ZeitLog/privacy-policy.html) | [Uygulama İçi](app/privacy-policy.tsx)
- **Kullanım Koşulları**: [Web Versiyonu](https://ttimocin.github.io/ZeitLog/terms-of-service.html) | [Uygulama İçi](app/terms-of-service.tsx)

> **Not**: GitHub Pages kurulumu için `docs/README.md` dosyasına bakın.

---

## 📦 APK Oluşturma

### EAS Build ile (Önerilen)

```bash
# EAS CLI'yi yükleyin
npm install -g eas-cli

# EAS'a giriş yapın
eas login

# Build yapılandırması oluşturun
eas build:configure

# Android APK oluşturun
eas build -p android --profile preview

# iOS için
eas build -p ios --profile preview
```

### Yerel Build

```bash
# Android APK
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

---

## 🤝 Katkıda Bulun

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Katkı Kuralları

- Kod standartlarına uyun (ESLint kuralları)
- TypeScript tip güvenliğini koruyun
- Yeni özellikler için test yazın
- README'yi güncelleyin

---

## 🐛 Hata Bildirimi

Bir hata bulduysanız, lütfen [Issues](https://github.com/ttimocin/ZeitLog/issues) sayfasında bildirin. Mümkün olduğunca detaylı bilgi verin:

- Uygulama versiyonu
- Cihaz ve işletim sistemi
- Hata adımları
- Beklenen davranış
- Gerçekleşen davranış
- Ekran görüntüleri (varsa)

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. Bu, projeyi özgürce kullanabileceğiniz, değiştirebileceğiniz ve dağıtabileceğiniz anlamına gelir.

---

## 👨‍💻 Geliştirici

**TayTek**

- GitHub: [@ttimocin](https://github.com/ttimocin)

---

## 🙏 Teşekkürler

- [Expo](https://expo.dev/) - Harika bir geliştirme platformu
- [Firebase](https://firebase.google.com/) - Güvenilir backend servisleri
- [React Native Community](https://reactnative.dev/) - Muhteşem topluluk

---

## ⭐ Yıldız Verin

Bu projeyi beğendiyseniz, bir yıldız vermeyi unutmayın! ⭐

---

<div align="center">

**ZeitLog ile çalışma saatlerinizi kolayca takip edin!** ⏱️

Made with ❤️ by TayTek

</div>
