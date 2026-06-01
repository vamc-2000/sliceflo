// components/portfolios/views/PortfolioOverview/PortfolioViewersDisplay.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, UserPlus } from "lucide-react";
import Image from "next/image";
import ViewAllPortfolioMembersModal from "./ViewAllPortfolioMembersModal";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface ViewerMember {
  id: string;
  name: string;
  avatar: string | undefined;
  initials: string;
  email: string;
}

interface PortfolioViewersDisplayProps {
  viewerIds: string[];
  onAddViewer: () => void;
  onRemoveViewer: (userId: string) => Promise<void> | void;
  portfolioId: string;
}

export function PortfolioViewersDisplay({
  viewerIds = [],
  onAddViewer,
  onRemoveViewer,
  portfolioId,
}: PortfolioViewersDisplayProps) {
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();

  // Fetch workspace members on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchWorkspaceMembers]);

  // Get S3 base URL for profile pictures
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

  // Helper function to get full profile picture URL
  const getProfilePictureUrl = (profilePicture?: string | null) => {
    if (!profilePicture) return undefined;
    if (profilePicture.startsWith("http")) return profilePicture;
    return `${s3BaseUrl}/${profilePicture}`;
  };

  // Resolve viewer details from workspace members
  const portfolioViewers = useMemo<ViewerMember[]>(() => {
    return viewerIds
      .map((viewerId) => {
        const member = workspaceMembers.find((m) => m.userId === viewerId);
        if (!member) return null;

        return {
          id: member.userId,
          name: member.name || "Unknown",
          email: member.email,
          avatar: getProfilePictureUrl(member.profilePicture),
          initials:
            member.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "??",
        };
      })
      .filter((v): v is ViewerMember => v !== null);
  }, [viewerIds, workspaceMembers, s3BaseUrl]);

  return (
    <div className="flex w-full">
      {portfolioViewers.length > 0 ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center -space-x-2">
            <h1 className="ml-auto text-sm font-medium text-muted-foreground">
              Viewers
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full">
            {/* Avatars */}
            <div className="flex items-center -space-x-2">
              {portfolioViewers.slice(0, 5).map((v) => (
                <Avatar
                  key={v.id}
                  className="h-10 w-10 border-2 border-background"
                >
                  <AvatarImage src={v.avatar || ""} alt={v.name} />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {v.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>

            {/* UserPlus add button */}
            <button
              data-testid="portfoliooverview-add-viewer-btn"
              onClick={onAddViewer}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <UserPlus size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* View all */}
          <button
            onClick={() => setIsViewAllOpen(true)}
            className="ml-auto text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-80"
          >
            View all
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Image
            src="/images/projects/viewers-illustration.svg"
            alt="Viewers illustration"
            width={120}
            height={120}
            className="object-contain"
          />
          <button
            data-testid="portfoliooverview-add-viewer-btn"
            onClick={onAddViewer}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-gray-100">
              <Eye size={18} />
            </span>
            <span>Viewers</span>
          </button>
        </div>
      )}

      <ViewAllPortfolioMembersModal
        isOpen={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        members={portfolioViewers}
        title="Portfolio Viewers"
        type="viewers"
        onRemove={onRemoveViewer}
        portfolioId={portfolioId}
      />
    </div>
  );
}