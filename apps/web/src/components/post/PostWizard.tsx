'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChoiceCards, ChoicePills } from '@/components/ui/Segmented';
import { Check, Plus, Shield } from '@/components/ui/icons';
import type { Dictionary } from '@/i18n/getDictionary';
import { localePath, type Locale } from '@/i18n/locales';
import { api } from '@/lib/api';
import { c } from '@/lib/theme';

type DealKey = 'sell' | 'rent';
type WhoKey = 'owner' | 'agency';
type TypeKey = 'flat' | 'house' | 'pent' | 'town' | 'com';
type TariffKey = 'free' | 'dest' | 'top';

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

export function PostWizard({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [deal, setDeal] = useState<DealKey>('sell');
  const [who, setWho] = useState<WhoKey>('owner');
  const [type, setType] = useState<TypeKey>('flat');
  const [tariff, setTariff] = useState<TariffKey>('free');
  const [values, setValues] = useState<Record<string, string>>({});

  const stepLabels = [dict.post.stepType, dict.post.stepObject, dict.post.stepPhotos, dict.post.stepPrice];

  const deals: { key: DealKey; label: string }[] = [
    { key: 'sell', label: dict.post.dealSell },
    { key: 'rent', label: dict.post.dealRent },
  ];

  const whos: { key: WhoKey; label: string }[] = [
    { key: 'owner', label: dict.post.whoOwner },
    { key: 'agency', label: dict.post.whoAgency },
  ];

  const types: { key: TypeKey; label: string }[] = [
    { key: 'flat', label: dict.post.typeFlat },
    { key: 'house', label: dict.post.typeHouse },
    { key: 'pent', label: dict.post.typePenthouse },
    { key: 'town', label: dict.post.typeTownhouse },
    { key: 'com', label: dict.post.typeCommercial },
  ];

  const fields = [
    { name: 'address', label: dict.post.fieldAddress, ph: dict.post.fieldAddressPlaceholder },
    { name: 'area', label: dict.post.fieldArea, ph: '85' },
    { name: 'bedrooms', label: dict.post.fieldBedrooms, ph: '2' },
    { name: 'bathrooms', label: dict.post.fieldBathrooms, ph: '2' },
  ];

  const photoSlots = [
    dict.post.photoMain,
    dict.post.photoLiving,
    dict.post.photoKitchen,
    dict.post.photoBedroom,
    dict.post.photoBathroom,
    dict.post.photoView,
  ];

  const tariffs: { key: TariffKey; label: string; price: string; d: string }[] = [
    { key: 'free', label: dict.post.tariffFree, price: '0 €', d: dict.post.tariffFreeText },
    { key: 'dest', label: dict.post.tariffFeatured, price: '19,90 € / 7d', d: dict.post.tariffFeaturedText },
    { key: 'top', label: dict.post.tariffTop, price: '39,90 € / 7d', d: dict.post.tariffTopText },
  ];

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
          <h1 style={{ margin: 0, fontSize: 'clamp(30px,3.4vw,42px)', letterSpacing: '-0.045em', fontWeight: 700 }}>{dict.post.title}</h1>
          <p style={{ margin: 0, fontSize: 16, color: c.muted }}>{dict.post.lead}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {stepLabels.map((label, i) => (
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
                <span style={groupLabel}>{dict.post.dealQuestion}</span>
                <ChoiceCards options={deals} value={deal} onChange={setDeal} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={groupLabel}>{dict.post.whoQuestion}</span>
                <ChoiceCards options={whos} value={who} onChange={setWho} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={groupLabel}>{dict.post.typeQuestion}</span>
                <ChoicePills options={types} value={type} onChange={setType} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {fields.map((f) => (
                <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, color: c.muted }}>{f.label}</span>
                  <input placeholder={f.ph} value={values[f.name] ?? ''} onChange={set(f.name)} style={inputStyle} />
                </label>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, color: c.muted }}>{dict.post.fieldDescription}</span>
                <textarea
                  rows={5}
                  placeholder={dict.post.fieldDescriptionPlaceholder}
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
                {photoSlots.map((slot) => (
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
                  <strong>{dict.post.verifyHintTitle}</strong> {dict.post.verifyHintText}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, color: c.muted }}>{dict.post.fieldPrice}</span>
                <input
                  placeholder="289 000"
                  value={values.price ?? ''}
                  onChange={set('price')}
                  style={{ ...inputStyle, fontSize: 22, fontWeight: 600 }}
                />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={groupLabel}>{dict.post.promotion}</span>
                {tariffs.map((t) => {
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
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>{dict.post.doneTitle}</div>
              <div style={{ fontSize: 15, color: c.muted, maxWidth: 420, lineHeight: 1.55 }}>
                {dict.post.doneText}
              </div>
              <button
                type="button"
                onClick={() => router.push(localePath(locale))}
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
                {dict.post.doneCta}
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
                {dict.post.back}
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
                {last ? dict.post.publish : dict.post.next}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
