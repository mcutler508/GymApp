import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, FAB, Portal, Modal, TextInput, Button, Menu, IconButton } from 'react-native-paper';
import { Colors, Spacing, MuscleGroups } from '../constants/theme';
import { MuscleGroup, Exercise } from '../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = StackNavigationProp<any>;

// Default exercises to start with
const DEFAULT_EXERCISES = [
  // Chest exercises
  { id: '1', name: 'Bench Press - Barbell', muscle_group: 'chest' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '101', name: 'Bench Press - Dumbbell', muscle_group: 'chest' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '102', name: 'Bench Press - Plate-loaded Machine', muscle_group: 'chest' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '103', name: 'Bench Press - Pulley Machine', muscle_group: 'chest' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '11', name: 'Incline Bench Press - Barbell', muscle_group: 'chest' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '104', name: 'Incline Bench Press - Dumbbell', muscle_group: 'chest' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '105', name: 'Incline Bench Press - Plate-loaded Machine', muscle_group: 'chest' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '106', name: 'Decline Bench Press - Barbell', muscle_group: 'chest' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '107', name: 'Decline Bench Press - Dumbbell', muscle_group: 'chest' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '13', name: 'Chest Fly - Dumbbell', muscle_group: 'chest' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '108', name: 'Chest Fly - Pulley Machine', muscle_group: 'chest' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '109', name: 'Chest Fly - Plate-loaded Machine', muscle_group: 'chest' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '15', name: 'Push-ups', muscle_group: 'chest' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },

  // Back exercises
  { id: '3', name: 'Deadlift - Barbell', muscle_group: 'back' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '110', name: 'Deadlift - Trap Bar', muscle_group: 'back' as MuscleGroup, equipment: 'Trap Bar', created_at: new Date().toISOString() },
  { id: '4', name: 'Pull-ups', muscle_group: 'back' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '111', name: 'Chin-ups', muscle_group: 'back' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '9', name: 'Lat Pulldown - Pulley Machine', muscle_group: 'back' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '112', name: 'Lat Pulldown - Plate-loaded Machine', muscle_group: 'back' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '16', name: 'Row - Barbell', muscle_group: 'back' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '17', name: 'Row - Dumbbell', muscle_group: 'back' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '18', name: 'Row - Pulley Machine', muscle_group: 'back' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '113', name: 'Row - Plate-loaded Machine', muscle_group: 'back' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '114', name: 'T-Bar Row - Barbell', muscle_group: 'back' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '115', name: 'T-Bar Row - Plate-loaded Machine', muscle_group: 'back' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '19', name: 'Face Pulls - Pulley Machine', muscle_group: 'back' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },

  // Shoulder exercises
  { id: '20', name: 'Shoulder Press - Barbell', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '5', name: 'Shoulder Press - Dumbbell', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '116', name: 'Shoulder Press - Plate-loaded Machine', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '117', name: 'Shoulder Press - Pulley Machine', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '21', name: 'Lateral Raises - Dumbbell', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '118', name: 'Lateral Raises - Pulley Machine', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '22', name: 'Front Raises - Dumbbell', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '119', name: 'Front Raises - Barbell', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '23', name: 'Rear Delt Fly - Dumbbell', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '120', name: 'Rear Delt Fly - Pulley Machine', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '121', name: 'Rear Delt Fly - Plate-loaded Machine', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '24', name: 'Arnold Press - Dumbbell', muscle_group: 'shoulders' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },

  // Biceps exercises
  { id: '6', name: 'Bicep Curl - Dumbbell', muscle_group: 'biceps' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '25', name: 'Bicep Curl - Barbell', muscle_group: 'biceps' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '27', name: 'Bicep Curl - Pulley Machine', muscle_group: 'biceps' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '122', name: 'Bicep Curl - Plate-loaded Machine', muscle_group: 'biceps' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '26', name: 'Hammer Curl - Dumbbell', muscle_group: 'biceps' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '123', name: 'Hammer Curl - Pulley Machine', muscle_group: 'biceps' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '28', name: 'Preacher Curl - Barbell', muscle_group: 'biceps' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '124', name: 'Preacher Curl - Dumbbell', muscle_group: 'biceps' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '125', name: 'Preacher Curl - Pulley Machine', muscle_group: 'biceps' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },

  // Triceps exercises
  { id: '7', name: 'Tricep Dips', muscle_group: 'triceps' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '29', name: 'Tricep Pushdown - Pulley Machine', muscle_group: 'triceps' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '30', name: 'Overhead Tricep Extension - Dumbbell', muscle_group: 'triceps' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '126', name: 'Overhead Tricep Extension - Barbell', muscle_group: 'triceps' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '127', name: 'Overhead Tricep Extension - Pulley Machine', muscle_group: 'triceps' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '31', name: 'Close-Grip Bench Press - Barbell', muscle_group: 'triceps' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '32', name: 'Skull Crushers - Barbell', muscle_group: 'triceps' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '128', name: 'Skull Crushers - Dumbbell', muscle_group: 'triceps' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },

  // Leg exercises
  { id: '2', name: 'Squat - Barbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '129', name: 'Squat - Dumbbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '130', name: 'Squat - Pulley Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '8', name: 'Leg Press - Plate-loaded Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '131', name: 'Leg Press - Pulley Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '33', name: 'Lunges - Dumbbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '132', name: 'Lunges - Barbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '133', name: 'Lunges', muscle_group: 'legs' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '34', name: 'Romanian Deadlift - Barbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '134', name: 'Romanian Deadlift - Dumbbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '35', name: 'Leg Curl - Pulley Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '135', name: 'Leg Curl - Plate-loaded Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '36', name: 'Leg Extension - Pulley Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '136', name: 'Leg Extension - Plate-loaded Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '37', name: 'Calf Raises - Pulley Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '137', name: 'Calf Raises - Plate-loaded Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },
  { id: '138', name: 'Calf Raises - Barbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '38', name: 'Bulgarian Split Squat - Dumbbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Dumbbell', created_at: new Date().toISOString() },
  { id: '139', name: 'Bulgarian Split Squat - Barbell', muscle_group: 'legs' as MuscleGroup, equipment: 'Barbell', created_at: new Date().toISOString() },
  { id: '140', name: 'Bulgarian Split Squat', muscle_group: 'legs' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '141', name: 'Hack Squat - Plate-loaded Machine', muscle_group: 'legs' as MuscleGroup, equipment: 'Plate-loaded Machine', created_at: new Date().toISOString() },

  // Abs/Core exercises
  { id: '10', name: 'Crunches', muscle_group: 'abs' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '39', name: 'Plank', muscle_group: 'abs' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '40', name: 'Russian Twists', muscle_group: 'abs' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '41', name: 'Hanging Leg Raises', muscle_group: 'abs' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '42', name: 'Cable Crunch - Pulley Machine', muscle_group: 'abs' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },
  { id: '43', name: 'Ab Wheel Rollout', muscle_group: 'abs' as MuscleGroup, equipment: 'Ab Wheel', created_at: new Date().toISOString() },
  { id: '142', name: 'Ab Crunch - Pulley Machine', muscle_group: 'abs' as MuscleGroup, equipment: 'Pulley Machine', created_at: new Date().toISOString() },

  // Cardio exercises
  { id: '44', name: 'Running - Treadmill', muscle_group: 'cardio' as MuscleGroup, equipment: 'Treadmill', created_at: new Date().toISOString() },
  { id: '143', name: 'Running - Outdoor', muscle_group: 'cardio' as MuscleGroup, equipment: 'None', created_at: new Date().toISOString() },
  { id: '45', name: 'Cycling - Bike', muscle_group: 'cardio' as MuscleGroup, equipment: 'Bike', created_at: new Date().toISOString() },
  { id: '144', name: 'Cycling - Outdoor', muscle_group: 'cardio' as MuscleGroup, equipment: 'None', created_at: new Date().toISOString() },
  { id: '46', name: 'Rowing - Machine', muscle_group: 'cardio' as MuscleGroup, equipment: 'Rowing Machine', created_at: new Date().toISOString() },
  { id: '145', name: 'Elliptical', muscle_group: 'cardio' as MuscleGroup, equipment: 'Elliptical', created_at: new Date().toISOString() },
  { id: '146', name: 'Stairmaster', muscle_group: 'cardio' as MuscleGroup, equipment: 'Stairmaster', created_at: new Date().toISOString() },

  // Full body/Other
  { id: '47', name: 'Burpees', muscle_group: 'other' as MuscleGroup, equipment: 'Bodyweight', created_at: new Date().toISOString() },
  { id: '48', name: 'Kettlebell Swings', muscle_group: 'other' as MuscleGroup, equipment: 'Kettlebell', created_at: new Date().toISOString() },
  { id: '147', name: 'Box Jumps', muscle_group: 'other' as MuscleGroup, equipment: 'Box', created_at: new Date().toISOString() },
  { id: '148', name: 'Battle Ropes', muscle_group: 'other' as MuscleGroup, equipment: 'Battle Ropes', created_at: new Date().toISOString() },
];

const EXERCISES_STORAGE_KEY = 'exercises';

export default function ExercisesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<Record<string, any>>({});
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [muscleGroupMenuVisible, setMuscleGroupMenuVisible] = useState(false);

  // Form state
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState<MuscleGroup>('chest');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');

  const loadExercises = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(EXERCISES_STORAGE_KEY);
      if (stored) {
        const storedExercises = JSON.parse(stored);
        // Merge: Add any default exercises that don't exist in stored exercises
        const storedIds = new Set(storedExercises.map((ex: Exercise) => ex.id));
        const newExercises = DEFAULT_EXERCISES.filter(ex => !storedIds.has(ex.id));

        if (newExercises.length > 0) {
          // New default exercises found - merge them
          const mergedExercises = [...storedExercises, ...newExercises];
          setExercises(mergedExercises);
          await AsyncStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(mergedExercises));
        } else {
          setExercises(storedExercises);
        }
      } else {
        // First time - set default exercises
        setExercises(DEFAULT_EXERCISES);
        await AsyncStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(DEFAULT_EXERCISES));
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  }, []);

  const loadWorkoutHistory = useCallback(async () => {
    try {
      const history = await AsyncStorage.getItem('workoutHistory');
      if (history) {
        setWorkoutHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
      loadWorkoutHistory();
    }, [loadExercises, loadWorkoutHistory])
  );

  const saveExercises = async (updatedExercises: Exercise[]) => {
    try {
      await AsyncStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(updatedExercises));
      setExercises(updatedExercises);
    } catch (error) {
      console.error('Error saving exercises:', error);
      Alert.alert('Error', 'Failed to save exercises');
    }
  };

  const handleAddExercise = async () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName.trim(),
      muscle_group: newExerciseMuscleGroup,
      equipment: newExerciseEquipment.trim() || undefined,
      description: newExerciseDescription.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    const updatedExercises = [...exercises, newExercise];
    await saveExercises(updatedExercises);

    // Reset form
    setNewExerciseName('');
    setNewExerciseMuscleGroup('chest');
    setNewExerciseEquipment('');
    setNewExerciseDescription('');
    setModalVisible(false);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedExercises = exercises.filter((ex) => ex.id !== exerciseId);
            await saveExercises(updatedExercises);
          },
        },
      ]
    );
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = !selectedMuscleGroup || exercise.muscle_group === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  const handleExercisePress = (exercise: Exercise) => {
    const lastWorkout = workoutHistory[exercise.id];
    const lastWeight = lastWorkout?.nextWeight || undefined;

    navigation.navigate('ActiveWorkout', {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      lastWeight,
    });
  };

  const renderExercise = ({ item }: { item: Exercise }) => {
    const lastWorkout = workoutHistory[item.id];
    const lastWeight = lastWorkout?.nextWeight;

    return (
      <Card style={styles.card} onPress={() => handleExercisePress(item)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium">{item.name}</Text>
              {lastWeight && (
                <Text variant="bodySmall" style={styles.lastWeightText}>
                  Next: {lastWeight} lbs
                </Text>
              )}
              <View style={styles.chipContainer}>
                <Chip mode="outlined" style={styles.chip}>
                  {item.muscle_group}
                </Chip>
                {item.equipment && (
                  <Chip mode="outlined" style={styles.chip}>
                    {item.equipment}
                  </Chip>
                )}
              </View>
            </View>
            <IconButton
              icon="delete"
              iconColor={Colors.error}
              size={20}
              onPress={() => handleDeleteExercise(item.id)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
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
              {item.label}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No exercises found</Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setModalVisible(true)}
        label="Add Exercise"
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Add New Exercise
          </Text>

          <TextInput
            label="Exercise Name *"
            value={newExerciseName}
            onChangeText={setNewExerciseName}
            style={styles.input}
            mode="outlined"
          />

          <Menu
            visible={muscleGroupMenuVisible}
            onDismiss={() => setMuscleGroupMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMuscleGroupMenuVisible(true)}
                style={styles.input}
                contentStyle={styles.menuButton}
              >
                Muscle Group: {newExerciseMuscleGroup}
              </Button>
            }
          >
            {MuscleGroups.map((group) => (
              <Menu.Item
                key={group.value}
                onPress={() => {
                  setNewExerciseMuscleGroup(group.value as MuscleGroup);
                  setMuscleGroupMenuVisible(false);
                }}
                title={group.label}
              />
            ))}
          </Menu>

          <TextInput
            label="Equipment"
            value={newExerciseEquipment}
            onChangeText={setNewExerciseEquipment}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Barbell, Dumbbells, Machine"
          />

          <TextInput
            label="Description"
            value={newExerciseDescription}
            onChangeText={setNewExerciseDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddExercise}
              style={styles.modalButton}
            >
              Add
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchbar: {
    margin: Spacing.md,
  },
  filterContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    marginRight: Spacing.sm,
  },
  list: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  card: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lastWeightText: {
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontWeight: 'bold',
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
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
  modalContainer: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
  },
  menuButton: {
    justifyContent: 'flex-start',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
  },
  modalButton: {
    marginLeft: Spacing.sm,
  },
});
