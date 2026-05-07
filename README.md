# SpankApp — React Native

Tap your phone. It yells back.

Ported from [taigrr/spank](https://github.com/taigrr/spank) — the original macOS Apple Silicon version.

## Features

- 4 preset sound modes: **Pain**, **Sexy** (60 escalating levels), **Halo**, **Lizard**
- **Custom sounds** — add your own MP3 files
- Adjustable **sensitivity** (0.05g–0.50g threshold)
- Adjustable **cooldown period** (200ms–2000ms)
- Runs in the **background** even when screen is locked
- iOS 14+ and Android 14+

## Audio files

All audio is sourced directly from the original taigrr/spank repository:

```
src/assets/sounds/
  pain/     00_Ow.mp3 ... 09_That_stings.mp3   (10 files)
  halo/     00.mp3 ... 08.mp3                  (9 files)
  sexy/     00.mp3 ... 59.mp3                  (60 files)
  lizard/   00.mp3                             (1 file)
```

## Setup

### 1. Install dependencies

```bash
cd SpankApp
npm install
```

### 2. iOS setup

```bash
cd ios && pod install && cd ..
```

Add to `ios/SpankApp/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>fetch</string>
  <string>processing</string>
</array>
<key>NSMotionUsageDescription</key>
<string>Spank uses the accelerometer to detect when you tap your phone.</string>
```

### 3. Android setup

Merge `android_manifest_additions.xml` into `android/app/src/main/AndroidManifest.xml`.

Key permissions added:
- `FOREGROUND_SERVICE` — background execution
- `WAKE_LOCK` — keep CPU active while listening
- `READ_MEDIA_AUDIO` — custom MP3 file access (Android 13+)

### 4. Link react-native-vector-icons (if needed)

```bash
npx react-native link react-native-vector-icons
```

### 5. Run

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## How it works

### Detection algorithm (ported from spank)

1. Reads accelerometer at ~60 Hz via `react-native-sensors`
2. Maintains a 20-sample rolling baseline of magnitude
3. Detects spikes as deviation from baseline > threshold
4. Applies configurable cooldown between responses

```
threshold = 0.50 - sensitivity * 0.45   (maps slider 0→1 to 0.50g→0.05g)
```

### Sexy/Lizard escalation (ported from slapTracker in main.go)

```
score += 1.0 on each hit
score *= 0.5 ^ (elapsed_seconds / 30)   (half-life decay)
index = floor(N * (1 - exp(-(score-1) / scale)))
```

This gives 60 escalation levels that intensify with sustained tapping
and naturally decay back down during inactivity — exactly as in the original.

### Background execution

- **Android**: Foreground Service via `react-native-background-actions`
  — shows a persistent notification while running
- **iOS**: Background audio mode — plays silent audio to stay alive
  (required by iOS audio session rules)

## Project structure

```
SpankApp/
  App.js                          Navigation root
  src/
    screens/
      HomeScreen.js               Mode select + sliders
      ActiveScreen.js             Live listener + stop
      CustomSoundsScreen.js       Custom MP3 manager
    hooks/
      useAccelerometer.js         Tap detection hook
    services/
      AudioManager.js             Sound playback + escalation
      BackgroundService.js        Background task wrapper
    utils/
      sounds.js                   Audio file manifest
    assets/
      sounds/                     MP3 files from taigrr/spank
        pain/
        halo/
        sexy/
        lizard/
```

## Credits

Audio files and escalation logic from [taigrr/spank](https://github.com/taigrr/spank) (MIT License).
