import { notFound } from 'next/navigation';
import { MortgageCalculator } from '@/components/home/MortgageCalculator';
import { DARK_GREEN_THEME, LeadForm } from '@/components/forms/LeadForm';
import { Check } from '@/components/ui/icons';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { api, safe } from '@/lib/api';
import { c } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `${dict.mortgage.title} — Casaya Hipotecas`, description: dict.mortgage.lead };
}

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(28px,3vw,38px)',
  letterSpacing: '-0.04em',
  fontWeight: 700,
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, banks] = await Promise.all([getDictionary(locale), safe(api.banks(), [])]);

  const bullets = [dict.mortgage.bullet1, dict.mortgage.bullet2, dict.mortgage.bullet3];
  const steps = [
    { n: '01', t: dict.mortgage.step1Title, d: dict.mortgage.step1Text },
    { n: '02', t: dict.mortgage.step2Title, d: dict.mortgage.step2Text },
    { n: '03', t: dict.mortgage.step3Title, d: dict.mortgage.step3Text },
    { n: '04', t: dict.mortgage.step4Title, d: dict.mortgage.step4Text },
  ];

  return (
    <main>
      <section
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '40px 32px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: c.greenText }}>{dict.mortgage.brand}</span>
          <h1 style={{ margin: 0, fontSize: 'clamp(36px,4.6vw,60px)', lineHeight: 1.02, letterSpacing: '-0.045em', fontWeight: 700, textWrap: 'balance' }}>
            {dict.mortgage.title}
          </h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: c.inkSoft, maxWidth: 520 }}>
            {dict.mortgage.lead}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {bullets.map((b) => (
              <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 16 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: c.greenTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Check size={12} color={c.green} width={3.2} />
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>

        <MortgageCalculator variant="page" dict={dict} locale={locale} />
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0' }}>
        <h2 style={h2}>{dict.mortgage.banksTitle}</h2>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: c.grey }}>{dict.mortgage.banksNote}</p>

        <div style={{ marginTop: 24, border: `1px solid ${c.line}`, borderRadius: 24, overflow: 'hidden' }}>
          {banks.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px,1.6fr) repeat(4,minmax(90px,1fr)) auto',
                gap: 16,
                alignItems: 'center',
                padding: '18px 24px',
                borderTop: `1px solid ${i ? c.line : 'transparent'}`,
                fontSize: 15,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: b.brandColor, color: c.white, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
                  {b.initial}
                </span>
                <span style={{ fontWeight: 600 }}>{b.name}</span>
              </div>
              {[
                [dict.mortgage.colRate, b.rate],
                [dict.mortgage.colLoan, b.ltv],
                [dict.mortgage.colTerm, b.term],
                [dict.mortgage.colDecision, b.decisionTime],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: c.grey }}>{k}</div>
                  <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                </div>
              ))}
              <a
                href="#mortgage-lead"
                className="h-bank"
                style={{ border: `1px solid ${c.lineStrong}`, background: c.white, font: 'inherit', fontSize: 14, fontWeight: 600, color: c.ink, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {dict.mortgage.apply}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0' }}>
        <h2 style={h2}>{dict.mortgage.stepsTitle}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 24 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ background: c.surface, borderRadius: 22, padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
              <span className="mono" style={{ fontSize: 14, color: c.greenText }}>
                {s.n}
              </span>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: c.inkSoft, marginTop: 6 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="mortgage-lead" style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0', scrollMarginTop: 92 }}>
        <div
          style={{
            background: c.greenDark,
            borderRadius: 32,
            padding: 'clamp(28px,5vw,56px)',
            color: c.white,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
            gap: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ ...h2, fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1.08 }}>{dict.mortgage.formTitle}</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#B8DCCD' }}>{dict.mortgage.formText}</p>
          </div>

          <LeadForm
            kind="MORTGAGE"
            theme={DARK_GREEN_THEME}
            fields={[
              { name: 'name', placeholder: dict.mortgage.fieldName },
              { name: 'email', placeholder: dict.mortgage.fieldEmail, type: 'email' },
              { name: 'phone', placeholder: dict.mortgage.fieldPhone, type: 'tel' },
              { name: 'country', placeholder: dict.mortgage.fieldCountry },
            ]}
            submitLabel={dict.mortgage.submit}
            doneTitle={dict.mortgage.doneTitle}
            doneText={dict.mortgage.doneText}
          />
        </div>
      </section>
    </main>
  );
}
