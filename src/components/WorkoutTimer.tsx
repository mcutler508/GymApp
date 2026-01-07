import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, Spacing } from '../constants/theme';
import { formatDurationMMSS } from '../utils/timeFormat';

interface WorkoutTimerProps {
  startTime: number; // Timestamp in milliseconds
  onDurationChange?: (seconds: number) => void;
}

export default function WorkoutTimer({ startTime, onDurationChange }: WorkoutTimerProps) {
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
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.timerText}>
        {formatDurationMMSS(elapsedSeconds)}
      </Text>
      <Text variant="bodySmall" style={styles.labelText}>
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
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  timerText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  labelText: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});


