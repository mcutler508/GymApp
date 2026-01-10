import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeProvider';
import { AuthProvider } from './src/context/AuthProvider';
import StatusBarWrapper from './src/components/StatusBarWrapper';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBarWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}