/**
 * Ключ Google живёт в .env, а app.json переменные окружения не читает.
 * Поэтому конфиг собирается здесь: берём app.json как есть и дописываем
 * плагин, который кладёт ключ в манифест Android.
 */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['./modules/casaya-maps3d/plugin', { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '' }],
  ],
});
