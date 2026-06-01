// app/(pages)/teams/page.tsx
"use client";

import { useState, useEffect } from "react";
import { LandingPage } from "@/components/LandingPage";
import { useRouter } from "next/navigation";
// import { CreateNewTeam } from "@/components/teams/CreateNewTeam";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CreateNewTeam } from "@/components/teams/CreateNewTeam";
import { Separator } from "@/components/ui/separator";
import { LandingPageForTeams } from "@/components/teams/LandingPageForTeams";
import { useTeamStore } from "@/stores/teams-store";

export default function TeamsPage() {
  const router = useRouter();
  const { teams } = useTeamStore();
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  useEffect(() => {
    if (teams && teams.length > 0) {
      setShowCreateTeam(true);
    } else {
      setShowCreateTeam(false);
    }
  }, [teams]);

  const handleCreateTeamClick = () => {
    setShowCreateTeam(true);
  };

  const handleBackToMain = () => {
    if (teams && teams.length > 0) {
      router.back();
    } else {
      setShowCreateTeam(false);
    }
  };

  // const handleTeamCreationComplete = () => {
  //   setShowCreateTeam(false);
  //   // Optionally redirect or refresh data
  //   router.refresh();
  // };

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <div className="w-full border-b">
        <Breadcrumbs />
      </div>
      <div className="h-full overflow-auto">
        {!showCreateTeam ? (

          <LandingPageForTeams
            title="Build Powerful Teams with Seamless Collaboration"
            description={`Empower your teams to connect, communicate, and achieve together. 
Break down silos, foster synergy, and drive projects forward with ease.`}
            extraText="Your Team's Success Starts Here—Unleash Their Potential Today"
            imageSrc="/images/teams-image.svg"
            imageAlt="Teams illustration"
            buttonText="Create a Team Now"
            onButtonClick={handleCreateTeamClick}
          />
        ) : (
          <CreateNewTeam
            // initialStep="setup"
            // mode="create"
            // onComplete={handleTeamCreationComplete}
            onBack={handleBackToMain}
            spacing="normal"
          />
        )}

      </div>
    </div >
  );
}