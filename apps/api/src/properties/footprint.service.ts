import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  Footprint,
  footprintToGeoJson,
  parseCadastralAddress,
  parseCadastralRef,
  parseFootprint,
} from './catastro';

const WFS_BU = 'https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx';
const OVC_COORDS =
  'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx';

/** Кадастр отвечает медленно; дольше ждать бессмысленно — отдадим вид без подсветки. */
const TIMEOUT_MS = 9000;
/** Контуры домов меняются раз в годы, поэтому кэш держим месяц. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface Cached {
  /** false — кадастр ничего не нашёл; помним это, чтобы не долбить его на каждый показ. */
  ok: boolean;
  parcelRef?: string;
  address?: string | null;
  footprint?: Footprint;
}

export interface FootprintResult {
  found: boolean;
  parcelRef: string | null;
  /** Адрес из кадастра — им видно, что подсветили именно тот дом. */
  cadastralAddress: string | null;
  /** Этажей в доме — подпись «ваш этаж 4 из 6». */
  floorsAbove: number | null;
  heightMeters: number | null;
  /** Центр контура: куда наводить камеру, если координаты объявления неточны. */
  center: [number, number] | null;
  /** Готовый GeoJSON — витрина отдаёт его в источник карты как есть. */
  geojson: ReturnType<typeof footprintToGeoJson> | null;
  source: string | null;
}

@Injectable()
export class FootprintService {
  private readonly log = new Logger(FootprintService.name);

  constructor(private readonly prisma: PrismaService) {}

  async forProperty(propertyId: string): Promise<FootprintResult> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, cadastralRef: true, lat: true, lng: true, footprint: true, footprintAt: true },
    });
    if (!property) return empty();

    const cached = property.footprint as Cached | null;
    const fresh = property.footprintAt && Date.now() - property.footprintAt.getTime() < TTL_MS;
    if (cached && fresh) return fromCache(cached);

    const resolved = await this.resolve(property.cadastralRef, property.lat, property.lng);
    await this.prisma.property
      .update({
        where: { id: property.id },
        data: {
          footprint: resolved as unknown as Prisma.InputJsonValue,
          footprintAt: new Date(),
        },
      })
      .catch((e: unknown) => this.log.warn(`не сохранил контур ${property.id}: ${String(e)}`));

    return fromCache(resolved);
  }

  /**
   * Ссылка участка — первые 14 знаков кадастрового номера. Полный номер из
   * 20 знаков указывает на конкретную квартиру, а контур дома един для всех
   * квартир, поэтому для геометрии нужен именно участок.
   */
  private async resolve(
    cadastralRef: string | null,
    lat: number | null,
    lng: number | null,
  ): Promise<Cached> {
    let parcelRef = cadastralRef && /^[0-9A-Z]{14}/.test(cadastralRef) ? cadastralRef.slice(0, 14) : null;
    let address: string | null = null;

    if (!parcelRef && lat != null && lng != null) {
      const found = await this.refByCoords(lat, lng);
      parcelRef = found?.ref ?? null;
      address = found?.address ?? null;
    }
    if (!parcelRef) return { ok: false };

    const xml = await this.get(
      `${WFS_BU}?service=wfs&version=2.0.0&request=GetFeature` +
        `&StoredQuery_ID=GetBuildingPartByParcel&refcat=${encodeURIComponent(parcelRef)}&srsname=EPSG::4326`,
    );
    const footprint = xml ? parseFootprint(xml, parcelRef) : null;
    return footprint ? { ok: true, parcelRef, address, footprint } : { ok: false, parcelRef, address };
  }

  /**
   * Сначала точное попадание в участок, потом ближайший в радиусе: координаты
   * объявлений часто указывают на середину улицы, а не на дом.
   */
  private async refByCoords(lat: number, lng: number) {
    const query = `?SRS=EPSG:4326&Coordenada_X=${lng}&Coordenada_Y=${lat}`;
    for (const method of ['Consulta_RCCOOR', 'Consulta_RCCOOR_Distancia']) {
      const xml = await this.get(`${OVC_COORDS}/${method}${query}`);
      const ref = xml ? parseCadastralRef(xml) : null;
      if (ref) return { ref, address: parseCadastralAddress(xml!) };
    }
    return null;
  }

  private async get(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) {
        this.log.warn(`кадастр ответил ${res.status} на ${url}`);
        return null;
      }
      return await res.text();
    } catch (e) {
      this.log.warn(`кадастр недоступен: ${String(e)}`);
      return null;
    }
  }
}

const empty = (): FootprintResult => ({
  found: false,
  parcelRef: null,
  cadastralAddress: null,
  floorsAbove: null,
  heightMeters: null,
  center: null,
  geojson: null,
  source: null,
});

function fromCache(cached: Cached): FootprintResult {
  const footprint = cached.ok ? cached.footprint : undefined;
  if (!footprint) {
    return { ...empty(), parcelRef: cached.parcelRef ?? null, cadastralAddress: cached.address ?? null };
  }
  return {
    found: true,
    parcelRef: cached.parcelRef ?? footprint.cadastralRef,
    cadastralAddress: cached.address ?? null,
    floorsAbove: footprint.floorsAbove,
    heightMeters: footprint.heightMeters,
    center: footprint.center,
    geojson: footprintToGeoJson(footprint),
    source: footprint.source,
  };
}
