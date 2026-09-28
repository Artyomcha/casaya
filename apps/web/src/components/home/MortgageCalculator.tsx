'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Segmented } from '@/components/ui/Segmented';
import type { Dictionary } from '@/i18n/getDictionary';
import { money } from '@/i18n/format';
import { localePath, type Locale } from '@/i18n/locales';
import { c } from '@/lib/theme';

/** Базовая ставка партнёрских банков — та же, что в API. */
export const BASE_RATE = 0.032;

const TERMS = [10, 15, 20, 25];

export function monthlyPayment(price: number, downPercent: number, termYears: number, rate = BASE_RATE) {
  const loan = price * (1 - downPercent / 100);
  const r = rate / 12;
  const n = termYears * 12;
  return { loan, monthly: (loan * r) / (1 - Math.pow(1 + r, -n)) };
}

function Slider({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: c.muted }}>
        <span>{label}</span>
        <span style={{ color: c.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{valueLabel}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/**
 * Калькулятор ипотеки. Два вида: блок на главной (с зелёной панелью результата)
 * и карточка в шапке страницы «Ипотека».
 */
export function MortgageCalculator({
  variant,
  dict,
  locale,
}: {
  variant: 'home' | 'page';
  dict: Dictionary;
  locale: Locale;
}) {
  const [price, setPrice] = useState(300000);
  const [down, setDown] = useState(30);
  const [term, setTerm] = useState(25);

  const { loan, monthly } = useMemo(() => monthlyPayment(price, down, term), [price, down, term]);
  const fmt = (value: number) => money(value, locale);

  const sliders = (
    <>
      <Slider label={dict.mortgageBlock.propertyPrice} valueLabel={fmt(price)} min={80000} max={1500000} step={5000} value={price} onChange={setPrice} />
      <Slider label={dict.mortgageBlock.downPayment} valueLabel={`${down}% · ${fmt((price * down) / 100)}`} min={30} max={70} step={5} value={down} onChange={setDown} />
    </>
  );

  const termPicker = (
    <Segmented
      options={TERMS.map((t) => ({ key: t, label: `${t} ${dict.mortgageBlock.years}` }))}
      value={term}
      onChange={setTerm}
      columns={4}
    />
  );

  if (variant === 'page') {
    return (
      <div
        style={{
          border: `1px solid ${c.line}`,
          borderRadius: 28,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxShadow: '0 24px 48px -24px rgba(45,20,110,0.18)',
          background: c.white,
        }}
      >
        {sliders}
        {termPicker}
        <div
          style={{
            background: c.greenTint,
            borderRadius: 20,
            padding: 22,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: c.greenMid }}>{dict.mortgage.monthlyPayment}</div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', color: c.greenDark, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(monthly)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: c.greenMid }}>{dict.mortgageBlock.loan}</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: c.greenDark, fontVariantNumeric: 'tabular-nums' }}>{fmt(loan)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
        gap: 20,
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          border: `1px solid ${c.line}`,
          borderRadius: 28,
          padding: 'clamp(24px,4vw,44px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: c.violet }}>{dict.mortgageBlock.brand}</span>
          <h2 style={{ margin: '10px 0 0', fontSize: 'clamp(28px,3vw,38px)', lineHeight: 1.1, letterSpacing: '-0.04em', fontWeight: 700 }}>
            {dict.mortgageBlock.title}
          </h2>
        </div>
        {sliders}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 14, color: c.muted }}>{dict.mortgageBlock.term}</span>
          {termPicker}
        </div>
      </div>

      <div
        style={{
          background: c.greenTint,
          borderRadius: 28,
          padding: 'clamp(24px,4vw,44px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 15, color: c.greenMid }}>{dict.mortgageBlock.monthly}</span>
          <span style={{ fontSize: 'clamp(44px,5vw,64px)', fontWeight: 700, letterSpacing: '-0.045em', color: c.greenDark, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(monthly)}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gap: 16,
            borderTop: '1px solid #C6E9DB',
            paddingTop: 24,
          }}
        >
          {[
            [dict.mortgageBlock.loan, fmt(loan)],
            [dict.mortgageBlock.rate, dict.mortgageBlock.rateValue],
            [dict.mortgageBlock.banks, dict.mortgageBlock.banksValue],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 13, color: c.greenMid }}>{k}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: c.greenDark, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            </div>
          ))}
        </div>

        <Link
          href={localePath(locale, 'mortgage')}
          className="h-green-dark"
          style={{
            border: 0,
            background: c.greenDark,
            color: c.white,
            font: 'inherit',
            fontSize: 16,
            fontWeight: 600,
            padding: '16px 22px',
            borderRadius: 14,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {dict.mortgageBlock.cta}
        </Link>
      </div>
    </div>
  );
}
