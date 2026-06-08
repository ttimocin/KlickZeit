const fs = require('fs');
const path = require('path');

const appConfig = require('./app.json');

const rootGoogleServices = path.join(__dirname, 'google-services.json');
const rootGoogleServicesInfo = path.join(__dirname, 'GoogleService-Info.plist');
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

if (process.env.GOOGLE_SERVICES_INFO_PLIST && process.env.GOOGLE_SERVICES_INFO_PLIST.trim().length > 0) {
  const plistContent = process.env.GOOGLE_SERVICES_INFO_PLIST.trim();

  try {
    fs.writeFileSync(rootGoogleServicesInfo, plistContent, 'utf8');
    console.log('✓ GoogleService-Info.plist created at root from GOOGLE_SERVICES_INFO_PLIST');
  } catch (e) {
    console.warn('⚠ GOOGLE_SERVICES_INFO_PLIST could not be written:', e.message);
  }
}

if (!fs.existsSync(rootGoogleServices)) {
  console.warn('⚠ google-services.json not found — Android builds require this file');
} else {
  syncGoogleServicesFrom(rootGoogleServices);
  console.log('✓ google-services.json synced from project root');
}

if (!fs.existsSync(rootGoogleServicesInfo)) {
  console.warn('⚠ GoogleService-Info.plist not found — iOS builds require this file');
} else {
  console.log('✓ GoogleService-Info.plist found at project root');
}

module.exports = appConfig;
