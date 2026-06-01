"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";

const businessFeatures = [
  { feature: "Unlimited Seats", available: true },
  { feature: "Initiatives and Epics", available: true },
  { feature: "Custom workflows and approvals", available: true },
  { feature: "Dashboards and analytics", available: true },
  { feature: "Teamspaces and shared pages", available: true },
  { feature: "Time tracking and reports", available: true },
];

const freeFeatures = [
  { feature: "12 Seats", available: false },
  { feature: "Work items only", available: false },
  { feature: "Default workflow", available: false },
  { feature: "No insights", available: false },
  { feature: "No collaboration", available: false },
  { feature: "No tracking", available: false },
];

interface BusinessTrialProps {
  onNext: () => void;
  onBack: () => void;
}

export default function BusinessTrial({
  onNext,
  onBack,
}: BusinessTrialProps) {
  const router = useRouter();
  // const { user } = useAuthStore();
  const { user, updateUserProfile } = useProfileStore();
  const {currentWorkspace, workspaces} = useWorkspaceStore(); 

  const workspaceName = workspaces?.[0]?.name || "Your Workspace";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const userName = user?.name || "User";
  const userEmail = user?.email || sessionStorage.getItem("signupEmail") || "user@example.com";

  const handleFinish = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    
    try {
      
      const result = await updateUserProfile({isQuestionnaireCompleted: true});

      if (result.success) {
        console.log("Onboarding completed successfully");
        
        // Navigate to dashboard
        router.push("/dashboard");
      } else {
        // console.error("Failed to complete onboarding:", result.message);
        console.error("Failed to complete onboarding:");
        alert("Failed to save your onboarding data. Please try again.");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("An error occurred while saving your data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-b from-white to-[#F4A262] p-2 sm:p-4 lg:p-8">
      <div className="w-full max-w-[1400px] h-auto min-h-[700px] lg:min-h-[600px] bg-[#001F3F] rounded-xl border-2 border-blue-600 shadow-2xl p-4 sm:p-6 lg:p-8 xl:p-10">
        <div className="w-full h-full flex flex-col lg:flex-row gap-4 lg:gap-8">

          {/* Left Content */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {/* Logo */}
            <div className="mb-4 lg:mb-6">
              <Image
                src="/images/onboarding/Circlelogo.svg"
                alt="SliceFlo Logo"
                width={48}
                height={48}
                className="h-8 sm:h-10 lg:h-12 w-auto"
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium text-white">
                  SliceFlo <span className="font-bold text-orange-400">Business</span>
                </h1>

                <h2 className="text-sm sm:text-base lg:text-lg text-white">
                  Your trial is active now!
                </h2>

                <p className="text-xs sm:text-sm text-gray-400 max-w-xs sm:max-w-sm">
                  Unlock your team&apos;s full potential for 14 days
                </p>
              </div>

              {/* Business Illustration */}
              <div className="my-2 sm:my-4 lg:my-6">
                <Image
                  src="/images/onboarding/Business.svg"
                  alt="Business Plan Illustration"
                  width={300}
                  height={300}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-contain mx-auto"
                  priority
                />
              </div>

              <p className="text-xs sm:text-sm text-gray-400 max-w-xs sm:max-w-sm">
                You can use free plan after your trial ends
              </p>
            </div>
          </div>

          {/* Right Content */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="text-left">
              <h3 className="text-white text-base sm:text-lg font-medium">
                Features you&apos;ll get with Business plan
              </h3>
            </div>

            {/* User Profile Card */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user?.profilePictureUrl ? (
                    <Image
                      src={user.profilePictureUrl}
                      alt={userName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm">
                    {userName}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {userEmail}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm ml-0">
                <span className="font-medium text-white">{workspaceName}</span> workspace with Business
              </p>
            </div>

            {/* Feature Comparison */}
            <div className="relative w-full">
              <div className="bg-[#84848440] rounded-lg p-2 w-full shadow-lg">
                <div className="flex">
                  {/* Free Plan Content */}
                  <div className="w-2/5 px-4 pt-4">
                    <h4 className="text-white font-semibold text-sm mb-6">Free</h4>
                    <div className="space-y-4">
                      {freeFeatures.map((feature, index) => (
                        <div key={index} className="text-sm text-white">
                          {feature.feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business Plan */}
                  <div className="w-3/5 bg-[#FFD5B4] rounded-lg p-4 shadow-lg">
                    <h4 className="text-[#001F3F] font-semibold text-sm mb-6">Business</h4>
                    <div className="space-y-3">
                      {businessFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-[#001F3F] font-bold">→</span>
                          <span className="text-[#001F3F] font-medium leading-relaxed">
                            {feature.feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="pt-4 space-y-3">
              <Button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="w-full font-semibold py-4 px-6 rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "#FF8D28",
                  color: "#001F3F",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)"
                }}
              >
                {isSubmitting ? "Saving..." : "Flow in SliceFlo using Business features"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
