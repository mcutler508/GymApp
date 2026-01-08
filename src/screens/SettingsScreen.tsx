import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { Spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeProvider';

const ROUTINES_STORAGE_KEY = 'routines';
const WORKOUT_LOGS_KEY = 'workoutLogs';
const WORKOUT_HISTORY_KEY = 'workoutHistory';

export default function SettingsScreen() {
  const { theme } = useTheme();

  const handleRestoreToDefault = () => {
    Alert.alert(
      'Restore to Default',
      'This will permanently delete all routines (active, completed, and favorites), all workout logs, and all statistics. Your exercise menu will be preserved. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear routines
              await AsyncStorage.removeItem(ROUTINES_STORAGE_KEY);
              
              // Clear workout logs (this also clears stats since they're calculated from logs)
              await AsyncStorage.removeItem(WORKOUT_LOGS_KEY);
              
              // Clear workout history
              await AsyncStorage.removeItem(WORKOUT_HISTORY_KEY);
              
              Alert.alert(
                'Success',
                'App has been restored to default. All routines, workout logs, and statistics have been cleared.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error restoring to default:', error);
              Alert.alert('Error', 'Failed to restore app to default. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Settings
        </Text>

        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
              Data Management
            </Text>
            <Text variant="bodyMedium" style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              Clear all routine data and workout logs while preserving your exercise menu.
            </Text>
            <Button
              mode="contained"
              onPress={handleRestoreToDefault}
              style={styles.restoreButton}
              buttonColor={theme.colors.error}
              textColor="#fff"
            >
              Restore to Default
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  restoreButton: {
    marginTop: Spacing.xs,
  },
});

