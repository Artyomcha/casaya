import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useI18n } from '@/i18n/I18nProvider';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';

/** Иконки у вкладок постоянные, подписи приходят из словаря. */
const ICONS: Record<string, string> = {
  index: ICON.home,
  map: ICON.pin,
  favorites: ICON.heart,
  deal: ICON.deal,
  profile: ICON.user,
};

/**
 * Плавающая панель из макета: активная вкладка расширяется и показывает подпись,
 * остальные сжимаются до иконки.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { favorites } = useApp();
  const { dict } = useI18n();
  const labels: Record<string, string> = {
    index: dict.tabs.home,
    map: dict.tabs.map,
    favorites: dict.tabs.favorites,
    deal: dict.tabs.deal,
    profile: dict.tabs.profile,
  };

  return (
    <View style={[styles.bar, { bottom: Math.max(insets.bottom, 12) + 14 }]}>
      {state.routes.map((route, index) => {
        const icon = ICONS[route.name];
        const label = labels[route.name];
        if (!icon || !label) return null;

        const active = state.index === index;
        const badge = !active && route.name === 'favorites' ? favorites.length : 0;

        return (
          <Animated.View key={route.key} layout={LinearTransition.duration(240)} style={{ flex: active ? 2.2 : 1 }}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!active && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Icon d={icon} size={22} color={active ? c.white : c.greyLight} />
              {active && <Text style={styles.label}>{label}</Text>}
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 66,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: '#ECE8F4',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    shadowColor: '#2D146E',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  tab: {
    height: 50,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  tabActive: { backgroundColor: c.violet },
  label: { color: c.white, fontSize: 13, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: 7,
    left: '54%',
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: c.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: c.white,
  },
  badgeText: { color: c.white, fontSize: 10, fontWeight: '700' },
});
