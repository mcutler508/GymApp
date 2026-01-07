import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, IconButton, ProgressBar, Portal, Modal } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { Colors, Spacing, MuscleGroups } from '../constants/theme';
import { MuscleGroup } from '../types';
import { formatDuration } from '../utils/timeFormat';
import {
  calculateTimeByMuscleGroupAndExercise,
  MuscleGroupTimeBreakdown,
  ExerciseTimeBreakdown,
} from '../utils/timeBreakdown';

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
          <Text variant="bodyLarge" style={styles.emptyText}>
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
        legendFontColor: Colors.text,
        legendFontSize: 12,
      }));

    const chartConfig = {
      backgroundColor: Colors.surface,
      backgroundGradientFrom: Colors.surface,
      backgroundGradientTo: Colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForBackgroundLines: {
        strokeWidth: 0,
      },
    };

    return (
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={true}
      >
        {totalTime > 0 && chartData.length > 0 && (
          <Card style={styles.chartCard}>
            <Card.Content style={{ padding: Spacing.md }}>
              <Text variant="titleMedium" style={styles.chartTitle}>
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
                      <Text variant="bodyMedium" style={{ color: Colors.text, flex: 1 }}>{item.name}</Text>
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
            style={styles.muscleGroupCard}
            onPress={() => handleMuscleGroupPress(item.muscleGroup)}
            mode="elevated"
          >
            <Card.Content style={{ padding: Spacing.md }}>
              <View style={styles.muscleGroupHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={styles.muscleGroupName}>
                    {getMuscleGroupLabel(item.muscleGroup)}
                  </Text>
                  <Text variant="headlineMedium" style={styles.timeText}>
                    {formatDuration(item.totalTime)}
                  </Text>
                  <Text variant="bodySmall" style={styles.percentageText}>
                    {item.percentage.toFixed(1)}% of total • {item.exerciseCount.toLocaleString()} exercise{item.exerciseCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <IconButton icon="chevron-right" iconColor={Colors.primary} size={28} />
              </View>
              <ProgressBar
                progress={item.percentage / 100}
                color={Colors.primary}
                style={styles.progressBar}
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
          <Text variant="bodyLarge" style={styles.emptyText}>
            No exercises found for this muscle group
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={true}
      >
        <Card style={styles.headerCard} mode="elevated">
          <Card.Content style={{ padding: Spacing.md }}>
            <View style={styles.exerciseHeader}>
              <IconButton
                icon="arrow-left"
                iconColor={Colors.primary}
                size={28}
                onPress={handleBackToMuscleGroups}
              />
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={styles.muscleGroupName}>
                  {getMuscleGroupLabel(selectedMuscleGroup!)}
                </Text>
                <Text variant="bodyMedium" style={[styles.percentageText, { color: Colors.primary, fontWeight: '600' }]}>
                  {formatDuration(selectedGroup.totalTime)} total
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {selectedGroup.exercises.map((exercise) => (
          <Card key={exercise.exerciseId} style={styles.exerciseCard} mode="elevated">
            <Card.Content style={{ padding: Spacing.md }}>
              <View style={styles.exerciseRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={styles.exerciseName}>
                    {exercise.exerciseName}
                  </Text>
                  <Text variant="headlineSmall" style={styles.timeText}>
                    {formatDuration(exercise.totalTime)}
                  </Text>
                  <Text variant="bodySmall" style={styles.percentageText}>
                    {exercise.percentage.toFixed(1)}% of group • {exercise.workoutCount.toLocaleString()} workout{exercise.workoutCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={exercise.percentage / 100}
                color={Colors.primary}
                style={styles.progressBar}
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
        contentContainerStyle={styles.modalContainer}
        dismissable
        style={{ margin: 0 }}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              {title}
            </Text>
            <IconButton
              icon="close"
              iconColor={Colors.text}
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
    backgroundColor: '#1e1e1e', // Slightly lighter than card for better contrast
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
    borderColor: Colors.border,
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
    borderBottomColor: Colors.primary,
    backgroundColor: '#252525', // Lighter than surface for header contrast
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    fontSize: 20,
  },
  scrollContent: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: '#1a1a1a', // Slightly lighter than pure black
  },
  muscleGroupCard: {
    marginBottom: Spacing.md,
    backgroundColor: '#2a2a2a', // Lighter than surface for better contrast
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040', // Lighter border for visibility
    elevation: 3,
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  muscleGroupName: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontSize: 18,
  },
  timeText: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    fontSize: 24,
  },
  percentageText: {
    color: Colors.text,
    fontSize: 13,
    opacity: 0.8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.sm,
    backgroundColor: Colors.border,
  },
  exerciseCard: {
    marginBottom: Spacing.sm,
    backgroundColor: '#2a2a2a', // Lighter than surface for better contrast
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040', // Lighter border for visibility
    elevation: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exerciseName: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontSize: 16,
  },
  headerCard: {
    marginBottom: Spacing.md,
    backgroundColor: '#2a2a2a', // Lighter for contrast
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary, // Use primary color for header card border
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
    color: Colors.text,
    textAlign: 'center',
    fontSize: 16,
  },
  chartCard: {
    marginBottom: Spacing.md,
    backgroundColor: '#2a2a2a', // Lighter for contrast
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040', // Lighter border
    elevation: 2,
  },
  chartTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontSize: 18,
  },
});

