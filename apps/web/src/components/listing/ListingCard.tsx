import Link from 'next/link';
import { VerifiedBadge } from '@/components/layout/Header';
import { AD_CARD, AdBadge } from '@/components/listing/AdBadge';
import { FavoriteButton } from '@/components/listing/FavoriteButton';
import { Play } from '@/components/ui/icons';
import type { Dictionary } from '@/i18n/getDictionary';
import type { ListingCard as Card } from '@/lib/types';
import { c } from '@/lib/theme';

/**
 * Карточка сетки: главная, избранное, «похожие рядом».
 * compact — вариант без бейджей и видео-метки (оценка и избранное).
 */
export function ListingCard({
  item,
  dict,
  compact = false,
}: {
  item: Card;
  dict: Dictionary;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: compact ? 12 : 14, color: 'inherit' }}
    >
      <div
        className={compact ? undefined : 'h-zoom'}
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          borderRadius: 20,
          overflow: 'hidden',
          background: c.violetTintSoft,
          // Оплаченная карточка отделяется от органической выдачи рамкой.
          ...(item.promoted ? { boxShadow: AD_CARD.ring } : null),
        }}
      >
        <img src={item.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        {!compact && (
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, pointerEvents: 'none', flexWrap: 'wrap' }}>
            {item.verified && <VerifiedBadge label={dict.common.verified} />}
            {item.promoted && <AdBadge label={dict.common.ad} />}
            {item.offersCount > 1 && (
              <span
                style={{
                  background: c.ink,
                  color: c.white,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: 999,
                }}
              >
                {dict.common.offers.replace('{n}', String(item.offersCount))}
              </span>
            )}
            {item.badge && (
              <span style={{ background: c.coral, color: c.white, fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 999 }}>
                {item.badge}
              </span>
            )}
          </div>
        )}

        <FavoriteButton listingId={item.id} dict={dict} />

        {!compact && item.videoTour && (
          <span
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: 'rgba(23,17,43,0.72)',
              color: c.white,
              fontSize: 12,
              fontWeight: 500,
              padding: '4px 9px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              pointerEvents: 'none',
            }}
          >
            <Play size={12} />
            {dict.common.videoTour}
          </span>
        )}
      </div>

      {compact ? (
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
            {item.priceLabel}
          </div>
          <div style={{ fontSize: 14, color: c.inkSoft, marginTop: 4 }}>{item.specs}</div>
          <div style={{ fontSize: 14, color: c.grey, marginTop: 2 }}>{item.address}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
              {item.priceLabel}
            </span>
            <span style={{ fontSize: 13, color: c.grey, fontVariantNumeric: 'tabular-nums' }}>{item.subLabel}</span>
          </div>
          <div style={{ fontSize: 15, color: c.ink }}>{item.specs}</div>
          <div style={{ fontSize: 14, color: c.grey }}>{item.address}</div>
        </div>
      )}
    </Link>
  );
}
