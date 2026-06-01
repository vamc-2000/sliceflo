// components/portfolios/PortfolioViewersSection.tsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Users, Eye, ChevronRight } from "lucide-react";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useTeamStore } from "@/stores/teams-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { iconLibrary } from '@/components/ColorIconPicker';
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationModal from "@/components/ConfirmationModal";

interface PortfolioViewersSectionProps {
  portfolioId: string;
  viewers: string[]; // Array of user IDs
  onAddViewers: (viewerIds: string[]) => Promise<void>;
  onRemoveViewers: (viewerIds: string[]) => Promise<void>;
  onInviteClick: () => void;
}

const PortfolioViewersSection: React.FC<PortfolioViewersSectionProps> = ({
  portfolioId,
  viewers = [],
  onAddViewers,
  onRemoveViewers,
  onInviteClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "teams">("members");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddInterface, setShowAddInterface] = useState(false);

  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [addedTeams, setAddedTeams] = useState<Set<string>>(new Set());
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<Record<string, Set<string>>>({});
  const selectedTeamMembersRef = React.useRef(selectedTeamMembers);

  const [viewerToRemove, setViewerToRemove] = useState<string | null>(null);
  const [removingViewer, setRemovingViewer] = useState(false);

  const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();
  const { teams, fetchTeams } = useTeamStore();

  useEffect(() => {
    selectedTeamMembersRef.current = selectedTeamMembers;
  }, [selectedTeamMembers]);

  // Fetch workspace members and teams on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
      fetchTeams();
    }
  }, [currentWorkspace?.id]);

  // Get S3 base URL for profile pictures
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

  // Helper function to get full profile picture URL
  const getProfilePictureUrl = (profilePicture?: string | null) => {
    if (!profilePicture) return undefined;
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${s3BaseUrl}/${profilePicture}`;
  };

  // Get viewer details with memoization
  const viewerDetails = useMemo(() => {
    return viewers
      .map((viewerId) => {
        const member = workspaceMembers.find((m) => m.userId === viewerId);
        if (!member) return null;

        return {
          ...member,
          fullProfilePictureUrl: getProfilePictureUrl(member.profilePicture),
          initials: member.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "??",
        };
      })
      .filter(Boolean);
  }, [viewers, workspaceMembers, s3BaseUrl]);

  // Filter available members (not already viewers)
  const availableMembers = useMemo(() => {
    return workspaceMembers
      .filter((member) => !viewers.includes(member.userId))
      .map((member) => ({
        ...member,
        fullProfilePictureUrl: getProfilePictureUrl(member.profilePicture),
        initials: member.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "??",
      }));
  }, [workspaceMembers, viewers, s3BaseUrl]);

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    return teams.filter((team) =>
      team.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teams, searchQuery]);

  // Filter members based on search
  const filteredAvailableMembers = useMemo(() => {
    return availableMembers.filter((member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableMembers, searchQuery]);

  // Filter current viewers based on search
  const filteredViewers = useMemo(() => {
    return viewerDetails.filter((viewer) =>
      viewer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      viewer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [viewerDetails, searchQuery]);

  const handleAddMember = async (userId: string) => {
    setIsLoading(true);
    try {
      await onAddViewers([userId]);
      toast('success', { title: "Viewer added successfully!" });
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to add viewer:", error);
      toast('error', { title: "Failed to add viewer" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = async (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team || !team.teamMembers) {
      toast('error', { title: "Team not found or has no members" });
      return;
    }

    const memberIds = team.teamMembers.map((m) => m.id);
    const newViewerIds = memberIds.filter((id) => !viewers.includes(id));

    if (newViewerIds.length === 0) {
      toast('info', { title: "All team members are already viewers" });
      return;
    }

    setIsLoading(true);
    try {
      await onAddViewers(newViewerIds);
      toast('success', { title: `Added ${newViewerIds.length} team member${newViewerIds.length > 1 ? 's' : ''} as viewers` });
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to add team members:", error);
      toast('error', { title: "Failed to add team members" });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Opens the modal
  const confirmRemoveViewer = (userId: string) => {
    setViewerToRemove(userId);
  };

  // Step 2: Called by ConfirmationModal's onConfirm
  const handleRemoveMember = async () => {
    if (!viewerToRemove) return;
    setRemovingViewer(true);
    try {
      await onRemoveViewers([viewerToRemove]);
      toast('success', { title: "Viewer removed successfully!" });
    } catch (error) {
      toast('error', { title: "Failed to remove viewer" });
    } finally {
      setRemovingViewer(false);
      setViewerToRemove(null);
    }
  };


  const getTeamAvatar = (team: any) => {
    if (!team?.icon) return null;
    if (team.icon.type === "file") return { type: "image", src: team.icon.presignedUrl };
    if (team.icon.type === "icon") return { type: "icon", name: team.icon.name, color: team.icon.color || "#6B7280" };
    return null;
  };

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const toggleTeamSelect = (teamId: string, checked: boolean) => {
    setSelectedTeams(prev => {
      const next = new Set(prev);
      checked ? next.add(teamId) : next.delete(teamId);
      return next;
    });

    // Auto select/deselect all members of this team
    const team = teams.find(t => t.id === teamId);
    if (team?.teamMembers) {
      setSelectedTeamMembers(prev => ({
        ...prev,
        [teamId]: checked
          ? new Set(team.teamMembers.map((m: any) => m.id))
          : new Set(),
      }));
    }

    if (checked) setExpandedTeams(prev => ({ ...prev, [teamId]: true }));
  };

  const toggleTeamMemberSelect = (teamId: string, memberId: string, checked: boolean) => {
    setSelectedTeamMembers(prev => {
      const teamSet = new Set(prev[teamId] ?? []);
      checked ? teamSet.add(memberId) : teamSet.delete(memberId);
      const updated = { ...prev, [teamId]: teamSet };

      // Sync team-level checkbox: checked only if ALL members selected
      const team = teams.find(t => t.id === teamId);
      const allIds = team?.teamMembers?.map((m: any) => m.id) ?? [];
      const allSelected = allIds.length > 0 && allIds.every(id => teamSet.has(id));

      setSelectedTeams(prevTeams => {
        const next = new Set(prevTeams);
        allSelected ? next.add(teamId) : next.delete(teamId);
        return next;
      });

      return updated;
    });

    if (checked) setExpandedTeams(prev => ({ ...prev, [teamId]: true }));
  };

  const truncate = (text = "", max = 10) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  // Add button clicked - Show Tabs Interface
  if (showAddInterface) {
    return (
      <div className="space-y-2">

        {/* Tabs only show when showAddInterface=true */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex items-center">
            {/* Back button */}
            {showAddInterface && (
              <button
                onClick={() => { setShowAddInterface(false); setSearchQuery(""); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            )}
            <TabsList className="w-full flex gap-1 bg-transparent border-b rounded-none p-0 justify-end">
              <TabsTrigger
                value="teams"
                className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Teams
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Members
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="teams" className="space-y-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-md"
              />
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {filteredTeams.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No teams found" : "No teams available"}
                  </p>
                  {!searchQuery && (
                    <Button size="sm" onClick={onInviteClick} className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white">
                      <Plus className="h-4 w-4 mr-1" /> Invite
                    </Button>
                  )}
                </div>
              ) : (
                filteredTeams.map((team) => {
                  const isExpanded = expandedTeams[team.id];
                  const isSelected = selectedTeams.has(team.id);

                  return (
                    <div key={team.id} className="rounded-md border border-transparent hover:border-accent">

                      {/* TEAM ROW */}
                      <div
                        className="flex items-center justify-between p-1 hover:bg-accent/50 cursor-pointer"
                        onClick={() => toggleTeamExpand(team.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Chevron */}
                          <button onClick={(e) => { e.stopPropagation(); toggleTeamExpand(team.id); }}>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>

                          {/* Team Avatar */}
                          <Avatar className="h-9 w-9 shrink-0">
                            {(() => {
                              const avatar = getTeamAvatar(team);
                              if (avatar?.type === "image") return <AvatarImage src={avatar.src} alt={team.name} />;
                              if (avatar?.type === "icon") {
                                const iconObj = iconLibrary.find(i => i.name === avatar.name);
                                if (iconObj) {
                                  const IconComponent = iconObj.icon;
                                  return <IconComponent size={22} color={avatar.color || "#FFFFFF"} className="w-full h-full" />;
                                }
                              }
                              return (
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                </AvatarFallback>
                              );
                            })()}
                          </Avatar>

                          <p className="text-xs font-medium truncate">{team.name}</p>
                        </div>

                        {/* Team-level checkbox */}
                        <Checkbox
                          checked={isSelected}
                          disabled={addedTeams.has(team.id)}
                          onCheckedChange={(checked) => toggleTeamSelect(team.id, Boolean(checked))}
                          onClick={(e) => e.stopPropagation()}
                          className="border-[#8E8E93]"
                        />
                      </div>

                      {/* EXPANDED MEMBERS */}
                      {isExpanded && (
                        <div className="pl-10 pr-2 pb-2 space-y-2">
                          {team.teamMembers?.length > 0 ? (
                            <>
                              {team.teamMembers.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-7 w-7">
                                      <AvatarFallback className="bg-yellow-100 text-orange-600 text-[11px] font-semibold">
                                        {member.name?.[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">{truncate(member.name, 10)}</span>
                                  </div>
                                  <Checkbox
                                    checked={selectedTeamMembers[team.id]?.has(member.id)}
                                    disabled={isLoading || addedTeams.has(team.id)}
                                    onCheckedChange={(checked) => toggleTeamMemberSelect(team.id, member.id, Boolean(checked))}
                                    className="border-[#8E8E93]"
                                  />
                                </div>
                              ))}

                              {/* Add Selected button */}
                              <Button
                                size="sm"
                                className="mt-0 w-full bg-[#001F3F] text-white disabled:opacity-50"
                                disabled={(selectedTeamMembers[team.id]?.size ?? 0) === 0 || isLoading || addedTeams.has(team.id)}
                                onClick={async () => {
                                  const selectedIds = Array.from(selectedTeamMembersRef.current[team.id] ?? []);
                                  if (selectedIds.length === 0) {
                                    toast('error', { title: "Select at least one member" });
                                    return;
                                  }

                                  const newViewerIds = selectedIds.filter(id => !viewers.includes(id));
                                  if (newViewerIds.length === 0) {
                                    toast('info', { title: "All selected members are already viewers" });
                                    return;
                                  }

                                  setIsLoading(true);
                                  try {
                                    await onAddViewers(newViewerIds);
                                    setAddedTeams(prev => new Set(prev).add(team.id));
                                    setSelectedTeamMembers(prev => { const next = { ...prev }; delete next[team.id]; return next; });
                                    toast('success', { title: `Team "${team.name}" added as viewers` });
                                  } catch {
                                    toast('error', { title: "Failed to add team" });
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                              >
                                Add Selected
                              </Button>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">No members</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
          <TabsContent value="members" className="space-y-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-md"
              />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredAvailableMembers.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No members found" : "No available members"}
                  </p>
                  {!searchQuery && (
                    <Button size="sm" onClick={onInviteClick} className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white">
                      <Plus className="h-4 w-4 mr-1" /> Invite
                    </Button>
                  )}
                </div>
              ) : (
                filteredAvailableMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-1 hover:bg-accent/50 rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={member.fullProfilePictureUrl} alt={member.name} />
                        <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium truncate">{member.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddMember(member.userId)}
                      disabled={isLoading}
                      className="shrink-0 h-8 w-8 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-5 w-5 border-2 border-current rounded-full p-0.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Viewers exist - Show Avatar List with Add/Invite buttons
  const displayedViewers = viewerDetails.slice(0, 4);
  const remainingCount = viewerDetails.length - 4;

  return (
    <div className="space-y-2">
      {/* Header with Avatar Row */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Viewers</span>
        {viewerDetails.length > 0 && (
          <div className="flex items-center -space-x-2">
            {displayedViewers.map((viewer, index) => (
              <Avatar
                key={viewer?.userId}
                className="h-8 w-8 border-2 border-white ring-1 ring-gray-200"
                style={{ zIndex: displayedViewers.length - index }}
              >
                <AvatarImage src={viewer?.fullProfilePictureUrl} alt={viewer?.name} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {viewer?.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {remainingCount > 0 && (
              <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">+{remainingCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Viewers List */}
      <div className="space-y-2 max-h-70 overflow-y-auto pr-1">
        {filteredViewers.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {searchQuery ? "No viewers found" : "No viewers"}
          </div>
        ) : (
          filteredViewers.map((viewer) => (
            <div
              key={viewer?.userId}
              className="flex items-center justify-between p-1 hover:bg-accent/50 rounded transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={viewer?.fullProfilePictureUrl} alt={viewer?.name} />
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                    {viewer?.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{viewer?.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => confirmRemoveViewer(viewer?.userId || "")}
                disabled={isLoading}
                className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                title="Remove viewer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Separator className="text-[#D1D1D6]" />

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={onInviteClick} className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white">
          <Plus className="h-4 w-4 mr-1" /> Invite
        </Button>
        <Button size="sm" onClick={() => setShowAddInterface(true)} className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      <ConfirmationModal
        open={!!viewerToRemove}
        onClose={() => setViewerToRemove(null)}
        title="Remove Viewer"
        confirmLabel="Remove"
        description="This will remove the viewer from the portfolio. They will no longer be able to view it."
        loading={removingViewer}
        onConfirm={handleRemoveMember}
      />
    </div>
  );
};

export default PortfolioViewersSection;