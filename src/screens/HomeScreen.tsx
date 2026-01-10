import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Routine } from '../types';
import { Colors, Spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDuration } from '../utils/timeFormat';
import { useTheme } from '../context/ThemeProvider';

type NavigationProp = StackNavigationProp<any>;

const ROUTINES_STORAGE_KEY = 'routines';

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
  startTime?: string;
  endTime?: string;
  duration?: number;
  sessionStartTime?: string;
  sessionEndTime?: string;
  sessionDuration?: number;
}

interface PersonalRecord {
  exerciseName: string;
  weight: number;
  date: string;
}

interface DayActivity {
  day: string;
  count: number;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [activeRoutines, setActiveRoutines] = useState<Routine[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [recentPRs, setRecentPRs] = useState<PersonalRecord[]>([]);
  const [weekActivity, setWeekActivity] = useState<DayActivity[]>([]);
  const [totalTimeThisWeek, setTotalTimeThisWeek] = useState(0);
  const [averageWorkoutTime, setAverageWorkoutTime] = useState(0);

  const loadData = useCallback(async () => {
    try {
      // Load routines
      const routinesStored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      if (routinesStored) {
        const allRoutines: Routine[] = JSON.parse(routinesStored);
        const active = allRoutines.filter(r => !r.completed);
        setActiveRoutines(active);
      }

      // Load workout logs
      const logsString = await AsyncStorage.getItem('workoutLogs');
      if (logsString) {
        const logs: WorkoutLog[] = JSON.parse(logsString);

        // Calculate total unique workout sessions
        const uniqueSessions = new Set(logs.map(log => log.sessionId));
        setTotalWorkouts(uniqueSessions.size);

        // Calculate streak
        const streakCount = calculateStreak(logs);
        setStreak(streakCount);

        // Find recent PRs (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLogs = logs.filter(log => new Date(log.date) >= thirtyDaysAgo);
        const prs = findPersonalRecords(recentLogs);
        setRecentPRs(prs.slice(0, 5)); // Top 5 PRs

        // Calculate 7-day activity
        const activity = calculateWeekActivity(logs);
        setWeekActivity(activity);

        // Calculate time-based stats
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        let totalTimeThisWeekValue = 0;
        const workoutDurations: number[] = [];
        const sessionDurations = new Map<string, number>();

        logs.forEach((log) => {
          const logDate = new Date(log.date);
          const workoutDuration = log.sessionDuration || log.duration;

          if (workoutDuration && workoutDuration > 0) {
            // For session-based workouts, only count once per session
            if (log.sessionId && log.sessionDuration) {
              if (!sessionDurations.has(log.sessionId)) {
                sessionDurations.set(log.sessionId, log.sessionDuration);
                workoutDurations.push(log.sessionDuration);
                if (logDate >= startOfWeek) {
                  totalTimeThisWeekValue += log.sessionDuration;
                }
              }
            } else if (log.duration) {
              workoutDurations.push(log.duration);
              if (logDate >= startOfWeek) {
                totalTimeThisWeekValue += log.duration;
              }
            }
          }
        });

        const averageTime = workoutDurations.length > 0
          ? workoutDurations.reduce((sum, d) => sum + d, 0) / workoutDurations.length
          : 0;

        setTotalTimeThisWeek(totalTimeThisWeekValue);
        setAverageWorkoutTime(Math.round(averageTime));
      }
    } catch (error) {
      console.error('Error loading home screen data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const calculateStreak = (logs: WorkoutLog[]): number => {
    if (logs.length === 0) return 0;

    // Get unique workout dates
    const uniqueDates = Array.from(new Set(logs.map(log => {
      const date = new Date(log.date);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }))).sort().reverse();

    if (uniqueDates.length === 0) return 0;

    // Check if most recent workout was today or yesterday
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0; // Streak broken
    }

    // Count consecutive days
    let streakCount = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1]);
      const previousDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        streakCount++;
      } else {
        break;
      }
    }

    return streakCount;
  };

  const findPersonalRecords = (logs: WorkoutLog[]): PersonalRecord[] => {
    const recordsMap = new Map<string, PersonalRecord>();

    logs.forEach(log => {
      log.sets.forEach(set => {
        const existing = recordsMap.get(log.exerciseName);
        if (!existing || set.weight > existing.weight) {
          recordsMap.set(log.exerciseName, {
            exerciseName: log.exerciseName,
            weight: set.weight,
            date: log.date,
          });
        }
      });
    });

    return Array.from(recordsMap.values())
      .sort((a, b) => b.weight - a.weight);
  };

  const calculateWeekActivity = (logs: WorkoutLog[]): DayActivity[] => {
    const today = new Date();
    const weekDays: DayActivity[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      // Count unique sessions on this day
      const sessionsOnDay = new Set(
        logs
          .filter(log => {
            const logDate = new Date(log.date);
            const logDateStr = `${logDate.getFullYear()}-${logDate.getMonth()}-${logDate.getDate()}`;
            return logDateStr === dateStr;
          })
          .map(log => log.sessionId)
      );

      weekDays.push({
        day: dayStr,
        count: sessionsOnDay.size,
      });
    }

    return weekDays;
  };

  const handleStartRoutine = (routine: Routine) => {
    // Navigate to Routines tab so user can start workout from there
    // This keeps workout starting centralized in the Routines tab
    navigation.getParent()?.navigate('Routines');
  };

  const maxActivity = Math.max(...weekActivity.map(d => d.count), 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Streak Banner */}
        <Card style={[styles.card, styles.streakCard, { borderLeftColor: theme.colors.primary }]}>
          <Card.Content>
            <View style={styles.streakContent}>
              <View>
                <Text variant="headlineLarge" style={[styles.streakNumber, { color: theme.colors.primary }]}>
                  {streak} 🔥
                </Text>
                <Text variant="titleMedium" style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
              <View style={styles.streakStats}>
                <Text variant="bodyLarge" style={[styles.totalWorkouts, { color: theme.colors.textSecondary }]}>
                  {totalWorkouts} Total Workouts
                </Text>
                {totalTimeThisWeek > 0 && (
                  <Text variant="bodyMedium" style={[styles.timeStats, { color: theme.colors.primary }]}>
                    {formatDuration(totalTimeThisWeek)} this week
                  </Text>
                )}
                {averageWorkoutTime > 0 && (
                  <Text variant="bodySmall" style={[styles.timeStats, { color: theme.colors.primary }]}>
                    Avg: {formatDuration(averageWorkoutTime)}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 7-Day Activity */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.text }]}>
              This Week's Activity
            </Text>
            <View style={styles.activityChart}>
              {weekActivity.map((day, index) => (
                <View key={index} style={styles.activityBar}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: day.count > 0 ? `${(day.count / maxActivity) * 100}%` : 4,
                          backgroundColor: day.count > 0 ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text variant="bodySmall" style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>
                    {day.day}
                  </Text>
                  <Text variant="bodySmall" style={[styles.countLabel, { color: theme.colors.primary }]}>
                    {day.count || ''}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Recent Personal Records */}
        {recentPRs.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.text }]}>
                Recent Personal Records 🏆
              </Text>
              {recentPRs.map((pr, index) => (
                <View key={index} style={[styles.prItem, { borderBottomColor: theme.colors.border + '40' }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge" style={[styles.prExercise, { color: theme.colors.text }]}>
                      {pr.exerciseName}
                    </Text>
                    <Text variant="bodySmall" style={[styles.prDate, { color: theme.colors.textSecondary }]}>
                      {new Date(pr.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text variant="titleMedium" style={[styles.prWeight, { color: theme.colors.primary }]}>
                    {pr.weight} lbs
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Active Routines - Quick Start */}
        {activeRoutines.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.text }]}>
                Ready to Workout
              </Text>
              <Text variant="bodyMedium" style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                Start an active routine
              </Text>
            </Card.Content>
            {activeRoutines.map((routine) => (
              <Card.Actions key={routine.id} style={styles.routineAction}>
                <View style={styles.routineInfo}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.text }}>{routine.name}</Text>
                  <Text variant="bodySmall" style={[styles.exerciseCount, { color: theme.colors.textSecondary }]}>
                    {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <IconButton
                  icon="play-circle"
                  iconColor={theme.colors.primary}
                  size={32}
                  onPress={() => handleStartRoutine(routine)}
                />
              </Card.Actions>
            ))}
          </Card>
        )}

        {/* Empty State */}
        {activeRoutines.length === 0 && totalWorkouts === 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.text }]}>
                Welcome to Gym Tracker! 💪
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Start your fitness journey by creating your first routine or logging a quick workout.
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Use the tabs below to get started!
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  card: {
    marginBottom: Spacing.md,
    borderRadius: 12,
  },
  streakCard: {
    borderLeftWidth: 4,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakNumber: {
    fontWeight: 'bold',
  },
  streakLabel: {
    fontWeight: '600',
  },
  streakStats: {
    alignItems: 'flex-end',
  },
  totalWorkouts: {
    fontWeight: '600',
  },
  timeStats: {
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    marginTop: Spacing.xs,
  },
  activityChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginTop: Spacing.md,
  },
  activityBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '80%',
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    marginTop: Spacing.xs,
    fontSize: 11,
  },
  countLabel: {
    fontSize: 11,
    fontWeight: '600',
    height: 14,
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  prExercise: {
    fontWeight: '600',
  },
  prDate: {
    marginTop: 2,
  },
  prWeight: {
    fontWeight: 'bold',
  },
  routineAction: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  routineInfo: {
    flex: 1,
  },
  exerciseCount: {
    marginTop: Spacing.xs,
  },
  emptyText: {
    marginTop: Spacing.md,
    lineHeight: 22,
  },
});
