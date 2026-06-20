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

function readPlistString(plistContent, key) {
  const match = plistContent.match(
    new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`)
  );
  return match ? match[1] : undefined;
}

function getFirebaseExtraFromGoogleServices() {
  if (!fs.existsSync(rootGoogleServices)) return {};
  try {
    const gs = JSON.parse(fs.readFileSync(rootGoogleServices, 'utf8'));
    const client =
      gs.client?.find(
        (c) => c.client_info?.android_client_info?.package_name === 'com.taytek.zeitlog'
      ) ?? gs.client?.[0];
    if (!client?.api_key?.[0]?.current_key) return {};
    return {
      apiKey: client.api_key[0].current_key,
      authDomain: `${gs.project_info.project_id}.firebaseapp.com`,
      projectId: gs.project_info.project_id,
      storageBucket: gs.project_info.storage_bucket,
      messagingSenderId: String(gs.project_info.project_number),
      appId: client.client_info.mobilesdk_app_id,
    };
  } catch (e) {
    console.warn('⚠ Could not read firebase config from google-services.json:', e.message);
    return {};
  }
}

function getFirebaseExtraFromGoogleServicesInfo() {
  if (!fs.existsSync(rootGoogleServicesInfo)) return {};
  try {
    const plist = fs.readFileSync(rootGoogleServicesInfo, 'utf8');
    const apiKey = readPlistString(plist, 'API_KEY');
    const projectId = readPlistString(plist, 'PROJECT_ID');
    const storageBucket = readPlistString(plist, 'STORAGE_BUCKET');
    const messagingSenderId = readPlistString(plist, 'GCM_SENDER_ID');
    const appId = readPlistString(plist, 'GOOGLE_APP_ID');
    const iosClientId = readPlistString(plist, 'CLIENT_ID');

    if (!apiKey || !projectId || !appId) return {};

    return {
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      iosClientId,
    };
  } catch (e) {
    console.warn('⚠ Could not read firebase config from GoogleService-Info.plist:', e.message);
    return {};
  }
}

function getFirebaseExtra() {
  const fromAndroid = getFirebaseExtraFromGoogleServices();
  if (fromAndroid.apiKey) return fromAndroid;
  return getFirebaseExtraFromGoogleServicesInfo();
}

module.exports = {
  ...appConfig,
  expo: {
    ...appConfig.expo,
    extra: {
      ...appConfig.expo.extra,
      firebase: getFirebaseExtra(),
    },
  },
};
