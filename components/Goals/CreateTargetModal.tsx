

"use client";

import { useEffect, useState } from "react";
import { X, Calendar, ChevronDown, Search, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { cn } from "@/lib/utils";
import { useGoalsStore } from "@/stores/goals-store";
import { GoalTarget, TargetType } from "@/types/goal.types";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";


// Dummy data for projects, milestones, and tasks

const dummyMilestones = [
    { id: "mile-1", name: "Q1 Product Launch", project: "Project AAA", owner: "John Doe" },
    { id: "mile-2", name: "Backend API Development", project: "Project BBB", owner: "Jane Smith" },
    { id: "mile-3", name: "UI/UX Design Phase", project: "Project CCC", owner: "Mike Johnson" },
    { id: "mile-4", name: "Testing & QA", project: "Project DDD", owner: "Sarah Williams" },
];

const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "AED", name: "United Arab Emirates Dirham", symbol: "dh" },
    { code: "AFN", name: "Afghan Afghani", symbol: "؋" },
    { code: "ALL", name: "Albanian Lek", symbol: "L" },
    { code: "AMD", name: "Armenian Dram", symbol: "֏" },
    { code: "ANG", name: "Netherlands Antillean Guilder", symbol: "ƒ" },
];



interface CreateTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    goalId: string;
    goalName: string;
    targetToEdit?: GoalTarget | null;
    goalAssignedTo?: any[]; // members assigned to the parent goal
}

export default function CreateTargetModal({
    isOpen,
    onClose,
    goalId,
    goalName,
    targetToEdit,
    goalAssignedTo = [],
}: CreateTargetModalProps) {
    const { createTarget, updateTarget, currentGoal } = useGoalsStore();
    const { workspaceMembers } = useWorkspaceStore();
    const { user: currentUser } = useProfileStore();
    const { projects, fetchProjects, getMembersByProject } = useProjectsStore();
    const { tasks } = useTasksStore();
    const { currentWorkspace } = useWorkspaceStore();

    const fetchTasks = useTasksStore(state => state.fetchTasks);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen, fetchProjects]);

    // Fetch tasks for each project once projects are loaded
    useEffect(() => {
        if (isOpen && projects.length > 0) {
            projects.forEach(project => {
                if (project.id) fetchTasks(project.id);
            });
        }
    }, [isOpen, projects, fetchTasks]);

    const [targetName, setTargetName] = useState("");
    const [startDate, setStartDate] = useState<Date>();
    const [targetDate, setTargetDate] = useState<Date>();
    const [description, setDescription] = useState("");
    const [owner, setOwner] = useState("");
    const [selectedOwner, setSelectedOwner] = useState<{
        userId: string;
        name: string;
        email: string;
        profilePicture?: string;
    } | null>(null);
    const [selectedType, setSelectedType] = useState<string>("");
    const [selectedColor, setSelectedColor] = useState("#6366F1");

    const [startNumber, setStartNumber] = useState<string>("0");
    const [targetNumber, setTargetNumber] = useState<string>("0");

    const [startCurrency, setStartCurrency] = useState<string>("0");
    const [targetCurrency, setTargetCurrency] = useState<string>("0");
    const [selectedCurrency, setSelectedCurrency] = useState("USD");

    const [isProjectPopoverOpen, setIsProjectPopoverOpen] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"project" | "milestones" | "tasks">("project");
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    const toggleProjectExpand = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    const targetTypes = [
        {
            id: "number",
            name: "Number",
            subtitle: "Any Number like 1 or 2",
            color: "bg-[#9BB2DC33] border-[#9BB2DC33]",
            icon: <img src="/images/group.svg" alt="Number" className="w-5 h-5" />,
            textColor: "#9BB2DC",
        },
        {
            id: "boolean",
            name: "True / False",
            subtitle: "Done or Not Done",
            color: "bg-[#FF950033] border-[#FF950033]",
            textColor: "#FF9500",
            icon: <img src="/images/vector.svg" alt="Boolean" className="w-5 h-5" />,
        },
        {
            id: "currency",
            name: "Currency",
            subtitle: "Show me the Money",
            color: "bg-[#34C75933] border-[#34C75933]",
            textColor: "#34C759",
            icon: <img src="/images/Dollar.svg" alt="Currency" className="w-5 h-5" />,
        },
        {
            id: "projects",
            name: "Projects",
            subtitle: "Track Completion of Tasks",
            color: "bg-[#D3B79A33] border-[#D3B79A33]",
            icon: <img src="/images/Icon.svg" alt="Projects" className="w-5 h-5" />,
            textColor: "#A2845E",
        },
    ];

    // useEffect(() => {
    //     if (!targetToEdit) {
    //         setTargetName("");
    //         setTargetDate(undefined);
    //         setDescription("");
    //         setOwner("");
    //         setSelectedType("");
    //         setStartNumber(0);
    //         setTargetNumber(0);
    //         return;
    //     }

    //     setTargetName(targetToEdit.label);
    //     setSelectedType(targetToEdit.type);
    //     setStartNumber(targetToEdit.value?.start ?? 0);
    //     setTargetNumber(targetToEdit.value?.end ?? 0);
    // }, [targetToEdit]);

    useEffect(() => {
        if (!isOpen) {
            setTargetName("");
            setStartDate(undefined);
            setTargetDate(undefined);
            setDescription("");
            setOwner("");
            setSelectedType("");
            setStartNumber("0");
            setTargetNumber("0");
            setStartCurrency("0");
            setTargetCurrency("0");
            setSelectedCurrency("USD");
            setSelectedProjects([]);
            setSelectedTasks([]);
            setSelectedMilestones([]);
            setSearchQuery("");
            setActiveTab("project");
            return;
        }

        if (!targetToEdit) {
            setTargetName("");
            setStartDate(undefined);
            setTargetDate(undefined);
            setDescription("");
            setOwner("");
            setSelectedType("");
            setStartNumber("0");
            setTargetNumber("0");
            setStartCurrency("0");
            setTargetCurrency("0");
            setSelectedCurrency("USD");
            setSelectedProjects([]);
            setSelectedTasks([]);
            setSelectedMilestones([]);
            return;
        }

        setTargetName(targetToEdit.label);
        setDescription(targetToEdit.description || "");
        setSelectedType(targetToEdit.type === "task" ? "projects" : targetToEdit.type);
        setSelectedTasks(targetToEdit.linkedTaskIds || []);
        setStartNumber(String(targetToEdit.value?.start ?? 0));
        setTargetNumber(String(targetToEdit.value?.end ?? 0));
        setStartCurrency(String(targetToEdit.value?.start ?? 0));
        setTargetCurrency(String(targetToEdit.value?.end ?? 0));
        setSelectedCurrency((targetToEdit as any).currencyType || targetToEdit.value?.currencyType || "USD");
        if (targetToEdit.startDate) {
            setStartDate(new Date(targetToEdit.startDate));
        } else {
            setStartDate(undefined);
        }
        if (targetToEdit.endDate) {
            setTargetDate(new Date(targetToEdit.endDate));
        } else {
            setTargetDate(undefined);
        }

        // Handle assignedTo — API returns a string ID on targets, not an array
        if (targetToEdit.assignedTo) {
            const rawAssigned = targetToEdit.assignedTo as any;
            let ownerId = '';
            if (typeof rawAssigned === 'string') {
                ownerId = rawAssigned;
            } else if (Array.isArray(rawAssigned) && rawAssigned.length > 0) {
                const first = rawAssigned[0];
                ownerId = typeof first === 'string' ? first : (first.userId || first._id || first.id || '');
            }
            if (ownerId) {
                const member = workspaceMembers.find(m => m.userId === ownerId);
                if (member) {
                    setSelectedOwner({
                        userId: member.userId,
                        name: member.name || '',
                        email: member.email || '',
                        profilePicture: member.profilePicture || undefined
                    });
                    setOwner(member.name || member.email || '');
                }
            }
        }
    }, [targetToEdit, isOpen, workspaceMembers]);

    const isFormValid = !!targetName.trim() &&
        !!targetDate &&
        !!selectedOwner &&
        (selectedType === 'projects'
            ? selectedTasks.length > 0
            : !!targetDate)

    const handleSave = async () => {
        if (!selectedType) {
            toast("error", { title: "Error", description: "Please select a target type" });
            return;
        }
        if (!targetName.trim()) {
            toast("error", { title: "Error", description: "Please enter a target name" });
            return;
        }
        const apiType: TargetType =
            selectedType === "projects" ? "task" : (selectedType as TargetType);

        try {
            if (!targetToEdit) {
                let body: any = {
                    label: targetName.trim(),
                    description: description.trim(),
                    type: apiType,
                    status: "not started",
                    color: selectedColor || "#6366F1",
                    assignedTo: selectedOwner ? selectedOwner.userId : null,
                    startDate: (startDate && !isNaN(startDate.getTime())) ? startDate.toISOString() : null,
                    endDate: (targetDate && !isNaN(targetDate.getTime())) ? targetDate.toISOString() : null,
                    targetDate: (targetDate && !isNaN(targetDate.getTime())) ? targetDate.toISOString() : null,
                };

                if (selectedType === "number") {
                    body.unit = "Number";
                    body.value = {
                        start: Number(startNumber) || 0,
                        end: Number(targetNumber) || 0,
                        current: Number(startNumber) || 0
                    };
                } else if (selectedType === "currency") {
                    body.unit = "Currency";
                    body.value = {
                        start: Number(startCurrency) || 0,
                        end: Number(targetCurrency) || 0,
                        current: Number(startCurrency) || 0,
                        currencyType: selectedCurrency
                    };
                } else if (selectedType === "boolean") {
                    body.value = false;
                } else if (selectedType === "projects") {
                    body.type = "task";
                    body.linkedTaskIds = selectedTasks.filter(id => id && id.trim() !== '');

                    delete body.value;
                }

                await createTarget(goalId, body, currentWorkspace?.id);
            } else {
                let updates: any = {
                    label: targetName.trim(),
                    description: description.trim(),
                    startDate: (startDate && !isNaN(startDate.getTime())) ? startDate.toISOString() : null,
                    endDate: (targetDate && !isNaN(targetDate.getTime())) ? targetDate.toISOString() : null,
                    targetDate: (targetDate && !isNaN(targetDate.getTime())) ? targetDate.toISOString() : null,
                    assignedTo: selectedOwner ? selectedOwner.userId : null,
                };

                if (selectedType === 'number') {
                    updates.value = {
                        start: Number(startNumber) || 0,
                        end: Number(targetNumber) || 0,
                    };
                } else if (selectedType === 'currency') {
                    updates.value = {
                        start: Number(startCurrency) || 0,
                        end: Number(targetCurrency) || 0,
                        currencyType: selectedCurrency,
                    };
                } else if (selectedType === 'boolean') {
                    updates.value = false;
                } else if (selectedType === 'projects') {
                    updates.linkedTaskIds = selectedTasks.filter(id => id && id.trim() !== '');
                } console.log(" Updating target with:", updates);
                await updateTarget(goalId, targetToEdit.id, updates, currentWorkspace?.id);
            }

            toast("success", { title: "Success", description: targetToEdit ? "Target updated successfully" : "Target created successfully" });
            onClose();
        } catch (error) {
            console.error(" Failed to save target:", error);
            toast("error", { title: "Error", description: "Failed to save target. Please try again." });
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
            <div className="bg-card text-card-foreground rounded-2xl shadow-xl shadow-black/20 w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-border">

                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-card z-10 border-border"
                    data-testid="modal-header"
                >
                    <div className="flex items-center gap-2" data-testid="modal-header-left">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-8 h-8"
                            onClick={onClose}
                            data-testid="modal-back-button"
                        >
                            <span className="text-sm">←</span>
                        </Button>
                        <h2
                            className="text-base font-semibold text-foreground"
                            data-testid="modal-title"
                        >
                            {goalName}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={onClose}
                        data-testid="modal-close-button"
                    >
                        <X size={16} />
                    </Button>
                </div>



                {/* Body */}
                <div className="px-6 py-6 space-y-2" data-testid="modal-body">
                    {/* Target Name & Date */}
                    <div
                        className="bg-muted rounded-lg p-5 mb-2"
                        data-testid="target-name-date-section"
                    >
                        <div
                            className="grid grid-cols-2 gap-3"
                            data-testid="name-date-grid"
                        >
                            <div data-testid="target-name-field">
                                <label
                                    className="block text-xs font-medium text-muted-foreground mb-1.5"
                                    data-testid="target-name-label"
                                >
                                    Target name
                                </label>
                                <Input
                                    value={targetName}
                                    onChange={(e) => setTargetName(e.target.value)}
                                    placeholder="e.g. Target name 1"
                                    className="bg-background h-9 text-sm border-border"
                                    data-testid="target-name-input"
                                />
                            </div>

                            <div data-testid="target-date-field">
                                <label
                                    className="block text-xs font-medium text-muted-foreground mb-1.5"
                                    data-testid="target-date-label"
                                >
                                    Target End Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-9 justify-start text-left font-normal bg-background text-sm border-border",
                                                !targetDate && "text-muted-foreground"
                                            )}
                                            data-testid="target-date-button"
                                        >
                                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                            {targetDate
                                                ? format(targetDate, "dd/MM/yyyy")
                                                : "Set a Target Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarPicker
                                            mode="single"
                                            selected={targetDate}
                                            onSelect={setTargetDate}
                                            initialFocus
                                            data-testid="target-date-calendar"
                                            disabled={(date) => date < new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    {/* Target Description */}
                    <div className="border border-border border-l-4 border-l-primary rounded-lg p-4 space-y-3 target-description-section">
                        <label className="block text-sm font-medium text-foreground mb-2" data-testid="description-label">
                            Target description
                        </label>
                        <ProseMirrorEditor
                            key={targetToEdit?.id || 'new-target'}
                            initialContent={description}
                            mentionableMembers={workspaceMembers.map(m => ({
                                id: m.userId,
                                name: m.name,
                                profilePictureUrl: m.avatar
                            }))}
                            onBlur={(content) => setDescription(content)}
                            placeholder="Add description..."
                            className="min-h-[120px] bg-background focus:ring-transparent border-border rounded-md"
                        />
                    </div>

                    {/* Target Owner */}
                    <div
                        className="border border-border border-l-4 border-l-primary rounded-lg bg-card px-5 py-5"
                        data-testid="target-owner-section"
                    >
                        <div
                            className="flex items-center justify-between gap-4"
                            data-testid="owner-content"
                        >
                            <div data-testid="owner-text">
                                <h3
                                    className="font-semibold text-sm text-foreground mb-0.5"
                                    data-testid="owner-title"
                                >
                                    Target owner
                                </h3>
                                <p
                                    className="text-xs text-muted-foreground"
                                    data-testid="owner-subtitle"
                                >
                                    Select an owner for the target
                                </p>
                            </div>

                            <div
                                className="w-[300px]"
                                data-testid="owner-input-container"
                            >
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div
                                            className="relative cursor-pointer"
                                            data-testid="owner-input-wrapper"
                                        >
                                            <Input
                                                value={owner}
                                                readOnly
                                                placeholder="Select Owner"
                                                className="bg-background border-border pl-10 pr-7 h-9 text-xs cursor-pointer"
                                                data-testid="target-owner-input"
                                            />

                                            <div
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                                                data-testid="owner-avatar-icon"
                                            >
                                                {(() => {
                                                    const pic = selectedOwner?.profilePicture;
                                                    const url = pic && pic.startsWith('http')
                                                        ? pic
                                                        : pic
                                                            ? `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${pic}`
                                                            : null;
                                                    return url ? (
                                                        <img
                                                            src={url}
                                                            alt={selectedOwner?.name || "Owner"}
                                                            className="w-6 h-6 rounded-full object-cover border border-border"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground font-bold bg-muted">
                                                            {(selectedOwner?.name || "👤").charAt(0).toUpperCase()}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hov:text-foreground text-xs pointer-events-none"
                                                data-testid="owner-dropdown-arrow"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[300px] p-0" align="end">
                                        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold">
                                            Select Target Owner
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="m-0" />
                                        <div className="max-h-[250px] overflow-y-auto">
                                            {/* Filter workspace members to only those assigned to the goal */}
                                            {workspaceMembers
                                                .filter(m => {
                                                    const assigned = goalAssignedTo.length > 0
                                                        ? goalAssignedTo
                                                        : (currentGoal?.assignedTo || []);
                                                    if (assigned.length === 0) return true; // show all if no filter
                                                    const assignedIds = assigned.map((item: any) =>
                                                        typeof item === 'string' ? item : (item._id || item.id)
                                                    );
                                                    return assignedIds.includes(m.userId);
                                                })
                                                .map((member) => (
                                                    <DropdownMenuItem
                                                        key={member.userId}
                                                        onSelect={() => {
                                                            setSelectedOwner({
                                                                userId: member.userId,
                                                                name: member.name || '',
                                                                email: member.email || '',
                                                                profilePicture: member.profilePicture || undefined
                                                            });
                                                            setOwner(member.name || member.email || '');
                                                        }}
                                                        className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-muted"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {(() => {
                                                                const pic = member.profilePicture || member.avatar;
                                                                const url = pic && pic.startsWith('http')
                                                                    ? pic
                                                                    : pic
                                                                        ? `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${pic}`
                                                                        : null;
                                                                return url ? (
                                                                    <img
                                                                        src={url}
                                                                        alt={member.name || "Member"}
                                                                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                                                                        {(member.name || member.email || "?").charAt(0).toUpperCase()}
                                                                    </div>
                                                                );
                                                            })()}
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-medium text-foreground truncate">
                                                                    {member.name} {member.userId === currentUser?._id && "(You)"}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground truncate">
                                                                    {member.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {selectedOwner?.userId === member.userId && (
                                                            <Check size={14} className="text-primary" />
                                                        )}
                                                    </DropdownMenuItem>
                                                ))}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>



                    {/* Type of Target */}
                    <div
                        className="border border-border border-l-4 border-l-primary rounded-lg bg-card px-4 py-3"
                        data-testid="target-type-section"
                    >
                        <div
                            className="flex gap-4 items-start"
                            data-testid="target-type-content"
                        >
                            {/* Left: label + description */}
                            <div
                                className="w-[200px]"
                                data-testid="target-type-label-section"
                            >
                                <h3
                                    className="font-semibold text-sm text-foreground mb-0.5"
                                    data-testid="target-type-title"
                                >
                                    Type of Target
                                </h3>
                                <p
                                    className="text-xs text-muted-foreground"
                                    data-testid="target-type-subtitle"
                                >
                                    How do you want to measure this result?
                                </p>
                            </div>

                            {/* Right: cards + number config */}
                            <div
                                className="flex-1"
                                data-testid="target-type-cards-container"
                            >
                                {/* Top cards row */}
                                <div
                                    className="grid grid-cols-4 gap-3 mb-3"
                                    data-testid="target-type-grid"
                                >
                                    {targetTypes.map((type) => {
                                        const isActive = selectedType === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setSelectedType(type.id)}
                                                className="relative transition-all"
                                                data-testid={`target-type-card-${type.id}`}
                                                aria-pressed={isActive}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-full h-[90px] rounded-md border border-transparent bg-muted flex flex-col items-center justify-center overflow-hidden shadow-sm",
                                                        type.color,
                                                        isActive ? "translate-y-[1px]" : ""
                                                    )}
                                                    data-testid={`target-type-card-content-${type.id}`}
                                                >
                                                    <div
                                                        className="text-2xl mb-1.5"
                                                        data-testid={`target-type-icon-${type.id}`}
                                                    >
                                                        {type.icon}
                                                    </div>
                                                    <p
                                                        className="font-semibold text-xs mb-0.5"
                                                        style={{ color: type.textColor }}
                                                        data-testid={`target-type-name-${type.id}`}
                                                    >
                                                        {type.name}
                                                    </p>
                                                    <p
                                                        className="text-[11px]"
                                                        style={{ color: type.textColor }}
                                                        data-testid={`target-type-subtitle-${type.id}`}
                                                    >
                                                        {type.subtitle}
                                                    </p>


                                                    {isActive && (
                                                        <div
                                                            className="absolute inset-x-0 bottom-0 h-1 bg-primary"
                                                            data-testid={`target-type-active-indicator-${type.id}`}
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Number range panel */}
                                {selectedType === "number" && (
                                    <div
                                        className="mt-1 bg-muted rounded-2xl px-2.5 py-2.5 flex items-center gap-3"
                                        data-testid="number-range-panel"
                                    >
                                        {/* Starting Number */}
                                        <div className="flex-1" data-testid="start-number-section">
                                            <p
                                                className="text-[10px] font-medium text-muted-foreground mb-1"
                                                data-testid="start-number-label"
                                            >
                                                Starting Number
                                            </p>
                                            <div
                                                className="flex items-center rounded-full bg-background border border-border px-2.5 py-1 shadow-sm"
                                                data-testid="start-number-input-group"
                                            >
                                                <div
                                                    className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] mr-1.5"
                                                    data-testid="start-number-badge"
                                                >
                                                    ①
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={startNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (startNumber === "0" && val.length > 1 && val.startsWith("0")) {
                                                            setStartNumber(val.substring(1));
                                                        } else {
                                                            setStartNumber(val || "0");
                                                        }
                                                    }}
                                                    className="flex-1 h-7 border-0 bg-transparent px-0 text-[11px] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    data-testid="start-number-input"
                                                />
                                                <div
                                                    className="flex items-center gap-0.5 ml-1"
                                                    data-testid="start-number-controls"
                                                >
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-border text-[10px] leading-none"
                                                        onClick={() =>
                                                            setStartNumber((n) => String(Math.max(0, (Number(n) || 0) + 1)))
                                                        }
                                                        data-testid="start-number-increase"
                                                    >
                                                        +
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-border text-[10px] leading-none"
                                                        onClick={() =>
                                                            setStartNumber((n) => String(Math.max(0, (Number(n) || 0) - 1)))
                                                        }
                                                        data-testid="start-number-decrease"
                                                    >
                                                        −
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div
                                            className="text-base text-primary font-semibold"
                                            data-testid="number-range-arrow"
                                        >
                                            →
                                        </div>

                                        {/* Target Number */}
                                        <div className="flex-1" data-testid="target-number-section">
                                            <p
                                                className="text-[10px] font-medium text-muted-foreground mb-1"
                                                data-testid="target-number-label"
                                            >
                                                Target Number
                                            </p>
                                            <div
                                                className="flex items-center rounded-full bg-background border border-border px-2.5 py-1 shadow-sm"
                                                data-testid="target-number-input-group"
                                            >
                                                <div
                                                    className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] mr-1.5"
                                                    data-testid="target-number-badge"
                                                >
                                                    ②
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={targetNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (targetNumber === "0" && val.length > 1 && val.startsWith("0")) {
                                                            setTargetNumber(val.substring(1));
                                                        } else {
                                                            setTargetNumber(val || "0");
                                                        }
                                                    }}
                                                    className="flex-1 h-7 border-0 bg-transparent px-0 text-[11px] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    data-testid="target-number-input"
                                                />
                                                <div
                                                    className="flex items-center gap-0.5 ml-1"
                                                    data-testid="target-number-controls"
                                                >
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-border text-[10px] leading-none"
                                                        onClick={() =>
                                                            setTargetNumber((n) => String(Math.max(0, (Number(n) || 0) + 1)))
                                                        }
                                                        data-testid="target-number-increase"
                                                    >
                                                        +
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-border text-[10px] leading-none"
                                                        onClick={() =>
                                                            setTargetNumber((n) => String(Math.max(0, (Number(n) || 0) - 1)))
                                                        }
                                                        data-testid="target-number-decrease"
                                                    >
                                                        −
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Currency range panel */}
                                {selectedType === "currency" && (
                                    <div
                                        className="mt-1 bg-muted rounded-2xl px-2.5 py-2.5 flex items-center gap-3"
                                        data-testid="currency-range-panel"
                                    >
                                        {/* Starting Amount */}
                                        <div className="flex-1" data-testid="start-currency-section">
                                            <p
                                                className="text-[10px] font-medium text-muted-foreground mb-1"
                                                data-testid="start-currency-label"
                                            >
                                                Starting Amount
                                            </p>
                                            <div
                                                className="flex items-center rounded-full bg-background border border-border px-2.5 py-1 shadow-sm"
                                                data-testid="start-currency-input-group"
                                            >
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div
                                                            className="w-5 h-5 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] mr-1.5 cursor-pointer hover:bg-muted/80 transition-colors"
                                                            data-testid="start-currency-badge"
                                                        >
                                                            {currencies.find(c => c.code === selectedCurrency)?.symbol || "$"}
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[300px] max-h-[400px] overflow-y-auto bg-popover border-border">
                                                        <div className="p-2 border-b text-xs font-medium text-muted-foreground border-border">Currency</div>
                                                        {currencies.map((currency) => (
                                                            <div
                                                                key={currency.code}
                                                                className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                                                                onClick={() => setSelectedCurrency(currency.code)}
                                                            >
                                                                <span className="text-foreground">
                                                                    {currency.code} - {currency.name} ({currency.symbol})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Input
                                                    type="number"
                                                    value={startCurrency}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (startCurrency === "0" && val.length > 1 && val.startsWith("0")) {
                                                            setStartCurrency(val.substring(1));
                                                        } else {
                                                            setStartCurrency(val || "0");
                                                        }
                                                    }}
                                                    className="flex-1 h-7 border-0 bg-transparent px-0 text-[11px] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    data-testid="start-currency-input"
                                                />
                                                <div
                                                    className="flex items-center gap-0.5 ml-1"
                                                    data-testid="start-currency-controls"
                                                >
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-gray-200 text-[10px] leading-none"
                                                        onClick={() =>
                                                            setStartCurrency((n) => String(Math.max(0, (Number(n) || 0) + 1)))
                                                        }
                                                        data-testid="start-currency-increase"
                                                    >
                                                        +
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-gray-200 text-[10px] leading-none"
                                                        onClick={() =>
                                                            setStartCurrency((n) => String(Math.max(0, (Number(n) || 0) - 1)))
                                                        }
                                                        data-testid="start-currency-decrease"
                                                    >
                                                        −
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div
                                            className="text-base text-primary font-semibold"
                                            data-testid="currency-range-arrow"
                                        >
                                            →
                                        </div>

                                        {/* Target Amount */}
                                        <div className="flex-1" data-testid="target-currency-section">
                                            <p
                                                className="text-[10px] font-medium text-muted-foreground mb-1"
                                                data-testid="target-currency-label"
                                            >
                                                Target Amount
                                            </p>
                                            <div
                                                className="flex items-center rounded-full bg-background border border-border px-2.5 py-1 shadow-sm"
                                                data-testid="target-currency-input-group"
                                            >
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div
                                                            className="w-5 h-5 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] mr-1.5 cursor-pointer hover:bg-muted/80 transition-colors"
                                                            data-testid="target-currency-badge"
                                                        >
                                                            {currencies.find(c => c.code === selectedCurrency)?.symbol || "$"}
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[300px] max-h-[400px] overflow-y-auto bg-popover border-border">
                                                        <div className="p-2 border-b text-xs font-medium text-muted-foreground border-border">Currency</div>
                                                        {currencies.map((currency) => (
                                                            <div
                                                                key={currency.code}
                                                                className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                                                                onClick={() => setSelectedCurrency(currency.code)}
                                                            >
                                                                <span className="text-foreground">
                                                                    {currency.code} - {currency.name} ({currency.symbol})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Input
                                                    type="number"
                                                    value={targetCurrency}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (targetCurrency === "0" && val.length > 1 && val.startsWith("0")) {
                                                            setTargetCurrency(val.substring(1));
                                                        } else {
                                                            setTargetCurrency(val || "0");
                                                        }
                                                    }}
                                                    className="flex-1 h-7 border-0 bg-transparent px-0 text-[11px] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    data-testid="target-currency-input"
                                                />
                                                <div
                                                    className="flex items-center gap-0.5 ml-1"
                                                    data-testid="target-currency-controls"
                                                >
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-border text-[10px] leading-none"
                                                        onClick={() =>
                                                            setTargetCurrency((n) => String(Math.max(0, (Number(n) || 0) + 1)))
                                                        }
                                                        data-testid="target-currency-increase"
                                                    >
                                                        +
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="w-5 h-5 rounded-full border-border text-[10px] leading-none"
                                                        onClick={() =>
                                                            setTargetCurrency((n) => String(Math.max(0, (Number(n) || 0) - 1)))
                                                        }
                                                        data-testid="target-currency-decrease"
                                                    >
                                                        −
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedType === "projects" && (
                                    <div className="space-y-3 mt-4">
                                        <DropdownMenu
                                            open={isDropdownOpen}
                                            onOpenChange={setIsDropdownOpen}
                                            modal={false}
                                        >
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm border border-border rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                                                >
                                                    <span className="text-foreground/80">
                                                        {selectedProjects.length + selectedMilestones.length + selectedTasks.length > 0
                                                            ? `${selectedProjects.length + selectedMilestones.length + selectedTasks.length} item(s) selected`
                                                            : "Select Project, Milestone and/or Tasks"}
                                                    </span>
                                                    <ChevronDown
                                                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                                                            }`}
                                                    />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="start"
                                                className="w-[560px] p-0  border-border"
                                                style={{ maxHeight: '500px', display: 'flex', flexDirection: 'column' }}
                                                onInteractOutside={(e) => {
                                                    e.preventDefault();
                                                }}
                                            >
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    {/* Search Bar */}
                                                    <div className="px-4 py-3 border-b border-border">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                type="text"
                                                                placeholder="Search for item..."
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="pl-10 h-9 text-sm bg-background border-border focus-visible:ring-primary"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Tabs */}
                                                    <div className="px-4 pt-3 pb-2 border-b border-border flex gap-6 ">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveTab("project");
                                                            }}
                                                            className={cn(
                                                                "pb-2 text-sm font-medium transition-colors relative",
                                                                activeTab === "project"
                                                                    ? "text-foreground"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            )}
                                                        >
                                                            Projects & Tasks
                                                            {activeTab === "project" && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveTab("milestones");
                                                            }}
                                                            className={cn(
                                                                "pb-2 text-sm font-medium transition-colors relative",
                                                                activeTab === "milestones"
                                                                    ? "text-foreground"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            )}
                                                        >
                                                            Milestones
                                                            {activeTab === "milestones" && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Tab Content */}
                                                    <div className="overflow-y-auto max-h-[320px]">
                                                        {activeTab === "project" && (
                                                            <div>
                                                                <div className="flex items-center justify-between bg-muted px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border sticky top-0 z-10">
                                                                    <span>Item</span>
                                                                    <span>Owner</span>
                                                                </div>
                                                                <div className="divide-y divide-border">
                                                                    {projects
                                                                        .filter(project =>
                                                                            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                            tasks.some(task =>
                                                                                task.projectId === project.id &&
                                                                                task.name.toLowerCase().includes(searchQuery.toLowerCase())
                                                                            )
                                                                        )
                                                                        .map((project) => {
                                                                            const isExpanded = expandedProjects.has(project.id || "");
                                                                            const projectTasks = tasks.filter(t => t.projectId === project.id);

                                                                            const projectMembers = getMembersByProject(project.id || "");
                                                                            const leaderId = project.leaders?.[0] || project.projectLeader;
                                                                            const leader = projectMembers.find(m => m.userId === leaderId);
                                                                            const projectOwnerName = leader?.name || "Unassigned";

                                                                            return (
                                                                                <div key={project.id} className="flex flex-col">
                                                                                    <div
                                                                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-muted cursor-pointer group transition-colors"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (projectTasks.length > 0) {
                                                                                                toggleProjectExpand(project.id || "");
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                            <div className="w-4 h-4 flex items-center justify-center">
                                                                                                {projectTasks.length > 0 && (
                                                                                                    <ChevronDown
                                                                                                        size={14}
                                                                                                        className={cn(
                                                                                                            "text-muted-foreground transition-transform duration-200",
                                                                                                            !isExpanded && "-rotate-90"
                                                                                                        )}
                                                                                                    />
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                                <div
                                                                                                    className={cn(
                                                                                                        "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                                                                                        selectedProjects.includes(project.id || "")
                                                                                                            ? "border-primary bg-primary"
                                                                                                            : "border-border hover:border-primary/50"
                                                                                                    )}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        if (project.id) {
                                                                                                            const isCurrentlySelected = selectedProjects.includes(project.id);
                                                                                                            const projectTaskIds = projectTasks.map(t => t.id).filter(Boolean) as string[];

                                                                                                            if (isCurrentlySelected) {
                                                                                                                // 1. Unselect project
                                                                                                                setSelectedProjects(prev => prev.filter(id => id !== project.id));
                                                                                                                // 2. Unselect all tasks from this project
                                                                                                                setSelectedTasks(prev => prev.filter(id => !projectTaskIds.includes(id)));
                                                                                                            } else {
                                                                                                                // 1. Select project
                                                                                                                setSelectedProjects(prev => [...prev, project.id!]);
                                                                                                                // 2. Select all tasks from this project (avoiding duplicates)
                                                                                                                setSelectedTasks(prev => {
                                                                                                                    const otherTasks = prev.filter(id => !projectTaskIds.includes(id));
                                                                                                                    return [...otherTasks, ...projectTaskIds];
                                                                                                                });
                                                                                                                if (!targetName) setTargetName(project.name);
                                                                                                            }
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    {selectedProjects.includes(project.id || "") && (
                                                                                                        <Check size={10} className="text-primary-foreground" />
                                                                                                    )}
                                                                                                </div>
                                                                                                <span className="text-sm text-foreground font-medium truncate">
                                                                                                    {project.name}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center ml-2">
                                                                                            <div
                                                                                                title={projectOwnerName}
                                                                                                className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground"
                                                                                            >
                                                                                                {projectOwnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {isExpanded && projectTasks.length > 0 && (
                                                                                        <div className="bg-muted/30">
                                                                                            {projectTasks
                                                                                                .filter(task => task.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                                                .map((task) => {
                                                                                                    const assignee = projectMembers.find(m => m.userId === task.assignee);
                                                                                                    const assigneeName = assignee?.name || "Unassigned";

                                                                                                    return (
                                                                                                        <div
                                                                                                            key={task.id}
                                                                                                            className="flex items-center justify-between pl-10 pr-4 py-2 hover:bg-muted cursor-pointer group border-t border-border"
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                if (task.id) {
                                                                                                                    setSelectedTasks(prev =>
                                                                                                                        prev.includes(task.id!)
                                                                                                                            ? prev.filter(id => id !== task.id)
                                                                                                                            : [...prev, task.id!]
                                                                                                                    );
                                                                                                                    if (!targetName) setTargetName(task.name);
                                                                                                                }
                                                                                                            }}
                                                                                                        >
                                                                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                                                <div
                                                                                                                    className={cn(
                                                                                                                        "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                                                                                                        selectedTasks.includes(task.id || "")
                                                                                                                            ? "border-primary bg-primary"
                                                                                                                            : "border-border hover:border-primary/50"
                                                                                                                    )}
                                                                                                                >
                                                                                                                    {selectedTasks.includes(task.id || "") && (
                                                                                                                        <Check size={10} className="text-primary-foreground" />
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <span className="text-sm text-foreground/80 truncate">
                                                                                                                    {task.name}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <div className="flex items-center ml-2">
                                                                                                                <div
                                                                                                                    title={assigneeName}
                                                                                                                    className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground"
                                                                                                                >
                                                                                                                    {assigneeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {activeTab === "milestones" && (
                                                            <div>
                                                                <div className="flex items-center justify-between bg-muted px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border sticky top-0 z-10">
                                                                    <span>Milestone</span>
                                                                    <span>Project / Owner</span>
                                                                </div>
                                                                <div className="divide-y divide-border">
                                                                    {dummyMilestones
                                                                        .filter(mile => mile.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                        .map((mile) => (
                                                                            <div
                                                                                key={mile.id}
                                                                                className="flex items-center justify-between px-4 py-2.5 hover:bg-muted cursor-pointer transition-colors"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedMilestones(prev =>
                                                                                        prev.includes(mile.id)
                                                                                            ? prev.filter(id => id !== mile.id)
                                                                                            : [...prev, mile.id]
                                                                                    );
                                                                                    if (!targetName) setTargetName(mile.name);
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                    <div
                                                                                        className={cn(
                                                                                            "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                                                                            selectedMilestones.includes(mile.id)
                                                                                                ? "border-primary bg-primary"
                                                                                                : "border-border hover:border-primary/50"
                                                                                        )}
                                                                                    >
                                                                                        {selectedMilestones.includes(mile.id) && (
                                                                                            <Check size={10} className="text-primary-foreground" />
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-sm text-foreground font-medium truncate">
                                                                                        {mile.name}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground ml-2 min-w-0 truncate hidden sm:block">
                                                                                    {mile.project} • {mile.owner}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer Buttons */}
                                                    <div className="border-t border-border p-3 flex gap-2 bg-popover sticky bottom-0">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="flex-1 border-border"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsDropdownOpen(false);
                                                                setSearchQuery("");
                                                            }}
                                                        >
                                                            Back
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            className="flex-1 bg-primary hover:opacity-90 text-primary-foreground"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsDropdownOpen(false);
                                                                setSearchQuery("");
                                                            }}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Info text */}
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Select projects, milestones or tasks to track their completion as targets
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/50 rounded-b-2xl"
                    data-testid="modal-footer"
                >
                    <Button
                        variant="outline"
                        onClick={onClose}
                        data-testid="modal-cancel-button"
                        className="hover:bg-primary hover:text-primary-foreground border-border"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!isFormValid}
                        data-testid="modal-save-button"
                        className={cn(
                            "h-auto text-sm font-medium rounded-lg shadow-sm transition-all",
                            isFormValid
                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {targetToEdit ? "Update Target" : "Create Target"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
