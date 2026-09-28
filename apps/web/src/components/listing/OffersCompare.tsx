import { AdBadge } from '@/components/listing/AdBadge';
import { AgencyAvatar } from '@/components/ui/AgencyAvatar';
import { money } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { localePath, type Locale } from '@/i18n/locales';
import type { PropertyOffers } from '@/lib/types';
import { c } from '@/lib/theme';
import Link from 'next/link';

/**
 * Сравнение предложений по одному объекту.
 *
 * Обычные порталы показывают эти строки как пять отдельных объявлений.
 * Мы схлопываем их в одну карточку, а разницу в цене выносим сюда — ради
 * этого блока и затевалась вся дедупликация.
 */
export function OffersCompare({
  data,
  dict,
  locale,
  currentListingId,
}: {
  data: PropertyOffers;
  dict: Dictionary;
  locale: Locale;
  currentListingId: string;
}) {
  if (data.count < 2) return null;

  const cheapest = data.offers[0];

  return (
    <div
      style={{
        border: `1px solid ${c.lineStrong}`,
        borderRadius: 24,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        background: c.violetTintPale,
      }}
    >
      <div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {dict.common.offersTitle}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: c.inkSoft, marginTop: 6 }}>
          {dict.common.offersLead}
        </div>
      </div>

      {data.spread > 0 && (
        <div
          style={{
            alignSelf: 'flex-start',
            background: c.white,
            border: `1px solid ${c.lineStrong}`,
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 15,
          }}
        >
          <span style={{ color: c.muted }}>{dict.common.spread}: </span>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{money(data.spread, locale)}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.offers.map((offer) => {
          const isCurrent = offer.id === currentListingId;
          const isCheapest = offer.id === cheapest.id;

          return (
            <Link
              key={offer.id}
              href={localePath(locale, `listing/${offer.slug}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                gap: 16,
                alignItems: 'center',
                background: c.white,
                border: `1px solid ${isCurrent ? c.violet : c.line}`,
                borderRadius: 16,
                padding: '14px 16px',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <AgencyAvatar
                  name={offer.agency.name}
                  initials={offer.agency.initials}
                  brandColor={offer.agency.brandColor}
                  logoUrl={offer.agency.logoUrl}
                  size={34}
                  radius={10}
                  fontSize={12}
                />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{offer.agency.name}</span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: c.grey,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {offer.title}
                  </span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {offer.verified && (
                  <span
                    style={{
                      background: c.greenTint,
                      color: c.greenText,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 999,
                    }}
                  >
                    {dict.common.verified}
                  </span>
                )}
                {offer.promoted && <AdBadge label={dict.common.ad} size="sm" />}
                {isCheapest && data.spread > 0 && (
                  <span
                    style={{
                      background: c.violetTint,
                      color: c.violetDeep,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 999,
                    }}
                  >
                    {dict.common.cheapest}
                  </span>
                )}
                <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {money(offer.price, locale)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
