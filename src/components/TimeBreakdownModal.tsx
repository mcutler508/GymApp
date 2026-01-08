import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, IconButton, ProgressBar, Portal, Modal } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { Spacing, MuscleGroups } from '../constants/theme';
import { MuscleGroup } from '../types';
import { formatDuration } from '../utils/timeFormat';
import {
  calculateTimeByMuscleGroupAndExercise,
  MuscleGroupTimeBreakdown,
  ExerciseTimeBreakdown,
} from '../utils/timeBreakdown';
import { useTheme } from '../context/ThemeProvider';

const screenWidth = Dimensions.get('window').width;

interface WorkoutLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  muscleGroup?: string;
  duration?: number;
  sessionDuration?: number;
  sessionId?: string;
}

interface TimeBreakdownModalProps {
  visible: boolean;
  onDismiss: () => void;
  logs: WorkoutLog[];
  title: string;
  filterType?: 'total' | 'week' | 'month';
}

type ViewMode = 'muscleGroups' | 'exercises';
type SelectedMuscleGroup = MuscleGroup | null;

export default function TimeBreakdownModal({
  visible,
  onDismiss,
  logs,
  title,
  filterType = 'total',
}: TimeBreakdownModalProps) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('muscleGroups');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<SelectedMuscleGroup>(null);

  // Reset view mode when modal opens
  useEffect(() => {
    if (visible) {
      setViewMode('muscleGroups');
      setSelectedMuscleGroup(null);
      console.log('Modal opened with logs:', logs.length);
      console.log('Filter type:', filterType);
    }
  }, [visible, logs.length, filterType]);

  // Calculate date filter
  const dateFilter = useMemo(() => {
    if (filterType === 'week') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return { startDate: startOfWeek, endDate: now };
    } else if (filterType === 'month') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth, endDate: now };
    }
    return undefined;
  }, [filterType]);

  // Calculate breakdown
  const breakdown = useMemo(() => {
    try {
      if (!logs || logs.length === 0) {
        console.log('No logs provided to breakdown');
        return [];
      }
      const result = calculateTimeByMuscleGroupAndExercise(logs, dateFilter);
      console.log('Breakdown calculated:', result.length, 'muscle groups');
      return result;
    } catch (error) {
      console.error('Error calculating breakdown:', error);
      return [];
    }
  }, [logs, dateFilter]);

  const totalTime = breakdown.reduce((sum, item) => sum + item.totalTime, 0);
  
  console.log('Total time in breakdown:', totalTime, 'seconds');

  const handleMuscleGroupPress = (muscleGroup: MuscleGroup) => {
    setSelectedMuscleGroup(muscleGroup);
    setViewMode('exercises');
  };

  const handleBackToMuscleGroups = () => {
    setViewMode('muscleGroups');
    setSelectedMuscleGroup(null);
  };

  const getMuscleGroupLabel = (value: MuscleGroup): string => {
    const group = MuscleGroups.find((g) => g.value === value);
    return group?.label || value;
  };

  const renderMuscleGroupView = () => {
    if (breakdown.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.text }]}>
            No workout time data available
          </Text>
        </View>
      );
    }

    // Prepare chart data with distinct, contrasting colors
    const colors = [
      '#00D9FF', // Bright cyan
      '#FF6B6B', // Coral red
      '#4ECDC4', // Turquoise
      '#FFE66D', // Yellow
      '#A8E6CF', // Mint green
      '#FF8B94', // Pink
      '#C7CEEA', // Lavender
      '#FFDAC1', // Peach
      '#B4A7D6', // Purple
    ];

    const chartData = breakdown
      .filter((item) => item.exerciseCount > 0)
      .map((item, index) => ({
        name: `${getMuscleGroupLabel(item.muscleGroup)} - ${item.exerciseCount.toLocaleString()}`,
        population: item.exerciseCount,
        color: colors[index % colors.length],
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      }));

    const chartConfig = {
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
      labelColor: (opacity = 1) => theme.colors.textSecondary,
      style: {
        borderRadius: 16,
      },
      propsForBackgroundLines: {
        strokeWidth: 0,
      },
    };

    return (
      <ScrollView 
        style={[styles.scrollContent, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={true}
      >
        {totalTime > 0 && chartData.length > 0 && (
          <Card style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Card.Content style={{ padding: Spacing.md }}>
              <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.text }]}>
                Exercise Count by Muscle Group
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: Spacing.sm }}>
                <View style={{ width: 200 }}>
                  <PieChart
                    data={chartData}
                    width={220}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="20"
                    center={[10, 0]}
                    hasLegend={false}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.lg }}>
                  {chartData.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color, marginRight: Spacing.sm }} />
                      <Text variant="bodyMedium" style={{ color: theme.colors.text, flex: 1 }}>{item.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {breakdown.map((item) => (
          <Card
            key={item.muscleGroup}
            style={[styles.muscleGroupCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => handleMuscleGroupPress(item.muscleGroup)}
            mode="elevated"
          >
            <Card.Content style={{ padding: Spacing.md }}>
              <View style={styles.muscleGroupHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={[styles.muscleGroupName, { color: theme.colors.text }]}>
                    {getMuscleGroupLabel(item.muscleGroup)}
                  </Text>
                  <Text variant="headlineMedium" style={[styles.timeText, { color: theme.colors.primary }]}>
                    {formatDuration(item.totalTime)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.percentageText, { color: theme.colors.text }]}>
                    {item.percentage.toFixed(1)}% of total • {item.exerciseCount.toLocaleString()} exercise{item.exerciseCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <IconButton icon="chevron-right" iconColor={theme.colors.primary} size={28} />
              </View>
              <ProgressBar
                progress={item.percentage / 100}
                color={theme.colors.primary}
                style={[styles.progressBar, { backgroundColor: theme.colors.border }]}
              />
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  };

  const renderExerciseView = () => {
    const selectedGroup = breakdown.find((item) => item.muscleGroup === selectedMuscleGroup);
    
    if (!selectedGroup || selectedGroup.exercises.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.text }]}>
            No exercises found for this muscle group
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={[styles.scrollContent, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={true}
      >
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]} mode="elevated">
          <Card.Content style={{ padding: Spacing.md }}>
            <View style={styles.exerciseHeader}>
              <IconButton
                icon="arrow-left"
                iconColor={theme.colors.primary}
                size={28}
                onPress={handleBackToMuscleGroups}
              />
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={[styles.muscleGroupName, { color: theme.colors.text }]}>
                  {getMuscleGroupLabel(selectedMuscleGroup!)}
                </Text>
                <Text variant="bodyMedium" style={[styles.percentageText, { color: theme.colors.primary, fontWeight: '600' }]}>
                  {formatDuration(selectedGroup.totalTime)} total
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {selectedGroup.exercises.map((exercise) => (
          <Card key={exercise.exerciseId} style={[styles.exerciseCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} mode="elevated">
            <Card.Content style={{ padding: Spacing.md }}>
              <View style={styles.exerciseRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={[styles.exerciseName, { color: theme.colors.text }]}>
                    {exercise.exerciseName}
                  </Text>
                  <Text variant="headlineSmall" style={[styles.timeText, { color: theme.colors.primary }]}>
                    {formatDuration(exercise.totalTime)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.percentageText, { color: theme.colors.text }]}>
                    {exercise.percentage.toFixed(1)}% of group • {exercise.workoutCount.toLocaleString()} workout{exercise.workoutCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={exercise.percentage / 100}
                color={theme.colors.primary}
                style={[styles.progressBar, { backgroundColor: theme.colors.border }]}
              />
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        dismissable
        style={{ margin: 0 }}
      >
        <View style={styles.modalContent}>
          <View style={[styles.header, { borderBottomColor: theme.colors.primary, backgroundColor: theme.colors.card }]}>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            <IconButton
              icon="close"
              iconColor={theme.colors.text}
              size={28}
              onPress={onDismiss}
              style={{ margin: 0 }}
            />
          </View>

          {viewMode === 'muscleGroups' ? renderMuscleGroupView() : renderExerciseView()}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: Spacing.md,
    borderRadius: 16,
    maxHeight: '90%',
    minHeight: 400,
    padding: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 1,
  },
  modalContent: {
    flex: 1,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 2,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
    fontSize: 20,
  },
  scrollContent: {
    flex: 1,
    padding: Spacing.md,
  },
  muscleGroupCard: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  muscleGroupName: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    fontSize: 18,
  },
  timeText: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    fontSize: 24,
  },
  percentageText: {
    fontSize: 13,
    opacity: 0.8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },
  exerciseCard: {
    marginBottom: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exerciseName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontSize: 16,
  },
  headerCard: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  chartCard: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  chartTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontSize: 18,
  },
});

