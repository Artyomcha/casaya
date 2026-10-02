'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { LngLatBoundsLike, Map as MlMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import type { Dictionary } from '@/i18n/getDictionary';
import { money } from '@/i18n/format';
import type { Locale } from '@/i18n/locales';
import { propertyFootprint } from '@/lib/api';
import { Google3DMap } from './Google3DMap';
import { GOOGLE_KEY } from './googleMaps';
import { pinLabel, specsOf } from '@/lib/format';
import type { Footprint, MapPin, Mode } from '@/lib/types';
import {
  ATTRIBUTION,
  BASEMAP_STYLE,
  CAMERA,
  COSTA_DEL_SOL,
  FOOTPRINT_ATTRIBUTION,
  FOOTPRINT_SOURCE,
  SKY,
  TERRAIN_SOURCE,
  WORKER_URL,
  buildingLayer,
  footprintLayer,
  footprintOutlineLayer,
  terrainSource,
} from './mapStyle';

// Воркер тайлов отдаём статикой из public: бандлер его не эмитит,
// и без этого карта остаётся пустой (см. scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl(WORKER_URL);

interface Props {
  pins: MapPin[];
  mode: Mode;
  dict: Dictionary;
  locale: Locale;
  /** Подсвеченный объект — синхронизируется с наведением на карточку выдачи. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  favorites?: string[];
  /** single — одна метка без попапа и без автоподгонки границ. */
  variant?: 'search' | 'single';
  /** Объект в базе: по нему подтягивается контур дома из кадастра. */
  propertyId?: string | null;
  height?: string | number;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  );

/** Мини-карточка в попапе — та же вёрстка, что у карточки выдачи, только компактнее. */
function popupHtml(pin: MapPin, mode: Mode, dict: Dictionary, locale: Locale): string {
  const rent = Math.round((pin.price * 0.0045) / 10) * 10;
  const price =
    mode === 'rent'
      ? `${money(rent, locale)} ${dict.common.perMonth}`
      : money(pin.price, locale);
  const specs = specsOf({ bedrooms: pin.bedrooms, area: pin.area, bathrooms: 0 }, dict)
    .split(' · ')
    .slice(0, 2)
    .join(' · ');

  return `
    <a href="/listing/${encodeURIComponent(pin.slug)}" style="display:block;width:232px;color:inherit;text-decoration:none">
      <div style="position:relative;height:130px;background:#F4F1FE">
        <img src="${escapeHtml(pin.coverImage)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">
        ${
          pin.verified
            ? `<span style="position:absolute;top:10px;left:10px;display:flex;align-items:center;gap:5px;background:#FFFFFF;color:#0E7A5A;font-size:11px;font-weight:600;padding:4px 9px 4px 5px;border-radius:999px">
                 <span style="width:14px;height:14px;border-radius:999px;background:#16A37A;display:grid;place-items:center">
                   <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>
                 </span>${escapeHtml(dict.common.verified)}
               </span>`
            : ''
        }
      </div>
      <div style="padding:12px 14px 14px;font-family:var(--font-geist),system-ui,sans-serif">
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.025em;font-variant-numeric:tabular-nums;color:#17112B">${price}</div>
        <div style="font-size:13px;color:#4B4560;margin-top:3px">${escapeHtml(specs)}</div>
        <div style="font-size:13px;color:#7C7690;margin-top:2px">${escapeHtml(pin.address)}</div>
      </div>
    </a>`;
}

/**
 * Объём добавляется после load: в готовом стиле OpenFreeMap нужно встать
 * ниже подписей, иначе названия улиц уезжают под дома.
 */
function addVolume(instance: MlMap) {
  if (!instance.getSource(TERRAIN_SOURCE)) {
    instance.addSource(TERRAIN_SOURCE, terrainSource);
  }
  // exaggeration 1 — реальный рельеф: на Коста-дель-Соль горы и так выразительные.
  instance.setTerrain({ source: TERRAIN_SOURCE, exaggeration: 1 });
  instance.setSky(SKY);

  const firstLabel = instance.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
  if (!instance.getLayer(buildingLayer.id)) {
    instance.addLayer(buildingLayer as never, firstLabel);
  }
}

/**
 * Карта объектов. Если задан ключ Google — показываем фотореалистичный 3D-город
 * из Photorealistic 3D Tiles; без ключа портал работает на бесплатной
 * векторной подложке с теми же объёмными домами и теми же метками.
 */
export function PropertyMap(props: Props) {
  const [googleFailed, setGoogleFailed] = useState(false);
  if (GOOGLE_KEY && !googleFailed && props.pins.length) {
    return (
      <Google3DMap
        pins={props.pins}
        mode={props.mode}
        locale={props.locale}
        variant={props.variant}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        favorites={props.favorites}
        height={props.height}
        onFail={() => setGoogleFailed(true)}
      />
    );
  }
  return <VectorMap {...props} />;
}

function VectorMap({
  pins,
  mode,
  dict,
  locale,
  selectedId,
  onSelect,
  favorites = [],
  variant = 'search',
  propertyId = null,
  height = '100%',
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
  const popup = useRef<Popup | null>(null);
  // Колбэк в ref, чтобы пересоздание функции в родителе не перестраивало метки.
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [footprint, setFootprint] = useState<Footprint | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const camera = variant === 'single' ? CAMERA.single : CAMERA.search;

    const instance = new maplibregl.Map({
      container: container.current,
      style: BASEMAP_STYLE,
      center: pins[0] ? [pins[0].lng, pins[0].lat] : COSTA_DEL_SOL.center,
      zoom: variant === 'single' ? CAMERA.single.zoom : COSTA_DEL_SOL.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      maxPitch: 80,
      attributionControl: false,
      // Скролл страницы важнее зума: карта приближается только с Cmd/Ctrl.
      cooperativeGestures: variant === 'search',
    });

    // Падение тайлов не должно быть тихим: без подложки карта выглядит сломанной.
    instance.on('error', (e) => console.error('[casaya:map]', e.error?.message ?? e));
    // style.load, а не load: объём нужен сразу после разбора стиля,
    // а load ждёт загрузки всех тайлов и на плотном городе приходит поздно.
    instance.on('style.load', () => addVolume(instance));
    // visualizePitch — компас показывает наклон и одним кликом возвращает вид сверху.
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right',
    );
    instance.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: ATTRIBUTION }));
    instance.on('click', () => selectRef.current?.(null));

    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      markers.current.clear();
    };
  }, [variant, pins]);

  // Контур дома из кадастра — только для карточки объекта, один запрос на объект.
  useEffect(() => {
    if (variant !== 'single' || !propertyId) {
      setFootprint(null);
      return;
    }
    let alive = true;
    propertyFootprint(propertyId)
      .then((data) => alive && setFootprint(data.found ? data : null))
      .catch(() => alive && setFootprint(null));
    return () => {
      alive = false;
    };
  }, [variant, propertyId]);

  // Подсветка дома: источник добавляется, когда контур пришёл, и снимается с ним же.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const apply = () => {
      const geojson = footprint?.geojson;
      if (!geojson) {
        for (const id of [footprintLayer.id, footprintOutlineLayer.id]) {
          if (instance.getLayer(id)) instance.removeLayer(id);
        }
        if (instance.getSource(FOOTPRINT_SOURCE)) instance.removeSource(FOOTPRINT_SOURCE);
        return;
      }
      const source = instance.getSource(FOOTPRINT_SOURCE);
      if (source) {
        (source as maplibregl.GeoJSONSource).setData(geojson as never);
      } else {
        instance.addSource(FOOTPRINT_SOURCE, {
          type: 'geojson',
          data: geojson as never,
          attribution: FOOTPRINT_ATTRIBUTION,
        });
      }
      if (!instance.getLayer(footprintLayer.id)) instance.addLayer(footprintLayer as never);
      if (!instance.getLayer(footprintOutlineLayer.id)) instance.addLayer(footprintOutlineLayer as never);
      // Координаты объявления указывают на район, кадастр — на дом: верим кадастру.
      if (footprint?.center) instance.easeTo({ center: footprint.center, duration: 600 });
    };

    if (instance.isStyleLoaded()) apply();
    else instance.once('style.load', apply);
  }, [footprint]);

  // Метки перестраиваются при смене набора объектов или режима (цена другая).
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    markers.current.forEach(({ marker }) => marker.remove());
    markers.current.clear();
    popup.current?.remove();

    for (const pin of pins) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'casaya-pin';
      el.textContent = variant === 'single' ? money(pin.price, locale) : pinLabel(pin.price, mode, locale);
      el.setAttribute('aria-label', `${pin.title}, ${pin.address}`);

      if (variant === 'search') {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          selectRef.current?.(pin.id);
          popup.current?.remove();
          popup.current = new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: '260px' })
            .setLngLat([pin.lng, pin.lat])
            .setHTML(popupHtml(pin, mode, dict, locale))
            .addTo(instance);
        });
        el.addEventListener('mouseenter', () => selectRef.current?.(pin.id));
      }

      markers.current.set(
        pin.id,
        {
          marker: new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -5] })
            .setLngLat([pin.lng, pin.lat])
            .addTo(instance),
          el,
        },
      );
    }

    if (variant === 'search' && pins.length) {
      const bounds = pins.reduce(
        (acc, p) => acc.extend([p.lng, p.lat]),
        new maplibregl.LngLatBounds([pins[0].lng, pins[0].lat], [pins[0].lng, pins[0].lat]),
      );
      instance.fitBounds(bounds as LngLatBoundsLike, {
        padding: 72,
        maxZoom: CAMERA.search.maxZoom,
        pitch: CAMERA.search.pitch,
        bearing: CAMERA.search.bearing,
        duration: 0,
      });
    }
  }, [pins, mode, variant, dict, locale]);

  // Подсветка выбранной метки — без пересоздания маркеров.
  useEffect(() => {
    markers.current.forEach(({ el }, id) => {
      el.classList.toggle('casaya-pin--active', id === selectedId);
      el.classList.toggle('casaya-pin--fav', favorites.includes(id));
    });
  }, [selectedId, favorites, pins]);

  return <div ref={container} style={{ width: '100%', height }} />;
}
