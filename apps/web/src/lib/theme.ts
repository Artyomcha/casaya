/** Палитра портала. Значения взяты из макета и больше нигде не дублируются. */
export const c = {
  ink: '#17112B',
  inkSoft: '#4B4560',
  muted: '#6B6580',
  grey: '#7C7690',
  greyLight: '#8E88A3',
  violet: '#6D3BF5',
  violetDark: '#5A2BE0',
  violetDeep: '#4F22D6',
  violetTint: '#F1ECFF',
  violetTintSoft: '#F4F1FE',
  violetTintPale: '#FAF8FF',
  lilac: '#B9A4FF',
  lilacText: '#DCD0FF',
  lilacBody: '#E9E2FF',
  green: '#16A37A',
  greenDark: '#0B3D2E',
  greenText: '#0E7A5A',
  greenMid: '#2E6B57',
  greenTint: '#E8F7F1',
  coral: '#FF5A3C',
  coralDark: '#E94A2E',
  coralTint: '#FFF1EC',
  blue: '#2F6FD6',
  blueTint: '#EAF2FF',
  cyan: '#0C8AA6',
  cyanTint: '#E6F7FB',
  amber: '#B26A00',
  amberTint: '#FFF6E5',
  line: '#EFECF4',
  lineStrong: '#E3DFEC',
  lineSoft: '#F2F0F6',
  surface: '#F7F6FA',
  surfaceAlt: '#F5F3F9',
  white: '#FFFFFF',
} as const;

/** Общая ширина контента во всех секциях макета. */
export const SHELL: React.CSSProperties = {
  maxWidth: 1360,
  margin: '0 auto',
  padding: '0 32px',
};

export const section = (padding: string): React.CSSProperties => ({
  maxWidth: 1360,
  margin: '0 auto',
  padding,
});
