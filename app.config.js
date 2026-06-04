const fs = require('fs');
const path = require('path');

// app.json'u oku
const appConfig = require('./app.json');

// EAS build sırasında GOOGLE_SERVICES_JSON environment variable'ından dosyayı oluştur
const localGoogleServices = path.join(__dirname, 'google-services.json');

if (process.env.GOOGLE_SERVICES_JSON && process.env.GOOGLE_SERVICES_JSON.trim().length > 0) {
  const googleServicesContent = process.env.GOOGLE_SERVICES_JSON.trim();
  
  // JSON içeriğini doğrula (sadece uyarı ver, hata fırlatma)
  try {
    JSON.parse(googleServicesContent);
    
    // Root dizinde oluştur (app.json için)
    const googleServicesPath = path.join(__dirname, 'google-services.json');
    fs.writeFileSync(googleServicesPath, googleServicesContent, 'utf8');
    console.log('✓ google-services.json created at root from environment variable');
    
    // android/app klasörü varsa orada da oluştur (expo prebuild sonrası için)
    const androidAppPath = path.join(__dirname, 'android', 'app', 'google-services.json');
    const androidAppDir = path.dirname(androidAppPath);
    if (fs.existsSync(androidAppDir)) {
      fs.writeFileSync(androidAppPath, googleServicesContent, 'utf8');
      console.log('✓ google-services.json created at android/app/ from environment variable');
    }
  } catch (e) {
    console.warn('⚠ GOOGLE_SERVICES_JSON is not valid JSON, using local file instead:', e.message);
    // Environment variable geçersizse local dosyayı kullan
    if (fs.existsSync(localGoogleServices)) {
      console.log('✓ Using local google-services.json file instead');
    }
  }
}

// Eğer environment variable yoksa veya geçersizse, local dosyayı kullan
if (!fs.existsSync(localGoogleServices)) {
  console.error('❌ google-services.json not found');
  throw new Error('google-services.json is required for Android build');
}

// android/app klasörü varsa local dosyayı oraya kopyala
const androidAppPath = path.join(__dirname, 'android', 'app', 'google-services.json');
const androidAppDir = path.dirname(androidAppPath);
if (fs.existsSync(androidAppDir) && fs.existsSync(localGoogleServices)) {
  if (!fs.existsSync(androidAppPath)) {
    fs.copyFileSync(localGoogleServices, androidAppPath);
    console.log('✓ google-services.json copied to android/app/');
  }
}

module.exports = appConfig;

