"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardBackground from "./OnboardLayout";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { useAuthStore } from "@/stores/auth-store";
import { getAutoDetectData } from "@/utils/device-info";
import { Loader2 } from "lucide-react";

interface WorkspaceSetupProps {
  onNext: () => void;
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
  showDots?: boolean;
}

export default function WorkspaceSetup({
  onNext,
  onBack,
  currentStep = 0,
  totalSteps = 0,
  onStepClick,
  showDots = false,
}: WorkspaceSetupProps) {
  const { currentWorkspace, addWorkspace, updateWorkspace, setCurrentWorkspace } =
    useWorkspaceStore();

  const { postDefaultWorkspace } = useProfileStore();
  const { refreshToken } = useAuthStore();

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [workspaceUrl, setWorkspaceUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = workspaceName.trim().length >= 3;

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 30);

  // Prefill data if workspace already exists
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name || "");
      setWorkspaceUrl(slugify(currentWorkspace.name || ""));
    }
  }, [currentWorkspace]);

  // Auto-generate URL slug when workspace name changes
  useEffect(() => {
    if (!currentWorkspace) {
      setWorkspaceUrl(slugify(workspaceName));
    }
  }, [workspaceName]);

  // const handleNext = async () => {
  //   if (!isFormValid) return;

  //   try {
  //     if (currentWorkspace?.id) {
  //       // Update existing workspace
  //       console.log("Updating workspace:", currentWorkspace.id);
  //       await updateWorkspace(currentWorkspace.id!, {
  //         name: workspaceName,
  //         //   url: workspaceUrl,
  //       });
  //       // Also set default if needed (optional)
  //       await postDefaultWorkspace({ workspaceId: currentWorkspace.id! });
  //     } else {
  //       // Create a new workspace
  //       console.log("Creating new workspace:", workspaceName);
  //       const newWorkspace = await addWorkspace({
  //         name: workspaceName,
  //         url: workspaceUrl,
  //       } as any);

  //       // Optionally, set this workspace as current
  //       if (newWorkspace?.id) {
  //         setCurrentWorkspace(newWorkspace);

  //         //Also call default workspace API here
  //         await postDefaultWorkspace({ workspaceId: newWorkspace.id });
  //       }

  //       const data = await getAutoDetectData();
  //       const currentUser = useAuthStore.getState().user;
  //       const response = await refreshToken(data);
  //       const token = response.token;
  //       useAuthStore.getState().setCredentials({
  //         token,
  //         user: currentUser ?? undefined
  //       });
  //     }

  //     onNext();
  //   } catch (error) {
  //     console.error("Failed to save workspace:", error);
  //   }
  // };

  const handleNext = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    try {
      if (currentWorkspace?.id) {
        // Update existing workspace
        await updateWorkspace(currentWorkspace.id!, {
          name: workspaceName,
        });

        await postDefaultWorkspace({ workspaceId: currentWorkspace.id! });
      } else {
        // Create new workspace
        const newWorkspace = await addWorkspace({
          name: workspaceName,
          url: workspaceUrl,
        } as any);

        if (newWorkspace?.id) {
          setCurrentWorkspace(newWorkspace);

          await postDefaultWorkspace({
            workspaceId: newWorkspace.id,
          });
        }

        const data = await getAutoDetectData();
        const currentUser = useAuthStore.getState().user;

        const response = await refreshToken(data);

        const token = response.token;

        useAuthStore.getState().setCredentials({
          token,
          user: currentUser ?? undefined,
        });
      }

      onNext();
    } catch (error) {
      console.error("Failed to save workspace:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <OnboardBackground
      showDots={showDots}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onStepClick={onStepClick}
      allowClickNavigation={true}
      rightIllustration={
        <Image
          src="/images/onboarding/Workspacename.svg"
          alt="Workspace Illustration"
          width={500}
          height={500}
          className="w-full h-full object-cover"
        />
      }
    >
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-6">
          {/* Workspace Name Input */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
              What would you want to name your Workspace?
            </label>
            <Input
              type="text"
              placeholder="Enter workspace name (min 3 characters)"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full text-[#001F3F] text-sm bg-transparent border-0 border-b border-gray-300 rounded-none focus:outline-none focus:ring-0 focus:border-[#001F3F] placeholder:text-gray-400"
            />
            {!isFormValid && (
              <p className="text-red-500 text-xs mt-1">
                Workspace name must be at least 3 characters
              </p>
            )}
          </div>

          {/* Workspace URL Display */}
          <div className="mt-6">
            <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
              Workspace URL
            </label>

            <div className="flex items-center text-sm border-b border-gray-300 focus-within:border-[#001F3F]">
              <span className="text-gray-500 dark:text-gray-400">sliceflo.app/</span>
              <Input
                type="text"
                value={workspaceUrl}
                // onChange={(e) => setWorkspaceUrl(e.target.value)}
                readOnly
                className="flex-1 text-[#001F3F] bg-transparent px-1 py-1 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="w-[166px] h-[47px] rounded-[8px] border-gray-300 bg-[#001F3F] text-white dark:text-white"
            >
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isFormValid || isLoading}
              className={`w-[166px] h-[47px] rounded-[8px] ${isFormValid && !isLoading
                ? "bg-[#001F3F] hover:bg-[#01172C] text-white"
                : "bg-gray-300 text-black cursor-not-allowed"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </div>
    </OnboardBackground>
  );
}
