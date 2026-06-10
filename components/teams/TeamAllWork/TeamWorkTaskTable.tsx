// components/list-view/TaskTable.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    GripVertical,
    ChevronRight,
    ChevronUp,
    MoreHorizontal,
    Copy,
    Plus,
    ChevronDown,
    ExternalLink,
    Link,
    MoveRight,
    Repeat,
    ListChecks,
    Clock,
    Trash2,
    User,
    Flag,
    ChevronsLeftRight,
    Info,
    LayoutTemplate,
    CircleArrowLeft,
    CircleArrowRight,
    SkipBack,
    SkipForward,
    GitMerge,
    Link2,
    Ban,
    XOctagon,
    Users,
    ArrowUp,
    ArrowDown,
    ChevronsUpDown,
    Target,
} from "lucide-react";
import {
    getRelationshipIcon,
    getRelationshipIconColor,
    getRelationshipLabel
} from '@/utils/relationship-utils';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatLocalDate, convertSelectedDateToUTC } from "@/utils/timezone-utils";
import { useTasksStore, SYSTEM_FIELDS } from "@/stores/tasks-store";
import { Task, ColumnConfig } from '@/types/task.types';
import { CustomFieldDropdown } from "@/components/projects/views/list-view/common/CustomFieldDropdown";
import { TaskDetailView } from "@/components/projects/TaskDetailView";
import { ListFieldVisibilityPopup } from '@/components/projects/views/list-view/common/ListFieldVisibilityPopup';
import {
    getTaskTypeIcon,
    getTaskTypeIconColor,
    getDefaultTaskTypeIcon,
    useProjectsStore,
} from "@/stores/projects-store";
import { formatTaskId } from '@/utils/task-utils';
import { useWorkspaceStore } from "@/stores/workspace-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "sonner";
import DuplicateTaskDialog from "@/components/projects/DuplicateTaskDialog";
import { useGoalsStore } from "@/stores/goals-store";
import { ConvertToSubtaskDialog } from "@/components/projects/ConvertToSubtaskDialog";
// import { EditCustomFieldPopup } from './common/EditCustomFieldPopup';
import { iconComponentMap } from '@/components/ColorIconPicker';
import { IoFolderOpenSharp } from 'react-icons/io5';
import { EditCustomFieldPopup } from "@/components/projects/views/list-view/common/EditCustomFieldPopup";

const ProjectIcon = ({ project, size = 16 }: { project: any, size?: number }) => {
    const name = project?.name || 'Unknown';
    const firstLetter = name.charAt(0).toUpperCase();

    if (!project || (!project.icon && !project.iconId)) {
        return (
            <div
                className="flex items-center justify-center rounded bg-primary text-primary-foreground font-bold leading-none shrink-0"
                style={{ width: size, height: size, fontSize: size * 0.65 }}
            >
                {firstLetter}
            </div>
        );
    }

    const { icon, color = '#3B82F6' } = project;

    if (icon?.type === 'file' && icon?.presignedUrl) {
        return (
            <img
                src={icon.presignedUrl}
                alt={project.name}
                className="rounded-md object-cover shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }

    const IconComponent = (icon?.name && iconComponentMap[icon.name]) ? iconComponentMap[icon.name] : null;

    if (!IconComponent) {
        return (
            <div
                className="flex items-center justify-center rounded-md bg-blue-600 text-white font-bold leading-none shrink-0"
                style={{ width: size, height: size, fontSize: size * 0.65 }}
            >
                {firstLetter}
            </div>
        );
    }
    return (
        <IconComponent
            size={size}
            color={icon?.color || color}
            className="shrink-0"
        />
    );
};


interface TaskTableProps {
    groupId: string;
    projectId?: string;
    hideFields: string[];
    filteredTasks?: Task[];
    groupMemberId?: string;
    columnConfigs?: ColumnConfig[];
    displayOptions?: {
        collapsedSubtasks: boolean;
        closedTasks: boolean;
        wrapText: boolean;
        subtaskParentId: boolean;
    };
    groupColor?: string;
    activeSortConfig?: { fieldId: string; fieldType: string; direction: 'asc' | 'desc'; order: number }[];
    onSortChange?: (fieldId: string, fieldType: string) => void;
    onSelectionChange?: (selectedIds: string[]) => void;
    clearSelection?: boolean;
    isTeamView?: boolean;
}

// ── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 'sm', src }: { name?: string; size?: 'sm' | 'md'; src?: string | null }) {
    const dim = size === 'sm' ? 'w-7 h-7 ' : 'w-8 h-8 text-sm';
    if (!name && !src) {
        return (
            <div className={`${dim} rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400`}>
                <User className="h-3 w-3" />
            </div>
        );
    }

    return (
        <UIAvatar className={cn(dim, "border shrink-0")}>
            {src && <AvatarImage src={src} className="object-cover" />}
            <AvatarFallback
                className="font-semibold text-white bg-gray-400"
                style={{ backgroundColor: name ? getAvatarColor(name) : undefined }}
            >
                {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-3 w-3" />}
            </AvatarFallback>
        </UIAvatar>
    );
}

// ── Priority flag ────────────────────────────────────────────────────────────
function PriorityFlag({ priority, color }: { priority?: string; color?: string }) {
    if (!priority) {
        return (
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-600/20">
                <Flag className="h-4 w-4 text-gray-600" />
            </div>
        );
    }
    const bg = color || '#9CA3AF';
    return (
        <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${bg}22` }}
            title={priority}
        >
            <Flag className="h-4 w-4" style={{ color: bg }} />
        </div>
    );
}

interface ResizeHandleProps {
    columnId: string;
    onResize: (columnId: string, deltaX: number) => void;
    onDoubleClick: (columnId: string) => void;
}

function ResizeHandle({ columnId, onResize, onDoubleClick }: ResizeHandleProps) {
    const startX = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        startX.current = e.clientX;

        const onMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX.current;
            startX.current = ev.clientX;
            onResize(columnId, delta);
        };
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onDoubleClick={() => onDoubleClick(columnId)}
            title="Drag to resize · Double-click to toggle collapse"
            className="group absolute right-0 top-0 h-full w-3 cursor-col-resize z-30 flex justify-end"
        >
            <div className="w-1 h-full bg-transparent group-hover:bg-blue-400 group-active:bg-blue-600 transition-colors" />
        </div>
    );
}

export function TeamWorkTaskTable({
    groupId,
    projectId = '',
    hideFields,
    filteredTasks,
    groupMemberId,
    columnConfigs = [],
    displayOptions = {
        collapsedSubtasks: false,
        closedTasks: false,
        wrapText: false,
        subtaskParentId: false,
    },
    groupColor = '#3B82F6',
    activeSortConfig = [],
    onSortChange,
    onSelectionChange,
    clearSelection,
    isTeamView = false,
}: TaskTableProps) {

    // At the top of TaskTable, add this helper:
    const getSortIcon = (fieldId: string, fieldType: string) => {
        const active = activeSortConfig.find(s => s.fieldId === fieldId);
        if (!active) {
            return (
                <ChevronsUpDown
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-muted rounded p-0.5"
                    onClick={() => onSortChange?.(fieldId, fieldType)}
                />
            );
        }
        const Icon = active.direction === 'asc' ? ArrowUp : ArrowDown;
        return (
            <Icon
                className="h-5 w-5 cursor-pointer text-primary rounded-md p-0.5 bg-primary/10"
                onClick={() => onSortChange?.(fieldId, fieldType)}
            />
        );
    };

    const {
        projects,
        getTaskTypesByProject,
        getTaskStatusConfigs,
        addTaskStatusConfig,
        getTaskCustomFields,
        getTaskCustomFieldById,
        getTaskPriorityConfigs,
        addTaskPriorityConfig,
    } = useProjectsStore();
    const {
        getSubtasksByTask,
        addTask,
        updateTask,
        deleteTask,
        addSubtask,
        updateSubtask,
        deleteSubtask,
        updateTaskCustomField,
        updateSubtaskCustomField,
        fetchTaskById,
        updateColumnWidth,
        getTaskRelationships,
        addTaskRelationship,
        convertTaskToSubtask,
        getTasksByProject,
    } = useTasksStore();
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
    const goals = useGoalsStore(state => state.goals);

    // ✅ ADD THIS LINE — makes TaskTable re-render when any field is toggled
    const systemFieldVisibility = useTasksStore(state => state.systemFieldVisibility);

    const project = projects.find((p) => p.id === projectId);
    const projectSlug = project?.slug ?? 'TASK';
    const customFields = isTeamView ? [] : getTaskCustomFields(projectId);
    const taskTypes = isTeamView ? [] : getTaskTypesByProject(projectId);
    const taskStatusConfigs = isTeamView ? [] : getTaskStatusConfigs(projectId);
    const taskPriorityConfigs = isTeamView ? [] : getTaskPriorityConfigs(projectId);
    const members = workspaceMembers.filter(wm =>
        isTeamView ? true : project?.members?.some(pm => pm.userId === wm.userId)
    );

    const getTaskConfigs = (pId: string) => {
        const p = projects.find(proj => proj.id === pId);
        return {
            slug: p?.slug ?? 'TASK',
            statusConfigs: p?.taskStatusConfig || [],
            priorityConfigs: p?.taskPriorityConfig || [],
            types: p?.taskTypeConfig || [], // Assuming taskTypeConfig exists
            project: p,
        };
    };

    const [showAddTask, setShowAddTask] = useState(false);
    const [isAddTaskRowHovered, setIsAddTaskRowHovered] = useState(false);
    const [showTaskTypeMenu, setShowTaskTypeMenu] = useState(false);
    const [taskTypeMenuCoords, setTaskTypeMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const chevronButtonRef = useRef<HTMLButtonElement>(null);
    const [selectedAddTaskType, setSelectedAddTaskType] = useState('task');
    const [addingSubtaskToTask, setAddingSubtaskToTask] = useState<string | null>(null);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => new Set());

    // Add near other useState declarations (around line 342)
    const [copiedTaskItem, setCopiedTaskItem] = useState<"link" | "id" | null>(null);
    const [copiedSubtaskItem, setCopiedSubtaskItem] = useState<"link" | "id" | null>(null);

    // Task delete confirmation
    const [deleteTaskConfirmId, setDeleteTaskConfirmId] = useState<string | null>(null);
    // Subtask delete confirmation  
    const [deleteSubtaskConfirmId, setDeleteSubtaskConfirmId] = useState<string | null>(null);

    const DEFAULT_COL_WIDTH = 150;
    const MIN_COL_WIDTH = 60;
    const MAX_COL_WIDTH = 500;

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        const defaults: Record<string, number> = {};
        // pre-seed with defaults for all known column ids
        (columnConfigs ?? []).forEach(c => {
            defaults[c.id] = DEFAULT_COL_WIDTH;
        });
        return defaults;
    });

    const handleColumnResize = useCallback((columnId: string, deltaX: number) => {
        setColumnWidths(prev => {
            const next = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, (prev[columnId] ?? DEFAULT_COL_WIDTH) + deltaX));
            updateColumnWidth(columnId, next); // persist to store
            return { ...prev, [columnId]: next };
        });
    }, [updateColumnWidth]);

    const handleColumnToggleCollapse = useCallback((columnId: string) => {
        setColumnWidths(prev => ({ ...prev, [columnId]: DEFAULT_COL_WIDTH }));
        updateColumnWidth(columnId, DEFAULT_COL_WIDTH);
    }, [updateColumnWidth]);

    useEffect(() => {
        if (!showTaskTypeMenu) return;
        const handleClick = () => setShowTaskTypeMenu(false);
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showTaskTypeMenu]);

    useEffect(() => {
        if (displayOptions.collapsedSubtasks) {
            setExpandedTasks(new Set());
        } else {
            const validIds = new Set((filteredTasks || []).map(t => t.id));
            const tasksWithSubtasks = (filteredTasks || [])
                .filter(task => getSubtasksByTask(task.id)?.length > 0)
                .map(task => task.id);

            setExpandedTasks(prev => new Set([
                ...Array.from(prev).filter(id => validIds.has(id)), // keep existing valid expanded rows
                ...tasksWithSubtasks,                                // add tasks that have subtasks
            ]));
        }
    }, [displayOptions.collapsedSubtasks, filteredTasks, getSubtasksByTask]);

    const [newTaskData, setNewTaskData] = useState({
        name: '',
        taskType: 'task',
        assignee: '',
        startDate: new Date() as Date | undefined,
        endDate: undefined as Date | undefined,
        priority: '' as string,
        status: '' as string,
        customFieldValues: {} as Record<string, string | string[]>,
    });

    const [newSubtaskData, setNewSubtaskData] = useState({
        name: '',
        taskType: 'task',
        assignee: '',
        priority: '' as string,
        status: '' as string,
        startDate: new Date() as Date | undefined,
        endDate: undefined as Date | undefined,
        customFieldValues: {} as Record<string, string | string[]>,
    });

    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);

    const [selectedSubtaskForDetail, setSelectedSubtaskForDetail] = useState<Task | null>(null);
    const [showSubtaskDetail, setShowSubtaskDetail] = useState(false);

    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const [isAddingStatus, setIsAddingStatus] = useState(false);
    const [newStatusName, setNewStatusName] = useState('');
    const [isAddingPriority, setIsAddingPriority] = useState(false);
    const [newPriorityName, setNewPriorityName] = useState('');

    const [convertToSubtaskTaskId, setConvertToSubtaskTaskId] = useState<string | null>(null);

    // ── Relationship Dialog state ──────────────────────────────────────
    const [relDialogOpen, setRelDialogOpen] = useState(false);
    const [relDialogTaskId, setRelDialogTaskId] = useState<string | null>(null);
    const [relDialogType, setRelDialogType] = useState<string>("relates-to");
    const [relDialogTargetId, setRelDialogTargetId] = useState<string>("");
    const [relDialogIsSubtask, setRelDialogIsSubtask] = useState(false);

    const RELATIONSHIP_TYPES = [
        { value: "relates-to", label: "Relates to", icon: Link2, color: "text-blue-500" },
        { value: "duplicate-of", label: "Duplicate of", icon: Copy, color: "text-purple-500" },
        { value: "blocked-by", label: "Blocked by", icon: Ban, color: "text-red-500" },
        { value: "blocking", label: "Blocking", icon: XOctagon, color: "text-orange-500" },
        { value: "starts-before", label: "Starts Before", icon: CircleArrowLeft, color: "text-green-500" },
        { value: "starts-after", label: "Starts After", icon: CircleArrowRight, color: "text-teal-500" },
        // { value: "finishes-before", label: "Finishes Before", icon: SkipBack, color: "text-yellow-600" },
        // { value: "finishes-after", label: "Finishes After", icon: SkipForward, color: "text-lime-600" },
    ];

    const openRelDialog = (taskId: string, type: string, isSubtask: boolean) => {
        setRelDialogTaskId(taskId);
        setRelDialogType(type);
        setRelDialogTargetId("");
        setRelDialogIsSubtask(isSubtask);
        setRelDialogOpen(true);
    };

    const handleConfirmRelationship = async () => {
        if (!relDialogTaskId || !relDialogTargetId) return;
        await addTaskRelationship(relDialogTaskId, {
            type: relDialogType as any,
            targetTaskId: relDialogTargetId,
        });
        setRelDialogOpen(false);
        setRelDialogTargetId("");
    };

    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [duplicateTaskId, setDuplicateTaskId] = useState<string | null>(null);
    const [duplicateSubtaskId, setDuplicateSubtaskId] = useState<string | null>(null);
    const duplicateTask = useTasksStore((s) => s.duplicateTask);

    useEffect(() => {
        if (clearSelection) {
            setSelectedTaskIds(new Set());
        }
    }, [clearSelection]);

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedTaskIds.size === groupTasks.length) {
            setSelectedTaskIds(new Set());
        } else {
            setSelectedTaskIds(new Set(groupTasks.map(t => t.id)));
        }
    };

    useEffect(() => {
        onSelectionChange?.(Array.from(selectedTaskIds));
    }, [selectedTaskIds]);

    const handleConvertTaskType = (taskId: string, typeValue: string) => {
        updateTask(taskId, { taskType: typeValue });
    };

    const handleConvertSubtaskType = (subtaskId: string, typeValue: string) => {
        updateSubtask(subtaskId, { taskType: typeValue });
    };

    const handleConfirmConvertToSubtask = async (
        parentTaskId: string,
        updates: { name: string; priority?: string; endDate?: string; assignee?: string }
    ) => {
        if (!convertToSubtaskTaskId) return;
        await convertTaskToSubtask(convertToSubtaskTaskId, parentTaskId, updates);
        setConvertToSubtaskTaskId(null);
        toast.success("Task converted to subtask");
    };

    const groupTasks = filteredTasks || [];

    // In the team view we always group by user — groupId IS the member's userId.
    // This helper pre-fills the assignee so every task/subtask created in this
    // section is automatically assigned to the right person.
    const getGroupPrefillData = (): Partial<typeof newTaskData> => {
        const prefill: Partial<typeof newTaskData> = {
            startDate: new Date(),
        };
        if (groupId) prefill.assignee = groupId;
        return prefill;
    };

    const toggleTaskExpansion = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) newSet.delete(taskId);
            else newSet.add(taskId);
            return newSet;
        });
    };

    const handleSaveTask = async () => {
        if (!newTaskData.name.trim()) return;
        const status = newTaskData.status || undefined;
        const priority = newTaskData.priority || undefined;
        // Always assign to the member whose section this is
        const assignee = newTaskData.assignee || groupId || undefined;
        const taskType = newTaskData.taskType || selectedAddTaskType;
        const customFieldValues = { ...newTaskData.customFieldValues };

        const capturedData = { ...newTaskData };  // snapshot before reset
        const capturedTaskType = taskType; // capture before reset

        // Close input row immediately
        setNewTaskData({ name: '', taskType: 'task', assignee: '', startDate: new Date() as Date | undefined, endDate: undefined, priority: '', status: '', customFieldValues: {} });
        setSelectedAddTaskType('task');
        setShowTaskTypeMenu(false);
        setShowAddTask(false);

        const onConfirmed = capturedTaskType === 'milestone'
            ? (realId: string) => {
                // Swap tempId → realId so the row stays open under the real task
                setExpandedTasks(prev => {
                    const next = new Set(prev);
                    next.delete(tempId);  // remove stale tempId
                    next.add(realId);     // add real id
                    return next;
                });
                setAddingSubtaskToTask(realId);  // update to real id
            }
            : undefined;

        const tempId = await addTask(
            {
                projectId,
                name: capturedData.name,
                taskType,
                assignee,
                startDate: capturedData.startDate ? convertSelectedDateToUTC(capturedData.startDate) : undefined,
                endDate: capturedData.endDate ? convertSelectedDateToUTC(capturedData.endDate) : undefined,
                priority,
                status,
                completed: false,
                customFieldValues,
            },
            onConfirmed
        );

        // Open subtask row immediately with tempId while API is in flight
        if (capturedTaskType === 'milestone' && tempId) {
            setNewSubtaskData({
                name: '',
                taskType: 'task',
                status: status || '',
                assignee: assignee || '',
                priority: priority || '',
                endDate: capturedData.endDate ? new Date(capturedData.endDate) : undefined,
                startDate: new Date(),
                customFieldValues: {},
            });
            setExpandedTasks(prev => new Set([...prev, tempId]));
            setAddingSubtaskToTask(tempId);
        }
    };

    const handleSaveSubtask = async (parentTaskId: string) => {
        if (!newSubtaskData.name.trim()) return;
        const parentTask = groupTasks.find(t => t.id === parentTaskId);
        const status = newSubtaskData.status || parentTask?.status || undefined;
        const priority = newSubtaskData.priority || undefined;
        // Always assign to the member whose section this is
        const assignee = newSubtaskData.assignee || groupId || undefined;
        const customFieldValues = { ...newSubtaskData.customFieldValues };

        const capturedSubtask = { ...newSubtaskData };

        // ✅ Close the input row IMMEDIATELY — don't wait for API
        setNewSubtaskData({
            name: '',
            taskType: 'task',
            assignee: '',
            startDate: new Date() as Date | undefined,
            endDate: undefined,
            priority: '',
            status: '',
            customFieldValues: {},
        });
        setAddingSubtaskToTask(null); // ← closes the subtask input row instantly

        // Now call addSubtask with the snapshot — returns tempId immediately
        await addSubtask({
            name: capturedSubtask.name,
            taskType: capturedSubtask.taskType || 'task',
            parentTaskId,
            projectId,
            assignee: capturedSubtask.assignee || undefined,
            startDate: capturedSubtask.startDate ? convertSelectedDateToUTC(capturedSubtask.startDate) : undefined,
            endDate: capturedSubtask.endDate ? convertSelectedDateToUTC(capturedSubtask.endDate) : undefined,
            priority: capturedSubtask.priority || undefined,
            status: capturedSubtask.status || undefined,
            completed: false,
            customFieldValues: capturedSubtask.customFieldValues || {},
        });
    };

    const handleAddStatus = async (name: string, taskId?: string, isSubtask?: boolean, subtaskId?: string) => {
        if (!name.trim()) return;
        await addTaskStatusConfig(projectId, {
            label: name,
            color: '#6B7280',
            value: name.trim().toLowerCase().replace(/\s+/g, '_'),
        });
        if (taskId && !isSubtask) updateTask(taskId, { status: name.trim() });
        else if (subtaskId) updateSubtask(subtaskId, { status: name.trim() });
        setNewStatusName('');
        setIsAddingStatus(false);
    };

    const handleAddPriority = async (name: string, taskId?: string, isSubtask?: boolean, subtaskId?: string) => {
        if (!name.trim()) return;
        const value = name.trim().toLowerCase().replace(/\s+/g, '_');
        await addTaskPriorityConfig(projectId, {
            label: name.trim(),
            value,
            description: '',
            color: '#6B7280',
            order: taskPriorityConfigs.length + 1,
        });
        if (taskId && !isSubtask) updateTask(taskId, { priority: value });
        else if (subtaskId) updateSubtask(subtaskId, { priority: value });
        setNewPriorityName('');
        setIsAddingPriority(false);
    };


    const handleCopyTaskLink = async (taskId: string) => {
        try {
            const url = `${window.location.origin}/task/${taskId}`;
            await navigator.clipboard.writeText(url);
            setCopiedTaskItem("link");
            toast.success("Task link copied!");
            setTimeout(() => setCopiedTaskItem(null), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleCopyTaskId = async (taskId: string) => {
        try {
            await navigator.clipboard.writeText(taskId);
            setCopiedTaskItem("id");
            toast.success("Task ID copied!");
            setTimeout(() => setCopiedTaskItem(null), 2000);
        } catch {
            toast.error("Failed to copy ID");
        }
    };

    const handleCopySubtaskLink = async (subtaskId: string) => {
        try {
            const url = `${window.location.origin}/task/${subtaskId}`;
            await navigator.clipboard.writeText(url);
            setCopiedSubtaskItem("link");
            toast.success("Subtask link copied!");
            setTimeout(() => setCopiedSubtaskItem(null), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleCopySubtaskId = async (subtaskId: string) => {
        try {
            await navigator.clipboard.writeText(subtaskId);
            setCopiedSubtaskItem("id");
            toast.success("Subtask ID copied!");
            setTimeout(() => setCopiedSubtaskItem(null), 2000);
        } catch {
            toast.error("Failed to copy ID");
        }
    };

    // ── Column visibility / freeze helpers ───────────────────────────────────
    const getVisibleColumnConfigs = () => {
        if (!columnConfigs || columnConfigs.length === 0) return [];
        return columnConfigs.filter(c => c.pinned !== false);
    };

    const visibleColumnConfigs = getVisibleColumnConfigs();

    const shouldShowField = (fieldKey: string, fieldLabel: string) => {
        // ✅ System fields are controlled by systemFieldVisibility, NOT columnConfigs.pinned
        const systemFieldIds = ['id', 'task', 'taskType', 'status', 'assignee', 'startDate', 'endDate', 'priority'];
        const isSystemField = systemFieldIds.includes(fieldKey);

        if (!isSystemField) {
            // Custom fields: use columnConfigs pinned check
            if (!shouldShowColumn(fieldKey)) return false;
        }

        if (hideFields.includes(fieldLabel)) return false;

        if (systemFieldIds.includes(fieldKey)) {
            const key = `${projectId}-${fieldKey}`;
            const field = SYSTEM_FIELDS.find(f => f.id === fieldKey);
            const isVisible = systemFieldVisibility[key] !== undefined
                ? systemFieldVisibility[key]
                : (field?.defaultVisible ?? true);
            if (!isVisible) return false;  // ✅ reads directly from reactive state
        }

        return true;
    };

    const getColumnStyle = (columnId: string, isHeader: boolean = false, rowGroupColor?: string, isSubtask: boolean = false): React.CSSProperties => {
        const alwaysFrozenColumns = {
            'drag': { width: 40, order: -2 },
            'checkbox': { width: 48, order: -1 },
            'id': { width: 120, order: 0 },
            'task': { width: columnWidths['task'] ?? 260, order: 1 },
            'project': { width: 150, order: 2 }
        };
        if (alwaysFrozenColumns[columnId as keyof typeof alwaysFrozenColumns]) {
            const config = alwaysFrozenColumns[columnId as keyof typeof alwaysFrozenColumns];
            let leftOffset = 0;
            if (columnId === 'drag') leftOffset = 0;
            if (columnId === 'checkbox') leftOffset = 40;
            if (columnId === 'id') leftOffset = 40 + 48;
            if (columnId === 'task') leftOffset = 40 + 48 + 120;
            if (columnId === 'project') leftOffset = 40 + 48 + 120 + (columnWidths['task'] ?? 260);

            const baseStyle: React.CSSProperties = {
                position: 'sticky',
                left: `${leftOffset}px`,
                zIndex: isHeader ? 20 : 10,
                backgroundColor: isHeader ? 'transparent' : 'var(--background)',
                minWidth: `${config.width}px`,
                width: `${config.width}px`,
                borderRight: '1px solid var(--border)',
            };

            // ← The drag cell carries the group-color left accent border
            if (columnId === 'drag' && rowGroupColor) {
                const offset = isSubtask ? 12 : 0;
                baseStyle.boxShadow = `inset 4px 0 0 ${offset}px ${rowGroupColor}`;
            }

            return baseStyle;
        }
        
        const columnConfig = visibleColumnConfigs?.find(c => c.id === columnId);
        if (columnConfig && columnConfig.columnFreezed && !columnConfig.isSystemColumn) {
            const baseOffset = 40 + 48 + 120 + (columnWidths['task'] ?? 260) + (isTeamView ? 150 : 0);
            const frozenBefore = visibleColumnConfigs
                .filter(c => c.columnFreezed && c.columnOrder < columnConfig.columnOrder && !c.isSystemColumn)
                .sort((a, b) => a.columnOrder - b.columnOrder);
            let leftOffset = baseOffset;
            frozenBefore.forEach(() => { leftOffset += 150; });
            const w = columnWidths[columnId] ?? DEFAULT_COL_WIDTH;
            return {
                position: 'sticky',
                left: `${leftOffset}px`,
                zIndex: isHeader ? 20 : 10,
                backgroundColor: isHeader ? 'var(--muted)' : 'inherit',
                minWidth: `${w}px`,
                width: `${w}px`,
                borderRight: '1px solid var(--border)',
                boxShadow: '2px 0 4px rgba(0,0,0,0.04)',
            };
        }
        const w = columnWidths[columnId] ?? DEFAULT_COL_WIDTH;
        return { minWidth: `${w}px`, width: `${w}px`, borderRight: "1px solid var(--border)" };
    };

    const shouldShowColumn = (columnId: string): boolean => {
        // Check all columnConfigs (not just pinned-filtered ones)
        // so hidden custom fields are properly excluded from body rows
        const columnConfig = columnConfigs.find(c => c.id === columnId);
        if (!columnConfig) return true; // not a managed column, always show (system fields)
        return columnConfig.pinned !== false; // explicitly hidden → false
    };

    const getTableHeaders = () => {
        const defaultHeaders = [
            { key: 'taskType', label: 'Type', fixed: false, type: 'text', isCustom: false },
            { key: 'status', label: 'Status', fixed: false, type: 'select-one', isCustom: false },
            { key: 'assignee', label: 'Assignee', fixed: false, type: 'people', isCustom: false },
            { key: 'startDate', label: 'Start Date', fixed: false, type: 'date', isCustom: false },
            { key: 'endDate', label: 'Due Date', fixed: false, type: 'date', isCustom: false },
            { key: 'priority', label: 'Priority', fixed: false, type: 'select-one', isCustom: false },
        ];
        const customHeaders = isTeamView ? [] : customFields.map(field => ({
            key: field.id,
            label: field.name,
            fixed: false,
            type: field.type,
            isCustom: true,
        }));
        let allHeaders = [...defaultHeaders, ...customHeaders];
        allHeaders = allHeaders.filter(h => shouldShowField(h.key, h.label));
        return allHeaders;
    };

    const headers = getTableHeaders();

    // Lookup priority option color
    const getPriorityColor = (priorityValue?: string, pId?: string): string | undefined => {
        if (!priorityValue) return undefined;
        const configs = pId ? getTaskConfigs(pId).priorityConfigs : taskPriorityConfigs;
        return configs.find((p: any) => p.value === priorityValue)?.color;
    };


    // Format date nicely: "10 Dec"
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const formatted = formatLocalDate(dateStr);
        return formatted === "—" ? dateStr : formatted;
    };

    // ── Shared cell styles ────────────────────────────────────────────────────
    const headerCellCls = "h-9 font-semibold text-muted-foreground uppercase tracking-wide px-3 select-none";
    const bodyCellCls = "px-3 py-2.5";

    return (
        <>
            <div className="relative">
                <div className="overflow-x-auto rounded-tl-sm">
                    <Table className="relative border-y border-border text-sm">

                        {/* ── Column Headers ─────────────────────────────────────────── */}
                        <TableHeader>
                            <TableRow
                                className="hover:bg-transparent border-b border-border"
                            >
                                {/* Drag handle */}
                                <TableHead className={headerCellCls} style={getColumnStyle('drag', true, groupColor)} />
                                {/* Checkbox */}
                                <TableHead className={headerCellCls} style={getColumnStyle('checkbox', true)}>
                                    <div className="flex items-center pl-1">
                                        <Checkbox
                                            checked={
                                                groupTasks.length > 0 && selectedTaskIds.size === groupTasks.length
                                            }
                                            onCheckedChange={toggleSelectAll}
                                            className="rounded"
                                        />
                                    </div>
                                </TableHead>
                                {/* ✅ ID Column Header (frozen) */}
                                <TableHead className={`${headerCellCls} text-center`} style={getColumnStyle('id', true)}>
                                    ID
                                </TableHead>
                                <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("task", true)}>
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Task</span>
                                        {getSortIcon('task', 'text')}
                                    </div>
                                    <ResizeHandle
                                        columnId="task"
                                        onResize={handleColumnResize}
                                        onDoubleClick={handleColumnToggleCollapse}
                                    />
                                </TableHead>
                                {isTeamView && (
                                    <TableHead className={`${headerCellCls} text-center`} style={getColumnStyle('project', true)}>
                                        Project
                                    </TableHead>
                                )}
                                {/* Dynamic columns */}
                                {headers.map((header) => (
                                    <TableHead
                                        key={header.key}
                                        style={getColumnStyle(header.key, true)}
                                        className={cn(headerCellCls, "text-center relative group")}
                                    >
                                        <div className="flex items-center gap-1 justify-center">
                                            <span className="truncate">{header.label}</span>
                                            {header.isCustom && (() => {
                                                const fieldData = getTaskCustomFieldById(projectId, header.key);
                                                return fieldData ? (
                                                    <EditCustomFieldPopup projectId={projectId} field={fieldData} />
                                                ) : null;
                                            })()}
                                            {getSortIcon(header.key, header.type)}
                                        </div>
                                        <ResizeHandle
                                            columnId={header.key}
                                            onResize={handleColumnResize}
                                            onDoubleClick={handleColumnToggleCollapse}
                                        />
                                    </TableHead>
                                ))}
                                {/* Add column button */}
                                {/* ✅ Actions Column Header (sticky) */}
                                <TableHead
                                    className={cn("w-12 text-center")}
                                    style={{
                                        position: 'sticky',
                                        right: 0,
                                        zIndex: 20,
                                        backgroundColor: 'var(--background)',
                                        borderLeft: '1px solid var(--border)',
                                        boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                                        padding: 4,
                                        margin: 0,
                                    }}
                                >
                                    <ListFieldVisibilityPopup projectId={projectId} />
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {/* ── Task Rows ─────────────────────────────────────────────── */}
                            {groupTasks.map((task) => {
                                const taskSubtasks = getSubtasksByTask(task.id);
                                const isExpanded = expandedTasks.has(task.id);
                                const hasSubtasks = taskSubtasks.length > 0;

                                return (
                                    <React.Fragment key={task.id}>
                                        {/* ── Main Task Row ───────────────────────────────────── */}
                                        <TableRow
                                            key={task.id}
                                            className="group hover:bg-muted/50 border-b border-border transition-colors"
                                        >
                                            {/* Drag */}
                                            <TableCell className={cn(bodyCellCls, "w-10")} style={getColumnStyle('drag', false, groupColor)}>
                                                <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 cursor-grab" />
                                            </TableCell>

                                            {/* Checkbox + expand */}
                                            <TableCell className={bodyCellCls} style={getColumnStyle('checkbox', false)}>
                                                <div className="flex items-center gap-1">
                                                    {/* Subtask expand toggle */}
                                                    <button
                                                        className={cn(
                                                            "flex items-center justify-center w-4 h-4 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                                                            (!hasSubtasks || displayOptions.collapsedSubtasks) && "invisible"
                                                        )}
                                                        onClick={() => toggleTaskExpansion(task.id)}
                                                        disabled={!hasSubtasks || displayOptions.collapsedSubtasks}
                                                    >
                                                        {isExpanded
                                                            ? <ChevronDown className="h-3 w-3" />
                                                            : <ChevronRight className="h-3 w-3" />}
                                                    </button>
                                                    <Checkbox
                                                        checked={selectedTaskIds.has(task.id)}
                                                        onCheckedChange={() => toggleTaskSelection(task.id)}
                                                        className="rounded"
                                                    />
                                                </div>
                                            </TableCell>

                                            {/* ✅ ID Column (frozen, always visible) */}
                                            <TableCell
                                                className={cn(bodyCellCls, "text-center")}
                                                style={getColumnStyle('id', false)}
                                            >
                                                <span className="text-muted-foreground">
                                                    {formatTaskId(isTeamView ? getTaskConfigs(task.projectId).slug : projectSlug, task.taskNumber)}
                                                </span>
                                            </TableCell>

                                            {/* Task Name */}
                                            <TableCell
                                                className={cn(bodyCellCls, displayOptions.wrapText ? "max-w-xs" : "max-w-[260px]")}
                                                style={getColumnStyle('task', false)}
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span
                                                        className={cn(
                                                            "text-sm text-foreground min-w-0 flex-1",
                                                            task.completed && "line-through text-muted-foreground",
                                                            displayOptions.wrapText ? "truncate" : "whitespace-normal break-words"
                                                        )}
                                                    >
                                                        {task.name}
                                                    </span>
                                                    {/* Hover actions */}
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                        <button
                                                            className="px-1.5 py-0.5 text-primary hover:bg-primary/10 rounded flex items-center gap-0.5"
                                                            onClick={() => {
                                                                setNewSubtaskData(prev => ({
                                                                    ...prev,
                                                                    status: task.status || '',
                                                                    endDate: task.endDate ? new Date(task.endDate) : undefined,
                                                                    startDate: new Date(),
                                                                }));
                                                                setAddingSubtaskToTask(task.id);
                                                                if (!isExpanded) toggleTaskExpansion(task.id);
                                                            }}
                                                        >
                                                            <Plus className="h-2.5 w-2.5" />
                                                            Sub Task
                                                        </button>
                                                        <button
                                                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                            onClick={async () => {
                                                                setSelectedTaskForDetail(task); // open instantly with local data
                                                                setShowTaskDetail(true);
                                                                setIsDetailLoading(true);
                                                                const fresh = await fetchTaskById(task.id);
                                                                if (fresh) setSelectedTaskForDetail(fresh);
                                                                setIsDetailLoading(false);
                                                            }}
                                                        >
                                                            <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                                                        </button>
                                                    </div>
                                                    {(() => {
                                                        const taskRels = getTaskRelationships(task.id);
                                                        const seenTypes = new Set<string>();
                                                        const uniqueRels = taskRels.filter(rel => {
                                                            if (seenTypes.has(rel.type)) return false;
                                                            seenTypes.add(rel.type);
                                                            return true;
                                                        });
                                                        return uniqueRels.map(rel => {
                                                            const RelIcon = getRelationshipIcon(rel.type);
                                                            return (
                                                                <RelIcon
                                                                    key={rel.type}
                                                                    className={cn("h-3.5 w-3.5 shrink-0", getRelationshipIconColor(rel.type))}
                                                                    title={getRelationshipLabel(rel.type)}
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </TableCell>

                                            {isTeamView && (
                                                <TableCell
                                                    className={cn(bodyCellCls, "text-center")}
                                                    style={getColumnStyle('project', false)}
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        <ProjectIcon project={projects.find(p => p.id === task.projectId)} size={20} />
                                                        <span className="truncate max-w-[100px]">
                                                            {projects.find(p => p.id === task.projectId)?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )}

                                            {/* ── Dynamic data cells ─────────────────────────────── */}


                                            {/* Task Type Cell */}
                                            {shouldShowField('taskType', 'Type') && (
                                                <TableCell
                                                    className={cn(bodyCellCls, "text-center")}
                                                    style={getColumnStyle('taskType', false)}
                                                >
                                                    <Select
                                                        value={task.taskType || 'task'}
                                                        onValueChange={(value) => updateTask(task.id, { taskType: value })}
                                                    >
                                                        <SelectTrigger className="h-8 w-full max-w-[140px] mx-auto">
                                                            <SelectValue>
                                                                {(() => {
                                                                    const configs = isTeamView ? getTaskConfigs(task.projectId).types : taskTypes;
                                                                    const selectedType = configs.find((t: any) => t.value === (task.taskType || 'task'));
                                                                    if (!selectedType) return null;

                                                                    const IconComponent = getTaskTypeIcon(selectedType);
                                                                    const DefaultIcon = getDefaultTaskTypeIcon();
                                                                    const iconColor = getTaskTypeIconColor(selectedType);

                                                                    return (
                                                                        <div className="flex items-center gap-2">
                                                                            {IconComponent ? (
                                                                                <IconComponent
                                                                                    className="w-3 h-3 flex-shrink-0"
                                                                                    style={{ color: iconColor }}
                                                                                />
                                                                            ) : (
                                                                                <DefaultIcon
                                                                                    className="w-3 h-3 flex-shrink-0"
                                                                                    style={{ color: (selectedType as any).color }}
                                                                                />
                                                                            )}
                                                                            <span>{(selectedType as any).label}</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(() => {
                                                                const configs = isTeamView ? getTaskConfigs(task.projectId).types : taskTypes;
                                                                return (configs as any[]).map((type) => {
                                                                    const IconComponent = getTaskTypeIcon(type);
                                                                    const DefaultIcon = getDefaultTaskTypeIcon();
                                                                    const iconColor = getTaskTypeIconColor(type);

                                                                    return (
                                                                        <SelectItem key={type._id || type.value} value={type.value}>
                                                                            <div className="flex items-center gap-2">
                                                                                {IconComponent ? (
                                                                                    <IconComponent
                                                                                        className="w-3 h-3 flex-shrink-0"
                                                                                        style={{ color: iconColor }}
                                                                                    />
                                                                                ) : (
                                                                                    <DefaultIcon
                                                                                        className="w-3 h-3 flex-shrink-0"
                                                                                        style={{ color: type.color }}
                                                                                    />
                                                                                )}
                                                                                <span>{type.label}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    );
                                                                });
                                                            })()}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            )}

                                            {/* Status */}
                                            {shouldShowField('status', 'Status') && (
                                                <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('status', false)}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium hover:bg-muted transition-colors text-foreground border border-border">
                                                                {(() => {
                                                                    const configs = isTeamView ? getTaskConfigs(task.projectId).statusConfigs : taskStatusConfigs;
                                                                    const cfg = configs.find((c: any) => c.value === task.status);
                                                                    return cfg ? (
                                                                        <span className="flex items-center gap-1.5">
                                                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: (cfg as any).color }} />
                                                                            {(cfg as any).label}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground/60">—</span>
                                                                    );
                                                                })()}
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {(() => {
                                                                const configs = isTeamView ? getTaskConfigs(task.projectId).statusConfigs : taskStatusConfigs;
                                                                return (configs as any[]).map(config => (
                                                                    <DropdownMenuItem key={config._id || config.value} onSelect={() => updateTask(task.id, { status: config.value })}>
                                                                        {config.color && <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: config.color }} />}
                                                                        {config.label}
                                                                    </DropdownMenuItem>
                                                                ));
                                                            })()}
                                                            {taskStatusConfigs.length > 0 && <DropdownMenuSeparator />}
                                                            {isAddingStatus ? (
                                                                <div className="flex gap-1 p-2">
                                                                    <Input value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Status name" className="h-6 " autoFocus
                                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddStatus(newStatusName, task.id); if (e.key === 'Escape') { setIsAddingStatus(false); setNewStatusName(''); } }} />
                                                                    <Button size="sm" className="h-6" onClick={() => handleAddStatus(newStatusName, task.id)}>Add</Button>
                                                                </div>
                                                            ) : (
                                                                <DropdownMenuItem onSelect={() => setIsAddingStatus(true)}>
                                                                    <Plus className="h-3 w-3 mr-2" />Add Status
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onSelect={() => updateTask(task.id, { status: undefined })}>Clear</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}

                                            {/* Assignee */}
                                            {shouldShowField('assignee', 'Assignee') && (
                                                <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('assignee', false)}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="inline-flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                {(() => {
                                                                    const m = members.find(m => m.userId === task.assignee);
                                                                    return <Avatar name={m?.name} src={m?.profilePicture} />;
                                                                })()}
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onSelect={() => updateTask(task.id, { assignee: undefined })}>
                                                                Clear
                                                            </DropdownMenuItem>
                                                            {members.map(member => (
                                                                <DropdownMenuItem key={member.userId} onSelect={() => updateTask(task.id, { assignee: member.userId })}>
                                                                    <Avatar name={member.name} src={member.profilePicture} size="sm" />
                                                                    <span className="ml-2">{member.name}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}

                                            {/* ✅ Start Date (separate from Due Date) */}
                                            {shouldShowField('startDate', 'Start Date') && (
                                                <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('startDate', false)}>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                {task.startDate ? (
                                                                    <span className="font-medium">{formatDate(task.startDate)}</span>
                                                                ) : (
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                )}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="center">
                                                            <Calendar
                                                                mode="single"
                                                                selected={task.startDate ? new Date(task.startDate) : undefined}
                                                                onSelect={(date) => {
                                                                    const updates: any = { startDate: date ? convertSelectedDateToUTC(date) : undefined };
                                                                    if (date && task.endDate && new Date(task.endDate) < date) {
                                                                        updates.endDate = undefined;
                                                                    }
                                                                    updateTask(task.id, updates);
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </TableCell>
                                            )}

                                            {/* ✅ Due Date (End Date) */}
                                            {shouldShowField('endDate', 'Due Date') && (
                                                <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('endDate', false)}>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                {task.endDate ? (
                                                                    <span className="font-medium">{formatDate(task.endDate)}</span>
                                                                ) : (
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                )}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="center">
                                                            <Calendar
                                                                mode="single"
                                                                selected={task.endDate ? new Date(task.endDate) : undefined}
                                                                onSelect={(date) => {
                                                                    if (date) updateTask(task.id, { endDate: convertSelectedDateToUTC(date) });
                                                                }}
                                                                disabled={(date) => (task.startDate ? date < new Date(new Date(task.startDate).setHours(0, 0, 0, 0)) : false)}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </TableCell>
                                            )}

                                            {/* Priority */}
                                            {shouldShowField('priority', 'Priority') && (
                                                <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('priority', false)}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="inline-flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                <PriorityFlag priority={task.priority} color={getPriorityColor(task.priority, isTeamView ? task.projectId : undefined)} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {(() => {
                                                                const configs = isTeamView ? getTaskConfigs(task.projectId).priorityConfigs : taskPriorityConfigs;
                                                                return (configs as any[]).map(option => (
                                                                    <DropdownMenuItem
                                                                        className="flex justify-between items-center"
                                                                        key={option._id || option.value} onSelect={() => updateTask(task.id, { priority: option.value })}>
                                                                        {option.label}
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                                                                            style={{
                                                                                backgroundColor: `${option.color}20`,
                                                                                color: option.color
                                                                            }}
                                                                        >
                                                                            <PriorityFlag priority={option.value} color={option.color} />
                                                                        </Badge>
                                                                    </DropdownMenuItem>
                                                                ));
                                                            })()}
                                                            {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                                                            {isAddingPriority ? (
                                                                <div className="flex gap-1 p-2">
                                                                    <Input value={newPriorityName} onChange={(e) => setNewPriorityName(e.target.value)} placeholder="Priority name" className="h-6 " autoFocus
                                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddPriority(newPriorityName, task.id); if (e.key === 'Escape') { setIsAddingPriority(false); setNewPriorityName(''); } }} />
                                                                    <Button size="sm" className="h-6" onClick={() => handleAddPriority(newPriorityName, task.id)}>Add</Button>
                                                                </div>
                                                            ) : (
                                                                <DropdownMenuItem onSelect={() => setIsAddingPriority(true)}>
                                                                    <Plus className="h-3 w-3 mr-2" />Add Priority
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onSelect={() => updateTask(task.id, { priority: undefined })}>Clear</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}

                                            {/* Custom Fields */}
                                            {customFields.map(field => {
                                                const fieldData = getTaskCustomFieldById(projectId, field.id);
                                                if (!shouldShowField(field.id, field.name)) return <React.Fragment key={field.id} />;
                                                return fieldData ? (
                                                    <TableCell
                                                        key={field.id}
                                                        className={cn(bodyCellCls, (field.type === 'select-one' || field.type === 'select-many' || field.type === 'label' || field.type === 'people' || field.type === 'rating') && "overflow-hidden", "text-center")}
                                                        style={getColumnStyle(field.id, false)}
                                                    >
                                                        <CustomFieldDropdown
                                                            field={fieldData}
                                                            value={task.customFieldValues?.[field.id] || (field.type === 'select-many' ? [] : '')}
                                                            onUpdate={(value) => updateTaskCustomField(task.id, field.id, value)}
                                                            task={task}
                                                        />
                                                    </TableCell>
                                                ) : <React.Fragment key={field.id} />;
                                            })}

                                            {/* Row actions */}
                                            <TableCell
                                                className={cn("w-12 text-center")}
                                                style={{
                                                    position: 'sticky',
                                                    right: 0,
                                                    zIndex: 10,
                                                    backgroundColor: 'var(--background)',
                                                    borderLeft: '1px solid var(--border)',
                                                    boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                                                    padding: 0,
                                                    margin: 0,
                                                }}
                                            >
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border p-1.5 min-w-[210px]">

                                                        {/* Sharing & Permissions — dark header row */}
                                                        <DropdownMenuItem className="px-2 py-1.5 justify-center font-semibold bg-primary text-primary-foreground rounded-md mb-1 cursor-pointer">
                                                            Sharing &amp; Permissions
                                                        </DropdownMenuItem>

                                                        {/* Duplicate */}
                                                        <DropdownMenuItem
                                                            className="gap-2 cursor-pointer"
                                                            onSelect={() => {
                                                                setDuplicateSubtaskId(null);
                                                                setDuplicateTaskId(task.id);
                                                            }}
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                            Duplicate Task
                                                        </DropdownMenuItem>

                                                        {/* Open in new tab */}
                                                        <DropdownMenuItem
                                                            className="gap-2 cursor-pointer"
                                                            onSelect={() => window.open(`/task/${task.id}`, '_blank')}
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            Open in new tab
                                                        </DropdownMenuItem>

                                                        {/* Copy Task Info submenu */}
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger className="gap-2">
                                                                <Link className="h-3.5 w-3.5" />
                                                                Copy Task Info
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border">

                                                                {/* Task Link */}
                                                                <DropdownMenuItem
                                                                    onClick={handleCopyTaskLink.bind(null, task.id)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    Task Link
                                                                </DropdownMenuItem>

                                                                {/* Task ID */}
                                                                <DropdownMenuItem
                                                                    onClick={handleCopyTaskId.bind(null, task.id)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    Task ID
                                                                </DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>

                                                        <DropdownMenuSeparator className="px-2 py-0" />

                                                        {/* Tie to Goal submenu */}
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger className="gap-2">
                                                                <Target className="h-3.5 w-3.5" />
                                                                Tie to Goal
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border w-52 max-h-64 overflow-y-auto">
                                                                {goals.length === 0 ? (
                                                                    <DropdownMenuItem disabled>No goals found</DropdownMenuItem>
                                                                ) : (
                                                                    goals.map((goal) => (
                                                                        <DropdownMenuItem
                                                                            key={goal.id}
                                                                            className="cursor-pointer gap-2"
                                                                            onSelect={() => {
                                                                                console.log("Tied task to goal:", {
                                                                                    taskId: task.id,
                                                                                    taskName: task.name,
                                                                                    goalId: goal.id,
                                                                                    goalTitle: goal.title,
                                                                                });
                                                                            }}
                                                                        >
                                                                            <span
                                                                                className="h-5 w-5 rounded-md shrink-0 flex items-center justify-center text-white text-xs"
                                                                                style={{ backgroundColor: goal.color ?? "#6366f1" }}
                                                                            >
                                                                                {goal.title?.charAt(0)?.toUpperCase()}
                                                                            </span>
                                                                            <span className="truncate">{goal.title}</span>
                                                                        </DropdownMenuItem>
                                                                    ))
                                                                )}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>

                                                        <DropdownMenuSeparator className="px-2 py-0" />

                                                        {/* Convert to submenu */}
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger className="gap-2">
                                                                <Repeat className="h-3.5 w-3.5" />
                                                                Convert to
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border">
                                                                {(() => {
                                                                    const configs = isTeamView ? getTaskConfigs(task.projectId).types : taskTypes;
                                                                    return (configs as any[]).map((type) => {
                                                                        const Icon = getTaskTypeIcon(type);
                                                                        const Default = getDefaultTaskTypeIcon();
                                                                        const iconColor = getTaskTypeIconColor(type);
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={type._id || type.value}
                                                                                className="gap-2 cursor-pointer"
                                                                                onSelect={() => handleConvertTaskType(task.id, type.value)}
                                                                            >
                                                                                {Icon
                                                                                    ? <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
                                                                                    : <Default className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                }
                                                                                {type.label}
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    });
                                                                })()}
                                                                {/* ── Hardcoded Subtask option — only when task has NO subtasks ── */}
                                                                {taskSubtasks.length === 0 && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            className="gap-2 cursor-pointer"
                                                                            onSelect={() => setConvertToSubtaskTaskId(task.id)}
                                                                        >
                                                                            <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
                                                                            Subtask
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>

                                                        {/* Set task relationships submenu */}
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger className="gap-2">
                                                                <GitMerge className="h-3.5 w-3.5" />
                                                                Set task relationships
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border">
                                                                {RELATIONSHIP_TYPES.map(({ value, label, icon: Icon, color }) => (
                                                                    <DropdownMenuItem
                                                                        key={value}
                                                                        className="gap-2 cursor-pointer"
                                                                        onSelect={() => openRelDialog(task.id, value, false)}
                                                                    >
                                                                        <Icon className={cn("h-3.5 w-3.5", color)} />
                                                                        {label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>

                                                        <DropdownMenuSeparator className="px-2 py-0" />

                                                        {/* Delete Task — opens confirmation modal */}
                                                        <DropdownMenuItem
                                                            className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                                            onSelect={() => setDeleteTaskConfirmId(task.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Delete Task
                                                        </DropdownMenuItem>

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>

                                        {/* ── Subtask Rows ────────────────────────────────────── */}
                                        {isExpanded && taskSubtasks.map((subtask) => (
                                            <TableRow
                                                key={subtask.id}
                                                className="group hover:bg-muted/30 border-b border-border transition-colors"
                                            >
                                                <TableCell className={bodyCellCls} style={getColumnStyle('drag', false, groupColor)} />
                                                <TableCell className={bodyCellCls} style={getColumnStyle('checkbox', false)}>
                                                    <div className="flex items-center pl-6">
                                                        <Checkbox
                                                            checked={subtask.completed}
                                                            onCheckedChange={(checked) => updateSubtask(subtask.id, { completed: checked as boolean })}
                                                            className="rounded"
                                                        />
                                                    </div>
                                                </TableCell>
                                                {/* ✅ Subtask ID (frozen) */}
                                                <TableCell
                                                    className={cn(bodyCellCls, "text-center")}
                                                    style={getColumnStyle('id', false)}
                                                >
                                                    <span className="text-muted-foreground/60">
                                                        {formatTaskId(projectSlug, subtask.taskNumber)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className={bodyCellCls} style={getColumnStyle('task', false)}>
                                                    <div className="flex items-center gap-1.5 pl-4">
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            {displayOptions.subtaskParentId && task.taskNumber && (
                                                                <span className="text-xs text-muted-foreground/60 leading-tight">
                                                                    {formatTaskId(projectSlug, task.taskNumber)}
                                                                </span>
                                                            )}
                                                            <span className={cn("text-sm text-foreground", subtask.completed && "line-through text-muted-foreground")}>
                                                                {subtask.name}
                                                            </span>
                                                        </div>

                                                        {/* hover action to open subtask detail */}
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <button
                                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                                onClick={async () => {
                                                                    // Cast subtask to Task shape for TaskDetailView
                                                                    const subtaskAsTask: Task = {
                                                                        ...subtask,
                                                                        parentTaskId: subtask.parentTaskId,
                                                                        subtasks: [],
                                                                        relationships: [],
                                                                    };
                                                                    setSelectedSubtaskForDetail(subtaskAsTask);
                                                                    setShowSubtaskDetail(true);
                                                                }}
                                                            >
                                                                <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                                                            </button>
                                                        </div>
                                                        {(() => {
                                                            const subtaskRels = getTaskRelationships(subtask.id);
                                                            if (!subtaskRels.length) return null;
                                                            const seenTypes = new Set<string>();
                                                            return subtaskRels
                                                                .filter(rel => {
                                                                    if (seenTypes.has(rel.type)) return false;
                                                                    seenTypes.add(rel.type);
                                                                    return true;
                                                                })
                                                                .map(rel => {
                                                                    const RelIcon = getRelationshipIcon(rel.type);
                                                                    return (
                                                                        <RelIcon
                                                                            key={rel.type}
                                                                            className={cn("h-3.5 w-3.5 shrink-0", getRelationshipIconColor(rel.type))}
                                                                            title={getRelationshipLabel(rel.type)}
                                                                        />
                                                                    );
                                                                });
                                                        })()}
                                                    </div>
                                                </TableCell>

                                                {/* Subtask Task Type Cell */}
                                                {shouldShowField('taskType', 'Type') && (
                                                    <TableCell
                                                        className={cn(bodyCellCls, "text-center")}
                                                        style={getColumnStyle('taskType', false)}
                                                    >
                                                        <Select
                                                            value={subtask.taskType || 'task'}
                                                            onValueChange={async (value) => {
                                                                try {
                                                                    await updateTask(task.id, { taskType: value });
                                                                } catch {
                                                                    // handle error if needed
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8 w-full max-w-[140px] mx-auto">
                                                                <SelectValue>
                                                                    {(() => {
                                                                        const selectedType = taskTypes.find(t => t.value === (subtask.taskType || 'task'));
                                                                        if (!selectedType) return null;

                                                                        const IconComponent = getTaskTypeIcon(selectedType);
                                                                        const DefaultIcon = getDefaultTaskTypeIcon();
                                                                        const iconColor = getTaskTypeIconColor(selectedType);

                                                                        return (
                                                                            <div className="flex items-center gap-2">
                                                                                {IconComponent ? (
                                                                                    <IconComponent
                                                                                        className="w-3 h-3 flex-shrink-0"
                                                                                        style={{ color: iconColor }}
                                                                                    />
                                                                                ) : (
                                                                                    <DefaultIcon
                                                                                        className="w-3 h-3 flex-shrink-0"
                                                                                        style={{ color: selectedType.color }}
                                                                                    />
                                                                                )}
                                                                                <span>{selectedType.label}</span>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {taskTypes.map((type) => {
                                                                    const IconComponent = getTaskTypeIcon(type);
                                                                    const DefaultIcon = getDefaultTaskTypeIcon();
                                                                    const iconColor = getTaskTypeIconColor(type);

                                                                    return (
                                                                        <SelectItem key={type._id} value={type.value}>
                                                                            <div className="flex items-center gap-2">
                                                                                {IconComponent ? (
                                                                                    <IconComponent
                                                                                        className="w-3 h-3 flex-shrink-0"
                                                                                        style={{ color: iconColor }}
                                                                                    />
                                                                                ) : (
                                                                                    <DefaultIcon
                                                                                        className="w-3 h-3 flex-shrink-0"
                                                                                        style={{ color: type.color }}
                                                                                    />
                                                                                )}
                                                                                <span>{type.label}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                )}


                                                {/* Subtask Status */}
                                                {shouldShowField('status', 'Status') && (
                                                    <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('status', false)}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium hover:bg-muted transition-colors text-foreground border border-border">
                                                                    {(() => {
                                                                        const cfg = taskStatusConfigs.find(c => c.value === subtask.status);
                                                                        return cfg ? (
                                                                            <span className="flex items-center gap-1.5">
                                                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                                                                {cfg.label}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        );
                                                                    })()}
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {taskStatusConfigs.map(config => (
                                                                    <DropdownMenuItem key={config._id} onSelect={() => updateSubtask(subtask.id, { status: config.value })}>
                                                                        {config.color && <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: config.color }} />}
                                                                        {config.label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onSelect={() => updateSubtask(subtask.id, { status: undefined })}>Clear</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}

                                                {/* Subtask Assignee */}
                                                {shouldShowField('assignee', 'Assignee') && (
                                                    <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('assignee', false)}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="inline-flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                    {(() => {
                                                                        const m = members.find(m => m.userId === subtask.assignee);
                                                                        return <Avatar name={m?.name} src={m?.profilePicture} />;
                                                                    })()}
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onSelect={() => updateSubtask(subtask.id, { assignee: undefined })}>Clear</DropdownMenuItem>
                                                                {members.map(member => (
                                                                    <DropdownMenuItem key={member.userId} onSelect={() => updateSubtask(subtask.id, { assignee: member.userId })}>
                                                                        <Avatar name={member.name} src={member.profilePicture} />
                                                                        <span className="ml-2">{member.name}</span>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}

                                                {/* ✅ Subtask Start Date */}
                                                {shouldShowField('startDate', 'Start Date') && (
                                                    <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('startDate', false)}>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                    {subtask.startDate ? (
                                                                        <span className="font-medium">{formatDate(subtask.startDate)}</span>
                                                                    ) : (
                                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                    )}
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="center">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={subtask.startDate ? new Date(subtask.startDate) : undefined}
                                                                    onSelect={(date) => {
                                                                        if (date) {
                                                                            const updates: any = { startDate: convertSelectedDateToUTC(date) };
                                                                            if (subtask.endDate && new Date(subtask.endDate) < date) {
                                                                                updates.endDate = undefined;
                                                                            }
                                                                            updateSubtask(subtask.id, updates);
                                                                        }
                                                                    }}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                )}

                                                {/* ✅ Subtask Due Date */}
                                                {shouldShowField('endDate', 'Due Date') && (
                                                    <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('endDate', false)}>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                    {subtask.endDate ? (
                                                                        <span className="font-medium">{formatDate(subtask.endDate)}</span>
                                                                    ) : (
                                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                    )}
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="center">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={subtask.endDate ? new Date(subtask.endDate) : undefined}
                                                                    onSelect={(date) => {
                                                                        if (date) updateSubtask(subtask.id, { endDate: convertSelectedDateToUTC(date) });
                                                                    }}
                                                                    disabled={(date) => (subtask.startDate ? date < new Date(new Date(subtask.startDate).setHours(0, 0, 0, 0)) : false)}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                )}

                                                {/* Subtask Priority */}
                                                {shouldShowField('priority', 'Priority') && (
                                                    <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('priority', false)}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="inline-flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                    <PriorityFlag priority={subtask.priority} color={getPriorityColor(subtask.priority)} />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {taskPriorityConfigs.map(option => (
                                                                    <DropdownMenuItem
                                                                        className="flex justify-between items-center"
                                                                        key={option._id} onSelect={() => updateSubtask(subtask.id, { priority: option.value })}>
                                                                        {option.label}
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                                                                            style={{
                                                                                backgroundColor: `${option.color}20`,
                                                                                color: option.color
                                                                            }}
                                                                        >
                                                                            <PriorityFlag priority={option.value} color={option.color} />
                                                                        </Badge>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                                {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                                                                <DropdownMenuItem onSelect={() => updateSubtask(subtask.id, { priority: undefined })}>Clear</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}

                                                {/* Subtask Custom Fields */}
                                                {customFields.map(field => {
                                                    const fieldData = getTaskCustomFieldById(projectId, field.id);
                                                    if (!shouldShowField(field.id, field.name)) return <React.Fragment key={field.id} />;
                                                    return fieldData ? (
                                                        <TableCell
                                                            key={field.id}
                                                            className={cn(bodyCellCls, (field.type === 'select-one' || field.type === 'select-many' || field.type === 'label' || field.type === 'people' || field.type === 'rating') && "overflow-hidden", "text-center")}
                                                            style={getColumnStyle(field.id, false)}
                                                        >
                                                            <CustomFieldDropdown
                                                                field={fieldData}
                                                                value={subtask.customFieldValues?.[field.id] || (field.type === 'select-many' ? [] : '')}
                                                                onUpdate={(value) => updateSubtaskCustomField(subtask.id, field.id, value)}
                                                                task={subtask}
                                                            />
                                                        </TableCell>
                                                    ) : <React.Fragment key={field.id} />;
                                                })}

                                                {/* Subtask actions */}
                                                <TableCell
                                                    className={cn("w-12 text-center")}
                                                    style={{
                                                        position: 'sticky',
                                                        right: 0,
                                                        zIndex: 10,
                                                        backgroundColor: 'var(--background)',
                                                        borderLeft: '1px solid var(--border)',
                                                        boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                                                        padding: 0,
                                                        margin: 0,
                                                    }}
                                                >
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border p-1.5 min-w-[210px]">

                                                            {/* Sharing & Permissions header */}
                                                            <DropdownMenuItem className="px-2 py-1.5 justify-center font-semibold bg-primary text-primary-foreground rounded-md mb-1 cursor-pointer">
                                                                Sharing &amp; Permissions
                                                            </DropdownMenuItem>

                                                            {/* Duplicate */}
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer"
                                                                onSelect={() => {
                                                                    setDuplicateTaskId(null);
                                                                    setDuplicateSubtaskId(subtask.id);
                                                                }}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                                Duplicate Subtask
                                                            </DropdownMenuItem>

                                                            {/* Open in new tab */}
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer"
                                                                onSelect={() => window.open(`/task/${subtask.id}`, '_blank')}
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                                Open in new tab
                                                            </DropdownMenuItem>

                                                            {/* Copy Subtask Info */}
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger className="gap-2">
                                                                    <Link className="h-3.5 w-3.5" />
                                                                    Copy Subtask Info
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border">

                                                                    {/* Subtask Link */}
                                                                    <DropdownMenuItem
                                                                        onClick={handleCopySubtaskLink.bind(null, subtask.id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        Subtask Link
                                                                    </DropdownMenuItem>

                                                                    {/* Subtask ID */}
                                                                    <DropdownMenuItem
                                                                        onClick={handleCopySubtaskId.bind(null, subtask.id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        Subtask ID
                                                                    </DropdownMenuItem>

                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>

                                                            <DropdownMenuSeparator className="px-2 py-0" />



                                                            {/* Tie to Goal */}
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger className="gap-2">
                                                                    <Target className="h-3.5 w-3.5" />
                                                                    Tie to Goal
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border w-52 max-h-64 overflow-y-auto">
                                                                    {goals.length === 0 ? (
                                                                        <DropdownMenuItem disabled>No goals found</DropdownMenuItem>
                                                                    ) : (
                                                                        goals.map((goal) => (
                                                                            <DropdownMenuItem
                                                                                key={goal.id}
                                                                                className="cursor-pointer gap-2"
                                                                                onSelect={() => {
                                                                                    console.log("Tied subtask to goal:", {
                                                                                        subtaskId: subtask.id,
                                                                                        subtaskName: subtask.name,
                                                                                        goalId: goal.id,
                                                                                        goalTitle: goal.title,
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <span
                                                                                    className="h-5 w-5 rounded-md shrink-0 flex items-center justify-center text-white text-xs"
                                                                                    style={{ backgroundColor: goal.color ?? "#6366f1" }}
                                                                                >
                                                                                    {goal.title?.charAt(0)?.toUpperCase()}
                                                                                </span>
                                                                                <span className="truncate">{goal.title}</span>
                                                                            </DropdownMenuItem>
                                                                        ))
                                                                    )}
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>

                                                            <DropdownMenuSeparator className="px-2 py-0" />

                                                            {/* Convert to */}
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger className="gap-2">
                                                                    <Repeat className="h-3.5 w-3.5" />
                                                                    Convert to
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border">
                                                                    {taskTypes.map((type) => {
                                                                        const Icon = getTaskTypeIcon(type);
                                                                        const Default = getDefaultTaskTypeIcon();
                                                                        const iconColor = getTaskTypeIconColor(type);
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={type._id}
                                                                                className="gap-2 cursor-pointer"
                                                                                onSelect={() => handleConvertSubtaskType(subtask.id, type.value)}
                                                                            >
                                                                                {Icon
                                                                                    ? <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
                                                                                    : <Default className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                }
                                                                                {type.label}
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    })}
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>

                                                            {/* Set subtask relationships */}
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger className="gap-2">
                                                                    <GitMerge className="h-3.5 w-3.5" />
                                                                    Set subtask relationships
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border">
                                                                    {RELATIONSHIP_TYPES.map(({ value, label, icon: Icon, color }) => (
                                                                        <DropdownMenuItem
                                                                            key={value}
                                                                            className="gap-2 cursor-pointer"
                                                                            onSelect={() => openRelDialog(subtask.id, value, true)}
                                                                        >
                                                                            <Icon className={cn("h-3.5 w-3.5", color)} />
                                                                            {label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>

                                                            <DropdownMenuSeparator className="px-2 py-0" />

                                                            {/* Delete Subtask */}
                                                            <DropdownMenuItem
                                                                className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                                                onSelect={() => setDeleteSubtaskConfirmId(subtask.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete Subtask
                                                            </DropdownMenuItem>

                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* ── Add Subtask Row — prompt OR input, toggles in-place ────── */}
                                        {isExpanded && (
                                            addingSubtaskToTask === task.id && (
                                                /* INPUT state — shown after clicking "Add Subtask" */
                                                <TableRow
                                                    className="border-b border-border"
                                                >
                                                    <TableCell style={getColumnStyle('drag', false, `${groupColor}44`)} />
                                                    <TableCell className={bodyCellCls} style={getColumnStyle('checkbox', false)}>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-4 h-4 invisible" /> {/* expand-toggle spacer */}
                                                            <div className="w-4 h-4 rounded border-2 border-border flex-shrink-0" />
                                                        </div>
                                                    </TableCell>
                                                    {/* ✅ ID placeholder (frozen) */}
                                                    <TableCell
                                                        className={cn(bodyCellCls, "text-center")}
                                                        style={getColumnStyle('id', false)}
                                                    >
                                                        <span className="text-muted-foreground/60">Auto</span>
                                                    </TableCell>
                                                    <TableCell className={bodyCellCls} style={getColumnStyle('task', false)}>
                                                        <div className="pl-2">
                                                            <Input
                                                                value={newSubtaskData.name}
                                                                onChange={(e) => setNewSubtaskData({ ...newSubtaskData, name: e.target.value })}
                                                                placeholder={newSubtaskData.taskType === 'milestone' ? "Enter milestone name…" : "Enter sub task name…"}
                                                                className="border-0 pl-0 shadow-none focus-visible:ring-0 h-8 text-sm bg-transparent w-full"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveSubtask(task.id);
                                                                    if (e.key === 'Escape') {
                                                                        setAddingSubtaskToTask(null);
                                                                        setNewSubtaskData({ name: '', taskType: 'task', assignee: '', startDate: new Date() as Date | undefined, endDate: undefined, priority: '', status: '', customFieldValues: {} });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </TableCell>

                                                    {/* ✅ Inline field pickers for subtask add row */}
                                                    {headers.map(h => {

                                                        // ── Task Type ────────────────────────────────────────────
                                                        if (h.key === 'taskType') {
                                                            const selType = taskTypes.find(t => t.value === newSubtaskData.taskType);
                                                            return (
                                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                                    <Select
                                                                        value={newSubtaskData.taskType || 'task'}
                                                                        onValueChange={(value) => setNewSubtaskData(prev => ({ ...prev, taskType: value }))}
                                                                    >
                                                                        <SelectTrigger className="h-8 w-full max-w-[140px] mx-auto">
                                                                            <SelectValue>
                                                                                {(() => {
                                                                                    if (!selType) return null;
                                                                                    const IconComponent = getTaskTypeIcon(selType);
                                                                                    const DefaultIcon = getDefaultTaskTypeIcon();
                                                                                    const iconColor = getTaskTypeIconColor(selType);
                                                                                    return (
                                                                                        <div className="flex items-center gap-2">
                                                                                            {IconComponent
                                                                                                ? <IconComponent className="w-3 h-3 flex-shrink-0" style={{ color: iconColor }} />
                                                                                                : <DefaultIcon className="w-3 h-3 flex-shrink-0" style={{ color: selType.color }} />
                                                                                            }
                                                                                            <span>{selType.label}</span>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </SelectValue>
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {taskTypes.map(type => {
                                                                                const IconComponent = getTaskTypeIcon(type);
                                                                                const DefaultIcon = getDefaultTaskTypeIcon();
                                                                                const iconColor = getTaskTypeIconColor(type);
                                                                                return (
                                                                                    <SelectItem key={type._id} value={type.value}>
                                                                                        <div className="flex items-center gap-2">
                                                                                            {IconComponent
                                                                                                ? <IconComponent className="w-3 h-3 flex-shrink-0" style={{ color: iconColor }} />
                                                                                                : <DefaultIcon className="w-3 h-3 flex-shrink-0" style={{ color: type.color }} />
                                                                                            }
                                                                                            <span>{type.label}</span>
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                );
                                                                            })}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                            );
                                                        }

                                                        // ── Status ───────────────────────────────────────────────
                                                        if (h.key === 'status') {
                                                            const selStatus = taskStatusConfigs.find(s => s.value === newSubtaskData.status);
                                                            return (
                                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium hover:bg-muted transition-colors text-foreground border border-border">
                                                                                {selStatus ? (
                                                                                    <span className="flex items-center gap-1.5">
                                                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selStatus.color }} />
                                                                                        {selStatus.label}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-muted-foreground">—</span>
                                                                                )}
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent>
                                                                            {taskStatusConfigs.map(config => (
                                                                                <DropdownMenuItem
                                                                                    key={config._id}
                                                                                    onSelect={() => setNewSubtaskData(prev => ({ ...prev, status: config.value }))}
                                                                                >
                                                                                    {config.color && <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: config.color }} />}
                                                                                    {config.label}
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                            {taskStatusConfigs.length > 0 && <DropdownMenuSeparator />}
                                                                            <DropdownMenuItem onSelect={() => setNewSubtaskData(prev => ({ ...prev, status: '' }))}>
                                                                                Clear
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            );
                                                        }

                                                        // ── Assignee ─────────────────────────────────────────────
                                                        if (h.key === 'assignee') {
                                                            const selectedMember = members.find(m => m.userId === newSubtaskData.assignee);
                                                            return (
                                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="inline-flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                                <Avatar name={selectedMember?.name} src={selectedMember?.profilePicture} />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent>
                                                                            <DropdownMenuItem onSelect={() => setNewSubtaskData(prev => ({ ...prev, assignee: '' }))}>
                                                                                Clear
                                                                            </DropdownMenuItem>
                                                                            {members.map(member => (
                                                                                <DropdownMenuItem
                                                                                    key={member.userId}
                                                                                    onSelect={() => setNewSubtaskData(prev => ({ ...prev, assignee: member.userId }))}
                                                                                >
                                                                                    <Avatar name={member.name} src={member.profilePicture} />
                                                                                    <span className="ml-2">{member.name}</span>
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            );
                                                        }

                                                        // ── Start Date ───────────────────────────────────────────
                                                        if (h.key === 'startDate') {
                                                            return (
                                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                                {newSubtaskData.startDate ? (
                                                                                    <span className="font-medium">{formatLocalDate(newSubtaskData.startDate)}</span>
                                                                                ) : (
                                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                                )}
                                                                            </button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-0" align="center">
                                                                            <Calendar
                                                                                mode="single"
                                                                                selected={newSubtaskData.startDate}
                                                                                onSelect={(date) => {
                                                                                    setNewSubtaskData(prev => {
                                                                                        const updates: any = { ...prev, startDate: date ?? undefined };
                                                                                        if (date && prev.endDate && prev.endDate < date) {
                                                                                            updates.endDate = undefined;
                                                                                        }
                                                                                        return updates;
                                                                                    });
                                                                                }}
                                                                                initialFocus
                                                                            />
                                                                            {newSubtaskData.startDate && (
                                                                                <div className="border-t border-border p-2">
                                                                                    <button
                                                                                        className="w-full text-xs text-muted-foreground hover:text-foreground py-1 rounded hover:bg-muted"
                                                                                        onClick={() => setNewSubtaskData(prev => ({ ...prev, startDate: undefined }))}
                                                                                    >
                                                                                        Clear date
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </TableCell>
                                                            );
                                                        }

                                                        // ── End Date ─────────────────────────────────────────────
                                                        if (h.key === 'endDate') {
                                                            return (
                                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                                {newSubtaskData.endDate ? (
                                                                                    <span className="font-medium">{formatLocalDate(newSubtaskData.endDate)}</span>
                                                                                ) : (
                                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                                )}
                                                                            </button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-0" align="center">
                                                                            <Calendar
                                                                                mode="single"
                                                                                selected={newSubtaskData.endDate}
                                                                                onSelect={(date) => setNewSubtaskData(prev => ({ ...prev, endDate: date ?? undefined }))}
                                                                                disabled={(date) => (newSubtaskData.startDate ? date < new Date(new Date(newSubtaskData.startDate).setHours(0, 0, 0, 0)) : false)}
                                                                                initialFocus
                                                                            />
                                                                            {newSubtaskData.endDate && (
                                                                                <div className="border-t border-border p-2">
                                                                                    <button
                                                                                        className="w-full text-xs text-muted-foreground hover:text-foreground py-1 rounded hover:bg-muted"
                                                                                        onClick={() => setNewSubtaskData(prev => ({ ...prev, endDate: undefined }))}
                                                                                    >
                                                                                        Clear date
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </TableCell>
                                                            );
                                                        }

                                                        // ── Priority ─────────────────────────────────────────────
                                                        if (h.key === 'priority') {
                                                            return (
                                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="inline-flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                                <PriorityFlag
                                                                                    priority={newSubtaskData.priority}
                                                                                    color={getPriorityColor(newSubtaskData.priority)}
                                                                                />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent>
                                                                            {taskPriorityConfigs.map(option => (
                                                                                <DropdownMenuItem
                                                                                    className="flex justify-between items-center"
                                                                                    key={option._id}
                                                                                    onSelect={() => setNewSubtaskData(prev => ({ ...prev, priority: option.value }))}
                                                                                >
                                                                                    {option.label}
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                                                                                        style={{
                                                                                            backgroundColor: `${option.color}20`,
                                                                                            color: option.color
                                                                                        }}
                                                                                    >
                                                                                        <PriorityFlag priority={option.value} color={option.color} />
                                                                                    </Badge>
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                            {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                                                                            <DropdownMenuItem onSelect={() => setNewSubtaskData(prev => ({ ...prev, priority: '' }))}>
                                                                                Clear
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            );
                                                        }

                                                        // ── Default: empty cell for custom fields ────────────────
                                                        return <TableCell key={h.key} className={bodyCellCls} style={getColumnStyle(h.key, false)} />;
                                                    })}

                                                    {/* Save / Cancel */}
                                                    <TableCell
                                                        className={cn(bodyCellCls, "w-12")}
                                                        style={{
                                                            position: 'sticky',
                                                            right: 0,
                                                            zIndex: 10,
                                                            backgroundColor: 'var(--background)',
                                                            borderLeft: '1px solid var(--border)',
                                                            boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                                                        }}
                                                    >
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleSaveSubtask(task.id)}
                                                                className="px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setAddingSubtaskToTask(null);
                                                                    setNewSubtaskData({ name: '', taskType: 'task', assignee: '', startDate: new Date() as Date | undefined, endDate: undefined, priority: '', status: '', customFieldValues: {} });
                                                                }}
                                                                className="px-2 py-1 border border-border rounded hover:bg-muted transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </React.Fragment>
                                );
                            })}


                            {/* ── Add Task Prompt Row (shows button, replaces with input on click) ── */}
                            {!showAddTask ? (
                                <TableRow
                                    className="border-b border-border"
                                    onMouseEnter={() => setIsAddTaskRowHovered(true)}
                                    onMouseLeave={() => {
                                        setIsAddTaskRowHovered(false);
                                        setShowTaskTypeMenu(false);
                                    }}
                                >
                                    <TableCell style={getColumnStyle('drag', false, `${groupColor}44`)} />
                                    <TableCell style={getColumnStyle('checkbox', false)} />
                                    <TableCell style={getColumnStyle('id', false)} />
                                    <TableCell style={getColumnStyle('task', false)} className={bodyCellCls}>
                                        <div className="flex items-center gap-1 pl-4">
                                            <div
                                                className={`flex items-center rounded-sm transition-all group ${isAddTaskRowHovered
                                                    ? 'border border-primary/30'
                                                    : 'border border-transparent'
                                                    }`}
                                            >
                                                {/* + Add Task button */}
                                                <button
                                                    className={`flex items-center gap-1 px-2 py-0.5 transition-colors text-sm ${isAddTaskRowHovered
                                                        ? 'text-primary/70'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                    onClick={() => {
                                                        setNewTaskData(prev => ({ ...prev, ...getGroupPrefillData() }));
                                                        setShowAddTask(true);
                                                        setShowTaskTypeMenu(false);
                                                    }}
                                                >
                                                    <Plus className={`h-3 w-3 ${isAddTaskRowHovered ? 'text-primary/70' : 'text-muted-foreground'}`} />
                                                    Add Task
                                                </button>

                                                {/* ChevronUp icon — only show on hover with border */}
                                                {isAddTaskRowHovered && (
                                                    <div className="relative">
                                                        <button
                                                            ref={chevronButtonRef}
                                                            className="px-1 py-0.5 border-l border-primary/30 text-muted-foreground group-hover:text-primary/70 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!showTaskTypeMenu && chevronButtonRef.current) {
                                                                    const rect = chevronButtonRef.current.getBoundingClientRect();
                                                                    const dropdownHeight = taskTypes.length * 36 + 8;
                                                                    setTaskTypeMenuCoords({
                                                                        top: rect.top - dropdownHeight - 4,  // always above
                                                                        left: rect.left,
                                                                    });
                                                                }
                                                                setShowTaskTypeMenu(prev => !prev);
                                                            }}
                                                        >
                                                            <ChevronUp className="h-3 w-3 text-primary/70" />
                                                        </button>

                                                        {/* Task type floating menu — fixed position escapes overflow:hidden/auto parents */}
                                                        {showTaskTypeMenu && taskTypeMenuCoords && (
                                                            <div
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: taskTypeMenuCoords.top,
                                                                    left: taskTypeMenuCoords.left,
                                                                    zIndex: 9999,
                                                                }}
                                                                className="bg-popover text-popover-foreground border border-border border-b-[5px] border-b-primary rounded-md shadow-lg min-w-[140px]"
                                                            >
                                                                {taskTypes.map((type) => {
                                                                    const IconComponent = getTaskTypeIcon(type);
                                                                    const DefaultIcon = getDefaultTaskTypeIcon();
                                                                    const iconColor = getTaskTypeIconColor(type);
                                                                    const Icon = IconComponent || DefaultIcon;
                                                                    return (
                                                                        <button
                                                                            key={type._id}
                                                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                                                                            onClick={() => {
                                                                                const prefill = getGroupPrefillData();
                                                                                setSelectedAddTaskType(type.value);
                                                                                setNewTaskData(prev => ({ ...prev, ...prefill, taskType: type.value }));
                                                                                setShowTaskTypeMenu(false);
                                                                                setShowAddTask(true);
                                                                            }}
                                                                        >
                                                                            <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
                                                                            {type.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                /* ── Add Task Input Row (replaces button row in same spot) ── */
                                <TableRow
                                    className="border-b border-border"
                                >
                                    {/* Color accent bar — same as task rows */}
                                    <TableCell style={getColumnStyle('drag', false, `${groupColor}44`)} />

                                    {/* Checkbox placeholder — mirrors subtask row exactly */}
                                    <TableCell className={bodyCellCls} style={getColumnStyle('checkbox', false)}>
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 invisible" /> {/* expand-toggle spacer */}
                                            <div className="w-4 h-4 rounded border-2 border-border flex-shrink-0" />
                                        </div>
                                    </TableCell>

                                    {/* ✅ ID placeholder (frozen) */}
                                    <TableCell
                                        className={cn(bodyCellCls, "text-center")}
                                        style={getColumnStyle('id', false)}
                                    >
                                        <span className="text-muted-foreground/60">Auto</span>
                                    </TableCell>

                                    {/* Task name input */}
                                    <TableCell className={bodyCellCls} style={getColumnStyle('task', false)}>
                                        <Input
                                            value={newTaskData.name}
                                            onChange={(e) => setNewTaskData({ ...newTaskData, name: e.target.value })}
                                            placeholder={newTaskData.taskType === 'milestone' ? "Enter milestone name…" : "Enter task name…"}
                                            className="border-0 pl-0 shadow-none focus-visible:ring-0 h-8 text-sm bg-transparent w-full"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveTask();
                                                if (e.key === 'Escape') {
                                                    setShowAddTask(false);
                                                    setNewTaskData({ name: '', taskType: 'task', assignee: '', startDate: new Date() as Date | undefined, endDate: undefined, priority: '', status: '', customFieldValues: {} });
                                                    setSelectedAddTaskType('task');
                                                    setShowTaskTypeMenu(false);
                                                }
                                            }}
                                        />
                                    </TableCell>

                                    {/* ✅ Inline field pickers for system fields in add-task row */}
                                    {headers.map(h => {

                                        // ── Task Type ────────────────────────────────────────────
                                        if (h.key === 'taskType') {
                                            const selectedType = taskTypes.find(t => t.value === newTaskData.taskType);
                                            return (
                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                    <Select
                                                        value={newTaskData.taskType || 'task'}
                                                        onValueChange={(value) => setNewTaskData(prev => ({ ...prev, taskType: value }))}
                                                    >
                                                        <SelectTrigger className="h-8 w-full max-w-[140px] mx-auto">
                                                            <SelectValue>
                                                                {(() => {
                                                                    if (!selectedType) return null;
                                                                    const IconComponent = getTaskTypeIcon(selectedType);
                                                                    const DefaultIcon = getDefaultTaskTypeIcon();
                                                                    const iconColor = getTaskTypeIconColor(selectedType);
                                                                    return (
                                                                        <div className="flex items-center gap-2">
                                                                            {IconComponent
                                                                                ? <IconComponent className="w-3 h-3 flex-shrink-0" style={{ color: iconColor }} />
                                                                                : <DefaultIcon className="w-3 h-3 flex-shrink-0" style={{ color: selectedType.color }} />
                                                                            }
                                                                            <span>{selectedType.label}</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {taskTypes.map(type => {
                                                                const IconComponent = getTaskTypeIcon(type);
                                                                const DefaultIcon = getDefaultTaskTypeIcon();
                                                                const iconColor = getTaskTypeIconColor(type);
                                                                return (
                                                                    <SelectItem key={type._id} value={type.value}>
                                                                        <div className="flex items-center gap-2">
                                                                            {IconComponent
                                                                                ? <IconComponent className="w-3 h-3 flex-shrink-0" style={{ color: iconColor }} />
                                                                                : <DefaultIcon className="w-3 h-3 flex-shrink-0" style={{ color: type.color }} />
                                                                            }
                                                                            <span>{type.label}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            );
                                        }

                                        // ── Status ───────────────────────────────────────────────
                                        if (h.key === 'status') {
                                            const selectedStatus = taskStatusConfigs.find(s => s.value === newTaskData.status);
                                            return (
                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium hover:bg-muted transition-colors text-foreground border border-border">
                                                                {selectedStatus ? (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedStatus.color }} />
                                                                        {selectedStatus.label}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {taskStatusConfigs.map(config => (
                                                                <DropdownMenuItem
                                                                    key={config._id}
                                                                    onSelect={() => setNewTaskData(prev => ({ ...prev, status: config.value }))}
                                                                >
                                                                    {config.color && <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: config.color }} />}
                                                                    {config.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                            {taskStatusConfigs.length > 0 && <DropdownMenuSeparator />}
                                                            <DropdownMenuItem onSelect={() => setNewTaskData(prev => ({ ...prev, status: '' }))}>
                                                                Clear
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            );
                                        }

                                        // ── Assignee ─────────────────────────────────────────────
                                        if (h.key === 'assignee') {
                                            const selectedMember = members.find(m => m.userId === newTaskData.assignee);
                                            return (
                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="inline-flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                <Avatar name={selectedMember?.name} src={selectedMember?.profilePicture} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onSelect={() => setNewTaskData(prev => ({ ...prev, assignee: '' }))}>
                                                                Clear
                                                            </DropdownMenuItem>
                                                            {members.map(member => (
                                                                <DropdownMenuItem
                                                                    key={member.userId}
                                                                    onSelect={() => setNewTaskData(prev => ({ ...prev, assignee: member.userId }))}
                                                                >
                                                                    <Avatar name={member.name} src={member.profilePicture} size="sm" />
                                                                    <span className="ml-2">{member.name}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            );
                                        }

                                        // ── Start Date ───────────────────────────────────────────
                                        if (h.key === 'startDate') {
                                            return (
                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                {newTaskData.startDate ? (
                                                                    <span className="font-medium">{formatLocalDate(newTaskData.startDate)}</span>
                                                                ) : (
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                )}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="center">
                                                            <Calendar
                                                                mode="single"
                                                                selected={newTaskData.startDate}
                                                                onSelect={(date) => {
                                                                    setNewTaskData(prev => {
                                                                        const updates: any = { ...prev, startDate: date ?? undefined };
                                                                        if (date && prev.endDate && prev.endDate < date) {
                                                                            updates.endDate = undefined;
                                                                        }
                                                                        return updates;
                                                                    });
                                                                }}
                                                                initialFocus
                                                            />
                                                            {newTaskData.startDate && (
                                                                <div className="border-t border-border p-2">
                                                                    <button
                                                                        className="w-full text-xs text-muted-foreground hover:text-foreground py-1 rounded hover:bg-muted"
                                                                        onClick={() => setNewTaskData(prev => ({ ...prev, startDate: undefined }))}
                                                                    >
                                                                        Clear date
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </PopoverContent>
                                                    </Popover>
                                                </TableCell>
                                            );
                                        }

                                        // ── End Date ─────────────────────────────────────────────
                                        if (h.key === 'endDate') {
                                            return (
                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                                                {newTaskData.endDate ? (
                                                                    <span className="font-medium">{formatLocalDate(newTaskData.endDate)}</span>
                                                                ) : (
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60 mx-auto" />
                                                                )}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="center">
                                                            <Calendar
                                                                mode="single"
                                                                selected={newTaskData.endDate}
                                                                onSelect={(date) => setNewTaskData(prev => ({ ...prev, endDate: date ?? undefined }))}
                                                                disabled={(date) => (newTaskData.startDate ? date < new Date(new Date(newTaskData.startDate).setHours(0, 0, 0, 0)) : false)}
                                                                initialFocus
                                                            />
                                                            {newTaskData.endDate && (
                                                                <div className="border-t border-border p-2">
                                                                    <button
                                                                        className="w-full text-xs text-muted-foreground hover:text-foreground py-1 rounded hover:bg-muted"
                                                                        onClick={() => setNewTaskData(prev => ({ ...prev, endDate: undefined }))}
                                                                    >
                                                                        Clear date
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </PopoverContent>
                                                    </Popover>
                                                </TableCell>
                                            );
                                        }

                                        // ── Priority ─────────────────────────────────────────────
                                        if (h.key === 'priority') {
                                            return (
                                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="inline-flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                                <PriorityFlag
                                                                    priority={newTaskData.priority}
                                                                    color={getPriorityColor(newTaskData.priority)}
                                                                />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {taskPriorityConfigs.map(option => (
                                                                <DropdownMenuItem
                                                                    className="flex justify-between items-center"
                                                                    key={option._id}
                                                                    onSelect={() => setNewTaskData(prev => ({ ...prev, priority: option.value }))}
                                                                >
                                                                    {option.label}
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                                                                        style={{
                                                                            backgroundColor: `${option.color}20`,
                                                                            color: option.color
                                                                        }}
                                                                    >
                                                                        <PriorityFlag priority={option.value} color={option.color} />
                                                                    </Badge>
                                                                </DropdownMenuItem>
                                                            ))}
                                                            {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                                                            <DropdownMenuItem onSelect={() => setNewTaskData(prev => ({ ...prev, priority: '' }))}>
                                                                Clear
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            );
                                        }
                                        // ── Default: empty cell for custom fields ────────────────
                                        return <TableCell key={h.key} className={bodyCellCls} style={getColumnStyle(h.key, false)} />;
                                    })}

                                    {/* Save / Cancel */}
                                    <TableCell
                                        className={cn(bodyCellCls, "w-12")}
                                        style={{
                                            position: 'sticky',
                                            right: 0,
                                            zIndex: 10,
                                            backgroundColor: 'var(--background)',
                                            borderLeft: '1px solid var(--border)',
                                            boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        <div className="flex gap-1">
                                            <button
                                                onClick={handleSaveTask}
                                                className="px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowAddTask(false);
                                                    setNewTaskData({ name: '', taskType: 'task', assignee: '', startDate: new Date(), endDate: undefined, priority: '', status: '', customFieldValues: {} });
                                                    setSelectedAddTaskType('task');
                                                    setShowTaskTypeMenu(false);
                                                }}
                                                className="px-2 py-1 border border-border rounded hover:bg-muted transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div >

                {/* ── Set Relationship Dialog ──────────────────────────────────── */}
                <Dialog open={relDialogOpen} onOpenChange={setRelDialogOpen}>
                    <DialogContent className="sm:max-w-md border-b-4 border-b-primary bg-popover text-popover-foreground border-border">
                        <DialogHeader>
                            <DialogTitle>Relationship</DialogTitle>
                            <DialogDescription>
                                See what this task depends on and what depends on it.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">

                            {/* Task info row — matches popup top row */}
                            {relDialogTaskId && (() => {
                                const projectTasks = getTasksByProject(projectId);
                                const allTasks = [...projectTasks, ...projectTasks.flatMap(t => getSubtasksByTask(t.id))];
                                const t = allTasks.find(t => t.id === relDialogTaskId);
                                if (!t) return null;
                                return (
                                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/40 min-w-0">
                                        <GitMerge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                            {formatTaskId(isTeamView ? getTaskConfigs(t.projectId).slug : projectSlug, t.taskNumber)}
                                        </span>
                                        <span className="text-sm font-medium truncate block flex-1 min-w-0 max-w-[220px]">{t.name}</span>
                                        {t.startDate && (
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {formatLocalDate(t.startDate)}
                                            </span>
                                        )}
                                        {t.endDate && (
                                            <>
                                                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {formatLocalDate(t.endDate)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Relationship type selector */}
                            <div className="flex items-center gap-2 pl-4 border-l-2 border-amber-400">
                                <Select value={relDialogType} onValueChange={setRelDialogType}>
                                    <SelectTrigger className="h-8 w-48 text-xs">
                                        <SelectValue>
                                            {(() => {
                                                const rel = RELATIONSHIP_TYPES.find(r => r.value === relDialogType);
                                                if (!rel) return relDialogType;
                                                const Icon = rel.icon;
                                                const color = rel.color;
                                                return (
                                                    <span className="flex items-center gap-2">
                                                        <Icon className={cn("h-3.5 w-3.5", color)} />
                                                        {rel.label}
                                                    </span>
                                                );
                                            })()}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="border-b-4 border-b-primary bg-popover text-popover-foreground border-border">
                                        {RELATIONSHIP_TYPES.map(({ value, label, icon: Icon, color }) => (
                                            <SelectItem key={value} value={value}>
                                                <span className="flex items-center gap-2">
                                                    <Icon className={cn("h-3.5 w-3.5", color)} />
                                                    {label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Target task selector */}
                            <Select value={relDialogTargetId} onValueChange={setRelDialogTargetId}>
                                <SelectTrigger className="w-full overflow-hidden [&>span]:truncate">
                                    <SelectValue placeholder="Select a task..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 border-b-4 border-b-[#001F3F]">
                                    {(() => {
                                        const projectTasks = getTasksByProject(projectId);
                                        const allTasks = [...projectTasks, ...projectTasks.flatMap(pt => getSubtasksByTask(pt.id))];
                                        return allTasks
                                            .filter(t => t.id !== relDialogTaskId)
                                            .map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    <span className="flex items-center gap-2 max-w-full overflow-hidden">
                                                        <span className="text-xs text-muted-foreground shrink-0 font-medium">
                                                            {formatTaskId(isTeamView ? getTaskConfigs(t.projectId).slug : projectSlug, t.taskNumber)}
                                                        </span>
                                                        <span className="truncate max-w-[260px]">{t.name}</span>
                                                    </span>
                                                </SelectItem>
                                            ));
                                    })()}
                                </SelectContent>
                            </Select>

                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRelDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-[#001F3F] hover:bg-[#001F3F]/90"
                                onClick={handleConfirmRelationship}
                                disabled={!relDialogTargetId}
                            >
                                Add Relationship
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Task Detail Sheet ─────────────────────────────────────────── */}
                <TaskDetailView
                    task={selectedTaskForDetail}
                    projectId={projectId}
                    open={showTaskDetail}
                    onOpenChange={(open) => {
                        setShowTaskDetail(open);
                        if (!open) setIsDetailLoading(false); // reset on close
                    }}
                />

                {/* subtask detail view */}
                <TaskDetailView
                    task={selectedSubtaskForDetail}
                    projectId={projectId}
                    open={showSubtaskDetail}
                    onOpenChange={(open) => {
                        setShowSubtaskDetail(open);
                        if (!open) setSelectedSubtaskForDetail(null);
                    }}
                    isSubtask={true}
                />

                {/* Duplicate Task Dialog */}
                {duplicateTaskId && (() => {
                    const task = groupTasks.find((t) => t.id === duplicateTaskId)!;
                    return (
                        <DuplicateTaskDialog
                            open={!!duplicateTaskId}
                            onClose={() => {
                                setDuplicateTaskId(null);
                                setDuplicateSubtaskId(null);
                            }}
                            originalTaskName={task.name}
                            task={task}
                            title="Duplicate task"
                            onDuplicate={async (newName, fieldIds) => {
                                await duplicateTask(duplicateTaskId, newName, fieldIds);
                            }}
                        />
                    );
                })()}

                {/* Duplicate Subtask Dialog */}
                {duplicateSubtaskId && (() => {
                    // Get subtask name from your subtasks list
                    const allSubtasks = groupTasks.flatMap((t) =>
                        getSubtasksByTask(t.id)          // or however you access subtasks
                    );
                    const subtask = allSubtasks.find((s) => s.id === duplicateSubtaskId)!;
                    return (
                        <DuplicateTaskDialog
                            open={!!duplicateSubtaskId}
                            onClose={() => {
                                setDuplicateSubtaskId(null);
                                setDuplicateTaskId(null);
                            }}
                            originalTaskName={subtask?.name ?? "Subtask"}
                            task={subtask}
                            title="Duplicate subtask"
                            onDuplicate={async (newName, fieldIds) => {
                                await duplicateTask(duplicateSubtaskId, newName, fieldIds);
                            }}
                        />
                    );
                })()}

                {convertToSubtaskTaskId && (
                    <ConvertToSubtaskDialog
                        open={!!convertToSubtaskTaskId}
                        onClose={() => setConvertToSubtaskTaskId(null)}
                        taskToConvert={groupTasks.find((t) => t.id === convertToSubtaskTaskId) ?? null}
                        availableTasks={getTasksByProject(projectId)}
                        members={members}
                        priorityConfigs={taskPriorityConfigs}
                        workspaceName={currentWorkspace?.name ?? "Workspace"}
                        projectName={project?.name ?? "Project"}
                        onConfirm={handleConfirmConvertToSubtask}
                    />
                )}

                {/* Task Delete Confirmation */}
                <ConfirmationModal
                    open={!!deleteTaskConfirmId}
                    onClose={() => setDeleteTaskConfirmId(null)}
                    title="Delete Task"
                    description="Are you sure you want to delete this task? This action cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => {
                        if (deleteTaskConfirmId) {
                            deleteTask(deleteTaskConfirmId);
                            setDeleteTaskConfirmId(null);
                        }
                    }}
                />

                {/* Subtask Delete Confirmation */}
                <ConfirmationModal
                    open={!!deleteSubtaskConfirmId}
                    onClose={() => setDeleteSubtaskConfirmId(null)}
                    title="Delete Subtask"
                    description="Are you sure you want to delete this subtask? This action cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => {
                        if (deleteSubtaskConfirmId) {
                            deleteSubtask(deleteSubtaskConfirmId);
                            setDeleteSubtaskConfirmId(null);
                        }
                    }}
                />
            </div >
        </>
    );
}