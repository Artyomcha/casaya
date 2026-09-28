'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useApp } from '@/components/providers/AppProviders';
import { Check, Chevron, Heart, Logo, Plus } from '@/components/ui/icons';
import type { Dictionary } from '@/i18n/getDictionary';
import { localePath, type Locale } from '@/i18n/locales';
import { c } from '@/lib/theme';

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

export function Header({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const router = useRouter();
  const { favoritesCount, openLogin } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const href = (path: string) => localePath(locale, path);

  const nav = [
    { label: dict.nav.buy, href: href('search?mode=buy') },
    { label: dict.nav.rent, href: href('search?mode=rent') },
    { label: dict.nav.newBuild, href: href('new') },
  ];

  const more = [
    { label: dict.nav.mortgage, href: href('mortgage'), d: dict.nav.mortgageHint },
    { label: dict.nav.valuation, href: href('value'), d: dict.nav.valuationHint },
    { label: dict.nav.services, href: href('services'), d: dict.nav.servicesHint },
    { label: dict.nav.forAgencies, href: href('pro'), d: dict.nav.agenciesHint },
  ];

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
          href={href('')}
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
          {nav.map((n) => (
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
            {dict.nav.more}
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
              {more.map((m) => (
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
          <LanguageSwitcher locale={locale} label={dict.nav.language} />

          <Link
            href={href('favorites')}
            aria-label={dict.nav.favorites}
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
            {dict.nav.login}
          </button>

          <button
            type="button"
            onClick={() => router.push(href('post'))}
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
            {dict.nav.post}
          </button>
        </div>
      </div>
    </header>
  );
}

/** Бейдж Verificado — один и тот же во всех выдачах, отличается только масштабом. */
export function VerifiedBadge({ compact = false, label = 'Verificado' }: { compact?: boolean; label?: string }) {
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
      {label}
    </span>
  );
}
