import type { FillExtrusionLayerSpecification } from '@maplibre/maplibre-react-native';

/**
 * Та же подложка, что у портала: OpenFreeMap Positron. Светлая и почти
 * монохромная, карта работает фоном — но в её векторных тайлах есть высоты
 * домов, поэтому вид наклоняется и город читается объёмом. Ключ не нужен.
 */
export const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export const ATTRIBUTION = '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap';

/** Коста-Бланка целиком — вид, пока объекты не загрузились. */
export const COSTA_BLANCA = {
  center: [-0.4, 38.4] as [number, number],
  zoom: 7.6,
};

/** Выдача смотрит почти сверху, карточка объекта — с высоты крыш. */
export const CAMERA = {
  search: { pitch: 40, bearing: -14 },
  single: { pitch: 58, bearing: -22, zoom: 16.8 },
};

/**
 * Объём домов из OpenStreetMap. Цвет чуть темнеет с высотой — на светлой
 * подложке иначе не видно, где дом кончается и начинается соседний.
 *
 * hide_3d помечает части зданий, которые вытягивать нельзя: получатся
 * башни-дубли поверх настоящих.
 */
export const BUILDINGS_3D = {
  id: 'casaya-buildings-3d',
  type: 'fill-extrusion',
  source: 'openmaptiles',
  'source-layer': 'building',
  minzoom: 13,
  filter: ['!=', ['get', 'hide_3d'], true],
  paint: {
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['number', ['get', 'render_height'], 8],
      0, '#EAE6F4',
      12, '#DFD9EE',
      35, '#D2CBE5',
      80, '#C3BBDB',
    ],
    // Ниже z14 объём только мешает: домов много, высоты неточные.
    'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.6, 0.94],
    'fill-extrusion-height': ['number', ['get', 'render_height'], 8],
    'fill-extrusion-base': ['number', ['get', 'render_min_height'], 0],
    'fill-extrusion-vertical-gradient': true,
  },
} satisfies FillExtrusionLayerSpecification;
