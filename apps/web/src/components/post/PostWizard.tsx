'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChoiceCards, ChoicePills } from '@/components/ui/Segmented';
import { Check, Plus, Shield } from '@/components/ui/icons';
import { api } from '@/lib/api';
import { c } from '@/lib/theme';

const STEP_LABELS = ['Тип', 'Объект', 'Фото', 'Цена'];

const DEALS = [
  { key: 'sell', label: 'Продать' },
  { key: 'rent', label: 'Сдать в аренду' },
] as const;

const WHOS = [
  { key: 'owner', label: 'Я собственник' },
  { key: 'agency', label: 'Я агентство' },
] as const;

const TYPES = [
  { key: 'flat', label: 'Квартира' },
  { key: 'house', label: 'Дом или вилла' },
  { key: 'pent', label: 'Пентхаус' },
  { key: 'town', label: 'Таунхаус' },
  { key: 'com', label: 'Коммерческая' },
] as const;

const FIELDS = [
  { name: 'address', label: 'Адрес', ph: 'Calle, номер, город' },
  { name: 'area', label: 'Площадь, м²', ph: '85' },
  { name: 'bedrooms', label: 'Спальни', ph: '2' },
  { name: 'bathrooms', label: 'Ванные', ph: '2' },
];

const PHOTO_SLOTS = ['Главное фото', 'Гостиная', 'Кухня', 'Спальня', 'Ванная', 'Вид из окна'];

const TARIFFS = [
  { key: 'free', label: 'Бесплатно', price: '0 €', d: 'Обычное размещение в выдаче' },
  { key: 'dest', label: 'Destacado', price: '19,90 € / нед', d: 'Выделение цветом и выше в поиске' },
  { key: 'top', label: 'Top района', price: '39,90 € / нед', d: 'Первые позиции в вашем районе' },
] as const;

const inputStyle: React.CSSProperties = {
  border: `1px solid ${c.lineStrong}`,
  background: c.surface,
  font: 'inherit',
  fontSize: 16,
  padding: '14px 16px',
  borderRadius: 14,
  outline: 0,
  color: c.ink,
};

const groupLabel: React.CSSProperties = { fontSize: 16, fontWeight: 600 };

export function PostWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [deal, setDeal] = useState<(typeof DEALS)[number]['key']>('sell');
  const [who, setWho] = useState<(typeof WHOS)[number]['key']>('owner');
  const [type, setType] = useState<(typeof TYPES)[number]['key']>('flat');
  const [tariff, setTariff] = useState<(typeof TARIFFS)[number]['key']>('free');
  const [values, setValues] = useState<Record<string, string>>({});

  const last = step === 3;
  const done = step === 4;

  const next = async () => {
    if (last) {
      // Объявление уходит на модерацию как заявка: боевая публикация
      // включается после проверки nota simple и видео-тура.
      await api
        .createLead({
          kind: 'LISTING_CONTACT',
          message: values.description,
          payload: { deal, who, type, tariff, ...values },
        })
        .catch(() => undefined);
    }
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const set = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  return (
    <main>
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(30px,3.4vw,42px)', letterSpacing: '-0.045em', fontWeight: 700 }}>Разместить объявление</h1>
          <p style={{ margin: 0, fontSize: 16, color: c.muted }}>Первое объявление от собственника бесплатно навсегда.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {STEP_LABELS.map((label, i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ height: 4, borderRadius: 999, background: i <= step ? c.violet : c.line }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? c.ink : c.greyLight }}>{label}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            border: `1px solid ${c.line}`,
            borderRadius: 28,
            padding: 'clamp(22px,4vw,36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
          }}
        >
          {step === 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={groupLabel}>Что хотите сделать</span>
                <ChoiceCards options={DEALS.map((d) => ({ ...d }))} value={deal} onChange={setDeal} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={groupLabel}>Кто размещает</span>
                <ChoiceCards options={WHOS.map((w) => ({ ...w }))} value={who} onChange={setWho} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={groupLabel}>Тип объекта</span>
                <ChoicePills options={TYPES.map((t) => ({ ...t }))} value={type} onChange={setType} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {FIELDS.map((f) => (
                <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, color: c.muted }}>{f.label}</span>
                  <input placeholder={f.ph} value={values[f.name] ?? ''} onChange={set(f.name)} style={inputStyle} />
                </label>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, color: c.muted }}>Описание</span>
                <textarea
                  rows={5}
                  placeholder="Расскажите об объекте: ремонт, вид, инфраструктура"
                  value={values.description ?? ''}
                  onChange={set('description')}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
                {PHOTO_SLOTS.map((slot) => (
                  <div
                    key={slot}
                    style={{
                      aspectRatio: '4 / 3',
                      border: '1.5px dashed #CFC6EA',
                      borderRadius: 16,
                      background: c.violetTintPale,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      color: c.violet,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={22} width={2} />
                    {slot}
                  </div>
                ))}
              </div>

              <div style={{ background: c.greenTint, borderRadius: 18, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Shield size={22} color={c.green} width={2} />
                <div style={{ fontSize: 15, lineHeight: 1.55, color: c.greenDark }}>
                  <strong>Получите бейдж Verificado.</strong> После публикации мы запросим nota simple и видео-тур по чек-листу.
                  Проверенные объекты получают в среднем в 3 раза больше откликов.
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, color: c.muted }}>Цена, €</span>
                <input
                  placeholder="289 000"
                  value={values.price ?? ''}
                  onChange={set('price')}
                  style={{ ...inputStyle, fontSize: 22, fontWeight: 600 }}
                />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={groupLabel}>Продвижение</span>
                {TARIFFS.map((t) => {
                  const active = t.key === tariff;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTariff(t.key)}
                      style={{
                        border: `2px solid ${active ? c.violet : c.lineStrong}`,
                        background: active ? c.violetTintSoft : c.white,
                        font: 'inherit',
                        textAlign: 'left',
                        padding: '18px 20px',
                        borderRadius: 18,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>{t.label}</span>
                        <span style={{ fontSize: 14, color: c.muted }}>{t.d}</span>
                      </span>
                      <span style={{ fontSize: 17, fontWeight: 700, color: c.ink, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {t.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {done && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '24px 0' }}>
              <span style={{ width: 64, height: 64, borderRadius: 20, background: c.green, display: 'grid', placeItems: 'center' }}>
                <Check size={30} width={2.6} />
              </span>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Объявление отправлено на проверку</div>
              <div style={{ fontSize: 15, color: c.muted, maxWidth: 420, lineHeight: 1.55 }}>
                Модерация занимает до 2 часов. Мы пришлём ссылку на видео-тур для получения бейджа Verificado.
              </div>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="h-ink-to-violet"
                style={{
                  border: 0,
                  background: c.ink,
                  color: c.white,
                  font: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '13px 22px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  marginTop: 6,
                }}
              >
                На главную
              </button>
            </div>
          )}

          {!done && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, borderTop: `1px solid ${c.lineSoft}`, paddingTop: 22 }}>
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="h-soft"
                style={{
                  border: `1px solid ${c.lineStrong}`,
                  background: c.white,
                  font: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  color: c.ink,
                  padding: '13px 22px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  visibility: step > 0 ? 'visible' : 'hidden',
                }}
              >
                Назад
              </button>
              <button
                type="button"
                onClick={next}
                className="h-violet"
                style={{
                  border: 0,
                  background: c.violet,
                  color: c.white,
                  font: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '13px 26px',
                  borderRadius: 14,
                  cursor: 'pointer',
                }}
              >
                {last ? 'Опубликовать' : 'Далее'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
