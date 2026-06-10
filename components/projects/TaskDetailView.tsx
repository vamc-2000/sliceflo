// components/projects/TaskDetailView.tsx

"use client";

import React, { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    X as XIcon,
    Calendar as CalendarIcon,
    Check,
    User,
    Flag,
    Tag,
    Plus,
    MoreHorizontal,
    Paperclip,
    Share2,
    GitBranch,
    RefreshCw,
    ChevronRight,
    ChevronDown,
    FileText,
    Smile,
    AtSign,
    AlignLeft,
    Image,
    Send,
    History,
    LayoutTemplate,
    Hash,
    Link2,
    Copy,
    Ban,
    XOctagon,
    CircleArrowLeft,
    CircleArrowRight,
    SkipBack,
    SkipForward,
    CheckCircle2,
    SquareCheck,
    Type,
    ListChecks,
    CalendarCheck,
    Globe,
    Users,
    Mail,
    Phone as PhoneIcon,
    SquareCheckBig,
    DollarSign,
    FunctionSquare,
    Star,
    SquareKanban,
    MapPin,
    Wifi,
    Shirt,
    BarChart3,
} from "lucide-react";

export const getCustomFieldIcon = (type: string) => {
    switch (type) {
        case 'select-one':
            return CheckCircle2;
        case 'select-many':
            return SquareCheck;
        case 'text':
            return Type;
        case 'textarea':
            return AlignLeft;
        case 'label':
            return ListChecks;
        case 'date':
            return CalendarCheck;
        case 'number':
            return Hash;
        case 'website':
            return Globe;
        case 'people':
            return Users;
        case 'email':
            return Mail;
        case 'phone':
            return PhoneIcon;
        case 'checkbox':
            return SquareCheckBig;
        case 'budget':
            return DollarSign;
        case 'formula':
            return FunctionSquare;
        case 'rating':
            return Star;
        case 'voting':
            return SquareKanban;
        case 'location':
            return MapPin;
        case 'ip-address':
            return Wifi;
        case 'field-difference':
            return Copy;
        case 'tshirt-size':
            return Shirt;
        case 'social-media':
            return Share2;
        case 'auto-number':
            return Tag;
        case 'rollup':
            return BarChart3;
        default:
            return Hash;
    }
};
import {
    getRelationshipIcon,
    getRelationshipIconColor,
    getRelationshipLabel
} from '@/utils/relationship-utils';
import { formatLocalDate, convertSelectedDateToUTC, convertUTCToCalendarDate } from "@/utils/timezone-utils";
import { MemberAvatar } from "./MemberAvatar";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore, TaskTypeConfig, } from "@/stores/projects-store";
import { Task, TaskRelationship } from "@/types/task.types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { RelationshipDropdown } from "./views/list-view/common/RelationshipDropdown";
import { TaskSelector } from "./views/list-view/common/TaskSelector";
import { ProseMirrorEditor } from '@/components/proseMirror/ProseMirrorEditor';
import { useDocStore } from "@/stores/useDoc-store";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomFieldDropdown } from "./views/list-view/common/CustomFieldDropdown";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { FieldTypeSelectContent } from "./views/list-view/common/FieldTypeSelectContent";
import { formatTaskId } from '@/utils/task-utils';
import { TaskAttachments } from "./TaskAttachments";
import DiscussionPage from "../disucssions/DiscussionPage";
import { toast } from "@/components/ui/sonner";
import { LabelPicker } from "@/components/shared/labels/LabelPicker";
import { LabelBadge } from "@/components/shared/labels/LabelBadge";
import SharedActivityLog from "@/components/shared/ActivityLog";
import { iconComponentMap } from "@/components/ColorIconPicker";

interface TaskDetailViewProps {
    task: Task | null;
    isSubtask?: boolean;
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TaskDetailView({
    task,
    isSubtask = false,
    projectId,
    open,
    onOpenChange,
}: TaskDetailViewProps) {

    // ── Stores (identical to TaskDetailPage) ─────────────────────────────

    const {
        tasks,
        subtasks,
        updateTask,
        addTaskRelationship,
        removeTaskRelationship,
        getTaskRelationships,
        addSubtask,
        updateSubtask,
        deleteSubtask,
        getSubtasksByTask,
        // addChecklist,
        // updateChecklist,
        // deleteChecklist,
        // getChecklistsByTask,
        // addChecklistItem,
        // updateChecklistItem,
        // deleteChecklistItem,
        // toggleChecklistItem,
        // getChecklistItems,
        // assignMemberToChecklistItem,
        // unassignMemberFromChecklistItem,
        addTaskDocument,
        removeTaskDocument,
    } = useTasksStore();
    const {
        projects,
        getTaskTypesByProject,
        getTaskStatusConfigs,
        getTaskCustomFields,
        getTaskCustomFieldById,
        getTaskPriorityConfigs,
    } = useProjectsStore();
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
    const { documents, fetchRootDocuments } = useDocStore();
    const allDocs = Array.from(documents.values());

    useEffect(() => {
        if (open) {
            fetchRootDocuments();
        }
    }, [open, fetchRootDocuments]);
    const [showAllCustomFields, setShowAllCustomFields] = useState(false);
    const [showAddFieldPopover, setShowAddFieldPopover] = useState(false);

    const CUSTOM_FIELDS_PREVIEW_COUNT = 4;

    const currentProject = projects.find(p => p.id === projectId);
    const projectSlug = currentProject?.slug ?? 'TASK';
    const taskTypes = getTaskTypesByProject(projectId);
    const taskStatusConfigs = getTaskStatusConfigs(projectId);
    const customFields = getTaskCustomFields(projectId);
    const taskPriorityConfigs = getTaskPriorityConfigs(projectId)
    const selectedTaskType = taskTypes.find((t) => t.value === (task?.taskType || "task")) || null;

    // Derive mentionableMembers from project members and workspaceMembers
    //    const mentionableMembers = (currentProject?.members || []).map(member => {
    //     const workspaceMember = workspaceMembers.find(m => m.userId === member.userId);
    //     return {
    //         id: member.userId,
    //         name: workspaceMember?.name || member.userId,
    //         profilePictureUrl: workspaceMember?.avatar
    //     };
    // });
    const mentionableMembers = React.useMemo(() => {
        if (!currentProject?.members || !workspaceMembers) return [];

        // Create a set of project member user IDs for efficient lookup
        const projectUserIds = new Set(currentProject.members.map(m => m.userId));

        // Filter workspace members to only those who are in the project
        return workspaceMembers
            .filter(m => projectUserIds.has(m.userId))
            .map(m => ({
                id: m.userId,
                name: m.name,
                avatar: m.avatar || m.profilePicture || ''
            }));
    }, [currentProject?.members, workspaceMembers]);


    // Helper: resolve member name from userId
    const getMemberName = (userId?: string) => {
        if (!userId) return null;
        const wm = workspaceMembers.find(m => m.userId === userId);
        return wm?.name || null;
    };

    // Helper: get priority color
    const getPriorityColor = (priorityValue?: string) => {
        const priority = taskPriorityConfigs.find(p => p.value === priorityValue);
        return priority?.color || undefined;
    };

    // console.log("custom fields", customFields)
    const [description, setDescription] = useState(task?.description || "");
    // const [activeTab, setActiveTab] = useState<"properties" | "progress" | "activity">("properties");
    const [activeTab, setActiveTab] = useState<"properties" | "activity">("properties");

    // relationship state
    const [selectedRelationType, setSelectedRelationType] = useState<string | null>(null);
    const [showTaskSelector, setShowTaskSelector] = useState(false);

    // subtask state
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [newSubtaskName, setNewSubtaskName] = useState("");

    // checklist state
    // const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set());
    // const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
    // const [editingChecklistName, setEditingChecklistName] = useState("");
    // const [addingItemToChecklist, setAddingItemToChecklist] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState("");
    const [isReadOnly, setIsReadOnly] = useState(false);

    // document selection state
    const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);
    const [selectedDocsForTask, setSelectedDocsForTask] = useState<Set<string>>(new Set());
    const [docTreeExpanded, setDocTreeExpanded] = useState<Set<string>>(new Set());
    const [expandedLinkedDocs, setExpandedLinkedDocs] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (
            open &&
            !isSubtask &&
            task?.taskType === 'milestone'
        ) {
            const subtaskCount = getSubtasksByTask(task.id).length;
            if (subtaskCount === 0) {
                setIsAddingSubtask(true);
            }
        }
    }, [task?.id, task?.taskType, isSubtask, open]);

    if (!task) return null;

    const storeTask = tasks.find(t => t.id === task.id)
        ?? subtasks.find(st => st.id === task.id) as Task | undefined;  // ✅
    const currentTask = storeTask ?? task;
    const isMilestone = currentTask.taskType === 'milestone';
    const taskSubtasks = getSubtasksByTask(currentTask.id);


    const projectTasks = [
        ...tasks.filter(t => t.projectId === projectId),
        ...subtasks
            .filter(st => st.projectId === projectId)
            .map(st => ({ ...st, subtasks: [] as string[], relationships: [] as TaskRelationship[] }))
    ] as Task[];
    const relationships = getTaskRelationships(currentTask.id);
    // const checklists = getChecklistsByTask(currentTask.id);

    // const handleUpdateTask = (updates: Partial<Task>) => {
    //     updateTask(currentTask.id, updates);
    // };

    const handleUpdateTask = (updates: Partial<Task>) => {
        if (isSubtask) {
            updateSubtask(currentTask.id, updates);
        } else {
            updateTask(currentTask.id, updates);
        }
    };

    const handleSelectLabel = (labelId: string) => {
        const currentLabels = currentTask.labelIds || [];
        if (!currentLabels.includes(labelId)) {
            handleUpdateTask({ labelIds: [...currentLabels, labelId] });
        }
    };

    const handleRemoveLabel = (labelId: string) => {
        const currentLabels = currentTask.labelIds || [];
        handleUpdateTask({
            labelIds: currentLabels.filter(id => id !== labelId)
        });
    };

    // relationship handlers
    const handleSelectRelationType = (type: string) => {
        setSelectedRelationType(type);
        setShowTaskSelector(true);
    };

    const handleSelectTask = async (targetTaskId: string) => {
        if (selectedRelationType) {
            await addTaskRelationship(currentTask.id, {
                type: selectedRelationType as any,
                targetTaskId,
            });
            setSelectedRelationType(null);
            setShowTaskSelector(false);
        }
    };

    const handleRemoveRelationship = async (relationshipId: string) => {
        await removeTaskRelationship(currentTask.id, relationshipId);
    };



    // subtask handlers
    const handleAddSubtask = () => {
        if (!newSubtaskName.trim()) return;

        // Capture before reset
        const capturedName = newSubtaskName;

        // 1. Close input row IMMEDIATELY
        setNewSubtaskName('');
        setIsAddingSubtask(false);

        // 2. Call addSubtask — store inserts optimistic subtask instantly,
        //    fires API in background with retryWithBackoff, auto-rollback on failure
        addSubtask({
            parentTaskId: currentTask.id,
            projectId: currentTask.projectId,
            name: capturedName,
            status: currentTask.status,       // inherit parent status
            startDate: new Date().toISOString(),
            completed: false,
        });
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        deleteSubtask(subtaskId);
    };

    const handleToggleSubtaskComplete = (subtaskId: string, completed: boolean) => {
        updateSubtask(subtaskId, { completed });
    };

    const handleCopyTaskLink = async () => {
        try {
            const url = `${window.location.origin}/task/${currentTask.id}`;
            await navigator.clipboard.writeText(url);
            toast('success', { title: "Task link copied!" });
        } catch {
            toast('error', { title: "Failed to copy link" });
        }
    };

    const handleCopyTaskId = async () => {
        try {
            await navigator.clipboard.writeText(currentTask.id);
            toast('success', { title: "Task ID copied!" });
        } catch {
            toast('error', { title: "Failed to copy ID" });
        }
    };


    // checklist handlers
    // const handleAddChecklist = () => {
    //     const id = addChecklist(currentTask.id, `Checklist ${checklists.length + 1}`);
    //     setExpandedChecklists(prev => new Set(prev).add(id));
    // };

    // const handleRenameChecklist = (checklistId: string, newName: string) => {
    //     updateChecklist(checklistId, { name: newName });
    //     setEditingChecklistId(null);
    // };

    // const handleDeleteChecklist = (checklistId: string) => {
    //     deleteChecklist(checklistId);
    //     setExpandedChecklists(prev => {
    //         const newSet = new Set(prev);
    //         newSet.delete(checklistId);
    //         return newSet;
    //     });
    // };

    // const handleAddChecklistItem = (checklistId: string) => {
    //     if (newItemName.trim()) {
    //         addChecklistItem(checklistId, newItemName);
    //         setNewItemName("");
    //         setAddingItemToChecklist(null);
    //     }
    // };

    // const handleCheckAllItems = (checklistId: string) => {
    //     const items = getChecklistItems(checklistId);
    //     items.forEach(item => {
    //         if (!item.completed) {
    //             toggleChecklistItem(item.id);
    //         }
    //     });
    // };

    // const handleUncheckAllItems = (checklistId: string) => {
    //     const items = getChecklistItems(checklistId);
    //     items.forEach(item => {
    //         if (item.completed) {
    //             toggleChecklistItem(item.id);
    //         }
    //     });
    // };

    // const toggleChecklistExpanded = (checklistId: string) => {
    //     setExpandedChecklists(prev => {
    //         const newSet = new Set(prev);
    //         if (newSet.has(checklistId)) {
    //             newSet.delete(checklistId);
    //         } else {
    //             newSet.add(checklistId);
    //         }
    //         return newSet;
    //     });
    // };

    // const getChecklistProgress = (checklistId: string) => {
    //     const items = getChecklistItems(checklistId);
    //     if (items.length === 0) return { completed: 0, total: 0, percentage: 0 };
    //     const completed = items.filter(i => i.completed).length;
    //     return {
    //         completed,
    //         total: items.length,
    //         percentage: Math.round((completed / items.length) * 100),
    //     };
    // };

    // document linking handlers
    const handleToggleDocSelect = (docId: string) => {
        setSelectedDocsForTask(prev => {
            const next = new Set(prev);
            const isSelecting = !next.has(docId);

            const toggleRecursive = (id: string, select: boolean) => {
                if (select) {
                    next.add(id);
                } else {
                    next.delete(id);
                }
                // Toggle all children
                allDocs.filter(d => d.parentId === id).forEach(child => {
                    toggleRecursive(child.id, select);
                });
            };

            toggleRecursive(docId, isSelecting);
            return next;
        });
    };

    const handleAddSelectedDocs = () => {
        selectedDocsForTask.forEach(docId => {
            addTaskDocument(currentTask.id, docId);
        });
        setSelectedDocsForTask(new Set());
        setIsDocSelectorOpen(false);
    };

    const handleUnlinkDoc = (docId: string) => {
        removeTaskDocument(currentTask.id, docId);
    };

    const getDocCreator = (docId: string) => {
        const doc = documents.get(docId);
        if (!doc) return null;
        if (doc.createdBy) return doc.createdBy;
        if (doc.parentId) return getDocCreator(doc.parentId);
        return null;
    };

    const getSubPageCount = (docId: string): number => {
        const children = allDocs.filter(d => d.parentId === docId);
        let count = children.length;
        children.forEach(child => {
            count += getSubPageCount(child.id);
        });
        return count;
    };

    const renderDocSelectorContent = () => (
        <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 border-b">
                <h3 className="text-xs font-semibold">Select Document</h3>
            </div>
            <ScrollArea className="h-[300px] p-4">
                <div className="space-y-1">
                    {allDocs.filter(d => !d.parentId).map(doc => {
                        const children = allDocs.filter(d => d.parentId === doc.id);
                        const isExpanded = docTreeExpanded.has(doc.id);
                        const hasChildren = children.length > 0;

                        const renderTree = (d: any, level = 0) => {
                            const isLinkedToTask = (currentTask.linkedDocuments || []).includes(d.id);
                            return (
                                <div key={d.id} className="space-y-1">
                                    <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted group cursor-pointer"
                                        onClick={() => {
                                            if (level === 0 && hasChildren) {
                                                setDocTreeExpanded(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(d.id)) next.delete(d.id);
                                                    else next.add(d.id);
                                                    return next;
                                                });
                                            }
                                        }}
                                    >
                                        {level === 0 && (
                                            <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
                                                {hasChildren ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
                                            </div>
                                        )}
                                        <div className={cn("flex items-center gap-2 flex-1 min-w-0", level > 0 && "pl-6")}>
                                            {!d.parentId ? (
                                                <img src="/images/docsidebar.svg" alt="doc" className="w-3.5 h-3.5 shrink-0" />
                                            ) : (
                                                <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                            )}
                                            <span className={cn("text-xs truncate", isLinkedToTask && "text-muted-foreground")}>
                                                {d.title}
                                            </span>
                                            {isLinkedToTask && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                                    Linked
                                                </span>
                                            )}
                                        </div>
                                        <Checkbox
                                            checked={isLinkedToTask || selectedDocsForTask.has(d.id)}
                                            disabled={isLinkedToTask}
                                            onCheckedChange={() => {
                                                if (!isLinkedToTask) handleToggleDocSelect(d.id);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={cn(isLinkedToTask && "opacity-50 cursor-not-allowed")}
                                        />
                                    </div>
                                    {isExpanded && hasChildren && allDocs.filter(c => c.parentId === d.id).map(child => renderTree(child, level + 1))}
                                </div>
                            );
                        };
                        return renderTree(doc);
                    })}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <Button
                    className="w-full h-8 bg-primary hover:bg-primary/90"
                    onClick={handleAddSelectedDocs}
                    disabled={selectedDocsForTask.size === 0}
                >
                    Add Selected
                </Button>
            </div>
        </PopoverContent>
    );

    const renderTaskTypeVisual = (
        type?: TaskTypeConfig | null,
        className = "w-4 h-4"
    ) => {
        if (!type) return null;

        const wrapperClass = `${className} shrink-0 flex items-center justify-center`;

        if (type.icon?.type === "file" && type.icon?.presignedUrl) {
            return (
                <div className={wrapperClass}>
                    <img
                        src={type.icon.presignedUrl}
                        alt={type.label}
                        className="w-full h-full object-contain"
                    />
                </div>
            );
        }

        if (type.displayImage) {
            return (
                <div className={wrapperClass}>
                    <img
                        src={type.displayImage}
                        alt={type.label}
                        className="w-full h-full object-contain"
                    />
                </div>
            );
        }

        if (type.iconId && type.icon?.type === "icon" && type.icon?.name) {
            const Icon = iconComponentMap[type.icon.name];
            if (Icon) {
                return (
                    <div className={wrapperClass}>
                        <Icon
                            className="w-full h-full"
                            color={type.icon.color || type.color || "#3B82F6"}
                        />
                    </div>
                );
            }
        }

        return (
            <div
                className={`${wrapperClass} rounded-sm`}
                style={{ backgroundColor: `${type.color || "#6B7280"}20` }}
            >
                <span
                    className="text-[10px] leading-none font-semibold"
                    style={{ color: type.color || "#6B7280" }}
                >
                    {type.label?.charAt(0)?.toUpperCase() || "T"}
                </span>
            </div>
        );
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                {/* Overlay */}
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Content */}
                <DialogPrimitive.Content
                    data-testid="task-detail-dialog"
                    className="
                        fixed right-0 top-1/2 -translate-y-1/2 z-50
                        bg-card rounded-l-lg shadow-xl
                        transition-transform duration-300 ease-in-out
                        data-[state=closed]:translate-x-full
                        data-[state=open]:translate-x-0
                        "
                    onInteractOutside={(e) => {
                        const target = e.target as HTMLElement;
                        if (target?.closest?.('[data-mention-dropdown]')) {
                            e.preventDefault();
                        }
                    }}
                    style={{
                        width: "1050px",      // Fixed width instead of viewport-based
                        maxWidth: "95vw",     // Still responsive on smaller screens
                        height: "100%",
                        // maxHeight: "900px",
                    }}
                >
                    {/* ✅ Accessibility requirement */}
                    <VisuallyHidden asChild>
                        <div>
                            <DialogPrimitive.Title>
                                {isMilestone ? "Milestone Details" : "Task Details"}
                            </DialogPrimitive.Title>

                            <DialogPrimitive.Description>
                                {isMilestone
                                    ? "View and manage milestone details including description, subtasks, checklist, relationships and properties."
                                    : "View and manage task details including description, subtasks, checklist, relationships and properties."}
                            </DialogPrimitive.Description>
                        </div>
                    </VisuallyHidden>

                    <div className="flex flex-col h-full w-full overflow-hidden rounded-lg">
                        {/* UNIFIED HEADER - Spans both left and right panels */}
                        <div className="px-5 py-2 flex items-center justify-between bg-card shrink-0 text-xs">
                            {/* Left: Breadcrumb */}
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <span className="hover:underline cursor-pointer">
                                        {currentWorkspace?.name || 'Workspace'}
                                    </span>
                                    <span>/</span>
                                    <span className="hover:underline cursor-pointer">
                                        {currentProject?.name || 'Project'}
                                    </span>
                                    <span>/</span>
                                    {/* ADD THIS: show parent task name if subtask */}
                                    {isSubtask && currentTask.parentTaskId && (
                                        <>
                                            <span className="hover:underline cursor-pointer text-muted-foreground">
                                                {tasks.find(t => t.id === currentTask.parentTaskId)?.name ?? "Parent Task"}
                                            </span>
                                            <span>/</span>
                                        </>
                                    )}
                                    <span className="hover:underline cursor-pointer text-foreground font-medium truncate max-w-[160px]">
                                        {currentTask.name}
                                    </span>
                                </span>
                                {/* ADD THIS: subtask badge */}
                                {isSubtask && (
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                        Subtask
                                    </span>
                                )}
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                    Created {formatLocalDate(currentTask.createdAt)}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="task-detail-more-btn">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="task-detail-branch-btn">
                                    <GitBranch className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="task-detail-share-btn">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="border-b-[5px] border-b-primary">
                                        <DropdownMenuItem onClick={handleCopyTaskLink} className="cursor-pointer" data-testid="task-detail-copy-link-btn">
                                            {isMilestone ? "Milestone Link" : "Task Link"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleCopyTaskId} className="cursor-pointer" data-testid="task-detail-copy-id-btn">
                                            {isMilestone ? "Milestone ID" : "Task ID"}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DialogPrimitive.Close asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="task-detail-close-btn">
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                </DialogPrimitive.Close>
                            </div>
                        </div>

                        {/* CONTENT AREA - Two columns */}
                        <ResizablePanelGroup direction="horizontal" className="flex flex-1 overflow-hidden">
                            {/* Left Panel - Main Content */}
                            <ResizablePanel defaultSize={70} className="flex flex-col overflow-hidden bg-card">


                                {/* Main Content Area - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
                                    {/* Task Title and Type */}
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        {/* Meta row: type selector + task ID + copy — above the title */}
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={currentTask.taskType || "task"}
                                                onValueChange={(value) => handleUpdateTask({ taskType: value })}
                                            >
                                                <SelectTrigger data-testid="task-detail-type-select-trigger" className="h-7 w-auto min-w-[90px] bg-primary text-primary-foreground border-0 hover:bg-primary/90 text-xs px-2">
                                                    <SelectValue>
                                                        {(() => {
                                                            const selectedType =
                                                                taskTypes.find((t) => t.value === (currentTask.taskType || "task")) || null;

                                                            if (!selectedType) {
                                                                return <span className="text-xs text-primary-foreground">Task</span>;
                                                            }

                                                            return (
                                                                <div className="flex items-center gap-1.5">
                                                                    {renderTaskTypeVisual(selectedType, "w-3 h-3")}
                                                                    <span className="text-xs text-primary-foreground">
                                                                        {selectedType.label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </SelectValue>
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {taskTypes.map((type) => (
                                                        <SelectItem
                                                            key={type._id || type.value}
                                                            value={type.value}
                                                            data-testid={`task-detail-type-option-${type.value}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {renderTaskTypeVisual(type, "w-3.5 h-3.5")}
                                                                <span className="text-xs">{type.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Real Task ID */}
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                {formatTaskId(projectSlug, currentTask.taskNumber)}
                                            </span>
                                            <Button
                                                variant="ghost" size="icon" className="h-7 w-7"
                                                onClick={() => navigator.clipboard.writeText(currentTask.id)}
                                                title={isMilestone ? "Copy full milestone ID" : "Copy full task ID"}
                                                data-testid="task-detail-copy-full-id-btn"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        {/* Task Title — full width below meta row */}
                                        <h1 className="text-sm leading-tight">
                                            {currentTask.name}
                                        </h1>
                                    </div>
                                    {/* Description Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">Description</Label>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <History className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        </div>
                                        <ProseMirrorEditor
                                            initialContent={currentTask?.description || ''} // ✅ Only from task, not state
                                            mentionableMembers={mentionableMembers}
                                            onBlur={(content) => {
                                                //  Don't store in local state, just update directly
                                                handleUpdateTask({ description: content });
                                            }}
                                            placeholder={isMilestone ? "Add milestone description with footnote support..." : "Add task description with footnote support..."}
                                            className="task-description-editor"
                                            editable={!isReadOnly}
                                            data-testid="task-detail-description-editor"
                                        />
                                    </div>

                                    {/* Description Section */}
                                    {/* <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">Description</Label>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <History className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        </div>
                                        <div className="border rounded-lg">
                                            <Textarea
                                                value={description}
                                                onChange={(e) => {
                                                    setDescription(e.target.value);
                                                    handleUpdateTask({ description: e.target.value });
                                                }}
                                                placeholder="Enter task description..."
                                                className="min-h-[100px] resize-none border-0 focus-visible:ring-0"
                                            />
                                            <div className="flex items-center justify-between px-3 py-2 bg-muted border-t">
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <AtSign className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                                        GIF
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Smile className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <AtSign className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <div className="flex items-center gap-0 ml-2">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-r-none">
                                                            <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none border-x">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-l-none">
                                                            <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Link2 className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Image className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
                                                >
                                                    Update
                                                    <ChevronDown className="h-3 w-3 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div> */}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {relationships.length === 0 && !selectedRelationType && (
                                            <RelationshipDropdown
                                                variant="action"  // 👈 This gives it the action button styling
                                                onSelectType={handleSelectRelationType}
                                                data-testid="task-detail-relation-dropdown"
                                            />
                                        )}

                                        {/* Subtasks button - hide when adding or has items */}
                                        {!isSubtask && taskSubtasks.length === 0 && !isAddingSubtask && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="text-xs rounded h-8"
                                                onClick={() => setIsAddingSubtask(true)}
                                                data-testid="task-detail-add-subtask-action-btn"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Subtask
                                            </Button>
                                        )}

                                        {/* Checklists - Show button to add checklist when empty */}
                                        {/* {checklists.length === 0 && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="text-xs rounded h-8"
                                                onClick={handleAddChecklist}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Checklist
                                            </Button>
                                        )} */}
                                        {/* <Button variant="secondary" size="sm" className="text-xs rounded h-8">
                                            <Plus className="h-3 w-3 mr-1" />
                                            Custom Notes
                                        </Button> */}
                                        {(currentTask.linkedDocuments || []).length === 0 && (
                                            <Popover open={isDocSelectorOpen} onOpenChange={setIsDocSelectorOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="secondary" size="sm" className="text-xs rounded h-8" data-testid="task-detail-add-doc-btn">
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Document
                                                    </Button>
                                                </PopoverTrigger>
                                                {renderDocSelectorContent()}
                                            </Popover>
                                        )}
                                        {/* <Button variant="secondary" size="sm" className="text-xs rounded h-8">
                                            <Plus className="h-3 w-3 mr-1" />
                                            Whiteboard
                                        </Button> */}
                                    </div>

                                    <DiscussionPage
                                        entityType="task"
                                        entityId={currentTask.id}
                                        mentionableMembers={mentionableMembers}
                                    />

                                    {/* Linked Documents Section */}
                                    {(currentTask.linkedDocuments || []).length > 0 && (
                                        <div className="space-y-4 border-t pt-4 mt-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-semibold">Linked Documents</h3>
                                                <Popover open={isDocSelectorOpen} onOpenChange={setIsDocSelectorOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-8"
                                                            data-testid="task-detail-add-doc-section-btn"
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add Document
                                                        </Button>
                                                    </PopoverTrigger>
                                                    {renderDocSelectorContent()}
                                                </Popover>
                                            </div>

                                            <div className="space-y-3">
                                                {(currentTask.linkedDocuments || []).map((docId) => {
                                                    const doc = documents.get(docId);
                                                    if (!doc) return null;
                                                    const pageCount = getSubPageCount(doc.id);
                                                    const creator = getDocCreator(doc.id);

                                                    return (
                                                        <div key={doc.id} className="flex flex-col border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-all">
                                                            <div className="flex items-center justify-between p-4">
                                                                <Link href={`/docs/${doc.id}`} className="flex items-center gap-4 min-w-0 flex-1 group/doc hover:opacity-80 transition-opacity">
                                                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                                                                        {!doc.parentId ? (
                                                                            <img src="/images/docsidebar.svg" alt="doc" className="w-6 h-6" />
                                                                        ) : (
                                                                            <FileText className="w-6 h-6 text-muted-foreground" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                                                                            {doc.title}
                                                                        </h4>
                                                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                                                            {!doc.parentId && (
                                                                                <span className="text-xs text-muted-foreground font-medium">
                                                                                    {pageCount} Pages
                                                                                </span>
                                                                            )}
                                                                            <span className="text-[10px] text-muted-foreground">
                                                                                Last updated on: {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString('en-US', {
                                                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                                                    hour: 'numeric', minute: '2-digit', hour12: true
                                                                                }) : "Unknown"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </Link>

                                                                <div className="flex items-center gap-3">
                                                                    {!doc.parentId && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground"
                                                                            onClick={() => {
                                                                                setExpandedLinkedDocs(prev => {
                                                                                    const next = new Set(prev);
                                                                                    if (next.has(doc.id)) next.delete(doc.id);
                                                                                    else next.add(doc.id);
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                            data-testid={`task-detail-expand-doc-btn-${doc.id}`}
                                                                        >
                                                                            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedLinkedDocs.has(doc.id) && "rotate-180")} />
                                                                        </Button>
                                                                    )}
                                                                    {creator && (
                                                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0 bg-muted flex items-center justify-center relative group/creator">
                                                                            {creator.profilePictureUrl ? (
                                                                                <img
                                                                                    src={creator.profilePictureUrl}
                                                                                    alt={creator.name || "Creator"}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                                    {creator.name?.charAt(0)?.toUpperCase()}
                                                                                </span>
                                                                            )}
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-primary-foreground text-[10px] rounded opacity-0 group-hover/creator:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                                                {creator.name}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleUnlinkDoc(doc.id)}
                                                                        className="h-8 px-6 rounded-full bg-muted text-muted-foreground border-none hover:bg-red-50 hover:text-red-600 transition-all font-medium text-xs"
                                                                        data-testid={`task-detail-unlink-doc-btn-${doc.id}`}
                                                                    >
                                                                        Unlink
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            {/* If it's a root doc, show subpages list if expanded */}
                                                            {!doc.parentId && expandedLinkedDocs.has(doc.id) && (
                                                                <div className="px-4 pb-4 space-y-2 border-t pt-3 mt-1">
                                                                    {pageCount > 0 ? (
                                                                        allDocs.filter(d => d.parentId === doc.id).map(page => (
                                                                            <div key={page.id} className="flex items-center gap-3 pl-4">
                                                                                <FileText className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
                                                                                <span className="text-xs text-muted-foreground">{page.title}</span>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="px-4 py-2 text-[10px] text-muted-foreground italic pl-8">
                                                                            No pages found
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Relationships Section - Shows when selecting OR has items */}
                                    {(selectedRelationType || relationships.length > 0) && (
                                        <div className="space-y-4 border-t pt-4 mt-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-semibold">Relationships</h3>

                                                <div className="flex items-center gap-2">
                                                    <RelationshipDropdown
                                                        variant="section"  // 👈 This gives it the section header styling
                                                        onSelectType={handleSelectRelationType}
                                                        data-testid="task-detail-relation-section-dropdown"
                                                    />

                                                    {/* Close button - only show when empty and selecting */}
                                                    {relationships.length === 0 && selectedRelationType && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => {
                                                                setSelectedRelationType(null);
                                                                setShowTaskSelector(false);
                                                            }}
                                                            data-testid="task-detail-relation-cancel-btn"
                                                        >
                                                            <XIcon className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Task Selector */}
                                            {selectedRelationType && (
                                                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                                    <span className="text-xs text-muted-foreground">
                                                        Select task for {getRelationshipLabel(selectedRelationType)}
                                                    </span>
                                                    <TaskSelector
                                                        tasks={projectTasks.filter(t => t.id !== currentTask.id)}
                                                        currentTaskId={currentTask.id}
                                                        onSelect={handleSelectTask}
                                                        open={showTaskSelector}
                                                        onOpenChange={setShowTaskSelector}
                                                        data-testid="task-detail-relation-task-selector"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedRelationType(null);
                                                            setShowTaskSelector(false);
                                                        }}
                                                        data-testid="task-detail-relation-cancel-btn"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Display existing relationships */}
                                            {relationships.length > 0 && (
                                                <div className="space-y-2">
                                                    {relationships.map((rel) => {
                                                        const targetTask = projectTasks.find((t) => t.id === rel.targetTaskId);
                                                        return (
                                                            <div
                                                                key={rel.id}
                                                                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {(() => {
                                                                        const RelIcon = getRelationshipIcon(rel.type);
                                                                        return <RelIcon className={cn("h-4 w-4", getRelationshipIconColor(rel.type))} />;
                                                                    })()}
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {getRelationshipLabel(rel.type)}
                                                                        </span>
                                                                        <span className="text-xs font-medium">
                                                                            {targetTask?.name || "Unknown Task"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => handleRemoveRelationship(rel.id)}
                                                                    data-testid={`task-detail-relation-remove-btn-${rel.id}`}
                                                                >
                                                                    <XIcon className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Subtasks Section - Shows when adding OR has items */}
                                    {!isSubtask && (isAddingSubtask || taskSubtasks.length > 0) && (
                                        <div className="space-y-4 border-t pt-4 mt-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-semibold">Subtasks</h3>

                                                <div className="flex items-center gap-2">
                                                    {/* Add button */}
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={() => setIsAddingSubtask(true)}
                                                        disabled={isAddingSubtask}
                                                        data-testid="task-detail-add-subtask-btn"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Add Subtask
                                                    </Button>

                                                    {/* Close button - only show when empty */}
                                                    {taskSubtasks.length === 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => {
                                                                setIsAddingSubtask(false);
                                                                setNewSubtaskName("");
                                                            }}
                                                        >
                                                            <XIcon className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Subtasks Table with Inline Add */}
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full">
                                                    <thead className="bg-muted/50">
                                                        <tr className="border-b">
                                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground w-12">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-input"
                                                                    checked={taskSubtasks.length > 0 && taskSubtasks.every((st) => st.completed)}
                                                                    disabled={taskSubtasks.length === 0}
                                                                    onChange={(e) => {
                                                                        taskSubtasks.forEach((st) =>
                                                                            handleToggleSubtaskComplete(st.id, e.target.checked)
                                                                        );
                                                                    }}
                                                                    data-testid="task-detail-subtask-checkbox-all"
                                                                />
                                                            </th>
                                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                                                Task
                                                            </th>
                                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                                                ID
                                                            </th>
                                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                                                Assignee
                                                            </th>
                                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                                                Status
                                                            </th>
                                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                                                Start Date
                                                            </th>
                                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                                                End Date
                                                            </th>
                                                            <th className="w-12"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {/* Inline Add Subtask Row */}
                                                        {isAddingSubtask && (
                                                            <tr className="bg-blue-50/30 border-b hover:bg-blue-50/50 transition-colors">
                                                                <td className="p-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-input opacity-50"
                                                                        disabled
                                                                    />
                                                                </td>
                                                                <td className="p-3">
                                                                    <Input
                                                                        value={newSubtaskName}
                                                                        onChange={(e) => setNewSubtaskName(e.target.value)}
                                                                        placeholder="Type subtask name..."
                                                                        className="h-8 border-blue-300 focus-visible:ring-blue-500"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter" && newSubtaskName.trim()) {
                                                                                handleAddSubtask();
                                                                            } else if (e.key === "Escape") {
                                                                                setIsAddingSubtask(false);
                                                                                setNewSubtaskName("");
                                                                            }
                                                                        }}
                                                                        autoFocus
                                                                        data-testid="task-detail-subtask-new-input"
                                                                    />
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    <span className="opacity-50">Auto-generated</span>
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    <span className="opacity-50">-</span>
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    <span className="opacity-50">-</span>
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    <span className="opacity-50">-</span>
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    <span className="opacity-50">-</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                            onClick={handleAddSubtask}
                                                                            disabled={!newSubtaskName.trim()}
                                                                            title="Save (Enter)"
                                                                            data-testid="task-detail-subtask-new-save-btn"
                                                                        >
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={() => {
                                                                                setIsAddingSubtask(false);
                                                                                setNewSubtaskName("");
                                                                            }}
                                                                            title="Cancel (Esc)"
                                                                            data-testid="task-detail-subtask-new-cancel-btn"
                                                                        >
                                                                            <XIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}

                                                        {/* Existing Subtasks */}
                                                        {taskSubtasks.map((subtask) => (
                                                            <tr key={subtask.id} className="border-b hover:bg-muted/20 transition-colors">
                                                                <td className="p-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-input"
                                                                        checked={subtask.completed}
                                                                        onChange={(e) =>
                                                                            handleToggleSubtaskComplete(subtask.id, e.target.checked)
                                                                        }
                                                                        data-testid={`task-detail-subtask-checkbox-${subtask.id}`}
                                                                    />
                                                                </td>
                                                                <td className="p-3 text-xs">
                                                                    <span
                                                                        className={cn(
                                                                            subtask.completed && "line-through text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {subtask.name}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    {formatTaskId(projectSlug, subtask.taskNumber)}
                                                                </td>
                                                                <td className="p-3 text-xs">
                                                                    {subtask.assignee ? (() => {
                                                                        const member = workspaceMembers.find(m => m.userId === subtask.assignee);
                                                                        const name = member?.name || subtask.assignee;
                                                                        return (
                                                                            <div className="flex items-center gap-2">
                                                                                <MemberAvatar
                                                                                    name={name}
                                                                                    src={member?.avatar || member?.profilePicture}
                                                                                />
                                                                                <span className="text-xs">{name || `#${subtask.assignee.slice(-6)}`}</span>
                                                                            </div>
                                                                        );
                                                                    })() : (
                                                                        <span className="text-xs text-muted-foreground">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-xs">
                                                                    {subtask.status ? (
                                                                        <span className="px-2 py-1 rounded text-xs bg-muted">
                                                                            {subtask.status}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    {formatLocalDate(subtask.startDate)}
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">
                                                                    {formatLocalDate(subtask.endDate)}
                                                                </td>
                                                                <td className="p-3">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`task-detail-subtask-menu-trigger-${subtask.id}`}>
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                                                className="text-red-600"
                                                                                data-testid={`task-detail-subtask-delete-btn-${subtask.id}`}
                                                                            >
                                                                                Delete Subtask
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Empty State */}
                                                        {taskSubtasks.length === 0 && !isAddingSubtask && (
                                                            <tr>
                                                                <td colSpan={8} className="p-8 text-center">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            No subtasks added yet
                                                                        </p>
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="text-xs"
                                                                            onClick={() => setIsAddingSubtask(true)}
                                                                        >
                                                                            Add your first subtask
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Quick hint text */}
                                            {isAddingSubtask && (
                                                <p className="text-xs text-muted-foreground">
                                                    Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to save or{" "}
                                                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Checklist Section - Shows when has items (checklist auto-creates, so always > 0 after click) */}
                                    {/* {checklists.length > 0 && (
                                        <div className="space-y-4 border-t pt-4 mt-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-semibold">Checklist</h3>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={handleAddChecklist}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add Checklist
                                                </Button>
                                            </div>

                                            Checklists
                                            <div className="space-y-3">
                                                {checklists.map((checklist) => {
                                                    const progress = getChecklistProgress(checklist.id);
                                                    const items = getChecklistItems(checklist.id);
                                                    const isExpanded = expandedChecklists.has(checklist.id);

                                                    return (
                                                        <div key={checklist.id} className="border rounded-lg bg-blue-50">
                                                            Checklist Header
                                                            <div className="p-3 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => toggleChecklistExpanded(checklist.id)}
                                                                    >
                                                                        <ChevronDown
                                                                            className={cn(
                                                                                "h-4 w-4 transition-transform",
                                                                                isExpanded && "rotate-180"
                                                                            )}
                                                                        />
                                                                    </Button>

                                                                    {editingChecklistId === checklist.id ? (
                                                                        <Input
                                                                            value={editingChecklistName}
                                                                            onChange={(e) => setEditingChecklistName(e.target.value)}
                                                                            onBlur={() =>
                                                                                handleRenameChecklist(checklist.id, editingChecklistName)
                                                                            }
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    handleRenameChecklist(checklist.id, editingChecklistName);
                                                                                } else if (e.key === "Escape") {
                                                                                    setEditingChecklistId(null);
                                                                                }
                                                                            }}
                                                                            className="h-7 text-xs font-medium"
                                                                            autoFocus
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xs font-medium">
                                                                            {checklist.name}{" "}
                                                                            <span className="text-xs text-muted-foreground">
                                                                                ({progress.completed}/{progress.total})
                                                                            </span>
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-56">
                                                                        <DropdownMenuItem
                                                                            onClick={() => setAddingItemToChecklist(checklist.id)}
                                                                        >
                                                                            <Plus className="h-4 w-4 mr-2" />
                                                                            Add Item
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                setEditingChecklistId(checklist.id);
                                                                                setEditingChecklistName(checklist.name);
                                                                            }}
                                                                        >
                                                                            Rename checklist
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => { }}>
                                                                            Assign all to...
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => { }}>
                                                                            Unassign all
                                                                        </DropdownMenuItem>
                                                                        <Separator className="my-1" />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleCheckAllItems(checklist.id)}
                                                                        >
                                                                            Check All
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleUncheckAllItems(checklist.id)}
                                                                        >
                                                                            Uncheck All
                                                                        </DropdownMenuItem>
                                                                        <Separator className="my-1" />
                                                                        <DropdownMenuItem onClick={() => { }}>
                                                                            Save as Template
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => { }}>
                                                                            Update existing Template
                                                                        </DropdownMenuItem>
                                                                        <Separator className="my-1" />
                                                                        <DropdownMenuItem onClick={() => { }}>
                                                                            Move Down
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteChecklist(checklist.id)}
                                                                            className="text-red-600"
                                                                        >
                                                                            Delete checklist
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            Checklist Items
                                                            {isExpanded && (
                                                                <div className="px-3 pb-3 space-y-2">
                                                                    {items.map((item) => {
                                                                        console.log("Rendering checklist item:", item);
                                                                        const itemAssignees = item.assignees?.map(userId => {
                                                                        const wm = workspaceMembers.find(m => m.userId === userId);
                                                                            return wm ? { id: userId, name: wm.name, avatar: wm.avatar } : null;
                                                                        }).filter(Boolean);
                                                                        return (
                                                                            <div
                                                                                key={item.id}
                                                                                className="flex items-center gap-2 p-2 bg-card rounded border hover:bg-muted/20"
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={item.completed}
                                                                                    onChange={() => toggleChecklistItem(item.id)}
                                                                                    className="rounded border-input"
                                                                                />
                                                                                <span
                                                                                    className={cn(
                                                                                        "flex-1 text-xs",
                                                                                        item.completed && "line-through text-muted-foreground"
                                                                                    )}
                                                                                >
                                                                                    {item.name}
                                                                                </span>

                                                                                Assignees
                                                                                <div className="flex items-center -space-x-2">
                                                                                    {itemAssignees?.slice(0, 4).map((member) => (
                                                                                        <div
                                                                                            key={member.id}
                                                                                            className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs border-2 border-background"
                                                                                            title={member.name}
                                                                                        >
                                                                                            {member.name.charAt(0).toUpperCase()}
                                                                                        </div>
                                                                                    ))}
                                                                                    {itemAssignees && itemAssignees.length > 4 && (
                                                                                        <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs border-2 border-background">
                                                                                            +{itemAssignees.length - 4}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                Assign Member Dropdown
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                                            <User className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align="end">
                                                                                        {members.map((member) => (
                                                                                            <DropdownMenuItem
                                                                                                key={member.id}
                                                                                                onClick={() =>
                                                                                                    item.assignees?.includes(member.id)
                                                                                                        ? unassignMemberFromChecklistItem(
                                                                                                            item.id,
                                                                                                            member.id
                                                                                                        )
                                                                                                        : assignMemberToChecklistItem(item.id, member.id)
                                                                                                }
                                                                                            >
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                                                                                                        {member.name.charAt(0).toUpperCase()}
                                                                                                    </div>
                                                                                                    <span>{member.name}</span>
                                                                                                    {item.assignees?.includes(member.id) && (
                                                                                                        <Check className="h-4 w-4 ml-auto" />
                                                                                                    )}
                                                                                                </div>
                                                                                            </DropdownMenuItem>
                                                                                        ))}
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-6 w-6"
                                                                                    onClick={() => deleteChecklistItem(item.id)}
                                                                                >
                                                                                    <XIcon className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    Add Item Input
                                                                    {addingItemToChecklist === checklist.id ? (
                                                                        <div className="flex items-center gap-2 p-2 bg-card rounded border">
                                                                            <input type="checkbox" disabled className="rounded border-input" />
                                                                            <Input
                                                                                value={newItemName}
                                                                                onChange={(e) => setNewItemName(e.target.value)}
                                                                                placeholder="Add item"
                                                                                className="flex-1 h-7 border-0 focus-visible:ring-0 px-0"
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter") {
                                                                                        handleAddChecklistItem(checklist.id);
                                                                                    } else if (e.key === "Escape") {
                                                                                        setAddingItemToChecklist(null);
                                                                                        setNewItemName("");
                                                                                    }
                                                                                }}
                                                                                autoFocus
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="w-full justify-start h-8 text-muted-foreground"
                                                                            onClick={() => setAddingItemToChecklist(checklist.id)}
                                                                        >
                                                                            <Plus className="h-3 w-3 mr-2" />
                                                                            Add Item
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )} */}


                                </div>
                            </ResizablePanel>

                            <ResizableHandle className="w-[2px] bg-muted hover:bg-muted-foreground/50 transition-all" />


                            {/* Right Sidebar - Properties */}
                            <ResizablePanel defaultSize={30} minSize={20} maxSize={45} className="flex flex-col shrink-0">
                                {/* Full-width pill tab switcher */}
                                <div className="bg-muted p-2 flex items-center gap-1">
                                    {[
                                        { value: 'properties', label: 'Properties' },
                                        { value: 'activity', label: 'Activity Log' },
                                    ].map(tab => (
                                        <button
                                            key={tab.value}
                                            onClick={() => setActiveTab(tab.value as any)}
                                            data-testid={`task-detail-tab-${tab.value}`}
                                            className={`
                                                flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                                                ${activeTab === tab.value
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                                }
                                            `}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {activeTab === "properties" && (
                                        <div className="space-y-1">
                                            {/* STATUS */}
                                            <div className="flex items-center justify-between py-1">
                                                <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                                    <LayoutTemplate className="h-4 w-4" />
                                                    Status
                                                </Label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="secondary" size="sm"
                                                            className={cn("h-8 px-3 hover:bg-muted text-xs",
                                                                !currentTask.status && "text-muted-foreground")}
                                                            data-testid="task-detail-status-trigger"
                                                        >
                                                            {currentTask.status ? (() => {
                                                                const config = taskStatusConfigs.find(s => s.value === currentTask.status || s.label === currentTask.status);
                                                                return (
                                                                    <span className="flex items-center gap-1.5">
                                                                        {config && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />}
                                                                        {config?.label || currentTask.status}
                                                                    </span>
                                                                );
                                                            })() : "—"}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleUpdateTask({ status: undefined })}>
                                                            Clear
                                                        </DropdownMenuItem>
                                                        <Separator className="my-1" />
                                                        {taskStatusConfigs.map(config => (
                                                            <DropdownMenuItem
                                                                key={config._id}
                                                                onSelect={() => handleUpdateTask({ status: config.value })}
                                                            >
                                                                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: config.color }} />
                                                                {config.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* PRIORITY */}
                                            <div className="flex items-center justify-between py-1">
                                                <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                                    <Flag className="h-4 w-4" />
                                                    Priority
                                                </Label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="secondary" size="sm"
                                                            className={cn("h-8 px-3 hover:bg-muted text-xs",
                                                                !currentTask.priority && "text-muted-foreground")}
                                                            data-testid="task-detail-priority-trigger"
                                                        >
                                                            {currentTask.priority ? (
                                                                <span className="flex items-center gap-1.5">
                                                                    {getPriorityColor(currentTask.priority) && (
                                                                        <span className="w-2 h-2 rounded-full"
                                                                            style={{ backgroundColor: getPriorityColor(currentTask.priority) }} />
                                                                    )}
                                                                    {currentTask.priority}
                                                                </span>
                                                            ) : "—"}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleUpdateTask({ priority: undefined })}>
                                                            Clear
                                                        </DropdownMenuItem>
                                                        <Separator className="my-1" />
                                                        {taskPriorityConfigs.map(option => (
                                                            <DropdownMenuItem
                                                                key={option._id}
                                                                onSelect={() => handleUpdateTask({ priority: option.value })}
                                                            >
                                                                {option.color && (
                                                                    <span className="w-2 h-2 rounded-full mr-2"
                                                                        style={{ backgroundColor: option.color }} />
                                                                )}
                                                                {option.value}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* START DATE */}
                                            <div className="flex items-center justify-between py-1">
                                                <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    Start Date
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="secondary" size="sm"
                                                            className={cn("h-8 px-3 font-normal hover:bg-muted text-xs",
                                                                !currentTask.startDate && "text-muted-foreground")}
                                                            data-testid="task-detail-start-date-trigger"
                                                        >
                                                            {formatLocalDate(currentTask.startDate)}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="end">
                                                        <Calendar
                                                            mode="single"
                                                            selected={convertUTCToCalendarDate(currentTask.startDate)}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    const newStartDateStr = convertSelectedDateToUTC(date);
                                                                    const updates: any = { startDate: newStartDateStr };
                                                                    const endLocal = convertUTCToCalendarDate(currentTask.endDate);
                                                                    if (endLocal && endLocal < date) {
                                                                        updates.endDate = undefined;
                                                                    }
                                                                    handleUpdateTask(updates);
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                        {currentTask.startDate && (
                                                            <div className="p-2 border-t">
                                                                <Button variant="ghost" size="sm" className="w-full text-xs text-red-500"
                                                                    onClick={() => handleUpdateTask({ startDate: undefined })}>
                                                                    Clear date
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* END DATE / DUE DATE */}
                                            <div className="flex items-center justify-between py-1">
                                                <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    Due Date
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="secondary" size="sm"
                                                            className={cn("h-8 px-3 font-normal hover:bg-muted text-xs",
                                                                !currentTask.endDate && "text-muted-foreground")}
                                                            data-testid="task-detail-due-date-trigger"
                                                        >
                                                            {formatLocalDate(currentTask.endDate)}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="end">
                                                        <Calendar
                                                            mode="single"
                                                            selected={convertUTCToCalendarDate(currentTask.endDate)}
                                                            onSelect={(date) => {
                                                                if (date) handleUpdateTask({ endDate: convertSelectedDateToUTC(date) });
                                                            }}
                                                            disabled={(date) => {
                                                                const startLocal = convertUTCToCalendarDate(currentTask.startDate);
                                                                return startLocal ? date < new Date(startLocal.setHours(0, 0, 0, 0)) : false;
                                                            }}
                                                            initialFocus
                                                        />
                                                        {currentTask.endDate && (
                                                            <div className="p-2 border-t">
                                                                <Button variant="ghost" size="sm" className="w-full text-xs text-red-500"
                                                                    onClick={() => handleUpdateTask({ endDate: undefined })}>
                                                                    Clear date
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* ASSIGNEE — uses workspaceMembers like TaskTable */}
                                            <div className="flex items-center justify-between py-1">
                                                <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                                    <User className="h-4 w-4" />
                                                    Assignee
                                                </Label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="secondary" size="sm"
                                                            className={cn("h-8 px-3 hover:bg-muted text-xs",
                                                                !currentTask.assignee && "text-muted-foreground")}
                                                            data-testid="task-detail-assignee-trigger"
                                                        >
                                                            {currentTask.assignee ? (() => {
                                                                const member = workspaceMembers.find(m => m.userId === currentTask.assignee);
                                                                const name = member?.name || currentTask.assignee;
                                                                return (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <MemberAvatar
                                                                            name={name}
                                                                            src={member?.avatar || member?.profilePicture}
                                                                        />
                                                                    </span>
                                                                );
                                                            })() : "—"}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleUpdateTask({ assignee: undefined })}>
                                                            Clear
                                                        </DropdownMenuItem>
                                                        <Separator className="my-1" />
                                                        {workspaceMembers.filter(wm =>
                                                            currentProject?.members?.some(pm => pm.userId === wm.userId)
                                                        ).map(member => (
                                                            <DropdownMenuItem
                                                                key={member.userId}
                                                                onSelect={() => handleUpdateTask({ assignee: member.userId })}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <MemberAvatar
                                                                        name={member.name}
                                                                        src={member.avatar || member.profilePicture}
                                                                    />
                                                                    {member.name}
                                                                </div>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Labels */}
                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="font-semibold">Labels</Label>
                                                    <LabelPicker
                                                        selectedLabelIds={currentTask.labelIds || []}
                                                        onSelect={handleSelectLabel}
                                                        onRemove={handleRemoveLabel}
                                                    >
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="task-detail-label-picker-trigger">
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </LabelPicker>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentTask.labelIds && currentTask.labelIds.length > 0 ? (
                                                        currentTask.labelIds.map(labelId => {
                                                            const label = currentWorkspace?.labels?.find(l => l.id === labelId);
                                                            if (!label) return null;
                                                            return (
                                                                <LabelBadge
                                                                    key={labelId}
                                                                    label={label}
                                                                    onRemove={() => handleRemoveLabel(labelId)}
                                                                    removeButtonTestId={`task-detail-label-remove-${labelId}`}
                                                                />
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground italic">No labels assigned yet.</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* <Separator /> */}

                                            {/* CUSTOM FIELDS SECTION */}
                                            <>
                                                {/* Section header with Add button */}
                                                <div className="flex items-center justify-between py-1">
                                                    <p className="text-xs font-semibold uppercase tracking-wide">
                                                        Custom Fields
                                                    </p>
                                                    <Popover open={showAddFieldPopover} onOpenChange={setShowAddFieldPopover}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                title="Add custom field"
                                                                data-testid="task-detail-add-custom-field-trigger"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-[300px] p-0 flex flex-col"
                                                            align="end"
                                                            style={{ height: '480px' }}
                                                        >
                                                            <FieldTypeSelectContent
                                                                projectId={projectId}
                                                                onFieldCreated={() => setShowAddFieldPopover(false)}
                                                                onBack={() => setShowAddFieldPopover(false)}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                {/* Fields list — preview or all */}
                                                {customFields.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground py-2">No custom fields yet</p>
                                                ) : (
                                                    <>
                                                        {(showAllCustomFields
                                                            ? customFields
                                                            : customFields.slice(0, CUSTOM_FIELDS_PREVIEW_COUNT)
                                                        ).map(field => {
                                                            const fieldData = getTaskCustomFieldById(projectId, field.id);
                                                            if (!fieldData) return null;
                                                            const IconComponent = getCustomFieldIcon(field.type);
                                                            return (
                                                                <div key={field.id} className="flex items-center justify-between py-1">
                                                                    <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0 max-w-[45%]">
                                                                        <IconComponent className="h-3.5 w-3.5 shrink-0" />
                                                                        <span className="truncate">{field.name}</span>
                                                                    </Label>
                                                                    <div className="w-[160px]" data-testid={`task-detail-custom-field-dropdown-${field.id}`}>
                                                                        <CustomFieldDropdown
                                                                            field={fieldData}
                                                                            value={
                                                                                currentTask.customFieldValues?.[field.id] ||
                                                                                (field.type === 'select-many' || field.type === 'label' ? [] : '')
                                                                            }
                                                                            onUpdate={(value) => {
                                                                                const updatedValues = {
                                                                                    ...currentTask.customFieldValues,
                                                                                    [field.id]: value
                                                                                };
                                                                                handleUpdateTask({ customFieldValues: updatedValues });
                                                                            }}
                                                                            task={currentTask}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Show more / Show less toggle */}
                                                        {customFields.length > CUSTOM_FIELDS_PREVIEW_COUNT && (
                                                            <button
                                                                onClick={() => setShowAllCustomFields(prev => !prev)}
                                                                className="w-full flex items-center gap-1.5 py-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                                                data-testid="task-detail-custom-field-toggle-show-all"
                                                            >
                                                                <ChevronDown className={cn(
                                                                    "h-3.5 w-3.5 transition-transform",
                                                                    showAllCustomFields && "rotate-180"
                                                                )} />
                                                                {showAllCustomFields
                                                                    ? "Show less"
                                                                    : `Show ${customFields.length - CUSTOM_FIELDS_PREVIEW_COUNT} more field${customFields.length - CUSTOM_FIELDS_PREVIEW_COUNT > 1 ? 's' : ''}`
                                                                }
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </>

                                            <Separator className="my-2" />

                                            {/* Attachments */}
                                            <TaskAttachments
                                                taskId={currentTask.id}
                                                attachments={currentTask.attachments ?? []}
                                            />
                                        </div>
                                    )}

                                    {/* {activeTab === "progress" && (
                                        <div className="text-center text-muted-foreground text-xs py-8">Progress content here</div>
                                    )} */}

                                    {activeTab === "activity" && (
                                        <div className="space-y-4">
                                            <SharedActivityLog entityType="task" entityId={currentTask.id} />
                                        </div>
                                    )}
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
