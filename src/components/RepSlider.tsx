import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { Colors, Spacing } from '../constants/theme';

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
  // Round value to nearest integer
  const roundedValue = Math.round(value);

  const handleValueChange = (newValue: number) => {
    const rounded = Math.round(newValue);
    onValueChange(rounded);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="bodyMedium" style={styles.label}>
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
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.primary}
      />
      <Text variant="titleMedium" style={styles.valueText}>
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
    color: Colors.textSecondary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  valueText: {
    textAlign: 'center',
    marginTop: Spacing.xs,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
