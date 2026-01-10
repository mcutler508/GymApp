import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, IconButton } from 'react-native-paper';
import { Spacing } from '../constants/theme';
import { DifficultyRating } from '../types';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutTimer from '../components/WorkoutTimer';
import WeightSlider from '../components/WeightSlider';
import RepSlider from '../components/RepSlider';
import { useTheme } from '../context/ThemeProvider';
import DifficultyIcon from '../components/DifficultyIcon';

type ActiveWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'ActiveWorkout'>;
type ActiveWorkoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

interface Props {
  route: ActiveWorkoutScreenRouteProp;
  navigation: ActiveWorkoutScreenNavigationProp;
}

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
}

export default function ActiveWorkoutScreen({ route, navigation }: Props) {
  const { exerciseId, exerciseName, lastWeight } = route.params;
  const { theme } = useTheme();
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentWeight, setCurrentWeight] = useState(lastWeight || 0);
  const [currentReps, setCurrentReps] = useState(8); // Default to 8 reps
  const [showDifficultyGrid, setShowDifficultyGrid] = useState(false);
  const [startTime] = useState(Date.now());
  const [duration, setDuration] = useState(0);

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

    setSets([...sets, newSet]);
    // Keep both weight and reps for next set (user can adjust if needed)
  };

  const removeSet = (id: string) => {
    setSets(sets.filter(set => set.id !== id));
  };

  const completeWorkout = () => {
    if (sets.length === 0) {
      Alert.alert('Error', 'Please add at least one set');
      return;
    }
    setShowDifficultyGrid(true);
  };

  const handleDifficultySelection = async (difficulty: DifficultyRating) => {
    // Calculate new weight based on difficulty (using first set's weight)
    const firstSetWeight = sets[0]?.weight || 0;
    const newWeight = calculateNextWeight(firstSetWeight, difficulty);

    // Calculate duration
    const endTime = Date.now();
    const workoutDuration = Math.floor((endTime - startTime) / 1000); // duration in seconds

    // Save workout log
    const workoutLog = {
      exerciseName,
      date: new Date().toISOString(),
      sets,
      difficulty,
      nextWeight: newWeight,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: workoutDuration,
    };

    // Save to local storage
    await saveWorkoutHistory(workoutLog);

    Alert.alert(
      'Workout Complete!',
      `Great job! You started at ${firstSetWeight} lbs. Next time try ${newWeight} lbs based on your ${difficulty} rating.`,
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  const calculateNextWeight = (currentWeight: number, difficulty: DifficultyRating): number => {
    const adjustments = {
      easy: 0.10,     // +10%
      normal: 0.05,   // +5%
      hard: 0,        // Stay the same
      expert: -0.05,  // -5%
    };

    const adjustment = adjustments[difficulty];
    const newWeight = currentWeight * (1 + adjustment);

    // Round to nearest 5 lbs
    return Math.round(newWeight / 5) * 5;
  };

  const saveWorkoutHistory = async (workoutLog: any) => {
    try {
      // Look up muscle group from exercises
      let muscleGroup: string = 'other';
      try {
        const exercisesString = await AsyncStorage.getItem('exercises');
        if (exercisesString) {
          const exercises = JSON.parse(exercisesString);
          const exercise = exercises.find((ex: any) => ex.id === exerciseId);
          if (exercise && exercise.muscle_group) {
            muscleGroup = exercise.muscle_group;
          }
        }
      } catch (error) {
        console.error('Error looking up muscle group:', error);
      }

      // Load existing workout logs array
      const logsString = await AsyncStorage.getItem('workoutLogs');
      const logs = logsString ? JSON.parse(logsString) : [];

      // Get or create session ID (group workouts within 3 hours)
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      // Find recent session (within last 3 hours)
      let sessionId = null;
      for (let i = logs.length - 1; i >= 0; i--) {
        const logDate = new Date(logs[i].date);
        if (logDate >= threeHoursAgo && !logs[i].routineId) {
          sessionId = logs[i].sessionId;
          break;
        }
      }

      // Create new session ID if no recent session found
      if (!sessionId) {
        sessionId = `session-${Date.now()}`;
      }

      // Add new workout log with unique ID and session ID
      const newLog = {
        id: Date.now().toString(),
        sessionId,
        exerciseId,
        muscleGroup,
        ...workoutLog,
      };
      logs.push(newLog);

      // Save back to storage
      await AsyncStorage.setItem('workoutLogs', JSON.stringify(logs));

      // Also update the "last workout" tracking for quick access
      const historyString = await AsyncStorage.getItem('workoutHistory');
      const history = historyString ? JSON.parse(historyString) : {};
      history[exerciseId] = workoutLog;
      await AsyncStorage.setItem('workoutHistory', JSON.stringify(history));

      console.log('Workout saved successfully');
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  if (showDifficultyGrid) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.text }]}>
            How was your workout?
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Rate the difficulty to adjust your next weight
          </Text>

          <View style={styles.difficultyGrid}>
            <View style={styles.difficultyRow}>
              <Card
                style={[styles.difficultyCard, styles.easyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
                onPress={() => handleDifficultySelection('easy')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <DifficultyIcon level="easy" size={125} />
                  <Text variant="bodySmall" style={[styles.difficultyDesc, { color: theme.colors.textSecondary }]}>
                    +10% weight
                  </Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.difficultyCard, styles.normalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => handleDifficultySelection('normal')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <DifficultyIcon level="normal" size={125} />
                  <Text variant="bodySmall" style={[styles.difficultyDesc, { color: theme.colors.textSecondary }]}>
                    +5% weight
                  </Text>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.difficultyRow}>
              <Card
                style={[styles.difficultyCard, styles.hardCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => handleDifficultySelection('hard')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <DifficultyIcon level="hard" size={125} />
                  <Text variant="bodySmall" style={[styles.difficultyDesc, { color: theme.colors.textSecondary }]}>
                    Same weight
                  </Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.difficultyCard, styles.expertCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => handleDifficultySelection('expert')}
              >
                <Card.Content style={styles.difficultyContent}>
                  <DifficultyIcon level="expert" size={125} />
                  <Text variant="bodySmall" style={[styles.difficultyDesc, { color: theme.colors.textSecondary }]}>
                    -5% weight
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </View>

          <Button
            mode="outlined"
            onPress={() => setShowDifficultyGrid(false)}
            style={styles.backButton}
          >
            Back to Workout
          </Button>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WorkoutTimer startTime={startTime} onDurationChange={setDuration} />

        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.text }]}>
          {exerciseName}
        </Text>

        {lastWeight && (
          <Text variant="bodyMedium" style={[styles.lastWeight, { color: theme.colors.primary }]}>
            Last weight: {lastWeight} lbs
          </Text>
        )}

        <Card style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.inputTitle}>
              Add Set
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

            <Button mode="contained" onPress={addSet} style={styles.addButton}>
              Add Set
            </Button>
          </Card.Content>
        </Card>

        {sets.length > 0 && (
          <Card style={[styles.setsCard, { backgroundColor: theme.colors.card }]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.setsTitle}>
                Sets Completed ({sets.length})
              </Text>

              {sets.map((set, index) => (
                <View key={set.id} style={[styles.setRow, { borderBottomColor: theme.colors.border }]}>
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

        <Button
          mode="contained"
          onPress={completeWorkout}
          style={styles.completeButton}
          disabled={sets.length === 0}
        >
          Complete Workout
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  lastWeight: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  inputCard: {
    marginBottom: Spacing.md,
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
  },
  completeButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
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
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    minHeight: 160,
  },
  difficultyDesc: {
    fontSize: 11,
    marginTop: Spacing.md,
  },
  easyCard: {
    borderWidth: 2,
  },
  normalCard: {
  },
  hardCard: {
  },
  expertCard: {
  },
  backButton: {
    marginTop: Spacing.md,
  },
});
