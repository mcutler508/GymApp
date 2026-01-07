import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeProvider';

export default function StatusBarWrapper() {
  const { resolvedMode } = useTheme();
  return <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />;
}
