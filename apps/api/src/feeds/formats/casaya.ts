import { NormalizedListing } from '../normalized';
import { arr, bool, fallbackTitle, num, pick, text, toKind } from './helpers';

/**
 * Собственная схема Casaya — для агентств без CRM и для ручной выгрузки.
 * Документирована в docs/feeds.md.
 */
export function parseCasaya(doc: any): NormalizedListing[] {
  const root = pick(doc, 'casaya', 'listings', 'root') ?? doc;
  return arr(pick(root, 'listing', 'item')).map((p: any) => {
    const kind = toKind(pick(p, 'kind', 'type'));
    const city = text(pick(p, 'city'));
    const beds = Math.round(num(pick(p, 'bedrooms', 'beds')));

    return {
      externalId: text(pick(p, 'externalId', 'id', 'ref')),
      title: text(pick(p, 'title')) || fallbackTitle(kind, city, beds),
      description: text(pick(p, 'description')),
      address: text(pick(p, 'address')) || city,
      city,
      kind,
      price: Math.round(num(pick(p, 'price'))),
      marketPrice: Math.round(num(pick(p, 'marketPrice', 'market_price', 'oldPrice', 'old_price', 'precioMercado', 'precio_mercado'))) || null,
      area: Math.round(num(pick(p, 'area', 'm2'))),
      bedrooms: beds,
      bathrooms: Math.round(num(pick(p, 'bathrooms', 'baths'))),
      seaView: bool(pick(p, 'seaView', 'sea')),
      yearBuilt: num(pick(p, 'yearBuilt')) || null,
      features: arr(pick(p, 'features.feature', 'features')).map((f: any) => text(f)).filter(Boolean),
      images: arr(pick(p, 'images.image', 'images'))
        .map((i: any) => text(pick(i, 'url') ?? i))
        .filter((u: string) => /^https?:\/\//.test(u)),
      lat: num(pick(p, 'lat', 'latitude')) || null,
      lng: num(pick(p, 'lng', 'longitude')) || null,
      raw: p,
    } satisfies NormalizedListing;
  });
}
