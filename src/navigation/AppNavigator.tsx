import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
// @ts-ignore
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeProvider';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import ExerciseStatsScreen from '../screens/ExerciseStatsScreen';
import WorkoutLogScreen from '../screens/WorkoutLogScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import RoutinesScreen from '../screens/RoutinesScreen';
import RoutineBuilderScreen from '../screens/RoutineBuilderScreen';
import ActiveRoutineWorkoutScreen from '../screens/ActiveRoutineWorkoutScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="ActiveRoutineWorkout"
        component={ActiveRoutineWorkoutScreen}
        options={{ title: 'Active Workout' }}
      />
    </Stack.Navigator>
  );
}

function ExercisesStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
      }}
    >
      <Stack.Screen
        name="ExercisesList"
        component={ExercisesScreen}
        options={{ title: 'Exercises' }}
      />
      <Stack.Screen
        name="ExerciseStats"
        component={ExerciseStatsScreen}
        options={{ title: 'Exercise Stats' }}
      />
    </Stack.Navigator>
  );
}

function RoutinesStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
      }}
    >
      <Stack.Screen
        name="RoutinesList"
        component={RoutinesScreen}
        options={{ title: 'Routines' }}
      />
      <Stack.Screen
        name="RoutineBuilder"
        component={RoutineBuilderScreen}
        options={({ route }: any) => ({
          title: route.params?.routineId ? 'Edit Routine' : 'Create Routine',
        })}
      />
      <Stack.Screen
        name="ActiveRoutineWorkout"
        component={ActiveRoutineWorkoutScreen}
        options={{ title: 'Active Workout' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Routines"
          component={RoutinesStack}
          options={{
            tabBarLabel: 'Routines',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="playlist-check" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Exercises"
          component={ExercisesStack}
          options={{
            tabBarLabel: 'Exercises',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="dumbbell" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="WorkoutLog"
          component={WorkoutLogScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              color: theme.colors.text,
            },
            tabBarLabel: 'Log',
            title: 'Workout Log',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="notebook" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              color: theme.colors.text,
            },
            tabBarLabel: 'Stats',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-line" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
