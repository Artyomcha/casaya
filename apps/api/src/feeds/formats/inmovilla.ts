import { NormalizedListing } from '../normalized';
import { arr, detectSeaView, fallbackTitle, num, pick, text, toKind } from './helpers';

/**
 * Inmovilla — самая распространённая CRM у агентств Коста-Бланки.
 * Её выгрузка ближе к «плоской» схеме с испанскими именами полей.
 */
export function parseInmovilla(doc: any): NormalizedListing[] {
  const root = pick(doc, 'inmovilla', 'root', 'propiedades') ?? doc;
  return arr(pick(root, 'propiedad', 'property', 'inmueble')).map((p: any) => {
    const kind = toKind(pick(p, 'tipo', 'tipo_ofertas', 'type'));
    const city = text(pick(p, 'ciudad', 'poblacion', 'town'));
    const beds = Math.round(num(pick(p, 'habitaciones', 'dormitorios', 'beds')));
    const desc = text(pick(p, 'descrip_ru', 'descrip_en', 'descrip', 'observaciones'));

    const features = arr(pick(p, 'caracteristicas.caracteristica', 'extras.extra'))
      .map((f: any) => text(f))
      .filter(Boolean);

    const images = arr(pick(p, 'fotos.foto', 'imagenes.imagen', 'images.image'))
      .map((i: any) => text(pick(i, 'url', 'ruta') ?? i))
      .filter((u: string) => /^https?:\/\//.test(u));

    const street = text(pick(p, 'calle', 'direccion'));
    const zone = text(pick(p, 'zona', 'provincia'));

    return {
      externalId: text(pick(p, 'cod_ofer', 'referencia', 'ref', 'id')),
      title: text(pick(p, 'titulo', 'titulo_ru', 'titulo_en')) || fallbackTitle(kind, city, beds),
      description: desc,
      address: [street, city, zone].filter(Boolean).join(', ') || city,
      city,
      kind,
      price: Math.round(num(pick(p, 'precioinmo', 'precio_venta', 'precio', 'price'))),
      // precioantiguo — цена до скидки в Inmovilla, её и берём за рыночную.
      marketPrice: Math.round(num(pick(p, 'precioantiguo', 'precio_mercado', 'precio_anterior'))) || null,
      area: Math.round(num(pick(p, 'm_cons', 'superficie', 'm2', 'metros'))),
      bedrooms: beds,
      bathrooms: Math.round(num(pick(p, 'banyos', 'banos', 'baths'))),
      seaView: detectSeaView(features.join(' '), desc, zone, pick(p, 'vistas')),
      yearBuilt: num(pick(p, 'anyo_construccion', 'ano_construccion')) || null,
      features,
      images,
      lat: num(pick(p, 'latitud', 'latitude')) || null,
      lng: num(pick(p, 'longitud', 'longitude')) || null,
      raw: p,
    } satisfies NormalizedListing;
  });
}
