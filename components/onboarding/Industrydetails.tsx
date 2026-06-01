"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardBackground from "./OnboardLayout";
import Image from "next/image";
import { useProfileStore } from "@/stores/profile-store"; 
import axios from "axios";

const industryOptions = [
  { label: "Education", icon: "🎓" },
  { label: "Manufacturing", icon: "🏭" },
  { label: "Finance & Account", icon: "💰" },
  { label: "Healthcare", icon: "🏥" },
  { label: "Retail", icon: "🛍️" },
  { label: "Chemicals", icon: "⚗️" },
  { label: "Cybersecurity", icon: "🛡️" },
  { label: "Construction", icon: "🚧" },
  { label: "E-commerce", icon: "🛒" },
  { label: "Software", icon: "💻" },
  { label: "Energy & Utilities", icon: "🔋" },
  { label: "Beauty", icon: "💄" },
  { label: "Logistics", icon: "🚚" },
  { label: "Automotive", icon: "🚗" },
  { label: "Consumer Services", icon: "🛍️" },
  { label: "Aerospace", icon: "🚀" },
  { label: "Others", icon: "✨" },

];

const employeeOptions = ["1 - 10", "11 -25", "26 - 100", "101 - 250", "250+"];

interface IndustryDetailsProps {
  onNext: () => void;
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
  showDots?: boolean;
}

export default function IndustryDetails({
  onNext,
  onBack,
  currentStep = 0,
  totalSteps = 0,
  onStepClick,
  showDots = false,
}: IndustryDetailsProps) {
  // Using Zustand profile store
  const { user, updateUserProfile } = useProfileStore();

  // Local state
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState("");
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const isFormValid = !!selectedIndustry || !!selectedEmployees;

  // Pre-fill existing data from backend
  useEffect(() => {
    if (user) {
      setSelectedIndustry(user.industry || "");
      setSelectedEmployees(user.organizationEmployeeCount || "");
    }
  }, [user]);

  // Save details to backend via updateUserProfile
  const handleNext = async () => {
    if (!isFormValid) return;

    try {
      await updateUserProfile({
        industry: selectedIndustry,
        organizationEmployeeCount: selectedEmployees,
        // onboardingStep: currentStep, // optional for tracking progress
      });

      onNext();
    } catch (error) {
      console.error("Failed to save industry details:", error);
    }
  };

  const handleSkip = async () => {
    try {
      await updateUserProfile({
        industry: "",
        organizationEmployeeCount: "",
        // onboardingStep: currentStep,
      });

      onNext();
    } catch (error) {
      console.error("Failed to skip industry step:", error);
    }
  };

  return (
    <OnboardBackground
      tightTopSpacing
      showDots={showDots}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onStepClick={onStepClick}
      allowClickNavigation={true}
      rightIllustration={
        <Image
          src="/images/onboarding/Industry.svg"
          alt="Onboarding Illustration"
          width={500}
          height={500}
          className="w-full h-full object-cover"
        />
      }
    >
      <div className="w-full max-w-md space-y-6">
        {/* Industry Dropdown */}
        <div className="relative w-full mb-4">
          <label className="block font-semibold text-sm mb-2 text-gray-600 dark:text-gray-300">
            Which industry best describes your organization?
          </label>
          <div
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md h-10 px-3 flex items-center justify-between cursor-pointer"
            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
          >
            <span className="text-sm text-gray-800 dark:text-gray-100">
              {selectedIndustry || "Select organization"}
            </span>
            <span>
              {showIndustryDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>

          {showIndustryDropdown && (
            <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto border-b-4 rounded-b-md border-[#001F3F] shadow bg-white dark:bg-gray-800 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 scrollbar-thin scrollbar-thumb-[#001F3F] scrollbar-track-transparent">
              {industryOptions.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => {
                    setSelectedIndustry(label);
                    setShowIndustryDropdown(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium flex items-center gap-3 transition
                    ${selectedIndustry === label
                      ? "border-[#001F3F] bg-blue-50 dark:bg-blue-900/30 text-[#001F3F] dark:text-white"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    }
                    hover:shadow-sm hover:border-[#001F3F]`}
                >
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employees Dropdown */}
        <div className="relative w-full mb-4">
          <label className="block font-semibold text-sm mb-2 text-gray-600 dark:text-gray-300">
            How many employees does your company have?
          </label>
          <div
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md h-10 px-3 flex items-center justify-between cursor-pointer"
            onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
          >
            <span className="text-sm text-gray-800 dark:text-gray-100">
              {selectedEmployees || "Select size"}
            </span>
            {showEmployeeDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showEmployeeDropdown && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {employeeOptions.map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setSelectedEmployees(range);
                    setShowEmployeeDropdown(false);
                  }}
                  className={`w-full py-3 rounded-lg text-sm font-medium border transition
                    ${selectedEmployees === range
                      ? "bg-[#001F3F] text-white border-[#001F3F]"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    }
                    hover:shadow-sm hover:border-[#001F3F]`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="w-[166px] h-[47px] rounded-[8px] border-gray-300 text-white bg-[#001F3F]"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isFormValid}
            className={`w-[166px] h-[47px] rounded-[8px] ${isFormValid
                ? "bg-[#001F3F] hover:bg-[#01172C] text-white"
                : "bg-gray-300 text-black cursor-not-allowed"
              }`}
          >
            Next
          </Button>
        </div>

        {/* Skip Link */}
        <p
          className="text-xs font-bold text-center text-[#001F3F] underline cursor-pointer"
          onClick={handleSkip}
        >
          Skip For Now
        </p>
      </div>
    </OnboardBackground>
  );
}
