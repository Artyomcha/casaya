/**
 * Подложка — OpenFreeMap Positron: тот же почти монохромный светлый вид,
 * что был у CARTO, но в векторных тайлах есть высоты домов (render_height),
 * а значит карту можно наклонить и показать город объёмом, без ключей и оплаты.
 */
export const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** Коста-дель-Соль целиком — начальный вид, если объектов на карте нет. */
export const COSTA_DEL_SOL: { center: [number, number]; zoom: number } = {
  center: [-4.95, 36.5],
  zoom: 10.2,
};

/** Камера: выдача смотрит почти сверху, карточка объекта — с высоты человека. */
export const CAMERA = {
  search: { pitch: 38, bearing: -14, maxZoom: 12.5 },
  single: { pitch: 58, bearing: -22, zoom: 17.4 },
} as const;

/** Копируется из node_modules скриптом scripts/copy-maplibre-worker.mjs. */
export const WORKER_URL = '/vendor/maplibre/maplibre-gl-worker.mjs';

/** Рельеф Коста-дель-Соль — открытые тайлы AWS Terrain, кодировка terrarium. */
export const TERRAIN_SOURCE = 'casaya-terrain';
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

export const FOOTPRINT_SOURCE = 'casaya-footprint';

export const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · ' +
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · ' +
  '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">Terrain Tiles</a>';

export const FOOTPRINT_ATTRIBUTION =
  '<a href="https://www.catastro.hacienda.gob.es" target="_blank" rel="noreferrer">Catastro</a>';

const PURPLE = '#6D3BF5';

/**
 * Дома вытягиваются по высоте из OSM. Цвет чуть темнеет с высотой —
 * иначе на светлой подложке объём не читается и всё сливается в кашу.
 */
export const buildingLayer = {
  id: 'casaya-buildings-3d',
  type: 'fill-extrusion' as const,
  source: 'openmaptiles',
  'source-layer': 'building',
  minzoom: 13,
  // hide_3d помечает части зданий, которые нельзя вытягивать: получатся башни-дубли.
  filter: ['!=', ['get', 'hide_3d'], true] as unknown as never,
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
};

/** Тот самый дом — фиолетовым, поверх серой застройки. */
export const footprintLayer = {
  id: 'casaya-footprint-3d',
  type: 'fill-extrusion' as const,
  source: FOOTPRINT_SOURCE,
  paint: {
    'fill-extrusion-color': PURPLE,
    'fill-extrusion-opacity': 0.9,
    'fill-extrusion-height': ['number', ['get', 'height'], 12],
    'fill-extrusion-base': 0,
    'fill-extrusion-vertical-gradient': true,
  },
};

/** Светлый контур по земле — дом виден даже когда камера смотрит вдоль стены. */
export const footprintOutlineLayer = {
  id: 'casaya-footprint-outline',
  type: 'line' as const,
  source: FOOTPRINT_SOURCE,
  paint: {
    'line-color': PURPLE,
    'line-width': 2.5,
    'line-blur': 1.5,
    'line-opacity': 0.75,
  },
};

export const terrainSource = {
  type: 'raster-dem' as const,
  tiles: [TERRAIN_TILES],
  encoding: 'terrarium' as const,
  tileSize: 256,
  maxzoom: 14,
  attribution: 'Terrain Tiles',
};

/** Небо и дымка: без них наклонённая карта обрывается в пустоту у горизонта. */
export const SKY = {
  'sky-color': '#BFD8F5',
  'sky-horizon-blend': 0.6,
  'horizon-color': '#EDE9F6',
  'horizon-fog-blend': 0.5,
  'fog-color': '#F6F4FB',
  'fog-ground-blend': 0.7,
};
