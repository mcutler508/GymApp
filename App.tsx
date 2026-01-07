import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeProvider';
import StatusBarWrapper from './src/components/StatusBarWrapper';

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
      <StatusBarWrapper />
    </ThemeProvider>
  );
}
