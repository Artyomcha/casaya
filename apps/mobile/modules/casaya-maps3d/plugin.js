const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Ключ Maps 3D SDK Android читает из манифеста, и под собственным именем:
 * com.google.android.geo.maps3d.API_KEY, а не com.google.android.geo.API_KEY
 * обычной карты. Поэтому штатная настройка android.config.googleMaps
 * сюда не подходит — нужен свой плагин.
 */
const KEY_NAME = 'com.google.android.geo.maps3d.API_KEY';

module.exports = function withCasayaMaps3d(config, { apiKey } = {}) {
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;

    application['meta-data'] = (application['meta-data'] ?? []).filter(
      (item) => item.$['android:name'] !== KEY_NAME,
    );
    application['meta-data'].push({
      $: { 'android:name': KEY_NAME, 'android:value': apiKey ?? '' },
    });
    return cfg;
  });
};
