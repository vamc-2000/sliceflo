// types/onboarding.types.ts
export interface QuestionnaireResponse {
  questionId: string;
  answer: string;
  skipped?: boolean;
}

export interface OnboardingState {
  // Backend matching data
  userId?: string;
  responses: QuestionnaireResponse[];
  status: 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  lastUpdatedAt?: string;
  completedAt?: string;
  
  // UI state
  currentStep: number;
  isOnboardingStarted: boolean;
  
  // Actions
  updateQuestion: (questionId: string, answer: string, skipped?: boolean) => void;
  setCurrentStep: (step: number) => void;
  // saveProgress: () => Promise<{ success: boolean; message: string }>;
  completeQuestionnaire: () => Promise<{ success: boolean; message: string }>;
  loadProgress: () => Promise<void>;
  resetOnboarding: () => void;
  getProgress: () => { completed: number; total: number; percentage: number };
}

export interface UpdateQuestionsRequest {
  questions: Record<string, any>;
  isQuestionnaireCompleted?: boolean;
}

export interface CompleteQuestionnaireRequest {
  responses: QuestionnaireResponse[];
  status: 'completed';
  completedAt: string;
}
