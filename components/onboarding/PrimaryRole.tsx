"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import OnboardBackground from "./OnboardLayout";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useProfileStore } from "@/stores/profile-store";

interface PrimaryRoleProps {
    onNext: () => void;
    onBack: () => void;
    currentStep?: number;
    totalSteps?: number;
    onStepClick?: (step: number) => void;
    showDots?: boolean;
}

export default function PrimaryRole({
    onNext,
    onBack,
    currentStep = 0,
    totalSteps = 0,
    onStepClick,
    showDots = false,
}: PrimaryRoleProps) {

    const { user, updateUserProfile, fetchUserProfile } = useProfileStore();

    // Local state management
    const [primaryRole, setPrimaryRole] = useState<string>("");
    const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>("");

    const [showObjectives, setShowObjectives] = useState(false);
    const [showTeams, setShowTeams] = useState(false);

    const objectiveRef = useRef<HTMLDivElement>(null);
    const teamRef = useRef<HTMLDivElement>(null);

    const roleOptions = [
        "Individual - I work on more than one project",
        "Manager - I largely manage people",
        "Project Manager - I plan work for my teams",
        "Leadership - I lead large function in my organisation",
    ];

    useEffect(() => {
        fetchUserProfile(); // refetch from backend
    }, []);

    useEffect(() => {
        if (user) {
            setPrimaryRole(user.primaryRole || "");
            setSelectedObjectives(user.objective || []);
            setSelectedTeam(user.department || "");
        }
    }, [user]);


    const toggleSelection = (
        item: string,
        selectedList: string[],
        setter: React.Dispatch<React.SetStateAction<string[]>>,
    ) => {
        setter(selectedList.includes(item) ? selectedList.filter((v) => v !== item) : [...selectedList, item]);
    };

    // Handle single selection for team (radio button behavior)
    const handleTeamSelect = (team: string) => {
        setSelectedTeam(team);
        setShowTeams(false); // Close dropdown after selection
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (objectiveRef.current && !objectiveRef.current.contains(e.target as Node)) setShowObjectives(false);
        if (teamRef.current && !teamRef.current.contains(e.target as Node)) setShowTeams(false);
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isFormValid = !!primaryRole || selectedObjectives.length > 0 || !!selectedTeam;

    // const handleNext = async () => {
    const handleNext = async () => {
        if (!isFormValid) return;

        try {
            // Prepare payload
            const payload = {
                jobRole: primaryRole,
                objective: selectedObjectives,
                department: selectedTeam,
                //   onboardingStep: currentStep, // optional but useful for tracking
            };

            // Save to backend
            await updateUserProfile(payload);

            // Move to next step
            onNext();
        } catch (error) {
            console.error("Failed to save onboarding data:", error);
        }
    };

    const handleSkip = async () => {
        //Mark this step as skipped
        try {
            await updateUserProfile({
                primaryRole: "",
                objective: [],
                department: "",
                //   onboardingStep: currentStep,
            });

            onNext();
        } catch (error) {
            console.error("Failed to skip onboarding step:", error);
        }
    };

    return (
        <OnboardBackground
            showDots={showDots}
            currentStep={currentStep}
            totalSteps={totalSteps}
            onStepClick={onStepClick}
            allowClickNavigation={true}
            tightTopSpacing
            rightIllustration={
                <div className="w-full h-full flex items-center justify-center">
                    <Image
                        src="/images/onboarding/PrimaryRole.svg"
                        alt="Onboarding Illustration"
                        width={500}
                        height={500}
                        className="w-full h-full object-cover"
                    />
                </div>
            }
        >
            <div className="w-full max-w-md space-y-6">
                {/* Primary Role Selection */}
                <div className="w-full">
                    <label className="block font-semibold text-sm mb-2 mt-2">What is your primary role?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                        {roleOptions.map((item) => {
                            const [title, desc] = item.split(" - ");
                            const isSelected = primaryRole === item;

                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setPrimaryRole(item)}
                                    className={`w-full h-[90px] flex flex-col items-center justify-center text-center p-3 transition rounded-xl
                                        ${isSelected
                                            ? "border-b-[4px] border-[#001F3F] border-t-0 border-l-0 border-r-0 rounded-b-xl shadow-[0px_-4px_8px_rgba(0,0,0,0.05),-4px_0px_8px_rgba(0,0,0,0.05),4px_0px_8px_rgba(0,0,0,0.05)]"
                                            : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                        }
                                        hover:text-gray-800 dark:text-gray-100`}
                                >
                                    <div className="font-semibold text-sm">{title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-300">{desc}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Objectives Dropdown */}
                <div className="relative" ref={objectiveRef}>
                    <label className="block font-semibold text-sm mb-2">
                        What is your main objective in using SliceFlo?
                    </label>
                    <div
                        onClick={() => setShowObjectives(!showObjectives)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md h-10 px-3 flex items-center justify-between text-sm cursor-pointer bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    >
                        {selectedObjectives.length > 0 ? selectedObjectives.join(", ") : "Select objectives"}
                        <span>{showObjectives ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                    </div>

                    {showObjectives && (
                        <div className="absolute z-10 mt-1 w-full border-b-4 rounded-b-md border-[#001F3F] shadow bg-white dark:bg-gray-800 p-3 space-y-4 max-h-[272px] overflow-y-auto">
                            {/* Planning */}
                            <div className="ml-3">
                                <p className="text-sm font-bold text-[#001F3F] mb-2">📦 Planning</p>
                                <div className="space-y-2 pl-4">
                                    {[
                                        "Strategic planning",
                                        "Organizational planning",
                                        "Content calendar management",
                                        "Goal management",
                                    ].map((item) => (
                                        <div key={item} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`planning-${item}`}
                                                checked={selectedObjectives.includes(item)}
                                                onCheckedChange={() =>
                                                    toggleSelection(item, selectedObjectives, setSelectedObjectives)
                                                }
                                                className="accent-[#001F3F]"
                                            />
                                            <label
                                                htmlFor={`planning-${item}`}
                                                className="text-sm cursor-pointer text-gray-800 dark:text-gray-100"
                                            >
                                                {item}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Execution */}
                            <div className="ml-3">
                                <p className="text-sm font-bold text-[#001F3F] mb-2">🚀 Execution</p>
                                <div className="space-y-2 pl-4">
                                    {[
                                        "Campaign management",
                                        "Project management",
                                        "Portfolio management",
                                        "Work intake",
                                        "Work review & approval",
                                        "Product or program launch",
                                        "Event planning",
                                    ].map((item) => (
                                        <div key={item} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`execution-${item}`}
                                                checked={selectedObjectives.includes(item)}
                                                onCheckedChange={() =>
                                                    toggleSelection(item, selectedObjectives, setSelectedObjectives)
                                                }
                                                className="accent-[#001F3F]"
                                            />
                                            <label
                                                htmlFor={`execution-${item}`}
                                                className="text-sm cursor-pointer text-gray-800 dark:text-gray-100"
                                            >
                                                {item}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Onboarding & Admin */}
                            <div className="pl-3">
                                <p className="text-sm font-bold text-[#001F3F] mb-2">👥 Onboarding & Admin</p>
                                <div className="space-y-2 pl-4">
                                    {["Employee onboarding"].map((item) => (
                                        <div key={item} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`admin-${item}`}
                                                checked={selectedObjectives.includes(item)}
                                                onCheckedChange={() =>
                                                    toggleSelection(item, selectedObjectives, setSelectedObjectives)
                                                }
                                                className="accent-[#001F3F]"
                                            />
                                            <label
                                                htmlFor={`admin-${item}`}
                                                className="text-sm cursor-pointer text-gray-800 dark:text-gray-100"
                                            >
                                                {item}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Team Dropdown */}
                <div className="relative" ref={teamRef}>
                    <label className="block font-semibold text-sm mb-2">Which division/department are you on?</label>
                    <div
                        onClick={() => setShowTeams(!showTeams)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md h-10 px-3 flex items-center justify-between text-sm cursor-pointer bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    >
                        {selectedTeam || "Select department"}
                        <span>{showTeams ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                    </div>

                    {showTeams && (
                        <div className="absolute z-10 mt-1 w-full border-b-4 rounded-b-md border-[#001F3F] shadow bg-white dark:bg-gray-800 p-3 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-54 overflow-y-auto">
                            {/* Business Teams */}
                            <div className="ml-4">
                                <p className="text-sm font-bold text-[#001F3F] mb-2">📂 Business Teams</p>
                                <div className="space-y-2 pl-3">
                                    {[
                                        "Marketing",
                                        "HR & Recruiting",
                                        "Finance",
                                        "Sales & Accounting",
                                        "Operations",
                                        "Customer Service",
                                        "Account Management",
                                        "Content Creation",

                                    ].map((team) => (
                                        <div key={team} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`business-${team}`}
                                                name="department"
                                                checked={selectedTeam === team}
                                                onChange={() => handleTeamSelect(team)}
                                                className="w-4 h-4 text-[#001F3F] border-gray-300 focus:ring-[#001F3F] cursor-pointer"
                                            />
                                            <label
                                                htmlFor={`business-${team}`}
                                                className="text-sm text-gray-800 dark:text-gray-100 cursor-pointer"
                                            >
                                                {team}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Technical Teams */}
                            <div>
                                <p className="text-sm font-bold text-[#001F3F] mb-2">🧪 Technical Teams</p>
                                <div className="space-y-2 pl-4">
                                    {[
                                        "Product & Design",
                                        "IT & Engineering & Support",
                                        "Logistics",
                                        "Supply Chain",
                                        "Development",
                                        "Others",
                                    ].map((team) => (
                                        <div key={team} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`technical-${team}`}
                                                name="department"
                                                checked={selectedTeam === team}
                                                onChange={() => handleTeamSelect(team)}
                                                className="w-4 h-4 text-[#001F3F] border-gray-300 focus:ring-[#001F3F] cursor-pointer"
                                            />
                                            <label
                                                htmlFor={`technical-${team}`}
                                                className="text-sm text-gray-800 dark:text-gray-100 cursor-pointer"
                                            >
                                                {team}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
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

                <p
                    onClick={handleSkip}
                    className="text-xs font-bold text-center text-[#001F3F] underline cursor-pointer"
                >
                    Skip For Now
                </p>
            </div>
        </OnboardBackground>
    );
}
