'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Search } from '@/components/ui/icons';
import type { Mode } from '@/lib/types';
import { c } from '@/lib/theme';

const MODES: { key: Mode; label: string }[] = [
  { key: 'buy', label: 'Купить' },
  { key: 'rent', label: 'Снять' },
  { key: 'new', label: 'Новостройки' },
  { key: 'value', label: 'Оценить' },
];

const fieldBox: React.CSSProperties = {
  background: c.surface,
  borderRadius: 14,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const fieldLabel: React.CSSProperties = { fontSize: 12, color: c.grey, fontWeight: 500 };

export function HeroSearch({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const rent = mode === 'rent';

  const go = () => {
    if (mode === 'value') return router.push('/value');
    if (mode === 'new') return router.push('/new');
    const qs = new URLSearchParams({ mode });
    if (query.trim()) qs.set('q', query.trim());
    router.push(`/search?${qs}`);
  };

  return (
    <section style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 0' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 32,
          overflow: 'hidden',
          minHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: '#2A1F4A',
        }}
      >
        <img src="/img/hero-home.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(23,17,43,0) 25%,rgba(23,17,43,0.72) 100%)' }} />

        <div style={{ position: 'relative', padding: 48, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 780 }}>
            <span
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(23,17,43,0.78)',
                backdropFilter: 'blur(10px)',
                color: c.white,
                fontSize: 13,
                fontWeight: 500,
                padding: '7px 14px 7px 8px',
                borderRadius: 999,
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: 999, background: c.green, display: 'grid', placeItems: 'center' }}>
                <Check size={11} />
              </span>
              12 480 проверенных объектов на Коста-Бланке
            </span>

            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(40px,5.4vw,72px)',
                lineHeight: 1.02,
                letterSpacing: '-0.045em',
                fontWeight: 700,
                color: c.white,
                textWrap: 'balance',
              }}
            >
              Недвижимость в Испании без фейков и дублей
            </h1>
          </div>

          <div style={{ background: c.white, borderRadius: 22, padding: 8, boxShadow: '0 30px 60px -20px rgba(23,17,43,0.45)' }}>
            <div style={{ display: 'flex', gap: 4, padding: '6px 8px 10px', flexWrap: 'wrap' }}>
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onMode(m.key)}
                  style={{
                    border: 0,
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 15,
                    fontWeight: 600,
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: mode === m.key ? c.ink : 'transparent',
                    color: mode === m.key ? c.white : c.inkSoft,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 6 }}>
              <label style={{ ...fieldBox, gridColumn: 'span 2', minWidth: 0 }}>
                <span style={fieldLabel}>Где ищем</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && go()}
                  placeholder="Город, район или улица"
                  style={{ border: 0, outline: 0, font: 'inherit', fontSize: 16, color: c.ink, padding: 0, background: 'transparent', minWidth: 0 }}
                />
              </label>

              <div style={{ ...fieldBox, cursor: 'pointer' }}>
                <span style={fieldLabel}>Тип</span>
                <span style={{ fontSize: 16 }}>Квартира, дом</span>
              </div>
              <div style={{ ...fieldBox, cursor: 'pointer' }}>
                <span style={fieldLabel}>Цена</span>
                <span style={{ fontSize: 16 }}>{rent ? 'До 1 500 €/мес' : 'До 500 000 €'}</span>
              </div>
              <div style={{ ...fieldBox, cursor: 'pointer' }}>
                <span style={fieldLabel}>Спальни</span>
                <span style={{ fontSize: 16 }}>2+</span>
              </div>

              <button
                type="button"
                onClick={go}
                className="h-violet"
                style={{
                  border: 0,
                  background: c.violet,
                  color: c.white,
                  font: 'inherit',
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  minHeight: 60,
                }}
              >
                <Search size={18} />
                {rent ? 'Показать 2 140' : 'Показать 12 480'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
