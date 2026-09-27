'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LeadForm, WHITE_ON_LILAC_THEME } from '@/components/forms/LeadForm';
import { Check } from '@/components/ui/icons';
import type { Plan } from '@/lib/types';
import { c } from '@/lib/theme';

const CRMS = ['Inmovilla', 'Witei', 'Mobilia', 'Idealista Tools', 'Resales Online', 'Kyero XML'];

const FEATURES = [
  { n: '01', t: 'Фид за 15 минут', d: 'Вставьте ссылку на XML-выгрузку вашей CRM. Объекты, цены и статусы обновляются автоматически.', bg: c.violetTint, fg: c.violet },
  { n: '02', t: 'Только живые отклики', d: 'Покупатели пишут с профилем: бюджет, сроки, ипотека. Без анонимного спама.', bg: c.greenTint, fg: c.greenText },
  { n: '03', t: 'Покупатели из 7 стран', d: 'Объявления переводятся на RU, EN, NL, DE, SV, PL и FR автоматически.', bg: c.coralTint, fg: c.coralDark },
];

const h2: React.CSSProperties = { margin: 0, fontSize: 'clamp(28px,3vw,38px)', letterSpacing: '-0.04em', fontWeight: 700 };

export function ProScreen({ plans }: { plans: Plan[] }) {
  const [selected, setSelected] = useState(plans.find((p) => p.tag)?.key ?? plans[0]?.key ?? 'pro');
  const planName = plans.find((p) => p.key === selected)?.name ?? '—';

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
            <span style={{ fontSize: 14, fontWeight: 600, color: c.lilac }}>Casaya Pro</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(36px,4.6vw,58px)', lineHeight: 1.02, letterSpacing: '-0.045em', fontWeight: 700, textWrap: 'balance' }}>
              Больше покупателей из-за рубежа. Базовое размещение бесплатно.
            </h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: '#B5AECB', maxWidth: 480 }}>
              Подключите XML-фид вашей CRM за 15 минут. Объекты обновляются автоматически, отклики приходят с профилями покупателей.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <a
                href="#pro-lead"
                className="h-violet-light"
                style={{ border: 0, background: c.violet, color: c.white, font: 'inherit', fontSize: 15, fontWeight: 600, padding: '14px 22px', borderRadius: 14, cursor: 'pointer' }}
              >
                Подключить агентство
              </a>
              <Link
                href="/pro/cabinet"
                className="h-ink"
                style={{ border: '1px solid #3A3158', background: 'transparent', color: c.white, font: 'inherit', fontSize: 15, fontWeight: 500, padding: '14px 22px', borderRadius: 14, cursor: 'pointer' }}
              >
                Кабинет агентства
              </Link>
            </div>
          </div>
          <div style={{ position: 'relative', minHeight: 420 }}>
            <img src="/img/pro-hero.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 14, color: c.grey }}>Работаем с CRM</span>
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
          {FEATURES.map((f) => (
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
        <h2 style={h2}>Тарифы</h2>
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
            <h2 style={{ ...h2, fontSize: 'clamp(28px,3.4vw,40px)', lineHeight: 1.08 }}>Подключить агентство</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: c.inkSoft }}>
              Выбранный тариф: <strong style={{ color: c.ink }}>{planName}</strong>. Менеджер проверит фид и активирует аккаунт в течение дня.
            </p>
          </div>

          <LeadForm
            kind="AGENCY"
            theme={WHITE_ON_LILAC_THEME}
            payload={{ planKey: selected }}
            fields={[
              { name: 'name', placeholder: 'Название агентства' },
              { name: 'email', placeholder: 'Email', type: 'email' },
              { name: 'phone', placeholder: 'Телефон', type: 'tel' },
              { name: 'feedUrl', placeholder: 'Ссылка на XML-фид (необязательно)' },
            ]}
            submitLabel="Отправить заявку"
            doneTitle="Заявка принята"
            doneText="Инструкция по подключению фида отправлена на вашу почту."
          />
        </div>
      </section>
    </main>
  );
}
