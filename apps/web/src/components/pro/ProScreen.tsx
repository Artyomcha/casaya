'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LeadForm, WHITE_ON_LILAC_THEME } from '@/components/forms/LeadForm';
import { Check } from '@/components/ui/icons';
import type { Dictionary } from '@/i18n/getDictionary';
import { localePath, type Locale } from '@/i18n/locales';
import type { Plan } from '@/lib/types';
import { c } from '@/lib/theme';

/** Названия CRM — имена собственные, не переводятся. */
const CRMS = ['Inmovilla', 'Witei', 'Mobilia', 'Idealista Tools', 'Resales Online', 'Kyero XML'];

const h2: React.CSSProperties = { margin: 0, fontSize: 'clamp(28px,3vw,38px)', letterSpacing: '-0.04em', fontWeight: 700 };

export function ProScreen({
  dict,
  locale,
  plans,
}: {
  dict: Dictionary;
  locale: Locale;
  plans: Plan[];
}) {
  const [selected, setSelected] = useState(plans.find((p) => p.tag)?.key ?? plans[0]?.key ?? 'pro');
  const planName = plans.find((p) => p.key === selected)?.name ?? '—';

  const features = [
    { n: '01', t: dict.pro.feature1Title, d: dict.pro.feature1Text, bg: c.violetTint, fg: c.violet },
    { n: '02', t: dict.pro.feature2Title, d: dict.pro.feature2Text, bg: c.greenTint, fg: c.greenText },
    { n: '03', t: dict.pro.feature3Title, d: dict.pro.feature3Text, bg: c.coralTint, fg: c.coralDark },
  ];

  return (
    <main>
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 0' }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 32,
            overflow: 'hidden',
            background: c.ink,
            color: c.white,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
          }}
        >
          <div style={{ padding: 'clamp(28px,5vw,64px)', display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: c.lilac }}>{dict.pro.brand}</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(36px,4.6vw,58px)', lineHeight: 1.02, letterSpacing: '-0.045em', fontWeight: 700, textWrap: 'balance' }}>
              {dict.pro.title}
            </h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: '#B5AECB', maxWidth: 480 }}>
              {dict.pro.lead}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <a
                href="#pro-lead"
                className="h-violet-light"
                style={{ border: 0, background: c.violet, color: c.white, font: 'inherit', fontSize: 15, fontWeight: 600, padding: '14px 22px', borderRadius: 14, cursor: 'pointer' }}
              >
                {dict.pro.connect}
              </a>
              <Link
                href={localePath(locale, 'pro/cabinet')}
                className="h-ink"
                style={{ border: '1px solid #3A3158', background: 'transparent', color: c.white, font: 'inherit', fontSize: 15, fontWeight: 500, padding: '14px 22px', borderRadius: 14, cursor: 'pointer' }}
              >
                {dict.pro.cabinet}
              </Link>
            </div>
          </div>
          <div style={{ position: 'relative', minHeight: 420 }}>
            <img src="/img/pro-hero.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 14, color: c.grey }}>{dict.pro.crmLabel}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CRMS.map((crm) => (
            <span key={crm} style={{ border: `1px solid ${c.lineStrong}`, borderRadius: 14, padding: '12px 18px', fontSize: 16, fontWeight: 600, color: c.ink }}>
              {crm}
            </span>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
          {features.map((f) => (
            <div key={f.n} style={{ background: f.bg, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 40, minHeight: 220 }}>
              <span className="mono" style={{ fontSize: 14, color: f.fg }}>
                {f.n}
              </span>
              <div>
                <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em' }}>{f.t}</div>
                <div style={{ fontSize: 15, lineHeight: 1.55, color: c.inkSoft, marginTop: 8 }}>{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="tariffs" style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0', scrollMarginTop: 92 }}>
        <h2 style={h2}>{dict.pro.tariffsTitle}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 14, marginTop: 24 }}>
          {plans.map((p) => {
            const active = p.key === selected;
            return (
              <div
                key={p.key}
                onClick={() => setSelected(p.key)}
                style={{
                  border: `2px solid ${active ? c.violet : c.line}`,
                  background: active ? c.violetTintPale : c.white,
                  borderRadius: 26,
                  padding: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 22,
                  cursor: 'pointer',
                  transition: 'border-color 150ms',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</span>
                  {p.tag && (
                    <span style={{ background: c.violet, color: c.white, fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 999 }}>
                      {p.tag}
                    </span>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.045em' }}>{p.price}</span>
                  <span style={{ fontSize: 15, color: c.grey }}> {p.per}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {p.items.map((i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: 15, lineHeight: 1.45 }}>
                      <Check size={18} color={c.violet} width={2.4} style={{ flexShrink: 0, marginTop: 1 }} />
                      {i}
                    </div>
                  ))}
                </div>

                <a
                  href="#pro-lead"
                  style={{
                    border: 0,
                    background: active ? c.violet : c.ink,
                    color: c.white,
                    font: 'inherit',
                    fontSize: 15,
                    fontWeight: 600,
                    padding: 14,
                    borderRadius: 14,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {p.cta}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pro-lead" style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0', scrollMarginTop: 92 }}>
        <div
          style={{
            background: c.violetTint,
            borderRadius: 32,
            padding: 'clamp(28px,5vw,56px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
            gap: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ ...h2, fontSize: 'clamp(28px,3.4vw,40px)', lineHeight: 1.08 }}>{dict.pro.formTitle}</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: c.inkSoft }}>
              {dict.pro.formTextPrefix} <strong style={{ color: c.ink }}>{planName}</strong>. {dict.pro.formTextSuffix}
            </p>
          </div>

          <LeadForm
            kind="AGENCY"
            theme={WHITE_ON_LILAC_THEME}
            payload={{ planKey: selected }}
            fields={[
              { name: 'name', placeholder: dict.pro.fieldAgency },
              { name: 'email', placeholder: dict.pro.fieldEmail, type: 'email' },
              { name: 'phone', placeholder: dict.pro.fieldPhone, type: 'tel' },
              { name: 'feedUrl', placeholder: dict.pro.fieldFeed },
            ]}
            submitLabel={dict.pro.submit}
            doneTitle={dict.pro.doneTitle}
            doneText={dict.pro.doneText}
          />
        </div>
      </section>
    </main>
  );
}
