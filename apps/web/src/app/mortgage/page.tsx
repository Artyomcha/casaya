import { MortgageCalculator } from '@/components/home/MortgageCalculator';
import { DARK_GREEN_THEME, LeadForm } from '@/components/forms/LeadForm';
import { Check } from '@/components/ui/icons';
import { api, safe } from '@/lib/api';
import { c } from '@/lib/theme';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ипотека в Испании для нерезидентов — Casaya Hipotecas',
  description: 'Сравниваем предложения 14 банков и получаем предварительное одобрение до вашей поездки. Для покупателя бесплатно.',
};

const BULLETS = [
  'Кредит до 70% стоимости для нерезидентов',
  'Одобрение за 5–10 рабочих дней',
  'Сопровождение до подписания у нотариуса',
];

const STEPS = [
  { n: '01', t: 'Расчёт и заявка', d: 'Указываете доход, страну и бюджет. Брокер подбирает 3–4 банка.' },
  { n: '02', t: 'Документы', d: 'Справка о доходах, налоговая декларация, выписки. Перевод делаем мы.' },
  { n: '03', t: 'Одобрение и оценка', d: 'Банк выдаёт предварительное решение и заказывает оценку объекта.' },
  { n: '04', t: 'Подписание', d: 'Кредит подписывается у нотариуса вместе с договором купли-продажи.' },
];

const h2: React.CSSProperties = { margin: 0, fontSize: 'clamp(28px,3vw,38px)', letterSpacing: '-0.04em', fontWeight: 700 };

export default async function Page() {
  const banks = await safe(api.banks(), []);

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
          <span style={{ fontSize: 14, fontWeight: 600, color: c.greenText }}>Casaya Hipotecas</span>
          <h1 style={{ margin: 0, fontSize: 'clamp(36px,4.6vw,60px)', lineHeight: 1.02, letterSpacing: '-0.045em', fontWeight: 700, textWrap: 'balance' }}>
            Ипотека в Испании для нерезидентов
          </h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: c.inkSoft, maxWidth: 520 }}>
            Сравниваем предложения 14 банков и получаем предварительное одобрение до вашей поездки. Для покупателя бесплатно.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {BULLETS.map((b) => (
              <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 16 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: c.greenTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Check size={12} color={c.green} width={3.2} />
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>

        <MortgageCalculator variant="page" />
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0' }}>
        <h2 style={h2}>Предложения банков</h2>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: c.grey }}>
          Ориентировочные условия для нерезидентов. Итоговая ставка зависит от дохода и страны.
        </p>

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
                ['Ставка', b.rate],
                ['Кредит', b.ltv],
                ['Срок', b.term],
                ['Решение', b.decisionTime],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: c.grey }}>{k}</div>
                  <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                </div>
              ))}
              <a
                href="#mortgage-lead"
                className="h-bank"
                style={{
                  border: `1px solid ${c.lineStrong}`,
                  background: c.white,
                  font: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  color: c.ink,
                  padding: '10px 16px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Подать заявку
              </a>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0' }}>
        <h2 style={h2}>Как получить ипотеку</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 24 }}>
          {STEPS.map((s) => (
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
            <h2 style={{ ...h2, fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1.08 }}>Заявка на предварительное одобрение</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#B8DCCD' }}>
              Ипотечный брокер свяжется с вами в течение рабочего дня и подготовит список документов.
            </p>
          </div>

          <LeadForm
            kind="MORTGAGE"
            theme={DARK_GREEN_THEME}
            fields={[
              { name: 'name', placeholder: 'Имя и фамилия' },
              { name: 'email', placeholder: 'Email', type: 'email' },
              { name: 'phone', placeholder: 'Телефон', type: 'tel' },
              { name: 'country', placeholder: 'Страна налогового резидентства' },
            ]}
            submitLabel="Отправить заявку"
            doneTitle="Заявка отправлена"
            doneText="Брокер Casaya Hipotecas свяжется с вами в течение рабочего дня."
          />
        </div>
      </section>
    </main>
  );
}
