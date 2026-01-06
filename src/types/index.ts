// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Exercise types
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_group: MuscleGroup;
  equipment?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'abs'
  | 'cardio'
  | 'other';

// Workout Log types
export interface WorkoutSet {
  id: string;
  workout_log_id: string;
  set_number: number;
  weight: number;
  reps: number;
  notes?: string;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise?: Exercise; // For joined queries
  date: string;
  sets: WorkoutSet[];
  total_volume?: number; // weight * reps across all sets
  notes?: string;
  created_at: string;
}

// Statistics types
export interface ExerciseStats {
  exercise_id: string;
  exercise_name: string;
  total_workouts: number;
  max_weight: number;
  total_volume: number;
  last_workout_date: string;
}

export interface WorkoutStats {
  total_workouts: number;
  total_volume: number;
  workouts_this_week: number;
  workouts_this_month: number;
  favorite_exercises: ExerciseStats[];
}

// Difficulty rating for weight progression
export type DifficultyRating = 'easy' | 'normal' | 'hard' | 'expert';

// Routine types
export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  order: number;
  startingWeight?: number; // Initial weight set when adding to routine
  currentWeight?: number; // Current recommended weight based on performance
  lastDifficulty?: DifficultyRating;
  lastPerformed?: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  created_at: string;
  last_performed?: string;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Exercises: undefined;
  WorkoutLog: undefined;
  Statistics: undefined;
  Routines: undefined;
  RoutineBuilder: { routineId?: string };
  ExerciseDetail: { exerciseId: string };
  AddWorkout: { exerciseId: string };
  ActiveWorkout: {
    exerciseId: string;
    exerciseName: string;
    lastWeight?: number;
  };
  ActiveRoutineWorkout: { routineId: string };
};
