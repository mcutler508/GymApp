import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';

interface WeightSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}

export default function WeightSlider({
  value,
  onValueChange,
  label,
  min = 0,
  max = 500,
  step = 5,
}: WeightSliderProps) {
  const { theme } = useTheme();
  // Round value to nearest step increment
  const roundedValue = Math.round(value / step) * step;
  
  const handleValueChange = (newValue: number) => {
    // Round to nearest step increment
    const rounded = Math.round(newValue / step) * step;
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
        step={step}
        value={roundedValue}
        onValueChange={handleValueChange}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.primary}
      />
      <Text variant="titleMedium" style={[styles.valueText, { color: theme.colors.primary }]}>
        {roundedValue} lbs
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


