/**
 * Eduraa Mobile — Color Palette
 * Matches web app: teal accent, slate neutrals, dark sidebar
 */

export const colors = {
  // Primary brand — teal (matches web #0f766e)
  accent: '#0f766e',
  accentStrong: '#0d6460',
  accentLight: '#f0fdfa',
  accentMid: '#99f6e4',

  // Backgrounds — slate base (matches web #f1f5f9)
  surface1: '#f1f5f9',
  surface2: '#e2e8f0',
  surface3: '#cbd5e1',

  // Cards — white (matches web)
  card: '#FFFFFF',
  cardAlt: '#f8fafc',

  // Text hierarchy — slate tones (matches web #0f172a)
  ink: '#0f172a',
  muted: '#64748b',
  subtle: '#94a3b8',
  placeholder: '#cbd5e1',

  // Borders — slate (matches web)
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  borderSubtle: '#f1f5f9',

  // White
  white: '#FFFFFF',

  // Dark sidebar (matches web sidebar #1a2332 area)
  sidebar: '#1e293b',
  sidebarActive: '#0f766e',
  sidebarText: '#94a3b8',
  sidebarTextActive: '#FFFFFF',

  // Feedback — success (teal-ish, matches web)
  success: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  successText: '#166534',

  // Feedback — warning
  warning: '#ca8a04',
  warningBg: '#fefce8',
  warningBorder: '#fde047',
  warningText: '#854d0e',

  // Feedback — info
  info: '#0284c7',
  infoBg: '#f0f9ff',
  infoBorder: '#bae6fd',
  infoText: '#0c4a6e',

  // Feedback — danger
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',
  dangerText: '#991b1b',

  // Transparent overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  veil: 'rgba(15, 23, 42, 0.03)',
  veilStrong: 'rgba(15, 23, 42, 0.06)',
} as const

export type ColorKey = keyof typeof colors

export default colors
