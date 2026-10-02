'use client';

import Link from 'next/link';
import { useApp } from '@/components/providers/AppProviders';
import { monthlyPayment } from '@/components/home/MortgageCalculator';
import { NearbyListings } from '@/components/listing/NearbyListings';
import { OffersCompare } from '@/components/listing/OffersCompare';
import { PropertyMap } from '@/components/map/PropertyMap';
import { SavingsBadge } from '@/components/listing/SavingsBadge';
import { AgencyAvatar } from '@/components/ui/AgencyAvatar';
import { Check, Heart, MapPinIcon, Shield } from '@/components/ui/icons';
import type { Dictionary } from '@/i18n/getDictionary';
import { money } from '@/i18n/format';
import { LOCALE_TAGS, localePath, type Locale } from '@/i18n/locales';
import { discountLabel, toCard } from '@/lib/format';
import type { Listing, PropertyOffers, SimilarListing } from '@/lib/types';
import { c } from '@/lib/theme';

const h2: React.CSSProperties = { margin: 0, fontSize: 24, letterSpacing: '-0.03em', fontWeight: 700 };

/** В макете год без «г.» — убираем суффикс, который добавляет русская локаль Intl. */
const formatDate = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(LOCALE_TAGS[locale], { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(iso))
    .replace(/\s*г\.$/, '');

export function ListingScreen({
  dict,
  locale,
  listing,
  offers,
  nearby,
}: {
  dict: Dictionary;
  locale: Locale;
  listing: Listing;
  offers: PropertyOffers | null;
  nearby: SimilarListing[];
}) {
  const { isFavorite, toggleFavorite, openLogin } = useApp();
  const item = toCard(listing, 'buy', locale, dict);
  const fav = isFavorite(listing.id);

  // Ипотека «от» в боковой карточке: 70% стоимости на 25 лет.
  const { monthly } = monthlyPayment(listing.price, 30, 25);

  const facts = [
    { k: dict.listing.area, v: `${listing.area} ${dict.common.sqm}` },
    { k: dict.listing.bedrooms, v: String(listing.bedrooms) },
    { k: dict.listing.bathrooms, v: String(listing.bathrooms) },
    { k: dict.listing.yearBuilt, v: listing.yearBuilt ? String(listing.yearBuilt) : '—' },
    { k: dict.listing.toSea, v: listing.seaDistance ?? '—' },
  ];

  const verifyItems = [dict.listing.verify1, dict.listing.verify2, dict.listing.verify3, dict.listing.verify4];

  // Объединённая галерея объекта: снимки всех агентств. Если объект новый
  // и канонический набор ещё не собран, показываем набор этого объявления.
  const credits = offers?.media.credits ?? [];
  const gallery = credits.length
    ? credits.map((c) => c.url)
    : [listing.coverImage, ...listing.gallery];

  const creditByUrl = new Map(credits.map((c) => [c.url, c.agencyName]));
  const agenciesInGallery = new Set(credits.map((c) => c.agencyName)).size;

  return (
    <main>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 13, color: c.grey, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href={localePath(locale)} style={{ color: c.grey }}>
            {dict.common.home}
          </Link>
          <span>/</span>
          <Link href={localePath(locale, 'search')} style={{ color: c.grey }}>
            {dict.common.search}
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
              {dict.listing.share}
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
              {dict.listing.addToFavorites}
            </button>
          </div>
        </div>

        {creditByUrl.size > 0 && (
          <div style={{ fontSize: 13, color: c.grey }}>
            {dict.common.photoCredit.replace('{agency}', offers?.media.source ?? listing.agency.name)}
            {agenciesInGallery > 1 && ` · ${dict.common.photosFrom.replace('{n}', String(agenciesInGallery))}`}
          </div>
        )}

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
                textAlign: 'center',
                padding: 12,
              }}
            >
              {agenciesInGallery > 1
                ? dict.common.photosFrom.replace('{n}', String(agenciesInGallery))
                : dict.listing.morePhotos}
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
            <h2 style={h2}>{dict.listing.description}</h2>
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
                  <div style={{ fontSize: 19, fontWeight: 700, color: c.greenDark }}>{dict.listing.verifyTitle}</div>
                  <div style={{ fontSize: 14, color: c.greenMid }}>
                    {dict.listing.lastCheck} {listing.verifiedAt ? formatDate(listing.verifiedAt, locale) : '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
                {verifyItems.map((v) => (
                  <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: c.greenDark }}>
                    <Check size={18} color={c.green} width={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          {offers && (
            <OffersCompare data={offers} dict={dict} locale={locale} currentListingId={listing.id} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={h2}>{dict.listing.features}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {listing.features.map((f) => (
                <span key={f} style={{ border: `1px solid ${c.lineStrong}`, borderRadius: 999, padding: '8px 14px', fontSize: 14 }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {listing.lat != null && listing.lng != null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={h2}>{dict.listing.onMap}</h2>
              <div style={{ height: 340, borderRadius: 24, overflow: 'hidden', border: `1px solid ${c.line}` }}>
                <PropertyMap
                  variant="single"
                  propertyId={listing.propertyId}
                  mode="buy"
                  dict={dict}
                  locale={locale}
                  pins={[
                    {
                      id: listing.id,
                      slug: listing.slug,
                      title: listing.title,
                      address: listing.address,
                      price: listing.price,
                      lat: listing.lat,
                      lng: listing.lng,
                      kind: listing.kind,
                      bedrooms: listing.bedrooms,
                      area: listing.area,
                      coverImage: listing.coverImage,
                      verified: listing.verified,
                    },
                  ]}
                />
              </div>
            </div>
          )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                  {item.priceLabel}
                </span>
                {item.savings && <SavingsBadge savings={item.savings} dict={dict} />}
              </div>
              <div style={{ fontSize: 14, color: c.grey, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{item.subLabel}</div>
            </div>

            {/* Три строки вместо лозунга: обе цены и разница между ними.
                Обещание «дешевле рынка» должно быть проверяемым прямо здесь. */}
            {item.savings && item.marketLabel && (
              <div
                style={{
                  border: `1px solid ${c.line}`,
                  borderRadius: 16,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <Row label={dict.common.onCasaya} value={item.priceLabel} strong />
                <Row label={dict.common.marketPrice} value={item.marketLabel} strike />
                <div style={{ height: 1, background: c.lineSoft, margin: '2px 0' }} />
                <Row
                  label={dict.common.youSave}
                  value={`${money(item.savings.amount, locale)} · ${discountLabel(item.savings)}`}
                  accent
                />
                <p style={{ fontSize: 12, color: c.grey, margin: 0, lineHeight: 1.45 }}>
                  {dict.common.belowMarketLead}
                </p>
              </div>
            )}

            <div style={{ background: c.greenTint, borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: c.greenMid }}>{dict.listing.mortgageFrom}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: c.greenDark, fontVariantNumeric: 'tabular-nums' }}>
                {money(monthly, locale)} {dict.common.perMonth}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <AgencyAvatar
                name={listing.agency.name}
                initials={item.agentInitials}
                brandColor={listing.agency.brandColor}
                logoUrl={listing.agency.logoUrl}
                size={44}
                radius={12}
                fontSize={15}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{listing.agency.name}</div>
                <div style={{ fontSize: 13, color: c.green, fontWeight: 500 }}>
                  {listing.agency.verified ? `${dict.listing.agencyVerified} · ` : ''}
                  {dict.listing.repliesIn} {listing.agency.replyTime} {dict.listing.minutes}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openLogin}
              className="h-violet"
              style={{ border: 0, background: c.violet, color: c.white, font: 'inherit', fontSize: 16, fontWeight: 600, padding: 15, borderRadius: 14, cursor: 'pointer' }}
            >
              {dict.listing.showPhone}
            </button>
            <button
              type="button"
              onClick={openLogin}
              className="h-soft"
              style={{ border: `1px solid ${c.lineStrong}`, background: c.white, color: c.ink, font: 'inherit', fontSize: 16, fontWeight: 600, padding: 14, borderRadius: 14, cursor: 'pointer' }}
            >
              {dict.listing.sendMessage}
            </button>
          </div>

          <div style={{ background: c.coralTint, borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{dict.listing.viewingTitle}</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: '#6B4A40' }}>
              {dict.listing.viewingText}
            </div>
            <Link
              href={localePath(locale, 'services')}
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
              {dict.listing.viewingCta}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

/** Строка блока «сколько экономит покупатель»: подпись слева, число справа. */
function Row({
  label,
  value,
  strong = false,
  strike = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  strike?: boolean;
  accent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{ fontSize: 14, color: accent ? c.greenText : c.grey }}>{label}</span>
      <span
        style={{
          fontSize: strong || accent ? 17 : 15,
          fontWeight: strong || accent ? 700 : 500,
          color: accent ? c.greenText : strike ? c.grey : c.ink,
          textDecoration: strike ? 'line-through' : undefined,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
