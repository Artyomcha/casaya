/**
 * Метка для 3D-карты Google. Стандартная красная капля — чужая: на фоне
 * фотореалистичной съёмки нужна та же ценовая «таблетка», что на векторной
 * карте, иначе два режима карты выглядят как два разных продукта.
 *
 * Рисуем SVG, а не вёрстку: Marker3DElement принимает графику внутри
 * <template>, и свой элемент даёт полный контроль над формой и тенью.
 */

const PURPLE = '#6D3BF5';
const PURPLE_DARK = '#4B21C6';
const INK = '#17112B';
const HAIRLINE = '#EFECF4';
const TERRACOTTA = '#FF5A3C';

const PILL_HEIGHT = 34;
const TIP_HEIGHT = 9;
const TIP_WIDTH = 14;
/**
 * Обводка только у избранного — терракотой, как сердце на карточке.
 * У обычной метки её нет: белая таблетка с тенью читается на любой съёмке,
 * а цветное кольцо на каждом объекте превращает карту в гирлянду.
 */
/** Кружок-якорь на земле: по нему видно, к какой точке относится цена. */
const ANCHOR_RADIUS = 4.5;
const ANCHOR_GAP = 5;

const PAD_X = 12;
const DOT_SIZE = 8;
const DOT_GAP = 7;
const FONT_SIZE = 14;
/** Цифры узкие и одинаковые по ширине, поэтому оценка по символам точна. */
const CHAR_WIDTH = 8.1;

/**
 * Только конкретные гарнитуры: графику метки Google рисует в своём контексте,
 * CSS-переменная шрифта портала туда не доходит, и подпись уезжает в засечки.
 */
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  );

export interface PinGraphicOptions {
  label: string;
  /** Объект в избранном — обводка терракотой, как сердце на карточке. */
  favorite?: boolean;
}

/**
 * Возвращает готовый <svg> для вставки в <template> метки.
 * Ширина считается по длине подписи: «1,25 М €» и «199 000 €» не должны
 * обрезаться или болтаться в пустой таблетке.
 */
export function pinGraphic({ label, favorite = false }: PinGraphicOptions): SVGSVGElement {
  const textWidth = Math.ceil(label.length * CHAR_WIDTH);
  const width = PAD_X * 2 + DOT_SIZE + DOT_GAP + textWidth;
  const height = PILL_HEIGHT + TIP_HEIGHT + ANCHOR_GAP + ANCHOR_RADIUS * 2;
  const cx = width / 2;
  const tipTop = PILL_HEIGHT;
  const anchorY = height - ANCHOR_RADIUS;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="casaya-pin-shadow" x="-40%" y="-40%" width="180%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="${INK}" flood-opacity="0.42"/>
    </filter>
  </defs>
  <g filter="url(#casaya-pin-shadow)">
    <path d="M ${cx - TIP_WIDTH / 2} ${tipTop} L ${cx} ${tipTop + TIP_HEIGHT} L ${cx + TIP_WIDTH / 2} ${tipTop} Z" fill="#FFFFFF"/>
    <rect x="0.75" y="0.75" width="${width - 1.5}" height="${PILL_HEIGHT - 1.5}" rx="11"
          fill="#FFFFFF" stroke="${favorite ? TERRACOTTA : HAIRLINE}" stroke-width="${favorite ? 2 : 1}"/>
  </g>
  <circle cx="${PAD_X + DOT_SIZE / 2}" cy="${PILL_HEIGHT / 2}" r="${DOT_SIZE / 2}" fill="${PURPLE}"/>
  <text x="${PAD_X + DOT_SIZE + DOT_GAP}" y="${PILL_HEIGHT / 2}" dominant-baseline="central"
        font-family="${FONT_STACK}" font-size="${FONT_SIZE}" font-weight="700"
        letter-spacing="-0.2" fill="${INK}">${escapeXml(label)}</text>
  <circle cx="${cx}" cy="${anchorY}" r="${ANCHOR_RADIUS}" fill="${PURPLE}" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="${cx}" y1="${tipTop + TIP_HEIGHT}" x2="${cx}" y2="${anchorY - ANCHOR_RADIUS}"
        stroke="${PURPLE_DARK}" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
</svg>`.trim();

  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  return parsed.documentElement as unknown as SVGSVGElement;
}
