'use client';

import { useCallback, useEffect, useState } from 'react';
import { FeedConnect } from '@/components/pro/FeedConnect';
import { LogoUpload } from '@/components/pro/LogoUpload';
import { PricingTable } from '@/components/pro/PricingTable';
import type { Dictionary } from '@/i18n/getDictionary';
import { LOCALE_TAGS, type Locale } from '@/i18n/locales';
import { api } from '@/lib/api';
import type { AgencyDashboard, FeedStatus } from '@/lib/types';
import { c } from '@/lib/theme';

const AGENCY_KEY = 'casaya:agencyId';

const STATUS_COLORS: Record<FeedStatus, { bg: string; fg: string }> = {
  ACTIVE: { bg: c.greenTint, fg: c.greenText },
  PENDING: { bg: c.violetTint, fg: c.violet },
  PAUSED: { bg: c.surfaceAlt, fg: c.grey },
  ERROR: { bg: c.coralTint, fg: c.coralDark },
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

export function CabinetScreen({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const dt = new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusLabel: Record<FeedStatus, string> = {
    ACTIVE: dict.cabinet.feedActive,
    PENDING: dict.cabinet.feedPending,
    PAUSED: dict.cabinet.feedPaused,
    ERROR: dict.cabinet.feedError,
  };

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
            <span style={{ fontSize: 14, fontWeight: 600, color: c.violet }}>{dict.pro.brand}</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(30px,3.4vw,42px)', letterSpacing: '-0.045em', fontWeight: 700 }}>{dict.cabinet.title}</h1>
            <p style={{ margin: 0, fontSize: 16, color: c.muted, lineHeight: 1.6 }}>
              {dict.cabinet.lead}
            </p>
          </div>

          <div style={{ border: `1px solid ${c.line}`, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              ['name', dict.cabinet.fieldAgency],
              ['email', dict.cabinet.fieldEmail],
              ['phone', dict.cabinet.fieldPhone],
              ['crm', dict.cabinet.fieldCrm],
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
              {dict.cabinet.create}
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
          <div style={{ fontSize: 16, color: c.muted }}>{error ?? dict.cabinet.loading}</div>
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
            <LogoUpload
              agencyId={agency.id}
              name={agency.name}
              initials={agency.initials}
              brandColor={agency.brandColor}
              logoUrl={agency.logoUrl}
              labels={{
                upload: dict.cabinet.logoUpload,
                replace: dict.cabinet.logoReplace,
                hint: dict.cabinet.logoHint,
                uploading: dict.cabinet.logoUploading,
              }}
              onUploaded={() => void load(agencyId)}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(26px,3vw,36px)', letterSpacing: '-0.04em', fontWeight: 700 }}>{agency.name}</h1>
              <div style={{ fontSize: 14, color: c.muted, marginTop: 2 }}>
                {dict.cabinet.plan} {agency.plan?.name ?? '—'}
                {agency.freeUntil && ` · ${dict.cabinet.freeUntil} ${dt.format(new Date(agency.freeUntil))}`}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {[
            [dict.cabinet.statPublished, String(inventory.published), c.violetTint, c.violet],
            [dict.cabinet.statVerified, `${inventory.verified} · ${Math.round(inventory.verifiedShare * 100)}%`, c.greenTint, c.greenText],
            [dict.cabinet.statArchived, String(inventory.archived), c.surface, c.grey],
            [dict.cabinet.statLeads, String(data.newLeads), c.coralTint, c.coralDark],
          ].map(([label, value, bg, fg]) => (
            <div key={label} style={{ background: bg, borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            </div>
          ))}
        </div>

        {lastRun && (
          <div style={{ fontSize: 14, color: c.muted }}>
            {dict.cabinet.lastSync} {dt.format(new Date(lastRun.startedAt))}: {dict.cabinet.syncParsed} {lastRun.parsed},{' '}
            {dict.cabinet.syncCreated} {lastRun.created}, {dict.cabinet.syncUpdated} {lastRun.updated},{' '}
            {dict.cabinet.syncArchived} {lastRun.archived}
            {lastRun.error && <span style={{ color: c.coralDark }}> · {lastRun.error}</span>}
          </div>
        )}
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '32px 32px 0' }}>
        <PricingTable agencyId={agencyId} dict={dict} locale={locale} />
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
        <FeedConnect agencyId={agencyId} dict={dict} locale={locale} onConnected={() => load(agencyId)} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{dict.cabinet.feedsTitle}</div>

          {!feeds.length && (
            <div style={{ background: c.surface, borderRadius: 18, padding: 20, fontSize: 15, color: c.muted }}>
              {dict.cabinet.feedsEmpty}
            </div>
          )}

          {feeds.map((f) => {
            const s = STATUS_COLORS[f.status];
            return (
              <div key={f.id} style={{ border: `1px solid ${c.line}`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: s.bg, color: s.fg, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>
                    {statusLabel[f.status]}
                  </span>
                  <span style={{ fontSize: 13, color: c.grey }}>
                    {f.format} · {dict.cabinet.feedEvery} {f.intervalMin} {dict.cabinet.feedMinutes}
                  </span>
                </div>

                <div style={{ fontSize: 14, color: c.ink, wordBreak: 'break-all' }}>{f.url}</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: c.muted }}>
                    {f.listingCount} {dict.cabinet.feedObjects}
                    {f.lastOkAt && ` · ${dict.cabinet.feedUpdated} ${dt.format(new Date(f.lastOkAt))}`}
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
                    {dict.cabinet.sync}
                  </button>
                </div>

                {f.lastError && <div style={{ fontSize: 13, color: c.coralDark }}>{f.lastError}</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{dict.cabinet.leadsTitle}</div>

        {!leads.length ? (
          <div style={{ background: c.surface, borderRadius: 18, padding: 20, fontSize: 15, color: c.muted, marginTop: 12 }}>
            {dict.cabinet.leadsEmpty}
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
                <span style={{ fontWeight: 600 }}>{l.name ?? dict.cabinet.leadNoName}</span>
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
