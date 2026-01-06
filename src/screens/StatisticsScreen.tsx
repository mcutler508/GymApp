import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: Colors.primary,
  backgroundGradientFrom: Colors.primary,
  backgroundGradientTo: Colors.primaryDark,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: Colors.secondary,
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
}

interface Stats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolume: number;
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

  const calculateStats = useCallback(async () => {
    try {
      const logsString = await AsyncStorage.getItem('workoutLogs');
      if (!logsString) {
        return;
      }

      const logs: WorkoutLog[] = JSON.parse(logsString);
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate stats
      let workoutsThisWeek = 0;
      let workoutsThisMonth = 0;
      let totalVolume = 0;

      // Weekly workout counts
      const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

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
  },
  cardTitle: {
    marginBottom: Spacing.md,
    fontWeight: 'bold',
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
    borderRadius: 8,
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
});
