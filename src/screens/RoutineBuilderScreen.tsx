import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Chip, IconButton, Portal, Modal, Searchbar, Dialog } from 'react-native-paper';
import { Colors, Spacing, MuscleGroups } from '../constants/theme';
import { Routine, RoutineExercise, Exercise, MuscleGroup } from '../types';
import WeightSlider from '../components/WeightSlider';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RoutineBuilderScreenRouteProp = RouteProp<RootStackParamList, 'RoutineBuilder'>;
type RoutineBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RoutineBuilder'>;

interface Props {
  route: RoutineBuilderScreenRouteProp;
  navigation: RoutineBuilderScreenNavigationProp;
}

const ROUTINES_STORAGE_KEY = 'routines';
const EXERCISES_STORAGE_KEY = 'exercises';

export default function RoutineBuilderScreen({ route, navigation }: Props) {
  const { routineId } = route.params;
  const isEditing = !!routineId;

  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState<Exercise | null>(null);
  const [selectedExerciseToEdit, setSelectedExerciseToEdit] = useState<RoutineExercise | null>(null);
  const [weightInput, setWeightInput] = useState<number>(0);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);

  // Exercise picker filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);

  useEffect(() => {
    loadExercises();
    loadWorkoutLogs();
    if (isEditing) {
      loadRoutine();
    }
  }, []);

  const loadExercises = async () => {
    try {
      const stored = await AsyncStorage.getItem(EXERCISES_STORAGE_KEY);
      if (stored) {
        setAvailableExercises(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadWorkoutLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutLogs');
      if (stored) {
        setWorkoutLogs(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
  };

  const loadRoutine = async () => {
    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      if (stored) {
        const routines: Routine[] = JSON.parse(stored);
        const routine = routines.find((r) => r.id === routineId);
        if (routine) {
          setRoutineName(routine.name);
          setSelectedExercises(routine.exercises);
        }
      }
    } catch (error) {
      console.error('Error loading routine:', error);
    }
  };

  const getExerciseStats = (exerciseId: string): { pr: number | null; avg: number | null } => {
    // Filter logs for this exercise
    const exerciseLogs = workoutLogs.filter(log => log.exerciseId === exerciseId);

    if (exerciseLogs.length === 0) {
      return { pr: null, avg: null };
    }

    // Get all sets from all logs
    const allSets = exerciseLogs.flatMap(log => log.sets || []);

    if (allSets.length === 0) {
      return { pr: null, avg: null };
    }

    // Calculate PR (max weight)
    const pr = Math.max(...allSets.map(set => set.weight || 0));

    // Calculate average weight across all sets
    const totalWeight = allSets.reduce((sum, set) => sum + (set.weight || 0), 0);
    const avg = Math.round(totalWeight / allSets.length);

    return { pr, avg };
  };

  const filteredExercises = availableExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = !selectedMuscleGroup || exercise.muscle_group === selectedMuscleGroup;
    const notAlreadyAdded = !selectedExercises.some((e) => e.exerciseId === exercise.id);
    return matchesSearch && matchesMuscleGroup && notAlreadyAdded;
  });

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExerciseToAdd(exercise);
    setShowExercisePicker(false);
    setShowWeightDialog(true);
  };

  const handleAddExerciseWithWeight = () => {
    if (!selectedExerciseToAdd) return;

    const weight = weightInput > 0 ? weightInput : undefined;

    const newRoutineExercise: RoutineExercise = {
      id: Date.now().toString(),
      exerciseId: selectedExerciseToAdd.id,
      exerciseName: selectedExerciseToAdd.name,
      muscleGroup: selectedExerciseToAdd.muscle_group,
      order: selectedExercises.length,
      startingWeight: weight,
      currentWeight: weight,
    };

    setSelectedExercises([...selectedExercises, newRoutineExercise]);
    setShowWeightDialog(false);
    setWeightInput(0);
    setSelectedExerciseToAdd(null);
  };

  const handleRemoveExercise = (id: string) => {
    const updated = selectedExercises
      .filter((e) => e.id !== id)
      .map((e, index) => ({ ...e, order: index }));
    setSelectedExercises(updated);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedExercises.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...selectedExercises];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((e, i) => ({ ...e, order: i }));
    setSelectedExercises(reordered);
  };

  const handleEditWeight = (exerciseId: string) => {
    const exercise = selectedExercises.find((e) => e.id === exerciseId);
    if (exercise) {
      setSelectedExerciseToEdit(exercise);
      setWeightInput(exercise.currentWeight || 0);
      setShowEditDialog(true);
    }
  };

  const handleSaveEditedWeight = () => {
    if (!selectedExerciseToEdit) return;

    const weight = weightInput > 0 ? weightInput : undefined;

    const updated = selectedExercises.map((e) =>
      e.id === selectedExerciseToEdit.id
        ? { ...e, startingWeight: weight, currentWeight: weight }
        : e
    );
    setSelectedExercises(updated);
    setShowEditDialog(false);
    setWeightInput(0);
    setSelectedExerciseToEdit(null);
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      const routines: Routine[] = stored ? JSON.parse(stored) : [];

      if (isEditing) {
        const index = routines.findIndex((r) => r.id === routineId);
        if (index !== -1) {
          routines[index] = {
            ...routines[index],
            name: routineName.trim(),
            exercises: selectedExercises,
          };
        }
      } else {
        const newRoutine: Routine = {
          id: Date.now().toString(),
          name: routineName.trim(),
          exercises: selectedExercises,
          created_at: new Date().toISOString(),
          completed: false,
        };
        routines.push(newRoutine);
      }

      await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
      Alert.alert('Success', `Routine ${isEditing ? 'updated' : 'created'} successfully`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine');
    }
  };

  const renderSelectedExercise = ({ item, index }: { item: RoutineExercise; index: number }) => (
    <Card style={styles.exerciseCard}>
      <Card.Content>
        <View style={styles.exerciseRow}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyLarge">
              {index + 1}. {item.exerciseName}
            </Text>
            <Text variant="bodySmall" style={styles.muscleGroup}>
              {item.muscleGroup}
              {item.currentWeight && ` • ${item.currentWeight} lbs`}
            </Text>
          </View>
          <View style={styles.exerciseActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditWeight(item.id)}
            />
            <IconButton
              icon="arrow-up"
              size={20}
              disabled={index === 0}
              onPress={() => handleMoveExercise(index, 'up')}
            />
            <IconButton
              icon="arrow-down"
              size={20}
              disabled={index === selectedExercises.length - 1}
              onPress={() => handleMoveExercise(index, 'down')}
            />
            <IconButton
              icon="delete"
              iconColor={Colors.error}
              size={20}
              onPress={() => handleRemoveExercise(item.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAvailableExercise = ({ item }: { item: Exercise }) => {
    const stats = getExerciseStats(item.id);

    return (
      <Card style={styles.exerciseCard} onPress={() => handleSelectExercise(item)}>
        <Card.Content>
          <Text variant="bodyLarge">{item.name}</Text>
          {stats.pr !== null && stats.avg !== null ? (
            <Text variant="bodySmall" style={styles.statsText}>
              PR: {stats.pr} lbs  •  Avg: {stats.avg} lbs
            </Text>
          ) : (
            <Text variant="bodySmall" style={styles.statsText}>
              No History Yet
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.formSection}>
        <TextInput
          label="Routine Name *"
          value={routineName}
          onChangeText={setRoutineName}
          style={styles.input}
          mode="outlined"
          placeholder="e.g., Upper Body Day"
        />

        <Button
          mode="outlined"
          icon="plus"
          onPress={() => setShowExercisePicker(true)}
          style={styles.addButton}
        >
          Add Exercise
        </Button>
      </View>

      <View style={styles.exercisesSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Exercises ({selectedExercises.length})
        </Text>

        {selectedExercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No exercises added yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={selectedExercises}
            renderItem={renderSelectedExercise}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>

      <View style={styles.bottomButtons}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.button}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSaveRoutine} style={styles.button}>
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </View>

      {/* Exercise Picker Modal */}
      <Portal>
        <Modal
          visible={showExercisePicker}
          onDismiss={() => setShowExercisePicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Select Exercise
          </Text>

          <Searchbar
            placeholder="Search exercises..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <View style={styles.filterContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={MuscleGroups}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Chip
                  mode={selectedMuscleGroup === item.value ? 'flat' : 'outlined'}
                  selected={selectedMuscleGroup === item.value}
                  onPress={() =>
                    setSelectedMuscleGroup(
                      selectedMuscleGroup === item.value ? null : (item.value as MuscleGroup)
                    )
                  }
                  style={styles.filterChip}
                >
                  <Text>{item.label}</Text>
                </Chip>
              )}
            />
          </View>

          <FlatList
            data={filteredExercises}
            renderItem={renderAvailableExercise}
            keyExtractor={(item) => item.id}
            style={styles.exerciseList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No exercises found
                </Text>
              </View>
            }
          />

          <Button mode="outlined" onPress={() => setShowExercisePicker(false)}>
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* Weight Input Dialog */}
      <Portal>
        <Dialog visible={showWeightDialog} onDismiss={() => setShowWeightDialog(false)}>
          <Dialog.Title>Set Starting Weight</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogSubtitle}>
              {selectedExerciseToAdd?.name}
            </Text>
            <WeightSlider
              label="Weight (lbs) - Optional"
              value={weightInput}
              onValueChange={setWeightInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowWeightDialog(false)}>Cancel</Button>
            <Button onPress={handleAddExerciseWithWeight}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Weight Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Exercise</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogSubtitle}>
              {selectedExerciseToEdit?.exerciseName}
            </Text>
            <WeightSlider
              label="Weight (lbs)"
              value={weightInput}
              onValueChange={setWeightInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleSaveEditedWeight}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  formSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  input: {
    marginBottom: Spacing.md,
  },
  addButton: {
    marginTop: Spacing.sm,
  },
  exercisesSection: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  exerciseCard: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseActions: {
    flexDirection: 'row',
  },
  muscleGroup: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsText: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  chip: {
    marginRight: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  modalContainer: {
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  searchbar: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterChip: {
    marginRight: Spacing.sm,
  },
  exerciseList: {
    marginBottom: Spacing.md,
  },
  dialogSubtitle: {
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
  },
  weightInput: {
    marginTop: Spacing.sm,
  },
});
