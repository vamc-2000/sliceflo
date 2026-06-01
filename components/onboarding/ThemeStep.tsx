"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import OnboardBackground from "./OnboardLayout";
import Image from "next/image";
import Lottie from "lottie-react";
import themeAnimation from "@/public/images/onboarding/ThemeSelection/animations/6c63e71a-cca9-47ff-9cf2-3212a8dfd230.json";
import { useProfileStore } from "@/stores/profile-store";

interface ThemeStepProps {
    onNext: () => void;
    onBack: () => void;
    currentStep?: number;
    totalSteps?: number;
    onStepClick?: (step: number) => void;
    showDots?: boolean;
}

export type ThemeType = "light" | "dark" | "default";

const themeOptions = [
    { value: "light", label: "Light Mode", image: "/themes/light.svg" },
    { value: "dark", label: "Dark Mode", image: "/themes/dark.svg" },
    { value: "default", label: "Default", image: "/themes/default.svg" },
];

export default function ThemeStep({
    onNext,
    onBack,
    currentStep = 0,
    totalSteps = 0,
    onStepClick,
    showDots = false,
}: ThemeStepProps) {
    const { user, updateUserProfile } = useProfileStore();

    // Local state management - initialize from store if exists
    const [selectedTheme, setSelectedTheme] = useState<ThemeType>("default");

    const isFormValid = !!selectedTheme;

    const handleNext = async () => {
        console.log("Theme selected:", selectedTheme);

        // Save to onboarding store only - no API call yet
        try {
            await updateUserProfile({
                displaySettings: {
                    ...(user?.displaySettings || {}),
                    theme: selectedTheme,
                },
            });

            onNext();
        } catch (error) {
            console.error("Failed to save industry details:", error);
        }
    };

    const handleSkip = async () => {
        try {
            await updateUserProfile({
                displaySettings: { theme: "default" },
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
                <Lottie
                    animationData={themeAnimation}
                    loop
                    className="w-full h-full object-cover bg-[rgba(242,210,53,0.21)]"
                />
            }
        >
            <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#001F3F] text-center">Choose Theme</h2>

                {/* Theme Options */}
                <div className="flex flex-row gap-[19px] w-full justify-center">
                    {themeOptions.map(({ value, label, image }) => {
                        const isSelected = selectedTheme === value;

                        return (
                            <div
                                key={value}
                                onClick={() => {
                                    console.log("Theme selected:", value);
                                    setSelectedTheme(value as ThemeType);
                                }}
                                className="flex flex-col items-center gap-[10px] w-[140px] cursor-pointer"
                            >
                                <div
                                    className={`p-2 rounded-md bg-white dark:bg-gray-900 shadow-[0_4px_14px_rgba(0,0,0,0.14)] flex justify-center items-center transition-all hover:shadow-lg
                                        ${isSelected ? "border-b-[4px] border-[#001F3F] pb-2 pt-2 rounded-b-xl" : "hover:border-[#001F3F]/50"}
                                    `}
                                >
                                    <div className="relative w-[120px] h-[64px]">
                                        <Image
                                            src={image}
                                            alt={label}
                                            fill
                                            className="object-contain rounded-md"
                                        />
                                    </div>
                                </div>
                                <p className="font-inter font-normal text-xs leading-[15px] text-center text-[#001F3F] dark:text-white">
                                    {label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-4">
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
