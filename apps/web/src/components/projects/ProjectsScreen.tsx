'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Pills } from '@/components/ui/Segmented';
import { fmt } from '@/lib/format';
import type { Project } from '@/lib/types';
import { c } from '@/lib/theme';

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: '2026', label: 'Сдача 2026' },
  { key: '2027', label: 'Сдача 2027' },
  { key: '2028', label: 'Сдача 2028' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export function ProjectsScreen({ projects }: { projects: Project[] }) {
  const [year, setYear] = useState<FilterKey>('all');

  const visible = useMemo(
    () => (year === 'all' ? projects : projects.filter((p) => p.deliveryYear === year)),
    [projects, year],
  );

  return (
    <main>
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: c.greenText }}>Obra nueva</span>
        <h1 style={{ margin: 0, fontSize: 'clamp(34px,4.2vw,54px)', lineHeight: 1.04, letterSpacing: '-0.045em', fontWeight: 700 }}>
          Новостройки на Коста-Бланке
        </h1>
        <div style={{ marginTop: 6 }}>
          <Pills options={FILTERS.map((f) => ({ key: f.key, label: f.label }))} value={year} onChange={setYear} />
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '32px 32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,420px),1fr))', gap: 20 }}>
          {visible.map((p) => {
            const href = p.listings[0] ? `/listing/${p.listings[0].slug}` : '/search';
            return (
              <Link
                key={p.id}
                href={href}
                className="h-card-shadow"
                style={{
                  border: `1px solid ${c.line}`,
                  borderRadius: 26,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: c.white,
                  color: 'inherit',
                  display: 'block',
                }}
              >
                <div style={{ position: 'relative', height: 280, background: c.violetTintSoft }}>
                  <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <span
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      background: c.white,
                      color: c.greenText,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '6px 11px',
                      borderRadius: 999,
                    }}
                  >
                    {p.deliveryLabel}
                  </span>
                </div>

                <div style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em' }}>{p.name}</div>
                      <div style={{ fontSize: 14, color: c.grey, marginTop: 3 }}>{p.address}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: c.grey }}>от</div>
                      <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(p.priceFrom)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {p.specs.map((t) => (
                      <div key={t.k} style={{ background: c.surface, borderRadius: 12, padding: '10px 12px' }}>
                        <div style={{ fontSize: 12, color: c.grey }}>{t.k}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{t.v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 13, color: c.muted }}>
                    Застройщик: <span style={{ color: c.ink, fontWeight: 500 }}>{p.developer}</span> · {p.units}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
