/**
 * HireMind AI Premium Design Tokens - Executive Intelligence Center
 * This represents the visual constraints dictionary of the platform.
 */

export const THEME_TOKENS = {
  colors: {
    background: {
      deepMatte: '#0D0D0C',
      panelGlass: 'rgba(20, 20, 19, 0.7)',
      borderGlass: 'rgba(212, 175, 55, 0.15)',
    },
    brand: {
      goldPremium: '#D4AF37',
      goldMuted: '#AA8C2C',
      brassLight: '#E5C158',
    },
    neutral: {
      white: '#FFFFFF',
      grayLight: '#C0C0C0',
      grayDark: '#2D2D2A',
    }
  },
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2.5rem',   // 40px
    xxl: '4rem',    // 64px
  },
  typography: {
    fontFamily: 'Outfit, Inter, system-ui, sans-serif',
    sizes: {
      titleLarge: '2.5rem',   // 40px
      titleMedium: '1.75rem', // 28px
      bodyLarge: '1.125rem',  // 18px
      bodyRegular: '1rem',    // 16px
      caption: '0.875rem',    // 14px
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    }
  },
  animations: {
    transitions: {
      smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cinematic: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    hover: {
      lift: 'translateY(-2px)',
      glow: '0 0 15px rgba(212, 175, 55, 0.3)',
    }
  }
};
