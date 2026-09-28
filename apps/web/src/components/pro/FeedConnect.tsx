'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Dictionary } from '@/i18n/getDictionary';
import { money } from '@/i18n/format';
import type { Locale } from '@/i18n/locales';
import type { FeedFormat, FeedPreview } from '@/lib/types';
import { c } from '@/lib/theme';

/** Названия CRM — имена собственные, переводится только первый и последний пункт. */
const CRM_FORMATS: FeedFormat[] = ['INMOVILLA', 'WITEI', 'MOBILIA', 'RESALES', 'KYERO'];
const CRM_LABELS: Record<string, string> = {
  INMOVILLA: 'Inmovilla',
  WITEI: 'Witei',
  MOBILIA: 'Mobilia',
  RESALES: 'Resales Online',
  KYERO: 'Kyero XML',
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
  width: '100%',
};

/**
 * Подключение XML-выгрузки CRM: сначала сухой прогон (ничего не пишем в базу),
 * агентство видит, что подхватится, и только потом подтверждает.
 */
export function FeedConnect({
  agencyId,
  dict,
  locale,
  onConnected,
}: {
  agencyId: string;
  dict: Dictionary;
  locale: Locale;
  onConnected: () => void;
}) {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<FeedFormat | 'auto'>('auto');
  const [preview, setPreview] = useState<FeedPreview | null>(null);
  const [busy, setBusy] = useState<'preview' | 'connect' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: 'preview' | 'connect') => {
    setBusy(action);
    setError(null);
    try {
      const body = { url, ...(format === 'auto' ? {} : { format }) };
      if (action === 'preview') {
        setPreview(await api.previewFeed(body));
      } else {
        await api.connectFeed({ agencyId, ...body });
        setPreview(null);
        setUrl('');
        onConnected();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ border: `1px solid ${c.line}`, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{dict.cabinet.connectTitle}</div>
        <div style={{ fontSize: 14, color: c.muted, marginTop: 4 }}>
          {dict.cabinet.connectText}
        </div>
      </div>

      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://crm.example.com/export/casaya.xml" style={inputStyle} />

      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as FeedFormat | 'auto')}
        style={{ ...inputStyle, cursor: 'pointer' }}
      >
        <option value="auto">{dict.cabinet.formatAuto}</option>
        {CRM_FORMATS.map((f) => (
          <option key={f} value={f}>
            {CRM_LABELS[f]}
          </option>
        ))}
        <option value="CASAYA">{dict.cabinet.formatCasaya}</option>
      </select>

      {error && (
        <div style={{ background: c.coralTint, color: c.coralDark, borderRadius: 12, padding: '12px 14px', fontSize: 14 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => run('preview')}
          disabled={!url || busy !== null}
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
            cursor: busy ? 'progress' : 'pointer',
            opacity: url ? 1 : 0.5,
          }}
        >
          {busy === 'preview' ? dict.cabinet.checking : dict.cabinet.checkFeed}
        </button>

        <button
          type="button"
          onClick={() => run('connect')}
          disabled={!preview || busy !== null}
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
            cursor: busy ? 'progress' : 'pointer',
            opacity: preview ? 1 : 0.5,
          }}
        >
          {busy === 'connect' ? dict.cabinet.connecting : dict.cabinet.connectFeed}
        </button>
      </div>

      {preview && (
        <div style={{ background: c.surface, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              [dict.cabinet.previewFormat, preview.format],
              [dict.cabinet.previewTotal, String(preview.total)],
              [dict.cabinet.previewImport, String(preview.importable)],
              [dict.cabinet.previewSkip, String(preview.total - preview.importable)],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 12, color: c.grey }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>

          {preview.sample.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: c.grey }}>{dict.cabinet.previewSample}</div>
              {preview.sample.map((s) => (
                <div
                  key={s.externalId}
                  style={{ background: c.white, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', fontSize: 14 }}
                >
                  {s.cover && <img src={s.cover} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 8 }} />}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                    <div style={{ color: c.grey, fontSize: 13 }}>
                      {s.address} · {s.area} {dict.common.sqm} · {s.bedrooms}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{money(s.price, locale)}</div>
                </div>
              ))}
            </div>
          )}

          {preview.skipped.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: c.grey }}>{dict.cabinet.previewSkipped}</div>
              {preview.skipped.slice(0, 5).map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: c.coralDark }}>
                  {s.externalId ?? '—'} · {s.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
