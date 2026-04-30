export interface TestSession {
  id: string;
  name: string;
  date: string;
  isActive: boolean;
  createdAt: string;
  gymnastCount: number;
}

export interface TestSessionGymnast {
  id: string;
  gymnastId: string;
  firstName: string;
  lastName: string;
  level: number;
  testConfigurationName: string;
  isCompleted: boolean;
  finalScore: number | null;
}

export interface CreateTestSessionRequest {
  name: string;
  date: string;
}

export interface AddGymnastToSessionRequest {
  gymnastId: string;
  testConfigurationId: string;
}

export interface TestConfigurationSummary {
  id: string;
  testTypeName: string;
  version: number;
  exerciseCount: number;
}
