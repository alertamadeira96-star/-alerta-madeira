# Build Android APK with EAS Build

## What was configured

- **eas.json** – `preview` profile now builds an **APK** (installable on device without Play Store).
- **.easignore** – Excludes `bun.lock` so EAS Build uses **npm** in the cloud (Bun is not available there).

## Prerequisites

1. **Expo account** – Sign up at [expo.dev](https://expo.dev) if needed.
2. **EAS CLI** – Install and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```

## Build the APK

From the project root:

```bash
eas build --platform android --profile preview
```

- First time: EAS may ask for Android keystore; choose **Generate new keystore**.
- Build runs in the cloud (about 10–20 minutes).
- When it finishes, you get a **link to download the APK**.

## Install on your phone

1. Download the APK from the link in the build page or email.
2. On your Android device: allow **Install from unknown sources** for your browser or Files app.
3. Open the APK and install.

## Optional: use npm locally before building

If you prefer a reproducible build, create a lockfile EAS can use:

```bash
npm install --legacy-peer-deps
```

Then commit `package-lock.json`. With `.easignore` excluding `bun.lock`, EAS will use `package-lock.json` and npm.
