@echo off
echo ========================================
echo   ZeitLog - AAB Olusturma
echo ========================================
echo.

REM Keystore kontrolu
if not exist "android\app\my-release-key.keystore" (
    echo HATA: Keystore bulunamadi!
    echo.
    echo Once keystore olusturmaniz gerekiyor:
    echo 1. create-keystore.bat dosyasini calistirin
    echo 2. android\gradle.properties dosyasinda sifreleri girin
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

echo AAB olusturuluyor...
echo Bu islem bir kac dakika surebilir...
echo.

REM AAB olustur
call gradlew.bat bundleRelease

if errorlevel 1 (
    echo.
    echo HATA: AAB olusturulamadi!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BASARILI!
echo ========================================
echo.
echo AAB dosyasi hazir:
echo android\app\build\outputs\bundle\release\app-release.aab
echo.
echo Bu dosyayi Play Store'a yukleyebilirsiniz.
echo.
pause

