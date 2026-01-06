import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Routine } from '../types';
import { Colors, Spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = StackNavigationProp<any>;

const ROUTINES_STORAGE_KEY = 'routines';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [routines, setRoutines] = useState<Routine[]>([]);

  const loadRoutines = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      if (stored) {
        setRoutines(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  const handleStartWorkout = (routine: Routine) => {
    if (routine.exercises.length === 0) {
      Alert.alert('Empty Routine', 'Please add exercises to this routine first');
      return;
    }
    navigation.navigate('ActiveRoutineWorkout', { routineId: routine.id });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome to Gym Tracker
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Track your workouts and monitor your progress
        </Text>

        {routines.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Start Workout
              </Text>
              <Text variant="bodyMedium" style={styles.cardSubtitle}>
                Choose a routine to begin
              </Text>
            </Card.Content>
            {routines.map((routine) => (
              <Card.Actions key={routine.id} style={styles.routineAction}>
                <View style={styles.routineInfo}>
                  <Text variant="bodyLarge">{routine.name}</Text>
                  <Text variant="bodySmall" style={styles.exerciseCount}>
                    {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <IconButton
                  icon="play-circle"
                  iconColor={Colors.primary}
                  size={32}
                  onPress={() => handleStartWorkout(routine)}
                />
              </Card.Actions>
            ))}
            <Card.Actions>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Routines')}
                style={styles.button}
              >
                Manage Routines
              </Button>
            </Card.Actions>
          </Card>
        )}

        {routines.length === 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Get Started
              </Text>
              <Text variant="bodyMedium" style={styles.cardSubtitle}>
                Create your first workout routine
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Routines')}
                style={styles.button}
              >
                Create Routine
              </Button>
            </Card.Actions>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Quick Actions</Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Exercises')}
              style={styles.button}
            >
              Browse Exercises
            </Button>
          </Card.Actions>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('WorkoutLog')}
              style={styles.button}
            >
              Log Workout
            </Button>
          </Card.Actions>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Statistics')}
              style={styles.button}
            >
              View Statistics
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Today's Summary</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">0</Text>
                <Text variant="bodyMedium">Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">0</Text>
                <Text variant="bodyMedium">Exercises</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">0</Text>
                <Text variant="bodyMedium">Total Volume</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
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
  title: {
    marginBottom: Spacing.sm,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
  },
  routineAction: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  routineInfo: {
    flex: 1,
  },
  exerciseCount: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  button: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
});
