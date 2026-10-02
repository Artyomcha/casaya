import type { Dictionary } from '@/i18n/getDictionary';
import { discountLabel } from '@/lib/format';
import type { Savings } from '@/lib/types';
import { c } from '@/lib/theme';

/**
 * «−11%» — главное обещание портала на карточке. Зелёный, а не фиолетовый:
 * фиолетовый у нас означает «выбрано», а Destacado — золотой. Выгода должна
 * читаться с одного взгляда и не путаться ни с тем, ни с другим.
 */
export function SavingsBadge({
  savings,
  dict,
  size = 'sm',
}: {
  savings: Savings;
  dict: Dictionary;
  size?: 'sm' | 'lg';
}) {
  const big = size === 'lg';
  return (
    <span
      title={dict.common.belowMarket}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: c.greenTint,
        color: c.greenText,
        fontSize: big ? 14 : 12,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        padding: big ? '6px 12px' : '5px 10px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {discountLabel(savings)}
      {big && <span style={{ fontWeight: 500 }}>{dict.common.belowMarket.toLowerCase()}</span>}
    </span>
  );
}
