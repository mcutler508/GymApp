import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeProvider';

export default function StatusBarWrapper() {
  const { mode } = useTheme();
  // Dark mode has light status bar, light and retro have dark status bar
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}








