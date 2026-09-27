'use client';

import { c } from '@/lib/theme';

export interface Option<T extends string | number> {
  key: T;
  label: string;
}

/**
 * Переключатель на подложке #F5F3F9 — режим поиска, срок ипотеки,
 * тип объекта в оценке, вкладки входа.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  columns,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
  columns?: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns ?? options.length},1fr)`,
        gap: 6,
        background: c.surfaceAlt,
        borderRadius: 12,
        padding: 4,
      }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={String(o.key)}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
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
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Круглые фильтры-таблетки: активный — тёмный, остальные — с обводкой. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              border: `1px solid ${active ? c.ink : c.lineStrong}`,
              background: active ? c.ink : c.white,
              color: active ? c.white : c.ink,
              font: 'inherit',
              fontSize: 14,
              fontWeight: 500,
              padding: '9px 16px',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Крупные карточки-варианты мастера размещения. */
export function ChoiceCards<T extends string>({
  options,
  value,
  onChange,
  minWidth = 180,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
  minWidth?: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${minWidth}px,1fr))`, gap: 10 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              border: `2px solid ${active ? c.violet : c.lineStrong}`,
              background: active ? c.violetTintSoft : c.white,
              font: 'inherit',
              fontSize: 16,
              fontWeight: 600,
              color: c.ink,
              padding: 18,
              borderRadius: 16,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Таблетки выбора типа объекта в мастере — тоньше обводка, меньше кегль. */
export function ChoicePills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              border: `1px solid ${active ? c.violet : c.lineStrong}`,
              background: active ? c.violetTintSoft : c.white,
              font: 'inherit',
              fontSize: 15,
              fontWeight: 500,
              color: c.ink,
              padding: '10px 16px',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
