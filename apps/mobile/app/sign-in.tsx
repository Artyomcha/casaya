import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { api } from '@/api';
import { useI18n } from '@/i18n/I18nProvider';
import { useSession } from '@/state/SessionState';
import { c, ICON } from '@/theme';
import type { UserRole } from '@/types';

/**
 * Регистрация и вход — одно действие: пароля нет, приходит код.
 * Роль спрашивается здесь же, потому что от неё зависит, что человек увидит
 * дальше: покупателю нужны отметки, продавцу — свои объекты и отклики.
 */
export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dict } = useI18n();
  const { signIn } = useSession();

  const [role, setRole] = useState<UserRole>('BUYER');
  const [channel, setChannel] = useState<'phone' | 'email'>('phone');
  const [identity, setIdentity] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  // В тестовом режиме API возвращает код: пройти вход без провайдера рассылки.
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async () => {
    if (identity.trim().length < 5) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.requestCode(channel, identity.trim());
      setDevCode(res.devCode ?? null);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (code.trim().length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(channel, identity.trim(), code.trim(), role);
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{dict.auth.signInTitle}</Text>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
            <Icon d={ICON.close} size={16} width={2.4} />
          </Pressable>
        </View>

        <Text style={styles.lead}>{dict.auth.signInLead}</Text>

        <View style={styles.roles}>
          {(['BUYER', 'SELLER'] as const).map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.role, role === r && styles.roleActive]}>
              <Text style={[styles.roleTitle, role === r && styles.roleTitleActive]}>
                {r === 'BUYER' ? dict.auth.roleBuyer : dict.auth.roleSeller}
              </Text>
              <Text style={styles.roleHint}>
                {r === 'BUYER' ? dict.auth.roleBuyerHint : dict.auth.roleSellerHint}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabs}>
          {(['phone', 'email'] as const).map((ch) => (
            <Pressable
              key={ch}
              onPress={() => {
                setChannel(ch);
                setSent(false);
              }}
              style={[styles.tab, channel === ch && styles.tabActive]}
            >
              <Text style={[styles.tabText, channel === ch && styles.tabTextActive]}>
                {ch === 'phone' ? dict.auth.tabPhone : dict.auth.tabEmail}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={identity}
          onChangeText={(v) => {
            setIdentity(v);
            setSent(false);
          }}
          placeholder={channel === 'phone' ? dict.auth.phonePlaceholder : dict.auth.emailPlaceholder}
          placeholderTextColor={c.greyLight}
          keyboardType={channel === 'phone' ? 'phone-pad' : 'email-address'}
          autoCapitalize="none"
          style={styles.input}
        />

        {sent && (
          <>
            <View style={styles.sent}>
              <Text style={styles.sentText}>{dict.auth.codeSent}</Text>
              {devCode && (
                <Text style={styles.devCode}>
                  {dict.auth.devHint}: {devCode}
                </Text>
              )}
            </View>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder={dict.auth.codePlaceholder}
              placeholderTextColor={c.greyLight}
              keyboardType="number-pad"
              style={[styles.input, styles.codeInput]}
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* Кнопка прижата к низу: форма короткая, и посередине белого листа
          она выглядела бы брошенной. */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable onPress={sent ? submit : requestCode} disabled={busy} style={[styles.cta, busy && styles.ctaBusy]}>
          <Text style={styles.ctaText}>{sent ? dict.auth.signIn : dict.auth.getCode}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.white },
  // Сверху запас под «ручку» модального листа: без него заголовок липнет к краю.
  content: { gap: 16, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },
  footer: { paddingHorizontal: 20, paddingTop: 8, backgroundColor: c.white },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.9, color: c.ink },
  close: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: { fontSize: 15, color: c.grey, lineHeight: 21, marginTop: -8 },

  roles: { gap: 10 },
  role: { borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 3 },
  roleActive: { borderColor: c.violet, backgroundColor: c.violetTint },
  roleTitle: { fontSize: 17, fontWeight: '700', color: c.ink },
  roleTitleActive: { color: c.violet },
  roleHint: { fontSize: 13, color: c.grey },

  tabs: { flexDirection: 'row', gap: 4, backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: c.white },
  tabText: { fontSize: 14, fontWeight: '600', color: c.grey },
  tabTextActive: { color: c.ink },

  input: {
    borderWidth: 1,
    borderColor: c.lineStrong,
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    color: c.ink,
  },
  codeInput: { letterSpacing: 6, fontVariant: ['tabular-nums'] },

  sent: { backgroundColor: c.greenTint, borderRadius: 12, padding: 12, gap: 4 },
  sentText: { fontSize: 14, color: c.greenText },
  devCode: { fontSize: 14, fontWeight: '700', color: c.greenText, fontVariant: ['tabular-nums'] },

  error: { fontSize: 14, color: c.coralDark },

  cta: { backgroundColor: c.violet, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaBusy: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: '700', color: c.white },
});
