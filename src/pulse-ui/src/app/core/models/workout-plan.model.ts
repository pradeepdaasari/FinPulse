export interface WorkoutPlan {
  id: number;
  name: string;
  isActive: boolean;
  isSequential: boolean;
  days: WorkoutPlanDay[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TodayPlanResponse {
  restDay: boolean;
  alreadyLogged?: boolean;
  plan: { id: number; name: string; isSequential: boolean; totalDays: number };
  day?: {
    id: number;
    dayNumber: number;
    focusArea: string;
    exercises: PlannedExercise[];
  };
}

export interface WorkoutPlanSummary {
  id: number;
  name: string;
  isActive: boolean;
  dayCount: number;
  exerciseCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutPlanDay {
  id?: number;
  planId?: number;
  dayOfWeek: number;
  focusArea: string;
  exercises: PlannedExercise[];
}

export interface PlannedExercise {
  id?: number;
  planDayId?: number;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  targetWeight?: number;
  orderIndex: number;
  notes?: string;
  videoUrl?: string;
  muscleGroup?: string;
}
