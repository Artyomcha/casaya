'use client';

import { useApp } from '@/components/providers/AppProviders';
import { c } from '@/lib/theme';

/** Подписка Casaya+ оформляется только на аккаунт, поэтому открываем вход. */
export function PlusSubscribeButton({ label }: { label: string }) {
  const { openLogin } = useApp();

  return (
    <button
      type="button"
      onClick={openLogin}
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
        cursor: 'pointer',
        marginTop: 4,
      }}
    >
      {label}
    </button>
  );
}
