import Link from 'next/link';
import { VerifiedBadge } from '@/components/layout/Header';
import { money } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { localePath, type Locale } from '@/i18n/locales';
import { specsOf } from '@/lib/format';
import type { SimilarListing } from '@/lib/types';
import { c } from '@/lib/theme';

/**
 * Рекомендации по локации. Порядок задаёт алгоритм похожести: расстояние,
 * цена, площадь, комнаты. Продвинутые объявления получают небольшую надбавку,
 * но не могут вытеснить действительно близкие.
 */
export function NearbyListings({
  items,
  dict,
  locale,
}: {
  items: SimilarListing[];
  dict: Dictionary;
  locale: Locale;
}) {
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.03em', fontWeight: 700 }}>
        {dict.common.nearbyTitle}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {items.map((item) => (
          <Link
            key={item.id}
            href={localePath(locale, `listing/${item.slug}`)}
            style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'inherit' }}
          >
            <div style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 18, overflow: 'hidden', background: c.violetTintSoft }}>
              <img src={item.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              {item.verified && (
                <span style={{ position: 'absolute', top: 10, left: 10 }}>
                  <VerifiedBadge compact label={dict.common.verified} />
                </span>
              )}

              {item.promotionTier !== 'NONE' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    background: 'rgba(23,17,43,0.78)',
                    color: c.white,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 9px',
                    borderRadius: 999,
                  }}
                >
                  {dict.common.promoted}
                </span>
              )}
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {money(item.price, locale)}
              </div>
              <div style={{ fontSize: 13, color: c.inkSoft, marginTop: 3 }}>{specsOf(item, dict)}</div>
              <div style={{ fontSize: 13, color: c.grey, marginTop: 2 }}>
                {item.address}
                {item.distanceMeters != null && (
                  <> · {dict.common.distanceAway.replace('{d}', String(item.distanceMeters))}</>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
