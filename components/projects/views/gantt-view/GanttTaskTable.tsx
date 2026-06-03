// components/projects/views/gantt-view/GanttTaskTable.tsx

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    ChevronRight,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Plus,
    Trash2,
    Archive,
    User,
    Flag,
    Clock,
    GripVertical,
    ExternalLink,
    Copy,
    Link as LinkIcon,
    ChevronsLeftRight,
    Link2,
    Ban,
    XOctagon,
    CircleArrowLeft,
    CircleArrowRight,
    SkipBack,
    SkipForward,
    GitMerge,
    LayoutTemplate,
    Calendar as CalendarIcon,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTasksStore, SYSTEM_FIELDS } from "@/stores/tasks-store";
import { Task, ColumnConfig } from '@/types/task.types';
import { useProjectsStore, TaskTypeConfig, } from "@/stores/projects-store";
import { iconComponentMap } from "@/components/ColorIconPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomFieldDropdown } from "@/components/projects/views/list-view/common/CustomFieldDropdown";
import { TaskDetailView } from "@/components/projects/TaskDetailView";
import { formatTaskId } from '@/utils/task-utils';
import { useWorkspaceStore } from "@/stores/workspace-store";
import { GanttFieldVisibilityPopup } from "./GanttFieldVisibilityPopup";
import { RelationshipDetailDialog } from "../list-view/common/RelationshipDetailDialog";
import {
    getRelationshipIcon,
    getRelationshipIconColor,
    getRelationshipLabel
} from '@/utils/relationship-utils';

const parseDateSafe = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        return format(new Date(d.getFullYear(), d.getMonth(), d.getDate()), 'd MMM');
    } catch {
        return dateStr;
    }
};
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

function TableAvatar({ name, size = 'sm' }: { name?: string; size?: 'sm' | 'md' }) {
    const dim = size === 'sm' ? 'w-6 h-6 ' : 'w-7 h-7 text-xs';
    if (!name) {
        return (
            <div className={`${dim} rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground mx-auto`}>
                <User className="h-3 w-3" />
            </div>
        );
    }
    const bg = getAvatarColor(name);
    return (
        <div
            className={`${dim} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 mx-auto`}
            style={{ backgroundColor: bg }}
            title={name}
        >
            {name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
    );
}

// ── Priority flag helper ─────────────────────────────────────────────────────
function TablePriorityFlag({ priority, color }: { priority?: string; color?: string }) {
    if (!priority) {
        return (
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted mx-auto">
                <Flag className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
        );
    }
    const bg = color || '#9CA3AF';
    return (
        <div
            className="w-6 h-6 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: `${bg}22` }}
            title={priority}
        >
            <Flag className="h-3.5 w-3.5" style={{ color: bg }} />
        </div>
    );
}

interface GanttTaskTableProps {
    tasks: Task[];
    projectId: string;
    onTaskClick?: (taskId: string) => void;
    hideFields?: string[];
    groupBy?: string;
    columnConfigs?: ColumnConfig[];
    displayOptions?: {
        collapsedSubtasks: boolean;
        closedTasks: boolean;
        wrapText: boolean;
        subtaskParentId: boolean;
    };
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
    expandedTasks?: Set<string>;
    onToggleExpansion?: (taskId: string) => void;
    addingSubtaskToTask?: string | null;
    onAddingSubtaskToTaskChange?: (taskId: string | null) => void;
    showAddTask?: boolean;
    onShowAddTaskChange?: (show: boolean) => void;
}

const renderTaskTypeVisual = (
    type?: TaskTypeConfig | null,
    className = "w-3 h-3"
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
        <div className={wrapperClass}>
            <LayoutTemplate
                className="w-full h-full"
                color={type.color || "#6B7280"}
            />
        </div>
    );
};

export const GanttTaskTable = React.forwardRef<HTMLDivElement, GanttTaskTableProps>(({
    tasks,
    projectId,
    onTaskClick,
    hideFields = [],
    groupBy,
    columnConfigs = [],
    displayOptions = {
        collapsedSubtasks: false,
        closedTasks: false,
        wrapText: false,
        subtaskParentId: false,
    },
    onScroll,
    expandedTasks: propsExpandedTasks,
    onToggleExpansion,
    addingSubtaskToTask: propsAddingSubtaskToTask,
    onAddingSubtaskToTaskChange,
    showAddTask: propsShowAddTask,
    onShowAddTaskChange,
}, ref) => {
    const {
        addTask,
        updateTask,
        deleteTask,
        addSubtask,
        updateSubtask,
        deleteSubtask,
        getSubtasksByTask,
        subtasks: allSubtasks,
        tasks: allTasks,
        updateTaskCustomField,
        updateSubtaskCustomField,
        getTaskRelationships,
    } = useTasksStore();
    const { workspaceMembers } = useWorkspaceStore();
    const { projects, getTaskStatusConfigs, getTaskCustomFields, getTaskCustomFieldById, getTaskPriorityConfigs, getTaskTypesByProject } = useProjectsStore();

    const currentProject = projects.find(p => p.id === projectId);
    const members = workspaceMembers.filter(wm =>
        currentProject?.members?.some(pm => pm.userId === wm.userId)
    );
    const projectSlug = currentProject?.slug ?? 'TASK';
    const taskStatusConfigs = getTaskStatusConfigs(projectId);
    const taskPriorityConfigs = getTaskPriorityConfigs(projectId);
    const customFields = getTaskCustomFields(projectId);
    const taskTypes = getTaskTypesByProject(projectId);
    const cycles = currentProject?.cycles || [];

    const systemFieldVisibility = useTasksStore(state => state.systemFieldVisibility);

    const [internalExpandedTasks, setInternalExpandedTasks] = useState<Set<string>>(new Set());
    const expandedTasks = propsExpandedTasks || internalExpandedTasks;
    const setExpandedTasks = onToggleExpansion ? (val: any) => { } : setInternalExpandedTasks; // Stub for internal state only if prop not provided

    const toggleTaskExpansion = (taskId: string) => {
        if (displayOptions.collapsedSubtasks) return;
        if (onToggleExpansion) {
            onToggleExpansion(taskId);
        } else {
            setInternalExpandedTasks((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(taskId)) newSet.delete(taskId);
                else newSet.add(taskId);
                return newSet;
            });
        }
    };

    const [internalAddingSubtaskToTask, setInternalAddingSubtaskToTask] = useState<string | null>(null);
    const addingSubtaskToTask = propsAddingSubtaskToTask !== undefined ? propsAddingSubtaskToTask : internalAddingSubtaskToTask;
    const setAddingSubtaskToTask = (val: string | null) => {
        if (onAddingSubtaskToTaskChange) {
            onAddingSubtaskToTaskChange(val);
        } else {
            setInternalAddingSubtaskToTask(val);
        }
    };

    const [internalShowAddTask, setInternalShowAddTask] = useState(false);
    const showAddTask = propsShowAddTask !== undefined ? propsShowAddTask : internalShowAddTask;
    const setShowAddTask = (val: boolean) => {
        if (onShowAddTaskChange) {
            onShowAddTaskChange(val);
        } else {
            setInternalShowAddTask(val);
        }
    };

    const [newTaskName, setNewTaskName] = useState('');
    const [showTaskTypeMenu, setShowTaskTypeMenu] = useState(false);
    const [taskTypeMenuCoords, setTaskTypeMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const chevronButtonRef = React.useRef<HTMLButtonElement>(null);
    const [selectedAddTaskType, setSelectedAddTaskType] = useState('task');
    const [newSubtaskName, setNewSubtaskName] = useState("");
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [isAddTaskRowHovered, setIsAddTaskRowHovered] = useState(false);
    const [hoveredRelType, setHoveredRelType] = useState<string | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

    const [newTaskData, setNewTaskData] = useState({
        taskType: 'task',
        status: '',
        assignee: '',
        startDate: new Date() as Date | undefined,
        endDate: undefined as Date | undefined,
        priority: '',
        cycleId: null as string | null,
    });

    const [newSubtaskData, setNewSubtaskData] = useState({
        taskType: 'task',
        status: '',
        assignee: '',
        startDate: new Date() as Date | undefined,
        endDate: undefined as Date | undefined,
        priority: '',
        cycleId: null as string | null,
    });



    useEffect(() => {
        if (propsExpandedTasks !== undefined) return; // Managed by parent

        if (displayOptions.collapsedSubtasks) {
            setInternalExpandedTasks(new Set());
        } else {
            const tasksWithSubtasks = tasks
                .filter(task => {
                    const subtasks = getSubtasksByTask(task.id);
                    return subtasks && subtasks.length > 0;
                })
                .map(task => task.id);
            setInternalExpandedTasks(new Set(tasksWithSubtasks));
        }
    }, [displayOptions.collapsedSubtasks, tasks, getSubtasksByTask, propsExpandedTasks]);

    const shouldShowField = (fieldKey: string, fieldLabel: string): boolean => {
        if (fieldKey === 'id' || fieldKey === 'task') return true;

        const key = `${projectId}-gantt-${fieldKey}`;
        const legacyKey = `${projectId}-${fieldKey}`;

        // If we have a specific setting for this field in this view, use it!
        if (systemFieldVisibility[key] !== undefined) return systemFieldVisibility[key];

        const systemFieldIds = ['id', 'task', 'taskType', 'status', 'cycle', 'assignee', 'startDate', 'endDate', 'priority'];
        const isSystemField = systemFieldIds.includes(fieldKey);

        if (isSystemField) {
            if (systemFieldVisibility[legacyKey] !== undefined) return systemFieldVisibility[legacyKey];

            // Gantt Default: ID, Task Name, and Due Date only
            const ganttDefaults = ["id", "task", "endDate"];
            return ganttDefaults.includes(fieldKey);
        } else {
            // Custom fields: respect gantt toggle, default hidden
            if (systemFieldVisibility[legacyKey] !== undefined) return systemFieldVisibility[legacyKey];
            return false;
        }
    };

    const headers = useMemo(() => {
        const defaultHeaders = [
            { key: 'taskType', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'cycle', label: 'Cycle' },
            { key: 'assignee', label: 'Assignee' },
            { key: 'startDate', label: 'Start Date' },
            { key: 'endDate', label: 'Due Date' },
            { key: 'priority', label: 'Priority' },
        ];
        const customHeaders = customFields.map(field => ({
            key: field.id,
            label: field.name,
            isCustom: true,
        }));
        return [...defaultHeaders, ...customHeaders].filter(h => shouldShowField(h.key, h.label));
    }, [customFields, projectId, systemFieldVisibility, hideFields, columnConfigs]);

    // toggleTaskExpansion logic moved up

    const handleStartAddSubtask = (taskId: string) => {
        const parentTask = tasks.find(t => t.id === taskId);
        setAddingSubtaskToTask(taskId);
        setNewSubtaskName('');
        setNewSubtaskData({
            taskType: 'task',
            status: '',
            assignee: '',
            startDate: new Date(),
            endDate: parentTask?.endDate ? new Date(parentTask.endDate) : undefined,
            priority: '',
            cycleId: null as string | null,
        });
    };

    const handleCancelAddTask = () => {
        setNewTaskName('');
        setShowAddTask(false);
        setNewTaskData({
            taskType: 'task',
            status: '',
            assignee: '',
            startDate: new Date() as Date | undefined,
            endDate: undefined as Date | undefined,
            priority: '',
            cycleId: null as string | null,
        });
    };

    const handleCancelAddSubtask = () => {
        setNewSubtaskName('');
        setAddingSubtaskToTask(null);
        setNewSubtaskData({
            taskType: 'task',
            status: '',
            assignee: '',
            startDate: new Date() as Date | undefined,
            endDate: undefined as Date | undefined,
            priority: '',
            cycleId: null as string | null,
        });
    };

    const handleSaveTask = async () => {
        if (!newTaskName.trim()) return;
        const capturedName = newTaskName;
        const capturedData = { ...newTaskData };
        const capturedTaskType = newTaskData.taskType || selectedAddTaskType;

        setNewTaskName('');
        setShowAddTask(false);
        // Reset to whatever was the last selection to keep it consistent
        setNewTaskData({ ...capturedData, taskType: selectedAddTaskType, status: '', assignee: '', startDate: new Date() as Date | undefined, endDate: undefined, priority: '' });

        await addTask({
            projectId,
            name: capturedName,
            taskType: capturedTaskType,
            status: capturedData.status || undefined,
            cycleId: capturedData.cycleId || undefined,
            assignee: capturedData.assignee || undefined,
            startDate: capturedData.startDate?.toISOString() || new Date().toISOString(),
            endDate: capturedData.endDate?.toISOString(),
            priority: capturedData.priority || undefined,
            completed: false,
        }, (realId) => {
            // ✅ Parity with List view: If it was a milestone, open subtask row immediately
            if (capturedTaskType === 'milestone') {
                setExpandedTasks(prev => new Set([...prev, realId]));
                handleStartAddSubtask(realId);
            }
        });
    };

    const handleSaveSubtask = (parentTaskId: string) => {
        if (!newSubtaskName.trim()) return;
        const parentTask = tasks.find(t => t.id === parentTaskId);
        const capturedSubtask = { ...newSubtaskData };
        const capturedName = newSubtaskName;

        setNewSubtaskName('');
        setAddingSubtaskToTask(null);
        setNewSubtaskData({ taskType: 'task', status: '', cycleId: null, assignee: '', startDate: new Date() as Date | undefined, endDate: undefined, priority: '' });

        addSubtask({
            parentTaskId,
            projectId,
            name: capturedName,
            taskType: capturedSubtask.taskType || 'task',
            status: capturedSubtask.status || parentTask?.status || undefined,
            cycleId: capturedSubtask.cycleId || undefined,
            assignee: capturedSubtask.assignee || undefined,
            startDate: capturedSubtask.startDate?.toISOString() || new Date().toISOString(),
            endDate: capturedSubtask.endDate?.toISOString() || parentTask?.endDate || undefined,
            priority: capturedSubtask.priority || undefined,
            completed: false,
        });
    };

    const getMemberById = (memberId?: string) => members.find((m) => m.userId === memberId);


    const renderRelationshipIcons = (item: Task) => {
        const relationships = getTaskRelationships(item.id);
        if (!relationships || relationships.length === 0) return null;

        const seenTypes = new Set<string>();
        const uniqueRels = relationships.filter(rel => {
            if (seenTypes.has(rel.type)) return false;
            seenTypes.add(rel.type);
            return true;
        });

        return (
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                {uniqueRels.map((rel) => {
                    const Icon = getRelationshipIcon(rel.type);
                    // Search in both allTasks and allSubtasks to find target even if filtered out of current view
                    const targetTask = allTasks.find(t => t.id === rel.targetTaskId) ||
                        allSubtasks.find(st => st.id === rel.targetTaskId);

                    if (!targetTask) {
                        return (
                            <Icon
                                key={rel.type}
                                className={cn("h-3.5 w-3.5 shrink-0", getRelationshipIconColor(rel.type))}
                                title={getRelationshipLabel(rel.type)}
                            />
                        );
                    }

                    const isHovered = hoveredTaskId === item.id && hoveredRelType === rel.type;

                    return (
                        <Popover
                            key={rel.type}
                            open={isHovered}
                            onOpenChange={(open) => {
                                if (!open) {
                                    setHoveredRelType(null);
                                    setHoveredTaskId(null);
                                }
                            }}
                        >
                            <PopoverTrigger asChild>
                                <div
                                    className="cursor-pointer"
                                    onMouseEnter={() => {
                                        setHoveredRelType(rel.type);
                                        setHoveredTaskId(item.id);
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredRelType(null);
                                        setHoveredTaskId(null);
                                    }}
                                >
                                    <Icon
                                        className={cn("h-3.5 w-3.5 shrink-0", getRelationshipIconColor(rel.type))}
                                    />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent
                                side="right"
                                align="start"
                                className="w-auto p-0 shadow-2xl bg-white z-[100]"
                            >
                                <RelationshipDetailDialog
                                    sourceTask={item}
                                    relType={rel.type}
                                    targetTask={targetTask}
                                    projectSlug={projectSlug}
                                />
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </div>
        );
    };

    const renderCellContent = (item: Task | any, h: { key: string; label: string; isCustom?: boolean }, isSubtask: boolean) => {
        const updateFn = isSubtask ? updateSubtask : updateTask;
        const cellCls = "flex items-center justify-center gap-2 w-full h-full cursor-pointer hover:bg-muted/50 px-2 rounded transition-colors group/cell text-center";

        // Custom fields — values live on customFieldValues[fieldId], not item[fieldId]
        const customField = customFields.find((f) => f.id === h.key);
        if (customField || h.isCustom) {
            const fieldId = customField?.id ?? h.key;
            const fieldData = getTaskCustomFieldById(projectId, fieldId);
            if (!fieldData) {
                return <div className={cn("px-2 text-xs text-muted-foreground text-center")}>—</div>;
            }
            const emptyValue = fieldData.type === 'select-many' ? [] : '';
            return (
                <CustomFieldDropdown
                    field={fieldData}
                    value={item.customFieldValues?.[fieldId] ?? emptyValue}
                    onUpdate={(value) =>
                        isSubtask
                            ? updateSubtaskCustomField(item.id, fieldId, value)
                            : updateTaskCustomField(item.id, fieldId, value)
                    }
                    task={item}
                />
            );
        }

        if (h.key === 'status') {
            const statusCfg = taskStatusConfigs.find(s => s.value === item.status);
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cellCls}>
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: statusCfg?.color || '#e5e7eb' }}
                            />
                            <span className="text-xs truncate">{statusCfg?.label || 'No Status'}</span>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="p-1.5 border-b-4 border-b-primary">
                        {taskStatusConfigs.map(s => (
                            <DropdownMenuItem key={s.value} onClick={() => updateFn(item.id, { status: s.value })} className="text-xs">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                {s.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        if (h.key === 'assignee') {
            const assignee = getMemberById(item.assignee);
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cellCls}>
                            {assignee ? (
                                <>
                                    <Avatar className="h-5 w-5 shrink-0">
                                        <AvatarImage src={assignee.profilePicture || assignee.avatar} />
                                        <AvatarFallback className="text-[10px]">
                                            {assignee.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </>
                            ) : (
                                <>
                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                </>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px] p-1.5 border-b-4 border-b-primary">
                        <DropdownMenuItem onClick={() => updateFn(item.id, { assignee: undefined })} className="text-xs">
                            <User className="h-4 w-4 mr-2" /> Unassigned
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {members.map(m => (
                            <DropdownMenuItem key={m.userId} onClick={() => updateFn(item.id, { assignee: m.userId })} className="text-xs">
                                <Avatar className="h-5 w-5 mr-2">
                                    <AvatarImage src={m.profilePicture || m.avatar} />
                                    <AvatarFallback>{m.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {m.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        if (h.key === 'startDate' || h.key === 'endDate') {
            const dateValue = item[h.key] ? new Date(item[h.key]) : undefined;
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <div className={cellCls}>
                            {dateValue ? (
                                <span className="text-xs">
                                    {formatDate(item[h.key])}
                                </span>
                            ) : (
                                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-b-4 border-b-primary" align="start">
                        <Calendar
                            mode="single"
                            selected={dateValue}
                            onSelect={(date) => {
                                if (!date) return;
                                const updates: any = { [h.key]: date.toISOString() };
                                if (h.key === 'startDate' && item.endDate && new Date(item.endDate) < date) {
                                    updates.endDate = undefined;
                                }
                                updateFn(item.id, updates);
                            }}
                            disabled={h.key === 'endDate' ? (date) => (item.startDate ? date < new Date(new Date(item.startDate).setHours(0, 0, 0, 0)) : false) : undefined}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            );
        }

        if (h.key === 'priority') {
            const priorityCfg = taskPriorityConfigs.find(p => p.value === item.priority);
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cellCls}>
                            <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: priorityCfg?.color || '#9ca3af' }} />
                            <span className={cn("text-xs truncate", !priorityCfg && "text-muted-foreground")}>
                                {priorityCfg?.label || '—'}
                            </span>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="p-1.5 border-b-4 border-b-primary">
                        {taskPriorityConfigs.map(p => (
                            <DropdownMenuItem key={p.value} onClick={() => updateFn(item.id, { priority: p.value })} className="text-xs">
                                <Flag className="h-3 w-3 mr-2" style={{ color: p.color }} />
                                {p.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        if (h.key === "taskType") {
            const type = taskTypes.find((t) => t.value === item.taskType) || null;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cn(cellCls, "flex items-center gap-2")}>
                            {type ? renderTaskTypeVisual(type, "h-3 w-3") : null}
                            <span className="text-xs truncate">{type?.label || "Task"}</span>
                        </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="start"
                        className="p-1.5 border-b-4 border-b-primary"
                    >
                        {taskTypes.map((t) => (
                            <DropdownMenuItem
                                key={t._id || t.value}
                                onClick={() => updateFn(item.id, { taskType: t.value })}
                                className="text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    {renderTaskTypeVisual(t, "h-3 w-3")}
                                    <span>{t.label}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        if (h.key === 'cycle') {
            const cycle = cycles.find(c => c.id === item.cycleId);
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:bg-muted overflow-hidden px-3">
                            <span className={cn("truncate w-full text-center flex items-center justify-center", !cycle && "text-muted-foreground font-normal")}>
                                {cycle?.name || <RefreshCw className="h-3.5 w-3.5 mx-auto text-muted-foreground" />}
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="p-2 w-[200px] space-y-1 border-b-4 border-b-primary max-h-[300px] overflow-y-auto">
                        {cycles.map(c => (
                            <DropdownMenuItem key={c.id} onClick={() => updateFn(item.id, { cycleId: c.id })} className="p-0 focus:bg-transparent">
                                <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 bg-muted hover:bg-muted">
                                    <span className="truncate w-full text-center">{c.name}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                        {cycles.length === 0 && (
                            <div className="p-2 text-xs text-muted-foreground text-center">No cycles available</div>
                        )}
                        {cycles.length > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuItem onClick={() => updateFn(item.id, { cycleId: null })} className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs">
                            — Clear Cycle —
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        return <div className={cn("px-2 text-xs", displayOptions?.wrapText ? "truncate" : "whitespace-normal break-words line-clamp-2 text-center")}>{item[h.key] || '—'}</div>;
    };

    const headerCellCls = "h-9 px-3 py-0 text-center align-middle font-semibold text-muted-foreground uppercase tracking-wide text-xs border-r bg-card last:border-r-0 select-none";
    const bodyCellCls = "h-9 px-0 py-0 align-middle border-r last:border-r-0 whitespace-nowrap overflow-hidden text-center";

    return (
        <>
            <div
                ref={ref}
                onScroll={onScroll}
                className="w-full h-full overflow-auto bg-background border-r scrollbar-thin"
            >
                <table className="w-full border-collapse table-auto min-w-max text-xs relative">
                    <thead className="sticky top-0 z-30 bg-card shadow-sm">
                        <tr className="h-9 border-b">
                            <th className={cn(headerCellCls, "px-2 w-10 border-r-0")} />
                            <th className={cn(headerCellCls, "px-2 w-10")} />
                            {shouldShowField('id', 'ID') && (
                                <th className={cn(headerCellCls, "w-[80px] min-w-[80px] text-center")}>ID</th>
                            )}
                            {shouldShowField('task', 'Task') && (
                                <th className={cn(headerCellCls, "text-left min-w-[250px]")}>Task</th>
                            )}
                            {headers.map((h) => (
                                <th key={h.key} className={cn(headerCellCls, "min-w-[150px]")}>{h.label}</th>
                            ))}
                            <th
                                className="w-10 px-2 text-center align-middle bg-card sticky right-0 z-40 border-l"
                                style={{ boxShadow: '-2px 0 4px rgba(0,0,0,0.02)' }}
                            >
                                <GanttFieldVisibilityPopup projectId={projectId} />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-background">
                        {tasks.map((task) => {
                            const taskSubtasks = getSubtasksByTask(task.id);
                            const isExpanded = expandedTasks.has(task.id);
                            return (
                                <React.Fragment key={task.id}>
                                    <tr className="border-b hover:bg-muted/30 group h-9 transition-colors relative">
                                        <td className={cn(bodyCellCls, "px-2 border-r-0")}>
                                            <Button
                                                onClick={() => toggleTaskExpansion(task.id)}
                                                className={cn("p-0 h-6 w-6 shrink-0", taskSubtasks.length === 0 && "invisible")}
                                                variant="ghost"
                                                size="sm"
                                                data-testid={`gantt-task-row-expand-btn-${task.id}`}
                                            >
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </td>
                                        <td className={cn(bodyCellCls, "px-2")}>
                                            <Checkbox
                                                checked={task.completed}
                                                onCheckedChange={(checked) => updateTask(task.id, { completed: checked as boolean })}
                                                data-testid={`gantt-task-row-checkbox-${task.id}`}
                                            />
                                        </td>
                                        {shouldShowField('id', 'ID') && (
                                            <td className={cn(bodyCellCls, "px-4 text-center text-gray-500 font-medium w-[80px] min-w-[80px]")}>
                                                {formatTaskId(projectSlug, task.taskNumber)}
                                            </td>
                                        )}
                                        {shouldShowField('task', 'Task') && (
                                            <td className={cn(bodyCellCls, "min-w-[250px] px-4 text-left", displayOptions?.wrapText ? "max-w-xs" : "")}>
                                                <div className="flex items-center gap-2 overflow-hidden w-full group/taskname">
                                                    <div
                                                        className={cn(
                                                            "font-medium flex-1",
                                                            displayOptions?.wrapText ? "truncate" : "whitespace-normal break-words"
                                                        )}
                                                    >
                                                        {task.name}
                                                    </div>

                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                        <button
                                                            className={cn(
                                                                "flex items-center gap-1 px-2 py-0.5 rounded transition-all text-xs hover:bg-gray-100/50",
                                                                "text-gray-400 hover:text-gray-600"
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartAddSubtask(task.id);
                                                            }}
                                                            title="Add Subtask"
                                                            data-testid={`gantt-task-row-add-subtask-btn-${task.id}`}
                                                        >
                                                            <Plus className="h-2.5 w-2.5" />
                                                            <span className="text-xs font-medium">Sub Task</span>
                                                        </button>
                                                        <button
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTaskForDetail(task);
                                                                setShowTaskDetail(true);
                                                            }}
                                                            title="Open Task"
                                                            data-testid={`gantt-task-row-open-detail-btn-${task.id}`}
                                                        >
                                                            <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                                                        </button>
                                                    </div>
                                                    {renderRelationshipIcons(task)}
                                                </div>
                                            </td>
                                        )}
                                        {headers.map(h => (
                                            <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                {renderCellContent(task, h, false)}
                                            </td>
                                        ))}
                                        <td
                                            className="w-10 px-2 text-center sticky right-0 z-20 bg-card group-hover:bg-muted border-l"
                                            style={{ boxShadow: '-2px 0 4px rgba(0,0,0,0.02)' }}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuContent align="end" className="w-[180px] p-1.5 border-b-4 border-b-primary z-[50]">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedTaskForDetail(task);
                                                            setShowTaskDetail(true);
                                                        }} className="text-xs">
                                                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                                            Open task
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-500 focus:text-red-500 text-xs">
                                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                            Delete task
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenu>
                                        </td>
                                    </tr>

                                    {isExpanded && taskSubtasks.map(subtask => (
                                        <tr key={subtask.id} className="border-b hover:bg-muted/30 bg-muted/5 group h-9 transition-colors relative">
                                            <td className={cn(bodyCellCls, "px-2 border-r-0")} />
                                            <td className={cn(bodyCellCls, "px-2")}>
                                                <Checkbox
                                                    checked={subtask.completed}
                                                    onCheckedChange={(checked) => updateSubtask(subtask.id, { completed: checked as boolean })}
                                                    data-testid={`gantt-subtask-row-checkbox-${subtask.id}`}
                                                />
                                            </td>
                                            {shouldShowField('id', 'ID') && (
                                                <td className={cn(bodyCellCls, "px-4 text-center text-gray-500 font-medium w-[80px] min-w-[80px]")}>
                                                    {formatTaskId(projectSlug, subtask.taskNumber)}
                                                </td>
                                            )}
                                            {shouldShowField('task', 'Task') && (
                                                <td className={cn(bodyCellCls, "min-w-[250px] pl-10 pr-4 text-left", displayOptions?.wrapText ? "max-w-xs" : "")}>
                                                    <div className="flex items-center gap-2 overflow-hidden w-full group/taskname">
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            {displayOptions?.subtaskParentId && task.taskNumber && (
                                                                <span className="text-[10px] text-gray-400 leading-tight">
                                                                    {formatTaskId(projectSlug, task.taskNumber)}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={cn(
                                                                    "font-medium",
                                                                    displayOptions?.wrapText ? "truncate" : "whitespace-normal break-words",
                                                                    subtask.completed && "line-through text-gray-400"
                                                                )}
                                                            >
                                                                {subtask.name}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <button
                                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedTaskForDetail(subtask as any);
                                                                    setShowTaskDetail(true);
                                                                }}
                                                                title="Open Subtask"
                                                                data-testid={`gantt-subtask-row-open-detail-btn-${subtask.id}`}
                                                            >
                                                                <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                                                            </button>
                                                        </div>
                                                        {renderRelationshipIcons(subtask)}
                                                    </div>
                                                </td>
                                            )}
                                            {headers.map(h => (
                                                <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                    {renderCellContent(subtask, h, true)}
                                                </td>
                                            ))}
                                            <td
                                                className="w-10 px-2 text-center sticky right-0 z-20 bg-card group-hover:bg-muted border-l"
                                                style={{ boxShadow: '-2px 0 4px rgba(0,0,0,0.02)' }}
                                            >
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuContent align="end" className="w-[180px] border-b-4 border-b-primary z-[50]">
                                                            <DropdownMenuItem onClick={() => deleteSubtask(subtask.id)} className="text-red-500 focus:text-red-500">
                                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                Delete subtask
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}

                                    {isExpanded && addingSubtaskToTask === task.id && (
                                        <tr className="border-b h-9 bg-blue-50/20 group/add-subtask shadow-inner">
                                            <td className={cn(bodyCellCls, "px-2 border-r-0")} />
                                            <td className={cn(bodyCellCls, "px-2")}>
                                                <div className="w-4 h-4 rounded border border-gray-300 mx-auto opacity-50" />
                                            </td>
                                            <td className={cn(bodyCellCls, "px-4 text-center text-xs text-blue-400 font-medium w-[80px] min-w-[80px]")}>Auto</td>
                                            <td className={cn(bodyCellCls, "min-w-[250px] pl-10 pr-4 text-left")}>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-shrink-0">
                                                        {(() => {
                                                            const currentType = taskTypes.find(t => t.value === (newSubtaskData.taskType || 'task')) || null;
                                                            return currentType ? renderTaskTypeVisual(currentType, "h-4 w-4") : null;
                                                        })()}
                                                    </div>
                                                    <Input
                                                        autoFocus
                                                        placeholder={newSubtaskData.taskType === 'milestone' ? "Milestone name..." : "Subtask name..."}
                                                        value={newSubtaskName}
                                                        onChange={e => setNewSubtaskName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleSaveSubtask(task.id);
                                                            if (e.key === 'Escape') handleCancelAddSubtask();
                                                        }}
                                                        className="h-8 text-xs focus-visible:ring-0 border-0 bg-transparent shadow-none p-0 w-full"
                                                        data-testid="gantt-new-subtask-name-input"
                                                    />
                                                </div>
                                            </td>
                                            {headers.map(h => {
                                                const cellCls = "flex items-center justify-center gap-2 w-full h-9 cursor-pointer hover:bg-muted/50 px-2 rounded transition-colors group/cell text-center";

                                                if (h.key === 'taskType') {
                                                    const type = taskTypes.find(t => t.value === (newSubtaskData.taskType || 'task')) || null;

                                                    return (
                                                        <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <div className={cn(cellCls, "flex items-center gap-2")}>
                                                                        {type ? renderTaskTypeVisual(type, "h-3 w-3") : null}
                                                                        <span className="text-xs truncate">{type?.label || "Task"}</span>
                                                                    </div>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start">
                                                                    {taskTypes.map((t) => (
                                                                        <DropdownMenuItem
                                                                            key={t._id || t.value}
                                                                            onClick={() =>
                                                                                setNewSubtaskData((prev) => ({ ...prev, taskType: t.value }))
                                                                            }
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                {renderTaskTypeVisual(t, "h-3 w-3")}
                                                                                <span>{t.label}</span>
                                                                            </div>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    );
                                                }
                                                if (h.key === 'cycle') {
                                                    const selCycle = cycles.find(c => c.id === newSubtaskData.cycleId);
                                                    return (
                                                        <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:bg-muted overflow-hidden px-3">
                                                                        <span className={cn("truncate w-full text-center flex items-center justify-center", !selCycle && "text-muted-foreground font-normal")}>
                                                                            {selCycle?.name || <RefreshCw className="h-3.5 w-3.5 mx-auto text-muted-foreground" />}
                                                                        </span>
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="p-2 w-[200px] space-y-1 border-b-4 border-b-primary max-h-[300px] overflow-y-auto z-[50]">
                                                                    {cycles.map(c => (
                                                                        <DropdownMenuItem key={c.id} onClick={() => setNewSubtaskData(prev => ({ ...prev, cycleId: c.id }))} className="p-0 focus:bg-transparent">
                                                                            <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 bg-muted hover:bg-muted">
                                                                                <span className="truncate w-full text-center">{c.name}</span>
                                                                            </div>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                    {cycles.length === 0 && (
                                                                        <div className="p-2 text-xs text-muted-foreground text-center">No cycles available</div>
                                                                    )}
                                                                    {cycles.length > 0 && <DropdownMenuSeparator />}
                                                                    <DropdownMenuItem onClick={() => setNewSubtaskData(prev => ({ ...prev, cycleId: null }))} className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs">
                                                                        — Clear Cycle —
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    );
                                                }
                                                if (h.key === 'status') {
                                                    const statusCfg = taskStatusConfigs.find(s => s.value === newSubtaskData.status);
                                                    return (
                                                        <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <div className={cellCls}>
                                                                        <div
                                                                            className="w-2 h-2 rounded-full shrink-0"
                                                                            style={{ backgroundColor: statusCfg?.color || '#e5e7eb' }}
                                                                        />
                                                                        <span className="text-xs truncate">{statusCfg?.label || 'Status'}</span>
                                                                    </div>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start">
                                                                    {taskStatusConfigs.map(s => (
                                                                        <DropdownMenuItem key={s.value} onClick={() => setNewSubtaskData(prev => ({ ...prev, status: s.value }))}>
                                                                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                                                            {s.label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    );
                                                }
                                                if (h.key === 'assignee') {
                                                    const assignee = members.find(m => m.userId === newSubtaskData.assignee);
                                                    return (
                                                        <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <div className={cellCls}>
                                                                        {assignee ? (
                                                                            <>
                                                                                <Avatar className="h-5 w-5 shrink-0">
                                                                                    <AvatarImage src={assignee.profilePicture || assignee.avatar} />
                                                                                    <AvatarFallback className="text-[10px]">
                                                                                        {assignee.name?.charAt(0).toUpperCase()}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="w-[200px]">
                                                                    <DropdownMenuItem onClick={() => setNewSubtaskData(prev => ({ ...prev, assignee: '' }))}>
                                                                        <User className="h-4 w-4 mr-2" /> Unassigned
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    {members.map(m => (
                                                                        <DropdownMenuItem key={m.userId} onClick={() => setNewSubtaskData(prev => ({ ...prev, assignee: m.userId }))}>
                                                                            <Avatar className="h-5 w-5 mr-2">
                                                                                <AvatarImage src={m.profilePicture || m.avatar} />
                                                                                <AvatarFallback>{m.name?.charAt(0)}</AvatarFallback>
                                                                            </Avatar>
                                                                            {m.name}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    );
                                                }
                                                if (h.key === 'startDate' || h.key === 'endDate') {
                                                    const dateValue = h.key === 'startDate' ? newSubtaskData.startDate : newSubtaskData.endDate;
                                                    return (
                                                        <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <div className={cellCls}>
                                                                        {dateValue ? (
                                                                            <span className="text-xs">
                                                                                {format(dateValue, 'd MMM')}
                                                                            </span>
                                                                        ) : (
                                                                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                                                        )}
                                                                    </div>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={dateValue}
                                                                        onSelect={(d) => {
                                                                            setNewSubtaskData(prev => {
                                                                                const updates: any = { ...prev, [h.key]: d || undefined };
                                                                                if (h.key === 'startDate' && d && prev.endDate && prev.endDate < d) {
                                                                                    updates.endDate = undefined;
                                                                                }
                                                                                return updates;
                                                                            });
                                                                        }}
                                                                        disabled={h.key === 'endDate' ? (date) => (newSubtaskData.startDate ? date < new Date(new Date(newSubtaskData.startDate).setHours(0, 0, 0, 0)) : false) : undefined}
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </td>
                                                    );
                                                }
                                                if (h.key === 'priority') {
                                                    const priorityCfg = taskPriorityConfigs.find(p => p.value === newSubtaskData.priority);
                                                    return (
                                                        <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <div className={cellCls}>
                                                                        <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: priorityCfg?.color || '#9ca3af' }} />
                                                                        <span className={cn("text-xs truncate", !priorityCfg && "text-muted-foreground")}>
                                                                            {priorityCfg?.label || '—'}
                                                                        </span>
                                                                    </div>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start">
                                                                    {taskPriorityConfigs.map(p => (
                                                                        <DropdownMenuItem key={p.value} onClick={() => setNewSubtaskData(prev => ({ ...prev, priority: p.value }))}>
                                                                            <Flag className="h-3 w-3 mr-2" style={{ color: p.color }} />
                                                                            {p.label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    );
                                                }

                                                return <td key={h.key} className={bodyCellCls} />;
                                            })}
                                            <td className="w-10 px-2 border-l sticky right-0 z-20 bg-card" style={{ boxShadow: '-4px 0 8px rgba(0,0,0,0.05)' }}>
                                                <div className="flex items-center gap-1 justify-center">
                                                    <button
                                                        onClick={() => handleSaveSubtask(task.id)}
                                                        className="px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm font-medium"
                                                        data-testid="gantt-new-subtask-save-btn"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelAddSubtask}
                                                        className="px-2 py-1 border border-border text-muted-foreground rounded hover:bg-muted transition-colors font-medium"
                                                        data-testid="gantt-new-subtask-cancel-btn"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* simplified Add Task Footer — updated to match List view section behavior */}
                        {!showAddTask ? (
                            <tr
                                className="h-9 group cursor-pointer hover:bg-muted/10 transition-colors"
                                onMouseEnter={() => setIsAddTaskRowHovered(true)}
                                onMouseLeave={() => setIsAddTaskRowHovered(false)}
                            >
                                <td colSpan={1} className={cn(bodyCellCls, "px-2 border-r-0")} />
                                <td colSpan={1} className={cn(bodyCellCls, "px-2")} />
                                <td colSpan={1} className={cn(bodyCellCls, "px-4 text-center text-xs text-blue-400 font-medium w-[80px] min-w-[80px]")} />
                                <td className="px-4 py-2 text-left">
                                    <div className="flex items-center gap-1">
                                                <div
                                                    className={cn(
                                                        "flex items-center rounded-sm transition-all group",
                                                        (isAddTaskRowHovered || showTaskTypeMenu) ? "border border-primary/30" : "border border-transparent"
                                                    )}
                                                >
                                                    <button
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-0.5 transition-colors text-xs",
                                                            (isAddTaskRowHovered || showTaskTypeMenu) ? "text-primary/60" : "text-muted-foreground"
                                                        )}
                                                        onClick={() => {
                                                            setNewTaskData(prev => ({ ...prev, taskType: selectedAddTaskType, startDate: new Date() }));
                                                            setShowAddTask(true);
                                                            setShowTaskTypeMenu(false);
                                                        }}
                                                        data-testid="gantt-new-task-trigger"
                                                    >
                                                        <Plus className={cn("h-3 w-3", (isAddTaskRowHovered || showTaskTypeMenu) ? "text-primary/60" : "text-muted-foreground")} />
                                                        Add Task
                                                    </button>
                                                    <DropdownMenu open={showTaskTypeMenu} onOpenChange={setShowTaskTypeMenu}>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className={cn(
                                                                    "px-1 py-0.5 border-l border-primary/30 text-muted-foreground hover:text-primary/60 transition-colors outline-none",
                                                                    !(isAddTaskRowHovered || showTaskTypeMenu) && "invisible"
                                                                )}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ChevronUp className="h-3 w-3 text-primary/60" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuContent
                                                                align="start"
                                                                side="top"
                                                                className="bg-card border border-border border-b-[5px] border-b-primary rounded-md shadow-lg min-w-[140px] z-[9999]"
                                                            >
                                                        {taskTypes.map((type) => (
                                                            <DropdownMenuItem
                                                                key={type._id || type.value}
                                                                onClick={() => {
                                                                    setNewTaskData(prev => ({ ...prev, taskType: type.value, startDate: new Date() }));
                                                                    setSelectedAddTaskType(type.value);
                                                                    setShowAddTask(true);
                                                                    setShowTaskTypeMenu(false);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {renderTaskTypeVisual(type, "w-3 h-3")}
                                                                    <span>{type.label}</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </td>
                                {headers.map(h => <td key={h.key} className={bodyCellCls} />)}
                                <td className="sticky right-0 bg-card border-l w-10" style={{ boxShadow: '-4px 0 8px rgba(0,0,0,0.05)' }} />
                            </tr>
                        ) : (
                            <tr className="h-9 border-b bg-blue-50/20">
                                <td className={cn(bodyCellCls, "px-2 border-r-0")} />
                                <td className={cn(bodyCellCls, "px-2")} />
                                <td className={cn(bodyCellCls, "px-4 text-center text-xs text-blue-400 font-medium w-[80px] min-w-[80px]")}>Auto</td>
                                <td className={cn(bodyCellCls, "min-w-[250px] px-4 text-left")}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-shrink-0">
                                            {(() => {
                                                const currentType =
                                                    taskTypes.find((t) => t.value === (newTaskData.taskType || selectedAddTaskType || "task")) || null;

                                                if (!currentType) return null;

                                                return (
                                                    <div className="flex items-center gap-2">
                                                        {renderTaskTypeVisual(currentType, "w-3 h-3")}
                                                        <span>{currentType.label}</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <Input
                                            autoFocus
                                            placeholder={(newTaskData.taskType || selectedAddTaskType) === 'milestone' ? "Milestone name..." : "Task name..."}
                                            value={newTaskName}
                                            onChange={e => setNewTaskName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveTask();
                                                if (e.key === 'Escape') handleCancelAddTask();
                                            }}
                                            className="h-8 text-xs focus-visible:ring-0 border-0 bg-transparent shadow-none p-0 w-full"
                                            data-testid="gantt-new-task-name-input"
                                        />
                                    </div>
                                </td>
                                {headers.map(h => {
                                    const cellCls = "flex items-center justify-center gap-2 w-full h-9 cursor-pointer hover:bg-muted/50 px-2 rounded transition-colors group/cell text-center";

                                    if (h.key === "taskType") {
                                        const type =
                                            taskTypes.find((t) => t.value === (newTaskData.taskType || selectedAddTaskType || "task")) || null;

                                        return (
                                            <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className={cellCls}>
                                                            {type ? renderTaskTypeVisual(type, "h-3 w-3") : null}
                                                            <span className="text-xs truncate">{type?.label || "Task"}</span>
                                                        </div>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent align="start">
                                                        {taskTypes.map((t) => (
                                                            <DropdownMenuItem
                                                                key={t._id || t.value}
                                                                onClick={() =>
                                                                    setNewTaskData((prev) => ({ ...prev, taskType: t.value }))
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {renderTaskTypeVisual(t, "h-3 w-3")}
                                                                    <span>{t.label}</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        );
                                    }
                                    if (h.key === 'cycle') {
                                        const selCycle = cycles.find(c => c.id === newTaskData.cycleId);
                                        return (
                                            <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:bg-muted overflow-hidden px-3">
                                                            <span className={cn("truncate w-full text-center flex items-center justify-center", !selCycle && "text-muted-foreground font-normal")}>
                                                                {selCycle?.name || <RefreshCw className="h-3.5 w-3.5 mx-auto text-muted-foreground" />}
                                                            </span>
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="p-2 w-[200px] space-y-1 border-b-4 border-b-primary max-h-[300px] overflow-y-auto z-[50]">
                                                        {cycles.map(c => (
                                                            <DropdownMenuItem key={c.id} onClick={() => setNewTaskData(prev => ({ ...prev, cycleId: c.id }))} className="p-0 focus:bg-transparent">
                                                                <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 bg-muted hover:bg-muted">
                                                                    <span className="truncate w-full text-center">{c.name}</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        ))}
                                                        {cycles.length === 0 && (
                                                            <div className="p-2 text-xs text-muted-foreground text-center">No cycles available</div>
                                                        )}
                                                        {cycles.length > 0 && <DropdownMenuSeparator />}
                                                        <DropdownMenuItem onClick={() => setNewTaskData(prev => ({ ...prev, cycleId: null }))} className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs">
                                                            — Clear Cycle —
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        );
                                    }
                                    if (h.key === 'status') {
                                        const statusCfg = taskStatusConfigs.find(s => s.value === newTaskData.status);
                                        return (
                                            <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className={cellCls}>
                                                            <div
                                                                className="w-2 h-2 rounded-full shrink-0"
                                                                style={{ backgroundColor: statusCfg?.color || '#e5e7eb' }}
                                                            />
                                                            <span className="text-xs truncate">{statusCfg?.label || 'Status'}</span>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="z-[50]">
                                                        {taskStatusConfigs.map(s => (
                                                            <DropdownMenuItem key={s.value} onClick={() => setNewTaskData(prev => ({ ...prev, status: s.value }))}>
                                                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                                                {s.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        );
                                    }
                                    if (h.key === 'assignee') {
                                        const assignee = members.find(m => m.userId === newTaskData.assignee);
                                        return (
                                            <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className={cellCls}>
                                                            {assignee ? (
                                                                <>
                                                                    <Avatar className="h-5 w-5 shrink-0">
                                                                        <AvatarImage src={assignee.profilePicture || assignee.avatar} />
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {assignee.name?.charAt(0).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                </>
                                                            )}
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[200px]">
                                                        <DropdownMenuItem onClick={() => setNewTaskData(prev => ({ ...prev, assignee: '' }))}>
                                                            <User className="h-4 w-4 mr-2" /> Unassigned
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {members.map(m => (
                                                            <DropdownMenuItem key={m.userId} onClick={() => setNewTaskData(prev => ({ ...prev, assignee: m.userId }))}>
                                                                <Avatar className="h-5 w-5 mr-2">
                                                                    <AvatarImage src={m.profilePicture || m.avatar} />
                                                                    <AvatarFallback>{m.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                {m.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        );
                                    }
                                    if (h.key === 'startDate' || h.key === 'endDate') {
                                        const dateValue = h.key === 'startDate' ? newTaskData.startDate : newTaskData.endDate;
                                        return (
                                            <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <div className={cellCls}>
                                                            {dateValue ? (
                                                                <span className="text-xs">
                                                                    {format(dateValue, 'd MMM')}
                                                                </span>
                                                            ) : (
                                                                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                                            )}
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={dateValue}
                                                            onSelect={(d) => {
                                                                setNewTaskData(prev => {
                                                                    const updates: any = { ...prev, [h.key]: d || undefined };
                                                                    if (h.key === 'startDate' && d && prev.endDate && prev.endDate < d) {
                                                                        updates.endDate = undefined;
                                                                    }
                                                                    return updates;
                                                                });
                                                            }}
                                                            disabled={h.key === 'endDate' ? (date) => (newTaskData.startDate ? date < new Date(new Date(newTaskData.startDate).setHours(0, 0, 0, 0)) : false) : undefined}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </td>
                                        );
                                    }
                                    if (h.key === 'priority') {
                                        const priorityCfg = taskPriorityConfigs.find(p => p.value === newTaskData.priority);
                                        return (
                                            <td key={h.key} className={cn(bodyCellCls, "min-w-[150px]")}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className={cellCls}>
                                                            <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: priorityCfg?.color || '#9ca3af' }} />
                                                            <span className={cn("text-xs truncate", !priorityCfg && "text-muted-foreground")}>
                                                                {priorityCfg?.label || '—'}
                                                            </span>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        {taskPriorityConfigs.map(p => (
                                                            <DropdownMenuItem key={p.value} onClick={() => setNewTaskData(prev => ({ ...prev, priority: p.value }))}>
                                                                <Flag className="h-3 w-3 mr-2" style={{ color: p.color }} />
                                                                {p.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        );
                                    }

                                    return <td key={h.key} className={bodyCellCls} />;
                                })}
                                <td className="w-10 px-2 border-l sticky right-0 z-20 bg-card" style={{ boxShadow: '-4px 0 8px rgba(0,0,0,0.05)' }}>
                                    <div className="flex items-center gap-1 justify-center">
                                        <button
                                            onClick={handleSaveTask}
                                            data-testid="gantt-new-task-save-btn"
                                            className="px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm font-medium"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelAddTask}
                                            data-testid="gantt-new-task-cancel-btn"
                                            className="px-2 py-1 border border-border text-muted-foreground rounded hover:bg-muted transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedTaskForDetail && (
                <TaskDetailView
                    task={selectedTaskForDetail}
                    open={showTaskDetail}
                    onOpenChange={setShowTaskDetail}
                    projectId={projectId}
                />
            )}
        </>
    );
});

GanttTaskTable.displayName = "GanttTaskTable";