/**
 * Та же векторная подложка, что у портала: CARTO Positron.
 * Светлая, почти монохромная — карта работает фоном и не спорит с пинами.
 * Ключ API не нужен.
 */
export const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export const ATTRIBUTION = '© CARTO · © OpenStreetMap';

/** Коста-Бланка целиком — вид, пока объекты не загрузились. */
export const COSTA_BLANCA = {
  center: [-0.4, 38.4] as [number, number],
  zoom: 7.6,
};
