// stores/onboarding-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// import axios from 'axios';
// import type { OnboardingState, QuestionnaireResponse } from '@/types/onboarding.types';
// import { 
//   updateQuestionsRequestSchema, 
//   completeQuestionnaireRequestSchema 
// } from '@/schemas/onboarding-schema';

interface OnboardingData {
  profilePicture?: string;
  name?: string;
  primaryRole?: string;
  industry?: string;
  companySize?: string;
  workspaceName?: string;
  referralSource?: string;
  theme?: string;
  socialLinks?: string[];
  selectedPlan?: string;
  [key: string]: any; //For dyanamic fields
}

interface OnboardingState {
  currentStep: number;
  onboardingData: OnboardingData;

  //Actions
  setCurrentStep: (step: number) => void;
  updateField: (field: string, value: any) => void;
  updateMultipleFields: (fields: Partial<OnboardingData>) => void;
  getOnboardingData: () => OnboardingData;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      onboardingData: {},

      // Set current step
      setCurrentStep: (step: number) => {
        set({ currentStep: step });
      },

      // Update a single field in onboarding data
      updateField: (field: string, value: any) => {
        set((state) => ({
          onboardingData: {
            ...state.onboardingData,
            [field]: value,
          },
        }));
      },

      // Update multiple fields at once
      updateMultipleFields: (fields: Partial<OnboardingData>) => {
        set((state) => ({
          onboardingData: {
            ...state.onboardingData,
            ...fields,
          },
        }));
      },

      // Get all onboarding data
      getOnboardingData: () => {
        return get().onboardingData;
      },

      // Reset onboarding
      resetOnboarding: () => {
        localStorage.removeItem('onboarding-storage');  
      },
    }),
    {
      name: 'onboarding-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist currentStep
      partialize: (state) => ({
        currentStep: state.currentStep,
        onboardingData: state.onboardingData,
      }),
    }
  )
);