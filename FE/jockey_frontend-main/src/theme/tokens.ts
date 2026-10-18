/**
 * Design tokens for Philippine Jockey.
 *
 * Raw palette mirrors the Tailwind scale used in the Figma source, and semantic
 * tokens map roles (background/text/border/...) to palette values for each
 * color scheme. Components should reference semantic tokens via `useTheme()`
 * rather than raw hex values so dark mode stays a one-file change.
 */

export const palette = {
  // Match the web brand-palette.css value so app and web share the same core brand.
  teal950: '#103B2F',
  teal900: '#134e4a',
  teal800: '#115e59',
  teal700: '#0f766e',

  orange400: '#C6A15B',
  orange200: '#F2D78F',
  orange100: '#FBF2D0',
  amber100: '#F5E7BB',

  stone50: '#fafaf9',
  // Shared paper background from the web brand palette.
  stone100: '#F5F1E8',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',

  zinc900: '#18181b',
  zinc800: '#27272a',
  zinc600: '#52525b',
  zinc500: '#71717a',
  zinc100: '#f4f4f5',

  neutral200: '#e5e5e5',
  neutral300: '#d4d4d4',
  neutral400: '#a3a3a3',
  neutral500: '#737373',
  neutral600: '#525252',

  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',

  red500: '#ef4444',
  green400: '#4ade80',
  yellow700: '#8A6414',
  rose200: '#fecdd3',

  emerald950: '#022c22',

  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeMode = ColorScheme | 'system';

export interface ThemeColors {
  /** App page background (stone-100 in the source). */
  background: string;
  /** Slightly lighter background used behind auth/forms (stone-50). */
  backgroundAlt: string;
  /** Card / elevated surface. */
  surface: string;
  /** Muted surface inside cards (e.g. result footer bars). */
  surfaceMuted: string;
  /** Brand-dark surface used by heroes, onboarding, tab icons. */
  brand: string;
  /** Accent color (odds, CTAs on dark, active indicators). */
  accent: string;
  /** Deeper gold for icons placed on light surfaces. */
  accentIcon: string;
  /** Soft accent used for text/labels on brand surfaces. */
  accentSoft: string;
  /** Faint accent used for chips. */
  accentFaint: string;

  border: string;
  borderStrong: string;
  divider: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInactive: string;
  textInverse: string;

  success: string;
  danger: string;
  dangerSoft: string;
  live: string;
  presence: string;
  warning: string;
  info: string;

  overlayFrom: string;
  avatarBg: string;
  avatarText: string;
}

export const semanticColors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: palette.stone100,
    backgroundAlt: palette.stone50,
    surface: palette.white,
    surfaceMuted: palette.stone100,
    brand: palette.teal950,
    accent: palette.orange400,
    accentIcon: '#8A6414',
    accentSoft: palette.orange200,
    accentFaint: palette.orange100,

    border: palette.neutral200,
    borderStrong: palette.neutral300,
    divider: palette.neutral200,

    textPrimary: palette.zinc900,
    textSecondary: palette.zinc500,
    textMuted: palette.neutral500,
    textInactive: palette.neutral400,
    textInverse: palette.white,

    success: palette.green400,
    danger: palette.red500,
    dangerSoft: palette.rose200,
    live: palette.red500,
    presence: palette.green400,
    warning: palette.yellow700,
    info: palette.teal700,

    overlayFrom: palette.emerald950,
    avatarBg: palette.orange200,
    avatarText: palette.teal950,
  },
  dark: {
    background: '#0a0f0e',
    backgroundAlt: '#101716',
    surface: '#141c1b',
    surfaceMuted: '#101716',
    brand: palette.teal950,
    accent: palette.orange400,
    accentIcon: '#C5A137',
    accentSoft: palette.orange200,
    accentFaint: '#3a3017',

    border: '#22302e',
    borderStrong: '#33423f',
    divider: '#22302e',

    textPrimary: palette.stone50,
    textSecondary: '#a8b3b0',
    textMuted: '#8a9693',
    textInactive: '#5f6b68',
    textInverse: palette.teal950,

    success: palette.green400,
    danger: palette.red500,
    dangerSoft: '#4c1d24',
    live: palette.red500,
    presence: palette.green400,
    warning: palette.orange400,
    info: palette.teal700,

    overlayFrom: palette.emerald950,
    avatarBg: palette.orange200,
    avatarText: palette.teal950,
  },
};

/** Canonical status chip tones derived from the designs. */
export type StatusTone =
  | 'live'
  | 'ongoing'
  | 'upcoming'
  | 'completed'
  | 'official'
  | 'provisional'
  | 'cancelled'
  | 'postponed';

export interface StatusToneStyle {
  background: string;
  text: string;
  dot: string;
}

export const statusTones: Record<StatusTone, StatusToneStyle> = {
  live: { background: 'transparent', text: palette.white, dot: palette.red500 },
  ongoing: { background: palette.orange100, text: palette.yellow700, dot: palette.yellow700 },
  upcoming: { background: palette.gray200, text: palette.teal700, dot: palette.teal700 },
  completed: { background: palette.gray200, text: palette.neutral500, dot: palette.neutral500 },
  official: { background: palette.gray200, text: palette.orange400, dot: palette.orange400 },
  provisional: { background: palette.orange100, text: palette.orange400, dot: palette.orange400 },
  cancelled: { background: palette.gray200, text: palette.neutral500, dot: palette.neutral500 },
  postponed: { background: palette.gray200, text: palette.neutral500, dot: palette.neutral500 },
};

export interface DividendsToneStyle {
  background: string;
  text: string;
  dot: string;
}

export const poolTones = {
  estimate: { background: palette.orange100, text: palette.zinc500, dot: palette.zinc500 },
  notSettled: { background: palette.gray200, text: palette.zinc500, dot: palette.zinc500 },
} as const;

/**
 * Runner silks by saddlecloth number. Used for the colour-coded number badges
 * in selection/cart/ticket views. Cycled modulo length for higher numbers.
 */
export const silkTones = [
  palette.orange400,
  palette.teal950,
  '#a8a29e',
  palette.gray500,
  '#7c3aed',
  palette.teal700,
  palette.red500,
  palette.gray400,
] as const;

/** Returns the silk colour for a saddlecloth number (1-based). */
export function silkColorFor(number: number) {
  return silkTones[(Math.max(1, number) - 1) % silkTones.length];
}

/** Status tones for placed tickets (Pending/Won/Lost/Void). */
export const ticketTones = {
  Pending: { background: palette.orange100, text: palette.yellow700, dot: palette.yellow700 },
  Won: { background: palette.gray200, text: palette.teal700, dot: palette.teal700 },
  Lost: { background: palette.rose200, text: palette.red500, dot: palette.red500 },
  Void: { background: palette.gray200, text: palette.neutral500, dot: palette.neutral500 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 64,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const fonts = {
  display: 'LibreCaslonDisplay_400Regular',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemibold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

export const gradients = {
  /** Full-bleed media overlay: transparent-ish top to near-opaque bottom. */
  mediaDark: ['rgba(23,23,23,0.2)', 'rgba(23,23,23,0.9)'] as const,
  mediaEmerald: ['rgba(2,44,34,0.1)', 'rgba(2,44,34,0.95)'] as const,
  /** Onboarding hero image fade into the brand surface. */
  onboardingFade: ['rgba(16,59,47,0.3)', 'rgba(16,59,47,1)'] as const,
  /** Welcome hero fade into the light surface. */
  welcomeFade: ['rgba(16,59,47,0.5)', 'rgba(16,59,47,0.1)', 'rgba(245,241,232,1)'] as const,
} as const;
