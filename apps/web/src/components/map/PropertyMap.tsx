'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { LngLatBoundsLike, Map as MlMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import { fmt, pinLabel, specsOf } from '@/lib/format';
import type { MapPin, Mode } from '@/lib/types';
import { ATTRIBUTION, BASEMAP_STYLE, COSTA_BLANCA, WORKER_URL } from './mapStyle';

// Воркер тайлов отдаём статикой из public: бандлер его не эмитит,
// и без этого карта остаётся пустой (см. scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl(WORKER_URL);

interface Props {
  pins: MapPin[];
  mode: Mode;
  /** Подсвеченный объект — синхронизируется с наведением на карточку выдачи. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  favorites?: string[];
  /** single — одна метка без попапа и без автоподгонки границ. */
  variant?: 'search' | 'single';
  height?: string | number;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  );

/** Мини-карточка в попапе — та же вёрстка, что у карточки выдачи, только компактнее. */
function popupHtml(pin: MapPin, mode: Mode): string {
  const price = mode === 'rent' ? `${fmt(Math.round((pin.price * 0.0045) / 10) * 10)} / мес` : fmt(pin.price);
  const specs = specsOf({ bedrooms: pin.bedrooms, area: pin.area, bathrooms: 0 })
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
                 </span>Verificado
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

export function PropertyMap({
  pins,
  mode,
  selectedId,
  onSelect,
  favorites = [],
  variant = 'search',
  height = '100%',
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
  const popup = useRef<Popup | null>(null);
  // Колбэк в ref, чтобы пересоздание функции в родителе не перестраивало метки.
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = new maplibregl.Map({
      container: container.current,
      style: BASEMAP_STYLE,
      center: pins[0] ? [pins[0].lng, pins[0].lat] : COSTA_BLANCA.center,
      zoom: variant === 'single' ? 14 : COSTA_BLANCA.zoom,
      attributionControl: false,
      // Скролл страницы важнее зума: карта приближается только с Cmd/Ctrl.
      cooperativeGestures: variant === 'search',
    });

    // Падение тайлов не должно быть тихим: без подложки карта выглядит сломанной.
    instance.on('error', (e) => console.error('[casaya:map]', e.error?.message ?? e));
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    instance.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: ATTRIBUTION }));
    instance.on('click', () => selectRef.current?.(null));

    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      markers.current.clear();
    };
  }, [variant, pins]);

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
      el.style.position = 'relative';
      el.textContent = variant === 'single' ? fmt(pin.price) : pinLabel(pin.price, mode);
      el.setAttribute('aria-label', `${pin.title}, ${pin.address}`);

      if (variant === 'search') {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          selectRef.current?.(pin.id);
          popup.current?.remove();
          popup.current = new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: '260px' })
            .setLngLat([pin.lng, pin.lat])
            .setHTML(popupHtml(pin, mode))
            .addTo(instance);
        });
        el.addEventListener('mouseenter', () => selectRef.current?.(pin.id));
      }

      markers.current.set(
        pin.id,
        { marker: new maplibregl.Marker({ element: el }).setLngLat([pin.lng, pin.lat]).addTo(instance), el },
      );
    }

    if (variant === 'search' && pins.length) {
      const bounds = pins.reduce(
        (acc, p) => acc.extend([p.lng, p.lat]),
        new maplibregl.LngLatBounds([pins[0].lng, pins[0].lat], [pins[0].lng, pins[0].lat]),
      );
      instance.fitBounds(bounds as LngLatBoundsLike, { padding: 72, maxZoom: 12.5, duration: 0 });
    }
  }, [pins, mode, variant]);

  // Подсветка выбранной метки — без пересоздания маркеров.
  useEffect(() => {
    markers.current.forEach(({ el }, id) => {
      el.classList.toggle('casaya-pin--active', id === selectedId);
      el.classList.toggle('casaya-pin--fav', favorites.includes(id));
    });
  }, [selectedId, favorites, pins]);

  return <div ref={container} style={{ width: '100%', height }} />;
}
