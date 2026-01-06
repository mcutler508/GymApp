import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/theme';

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryDark,
    secondary: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    error: Colors.error,
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: Colors.text,
    onSurface: Colors.text,
    onError: '#ffffff',
    outline: Colors.border,
  },
};

export default function App() {
  return (
    <PaperProvider theme={darkTheme}>
      <AppNavigator />
      <StatusBar style="light" />
    </PaperProvider>
  );
}
