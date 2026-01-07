import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { Colors, Spacing } from '../constants/theme';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ExerciseStatsScreenRouteProp = RouteProp<RootStackParamList, 'ExerciseStats'>;
type ExerciseStatsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ExerciseStats'>;

interface Props {
  route: ExerciseStatsScreenRouteProp;
  navigation: ExerciseStatsScreenNavigationProp;
}

interface WorkoutLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  sets: { weight: number; reps: number }[];
}

export default function ExerciseStatsScreen({ route, navigation }: Props) {
  const { exerciseId, exerciseName } = route.params;
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExerciseData();
  }, []);

  const loadExerciseData = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutLogs');
      if (stored) {
        const allLogs: WorkoutLog[] = JSON.parse(stored);
        // Filter logs for this exercise and sort by date (newest first)
        const exerciseLogs = allLogs
          .filter(log => log.exerciseId === exerciseId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setWorkoutLogs(exerciseLogs);
      }
    } catch (error) {
      console.error('Error loading exercise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    if (workoutLogs.length === 0) {
      return {
        pr: null,
        avg: null,
        totalSets: 0,
        lastPerformed: null,
      };
    }

    // Get all sets from all logs
    const allSets = workoutLogs.flatMap(log => log.sets || []);

    // Calculate PR (max weight)
    const pr = Math.max(...allSets.map(set => set.weight || 0));

    // Calculate average weight across all sets
    const totalWeight = allSets.reduce((sum, set) => sum + (set.weight || 0), 0);
    const avg = Math.round(totalWeight / allSets.length);

    // Total sets count
    const totalSets = allSets.length;

    // Last performed date
    const lastPerformed = workoutLogs[0]?.date;

    return { pr, avg, totalSets, lastPerformed };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const stats = getStats();
  const recentWorkouts = workoutLogs.slice(0, 3); // Last 3 workouts

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          {exerciseName}
        </Text>

        {/* Overview Section */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              OVERVIEW
            </Text>

            {stats.pr !== null ? (
              <>
                <View style={styles.statRow}>
                  <Text variant="bodyLarge" style={styles.statLabel}>PR:</Text>
                  <Text variant="titleLarge" style={styles.statValue}>{stats.pr} lbs</Text>
                </View>

                <View style={styles.statRow}>
                  <Text variant="bodyLarge" style={styles.statLabel}>Average:</Text>
                  <Text variant="titleLarge" style={styles.statValue}>{stats.avg} lbs</Text>
                </View>

                <View style={styles.statRow}>
                  <Text variant="bodyLarge" style={styles.statLabel}>Total Sets:</Text>
                  <Text variant="titleLarge" style={styles.statValue}>{stats.totalSets}</Text>
                </View>

                <View style={styles.statRow}>
                  <Text variant="bodyLarge" style={styles.statLabel}>Last Performed:</Text>
                  <Text variant="titleMedium" style={styles.statValue}>
                    {formatDate(stats.lastPerformed!)}
                  </Text>
                </View>
              </>
            ) : (
              <Text variant="bodyLarge" style={styles.noDataText}>
                No workout history yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Recent History Section */}
        {recentWorkouts.length > 0 && (
          <Card style={styles.historyCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                RECENT HISTORY
              </Text>

              {recentWorkouts.map((workout, index) => (
                <View key={workout.id}>
                  <View style={styles.workoutEntry}>
                    <Text variant="titleMedium" style={styles.workoutDate}>
                      {formatDate(workout.date)}
                    </Text>
                    <View style={styles.setsContainer}>
                      {workout.sets.map((set, setIndex) => (
                        <Text key={setIndex} variant="bodyMedium" style={styles.setText}>
                          {set.weight} lbs × {set.reps} reps
                        </Text>
                      ))}
                    </View>
                  </View>
                  {index < recentWorkouts.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
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
    marginBottom: Spacing.lg,
    textAlign: 'center',
    color: Colors.text,
    fontWeight: 'bold',
  },
  overviewCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: 12,
    elevation: 2,
  },
  historyCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    color: Colors.textSecondary,
  },
  statValue: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  noDataText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  workoutEntry: {
    marginBottom: Spacing.sm,
  },
  workoutDate: {
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  setsContainer: {
    marginLeft: Spacing.md,
  },
  setText: {
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  divider: {
    marginVertical: Spacing.md,
    backgroundColor: Colors.border,
  },
});
