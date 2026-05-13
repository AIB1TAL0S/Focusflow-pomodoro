const lightColors = {
  // Primary - Sage Green (concentration color)
  primary: '#4ade80',
  primaryContainer: '#22c55e',
  primaryFixed: '#dcfce7',
  primaryFixedDim: '#bbf7d0',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#191c1e',
  onPrimaryFixed: '#191c1e',
  onPrimaryFixedVariant: '#22c55e',

  // Secondary - Deep teal for contrast
  secondary: '#505f76',
  secondaryContainer: '#505f76',
  secondaryFixed: '#111c2d',
  secondaryFixedDim: '#505f76',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#191c1e',
  onSecondaryFixed: '#111c2d',
  onSecondaryFixedVariant: '#505f76',

  // Tertiary - Mint Green for accents (#6ffbbe per DESIGN.md)
  tertiary: '#6ffbbe',
  tertiaryContainer: '#6ffbbe',
  tertiaryFixed: '#6ffbbe',
  tertiaryFixedDim: '#50d0a0',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#191c1e',
  onTertiaryFixed: '#191c1e',
  onTertiaryFixedVariant: '#50d0a0',

  // Surface Hierarchy - White background for light mode
  surface: '#ffffff',
  surfaceBright: '#ffffff',
  surfaceDim: '#f5f5f5',
  surfaceContainer: '#f5f5f5',
  surfaceContainerLow: '#fafafa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#eeeeee',
  surfaceContainerHighest: '#e0e0e0',
  surfaceVariant: '#e0e0e0',
  surfaceTint: '#4ade80',
  onSurface: '#191c1e',
  onSurfaceVariant: '#575a60',
  inverseSurface: '#23262a',
  inverseOnSurface: '#e5e7ea',
  inversePrimary: '#b8c9de',

  // Outline - Ghost Border at 15% opacity
  outline: '#94989d',
  outlineVariant: '#c6c9ce',

  // Error
  error: '#ef4444',
  errorContainer: '#fee2e2',
  onError: '#ffffff',
  onErrorContainer: '#7f1d1d',

  // Background
  background: '#ffffff',
  onBackground: '#191c1e',

  // Gradients - Primary (sage green) to secondary (teal)
  gradientStart: '#4ade80',
  gradientEnd: '#505f76',
  gradientAccent: '#22c55e',

  // Status colors
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const;

const darkColors = {
  // Primary - Sage Green (concentration color)
  primary: '#4ade80',
  primaryContainer: '#22c55e',
  primaryFixed: '#0a1412',
  primaryFixedDim: '#050a07',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ffffff',
  onPrimaryFixed: '#ffffff',
  onPrimaryFixedVariant: '#ffffff',

  // Secondary - Deep slate for dark mode
  secondary: '#505f76',
  secondaryContainer: '#2d3a4a',
  secondaryFixed: '#111c2d',
  secondaryFixedDim: '#0a0f17',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#ffffff',
  onSecondaryFixed: '#ffffff',
  onSecondaryFixedVariant: '#ffffff',

  // Tertiary - Mint Green for accents (#6ffbbe per DESIGN.md) - VIBES
  tertiary: '#6ffbbe',
  tertiaryContainer: '#3dd0a0',
  tertiaryFixed: '#0a2a20',
  tertiaryFixedDim: '#051a12',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#ffffff',
  onTertiaryFixed: '#ffffff',
  onTertiaryFixedVariant: '#ffffff',

  // Surface Hierarchy - Dark theme with vibrant mint-green gradient
  surface: '#0f1f1a',        // Deep mint gradient start
  surfaceBright: '#1a3a30',  // Brighter mint gradient middle
  surfaceDim: '#081410',     // Darkest mint gradient end
  surfaceContainer: '#152a22', // Mint container
  surfaceContainerLow: '#1e3f33', // Lighter mint low
  surfaceContainerLowest: '#050f0c', // Nearly black
  surfaceContainerHigh: '#255544', // Medium mint high
  surfaceContainerHighest: '#306655', // Lightest mint
  surfaceVariant: '#255544',
  surfaceTint: '#6ffbbe',
  onSurface: '#ffffff',       // Pure white for dark mode text
  onSurfaceVariant: '#ffffff', // Pure white for dark mode secondary text
  inverseSurface: '#f0fff8',
  inverseOnSurface: '#255544',
  inversePrimary: '#0f1f1a',

  // Outline - Mint-tinted ghost border
  outline: '#50ffb8',
  outlineVariant: '#255544',

  // Error
  error: '#ef4444',
  errorContainer: '#2a0a0a',
  onError: '#ffffff',
  onErrorContainer: '#e5e7ea',

  // Background
  background: '#081410',
  onBackground: '#ffffff',

  // Gradients - Vibrant mint green gradient for dark mode
  gradientStart: '#6ffbbe',
  gradientEnd: '#0f1f1a',
  gradientAccent: '#3dd0a0',

  // Status colors
  success: '#4ade80',
  warning: '#f59e0b',
  info: '#60a5fa',
} as const;

export const Colors = {
  ...lightColors,
} as const;

export const LightColors = lightColors;
export const DarkColors = darkColors;

export const Typography = {
  displayLarge: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 57,
    letterSpacing: -0.25,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 45,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 36,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 32,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 28,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Shape = {
  roundTwo: 2,
  roundFour: 4,
  roundEight: 8,
  roundTwelve: 12,
  roundSixteen: 16,
  roundTwenty: 20,
  roundFull: 9999,
} as const;

export const Shadows = {
  ambient: '0px 24px 48px rgba(12, 25, 21, 0.3)',
  card: '0px 4px 16px rgba(12, 25, 21, 0.25)',
  elevated: '0px 8px 24px rgba(12, 25, 21, 0.3)',
  glow: '0px 0px 20px rgba(74, 222, 128, 0.25)',
  glowTeal: '0px 0px 20px rgba(15, 118, 110, 0.2)',
  glowCoral: '0px 0px 20px rgba(244, 63, 94, 0.15)',
} as const;