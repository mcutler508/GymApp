import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, IconButton } from 'react-native-paper';
import { Colors, Spacing } from '../constants/theme';
import { DifficultyRating } from '../types';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutTimer from '../components/WorkoutTimer';

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
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentWeight, setCurrentWeight] = useState(lastWeight?.toString() || '');
  const [currentReps, setCurrentReps] = useState('');
  const [showDifficultyGrid, setShowDifficultyGrid] = useState(false);
  const [startTime] = useState(Date.now());
  const [duration, setDuration] = useState(0);

  const addSet = () => {
    if (!currentWeight || !currentReps) {
      Alert.alert('Error', 'Please enter both weight and reps');
      return;
    }

    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      weight: parseFloat(currentWeight),
      reps: parseInt(currentReps),
    };

    setSets([...sets, newSet]);
    setCurrentReps('');
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
    // Calculate new weight based on difficulty
    const lastWeightValue = lastWeight || parseFloat(currentWeight) || 0;
    const newWeight = calculateNextWeight(lastWeightValue, difficulty);

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
      `Great job! Next time try ${newWeight} lbs based on your ${difficulty} rating.`,
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
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineMedium" style={styles.title}>
            How was your workout?
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Rate the difficulty to adjust your next weight
          </Text>

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WorkoutTimer startTime={startTime} onDurationChange={setDuration} />

        <Text variant="headlineMedium" style={styles.title}>
          {exerciseName}
        </Text>

        {lastWeight && (
          <Text variant="bodyMedium" style={styles.lastWeight}>
            Last weight: {lastWeight} lbs
          </Text>
        )}

        <Card style={styles.inputCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.inputTitle}>
              Add Set
            </Text>

            <TextInput
              label="Weight (lbs)"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Reps"
              value={currentReps}
              onChangeText={setCurrentReps}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <Button mode="contained" onPress={addSet} style={styles.addButton}>
              Add Set
            </Button>
          </Card.Content>
        </Card>

        {sets.length > 0 && (
          <Card style={styles.setsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.setsTitle}>
                Sets Completed ({sets.length})
              </Text>

              {sets.map((set, index) => (
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: Colors.text,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  lastWeight: {
    textAlign: 'center',
    color: Colors.primary,
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  inputCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
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
    backgroundColor: Colors.card,
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
    borderBottomColor: Colors.border,
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
  backButton: {
    marginTop: Spacing.md,
  },
});
