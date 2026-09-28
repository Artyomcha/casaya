import Link from 'next/link';
import { VerifiedBadge } from '@/components/layout/Header';
import { FavoriteButton } from '@/components/listing/FavoriteButton';
import type { Dictionary } from '@/i18n/getDictionary';
import type { ListingCard as Card } from '@/lib/types';
import { c } from '@/lib/theme';

/** Горизонтальная карточка выдачи поиска — фото слева, данные справа. */
export function ListingRow({
  item,
  dict,
  highlighted = false,
}: {
  item: Card;
  dict: Dictionary;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className="h-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,260px) minmax(0,1fr)',
        gap: 20,
        padding: 12,
        border: `1px solid ${highlighted ? '#DDD5F5' : c.line}`,
        borderRadius: 22,
        cursor: 'pointer',
        background: c.white,
        color: 'inherit',
        // Наведение на пин карты подсвечивает карточку так же, как наведение мышью.
        boxShadow: highlighted ? '0 12px 32px -12px rgba(45,20,110,0.18)' : 'none',
      }}
    >
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4 / 3', background: c.violetTintSoft }}>
        <img src={item.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <span style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {item.verified && <VerifiedBadge compact label={dict.common.verified} />}
          {item.promoted && (
            <span
              style={{
                background: c.white,
                color: c.muted,
                border: `1px solid ${c.lineStrong}`,
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 9px',
                borderRadius: 999,
              }}
            >
              {dict.common.ad}
            </span>
          )}
          {item.offersCount > 1 && (
            <span
              style={{
                background: c.ink,
                color: c.white,
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 9px',
                borderRadius: 999,
              }}
            >
              {dict.common.offers.replace('{n}', String(item.offersCount))}
            </span>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 6px 6px 0', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>{item.title}</span>
          <FavoriteButton listingId={item.id} dict={dict} variant="inline" size={20} />
        </div>

        <div style={{ fontSize: 14, color: c.grey }}>{item.address}</div>
        <div style={{ fontSize: 14, color: c.inkSoft }}>{item.specs}</div>
        <span style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
            {item.priceLabel}
          </span>
          <span style={{ fontSize: 13, color: c.grey, fontVariantNumeric: 'tabular-nums' }}>{item.subLabel}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: c.muted,
            paddingTop: 10,
            borderTop: `1px solid ${c.lineSoft}`,
            marginTop: 6,
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: item.agency.brandColor,
              color: c.white,
              display: 'grid',
              placeItems: 'center',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {item.agentInitials}
          </span>
          {item.agency.name}
          <span style={{ marginLeft: 'auto' }}>{item.dateLabel}</span>
        </div>
      </div>
    </Link>
  );
}
