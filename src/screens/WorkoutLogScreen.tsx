import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, IconButton } from 'react-native-paper';
import { Colors, Spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<any>;

interface WorkoutLog {
  id: string;
  sessionId: string;
  routineId?: string;
  routineName?: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  sets: Array<{ weight: number; reps: number }>;
  difficulty: string;
  nextWeight: number;
}

interface WorkoutSession {
  sessionId: string;
  date: string;
  routineName?: string;
  exercises: WorkoutLog[];
  totalExercises: number;
  totalSets: number;
  totalVolume: number;
}

export default function WorkoutLogScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const loadWorkoutHistory = useCallback(async () => {
    try {
      const logsString = await AsyncStorage.getItem('workoutLogs');
      if (logsString) {
        const logs: WorkoutLog[] = JSON.parse(logsString);

        // Group logs by sessionId
        const sessionMap = new Map<string, WorkoutLog[]>();
        logs.forEach((log) => {
          const sessionId = log.sessionId || log.id; // Fallback for old logs
          if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, []);
          }
          sessionMap.get(sessionId)!.push(log);
        });

        // Convert to session objects with stats
        const sessionsArray: WorkoutSession[] = Array.from(sessionMap.entries()).map(
          ([sessionId, exercises]) => {
            // Sort exercises by date within session
            exercises.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
            const totalVolume = exercises.reduce(
              (sum, ex) =>
                sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
              0
            );

            return {
              sessionId,
              date: exercises[0].date, // Use first exercise date as session date
              routineName: exercises[0].routineName,
              exercises,
              totalExercises: exercises.length,
              totalSets,
              totalVolume,
            };
          }
        );

        // Sort sessions by date (newest first)
        sessionsArray.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setSessions(sessionsArray);
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutHistory();
    }, [loadWorkoutHistory])
  );

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleDeleteSession = useCallback((session: WorkoutSession) => {
    Alert.alert(
      'Delete Workout Session',
      `Are you sure you want to delete this workout session with ${session.totalExercises} exercises?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const logsString = await AsyncStorage.getItem('workoutLogs');
              if (logsString) {
                const logs: WorkoutLog[] = JSON.parse(logsString);
                // Filter out logs matching this session
                // Need to check both sessionId and id (for old logs without sessionId)
                const updatedLogs = logs.filter((log) => {
                  const logSessionId = log.sessionId || log.id;
                  return logSessionId !== session.sessionId;
                });
                await AsyncStorage.setItem('workoutLogs', JSON.stringify(updatedLogs));
                loadWorkoutHistory();
              }
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete workout session');
            }
          },
        },
      ]
    );
  }, [loadWorkoutHistory]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4caf50';
      case 'normal':
        return '#2196f3';
      case 'hard':
        return '#ff9800';
      case 'expert':
        return '#e91e63';
      default:
        return Colors.textSecondary;
    }
  };

  const renderSession = ({ item }: { item: WorkoutSession }) => {
    const isExpanded = expandedSessions.has(item.sessionId);
    const sessionDate = new Date(item.date);

    return (
      <Card style={styles.sessionCard}>
        <TouchableOpacity onPress={() => toggleSession(item.sessionId)}>
          <Card.Content>
            <View style={styles.sessionHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={styles.sessionTitle}>
                  {item.routineName || 'Workout Session'}
                </Text>
                <Text variant="bodySmall" style={styles.sessionDate}>
                  {sessionDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <IconButton
                  icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  onPress={() => toggleSession(item.sessionId)}
                />
                <IconButton
                  icon="delete"
                  iconColor={Colors.error}
                  size={20}
                  onPress={() => handleDeleteSession(item)}
                />
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Text variant="bodySmall" style={styles.statLabel}>Exercises</Text>
                <Text variant="titleMedium" style={styles.statValue}>
                  {item.totalExercises}
                </Text>
              </View>
              <View style={styles.statBadge}>
                <Text variant="bodySmall" style={styles.statLabel}>Sets</Text>
                <Text variant="titleMedium" style={styles.statValue}>
                  {item.totalSets}
                </Text>
              </View>
              <View style={styles.statBadge}>
                <Text variant="bodySmall" style={styles.statLabel}>Volume</Text>
                <Text variant="titleMedium" style={styles.statValue}>
                  {item.totalVolume.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </TouchableOpacity>

        {isExpanded && (
          <Card.Content style={styles.exercisesContainer}>
            <View style={styles.divider} />
            {item.exercises.map((exercise, index) => {
              const hasReps = exercise.sets.some((set) => set.reps > 0);
              const exerciseVolume = exercise.sets.reduce(
                (sum, set) => sum + set.weight * set.reps,
                0
              );

              return (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseHeader}>
                    <Text variant="titleMedium" style={styles.exerciseName}>
                      {index + 1}. {exercise.exerciseName}
                    </Text>
                    <Chip
                      mode="flat"
                      textStyle={{ 
                        color: '#fff', 
                        fontSize: 11,
                        fontWeight: '600',
                        lineHeight: 14,
                      }}
                      style={[
                        styles.difficultyChip,
                        { backgroundColor: getDifficultyColor(exercise.difficulty) },
                      ]}
                    >
                      {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                    </Chip>
                  </View>

                  <View style={styles.setsContainer}>
                    {exercise.sets.map((set, setIndex) => (
                      <Text key={setIndex} variant="bodyMedium" style={styles.setText}>
                        {hasReps
                          ? `Set ${setIndex + 1}: ${set.weight} lbs × ${set.reps} reps`
                          : `Weight: ${set.weight} lbs`}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.exerciseFooter}>
                    {hasReps && (
                      <Text variant="bodySmall" style={styles.footerText}>
                        Volume: {exerciseVolume} lbs
                      </Text>
                    )}
                    <Text variant="bodySmall" style={styles.footerText}>
                      Next: {exercise.nextWeight} lbs
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card.Content>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.sessionId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No workout logs yet</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Complete a workout to see your history here
            </Text>
          </View>
        }
      />
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
  sessionCard: {
    marginBottom: Spacing.md,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginRight: -8,
  },
  sessionTitle: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sessionDate: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBadge: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  statValue: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  exercisesContainer: {
    paddingTop: 0,
  },
  exerciseItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  exerciseName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  difficultyChip: {
    height: 28,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setsContainer: {
    marginLeft: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  setText: {
    paddingVertical: 2,
    color: Colors.text,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  footerText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
