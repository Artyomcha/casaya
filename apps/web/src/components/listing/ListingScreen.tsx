'use client';

import Link from 'next/link';
import { useApp } from '@/components/providers/AppProviders';
import { monthlyPayment } from '@/components/home/MortgageCalculator';
import { Check, Heart, MapPinIcon, Shield } from '@/components/ui/icons';
import { fmt, toCard } from '@/lib/format';
import type { Listing } from '@/lib/types';
import { c } from '@/lib/theme';

const VERIFY_ITEMS = [
  'Видео-тур снят по чек-листу',
  'Nota simple: собственник совпадает',
  'Обременений нет',
  'Личность агента подтверждена',
];

const MAP_SRC =
  'https://www.openstreetmap.org/export/embed.html?bbox=-0.52%2C38.33%2C-0.44%2C38.38&layer=mapnik';

const h2: React.CSSProperties = { margin: 0, fontSize: 24, letterSpacing: '-0.03em', fontWeight: 700 };

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/** В макете год без «г.» — убираем суффикс, который добавляет Intl. */
const formatDate = (iso: string) => dateFormatter.format(new Date(iso)).replace(/\s*г\.$/, '');

export function ListingScreen({ listing }: { listing: Listing }) {
  const { isFavorite, toggleFavorite, openLogin } = useApp();
  const item = toCard(listing, 'buy');
  const fav = isFavorite(listing.id);

  // Ипотека «от» в боковой карточке: 70% стоимости на 25 лет.
  const { monthly } = monthlyPayment(listing.price, 30, 25);

  const facts = [
    { k: 'Площадь', v: `${listing.area} м²` },
    { k: 'Спальни', v: String(listing.bedrooms) },
    { k: 'Ванные', v: String(listing.bathrooms) },
    { k: 'Год постройки', v: listing.yearBuilt ? String(listing.yearBuilt) : '—' },
    { k: 'До моря', v: listing.seaDistance ?? '—' },
  ];

  const gallery = [listing.coverImage, ...listing.gallery];

  return (
    <main>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 13, color: c.grey, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: c.grey }}>
            Главная
          </Link>
          <span>/</span>
          <Link href="/search" style={{ color: c.grey }}>
            Поиск
          </Link>
          <span>/</span>
          <span style={{ color: c.ink }}>{listing.title}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px,3vw,38px)', letterSpacing: '-0.04em', fontWeight: 700 }}>{listing.title}</h1>
            <div style={{ fontSize: 15, color: c.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPinIcon size={16} />
              {listing.address}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="h-soft"
              onClick={() => navigator.share?.({ title: listing.title, url: window.location.href }).catch(() => {})}
              style={{ border: `1px solid ${c.lineStrong}`, background: c.white, font: 'inherit', fontSize: 14, fontWeight: 500, padding: '10px 14px', borderRadius: 12, cursor: 'pointer' }}
            >
              Поделиться
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(listing.id)}
              className="h-soft"
              style={{
                border: `1px solid ${c.lineStrong}`,
                background: c.white,
                font: 'inherit',
                fontSize: 14,
                fontWeight: 500,
                padding: '10px 14px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <Heart size={16} fill={fav ? c.coral : 'none'} stroke={fav ? c.coral : c.ink} />
              В избранное
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gridTemplateRows: '240px 240px',
            gap: 8,
            borderRadius: 24,
            overflow: 'hidden',
          }}
        >
          <img src={gallery[0]} alt="" style={{ gridRow: 'span 2', width: '100%', height: '100%', objectFit: 'cover' }} />
          {gallery.slice(1, 4).map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ))}
          <div style={{ position: 'relative' }}>
            <img src={gallery[4] ?? gallery[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(23,17,43,0.5)',
                color: c.white,
                display: 'grid',
                placeItems: 'center',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              + 18 фото · видео-тур
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '32px 32px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 40, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
            {facts.map((f) => (
              <div key={f.k} style={{ background: c.surface, borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, color: c.grey }}>{f.k}</div>
                <div style={{ fontSize: 19, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{f.v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={h2}>Описание</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: c.inkSoft, maxWidth: 720, textWrap: 'pretty' }}>{listing.description}</p>
          </div>

          {listing.verified && (
            <div
              style={{
                border: '1px solid #CFEEDF',
                background: '#F2FBF7',
                borderRadius: 24,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: c.green, display: 'grid', placeItems: 'center' }}>
                  <Shield size={20} />
                </span>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: c.greenDark }}>Объект проверен Casaya Verify</div>
                  <div style={{ fontSize: 14, color: c.greenMid }}>
                    Последняя проверка: {listing.verifiedAt ? formatDate(listing.verifiedAt) : '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
                {VERIFY_ITEMS.map((v) => (
                  <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: c.greenDark }}>
                    <Check size={18} color={c.green} width={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={h2}>Удобства</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {listing.features.map((f) => (
                <span key={f} style={{ border: `1px solid ${c.lineStrong}`, borderRadius: 999, padding: '8px 14px', fontSize: 14 }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={h2}>На карте</h2>
            <div style={{ height: 340, borderRadius: 24, overflow: 'hidden', border: `1px solid ${c.line}` }}>
              <iframe src={MAP_SRC} style={{ border: 0, width: '100%', height: '100%', filter: 'saturate(0.55)' }} title="Карта" />
            </div>
          </div>
        </div>

        <aside style={{ position: 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              border: `1px solid ${c.line}`,
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 24px 48px -24px rgba(45,20,110,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              background: c.white,
            }}
          >
            <div>
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{item.priceLabel}</div>
              <div style={{ fontSize: 14, color: c.grey, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{item.subLabel}</div>
            </div>

            <div style={{ background: c.greenTint, borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: c.greenMid }}>Ипотека от</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: c.greenDark, fontVariantNumeric: 'tabular-nums' }}>{fmt(monthly)} / мес</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: listing.agency.brandColor,
                  color: c.white,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {item.agentInitials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{listing.agency.name}</div>
                <div style={{ fontSize: 13, color: c.green, fontWeight: 500 }}>
                  {listing.agency.verified ? 'Агентство проверено · ' : ''}отвечает за {listing.agency.replyTime} мин
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openLogin}
              className="h-violet"
              style={{ border: 0, background: c.violet, color: c.white, font: 'inherit', fontSize: 16, fontWeight: 600, padding: 15, borderRadius: 14, cursor: 'pointer' }}
            >
              Показать телефон
            </button>
            <button
              type="button"
              onClick={openLogin}
              className="h-soft"
              style={{ border: `1px solid ${c.lineStrong}`, background: c.white, color: c.ink, font: 'inherit', fontSize: 16, fontWeight: 600, padding: 14, borderRadius: 14, cursor: 'pointer' }}
            >
              Написать сообщение
            </button>
          </div>

          <div style={{ background: c.coralTint, borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Видео-осмотр по запросу</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: '#6B4A40' }}>
              Местный эксперт снимет объект по чек-листу: влажность, шум, район вечером.
            </div>
            <Link
              href="/services"
              className="h-coral"
              style={{
                alignSelf: 'flex-start',
                border: 0,
                background: c.coral,
                color: c.white,
                font: 'inherit',
                fontSize: 15,
                fontWeight: 600,
                padding: '12px 18px',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Заказать за 49 €
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
