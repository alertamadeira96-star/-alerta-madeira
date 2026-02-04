#!/usr/bin/env node
/**
 * Patches @expo/metro with missing re-export files.
 * Required for Metro config to load on Windows with certain dependency setups.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXPO_METRO = path.join(ROOT, "node_modules", "@expo", "metro", "metro");

const PATCHES = [
  ["Bundler/util.js", 'require("metro/private/Bundler/util")'],
  ["Assets.js", 'require("metro/private/Assets")'],
  ["DeltaBundler/Serializers/helpers/js.js", 'require("metro/private/DeltaBundler/Serializers/helpers/js")'],
  ["DeltaBundler/Graph.js", 'require("metro/private/DeltaBundler/Graph")'],
];

for (const [relPath, requirePath] of PATCHES) {
  const fullPath = path.join(EXPO_METRO, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const content = `"use strict";\nmodule.exports = ${requirePath};\n`;
  fs.writeFileSync(fullPath, content);
}
console.log("Patched @expo/metro");
