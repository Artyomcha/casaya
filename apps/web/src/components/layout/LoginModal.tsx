'use client';

import { useState } from 'react';
import { Close } from '@/components/ui/icons';
import { CLIENT_BASE } from '@/lib/api';
import { c } from '@/lib/theme';

const tabStyle = (active: boolean): React.CSSProperties => ({
  border: 0,
  font: 'inherit',
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 0',
  borderRadius: 9,
  cursor: 'pointer',
  background: active ? c.white : 'transparent',
  color: active ? c.ink : c.grey,
  boxShadow: active ? '0 1px 3px rgba(23,17,43,0.12)' : 'none',
});

const inputStyle: React.CSSProperties = {
  border: `1px solid ${c.lineStrong}`,
  background: c.surface,
  font: 'inherit',
  fontSize: 17,
  padding: '15px 16px',
  borderRadius: 14,
  outline: 0,
  color: c.ink,
};

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'phone' | 'email'>('phone');
  const [identity, setIdentity] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async () => {
    if (!identity.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${CLIENT_BASE}/auth/request-code`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: tab, identity }),
      });
      if (!res.ok) throw new Error('Не удалось отправить код');
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(23,17,43,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: c.white,
          borderRadius: 28,
          padding: 32,
          boxShadow: '0 40px 80px -20px rgba(23,17,43,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.035em' }}>Вход в Casaya</span>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 0, background: c.surfaceAlt, width: 36, height: 36, borderRadius: 999, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            <Close size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: c.surfaceAlt, borderRadius: 12, padding: 4 }}>
          <button type="button" onClick={() => setTab('phone')} style={tabStyle(tab === 'phone')}>
            Телефон
          </button>
          <button type="button" onClick={() => setTab('email')} style={tabStyle(tab === 'email')}>
            Email
          </button>
        </div>

        <input
          value={identity}
          onChange={(e) => {
            setIdentity(e.target.value);
            setSent(false);
          }}
          placeholder={tab === 'phone' ? '+34 600 000 000' : 'you@example.com'}
          style={inputStyle}
        />

        {sent && (
          <div style={{ fontSize: 14, color: c.greenText, background: c.greenTint, borderRadius: 12, padding: '12px 14px' }}>
            Код отправлен. Он действует 5 минут.
          </div>
        )}
        {error && <div style={{ fontSize: 14, color: c.coralDark }}>{error}</div>}

        <button
          type="button"
          onClick={requestCode}
          disabled={busy}
          className="h-violet"
          style={{
            border: 0,
            background: c.violet,
            color: c.white,
            font: 'inherit',
            fontSize: 16,
            fontWeight: 600,
            padding: 15,
            borderRadius: 14,
            cursor: busy ? 'progress' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          Получить код
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: c.greyLight, fontSize: 13 }}>
          <span style={{ flex: 1, height: 1, background: c.line }} />
          или
          <span style={{ flex: 1, height: 1, background: c.line }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Google', 'Apple'].map((p) => (
            <button
              key={p}
              type="button"
              className="h-soft"
              style={{ border: `1px solid ${c.lineStrong}`, background: c.white, font: 'inherit', fontSize: 15, fontWeight: 600, padding: 13, borderRadius: 14, cursor: 'pointer' }}
            >
              {p}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: c.greyLight, lineHeight: 1.5, textAlign: 'center' }}>
          Продолжая, вы принимаете условия использования и политику конфиденциальности.
        </div>
      </div>
    </div>
  );
}
