export interface ExerciseItem {
  id: string;
  name: string;
  description: string | null;
  measurementType: string;
  unit: string;
  isActive: boolean;
}

export interface CreateOrUpdateExerciseRequest {
  name: string;
  description: string | null;
  measurementType: string;
  unit: string;
}
