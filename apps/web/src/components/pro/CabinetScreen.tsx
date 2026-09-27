'use client';

import { useCallback, useEffect, useState } from 'react';
import { FeedConnect } from '@/components/pro/FeedConnect';
import { api } from '@/lib/api';
import type { AgencyDashboard, FeedStatus } from '@/lib/types';
import { c } from '@/lib/theme';

const AGENCY_KEY = 'casaya:agencyId';

const STATUS_STYLE: Record<FeedStatus, { bg: string; fg: string; label: string }> = {
  ACTIVE: { bg: c.greenTint, fg: c.greenText, label: 'Активен' },
  PENDING: { bg: c.violetTint, fg: c.violet, label: 'Первая загрузка' },
  PAUSED: { bg: c.surfaceAlt, fg: c.grey, label: 'На паузе' },
  ERROR: { bg: c.coralTint, fg: c.coralDark, label: 'Ошибка' },
};

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

const dt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function CabinetScreen() {
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [data, setData] = useState<AgencyDashboard | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', crm: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setAgencyId(localStorage.getItem(AGENCY_KEY));
    } catch {
      /* приватный режим */
    }
  }, []);

  const load = useCallback(async (id: string) => {
    try {
      setData(await api.agencyDashboard(id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (agencyId) void load(agencyId);
  }, [agencyId, load]);

  const register = async () => {
    setBusy(true);
    setError(null);
    try {
      const agency = await api.registerAgency(form);
      localStorage.setItem(AGENCY_KEY, agency.id);
      setAgencyId(agency.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sync = async (feedId: string) => {
    setBusy(true);
    try {
      await api.syncFeed(feedId);
      if (agencyId) await load(agencyId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!agencyId) {
    return (
      <main>
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: c.violet }}>Casaya Pro</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(30px,3.4vw,42px)', letterSpacing: '-0.045em', fontWeight: 700 }}>Кабинет агентства</h1>
            <p style={{ margin: 0, fontSize: 16, color: c.muted, lineHeight: 1.6 }}>
              Зарегистрируйте агентство — и сразу подключайте XML-фид. Базовое размещение бесплатно 12 месяцев.
            </p>
          </div>

          <div style={{ border: `1px solid ${c.line}`, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              ['name', 'Название агентства'],
              ['email', 'Email'],
              ['phone', 'Телефон'],
              ['crm', 'CRM (Inmovilla, Witei…)'],
            ] as const).map(([name, ph]) => (
              <input
                key={name}
                value={form[name]}
                onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                placeholder={ph}
                style={inputStyle}
              />
            ))}

            {error && <div style={{ fontSize: 14, color: c.coralDark }}>{error}</div>}

            <button
              type="button"
              onClick={register}
              disabled={busy || !form.name || !form.email}
              className="h-violet"
              style={{
                border: 0,
                background: c.violet,
                color: c.white,
                font: 'inherit',
                fontSize: 16,
                fontWeight: 600,
                padding: 16,
                borderRadius: 14,
                cursor: busy ? 'progress' : 'pointer',
                opacity: form.name && form.email ? 1 : 0.5,
              }}
            >
              Создать кабинет
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main>
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px 0' }}>
          <div style={{ fontSize: 16, color: c.muted }}>{error ?? 'Загружаем кабинет…'}</div>
        </section>
      </main>
    );
  }

  const { agency, inventory, feeds, lastRun, leads } = data;

  return (
    <main>
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: agency.brandColor,
                color: c.white,
                display: 'grid',
                placeItems: 'center',
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              {agency.initials}
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(26px,3vw,36px)', letterSpacing: '-0.04em', fontWeight: 700 }}>{agency.name}</h1>
              <div style={{ fontSize: 14, color: c.muted, marginTop: 2 }}>
                Тариф: {agency.plan?.name ?? 'Старт'}
                {agency.freeUntil && ` · бесплатно до ${dt.format(new Date(agency.freeUntil))}`}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {[
            ['Опубликовано', String(inventory.published), c.violetTint, c.violet],
            ['С бейджем Verificado', `${inventory.verified} · ${Math.round(inventory.verifiedShare * 100)}%`, c.greenTint, c.greenText],
            ['В архиве', String(inventory.archived), c.surface, c.grey],
            ['Новых откликов', String(data.newLeads), c.coralTint, c.coralDark],
          ].map(([label, value, bg, fg]) => (
            <div key={label} style={{ background: bg, borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            </div>
          ))}
        </div>

        {lastRun && (
          <div style={{ fontSize: 14, color: c.muted }}>
            Последняя синхронизация {dt.format(new Date(lastRun.startedAt))}: разобрано {lastRun.parsed}, новых {lastRun.created},
            обновлено {lastRun.updated}, снято {lastRun.archived}
            {lastRun.error && <span style={{ color: c.coralDark }}> · {lastRun.error}</span>}
          </div>
        )}
      </section>

      <section
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '32px 32px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <FeedConnect agencyId={agencyId} onConnected={() => load(agencyId)} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Подключённые фиды</div>

          {!feeds.length && (
            <div style={{ background: c.surface, borderRadius: 18, padding: 20, fontSize: 15, color: c.muted }}>
              Пока ни одного фида. Подключите первый — объекты появятся в выдаче в течение нескольких минут.
            </div>
          )}

          {feeds.map((f) => {
            const s = STATUS_STYLE[f.status];
            return (
              <div key={f.id} style={{ border: `1px solid ${c.line}`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: s.bg, color: s.fg, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>{s.label}</span>
                  <span style={{ fontSize: 13, color: c.grey }}>
                    {f.format} · каждые {f.intervalMin} мин
                  </span>
                </div>

                <div style={{ fontSize: 14, color: c.ink, wordBreak: 'break-all' }}>{f.url}</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: c.muted }}>
                    {f.listingCount} объектов
                    {f.lastOkAt && ` · обновлён ${dt.format(new Date(f.lastOkAt))}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => sync(f.id)}
                    disabled={busy}
                    className="h-soft"
                    style={{
                      border: `1px solid ${c.lineStrong}`,
                      background: c.white,
                      font: 'inherit',
                      fontSize: 14,
                      fontWeight: 600,
                      color: c.ink,
                      padding: '9px 16px',
                      borderRadius: 12,
                      cursor: busy ? 'progress' : 'pointer',
                    }}
                  >
                    Синхронизировать
                  </button>
                </div>

                {f.lastError && <div style={{ fontSize: 13, color: c.coralDark }}>{f.lastError}</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Отклики</div>

        {!leads.length ? (
          <div style={{ background: c.surface, borderRadius: 18, padding: 20, fontSize: 15, color: c.muted, marginTop: 12 }}>
            Откликов пока нет. Они появятся, как только покупатели начнут писать по вашим объектам.
          </div>
        ) : (
          <div style={{ marginTop: 12, border: `1px solid ${c.line}`, borderRadius: 20, overflow: 'hidden' }}>
            {leads.map((l, i) => (
              <div
                key={l.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(140px,1fr) minmax(160px,1fr) minmax(0,2fr) auto',
                  gap: 16,
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderTop: `1px solid ${i ? c.line : 'transparent'}`,
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 600 }}>{l.name ?? 'Без имени'}</span>
                <span style={{ color: c.muted }}>{l.email ?? l.phone ?? '—'}</span>
                <span style={{ color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.listing?.title ?? '—'}
                </span>
                <span style={{ color: c.grey, whiteSpace: 'nowrap' }}>{dt.format(new Date(l.createdAt))}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
