import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '@/state/AppState';
import { useI18n } from '@/i18n/I18nProvider';
import { c, ICON } from '@/theme';

interface Props {
  listingId: string;
  /** floating — кружок поверх фото, plain — иконка в строке. */
  variant?: 'floating' | 'plain';
  size?: number;
}

export function FavoriteButton({ listingId, variant = 'floating', size = 18 }: Props) {
  const { isFavorite, toggleFavorite } = useApp();
  const { dict } = useI18n();
  const active = isFavorite(listingId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? dict.common.favoriteRemove : dict.common.favoriteAdd}
      hitSlop={8}
      onPress={() => toggleFavorite(listingId)}
      style={variant === 'floating' ? [styles.floating, { width: size + 16, height: size + 16 }] : undefined}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={ICON.heart}
          fill={active ? c.coral : 'none'}
          stroke={active ? c.coral : c.ink}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
