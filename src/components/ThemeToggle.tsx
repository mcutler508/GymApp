import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../context/ThemeProvider';
import { ThemeMode } from '../constants/theme';

export default function ThemeToggle() {
  const { mode, setMode, theme } = useTheme();

  const modes: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={[styles.label, { color: theme.colors.textSecondary }]}>
        Theme
      </Text>
      <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surface }]}>
        {modes.map((m) => {
          const isSelected = mode === m.value;
          return (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.toggleButton,
                isSelected && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              onPress={() => setMode(m.value)}
              activeOpacity={0.7}
            >
              <Text
                variant="labelMedium"
                style={[
                  styles.toggleText,
                  {
                    color: isSelected ? theme.colors.onPrimary : theme.colors.textSecondary,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 13,
  },
});
