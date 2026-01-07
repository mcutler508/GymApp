import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';

interface RepSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export default function RepSlider({
  value,
  onValueChange,
  label = 'Reps',
  min = 1,
  max = 20,
}: RepSliderProps) {
  const { theme } = useTheme();
  // Round value to nearest integer
  const roundedValue = Math.round(value);

  const handleValueChange = (newValue: number) => {
    const rounded = Math.round(newValue);
    onValueChange(rounded);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={roundedValue || min}
        onValueChange={handleValueChange}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.primary}
      />
      <Text variant="titleMedium" style={[styles.valueText, { color: theme.colors.primary }]}>
        {roundedValue || min} reps
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  valueText: {
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontWeight: 'bold',
  },
});
