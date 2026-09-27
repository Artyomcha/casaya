'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { HeroSearch } from '@/components/home/HeroSearch';
import { MortgageCalculator } from '@/components/home/MortgageCalculator';
import { ListingCard } from '@/components/listing/ListingCard';
import { Pills } from '@/components/ui/Segmented';
import { PathIcon } from '@/components/ui/icons';
import { groupDigits, toCard } from '@/lib/format';
import type { City, Listing, ListingFilter, Mode, ServiceOffer } from '@/lib/types';
import { c } from '@/lib/theme';

const CATEGORIES = [
  { href: '/search?mode=buy&filter=flat', t: 'Квартиры', n: '6 214 объектов', bg: c.violetTint, fg: c.violet, icon: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M2 21h20' },
  { href: '/search?mode=buy&filter=house', t: 'Дома и виллы', n: '3 480 объектов', bg: c.coralTint, fg: c.coralDark, icon: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5' },
  { href: '/new', t: 'Новостройки', n: '412 проектов', bg: c.greenTint, fg: c.greenText, icon: 'M3 21h18M6 21V8l6-4 6 4v13M10 12h4M10 16h4' },
  { href: '/search?mode=rent&filter=all', t: 'Аренда', n: '2 140 объектов', bg: c.blueTint, fg: c.blue, icon: 'M15 7a4 4 0 1 1-3.9 4.9L4 19v2h3v-2h2v-2h2l1.1-1.1A4 4 0 0 1 15 7Z' },
  { href: '/search?mode=buy&filter=sea', t: 'С видом на море', n: '1 906 объектов', bg: c.cyanTint, fg: c.cyan, icon: 'M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M12 3v8M8 7l4-4 4 4' },
  { href: '/search?filter=all', t: 'Коммерческая', n: '738 объектов', bg: c.amberTint, fg: c.amber, icon: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6' },
];

const FILTERS: { key: ListingFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'flat', label: 'Квартиры' },
  { key: 'house', label: 'Дома' },
  { key: 'sea', label: 'У моря' },
];

const CHECKS = [
  { n: '01', t: 'Видео-тур по чек-листу', d: 'Комнаты, вид из окна, подъезд и двор сняты по единому сценарию.' },
  { n: '02', t: 'Nota simple из Registro de la Propiedad', d: 'Право собственности и обременения по официальной выписке реестра.' },
  { n: '03', t: 'Подтверждённая личность', d: 'Владелец или агент проходит верификацию документов.' },
];

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(30px,3.4vw,42px)',
  lineHeight: 1.1,
  letterSpacing: '-0.04em',
  fontWeight: 700,
};

const sectionStyle: React.CSSProperties = { maxWidth: 1360, margin: '0 auto', padding: '96px 32px 0' };

export function HomeScreen({
  listings,
  cities,
  services,
}: {
  listings: Listing[];
  cities: City[];
  services: ServiceOffer[];
}) {
  const [mode, setMode] = useState<Mode>('buy');
  const [filter, setFilter] = useState<ListingFilter>('all');

  const cards = useMemo(() => {
    const matched = listings.filter((l) => {
      if (filter === 'all') return true;
      if (filter === 'sea') return l.seaView;
      return l.kind === (filter === 'flat' ? 'FLAT' : 'HOUSE');
    });
    return matched.map((l) => toCard(l, mode));
  }, [listings, filter, mode]);

  return (
    <main>
      <HeroSearch mode={mode} onMode={setMode} />

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.t}
              href={cat.href}
              className="h-lift"
              style={{
                border: 0,
                textAlign: 'left',
                font: 'inherit',
                cursor: 'pointer',
                background: cat.bg,
                borderRadius: 20,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 28,
                minHeight: 132,
                color: 'inherit',
              }}
            >
              <span style={{ width: 40, height: 40, borderRadius: 12, background: c.white, display: 'grid', placeItems: 'center', color: cat.fg }}>
                <PathIcon d={cat.icon} size={20} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: c.ink }}>{cat.t}</span>
                <span style={{ fontSize: 13, color: c.muted, fontVariantNumeric: 'tabular-nums' }}>{cat.n}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <h2 style={h2}>Свежие проверенные объекты</h2>
          <Pills options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '32px 20px', marginTop: 32 }}>
          {cards.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <Link
            href={`/search?mode=${mode === 'rent' ? 'rent' : 'buy'}`}
            className="h-soft"
            style={{
              border: `1px solid ${c.lineStrong}`,
              background: c.white,
              font: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              color: c.ink,
              padding: '14px 24px',
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            Показать все объекты
          </Link>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2}>Популярные направления</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginTop: 32 }}>
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/search?q=${encodeURIComponent(city.name)}`}
              style={{
                border: 0,
                padding: 0,
                font: 'inherit',
                textAlign: 'left',
                position: 'relative',
                height: 360,
                borderRadius: 24,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#2A1F4A',
                display: 'block',
              }}
            >
              <img src={city.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(23,17,43,0) 40%,rgba(23,17,43,0.78) 100%)' }} />
              <span
                style={{
                  position: 'absolute',
                  left: 24,
                  right: 24,
                  bottom: 22,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 12,
                  color: c.white,
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>{city.name}</span>
                  <span style={{ fontSize: 14, opacity: 0.86 }}>{groupDigits(city.listingsCount)} объектов</span>
                </span>
                <span
                  style={{
                    background: c.white,
                    color: c.ink,
                    borderRadius: 12,
                    padding: '8px 12px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {groupDigits(city.pricePerM2)} €/м²
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <div
          style={{
            background: c.violet,
            borderRadius: 32,
            padding: 'clamp(28px,5vw,64px)',
            color: c.white,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
            gap: 48,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: c.lilacText }}>Casaya Verify</span>
              <h2 style={{ ...h2, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.02, letterSpacing: '-0.045em', textWrap: 'balance' }}>
                Solo pisos reales. Каждый объект проверен.
              </h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: c.lilacBody, maxWidth: 460 }}>
                Бейдж Verificado получает объект, прошедший три проверки. Неактуальные объявления снимаются автоматически.
              </p>
            </div>
            <Link
              href="/services"
              className="h-lilac"
              style={{
                alignSelf: 'flex-start',
                border: 0,
                background: c.white,
                color: c.violetDeep,
                font: 'inherit',
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 22px',
                borderRadius: 14,
                cursor: 'pointer',
              }}
            >
              Как мы проверяем
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CHECKS.map((ch) => (
              <div
                key={ch.n}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 20,
                  padding: 24,
                  display: 'grid',
                  gridTemplateColumns: '48px minmax(0,1fr)',
                  gap: 18,
                }}
              >
                <span
                  className="mono"
                  style={{ width: 48, height: 48, borderRadius: 14, background: c.white, color: c.violet, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 500 }}
                >
                  {ch.n}
                </span>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>{ch.t}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.55, color: c.lilacBody, marginTop: 6 }}>{ch.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <MortgageCalculator variant="home" />
      </section>

      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <h2 style={{ ...h2, maxWidth: 640 }}>Сделка под ключ для покупателей из-за рубежа</h2>
          <Link href="/services" style={{ border: 0, background: 'transparent', font: 'inherit', fontSize: 15, fontWeight: 600, color: c.violet, cursor: 'pointer', padding: 0 }}>
            Все сервисы
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12, marginTop: 32 }}>
          {services.map((s) => (
            <Link
              key={s.id}
              href="/services"
              className="h-lift"
              style={{
                background: s.bg,
                borderRadius: 24,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 48,
                minHeight: 240,
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              <span style={{ width: 48, height: 48, borderRadius: 14, background: c.white, color: s.fg, display: 'grid', placeItems: 'center' }}>
                <PathIcon d={s.icon} size={22} />
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.fg }}>{s.brand}</div>
                <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 6, color: c.ink }}>{s.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: c.inkSoft, marginTop: 6 }}>{s.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <div
          style={{
            background: c.ink,
            borderRadius: 32,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
            color: c.white,
          }}
        >
          <div style={{ padding: 'clamp(28px,5vw,64px)', display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: c.lilac }}>Casaya Pro · для агентств</span>
            <h2 style={{ ...h2, fontSize: 'clamp(30px,3.6vw,46px)', lineHeight: 1.05 }}>
              Подключите CRM-фид за 15 минут. Бесплатно 12 месяцев.
            </h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#B5AECB', maxWidth: 460 }}>
              Inmovilla, Witei, Mobilia и другие CRM. Отклики только от покупателей с верифицированным профилем.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              <Link
                href="/pro"
                className="h-violet-light"
                style={{ border: 0, background: c.violet, color: c.white, font: 'inherit', fontSize: 15, fontWeight: 600, padding: '14px 22px', borderRadius: 14, cursor: 'pointer' }}
              >
                Подключить агентство
              </Link>
              <Link
                href="/pro#tariffs"
                className="h-ink"
                style={{ border: '1px solid #3A3158', background: 'transparent', color: c.white, font: 'inherit', fontSize: 15, fontWeight: 500, padding: '14px 22px', borderRadius: 14, cursor: 'pointer' }}
              >
                Тарифы
              </Link>
            </div>
          </div>
          <div style={{ position: 'relative', minHeight: 380 }}>
            <img src="/img/pro-cta.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>
    </main>
  );
}
