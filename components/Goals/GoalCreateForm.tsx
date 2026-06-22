"use client";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useGoalsStore } from "@/stores/goals-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea";
import { Image, Users, Lock, Building, AlertCircle, CalendarIcon, X, Check, ChevronDown, Palette, ChevronRight, Search, UserPlus2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import { Goal, GoalFormData, GoalTarget } from "@/types/goal.types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarPicker } from "@/components/CalendarPicker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    formatLocalDate,
    convertSelectedDateToUTC,
    convertUTCToCalendarDate,
} from "@/utils/timezone-utils";
import { useProfileStore } from "@/stores/profile-store";
import { useSearchParams } from "next/navigation";
import { useTeamStore } from "@/stores/teams-store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ColorIconPicker, { iconLibrary } from "@/components/ColorIconPicker";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { useEffect, useRef, useState } from "react";
import { Loader } from "../Loader";

interface IconData {
    type: 'icon' | 'file';
    icon?: string;
    image?: string;
    color: string;
    name?: string;
}

export function GoalCreateForm({ teamId: propTeamId }: { teamId?: string }) {
    const router = useRouter();
    const { createGoal, updateGoal, goals, getGoalById, isLoading, error, clearError } = useGoalsStore();
    const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
    const { user: currentUser, fetchUserProfile } = useProfileStore();
    const { teams, fetchTeams, loading: teamsLoading, assignGoalToTeam } = useTeamStore();

    const nameInputRef = useRef<HTMLInputElement>(null);
    const descriptionTextareaRef = useRef<HTMLDivElement>(null);
    const ownerInputRef = useRef<HTMLInputElement>(null);
    const endDateButtonRef = useRef<HTMLButtonElement>(null);

    const searchParams = useSearchParams();
    const previewGoalId = searchParams.get("previewGoalId");
    const focusField = searchParams.get('focusField');
    const teamIdFromQuery = searchParams.get('teamId');
    const teamId = propTeamId || teamIdFromQuery;

    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<GoalTarget | null>(null);

    const [formData, setFormData] = useState<GoalFormData>({
        title: "",
        description: "",
        color: "#F2F2F7",
        startDate: '',
        endDate: '',
        owner: "",
        visibility: "private",
        assignedTo: [],
        icon: null,
        assignedTeams: [],
    });

    const [endDate, setEndDate] = useState<Date>();
    const [goalIcon, setGoalIcon] = useState<string | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedIconData, setSelectedIconData] = useState<IconData | null>(null);

    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewGoalToEdit, setPreviewGoalToEdit] = useState<string | null>(null);
    const [highlightedField, setHighlightedField] = useState<string | null>(null);

    const [pickerMode, setPickerMode] = useState<'icon' | 'color'>('icon');
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const teamPanelRef = useRef<HTMLDivElement>(null);
    const [showTeamPanel, setShowTeamPanel] = useState(false);
    const [showMemberPanel, setShowMemberPanel] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");

    const [selectedOwner, setSelectedOwner] = useState<{
        userId: string;
        name: string;
        email: string;
        profilePicture?: string;
    } | null>(null);

    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

    const getProfilePictureUrl = (profilePicture?: string | null) => {
        if (!profilePicture) return undefined;
        if (profilePicture.startsWith('http')) return profilePicture;
        return `${s3BaseUrl}/${profilePicture}`;
    };

    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchWorkspaceMembers(currentWorkspace.id);
        }
    }, [currentWorkspace?.id]);

    useEffect(() => {
        if (!currentUser) {
            fetchUserProfile();
        } else {
            setFormData((prev) => ({
                ...prev,
                owner: currentUser.name || currentUser.email || '',
                assignedTo: [currentUser._id || '']
            }));
            setSelectedOwner({
                userId: currentUser._id || '',
                name: currentUser.name || '',
                email: currentUser.email || '',
                profilePicture: currentUser.profilePictureUrl || undefined
            });
        }
    }, [currentUser]);

    useEffect(() => {
        if (formData.visibility === 'team' && teams.length === 0) {
            fetchTeams();
        }
    }, [formData.visibility, teams.length]);

    useEffect(() => {
        if (teamId && teams.length > 0) {
            const team = teams.find(t => t.id === teamId);
            if (team) {
                setFormData(prev => ({
                    ...prev,
                    visibility: 'team',
                    assignedTo: [teamId],
                    assignedTeams: [teamId]
                }));
                setSelectedTeams([teamId]);
                const teamMemberIds = team.teamMembers?.map((m: any) => m.id) || [];
                setSelectedMembers(teamMemberIds);
            }
        }
    }, [teamId, teams]);

    useEffect(() => {
        if (!previewGoalId) {
            setPreviewGoalToEdit(null);
            return;
        }

        const cachedGoal = goals.find(g => g.id === previewGoalId);

        const resolveOwnerName = (goal: any): string => {
            const ownerUser = goal.users?.find(
                (u: any) => u.id === goal.createdBy || u._id === goal.createdBy
            );
            if (ownerUser?.name || ownerUser?.email) {
                return ownerUser.name || ownerUser.email;
            }

            if (workspaceMembers && workspaceMembers.length > 0) {
                const member = workspaceMembers.find(
                    (m) => m.userId === goal.createdBy
                );
                if (member?.name || member?.email) {
                    return member.name || member.email;
                }
            }

            if (goal.owners?.length > 0 && workspaceMembers && workspaceMembers.length > 0) {
                const ownerId = goal.owners[0];
                const ownerMember = workspaceMembers.find((m) => m.userId === ownerId);
                if (ownerMember?.name || ownerMember?.email) {
                    return ownerMember.name || ownerMember.email;
                }
            }

            if (currentUser && goal.createdBy === currentUser._id) {
                return currentUser.name || currentUser.email || '';
            }

            return goal.createdBy || '';
        };

        if (cachedGoal) {
            setPreviewGoalToEdit(previewGoalId);
            const ownerName = resolveOwnerName(cachedGoal);

            setFormData((prev) => ({
                ...prev,
                title: cachedGoal.title || prev.title,
                description: cachedGoal.description || prev.description,
                color: cachedGoal.color || prev.color,
                endDate: cachedGoal.endDate || prev.endDate,
                visibility: (cachedGoal.visibility as any) || prev.visibility,
                assignedTo: cachedGoal.assignedTo || prev.assignedTo || [],
                assignedTeams: cachedGoal.assignedTeams || prev.assignedTeams || [],
                icon: cachedGoal.icon || prev.icon,
                owner: ownerName
            }));

            setSelectedTeams(cachedGoal.assignedTeams || []);
            if (cachedGoal.visibility === 'team') {
                setSelectedMembers(cachedGoal.assignedTo || []);
            } else if (cachedGoal.visibility === 'organization') {
                setSelectedMembers(cachedGoal.assignedTo || []);
            }

            if (cachedGoal.endDate) setEndDate(convertUTCToCalendarDate(cachedGoal.endDate));
            return;
        }

        getGoalById(previewGoalId, true).then(goal => {
            if (goal) {
                const ownerName = resolveOwnerName(goal);

                setFormData((prev) => ({
                    ...prev,
                    title: goal.title || prev.title,
                    description: goal.description || prev.description,
                    color: goal.color || prev.color,
                    endDate: goal.endDate || prev.endDate,
                    visibility: (goal.visibility as any) || prev.visibility,
                    assignedTo: goal.assignedTo || prev.assignedTo || [],
                    assignedTeams: goal.assignedTeams || prev.assignedTeams || [], icon: goal.icon || prev.icon,
                    owner: ownerName
                }));

                setSelectedTeams(goal.assignedTeams || []);
                if (goal.visibility === 'team') {
                    setSelectedMembers(goal.assignedTo || []);
                } else if (goal.visibility === 'organization') {
                    setSelectedMembers(goal.assignedTo || []);
                }

                if (goal.endDate) setEndDate(convertUTCToCalendarDate(goal.endDate));
            }
        });
    }, [previewGoalId, goals, getGoalById, workspaceMembers, currentUser]);

    useEffect(() => {
        if (!focusField) return;

        setHighlightedField(focusField);

        setTimeout(() => {
            switch (focusField) {
                case 'name':
                    if (formData.title && descriptionTextareaRef.current) {
                        const editor = descriptionTextareaRef.current.querySelector('.ProseMirror') as HTMLElement;
                        if (editor) editor.focus();
                        descriptionTextareaRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    } else if (nameInputRef.current) {
                        nameInputRef.current.focus();
                        nameInputRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                    break;

                case 'owner':
                    if (ownerInputRef.current) {
                        ownerInputRef.current.focus();
                        ownerInputRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                    break;

                case 'access':
                    const visibilitySection = document.querySelector('[data-testid="goal-visibility-section"]');
                    if (visibilitySection) {
                        visibilitySection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                    break;

                case 'endDate':
                    if (endDateButtonRef.current) {
                        endDateButtonRef.current.focus();
                        endDateButtonRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                    break;
            }
        }, 500);

        setTimeout(() => {
            setHighlightedField(null);
        }, 3000);

    }, [focusField, formData.title]);

    const handleIconSelect = (iconData: IconData) => {
        setSelectedIconData(iconData);

        if (pickerMode === 'icon') {
            const iconValue = iconData.type === 'icon' ? iconData.icon ?? null : iconData.image ?? null;
            setGoalIcon(iconValue);
            setFormData({ ...formData, color: iconData.color, icon: iconValue });
        } else {
            setFormData({ ...formData, color: iconData.color });
        }
    };

    const handleIconPickerClick = () => {
        setPickerMode('icon');
        setShowColorPicker(true);
    };

    const handleColorPickerClick = () => {
        setPickerMode('color');
        setShowColorPicker(true);
    };

    const handleEndDateSelect = (date: Date | undefined) => {
        setEndDate(date);
        if (date) {
            setFormData({
                ...formData,
                endDate: convertSelectedDateToUTC(date)
            });
        } else {
            setFormData({
                ...formData,
                endDate: ''
            });
        }
    };

    const handleVisibilityChange = (visibility: 'private' | 'team' | 'organization') => {
        setSelectedTeams([]);
        setSelectedMembers([]);
        setShowTeamPanel(false);
        setShowMemberPanel(false);
        setMemberSearchQuery("");

        if (visibility === 'private') {
            const userId = (currentUser as any)?.id;

            setFormData(prev => ({
                ...prev,
                visibility,
                assignedTo: userId ? [userId] : [],
                assignedTeams: []
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                visibility,
                assignedTeams: []
            }));
        }
    };

    const handleMemberSelect = (memberId: string) => {
        const newSelectedMembers = selectedMembers.includes(memberId)
            ? selectedMembers.filter(id => id !== memberId)
            : [...selectedMembers, memberId];

        setSelectedMembers(newSelectedMembers);
        setFormData({
            ...formData,
            assignedTo: newSelectedMembers
        });
    };

    const renderMemberStack = (onAddClick: () => void) => {
        const selectedMemberObjects = selectedMembers.map(id => {
            const wsMember = workspaceMembers.find(m => m.userId === id);
            if (wsMember) {
                return {
                    id: wsMember.userId,
                    name: wsMember.name || wsMember.email || '',
                    avatar: getProfilePictureUrl(wsMember.profilePicture)
                };
            }
            for (const t of teams) {
                const teamMember = t.teamMembers?.find((m: any) => m.id === id);
                if (teamMember) {
                    return {
                        id: teamMember.id,
                        name: teamMember.name || teamMember.email || '',
                        avatar: teamMember.avatar
                    };
                }
            }
            return null;
        }).filter((m): m is any => m !== null);

        const maxAvatars = 3;
        const displayMembers = selectedMemberObjects.slice(0, maxAvatars);
        const extraCount = selectedMemberObjects.length - maxAvatars;

        return (
            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center -space-x-3.5 text-foreground">
                    {displayMembers.map((member) => {
                        const initials = member.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase() || "?";
                        return (
                            <Avatar key={member.id} className="h-8 w-8 border-[2px] border-card bg-card shadow-sm shrink-0">
                                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                                <AvatarFallback className="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        );
                    })}
                    {extraCount > 0 && (
                        <div className="h-8 w-8 rounded-full border-[2px] border-card bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm z-10 shrink-0">
                            +{extraCount}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onAddClick}
                        className="h-8 w-8 rounded-full bg-[#001F3F] dark:bg-primary border-[2px] border-card hover:opacity-90 flex items-center justify-center text-white shadow-sm z-10 shrink-0 transition-opacity"
                    >
                        <Users size={14} />
                    </button>
                </div>
            </div>
        );
    };

    const getTeamAvatar = (team: any) => {
        if (!team?.icon) return null;
        if (team.icon.type === "file") {
            return { type: "image", src: team.icon.presignedUrl };
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
        const team = teams.find((t: any) => t.id === teamId);
        if (!team) return;

        const newSelectedTeams = checked
            ? Array.from(new Set([...selectedTeams, teamId]))
            : selectedTeams.filter((id: string) => id !== teamId);

        setSelectedTeams(newSelectedTeams);
        setFormData(prev => ({ ...prev, assignedTeams: newSelectedTeams }));
        const teamMemberIds = team.teamMembers?.map((m: any) => m.id) || [];
        if (checked) {
            const newSelectedMembers = Array.from(new Set([...selectedMembers, ...teamMemberIds]));
            setSelectedMembers(newSelectedMembers);
            setFormData(prev => ({
                ...prev,
                assignedTo: newSelectedTeams
            }));
            setExpandedTeams(prev => ({ ...prev, [teamId]: true }));
        } else {
            const newSelectedMembers = selectedMembers.filter(id => !teamMemberIds.includes(id));
            setSelectedMembers(newSelectedMembers);
            setFormData(prev => ({
                ...prev,
                assignedTo: newSelectedTeams
            }));
        }
    };

    const [teamSearchQuery, setTeamSearchQuery] = useState("");

    useEffect(() => {
        if (!showTeamPanel) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (teamPanelRef.current && !teamPanelRef.current.contains(event.target as Node)) {
                setShowTeamPanel(false);
                setExpandedTeams({});
                setTeamSearchQuery("");
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showTeamPanel]);

    const truncate = (text = "", max = 10) =>
        text.length > max ? text.slice(0, max) + "…" : text;

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast("error", { title: "Error", description: "Please fill in the goal name" });
            return;
        }

        if (!currentWorkspace?.id) {
            toast("error", { title: "Error", description: "Please select a workspace" });
            return;
        }

        const userId = (currentUser as any)?._id || (currentUser as any)?.id;
        if (!userId) {
            toast("error", { title: "Error", description: "User not loaded. Please refresh the page." });
            return;
        }

        clearError();
        setIsSubmitting(true);

        try {
            let cleanedFormData = {
                ...formData,
                visibility: formData.visibility || 'private',
                assignedTo: formData.assignedTo.filter((id: any) => id)
            }
            if (!cleanedFormData.visibility) cleanedFormData.visibility = 'private';

            if (formData.visibility === 'private') {
                cleanedFormData.assignedTo = [userId];
                cleanedFormData.assignedTeams = [];
            }

            else if (formData.visibility === 'team') {
                cleanedFormData.assignedTeams = selectedTeams.filter(id => id);
                const teamIds = selectedTeams.filter(id => id);
                if (teamIds.length === 0) {
                    cleanedFormData.assignedTo = teamId ? [teamId] : (formData.assignedTo?.filter((id: any) => id).length > 0 ? formData.assignedTo.filter((id: any) => id) : [userId]);
                } else {
                    cleanedFormData.assignedTo = teamIds;
                }
            }
            else if (formData.visibility === 'organization') {
                const members = selectedMembers.filter((id: any) => id)
                if (members.length === 0) {
                    cleanedFormData.assignedTo = [userId];
                    cleanedFormData.assignedTeams = [];
                } else {
                    cleanedFormData.assignedTo = members;
                    cleanedFormData.assignedTeams = [];
                }
            }

            if (previewGoalToEdit) {
                const updateData: Partial<Goal> = {
                    title: cleanedFormData.title,
                    description: cleanedFormData.description,
                    color: cleanedFormData.color,
                    endDate: cleanedFormData.endDate || null,
                    visibility: cleanedFormData.visibility as any || undefined,
                    assignedTo: cleanedFormData.assignedTo,
                    ...(cleanedFormData.assignedTeams && cleanedFormData.assignedTeams.length > 0
                        ? { assignedTeams: cleanedFormData.assignedTeams }
                        : {}),
                    icon: cleanedFormData.icon,
                };
                await updateGoal(previewGoalToEdit, updateData);

                toast("success", { title: "Success", description: "Goal updated successfully" });
                if (teamId) {
                    router.push(`/teams/${teamId}`);
                } else {
                    router.push(`/goals/${previewGoalToEdit}`);
                }
            } else {
                console.log(' currentWorkspace:', currentWorkspace?.id, currentWorkspace?.name)
                console.log(' cleanedFormData:', cleanedFormData)
                const newGoal = await createGoal(cleanedFormData, currentWorkspace.id);
                console.log(' newGoal.workspaceId:', newGoal.workspaceId)

                console.log(' newGoal returned:', newGoal);
                console.log(' newGoal.id:', newGoal?.id);
                console.log(' newGoal._id:', (newGoal as any)?._id);



                toast("success", { title: "Success", description: "Goal created successfully" });
                if (teamId && newGoal?.id) {
                    try {
                        await assignGoalToTeam(String(teamId), String(newGoal.id));
                    } catch (e) {
                        console.error("Failed to assign goal to team", e);
                    }
                    router.push(`/teams/${teamId}`);
                } else {
                    const goalId = newGoal?._id || newGoal?.id;
                    console.log(' navigating to goalId:', goalId);
                    router.push(`/goals/${goalId}`);
                }
            }

        } catch (error: any) {
            const backendError = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
            toast("error", { title: "Error", description: `Failed to save goal: ${backendError}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = () => {
        const hasTitle = formData.title.trim() !== "";
        return hasTitle;
    };

    const iconObj = goalIcon ? iconLibrary.find(i => i.name === goalIcon) : null;

    if (previewGoalId && isPreviewLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8">
                <Loader message="Loading goal..." size="md" />
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-hidden h-full">
            <div className="w-full border-b">
                <Breadcrumbs />
            </div>
            <div className="h-full overflow-y-auto p-6">
                <div className="mx-auto space-y-1">
                    <div className="bg-muted/50 border border-border rounded-lg p-4 mb-5" data-testid="goal-info-section">
                        <div className="flex gap-3 items-end">
                            {pickerMode === 'icon' && (
                                <ColorIconPicker
                                    isOpen={showColorPicker}
                                    onClose={() => setShowColorPicker(false)}
                                    onSelect={handleIconSelect}
                                    currentIcon={goalIcon}
                                    currentColor={selectedIconData?.color || formData.color}
                                    mode="icon"
                                />
                            )}

                            <div className="w-[280px]">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Goal name
                                </label>
                                <Input
                                    ref={nameInputRef}
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Goal name 1"
                                    className="h-10 bg-card border-border w-full text-foreground"
                                    data-testid="goal-name-input"
                                />
                            </div>

                            <div className="w-[280px]">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Goal Color
                                </label>
                                <Popover open={showColorPicker && pickerMode === 'color'} onOpenChange={(open) => {
                                    if (open) {
                                        setPickerMode('color');
                                        setShowColorPicker(true);
                                    } else {
                                        setShowColorPicker(false);
                                    }
                                }}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-10 flex items-center justify-between px-3 bg-card border-border hover:bg-muted transition-colors"
                                            data-testid="goal-color-picker-button"
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full border border-border/50 flex-shrink-0"
                                                style={{ backgroundColor: formData.color }}
                                                data-testid="goal-color-preview"
                                            />
                                            <Palette className="h-5 w-5 text-muted-foreground" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start" sideOffset={8}>
                                        <ColorIconPicker
                                            isOpen={true}
                                            onClose={() => setShowColorPicker(false)}
                                            onSelect={handleIconSelect}
                                            currentIcon={goalIcon}
                                            currentColor={selectedIconData?.color || formData.color}
                                            mode="color"
                                            isInline={true}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="w-[280px]">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Goal Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            ref={endDateButtonRef}
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                "w-full h-10 flex items-center justify-between px-3 text-left font-normal bg-card border-border hover:bg-muted transition-all duration-300",
                                                !endDate && "text-muted-foreground",
                                                highlightedField === 'endDate' && "border-2 border-red-500 ring-2 ring-red-200"
                                            )}
                                            data-testid="goal-end-date-picker-button"
                                        >
                                            <span className="text-sm truncate text-foreground" data-testid="goal-end-date-display">
                                                {endDate ? formatLocalDate(endDate) : "Set a Goal date"}
                                            </span>
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                        <CalendarPicker
                                            selectedDate={endDate}
                                            onDateSelect={handleEndDateSelect}
                                            disabled={(date) => date < new Date()}
                                            className="bg-card text-foreground"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "bg-card rounded-lg p-7 border border-border border-l-4 mb-5 transition-all duration-300",
                        highlightedField === 'name'
                            ? "border-red-500 border-l-red-500 ring-2 ring-blue-200"
                            : "border-border border-l-primary"
                    )}>
                        <label className="block text-sm font-medium text-muted-foreground mb-2 font-inter">
                            Goal Description
                        </label>
                        <div ref={descriptionTextareaRef} className="w-full">
                            <ProseMirrorEditor
                                initialContent={formData.description}
                                mentionableMembers={workspaceMembers.map(m => ({
                                    id: m.userId,
                                    name: m.name,
                                    profilePictureUrl: m.avatar
                                }))}
                                onBlur={(content) => setFormData({ ...formData, description: content })}
                                placeholder="Describe your goal in detail..."
                                className={cn(
                                    "h-[240px] overflow-y-auto bg-background text-foreground transition-all duration-300 border border-border rounded-md",
                                    highlightedField === 'name' && "border-2 border-blue-500 focus:ring-blue-500"
                                )}
                            />
                        </div>
                    </div>

                    <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card mb-6 shadow-sm" data-testid="goal-owner-section">
                        <div className="flex justify-between items-center">
                            <div className="flex-1 pr-6">
                                <h1 className="font-semibold text-base text-foreground font-inter">Goal owner</h1>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Select an owner for the goal
                                </p>
                            </div>

                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className={`w-[320px] focus-ring-none rounded-sm flex justify-between items-center px-2 border-border bg-card text-foreground hover:bg-muted ${highlightedField === 'owner' ? 'border-2 border-red-500' : ''}`}
                                        >
                                            <div className="border-dashed border-border rounded-full flex items-center gap-2">
                                                {selectedOwner ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarImage
                                                                src={getProfilePictureUrl(selectedOwner?.profilePicture)}
                                                                alt={selectedOwner.name}
                                                            />
                                                            <AvatarFallback className="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                                                                {selectedOwner?.name?.charAt(0)?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-muted-foreground truncate max-w-[200px]">{selectedOwner?.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <UserPlus2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">Select Owner</span>
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[320px] max-h-[320px] overflow-y-auto">
                                        {workspaceMembers.map((member) => (
                                            <DropdownMenuItem
                                                key={member.userId}
                                                onSelect={() => {
                                                    setFormData({
                                                        ...formData,
                                                        owner: member.name || member.email,
                                                        assignedTo: [member.userId]
                                                    });
                                                    setSelectedOwner({
                                                        userId: member.userId,
                                                        name: member.name || '',
                                                        email: member.email || '',
                                                        profilePicture: member.profilePicture || undefined
                                                    });
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage
                                                            src={getProfilePictureUrl(member.profilePicture)}
                                                            alt={member.name}
                                                        />
                                                        <AvatarFallback className="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                                                            {member.name?.charAt(0)?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="truncate">{member.name}</span>
                                                        <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    <div
                        className="border border-border border-l-4 border-l-primary rounded-lg p-7 bg-card mb-3 transition-colors duration-200"
                        data-testid="goal-visibility-section"
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-6">
                                    <h3 className="font-semibold text-base text-foreground mb-1 font-inter">
                                        Goal visibility
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Who's accountable and who can view this goal?
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleVisibilityChange("private")}
                                        className={`px-4 py-2 h-auto text-sm transition-all ${formData.visibility === "private"
                                            ? "border-b-[3px] border-b-primary-text bg-muted/50"
                                            : "bg-card hover:bg-muted"
                                            }`}
                                        data-testid="visibility-private-button"
                                    >
                                        <Lock size={16} className="mr-1.5" />
                                        Private
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleVisibilityChange("team")}
                                        className={`px-4 py-2 h-auto text-sm transition-all ${formData.visibility === "team"
                                            ? "border-b-[3px] border-b-primary-text bg-muted/50"
                                            : "bg-card hover:bg-muted"
                                            }`}
                                        data-testid="visibility-teams-button"
                                    >
                                        <Users size={16} className="mr-1.5" />
                                        Teams
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleVisibilityChange("organization")}
                                        className={`px-4 py-2 h-auto text-sm transition-all ${formData.visibility === "organization"
                                            ? "border-b-[3px] border-b-primary-text bg-muted/50"
                                            : "bg-card hover:bg-muted"
                                            }`}
                                        data-testid="visibility-workspace-button"
                                    >
                                        <img
                                            src="/images/color.svg"
                                            alt="Users"
                                            className="w-4 h-4"
                                        />
                                        Workspace
                                    </Button>
                                </div>
                            </div>

                            {formData.visibility === "private" && (
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground pt-3">Only visible to</p>
                                    </div>

                                    <div className="flex-1 max-w-md space-y-2 flex justify-end pt-2" data-testid="private-goal-owner-section">
                                        <div className="flex items-center -space-x-3.5 text-foreground">
                                            <Avatar className="h-8 w-8 border-[2px] border-card bg-card shadow-sm shrink-0">
                                                <AvatarImage
                                                    src={getProfilePictureUrl(selectedOwner?.profilePicture || currentUser?.profilePictureUrl)}
                                                    alt={selectedOwner?.name || currentUser?.name || "You"}
                                                />
                                                <AvatarFallback className="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-semibold">
                                                    {(selectedOwner?.name || currentUser?.name || "You").charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {formData.visibility === "team" && (
                                <div className="flex justify-between items-start gap-6">                                    <div className="flex-1">
                                    <p className="text-sm text-muted-foreground pt-3">Only visible to</p>
                                </div>

                                    <div className="flex-1 max-w-md space-y-2">
                                        {!showTeamPanel ? (
                                            <div className="flex justify-end">
                                                {selectedMembers.length > 0 ? (
                                                    renderMemberStack(() => setShowTeamPanel(true))
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-[320px] justify-between h-auto px-3 py-2 border border-border bg-card text-foreground hover:bg-muted"
                                                        onClick={() => setShowTeamPanel(true)}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Users size={16} className="text-muted-foreground" />
                                                            <span className="text-xs font-medium text-muted-foreground">Add Teams</span>
                                                        </div>
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => {
                                                        setShowTeamPanel(false);
                                                        setExpandedTeams({});
                                                        setTeamSearchQuery("");
                                                    }}
                                                />
                                                <div className="relative z-20 w-[320px] ml-auto border border-border rounded-md bg-card shadow-sm">
                                                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                                                        <span className="text-sm font-semibold text-foreground">Teams</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowTeamPanel(false);
                                                                setExpandedTeams({});
                                                                setTeamSearchQuery("");
                                                            }}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="px-3 py-2 border-b border-border">
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Search teams..."
                                                                value={teamSearchQuery}
                                                                onChange={(e) => setTeamSearchQuery(e.target.value)}
                                                                className="w-full h-8 pl-3 pr-8 bg-muted border-0 rounded-md text-xs focus:ring-1 focus:ring-primary focus:bg-card transition-colors text-foreground"
                                                            />
                                                            <svg
                                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 max-h-80 overflow-y-auto p-2">
                                                        {teamsLoading ? (
                                                            <div className="p-4 text-center text-xs text-muted-foreground">Loading teams...</div>
                                                        ) : teams.filter((team: any) =>
                                                            team.name?.toLowerCase().includes(teamSearchQuery.toLowerCase())
                                                        ).length === 0 ? (
                                                            <div className="text-center py-8 space-y-3">
                                                                <p className="text-sm text-muted-foreground">
                                                                    {teamSearchQuery ? "No teams found" : "No teams available"}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            teams
                                                                .filter((team: any) =>
                                                                    team.name?.toLowerCase().includes(teamSearchQuery.toLowerCase())
                                                                )
                                                                .map((team: any) => {
                                                                    const isExpanded = expandedTeams[team.id];
                                                                    const isSelected = selectedTeams.includes(team.id);

                                                                    return (
                                                                        <div key={team.id} className="rounded-md border border-transparent hover:border-accent">
                                                                            <div
                                                                                className="flex items-center justify-between p-1 hover:bg-accent/50 cursor-pointer"
                                                                                onClick={() => toggleTeamExpand(team.id)}
                                                                            >
                                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => { e.stopPropagation(); toggleTeamExpand(team.id); }}
                                                                                    >
                                                                                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                                                    </button>

                                                                                    <Avatar className="h-9 w-9 shrink-0">
                                                                                        {(() => {
                                                                                            const avatar = getTeamAvatar(team);
                                                                                            if (avatar?.type === "image") return <AvatarImage src={avatar.src} alt={team.name} />;
                                                                                            if (avatar?.type === "icon") {
                                                                                                const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
                                                                                                if (iconObj) {
                                                                                                    const IconComponent = iconObj.icon;
                                                                                                    return (
                                                                                                        <div
                                                                                                            className="flex items-center justify-center w-full h-full rounded-full"
                                                                                                            style={{ backgroundColor: (avatar.color ?? "#6B7280") + "20" }}
                                                                                                        >
                                                                                                            <IconComponent size={22} color={avatar.color || "#FFFFFF"} />
                                                                                                        </div>
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

                                                                                    <p className="text-xs font-medium truncate">{team.name}</p>
                                                                                </div>

                                                                                <Checkbox
                                                                                    checked={isSelected}
                                                                                    onCheckedChange={(checked) => toggleTeamSelect(team.id, Boolean(checked))}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className="border-[#8E8E93]"
                                                                                />
                                                                            </div>

                                                                            {isExpanded && (
                                                                                <div className="pl-10 pr-2 pb-2 space-y-2">
                                                                                    {team.teamMembers?.length > 0 ? (
                                                                                        <>
                                                                                            {team.teamMembers.map((member: any) => {
                                                                                                const initials = member.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?";
                                                                                                const isMemberSelected = selectedMembers.includes(member.id);
                                                                                                return (
                                                                                                    <div key={member.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                                                            <Avatar className="h-7 w-7">
                                                                                                                <AvatarImage src={member.avatar} alt={member.name} />
                                                                                                                <AvatarFallback className="bg-yellow-100 dark:bg-yellow-950/40 text-orange-600 dark:text-orange-400 text-[11px] font-semibold">
                                                                                                                    {initials}
                                                                                                                </AvatarFallback>
                                                                                                            </Avatar>
                                                                                                            <span className="truncate">{truncate(member.name, 10)}</span>
                                                                                                        </div>
                                                                                                        <Checkbox
                                                                                                            checked={isMemberSelected}
                                                                                                            onCheckedChange={() => handleMemberSelect(member.id)}
                                                                                                            className="border-[#8E8E93]"
                                                                                                        />
                                                                                                    </div>
                                                                                                );
                                                                                            })}

                                                                                            <Button
                                                                                                type="button"
                                                                                                size="sm"
                                                                                                className="mt-1 w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                                                                                disabled={
                                                                                                    !team.teamMembers.some((m: any) => selectedMembers.includes(m.id))
                                                                                                }
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const teamMemberIds = team.teamMembers.map((m: any) => m.id);
                                                                                                    const alreadySelected = teamMemberIds.filter((id: string) =>
                                                                                                        selectedMembers.includes(id)
                                                                                                    );
                                                                                                    if (alreadySelected.length === 0) {
                                                                                                        toast("error", { title: "Error", description: "Select at least one member" });
                                                                                                        return;
                                                                                                    }
                                                                                                    if (!selectedTeams.includes(team.id)) {
                                                                                                        setSelectedTeams((prev: string[]) => [...prev, team.id]);
                                                                                                        setFormData((prev: any) => ({
                                                                                                            ...prev,
                                                                                                            assignedTeams: [...(prev.assignedTeams ?? []), team.id],
                                                                                                            assignedTo: Array.from(
                                                                                                                new Set([...(prev.assignedTo ?? []), team.id])
                                                                                                            ),
                                                                                                        }));
                                                                                                    } else {
                                                                                                        setFormData((prev: any) => ({
                                                                                                            ...prev,
                                                                                                            assignedTo: Array.from(
                                                                                                                new Set([...(prev.assignedTo ?? []), team.id])
                                                                                                            ),
                                                                                                        }));
                                                                                                    }
                                                                                                    toast("success", { title: "Success", description: `${alreadySelected.length} member(s) from "${team.name}" added` });
                                                                                                    setShowTeamPanel(false);
                                                                                                    setExpandedTeams({});
                                                                                                    setTeamSearchQuery("");
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
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}                            {formData.visibility === "organization" && (
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground pt-3">Only visible to</p>
                                    </div>

                                    <div className="flex-1 max-w-md space-y-2">
                                        {!showMemberPanel ? (
                                            <div className="flex justify-end">
                                                {selectedMembers.length > 0 ? (
                                                    renderMemberStack(() => setShowMemberPanel(true))
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-[320px] justify-between h-auto px-3 py-2 border border-border bg-card text-foreground hover:bg-muted"
                                                        onClick={() => setShowMemberPanel(true)}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Users size={16} className="text-muted-foreground" />
                                                            <span className="text-xs font-medium text-muted-foreground">Add Members</span>
                                                        </div>
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => {
                                                        setShowMemberPanel(false);
                                                        setMemberSearchQuery("");
                                                    }}
                                                />
                                                <div className="relative z-20  w-[320px] ml-auto  border border-border rounded-md bg-card shadow-sm">
                                                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                                                        <span className="text-sm font-semibold text-foreground">Workspace Members</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowMemberPanel(false);
                                                                setMemberSearchQuery("");
                                                            }}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="px-3 py-2 border-b border-border">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder="Search members..."
                                                                value={memberSearchQuery}
                                                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                                className="w-full h-8 pl-3 pr-8 bg-muted border-0 rounded-md text-xs focus:ring-1 focus:ring-primary focus:bg-card transition-colors text-foreground"
                                                            />
                                                            <svg
                                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 max-h-80 overflow-y-auto p-2">
                                                        {workspaceMembers.filter((member) =>
                                                            member.name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                                            member.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                                                        ).length === 0 ? (
                                                            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                                                                <Users className="w-8 h-8 mx-auto mb-1.5 text-muted-foreground/60" />
                                                                <p>{memberSearchQuery ? "No members found" : "No workspace members found"}</p>
                                                            </div>
                                                        ) : (
                                                            workspaceMembers
                                                                .filter((member) =>
                                                                    member.name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                                                    member.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                                                                )
                                                                .map((member) => {
                                                                    const isSelected = selectedMembers.includes(member.userId);
                                                                    return (
                                                                        <div
                                                                            key={member.userId}
                                                                            className="flex items-center justify-between p-1 rounded-md hover:bg-accent/50 cursor-pointer"
                                                                            onClick={() => handleMemberSelect(member.userId)}
                                                                        >
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <Avatar className="w-8 h-8 flex-shrink-0">
                                                                                    <AvatarImage
                                                                                        src={getProfilePictureUrl(member.profilePicture)}
                                                                                        alt={member.name}
                                                                                    />
                                                                                    <AvatarFallback className="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                                                                                        {(member.name || member.email || "?").charAt(0).toUpperCase()}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                                                                                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                                                                                </div>
                                                                            </div>

                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                onCheckedChange={() => handleMemberSelect(member.userId)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="border-[#8E8E93]"
                                                                            />
                                                                        </div>
                                                                    );
                                                                })
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        className="border border-border border-l-4 border-l-muted-foreground rounded-lg p-6 mb-3 bg-muted/40 transition-colors duration-200"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-base text-foreground mb-1 font-inter">
                                    Delete goal
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Delete the goal permanently
                                </p>
                            </div>
                            <Button
                                data-testid="delete-goal-btn"
                                variant="outline"
                                className="text-muted-foreground border-border hover:bg-muted hover:text-foreground transition-all"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 pb-12" data-testid="action-buttons-section">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isLoading || isSubmitting}
                            data-testid="cancel-button"
                            type="button"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={!isFormValid() || isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 min-w-[120px] transition-all"
                            data-testid="create-goal-button"
                            title={!isFormValid() ? "Please fill in goal name" : ""}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{previewGoalToEdit ? "Updating..." : "Creating..."}</span>
                                </span>
                            ) : (
                                <span>{previewGoalToEdit ? "Update Goal" : "Create Goal"}</span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
