import { LIGHT_THEME, LeadForm } from '@/components/forms/LeadForm';
import { PlusSubscribeButton } from '@/components/services/PlusSubscribeButton';
import { Check, PathIcon } from '@/components/ui/icons';
import { api, safe } from '@/lib/api';
import { c } from '@/lib/theme';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Сервисы Casaya — покупка в Испании под ключ',
  description: 'NIE, ипотека, юрист, задаток и перевод денег в одном месте. Статус каждого шага виден в личном кабинете.',
};

const DEAL_STEPS = [
  { n: '01', t: 'Подбор', d: 'Проверенные объекты и видео-осмотр' },
  { n: '02', t: 'NIE и счёт', d: 'Оформляем удалённо за 2–4 недели' },
  { n: '03', t: 'Задаток', d: 'Через Casaya Escrow' },
  { n: '04', t: 'Ипотека и юрист', d: 'Проверка объекта и одобрение' },
  { n: '05', t: 'Нотариус', d: 'Лично или по доверенности' },
  { n: '06', t: 'Ключи', d: 'Регистрация, коммуналка, переезд' },
];

const PLUS_FEATURES = [
  'Мгновенные уведомления о новых объектах',
  'Доступ к объектам за 24 часа до публикации',
  'Безлимит заявок собственникам',
  'Верифицированный профиль арендатора',
];

const h2: React.CSSProperties = { margin: 0, fontSize: 'clamp(28px,3vw,38px)', letterSpacing: '-0.04em', fontWeight: 700 };

export default async function Page() {
  const services = await safe(api.services('FULL'), []);

  return (
    <main>
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: c.violet }}>Сервисы Casaya</span>
        <h1 style={{ margin: 0, fontSize: 'clamp(36px,4.6vw,60px)', lineHeight: 1.02, letterSpacing: '-0.045em', fontWeight: 700, maxWidth: 860, textWrap: 'balance' }}>
          Покупка в Испании под ключ, даже если вы в другой стране
        </h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: c.inkSoft, maxWidth: 620 }}>
          NIE, ипотека, юрист, задаток и перевод денег в одном месте. Вы видите статус каждого шага в личном кабинете.
        </p>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
          {services.map((s) => (
            <div
              key={s.id}
              style={{
                border: `1px solid ${c.line}`,
                borderRadius: 24,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                background: c.white,
              }}
            >
              <span style={{ width: 52, height: 52, borderRadius: 16, background: s.bg, color: s.fg, display: 'grid', placeItems: 'center' }}>
                <PathIcon d={s.icon} size={24} />
              </span>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.fg }}>{s.brand}</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 6 }}>{s.title}</div>
                <div style={{ fontSize: 15, lineHeight: 1.55, color: c.inkSoft, marginTop: 8 }}>{s.description}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${c.lineSoft}`, paddingTop: 18 }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.price}</span>
                <a
                  href="#service-lead"
                  className="h-ink-to-violet"
                  style={{ border: 0, background: c.ink, color: c.white, font: 'inherit', fontSize: 14, fontWeight: 600, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}
                >
                  Заказать
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0' }}>
        <h2 style={h2}>Шесть шагов до ключей</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
            gap: 0,
            marginTop: 28,
            borderTop: `2px solid ${c.violet}`,
          }}
        >
          {DEAL_STEPS.map((d) => (
            <div key={d.n} style={{ padding: '20px 20px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: c.violet, marginTop: -27, boxShadow: `0 0 0 5px ${c.white}` }} />
              <span className="mono" style={{ fontSize: 13, color: c.violet }}>
                {d.n}
              </span>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{d.t}</span>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: c.muted }}>{d.d}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="plus" style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0', scrollMarginTop: 92 }}>
        <div
          style={{
            background: c.violetTint,
            borderRadius: 32,
            padding: 'clamp(28px,5vw,56px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ alignSelf: 'flex-start', background: c.violet, color: c.white, fontSize: 13, fontWeight: 700, padding: '6px 12px', borderRadius: 999 }}>
              Casaya+
            </span>
            <h2 style={{ ...h2, fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1.08 }}>Для тех, кто снимает: квартиры раньше всех</h2>
            <div style={{ fontSize: 18, color: c.inkSoft }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: c.ink, letterSpacing: '-0.03em' }}>9,90 €</span> / месяц
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PLUS_FEATURES.map((p) => (
              <div key={p} style={{ background: c.white, borderRadius: 16, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center', fontSize: 16 }}>
                <Check size={18} color={c.violet} width={2.6} style={{ flexShrink: 0 }} />
                {p}
              </div>
            ))}
            <PlusSubscribeButton />
          </div>
        </div>
      </section>

      <section id="service-lead" style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 32px 0', scrollMarginTop: 92 }}>
        <div
          style={{
            border: `1px solid ${c.line}`,
            borderRadius: 32,
            padding: 'clamp(28px,5vw,56px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
            gap: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ ...h2, fontSize: 'clamp(28px,3.4vw,40px)', lineHeight: 1.08 }}>Бесплатная консультация</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: c.inkSoft }}>
              Менеджер говорит на русском, английском, нидерландском и немецком.
            </p>
          </div>

          <LeadForm
            kind="SERVICE"
            theme={LIGHT_THEME}
            fields={[
              { name: 'name', placeholder: 'Имя' },
              { name: 'email', placeholder: 'Email или телефон' },
              { name: 'message', placeholder: 'Что вас интересует' },
            ]}
            submitLabel="Получить консультацию"
            doneTitle="Спасибо, заявка принята"
            doneText="Мы перезвоним в течение 2 часов в рабочее время."
          />
        </div>
      </section>
    </main>
  );
}
