# How to Run the Rork App

## Quick Start

### Option 1: Run in Browser (Easiest)

```bash
bun run web
```

Shows the app at `http://localhost:8081` (or similar).

### Option 2: Run on Your Phone with Expo Go

1. **Install Expo Go** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the dev server** (choose one):

   | Command | What you get |
   |---------|--------------|
   | `bun run start` | QR code + **tunnel URL** (works when phone not on same Wi‑Fi) |
   | `bun run phone` | QR code + **localhost** (phone must be on same Wi‑Fi as PC) |
   | `bun run expo:tunnel` | QR code + tunnel (plain Expo, no Rork) |
   | `bun run expo` | QR code + localhost (plain Expo) |

3. **Scan the QR code** with Expo Go.

### Option 3: Run in Simulator

```bash
bun run start
# Then press 'i' for iOS Simulator or 'a' for Android Emulator
```

## Prerequisites

- **Bun**: https://bun.sh/docs/installation
  ```bash
  # Windows
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```

## If the app doesn’t load (clean install)

Run a fresh install with Bun:

```bash
# 1. Remove dependencies
Remove-Item -Recurse -Force node_modules

# 2. Clear caches
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# 3. Reinstall
bun install

# 4. Start with cleared cache
bun run expo:clear
```

Then scan the QR code with Expo Go again.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "bun: command not found" | Install Bun (see above) |
| "could not be loaded with Node.js" | Run clean install above; Metro will fall back to plain config if needed |
| App not loading in Expo Go | Use `bun run start` (tunnel) if phone is on different Wi‑Fi |
| Something went wrong / blank screen | Run `bun run expo:clear` to reset Metro cache |
