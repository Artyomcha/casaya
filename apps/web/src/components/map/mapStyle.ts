/**
 * Базовая подложка — CARTO Positron: светлая, почти монохромная.
 * Выбрана намеренно: карта не спорит с фиолетовыми пинами и карточками,
 * читается как фон, а не как отдельная картинка. Ключ не нужен.
 */
export const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

/** Коста-Бланка целиком — начальный вид, если объектов на карте нет. */
export const COSTA_BLANCA: { center: [number, number]; zoom: number } = {
  center: [-0.4, 38.4],
  zoom: 8.4,
};

/** Копируется из node_modules скриптом scripts/copy-maplibre-worker.mjs. */
export const WORKER_URL = '/vendor/maplibre/maplibre-gl-worker.mjs';

export const ATTRIBUTION =
  '<a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> · ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';
