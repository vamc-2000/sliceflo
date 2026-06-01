
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import OnboardBackground from "./OnboardLayout";
import { FaLinkedinIn } from "react-icons/fa";
import Image from "next/image";
import { useProfileStore } from "@/stores/profile-store";

interface SocialReferralProps {
    onNext: () => void;
    onBack: () => void;
    currentStep?: number;
    totalSteps?: number;
    onStepClick?: (step: number) => void;
    showDots?: boolean;
}

export default function SocialReferral({
    onNext,
    onBack,
    currentStep = 0,
    totalSteps = 0,
    onStepClick,
    showDots = false,
}: SocialReferralProps) {
    const { user, updateUserProfile } = useProfileStore();
        
    // Local state management - initialize from store if exists
    const [hasFollowed, setHasFollowed] = useState<boolean>(false);
    
    const isFormValid = hasFollowed;

    const handleLinkedInClick = () => {
        // Set clicked state first
        setHasFollowed(true);
        
        // Open LinkedIn page in new tab
        window.open('https://www.linkedin.com/company/sliceflo/', '_blank');
    };

    const handleNext = async () => {
        if (isFormValid) {
            try {
                await updateUserProfile({linkedIn: hasFollowed});
                onNext();
            } catch (error) {
                console.error("Failed to save industry details:", error);
            }
        }
    };

    const handleSkip = async () => {
        try {
                await updateUserProfile({linkedIn: hasFollowed});
                onNext();
            } catch (error) {
                console.error("Failed to save industry details:", error);
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
                <Image
                    src="/images/onboarding/SociaMedia.svg"
                    alt="Illustration"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                />
            }
        >
            <div className="w-full max-w-md space-y-6">
                {/* Stay Connected Title */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Stay Connected
                </h2>
                
                {/* Subtitle */}
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
                    Choose how you'd like to stay updated with SliceFlo's latest features and best practices.
                </p>

                {/* LinkedIn Follow Box */}
                <div 
                    onClick={handleLinkedInClick}
                    className={`
                        cursor-pointer transition-all duration-200 rounded-xl p-4 w-full
                        ${hasFollowed 
                            ? 'bg-[#F2F2F7] border-b-4 border-[#001F3F] border-t-0 border-l-0 border-r-0' 
                            : 'bg-[#F2F2F7] hover:bg-gray-100'
                        }
                    `}
                >
                    {/* Main Content Row */}
                    <div className="flex items-center gap-3">
                        {/* LinkedIn Icon */}
                        <div className="w-10 h-10 bg-[#0A66C2] rounded-md flex items-center justify-center flex-shrink-0">
                            <FaLinkedinIn className="text-white" size={16} />
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                Follow us on LinkedIn @SliceFlo
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Stay up-to-date on new features and best practices
                            </p>
                        </div>
                        
                        {/* Profile Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">SF</span>
                            </div>
                        </div>
                        
                        {/* Success Checkmark */}
                        {hasFollowed && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                    
                    {/* Bottom Row - User Count */}
                    <div className="flex items-center gap-1 mt-3 ml-13">
                        <span className="text-xs">🎉</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Join 12,000+ users following @SliceFlo
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between mt-8">
                    <Button
                        onClick={onBack}
                        variant="outline"
                        className="w-36 h-12 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!isFormValid}
                        className={`w-36 h-12 rounded-lg flex items-center justify-center gap-2 ${
                            isFormValid
                                ? "bg-[#001F3F] hover:bg-[#01172C] text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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




//  previous UI code
// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import OnboardBackground from "./OnboardLayout";
// import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
// import Image from "next/image";
// import { useOnboardingStore } from "@/stores/onboarding-store";

// const options = [
//     { label: "Search Engine", desc: "Google, Bing", icon: "🔍" },
//     { label: "Software sites", desc: "Capterra, GetApp", icon: "💻" },
//     { label: "Video Ad", desc: "YouTube, Vimeo, TV", icon: "📺" },
//     { label: "Audio Ad", desc: "Spotify, Podcast", icon: "🎧" },
//     {
//         label: "LinkedIn",
//         desc: "",
//         icon: <FaLinkedinIn className="text-[#0A66C2]" size={18} />,
//     },
//     {
//         label: "Facebook",
//         desc: "",
//         icon: <FaFacebookF className="text-[#1877F2]" size={18} />,
//     },
//     {
//         label: "Instagram",
//         desc: "",
//         icon: <FaInstagram className="text-[#E1306C]" size={18} />,
//     },
//     { label: "Friend / Colleague", desc: "", icon: "👥" },
// ];

// interface SocialReferralProps {
//     onNext: () => void;
//     onBack: () => void;
//     currentStep?: number;
//     totalSteps?: number;
//     onStepClick?: (step: number) => void;
//     showDots?: boolean;
//     onQuestionUpdate?: (questionId: string, answer: string) => Promise<void>;
// }

// export default function SocialReferral({
//     onNext,
//     onBack,
//     currentStep = 0,
//     totalSteps = 0,
//     onStepClick,
//     showDots = false,
//     onQuestionUpdate,
// }: SocialReferralProps) {
//     // Use onboarding store instead of profile store
//     const { updateQuestion } = useOnboardingStore();
    
//     // Local state management
//     const [selectedOption, setSelectedOption] = useState<string>("");
    
//     const isFormValid = !!selectedOption;

//     const handleOptionSelect = (option: string) => {
//         setSelectedOption(option);
//     };

//     const handleNext = async () => {
//         if (isFormValid) {
//             const referralData = {
//                 referralType: selectedOption,
//                 refferalType: selectedOption, // Keep both spellings for compatibility
//                 selectedReferral: selectedOption,
//                 completedAt: new Date().toISOString(),
//             };

//             // Save to onboarding store
//             updateQuestion('social-referrals', JSON.stringify(referralData));

//             // Call the onQuestionUpdate prop if provided (for auto-save to backend)
//             if (onQuestionUpdate) {
//                 await onQuestionUpdate('social-referrals', JSON.stringify(referralData));
//             }

//             onNext();
//         }
//     };

//     const handleSkip = async () => {
//         const skipData = {
//             skipped: true,
//             completedAt: new Date().toISOString(),
//         };

//         // Save skip to onboarding store
//         updateQuestion('social-referrals', JSON.stringify(skipData), true);

//         // Call the onQuestionUpdate prop if provided
//         if (onQuestionUpdate) {
//             await onQuestionUpdate('social-referrals', JSON.stringify(skipData));
//         }

//         onNext();
//     };

//     return (
//         <OnboardBackground
//             tightTopSpacing
//             showDots={showDots}
//             currentStep={currentStep}
//             totalSteps={totalSteps}
//             onStepClick={onStepClick}
//             allowClickNavigation={true}
//             rightIllustration={
//                 <Image
//                     src="/images/onboarding/SociaMedia.svg"
//                     alt="Illustration"
//                     width={500}
//                     height={500}
//                     className="w-full h-full object-cover"
//                 />
//             }
//         >
//             <div className="w-full max-w-md space-y-6">
//                 <div className="mb-4">
//                     <label className="block font-semibold text-sm mb-3 text-gray-600 dark:text-gray-300">
//                         How did you hear about us?
//                     </label>

//                     {/* Referral Options Grid */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                         {options.map(({ label, desc, icon }) => (
//                             <button
//                                 key={label}
//                                 onClick={() => handleOptionSelect(label)}
//                                 className={`w-full text-left p-4 rounded-xl transition flex items-start gap-3 hover:shadow-md
//                                     ${selectedOption === label
//                                         ? "border-b-[4px] border-[#001F3F] border-t-0 border-l-0 border-r-0 rounded-b-xl shadow-[0px_-4px_8px_rgba(0,0,0,0.05),-4px_0px_8px_rgba(0,0,0,0.05),4px_0px_8px_rgba(0,0,0,0.05)]"
//                                         : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-[#001F3F]/50"
//                                     }
//                                     hover:text-gray-800 dark:hover:text-gray-100`}
//                             >
//                                 <span className="text-xl flex-shrink-0">{icon}</span>
//                                 <div>
//                                     <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{label}</p>
//                                     {desc && (
//                                         <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{desc}</p>
//                                     )}
//                                 </div>
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex justify-between mt-4">
//                     <Button
//                         onClick={onBack}
//                         variant="outline"
//                         className="w-[166px] h-[47px] rounded-[8px] border-gray-300 text-white bg-[#001F3F]"
//                     >
//                         Back
//                     </Button>
//                     <Button
//                         onClick={handleNext}
//                         disabled={!isFormValid}
//                         className={`w-[166px] h-[47px] rounded-[8px] ${
//                             isFormValid
//                                 ? "bg-[#001F3F] hover:bg-[#01172C] text-white"
//                                 : "bg-gray-300 text-black cursor-not-allowed"
//                         }`}
//                     >
//                         Next
//                     </Button>
//                 </div>

//                 {/* Skip Link */}
//                 <p 
//                     className="text-xs font-bold text-center text-[#001F3F] underline cursor-pointer" 
//                     onClick={handleSkip}
//                 >
//                     Skip For Now
//                 </p>
//             </div>
//         </OnboardBackground>
//     );
// }