'use client';

import { useRef, useState } from 'react';
import { AgencyAvatar } from '@/components/ui/AgencyAvatar';
import { CLIENT_BASE } from '@/lib/api';
import { c } from '@/lib/theme';

interface Props {
  agencyId: string;
  name: string;
  initials: string;
  brandColor: string;
  logoUrl?: string | null;
  labels: { upload: string; replace: string; hint: string; uploading: string };
  onUploaded: (logoUrl: string) => void;
}

const MAX_BYTES = 2 * 1024 * 1024;

/** Загрузка логотипа агентства. Файл уходит на API как multipart. */
export function LogoUpload({
  agencyId,
  name,
  initials,
  brandColor,
  logoUrl,
  labels,
  onUploaded,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File) => {
    setError(null);

    // Проверяем размер до отправки: незачем гонять мегабайты ради отказа.
    if (file.size > MAX_BYTES) {
      setError('Файл больше 2 МБ');
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch(`${CLIENT_BASE}/agencies/${agencyId}/logo`, { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Не удалось загрузить файл');

      onUploaded(data.logoUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <AgencyAvatar
        name={name}
        initials={initials}
        brandColor={brandColor}
        logoUrl={logoUrl}
        size={56}
        radius={16}
        fontSize={18}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="h-soft"
          style={{
            alignSelf: 'flex-start',
            border: `1px solid ${c.lineStrong}`,
            background: c.white,
            borderRadius: 12,
            padding: '9px 14px',
            fontSize: 14,
            fontWeight: 600,
            color: c.ink,
            cursor: busy ? 'progress' : 'pointer',
            font: 'inherit',
          }}
        >
          {busy ? labels.uploading : logoUrl ? labels.replace : labels.upload}
        </button>

        <span style={{ fontSize: 12, color: c.grey }}>{error ?? labels.hint}</span>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pick(file);
        }}
      />
    </div>
  );
}
