export interface ExerciseResult {
  exerciseId: string;
  exerciseName: string;
  unit: string;
  rawValue: number;
  calculatedScore: number;
  weight: number;
  scoringType: string;
  maxValue: number;
}

export interface TestEntryResponse {
  id: string;
  gymnastId: string;
  firstName: string;
  lastName: string;
  level: number;
  testConfigurationName: string;
  isCompleted: boolean;
  finalScore: number | null;
  results: ExerciseResult[];
}

export interface ExerciseResultInput {
  exerciseId: string;
  rawValue: number;
}
