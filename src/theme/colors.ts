/**
 * Eduraa Mobile — Color Palette
 * Ported from web app CSS variables (index.css)
 * Default theme: crimson/rose-red on light surfaces
 */

export const colors = {
  // Primary brand — crimson red (matches --theme-accent)
  accent: '#be123c',
  accentStrong: '#9f1239',
  accentLight: '#fecdd3', // rose-200 for light tints

  // Surfaces (matches --theme-surface-1 / --theme-surface-2)
  surface1: '#f8fafc',
  surface2: '#f1f5f9',

  // Base text (matches --ink)
  ink: '#0f172a',
  muted: '#64748b',       // slate-500
  subtle: '#94a3b8',      // slate-400

  // Borders & dividers
  border: '#e2e8f0',      // slate-200 (matches --mist)
  borderStrong: '#cbd5e1', // slate-300

  // White
  white: '#ffffff',

  // Feedback colors
  success: '#34d399',     // emerald-400 (matches --mint)
  successBg: '#d1fae5',
  warning: '#f59e0b',     // amber-400 (matches --sun)
  warningBg: '#fef3c7',
  info: '#38bdf8',        // sky-400 (matches --sky)
  infoBg: '#e0f2fe',
  danger: '#f43f5e',      // rose-500
  dangerBg: '#ffe4e6',

  // Navigation bar — gradient matches --theme-nav-bg
  navBg: '#4c0519',       // hero-1 (deep crimson)
  navText: '#ffffff',
  navMuted: '#e2e8f0',

  // Cards
  card: '#ffffff',
  cardAlt: '#f8fafc',

  // Transparent overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  veil: 'rgba(15, 23, 42, 0.04)',
  veilStrong: 'rgba(15, 23, 42, 0.08)',
} as const

export type ColorKey = keyof typeof colors

export default colors
