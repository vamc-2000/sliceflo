
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useGoalsStore } from "@/stores/goals-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
    MoreHorizontal,
    Star,
    Share2,
    Check,
    Settings,
    Archive,
    Trash2,
    Loader2,
    UserPlus,
    Tag,
    Search,
    Users,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import GoalMembersSection from "@/components/Goals/GoalMembersSection";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { Goal, GoalTarget, TARGET_TYPE_COLORS } from "@/types/goal.types";
import { format } from "date-fns";
import { useProfileStore } from "@/stores/profile-store";
import { Profile } from "@/types/profile.types";
import CreateTargetModal from "@/components/Goals/CreateTargetModal";
import { TargetsSection } from "@/components/Goals/TargetsSection";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TargetsProgressFilters } from "@/components/Goals/TargetsProgressFilters";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { TestLoader } from "@/components/TestLoader";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects-store";
import { GoalDetailSkeleton } from "@/components/Goals/GoalDetailSkeleton";


export default function GoalDetailPage() {
    const router = useRouter();
    const params = useParams();
    const goalId = params.id as string;
    const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const {
        getGoalById,
        updateGoal,
        fetchTargetsForGoal,
        targetsByGoal,
        isLoading,
        toggleFavorite,

    } = useGoalsStore();

    // const targets: GoalTarget[] = targetsByGoal[goalId] || [];
    // const targets = useGoalsStore(state => (state.targetsByGoal[goalId] ?? []) as GoalTarget[]);
    const rawTargets = useGoalsStore(state => state.targetsByGoal[goalId]);
    const targets = useMemo(() => (rawTargets ?? []) as GoalTarget[], [rawTargets]);

    const [goal, setGoal] = useState<Goal | null>(null);
    const [description, setDescription] = useState("");
    // const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // const { fetchUserProfileById } = useProfileStore();
    const [ownerProfiles, setOwnerProfiles] = useState<Record<string, Profile>>(
        {}
    );
    const [assignedProfiles, setAssignedProfiles] = useState<
        Record<string, Profile>
    >({});
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [activeStepKey, setActiveStepKey] = useState<string | null>(null);

    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [isMembersPopoverOpen, setIsMembersPopoverOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<GoalTarget | null>(null);

    // const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    // const [activeTarget, setActiveTarget] = useState<GoalTarget | null>(null);

    // useEffect(() => {
    //     if (!goal) return;

    //     const ownerProfilesMap: Record<string, Profile> = {};
    //     const assignedProfilesMap: Record<string, Profile> = {};

    //     const usersData = goal.users || goal.assignedTo || [];

    //     usersData.forEach((user: any) => {
    //         const userId = user._id || user.id;
    //         if (!userId) return;

    //         const profile: Profile = {
    //             _id: userId,
    //             name: user.name || "",
    //             email: user.email || "",
    //             profilePictureUrl: user.profilePicture || "",
    //         } as Profile;

    //         if (goal.owners?.includes(userId)) {
    //             ownerProfilesMap[userId] = profile;
    //         }

    //         const isAssigned = goal.assignedTo?.some((item: any) => {
    //             if (typeof item === "string") return item === userId;
    //             return item._id === userId || item.id === userId;
    //         });

    //         if (isAssigned) {
    //             assignedProfilesMap[userId] = profile;
    //         }
    //     });

    //     setOwnerProfiles(ownerProfilesMap);
    //     setAssignedProfiles(assignedProfilesMap);
    // }, [goal]);

    useEffect(() => {
        if (!goal) return;

        const ownerProfilesMap: Record<string, Profile> = {};
        const assignedProfilesMap: Record<string, Profile> = {};

        // First, try to get data from goal.users
        // Merge users and assignedTo to get as many profile candidates as possible
        const usersData = [...(goal.users || []), ...(goal.assignedTo || [])];

        usersData.forEach((user: any) => {
            if (!user) return;

            // Handle both object and string ID
            if (typeof user === 'string') return;
            const userId = user._id || user.id;
            if (!userId) return;

            const profile: Profile = {
                _id: userId,
                name: user.name || "",
                email: user.email || "",
                profilePictureUrl: user.profilePicture || user.profilePictureUrl || "",
            } as Profile;

            const isOwner = goal.owners?.some((owner: any) => {
                const ownerId = typeof owner === 'string' ? owner : (owner._id || owner.id);
                return ownerId === userId;
            });

            if (isOwner) {
                ownerProfilesMap[userId] = profile;
            }

            const isAssigned = goal.assignedTo?.some((item: any) => {
                const assignedId = typeof item === "string" ? item : (item._id || item.id);
                return assignedId === userId;
            });

            if (isAssigned) {
                assignedProfilesMap[userId] = profile;
            }
        });

        if (goal.owners && goal.owners.length > 0) {
            goal.owners.forEach((owner: any) => {
                const ownerId = typeof owner === 'string' ? owner : (owner._id || owner.id);
                if (!ownerId) return;

                if (typeof owner === 'object' && !ownerProfilesMap[ownerId]) {
                    ownerProfilesMap[ownerId] = {
                        _id: ownerId,
                        name: owner.name || "",
                        email: owner.email || "",
                        profilePictureUrl: owner.profilePicture || owner.profilePictureUrl || "",
                    } as Profile;
                }

                // Fallback to workspace members lookup
                if (!ownerProfilesMap[ownerId] && workspaceMembers.length > 0) {
                    const member = workspaceMembers.find((m) => m.userId === ownerId);
                    if (member) {
                        ownerProfilesMap[ownerId] = {
                            _id: member.userId,
                            name: member.name || "",
                            email: member.email || "",
                            profilePictureUrl: member.profilePicture || member.avatar || (member as any).profilePictureUrl || "",
                        } as Profile;
                    }
                }
            });
        }

        if (goal.assignedTo && goal.assignedTo.length > 0 && workspaceMembers.length > 0) {
            goal.assignedTo.forEach((item: any) => {
                const userId = typeof item === "string" ? item : (item._id || item.id);
                if (userId && !assignedProfilesMap[userId]) {
                    const member = workspaceMembers.find((m) => m.userId === userId);
                    if (member) {
                        assignedProfilesMap[userId] = {
                            _id: member.userId,
                            name: member.name || "",
                            email: member.email || "",
                            profilePictureUrl: member.profilePicture || member.avatar || (member as any).profilePictureUrl || "",
                        } as Profile;
                    }
                }
            });
        }

        setOwnerProfiles(ownerProfilesMap);
        setAssignedProfiles(assignedProfilesMap);
    }, [goal, workspaceMembers]);

    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchWorkspaceMembers(currentWorkspace.id);
        }
    }, [currentWorkspace?.id]);


    const loadGoal = async () => {
        if (!goalId || !currentWorkspace?.id) return;

        try {
            const goalData = await getGoalById(goalId, false, currentWorkspace.id);
            console.log(' goalData after getGoalById:', goalData)

            if (!goalData) {
                console.log(' goalData is null/undefined — returning early')
                return;

            }
            console.log(' workspaceId check:', goalData.workspaceId, '===', currentWorkspace.id, '?', goalData.workspaceId === currentWorkspace.id)

            // if (goalData.workspaceId !== currentWorkspace.id) {
            //     router.push(`/goals/${currentWorkspace.id}`);
            //     return;
            // }
            // if (goalData.workspaceId !== currentWorkspace.id) {
            //     router.push(`/goals`);
            //     return;
            // }
           


            setGoal(goalData);
            setDescription(goalData.description || "");
         
            console.log("Goal endDate:", goalData.endDate, "Type:", typeof goalData.endDate);
            await fetchTargetsForGoal(goalId, currentWorkspace.id);
        } catch (error) {
            console.error("Failed to load goal", error);
        }
    };



    useEffect(() => {
        if (goalId && currentWorkspace?.id) {
            loadGoal();
        }
    }, [goalId, currentWorkspace?.id]);



    // const handleDescriptionSave = async () => {
    //     if (!goal) return;
    //     const previousDescription = goal.description;
    //     setGoal({ ...goal, description });
    //     setIsEditingDescription(false);
    //     setIsSaving(true);
    //     try {
    //         await updateGoal(goal.id, { description });
    //         setIsSaving(false);
    //     } catch (error) {
    //         console.error("Failed to update description:", error);
    //         setGoal({ ...goal, description: previousDescription });
    //         setDescription(previousDescription);
    //         setIsSaving(false);
    //     }
    // };
    const handleDescriptionSave = async () => {
        if (!goal) return;
        const previousDescription = goal.description;
        setGoal({ ...goal, description });
        setIsSaving(true);
        try {
            await updateGoal(goal.id, { description }, true, currentWorkspace?.id);
            setIsSaving(false);
            toast("success", { title: "Success", description: "Goal description updated successfully" });
        } catch (error) {
            console.error("Failed to update description:", error);
            setGoal({ ...goal, description: previousDescription });
            setDescription(previousDescription);
            setIsSaving(false);
            toast("error", { title: "Error", description: "Failed to update description" });
        }
    };


    const handleDescriptionChange = (content: string) => {
        setDescription(content);
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            handleDescriptionSave();
        }, 1000);
    };
    const formatDate = (dateString: string | undefined | null, p0: string) => {
        if (!dateString || dateString.trim() === "") return "Not set";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn("Invalid date string:", dateString);
                return "Not set";
            }
            return format(date, "dd MMM yyyy");
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return "Not set";
        }
    };

    const formatCreatedDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd,yyyy");
        } catch {
            return "Recently";
        }
    };

    // const handleOpenUpdateTarget = (target: GoalTarget) => {
    //     setActiveTarget(target);
    //     setIsUpdateModalOpen(true);
    // };

    const handleOpenCreateTarget = () => {
        setEditingTarget(null);
        setIsTargetModalOpen(true);
    };

    const handleOpenEditTarget = (target: GoalTarget) => {
        setEditingTarget(target);
        setIsTargetModalOpen(true);
    };

    const completion =
        goal?.targets?.length
            ? Math.round(
                (goal.targets.filter((t: any) => t.completed).length /
                    goal.targets.length) *
                100
            )
            : 0;


    const getTextColor = (color: string) => {
        switch (color) {
            case "gray":
                return "text-muted-foreground";
            case "orange":
                return "text-orange-600 dark:text-orange-400";
            case "green":
                return "text-emerald-600 dark:text-emerald-400";
            case "yellow":
                return "text-yellow-600 dark:text-yellow-400";
            case "blue":
                return "text-blue-600 dark:text-blue-400";
            default:
                return "text-muted-foreground";
        }
    };
    const getHoverBg = (color: string) => {
        switch (color) {
            case "gray":
                return "hover:bg-muted";
            case "orange":
                return "hover:bg-orange-50 dark:hover:bg-orange-950/20";
            case "green":
                return "hover:bg-emerald-50 dark:hover:bg-emerald-950/20";
            case "yellow":
                return "hover:bg-yellow-50 dark:hover:bg-yellow-950/20";
            case "blue":
                return "hover:bg-blue-50 dark:hover:bg-blue-900/20";
            default:
                return "hover:bg-muted";
        }
    };

    const getSelectedBg = (color: string) => {
        switch (color) {
            case "gray":
                return "bg-muted";
            case "orange":
                return "bg-orange-100 dark:bg-orange-900/30";
            case "green":
                return "bg-emerald-100 dark:bg-emerald-900/30";
            case "yellow":
                return "bg-yellow-100 dark:bg-yellow-900/30";
            case "blue":
                return "bg-blue-100 dark:bg-blue-900/30";
            default:
                return "bg-muted";
        }
    };


    if (!goal && !isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="max-w-md rounded-2xl bg-card px-6 py-8 shadow-sm border border-border text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <span className="text-destructive text-lg">!</span>
                    </div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Goal not found
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This goal does not exist or you no longer have access to it.
                    </p>
                    <button
                        onClick={() => router.push(`/goals`)}
                        className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        Back to goals
                    </button>
                </div>
            </div>
        );
    }
    if (!goal) {
        return <GoalDetailSkeleton />
    }
    const safeTargets = (targets || []).filter(Boolean);
    const targetCounts = {
        number: safeTargets.filter((t) => t?.type === "number").length,
        boolean: safeTargets.filter((t) => t?.type === "boolean").length,
        currency: safeTargets.filter((t) => t?.type === "currency").length,
        boards: safeTargets.filter((t) => t?.type === "task").length,
    };


    const totalTargets = targets.length || 10;

    const steps = [
        { key: "name", label: "Goal Name & Description", completed: true },
        {
            key: "owner",
            label: "Assign Owner",
            completed: !!goal.title && !!goal.description && goal.description.trim() !== ""
        },
        {
            key: "access",
            label: "Give Access to Goal",
            completed: !!goal.visibility
        },
        { key: "endDate", label: "Goal End Date", completed: !!goal.endDate },
    ];

    const getUserId = (item: any): string => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
            return item._id || item.id || item.userId || "";
        }
        return "";
    };

    const handleAddAssignee = async (userId: string) => {
        if (!goal) return;
        try {
            const { addGoalMember, getGoalById } = useGoalsStore.getState();
            await addGoalMember(goal.id, userId);
            const updatedGoal = await getGoalById(goal.id, true);
            if (updatedGoal) setGoal(updatedGoal);
        } catch (err) {
            toast("error", { title: "Failed to add member" });
        }
    };

    const handleRemoveAssignee = async (userId: string) => {
        if (!goal) return;
        try {
            const { removeGoalMember, getGoalById } = useGoalsStore.getState();
            await removeGoalMember(goal.id, userId);
            const updatedGoal = await getGoalById(goal.id, true);
            if (updatedGoal) setGoal(updatedGoal);
        } catch (err) {
            toast("error", { title: "Failed to remove member" });
        }
    };

    const getPercentage = (count: number) => {
        return totalTargets > 0 ? (count / totalTargets) * 100 : 0;
    };

    const filteredTargets = selectedFilter
        ? targets.filter((t) => t.type === selectedFilter)
        : targets;


    return (
        <div className="overflow-hidden h-full flex flex-col bg-background">
            {/* Top Breadcrumb */}
            <div className="border-b sticky top-0 bg-background z-10">
                <Breadcrumbs />
            </div>

            <div className="flex-1 flex flex-col min-h-0 p-1 sm:p-4">
                {isSaving && (
                    <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-[999]">
                        Saving...
                    </div>
                )}

                <div
                    className="rounded-2xl border border-b-[8px] sm:border-b-[10px] shadow-sm p-3 bg-card z-20"
                    style={{
                        borderBottomColor: goal.color || 'hsl(var(--muted))'
                    }}
                    data-testid="goal-detail-header"
                >

                    {/* 3-COLUMN GRID LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_180px] xl:grid-cols-[200px_1fr_200px] gap-x-3 gap-y-2 mx-auto px-1">

                        {/* COLUMN 1: GOALS REPORT */}
                        <div className="space-y-2 flex flex-col items-center lg:items-start" data-testid="column-report">
                            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" data-testid="goals-report-heading">
                                Goals Report
                            </h2>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="relative w-50 h-50 lg:w-50 lg:h-50 flex-shrink-0 mt-10"
                            >
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-0.5">
                                    <span className="text-3xl font-bold text-foreground opacity-90">{completion}%</span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="grad-red" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#fca5a5" />
                                                <stop offset="100%" stopColor="#dc2626" />
                                            </linearGradient>
                                            <linearGradient id="grad-yellow" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#fdf08a" />
                                                <stop offset="100%" stopColor="#ca8a04" />
                                            </linearGradient>
                                            <linearGradient id="grad-pink" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#f9a8d4" />
                                                <stop offset="100%" stopColor="#db2777" />
                                            </linearGradient>
                                            <linearGradient id="grad-green" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#86efac" />
                                                <stop offset="100%" stopColor="#16a34a" />
                                            </linearGradient>
                                            <linearGradient id="grad-black" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#6b7280" />
                                                <stop offset="100%" stopColor="#111827" />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={[
                                                { name: 'Red', value: 20 },
                                                { name: 'Yellow', value: 20 },
                                                { name: 'Pink', value: 20 },
                                                { name: 'Green', value: 20 },
                                                { name: 'Black', value: 20 }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="75%"
                                            outerRadius="100%"
                                            paddingAngle={-10}
                                            cornerRadius={12}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                            stroke="none"
                                            isAnimationActive={true}
                                        >
                                            <Cell fill="url(#grad-red)" />
                                            <Cell fill="url(#grad-yellow)" />
                                            <Cell fill="url(#grad-pink)" />
                                            <Cell fill="url(#grad-green)" />
                                            <Cell fill="url(#grad-black)" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </motion.div>
                        </div>

                        {/* COLUMN 2: MAIN CONTENT AREA */}
                        <div className="space-y-4" data-testid="column-content">
                            {/* GOAL HEADER */}
                            <div className="flex items-center justify-between gap-3 w-full" data-testid="goal-header">
                                {/* Left Side: Title, Tag, Date */}
                                <div className="flex items-center gap-2.5 flex-wrap" data-testid="goal-header-left">
                                    <h1 className="text-xl font-semibold text-foreground tracking-tight" data-testid="goal-title">
                                        {goal.title}
                                    </h1>
                                    {/* <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Tag className="w-3 h-3 text-primary-foreground" />
                                    </div> */}
                                    <span
                                        className="text-muted-foreground text-[10px] font-semibold bg-muted/30 border border-border/50 px-3 py-1 rounded-md uppercase tracking-wider"
                                        data-testid="goal-created-date"
                                    >
                                        Created {goal.createdAt ? formatCreatedDate(goal.createdAt) : "Recently"}
                                    </span>
                                </div>

                                {/* Right Side: Owner & Actions */}
                                <div className="flex items-center gap-1.5" data-testid="goal-header-actions">
                                    {goal.owners && goal.owners.length > 0 && (() => {
                                        const firstOwner = goal.owners[0];
                                        const firstOwnerId = typeof firstOwner === 'string' ? firstOwner : (firstOwner._id || firstOwner.id);
                                        const profile = ownerProfiles[firstOwnerId];

                                        return (
                                            <div className="relative group mr-1" data-testid={`owner-avatar-container-${firstOwnerId}`}>
                                                {profile?.profilePictureUrl ? (
                                                    <img
                                                        src={profile.profilePictureUrl.startsWith('http') ? profile.profilePictureUrl : `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${profile.profilePictureUrl}`}
                                                        alt="Owner"
                                                        className="w-8 h-8 rounded-full object-cover"
                                                        title={profile.name || profile.email || firstOwnerId}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold border-[2px] border-primary shadow-sm hover:scale-105 transition-transform">
                                                        {(profile?.name || "?")[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="bg-primary/5 hover:bg-primary/15 h-8 w-8 rounded-full"
                                        onClick={() => toggleFavorite(goal.id, currentWorkspace?.id)}
                                    >
                                        <Star className={cn("w-3.5 h-3.5 text-primary", goal.isFavorite && "fill-yellow-400 text-yellow-400")} />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="bg-primary/5 hover:bg-primary/15 h-8 w-8 rounded-full"
                                    >
                                        <Share2 className="w-3.5 h-3.5 text-primary" />
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-muted-foreground hover:text-foreground p-1.5 h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border border-border bg-popover text-popover-foreground">
                                            <DropdownMenuItem className="text-xs py-2" onClick={() => router.push(`/goals/create?previewGoalId=${goal.id}`)}>
                                                <Settings className="w-3.5 h-3.5 mr-2" />
                                                <span>Goal settings</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-xs py-2">
                                                <Archive className="w-3.5 h-3.5 mr-2" />
                                                <span>Archive</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs py-2 text-red-600">
                                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                <span>Delete</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* RICHTEXT EDITOR AREA */}
                            <div className="w-full  border border-border rounded-xl shadow-sm bg-background overflow-hidden" data-testid="editor-container">
                                <ProseMirrorEditor
                                    initialContent={description}
                                    mentionableMembers={workspaceMembers.map(m => ({
                                        id: m.userId,
                                        name: m.name,
                                        avatar: m.avatar
                                    }))}
                                    onBlur={(newContent) => {
                                        if (goalId) {
                                            updateGoal(goalId, { description: newContent });
                                        }
                                    }}
                                    placeholder="Goal Description....."
                                    className="w-full min-h-[60px] max-h-[140px] overflow-y-auto text-[13px] scrollbar-none"
                                    editable={true}
                                />
                            </div>

                            {/* ASSIGNED MEMBERS & PROGRESS BARS */}
                            <div className="space-y-4 pt-1">
                                {/* Avatars */}
                                <div className="flex items-center" data-testid="assigned-members-container">
                                    {(goal.assignedTo || []).slice(0, 5).map((item, index) => {
                                        const userId = getUserId(item);
                                        const profile = assignedProfiles[userId];
                                        return (
                                            <div key={index} className="relative group" style={{ marginLeft: index > 0 ? "-10px" : "0" }}>
                                                <Avatar className="w-8 h-8 border-[2px] border-card shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                                    <AvatarImage 
                                                        src={profile?.profilePictureUrl?.startsWith('http') ? profile.profilePictureUrl : (profile?.profilePictureUrl ? `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${profile.profilePictureUrl}` : undefined)} 
                                                        alt={profile?.name || "User"} 
                                                    />
                                                    <AvatarFallback className="bg-orange-100 text-orange-700 text-[11px] font-bold">
                                                        {(profile?.name || "?")[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                        );
                                    })}

                                    <Popover open={isMembersPopoverOpen} onOpenChange={setIsMembersPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <div
                                                className="w-8 h-8 rounded-full bg-[#001F3F] hover:bg-[#001F3F]/90 text-white flex items-center justify-center border-[2px] border-card shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                                style={{ marginLeft: (goal.assignedTo || []).length > 0 ? "-10px" : "0" }}
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-4 border border-b-[5px] border-b-[#001F3F]" align="start">
                                            <GoalMembersSection
                                                goalId={goal.id}
                                                members={goal.assignedTo || []}
                                                onAddMember={handleAddAssignee}
                                                onRemoveMember={handleRemoveAssignee}
                                                onInviteClick={() => {
                                                    setIsMembersPopoverOpen(false);
                                                    toast("info", { title: "Invite dialog coming soon" });
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                            </div>
                        </div>

                        {/* COLUMN 3: STEPS & DEADLINE */}
                        <div className="flex flex-col justify-between lg:row-span-2 pt-2 lg:pt-0" data-testid="column-steps">
                            {/* STEPS LIST */}
                            <div className="space-y-1 lg:pl-3" data-testid="steps-container">
                                {steps.map((step, index) => {
                                    const isCompleted = step.completed;
                                    const isLast = index === steps.length - 1;
                                    return (
                                        <div key={index} className="flex items-start gap-3 h-13">
                                            <div className="flex flex-col items-center flex-shrink-0 mt-1">
                                                <div
                                                    className="w-5 h-5 rounded-full border-[2px] flex items-center justify-center transition-colors duration-200"
                                                    style={{ borderColor: isCompleted ? '#10b981' : 'var(--brand-orange)' }}
                                                >
                                                    <div className="w-2.5 h-2.5 rounded-full transition-colors duration-200" style={{ backgroundColor: isCompleted ? '#10b981' : 'var(--brand-orange)' }} />
                                                </div>
                                                {!isLast && <div className="w-[2px] h-7 mt-0.5 transition-colors duration-200" style={{ backgroundColor: isCompleted ? '#10b981' : 'var(--brand-orange)' }} />}
                                            </div>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "text-[13px] font-medium transition-colors text-left leading-tight mt-1",
                                                    isCompleted ? "text-muted-foreground" : "text-primary font-semibold hover:underline underline-offset-2"
                                                )}
                                                onClick={() => router.push(`/goals/create?previewGoalId=${goal.id}&focusField=${step.key}`)}
                                            >
                                                {step.label}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* END DATE CHIP */}
                            <div className="mt-8 flex justify-start lg:justify-end" data-testid="end-date-section">
                                <div className="bg-muted/60 rounded-xl px-4 py-2 shadow-sm border border-border/80">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                        End Date:{" "}
                                        <span className={cn(
                                            "ml-1.5",
                                            goal?.endDate
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                        )}>
                                            {goal?.endDate ? formatDate(goal.endDate, 'do MMMM') : "Not set"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* ROW 2: PROGRESS BARS (Spanning Col 1 & 2) */}
                        <div className="lg:col-span-2 lg:col-start-1" data-testid="column-progress">

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10">
                                {[
                                    { key: 'number', label: 'Number', count: targetCounts.number, },
                                    { key: 'boolean', label: 'True / False', count: targetCounts.boolean, },
                                    { key: 'currency', label: 'Currency', count: targetCounts.currency, },
                                    { key: 'task', label: 'Projects', count: targetCounts.boards, },
                                ]
                                    .filter(item => item.count > 0)
                                    .map((item) => (
                                        <div key={item.key} className="flex items-center gap-2 min-w-0">
                                            {/* Label */}
                                            <span
                                                className="text-[11px] font-semibold whitespace-nowrap"
                                                style={{ color: TARGET_TYPE_COLORS[item.key] ?? '#9BB2DC' }}
                                            >
                                                {item.label}
                                            </span>

                                            {/* Bar — grows to fill space */}
                                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                                    style={{
                                                        width: `${getPercentage(item.count)}%`,
                                                        backgroundColor: TARGET_TYPE_COLORS[item.key] ?? '#9BB2DC'
                                                    }}
                                                />
                                            </div>

                                            {/* Count + filter icon */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                                                    {item.count}/{totalTargets}
                                                </span>
                                                <div
                                                    className={cn(
                                                        "w-3.5 h-3.5 cursor-pointer transition-all",
                                                        "[mask-image:url(/images/Filter.svg)] [mask-repeat:no-repeat] [mask-position:center] [mask-size:contain]",
                                                        "[WebkitMaskImage:url(/images/Filter.svg)] [WebkitMaskRepeat:no-repeat] [WebkitMaskPosition:center] [WebkitMaskSize:contain]",
                                                        item.key === 'number' && "bg-[#9BB2DC]",
                                                        item.key === 'boolean' && "bg-[#FF9500]",
                                                        item.key === 'currency' && "bg-[#34C759]",
                                                        item.key === 'task' && "bg-[#A2845E]",
                                                        selectedFilter === item.key ? "opacity-100 scale-110" : "opacity-60 hover:opacity-100"
                                                    )}
                                                    onClick={() => setSelectedFilter(selectedFilter === item.key ? null : item.key)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                    </div>

                </div> {/* End of Header/Content container (484) */}

                <div
                    className="flex-1 overflow-y-auto scrollbar-none"
                    data-testid="targets-scroll-container"
                >
                    {/* Clear filter banner */}
                    {selectedFilter && (
                        <div
                            className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-md mb-3"
                            data-testid="clear-filter-banner"
                        >
                            <span
                                className="text-sm text-blue-700 dark:text-blue-300"
                                data-testid="filter-count-display"
                            >
                                Showing {filteredTargets.length} {selectedFilter} target(s)
                            </span>
                            <button
                                onClick={() => setSelectedFilter(null)}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                                data-testid="clear-filter-button"
                            >
                                Clear filter
                            </button>
                        </div>
                    )}

                    {/* Access popup */}
                    {activeStepKey === "access" && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                            data-testid="access-modal"
                        >
                            <div className="w-full max-w-md rounded-lg bg-card p-4 shadow-lg border border-border" data-testid="access-modal-content">
                                <div className="flex items-center justify-between mb-3" data-testid="access-modal-header">
                                    <h3 className="text-sm font-semibold" data-testid="access-modal-title">
                                        Give Access to Goal
                                    </h3>
                                    <button
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => setActiveStepKey(null)}
                                        data-testid="access-modal-close"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <p className="text-xs text-muted-foreground mb-3" data-testid="access-modal-description">
                                    Select who should have access to this goal.
                                </p>

                                {/* your access fields go here */}

                                <div className="mt-4 flex justify-end gap-2" data-testid="access-modal-actions">
                                    <button
                                        className="px-3 py-1 text-xs rounded border border-border text-foreground hover:bg-muted"
                                        onClick={() => setActiveStepKey(null)}
                                        data-testid="access-modal-cancel"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-3 py-1 text-xs rounded bg-emerald-600 dark:bg-emerald-500 text-white hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                            // save changes (update goal access) then:
                                            setActiveStepKey(null);
                                        }}
                                        data-testid="access-modal-save"
                                    >
                                        Save access
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <TargetsSection
                        goalId={goal.id}
                        targets={filteredTargets}
                        onOpenCreateTarget={handleOpenCreateTarget}
                        // onOpenUpdateTarget={handleOpenUpdateTarget}
                        onOpenEditTarget={handleOpenEditTarget}
                        isLoading={isLoading}
                        data-testid="targets-section"
                    />

                    <CreateTargetModal
                        isOpen={isTargetModalOpen}
                        onClose={() => setIsTargetModalOpen(false)}
                        goalId={goalId}
                        goalName={goal?.title || "Goal"}
                        targetToEdit={editingTarget}
                        goalAssignedTo={goal.assignedTo || []}
                        data-testid="create-target-modal"
                    />


                </div>

            </div>

        </div>
    );

}



