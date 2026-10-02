import { NormalizedListing } from '../normalized';
import { arr, bool, detectSeaView, fallbackTitle, num, pick, text, toKind } from './helpers';

/**
 * Kyero XML v3 — де-факто стандарт испанского рынка, его умеют отдавать
 * почти все CRM (Inmovilla, Resales Online, Witei экспортируют в этот формат).
 */
export function parseKyero(doc: any): NormalizedListing[] {
  const root = pick(doc, 'root', 'kyero', 'properties') ?? doc;
  return arr(pick(root, 'property', 'properties.property')).map((p: any) => {
    const kind = toKind(pick(p, 'type', 'property_type'));
    const city = text(pick(p, 'town', 'city', 'location.town'));
    const beds = Math.round(num(pick(p, 'beds', 'bedrooms')));
    const desc =
      text(pick(p, 'desc.ru', 'desc.en', 'desc.es', 'description.ru', 'description.en', 'description'));

    const features = arr(pick(p, 'features.feature', 'features'))
      .map((f: any) => text(f))
      .filter(Boolean);

    const images = arr(pick(p, 'images.image', 'images'))
      .map((i: any) => text(pick(i, 'url') ?? i))
      .filter((u: string) => /^https?:\/\//.test(u));

    const province = text(pick(p, 'province'));
    const location = text(pick(p, 'location_detail', 'address', 'street'));

    return {
      externalId: text(pick(p, 'id', 'ref', 'reference')),
      title: text(pick(p, 'title', 'name')) || fallbackTitle(kind, city, beds),
      description: desc,
      address: [location, city, province].filter(Boolean).join(', ') || city,
      city,
      kind,
      price: Math.round(num(pick(p, 'price', 'price_sale'))),
      // Kyero не описывает рыночную цену, но выгрузки её кладут рядом с ценой.
      marketPrice: Math.round(num(pick(p, 'price_market', 'price_original', 'price_old'))) || null,
      area: Math.round(num(pick(p, 'surface_area.built', 'built', 'surface_area', 'size'))),
      bedrooms: beds,
      bathrooms: Math.round(num(pick(p, 'baths', 'bathrooms'))),
      seaView: detectSeaView(features.join(' '), desc, location) || bool(pick(p, 'sea_view')),
      yearBuilt: num(pick(p, 'year_built', 'construction_year')) || null,
      features,
      images,
      lat: num(pick(p, 'location.latitude', 'latitude')) || null,
      lng: num(pick(p, 'location.longitude', 'longitude')) || null,
      raw: p,
    } satisfies NormalizedListing;
  });
}
