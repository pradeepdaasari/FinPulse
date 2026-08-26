export interface WorkoutLog {
  id: number;
  date: string;
  focusArea: string;
  durationMinutes?: number;
  notes?: string;
  planDayId?: number;
  sets: ExerciseSet[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutLogSummary {
  id: number;
  date: string;
  focusArea: string;
  durationMinutes?: number;
  notes?: string;
  setCount: number;
  totalVolume: number;
  createdAt?: string;
}

export interface ExerciseSet {
  id?: number;
  workoutLogId?: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weight: number;
  orderIndex: number;
}

export interface PersonalRecord {
  exercise: string;
  maxWeight: number;
  bestSet: {
    weight: number;
    reps: number;
    date: string;
  };
}

export interface ExerciseProgress {
  date: string;
  maxWeight: number;
  totalVolume: number;
  sets: number;
}

export interface WorkoutStats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  monthlyVolume: number;
  currentStreak: number;
}
