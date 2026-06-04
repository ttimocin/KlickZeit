@echo off
echo ========================================
echo   KlickZeit - Release APK
echo ========================================
echo.

if not exist "android\key.properties" (
    echo HATA: android\key.properties bulunamadi!
    echo Masaustunden kopyalayin: key.properties
    pause
    exit /b 1
)

if not exist "android\app\upload-keystore.jks" (
    echo HATA: android\app\upload-keystore.jks bulunamadi!
    echo Masaustunden kopyalayin: upload-keystore.jks
    pause
    exit /b 1
)

echo Play Store imza dosyalari bulundu.
echo.
cd android

echo Release APK olusturuluyor...
call gradlew.bat assembleRelease "-PreactNativeArchitectures=arm64-v8a,armeabi-v7a"

if errorlevel 1 (
    echo.
    echo HATA: APK olusturulamadi!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BASARILI
echo ========================================
echo.
echo APK: android\app\build\outputs\apk\release\app-release.apk
echo.
pause
