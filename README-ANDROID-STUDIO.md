# Android Studio Başlatma

## Sorun
Android Studio'da Node.js PATH'te bulunamıyor hatası alıyorsanız, bu script'i kullanın.

## Çözüm

### Yöntem 1: Batch Script (Önerilen)

1. `start-android-studio.bat` dosyasını çift tıklayın
2. Android Studio otomatik olarak PATH ile başlayacak

### Yöntem 2: Android Studio Kısayolu

1. Android Studio kısayolunu bulun
2. Sağ tıklayın → "Properties"
3. "Target" alanını şöyle değiştirin:
   ```
   cmd.exe /c "set PATH=C:\Program Files\nodejs;C:\Users\ttimo\AppData\Roaming\npm;%PATH% && start \"\" \"C:\Program Files\Android\Android Studio\bin\studio64.exe\""
   ```

### Yöntem 3: Expo Komutu (En Kolay)

Android Studio yerine direkt terminal'de:

```bash
$env:Path = "C:\Program Files\nodejs;C:\Users\ttimo\AppData\Roaming\npm;" + $env:Path
npx expo run:android
```

Bu komut:
- Node.js'i otomatik bulur
- Android Studio'yu açar
- Uygulamayı çalıştırır








