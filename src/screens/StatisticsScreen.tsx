import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { formatDuration } from '../utils/timeFormat';
import TimeBreakdownModal from '../components/TimeBreakdownModal';
import { useTheme } from '../context/ThemeProvider';

const screenWidth = Dimensions.get('window').width;

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
  workoutsLastWeek: number;
  workoutsLastMonth: number;
  totalVolume: number;
  volumeThisWeek: number;
  volumeThisMonth: number;
  volumeLastWeek: number;
  volumeLastMonth: number;
  totalWorkoutTime: number;
  averageWorkoutTime: number;
  longestWorkout: number;
  shortestWorkout: number;
  totalTimeThisWeek: number;
  totalTimeThisMonth: number;
  totalTimeLastWeek: number;
  totalTimeLastMonth: number;
  averageWeightAllTime: number;
  averageWeightThisWeek: number;
  averageWeightLastWeek: number;
  prCount: number;
  prCountThisWeek: number;
  prCountLastWeek: number;
}

interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
}

export default function StatisticsScreen() {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    workoutsLastWeek: 0,
    workoutsLastMonth: 0,
    totalVolume: 0,
    volumeThisWeek: 0,
    volumeThisMonth: 0,
    volumeLastWeek: 0,
    volumeLastMonth: 0,
    totalWorkoutTime: 0,
    averageWorkoutTime: 0,
    longestWorkout: 0,
    shortestWorkout: 0,
    totalTimeThisWeek: 0,
    totalTimeThisMonth: 0,
    totalTimeLastWeek: 0,
    totalTimeLastMonth: 0,
    averageWeightAllTime: 0,
    averageWeightThisWeek: 0,
    averageWeightLastWeek: 0,
    prCount: 0,
    prCountThisWeek: 0,
    prCountLastWeek: 0,
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

  const chartConfig = useMemo(() => ({
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    strokeWidth: 2,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
      fill: theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  }), [theme]);

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

      // Define time periods
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      endOfLastMonth.setHours(23, 59, 59, 999);

      // Initialize counters
      let workoutsThisWeek = 0;
      let workoutsLastWeek = 0;
      let workoutsThisMonth = 0;
      let workoutsLastMonth = 0;
      let totalVolume = 0;
      let volumeThisWeek = 0;
      let volumeLastWeek = 0;
      let volumeThisMonth = 0;
      let volumeLastMonth = 0;

      // Time-based stats
      let totalWorkoutTime = 0;
      let totalTimeThisWeek = 0;
      let totalTimeLastWeek = 0;
      let totalTimeThisMonth = 0;
      let totalTimeLastMonth = 0;
      const workoutDurations: number[] = [];
      const sessionDurations = new Map<string, number>();

      // Weight tracking
      let totalWeightAllSets = 0;
      let totalSetsCount = 0;
      let totalWeightThisWeek = 0;
      let totalSetsThisWeek = 0;
      let totalWeightLastWeek = 0;
      let totalSetsLastWeek = 0;

      // PR tracking
      const recordsMap = new Map<string, { weight: number; date: Date }>();
      let prCountThisWeek = 0;
      let prCountLastWeek = 0;

      // Weekly workout counts
      const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

      // Monthly volume by week
      const weeklyVolumes = [0, 0, 0, 0];

      logs.forEach((log) => {
        const logDate = new Date(log.date);

        // Calculate volume for this workout
        const workoutVolume = log.sets.reduce(
          (sum, set) => sum + set.weight * set.reps,
          0
        );
        totalVolume += workoutVolume;

        // Track weights for average calculation
        log.sets.forEach((set) => {
          totalWeightAllSets += set.weight;
          totalSetsCount++;

          // This week
          if (logDate >= startOfWeek) {
            totalWeightThisWeek += set.weight;
            totalSetsThisWeek++;
          }

          // Last week
          if (logDate >= startOfLastWeek && logDate < startOfWeek) {
            totalWeightLastWeek += set.weight;
            totalSetsLastWeek++;
          }

          // Track PRs
          const existingPR = recordsMap.get(log.exerciseName);
          if (!existingPR || set.weight > existingPR.weight) {
            const oldWeight = existingPR?.weight || 0;
            recordsMap.set(log.exerciseName, { weight: set.weight, date: logDate });

            // Count PRs by time period
            if (set.weight > oldWeight) {
              if (logDate >= startOfWeek) {
                prCountThisWeek++;
              } else if (logDate >= startOfLastWeek && logDate < startOfWeek) {
                prCountLastWeek++;
              }
            }
          }
        });

        // Time-based stats
        const workoutDuration = log.sessionDuration || log.duration;
        if (workoutDuration && workoutDuration > 0) {
          if (log.sessionId && log.sessionDuration) {
            if (!sessionDurations.has(log.sessionId)) {
              sessionDurations.set(log.sessionId, log.sessionDuration);
              totalWorkoutTime += log.sessionDuration;
              workoutDurations.push(log.sessionDuration);

              if (logDate >= startOfWeek) {
                totalTimeThisWeek += log.sessionDuration;
              } else if (logDate >= startOfLastWeek && logDate < startOfWeek) {
                totalTimeLastWeek += log.sessionDuration;
              }

              if (logDate >= startOfMonth) {
                totalTimeThisMonth += log.sessionDuration;
              } else if (logDate >= startOfLastMonth && logDate <= endOfLastMonth) {
                totalTimeLastMonth += log.sessionDuration;
              }
            }
          } else if (log.duration) {
            totalWorkoutTime += log.duration;
            workoutDurations.push(log.duration);

            if (logDate >= startOfWeek) {
              totalTimeThisWeek += log.duration;
            } else if (logDate >= startOfLastWeek && logDate < startOfWeek) {
              totalTimeLastWeek += log.duration;
            }

            if (logDate >= startOfMonth) {
              totalTimeThisMonth += log.duration;
            } else if (logDate >= startOfLastMonth && logDate <= endOfLastMonth) {
              totalTimeLastMonth += log.duration;
            }
          }
        }

        // Count workouts by period
        if (logDate >= startOfWeek) {
          workoutsThisWeek++;
          const dayOfWeek = logDate.getDay();
          weekdayCounts[dayOfWeek]++;
          volumeThisWeek += workoutVolume;
        } else if (logDate >= startOfLastWeek && logDate < startOfWeek) {
          workoutsLastWeek++;
          volumeLastWeek += workoutVolume;
        }

        if (logDate >= startOfMonth) {
          workoutsThisMonth++;
          volumeThisMonth += workoutVolume;
          const weekOfMonth = Math.floor((logDate.getDate() - 1) / 7);
          if (weekOfMonth < 4) {
            weeklyVolumes[weekOfMonth] += workoutVolume;
          }
        } else if (logDate >= startOfLastMonth && logDate <= endOfLastMonth) {
          workoutsLastMonth++;
          volumeLastMonth += workoutVolume;
        }
      });

      // Calculate averages
      const workoutsWithTime = workoutDurations.length;
      const averageWorkoutTime = workoutsWithTime > 0 ? totalWorkoutTime / workoutsWithTime : 0;
      const longestWorkout = workoutDurations.length > 0 ? Math.max(...workoutDurations) : 0;
      const shortestWorkout = workoutDurations.length > 0 ? Math.min(...workoutDurations) : 0;

      const averageWeightAllTime = totalSetsCount > 0 ? totalWeightAllSets / totalSetsCount : 0;
      const averageWeightThisWeek = totalSetsThisWeek > 0 ? totalWeightThisWeek / totalSetsThisWeek : 0;
      const averageWeightLastWeek = totalSetsLastWeek > 0 ? totalWeightLastWeek / totalSetsLastWeek : 0;

      // Convert records map to array and sort by weight
      const prArray = Array.from(recordsMap.entries())
        .map(([exerciseName, data]) => ({ exerciseName, maxWeight: data.weight }))
        .sort((a, b) => b.maxWeight - a.maxWeight)
        .slice(0, 5);

      setStats({
        totalWorkouts: logs.length,
        workoutsThisWeek,
        workoutsLastWeek,
        workoutsThisMonth,
        workoutsLastMonth,
        totalVolume: Math.round(totalVolume),
        volumeThisWeek: Math.round(volumeThisWeek),
        volumeLastWeek: Math.round(volumeLastWeek),
        volumeThisMonth: Math.round(volumeThisMonth),
        volumeLastMonth: Math.round(volumeLastMonth),
        totalWorkoutTime,
        averageWorkoutTime: Math.round(averageWorkoutTime),
        longestWorkout,
        shortestWorkout,
        totalTimeThisWeek,
        totalTimeThisMonth,
        totalTimeLastWeek,
        totalTimeLastMonth,
        averageWeightAllTime: Math.round(averageWeightAllTime),
        averageWeightThisWeek: Math.round(averageWeightThisWeek),
        averageWeightLastWeek: Math.round(averageWeightLastWeek),
        prCount: recordsMap.size,
        prCountThisWeek,
        prCountLastWeek,
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

  // Helper functions
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const calculateDelta = (current: number, previous: number): { value: number; percentage: number; isPositive: boolean } => {
    if (previous === 0) {
      return { value: current, percentage: current > 0 ? 100 : 0, isPositive: current > 0 };
    }
    const delta = current - previous;
    const percentage = Math.round((delta / previous) * 100);
    return { value: delta, percentage, isPositive: delta >= 0 };
  };

  const renderDelta = (delta: { value: number; percentage: number; isPositive: boolean }, formatValue: (val: number) => string = (val) => val.toString()) => {
    if (delta.value === 0) return null;
    const arrow = delta.isPositive ? '↑' : '↓';
    return (
      <Text variant="bodySmall" style={{ color: delta.isPositive ? theme.colors.primary : theme.colors.textSecondary, marginTop: 2 }}>
        {arrow} {formatValue(Math.abs(delta.value))} ({Math.abs(delta.percentage)}%)
      </Text>
    );
  };

  const renderKPICard = (title: string, value: string, delta?: { value: number; percentage: number; isPositive: boolean }, subtitle?: string, formatValue?: (val: number) => string) => (
    <Card style={[styles.kpiCard, { backgroundColor: theme.colors.card }]}>
      <Card.Content>
        <Text variant="labelMedium" style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>{title}</Text>
        <Text variant="displaySmall" style={[styles.kpiValue, { color: theme.colors.primary }]}>{value}</Text>
        {subtitle && <Text variant="bodySmall" style={[styles.kpiSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        {delta && renderDelta(delta, formatValue)}
      </Card.Content>
    </Card>
  );

  // Tab content renderers
  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>KEY PERFORMANCE INDICATORS</Text>

      {/* Hero KPIs */}
      <View style={styles.heroRow}>
        {renderKPICard(
          'Workouts This Week',
          stats.workoutsThisWeek.toString(),
          calculateDelta(stats.workoutsThisWeek, stats.workoutsLastWeek),
          `${stats.workoutsLastWeek} last week`
        )}
        {renderKPICard(
          'Training Volume (Week)',
          `${formatNumber(stats.volumeThisWeek)} lbs`,
          calculateDelta(stats.volumeThisWeek, stats.volumeLastWeek),
          `${formatNumber(stats.volumeLastWeek)} lbs last week`,
          formatNumber
        )}
      </View>

      <View style={styles.heroRow}>
        {renderKPICard(
          'Avg Weight This Week',
          `${formatNumber(stats.averageWeightThisWeek)} lbs`,
          calculateDelta(stats.averageWeightThisWeek, stats.averageWeightLastWeek),
          `${formatNumber(stats.averageWeightLastWeek)} lbs last week`,
          formatNumber
        )}
        {renderKPICard(
          'Personal Records',
          stats.prCount.toString(),
          stats.prCountThisWeek > 0 ? { value: stats.prCountThisWeek, percentage: 0, isPositive: true } : undefined,
          stats.prCountThisWeek > 0 ? `${stats.prCountThisWeek} new this week` : 'All time'
        )}
      </View>

      <Text variant="titleSmall" style={[styles.sectionLabel, { marginTop: Spacing.lg, color: theme.colors.textSecondary }]}>MONTHLY PERFORMANCE</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
          <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Workouts This Month</Text>
          <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.text }]}>{stats.workoutsThisMonth}</Text>
          {renderDelta(calculateDelta(stats.workoutsThisMonth, stats.workoutsLastMonth))}
          <Text variant="bodySmall" style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>{stats.workoutsLastMonth} last month</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
          <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Volume This Month</Text>
          <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.text }]}>{formatNumber(stats.volumeThisMonth)}</Text>
          {renderDelta(calculateDelta(stats.volumeThisMonth, stats.volumeLastMonth), formatNumber)}
          <Text variant="bodySmall" style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>{formatNumber(stats.volumeLastMonth)} lbs last month</Text>
        </View>
      </View>

      <Text variant="titleSmall" style={[styles.sectionLabel, { marginTop: Spacing.lg, color: theme.colors.textSecondary }]}>ALL-TIME TOTALS</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
          <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Workouts</Text>
          <Text variant="headlineLarge" style={[styles.statValue, { color: theme.colors.text }]}>{formatNumber(stats.totalWorkouts)}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
          <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Volume</Text>
          <Text variant="headlineLarge" style={[styles.statValue, { color: theme.colors.text }]}>{formatNumber(stats.totalVolume)}</Text>
          <Text variant="bodySmall" style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>lbs lifted</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
          <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg Weight (All Time)</Text>
          <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.text }]}>{formatNumber(stats.averageWeightAllTime)}</Text>
          <Text variant="bodySmall" style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>lbs per set</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
          <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg Workout Time</Text>
          <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.text }]}>{formatDuration(stats.averageWorkoutTime)}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.text }]}>
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

      <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.text }]}>
            Monthly Volume by Week
          </Text>
          <BarChart
            data={monthlyVolumeData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=" lbs"
            fromZero
          />
        </Card.Content>
      </Card>

      {personalRecords.length > 0 && (
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.text }]}>
              Top 5 Personal Records
            </Text>
            <View style={styles.prContainer}>
              {personalRecords.map((pr, index) => (
                <View key={index} style={[styles.prItem, { backgroundColor: theme.colors.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge">{pr.exerciseName}</Text>
                  </View>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    {formatNumber(pr.maxWeight)} lbs
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  const renderTimeTab = () => (
    <ScrollView style={styles.tabContent}>
      {stats.totalWorkoutTime > 0 ? (
        <>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>TIME ANALYTICS</Text>

          <View style={styles.heroRow}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                setBreakdownFilterType('week');
                setBreakdownTitle('This Week Time Breakdown');
                setBreakdownModalVisible(true);
              }}
            >
              {renderKPICard(
                'Time This Week',
                formatDuration(stats.totalTimeThisWeek),
                calculateDelta(stats.totalTimeThisWeek, stats.totalTimeLastWeek),
                `${formatDuration(stats.totalTimeLastWeek)} last week`
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                setBreakdownFilterType('month');
                setBreakdownTitle('This Month Time Breakdown');
                setBreakdownModalVisible(true);
              }}
            >
              {renderKPICard(
                'Time This Month',
                formatDuration(stats.totalTimeThisMonth),
                calculateDelta(stats.totalTimeThisMonth, stats.totalTimeLastMonth),
                `${formatDuration(stats.totalTimeLastMonth)} last month`
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.heroRow}>
            {renderKPICard(
              'Avg Workout Duration',
              formatDuration(stats.averageWorkoutTime),
              undefined,
              'Per session'
            )}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                setBreakdownFilterType('total');
                setBreakdownTitle('Total Time Breakdown');
                setBreakdownModalVisible(true);
              }}
            >
              {renderKPICard(
                'Total Training Time',
                formatDuration(stats.totalWorkoutTime),
                undefined,
                'All time'
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
              <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Longest Workout</Text>
              <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.text }]}>{formatDuration(stats.longestWorkout)}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
              <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Shortest Workout</Text>
              <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.text }]}>{formatDuration(stats.shortestWorkout)}</Text>
            </View>
          </View>

          <Text variant="bodySmall" style={[styles.statSubtext, { textAlign: 'center', marginTop: Spacing.md, color: theme.colors.textSecondary }]}>
            Tap time cards to view detailed breakdown by exercise
          </Text>
        </>
      ) : (
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">No time data available</Text>
              <Text variant="bodyMedium" style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Time tracking will appear here after completing workouts
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SegmentedButtons
        value={selectedTab}
        onValueChange={setSelectedTab}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'performance', label: 'Performance' },
          { value: 'time', label: 'Time' },
        ]}
        style={styles.tabBar}
      />

      {stats.totalWorkouts === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Card.Content>
              <View style={styles.emptyContainer}>
                <Text variant="headlineSmall" style={{ marginBottom: Spacing.md }}>No workout data yet</Text>
                <Text variant="bodyLarge" style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Complete your first workout to see statistics and charts
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <>
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'performance' && renderPerformanceTab()}
          {selectedTab === 'time' && renderTimeTab()}
        </>
      )}

      <TimeBreakdownModal
        visible={breakdownModalVisible}
        onDismiss={() => setBreakdownModalVisible(false)}
        logs={allLogs}
        title={breakdownTitle}
        filterType={breakdownFilterType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    margin: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
  kpiLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    fontWeight: 'bold',
    fontSize: 32,
    lineHeight: 38,
  },
  kpiSubtitle: {
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: Spacing.md,
    elevation: 1,
  },
  statLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: Spacing.xs,
  },
  statSubtext: {
    marginTop: Spacing.xs,
  },
  card: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: Spacing.sm,
    borderRadius: 16,
  },
  prContainer: {
    gap: Spacing.sm,
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  emptyStateContainer: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
