import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';

const LANGUAGES = ['Русский', 'English', 'Nederlands', 'Deutsch'];

export default function ProfileScreen() {
  const router = useRouter();
  const { favorites, dealStep, plus, togglePlus, notifications, toggleNotifications, language, cycleLanguage } =
    useApp();

  const items = [
    { title: 'Избранное', value: String(favorites.length), icon: ICON.heart, onPress: () => router.push('/favorites') },
    { title: 'Сохранённые поиски', value: '3', icon: ICON.search, onPress: () => router.push('/results') },
    { title: 'Моя сделка', value: `${dealStep} из 6`, icon: ICON.deal, onPress: () => router.push('/deal') },
    { title: 'Ипотека', value: '', icon: ICON.mortgage, onPress: () => router.push('/mortgage') },
    { title: 'Уведомления', value: '', icon: ICON.bell, toggle: true, onPress: toggleNotifications },
    { title: 'Язык', value: LANGUAGES[language], icon: ICON.globe, onPress: cycleLanguage },
    { title: 'Поддержка', value: '', icon: ICON.support, onPress: () => router.push('/chat') },
  ];

  return (
    <Screen background={c.screenSoft} contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>А</Text>
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.name}>Анна Смирнова</Text>
          <Text style={styles.verified}>Профиль верифицирован</Text>
        </View>
      </View>

      <View style={styles.plus}>
        <View style={styles.plusHead}>
          <View style={styles.plusTag}>
            <Text style={styles.plusTagText}>Casaya+</Text>
          </View>
          <Text style={styles.plusState}>{plus ? 'активна' : '9,90 € / мес'}</Text>
        </View>
        <Text style={styles.plusTitle}>Новые объекты на 24 часа раньше всех</Text>
        <Pressable onPress={togglePlus} style={[styles.plusBtn, { backgroundColor: plus ? c.green : c.white }]}>
          <Text style={[styles.plusBtnText, { color: plus ? c.white : c.ink }]}>
            {plus ? 'Подписка активна' : 'Подключить за 9,90 €'}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
