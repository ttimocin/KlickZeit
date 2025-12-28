@echo off
echo ========================================
echo   ZeitLog - APK Olusturma
echo ========================================
echo.

REM Keystore kontrolu
if not exist "android\app\my-release-key.keystore" (
    echo HATA: Keystore bulunamadi!
    echo.
    echo Once keystore olusturmaniz gerekiyor:
    echo keytool -genkeypair -v -storetype PKCS12 -keystore android\app\my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
    echo.
    pause
    exit /b 1
)

echo Keystore bulundu.
echo.

REM gradle.properties kontrolu
findstr /C:"MYAPP_RELEASE_STORE_PASSWORD" android\gradle.properties >nul
if errorlevel 1 (
    echo HATA: gradle.properties'de keystore ayarlari bulunamadi!
    echo android\gradle.properties dosyasini kontrol edin.
    pause
    exit /b 1
)

findstr /C:"your-keystore-password-here" android\gradle.properties >nul
if not errorlevel 1 (
    echo UYARI: gradle.properties'de hala varsayilan sifreler var!
    echo Lutfen android\gradle.properties dosyasinda sifreleri degistirin.
    pause
    exit /b 1
)

echo Keystore ayarlari tamam.
echo.

REM Android klasorune git
cd android

echo APK olusturuluyor...
echo Bu islem bir kac dakika surebilir...
echo.

REM APK olustur
call gradlew.bat assembleRelease

if errorlevel 1 (
    echo.
    echo HATA: APK olusturulamadi!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BASARILI!
echo ========================================
echo.
echo APK dosyasi hazir:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo Bu dosyayi test icin kullanabilirsiniz.
echo.
pause

