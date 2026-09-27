import { PropertyKind } from '@prisma/client';

type Node = Record<string, any> | undefined | null;

/** Достаёт первое непустое значение по списку путей — CRM называют поля по-разному. */
export function pick(node: Node, ...paths: string[]): any {
  for (const path of paths) {
    let current: any = node;
    for (const segment of path.split('.')) {
      if (current == null) break;
      const key = Object.keys(current).find((k) => k.toLowerCase() === segment.toLowerCase());
      current = key ? current[key] : undefined;
    }
    if (current != null && current !== '') return current;
  }
  return undefined;
}

export function text(value: any): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    if ('#text' in value) return String(value['#text']).trim();
    const first = Object.values(value).find((v) => typeof v === 'string');
    return first ? String(first).trim() : '';
  }
  return String(value).trim();
}

export function num(value: any): number {
  const cleaned = text(value).replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function bool(value: any): boolean {
  const v = text(value).toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'si' || v === 'sí';
}

/** Любой узел XML может прийти объектом или массивом — приводим к массиву. */
export function arr<T = any>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

// Порядок важен: более узкие типы проверяются раньше общих.
const KIND_MAP: [RegExp, PropertyKind][] = [
  [/penthouse|ático|atico|пентхаус/i, 'PENTHOUSE'],
  [/townhouse|adosad|bungalow|таунхаус/i, 'TOWNHOUSE'],
  [/villa|chalet|вилла/i, 'VILLA'],
  [/casa|house|detached|дом/i, 'HOUSE'],
  [/commercial|local|office|nave|коммерч/i, 'COMMERCIAL'],
  [/studio|estudio|студи/i, 'STUDIO'],
  [/apartment|piso|flat|квартир/i, 'FLAT'],
];

export function toKind(value: any): PropertyKind {
  const raw = text(value);
  for (const [re, kind] of KIND_MAP) if (re.test(raw)) return kind;
  return 'FLAT';
}

const SEA_RE = /sea view|vistas al mar|frontline|primera línea|primera linea|zeezicht|meerblick|вид на море/i;

export function detectSeaView(...values: any[]): boolean {
  return values.some((v) => SEA_RE.test(text(v)));
}

/** Заголовок берём из фида, но если CRM его не отдаёт — собираем из типа и города. */
export function fallbackTitle(kind: PropertyKind, city: string, beds: number): string {
  const label: Record<PropertyKind, string> = {
    FLAT: 'Квартира',
    STUDIO: 'Студия',
    PENTHOUSE: 'Пентхаус',
    HOUSE: 'Дом',
    VILLA: 'Вилла',
    TOWNHOUSE: 'Таунхаус',
    COMMERCIAL: 'Коммерческое помещение',
  };
  const bedPart = beds ? `, ${beds} спальни` : '';
  return `${label[kind]}${bedPart}${city ? ` — ${city}` : ''}`;
}
