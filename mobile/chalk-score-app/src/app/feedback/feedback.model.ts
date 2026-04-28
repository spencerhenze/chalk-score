export interface SubmitFeedbackRequest {
  type: 'Bug' | 'Feature';
  description: string;
  stepsToReproduce?: string;
  frequency?: 'EveryTime' | 'Intermittent';
  isNewFeature?: boolean;
  currentPage: string;
  consoleErrors?: string;
}
