// `npx cap add android` এর পর একবার চালাতে হয়: node scripts/android-patch.mjs
// মাইকের অনুমতি, কথা চেনার সেবা, ফোন-সময় সীমার প্লাগইন (AppLock) আর অ্যাপের নাম ঠিক করে। আবার চালালেও ক্ষতি নেই।
import fs from 'node:fs';
import path from 'node:path';

const manifest = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(manifest)) {
  console.error('android ফোল্ডার নেই। আগে চালাও: npx cap add android');
  process.exit(1);
}
let x = fs.readFileSync(manifest, 'utf8');

if (!x.includes('xmlns:tools')) {
  x = x.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android"', '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools"');
}
const perms = [
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
  '<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />',
  '<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />'
];
for (const p of perms) {
  const name = p.match(/android:name="([^"]+)"/)[1];
  if (!x.includes(name)) x = x.replace('</manifest>', `    ${p}\n</manifest>`);
}
if (!x.includes('android.speech.RecognitionService')) {
  x = x.replace('</manifest>', '    <queries>\n        <intent><action android:name="android.speech.RecognitionService" /></intent>\n        <intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>\n    </queries>\n</manifest>');
}
if (!x.includes('.GuardService')) {
  x = x.replace('</application>', `        <service android:name=".GuardService" android:exported="false" android:foregroundServiceType="specialUse">
            <property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="parental_screen_time_guard" />
        </service>
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter>
        </receiver>
    </application>`);
}
if (!x.includes('android:screenOrientation')) {
  x = x.replace('<activity', '<activity\n            android:screenOrientation="portrait"');
}
fs.writeFileSync(manifest, x);

// জাভা ফাইল কপি (MainActivity সহ)
const dest = 'android/app/src/main/java/com/shikhon/jatra';
fs.mkdirSync(dest, { recursive: true });
for (const f of fs.readdirSync('native/android')) {
  if (f.endsWith('.java')) fs.copyFileSync(path.join('native/android', f), path.join(dest, f));
}

const strings = 'android/app/src/main/res/values/strings.xml';
if (fs.existsSync(strings)) {
  let s = fs.readFileSync(strings, 'utf8');
  s = s.replace(/<string name="app_name">.*?<\/string>/, '<string name="app_name">শিখন যাত্রা</string>')
       .replace(/<string name="title_activity_main">.*?<\/string>/, '<string name="title_activity_main">শিখন যাত্রা</string>');
  fs.writeFileSync(strings, s);
}
console.log('Android প্যাচ হয়েছে ✓ (মাইক, ফোন-সময় সীমা, নাম)');
