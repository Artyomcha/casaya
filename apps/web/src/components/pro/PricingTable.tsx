'use client';

import { useEffect, useState } from 'react';
import type { Dictionary } from '@/i18n/getDictionary';
import { money } from '@/i18n/format';
import type { Locale } from '@/i18n/locales';
import { api } from '@/lib/api';
import { discountLabel } from '@/lib/format';
import type { AgencyListing, PricingProblem } from '@/lib/types';
import { c } from '@/lib/theme';

const inputStyle: React.CSSProperties = {
  border: `1px solid ${c.lineStrong}`,
  background: c.surface,
  font: 'inherit',
  fontSize: 15,
  fontVariantNumeric: 'tabular-nums',
  padding: '10px 12px',
  borderRadius: 12,
  outline: 0,
  color: c.ink,
  width: 130,
};

/**
 * Две цены на объект вводит агент: рыночную и свою. Платформа ничего не
 * оценивает — она только считает разницу и решает, пускать ли объект в выдачу.
 * Объект с ценой вровень с рынком сохраняется, но помечается как скрытый:
 * агентство должно видеть весь свой инвентарь, а не терять объекты из кабинета.
 */
export function PricingTable({
  agencyId,
  dict,
  locale,
}: {
  agencyId: string;
  dict: Dictionary;
  locale: Locale;
}) {
  const [rows, setRows] = useState<AgencyListing[] | null>(null);
  const [draft, setDraft] = useState<Record<string, { price: string; marketPrice: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .agencyListings(agencyId)
      .then((list) => {
        setRows(list);
        setDraft(
          Object.fromEntries(
            list.map((l) => [l.id, { price: String(l.price), marketPrice: l.marketPrice == null ? '' : String(l.marketPrice) }]),
          ),
        );
      })
      .catch((e: Error) => setError(e.message));
  }, [agencyId]);

  const problemText: Record<PricingProblem, string> = {
    'no-market-price': dict.cabinet.pricingNoMarket,
    'not-below-market': dict.cabinet.pricingNotBelow,
    'too-small': dict.cabinet.pricingTooSmall,
    'too-big': dict.cabinet.pricingTooBig,
  };

  async function save(row: AgencyListing) {
    const d = draft[row.id];
    const price = Number(d.price);
    const marketPrice = d.marketPrice.trim() === '' ? null : Number(d.marketPrice);
    if (!Number.isFinite(price) || price <= 0) return;

    setBusy(row.id);
    setError(null);
    try {
      const updated = await api.updatePricing(agencyId, row.id, { price, marketPrice });
      setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, ...updated } : r)) ?? prev);
      setSaved(row.id);
      window.setTimeout(() => setSaved((id) => (id === row.id ? null : id)), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (error && !rows) return <p style={{ color: c.coralDark, fontSize: 14 }}>{error}</p>;
  if (!rows) return null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          {dict.cabinet.pricingTitle}
        </h2>
        <p style={{ fontSize: 14, color: c.grey, margin: '6px 0 0', maxWidth: 620, lineHeight: 1.5 }}>
          {dict.cabinet.pricingLead}
        </p>
      </div>

      {error && <p style={{ color: c.coralDark, fontSize: 14, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row) => {
          const d = draft[row.id] ?? { price: '', marketPrice: '' };
          const dirty = String(row.price) !== d.price || (row.marketPrice == null ? '' : String(row.marketPrice)) !== d.marketPrice;

          return (
            <div
              key={row.id}
              style={{
                border: `1px solid ${c.line}`,
                borderRadius: 16,
                padding: '14px 16px',
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                flexWrap: 'wrap',
                background: c.white,
              }}
            >
              <div style={{ minWidth: 200, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{row.title}</div>
                <div style={{ fontSize: 13, color: c.grey, marginTop: 2 }}>{row.address}</div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, color: c.grey }}>{dict.cabinet.pricingMarket}</span>
                <input
                  style={inputStyle}
                  inputMode="numeric"
                  value={d.marketPrice}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, [row.id]: { ...d, marketPrice: e.target.value.replace(/\D/g, '') } }))
                  }
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, color: c.grey }}>{dict.cabinet.pricingOurs}</span>
                <input
                  style={inputStyle}
                  inputMode="numeric"
                  value={d.price}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, [row.id]: { ...d, price: e.target.value.replace(/\D/g, '') } }))
                  }
                />
              </label>

              <div style={{ minWidth: 190, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {row.savings ? (
                  <span style={{ fontSize: 14, fontWeight: 700, color: c.greenText, fontVariantNumeric: 'tabular-nums' }}>
                    {money(row.savings.amount, locale)} · {discountLabel(row.savings)}
                  </span>
                ) : (
                  <span style={{ fontSize: 14, color: c.grey }}>—</span>
                )}
                <span style={{ fontSize: 12, color: row.visible ? c.greenText : c.coralDark }}>
                  {row.visible ? dict.cabinet.pricingVisible : dict.cabinet.pricingHidden}
                </span>
                {row.pricingProblem && (
                  <span style={{ fontSize: 12, color: c.grey, lineHeight: 1.35 }}>
                    {problemText[row.pricingProblem]}
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!dirty || busy === row.id}
                onClick={() => save(row)}
                style={{
                  border: 0,
                  font: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 16px',
                  borderRadius: 12,
                  cursor: dirty ? 'pointer' : 'default',
                  background: dirty ? c.violet : c.surfaceAlt,
                  color: dirty ? c.white : c.grey,
                }}
              >
                {saved === row.id ? dict.cabinet.pricingSaved : dict.cabinet.pricingSave}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
