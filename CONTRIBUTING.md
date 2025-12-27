# Katkıda Bulunma Rehberi

ZeitLog projesine katkıda bulunmak istediğiniz için teşekkürler! 🎉

## Nasıl Katkıda Bulunabilirim?

### 🐛 Hata Bildirimi

1. [Issues](https://github.com/taytek/zeitlog/issues) sayfasına gidin
2. Yeni bir issue oluşturun
3. Şu bilgileri ekleyin:
   - Uygulama versiyonu
   - Cihaz ve işletim sistemi
   - Hata adımları (reproduce edilebilir olmalı)
   - Beklenen vs gerçekleşen davranış
   - Ekran görüntüleri (varsa)

### ✨ Yeni Özellik Önerisi

1. [Issues](https://github.com/taytek/zeitlog/issues) sayfasında yeni bir issue açın
2. "Feature Request" etiketi ekleyin
3. Özelliği detaylıca açıklayın:
   - Neden bu özellik gerekli?
   - Nasıl çalışmalı?
   - Kullanıcı deneyimine etkisi nedir?

### 💻 Kod Katkısı

1. **Repository'yi fork edin**
   ```bash
   git clone https://github.com/taytek/zeitlog.git
   cd zeitlog
   ```

2. **Yeni bir branch oluşturun**
   ```bash
   git checkout -b feature/amazing-feature
   # veya
   git checkout -b fix/bug-description
   ```

3. **Değişikliklerinizi yapın**
   - Kod standartlarına uyun
   - TypeScript tip güvenliğini koruyun
   - Yorumlar ekleyin (gerekirse)

4. **Test edin**
   ```bash
   npm run lint
   npm start
   ```

5. **Commit edin**
   ```bash
   git add .
   git commit -m "feat: Add amazing feature"
   # veya
   git commit -m "fix: Fix bug description"
   ```

6. **Push edin**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Pull Request oluşturun**
   - GitHub'da Pull Request açın
   - Değişikliklerinizi açıklayın
   - İlgili issue'ları referans edin

## Commit Mesajları

Commit mesajlarınızı şu formatta yazın:

- `feat: Yeni özellik eklendi`
- `fix: Hata düzeltildi`
- `docs: Dokümantasyon güncellendi`
- `style: Kod formatı düzenlendi`
- `refactor: Kod yeniden yapılandırıldı`
- `test: Test eklendi`
- `chore: Build süreçleri güncellendi`

## Kod Standartları

- **TypeScript**: Tüm kod TypeScript ile yazılmalı
- **ESLint**: ESLint kurallarına uyun (`npm run lint`)
- **Tip Güvenliği**: `any` kullanımından kaçının
- **Fonksiyon İsimleri**: Açıklayıcı ve İngilizce
- **Yorumlar**: Karmaşık kodlar için yorum ekleyin

## Proje Yapısı

- `app/` - Expo Router sayfaları
- `components/` - Reusable bileşenler
- `services/` - İş mantığı ve API çağrıları
- `context/` - React Context'ler
- `types/` - TypeScript tip tanımları
- `utils/` - Yardımcı fonksiyonlar

## Sorularınız mı var?

Herhangi bir sorunuz varsa, lütfen bir issue açın veya doğrudan iletişime geçin.

Teşekkürler! 🙏

