import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { imageUrl } from '@/api';
import { money } from '@/format';
import { useI18n } from '@/i18n/I18nProvider';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';

/** Шаги сделки — путь покупателя-иностранца до ключей. Из словаря: порядок
 * один, язык разный. */
const steps = (dict: Dictionary): { title: string; detail: string }[] => [
  { title: dict.deal.step1, detail: dict.deal.step1d },
  { title: dict.deal.step2, detail: dict.deal.step2d },
  { title: dict.deal.step3, detail: dict.deal.step3d },
  { title: dict.deal.step4, detail: dict.deal.step4d },
  { title: dict.deal.step5, detail: dict.deal.step5d },
  { title: dict.deal.step6, detail: dict.deal.step6d },
];

export default function DealScreen() {
  const router = useRouter();
  const { dealStep, setDealStep, listings } = useApp();
  const { locale, dict } = useI18n();
  const STEPS = steps(dict);

  // Сделка привязана к самому дорогому объекту в подборке — это демо-объект макета.
  const property = listings.find((l) => l.kind === 'VILLA') ?? listings[0];
  const percent = Math.round((dealStep / STEPS.length) * 100);

  return (
    <Screen background={c.screenSoft} contentStyle={styles.content}>
      <Text style={styles.title}>{dict.deal.title}</Text>

      {property && (
        <Pressable onPress={() => router.push(`/listing/${property.slug}`)} style={styles.property}>
          <Image source={{ uri: imageUrl(property.coverImage) }} style={styles.propertyImage} />
          <View style={styles.propertyBody}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyMeta}>
              {property.address} · {money(property.price, locale)}
            </Text>
          </View>
          <Icon d={ICON.chevronRight} size={18} color={c.grey} width={2} />
        </Pressable>
      )}

      <View style={styles.progress}>
        <View style={styles.progressHead}>
          <Text style={styles.progressLabel}>
            {dict.deal.progress
              .replace('{done}', String(dealStep))
              .replace('{total}', String(STEPS.length))}
          </Text>
          <Text style={styles.progressPercent}>{percent}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressHint}>{dict.deal.hint}</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step, i) => {
          const done = i < dealStep;
          const current = i === dealStep;
          return (
            <Pressable
              key={step.title}
              onPress={() => setDealStep(i < dealStep ? i : i + 1)}
              style={[styles.step, i > 0 && styles.stepDivider]}
            >
              <View
                style={[
                  styles.mark,
                  {
                    backgroundColor: done ? c.green : c.white,
                    borderColor: done ? c.green : current ? c.violet : c.lineStrong,
                  },
                ]}
              >
                <Text style={[styles.markText, { color: done ? c.white : current ? c.violet : c.greyLight }]}>
                  {done ? '✓' : i + 1}
                </Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.escrow}>
        <Icon d={ICON.lock} size={22} color={c.greenText} width={1.9} />
        <View style={styles.escrowBody}>
          <Text style={styles.escrowTitle}>{dict.deal.escrowTitle}</Text>
          <Text style={styles.escrowText}>{dict.deal.escrowText}</Text>
        </View>
      </View>

      <Pressable onPress={() => router.push('/chat')} style={styles.cta}>
        <Text style={styles.ctaText}>{dict.deal.cta}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -1.2, color: c.ink, marginBottom: 4 },

  property: { backgroundColor: c.white, borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  propertyImage: { width: 64, height: 64, borderRadius: 14 },
  propertyBody: { flex: 1 },
  propertyTitle: { fontSize: 16, fontWeight: '700', color: c.ink },
  propertyMeta: { fontSize: 13, color: c.grey, marginTop: 2 },

  progress: { backgroundColor: c.violet, borderRadius: 22, padding: 18, gap: 12 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressLabel: { fontSize: 15, color: c.lilacBody },
  progressPercent: { fontSize: 26, fontWeight: '700', color: c.white },
  track: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: c.white },
  progressHint: { fontSize: 14, color: c.lilacBody },

  steps: { backgroundColor: c.white, borderRadius: 22, paddingHorizontal: 16 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  stepDivider: { borderTopWidth: 1, borderTopColor: c.lineSoft },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontSize: 13, fontWeight: '700' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: c.ink },
  stepDetail: { fontSize: 12, color: c.grey, marginTop: 1 },

  escrow: {
    backgroundColor: c.greenTint,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  escrowBody: { flex: 1 },
  escrowTitle: { fontSize: 14, fontWeight: '700', color: c.greenDark },
  escrowText: { fontSize: 12, color: c.greenMid },

  cta: { backgroundColor: c.ink, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  ctaText: { color: c.white, fontSize: 16, fontWeight: '600' },
});
