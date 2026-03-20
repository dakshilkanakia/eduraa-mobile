/**
 * Eduraa Mobile — Color Palette
 * Warm stone neutrals + vivid rose accent
 * Clean, subtle, premium feel
 */

export const colors = {
  // Primary brand — vivid rose (energetic but not harsh)
  accent: '#E11D48',
  accentStrong: '#BE123C',
  accentLight: '#FFF1F2',
  accentMid: '#FECDD3',

  // Backgrounds — warm off-white (stone base, not cold gray)
  surface1: '#FAFAF9',
  surface2: '#F5F5F4',
  surface3: '#EFEEEC',

  // Cards
  card: '#FFFFFF',
  cardAlt: '#FAFAF9',

  // Text hierarchy — warm stone tones
  ink: '#1C1917',
  muted: '#78716C',
  subtle: '#A8A29E',
  placeholder: '#C4B9B4',

  // Borders — very subtle warm tones
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',
  borderSubtle: '#F5F5F4',

  // White
  white: '#FFFFFF',

  // Feedback — success
  success: '#059669',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  successText: '#065F46',

  // Feedback — warning
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',

  // Feedback — info
  info: '#0284C7',
  infoBg: '#F0F9FF',
  infoBorder: '#BAE6FD',
  infoText: '#0C4A6E',

  // Feedback — danger
  danger: '#E11D48',
  dangerBg: '#FFF1F2',
  dangerBorder: '#FECDD3',
  dangerText: '#9F1239',

  // Transparent overlays
  overlay: 'rgba(28, 25, 23, 0.5)',
  veil: 'rgba(28, 25, 23, 0.03)',
  veilStrong: 'rgba(28, 25, 23, 0.06)',
} as const

export type ColorKey = keyof typeof colors

export default colors
