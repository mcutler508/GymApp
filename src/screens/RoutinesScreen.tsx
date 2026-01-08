import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, FAB, Portal, IconButton, Dialog, Button } from 'react-native-paper';
import { Spacing } from '../constants/theme';
import { Routine } from '../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeProvider';

type NavigationProp = StackNavigationProp<any>;

const ROUTINES_STORAGE_KEY = 'routines';

interface WorkoutLog {
  id: string;
  sessionId: string;
  routineId?: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  sets: Array<{ weight: number; reps: number }>;
  difficulty: string;
  nextWeight: number;
}

export default function RoutinesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [favoriteRoutines, setFavoriteRoutines] = useState<Routine[]>([]);
  const [activeRoutines, setActiveRoutines] = useState<Routine[]>([]);
  const [completedRoutines, setCompletedRoutines] = useState<Routine[]>([]);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [newRoutineId, setNewRoutineId] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      if (stored) {
        const allRoutines: Routine[] = JSON.parse(stored);
        setRoutines(allRoutines);

        // Separate favorites, active, and completed routines
        const favorites = allRoutines.filter(r => r.isFavorite && !r.completed);
        const active = allRoutines.filter(r => !r.completed && !r.isFavorite);
        const completed = allRoutines.filter(r => r.completed);
        setFavoriteRoutines(favorites);
        setActiveRoutines(active);
        setCompletedRoutines(completed);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  const saveRoutines = async (updatedRoutines: Routine[]) => {
    try {
      await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(updatedRoutines));
      setRoutines(updatedRoutines);
    } catch (error) {
      console.error('Error saving routines:', error);
      Alert.alert('Error', 'Failed to save routines');
    }
  };

  const handleDeleteRoutine = (routineId: string) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRoutines = routines.filter((r) => r.id !== routineId);
              await saveRoutines(updatedRoutines);
              // Reload routines to update active/completed lists
              await loadRoutines();
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          },
        },
      ]
    );
  };

  const handleStartWorkout = (routine: Routine) => {
    if (routine.completed) {
      Alert.alert(
        'Routine Completed',
        'This routine has already been completed. Please duplicate it to run it again with updated weights.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (routine.exercises.length === 0) {
      Alert.alert('Empty Routine', 'Please add exercises to this routine first');
      return;
    }
    navigation.navigate('ActiveRoutineWorkout', { routineId: routine.id });
  };

  const handleDuplicateRoutine = async (routine: Routine) => {
    if (routine.exercises.length === 0) {
      Alert.alert('Empty Routine', 'This routine has no exercises to duplicate');
      return;
    }

    try {
      // Load workout logs to get the latest "next weight" for each exercise
      const logsString = await AsyncStorage.getItem('workoutLogs');
      const logs: WorkoutLog[] = logsString ? JSON.parse(logsString) : [];

      // Filter logs for this routine's exercises
      const routineExerciseIds = routine.exercises.map((ex) => ex.exerciseId);

      // Get the latest nextWeight for each exercise
      const exerciseWeights = new Map<string, number>();

      // Sort logs by date (newest first) and find latest nextWeight for each exercise
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      sortedLogs.forEach((log) => {
        if (routineExerciseIds.includes(log.exerciseId) && !exerciseWeights.has(log.exerciseId)) {
          exerciseWeights.set(log.exerciseId, log.nextWeight);
        }
      });

      // Create new routine with updated weights
      const duplicatedExercises = routine.exercises.map((ex) => ({
        ...ex,
        id: `${Date.now()}-${Math.random()}`, // New unique ID for the duplicated exercise
        currentWeight: exerciseWeights.get(ex.exerciseId) || ex.currentWeight || ex.startingWeight,
        lastDifficulty: undefined,
        lastPerformed: undefined,
      }));

      const duplicatedRoutine: Routine = {
        id: `routine-${Date.now()}`,
        name: routine.name,
        exercises: duplicatedExercises,
        created_at: new Date().toISOString(),
        last_performed: undefined,
        completed: false,
      };

      // Save the new routine
      const updatedRoutines = [...routines, duplicatedRoutine];
      await saveRoutines(updatedRoutines);

      // Reload routines to update active/completed lists
      await loadRoutines();

      // Store the new routine ID and show dialog
      setNewRoutineId(duplicatedRoutine.id);
      setShowStartDialog(true);
    } catch (error) {
      console.error('Error duplicating routine:', error);
      Alert.alert('Error', 'Failed to duplicate routine');
    }
  };

  const handleStartNewRoutine = () => {
    setShowStartDialog(false);
    if (newRoutineId) {
      navigation.navigate('ActiveRoutineWorkout', { routineId: newRoutineId });
    }
  };

  const handleDismissDialog = () => {
    setShowStartDialog(false);
    setNewRoutineId(null);
  };

  const toggleFavorite = async (routineId: string) => {
    try {
      const updatedRoutines = routines.map((r) =>
        r.id === routineId ? { ...r, isFavorite: !r.isFavorite } : r
      );
      await saveRoutines(updatedRoutines);
      await loadRoutines();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const handleClearCompleted = () => {
    const completedCount = completedRoutines.length;
    if (completedCount === 0) {
      Alert.alert('No Completed Routines', 'There are no completed routines to clear');
      return;
    }

    Alert.alert(
      'Clear Completed Routines',
      `Reset ${completedCount} completed routine${completedCount !== 1 ? 's' : ''}? They will become active again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              const updatedRoutines = routines.map((r) =>
                r.completed ? { ...r, completed: false } : r
              );
              await saveRoutines(updatedRoutines);
              await loadRoutines();
            } catch (error) {
              console.error('Error clearing completed routines:', error);
              Alert.alert('Error', 'Failed to clear completed routines');
            }
          },
        },
      ]
    );
  };

  const renderRoutine = ({ item }: { item: Routine }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge">{item.name}</Text>
            <Text variant="bodySmall" style={[styles.exerciseCount, { color: theme.colors.primary }]}>
              {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
            </Text>
            {item.last_performed && (
              <Text variant="bodySmall" style={[styles.lastPerformed, { color: theme.colors.textSecondary }]}>
                Last: {new Date(item.last_performed).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon={item.isFavorite ? 'star' : 'star-outline'}
              iconColor={item.isFavorite ? theme.colors.warning : theme.colors.textSecondary}
              size={24}
              onPress={() => toggleFavorite(item.id)}
            />
            {!item.completed && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => navigation.navigate('RoutineBuilder', { routineId: item.id })}
              />
            )}
            <IconButton
              icon="delete"
              iconColor={theme.colors.error}
              size={20}
              onPress={() => handleDeleteRoutine(item.id)}
            />
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActionsRow}>
        {item.completed ? (
          <IconButton
            icon="content-copy"
            iconColor={theme.colors.secondary}
            size={28}
            onPress={() => handleDuplicateRoutine(item)}
            style={styles.duplicateButton}
          />
        ) : (
          <IconButton
            icon="play-circle"
            iconColor={theme.colors.primary}
            size={32}
            onPress={() => handleStartWorkout(item)}
            style={styles.playButton}
          />
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Favorites Section */}
        {favoriteRoutines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                ⭐ Favorites
              </Text>
            </View>
            {favoriteRoutines.map((routine) => (
              <View key={routine.id}>{renderRoutine({ item: routine })}</View>
            ))}
          </View>
        )}

        {/* Active Routines Section */}
        {activeRoutines.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Active Routines
            </Text>
            {activeRoutines.map((routine) => (
              <View key={routine.id}>{renderRoutine({ item: routine })}</View>
            ))}
          </View>
        )}

        {/* Completed Routines Section */}
        {completedRoutines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Completed Routines
              </Text>
              <IconButton
                icon="broom"
                size={24}
                iconColor={theme.colors.primary}
                onPress={handleClearCompleted}
              />
            </View>
            {completedRoutines.map((routine) => (
              <View key={routine.id}>{renderRoutine({ item: routine })}</View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {activeRoutines.length === 0 && completedRoutines.length === 0 && favoriteRoutines.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Routines Yet
            </Text>
            <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Create a routine to get started with your workouts
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('RoutineBuilder', {})}
        label="Create Routine"
      />

      <Portal>
        <Dialog visible={showStartDialog} onDismiss={handleDismissDialog}>
          <Dialog.Title>Routine Duplicated!</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your routine has been duplicated with updated weights based on your last performance.
            </Text>
            <Text variant="bodyMedium" style={styles.dialogQuestion}>
              Would you like to start this workout now?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleDismissDialog}>Not Now</Button>
            <Button onPress={handleStartNewRoutine} mode="contained">
              Start Workout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80, // Extra padding for FAB
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: Spacing.md,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardActions: {
    flexDirection: 'row',
  },
  exerciseCount: {
    marginTop: Spacing.sm,
    fontWeight: 'bold',
  },
  lastPerformed: {
    marginTop: Spacing.xs,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  duplicateButton: {
    marginRight: Spacing.xs,
  },
  playButton: {
    marginLeft: Spacing.xs,
  },
  dialogQuestion: {
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl * 2,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
