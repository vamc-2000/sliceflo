// app/(auth)/onboarding/onboardBackground.tsx
"use client";

import { ReactNode } from "react";
import FinalLogo from "@/public/images/FinalLogo";

interface Props {
    children: ReactNode;
    rightIllustration?: ReactNode;
    tightTopSpacing?: boolean;
    showDots?: boolean;
    currentStep?: number;
    totalSteps?: number;
    onStepClick?: (step: number) => void;
    allowClickNavigation?: boolean;
}

export default function OnboardBackground({
    children,
    rightIllustration,
    tightTopSpacing,
    showDots = false,
    currentStep = 0,
    totalSteps = 0,
    onStepClick,
    allowClickNavigation = true,
}: Props) {
    return (
        <div className="flex w-full h-screen">
            {/* Left Section */}
            <div className="w-1/2 flex flex-col h-full">
                <div className="mt-8 ml-6">
                    <FinalLogo className="h-[50px] w-auto" />
                </div>

                <div className="flex flex-col h-[80%] justify-between">

                {/* Content Below Logo */}
                <div
                    className={`overflow-y-auto flex flex-col h-full items-center justify-start mb-6 ${tightTopSpacing ? "pt-4" : "pt-10"} px-4`}
                >
                    {children}
                </div>
                {/* Step Dots - Positioned exactly like in your screenshots */}
                {showDots && totalSteps > 0 && (
                    <div className="w-full">
                        <div className="flex justify-center items-center gap-2">
                            {Array.from({ length: totalSteps }, (_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        console.log(`Dot ${index} clicked`);
                                        if (allowClickNavigation && onStepClick) {
                                            onStepClick(index);
                                        }
                                    }}
                                    disabled={!allowClickNavigation}
                                    className={`${currentStep === index ? "w-3 h-3" : "w-2 h-2"
                                        } rounded-full transition-all duration-300  ${currentStep === index ? "bg-gray-700" : "bg-gray-300"
                                        } ${allowClickNavigation ? "cursor-pointer" : "cursor-default"}`}
                                    aria-label={`Step ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
                </div>

            </div>

            {/* Right Section (Illustration) */}
            <div className="flex w-1/2 bg-transparent h-full">{rightIllustration}</div>
        </div>
    );
}
