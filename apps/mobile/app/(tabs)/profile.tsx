import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useI18n } from '@/i18n/I18nProvider';
import { LOCALE_NAMES, LOCALES } from '@/i18n/locales';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';



export default function ProfileScreen() {
  const router = useRouter();
  const { locale, dict, setLocale } = useI18n();
  const [languageOpen, setLanguageOpen] = useState(false);
  const { favorites, dealStep, plus, togglePlus, notifications, toggleNotifications } =
    useApp();

  const items = [
    { title: dict.profile.menuFavorites, value: String(favorites.length), icon: ICON.heart, onPress: () => router.push('/favorites') },
    { title: dict.profile.menuSearches, value: '3', icon: ICON.search, onPress: () => router.push('/results') },
    { title: dict.profile.menuDeal, value: dict.home.dealSteps.replace('{n}', String(dealStep)), icon: ICON.deal, onPress: () => router.push('/deal') },
    { title: dict.profile.menuMortgage, value: '', icon: ICON.mortgage, onPress: () => router.push('/mortgage') },
    { title: dict.profile.menuNotifications, value: '', icon: ICON.bell, toggle: true, onPress: toggleNotifications },
    { title: dict.profile.menuLanguage, value: LOCALE_NAMES[locale], icon: ICON.globe, onPress: () => setLanguageOpen(true) },
    { title: dict.profile.menuSupport, value: '', icon: ICON.support, onPress: () => router.push('/chat') },
  ];

  return (
    <Screen background={c.screenSoft} contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>А</Text>
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.name}>{dict.profile.name}</Text>
          <Text style={styles.verified}>{dict.profile.verified}</Text>
        </View>
      </View>

      <View style={styles.plus}>
        <View style={styles.plusHead}>
          <View style={styles.plusTag}>
            <Text style={styles.plusTagText}>Casaya+</Text>
          </View>
          <Text style={styles.plusState}>{plus ? dict.profile.plusState : dict.profile.plusPrice}</Text>
        </View>
        <Text style={styles.plusTitle}>{dict.profile.plusTitle}</Text>
        <Pressable onPress={togglePlus} style={[styles.plusBtn, { backgroundColor: plus ? c.green : c.white }]}>
          <Text style={[styles.plusBtnText, { color: plus ? c.white : c.ink }]}>
            {plus ? dict.profile.plusActive : dict.profile.plusCta}
          </Text>
        </Pressable>
      </View>

      <View style={styles.menu}>
        {items.map((item, i) => (
          <Pressable key={item.title} onPress={item.onPress} style={[styles.item, i > 0 && styles.itemDivider]}>
            <View style={styles.itemIcon}>
              <Icon d={item.icon} size={18} color={c.violet} width={1.9} />
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {!!item.value && <Text style={styles.itemValue}>{item.value}</Text>}
            {item.toggle ? (
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                trackColor={{ true: c.green, false: c.lineStrong }}
                thumbColor={c.white}
              />
            ) : (
              <Icon d={ICON.chevronRight} size={16} color="#B0AAC0" width={2.2} />
            )}
          </Pressable>
        ))}
      </View>

      <Sheet open={languageOpen} onClose={() => setLanguageOpen(false)}>
        <Text style={styles.sheetTitle}>{dict.profile.languageTitle}</Text>
        {LOCALES.map((code) => (
          <Pressable
            key={code}
            onPress={() => {
              setLocale(code);
              setLanguageOpen(false);
            }}
            style={styles.languageRow}
          >
            <Text style={[styles.languageName, code === locale && styles.languageActive]}>
              {LOCALE_NAMES[code]}
            </Text>
            {code === locale && <Icon d={ICON.check} size={16} color={c.violet} width={2.6} />}
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sheetTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.7, color: c.ink },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  languageName: { fontSize: 17, color: c.ink },
  languageActive: { fontWeight: '700', color: c.violet },
  content: { paddingHorizontal: 20, gap: 14 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: c.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: c.white, fontSize: 23, fontWeight: '700' },
  headerBody: { flex: 1 },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.7, color: c.ink },
  verified: { fontSize: 13, fontWeight: '600', color: c.green, marginTop: 2 },

  plus: { backgroundColor: c.ink, borderRadius: 22, padding: 18, gap: 10 },
  plusHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plusTag: { backgroundColor: c.violet, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  plusTagText: { color: c.white, fontSize: 12, fontWeight: '700' },
  plusState: { fontSize: 14, color: '#B5AECB' },
  plusTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4, color: c.white },
  plusBtn: { borderRadius: 13, paddingVertical: 12, alignItems: 'center' },
  plusBtnText: { fontSize: 15, fontWeight: '600' },

  menu: { backgroundColor: c.white, borderRadius: 22, paddingHorizontal: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  itemDivider: { borderTopWidth: 1, borderTopColor: c.lineSoft },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: c.ink },
  itemValue: { fontSize: 14, color: c.grey },
});
