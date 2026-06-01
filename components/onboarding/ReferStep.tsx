"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OnboardBackground from "./OnboardLayout";
import { Mail } from "lucide-react";
import Lottie from "lottie-react";
import themeAnimation from "@/public/images/onboarding/refer/animations/5dec81c6-4c90-4a93-8f98-ac5c0d439e25.json";
import { useProfileStore } from "@/stores/profile-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface ReferProps {
    onNext: () => void;
    onBack: () => void;
    currentStep?: number;
    totalSteps?: number;
    onStepClick?: (step: number) => void;
    showDots?: boolean;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReferStep({
    onNext,
    onBack,
    currentStep = 0,
    totalSteps = 0,
    onStepClick,
    showDots = false,
}: ReferProps) {
    const { currentWorkspace, addMembersToWorkspace } = useWorkspaceStore();

    // Local state management
    const [emails, setEmails] = useState<string[]>(["", "", ""]);
    const [errors, setErrors] = useState<string[]>(["", "", ""]);

    const validateEmails = () => {
        const newErrors = emails.map((email) =>
            email && !emailRegex.test(email) ? "*Enter valid email" : ""
        );
        setErrors(newErrors);
        return newErrors.every((err) => err === "");
    };

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...emails];
        const newErrors = [...errors];

        newEmails[index] = value;

        // Live validate this field only
        newErrors[index] = value && !emailRegex.test(value) ? "*Enter valid email" : "";

        setEmails(newEmails);
        setErrors(newErrors);
    };

    const isFormValid =
        emails.some((email) => email.trim() && emailRegex.test(email.trim())) &&
        errors.every((err) => err === "");

    const handleNext = async () => {
        if (validateEmails()) {
            const validEmails = emails.filter((email) => emailRegex.test(email.trim()));

            // Save to profile store
            if (currentWorkspace?.id) {
                const members = validEmails.map((email) => ({
                    userId: email, // backend has 'userId', but sending email
                    role: "member",
                }));

                await addMembersToWorkspace(currentWorkspace.id, members);
            }
            onNext();
        }
    };

    const handleSkip = async () => {
        // If user skips, set referalSource to empty array
        if (currentWorkspace?.id) {
            await addMembersToWorkspace(currentWorkspace.id, []);
        }

        onNext();
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
                    className="w-full h-full object-cover bg-[#E0EFFF]"
                />
            }
        >
            <div className="w-full max-w-md space-y-6">
                <h2 className="text-base font-semibold text-[#001F3F]">
                    Hurray! You've successfully created your first project.
                </h2>
                <p className="text-sm font-medium text-[#001F3F]">
                    Invite your team mate for more easy collaboration
                </p>

                {/* Email inputs */}
                <div className="space-y-3">
                    {emails.map((email, idx) => (
                        <div key={idx}>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="name@workemail.com"
                                    value={email}
                                    className="pl-10 h-10 border-gray-300 focus:border-[#001F3F] focus:ring-[#001F3F]"
                                    onChange={(e) => handleEmailChange(idx, e.target.value)}
                                    onBlur={validateEmails}
                                />
                            </div>
                            {errors[idx] && (
                                <p className="text-sm text-red-500 mt-1">{errors[idx]}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between mt-6">
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
                    className="text-xs font-bold text-center text-[#001F3F] underline cursor-pointer mt-4"
                    onClick={handleSkip}
                >
                    Skip For Now
                </p>
            </div>
        </OnboardBackground>
    );
}
