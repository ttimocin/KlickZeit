const fs = require('fs');
const path = require('path');

const appConfig = require('./app.json');

const rootGoogleServices = path.join(__dirname, 'google-services.json');
const syncTargets = [
  path.join(__dirname, 'android', 'app', 'google-services.json'),
  path.join(__dirname, 'wear', 'app', 'google-services.json'),
];

function syncGoogleServicesFrom(sourcePath) {
  for (const targetPath of syncTargets) {
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) continue;
    fs.copyFileSync(sourcePath, targetPath);
  }
}

if (process.env.GOOGLE_SERVICES_JSON && process.env.GOOGLE_SERVICES_JSON.trim().length > 0) {
  const googleServicesContent = process.env.GOOGLE_SERVICES_JSON.trim();

  try {
    JSON.parse(googleServicesContent);
    fs.writeFileSync(rootGoogleServices, googleServicesContent, 'utf8');
    console.log('✓ google-services.json created at root from GOOGLE_SERVICES_JSON');
    syncGoogleServicesFrom(rootGoogleServices);
    console.log('✓ google-services.json synced to android/app and wear/app');
  } catch (e) {
    console.warn('⚠ GOOGLE_SERVICES_JSON is not valid JSON, using local file instead:', e.message);
    if (fs.existsSync(rootGoogleServices)) {
      console.log('✓ Using local google-services.json file instead');
    }
  }
}

if (!fs.existsSync(rootGoogleServices)) {
  console.error('❌ google-services.json not found at project root');
  console.error('   Copy google-services.json.example → google-services.json and fill from Firebase Console.');
  throw new Error('google-services.json is required for Android build');
}

syncGoogleServicesFrom(rootGoogleServices);
console.log('✓ google-services.json synced from project root');

module.exports = appConfig;
