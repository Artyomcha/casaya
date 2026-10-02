import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { detectFormat, parseInmovilla, parseKyero } from '../src/feeds/formats';
import { arr, bool, detectSeaView, num, pick, toKind } from '../src/feeds/formats/helpers';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  parseTagValue: false,
  textNodeName: '#text',
});

const KYERO = `<?xml version="1.0"?>
<root>
  <kyero><feed_version>3</feed_version></kyero>
  <property>
    <id>A-1042</id>
    <price>389000</price>
    <type>Villa</type>
    <town>Calpe</town>
    <province>Málaga</province>
    <beds>3</beds><baths>2</baths>
    <surface_area><built>165</built></surface_area>
    <location><latitude>38.6447</latitude><longitude>0.0450</longitude></location>
    <desc><en>Modern villa with sea view near Playa Arenal.</en></desc>
    <features><feature>Private pool</feature><feature>Sea view</feature></features>
    <images><image id="1"><url>https://cdn.example.com/1.jpg</url></image></images>
  </property>
</root>`;

const INMOVILLA = `<?xml version="1.0"?>
<inmovilla>
  <propiedad>
    <cod_ofer>7781</cod_ofer>
    <tipo>Piso</tipo>
    <ciudad>Marbella</ciudad>
    <zona>Playa de San Juan</zona>
    <calle>Avenida de Niza 14</calle>
    <precioinmo>259.000</precioinmo>
    <m_cons>92</m_cons>
    <habitaciones>3</habitaciones>
    <banyos>2</banyos>
    <latitud>38.3720</latitud><longitud>-0.4380</longitud>
    <descrip_ru>Светлые апартаменты в 200 метрах от пляжа.</descrip_ru>
    <caracteristicas><caracteristica>Vistas al mar</caracteristica></caracteristicas>
    <fotos><foto><url>https://cdn.example.com/a.jpg</url></foto></fotos>
  </propiedad>
</inmovilla>`;

describe('разбор значений', () => {
  it('понимает испанский формат тысяч', () => {
    expect(num('259.000')).toBe(259000);
    expect(num('1.250.000')).toBe(1250000);
  });

  it('понимает десятичную запятую', () => expect(num('38,3745')).toBeCloseTo(38.3745, 4));
  it('на мусоре даёт ноль', () => expect(num('нет данных')).toBe(0));

  it('читает испанское «да»', () => {
    for (const v of ['1', 'true', 'si', 'Sí', 'YES']) expect(bool(v)).toBe(true);
    expect(bool('no')).toBe(false);
  });

  it('приводит одиночный узел к массиву', () => {
    expect(arr('one')).toEqual(['one']);
    expect(arr(['a', 'b'])).toEqual(['a', 'b']);
    expect(arr(undefined)).toEqual([]);
  });

  it('ищет поле по синонимам без учёта регистра', () => {
    expect(pick({ Precio: '100' }, 'price', 'precio')).toBe('100');
    expect(pick({ a: { b: 'x' } }, 'a.b')).toBe('x');
    expect(pick({}, 'nope')).toBeUndefined();
  });
});

describe('определение типа объекта', () => {
  it('различает виллу и обычный дом', () => {
    expect(toKind('Villa')).toBe('VILLA');
    expect(toKind('Chalet')).toBe('VILLA');
    expect(toKind('Casa')).toBe('HOUSE');
  });

  it('различает студию и квартиру', () => {
    expect(toKind('Estudio')).toBe('STUDIO');
    expect(toKind('Piso')).toBe('FLAT');
    expect(toKind('Apartment')).toBe('FLAT');
  });

  it('узнаёт пентхаус и таунхаус', () => {
    expect(toKind('Ático')).toBe('PENTHOUSE');
    expect(toKind('Adosado')).toBe('TOWNHOUSE');
  });

  it('незнакомое считает квартирой', () => expect(toKind('что-то')).toBe('FLAT'));
});

describe('вид на море', () => {
  it('ловит формулировки на разных языках', () => {
    expect(detectSeaView('Vistas al mar')).toBe(true);
    expect(detectSeaView('sea view from terrace')).toBe(true);
    expect(detectSeaView('Zeezicht')).toBe(true);
    expect(detectSeaView('Meerblick')).toBe(true);
  });

  it('не выдумывает', () => expect(detectSeaView('тихий двор')).toBe(false));
});

describe('автоопределение формата', () => {
  it('узнаёт Inmovilla по cod_ofer', () => {
    expect(detectFormat(parser.parse(INMOVILLA))).toBe('INMOVILLA');
  });

  it('узнаёт Kyero', () => {
    expect(detectFormat(parser.parse(KYERO))).toBe('KYERO');
  });
});

describe('Kyero', () => {
  const [item] = parseKyero(parser.parse(KYERO));

  it('переносит основные поля', () => {
    expect(item.externalId).toBe('A-1042');
    expect(item.price).toBe(389000);
    expect(item.area).toBe(165);
    expect(item.bedrooms).toBe(3);
    expect(item.kind).toBe('VILLA');
  });

  it('собирает адрес из города и провинции', () => {
    expect(item.address).toBe('Calpe, Málaga');
  });

  it('берёт координаты', () => {
    expect(item.lat).toBeCloseTo(38.6447, 4);
    expect(item.lng).toBeCloseTo(0.045, 4);
  });

  it('видит вид на море по характеристикам', () => expect(item.seaView).toBe(true));
  it('оставляет только http-ссылки на фото', () => expect(item.images).toHaveLength(1));
});

describe('Inmovilla', () => {
  const [item] = parseInmovilla(parser.parse(INMOVILLA));

  it('читает испанские имена полей', () => {
    expect(item.externalId).toBe('7781');
    expect(item.price).toBe(259000);
    expect(item.area).toBe(92);
    expect(item.bathrooms).toBe(2);
  });

  it('предпочитает русское описание, когда оно есть', () => {
    expect(item.description).toContain('апартаменты');
  });

  it('склеивает улицу, город и зону', () => {
    expect(item.address).toBe('Avenida de Niza 14, Marbella, Playa de San Juan');
  });

  it('придумывает заголовок, если CRM его не отдала', () => {
    expect(item.title.length).toBeGreaterThan(0);
  });
});
