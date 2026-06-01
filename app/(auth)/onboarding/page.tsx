
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";

// Import all your components
import WelcomePage from "@/components/onboarding/WelcomePage";
import ProfilePicture from "@/components/onboarding/ProfilePicture";
import PrimaryRole from "@/components/onboarding/PrimaryRole";
import IndustryDetails from "@/components/onboarding/Industrydetails";
import WorkspaceSetup from "@/components/onboarding/WorkspaceSetup";
import ReferStep from "@/components/onboarding/ReferStep";
import ThemeStep from "@/components/onboarding/ThemeStep";
import SocialReferral from "@/components/onboarding/SocialReferral";
import BusinessTrial from "@/components/onboarding/BusinessTrial";
import DashboardPage from "@/app/(pages)/dashboard/page";
import { useProfileStore } from "@/stores/profile-store";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { user, fetchUserProfile, updateUserProfile } = useProfileStore();
  const { currentStep, setCurrentStep, updateField, updateMultipleFields } = useOnboardingStore();


  const [isLoading, setIsLoading] = useState(true);

  const STEPS_WITH_DOTS = [1, 2, 3, 4, 5, 6, 7, 8];
  const TOTAL_DOTS_STEPS = STEPS_WITH_DOTS.length;

  // Load progress on mount
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      try {
        await fetchUserProfile(); // fetch from API into profile store
        if (user?.onboardingStep !== undefined) {
          setCurrentStep(user.onboardingStep);
        }
        if (user?.isQuestionnaireCompleted) {
          router.push('/dashboard');
          return;
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
      setIsLoading(false);
    };
    initializeOnboarding();
  }, [isAuthenticated, fetchUserProfile, router]);

  // Handle step navigation with auto-save
  const handleNext = async (fromStep: number) => {
    const nextStep = (fromStep ?? currentStep) + 1;
    console.log("Navigating from step", fromStep, "to step", nextStep);
    if (nextStep <= 8) {
      setCurrentStep(nextStep);
    }
    try {
      await updateUserProfile({ onboardingStep: nextStep });
    } catch (err) {
      console.warn("Failed to persist onboarding step", err);
    }
  };

  const handleBack = (toStep: number) => {
    if (toStep >= 0) {
      setCurrentStep(toStep);
    }
  };

  const handleStepClick = (dotIndex: number) => {
    const actualStep = STEPS_WITH_DOTS[dotIndex];
    if (actualStep <= currentStep + 1) { // Allow access to current step + 1
      setCurrentStep(actualStep);
    }
  };

  // Handle field updates - save directly to profile store/API
  const handleFieldUpdate = async (field: string, value: any) => {
    updateField(field, value);
  };

  const getCurrentDotIndex = () => {
    return STEPS_WITH_DOTS.indexOf(currentStep);
  };

  const shouldShowDots = STEPS_WITH_DOTS.includes(currentStep);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Step 0: Welcome */}
      {currentStep === 0 && (
        <WelcomePage onNext={() => handleNext(0)} />
      )}

      {currentStep === 1 && (
        <ProfilePicture
          onNext={() => handleNext(currentStep)}
          // onBack={() => handleBack(0)}
          showDots={shouldShowDots}
          currentStep={currentStep}
          totalSteps={TOTAL_DOTS_STEPS}
        />
      )}

      {currentStep === 2 && (
        <PrimaryRole
          onNext={() => handleNext(currentStep)}
          onBack={() => handleBack(1)}
          showDots={shouldShowDots}
          currentStep={getCurrentDotIndex()}
          totalSteps={TOTAL_DOTS_STEPS}
          // onStepClick={handleStepClick}
        />
      )}

      {currentStep === 3 && (
        <IndustryDetails
          onNext={() => handleNext(currentStep)}
          onBack={() => handleBack(2)}
          showDots={shouldShowDots}
          currentStep={getCurrentDotIndex()}
          totalSteps={TOTAL_DOTS_STEPS}
          // onStepClick={handleStepClick}
        />
      )}

      {currentStep === 4 && (
        <WorkspaceSetup
          onNext={() => handleNext(currentStep)}
          onBack={() => handleBack(3)}
          showDots={shouldShowDots}
          currentStep={getCurrentDotIndex()}
          totalSteps={TOTAL_DOTS_STEPS}
          // onStepClick={handleStepClick}
        />
      )}

      {currentStep === 5 && (
        <ReferStep
          onNext={() => handleNext(currentStep)}
          onBack={() => handleBack(4)}
          showDots={shouldShowDots}
          currentStep={getCurrentDotIndex()}
          totalSteps={TOTAL_DOTS_STEPS}
          // onStepClick={handleStepClick}
        />
      )}

      {currentStep === 6 && (
        <ThemeStep
          onNext={() => handleNext(currentStep)}
          onBack={() => handleBack(5)}
          showDots={shouldShowDots}
          currentStep={getCurrentDotIndex()}
          totalSteps={TOTAL_DOTS_STEPS}
          // onStepClick={handleStepClick}
        />
      )}

      {currentStep === 7 && (
        <SocialReferral
          onNext={() => handleNext(currentStep)}
          onBack={() => handleBack(6)}
          showDots={shouldShowDots}
          currentStep={getCurrentDotIndex()}
          totalSteps={TOTAL_DOTS_STEPS}
        />
      )}

      {currentStep === 8 && (
        <BusinessTrial
          onNext={() => handleNext(8)}
          onBack={() => handleBack(7)}
        />
      )}

      {currentStep === 9 && <DashboardPage />}
    </>
  );
}