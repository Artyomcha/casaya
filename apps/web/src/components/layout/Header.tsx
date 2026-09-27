'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/components/providers/AppProviders';
import { Check, Chevron, Globe, Heart, Logo, Plus } from '@/components/ui/icons';
import { c } from '@/lib/theme';

const NAV = [
  { label: 'Купить', href: '/search?mode=buy' },
  { label: 'Снять', href: '/search?mode=rent' },
  { label: 'Новостройки', href: '/new' },
];

const MORE = [
  { label: 'Ипотека', href: '/mortgage', d: 'Калькулятор и 14 банков' },
  { label: 'Оценка', href: '/value', d: 'Стоимость вашей недвижимости' },
  { label: 'Сервисы', href: '/services', d: 'NIE, юрист, задаток, перевод денег' },
  { label: 'Агентствам', href: '/pro', d: 'Casaya Pro и тарифы' },
];

const navButton: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  font: 'inherit',
  color: c.ink,
  padding: '9px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function Header() {
  const router = useRouter();
  const { favoritesCount, openLogin } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Меню «Ещё» закрывается по клику вне него — в макете оно тоже не липнет.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(14px) saturate(180%)',
        borderBottom: `1px solid ${c.line}`,
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '0 32px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <Link
          href="/"
          style={{
            border: 0,
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: c.ink,
            font: 'inherit',
            flexShrink: 0,
          }}
        >
          <Logo size={34} />
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1 }}>casaya</span>
        </Link>

        <nav
          style={{
            display: 'flex',
            gap: 4,
            fontSize: 15,
            fontWeight: 500,
            flex: '0 0 auto',
            height: 72,
            alignItems: 'center',
            flexWrap: 'nowrap',
          }}
        >
          {NAV.map((n) => (
            <div key={n.label} style={{ height: 72, display: 'flex', alignItems: 'center' }}>
              <Link href={n.href} className="h-soft" style={navButton}>
                {n.label}
              </Link>
            </div>
          ))}
        </nav>

        <div ref={moreRef} style={{ position: 'relative', flexShrink: 0, marginLeft: -28 }}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="h-soft"
            style={{
              ...navButton,
              background: moreOpen ? c.surfaceAlt : 'transparent',
              fontSize: 15,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Ещё
            <Chevron size={14} />
          </button>

          {moreOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                left: 0,
                minWidth: 260,
                background: c.white,
                border: `1px solid ${c.line}`,
                borderRadius: 18,
                padding: 8,
                boxShadow: '0 24px 48px -16px rgba(23,17,43,0.22)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                zIndex: 40,
              }}
            >
              {MORE.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setMoreOpen(false)}
                  className="h-soft"
                  style={{
                    border: 0,
                    background: 'transparent',
                    font: 'inherit',
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: c.ink }}>{m.label}</span>
                  <span style={{ fontSize: 13, color: c.grey }}>{m.d}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>
          <button
            type="button"
            className="h-soft"
            style={{
              border: 0,
              background: 'transparent',
              font: 'inherit',
              fontSize: 14,
              fontWeight: 500,
              color: c.ink,
              padding: '9px 10px',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Globe size={18} />
            RU
          </button>

          <Link
            href="/favorites"
            className="h-soft"
            style={{
              border: 0,
              background: 'transparent',
              width: 40,
              height: 40,
              borderRadius: 10,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
            }}
          >
            <Heart size={20} />
            {favoritesCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 3,
                  minWidth: 17,
                  height: 17,
                  borderRadius: 999,
                  background: c.coral,
                  color: c.white,
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'grid',
                  placeItems: 'center',
                  padding: '0 4px',
                }}
              >
                {favoritesCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openLogin}
            className="h-soft"
            style={{
              border: 0,
              background: 'transparent',
              font: 'inherit',
              fontSize: 15,
              fontWeight: 500,
              color: c.ink,
              padding: '10px 14px',
              cursor: 'pointer',
              borderRadius: 10,
            }}
          >
            Войти
          </button>

          <button
            type="button"
            onClick={() => router.push('/post')}
            className="h-violet"
            style={{
              border: 0,
              background: c.violet,
              color: c.white,
              font: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Plus size={16} />
            Разместить
          </button>
        </div>
      </div>
    </header>
  );
}

/** Бейдж Verificado — один и тот же во всех выдачах, отличается только масштабом. */
export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  const dot = compact ? 15 : 16;
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: c.white,
        color: c.greenText,
        fontSize: 12,
        fontWeight: 600,
        padding: compact ? '4px 9px 4px 5px' : '5px 10px 5px 6px',
        borderRadius: 999,
      }}
    >
      <span style={{ width: dot, height: dot, borderRadius: 999, background: c.green, display: 'grid', placeItems: 'center' }}>
        <Check size={compact ? 9 : 10} width={3.4} />
      </span>
      Verificado
    </span>
  );
}
