import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Portal, IconButton, Dialog, Button } from 'react-native-paper';
import { Colors, Spacing } from '../constants/theme';
import { Routine } from '../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [newRoutineId, setNewRoutineId] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      if (stored) {
        setRoutines(JSON.parse(stored));
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
            const updatedRoutines = routines.filter((r) => r.id !== routineId);
            await saveRoutines(updatedRoutines);
          },
        },
      ]
    );
  };

  const handleStartWorkout = (routine: Routine) => {
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
        name: `${routine.name} (Copy)`,
        exercises: duplicatedExercises,
        created_at: new Date().toISOString(),
        last_performed: undefined,
      };

      // Save the new routine
      const updatedRoutines = [...routines, duplicatedRoutine];
      await saveRoutines(updatedRoutines);

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

  const renderRoutine = ({ item }: { item: Routine }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge">{item.name}</Text>
            <Text variant="bodySmall" style={styles.exerciseCount}>
              {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
            </Text>
            {item.last_performed && (
              <Text variant="bodySmall" style={styles.lastPerformed}>
                Last: {new Date(item.last_performed).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => navigation.navigate('RoutineBuilder', { routineId: item.id })}
            />
            <IconButton
              icon="delete"
              iconColor={Colors.error}
              size={20}
              onPress={() => handleDeleteRoutine(item.id)}
            />
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActionsRow}>
        <IconButton
          icon="content-copy"
          iconColor={Colors.secondary}
          size={28}
          onPress={() => handleDuplicateRoutine(item)}
          style={styles.duplicateButton}
        />
        <IconButton
          icon="play-circle"
          iconColor={Colors.primary}
          size={32}
          onPress={() => handleStartWorkout(item)}
          style={styles.playButton}
        />
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={routines}
        renderItem={renderRoutine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Routines Yet
            </Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Create a routine to get started with your workouts
            </Text>
          </View>
        }
      />

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
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardActions: {
    flexDirection: 'row',
  },
  exerciseCount: {
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: 'bold',
  },
  lastPerformed: {
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
