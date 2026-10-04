import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { RangeRow } from '@/components/RangeRow';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { api } from '@/api';
import { money, monthlyPayment } from '@/format';
import { useI18n } from '@/i18n/I18nProvider';
import { c, ICON } from '@/theme';
import type { Bank } from '@/types';

/** Сроки кредита. Подпись «лет» — из словаря, сами сроки от языка не зависят. */
const terms = (years: string) => [10, 15, 20, 25].map((t) => ({ key: t, label: `${t} ${years}` }));

export default function MortgageScreen() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [price, setPrice] = useState(485_000);
  const [down, setDown] = useState(30);
  const [term, setTerm] = useState(25);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api
      .banks()
      .then((list) => setBanks(list.slice(0, 4)))
      .catch(() => undefined);
  }, []);

  const { loan, monthly } = useMemo(() => monthlyPayment(price, down, term), [price, down, term]);

  const submit = async () => {
    setSent(true);
    await api
      .createLead({ kind: 'MORTGAGE', payload: { price, downPaymentPercent: down, termYears: term, source: 'mobile' } })
      .catch(() => undefined);
  };

  return (
    <Screen withTabBar={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon d={ICON.chevronLeft} size={20} width={2.2} />
        </Pressable>
        <Text style={styles.title}>{dict.mortgage.title}</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{dict.mortgage.monthly}</Text>
        <Text style={styles.summaryValue}>{money(monthly, locale)}</Text>
        <Text style={styles.summaryLabel}>
          {dict.mortgage.summary.replace('{loan}', money(loan, locale))}
        </Text>
      </View>

      <RangeRow
        label={dict.mortgage.price}
        value={money(price, locale)}
        min={80_000}
        max={1_500_000}
        step={5_000}
        current={price}
        onChange={(v) => {
          setPrice(v);
          setSent(false);
        }}
      />

      <RangeRow
        label={dict.mortgage.downPayment}
        value={`${down}% · ${money((price * down) / 100, locale)}`}
        min={30}
        max={70}
        step={5}
        current={down}
        onChange={(v) => {
          setDown(v);
          setSent(false);
        }}
      />

      <Segmented
        options={terms(dict.mortgage.years)}
        value={term}
        onChange={(v) => {
          setTerm(v);
          setSent(false);
        }}
      />

      <View style={styles.banks}>
        <Text style={styles.banksTitle}>{dict.mortgage.banks}</Text>
        {banks.map((bank) => (
          <View key={bank.id} style={styles.bank}>
            <View style={[styles.bankLogo, { backgroundColor: bank.brandColor }]}>
              <Text style={styles.bankInitial}>{bank.initial}</Text>
            </View>
            <Text style={styles.bankName}>{bank.name}</Text>
            <Text style={styles.bankRate}>{bank.rate}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={submit} disabled={sent} style={[styles.cta, { backgroundColor: sent ? c.green : c.violet }]}>
        <Text style={styles.ctaText}>{sent ? dict.mortgage.sent : dict.mortgage.submit}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.7, color: c.ink },

  summary: { backgroundColor: c.greenTint, borderRadius: 24, padding: 20, gap: 4 },
  summaryLabel: { fontSize: 14, color: c.greenMid },
  summaryValue: { fontSize: 44, fontWeight: '700', letterSpacing: -2, color: c.greenDark },

  banks: { gap: 8 },
  banksTitle: { fontSize: 16, fontWeight: '700', color: c.ink },
  bank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bankLogo: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  bankInitial: { color: c.white, fontWeight: '700', fontSize: 14 },
  bankName: { flex: 1, fontSize: 15, fontWeight: '600', color: c.ink },
  bankRate: { fontSize: 15, fontWeight: '700', color: c.ink },

  cta: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: c.white, fontSize: 16, fontWeight: '600' },
});
