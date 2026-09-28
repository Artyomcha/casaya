'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { money } from '@/i18n/format';
import type { Locale } from '@/i18n/locales';
import type { AnalyticsRow, CrmLead } from '@/lib/types';
import { c } from '@/lib/theme';

const AGENCY_KEY = 'casaya:agencyId';

/** Стадии воронки в порядке движения сделки. */
const STAGES = [
  { key: 'NEW', label: 'Новые', color: c.violet },
  { key: 'CONTACTED', label: 'Связались', color: c.blue },
  { key: 'VIEWING', label: 'Показ', color: c.cyan },
  { key: 'NEGOTIATION', label: 'Переговоры', color: c.amber },
  { key: 'WON', label: 'Сделка', color: c.green },
  { key: 'LOST', label: 'Отказ', color: c.greyLight },
] as const;

const PROMO_LABEL: Record<string, string> = {
  BUMP: 'Subida',
  FEATURED: 'Destacado',
  TOP_AREA: 'Top района',
};

interface Pipeline {
  columns: { status: string; leads: CrmLead[] }[];
  total: number;
  conversion: number;
  overdue: number;
}

export function CrmBoard({ locale }: { locale: Locale }) {
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [analytics, setAnalytics] = useState<{ totals: { impressions: number; clicks: number; leads: number; ctr: number }; rows: AnalyticsRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAgencyId(localStorage.getItem(AGENCY_KEY));
    } catch {
      /* приватный режим */
    }
  }, []);

  const load = useCallback(async (id: string) => {
    try {
      const [p, a] = await Promise.all([api.pipeline(id), api.crmAnalytics(id)]);
      setPipeline(p);
      setAnalytics(a);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (agencyId) void load(agencyId);
  }, [agencyId, load]);

  const move = async (leadId: string, status: string) => {
    setBusy(leadId);
    try {
      await api.moveLead(leadId, status);
      if (agencyId) await load(agencyId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const promote = async (listingId: string, tier: string) => {
    setBusy(listingId);
    try {
      await api.buyPromotion(listingId, tier);
      if (agencyId) await load(agencyId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!agencyId) {
    return (
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em' }}>CRM</h1>
        <p style={{ fontSize: 16, color: c.muted, lineHeight: 1.6, marginTop: 12 }}>
          Сначала заведите агентство в кабинете — CRM привяжется к нему.
        </p>
      </section>
    );
  }

  return (
    <main>
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px,3vw,38px)', fontWeight: 700, letterSpacing: '-0.04em' }}>CRM</h1>
          {pipeline && (
            <div style={{ fontSize: 15, color: c.muted, marginTop: 8 }}>
              Откликов: <strong style={{ color: c.ink }}>{pipeline.total}</strong> · конверсия в сделку{' '}
              <strong style={{ color: c.ink }}>{Math.round(pipeline.conversion * 100)}%</strong>
              {pipeline.overdue > 0 && (
                <> · <strong style={{ color: c.coralDark }}>просрочено {pipeline.overdue}</strong></>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: c.coralTint, color: c.coralDark, borderRadius: 14, padding: '12px 16px', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Воронка: колонка на стадию, карточка отклика двигается кнопками. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, alignItems: 'start' }}>
          {STAGES.map((stage, stageIndex) => {
            const column = pipeline?.columns.find((col) => col.status === stage.key);
            const leads = column?.leads ?? [];

            return (
              <div key={stage.key} style={{ background: c.surface, borderRadius: 20, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: stage.color }} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{stage.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 13, color: c.grey }}>{leads.length}</span>
                </div>

                {leads.map((lead) => {
                  const overdue = lead.nextStepAt && new Date(lead.nextStepAt) < new Date();
                  const next = STAGES[stageIndex + 1];

                  return (
                    <div key={lead.id} style={{ background: c.white, borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{lead.name ?? 'Без имени'}</div>
                      {lead.budget && (
                        <div style={{ fontSize: 13, color: c.muted, fontVariantNumeric: 'tabular-nums' }}>
                          бюджет {money(lead.budget, locale)}
                          {lead.needsMortgage && ' · ипотека'}
                        </div>
                      )}
                      {lead.listing && (
                        <div style={{ fontSize: 12, color: c.grey, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lead.listing.title}
                        </div>
                      )}
                      {overdue && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: c.coralDark }}>просрочен следующий шаг</div>
                      )}
                      {next && (
                        <button
                          type="button"
                          onClick={() => move(lead.id, next.key)}
                          disabled={busy === lead.id}
                          className="h-soft"
                          style={{
                            marginTop: 2,
                            border: `1px solid ${c.lineStrong}`,
                            background: c.white,
                            borderRadius: 10,
                            padding: '7px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          → {next.label}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* Аналитика: за что агентство платит и что это приносит. */}
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px 0' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Объявления и продвижение
        </h2>

        {analytics && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 12, fontSize: 15, color: c.muted }}>
            <span>показов <strong style={{ color: c.ink }}>{analytics.totals.impressions.toLocaleString('ru-RU')}</strong></span>
            <span>кликов <strong style={{ color: c.ink }}>{analytics.totals.clicks.toLocaleString('ru-RU')}</strong></span>
            <span>CTR <strong style={{ color: c.ink }}>{(analytics.totals.ctr * 100).toFixed(1)}%</strong></span>
            <span>откликов <strong style={{ color: c.ink }}>{analytics.totals.leads}</strong></span>
          </div>
        )}

        <div style={{ marginTop: 20, border: `1px solid ${c.line}`, borderRadius: 20, overflow: 'hidden' }}>
          {analytics?.rows.map((row, i) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px,2fr) repeat(4,minmax(70px,1fr)) minmax(160px,auto)',
                gap: 14,
                alignItems: 'center',
                padding: '14px 18px',
                borderTop: `1px solid ${i ? c.line : 'transparent'}`,
                fontSize: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <img src={row.coverImage} alt="" style={{ width: 44, height: 34, objectFit: 'cover', borderRadius: 8 }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.title}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: c.grey }}>{money(row.price, locale)}</span>
                </span>
              </div>

              {[
                ['показы', row.impressions.toLocaleString('ru-RU')],
                ['клики', row.clicks.toLocaleString('ru-RU')],
                ['CTR', `${(row.ctr * 100).toFixed(1)}%`],
                ['отклики', String(row.leads)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: c.grey }}>{label}</div>
                  <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                </div>
              ))}

              {row.promotion ? (
                <span
                  style={{
                    background: c.violetTint,
                    color: c.violetDeep,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '7px 12px',
                    borderRadius: 999,
                    textAlign: 'center',
                  }}
                >
                  {PROMO_LABEL[row.promotion.tier] ?? row.promotion.tier} · до{' '}
                  {new Date(row.promotion.endsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['FEATURED', 'TOP_AREA'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => promote(row.id, tier)}
                      disabled={busy === row.id}
                      className="h-soft"
                      style={{
                        border: `1px solid ${c.lineStrong}`,
                        background: c.white,
                        borderRadius: 10,
                        padding: '7px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        font: 'inherit',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {PROMO_LABEL[tier]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
