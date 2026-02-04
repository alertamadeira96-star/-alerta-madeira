# Metro "could not be loaded with Node.js" Fix

## Root cause

The `@expo/metro` package is missing several re-export files (e.g. `metro/Bundler/util.js`, `metro/Assets.js`) that Metro config needs. This project includes a **postinstall patch** that creates them automatically.

## Fix (automatic)

The `postinstall` script runs after `bun install` and patches `@expo/metro`. Just run:

```powershell
bun run start
# or
bun run expo
```

## If you still see the error

Run the patch manually, then start:

```powershell
node scripts/patch-expo-metro.js
bun run start
```

## After a clean reinstall

```powershell
bun install   # postinstall patches @expo/metro automatically
bun run start
```
