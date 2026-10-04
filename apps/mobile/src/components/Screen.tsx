import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n/I18nProvider';
import { c, TAB_BAR_SPACE } from '@/theme';

/** Прокручиваемый экран с отступом под статус-бар и плавающую панель вкладок. */
export function Screen({
  children,
  background = c.white,
  withTabBar = true,
  topPadding = 8,
  contentStyle,
}: {
  children: React.ReactNode;
  background?: string;
  withTabBar?: boolean;
  topPadding?: number;
  contentStyle?: object;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={[
        { paddingTop: insets.top + topPadding, paddingBottom: withTabBar ? TAB_BAR_SPACE : insets.bottom + 24 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** Состояние загрузки и ошибки — одинаковое на всех экранах. */
export function LoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  const { dict } = useI18n();
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.violet} />
      </View>
    );
  }

  if (!error) return null;

  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorTitle}>{dict.common.loadFailed}</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable onPress={onRetry} style={styles.retry}>
        <Text style={styles.retryText}>{dict.common.retry}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: 'center' },
  errorBox: {
    marginHorizontal: 20,
    backgroundColor: c.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: c.ink },
  errorText: { fontSize: 14, color: c.muted, textAlign: 'center' },
  retry: {
    marginTop: 6,
    backgroundColor: c.violet,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryText: { color: c.white, fontSize: 15, fontWeight: '600' },
});
