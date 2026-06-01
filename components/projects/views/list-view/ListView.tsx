// components/list-view/ListView.tsx

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Users,
    SlidersVertical,
    ArrowUpDown,
    Funnel,
    EyeOff,
    Target,
    Clock,
    Pin,
    ChevronDown,
    CheckCheck,
    Hash,
    User,
    Save,
    Monitor,
    Search,
    Layers,
    ArrowUp,
    ArrowDown,
    GripVertical,
    X,
    ArrowDownAZ,
    ArrowDownZA,
    ArrowDown01,
    ArrowDown10,
    ChevronRight,
} from "lucide-react";
import { useTasksStore } from "@/stores/tasks-store";
import { Task } from '@/types/task.types';
import { TaskGroup } from "./TaskGroup";
// import AdvancedFilters, { FilterBlock, FilterCriteria } from "@/components/projects/views/list-view/filters/AdvancedFilters";
import ProjectMembersSection from "@/components/projects/ProjectMembersSection";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useProjectsStore } from "@/stores/projects-store";

import { toast } from "@/components/ui/sonner";
import ProjectInviteDialog from "../../ProjectInviteDialog";
import { Item } from "@radix-ui/react-context-menu";
import { BulkActionToolbar } from "@/components/projects/views/list-view/common/BulkActionToolbar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import AdvancedFiltersNew, { FilterBlock, FilterCriteria } from "./filters/AdvancedFiltersNew";
import AssigneeDropdown from "./filters/AssigneeDropdown";
import { useWorkspaceStore } from "@/stores/workspace-store";
import DeleteTaskModal from "@/components/projects/views/list-view/common/DeleteTaskModal";
import { ConvertToSubtaskDialog } from "@/components/projects/ConvertToSubtaskDialog";
import DuplicateTaskDialog from "@/components/projects/DuplicateTaskDialog";

type GroupByOption = 'status' | 'assignee' | 'priority' | 'dueDate' | 'none' | string;

interface DynamicGroup {
    id: string;
    name: string;
    projectId: string;
    order: number;
    color?: string;
    isUntitled?: boolean;   // ← makes it optional on ALL variants
    optionId?: string;
    memberId?: string;
    fieldId?: string;
}

interface ListViewProps {
    projectId: string;
    initialGroupBy?: string;
    initialFilters?: FilterCriteria[];
    onRegisterCollapseHandlers?: (
        collapseAll: () => void,
        expandAll: () => void,
        toggleHideEmpty: () => void,
        info: {
            collapsed: number;
            total: number;
            allCollapsed: boolean;
            hideEmptyGroups: boolean;
        }
    ) => void;
    onRegisterExportHandlers?: (
        exportCSV: () => void,
        exportExcel: () => void,
        print: () => void
    ) => void;
}

interface SortField {
    id: string;
    fieldName: string;
    fieldType: string;
    isSelected: boolean;
    direction: "asc" | "desc" | null;
    order: number;
}

// Filter condition types

interface SavedFilter {
    id: string;
    name: string;
    filterBlock: FilterBlock;
}

export function ListView({
    projectId,
    onRegisterCollapseHandlers,
    onRegisterExportHandlers,
    initialGroupBy,
    initialFilters
}: ListViewProps) {
    const {
        fetchTasks,
        getTasksByProject,
        getVisibleSystemFields,
        columnConfigs,
        toggleColumnFreeze,
        toggleColumnVisibility,
        initializeColumnConfigs,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        convertTaskToSubtask,
        getSubtasksByTask,
        duplicateTask,
    } = useTasksStore();
    const {
        projects,
        addMembersToProject,
        removeMembersFromProject,
        getTaskStatusConfigs,
        addTaskStatusConfig,
        getTaskCustomFields,
        addTaskCustomField,
        updateTaskCustomFieldOptions,
        getTaskPriorityConfigs,
        addTaskPriorityConfig,
        getTaskTypesByProject,
        fetchCycles,
    } = useProjectsStore();
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();

    const project = projects.find((p) => p.id === projectId);
    const projectMembers = project?.members || [];
    const customFields = getTaskCustomFields(projectId);

    useEffect(() => {
        if (!projectId) return;

        // Only fetch if tasks aren't already loaded for this project
        const existingTasks = getTasksByProject(projectId); // from store
        if (existingTasks.length === 0) {
            fetchTasks(projectId).catch((error) => {
                console.error('Failed to load tasks:', error);
            });
            fetchCycles(projectId).catch((error) => {
                console.error('Failed to load cycles:', error);
            });
        }
    }, [projectId]);

    // Get project-specific data
    const taskStatusConfigs = getTaskStatusConfigs(projectId);
    const taskPriorityConfigs = getTaskPriorityConfigs(projectId);
    const members = projectMembers.map(({ userId }) => {
        const wm = workspaceMembers.find(m => m.userId === userId);
        return {
            id: userId,
            name: wm?.name || userId,
            avatar: wm?.avatar,
        };
    });
    const taskTypes = getTaskTypesByProject(projectId);
    const visibleSystemFields = getVisibleSystemFields(projectId);

    const [showSortOptions, setShowSortOptions] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [sortFields, setSortFields] = useState<SortField[]>([]);
    const [hideFields, setHideFields] = useState<string[]>([]);
    const [freezeFields, setFreezeFields] = useState<string[]>([]);
    const [displayOptions, setDisplayOptions] = useState({
        collapsedSubtasks: false,
        closedTasks: true,
        wrapText: true,
        subtaskParentId: false,
    });

    // After filters state
    const [filterConfig, setFilterConfig] = useState<FilterCriteria[]>(initialFilters || []);
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);


    // Group By state - Default to 'status'
    const [groupBy, setGroupBy] = useState<GroupByOption>(initialGroupBy || 'status');
    const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);
    const [previouslyUsedGroupBy, setPreviouslyUsedGroupBy] = useState<{ option: GroupByOption, date: string }[]>([]);
    const [showAllGroupOptions, setShowAllGroupOptions] = useState(false);

    // Collapse/Expand groups state
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Hidden groups state (per-group manual hide via context menu)
    const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

    // Hide ALL empty groups toggle (via Group Actions menu)
    const [hideEmptyGroups, setHideEmptyGroups] = useState(false);
    // Tracks individual empty groups explicitly unhidden by user
    const [emptyGroupExceptions, setEmptyGroupExceptions] = useState<Set<string>>(new Set());


    // Add group states
    const [isAddingNewGroup, setIsAddingNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const newGroupInputRef = useRef<HTMLInputElement>(null);

    // ✅ Add state for members popover
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    const [selectedTasksByGroup, setSelectedTasksByGroup] = useState<Record<string, string[]>>({});

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Derived flat list for the toolbar count
    const selectedTaskIds = Object.values(selectedTasksByGroup).flat();

    const [shouldClearSelection, setShouldClearSelection] = useState(false);

    const [bulkConvertSubtaskQueue, setBulkConvertSubtaskQueue] = useState<string[]>([]);
    const [bulkConvertSubtaskIndex, setBulkConvertSubtaskIndex] = useState(0);

    const [bulkDuplicateQueue, setBulkDuplicateQueue] = useState<string[]>([]);
    const [bulkDuplicateIndex, setBulkDuplicateIndex] = useState(0);
    const [bulkDuplicateDialogOpen, setBulkDuplicateDialogOpen] = useState(false);

    const eligibleForSubtaskConversion = selectedTaskIds.filter(
        id => getSubtasksByTask(id).length === 0
    ).length;

    const handleBulkConvertToSubtask = () => {
        if (selectedTaskIds.length === 0) return;
        // Filter out tasks that already have subtasks — they can't be converted
        const { getSubtasksByTask } = useTasksStore.getState();
        const eligible = selectedTaskIds.filter(
            id => getSubtasksByTask(id).length === 0
        );
        if (eligible.length === 0) {
            toast('error', { title: "None of the selected tasks can be converted (tasks with subtasks are excluded)" });
            return;
        }
        setBulkConvertSubtaskQueue(eligible);
        setBulkConvertSubtaskIndex(0);
    };

    const handleBulkConvertSubtaskConfirm = async (
        parentTaskId: string,
        updates: { name: string; priority?: string; endDate?: string; assignee?: string }
    ) => {
        const taskId = bulkConvertSubtaskQueue[bulkConvertSubtaskIndex];
        if (!taskId) return;

        await convertTaskToSubtask(taskId, parentTaskId, updates);
        toast('success', { title: `Converted task to subtask (${bulkConvertSubtaskIndex + 1}/${bulkConvertSubtaskQueue.length})` });

        const nextIndex = bulkConvertSubtaskIndex + 1;
        if (nextIndex < bulkConvertSubtaskQueue.length) {
            setBulkConvertSubtaskIndex(nextIndex); // opens dialog for next task
        } else {
            // All done — close and clear
            setBulkConvertSubtaskQueue([]);
            setBulkConvertSubtaskIndex(0);
            clearAllSelections();
        }
    };

    const handleSelectionChange = (groupId: string, ids: string[]) => {
        setSelectedTasksByGroup(prev => ({
            ...prev,
            [groupId]: ids,
        }));
    };

    // ✅ Add handlers
    const handleAddMembers = async (members: Array<{ userId: string; role: string }>) => {
        await addMembersToProject(projectId, members);
    };

    const handleRemoveMember = async (userId: string) => {
        await removeMembersFromProject(projectId, [userId]);
    };

    const handleSendInvite = async (emails: string[]) => {
        // Implement email invitation logic
        console.log("Send invites to:", emails);
        toast('success', { title: "Invitations sent!" });
    };

    // Scroll add-group input into view when it appears
    useEffect(() => {
        if (isAddingNewGroup) {
            // Double rAF: first waits for React DOM commit, second for browser paint
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (newGroupInputRef.current) {
                        newGroupInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        newGroupInputRef.current.focus({ preventScroll: true });
                    }
                });
            });
        }
    }, [isAddingNewGroup]);

    // sort logic
    // Initialize sort fields from custom fields and default fields
    useEffect(() => {
        const defaultFields = [
            { id: 'id', fieldName: 'ID', fieldType: 'text' },
            { id: 'task', fieldName: 'Task', fieldType: 'text' },
            { id: 'taskType', fieldName: 'Type', fieldType: 'text' },
            { id: 'status', fieldName: 'Status', fieldType: 'select-one' },
            { id: 'cycle', fieldName: 'Cycle', fieldType: 'select-one' },
            { id: 'priority', fieldName: 'Priority', fieldType: 'select-one' },
            { id: 'startDate', fieldName: 'Start Date', fieldType: 'date' },
            { id: 'endDate', fieldName: 'Due Date', fieldType: 'date' },
            { id: 'assignee', fieldName: 'Assignee', fieldType: 'people' },
        ];

        const customFieldsData = customFields.map(field => ({
            id: field.id,
            fieldName: field.name,
            fieldType: field.type,
        }));

        const allFieldIds = [...defaultFields, ...customFieldsData];

        // Update sortFields: keep existing selections, add new custom fields
        setSortFields((prev) => {
            // If empty, initialize everything
            if (prev.length === 0) {
                return allFieldIds.map(field => ({
                    ...field,
                    isSelected: false,
                    direction: null as "asc" | "desc" | null,
                    order: 0,
                }));
            }

            // Otherwise, merge: keep existing + add new custom fields
            const existingIds = prev.map(f => f.id);
            const newFields = allFieldIds
                .filter(field => !existingIds.includes(field.id))
                .map(field => ({
                    ...field,
                    isSelected: false,
                    direction: null as "asc" | "desc" | null,
                    order: 0,
                }));

            // Also remove fields that no longer exist in customFields
            const validIds = allFieldIds.map(f => f.id);
            const stillValidFields = prev.filter(f => validIds.includes(f.id));

            return [...stillValidFields, ...newFields];
        });
    }, [customFields]); // Only depend on customFields, not sortFields.length

    // Handle field selection (checkbox functionality)
    const handleFieldSelection = (fieldId: string) => {
        setSortFields((prev) => {
            const updatedFields = prev.map((field) =>
                field.id === fieldId
                    ? {
                        ...field,
                        isSelected: !field.isSelected,
                        direction: !field.isSelected ? ("asc" as const) : null,
                    }
                    : field
            );

            // Reassign order for selected fields
            const selectedFields = updatedFields.filter((f) => f.isSelected);
            selectedFields.forEach((field, index) => {
                field.order = index;
            });

            return updatedFields;
        });
    };

    const hasHiddenColumns = columnConfigs.some(
        col => col.id !== "task" && !col.pinned
    );

    const hasSelectedSortFields = sortFields.some(field => field.isSelected);

    // Handle direction selection
    const handleDirectionSelection = (fieldId: string, direction: "asc" | "desc") => {
        setSortFields((prev) =>
            prev.map((field) =>
                field.id === fieldId
                    ? {
                        ...field,
                        direction,
                    }
                    : field
            )
        );
    };

    // Clear all sort functionality
    const handleClearAllSort = () => {
        setSortFields((prev) =>
            prev.map((field) => ({
                ...field,
                isSelected: false,
                direction: null,
                order: 0,
            }))
        );
    };

    // Drag and drop functionality for My Sort section
    const moveSortField = useCallback((dragIndex: number, hoverIndex: number) => {
        setSortFields((prev) => {
            const selected = prev.filter((f) => f.isSelected);
            const unselected = prev.filter((f) => !f.isSelected);
            const draggedField = selected[dragIndex];
            const newSelected = [...selected];
            newSelected.splice(dragIndex, 1);
            newSelected.splice(hoverIndex, 0, draggedField);

            // Reassign order for selected
            newSelected.forEach((f, idx) => (f.order = idx));

            // Merge back with unselected (order of unselected doesn't matter)
            return [...newSelected, ...unselected.map((f) => ({ ...f, order: 0 }))];
        });
    }, []);

    // Draggable Sort Field Component
    const DraggableSortField: React.FC<{
        field: SortField;
        index: number;
    }> = ({ field, index }) => {
        const ref = useRef<HTMLDivElement>(null);

        const [{ isDragging }, dragRef] = useDrag({
            type: "SORT_FIELD",
            item: { index },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        });

        const [, dropRef] = useDrop({
            accept: "SORT_FIELD",
            hover: (item: { index: number }) => {
                if (item.index !== index) {
                    moveSortField(item.index, index);
                    item.index = index;
                }
            },
        });

        // Combine drag and drop refs
        dragRef(dropRef(ref));

        return (
            <div
                ref={ref}
                // className={`flex items-center justify-between p-2 bg-card rounded hover:bg-muted ${isDragging ? "opacity-50" : ""
                //     }`}
                className="grid grid-cols-[20px_1fr_20px] items-center px-2 py-1 mr-3 hover:bg-muted rounded"
            >
                {/* <div className="flex items-center gap-2"> */}
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className="text-xs font-medium text-primary">{field.fieldName}</span>
                {/* </div> */}
                {getSortIcon(field)}
            </div>
        );
    };

    const getSortIcon = (field: SortField) => {
        const { fieldType, direction, isSelected } = field;

        const getIconsByType = () => {
            switch (fieldType) {
                case "date":
                    return {
                        asc: <ArrowUp className="h-3 w-3" />,
                        desc: <ArrowDown className="h-3 w-3" />,
                    };
                case "number":
                    return {
                        asc: <ArrowDown01 className="h-3 w-3" />,
                        desc: <ArrowDown10 className="h-3 w-3" />,
                    };
                default:
                    return {
                        asc: <ArrowDownAZ className="h-3 w-3" />,
                        desc: <ArrowDownZA className="h-3 w-3" />,
                    };
            }
        };

        const icons = getIconsByType();

        return (
            <div className="flex gap-1">
                <button
                    onClick={() => handleDirectionSelection(field.id, "asc")}
                    disabled={!isSelected}
                    className={`p-1 rounded hover:bg-muted ${direction === "asc" ? "bg-muted text-primary" : "text-muted-foreground"
                        } ${!isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {icons.asc}
                </button>
                <button
                    onClick={() => handleDirectionSelection(field.id, "desc")}
                    disabled={!isSelected}
                    className={`p-1 rounded hover:bg-muted ${direction === "desc" ? "bg-muted text-primary" : "text-muted-foreground"
                        } ${!isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {icons.desc}
                </button>
            </div>
        );
    };

    // Separate default and custom fields
    const defaultColumns = sortFields.filter(f =>
        ['id', 'task', 'taskType', 'status', 'cycle', 'assignee', 'startDate', 'endDate', 'priority'].includes(f.id)
    );
    const dynamicColumns = sortFields.filter(f =>
        !['id', 'task', 'taskType', 'status', 'cycle', 'assignee', 'startDate', 'endDate', 'priority'].includes(f.id)
    );

    // Get active sort configuration
    const getActiveSortConfig = () => {
        return sortFields
            .filter(f => f.isSelected && f.direction)
            .sort((a, b) => a.order - b.order)
            .map(f => ({
                fieldId: f.id,
                fieldName: f.fieldName,
                fieldType: f.fieldType,
                direction: f.direction!,
                order: f.order,
            }));
    };

    //filtering logic
    // Get field value from task for filtering
    const getFieldValueForFilter = (task: Task, fieldId: string): any => {
        // Default fields
        if (fieldId === 'name') return task.name;
        if (fieldId === 'status') return task.status;
        if (fieldId === 'cycle') return task.cycleId;
        if (fieldId === 'priority') return task.priority;
        if (fieldId === 'assignee') return task.assignee;
        if (fieldId === 'labels') {
            const labelIds = task.labelIds || [];
            const labels = task.labels || [];
            const idsFromLabels = (labels as any[]).map(l => (typeof l === 'string' ? l : l.id || l.name));
            return [...labelIds, ...idsFromLabels];
        }
        if (fieldId === 'startDate') return task.startDate;
        if (fieldId === 'endDate' || fieldId === 'dueDate') return task.endDate;

        // Custom fields
        if (task.customFieldValues && task.customFieldValues[fieldId]) {
            return task.customFieldValues[fieldId];
        }

        return null;
    };

    // Check if task matches filter criteria
    const matchesFilterCriteria = (task: Task, criteria: FilterCriteria): boolean => {
        const fieldValue = getFieldValueForFilter(task, criteria.field);
        const filterValue = criteria.value;

        switch (criteria.condition) {
            case "is":
                return fieldValue === filterValue;
            case "is-not":
                return fieldValue !== filterValue;
            case "contains":
                if (Array.isArray(fieldValue)) {
                    return fieldValue.some(val => String(val).toLowerCase() === String(filterValue || '').toLowerCase());
                }
                return String(fieldValue || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
            case "does-not-contain":
                if (Array.isArray(fieldValue)) {
                    return !fieldValue.some(val => String(val).toLowerCase() === String(filterValue || '').toLowerCase());
                }
                return !String(fieldValue || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
            case "is-empty":
                return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
            case "is-not-empty":
                return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);

            // Date conditions
            case "date-equals": {
                if (!fieldValue || !filterValue) return false;
                const taskDate = new Date(fieldValue);
                const filterDate = new Date(filterValue);
                return taskDate.toDateString() === filterDate.toDateString();
            }
            case "date-is-today": {
                if (!fieldValue) return false;
                const today = new Date();
                const taskDate = new Date(fieldValue);
                return taskDate.toDateString() === today.toDateString();
            }
            case "date-is-this-week": {
                if (!fieldValue) return false;
                const today = new Date();
                const taskDate = new Date(fieldValue);
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                return taskDate >= startOfWeek && taskDate <= endOfWeek;
            }
            case "date-is-this-month": {
                if (!fieldValue) return false;
                const today = new Date();
                const taskDate = new Date(fieldValue);
                return taskDate.getMonth() === today.getMonth() &&
                    taskDate.getFullYear() === today.getFullYear();
            }
            case "date-is-before":
                return fieldValue && new Date(fieldValue) < new Date(filterValue);
            case "date-is-after":
                return fieldValue && new Date(fieldValue) > new Date(filterValue);
            case "date-is-between": {
                if (!fieldValue || !filterValue) return false;
                const [start, end] = String(filterValue).split(' - ');
                const taskDate = new Date(fieldValue);
                return taskDate >= new Date(start) && taskDate <= new Date(end);
            }

            // Numeric conditions
            case "greater-than":
                return parseFloat(fieldValue) > parseFloat(filterValue);
            case "less-than":
                return parseFloat(fieldValue) < parseFloat(filterValue);
            case "equals":
                return parseFloat(fieldValue) === parseFloat(filterValue);
            case "not-equals":
                return parseFloat(fieldValue) !== parseFloat(filterValue);

            default:
                return true;
        }
    };

    // Apply filter block to tasks
    const applyFilterBlock = (tasks: Task[], filterBlock: FilterBlock | null): Task[] => {
        if (!filterBlock || filterBlock.children.length === 0) {
            return tasks;
        }

        return tasks.filter(task => {
            if (filterBlock.operator === "AND") {
                // All criteria must match
                return filterBlock.children.every(criteria =>
                    matchesFilterCriteria(task, criteria)
                );
            } else {
                // At least one criteria must match
                return filterBlock.children.some(criteria =>
                    matchesFilterCriteria(task, criteria)
                );
            }
        });
    };

    // Get active filter configuration
    const getActiveFilterConfig = (): FilterBlock | null => {
        if (filterConfig.length === 0) return null;

        return {
            id: 'active-filter',
            operator: 'AND',
            children: filterConfig,
        };
    };

    useEffect(() => {
        if (columnConfigs.length === 0) {
            initializeColumnConfigs(projectId);  // ✅ only on first load, never resets user's visibility choices
        }
    }, [projectId]);

    // Excel-like freeze column handler
    const handleFreezeToggle = (fieldId: string) => {
        // Sort fields by column order to implement Excel-like behavior
        const sortedFields = [...columnConfigs].sort((a, b) => a.columnOrder - b.columnOrder);
        const targetField = sortedFields.find((field) => field.id === fieldId);

        if (!targetField) return;

        const targetColumnOrder = targetField.columnOrder;
        const currentFreezeState = targetField.columnFreezed;

        if (!currentFreezeState) {
            // Freezing: freeze all columns up to and including this position
            sortedFields.forEach((field) => {
                if (field.columnOrder <= targetColumnOrder) {
                    toggleColumnFreeze(field.id, true);
                }
            });
        } else {
            // Unfreezing: keep frozen only columns to the LEFT of this one
            sortedFields.forEach((field) => {
                if (field.columnOrder < targetColumnOrder) {
                    // Keep these columns frozen (only columns to the left)
                    toggleColumnFreeze(field.id, true);
                } else {
                    // Unfreeze the clicked column and columns after it
                    toggleColumnFreeze(field.id, false);
                }
            });
        }
    };


    const handleGroupByChange = (value: GroupByOption) => {
        setGroupBy(value);

        // Format date as "DDth MMM" (e.g., "28th Dec")
        const formatDate = (date: Date) => {
            const day = date.getDate();
            const suffix = day === 1 || day === 21 || day === 31 ? 'st'
                : day === 2 || day === 22 ? 'nd'
                    : day === 3 || day === 23 ? 'rd'
                        : 'th';
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            return `${day}${suffix} ${month}`;
        };

        if (!previouslyUsedGroupBy.find(item => item.option === value)) {
            setPreviouslyUsedGroupBy([
                { option: value, date: formatDate(new Date()) },
                ...previouslyUsedGroupBy.slice(0, 2)
            ]);
        }

        setShowGroupByDropdown(false);
    };

    const handleRemovePreviouslyUsed = (optionToRemove: GroupByOption) => {
        setPreviouslyUsedGroupBy(prev =>
            prev.filter(item => item.option !== optionToRemove)
        );
    };

    const handleAddNewGroup = async () => {
        if (!newGroupName.trim()) return;

        if (groupBy === 'status') {
            await addTaskStatusConfig(projectId, {
                label: newGroupName,
                color: '#6B7280', // default color
                value: newGroupName.trim().toLowerCase().replace(/\s+/g, '_'),
            });

        } else if (groupBy === 'priority') {
            const value = newGroupName.trim().toLowerCase().replace(/\s+/g, '_');
            await addTaskPriorityConfig(projectId, {
                label: newGroupName.trim(),
                value,
                description: '',
                color: '#6B7280',
                order: taskPriorityConfigs.length + 1,
            });
        } else if (groupBy?.startsWith('custom-')) {
            const fieldId = groupBy.replace('custom-', '');
            const field = customFields.find((f) => f.id === fieldId);
            if (field) {
                const updatedOptions = [...field.options, newGroupName.trim()];
                updateTaskCustomFieldOptions(projectId, fieldId, updatedOptions);  // ← projects-store method
            }
        }

        setNewGroupName('');
        setIsAddingNewGroup(false);
    };


    // Get all available grouping options
    const getGroupingOptions = () => {
        const defaultOptions = [
            { value: 'assignee', label: 'Assignee', icon: <User className="h-4 w-4" /> },
            { value: 'status', label: 'Status', icon: <CheckCheck className="h-4 w-4" /> },
            { value: 'priority', label: 'Priority', icon: <Target className="h-4 w-4" /> },
            // { value: 'startDate', label: 'Start date', icon: <Clock className="h-4 w-4" /> },
            { value: 'dueDate', label: 'Due date', icon: <Clock className="h-4 w-4" /> },
        ];

        /* const customOptions = customFields.map(field => ({
            value: `custom-${field.id}`,
            label: field.name,
            icon: <Hash className="h-4 w-4" />,
            isCustom: true,
        })); */
        const customOptions: any[] = [];

        return { defaultOptions, customOptions };
    };

    const { defaultOptions, customOptions } = getGroupingOptions();
    const allOptions = [...defaultOptions, ...customOptions];
    const displayedOptions = showAllGroupOptions ? allOptions : allOptions.slice(0, 6);
    const remainingCount = allOptions.length - displayedOptions.length;

    // Get dynamic groups based on selected groupBy option
    const getDynamicGroups = (): DynamicGroup[] => {
        // Status grouping
        if (groupBy === 'status') {
            if (taskStatusConfigs.length === 0) {
                return [{
                    id: 'untitled',
                    name: 'Untitled',
                    projectId,
                    order: 0,
                    color: '#9ca3af',
                    isUntitled: true,
                }];
            }
            return taskStatusConfigs
                .sort((a, b) => a.order - b.order)
                .map((config) => ({
                    id: config._id,   // use value as id key
                    name: config.label,              // display label
                    projectId,
                    order: config.order,
                    color: config.color || '#6366f1',
                    optionId: config._id,
                }));
        }

        if (groupBy === 'assignee') {
            return [
                { id: 'unassigned', name: 'Unassigned', projectId, order: 0, color: '#9ca3af' },
                ...members.map((member, index) => ({
                    id: member.id,
                    name: member.name,
                    projectId,
                    order: index + 1,
                    color: '#6366f1',
                    memberId: member.id,
                })),
            ];
        }

        if (groupBy === 'priority') {
            if (taskPriorityConfigs.length === 0) {
                return [{ id: 'priority-untitled', name: 'Untitled', projectId, order: 0, color: '#9ca3af', isUntitled: true }];
            }
            return taskPriorityConfigs
                .sort((a, b) => a.order - b.order)
                .map((option) => ({
                    id: `priority-${option._id}`,
                    name: option.label,
                    projectId,
                    order: option.order,
                    color: option.color || '#6366f1',
                    optionId: option._id,
                }));
        }

        if (groupBy === 'dueDate') {
            return [
                { id: 'date-overdue', name: 'Overdue', projectId, order: 0, color: '#ef4444' },
                { id: 'date-today', name: 'Today', projectId, order: 1, color: '#f97316' },
                { id: 'date-upcoming', name: 'Upcoming', projectId, order: 2, color: '#3b82f6' },
                { id: 'date-no-date', name: 'No Date', projectId, order: 3, color: '#9ca3af' },
            ];
        }

        // Custom field grouping
        if (groupBy?.startsWith('custom-')) {
            const fieldId = groupBy.replace('custom-', '');
            const field = customFields.find((f) => f.id === fieldId);

            if (!field) return [];

            if (Array.isArray(field.options)) {
                return [
                    ...field.options.map((option, index) => ({
                        id: `${field.id}-${typeof option === 'string' ? option : option.value}`,
                        name: typeof option === 'string' ? option : option.value,
                        projectId,
                        order: index,
                        color: typeof option === 'string' ? '#6366f1' : (option.color || '#6366f1'),
                        fieldId: field.id,
                    })),
                    {
                        id: `${field.id}-none`,
                        name: 'No Value',
                        projectId,
                        order: field.options.length,
                        color: '#9ca3af',
                        isUntitled: true, // Add this to mark it as non-deletable
                        fieldId: field.id,
                    },
                ];
            }
        }
        return [];
    };

    const dynamicGroups: DynamicGroup[] = getDynamicGroups();

    // Compute which group IDs are empty (used for Bug 3 fix)
    const emptyGroupIds = useMemo((): string[] => {
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        return dynamicGroups
            .filter((group: DynamicGroup) => {
                let count = 0;
                if (groupBy === 'status') {
                    if (group.isUntitled) return projectTasks.length === 0;
                    const cfg = taskStatusConfigs.find(c => c._id === group.id);
                    count = cfg ? projectTasks.filter(t => t.status === cfg.value).length : 0;
                } else if (groupBy === 'assignee') {
                    count = group.id === 'unassigned'
                        ? projectTasks.filter(t => !t.assignee).length
                        : projectTasks.filter(t => t.assignee === group.name).length;
                } else if (groupBy === 'priority') {
                    if (group.isUntitled) { count = projectTasks.filter(t => !t.priority).length; }
                    else {
                        const pId = group.id.replace('priority-', '');
                        const pCfg = taskPriorityConfigs.find(p => p._id === pId);
                        count = pCfg ? projectTasks.filter(t => t.priority === pCfg.value).length : 0;
                    }
                } else if (groupBy === 'dueDate') {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    if (group.id === 'date-overdue') count = projectTasks.filter(t => { if (!t.endDate) return false; const d = new Date(t.endDate); d.setHours(0, 0, 0, 0); return d < today; }).length;
                    else if (group.id === 'date-today') count = projectTasks.filter(t => { if (!t.endDate) return false; const d = new Date(t.endDate); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime(); }).length;
                    else if (group.id === 'date-upcoming') count = projectTasks.filter(t => { if (!t.endDate) return false; const d = new Date(t.endDate); d.setHours(0, 0, 0, 0); return d > today; }).length;
                    else if (group.id === 'date-no-date') count = projectTasks.filter(t => !t.endDate).length;
                } else if (groupBy?.startsWith('custom-')) {
                    const fieldId = groupBy.replace('custom-', '');
                    count = group.name === 'No Value'
                        ? projectTasks.filter(t => !t.customFieldValues?.[fieldId]).length
                        : projectTasks.filter(t => t.customFieldValues?.[fieldId] === group.name).length;
                }
                return count === 0;  // true = this group is empty
            })
            .map(g => g.id);
    }, [dynamicGroups, tasks, projectId, groupBy, taskStatusConfigs, taskPriorityConfigs]);

    // Refs so stable callbacks always read fresh values without being recreated
    const collapsedGroupsRef = useRef(collapsedGroups);
    const dynamicGroupsRef = useRef(dynamicGroups);
    const hideEmptyGroupsRef = useRef(hideEmptyGroups);
    useEffect(() => { collapsedGroupsRef.current = collapsedGroups; }, [collapsedGroups]);
    useEffect(() => { dynamicGroupsRef.current = dynamicGroups; }, [dynamicGroups]);
    useEffect(() => { hideEmptyGroupsRef.current = hideEmptyGroups; }, [hideEmptyGroups]);

    // Stable callbacks — created once, never cause parent setState during render
    const stableCollapseAll = useCallback(() => { setCollapsedGroups(new Set(dynamicGroupsRef.current.map(g => g.id))); }, []);
    const stableExpandAll = useCallback(() => { setCollapsedGroups(new Set()); }, []);
    const stableToggleHideEmpty = useCallback(() => {
        setHideEmptyGroups(prev => {
            if (prev) {
                // Turning OFF — clear exceptions since all groups will be visible
                setEmptyGroupExceptions(new Set());
            }
            return !prev;
        });
    }, []);

    // This stays exactly as-is — empty deps, fires once
    useEffect(() => {
        if (onRegisterCollapseHandlers) {
            onRegisterCollapseHandlers(
                stableCollapseAll,
                stableExpandAll,
                stableToggleHideEmpty,
                {
                    collapsed: collapsedGroupsRef.current.size,
                    total: dynamicGroupsRef.current.length,
                    allCollapsed: dynamicGroupsRef.current.length > 0 &&
                        collapsedGroupsRef.current.size === dynamicGroupsRef.current.length,
                    hideEmptyGroups: hideEmptyGroupsRef.current,
                }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // NEW: re-send info whenever collapse/hide state changes so parent labels stay in sync
    useEffect(() => {
        if (onRegisterCollapseHandlers) {
            onRegisterCollapseHandlers(
                stableCollapseAll,
                stableExpandAll,
                stableToggleHideEmpty,
                {
                    collapsed: collapsedGroups.size,
                    total: dynamicGroups.length,
                    allCollapsed: dynamicGroups.length > 0 &&
                        collapsedGroups.size === dynamicGroups.length,
                    hideEmptyGroups,
                }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapsedGroups.size, dynamicGroups.length, hideEmptyGroups]);
    //  ↑ these are the 3 values that drive the labels — re-run when any changes

    // Register export handlers with parent
    useEffect(() => {
        if (onRegisterExportHandlers) {
            onRegisterExportHandlers(
                handleExportCSV,
                handleExportExcel,
                handlePrint
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks.length]);



    const handleColumnSort = useCallback((fieldId: string, fieldType: string) => {
        setSortFields(prev => {
            const existing = prev.find(f => f.id === fieldId);
            if (!existing) return prev;

            return prev.map(field => {
                if (field.id !== fieldId) {
                    // ✅ Deselect all other fields for single-column sort
                    return { ...field, isSelected: false, direction: null, order: 0 };
                }

                // ✅ Toggle: unselected → asc → desc → unselected
                if (!field.isSelected) {
                    return { ...field, isSelected: true, direction: 'asc', order: 0 };
                } else if (field.direction === 'asc') {
                    return { ...field, direction: 'desc' };
                } else {
                    return { ...field, isSelected: false, direction: null, order: 0 };
                }
            });
        });
    }, []);

    // Add these handler functions RIGHT AFTER getDynamicGroups
    const handleCollapseAllGroups = () => {
        const allGroupIds = dynamicGroups.map(group => group.id);
        setCollapsedGroups(new Set(allGroupIds));
    };

    const handleExpandAllGroups = () => {
        setCollapsedGroups(new Set());
    };

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const toggleHiddenGroup = (groupId: string) => {
        setHiddenGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    // Check if we can add groups for this groupBy type
    const canAddGroup = groupBy === 'status' || groupBy === 'priority' || groupBy.startsWith('custom-');

    // Export to CSV
    const handleExportCSV = () => {
        // Filter tasks for current project
        const projectTasks = tasks.filter(task => task.projectId === projectId);

        if (projectTasks.length === 0) {
            alert('No tasks to export');
            return;
        }

        // Create CSV header
        const headers = ['Task Name', 'Status', 'Priority', 'Assignee', 'Start Date', 'End Date'];

        // Add custom field headers
        customFields.forEach(field => {
            headers.push(field.name);
        });

        // Create CSV rows
        const rows = projectTasks.map(task => {
            const row = [
                task.name || '',
                task.status || '',
                task.priority || '',
                task.assignee || '',
                task.startDate || '',
                task.endDate || ''
            ];

            // Add custom field values
            customFields.forEach(field => {
                const value = task.customFieldValues?.[field.id] || '';
                row.push(String(value));
            });

            return row;
        });

        // Combine header and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tasks_${projectId}_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        URL.revokeObjectURL(url);
    };

    // Export to JSON
    const handleExportExcel = () => {
        const projectTasks = tasks.filter(task => task.projectId === projectId);
        if (projectTasks.length === 0) {
            alert('No tasks to export');
            return;
        }

        // Build CSV content — Excel opens CSV natively
        const headers = ['Task Name', 'Status', 'Priority', 'Assignee', 'Start Date', 'End Date'];
        customFields.forEach(field => headers.push(field.name));

        const rows = projectTasks.map(task => [
            task.name,
            task.status || '',
            task.priority || '',
            task.assignee || '',
            task.startDate || '',
            task.endDate || '',
            ...customFields.map(f => task.customFieldValues?.[f.id] || ''),
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.xlsx';   // ← .xlsx extension, Excel opens directly
        a.click();
        URL.revokeObjectURL(url);
    };

    // Print tasks
    const handlePrint = () => {
        const projectTasks = tasks.filter(task => task.projectId === projectId);

        if (projectTasks.length === 0) {
            alert('No tasks to print');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Project Tasks - ${projectId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: var(--primary); }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: var(--primary); color: var(--primary-foreground); }
          tr:nth-child(even) { background-color: #f2f2f2; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Project Tasks</h1>
        <p>Exported on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Start Date</th>
              <th>End Date</th>
              ${customFields.map(field => `<th>${field.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${projectTasks.map(task => `
              <tr>
                <td>${task.name || '-'}</td>
                <td>${task.status || '-'}</td>
                <td>${task.priority || '-'}</td>
                <td>${task.assignee || '-'}</td>
                <td>${task.startDate || '-'}</td>
                <td>${task.endDate || '-'}</td>
                ${customFields.map(field => `<td>${task.customFieldValues?.[field.id] || '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };


    const clearAllSelections = () => {
        setSelectedTasksByGroup({});
        setShouldClearSelection(true);          // ← triggers TaskTable reset
        setTimeout(() => setShouldClearSelection(false), 100);  // ← reset flag after
    };

    const handleBulkDuplicate = () => {
        if (selectedTaskIds.length === 0) return;
        setBulkDuplicateQueue([...selectedTaskIds]);
        setBulkDuplicateIndex(0);
        setBulkDuplicateDialogOpen(true);
    };

    const handleBulkDuplicateConfirm = async (newName: string, fieldIds: string[]) => {
        const taskId = bulkDuplicateQueue[bulkDuplicateIndex];
        if (!taskId) return;

        await duplicateTask(taskId, newName, fieldIds);

        const nextIndex = bulkDuplicateIndex + 1;

        if (nextIndex < bulkDuplicateQueue.length) {
            // Close the dialog first...
            setBulkDuplicateDialogOpen(false);

            // ...then after React renders the closed state, advance index + reopen
            setTimeout(() => {
                setBulkDuplicateIndex(nextIndex);
                setBulkDuplicateDialogOpen(true); // ← reopens with new task
            }, 80); // small delay lets React process the close before reopening
        } else {
            // All done — clear everything
            setBulkDuplicateDialogOpen(false);
            setBulkDuplicateQueue([]);
            setBulkDuplicateIndex(0);
            clearAllSelections();
        }
    };

    const handleBulkDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmBulkDelete = () => {
        selectedTaskIds.forEach(id => deleteTask(id));
        clearAllSelections();
        setShowDeleteModal(false);
    };

    const handleBulkExport = (format: "pdf" | "csv" | "excel") => {
        const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));

        if (format === "csv") {
            // reuse your existing CSV logic but scoped to selectedTasks
            const headers = ["Task Name", "Status", "Priority", "Assignee", "Start Date", "End Date"];
            const rows = selectedTasks.map(task => [
                task.name, task.status, task.priority,
                task.assignee, task.startDate, task.endDate
            ]);
            const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `tasks_export.csv`;
            link.click();

        } else if (format === "excel") {
            // same as CSV but with .xls extension for basic support
            const headers = ["Task Name", "Status", "Priority", "Assignee", "Start Date", "End Date"];
            const rows = selectedTasks.map(task => [
                task.name, task.status, task.priority,
                task.assignee, task.startDate, task.endDate
            ]);
            const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "application/vnd.ms-excel" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `tasks_export.xlsx`;
            link.click();

        } else if (format === "pdf") {
            // basic print-to-PDF fallback
            console.log("PDF export — wire to your PDF library");
        }

        clearAllSelections();
    };

    const handleBulkConvertTo = (taskType: string) => {
        selectedTaskIds.forEach(id => {
            if (taskType.startsWith("subtask:")) {
                // convert to subtask — update taskType only, parentTaskId logic handled separately
                const actualType = taskType.replace("subtask:", "");
                updateTask(id, { taskType: actualType, parentTaskId: undefined });
            } else {
                // simple task type change — this IS the convert action
                updateTask(id, { taskType });
            }
        });
        clearAllSelections();
    };

    // const handleBulkMoveTo = (status: string) => {
    //     selectedTaskIds.forEach(id => {
    //         updateTask(id, { status });
    //     });
    //     clearAllSelections();
    // };

    const handleBulkPriority = (priority: string) => {
        selectedTaskIds.forEach(id => {
            updateTask(id, { priority });
        });
        clearAllSelections();
    };

    const handleBulkStatus = (status: string) => {
        selectedTaskIds.forEach(id => {
            updateTask(id, { status });
        });
        clearAllSelections();
    };

    const handleBulkAssignee = (userId: string) => {
        selectedTaskIds.forEach(id => {
            updateTask(id, { assignee: userId || undefined });
        });
        clearAllSelections();
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col h-full">
                {/* Action Bar */}
                <div className="bg-card border-b px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <div className="relative flex ">
                            <Input
                                placeholder="Search"
                                className="pl-2 pr-8 rounded text-xs"
                            />
                            <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Members Button */}
                        <Popover open={isMembersOpen} onOpenChange={setIsMembersOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded cursor-pointer gap-2 text-xs"
                                >
                                    <Users className="h-4 w-4" />
                                    Members
                                    {projectMembers.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {projectMembers.length}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-2 border border-b-[5px] border-b-primary" align="start">
                                <ProjectMembersSection
                                    projectId={projectId}
                                    members={projectMembers}
                                    onAddMembers={handleAddMembers}
                                    onRemoveMember={handleRemoveMember}
                                    onInviteClick={() => {
                                        setIsMembersOpen(false);
                                        setIsInviteDialogOpen(true);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Group By Dropdown */}
                        <DropdownMenu open={showGroupByDropdown} onOpenChange={setShowGroupByDropdown}>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="secondary" className="gap-2 rounded cursor-pointer text-xs">
                                    <Layers className="h-4 w-4" />
                                    Group by: <span className="capitalize">{groupBy}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="center" sideOffset={4}
                                className="w-120 p-4 border-b-[5px] border-b-primary"
                            >
                                <div className="grid grid-cols-2 gap-2 mb-2 items-start">
                                    {/* Title aligned with radios */}
                                    <div className="pr-3 ">
                                        <h3 className="text-xs font-semibold text-primary px-2 py-0">
                                            Group tasks by
                                        </h3>
                                    </div>
                                    <div />
                                    {/* Left Column */}
                                    <div className="space-y-1 pr-3 border-r border-[#C7C7CC]">
                                        {displayedOptions.slice(0, Math.ceil(displayedOptions.length / 2)).map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleGroupByChange(option.value)}
                                                className={`w-full flex items-center gap-3 p-2 rounded text-xs hover:bg-muted 
        `}
                                            >
                                                {/* Radio */}
                                                <span
                                                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${groupBy === option.value ? "border-primary" : "border-muted-foreground"}`}>
                                                    {groupBy === option.value && (
                                                        <span className="h-2 w-2 rounded-full bg-primary" />
                                                    )}
                                                </span>

                                                {/* Label */}
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-1">
                                        {displayedOptions.slice(Math.ceil(displayedOptions.length / 2)).map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleGroupByChange(option.value)}
                                                className={`w-full flex items-center gap-3 p-2 rounded text-xs hover:bg-muted`}
                                            >
                                                {/* Radio */}
                                                <span
                                                    className={`h-4 w-4 rounded-full border flex items-center justify-center
                                                        ${groupBy === option.value ? "border-primary" : "border-muted-foreground"}`}
                                                >
                                                    {groupBy === option.value && (
                                                        <span className="h-2 w-2 rounded-full bg-primary" />
                                                    )}
                                                </span>

                                                {/* Label */}
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Show More Options */}
                                {remainingCount > 0 && !showAllGroupOptions && (
                                    <button
                                        onClick={() => setShowAllGroupOptions(true)}
                                        className="w-full text-center text-xs text-primary hover:text-foreground font-semibold"
                                    >
                                        +{remainingCount} More
                                    </button>
                                )}

                                {/* <Button size="sm" variant="ghost" className="w-full gap-2 bg-primary text-background mt-1 text-xs">
                                    <Save className="h-4 w-4" />
                                    Save this View
                                </Button> */}

                                {/* Previously Used Section */}
                                <>
                                    <Separator className="my-3 text-border" />
                                    <div className="mb-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground">
                                            Previously used Group by options
                                        </h4>
                                    </div>

                                    {previouslyUsedGroupBy.length === 0 ? (
                                        // Empty State
                                        <div className="flex items-center justify-center p-2">
                                            <Image
                                                src="/images/peoples.svg"
                                                alt="No data"
                                                width={150}
                                                height={150}
                                                className="object-contain"
                                            />
                                        </div>
                                    ) : (
                                        // Chips/Tags when data exists
                                        <div className="space-y-2">
                                            {previouslyUsedGroupBy.map((item, index) => {
                                                const optionData = allOptions.find(o => o.value === item.option);
                                                const borderColor = index === 0 ? '#f59e0b' : '#ef4444';

                                                return optionData ? (
                                                    <div
                                                        key={item.option}
                                                        className="flex items-center justify-between px-2 py-2 border border-border rounded-lg border-l-4 hover:bg-muted"
                                                        style={{ borderLeftColor: borderColor }}
                                                    >
                                                        <button
                                                            onClick={() => handleGroupByChange(item.option)}
                                                            className="flex-1 flex items-start gap-2 text-left"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium">Group by</span>
                                                                <span className="text-xs text-muted-foreground">{item.date}</span>
                                                            </div>
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">{optionData.label}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemovePreviouslyUsed(item.option);
                                                                }}
                                                                className="text-muted-foreground hover:text-muted-foreground"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="secondary"
                                size="sm"
                                className={`rounded cursor-pointer text-xs ${showSortOptions ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
                                onClick={() => setShowSortOptions(!showSortOptions)}
                            >
                                <SlidersVertical className="h-4 w-4" />
                            </Button>

                            {/* Inline Sort Options - Show when button is clicked */}
                            {showSortOptions && (
                                <>
                                    {/* Sort Dropdown */}
                                    <DropdownMenu open={activeDropdown === 'sort'} onOpenChange={(open) => setActiveDropdown(open ? 'sort' : null)}>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                                                <ArrowUpDown className="h-4 w-4" />
                                                Sort
                                            </Button>
                                        </DropdownMenuTrigger>
                                        {/* <DropdownMenuContent align="center" className="p-0 w-auto min-w-160 border-b-[5px] border-b-primary"> */}
                                        <DropdownMenuContent
                                            align="center"
                                            className={`p-0 transition-all duration-200 border-b-[5px] border-b-primary
                                                    ${hasSelectedSortFields ? 'w-155' : 'w-105'}
                                                `}
                                        >
                                            {/* Header with title and save button */}
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <h3 className="text-sm font-semibold text-primary">Sort fields by</h3>
                                                {/* <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`h-8 gap-2 bg-primary text-background
                                                            ${!hasSelectedSortFields && 'bg-muted text-muted-foreground cursor-not-allowed'}
                                                        `}
                                                    disabled={!hasSelectedSortFields}
                                                >
                                                    Save to this view
                                                </Button> */}
                                            </div>
                                            {/* Three column grid */}
                                            <div className={`grid ${hasSelectedSortFields ? 'grid-cols-3' : 'grid-cols-2'} divide-x`}>
                                                {/* Column 1: Default fields */}
                                                <div className="px-2 py-1">
                                                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Default fields</h4>
                                                    <div className="space-y-1">
                                                        {defaultColumns.map((field) => (
                                                            <div
                                                                key={field.id}
                                                                onClick={() => handleFieldSelection(field.id)}
                                                                className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                                                            >
                                                                <div
                                                                    // onClick={() => handleFieldSelection(field.id)}
                                                                    className={`
                                                                        w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer
                                                                        ${field.isSelected ? 'bg-primary border-primary' : 'border-input'}
                                                                    `}
                                                                >
                                                                    {field.isSelected && (
                                                                        <svg
                                                                            className="w-3 h-3 text-foreground"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="3"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        >
                                                                            <polyline points="20 6 9 17 4 12" />
                                                                        </svg>
                                                                    )}
                                                                </div>

                                                                <span className="text-xs font-medium text-primary">{field.fieldName}</span>
                                                                {/* </div> */}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Column 2: Custom fields */}
                                                <div className="px-2 py-1">
                                                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Custom fields</h4>
                                                    {dynamicColumns.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {dynamicColumns.map((field) => (
                                                                <div
                                                                    key={field.id}
                                                                    onClick={() => handleFieldSelection(field.id)}
                                                                    className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                                                                >
                                                                    {/* <div className="flex items-center gap-2"> */}
                                                                    <div
                                                                        className={`
                                                                            w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer
                                                                            ${field.isSelected ? 'bg-primary border-primary' : 'border-input'}
                                                                        `}
                                                                    >
                                                                        {field.isSelected && (
                                                                            <svg
                                                                                className="w-3 h-3 text-foreground"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="3"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                            >
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-medium text-primary">{field.fieldName}</span>
                                                                    {/* </div> */}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground py-2">No custom fields</p>
                                                    )}
                                                </div>

                                                {/* Column 3: My Sort */}
                                                {hasSelectedSortFields && (
                                                    <div className="px-2 py-1">
                                                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                                                            My Sort
                                                        </h4>

                                                        <div className="space-y-1">
                                                            <div className="flex flex-col gap-1 px-0">
                                                                {sortFields
                                                                    .filter(field => field.isSelected)
                                                                    .sort((a, b) => a.order - b.order)
                                                                    .map((field, index) => (
                                                                        <DraggableSortField
                                                                            key={field.id}
                                                                            field={field}
                                                                            index={index}
                                                                        />
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Footer with Clear all sort button */}
                                            {hasSelectedSortFields && (
                                                <div className="px-4 py-2 border-t">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={handleClearAllSort}
                                                        className="justify-start bg-muted text-foreground hover:bg-primary hover:text-primary-foreground text-xs"
                                                    >
                                                        Clear all sort
                                                    </Button>
                                                </div>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Filter Dropdown - Updated */}
                                    <DropdownMenu
                                        open={activeDropdown === 'filter'}
                                        onOpenChange={(open) => {
                                            setActiveDropdown(open ? 'filter' : null);
                                            if (open) setFilterAnchorEl(document.activeElement as HTMLElement);
                                        }}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                                                <Funnel className="h-4 w-4" />
                                                Filter
                                                {filterConfig.length > 0 && (
                                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                                        {filterConfig.length}
                                                    </span>
                                                )}
                                                {/* <ChevronDown className="h-4 w-4" /> */}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center" className="px-2 py-2 border-b-[5px] border-b-primary w-50 ">
                                            {/* Quick Filters */}
                                            <div className="space-y-1 mb-1 ">
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger
                                                        disabled={groupBy === 'assignee'}
                                                        className={cn(
                                                            "flex items-center justify-between text-xs",
                                                            groupBy === 'assignee' && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <span className="text-primary text-xs">Assignee</span>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent className="w-64 p-0">
                                                        <AssigneeDropdown
                                                            projectId={projectId}
                                                            currentAssignee={undefined}
                                                            onAssigneeChange={(userId) => {
                                                                if (userId) {
                                                                    setFilterConfig(prev => {
                                                                        const existing = prev.find(f => f.field === 'assignee');
                                                                        if (existing) return prev.map(f => f.field === 'assignee' ? { ...f, value: userId } : f);
                                                                        return [...prev, { id: Math.random().toString(36).substr(2, 9), field: 'assignee', condition: 'is', value: userId }];
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                {/* Priority Filter */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger
                                                        disabled={groupBy === 'priority'}
                                                        className={cn("flex items-center justify-between text-xs", groupBy === 'priority' && "opacity-50 cursor-not-allowed")}
                                                    >
                                                        <span className="text-primary text-xs">Priority</span>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent className="w-48 p-2">
                                                        {taskPriorityConfigs.map(cfg => (
                                                            <DropdownMenuItem
                                                                key={cfg._id}
                                                                onSelect={() => {
                                                                    setFilterConfig(prev => {
                                                                        const existing = prev.find(f => f.field === 'priority');
                                                                        if (existing) return prev.map(f => f.field === 'priority' ? { ...f, value: cfg.value } : f);
                                                                        return [...prev, { id: Math.random().toString(36).substr(2, 9), field: 'priority', condition: 'is', value: cfg.value }];
                                                                    });
                                                                }}
                                                                className="flex items-center gap-2 cursor-pointer text-xs"
                                                            >
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                                                <span className="text-xs font-medium">{cfg.label}</span>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                {/* Status Filter */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger
                                                        disabled={groupBy === 'status'}
                                                        className={cn("flex items-center justify-between text-xs", groupBy === 'status' && "opacity-50 cursor-not-allowed")}
                                                    >
                                                        <span className="text-primary text-xs">Status</span>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent className="w-48 p-2">
                                                        {taskStatusConfigs.map(cfg => (
                                                            <DropdownMenuItem
                                                                key={cfg._id}
                                                                onSelect={() => {
                                                                    setFilterConfig(prev => {
                                                                        const existing = prev.find(f => f.field === 'status');
                                                                        if (existing) return prev.map(f => f.field === 'status' ? { ...f, value: cfg.value } : f);
                                                                        return [...prev, { id: Math.random().toString(36).substr(2, 9), field: 'status', condition: 'is', value: cfg.value }];
                                                                    });
                                                                }}
                                                                className="flex items-center gap-2 cursor-pointer text-xs"
                                                            >
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                                                <span className="text-xs font-medium">{cfg.label}</span>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                {/* Due Date Filter */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger
                                                        disabled={groupBy === 'dueDate'}
                                                        className={cn("flex items-center justify-between text-xs", groupBy === 'dueDate' && "opacity-50 cursor-not-allowed")}
                                                    >
                                                        <span className="text-primary text-xs">Due Date</span>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    setFilterConfig(prev => {
                                                                        const existing = prev.find(f => f.field === 'dueDate');
                                                                        if (existing) return prev.map(f => f.field === 'dueDate' ? { ...f, value: date.toISOString() } : f);
                                                                        return [...prev, { id: Math.random().toString(36).substr(2, 9), field: 'dueDate', condition: 'date-equals', value: date.toISOString() }];
                                                                    });
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>


                                                {/* Labels Filter */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger
                                                        disabled={groupBy === 'labels'}
                                                        className={cn("flex items-center justify-between text-xs", groupBy === 'labels' && "opacity-50 cursor-not-allowed")}
                                                    >
                                                        <span className="text-primary text-xs">Labels</span>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent className="w-48 p-2">
                                                        {(currentWorkspace?.labels || []).map(label => (
                                                            <DropdownMenuItem
                                                                key={label.id || label.name}
                                                                onSelect={() => {
                                                                    setFilterConfig(prev => {
                                                                        const existing = prev.find(f => f.field === 'labels');
                                                                        const labelValue = label.id || label.name;
                                                                        if (existing) return prev.map(f => f.field === 'labels' ? { ...f, value: labelValue } : f);
                                                                        return [...prev, { id: Math.random().toString(36).substr(2, 9), field: 'labels', condition: 'contains', value: labelValue }];
                                                                    });
                                                                }}
                                                                className="flex items-center gap-2 cursor-pointer text-xs"
                                                            >
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                                                                <span className="text-xs font-medium">{label.name}</span>
                                                            </DropdownMenuItem>
                                                        ))}
                                                        {(!currentWorkspace?.labels || currentWorkspace.labels.length === 0) && (
                                                            <div className="text-xs text-muted-foreground text-center p-2">No labels found</div>
                                                        )}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                            </div>

                                            <Separator className="my-1 bg-border h-1" />

                                            <DropdownMenuItem
                                                className="text-xs cursor-pointer"
                                                onSelect={() => {
                                                    setShowAdvancedFilters(true);
                                                }}
                                            >
                                                <span className="text-primary text-xs">Advanced Filters</span>
                                            </DropdownMenuItem>

                                            {/* <DropdownMenuItem className="text-xs cursor-pointer" onSelect={() => { }}>
                                                <span className="text-primary text-xs">Saved Filters ({savedFilters.length})</span>
                                            </DropdownMenuItem> */}

                                            {filterConfig.length > 0 && (
                                                <>
                                                    <Separator className="my-3" />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full text-xs"
                                                        onClick={() => setFilterConfig([])}
                                                    >
                                                        Clear All Filters
                                                    </Button>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Freeze Fields Dropdown */}
                                    {/* <DropdownMenu
                                        open={activeDropdown === 'freeze'}
                                        onOpenChange={(open) => setActiveDropdown(open ? 'freeze' : null)}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                                                <Pin className="h-4 w-4" />
                                                Freeze Fields
                                                {columnConfigs.filter(c => c.columnFreezed).length > 0 && (
                                                    <span className="ml-0 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                                        {columnConfigs.filter(c => c.columnFreezed).length}
                                                    </span>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center" className="p-4 w-[400px] border-b-[5px] border-b-primary">
                                            <h3 className="text-sm font-bold text-primary">Choose Fields to Freeze</h3>
                                            <p className="text-xs font-medium text-muted-foreground mb-3">
                                                Freeze fields to keep them fixed in project view
                                            </p>

                                            <div className="overflow-x-auto pb-2">
                                                <div className="grid grid-flow-col auto-cols-max grid-rows-5 gap-x-2">
                                                    {columnConfigs
                                                        .filter(col => !col.isSystemColumn)
                                                        .sort((a, b) => a.columnOrder - b.columnOrder)
                                                        .map((column) => (
                                                            <div
                                                                key={column.id}
                                                                onClick={() => handleFreezeToggle(column.id)}
                                                                className="flex items-center justify-between px-1 py-1.5 hover:bg-muted rounded cursor-pointer min-w-[180px]"
                                                            >
                                                                <Label className="text-xs cursor-pointer flex-1 truncate text-primary">
                                                                    {column.fieldName}
                                                                </Label>
                                                                {column.columnFreezed ? (
                                                                    <Pin className="h-4 w-4 text-primary -rotate-315 shrink-0" />
                                                                ) : (
                                                                    <Pin className="h-4 w-4 text-muted-foreground -rotate-315 shrink-0" />
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>


                                            {columnConfigs.some(c => c.columnFreezed) && (
                                                <>
                                                    <Separator className="my-3" />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full text-xs"
                                                        onClick={() => {
                                                            columnConfigs.forEach(col => toggleColumnFreeze(col.id, false));
                                                        }}
                                                    >
                                                        Unfreeze All
                                                    </Button>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu> */}

                                    {/* 
                                    Hide Fields Dropdown (Commented out as per request)
                                    <DropdownMenu
                                        open={activeDropdown === 'hide'}
                                        onOpenChange={(open) => setActiveDropdown(open ? 'hide' : null)}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                                                <EyeOff className="h-4 w-4" />
                                                Hide Fields
                                                {columnConfigs.filter(c => !c.pinned).length > 0 && (
                                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                                        {columnConfigs.filter(c => !c.pinned).length}
                                                    </span>
                                                )}
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center" className="px-4 py-3 border-b-[5px] border-b-primary">
                                            <h3 className="text-sm font-semibold text-primary">Choose Fields to Hide</h3>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Hide fields you don't want to see in Project view
                                            </p>

                                            Select All / Deselect All
                                            <div className="flex p-2 mb-2 items-center gap-2 border-b bg-muted rounded">
                                                <Checkbox
                                                    id="hide-select-all"
                                                    checked={
                                                        columnConfigs
                                                            .filter(col => col.id !== "task")
                                                            .every(c => !c.pinned)}
                                                    onCheckedChange={(checked) => {
                                                        // Toggle all fields
                                                        columnConfigs
                                                            .filter(col => col.id !== "task")
                                                            .forEach(col => {
                                                                if (checked) {
                                                                    // Hide all (set pinned to false)
                                                                    if (col.pinned) toggleColumnVisibility(col.id);
                                                                } else {
                                                                    // Show all (set pinned to true)
                                                                    if (!col.pinned) toggleColumnVisibility(col.id);
                                                                }
                                                            });
                                                    }}
                                                    className="h-4 w-4 border-input"
                                                />
                                                <Label htmlFor="hide-select-all" className="text-xs cursor-pointer font-medium text-primary">
                                                    {columnConfigs.every(c => c.pinned) ? 'Hide All' : 'Show All'}
                                                    Select All
                                                </Label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-20 mb-2">
                                                Default Columns
                                                <div>
                                                    <h4 className="text-sm font-semibold text-muted-foreground px-2 mb-1">
                                                        Default Columns
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {columnConfigs
                                                            .filter(col => ['status', 'assignee', 'date', 'priority'].includes(col.id))
                                                            .sort((a, b) => a.columnOrder - b.columnOrder)
                                                            .map((column) => (
                                                                <div
                                                                    key={column.id}
                                                                    className="flex items-center px-2 py-1 gap-2 hover:bg-muted rounded"
                                                                >
                                                                    <Checkbox
                                                                        id={`hide-${column.id}`}
                                                                        checked={!column.pinned}
                                                                        onCheckedChange={() => toggleColumnVisibility(column.id)}
                                                                        className="h-4 w-4 border-input"
                                                                    />
                                                                    <Label
                                                                        htmlFor={`hide-${column.id}`}
                                                                        className="text-xs cursor-pointer flex items-center gap-2 text-primary"
                                                                    >
                                                                        {column.fieldName}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>

                                                Custom Columns
                                                <div>
                                                    <h4 className="text-sm font-semibold text-muted-foreground px-2 mb-1">
                                                        Custom Columns
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {columnConfigs
                                                            .filter(col =>
                                                                !['drag', 'checkbox', 'id', 'task', 'status', 'assignee', 'startDate', 'endDate', 'priority'].includes(col.id)
                                                            )
                                                            .sort((a, b) => a.columnOrder - b.columnOrder)
                                                            .map((column) => (
                                                                <div
                                                                    key={column.id}
                                                                    className="flex items-center px-2 py-1 gap-2 hover:bg-muted rounded"
                                                                >
                                                                    <Checkbox
                                                                        id={`hide-${column.id}`}
                                                                        checked={!column.pinned}
                                                                        onCheckedChange={() => toggleColumnVisibility(column.id)}
                                                                        className="h-4 w-4 border-input"
                                                                    />
                                                                    <Label
                                                                        htmlFor={`hide-${column.id}`}
                                                                        className="text-xs cursor-pointer flex items-center gap-2 text-primary"
                                                                    >
                                                                        {column.fieldName}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator className="my-2 bg-border h-3" />

                                            Save to View Button
                                            <Button
                                                size="sm"
                                                disabled={!hasHiddenColumns}
                                                className={cn(
                                                    "w-full transition-colors duration-200",
                                                    hasHiddenColumns
                                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                        : "bg-muted border-input border-2 text-muted-foreground cursor-not-allowed"
                                                )}
                                            >
                                                Save to this View
                                            </Button>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    */}

                                    {/* Display Dropdown */}
                                    <DropdownMenu
                                        open={activeDropdown === 'display'}
                                        onOpenChange={(open) => setActiveDropdown(open ? 'display' : null)}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                                                <Monitor className="h-4 w-4" />
                                                Display
                                                {/* <ChevronDown className="h-4 w-4" /> */}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-64 px-4 py-2 border-b-[5px] border-b-primary">
                                            {/* Collapsed Subtasks */}
                                            <div className="flex items-center justify-between py-2">
                                                <Label htmlFor="collapsed-subtasks" className="text-xs cursor-pointer text-primary">
                                                    Collapsed Subtasks
                                                </Label>
                                                <Switch
                                                    id="collapsed-subtasks"
                                                    checked={displayOptions.collapsedSubtasks}
                                                    onCheckedChange={(checked) =>
                                                        setDisplayOptions(prev => ({ ...prev, collapsedSubtasks: !!checked }))
                                                    }
                                                />
                                            </div>

                                            {/* Closed Tasks */}
                                            <div className="flex items-center justify-between py-2">
                                                <Label htmlFor="closed-tasks" className="text-xs cursor-pointer text-primary">
                                                    Closed Tasks
                                                </Label>
                                                <Switch
                                                    id="closed-tasks"
                                                    checked={displayOptions.closedTasks}
                                                    onCheckedChange={(checked) =>
                                                        setDisplayOptions(prev => ({ ...prev, closedTasks: !!checked }))
                                                    }
                                                />
                                            </div>

                                            {/* Wrap Text */}
                                            <div className="flex items-center justify-between py-2">
                                                <Label htmlFor="wrap-text" className="text-xs cursor-pointer text-primary">
                                                    Wrap Text
                                                </Label>
                                                <Switch
                                                    id="wrap-text"
                                                    checked={displayOptions.wrapText}
                                                    onCheckedChange={(checked) =>
                                                        setDisplayOptions(prev => ({ ...prev, wrapText: !!checked }))
                                                    }
                                                />
                                            </div>

                                            {/* Subtask Parent ID */}
                                            <div className="flex items-center justify-between py-2">
                                                <Label htmlFor="subtask-parent-id" className="text-xs cursor-pointer text-primary">
                                                    Subtask parent ID
                                                </Label>
                                                <Switch
                                                    id="subtask-parent-id"
                                                    checked={displayOptions.subtaskParentId}
                                                    onCheckedChange={(checked) =>
                                                        setDisplayOptions(prev => ({ ...prev, subtaskParentId: !!checked }))
                                                    }
                                                />
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        {/* Hide groups dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm" className="gap-2 rounded text-xs">
                                    <EyeOff className="h-4 w-4" />
                                    {/* AFTER — count manual hidden + empty-hidden (deduplicated) */}
                                    {(() => {
                                        const hiddenSet = new Set(
                                            hideEmptyGroups ? emptyGroupIds.filter(id => !emptyGroupExceptions.has(id)) : []
                                        );

                                        dynamicGroups.forEach(g => {
                                            // Count manually hidden groups for the current grouping
                                            if (hiddenGroups.has(g.id)) {
                                                hiddenSet.add(g.id);
                                            }
                                            // Include 'done' group if grouped by status and closedTasks is enabled
                                            if (displayOptions.closedTasks && groupBy === 'status') {
                                                const cfg = taskStatusConfigs.find(c => c._id === g.id);
                                                if (cfg && cfg.value === 'done') {
                                                    hiddenSet.add(g.id);
                                                }
                                            }
                                        });

                                        const totalHidden = hiddenSet.size;
                                        return totalHidden > 0 ? (
                                            <span className="ml-1 px-2 py-1 text-xs bg-brand-orange text-foreground rounded-full">
                                                {totalHidden}
                                            </span>
                                        ) : null;
                                    })()}
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-3 border-b-[5px] border-b-primary">
                                <h3 className="text-sm font-semibold mb-3">Unhide Group</h3>

                                {(() => {
                                    const manuallyHidden = dynamicGroups.filter(g => hiddenGroups.has(g.id));
                                    const emptyHidden = hideEmptyGroups
                                        ? dynamicGroups.filter(g =>
                                            emptyGroupIds.includes(g.id) &&
                                            !hiddenGroups.has(g.id) &&
                                            !emptyGroupExceptions.has(g.id)  // ← exclude already-unhidden ones
                                        )
                                        : [];

                                    const doneHidden = displayOptions.closedTasks && groupBy === 'status'
                                        ? dynamicGroups.filter(g => {
                                            const cfg = taskStatusConfigs.find(c => c._id === g.id);
                                            return cfg && cfg.value === 'done';
                                        })
                                        : [];

                                    const doneHiddenIds = new Set(doneHidden.map(g => g.id));
                                    const uniqueEmptyHidden = emptyHidden.filter(g => !doneHiddenIds.has(g.id));
                                    const uniqueManuallyHidden = manuallyHidden.filter(g => !doneHiddenIds.has(g.id));

                                    const allHiddenGroups = [...uniqueManuallyHidden, ...uniqueEmptyHidden, ...doneHidden];

                                    return allHiddenGroups.length === 0 ? (
                                        <p className="text-xs text-muted-foreground py-2">No hidden groups</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {allHiddenGroups.map(group => (
                                                <button
                                                    key={group.id}
                                                    onClick={() => {
                                                        let handled = false;
                                                        if (doneHiddenIds.has(group.id)) {
                                                            setDisplayOptions(prev => ({ ...prev, closedTasks: false }));
                                                            handled = true;
                                                        }
                                                        if (hiddenGroups.has(group.id)) {
                                                            // Manually hidden group — remove from manual hide set
                                                            toggleHiddenGroup(group.id);
                                                            handled = true;
                                                        }

                                                        if (!handled) {
                                                            // Empty-hidden group — add to exceptions so only THIS one shows
                                                            setEmptyGroupExceptions(prev => {
                                                                const next = new Set(prev);
                                                                next.add(group.id);

                                                                // If ALL empty groups are now excepted, the toggle has no effect left.
                                                                // Reset both — so Group Actions label flips back to "Hide empty groups"
                                                                const allExcepted = emptyGroupIds.every(id => next.has(id));
                                                                if (allExcepted) {
                                                                    setHideEmptyGroups(false);
                                                                    return new Set(); // clear exceptions too
                                                                }

                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-between p-2 rounded hover:bg-muted text-xs"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: group.color || '#6366f1' }}
                                                        />
                                                        <span>{group.name}</span>
                                                    </div>
                                                    <span className="text-xs text-blue-600 font-medium">Unhide</span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Groups and Tables */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {dynamicGroups
                        // FIX: manual per-group hide (via "Hide Group" context menu)
                        .filter(group => !hiddenGroups.has(group.id))
                        // Hide "done" group if closedTasks is enabled
                        .filter(group => {
                            if (displayOptions.closedTasks && groupBy === 'status') {
                                const cfg = taskStatusConfigs.find(c => c._id === group.id);
                                if (cfg && cfg.value === 'done') return false;
                            }
                            return true;
                        })
                        // FIX: global hide-empty toggle (via Group Actions menu)
                        .filter((group: DynamicGroup) => {
                            if (!hideEmptyGroups) return true;
                            if (emptyGroupExceptions.has(group.id)) return true;
                            let projectTasks = tasks.filter(t => t.projectId === projectId);
                            if (displayOptions.closedTasks) {
                                projectTasks = projectTasks.filter(t => !t.completed && t.status !== 'done');
                            }
                            let count = 0;
                            if (groupBy === 'status') {
                                if (group.isUntitled) return projectTasks.length > 0;
                                const cfg = taskStatusConfigs.find(c => c._id === group.id);
                                count = cfg ? projectTasks.filter(t => t.status === cfg.value).length : 0;
                            } else if (groupBy === 'assignee') {
                                count = group.id === 'unassigned'
                                    ? projectTasks.filter(t => !t.assignee).length
                                    : projectTasks.filter(t => t.assignee === group.name).length;
                            } else if (groupBy === 'priority') {
                                if (group.isUntitled) { count = projectTasks.filter(t => !t.priority).length; }
                                else {
                                    const pId = group.id.replace('priority-', '');
                                    const pCfg = taskPriorityConfigs.find(p => p._id === pId);
                                    count = pCfg ? projectTasks.filter(t => t.priority === pCfg.value).length : 0;
                                }
                            } else if (groupBy === 'dueDate') {
                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                if (group.id === 'date-overdue') count = projectTasks.filter(t => { if (!t.endDate) return false; const d = new Date(t.endDate); d.setHours(0, 0, 0, 0); return d < today; }).length;
                                else if (group.id === 'date-today') count = projectTasks.filter(t => { if (!t.endDate) return false; const d = new Date(t.endDate); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime(); }).length;
                                else if (group.id === 'date-upcoming') count = projectTasks.filter(t => { if (!t.endDate) return false; const d = new Date(t.endDate); d.setHours(0, 0, 0, 0); return d > today; }).length;
                                else if (group.id === 'date-no-date') count = projectTasks.filter(t => !t.endDate).length;
                            } else if (groupBy?.startsWith('custom-')) {
                                const fieldId = groupBy.replace('custom-', '');
                                count = group.name === 'No Value'
                                    ? projectTasks.filter(t => !t.customFieldValues?.[fieldId]).length
                                    : projectTasks.filter(t => t.customFieldValues?.[fieldId] === group.name).length;
                            } else {
                                count = projectTasks.length;
                            }
                            return count > 0;
                        })
                        .map((group) => (
                            <TaskGroup
                                key={group.id}
                                group={group}
                                projectId={projectId}
                                hideFields={hideFields}
                                groupBy={groupBy}
                                activeSortConfig={getActiveSortConfig()}
                                onSortChange={handleColumnSort}
                                sortConfig={getActiveSortConfig()}
                                filterBlock={getActiveFilterConfig()}
                                columnConfigs={columnConfigs}
                                displayOptions={displayOptions}
                                onAddNewGroup={() => setIsAddingNewGroup(true)}
                                isCollapsed={collapsedGroups.has(group.id)}
                                onToggleCollapse={() => toggleGroupCollapse(group.id)}
                                onHideGroup={toggleHiddenGroup}
                                onSelectionChange={(ids) => handleSelectionChange(group.id, ids)}
                                clearSelection={shouldClearSelection}
                            />
                        ))}

                    {/* Add New Group Button */}
                    {canAddGroup && (
                        <div className="flex items-center gap-2 w-2xs transition-colors">
                            {isAddingNewGroup ? (
                                <>
                                    <input
                                        ref={newGroupInputRef}
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder={`New ${groupBy === 'status' ? 'status' : groupBy === 'priority' ? 'priority' : 'option'} name`}
                                        className="h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddNewGroup();
                                            if (e.key === 'Escape') {
                                                setIsAddingNewGroup(false);
                                                setNewGroupName('');
                                            }
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleAddNewGroup}
                                        className="bg-primary text-background"
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setIsAddingNewGroup(false);
                                            setNewGroupName('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="rounded-none text-background bg-primary flex items-center gap-1 cursor-pointer"
                                    onClick={() => setIsAddingNewGroup(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add {groupBy === 'status' ? 'Status' : groupBy === 'priority' ? 'Priority' : 'Option'}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Advanced Filters Dialog */}
                    {showAdvancedFilters && (
                        <AdvancedFiltersNew
                            open={showAdvancedFilters}
                            onClose={() => setShowAdvancedFilters(false)}
                            onApply={(filterBlock: FilterBlock) => {
                                setFilterConfig(filterBlock.children);
                                setShowAdvancedFilters(false);
                            }}
                            currentFilterBlock={getActiveFilterConfig()}
                            projectId={projectId}
                            groupBy={groupBy}
                        />
                    )}

                    {/* Add Project Invite Dialog */}
                    <ProjectInviteDialog
                        open={isInviteDialogOpen}
                        onClose={() => setIsInviteDialogOpen(false)}
                        projectId={projectId}
                        projectName={project?.name || ""}
                        onSendInvite={handleSendInvite}
                    />
                </div>
            </div>
            <BulkActionToolbar
                selectedCount={selectedTaskIds.length}
                taskTypes={taskTypes.map(t => ({ value: t.value, label: t.label }))}
                statusOptions={taskStatusConfigs.map(c => ({
                    value: c.value,
                    label: c.label,
                    color: c.color,
                }))}
                priorityOptions={taskPriorityConfigs.map(p => ({
                    value: p.value,
                    label: p.label,
                    color: p.color,
                }))}
                members={members.map(m => ({
                    id: m.id,
                    name: m.name,
                    avatar: m.avatar,
                }))}
                onDuplicate={handleBulkDuplicate}
                onExport={handleBulkExport}
                onConvertTo={handleBulkConvertTo}
                eligibleForSubtaskConversion={eligibleForSubtaskConversion}
                onConvertToSubtask={handleBulkConvertToSubtask}
                onPriority={handleBulkPriority}
                onStatus={handleBulkStatus}
                onAssignee={handleBulkAssignee}
                onDelete={handleBulkDelete}
                onClearSelection={clearAllSelections}
            />
            {bulkDuplicateQueue.length > 0 && (() => {
                const task = tasks.find(t => t.id === bulkDuplicateQueue[bulkDuplicateIndex]);
                if (!task) return null;
                return (
                    <DuplicateTaskDialog
                        key={task.id}
                        open={bulkDuplicateDialogOpen}
                        onClose={() => {
                            setBulkDuplicateDialogOpen(false);
                            setBulkDuplicateQueue([]);
                            setBulkDuplicateIndex(0);
                        }}
                        originalTaskName={task.name}
                        task={task}
                        title={
                            bulkDuplicateQueue.length > 1
                                ? `Duplicate task (${bulkDuplicateIndex + 1}/${bulkDuplicateQueue.length})`
                                : "Duplicate task"
                        }
                        onDuplicate={handleBulkDuplicateConfirm}
                    />
                );
            })()}
            {bulkConvertSubtaskQueue.length > 0 && (
                <ConvertToSubtaskDialog
                    open={bulkConvertSubtaskQueue.length > 0}
                    onClose={() => {
                        setBulkConvertSubtaskQueue([]);
                        setBulkConvertSubtaskIndex(0);
                    }}
                    taskToConvert={
                        tasks.find(t => t.id === bulkConvertSubtaskQueue[bulkConvertSubtaskIndex]) ?? null
                    }
                    availableTasks={tasks.filter(t => t.projectId === projectId)}
                    members={members.map(m => ({ userId: m.id, name: m.name }))}
                    priorityConfigs={taskPriorityConfigs}
                    workspaceName={currentWorkspace?.name ?? "Workspace"}
                    projectName={project?.name ?? "Project"}
                    onConfirm={handleBulkConvertSubtaskConfirm}
                />
            )}
            <DeleteTaskModal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmBulkDelete}
                count={selectedTaskIds.length}
            />
        </DndProvider>
    );
}