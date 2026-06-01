// components/projects/ProjectMembersSection.tsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Users, ChevronRight, Loader2 } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";
import { useTeamStore } from "@/stores/teams-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "@/components/ui/sonner";
import { Separator } from "../ui/separator";
import { iconLibrary } from '@/components/ColorIconPicker'
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AnimatePresence, motion } from "framer-motion";

interface ProjectMembersSectionProps {
    projectId: string;
    members: Array<{ userId: string; role: string; teamId?: string; team?: { id: string; name: string }; addedViaTeam?: { id: string; name: string; }; }>;
    onAddMembers: (members: Array<{ userId: string; role: string; teamId?: string; team?: { id: string; name: string }; addedViaTeam?: { id: string; name: string; }; }>) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onInviteClick: () => void;
}

const ProjectMembersSection: React.FC<ProjectMembersSectionProps> = ({
    projectId,
    members = [],
    onAddMembers,
    onRemoveMember,
    onInviteClick,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"members" | "teams">("members");
    const [isLoading, setIsLoading] = useState(false);
    const [showAddInterface, setShowAddInterface] = useState(false); // New state
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
    const [addedTeams, setAddedTeams] = useState<Set<string>>(new Set());
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<Record<string, Set<string>>>({});
    const selectedTeamMembersRef = React.useRef(selectedTeamMembers);

    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [removingMember, setRemovingMember] = useState(false);

    const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();
    const { teams, fetchTeams } = useTeamStore();
    const { addMembersToProjectViaTeam, addUserToProjectFromTeam } = useProjectsStore();

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
        // If it's already a full URL, return as is
        if (profilePicture.startsWith('http')) return profilePicture;
        // Otherwise, prepend S3 base URL
        return `${s3BaseUrl}/${profilePicture}`;
    };

    const getTeamNameForMember = (userId: string, teamId?: string) => {
        if (teamId) {
            const team = teams.find(t => t.id === teamId);
            if (team) return team.name;
        }

        return null;
    };

    const truncate = (text = "", max = 10) =>
        text.length > max ? text.slice(0, max) + "…" : text;

    // Get member IDs for comparison
    const memberUserIds = useMemo(() => members.map(m => m.userId), [members]);

    // Get member details with role information
    const memberDetails = useMemo(() => {
        return members
            .map((member) => {
                const workspaceMember = workspaceMembers.find((m) => m.userId === member.userId);
                if (!workspaceMember) return null;

                const teamName = member.addedViaTeam?.name ||
                    member.team?.name ||
                    getTeamNameForMember(member.userId, member.teamId || member.team?.id);

                return {
                    ...workspaceMember,
                    role: member.role,
                    addedViaTeam: member.addedViaTeam,
                    teamName: teamName,
                    fullProfilePictureUrl: getProfilePictureUrl(workspaceMember.profilePicture),
                    initials: workspaceMember.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "??",
                };
            })
            .filter(Boolean);
    }, [members, workspaceMembers, teams, s3BaseUrl]);

    // Filter available members (not already in project)
    const availableMembers = useMemo(() => {
        return workspaceMembers
            .filter((member) => !memberUserIds.includes(member.userId))
            .map((member) => ({
                ...member,
                teamName: getTeamNameForMember(member.userId),
                fullProfilePictureUrl: getProfilePictureUrl(member.profilePicture),
                initials: member.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "??",
            }));
    }, [workspaceMembers, memberUserIds, teams, s3BaseUrl]);

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

    // Filter current members based on search
    const filteredMembers = useMemo(() => {
        return memberDetails.filter((member) =>
            member?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [memberDetails, searchQuery]);

    const handleAddMember = async (userId: string) => {
        setIsLoading(true);
        try {
            await onAddMembers([{ userId, role: "member" }]); // Default role is member
            setSearchQuery(""); // Clear search after adding
        } catch (error) {
            console.error("Failed to add member:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1: Just store who to remove — opens the modal
    const handleAddTeam = async (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) {
            // toast("error", { title: "Team not found" });
            toast('error', { title: "Team not found" });
            return;
        }

        setIsLoading(true);
        try {
            // Map team members to include teamId for each member
            const membersToAdd = (team.teamMembers || []).map((m: any) => ({
                userId: m.id,
                role: "member",
                teamId: team.id,
            }));

            // ✅ Call addUserToProjectFromTeam instead of addMembersToProjectViaTeam
            // This ensures each member is explicitly linked to the teamId in the project
            await addUserToProjectFromTeam(projectId, membersToAdd);

            setAddedTeams(prev => new Set(prev).add(teamId));
            toast('success', { title: "Team members added to project" });
            setSearchQuery('');
        } catch (error) {
            console.error('Failed to add team members:', error);
            // toast("error", { title: "Failed to add team members" });
            toast('error', { title: 'Failed to add team members' });
        } finally {
            setIsLoading(false);
        }
    };
    const confirmRemoveMember = (userId: string) => {
        setMemberToRemove(userId);
    };

    // Step 2: Called by ConfirmationModal's onConfirm
    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        setRemovingMember(true);
        try {
            await onRemoveMember(memberToRemove);
        } catch (error) {
        } finally {
            setRemovingMember(false);
            setMemberToRemove(null);
        }
    };


    const getTeamAvatar = (team: any) => {
        if (!team?.icon) return null;

        if (team.icon.type === "file") {
            return {
                type: "image",
                src: team.icon.presignedUrl,
            };
        }

        if (team.icon.type === "icon") {
            return {
                type: "icon",
                name: team.icon.name,
                color: team.icon.color || "#6B7280",
            };
        }

        return null;
    };

    const toggleTeamExpand = (teamId: string) => {
        setExpandedTeams(prev => ({
            ...prev,
            [teamId]: !prev[teamId],
        }));
    };

    const toggleTeamSelect = (teamId: string, checked: boolean) => {
        setSelectedTeams(prev => {
            const next = new Set(prev);
            checked ? next.add(teamId) : next.delete(teamId);
            return next;
        });

        // Auto select/deselect all members
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

            // Sync team checkbox: checked only if ALL members selected
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

    // Add button clicked - Show Tabs Interface
    if (showAddInterface) {
        return (
            <div className="space-y-2">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <div className="flex items-center">
                        {showAddInterface && (
                            <button
                                onClick={() => { setShowAddInterface(false); setSearchQuery(""); }}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                            </button>
                        )}
                        <TabsList className="w-full flex gap-1 bg-transparent border-b rounded-none p-0 justify-end">
                            <TabsTrigger
                                value="teams"
                                className="text-xs rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Teams
                            </TabsTrigger>
                            <TabsTrigger
                                value="members"
                                className="text-xs rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Members
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Members Tab - MATCHES MEMBER-ADDITION IMAGE */}
                    <TabsContent value="members" className="space-y-1">
                        {availableMembers.length > 0 && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-8 rounded-md text-xs"
                                />
                            </div>
                        )}

                        <div className="space-y-0.5 max-h-80 overflow-y-auto pr-1">
                            {filteredAvailableMembers.length === 0 ? (
                                <div className="text-center py-8 space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        {searchQuery ? "No members found" : "No available members"}
                                    </p>
                                    {!searchQuery && (
                                        <Button size="sm" onClick={onInviteClick} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                                            <Plus className="h-4 w-4 mr-1" /> Invite
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                filteredAvailableMembers.map((member) => (
                                    <div
                                        key={member.userId}
                                        className="flex items-center justify-between py-1 px-1.5 hover:bg-accent/50 rounded-md transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar className="h-7 w-7 shrink-0">
                                                <AvatarImage src={member.fullProfilePictureUrl} alt={member.name} />
                                                <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                                                    {member.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{member.name}</p>
                                                {member.teamName && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                            {member.teamName}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleAddMember(member.userId)}
                                            disabled={isLoading}
                                            className="shrink-0  h-8 w-8 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Plus className="h-5 w-5 border-2 border-current rounded-full p-0.5" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Teams Tab - MATCHES TEAM-ADDITION IMAGE */}
                    <TabsContent value="teams" className="space-y-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-8 rounded-md text-xs"
                            />
                        </div>

                        <div className="space-y-0.5 max-h-80 overflow-y-auto pr-1">
                            {filteredTeams.length === 0 ? (
                                <div className="text-center py-8 space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        {searchQuery ? "No teams found" : "No teams available"}
                                    </p>
                                    {!searchQuery && (
                                        <Button size="sm" onClick={onInviteClick} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                                            <Plus className="h-4 w-4 mr-1" /> Invite
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                filteredTeams.map((team) => {
                                    const isExpanded = expandedTeams[team.id];
                                    const selectableMembers = team.teamMembers?.filter(
                                        (member: any) => !memberUserIds.includes(member.id)
                                    ) ?? [];
                                    const isTeamFullyAdded = selectableMembers.length === 0;
                                    const isSelected = !isTeamFullyAdded && selectedTeams.has(team.id);

                                    return (
                                        <div
                                            key={team.id}
                                            className={`rounded-md border border-transparent ${isTeamFullyAdded ? "opacity-60 cursor-not-allowed" : "hover:border-accent"
                                                }`}
                                        >
                                            {/* TEAM ROW */}
                                            <div
                                                className={`flex items-center justify-between py-1 px-1.5 ${isTeamFullyAdded ? "cursor-not-allowed" : "hover:bg-accent/50 cursor-pointer"
                                                    }`}
                                                onClick={() => {
                                                    if (!isTeamFullyAdded) {
                                                        toggleTeamExpand(team.id);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* Checkbox */}
                                                    <Checkbox
                                                        checked={isSelected}
                                                        disabled={isLoading || addedTeams.has(team.id) || isTeamFullyAdded}
                                                        onCheckedChange={async (checked) => {
                                                            toggleTeamSelect(team.id, Boolean(checked));
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="border-input"
                                                    />

                                                    {/* Avatar */}
                                                    <Avatar className="h-7 w-7 shrink-0">
                                                        {(() => {
                                                            const avatar = getTeamAvatar(team);
                                                            if (avatar?.type === "image") {
                                                                return <AvatarImage src={avatar.src} alt={team.name} />;
                                                            }
                                                            if (avatar?.type === "icon") {
                                                                const iconObj = iconLibrary.find(i => i.name === avatar.name);
                                                                if (iconObj) {
                                                                    const IconComponent = iconObj.icon;
                                                                    return (
                                                                        <IconComponent
                                                                            size={22}
                                                                            color={avatar.color || "#FFFFFF"}
                                                                            className="w-full h-full"
                                                                        />
                                                                    );
                                                                }
                                                            }
                                                            return (
                                                                <AvatarFallback className="bg-muted text-muted-foreground">
                                                                    <Users className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            );
                                                        })()}
                                                    </Avatar>

                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium truncate">{team.name}</p>
                                                        {isTeamFullyAdded && (
                                                            <p className="text-[10px] text-muted-foreground">
                                                                All members already added
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Chevron */}
                                                <button
                                                    disabled={isTeamFullyAdded}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isTeamFullyAdded) {
                                                            toggleTeamExpand(team.id);
                                                        }
                                                    }}
                                                >
                                                    <ChevronRight
                                                        className={`h-4 w-4 transition={{
                                                            type: "spring",
                                                            stiffness: 260,
                                                            damping: 22
                                                        }} duration-300 ${isExpanded ? "rotate-90" : ""
                                                            }`}
                                                    />
                                                </button>

                                            </div>

                                            {/* EXPANDED MEMBERS */}
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pl-8 pr-1 pb-1 space-y-1">
                                                            {team.teamMembers?.length > 0 ? (
                                                                <>
                                                                    {team.teamMembers.map((member: any) => {
                                                                        const isAlreadyInProject = memberUserIds.includes(member.id);

                                                                        return (
                                                                            <div
                                                                                key={member.id}
                                                                                className={`flex items-center justify-between text-xs ${isAlreadyInProject ? "text-muted-foreground/50" : "text-muted-foreground"
                                                                                    }`}
                                                                            >
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <Checkbox
                                                                                        checked={
                                                                                            isAlreadyInProject
                                                                                                ? false
                                                                                                : selectedTeamMembers[team.id]?.has(member.id)
                                                                                        }
                                                                                        disabled={isAlreadyInProject || isLoading || addedTeams.has(team.id)}
                                                                                        onCheckedChange={(checked) =>
                                                                                            toggleTeamMemberSelect(team.id, member.id, Boolean(checked))
                                                                                        }
                                                                                        className="border-input"
                                                                                    />

                                                                                    <Avatar className="h-7 w-7">
                                                                                        <AvatarFallback className="bg-yellow-100 text-orange-600 text-[11px] font-semibold">
                                                                                            {member.name?.[0]?.toUpperCase()}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>

                                                                                    <span
                                                                                        className={`truncate ${isAlreadyInProject ? "opacity-50 cursor-not-allowed" : ""
                                                                                            }`}
                                                                                    >
                                                                                        {truncate(member.name, 10)}
                                                                                        {isAlreadyInProject && " (Already added)"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    {/* ✅ PER-TEAM ADD SELECTED BUTTON */}
                                                                    <Button
                                                                        size="sm"
                                                                        className="mt-0 w-full bg-primary text-primary-foreground text-xs disabled:opacity-50"
                                                                        disabled={(selectedTeamMembers[team.id]?.size ?? 0) === 0 || isLoading || addedTeams.has(team.id)}
                                                                        onClick={async () => {
                                                                            const selectedIds = Array.from(selectedTeamMembersRef.current[team.id] ?? []);
                                                                            if (selectedIds.length === 0) {
                                                                                toast('error', { title: "Select at least one member" });
                                                                                return;
                                                                            }

                                                                            const newMembers = selectedIds
                                                                                .filter(id => !memberUserIds.includes(id))
                                                                                .map(id => ({
                                                                                    userId: id,
                                                                                    role: "member",
                                                                                    teamId: team.id,
                                                                                    addedViaTeam: { id: team.id, name: team.name ?? 'Unknown team' },
                                                                                }));

                                                                            if (newMembers.length === 0) {
                                                                                toast('warning', { title: "All selected members are already in this project" });
                                                                                return;
                                                                            }

                                                                            setIsLoading(true);
                                                                            try {
                                                                                await addUserToProjectFromTeam(projectId, newMembers);

                                                                                setAddedTeams(prev => new Set(prev).add(team.id));
                                                                                setSelectedTeamMembers(prev => {
                                                                                    const next = { ...prev };
                                                                                    delete next[team.id];
                                                                                    return next;
                                                                                });
                                                                                toast('success', { title: `${newMembers.length} member${newMembers.length > 1 ? 's' : ''} added from ${team.name}` });
                                                                            } catch {
                                                                                toast('error', { title: "Failed to add team members" });
                                                                            } finally {
                                                                                setIsLoading(false);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {isLoading ? (
                                                                            <span className="flex items-center justify-center gap-2">
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                                Adding...
                                                                            </span>
                                                                        ) : (
                                                                            "Add Selected"
                                                                        )}
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground">No members</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    // ✅ CASE 2: Members exist - Show Avatar List with Add/Invite buttons
    // Get first 4 members for avatar display
    const displayedMembers = memberDetails.slice(0, 4);
    const remainingCount = memberDetails.length - 4;

    return (
        <div className="space-y-2">
            {/* Header with Avatar Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Members</span>
                    {/* Avatar Stack */}
                    <div className="flex items-center -space-x-2">
                        {displayedMembers.map((member, index) => (
                            <Avatar
                                key={member?.userId}
                                className="h-8 w-8 border-2 border-background ring-1 ring-border"
                                style={{ zIndex: index + 1 }}
                            >
                                <AvatarImage src={member?.fullProfilePictureUrl} alt={member?.name} />
                                <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                    {member?.initials}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {remainingCount > 0 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background ring-1 ring-border flex items-center justify-center">
                                <span className="text-xs font-medium text-muted-foreground">+{remainingCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-xs"
                />
            </div>

            {/* Members List */}
            <div className="space-y-0.5 max-h-70 overflow-y-auto pr-1">
                {filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                        {searchQuery ? "No members found" : "No members"}
                    </div>
                ) : (
                    filteredMembers.map(member => (
                        <div
                            key={member?.userId}
                            className="flex items-center justify-between py-1 px-1.5 hover:bg-accent/50 rounded transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarImage src={member?.fullProfilePictureUrl} alt={member?.name} />
                                    <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                                        {member?.initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    {/* Member name */}
                                    <p className="text-xs truncate text-primary">{member?.name}</p>

                                    {/* ✅ Team name badge — shows if added via team OR belongs to a team */}
                                    {member?.teamName && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="text-[11px] text-muted-foreground truncate">
                                                {member.teamName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remove button — unchanged */}
                            <div className="flex items-center">
                                <div className="h-6 w-0.5 bg-linear-to-b from-[#D1D1D6] via-[#000000] to-[#D1D1D6] rounded-md" />
                                {/* <div className="h-7 w-0.5 rounded-full bg-linear-to-b from-[#4F4F4F40] via-[#000000] to-[#D1D1D640]" /> */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmRemoveMember(member?.userId || "")}
                                    disabled={isLoading || member?.role === 'owner'}
                                    className="ml-0 text-muted-foreground hover:text-destructive shrink-0 h-8 w-8 rounded-none"
                                    title={member?.role === 'owner' ? 'Cannot remove project owner' : 'Remove member'}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Separator />

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="default"
                    size="sm"
                    onClick={onInviteClick}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Invite
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddInterface(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                </Button>
            </div>
            <ConfirmationModal
                open={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                title="Remove Member"
                confirmLabel="Remove"
                description="This will remove the member from the project. They will lose access immediately."
                loading={removingMember}
                onConfirm={handleRemoveMember}
            />
        </div>
    );
};

export default ProjectMembersSection;

