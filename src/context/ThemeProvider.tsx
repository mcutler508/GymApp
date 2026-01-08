import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme, Theme, ThemeMode } from '../constants/theme';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'ui.theme';

// Convert our theme to Paper MD3 theme
const toPaperTheme = (theme: Theme, isDark: boolean) => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      primaryContainer: theme.colors.primaryDark,
      secondary: theme.colors.secondary,
      background: theme.colors.background,
      surface: theme.colors.surface,
      surfaceVariant: theme.colors.card,
      error: theme.colors.error,
      onPrimary: theme.colors.onPrimary,
      onSecondary: theme.colors.onSecondary,
      onBackground: theme.colors.onBackground,
      onSurface: theme.colors.onSurface,
      onError: theme.colors.onError,
      outline: theme.colors.border,
      outlineVariant: theme.colors.divider,
    },
  };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Resolve the actual theme mode
  const resolvedMode: 'light' | 'dark' = 
    mode === 'system' ? (systemColorScheme ?? 'light') : mode;
  
  const theme = resolvedMode === 'dark' ? DarkTheme : LightTheme;
  const isSystem = mode === 'system';

  // Load persisted theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
          const parsed = stored as ThemeMode;
          if (parsed === 'light' || parsed === 'dark' || parsed === 'system') {
            setModeState(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsHydrated(true);
      }
    };
    loadTheme();
  }, []);

  // Persist theme preference
  const setMode = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    mode,
    resolvedMode,
    setMode,
    isSystem,
  };

  // Show loading indicator while theme is being loaded
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LightTheme.colors.background }}>
        <ActivityIndicator size="large" color={LightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={toPaperTheme(theme, resolvedMode === 'dark')}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


