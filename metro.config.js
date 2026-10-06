// Metro ayarı: expo-sqlite'ın web sürümü wasm dosyası ve SharedArrayBuffer ister.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// Web önizlemesinde SharedArrayBuffer için cross-origin izolasyon başlıkları.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
