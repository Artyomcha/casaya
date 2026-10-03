import { PrismaClient, Placement, PromotionTier, PropertyKind, ServiceScope } from '@prisma/client';
import { canonicalMedia } from '../src/properties/media';

const prisma = new PrismaClient();

const img = (id: number) => `/img/p${id}.jpg`;

const AGENCIES: {
  id: string; name: string; initials: string; brandColor: string;
  crm: string; planKey: string; logoUrl?: string;
}[] = [
  { id: 'ag-costa-living', name: 'Costa Living', initials: 'CL', brandColor: '#6D3BF5', crm: 'Inmovilla', planKey: 'pro', logoUrl: demoLogo('CL', '#6D3BF5') },
  { id: 'ag-mediterra', name: 'Mediterra Homes', initials: 'MH', brandColor: '#16A37A', crm: 'Witei', planKey: 'premium', logoUrl: demoLogo('MH', '#16A37A') },
  { id: 'ag-marbella-prime', name: 'Marbella Prime', initials: 'MP', brandColor: '#FF5A3C', crm: 'Mobilia', planKey: 'pro' },
  { id: 'ag-sol', name: 'Sol Inmobiliaria', initials: 'SI', brandColor: '#2F80ED', crm: 'Resales Online', planKey: 'start' },
  { id: 'ag-casa-norte', name: 'Casa Norte', initials: 'CN', brandColor: '#17112B', crm: 'Kyero XML', planKey: 'start' },
];

type Raw = {
  id: string; slug: string; img: number; gal: number[]; kind: PropertyKind; sea: boolean;
  price: number;
  /** Рыночная цена этого объекта — её указывает агентство вместе со своей. */
  market: number;
  m2: number; bd: number; ba: number; title: string; addr: string;
  agencyId: string; badge: string | null; lat: number; lng: number;
};

const LISTINGS: Raw[] = [
  { id: 'l1', slug: 'villa-v-sierra-blanca-marbella', img: 29453302, gal: [5570222, 1428348, 20200291, 6180674], kind: 'VILLA', sea: true, price: 1290000, market: 1450000, m2: 320, bd: 5, ba: 4, title: 'Вилла с видом на море', addr: 'Sierra Blanca, Марбелья', agencyId: 'ag-costa-living', badge: 'Новое', lat: 36.516, lng: -4.901 },
  { id: 'l2', slug: 'villa-v-benahavis', img: 31817156, gal: [20390760, 6775268, 5570222, 1428348], kind: 'VILLA', sea: true, price: 2450000, market: 2750000, m2: 540, bd: 6, ba: 6, title: 'Вилла в закрытом посёлке', addr: 'Benahavís, Малага', agencyId: 'ag-mediterra', badge: null, lat: 36.519, lng: -5.046 },
  { id: 'l3', slug: 'apartamenty-puerto-banus', img: 6775268, gal: [1428348, 6180674, 20390760, 5570222], kind: 'FLAT', sea: true, price: 595000, market: 660000, m2: 112, bd: 2, ba: 2, title: 'Апартаменты у порта', addr: 'Puerto Banús, Марбелья', agencyId: 'ag-marbella-prime', badge: 'Новое', lat: 36.4876, lng: -4.9517 },
  { id: 'l4', slug: 'dom-s-sadom-elviria', img: 20200291, gal: [5570222, 6180674, 1428348, 20390760], kind: 'HOUSE', sea: false, price: 745000, market: 820000, m2: 210, bd: 4, ba: 3, title: 'Дом с садом и бассейном', addr: 'Elviria, Марбелья', agencyId: 'ag-sol', badge: null, lat: 36.4906, lng: -4.762 },
  { id: 'l5', slug: 'svetlaya-kvartira-san-pedro', img: 1428348, gal: [6180674, 20390760, 5570222, 6775268], kind: 'FLAT', sea: false, price: 349000, market: 395000, m2: 92, bd: 2, ba: 2, title: 'Светлая квартира у бульвара', addr: 'San Pedro de Alcántara, Марбелья', agencyId: 'ag-marbella-prime', badge: '−5%', lat: 36.4852, lng: -4.9895 },
  { id: 'l6', slug: 'kvartira-posle-remonta-marbella-centro', img: 6180674, gal: [1428348, 5570222, 20390760, 6775268], kind: 'FLAT', sea: false, price: 410000, market: 450000, m2: 98, bd: 3, ba: 2, title: 'Квартира после ремонта', addr: 'Centro, Марбелья', agencyId: 'ag-casa-norte', badge: null, lat: 36.5095, lng: -4.888 },
  { id: 'l7', slug: 'penthaus-s-solyariem-estepona', img: 5570222, gal: [20390760, 1428348, 6180674, 6775268], kind: 'PENTHOUSE', sea: true, price: 520000, market: 580000, m2: 128, bd: 3, ba: 2, title: 'Пентхаус с солярием', addr: 'Centro, Эстепона', agencyId: 'ag-mediterra', badge: 'Новое', lat: 36.427, lng: -5.147 },
  { id: 'l8', slug: 'studiya-nueva-andalucia', img: 20390760, gal: [5570222, 1428348, 6180674, 6775268], kind: 'STUDIO', sea: false, price: 235000, market: 249000, m2: 68, bd: 1, ba: 1, title: 'Студия у поля для гольфа', addr: 'Nueva Andalucía, Марбелья', agencyId: 'ag-casa-norte', badge: null, lat: 36.5053, lng: -4.9478 },
];

/** У домов и вилл свой набор удобств. */
/** Под этим адресом открывается кабинет любого демо-агентства. */
export const DEMO_OWNER_EMAIL = 'demo@casaya.es';

const HOUSE_KINDS: PropertyKind[] = ['HOUSE', 'VILLA', 'TOWNHOUSE'];

const HOUSE_FEATURES = ['Бассейн', 'Сад', 'Парковка на 2 авто', 'Кондиционер', 'Солнечные панели', 'Барбекю-зона'];
const FLAT_FEATURES = ['Терраса', 'Лифт', 'Общий бассейн', 'Кондиционер', 'Кладовая', 'Парковка'];

const describe = (l: Raw) =>
  `${l.title} в районе ${l.addr.split(',')[0]}. Объект полностью готов к проживанию, продаётся с мебелью и техникой. ` +
  'Рядом пляж, супермаркеты, международная школа и выезд на AP-7 в сторону Малаги. Документы проверены, обременений нет.';

const PLANS = [
  { key: 'start', name: 'Старт', price: '0 €', per: '12 месяцев', tag: null, sort: 0, cta: 'Начать бесплатно', items: ['Безлимитное размещение через фид', 'Отклики с профилями покупателей', 'Бейдж Verificado для объектов', 'Базовая статистика'] },
  { key: 'pro', name: 'Pro', price: '99 €', per: '/ мес', tag: 'Популярный', sort: 1, cta: 'Выбрать Pro', items: ['Всё из тарифа Старт', 'Топ выдачи в 3 районах', 'Аналитика цен и спроса', 'До 5 пользователей'] },
  { key: 'premium', name: 'Premium', price: '499 €', per: '/ мес', tag: null, sort: 2, cta: 'Выбрать Premium', items: ['Всё из тарифа Pro', 'Брендированная страница агентства', 'Приоритет во всех районах', 'Персональный менеджер'] },
];

const BANKS = [
  { name: 'Santander', initial: 'S', brandColor: '#E0322B', rate: 'от 3,2%', ltv: 'до 70%', term: 'до 25 лет', decisionTime: '7 дней' },
  { name: 'BBVA', initial: 'B', brandColor: '#1B4FA0', rate: 'от 3,4%', ltv: 'до 70%', term: 'до 25 лет', decisionTime: '10 дней' },
  { name: 'CaixaBank', initial: 'C', brandColor: '#0F76BC', rate: 'от 3,3%', ltv: 'до 60%', term: 'до 20 лет', decisionTime: '8 дней' },
  { name: 'Sabadell', initial: 'S', brandColor: '#1A8FD0', rate: 'от 3,5%', ltv: 'до 70%', term: 'до 25 лет', decisionTime: '6 дней' },
  { name: 'Bankinter', initial: 'B', brandColor: '#FF7A00', rate: 'от 3,6%', ltv: 'до 60%', term: 'до 20 лет', decisionTime: '5 дней' },
  { name: 'Deutsche Bank', initial: 'D', brandColor: '#0018A8', rate: 'от 3,7%', ltv: 'до 60%', term: 'до 20 лет', decisionTime: '10 дней' },
];

const ICONS = {
  legal: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8M8 17h5',
  escrow: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  mortgage: 'M3 10 12 4l9 6M5 10v9h14v-9M9 19v-5h6v5',
  move: 'M7 7h13l-4-4M17 17H4l4 4',
  video: 'M15 10l5-3v10l-5-3M3 7h12v10H3z',
  poa: 'M4 20l4-1 11-11-3-3L5 16l-1 4ZM14 6l3 3',
};

const SERVICES = [
  { slug: 'legal-home', brand: 'Casaya Legal', title: 'NIE и юрист', description: 'NIE, банковский счёт и проверка сделки независимым юристом.', price: null, bg: '#F1ECFF', fg: '#6D3BF5', icon: ICONS.legal, scope: 'HOME' as ServiceScope, sort: 0 },
  { slug: 'escrow-home', brand: 'Casaya Escrow', title: 'Защищённый задаток', description: 'Задаток хранится на защищённом счёте до подписания у нотариуса.', price: null, bg: '#E8F7F1', fg: '#0E7A5A', icon: ICONS.escrow, scope: 'HOME' as ServiceScope, sort: 1 },
  { slug: 'move-home', brand: 'Casaya Move', title: 'Перевод денег', description: 'Перевод средств в евро по выгодному курсу из любой страны.', price: null, bg: '#EAF2FF', fg: '#2F6FD6', icon: ICONS.move, scope: 'HOME' as ServiceScope, sort: 2 },
  { slug: 'viewing-home', brand: 'Осмотр по запросу', title: 'Видео-осмотр за 49 €', description: 'Местный эксперт снимет объект по чек-листу, пока вы дома.', price: null, bg: '#FFF1EC', fg: '#E94A2E', icon: ICONS.video, scope: 'HOME' as ServiceScope, sort: 3 },

  { slug: 'legal', brand: 'Casaya Legal', title: 'NIE и юрист', description: 'Получение NIE, открытие счёта, проверка объекта и договора независимым юристом.', price: 'от 450 €', bg: '#F1ECFF', fg: '#6D3BF5', icon: ICONS.legal, scope: 'FULL' as ServiceScope, sort: 0 },
  { slug: 'escrow', brand: 'Casaya Escrow', title: 'Защищённый задаток', description: 'Задаток (arras) хранится на защищённом счёте и переходит продавцу только у нотариуса.', price: '0,5% от задатка', bg: '#E8F7F1', fg: '#0E7A5A', icon: ICONS.escrow, scope: 'FULL' as ServiceScope, sort: 1 },
  { slug: 'hipotecas', brand: 'Casaya Hipotecas', title: 'Ипотека нерезиденту', description: 'Подбор банка, подготовка документов и предварительное одобрение до поездки.', price: 'бесплатно', bg: '#E6F7FB', fg: '#0C8AA6', icon: ICONS.mortgage, scope: 'FULL' as ServiceScope, sort: 2 },
  { slug: 'move', brand: 'Casaya Move', title: 'Перевод денег', description: 'Перевод средств в евро из любой страны по прозрачному курсу.', price: 'от 0,2% суммы', bg: '#EAF2FF', fg: '#2F6FD6', icon: ICONS.move, scope: 'FULL' as ServiceScope, sort: 3 },
  { slug: 'viewing', brand: 'Осмотр по запросу', title: 'Видео-осмотр объекта', description: 'Местный эксперт снимет объект по чек-листу: влажность, шум, район вечером.', price: '49 €', bg: '#FFF1EC', fg: '#E94A2E', icon: ICONS.video, scope: 'FULL' as ServiceScope, sort: 4 },
  { slug: 'remote-deal', brand: 'Удалённая сделка', title: 'Покупка по доверенности', description: 'Юрист подписывает документы от вашего имени, вы следите за статусом онлайн.', price: 'от 900 €', bg: '#FFF6E5', fg: '#B26A00', icon: ICONS.poa, scope: 'FULL' as ServiceScope, sort: 5 },
];

const PROJECTS = [
  { slug: 'banus-bay-residences', name: 'Banús Bay Residences', address: 'Puerto Banús, Марбелья', priceFrom: 549000, deliveryLabel: 'Сдача II кв. 2027', deliveryYear: '2027', developer: 'Grupo Sol', units: '86 квартир', image: img(15994062), specs: [{ k: 'Спальни', v: '1–3' }, { k: 'Площадь', v: '78–140 м²' }, { k: 'До моря', v: '300 м' }], listing: 'l3' },
  { slug: 'benahavis-hills', name: 'Benahavís Hills', address: 'Benahavís, Малага', priceFrom: 980000, deliveryLabel: 'Сдача IV кв. 2026', deliveryYear: '2026', developer: 'Costa Build', units: '24 виллы', image: img(29453302), specs: [{ k: 'Спальни', v: '3–5' }, { k: 'Площадь', v: '240–380 м²' }, { k: 'Бассейн', v: 'частный' }], listing: 'l1' },
  { slug: 'san-pedro-living', name: 'San Pedro Living', address: 'San Pedro de Alcántara, Марбелья', priceFrom: 338000, deliveryLabel: 'Сдача I кв. 2027', deliveryYear: '2027', developer: 'Urbania', units: '120 квартир', image: img(10135442), specs: [{ k: 'Спальни', v: '1–3' }, { k: 'Площадь', v: '68–112 м²' }, { k: 'Бульвар', v: '200 м' }], listing: 'l5' },
  { slug: 'estepona-blue', name: 'Estepona Blue', address: 'Эстепона', priceFrom: 429000, deliveryLabel: 'Сдача III кв. 2028', deliveryYear: '2028', developer: 'Mediterra', units: '42 апартамента', image: img(18264393), specs: [{ k: 'Спальни', v: '2–3' }, { k: 'Площадь', v: '96–150 м²' }, { k: 'Вид', v: 'на море' }], listing: 'l7' },
];

const CITIES = [
  { slug: 'marbella', name: 'Марбелья', listingsCount: 5120, pricePerM2: 4380, image: img(34672275), sort: 0 },
  { slug: 'estepona', name: 'Эстепона', listingsCount: 2740, pricePerM2: 3290, image: img(13114931), sort: 1 },
  { slug: 'san-pedro-de-alcantara', name: 'San Pedro de Alcántara', listingsCount: 1860, pricePerM2: 3610, image: img(15172873), sort: 2 },
];

/**
 * Одну и ту же квартиру продают несколько агентств — это норма рынка.
 * Здесь заведены такие дубли, чтобы схлопывание было видно на витрине.
 */
const DUPLICATE_OFFERS: {
  of: string;
  agencyId: string;
  externalId: string;
  /** Насколько цена отличается от первого предложения. */
  priceDelta: number;
  title: string;
  /** Своя съёмка: каждое агентство снимает квартиру по-своему. */
  photos: number[];
}[] = [
  { of: 'l3', agencyId: 'ag-costa-living', externalId: 'CL-8841', priceDelta: 6000, title: 'Апартаменты у порта, Банус', photos: [13114931, 34672275] },
  { of: 'l3', agencyId: 'ag-casa-norte', externalId: 'CN-2210', priceDelta: -4000, title: 'Квартира с террасой, Puerto Banús', photos: [10135442, 15172873, 18264393] },
  { of: 'l5', agencyId: 'ag-mediterra', externalId: 'MH-5517', priceDelta: 3000, title: 'Светлая квартира, Сан-Педро', photos: [15994062, 31817156] },
  { of: 'l1', agencyId: 'ag-sol', externalId: 'SI-7702', priceDelta: 15000, title: 'Вилла в Sierra Blanca с бассейном', photos: [20200291, 6180674] },
];

const PIPELINE_SEED: { status: 'NEW' | 'CONTACTED' | 'VIEWING' | 'NEGOTIATION' | 'WON' | 'LOST'; name: string; budget: number; listing: string }[] = [
  { status: 'NEW', name: 'Jan de Vries', budget: 320000, listing: 'l3' },
  { status: 'NEW', name: 'Anna Schmidt', budget: 500000, listing: 'l1' },
  { status: 'CONTACTED', name: 'Pieter Bakker', budget: 280000, listing: 'l5' },
  { status: 'VIEWING', name: 'Erik Lindqvist', budget: 350000, listing: 'l4' },
  { status: 'NEGOTIATION', name: 'Marek Nowak', budget: 300000, listing: 'l6' },
  { status: 'WON', name: 'Sophie Dubois', budget: 485000, listing: 'l1' },
  { status: 'LOST', name: 'Tom Wilson', budget: 180000, listing: 'l8' },
];

/** Простые SVG-логотипы для демонстрации: буквы на фирменном цвете. */
function demoLogo(initials: string, color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="16" fill="${color}"/>` +
    `<circle cx="32" cy="24" r="9" fill="#FFFFFF" opacity="0.92"/>` +
    `<path d="M14 54c0-10 8-16 18-16s18 6 18 16z" fill="#FFFFFF" opacity="0.92"/>` +
    `<text x="32" y="60" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#FFFFFF">${initials}</text>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function main() {
  await prisma.leadNote.deleteMany();
  await prisma.listingStat.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.property.deleteMany();
  await prisma.project.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.serviceOffer.deleteMany();
  await prisma.city.deleteMany();
  await prisma.valuation.deleteMany();

  await prisma.plan.createMany({ data: PLANS });
  await prisma.bank.createMany({ data: BANKS.map((b, sort) => ({ ...b, sort })) });
  await prisma.serviceOffer.createMany({ data: SERVICES });
  await prisma.city.createMany({ data: CITIES });
  await prisma.agency.createMany({ data: AGENCIES });

  // --- Владелец агентств: кабинет и CRM закрыты членством, и без него
  // демо-данные некому было бы открыть.
  const owner = await prisma.user.create({
    data: { email: DEMO_OWNER_EMAIL, name: 'Демо-владелец' },
  });
  await prisma.agencyMember.createMany({
    data: AGENCIES.map((a) => ({ agencyId: a.id, userId: owner.id, role: 'owner' })),
  });

  for (const p of PROJECTS) {
    await prisma.project.create({
      data: {
        slug: p.slug, name: p.name, address: p.address, priceFrom: p.priceFrom,
        deliveryLabel: p.deliveryLabel, deliveryYear: p.deliveryYear,
        developer: p.developer, units: p.units, image: p.image, specs: p.specs,
      },
    });
  }

  const verifiedAt = new Date('2026-09-18T00:00:00Z');
  // Порядок выдачи «сначала новые» должен совпадать с порядком в макете.
  const now = Date.now();
  for (const [index, l] of LISTINGS.entries()) {
    const project = PROJECTS.find((p) => p.listing === l.id);
    await prisma.listing.create({
      data: {
        id: l.id,
        slug: l.slug,
        title: l.title,
        address: l.addr,
        kind: l.kind,
        price: l.price,
        marketPrice: l.market,
        area: l.m2,
        bedrooms: l.bd,
        bathrooms: l.ba,
        seaView: l.sea,
        seaDistance: l.sea ? '350 м' : '1,8 км',
        yearBuilt: HOUSE_KINDS.includes(l.kind) ? 2019 : 2008,
        verified: true,
        verifiedAt,
        badge: l.badge,
        description: describe(l),
        features: HOUSE_KINDS.includes(l.kind) ? HOUSE_FEATURES : FLAT_FEATURES,
        coverImage: img(l.img),
        gallery: l.gal.map(img),
        lat: l.lat,
        lng: l.lng,
        agencyId: l.agencyId,
        publishedAt: new Date(now - index * 3600_000),
        projectId: project ? (await prisma.project.findUnique({ where: { slug: project.slug } }))!.id : null,
      },
    });
  }

  // --- Объекты: у каждого объявления появляется реальный объект недвижимости.
  for (const l of LISTINGS) {
    const property = await prisma.property.create({
      data: {
        slug: l.slug,
        address: l.addr,
        city: 'Marbella',
        lat: l.lat,
        lng: l.lng,
        kind: l.kind,
        area: l.m2,
        bedrooms: l.bd,
        bathrooms: l.ba,
        seaView: l.sea,
        yearBuilt: HOUSE_KINDS.includes(l.kind) ? 2019 : 2008,
        matchKey: ['marbella', l.kind, Math.round(l.m2 / 10), l.bd].join('|'),
      },
    });
    await prisma.listing.update({ where: { id: l.id }, data: { propertyId: property.id } });
  }

  // --- Дубли: те же объекты, но от других агентств и с другой ценой.
  for (const [i, dup] of DUPLICATE_OFFERS.entries()) {
    const origin = LISTINGS.find((l) => l.id === dup.of)!;
    const base = await prisma.listing.findUniqueOrThrow({ where: { id: dup.of } });

    await prisma.listing.create({
      data: {
        id: `${dup.of}-dup-${i + 1}`,
        slug: `${origin.slug}-${dup.agencyId.replace('ag-', '')}`,
        title: dup.title,
        address: origin.addr,
        kind: origin.kind,
        price: origin.price + dup.priceDelta,
        // Рыночная цена относится к объекту, а не к предложению: все агентства
        // продают одну квартиру, и сравнивать их надо с одним ориентиром.
        marketPrice: origin.market,
        area: origin.m2,
        bedrooms: origin.bd,
        bathrooms: origin.ba,
        seaView: origin.sea,
        seaDistance: base.seaDistance,
        yearBuilt: base.yearBuilt,
        // Дубль из чужого фида бейджа не получает: проверку проходит объект,
        // а не каждое предложение по нему.
        verified: false,
        description: base.description,
        features: base.features,
        // Каждое агентство снимает по-своему: у дубля собственный набор кадров.
        coverImage: img(dup.photos[0]),
        gallery: dup.photos.slice(1).map(img),
        lat: origin.lat,
        lng: origin.lng,
        agencyId: dup.agencyId,
        externalId: dup.externalId,
        source: 'FEED',
        propertyId: base.propertyId,
        publishedAt: new Date(Date.now() - (i + 1) * 5 * 3600_000),
      },
    });
  }

  // --- Канонические фото объектов: выбираем лучший набор среди агентств.
  for (const property of await prisma.property.findMany({ select: { id: true } })) {
    const listings = await prisma.listing.findMany({
      where: { propertyId: property.id, status: 'PUBLISHED' },
      select: {
        id: true, coverImage: true, gallery: true, verified: true, videoTour: true,
        agency: { select: { name: true } },
      },
    });

    const media = canonicalMedia(
      listings.map((l) => ({
        listingId: l.id,
        agencyName: l.agency.name,
        coverImage: l.coverImage,
        gallery: l.gallery,
        verified: l.verified,
        videoTour: l.videoTour,
      })),
    );

    await prisma.property.update({
      where: { id: property.id },
      data: { coverImage: media.coverImage, gallery: media.gallery, photoSource: media.source },
    });
  }

  // --- Продвижение: два объявления куплены, чтобы алгоритм было на чём проверить.
  const promoted: [string, PromotionTier, number][] = [
    ['l4', 'FEATURED', 1990],
    ['l6', 'TOP_AREA', 3990],
    // Продвижение купило агентство, чьё предложение дороже и в карточку
    // не попадает: проверяем, что буст всё равно поднимает объект.
    ['l3-dup-1', 'FEATURED', 1990],
  ];
  for (const [listingId, tier, cents] of promoted) {
    await prisma.promotion.create({
      data: {
        listingId,
        tier,
        status: 'ACTIVE',
        area: tier === 'TOP_AREA' ? 'Gran Vía' : null,
        endsAt: new Date(Date.now() + 7 * 86_400_000),
        priceCents: cents,
      },
    });
  }

  // --- Статистика показов за две недели: без неё в кабинете пусто.
  const placements: Placement[] = ['SEARCH', 'MAP', 'RECOMMENDATION'];
  for (const l of LISTINGS) {
    for (let d = 0; d < 14; d += 1) {
      const day = new Date();
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - d);

      for (const placement of placements) {
        const impressions = 20 + ((l.price / 1000 + d * 7 + placement.length) % 90 | 0);
        await prisma.listingStat.create({
          data: {
            listingId: l.id,
            day,
            placement,
            impressions,
            clicks: Math.round(impressions * (0.04 + ((d % 5) * 0.01))),
            leads: d % 6 === 0 ? 1 : 0,
          },
        });
      }
    }
  }

  // --- Воронка CRM.
  for (const [i, lead] of PIPELINE_SEED.entries()) {
    const created = await prisma.lead.create({
      data: {
        kind: 'LISTING_CONTACT',
        status: lead.status,
        name: lead.name,
        email: `${lead.name.split(' ')[0].toLowerCase()}@example.com`,
        phone: `+34 600 ${100 + i} ${200 + i}`,
        budget: lead.budget,
        needsMortgage: i % 3 === 0,
        listingId: lead.listing,
        agencyId: LISTINGS.find((l) => l.id === lead.listing)!.agencyId,
        contactedAt: lead.status === 'NEW' ? null : new Date(Date.now() - (i + 1) * 86_400_000),
        nextStepAt: ['CONTACTED', 'VIEWING', 'NEGOTIATION'].includes(lead.status)
          ? new Date(Date.now() + (i - 1) * 86_400_000)
          : null,
        createdAt: new Date(Date.now() - (i + 1) * 2 * 86_400_000),
      },
    });

    if (lead.status !== 'NEW') {
      await prisma.leadNote.create({
        data: { leadId: created.id, text: 'Созвонились, отправил подборку и расчёт ипотеки.' },
      });
    }
  }

  const counts = {
    properties: await prisma.property.count(),
    listings: await prisma.listing.count(),
    agencies: await prisma.agency.count(),
    projects: await prisma.project.count(),
    promotions: await prisma.promotion.count(),
    leads: await prisma.lead.count(),
  };
  console.log('seed ok', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
