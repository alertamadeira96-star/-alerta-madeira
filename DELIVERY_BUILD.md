# Delivery build – crash fix (today)

## What to deliver first & what to tell the buyer

**Deliver first:** The new Android APK (from `eas build --platform android --profile preview`). Share the download link from the EAS build page.

**Message you can send the buyer (copy and adjust if you like):**

> The Alerta Madeira app is ready for testing. The core features are implemented: authentication, occurrences, Op. Stop, anomalies, lost pets, push notifications (Supabase + Expo), admin panel, and profile. We’ve fixed a build/config issue that was causing the app to crash on open. Please find the Android APK attached [or: download link below]. Install it on your device and test the flows. If you notice anything that doesn’t match the spec or any bugs, send a list and we’ll address them. We’re treating this as the first delivery for review; any small fixes after your testing can follow quickly.

**If they ask “is it done?”:** You can say the project is **functionally complete** and this is the **first deliverable** for their testing. You’re delivering the working APK now; any final tweaks from their feedback will be handled right after.

---

## What was changed

To get a **stable APK that opens** for delivery:

1. **Removed `@rork-ai/toolkit-sdk`** – Not used by your app code; only by dev scripts. Removed so the build no longer depends on it.
2. **Removed `react-native-worklets`** – Required New Architecture and was tied to the crash. Your app does not use it directly.
3. **Set `newArchEnabled: false`** – Avoids the "undefined is not a function" router crash in production.
4. **Scripts** – `start` / `phone` / `web` now use `npx expo start` instead of `npx rork start`. Behaviour is the same for local dev.

Your app (Supabase, auth, posts, push, admin, etc.) is unchanged.

## Build the APK

```powershell
# Install deps (use one)
bun install
# or
npm install --legacy-peer-deps

# Build
eas build --platform android --profile preview
```

Install the new APK from the build link. It should open without crashing.

## After delivery

You can re-add Rork SDK and worklets later and switch back to New Architecture once Expo fixes the production crash, if you need Rork-specific features.
