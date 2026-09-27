'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ListingRow } from '@/components/listing/ListingRow';
import { PropertyMap } from '@/components/map/PropertyMap';
import { useApp } from '@/components/providers/AppProviders';
import { Check, Chevron } from '@/components/ui/icons';
import { groupDigits, toCard } from '@/lib/format';
import type { Listing, MapPin, Mode } from '@/lib/types';
import { c } from '@/lib/theme';

const QUICK_FILTERS = ['Цена', 'Спальни', 'Площадь', 'Тип', 'Ещё фильтры'];

const MODES: { key: Exclude<Mode, 'value'>; label: string }[] = [
  { key: 'buy', label: 'Купить' },
  { key: 'rent', label: 'Снять' },
  { key: 'new', label: 'Новостройки' },
];

export function SearchScreen({
  listings,
  pins,
  mode,
  query,
}: {
  listings: Listing[];
  pins: MapPin[];
  mode: Mode;
  query: string;
}) {
  const router = useRouter();
  const { favorites } = useApp();
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const rent = mode === 'rent';
  const visible = useMemo(
    () => (verifiedOnly ? listings.filter((l) => l.verified) : listings),
    [listings, verifiedOnly],
  );
  const cards = useMemo(() => visible.map((l) => toCard(l, mode)), [visible, mode]);

  // Карта показывает ровно то, что в выдаче: фильтр «Только Verificado» действует на оба списка.
  const visiblePins = useMemo(() => {
    const ids = new Set(visible.map((l) => l.id));
    return pins.filter((p) => ids.has(p.id));
  }, [pins, visible]);

  const setMode = (next: string) => {
    if (next === 'new') return router.push('/new');
    const qs = new URLSearchParams({ mode: next });
    if (query) qs.set('q', query);
    router.push(`/search?${qs}`);
  };

  const title =
    (rent ? 'Снять жильё в Аликанте' : 'Купить недвижимость в Аликанте') +
    ` · ${groupDigits(cards.length * 156)} объектов`;

  return (
    <main>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, color: c.grey, display: 'flex', gap: 8 }}>
          <Link href="/" style={{ color: c.grey }}>
            Главная
          </Link>
          <span>/</span>
          <span>Аликанте</span>
          <span>/</span>
          <span style={{ color: c.ink }}>{rent ? 'Аренда' : 'Продажа'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(26px,3vw,36px)', letterSpacing: '-0.04em', fontWeight: 700 }}>{title}</h1>
          <div style={{ display: 'flex', gap: 6, background: c.surfaceAlt, borderRadius: 12, padding: 4 }}>
            {MODES.map((m) => {
              const active = m.key === mode;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  style={{
                    border: 0,
                    font: 'inherit',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '8px 14px',
                    borderRadius: 9,
                    cursor: 'pointer',
                    background: active ? c.white : 'transparent',
                    color: active ? c.ink : c.grey,
                    boxShadow: active ? '0 1px 3px rgba(23,17,43,0.12)' : 'none',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingBottom: 16,
            borderBottom: `1px solid ${c.line}`,
          }}
        >
          {QUICK_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="h-bd-violet"
              style={{
                border: `1px solid ${c.lineStrong}`,
                background: c.white,
                font: 'inherit',
                fontSize: 14,
                color: c.ink,
                padding: '9px 14px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f}
              <Chevron size={14} color={c.grey} width={2} />
            </button>
          ))}

          <button
            type="button"
            onClick={() => setVerifiedOnly((v) => !v)}
            style={{
              border: `1px solid ${verifiedOnly ? c.green : c.lineStrong}`,
              background: verifiedOnly ? c.greenTint : c.white,
              font: 'inherit',
              fontSize: 14,
              fontWeight: 500,
              color: verifiedOnly ? c.greenDark : c.ink,
              padding: '9px 14px',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: verifiedOnly ? c.green : '#D5D0E0',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Check size={11} width={3.4} />
            </span>
            Только Verificado
          </button>

          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 14, color: c.grey }}>
            Сортировка: <span style={{ color: c.ink, fontWeight: 500 }}>сначала новые</span>
          </span>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '20px 32px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,520px),1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cards.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setSelected(item.id)}
              onMouseLeave={() => setSelected(null)}
            >
              <ListingRow item={item} highlighted={item.id === selected} />
            </div>
          ))}
          {!cards.length && (
            <div style={{ background: c.surface, borderRadius: 22, padding: 32, fontSize: 15, color: c.muted }}>
              По этим условиям объектов не нашлось. Снимите фильтр «Только Verificado» или измените запрос.
            </div>
          )}
        </div>

        <div
          style={{
            position: 'sticky',
            top: 92,
            height: 'calc(100vh - 116px)',
            minHeight: 480,
            borderRadius: 24,
            overflow: 'hidden',
            border: `1px solid ${c.line}`,
            background: '#EEF0F4',
          }}
        >
          <PropertyMap
            pins={visiblePins}
            mode={mode}
            selectedId={selected}
            onSelect={setSelected}
            favorites={favorites}
          />
        </div>
      </div>
    </main>
  );
}
