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
export type ThemeMode = 'light' | 'dark' | 'system';

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
