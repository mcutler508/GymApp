import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { formatDuration } from '../utils/timeFormat';
import TimeBreakdownModal from '../components/TimeBreakdownModal';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: Colors.card,
  backgroundGradientFrom: Colors.card,
  backgroundGradientTo: Colors.card,
  decimalPlaces: 0,
  color: (opacity = 1) => Colors.primary,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  strokeWidth: 2,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: Colors.primary,
    fill: Colors.primary,
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: Colors.border,
    strokeWidth: 1,
  },
};

interface WorkoutLog {
  id: string;
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
  sessionId?: string;
  muscleGroup?: string;
}

interface Stats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolume: number;
  totalWorkoutTime: number;
  averageWorkoutTime: number;
  longestWorkout: number;
  shortestWorkout: number;
  totalTimeThisWeek: number;
  totalTimeThisMonth: number;
}

interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
}

export default function StatisticsScreen() {
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    totalVolume: 0,
    totalWorkoutTime: 0,
    averageWorkoutTime: 0,
    longestWorkout: 0,
    shortestWorkout: 0,
    totalTimeThisWeek: 0,
    totalTimeThisMonth: 0,
  });
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });
  const [monthlyVolumeData, setMonthlyVolumeData] = useState({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{ data: [0, 0, 0, 0] }],
  });
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [breakdownFilterType, setBreakdownFilterType] = useState<'total' | 'week' | 'month'>('total');
  const [breakdownTitle, setBreakdownTitle] = useState('Time Breakdown');

  const calculateStats = useCallback(async () => {
    try {
      const logsString = await AsyncStorage.getItem('workoutLogs');
      if (!logsString) {
        setAllLogs([]);
        return;
      }

      const logs: WorkoutLog[] = JSON.parse(logsString);
      setAllLogs(logs);
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate stats
      let workoutsThisWeek = 0;
      let workoutsThisMonth = 0;
      let totalVolume = 0;

      // Time-based stats
      let totalWorkoutTime = 0;
      let totalTimeThisWeek = 0;
      let totalTimeThisMonth = 0;
      const workoutDurations: number[] = [];
      const sessionDurations = new Map<string, number>(); // Track unique sessions

      // Weekly workout counts
      const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
      const weeklyTimeData = [0, 0, 0, 0, 0, 0, 0]; // Time per day of week

      // Monthly volume by week
      const weeklyVolumes = [0, 0, 0, 0];

      // Track personal records
      const recordsMap = new Map<string, number>();

      logs.forEach((log) => {
        const logDate = new Date(log.date);

        // Calculate volume for this workout
        const workoutVolume = log.sets.reduce(
          (sum, set) => sum + set.weight * set.reps,
          0
        );
        totalVolume += workoutVolume;

        // Calculate time-based stats
        // Use sessionDuration if available (routine workouts), otherwise use duration
        const workoutDuration = log.sessionDuration || log.duration;
        if (workoutDuration && workoutDuration > 0) {
          // For session-based workouts, only count once per session
          if (log.sessionId && log.sessionDuration) {
            if (!sessionDurations.has(log.sessionId)) {
              sessionDurations.set(log.sessionId, log.sessionDuration);
              totalWorkoutTime += log.sessionDuration;
              workoutDurations.push(log.sessionDuration);

              // Count time this week
              if (logDate >= startOfWeek) {
                totalTimeThisWeek += log.sessionDuration;
                const dayOfWeek = logDate.getDay();
                weeklyTimeData[dayOfWeek] += log.sessionDuration;
              }

              // Count time this month
              if (logDate >= startOfMonth) {
                totalTimeThisMonth += log.sessionDuration;
              }
            }
          } else if (log.duration) {
            // Individual exercise workouts
            totalWorkoutTime += log.duration;
            workoutDurations.push(log.duration);

            // Count time this week
            if (logDate >= startOfWeek) {
              totalTimeThisWeek += log.duration;
              const dayOfWeek = logDate.getDay();
              weeklyTimeData[dayOfWeek] += log.duration;
            }

            // Count time this month
            if (logDate >= startOfMonth) {
              totalTimeThisMonth += log.duration;
            }
          }
        }

        // Count workouts this week
        if (logDate >= startOfWeek) {
          workoutsThisWeek++;
          const dayOfWeek = logDate.getDay();
          weekdayCounts[dayOfWeek]++;
        }

        // Count workouts this month and calculate weekly volumes
        if (logDate >= startOfMonth) {
          workoutsThisMonth++;
          const weekOfMonth = Math.floor(
            (logDate.getDate() - 1) / 7
          );
          if (weekOfMonth < 4) {
            weeklyVolumes[weekOfMonth] += workoutVolume;
          }
        }

        // Track personal records
        log.sets.forEach((set) => {
          const currentMax = recordsMap.get(log.exerciseName) || 0;
          if (set.weight > currentMax) {
            recordsMap.set(log.exerciseName, set.weight);
          }
        });
      });

      // Calculate time statistics
      const workoutsWithTime = workoutDurations.length;
      const averageWorkoutTime = workoutsWithTime > 0 ? totalWorkoutTime / workoutsWithTime : 0;
      const longestWorkout = workoutDurations.length > 0 ? Math.max(...workoutDurations) : 0;
      const shortestWorkout = workoutDurations.length > 0 ? Math.min(...workoutDurations) : 0;

      // Convert records map to array and sort by weight
      const prArray = Array.from(recordsMap.entries())
        .map(([exerciseName, maxWeight]) => ({ exerciseName, maxWeight }))
        .sort((a, b) => b.maxWeight - a.maxWeight)
        .slice(0, 5); // Top 5 PRs

      setStats({
        totalWorkouts: logs.length,
        workoutsThisWeek,
        workoutsThisMonth,
        totalVolume: Math.round(totalVolume),
        totalWorkoutTime,
        averageWorkoutTime: Math.round(averageWorkoutTime),
        longestWorkout,
        shortestWorkout,
        totalTimeThisWeek,
        totalTimeThisMonth,
      });

      setPersonalRecords(prArray);

      // Update weekly chart
      setWeeklyData({
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{ data: weekdayCounts.length > 0 ? weekdayCounts : [0] }],
      });

      // Update monthly volume chart
      setMonthlyVolumeData({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{ data: weeklyVolumes.some(v => v > 0) ? weeklyVolumes : [0] }],
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      calculateStats();
    }, [calculateStats])
  );
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Overall Stats
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.totalWorkouts}</Text>
                <Text variant="bodyMedium">Total Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.workoutsThisWeek}</Text>
                <Text variant="bodyMedium">This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.workoutsThisMonth}</Text>
                <Text variant="bodyMedium">This Month</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.totalVolume.toLocaleString()} lbs</Text>
                <Text variant="bodyMedium">Total Volume</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {stats.totalWorkoutTime > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Time Statistics
              </Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    console.log('Opening breakdown modal - Total Time');
                    console.log('All logs count:', allLogs.length);
                    setBreakdownFilterType('total');
                    setBreakdownTitle('Total Time Breakdown');
                    setBreakdownModalVisible(true);
                  }}
                >
                  <View style={styles.tappableStatContent}>
                    <Text variant="headlineMedium" style={{ color: Colors.primary }}>
                      {formatDuration(stats.totalWorkoutTime)}
                    </Text>
                    <Text variant="bodyMedium">Total Time</Text>
                    <Text variant="bodySmall" style={styles.drillDownHint}>Tap to view breakdown</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={{ color: Colors.primary }}>
                    {formatDuration(stats.averageWorkoutTime)}
                  </Text>
                  <Text variant="bodyMedium">Avg Workout</Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    setBreakdownFilterType('week');
                    setBreakdownTitle('This Week Time Breakdown');
                    setBreakdownModalVisible(true);
                  }}
                >
                  <View style={styles.tappableStatContent}>
                    <Text variant="headlineMedium" style={{ color: Colors.primary }}>
                      {formatDuration(stats.totalTimeThisWeek)}
                    </Text>
                    <Text variant="bodyMedium">This Week</Text>
                    <Text variant="bodySmall" style={styles.drillDownHint}>Tap to view breakdown</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    setBreakdownFilterType('month');
                    setBreakdownTitle('This Month Time Breakdown');
                    setBreakdownModalVisible(true);
                  }}
                >
                  <View style={styles.tappableStatContent}>
                    <Text variant="headlineMedium" style={{ color: Colors.primary }}>
                      {formatDuration(stats.totalTimeThisMonth)}
                    </Text>
                    <Text variant="bodyMedium">This Month</Text>
                    <Text variant="bodySmall" style={styles.drillDownHint}>Tap to view breakdown</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.statsGrid, { marginTop: Spacing.sm }]}>
                <View style={styles.statItem}>
                  <Text variant="titleLarge" style={{ color: Colors.primary }}>
                    {formatDuration(stats.longestWorkout)}
                  </Text>
                  <Text variant="bodySmall">Longest</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="titleLarge" style={{ color: Colors.primary }}>
                    {formatDuration(stats.shortestWorkout)}
                  </Text>
                  <Text variant="bodySmall">Shortest</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        <TimeBreakdownModal
          visible={breakdownModalVisible}
          onDismiss={() => setBreakdownModalVisible(false)}
          logs={allLogs}
          title={breakdownTitle}
          filterType={breakdownFilterType}
        />

        {stats.totalWorkouts > 0 && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Workouts This Week
                </Text>
                <LineChart
                  data={weeklyData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Monthly Volume (lbs)
                </Text>
                <BarChart
                  data={monthlyVolumeData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              </Card.Content>
            </Card>

            {personalRecords.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.cardTitle}>
                    Personal Records
                  </Text>
                  <View style={styles.prContainer}>
                    {personalRecords.map((pr, index) => (
                      <View key={index} style={styles.prItem}>
                        <Text variant="bodyLarge">{pr.exerciseName}</Text>
                        <Text variant="titleMedium">{pr.maxWeight} lbs</Text>
                      </View>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            )}
          </>
        )}

        {stats.totalWorkouts === 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.emptyContainer}>
                <Text variant="bodyLarge">No workout data yet</Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Complete your first workout to see statistics and charts
                </Text>
              </View>
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  cardTitle: {
    marginBottom: Spacing.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  chart: {
    marginVertical: Spacing.sm,
    borderRadius: 16,
  },
  prContainer: {
    gap: Spacing.md,
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  tappableStatContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillDownHint: {
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
});
