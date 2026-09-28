/** Иконки макета: те же path, те же толщины линий. */

type Props = { size?: number; color?: string; style?: React.CSSProperties };

export const Check = ({ size = 11, color = '#FFFFFF', width = 3.2, style }: Props & { width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m5 12 5 5 9-10" />
  </svg>
);

export const Chevron = ({ size = 14, color = 'currentColor', width = 2.2 }: Props & { width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const Globe = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
  </svg>
);

export const Heart = ({ size = 20, fill = 'none', stroke = '#17112B' }: { size?: number; fill?: string; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinejoin="round">
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
  </svg>
);

export const Plus = ({ size = 16, width = 2.2 }: Props & { width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Search = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const Play = ({ size = 12 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const MapPinIcon = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const Shield = ({ size = 20, color = '#FFFFFF', width = 2 }: Props & { width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Close = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#17112B" strokeWidth={2.2} strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/** Искра у метки рекламы — читается как «продвигается», а не как ошибка. */
export const Sparkle = ({ size = 11, color = '#FFFFFF' }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.5l2.1 5.6 5.6 2.1-5.6 2.1L12 17.9l-2.1-5.6-5.6-2.1 5.6-2.1z" />
  </svg>
);

/** Логотип Casaya — дом с «точкой» терракотового акцента. */
export const Logo = ({ size = 34 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
    <rect width="32" height="32" rx="9" fill="#6D3BF5" />
    <path d="M9 26V15.5a7 7 0 0 1 14 0V26Z" fill="#FFFFFF" />
    <path d="M13.5 26v-7a2.5 2.5 0 0 1 5 0v7Z" fill="#6D3BF5" />
    <circle cx="24" cy="8" r="3" fill="#FF8A6B" />
  </svg>
);

/** Иконка категории/сервиса: путь приходит данными из API. */
export const PathIcon = ({ d, size = 20, width = 1.8 }: { d: string; size?: number; width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
