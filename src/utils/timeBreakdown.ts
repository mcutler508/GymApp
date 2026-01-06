import { MuscleGroup } from '../types';
import { formatDuration } from './timeFormat';

export interface MuscleGroupTimeBreakdown {
  muscleGroup: MuscleGroup;
  totalTime: number; // seconds
  percentage: number; // percentage of total time
  exerciseCount: number;
  exercises: ExerciseTimeBreakdown[];
}

export interface ExerciseTimeBreakdown {
  exerciseId: string;
  exerciseName: string;
  totalTime: number; // seconds
  workoutCount: number;
  percentage: number; // percentage within muscle group
}

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

/**
 * Calculate time breakdown by muscle group
 * Handles session-based timing to avoid double counting
 */
export function calculateTimeByMuscleGroup(logs: WorkoutLog[]): Map<MuscleGroup, number> {
  const muscleGroupTime = new Map<MuscleGroup, number>();
  const processedSessions = new Set<string>();

  logs.forEach((log) => {
    const muscleGroup = (log.muscleGroup || 'other') as MuscleGroup;
    let timeToAdd = 0;

    // Prioritize individual exercise duration over session duration
    // This ensures per-exercise timing is used when available
    if (log.duration) {
      // Individual exercise duration (preferred)
      timeToAdd = log.duration;
    } else if (log.sessionId && log.sessionDuration) {
      // Fallback to session duration only if no individual duration exists
      // Only count once per session to avoid double counting
      if (!processedSessions.has(log.sessionId)) {
        processedSessions.add(log.sessionId);
        timeToAdd = log.sessionDuration;
      }
    }

    if (timeToAdd > 0) {
      const current = muscleGroupTime.get(muscleGroup) || 0;
      muscleGroupTime.set(muscleGroup, current + timeToAdd);
    }
  });

  return muscleGroupTime;
}

/**
 * Calculate time breakdown by exercise
 */
export function calculateTimeByExercise(logs: WorkoutLog[]): Map<string, { name: string; time: number }> {
  const exerciseTime = new Map<string, { name: string; time: number }>();
  const processedSessions = new Set<string>();

  logs.forEach((log) => {
    let timeToAdd = 0;

    // Prioritize individual exercise duration over session duration
    if (log.duration) {
      // Individual exercise duration (preferred)
      timeToAdd = log.duration;
    } else if (log.sessionId && log.sessionDuration) {
      // Fallback to session duration only if no individual duration exists
      // Only count once per session to avoid double counting
      if (!processedSessions.has(log.sessionId)) {
        processedSessions.add(log.sessionId);
        timeToAdd = log.sessionDuration;
      }
    }

    if (timeToAdd > 0) {
      const existing = exerciseTime.get(log.exerciseId);
      if (existing) {
        existing.time += timeToAdd;
      } else {
        exerciseTime.set(log.exerciseId, {
          name: log.exerciseName,
          time: timeToAdd,
        });
      }
    }
  });

  return exerciseTime;
}

/**
 * Calculate nested breakdown by muscle group and exercise
 */
export function calculateTimeByMuscleGroupAndExercise(
  logs: WorkoutLog[],
  filter?: { startDate?: Date; endDate?: Date }
): MuscleGroupTimeBreakdown[] {
  // Filter logs by date if provided
  let filteredLogs = logs;
  if (filter?.startDate || filter?.endDate) {
    filteredLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      if (filter.startDate && logDate < filter.startDate) return false;
      if (filter.endDate && logDate > filter.endDate) return false;
      return true;
    });
  }

  const totalTime = calculateTotalTime(filteredLogs);
  const muscleGroupTime = calculateTimeByMuscleGroup(filteredLogs);
  const exerciseTime = calculateTimeByExercise(filteredLogs);

  // Group exercises by muscle group
  const muscleGroupExercises = new Map<MuscleGroup, ExerciseTimeBreakdown[]>();
  const processedSessions = new Set<string>();

  filteredLogs.forEach((log) => {
    const muscleGroup = (log.muscleGroup || 'other') as MuscleGroup;
    let timeToAdd = 0;

    // Prioritize individual exercise duration over session duration
    if (log.duration) {
      // Individual exercise duration (preferred)
      timeToAdd = log.duration;
    } else if (log.sessionId && log.sessionDuration) {
      // Fallback to session duration only if no individual duration exists
      // Only count once per session to avoid double counting
      if (!processedSessions.has(log.sessionId)) {
        processedSessions.add(log.sessionId);
        timeToAdd = log.sessionDuration;
      }
    }

    if (timeToAdd > 0) {
      if (!muscleGroupExercises.has(muscleGroup)) {
        muscleGroupExercises.set(muscleGroup, []);
      }

      const exercises = muscleGroupExercises.get(muscleGroup)!;
      const existingExercise = exercises.find((ex) => ex.exerciseId === log.exerciseId);

      if (existingExercise) {
        existingExercise.totalTime += timeToAdd;
        existingExercise.workoutCount += 1;
      } else {
        exercises.push({
          exerciseId: log.exerciseId,
          exerciseName: log.exerciseName,
          totalTime: timeToAdd,
          workoutCount: 1,
          percentage: 0, // Will calculate after
        });
      }
    }
  });

  // Calculate actual total time first
  const actualTotalTime = calculateTotalTime(filteredLogs);

  // Build breakdown array with percentages
  const breakdown: MuscleGroupTimeBreakdown[] = [];

  muscleGroupTime.forEach((muscleGroupTotalTime, muscleGroup) => {
    const exercises = muscleGroupExercises.get(muscleGroup) || [];
    
    // Calculate percentages for exercises within muscle group
    const exercisesWithPercentages = exercises.map((ex) => ({
      ...ex,
      percentage: muscleGroupTotalTime > 0 ? (ex.totalTime / muscleGroupTotalTime) * 100 : 0,
    }));

    // Sort exercises by time (descending)
    exercisesWithPercentages.sort((a, b) => b.totalTime - a.totalTime);

    breakdown.push({
      muscleGroup,
      totalTime: muscleGroupTotalTime,
      percentage: actualTotalTime > 0 ? (muscleGroupTotalTime / actualTotalTime) * 100 : 0,
      exerciseCount: exercises.length,
      exercises: exercisesWithPercentages,
    });
  });

  // Sort by total time (descending)
  breakdown.sort((a, b) => b.totalTime - a.totalTime);

  return breakdown;
}

/**
 * Calculate total time from logs (handling sessions properly)
 */
function calculateTotalTime(logs: WorkoutLog[]): number {
  const processedSessions = new Set<string>();
  let total = 0;

  logs.forEach((log) => {
    // Prioritize individual exercise duration over session duration
    if (log.duration) {
      // Individual exercise duration (preferred)
      total += log.duration;
    } else if (log.sessionId && log.sessionDuration) {
      // Fallback to session duration only if no individual duration exists
      // Only count once per session to avoid double counting
      if (!processedSessions.has(log.sessionId)) {
        processedSessions.add(log.sessionId);
        total += log.sessionDuration;
      }
    }
  });

  return total;
}

