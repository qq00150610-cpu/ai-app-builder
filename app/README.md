# React Native Android Build Tools

## Directory Structure
```
android/
├── app/
│   ├── build.gradle          # App module build config
│   ├── proguard-rules.pro    # ProGuard rules
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/aiappbuilder/
│       │   ├── MainApplication.kt
│       │   └── MainActivity.kt
│       └── res/
│           ├── values/
│           │   ├── strings.xml
│           │   └── styles.xml
│           └── drawable/
│               └── rn_edit_text_material.xml
├── gradle/wrapper/
│   └── gradle-wrapper.properties
├── build.gradle              # Root project build config
├── gradle.properties         # Gradle properties
└── settings.gradle           # Project settings
```

## Build Commands

### Debug APK
```bash
./gradlew assembleDebug
```

### Release APK (Signed)
```bash
./gradlew assembleRelease
```

## APK Output Location
- Debug: `app/build/outputs/apk/debug/app-debug.apk`
- Release: `app/build/outputs/apk/release/app-release.apk`
