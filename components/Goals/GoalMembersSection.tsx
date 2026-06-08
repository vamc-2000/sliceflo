// components/Goals/GoalMembersSection.tsx

"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Users, ChevronRight } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GoalMembersSectionProps {
    goalId: string;
    members: any[]; // array of userIds or user objects
    onAddMember: (userId: string) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onInviteClick: () => void;
    readOnly?: boolean;
}

const GoalMembersSection: React.FC<GoalMembersSectionProps> = ({
    goalId,
    members = [],
    onAddMember,
    onRemoveMember,
    onInviteClick,
    readOnly = false,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showAddInterface, setShowAddInterface] = useState(false);

    const { workspaceMembers } = useWorkspaceStore();
    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

    const getProfilePictureUrl = (profilePicture?: string | null) => {
        if (!profilePicture) return undefined;
        if (profilePicture.startsWith('http')) return profilePicture;
        return `${s3BaseUrl}/${profilePicture}`;
    };

    const getUserId = (item: any): string => {
        if (!item) return "";
        if (typeof item === "string") return item;
        return item.id || item._id || "";
    };

    const getUserInitials = (name?: string | null) => {
        if (!name) return "V";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 1).toUpperCase();
    };

    const memberIds = useMemo(() => members.map(getUserId).filter(Boolean), [members]);

    // Current members details
    const memberDetails = useMemo(() => {
        return memberIds
            .map((userId) => {
                const workspaceMember = workspaceMembers.find((m) => m.userId === userId || m.id === userId);
                if (!workspaceMember) return null;
                const name = workspaceMember.name || workspaceMember.user?.name || "Unknown User";
                return {
                    ...workspaceMember,
                    name,
                    initials: getUserInitials(name),
                    image: getProfilePictureUrl(workspaceMember.profilePicture || workspaceMember.user?.avatar),
                    email: workspaceMember.email
                };
            })
            .filter(Boolean);
    }, [memberIds, workspaceMembers]);

    // Available members (not in goal)
    const availableMembers = useMemo(() => {
        return workspaceMembers
            .filter((m) => {
                const mId = m.userId || m.id;
                return mId && !memberIds.includes(mId);
            })
            .map((member) => {
                const name = member.name || member.user?.name || "Unknown User";
                return {
                    ...member,
                    name,
                    initials: getUserInitials(name),
                    image: getProfilePictureUrl(member.profilePicture || member.user?.avatar),
                    email: member.email
                };
            });
    }, [workspaceMembers, memberIds]);

    const filteredAvailable = availableMembers.filter(m => 
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCurrent = memberDetails.filter(m => 
        m?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAdd = async (userId: string) => {
        setIsLoading(true);
        try {
            await onAddMember(userId);
            setSearchQuery("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (userId: string) => {
        setIsLoading(true);
        try {
            await onRemoveMember(userId);
        } finally {
            setIsLoading(false);
        }
    };

    if (showAddInterface) {
        return (
            <div className="space-y-3" data-testid="add-assignees-container">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowAddInterface(false); setSearchQuery(""); }}
                        className="p-1 hover:bg-muted rounded"
                        data-testid="back-button"
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                    </button>
                    <span className="text-sm font-medium" data-testid="add-assignees-title">Add Assignees</span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workspace members"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                        data-testid="search-workspace-members-input"
                    />
                </div>

                <ScrollArea className="max-h-64 pr-2" data-testid="available-members-list">
                    <div className="space-y-1">
                        {filteredAvailable.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground" data-testid="no-available-members-state">
                                No members found
                            </div>
                        ) : (
                            filteredAvailable.map((member: any) => {
                                const memberId = member.userId || member.id;
                                return (
                                    <div key={memberId} className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors" data-testid={`available-member-item-${memberId}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-8 w-8 shrink-0" data-testid={`available-member-avatar-${memberId}`}>
                                                <AvatarImage src={member.image} />
                                                <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                                    {member.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium truncate" data-testid={`available-member-name-${memberId}`}>{member.name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate" data-testid={`available-member-email-${memberId}`}>{member.email}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleAdd(member.userId || member.id)}
                                            disabled={isLoading}
                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                            data-testid={`add-member-btn-${memberId}`}
                                        >
                                            <Plus className="h-4 w-4 border-2 border-current rounded-full p-0.5" />
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <div 
            className={cn(
                "space-y-3",
                readOnly && "bg-muted/40 dark:bg-muted/20 p-4 -m-4 rounded-xl border border-border/40"
            )} 
            data-testid="assignees-container"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" data-testid="assignees-title">
                        {readOnly ? "Team Members" : "Assignees"}
                    </span>
                    {readOnly && (
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-md">
                            Read Only
                        </span>
                    )}
                    <div className="flex items-center -space-x-2" data-testid="assignees-avatars-group">
                        {memberDetails.slice(0, 4).map((member: any, index) => {
                            const memberId = member.userId || member.id;
                            return (
                                <Avatar
                                    key={member.userId || member.id}
                                    className="h-7 w-7 border-2 border-white ring-1 ring-gray-200"
                                    style={{ zIndex: index + 1 }}
                                    data-testid={`assignee-avatar-${memberId}`}
                                >
                                    <AvatarImage src={member.image} alt={member.name} />
                                    <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                        {member.initials}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })}
                        {memberDetails.length > 4 && (
                            <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center" style={{ zIndex: 5 }} data-testid="assignees-extra-count">
                                <span className="text-[10px] font-medium text-gray-600">+{memberDetails.length - 4}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search assigned members"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                    data-testid="search-assigned-members-input"
                />
            </div>

            <ScrollArea className="max-h-64 pr-2" data-testid="assigned-members-list">
                <div className="space-y-1">
                    {filteredCurrent.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground" data-testid="no-assigned-members-state">
                            {searchQuery ? "No members found" : "No members assigned yet"}
                        </div>
                    ) : (
                        filteredCurrent.map((member: any) => {
                            const memberId = member.userId || member.id;
                            return (
                                <div key={memberId} className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors" data-testid={`assigned-member-item-${memberId}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="h-8 w-8 shrink-0" data-testid={`assigned-member-avatar-${memberId}`}>
                                            <AvatarImage src={member.image} />
                                            <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                                {member.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium truncate" data-testid={`assigned-member-name-${memberId}`}>{member.name}</p>
                                            <p className="text-[10px] text-muted-foreground truncate" data-testid={`assigned-member-email-${memberId}`}>{member.email}</p>
                                        </div>
                                    </div>
                                    {!readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemove(memberId)}
                                            disabled={isLoading}
                                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                            data-testid={`remove-member-btn-${memberId}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {!readOnly && (
                <>
                    <Separator />
                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setShowAddInterface(true)}
                            className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white text-xs h-8"
                            data-testid="open-add-interface-btn"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default GoalMembersSection;
