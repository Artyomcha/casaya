import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CATASTRO_SOURCE,
  footprintToGeoJson,
  heightFromFloors,
  parseCadastralAddress,
  parseCadastralRef,
  parseFootprint,
  parsePosList,
  ringsCenter,
} from '../src/properties/catastro';

const xml = readFileSync(
  new URL('./fixtures/catastro-bu-0072514YH2407C.xml', import.meta.url),
  'latin1',
);

describe('высота по этажности', () => {
  it('первый этаж выше остальных, сверху парапет', () => {
    // 3.6 + 4*3 + 0.9
    expect(heightFromFloors(5)).toBe(16.5);
    expect(heightFromFloors(1)).toBe(4.5);
  });

  it('этажность растёт монотонно', () => {
    for (let n = 1; n < 30; n += 1) {
      expect(heightFromFloors(n + 1)).toBeGreaterThan(heightFromFloors(n));
    }
  });

  it('без этажей высоты нет — не рисуем коробку нулевого дома', () => {
    expect(heightFromFloors(0)).toBe(0);
    expect(heightFromFloors(-3)).toBe(0);
  });
});

describe('posList', () => {
  it('переворачивает пары: кадастр даёт широту первой, GeoJSON ждёт долготу', () => {
    expect(parsePosList('38.345055 -0.483093 38.345079 -0.483107 38.34508 -0.483107')).toEqual([
      [-0.483093, 38.345055],
      [-0.483107, 38.345079],
      [-0.483107, 38.34508],
    ]);
  });

  it('нечётный или короткий список отбрасывается целиком', () => {
    expect(parsePosList('38.3 -0.4 38.4')).toEqual([]);
    expect(parsePosList('38.3 -0.4')).toEqual([]);
    expect(parsePosList('')).toEqual([]);
    expect(parsePosList('a b c d e f')).toEqual([]);
  });
});

describe('разбор ответа кадастра', () => {
  const footprint = parseFootprint(xml, '0072514YH2407C')!;

  it('находит все части здания', () => {
    expect(footprint.parts).toHaveLength(4);
    expect(footprint.source).toBe(CATASTRO_SOURCE);
  });

  it('этажность берётся из самой высокой части', () => {
    expect(footprint.parts.map((p) => p.floorsAbove)).toEqual([5, 6, 5, 1]);
    expect(footprint.floorsAbove).toBe(6);
    expect(footprint.heightMeters).toBe(heightFromFloors(6));
  });

  it('кольца замкнуты и лежат в Аликанте', () => {
    for (const part of footprint.parts) {
      for (const ring of part.rings) {
        expect(ring.length).toBeGreaterThanOrEqual(4);
        expect(ring[0]).toEqual(ring[ring.length - 1]);
        for (const [lng, lat] of ring) {
          expect(lng).toBeGreaterThan(-1);
          expect(lng).toBeLessThan(0);
          expect(lat).toBeGreaterThan(38);
          expect(lat).toBeLessThan(39);
        }
      }
    }
  });

  it('центр попадает внутрь габаритов', () => {
    const [lng, lat] = footprint.center;
    expect(lng).toBeCloseTo(-0.48299, 3);
    expect(lat).toBeCloseTo(38.34503, 3);
  });

  it('пустой или чужой ответ — не исключение, а null', () => {
    expect(parseFootprint('<ExceptionReport/>', 'X')).toBeNull();
    expect(parseFootprint('', 'X')).toBeNull();
  });

  it('GeoJSON отдаёт высоту в свойствах каждой части', () => {
    const geo = footprintToGeoJson(footprint);
    expect(geo.features).toHaveLength(4);
    expect(geo.features[1].properties.height).toBe(heightFromFloors(6));
    expect(geo.features[0].geometry.coordinates[0][0]).toHaveLength(2);
  });
});

describe('ссылка на участок по координатам', () => {
  const ok = `<consulta_coordenadas><coord><pc><pc1>0072514</pc1><pc2>YH2407C</pc2></pc>
    <ldt>CL MIGUEL SOLER 8 ALICANTE/ALACANT (ALICANTE)</ldt></coord></consulta_coordenadas>`;

  it('склеивает половины ссылки', () => {
    expect(parseCadastralRef(ok)).toBe('0072514YH2407C');
    expect(parseCadastralAddress(ok)).toBe('CL MIGUEL SOLER 8 ALICANTE/ALACANT (ALICANTE)');
  });

  it('пустой ответ — точка вне участка, это не ошибка', () => {
    expect(parseCadastralRef('<consulta_coordenadas_distancias><coordd/></consulta_coordenadas_distancias>')).toBeNull();
    expect(parseCadastralAddress('<coordd/>')).toBeNull();
  });

  it('мусор вместо ссылки отбрасывается — иначе уйдёт в запрос к кадастру', () => {
    expect(parseCadastralRef('<pc1>007</pc1><pc2>YH</pc2>')).toBeNull();
    expect(parseCadastralRef('<pc1>0072514</pc1><pc2>yh2407c</pc2>')).toBeNull();
  });
});

describe('центр пустого набора', () => {
  it('не ломается на здании без колец', () => {
    expect(ringsCenter([])).toEqual([0, 0]);
  });
});
