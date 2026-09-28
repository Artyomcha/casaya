import { Sparkle } from '@/components/ui/icons';
import { c } from '@/lib/theme';

/** Золото платного статуса. Единственное место в палитре, где оно есть. */
const GOLD = {
  deep: '#8A5A00',
  mid: '#C88A14',
  light: '#F3D68B',
  tint: '#FFF8EA',
} as const;

/**
 * Бейдж платного размещения.
 *
 * Намеренно сделан в одной семье с Verificado: тот же силуэт, тот же кегль,
 * только золото вместо зелёного. Читается как премиальный статус, а не как
 * баннер, но остаётся однозначным маркером оплаченного показа — этого
 * требуют и DSA, и испанский закон о рекламе.
 */
export function AdBadge({ label, size = 'md' }: { label: string; size?: 'sm' | 'md' }) {
  const small = size === 'sm';
  const dot = small ? 15 : 16;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: c.white,
        color: GOLD.deep,
        fontSize: small ? 11 : 12,
        fontWeight: 700,
        padding: small ? '4px 9px 4px 5px' : '5px 10px 5px 6px',
        borderRadius: 999,
        boxShadow: `0 1px 3px rgba(23,17,43,0.12)`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: dot,
          height: dot,
          borderRadius: 999,
          background: `linear-gradient(135deg, ${GOLD.mid}, ${GOLD.deep})`,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Sparkle size={small ? 9 : 10} />
      </span>
      {label}
    </span>
  );
}

/**
 * Оформление карточки платного размещения.
 *
 * Работает контрастом фактуры, а не цветом: тёплая подложка, золотая
 * волосяная рамка и мягкое свечение. На фоне белых карточек такая
 * выделяется мгновенно, но не выглядит баннером.
 */
export const AD_CARD = {
  borderColor: GOLD.light,
  background: `linear-gradient(180deg, ${GOLD.tint} 0%, ${c.white} 42%)`,
  backgroundSolid: GOLD.tint,
  shadow: `0 1px 0 ${GOLD.light}, 0 14px 32px -18px rgba(138,90,0,0.45)`,
  ring: `0 0 0 2px ${GOLD.light}, 0 14px 30px -16px rgba(138,90,0,0.4)`,
} as const;

export { GOLD };
