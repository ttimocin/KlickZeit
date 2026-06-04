# Play Store imza dosyaları

| Dosya | Konum | Açıklama |
|-------|--------|----------|
| `upload-keystore.jks` | `android/app/` | Release APK/AAB imzalama (gizli — Git'e eklenmez) |
| `key.properties` | `android/` | Keystore şifreleri ve alias (gizli — Git'e eklenmez) |
| `upload_certificate.pem` | `android/signing/` | Play Console yükleme sertifikası (yedek / referans) |

Yerel kopya: Masaüstü `upload-keystore.jks`, `key.properties`, `upload_certificate.pem`

APK: `cd android` → `gradlew.bat assembleRelease`
