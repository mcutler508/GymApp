import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, Card, IconButton, ProgressBar, Dialog, TextInput, Button, Portal } from 'react-native-paper';
import { Colors, Spacing } from '../constants/theme';
import { Routine, RoutineExercise, DifficultyRating } from '../types';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutTimer from '../components/WorkoutTimer';

type ActiveRoutineWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'ActiveRoutineWorkout'>;
type ActiveRoutineWorkoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveRoutineWorkout'>;

interface Props {
  route: ActiveRoutineWorkoutScreenRouteProp;
  navigation: ActiveRoutineWorkoutScreenNavigationProp;
}

const ROUTINES_STORAGE_KEY = 'routines';

export default function ActiveRoutineWorkoutScreen({ route, navigation }: Props) {
  const { routineId } = route.params;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [showDifficultyGrid, setShowDifficultyGrid] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [exerciseToAdjust, setExerciseToAdjust] = useState<RoutineExercise | null>(null);
  const [sessionId] = useState(`routine-session-${Date.now()}`);
  const [sessionStartTime] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentExerciseStartTime, setCurrentExerciseStartTime] = useState<number | null>(null);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);

  useEffect(() => {
    loadRoutine();
  }, []);

  // Handle timer cancellation when difficulty grid is closed without selection
  useEffect(() => {
    if (!showDifficultyGrid && currentExerciseStartTime) {
      // User closed difficulty grid without selecting difficulty - clear timer
      setCurrentExerciseStartTime(null);
      setCurrentExerciseId(null);
    }
  }, [showDifficultyGrid, currentExerciseStartTime]);

  // Handle back button press to clear timer if on difficulty grid
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showDifficultyGrid && currentExerciseStartTime) {
          // Clear timer if user presses back on difficulty grid
          setCurrentExerciseStartTime(null);
          setCurrentExerciseId(null);
          setShowDifficultyGrid(false);
          return true; // Prevent default back action
        }
        return false; // Allow default back action
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showDifficultyGrid, currentExerciseStartTime])
  );

  const loadRoutine = async () => {
    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      if (stored) {
        const routines: Routine[] = JSON.parse(stored);
        const foundRoutine = routines.find((r) => r.id === routineId);
        if (foundRoutine) {
          setRoutine(foundRoutine);
        }
      }
    } catch (error) {
      console.error('Error loading routine:', error);
    }
  };

  const handleExerciseTap = (exercise: RoutineExercise) => {
    if (completedExercises.has(exercise.id)) {
      // Already completed, do nothing or show message
      return;
    }
    setSelectedExercise(exercise);
    setCurrentExerciseStartTime(Date.now());
    setCurrentExerciseId(exercise.id);
    setShowDifficultyGrid(true);
  };

  const handleAdjustWeight = (exercise: RoutineExercise, event: any) => {
    event.stopPropagation();
    if (completedExercises.has(exercise.id)) {
      return;
    }
    setExerciseToAdjust(exercise);
    setWeightInput((exercise.currentWeight || exercise.startingWeight || 0).toString());
    setShowWeightDialog(true);
  };

  const handleSaveWeight = async () => {
    if (!exerciseToAdjust || !routine) return;

    const newWeight = weightInput.trim() ? parseFloat(weightInput) : undefined;
    if (newWeight !== undefined && (isNaN(newWeight) || newWeight < 0)) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight value');
      return;
    }

    // Update the exercise weight in the routine
    const updatedExercises = routine.exercises.map((ex) =>
      ex.id === exerciseToAdjust.id
        ? { ...ex, currentWeight: newWeight }
        : ex
    );

    const updatedRoutine: Routine = {
      ...routine,
      exercises: updatedExercises,
    };

    // Save updated routine
    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      const routines: Routine[] = stored ? JSON.parse(stored) : [];
      const routineIndex = routines.findIndex((r) => r.id === routineId);
      if (routineIndex !== -1) {
        routines[routineIndex] = updatedRoutine;
        await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
        setRoutine(updatedRoutine);
      }
    } catch (error) {
      console.error('Error saving routine:', error);
    }

    setShowWeightDialog(false);
    setExerciseToAdjust(null);
    setWeightInput('');
  };

  const calculateNextWeight = (currentWeight: number, difficulty: DifficultyRating): number => {
    const adjustments = {
      easy: 0.10,
      normal: 0.05,
      hard: 0,
      expert: -0.05,
    };

    const adjustment = adjustments[difficulty];
    const newWeight = currentWeight * (1 + adjustment);

    return Math.round(newWeight / 5) * 5;
  };

  const handleDifficultySelection = async (difficulty: DifficultyRating) => {
    if (!selectedExercise || !routine) return;

    const currentWeight = selectedExercise.currentWeight || selectedExercise.startingWeight || 0;
    const newWeight = calculateNextWeight(currentWeight, difficulty);

    // Calculate exercise duration
    const endTime = Date.now();
    const exerciseDuration = currentExerciseStartTime 
      ? Math.floor((endTime - currentExerciseStartTime) / 1000)
      : undefined;
    const exerciseStartTimeISO = currentExerciseStartTime 
      ? new Date(currentExerciseStartTime).toISOString()
      : undefined;
    const exerciseEndTimeISO = new Date(endTime).toISOString();

    // Mark exercise as completed
    const updatedCompleted = new Set(completedExercises);
    updatedCompleted.add(selectedExercise.id);
    setCompletedExercises(updatedCompleted);

    // Save workout log with duration
    await saveWorkoutLog(
      selectedExercise, 
      currentWeight, 
      difficulty, 
      newWeight,
      exerciseDuration,
      exerciseStartTimeISO,
      exerciseEndTimeISO
    );

    // Clear timer state
    setCurrentExerciseStartTime(null);
    setCurrentExerciseId(null);

    // Update the routine with new weight and last performance
    const updatedExercises = routine.exercises.map((ex) =>
      ex.id === selectedExercise.id
        ? {
            ...ex,
            currentWeight: newWeight,
            lastDifficulty: difficulty,
            lastPerformed: new Date().toISOString(),
          }
        : ex
    );

    const updatedRoutine: Routine = {
      ...routine,
      exercises: updatedExercises,
      last_performed: new Date().toISOString(),
    };

    // Save updated routine
    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      const routines: Routine[] = stored ? JSON.parse(stored) : [];
      const routineIndex = routines.findIndex((r) => r.id === routineId);
      if (routineIndex !== -1) {
        routines[routineIndex] = updatedRoutine;
        await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
        setRoutine(updatedRoutine);
      }
    } catch (error) {
      console.error('Error saving routine:', error);
    }

    setShowDifficultyGrid(false);
    setSelectedExercise(null);

    // Check if all exercises are completed
    if (updatedCompleted.size === routine.exercises.length) {
      // Calculate session duration
      const sessionEndTime = Date.now();
      const totalSessionDuration = Math.floor((sessionEndTime - sessionStartTime) / 1000);

      // Update all logs in this session with session timing
      try {
        const logsString = await AsyncStorage.getItem('workoutLogs');
        if (logsString) {
          const logs = JSON.parse(logsString);
          const updatedLogs = logs.map((log: any) => {
            if (log.sessionId === sessionId) {
              return {
                ...log,
                sessionStartTime: new Date(sessionStartTime).toISOString(),
                sessionEndTime: new Date(sessionEndTime).toISOString(),
                sessionDuration: totalSessionDuration,
              };
            }
            return log;
          });
          await AsyncStorage.setItem('workoutLogs', JSON.stringify(updatedLogs));
        }
      } catch (error) {
        console.error('Error updating session timing:', error);
      }

      // Mark routine as complete
      try {
        const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
        const routines: Routine[] = stored ? JSON.parse(stored) : [];
        const routineIndex = routines.findIndex((r) => r.id === routineId);
        if (routineIndex !== -1) {
          routines[routineIndex] = {
            ...routines[routineIndex],
            completed: true,
          };
          await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
        }
      } catch (error) {
        console.error('Error marking routine as complete:', error);
      }

      Alert.alert(
        'Workout Complete!',
        `Great job! You completed ${routine.name}.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Routines') }]
      );
    }
  };

  const saveWorkoutLog = async (
    exercise: RoutineExercise,
    weight: number,
    difficulty: DifficultyRating,
    nextWeight: number,
    duration?: number,
    startTime?: string,
    endTime?: string
  ) => {
    try {
      // Create a workout log entry (routine workouts don't have detailed set info)
      const workoutLog = {
        exerciseName: exercise.exerciseName,
        date: new Date().toISOString(),
        sets: [{ weight, reps: 0 }], // Placeholder since routine doesn't track sets
        difficulty,
        nextWeight,
        duration,
        startTime,
        endTime,
      };

      // Load existing workout logs array
      const logsString = await AsyncStorage.getItem('workoutLogs');
      const logs = logsString ? JSON.parse(logsString) : [];

      // Add new workout log with unique ID and session ID
      const newLog = {
        id: Date.now().toString(),
        sessionId,
        routineId,
        routineName: routine?.name,
        exerciseId: exercise.exerciseId,
        muscleGroup: exercise.muscleGroup,
        ...workoutLog,
      };
      logs.push(newLog);

      // Save back to storage
      await AsyncStorage.setItem('workoutLogs', JSON.stringify(logs));

      // Also update the "last workout" tracking for quick access
      const historyString = await AsyncStorage.getItem('workoutHistory');
      const history = historyString ? JSON.parse(historyString) : {};
      history[exercise.exerciseId] = workoutLog;
      await AsyncStorage.setItem('workoutHistory', JSON.stringify(history));

      console.log('Routine workout saved to log');
    } catch (error) {
      console.error('Error saving workout log:', error);
    }
  };

  if (!routine) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const progress = completedExercises.size / routine.exercises.length;

  if (showDifficultyGrid && selectedExercise) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineMedium" style={styles.title}>
            How was that exercise?
          </Text>
          <Text variant="titleMedium" style={styles.exerciseName}>
            {selectedExercise.exerciseName}
          </Text>
          
          {currentExerciseStartTime && (
            <WorkoutTimer 
              startTime={currentExerciseStartTime} 
              onDurationChange={() => {}} 
            />
          )}
          
          <Text variant="bodyLarge" style={styles.subtitle}>
            Rate the difficulty to adjust your next weight
          </Text>

          <Button
            mode="outlined"
            onPress={() => {
              setShowDifficultyGrid(false);
              setCurrentExerciseStartTime(null);
              setCurrentExerciseId(null);
            }}
            style={styles.backButton}
          >
            Back to Workout
          </Button>

          <View style={styles.difficultyGrid}>
            <View style={styles.difficultyRow}>
              <Card
                style={[styles.difficultyCard, styles.easyCard]}
                onPress={() => handleDifficultySelection('easy')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <Text variant="headlineSmall" style={styles.difficultyEmoji}>
                    😊
                  </Text>
                  <Text variant="titleLarge" style={styles.difficultyText}>
                    Easy
                  </Text>
                  <Text variant="bodySmall" style={styles.difficultyDesc}>
                    +10% weight
                  </Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.difficultyCard, styles.normalCard]}
                onPress={() => handleDifficultySelection('normal')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <Text variant="headlineSmall" style={styles.difficultyEmoji}>
                    💪
                  </Text>
                  <Text variant="titleLarge" style={styles.difficultyText}>
                    Normal
                  </Text>
                  <Text variant="bodySmall" style={styles.difficultyDesc}>
                    +5% weight
                  </Text>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.difficultyRow}>
              <Card
                style={[styles.difficultyCard, styles.hardCard]}
                onPress={() => handleDifficultySelection('hard')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <Text variant="headlineSmall" style={styles.difficultyEmoji}>
                    😅
                  </Text>
                  <Text variant="titleLarge" style={styles.difficultyText}>
                    Hard
                  </Text>
                  <Text variant="bodySmall" style={styles.difficultyDesc}>
                    Same weight
                  </Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.difficultyCard, styles.expertCard]}
                onPress={() => handleDifficultySelection('expert')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <Text variant="headlineSmall" style={styles.difficultyEmoji}>
                    🔥
                  </Text>
                  <Text variant="titleLarge" style={styles.difficultyText}>
                    Expert
                  </Text>
                  <Text variant="bodySmall" style={styles.difficultyDesc}>
                    -5% weight
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <WorkoutTimer startTime={sessionStartTime} onDurationChange={setSessionDuration} />
        <Text variant="bodySmall" style={styles.progressText}>
          {completedExercises.size} of {routine.exercises.length} exercises complete
        </Text>
        <ProgressBar progress={progress} color={Colors.primary} style={styles.progressBar} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          {routine.name}
        </Text>
        <Text variant="bodyMedium" style={styles.instructionText}>
          Tap an exercise when you finish it
        </Text>

        {routine.exercises.map((exercise, index) => {
          const isCompleted = completedExercises.has(exercise.id);
          return (
            <Card
              key={exercise.id}
              style={[styles.exerciseCard, isCompleted && styles.completedCard]}
              onPress={() => handleExerciseTap(exercise)}
            >
              <Card.Content>
                <View style={styles.exerciseRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={isCompleted && styles.completedText}>
                      {index + 1}. {exercise.exerciseName}
                    </Text>
                    {exercise.currentWeight && (
                      <Text variant="titleLarge" style={[styles.weightText, isCompleted && styles.completedText]}>
                        {exercise.currentWeight} lbs
                      </Text>
                    )}
                    {exercise.lastDifficulty && exercise.lastPerformed && (
                      <Text variant="bodySmall" style={styles.lastPerformedText}>
                        Last: {exercise.lastDifficulty} • {new Date(exercise.lastPerformed).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.iconContainer}>
                    {!isCompleted && (
                      <IconButton
                        icon="scale"
                        iconColor={Colors.primary}
                        size={24}
                        onPress={(e) => handleAdjustWeight(exercise, e)}
                        style={styles.weightButton}
                      />
                    )}
                    {isCompleted ? (
                      <IconButton
                        icon="check-circle"
                        iconColor={Colors.success}
                        size={32}
                      />
                    ) : (
                      <IconButton
                        icon="circle-outline"
                        iconColor={Colors.textSecondary}
                        size={32}
                      />
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      {/* Weight Adjustment Dialog */}
      <Portal>
        <Dialog visible={showWeightDialog} onDismiss={() => setShowWeightDialog(false)}>
          <Dialog.Title>Adjust Weight</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogSubtitle}>
              {exerciseToAdjust?.exerciseName}
            </Text>
            <TextInput
              label="Weight (lbs)"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              mode="outlined"
              style={styles.weightInput}
              placeholder="Enter weight"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowWeightDialog(false)}>Cancel</Button>
            <Button onPress={handleSaveWeight}>Save</Button>
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
  progressContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
    color: Colors.text,
  },
  exerciseName: {
    textAlign: 'center',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  instructionText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  exerciseCard: {
    marginBottom: Spacing.md,
    elevation: 2,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  completedCard: {
    backgroundColor: Colors.card,
    opacity: 0.6,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightButton: {
    marginRight: -8,
  },
  weightText: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: Spacing.xs,
  },
  lastPerformedText: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  difficultyGrid: {
    marginVertical: Spacing.lg,
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  difficultyCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    elevation: 4,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  difficultyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  difficultyEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  difficultyText: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    color: Colors.text,
  },
  difficultyDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  easyCard: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  normalCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hardCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expertCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialogSubtitle: {
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
  },
  weightInput: {
    marginTop: Spacing.sm,
  },
  backButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
});
