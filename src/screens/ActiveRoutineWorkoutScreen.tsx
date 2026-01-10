import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, Card, IconButton, ProgressBar, Dialog, TextInput, Button, Portal } from 'react-native-paper';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { Routine, RoutineExercise, DifficultyRating } from '../types';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutTimer from '../components/WorkoutTimer';
import WeightSlider from '../components/WeightSlider';
import RepSlider from '../components/RepSlider';
import DifficultyIcon from '../components/DifficultyIcon';

type ActiveRoutineWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'ActiveRoutineWorkout'>;
type ActiveRoutineWorkoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveRoutineWorkout'>;

interface Props {
  route: ActiveRoutineWorkoutScreenRouteProp;
  navigation: ActiveRoutineWorkoutScreenNavigationProp;
}

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
}

const ROUTINES_STORAGE_KEY = 'routines';

export default function ActiveRoutineWorkoutScreen({ route, navigation }: Props) {
  const { routineId } = route.params;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [showDifficultyGrid, setShowDifficultyGrid] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [weightInput, setWeightInput] = useState<number>(0);
  const [exerciseToAdjust, setExerciseToAdjust] = useState<RoutineExercise | null>(null);
  const [sessionId] = useState(`routine-session-${Date.now()}`);
  const [sessionStartTime] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentExerciseStartTime, setCurrentExerciseStartTime] = useState<number | null>(null);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);

  // Set tracking state
  const [activeExercise, setActiveExercise] = useState<RoutineExercise | null>(null);
  const [currentSets, setCurrentSets] = useState<WorkoutSet[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [currentReps, setCurrentReps] = useState<number>(8); // Default to 8 reps
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
    // Start set tracking for this exercise
    setActiveExercise(exercise);
    setCurrentExerciseStartTime(Date.now());
    setCurrentExerciseId(exercise.id);
    setCurrentWeight(exercise.currentWeight || exercise.startingWeight || 0);
    setCurrentSets([]);
    setCurrentReps(8); // Reset to default 8 reps
  };

  const handleAdjustWeight = (exercise: RoutineExercise, event: any) => {
    event.stopPropagation();
    if (completedExercises.has(exercise.id)) {
      return;
    }
    setExerciseToAdjust(exercise);
    setWeightInput(exercise.currentWeight || exercise.startingWeight || 0);
    setShowWeightDialog(true);
  };

  const handleSaveWeight = async () => {
    if (!exerciseToAdjust || !routine) return;

    const newWeight = weightInput > 0 ? weightInput : undefined;

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
    setWeightInput(0);
  };

  const addSet = () => {
    if (!currentWeight || !currentReps) {
      Alert.alert('Error', 'Please set both weight and reps');
      return;
    }

    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      weight: currentWeight,
      reps: currentReps,
    };

    setCurrentSets([...currentSets, newSet]);
    // Keep both weight and reps for next set (user can adjust if needed)
  };

  const removeSet = (id: string) => {
    setCurrentSets(currentSets.filter(set => set.id !== id));
  };

  const completeExercise = () => {
    if (currentSets.length === 0) {
      Alert.alert('Error', 'Please add at least one set');
      return;
    }
    setSelectedExercise(activeExercise);
    setShowDifficultyGrid(true);
  };

  const cancelExercise = () => {
    setActiveExercise(null);
    setCurrentSets([]);
    setCurrentWeight(0);
    setCurrentReps(8);
    setCurrentExerciseStartTime(null);
    setCurrentExerciseId(null);
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

    // Use first set's weight for rating calculation
    const firstSetWeight = currentSets[0]?.weight || 0;
    const newWeight = calculateNextWeight(firstSetWeight, difficulty);

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

    // Save workout log with duration and sets
    await saveWorkoutLog(
      selectedExercise,
      firstSetWeight,
      difficulty,
      newWeight,
      exerciseDuration,
      exerciseStartTimeISO,
      exerciseEndTimeISO,
      currentSets
    );

    // Clear timer state and exercise tracking state
    setCurrentExerciseStartTime(null);
    setCurrentExerciseId(null);
    setActiveExercise(null);
    setCurrentSets([]);
    setCurrentWeight(0);
    setCurrentReps(8);

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
        [{ text: 'OK', onPress: () => navigation.navigate('RoutinesList') }]
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
    endTime?: string,
    sets?: WorkoutSet[]
  ) => {
    try {
      // Create a workout log entry with actual sets
      const workoutLog = {
        exerciseName: exercise.exerciseName,
        date: new Date().toISOString(),
        sets: sets || [{ weight, reps: 0 }], // Use actual sets or fallback to placeholder
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

  const handleEndRoutine = () => {
    const incompleteCount = routine ? routine.exercises.length - completedExercises.size : 0;
    const message = incompleteCount > 0
      ? `You have ${incompleteCount} incomplete exercise${incompleteCount > 1 ? 's' : ''}. Incomplete exercises will not be saved. Are you sure you want to end this workout?`
      : 'Are you sure you want to end this workout?';

    Alert.alert(
      'End Workout',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Workout',
          style: 'destructive',
          onPress: async () => {
            try {
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
                // Continue navigation even if this fails - data is still saved
              }

              // Mark routine as complete (even if not all exercises were completed)
              try {
                const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
                if (stored) {
                  const routines: Routine[] = JSON.parse(stored);
                  const routineIndex = routines.findIndex((r) => r.id === routineId);
                  if (routineIndex !== -1) {
                    routines[routineIndex] = {
                      ...routines[routineIndex],
                      completed: true,
                    };
                    await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
                  }
                }
              } catch (error) {
                console.error('Error marking routine as complete:', error);
                // Continue navigation even if this fails - timing is still saved
              }

              // Navigate back to RoutinesList screen
              // Use requestAnimationFrame to ensure navigation happens after state updates
              requestAnimationFrame(() => {
                navigation.navigate('RoutinesList');
              });
            } catch (error) {
              console.error('Error ending routine:', error);
              Alert.alert('Error', 'Failed to end workout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!routine) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const progress = completedExercises.size / routine.exercises.length;

  // Rating grid view (CHECK THIS FIRST!)
  if (showDifficultyGrid && selectedExercise) {
    return (
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <WorkoutTimer startTime={sessionStartTime} onDurationChange={setSessionDuration} />
          <Text variant="bodySmall" style={styles.progressText}>
            {completedExercises.size} of {routine.exercises.length} exercises complete
          </Text>
          <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
          <Button
            mode="contained"
            onPress={handleEndRoutine}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            style={styles.endRoutineButton}
          >
            End Routine
          </Button>
        </View>
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
                  <DifficultyIcon level="easy" size={125} />
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
                  <DifficultyIcon level="normal" size={125} />
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
                  <DifficultyIcon level="hard" size={125} />
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
                  <DifficultyIcon level="expert" size={125} />
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

  // Active exercise set tracking view
  if (activeExercise) {
    return (
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          {currentExerciseStartTime && (
            <WorkoutTimer startTime={currentExerciseStartTime} onDurationChange={() => {}} />
          )}
          <Text variant="bodySmall" style={styles.progressText}>
            {completedExercises.size} of {routine.exercises.length} exercises complete
          </Text>
          <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
          <Button
            mode="contained"
            onPress={handleEndRoutine}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            style={styles.endRoutineButton}
          >
            End Routine
          </Button>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineMedium" style={styles.title}>
            {activeExercise.exerciseName}
          </Text>

          <Card style={styles.inputCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputTitle}>
                Weight and reps for set. Click Add Set for next.
              </Text>

              <WeightSlider
                label="Weight (lbs)"
                value={currentWeight}
                onValueChange={setCurrentWeight}
              />

              <RepSlider
                label="Reps"
                value={currentReps}
                onValueChange={setCurrentReps}
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={addSet}
                  style={[styles.button, { flex: 1, marginRight: Spacing.xs }]}
                >
                  Add Set
                </Button>
                <Button
                  mode="contained"
                  onPress={completeExercise}
                  style={[styles.button, { flex: 1, marginLeft: Spacing.xs }]}
                  buttonColor={theme.colors.error}
                  textColor={theme.colors.onError}
                  disabled={currentSets.length === 0}
                >
                  Complete Exercise
                </Button>
              </View>
            </Card.Content>
          </Card>

          {currentSets.length > 0 && (
            <Card style={styles.setsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.setsTitle}>
                  Sets Completed ({currentSets.length})
                </Text>

                {currentSets.map((set, index) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text variant="bodyLarge">
                      Set {index + 1}: {set.weight} lbs × {set.reps} reps
                    </Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => removeSet(set.id)}
                    />
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

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
        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
        <Button
          mode="contained"
          onPress={handleEndRoutine}
          buttonColor={theme.colors.error}
          textColor={theme.colors.onError}
          style={styles.endRoutineButton}
        >
          End Routine
        </Button>
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
                        iconColor={theme.colors.primary}
                        size={24}
                        onPress={(e) => handleAdjustWeight(exercise, e)}
                        style={styles.weightButton}
                      />
                    )}
                    {isCompleted ? (
                      <IconButton
                        icon="check-circle"
                        iconColor={theme.colors.success}
                        size={32}
                      />
                    ) : (
                      <IconButton
                        icon="circle-outline"
                        iconColor={theme.colors.textSecondary}
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
            <WeightSlider
              label="Weight (lbs)"
              value={weightInput}
              onValueChange={setWeightInput}
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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressContainer: {
    padding: Spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
    color: theme.colors.textSecondary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  endRoutineButton: {
    marginTop: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
    color: theme.colors.text,
  },
  exerciseName: {
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  instructionText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  exerciseCard: {
    marginBottom: Spacing.md,
    elevation: 2,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  completedCard: {
    backgroundColor: theme.colors.card,
    opacity: 0.6,
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: Spacing.xs,
  },
  lastPerformedText: {
    color: theme.colors.textSecondary,
    marginTop: Spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  difficultyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    minHeight: 160,
  },
  difficultyDesc: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: Spacing.md,
  },
  easyCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  normalCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hardCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  expertCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dialogSubtitle: {
    marginBottom: Spacing.md,
    color: theme.colors.textSecondary,
  },
  weightInput: {
    marginTop: Spacing.sm,
  },
  backButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputCard: {
    marginBottom: Spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  inputTitle: {
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  addButton: {
    marginTop: Spacing.sm,
  },
  setsCard: {
    marginBottom: Spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  setsTitle: {
    marginBottom: Spacing.md,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  button: {
    paddingVertical: Spacing.sm,
  },
});
