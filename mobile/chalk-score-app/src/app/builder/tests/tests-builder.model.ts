export interface TestTypeItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  versions: VersionSummary[];
}

export interface VersionSummary {
  id: string;
  version: number;
  isDraft: boolean;
  isActive: boolean;
  exerciseCount: number;
  createdAt: string;
}

export interface TestConfigDetail {
  id: string;
  testTypeId: string;
  testTypeName: string;
  version: number;
  isDraft: boolean;
  isActive: boolean;
  createdAt: string;
  exercises: ConfigExercise[];
}

export interface ConfigExercise {
  exerciseId: string;
  name: string;
  unit: string;
  measurementType: string;
  scoringType: string;
  maxValue: number;
  weight: number;
  required: boolean;
  displayOrder: number;
  scoringParams: string | null;
}

export interface ExerciseConfigInput {
  exerciseId: string;
  maxValue: number;
  weight: number;
  scoringType: string;
  scoringParams: string | null;
  displayOrder: number;
  required: boolean;
}
