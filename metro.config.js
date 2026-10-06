// Metro ayarı: expo-sqlite'ın web sürümü wasm dosyası yükler.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

module.exports = config;
