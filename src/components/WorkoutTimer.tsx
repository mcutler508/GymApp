import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { formatDurationMMSS } from '../utils/timeFormat';

interface WorkoutTimerProps {
  startTime: number; // Timestamp in milliseconds
  onDurationChange?: (seconds: number) => void;
}

export default function WorkoutTimer({ startTime, onDurationChange }: WorkoutTimerProps) {
  const { theme } = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate initial elapsed time
    const now = Date.now();
    const initialElapsed = Math.floor((now - startTime) / 1000);
    setElapsedSeconds(initialElapsed);

    // Update timer every second
    intervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      setElapsedSeconds(elapsed);
      if (onDurationChange) {
        onDurationChange(elapsed);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, onDurationChange]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <Text variant="headlineMedium" style={[styles.timerText, { color: theme.colors.primary }]}>
        {formatDurationMMSS(elapsedSeconds)}
      </Text>
      <Text variant="bodySmall" style={[styles.labelText, { color: theme.colors.textSecondary }]}>
        Workout Time
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  timerText: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  labelText: {
    marginTop: Spacing.xs,
  },
});


