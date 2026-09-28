'use client';

import { useApp } from '@/components/providers/AppProviders';
import { Heart } from '@/components/ui/icons';
import type { Dictionary } from '@/i18n/getDictionary';
import { c } from '@/lib/theme';

interface Props {
  listingId: string;
  dict: Dictionary;
  /** floating — круглая кнопка на фото; inline — иконка в строке выдачи. */
  variant?: 'floating' | 'inline';
  size?: number;
}

export function FavoriteButton({ listingId, dict, variant = 'floating', size = 18 }: Props) {
  const { isFavorite, toggleFavorite } = useApp();
  const active = isFavorite(listingId);

  const floating: React.CSSProperties = {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 999,
    border: 0,
    background: 'rgba(255,255,255,0.94)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  };

  const inline: React.CSSProperties = {
    border: 0,
    background: 'transparent',
    padding: 2,
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <button
      type="button"
      aria-label={active ? dict.common.favoriteRemove : dict.common.favoriteAdd}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(listingId);
      }}
      style={variant === 'floating' ? floating : inline}
    >
      <Heart size={size} fill={active ? c.coral : 'none'} stroke={active ? c.coral : c.ink} />
    </button>
  );
}
