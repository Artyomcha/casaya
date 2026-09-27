'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { c } from '@/lib/theme';

export interface LeadField {
  name: string;
  placeholder: string;
  type?: string;
}

export interface LeadFormTheme {
  inputBorder: string;
  inputBg: string;
  inputColor: string;
  buttonBg: string;
  buttonColor: string;
  buttonHover: string;
  doneBg: string;
  doneColor?: string;
  doneTextColor: string;
}

export const DARK_GREEN_THEME: LeadFormTheme = {
  inputBorder: '#1F5A47',
  inputBg: '#0F4A38',
  inputColor: '#FFFFFF',
  buttonBg: '#FFFFFF',
  buttonColor: '#0B3D2E',
  buttonHover: 'h-mint',
  doneBg: '#0F4A38',
  doneTextColor: '#B8DCCD',
};

export const LIGHT_THEME: LeadFormTheme = {
  inputBorder: c.lineStrong,
  inputBg: c.surface,
  inputColor: c.ink,
  buttonBg: c.violet,
  buttonColor: c.white,
  buttonHover: 'h-violet',
  doneBg: c.violetTintSoft,
  doneTextColor: c.inkSoft,
};

export const WHITE_ON_LILAC_THEME: LeadFormTheme = {
  inputBorder: c.lineStrong,
  inputBg: c.white,
  inputColor: c.ink,
  buttonBg: c.violet,
  buttonColor: c.white,
  buttonHover: 'h-violet',
  doneBg: c.white,
  doneTextColor: c.inkSoft,
};

interface Props {
  kind: 'MORTGAGE' | 'SERVICE' | 'AGENCY' | 'LISTING_CONTACT';
  fields: LeadField[];
  submitLabel: string;
  doneTitle: string;
  doneText: string;
  theme: LeadFormTheme;
  payload?: Record<string, unknown>;
  listingId?: string;
}

/**
 * Форма заявки. Все формы портала устроены одинаково: поля → POST /leads →
 * блок «отправлено» на месте формы.
 */
export function LeadForm({ kind, fields, submitLabel, doneTitle, doneText, theme, payload, listingId }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.createLead({
        kind,
        name: values.name,
        email: values.email,
        phone: values.phone,
        country: values.country,
        message: values.message,
        listingId,
        payload: { ...payload, ...values },
      });
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div style={{ background: theme.doneBg, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: theme.doneColor ?? (theme === DARK_GREEN_THEME ? '#FFFFFF' : c.ink) }}>
          {doneTitle}
        </div>
        <div style={{ fontSize: 15, color: theme.doneTextColor, lineHeight: 1.55, marginTop: 6 }}>{doneText}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {fields.map((f) => (
        <input
          key={f.name}
          type={f.type ?? 'text'}
          placeholder={f.placeholder}
          value={values[f.name] ?? ''}
          onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
          style={{
            border: `1px solid ${theme.inputBorder}`,
            background: theme.inputBg,
            color: theme.inputColor,
            font: 'inherit',
            fontSize: 16,
            padding: '15px 16px',
            borderRadius: 14,
            outline: 0,
          }}
        />
      ))}

      {error && <div style={{ fontSize: 14, color: c.coralDark }}>{error}</div>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className={theme.buttonHover}
        style={{
          border: 0,
          background: theme.buttonBg,
          color: theme.buttonColor,
          font: 'inherit',
          fontSize: 16,
          fontWeight: theme === DARK_GREEN_THEME ? 700 : 600,
          padding: 16,
          borderRadius: 14,
          cursor: busy ? 'progress' : 'pointer',
          marginTop: theme === DARK_GREEN_THEME ? 4 : 0,
          opacity: busy ? 0.7 : 1,
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
