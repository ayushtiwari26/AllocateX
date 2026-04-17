# AllocateX Mobile App - Capacitor Setup Guide

## Overview

AllocateX has been configured to run as a native Android mobile app using Capacitor. This guide covers the setup, build, and deployment process.

## Prerequisites

- **Node.js** 18+ and npm
- **Android Studio** (Arctic Fox 2020.3.1 or newer)
- **JDK 17** (comes with Android Studio)
- **Android SDK** (API Level 22+ for Android 5.1+)

## Project Structure

```
AllocateX/
├── android/                    # Native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/
│   │   │   └── res/
│   │   └── build.gradle
│   └── gradle/
├── capacitor.config.ts         # Capacitor configuration
├── src/
│   ├── services/
│   │   └── capacitorService.ts # Native feature wrapper
│   └── hooks/
│       └── useCapacitor.ts     # React hooks for native features
└── package.json
```

## Installed Capacitor Plugins

| Plugin | Purpose |
|--------|---------|
| `@capacitor/geolocation` | GPS location for geofenced clock-in/out |
| `@capacitor/preferences` | Persistent key-value storage |
| `@capacitor/push-notifications` | Push notification support |
| `@capacitor/network` | Network connectivity status |

## Quick Start

### 1. Build the Web App
```bash
npm run build
```

### 2. Sync with Android
```bash
npm run cap:sync
# or
npx cap sync android
```

### 3. Open in Android Studio
```bash
npm run android:studio
# or
npx cap open android
```

### 4. Run on Device/Emulator
From Android Studio, click the Run button, or use:
```bash
npm run cap:run:android
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run cap:sync` | Sync web assets with native projects |
| `npm run cap:android` | Open Android project in Android Studio |
| `npm run cap:run:android` | Build and run on connected Android device |
| `npm run cap:build:android` | Full build + sync for Android |
| `npm run android:studio` | Open Android Studio |

## Using Native Features in React

### Geolocation

```tsx
import { useGeolocation } from '@/hooks/useCapacitor';

function MyComponent() {
  const { 
    location, 
    error, 
    loading, 
    permissionStatus,
    requestPermission,
    getCurrentPosition 
  } = useGeolocation();

  const handleGetLocation = async () => {
    if (permissionStatus !== 'granted') {
      await requestPermission();
    }
    const pos = await getCurrentPosition();
    console.log('Location:', pos);
  };

  return (
    <button onClick={handleGetLocation}>
      Get Location
    </button>
  );
}
```

### Network Status

```tsx
import { useNetwork } from '@/hooks/useCapacitor';

function NetworkBanner() {
  const { isOnline, connectionType } = useNetwork();

  if (!isOnline) {
    return <div className="bg-red-500">You are offline</div>;
  }
  return null;
}
```

### Push Notifications

```tsx
import { usePushNotifications } from '@/hooks/useCapacitor';

function NotificationSetup() {
  const { 
    token, 
    isAvailable, 
    register 
  } = usePushNotifications({
    onPushReceived: (notification) => {
      console.log('Received:', notification);
    }
  });

  useEffect(() => {
    if (isAvailable) {
      register();
    }
  }, [isAvailable]);

  return <div>Token: {token}</div>;
}
```

### Persistent Storage

```tsx
import { usePreferences } from '@/hooks/useCapacitor';

function SettingsComponent() {
  const { 
    value: theme, 
    setValue: setTheme, 
    loading 
  } = usePreferences('theme', 'light');

  if (loading) return <div>Loading...</div>;

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

## Android Permissions

The following permissions are configured in `AndroidManifest.xml`:

- **INTERNET** - API communication
- **ACCESS_FINE_LOCATION** - High accuracy GPS
- **ACCESS_COARSE_LOCATION** - Network-based location
- **ACCESS_NETWORK_STATE** - Network connectivity
- **POST_NOTIFICATIONS** - Push notifications (Android 13+)
- **VIBRATE** - Notification vibration

## Building a Release APK

### 1. Generate Signing Key

```bash
cd android
keytool -genkey -v -keystore allocatex-release.keystore -alias allocatex -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing in Gradle

Create `android/keystore.properties`:
```properties
storeFile=allocatex-release.keystore
storePassword=your_store_password
keyAlias=allocatex
keyPassword=your_key_password
```

### 3. Update `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            def keystoreProperties = new Properties()
            keystoreProperties.load(new FileInputStream(rootProject.file("keystore.properties")))
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4. Build Release APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Customization

### App Icon

Replace files in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

Use Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/

### Splash Screen

Configure in `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#4f46e5',
    showSpinner: true,
    spinnerColor: '#ffffff'
  }
}
```

### App Colors

Update `android/app/src/main/res/values/styles.xml`:
```xml
<style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
    <item name="colorPrimary">#4f46e5</item>
    <item name="colorPrimaryDark">#4338ca</item>
    <item name="colorAccent">#818cf8</item>
</style>
```

## Troubleshooting

### Build Errors

1. **Gradle sync failed**: Run `./gradlew clean` in the android folder
2. **SDK not found**: Ensure ANDROID_HOME is set correctly
3. **Java version mismatch**: Use JDK 17

### Plugin Issues

1. **Geolocation not working**: Check location permissions in device settings
2. **Push notifications not received**: Ensure you've called `register()` after permissions

### Live Reload During Development

```bash
npm run dev
# In another terminal:
npx cap run android --livereload --external
```

## Production Checklist

- [ ] Update app version in `android/app/build.gradle`
- [ ] Generate release signing key
- [ ] Configure ProGuard rules
- [ ] Test on multiple device sizes
- [ ] Test geofence accuracy
- [ ] Test offline functionality
- [ ] Add proper error handling
- [ ] Configure Firebase for push notifications
- [ ] Submit to Google Play Store

## Support

For Capacitor-specific issues: https://capacitorjs.com/docs
For project issues: Create an issue in the repository
