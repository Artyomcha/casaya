'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ListingCard } from '@/components/listing/ListingCard';
import { Segmented } from '@/components/ui/Segmented';
import { api } from '@/lib/api';
import type { Dictionary } from '@/i18n/getDictionary';
import { groupDigits, money } from '@/i18n/format';
import { localePath, type Locale } from '@/i18n/locales';
import { toCard } from '@/lib/format';
import type { Listing, PropertyKind } from '@/lib/types';
import { c } from '@/lib/theme';

const BEDS = [1, 2, 3, 4, 5].map((n) => ({ key: n, label: n === 5 ? '5+' : String(n) }));

interface Result {
  estimate: number;
  low: number;
  high: number;
  pricePerM2: number;
  rent: number;
  dealsNearby: number;
}

export function ValueScreen({
  dict,
  locale,
  similar,
}: {
  dict: Dictionary;
  locale: Locale;
  similar: Listing[];
}) {
  const types: { key: PropertyKind; label: string }[] = [
    { key: 'FLAT', label: dict.valuation.typeFlat },
    { key: 'HOUSE', label: dict.valuation.typeHouse },
    { key: 'PENTHOUSE', label: dict.valuation.typePenthouse },
  ];
  const fmt = (v: number) => money(v, locale);
  const [address, setAddress] = useState('');
  const [kind, setKind] = useState<PropertyKind>('FLAT');
  const [area, setArea] = useState(90);
  const [bedrooms, setBedrooms] = useState(2);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => setResult(null);

  const calculate = async () => {
    setBusy(true);
    try {
      setResult(await api.valuation({ address: address || 'Marbella', kind, area, bedrooms }));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: c.violet }}>{dict.valuation.brand}</span>
        <h1 style={{ margin: 0, fontSize: 'clamp(34px,4.2vw,54px)', lineHeight: 1.04, letterSpacing: '-0.045em', fontWeight: 700 }}>
          {dict.valuation.title}
        </h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: c.inkSoft, maxWidth: 600 }}>
          {dict.valuation.lead}
        </p>
      </section>

      <section
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '32px 32px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        <div style={{ border: `1px solid ${c.line}`, borderRadius: 28, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, color: c.muted }}>{dict.valuation.address}</span>
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                reset();
              }}
              placeholder={dict.valuation.addressPlaceholder}
              style={{ border: `1px solid ${c.lineStrong}`, background: c.surface, font: 'inherit', fontSize: 16, padding: '14px 16px', borderRadius: 14, outline: 0, color: c.ink }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, color: c.muted }}>{dict.valuation.type}</span>
            <Segmented
              options={types}
              value={kind}
              onChange={(k) => {
                setKind(k);
                reset();
              }}
              columns={3}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: c.muted }}>
              <span>{dict.valuation.area}</span>
              <span style={{ color: c.ink, fontWeight: 600 }}>{area} {dict.common.sqm}</span>
            </div>
            <input
              type="range"
              min={30}
              max={400}
              step={5}
              value={area}
              onChange={(e) => {
                setArea(Number(e.target.value));
                reset();
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, color: c.muted }}>{dict.valuation.bedrooms}</span>
            <Segmented
              options={BEDS}
              value={bedrooms}
              onChange={(k) => {
                setBedrooms(k);
                reset();
              }}
              columns={5}
            />
          </div>

          <button
            type="button"
            onClick={calculate}
            disabled={busy}
            className="h-violet"
            style={{ border: 0, background: c.violet, color: c.white, font: 'inherit', fontSize: 16, fontWeight: 600, padding: 16, borderRadius: 14, cursor: busy ? 'progress' : 'pointer' }}
          >
            {dict.valuation.calculate}
          </button>
        </div>

        <div
          style={{
            background: c.violet,
            borderRadius: 28,
            padding: 32,
            color: c.white,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 28,
            minHeight: 420,
          }}
        >
          {!result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 'auto 0' }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>{dict.valuation.emptyTitle}</div>
              <div style={{ fontSize: 16, lineHeight: 1.55, color: c.lilacBody, maxWidth: 380 }}>
                {dict.valuation.emptyText}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 15, color: c.lilacBody }}>{dict.valuation.resultLabel}</span>
                <span style={{ fontSize: 'clamp(40px,5vw,60px)', fontWeight: 700, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(result.estimate)}
                </span>
                <span style={{ fontSize: 16, color: c.lilacBody, fontVariantNumeric: 'tabular-nums' }}>
                  {dict.valuation.range} {fmt(result.low)} – {fmt(result.high)}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                  gap: 12,
                  borderTop: '1px solid rgba(255,255,255,0.22)',
                  paddingTop: 20,
                }}
              >
                {[
                  [dict.valuation.pricePerSqm, `${groupDigits(result.pricePerM2, locale)} €`],
                  [dict.valuation.rent, `${fmt(result.rent)} ${dict.common.perMonth}`],
                  [dict.valuation.dealsNearby, String(result.dealsNearby)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 13, color: c.lilacBody }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href={localePath(locale, 'post')}
                  className="h-lilac"
                  style={{ border: 0, background: c.white, color: c.violetDeep, font: 'inherit', fontSize: 15, fontWeight: 600, padding: '14px 20px', borderRadius: 14, cursor: 'pointer' }}
                >
                  {dict.valuation.postCta}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '64px 32px 0' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(26px,2.8vw,34px)', letterSpacing: '-0.04em', fontWeight: 700 }}>{dict.valuation.similarTitle}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '24px 20px', marginTop: 24 }}>
          {similar.map((l) => (
            <ListingCard key={l.id} item={toCard(l, 'buy', locale, dict)} dict={dict} compact />
          ))}
        </div>
      </section>
    </main>
  );
}
