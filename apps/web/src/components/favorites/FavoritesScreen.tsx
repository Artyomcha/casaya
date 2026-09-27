'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ListingCard } from '@/components/listing/ListingCard';
import { useApp } from '@/components/providers/AppProviders';
import { Heart } from '@/components/ui/icons';
import { toCard } from '@/lib/format';
import type { Listing } from '@/lib/types';
import { c } from '@/lib/theme';

export function FavoritesScreen({ listings }: { listings: Listing[] }) {
  const { favorites } = useApp();

  const cards = useMemo(
    () => listings.filter((l) => favorites.includes(l.id)).map((l) => toCard(l, 'buy')),
    [listings, favorites],
  );

  return (
    <main>
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px 0' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(32px,3.6vw,46px)', letterSpacing: '-0.045em', fontWeight: 700 }}>Избранное</h1>

        {!cards.length ? (
          <div
            style={{
              marginTop: 28,
              background: c.surface,
              borderRadius: 28,
              padding: '64px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              textAlign: 'center',
            }}
          >
            <span style={{ width: 64, height: 64, borderRadius: 20, background: c.white, display: 'grid', placeItems: 'center' }}>
              <Heart size={28} stroke={c.coral} />
            </span>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Здесь пока пусто</div>
            <div style={{ fontSize: 15, color: c.muted, maxWidth: 380, lineHeight: 1.55 }}>
              Нажмите на сердце на карточке объекта, чтобы сохранить его и получать уведомления о снижении цены.
            </div>
            <Link
              href="/search"
              className="h-violet"
              style={{
                border: 0,
                background: c.violet,
                color: c.white,
                font: 'inherit',
                fontSize: 15,
                fontWeight: 600,
                padding: '13px 22px',
                borderRadius: 14,
                cursor: 'pointer',
                marginTop: 6,
              }}
            >
              Перейти к поиску
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '28px 20px', marginTop: 28 }}>
            {cards.map((item) => (
              <ListingCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
