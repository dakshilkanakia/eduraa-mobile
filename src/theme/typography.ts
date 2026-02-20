/**
 * Eduraa Mobile — Typography
 * Matches web app font: Manrope (primary), Sora (headings/lab)
 */

export const typography = {
  fonts: {
    body: 'Manrope',
    heading: 'Sora',
    // Fallback when custom fonts not loaded
    bodyFallback: 'System',
    headingFallback: 'System',
  },

  sizes: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.08,
    wider: 0.12,
    widest: 0.2,
  },
} as const

export default typography
