// Theme tokens for light and dark modes
export const LightTheme = {
  colors: {
    primary: '#0891B2', // Cyan 600 - Better contrast for light mode
    primaryDark: '#0E7490',
    primaryLight: '#06B6D4',
    secondary: '#0891B2',
    background: '#FFFFFF',
    surface: '#F6F8FA',
    card: '#FFFFFF',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    text: '#0B1217',
    textSecondary: '#64748B', // Darker gray for better readability
    border: '#E2E8F0',
    divider: '#E2E8F0',
    onPrimary: '#FFFFFF', // White text on primary button
    onSecondary: '#FFFFFF',
    onBackground: '#0B1217',
    onSurface: '#0B1217',
    onError: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  typography: {
    displayLarge: 57,
    displayMedium: 45,
    displaySmall: 36,
    headlineLarge: 32,
    headlineMedium: 28,
    headlineSmall: 24,
    titleLarge: 22,
    titleMedium: 16,
    titleSmall: 14,
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12,
    labelLarge: 14,
    labelMedium: 12,
    labelSmall: 11,
  },
  elevation: {
    level0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    level1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    level2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    level3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    level4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

export const RetroTheme = {
  colors: {
    primary: '#FF6B35', // Vibrant retro orange
    primaryDark: '#E55A2B',
    primaryLight: '#FF8C5A',
    secondary: '#2A9D8F', // Retro teal
    background: '#F5E6D3', // Warm cream
    surface: '#EDD9C0', // Slightly darker cream
    card: '#FFFFFF', // White cards for contrast
    error: '#E63946', // Bold red
    success: '#06A77D', // Teal-green
    warning: '#FFB627', // Golden yellow
    text: '#2D1B4E', // Deep purple for high contrast
    textSecondary: '#6B4C7A', // Medium purple
    border: '#FF6B35', // Bold orange borders for retro pop
    divider: '#D4B896',
    onPrimary: '#FFFFFF', // White text on orange
    onSecondary: '#FFFFFF', // White text on teal
    onBackground: '#2D1B4E',
    onSurface: '#2D1B4E',
    onError: '#FFFFFF',
    accent1: '#FF6B35', // Orange
    accent2: '#2A9D8F', // Teal
    accent3: '#FFB627', // Yellow
    accent4: '#E63946', // Red
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // Super rounded corners for that groovy 70s feel
  radii: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
  typography: {
    displayLarge: 57,
    displayMedium: 45,
    displaySmall: 36,
    headlineLarge: 32,
    headlineMedium: 28,
    headlineSmall: 24,
    titleLarge: 22,
    titleMedium: 16,
    titleSmall: 14,
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12,
    labelLarge: 14,
    labelMedium: 12,
    labelSmall: 11,
  },
  // Retro-specific font weights (much bolder!)
  fontWeights: {
    regular: '400',
    medium: '600',
    semibold: '700',
    bold: '800',
    extrabold: '900',
  },
  // Thick retro borders
  borders: {
    thin: 2,
    medium: 3,
    thick: 4,
    chunky: 5,
  },
  // Colored shadows for that 70s glow
  elevation: {
    level0: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    level1: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    level2: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    level3: {
      shadowColor: '#2A9D8F',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    level4: {
      shadowColor: '#2A9D8F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  // Hard offset shadow for vintage poster look
  hardShadow: {
    small: { x: 3, y: 3 },
    medium: { x: 5, y: 5 },
    large: { x: 7, y: 7 },
  },
};

export const DarkTheme = {
  colors: {
    primary: '#22D3EE', // Cyan 400 - Vibrant but not overwhelming for dark mode
    primaryDark: '#06B6D4',
    primaryLight: '#67E8F9',
    secondary: '#22D3EE',
    background: '#0B1217',
    surface: '#111A22',
    card: '#1A2332',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    text: '#E6EDF3',
    textSecondary: '#94A3B8', // Lighter gray for better readability
    border: '#1F2937',
    divider: '#1F2937',
    onPrimary: '#0B1217', // Dark text on bright primary
    onSecondary: '#0B1217',
    onBackground: '#E6EDF3',
    onSurface: '#E6EDF3',
    onError: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  typography: {
    displayLarge: 57,
    displayMedium: 45,
    displaySmall: 36,
    headlineLarge: 32,
    headlineMedium: 28,
    headlineSmall: 24,
    titleLarge: 22,
    titleMedium: 16,
    titleSmall: 14,
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12,
    labelLarge: 14,
    labelMedium: 12,
    labelSmall: 11,
  },
  elevation: {
    level0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    level1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    level2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 2,
    },
    level3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
    level4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// Legacy exports for backward compatibility during migration
export const Colors = DarkTheme.colors;
export const Spacing = DarkTheme.spacing;
export const FontSizes = DarkTheme.typography;

export type Theme = typeof LightTheme;
export type ThemeMode = 'light' | 'dark' | 'retro';

export const MuscleGroups = [
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Biceps', value: 'biceps' },
  { label: 'Triceps', value: 'triceps' },
  { label: 'Legs', value: 'legs' },
  { label: 'Abs', value: 'abs' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Other', value: 'other' },
];
