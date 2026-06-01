// components/Goals/GoalMembersSection.tsx

"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Users, ChevronRight } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Separator } from "@/components/ui/separator";

interface GoalMembersSectionProps {
    goalId: string;
    members: any[]; // array of userIds or user objects
    onAddMember: (userId: string) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onInviteClick: () => void;
}

const GoalMembersSection: React.FC<GoalMembersSectionProps> = ({
    goalId,
    members = [],
    onAddMember,
    onRemoveMember,
    onInviteClick,
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
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowAddInterface(false); setSearchQuery(""); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                    </button>
                    <span className="text-sm font-medium">Add Assignees</span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workspace members"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {filteredAvailable.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            No members found
                        </div>
                    ) : (
                        filteredAvailable.map((member: any) => (
                            <div key={member.userId || member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={member.image} />
                                        <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                            {member.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">{member.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleAdd(member.userId || member.id)}
                                    disabled={isLoading}
                                    className="h-8 w-8 text-green-600 hover:text-green-700"
                                >
                                    <Plus className="h-4 w-4 border-2 border-current rounded-full p-0.5" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Assignees</span>
                    <div className="flex items-center -space-x-2">
                        {memberDetails.slice(0, 4).map((member: any, index) => (
                            <Avatar
                                key={member.userId || member.id}
                                className="h-7 w-7 border-2 border-white ring-1 ring-gray-200"
                                style={{ zIndex: index + 1 }}
                            >
                                <AvatarImage src={member.image} alt={member.name} />
                                <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                    {member.initials}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {memberDetails.length > 4 && (
                            <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center" style={{ zIndex: 5 }}>
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
                />
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {filteredCurrent.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        {searchQuery ? "No members found" : "No members assigned yet"}
                    </div>
                ) : (
                    filteredCurrent.map((member: any) => (
                        <div key={member.userId || member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={member.image} />
                                    <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                        {member.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{member.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(member.userId || member.id)}
                                disabled={isLoading}
                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-2">
                {/* <Button
                    variant="default"
                    size="sm"
                    onClick={onInviteClick}
                    className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white text-xs h-8"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Invite
                </Button> */}
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddInterface(true)}
                    className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white text-xs h-8"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                </Button>
            </div>
        </div>
    );
};

export default GoalMembersSection;
