// components/projects/views/kanban-view/KanbanView.tsx
"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type DragEndEvent,
} from "@/components/ui/shadcn-io/kanban";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useTasksStore } from "@/stores/tasks-store";
import { useKanbanSettingsStore } from "@/stores/kanban-settings-store";
import { CustomKanbanCard } from "@/components/projects/views/kanban-view/KanbanCard";
import { KanbanSettingsDropdown } from "@/components/projects/views/kanban-view/KanbanSettingsDropdown";
import { Eye, MoreHorizontalIcon, Plus } from "lucide-react";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Users,
  Layers,
  SlidersVertical,
  EyeOff,
  ChevronDown,
  Calendar,
  MessageSquare,
  UserPlus2,
  Flag,
  Pencil,
  Palette,
  Copy,
  Trash2,
  Settings,
  Check,
  X,
  LogOut,
  FolderUp,
  CheckCheck,
  Archive,
  Clock,
  User,
  Pin,
  Monitor,
  Funnel,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowDown01,
  ArrowDown10,
  ArrowDownAZ,
  ArrowDownZA,
  GripVertical,
} from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";
import ProjectMembersSection from "@/components/projects/ProjectMembersSection";
import { TaskDetailView } from "@/components/projects/TaskDetailView";
import { cn } from "@/lib/utils";
import { SubtaskKanbanCard } from "@/components/projects/views/kanban-view/SubtaskKanbanCard";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatLocalDate,
  convertSelectedDateToUTC,
} from "@/utils/timezone-utils";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  getTaskTypeIcon,
  getTaskTypeIconColor,
  getDefaultTaskTypeIcon,
} from "@/stores/projects-store";

import AdvancedFiltersNew, {
  FilterCriteria,
} from "../list-view/filters/AdvancedFiltersNew";
import AssigneeDropdown from "../list-view/filters/AssigneeDropdown";

type GroupByOption =
  | "status"
  | "assignee"
  | "priority"
  | "dueDate"
  | "none"
  | string;

interface DynamicGroup {
  id: string;
  name: string;
  projectId: string;
  order: number;
  color?: string;
  isUntitled?: boolean;
  optionId?: string;
  memberId?: string;
  fieldId?: string;
}

type KanbanTask = {
  id: string;
  name: string;
  column: string;
  startDate?: string;
  endDate?: string;
  assignee?: string;
  taskId?: string; // For subtasks, reference to parent task
};

type KanbanColumn = {
  id: string;
  name: string;
  color: string;
};

interface KanbanViewProps {
  projectId: string;
  initialGroupBy?: string;
  initialFilters?: FilterCriteria[];
}

interface SortField {
  id: string;
  fieldName: string;
  fieldType: string;
  isSelected: boolean;
  direction: "asc" | "desc" | null;
  order: number;
}

const KanbanView = ({
  projectId,
  initialGroupBy,
  initialFilters,
}: KanbanViewProps) => {
  const {
    tasks,
    getTasksByProject,
    fetchTasks,
    updateTask,
    addTask,
    subtasks,
    addSubtask,
    updateSubtask,
  } = useTasksStore();
  const { getSettings, hideColumn } = useKanbanSettingsStore();
  const settings = getSettings(projectId);

  const {
    projects,
    addMembersToProject,
    removeMembersFromProject,
    getTaskStatusConfigs,
    addTaskStatusConfig,
    updateTaskStatusConfig,
    deleteTaskStatusConfig,
  } = useProjectsStore();

  const project = projects.find((p) => p.id === projectId);
  const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
  const members = workspaceMembers.filter((wm) =>
    project?.members?.some((pm) => pm.userId === wm.userId),
  );
  const taskPriorityConfigs = useProjectsStore((state) =>
    state.getTaskPriorityConfigs(projectId),
  );
  // const taskTypes = useProjectsStore(state => state.getTaskTypesByProject(projectId));

  useEffect(() => {
    if (!projectId) return;

    // Only fetch if tasks aren't already loaded for this project
    const existingTasks = getTasksByProject(projectId); // from store
    if (existingTasks.length === 0) {
      fetchTasks(projectId).catch((error) => {
        console.error("Failed to load tasks:", error);
      });
    }
  }, [projectId]);

  // Get project-specific data
  const taskStatusConfigs = getTaskStatusConfigs(projectId);

  // ✅ Add state for members popover
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Add state for creating new group
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // State for adding new tasks
  const [addingTaskInColumn, setAddingTaskInColumn] = useState<string | null>(
    null,
  );
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskData, setNewTaskData] = useState({
    assignee: "" as string,
    startDate: new Date() as Date | undefined,
    endDate: undefined as Date | undefined,
    priority: "" as string,
  });

  // State for adding new subtasks
  const [addingSubtaskToTask, setAddingSubtaskToTask] = useState<string | null>(
    null,
  );
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newSubtaskData, setNewSubtaskData] = useState({
    assignee: "" as string,
    startDate: new Date() as Date | undefined,
    endDate: undefined as Date | undefined,
    priority: "" as string,
  });

  // ✅ State for inline editing column name
  const [editingColumnName, setEditingColumnName] = useState<string | null>(
    null,
  );
  const [editedColumnName, setEditedColumnName] = useState("");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Group By state
  const [groupBy, setGroupBy] = useState<GroupByOption>(
    initialGroupBy || "status",
  );
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);
  const [previouslyUsedGroupBy, setPreviouslyUsedGroupBy] = useState<
    { option: GroupByOption; date: string }[]
  >([]);
  const [showAllGroupOptions, setShowAllGroupOptions] = useState(false);

  const { getTaskCustomFields } = useProjectsStore();
  const customFields = getTaskCustomFields(projectId);

  // Sort & Filter state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sortFields, setSortFields] = useState<SortField[]>([]);
  const [filterConfig, setFilterConfig] = useState<FilterCriteria[]>(
    initialFilters || [],
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const [displayOptions, setDisplayOptions] = useState({
    collapsedSubtasks: false,
    closedTasks: true,
    wrapText: true,
    subtaskParentId: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to convert FilterCriteria[] to FilterBlock for AdvancedFiltersNew
  const getActiveFilterConfig = useCallback((): any => {
    return {
      id: "root",
      operator: "AND",
      children: filterConfig,
    };
  }, [filterConfig]);

  // Initialize sort fields
  // Initialize sort fields
  useEffect(() => {
    const defaultFields: SortField[] = [
      {
        id: "id",
        fieldName: "ID",
        fieldType: "number",
        isSelected: false,
        direction: null,
        order: 0,
      },
      {
        id: "task",
        fieldName: "Task",
        fieldType: "text",
        isSelected: false,
        direction: null,
        order: 0,
      },
      {
        id: "taskType",
        fieldName: "Task Type",
        fieldType: "text",
        isSelected: false,
        direction: null,
        order: 0,
      },
      {
        id: "status",
        fieldName: "Status",
        fieldType: "text",
        isSelected: false,
        direction: null,
        order: 0,
      },
      {
        id: "priority",
        fieldName: "Priority",
        fieldType: "text",
        isSelected: false,
        direction: null,
        order: 0,
      },
      {
        id: "startDate",
        fieldName: "Start Date",
        fieldType: "date",
        isSelected: false,
        direction: null,
        order: 0,
      },
      {
        id: "endDate",
        fieldName: "Due Date",
        fieldType: "date",
        isSelected: false,
        direction: null,
        order: 0,
      },
      {
        id: "assignee",
        fieldName: "Assignee",
        fieldType: "text",
        isSelected: false,
        direction: null,
        order: 0,
      },
    ];

    const mappedCustomFields: SortField[] = customFields.map((field) => ({
      id: field.id,
      fieldName: field.name,
      fieldType:
        field.type === "number"
          ? "number"
          : field.type === "date"
            ? "date"
            : "text",
      isSelected: false,
      direction: null,
      order: 0,
    }));

    const allAvailableFields = [...defaultFields, ...mappedCustomFields];

    setSortFields((prev) => {
      // Preserve existing sort settings for fields that still exist
      return allAvailableFields.map((field) => {
        const existing = prev.find((p) => p.id === field.id);
        if (existing) return existing;
        return field;
      });
    });
  }, [customFields]);

  const handleFieldSelection = (fieldId: string) => {
    setSortFields((prev) => {
      const updatedFields = prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              isSelected: !field.isSelected,
              direction: !field.isSelected ? ("asc" as const) : null,
            }
          : { ...field },
      );

      const selectedFields = updatedFields.filter((f) => f.isSelected);
      selectedFields.forEach((field, index) => {
        field.order = index;
      });

      return updatedFields;
    });
  };

  const handleDirectionSelection = (
    fieldId: string,
    direction: "asc" | "desc",
  ) => {
    setSortFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              direction,
            }
          : field,
      ),
    );
  };

  const handleClearAllSort = () => {
    setSortFields((prev) =>
      prev.map((field) => ({
        ...field,
        isSelected: false,
        direction: null,
        order: 0,
      })),
    );
  };

  const moveSortField = useCallback((dragIndex: number, hoverIndex: number) => {
    setSortFields((prev) => {
      const selected = prev.filter((f) => f.isSelected);
      const unselected = prev.filter((f) => !f.isSelected);
      const draggedField = selected[dragIndex];
      const newSelected = [...selected];
      newSelected.splice(dragIndex, 1);
      newSelected.splice(hoverIndex, 0, draggedField);

      newSelected.forEach((f, idx) => (f.order = idx));
      return [...newSelected, ...unselected.map((f) => ({ ...f, order: 0 }))];
    });
  }, []);

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
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => handleDirectionSelection(field.id, "asc")}
          disabled={!isSelected}
          className={`p-1 rounded hover:bg-muted ${
            direction === "asc"
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          } ${!isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {icons.asc}
        </button>
        <button
          onClick={() => handleDirectionSelection(field.id, "desc")}
          disabled={!isSelected}
          className={`p-1 rounded hover:bg-muted ${
            direction === "desc"
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          } ${!isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {icons.desc}
        </button>
      </div>
    );
  };

  const hasSelectedSortFields = sortFields.some((field) => field.isSelected);

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

    dragRef(dropRef(ref));

    return (
      <div
        ref={ref}
        className="grid grid-cols-[20px_1fr_20px] items-center px-2 py-1 mr-3 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="text-xs font-medium text-primary">
          {field.fieldName}
        </span>
        {getSortIcon(field)}
      </div>
    );
  };

  const groupByOptions = useMemo(() => {
    const defaultOptions = [
      {
        label: "Status",
        value: "status",
        icon: <Layers className="h-4 w-4" />,
      },
      {
        label: "Assignee",
        value: "assignee",
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Priority",
        value: "priority",
        icon: <Flag className="h-4 w-4" />,
      },
      {
        label: "Due Date",
        value: "dueDate",
        icon: <Calendar className="h-4 w-4" />,
      },
      { label: "None", value: "none", icon: <Layers className="h-4 w-4" /> },
    ];

    const customOptions: any[] = [];
    /* const customOptions = customFields
      .filter(f => f.type === 'select-one' || f.type === 'select-many')
      .map(f => ({
        label: f.name,
        value: `custom-${f.id}`,
        icon: <SlidersVertical className="h-4 w-4" />,
      })); */

    return [...defaultOptions, ...customOptions];
  }, [customFields]);

  const displayedOptions = showAllGroupOptions
    ? groupByOptions
    : groupByOptions.filter(
        (opt) =>
          ["status", "assignee", "priority", "dueDate", "none"].includes(
            opt.value,
          ) || previouslyUsedGroupBy.some((prev) => prev.option === opt.value),
      );

  const handleGroupByChange = (option: GroupByOption) => {
    setGroupBy(option);
    setShowGroupByDropdown(false);

    // Update previously used groups
    setPreviouslyUsedGroupBy((prev) => {
      const filtered = prev.filter((p) => p.option !== option);
      const newEntry = {
        option,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
      };
      return [newEntry, ...filtered].slice(0, 5);
    });
  };

  const handleRemovePreviouslyUsed = (option: GroupByOption) => {
    setPreviouslyUsedGroupBy((prev) => prev.filter((p) => p.option !== option));
  };

  const allOptions = groupByOptions;
  const remainingCount = allOptions.length - displayedOptions.length;

  // Color options for status
  const colorOptions = [
    { name: "Gray", value: "#6B7280" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Red", value: "#EF4444" },
    { name: "Pink", value: "#EC4899" },
    { name: "Yellow", value: "#EAB308" },
  ];

  // Helper for filtering
  const getFieldValueForFilter = (task: any, fieldId: string): any => {
    if (fieldId === "id") return task.taskNumber;
    if (fieldId === "task" || fieldId === "name") return task.name;
    if (fieldId === "taskType") return task.taskType;
    if (fieldId === "status") return task.status;
    if (fieldId === "priority") return task.priority;
    if (fieldId === "assignee") return task.assignee;
    if (fieldId === "startDate") return task.startDate;
    if (fieldId === "endDate" || fieldId === "dueDate") return task.endDate;
    if (fieldId === "labels") {
      const labelIds = task.labelIds || [];
      const labels = task.labels || [];
      const idsFromLabels = (labels as any[]).map((l) =>
        typeof l === "string" ? l : l.id || l.name,
      );
      return [...labelIds, ...idsFromLabels];
    }

    if (task.customFieldValues && task.customFieldValues[fieldId]) {
      return task.customFieldValues[fieldId];
    }
    return null;
  };

  const matchesFilterCriteria = (
    task: any,
    criteria: FilterCriteria,
  ): boolean => {
    const fieldValue = getFieldValueForFilter(task, criteria.field);
    const filterValue = criteria.value;

    switch (criteria.condition) {
      case "is":
        return fieldValue === filterValue;
      case "is-not":
        return fieldValue !== filterValue;
      case "contains":
        if (Array.isArray(fieldValue)) {
          return fieldValue.some(
            (val) =>
              String(val).toLowerCase() ===
              String(filterValue || "").toLowerCase(),
          );
        }
        return String(fieldValue || "")
          .toLowerCase()
          .includes(String(filterValue || "").toLowerCase());
      case "does-not-contain":
        if (Array.isArray(fieldValue)) {
          return !fieldValue.some(
            (val) =>
              String(val).toLowerCase() ===
              String(filterValue || "").toLowerCase(),
          );
        }
        return !String(fieldValue || "")
          .toLowerCase()
          .includes(String(filterValue || "").toLowerCase());
      case "is-empty":
        return (
          !fieldValue ||
          fieldValue === "" ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      case "is-not-empty":
        return (
          !!fieldValue &&
          fieldValue !== "" &&
          (!Array.isArray(fieldValue) || fieldValue.length > 0)
        );

      // Date conditions
      case "date-equals": {
        if (!fieldValue || !filterValue) return false;
        return (
          new Date(fieldValue).toDateString() ===
          new Date(filterValue).toDateString()
        );
      }
      case "date-is-today": {
        if (!fieldValue) return false;
        return (
          new Date(fieldValue).toDateString() === new Date().toDateString()
        );
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
        return (
          taskDate.getMonth() === today.getMonth() &&
          taskDate.getFullYear() === today.getFullYear()
        );
      }
      case "date-is-before":
        return fieldValue && new Date(fieldValue) < new Date(filterValue);
      case "date-is-after":
        return fieldValue && new Date(fieldValue) > new Date(filterValue);
      case "date-is-between": {
        if (!fieldValue || !filterValue) return false;
        const [start, end] = String(filterValue).split(" - ");
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

  // Filter tasks by project and initialFilters
  const projectTasks = useMemo(() => {
    // Filter by project and exclude subtasks (subtasks are rendered inside parent cards)
    let filtered = tasks.filter(
      (task) => task.projectId === projectId && !task.parentTaskId,
    );

    // Apply Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          String(task.taskNumber || "")
            .toLowerCase()
            .includes(query),
      );
    }

    // Filter closed tasks if enabled
    if (displayOptions.closedTasks) {
      filtered = filtered.filter(
        (task) => task.status !== "done" && !task.completed,
      );
    }

    if (filterConfig && filterConfig.length > 0) {
      filtered = filtered.filter((task) =>
        filterConfig.every((criteria) => matchesFilterCriteria(task, criteria)),
      );
    }

    // Apply Sorting
    const activeSorts = sortFields
      .filter((f) => f.isSelected && f.direction)
      .sort((a, b) => a.order - b.order);

    if (activeSorts.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of activeSorts) {
          const valA = getFieldValueForFilter(a, sort.id);
          const valB = getFieldValueForFilter(b, sort.id);

          if (valA === valB) continue;

          // Handle nulls
          if (valA == null || valA === "") return 1;
          if (valB == null || valB === "") return -1;

          let comparison = 0;
          if (sort.fieldType === "date") {
            const dateA = new Date(valA).getTime();
            const dateB = new Date(valB).getTime();
            comparison = dateA - dateB;
          } else if (sort.fieldType === "number") {
            comparison = Number(valA) - Number(valB);
          } else {
            // Text sorting (A-Z)
            comparison = String(valA).localeCompare(String(valB));
          }

          if (comparison === 0) continue;
          return sort.direction === "asc" ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    tasks,
    projectId,
    filterConfig,
    sortFields,
    displayOptions.closedTasks,
    searchQuery,
  ]);

  const projectSubtasks = useMemo(() => {
    return subtasks.filter((st) => st.projectId === projectId);
  }, [subtasks, projectId]);

  // console.log("projectTasks: ", projectTasks)

  // Get the selected task
  const selectedTask = selectedTaskId
    ? (projectTasks.find((t) => t.id === selectedTaskId) ??
      subtasks.find((st) => st.id === selectedTaskId) ??
      null)
    : null;

  // Create columns dynamically based on groupBy
  const columns: KanbanColumn[] = useMemo(() => {
    if (groupBy === "status") {
      const colors = ["#6B7280", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6"];
      return taskStatusConfigs
        .filter((config) => {
          // Hide manually hidden columns
          if (settings.hiddenColumns.includes(config._id)) return false;
          // Hide 'done' column if closedTasks is enabled
          if (displayOptions.closedTasks && config.value === "done")
            return false;
          return true;
        })
        .map((config, index) => ({
          id: config._id,
          name: config.label,
          color: config.color || colors[index % colors.length],
        }));
    }

    if (groupBy === "assignee") {
      return [
        { id: "unassigned", name: "Unassigned", color: "#9ca3af" },
        ...members.map((member) => ({
          id: member.userId,
          name: member.name,
          color: "#6366f1",
        })),
      ];
    }

    if (groupBy === "priority") {
      if (taskPriorityConfigs.length === 0) {
        return [{ id: "priority-none", name: "No Priority", color: "#9ca3af" }];
      }
      return [
        ...taskPriorityConfigs.map((option) => ({
          id: option._id,
          name: option.label,
          color: option.color || "#6366f1",
        })),
        { id: "priority-none", name: "No Priority", color: "#9ca3af" },
      ];
    }

    if (groupBy === "dueDate") {
      return [
        { id: "date-overdue", name: "Overdue", color: "#ef4444" },
        { id: "date-today", name: "Today", color: "#f97316" },
        { id: "date-upcoming", name: "Upcoming", color: "#3b82f6" },
        { id: "date-no-date", name: "No Date", color: "#9ca3af" },
      ];
    }

    /* if (groupBy?.startsWith('custom-')) {
      const fieldId = groupBy.replace('custom-', '');
      const field = customFields.find((f) => f.id === fieldId);

      if (!field || !Array.isArray(field.options)) return [];

      return [
        ...field.options.map((option: any) => ({
          id: typeof option === 'string' ? option : option.value,
          name: typeof option === 'string' ? option : option.value,
          color: typeof option === 'string' ? '#6366f1' : (option.color || '#6366f1'),
        })),
        {
          id: 'no-value',
          name: 'No Value',
          color: '#9ca3af',
        },
      ];
    } */

    return [{ id: "all-tasks", name: "All Tasks", color: "#6366f1" }];
  }, [
    groupBy,
    taskStatusConfigs,
    settings.hiddenColumns,
    members,
    taskPriorityConfigs,
    customFields,
  ]);

  // Transform tasks to kanban format - ONLY PARENT TASKS
  const kanbanTasks: KanbanTask[] = useMemo(() => {
    const defaultStatusId = taskStatusConfigs[0]?._id || "";

    return projectTasks.map((task) => {
      let columnId = "all-tasks";

      if (groupBy === "status") {
        const taskStatus = task.status || taskStatusConfigs[0]?.value || "";
        const config = taskStatusConfigs.find((c) => c.value === taskStatus);
        columnId = config?._id || defaultStatusId;
      } else if (groupBy === "assignee") {
        columnId = task.assignee || "unassigned";
      } else if (groupBy === "priority") {
        const priorityConfig = taskPriorityConfigs.find(
          (p) => p.value === task.priority,
        );
        columnId = priorityConfig?._id || "priority-none";
      } else if (groupBy === "dueDate") {
        if (!task.endDate) {
          columnId = "date-no-date";
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const d = new Date(task.endDate);
          d.setHours(0, 0, 0, 0);
          if (d < today) columnId = "date-overdue";
          else if (d.getTime() === today.getTime()) columnId = "date-today";
          else columnId = "date-upcoming";
        }
      } /* else if (groupBy?.startsWith('custom-')) {
        const fieldId = groupBy.replace('custom-', '');
        columnId = task.customFieldValues?.[fieldId] || 'no-value';
      } */

      return {
        id: task.id,
        name: task.name,
        column: columnId,
        startDate: task.startDate,
        endDate: task.endDate,
        assignee: task.assignee,
        taskId: undefined,
      };
    });
  }, [
    projectTasks,
    taskStatusConfigs,
    groupBy,
    taskPriorityConfigs,
    customFields,
  ]);

  // State for tracking which tasks have expanded subtasks - default all expanded
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    new Set(projectTasks.map((task) => task.id)),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeTaskId = active.id as string;

    // Resolve column ID from target (which could be another task card or column container)
    const overItem = kanbanTasks.find((item) => item.id === over.id);
    const newColumnId =
      overItem?.column ||
      columns.find((col) => col.id === over.id)?.id ||
      columns[0]?.id;

    const originalTask = tasks.find((t) => t.id === activeTaskId);

    if (originalTask) {
      if (groupBy === "status") {
        const config = taskStatusConfigs.find((c) => c._id === newColumnId);
        if (config && originalTask.status !== config.value) {
          updateTask(activeTaskId, { status: config.value });
          const taskSubtasks = subtasks.filter(
            (st) => st.parentTaskId === activeTaskId,
          );
          taskSubtasks.forEach((subtask) => {
            if (subtask.status !== config.value) {
              updateSubtask(subtask.id, { status: config.value });
            }
          });
        }
      } else if (groupBy === "assignee") {
        const newAssignee = newColumnId === "unassigned" ? "" : newColumnId;
        if (originalTask.assignee !== newAssignee) {
          updateTask(activeTaskId, { assignee: newAssignee });
        }
      } else if (groupBy === "priority") {
        const priorityConfig = taskPriorityConfigs.find(
          (p) => p._id === newColumnId,
        );
        const newValue = priorityConfig?.value || "";
        if (originalTask.priority !== newValue) {
          updateTask(activeTaskId, { priority: newValue });
        }
      } else if (groupBy === "dueDate") {
        if (newColumnId === "date-today") {
          const today = new Date().toISOString();
          if (originalTask.endDate !== today)
            updateTask(activeTaskId, { endDate: today });
        } else if (newColumnId === "date-no-date") {
          if (originalTask.endDate) updateTask(activeTaskId, { endDate: "" });
        }
      }
    }
    console.log("Drag ended:", event);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailOpen(true);
  };

  const handleCloseTaskDetail = (open: boolean) => {
    setIsTaskDetailOpen(open);
    if (!open) {
      setSelectedTaskId(null);
    }
  };

  // ✅ Add handlers
  const handleAddMembers = async (
    members: Array<{ userId: string; role: string }>,
  ) => {
    await addMembersToProject(projectId, members);
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMembersFromProject(projectId, [userId]);
  };

  // Add Group handler
  const handleStartCreateGroup = () => {
    setIsCreatingNewGroup(true);
    setNewGroupName("");
  };

  const handleSaveNewGroup = async () => {
    if (newGroupName.trim()) {
      // Get a random color from colorOptions
      const randomColor =
        colorOptions[Math.floor(Math.random() * colorOptions.length)].value;

      await addTaskStatusConfig(projectId, {
        label: newGroupName,
        color: randomColor,
        value: newGroupName.trim().toLowerCase().replace(/\s+/g, "_"),
      });

      setIsCreatingNewGroup(false);
      setNewGroupName("");
    }
  };

  const handleCancelCreateGroup = () => {
    setIsCreatingNewGroup(false);
    setNewGroupName("");
  };

  const handleAddTask = (columnId: string) => {
    setAddingTaskInColumn(columnId);
    setNewTaskName("");
    setNewTaskData({
      assignee: "",
      startDate: new Date() as Date | undefined,
      endDate: undefined,
      priority: "",
    });
  };

  const handleSaveNewTask = async (columnId: string) => {
    if (!newTaskName.trim()) return;

    // Capture before reset
    const capturedName = newTaskName;
    const capturedData = { ...newTaskData };

    // Initialize task properties based on groupBy and columnId
    let taskStatus = taskStatusConfigs[0]?.value || "todo";
    let taskAssignee = capturedData.assignee || undefined;
    let taskPriority = capturedData.priority || undefined;
    let taskEndDate = capturedData.endDate
      ? convertSelectedDateToUTC(capturedData.endDate)
      : undefined;
    let taskCustomFieldValues = {};

    if (groupBy === "status") {
      const config = taskStatusConfigs.find((c) => c._id === columnId);
      if (config) taskStatus = config.value;
    } else if (groupBy === "assignee") {
      taskAssignee = columnId === "unassigned" ? "" : columnId;
    } else if (groupBy === "priority") {
      const priorityConfig = taskPriorityConfigs.find(
        (p) => p._id === columnId,
      );
      if (priorityConfig) taskPriority = priorityConfig.value;
    } else if (groupBy === "dueDate") {
      if (columnId === "date-today") {
        taskEndDate = convertSelectedDateToUTC(new Date());
      } else if (columnId === "date-no-date") {
        taskEndDate = undefined;
      }
    } /* else if (groupBy?.startsWith('custom-')) {
      const fieldId = groupBy.replace('custom-', '');
      const newValue = columnId === 'no-value' ? '' : columnId;
      taskCustomFieldValues = { [fieldId]: newValue };
    } */

    // 1. Close the card input row IMMEDIATELY
    setAddingTaskInColumn(null);
    setNewTaskName("");
    setNewTaskData({
      assignee: "",
      startDate: new Date() as Date | undefined,
      endDate: undefined,
      priority: "",
    });

    // 2. onConfirmed: swap tempId → realId in expandedTasks
    const onConfirmed = (realId: string) => {
      setExpandedTasks((prev) => {
        const next = new Set(prev);
        next.delete("__pending__"); // clean up if needed
        next.add(realId);
        return next;
      });
    };

    // 3. Call addTask — returns tempId INSTANTLY, API fires in background
    const tempId = await addTask(
      {
        projectId,
        name: capturedName.trim(),
        status: taskStatus,
        assignee: taskAssignee,
        endDate: taskEndDate,
        priority: taskPriority,
        customFieldValues: taskCustomFieldValues,
        startDate: capturedData.startDate
          ? convertSelectedDateToUTC(capturedData.startDate)
          : undefined,
        completed: false,
      },
      onConfirmed,
    );

    // 4. Expand immediately with tempId (so subtask row can open right away if needed)
    if (tempId) {
      setExpandedTasks((prev) => new Set([...prev, tempId]));
    }
  };

  const handleCancelAddTask = () => {
    setAddingTaskInColumn(null);
    setNewTaskName("");
    setNewTaskData({
      assignee: "",
      startDate: new Date() as Date | undefined,
      endDate: undefined,
      priority: "",
    });
  };

  // Subtask handlers
  const handleStartAddSubtask = (taskId: string) => {
    const parentTask = projectTasks.find((t) => t.id === taskId);
    setAddingSubtaskToTask(taskId);
    setNewSubtaskName("");
    setNewSubtaskData({
      assignee: "",
      priority: "",
      startDate: new Date(),
      endDate: parentTask?.endDate ? new Date(parentTask.endDate) : undefined,
    });
    // Expand parent immediately so AddSubtaskCard is visible
    setExpandedTasks((prev) => new Set([...prev, taskId]));
  };

  const handleSaveNewSubtask = (parentTaskId: string) => {
    if (!newSubtaskName.trim()) return;

    const parentTask = projectTasks.find((t) => t.id === parentTaskId);

    // Capture before reset
    const capturedName = newSubtaskName;
    const capturedData = { ...newSubtaskData };

    // 1. Close the subtask card input row IMMEDIATELY
    setAddingSubtaskToTask(null);
    setNewSubtaskName("");
    setNewSubtaskData({
      assignee: "",
      startDate: new Date() as Date | undefined,
      endDate: undefined,
      priority: "",
    });

    // 2. Keep parent expanded
    setExpandedTasks((prev) => new Set([...prev, parentTaskId]));

    // 3. Call addSubtask — store handles optimistic update + API in background
    addSubtask({
      parentTaskId,
      projectId,
      name: capturedName.trim(),
      assignee: capturedData.assignee || undefined,
      endDate: capturedData.endDate
        ? convertSelectedDateToUTC(capturedData.endDate)
        : (parentTask?.endDate ?? undefined),
      priority: capturedData.priority || undefined,
      status: parentTask?.status,
      startDate: capturedData.startDate
        ? convertSelectedDateToUTC(capturedData.startDate)
        : undefined,
      completed: false,
    });
  };

  const handleCancelAddSubtask = () => {
    setAddingSubtaskToTask(null);
    setNewSubtaskName("");
    setNewSubtaskData({
      assignee: "",
      startDate: new Date() as Date | undefined,
      endDate: undefined,
      priority: "",
    });
  };

  // Duplicate column handler
  const handleDuplicateColumn = async (columnId: string) => {
    const original = taskStatusConfigs.find((c) => c._id === columnId);

    if (original) {
      const duplicatedName = `${original.label} Copy`;
      await addTaskStatusConfig(projectId, {
        label: duplicatedName,
        color: original.color,
        value: duplicatedName.toLowerCase().replace(/\s+/g, "_"),
      });
    }
  };

  // Change color handler
  const handleChangeColumnColor = async (
    columnId: string,
    newColor: string,
  ) => {
    const config = taskStatusConfigs.find((c) => c._id === columnId);
    if (config) {
      await updateTaskStatusConfig(projectId, config._id, { color: newColor });
    }
  };

  // Archive all tasks handler
  const handleArchiveAllTasks = (columnId: string) => {
    const config = taskStatusConfigs.find((c) => c._id === columnId);
    if (!config) return;
    const tasksInColumn = projectTasks.filter((t) => t.status === config.value);
    if (tasksInColumn.length === 0) {
      alert("No tasks to archive in this column");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to complete all ${tasksInColumn.length} task(s) in "${config.label}"?`,
      )
    ) {
      return;
    }

    tasksInColumn.forEach((task) => {
      updateTask(task.id, { completed: true });
    });
  };

  // Inline rename handlers
  const handleStartEditColumnName = (columnId: string) => {
    const config = taskStatusConfigs.find((c) => c._id === columnId);
    if (config) {
      setEditingColumnName(columnId);
      setEditedColumnName(config.label);
    }
  };

  const handleSaveColumnName = async (columnId: string) => {
    if (!editedColumnName.trim()) {
      setEditingColumnName(null);
      return;
    }

    const config = taskStatusConfigs.find((c) => c._id === columnId);
    if (config && editedColumnName !== config.label) {
      await updateTaskStatusConfig(projectId, config._id, {
        label: editedColumnName.trim(),
      });
    }
    setEditingColumnName(null);
  };

  const handleCancelEditColumnName = () => {
    setEditingColumnName(null);
    setEditedColumnName("");
  };

  // Delete column handler
  const canDeleteColumn = (columnId: string) => {
    // Cannot delete if it's the only status option left
    if (taskStatusConfigs.length <= 1) return false;

    // Find the status option by ID
    const config = taskStatusConfigs.find((c) => c._id === columnId);
    if (!config) return false;
    // Check if there are tasks in this column
    const tasksInColumn = projectTasks.filter((t) => t.status === config.value);

    // Can delete only if no tasks exist in this column
    return tasksInColumn.length === 0;
  };

  const handleDeleteColumn = async (columnId: string) => {
    const config = taskStatusConfigs.find((c) => c._id === columnId);
    if (!config) return;

    // Use canDeleteColumn for validation
    if (!canDeleteColumn(columnId)) {
      // Check which condition failed for better error message
      if (taskStatusConfigs.length <= 1) {
        alert(
          "Cannot delete the last status column. You must have at least one status.",
        );
      } else {
        const tasksInColumn = projectTasks.filter(
          (t) => t.status === config.value,
        );
        alert(
          `Cannot delete "${config.label}" because it contains ${tasksInColumn.length} task(s). Please move or delete the tasks first.`,
        );
      }
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${config.label}"?`)) {
      return;
    }

    await deleteTaskStatusConfig(projectId, config._id);
  };

  // Toggle handler for subtasks expansion
  const handleToggleSubtasks = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Add Group Card Component
  const AddGroupCard = ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    return (
      <div className="w-80 bg-card rounded-lg border-2 border-dashed border-input p-4">
        <div className="mb-3">
          <label className="text-xs font-medium text-foreground mb-2 block">
            Group Name
          </label>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            data-testid="kanban-add-group-input"
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onSave}
            className="flex-1"
            data-testid="kanban-add-group-create-btn"
          >
            <Check className="w-4 h-4 mr-2" />
            Create
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-testid="kanban-add-group-cancel-btn"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const AddTaskCard = ({
    columnName,
    onSave,
    onCancel,
  }: {
    columnName: string;
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    const selAssignee = members.find((m) => m.userId === newTaskData.assignee);
    const selPriority = taskPriorityConfigs.find(
      (p) => p.value === newTaskData.priority,
    );

    return (
      <div className="space-y-0 px-4 mb-2 rounded">
        <div className="group relative bg-card border rounded-xl p-4 shadow-sm border-l-4 border-l-border">
          {/* Top row: Assignee | Task ID placeholder | Priority */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Assignee */}
              <Popover>
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <div className="cursor-pointer">
                    {selAssignee ? (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-blue-100">
                          {selAssignee.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted transition-colors">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 p-2"
                  align="start"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Assign to
                    </div>
                    {members.map((member) => (
                      <button
                        key={member.userId}
                        onClick={() =>
                          setNewTaskData((prev) => ({
                            ...prev,
                            assignee: member.userId,
                          }))
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-blue-100">
                            {member.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Task ID placeholder */}
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 text-muted-foreground rounded-md"
              >
                Task ID
              </Badge>

              {/* Priority */}
              <Popover>
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <div className="cursor-pointer">
                    {selPriority ? (
                      <Badge
                        variant="secondary"
                        className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${selPriority.color}20`,
                          color: selPriority.color,
                        }}
                      >
                        <Flag className="h-4 w-4" />
                      </Badge>
                    ) : (
                      <div className="h-6 w-6 rounded-full flex items-center justify-center bg-muted hover:bg-muted transition-colors">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-36 p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    {taskPriorityConfigs.map((priority) => (
                      <button
                        key={priority._id}
                        onClick={() =>
                          setNewTaskData((prev) => ({
                            ...prev,
                            priority: priority.value,
                          }))
                        }
                        className="w-full flex justify-between items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs"
                      >
                        <span style={{ color: priority.color }}>
                          {priority.label}
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: `${priority.color}20`,
                            color: priority.color,
                          }}
                        >
                          <Flag className="h-4 w-4" />
                        </Badge>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <MoreHorizontalIcon className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Task name input */}
          <Input
            ref={inputRef}
            type="text"
            placeholder="Task Name"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-xs border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 mb-3"
            data-testid="kanban-add-task-name-input"
            maxLength={250}
          />

          {/* Bottom row: MessageSquare | Due Date | Save/Cancel */}
          <div className="flex items-center justify-between gap-2 mt-3">
            <div className="flex items-center gap-2">
              {/* <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div> */}

              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <div className="cursor-pointer">
                    {newTaskData.startDate ? (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal h-6 px-2 py-0.5 flex items-center bg-muted text-muted-foreground hover:bg-muted"
                      >
                        <span className="mt-0.5">
                          {formatLocalDate(newTaskData.startDate)}
                        </span>
                      </Badge>
                    ) : (
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted hover:bg-muted transition-colors"
                        title="Add start date"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-2 border-0 border-b-[5px] border-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CalendarPicker
                    selectedDate={newTaskData.startDate}
                    onDateSelect={(date) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        startDate: date,
                      }))
                    }
                  />
                </PopoverContent>
              </Popover>

              {newTaskData.startDate && newTaskData.endDate && (
                <span className="text-muted-foreground text-xs font-bold">
                  -
                </span>
              )}

              {/* Due Date (End Date) */}
              <Popover>
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <div className="cursor-pointer">
                    {newTaskData.endDate ? (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal h-6 px-2 py-0.5 flex items-center bg-muted text-muted-foreground hover:bg-muted"
                      >
                        <span className="mt-0.5">
                          {formatLocalDate(newTaskData.endDate)}
                        </span>
                      </Badge>
                    ) : (
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted hover:bg-muted transition-colors"
                        title="Add end date"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-2 border-0 border-b-[5px] border-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CalendarPicker
                    selectedDate={newTaskData.endDate}
                    onDateSelect={(date) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        endDate: date,
                      }))
                    }
                    disabled={(dt) =>
                      newTaskData.startDate
                        ? dt <
                          new Date(
                            new Date(newTaskData.startDate).setHours(
                              0,
                              0,
                              0,
                              0,
                            ),
                          )
                        : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                data-testid="kanban-add-task-save-btn"
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                data-testid="kanban-add-task-cancel-btn"
                className="px-3 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddSubtaskCard = ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    const selAssignee = members.find(
      (m) => m.userId === newSubtaskData.assignee,
    );
    const selPriority = taskPriorityConfigs.find(
      (p) => p.value === newSubtaskData.priority,
    );

    return (
      <div
        className="ml-6 mt-2 group relative rounded-lg bg-card p-2 shadow-sm border border-border border-l-4 border-l-border hover:shadow-md transition-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top row: Assignee | Subtask ID placeholder | Priority */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Assignee */}
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="cursor-pointer">
                  {selAssignee ? (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-blue-100">
                        {selAssignee.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted transition-colors">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 p-2"
                align="start"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Assign to
                  </div>
                  {members.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() =>
                        setNewSubtaskData((prev) => ({
                          ...prev,
                          assignee: member.userId,
                        }))
                      }
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs bg-blue-100">
                          {member.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Subtask ID placeholder */}
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 text-muted-foreground rounded-md"
            >
              Subtask ID
            </Badge>

            {/* Priority */}
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="cursor-pointer">
                  {selPriority ? (
                    <Badge
                      variant="secondary"
                      className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${selPriority.color}20`,
                        color: selPriority.color,
                      }}
                    >
                      <Flag className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <div className="h-6 w-6 rounded-full flex items-center justify-center bg-muted hover:bg-muted transition-colors">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-36 p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  {taskPriorityConfigs.map((priority) => (
                    <button
                      key={priority._id}
                      onClick={() =>
                        setNewSubtaskData((prev) => ({
                          ...prev,
                          priority: priority.value,
                        }))
                      }
                      className="w-full flex justify-between items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs"
                    >
                      <span style={{ color: priority.color }}>
                        {priority.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${priority.color}20`,
                          color: priority.color,
                        }}
                      >
                        <Flag className="h-4 w-4" />
                      </Badge>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Subtask name input */}
        <Input
          ref={inputRef}
          placeholder="Subtask name"
          value={newSubtaskName}
          onChange={(e) => setNewSubtaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-xs border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 mb-3"
          data-testid="kanban-add-subtask-name-input"
          maxLength={250}
        />

        {/* Bottom row: MessageSquare | Due Date | Save/Cancel */}
        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex items-center gap-2">
            {/* <div className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted">
              <MessageSquare className="h-4 w-4" />
            </div> */}

            {/* Start Date */}
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="cursor-pointer">
                  {newSubtaskData.startDate ? (
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal h-6 px-2 py-0.5 flex items-center bg-muted text-muted-foreground hover:bg-muted"
                    >
                      <span className="mt-0.5">
                        {formatLocalDate(newSubtaskData.startDate)}
                      </span>
                    </Badge>
                  ) : (
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted hover:bg-muted transition-colors"
                      title="Add start date"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2 border-0 border-b-[5px] border-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <CalendarPicker
                  selectedDate={newSubtaskData.startDate}
                  onDateSelect={(date) =>
                    setNewSubtaskData((prev) => ({
                      ...prev,
                      startDate: date,
                    }))
                  }
                />
              </PopoverContent>
            </Popover>

            {newSubtaskData.startDate && newSubtaskData.endDate && (
              <span className="text-muted-foreground text-xs font-bold">-</span>
            )}

            {/* Due Date (End Date) */}
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="cursor-pointer">
                  {newSubtaskData.endDate ? (
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal h-6 px-2 py-0.5 flex items-center bg-muted text-muted-foreground hover:bg-muted"
                    >
                      <span className="mt-0.5">
                        {formatLocalDate(newSubtaskData.endDate)}
                      </span>
                    </Badge>
                  ) : (
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted hover:bg-muted transition-colors"
                      title="Add end date"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2 border-0 border-b-[5px] border-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <CalendarPicker
                  selectedDate={newSubtaskData.endDate}
                  onDateSelect={(date) =>
                    setNewSubtaskData((prev) => ({
                      ...prev,
                      endDate: date,
                    }))
                  }
                  disabled={(dt) =>
                    newSubtaskData.startDate
                      ? dt <
                        new Date(
                          new Date(newSubtaskData.startDate).setHours(
                            0,
                            0,
                            0,
                            0,
                          ),
                        )
                      : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              data-testid="kanban-add-subtask-save-btn"
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
            >
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              data-testid="kanban-add-subtask-cancel-btn"
              className="px-3 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Empty state for when no tasks exist
  const EmptyKanbanState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <div className="text-muted-foreground mb-4">
        <svg
          className="w-24 h-24 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-xs font-semibold text-foreground mb-2">
        No tasks yet
      </h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-sm">
        Get started by creating your first task in any column
      </p>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full h-full flex flex-col bg-background">
        <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="relative flex ">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-2 pr-8 rounded text-xs"
                data-testid="kanban-search-input"
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
                  data-testid="kanban-members-trigger"
                >
                  <Users className="h-4 w-4" />
                  Members
                  {members.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {members.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[320px] p-2 border border-b-[5px] border-b-primary"
                align="start"
              >
                <ProjectMembersSection
                  projectId={projectId}
                  members={project?.members || []}
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
            <DropdownMenu
              open={showGroupByDropdown}
              onOpenChange={setShowGroupByDropdown}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-2 rounded cursor-pointer text-xs"
                  data-testid="kanban-groupby-trigger"
                >
                  <Layers className="h-4 w-4" />
                  Group by: <span className="capitalize">{groupBy}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={4}
                className="w-120 p-4 border-b-5 border-b-primary"
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
                  <div className="space-y-1 pr-3 border-r border-border">
                    {displayedOptions
                      .slice(0, Math.ceil(displayedOptions.length / 2))
                      .map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleGroupByChange(option.value)}
                          data-testid={`kanban-groupby-option-${option.value}`}
                          className={`w-full flex items-center gap-3 p-2 rounded text-xs hover:bg-muted 
        `}
                        >
                          {/* Radio */}
                          <span
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${groupBy === option.value ? "border-primary" : "border-input"}`}
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

                  {/* Right Column */}
                  <div className="space-y-1">
                    {displayedOptions
                      .slice(Math.ceil(displayedOptions.length / 2))
                      .map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleGroupByChange(option.value)}
                          data-testid={`kanban-groupby-option-${option.value}`}
                          className={`w-full flex items-center gap-3 p-2 rounded text-xs hover:bg-muted`}
                        >
                          {/* Radio */}
                          <span
                            className={`h-4 w-4 rounded-full border flex items-center justify-center
                                                         ${groupBy === option.value ? "border-primary" : "border-input"}`}
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
                        alt="No groups"
                        width={150}
                        height={100}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {previouslyUsedGroupBy.map((item) => {
                        const option = groupByOptions.find(
                          (o) => o.value === item.option,
                        );
                        return (
                          <div
                            key={item.option}
                            className="flex items-center justify-between p-2 rounded hover:bg-muted group"
                          >
                            <button
                              onClick={() => handleGroupByChange(item.option)}
                              className="flex items-center gap-2 flex-1"
                            >
                              <span className="text-xs text-foreground">
                                {option?.label || item.option}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.date}
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                handleRemovePreviouslyUsed(item.option)
                              }
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        );
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
                className={cn(
                  "rounded cursor-pointer text-xs",
                  showSortOptions &&
                    "bg-primary text-primary-foreground hover:bg-primary",
                )}
                onClick={() => setShowSortOptions(!showSortOptions)}
                data-testid="kanban-sort-filter-toggle"
              >
                <SlidersVertical className="h-4 w-4" />
              </Button>

              {showSortOptions && (
                <>
                  {/* Sort Dropdown */}
                  <DropdownMenu
                    open={activeDropdown === "sort"}
                    onOpenChange={(open) =>
                      setActiveDropdown(open ? "sort" : null)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 rounded cursor-pointer text-xs"
                        data-testid="kanban-sort-trigger"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className={`p-0 transition-all duration-200 border-b-5 border-b-primary ${hasSelectedSortFields ? "w-155" : "w-105"}`}
                    >
                      <div className="flex items-center justify-between px-4 py-3">
                        <h3 className="text-xs font-semibold text-primary">
                          Sort fields by
                        </h3>
                      </div>
                      <div
                        className={`grid ${hasSelectedSortFields ? "grid-cols-3" : "grid-cols-2"} divide-x`}
                      >
                        <div className="p-2">
                          <h4 className="text-xs font-semibold text-[#6E7C87] mb-2 px-2">
                            Default fields
                          </h4>
                          <div className="space-y-1">
                            {sortFields
                              .filter((f) =>
                                [
                                  "id",
                                  "task",
                                  "taskType",
                                  "status",
                                  "assignee",
                                  "startDate",
                                  "endDate",
                                  "priority",
                                ].includes(f.id),
                              )
                              .map((field) => (
                                <div
                                  key={field.id}
                                  onClick={() => handleFieldSelection(field.id)}
                                  data-testid={`kanban-sort-option-${field.id}`}
                                  className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                                >
                                  <div
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${field.isSelected ? "bg-primary border-primary" : "border-input"}`}
                                  >
                                    {field.isSelected && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-xs font-medium text-primary">
                                    {field.fieldName}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div className="p-2">
                          <h4 className="text-xs font-semibold text-[#6E7C87] mb-2 px-2">
                            Custom fields
                          </h4>
                          {sortFields.filter(
                            (f) =>
                              ![
                                "id",
                                "task",
                                "taskType",
                                "status",
                                "assignee",
                                "startDate",
                                "endDate",
                                "priority",
                              ].includes(f.id),
                          ).length > 0 ? (
                            <div className="space-y-1">
                              {sortFields
                                .filter(
                                  (f) =>
                                    ![
                                      "id",
                                      "task",
                                      "taskType",
                                      "status",
                                      "assignee",
                                      "startDate",
                                      "endDate",
                                      "priority",
                                    ].includes(f.id),
                                )
                                .map((field) => (
                                  <div
                                    key={field.id}
                                    onClick={() =>
                                      handleFieldSelection(field.id)
                                    }
                                    data-testid={`kanban-sort-option-${field.id}`}
                                    className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                                  >
                                    <div
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${field.isSelected ? "bg-primary border-primary" : "border-input"}`}
                                    >
                                      {field.isSelected && (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      )}
                                    </div>
                                    <span className="text-xs font-medium text-primary">
                                      {field.fieldName}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground py-2">
                              No custom fields
                            </p>
                          )}
                        </div>
                        {hasSelectedSortFields && (
                          <div className="p-2">
                            <h4 className="text-xs font-semibold text-[#6E7C87] mb-2 px-2">
                              My Sort
                            </h4>
                            <div className="space-y-1">
                              <div className="flex flex-col gap-1 px-0">
                                {sortFields
                                  .filter((f) => f.isSelected)
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
                            data-testid="kanban-sort-clear-btn"
                            className="justify-start bg-muted text-foreground hover:bg-primary hover:text-primary-foreground text-xs"
                          >
                            Clear all sort
                          </Button>
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Filter Dropdown */}
                  <DropdownMenu
                    open={activeDropdown === "filter"}
                    onOpenChange={(open) => {
                      setActiveDropdown(open ? "filter" : null);
                      if (open)
                        setFilterAnchorEl(
                          document.activeElement as HTMLElement,
                        );
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 rounded cursor-pointer text-xs"
                        data-testid="kanban-filter-trigger"
                      >
                        <Funnel className="h-4 w-4" />
                        Filter
                        {filterConfig.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                            {filterConfig.length}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="px-2 py-2 border-b-5 border-b-primary w-50 "
                    >
                      <div className="space-y-1 mb-1 ">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            disabled={groupBy === "assignee"}
                            className={cn(
                              "flex items-center justify-between text-xs",
                              groupBy === "assignee" &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <span className="text-primary text-xs">
                              Assignee
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-64 p-0">
                            <AssigneeDropdown
                              projectId={projectId}
                              currentAssignee={undefined}
                              onAssigneeChange={(userId) => {
                                if (userId) {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "assignee",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "assignee"
                                          ? { ...f, value: userId }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substr(2, 9),
                                        field: "assignee",
                                        condition: "is",
                                        value: userId,
                                      },
                                    ];
                                  });
                                }
                              }}
                            />
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            disabled={groupBy === "priority"}
                            className={cn(
                              "flex items-center justify-between text-xs",
                              groupBy === "priority" &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <span className="text-primary text-xs">
                              Priority
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 p-2">
                            {taskPriorityConfigs.map((cfg) => (
                              <DropdownMenuItem
                                key={cfg._id}
                                onSelect={() => {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "priority",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "priority"
                                          ? { ...f, value: cfg.value }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substr(2, 9),
                                        field: "priority",
                                        condition: "is",
                                        value: cfg.value,
                                      },
                                    ];
                                  });
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: cfg.color }}
                                />
                                <span className="text-xs font-medium">
                                  {cfg.label}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            disabled={groupBy === "status"}
                            className={cn(
                              "flex items-center justify-between text-xs",
                              groupBy === "status" &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <span className="text-primary text-xs">Status</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 p-2">
                            {taskStatusConfigs.map((cfg) => (
                              <DropdownMenuItem
                                key={cfg._id}
                                onSelect={() => {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "status",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "status"
                                          ? { ...f, value: cfg.value }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substr(2, 9),
                                        field: "status",
                                        condition: "is",
                                        value: cfg.value,
                                      },
                                    ];
                                  });
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: cfg.color }}
                                />
                                <span className="text-xs font-medium">
                                  {cfg.label}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            disabled={groupBy === "dueDate"}
                            className={cn(
                              "flex items-center justify-between text-xs",
                              groupBy === "dueDate" &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <span className="text-primary text-xs">
                              Due Date
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-auto p-2 border-0 border-b-[5px] border-primary">
                            <CalendarPicker
                              onDateSelect={(date) => {
                                if (date) {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "dueDate",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "dueDate"
                                          ? {
                                              ...f,
                                              value:
                                                convertSelectedDateToUTC(date),
                                            }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substr(2, 9),
                                        field: "dueDate",
                                        condition: "date-equals",
                                        value: convertSelectedDateToUTC(date),
                                      },
                                    ];
                                  });
                                }
                              }}
                            />
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs">
                            <span className="text-primary text-xs">Labels</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 p-2">
                            {(currentWorkspace?.labels || []).map((label) => (
                              <DropdownMenuItem
                                key={label.id || label.name}
                                onSelect={() => {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "labels",
                                    );
                                    const labelValue = label.id || label.name;
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "labels"
                                          ? { ...f, value: labelValue }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substr(2, 9),
                                        field: "labels",
                                        condition: "contains",
                                        value: labelValue,
                                      },
                                    ];
                                  });
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span className="text-xs font-medium">
                                  {label.name}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-primary font-semibold cursor-pointer text-xs"
                          onSelect={() => setShowAdvancedFilters(true)}
                        >
                          Advanced Filters
                        </DropdownMenuItem>

                        {filterConfig.length > 0 && (
                          <>
                            <DropdownMenuSeparator className="my-3" />
                            <div className="px-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs"
                                onClick={() => setFilterConfig([])}
                                data-testid="kanban-filter-clear-btn"
                              >
                                Clear All Filters
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Advanced Filters Modal/Popover */}
                  {showAdvancedFilters && (
                    <AdvancedFiltersNew
                      open={showAdvancedFilters}
                      onClose={() => setShowAdvancedFilters(false)}
                      onApply={(filterBlock: any) => {
                        setFilterConfig(filterBlock.children);
                        setShowAdvancedFilters(false);
                      }}
                      currentFilterBlock={getActiveFilterConfig()}
                      projectId={projectId}
                      groupBy={groupBy}
                    />
                  )}
                  {/* Freeze Fields Button - Disabled in Kanban */}
                  {/* <Button size="sm" variant="ghost" disabled className="gap-2 rounded cursor-not-allowed opacity-50 text-xs">
                    <Pin className="h-4 w-4" />
                    Freeze Fields
                  </Button> */}
                  {/* Display Dropdown */}
                  <DropdownMenu
                    open={activeDropdown === "display"}
                    onOpenChange={(open) =>
                      setActiveDropdown(open ? "display" : null)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 rounded cursor-pointer text-xs"
                        data-testid="kanban-display-trigger"
                      >
                        <Monitor className="h-4 w-4" />
                        Display
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 px-4 py-2 border-b-5 border-b-primary">
                      {/* Collapsed Subtasks */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="collapsed-subtasks"
                          className="text-xs cursor-pointer text-primary"
                        >
                          Collapsed Subtasks
                        </Label>
                        <Switch
                          id="collapsed-subtasks"
                          data-testid="kanban-display-collapsed-subtasks-switch"
                          checked={displayOptions.collapsedSubtasks}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              collapsedSubtasks: !!checked,
                            }))
                          }
                        />
                      </div>

                      {/* Closed Tasks */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="closed-tasks"
                          className="text-xs cursor-pointer text-primary"
                        >
                          Closed Tasks
                        </Label>
                        <Switch
                          id="closed-tasks"
                          data-testid="kanban-display-closed-tasks-switch"
                          checked={displayOptions.closedTasks}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              closedTasks: !!checked,
                            }))
                          }
                        />
                      </div>

                      {/* Wrap Text */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="wrap-text"
                          className="text-xs cursor-pointer text-primary"
                        >
                          Wrap Text
                        </Label>
                        <Switch
                          id="wrap-text"
                          data-testid="kanban-display-wrap-text-switch"
                          checked={displayOptions.wrapText}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              wrapText: !!checked,
                            }))
                          }
                        />
                      </div>

                      {/* Subtask Parent ID */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="subtask-parent-id"
                          className="text-xs cursor-pointer text-primary"
                        >
                          Subtask parent ID
                        </Label>
                        <Switch
                          id="subtask-parent-id"
                          data-testid="kanban-display-subtask-parent-id-switch"
                          checked={displayOptions.subtaskParentId}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              subtaskParentId: !!checked,
                            }))
                          }
                        />
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* <KanbanSettingsDropdown projectId={projectId} /> */}
            <div>
              {/* Hide groups dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 rounded text-xs"
                    data-testid="kanban-unhide-column-trigger"
                  >
                    <EyeOff className="h-4 w-4" />
                    {(() => {
                      const hiddenSet = new Set(settings.hiddenColumns);

                      // Include 'done' group if grouped by status and closedTasks is enabled
                      if (displayOptions.closedTasks && groupBy === "status") {
                        const doneConfig = taskStatusConfigs.find(
                          (c) => c.value === "done",
                        );
                        if (doneConfig) {
                          hiddenSet.add(doneConfig._id);
                        }
                      }

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
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-3 border-b-5 border-b-primary"
                >
                  <h3 className="text-xs font-semibold mb-3">Unhide Group</h3>
                  {(() => {
                    const hiddenStatusConfigs = taskStatusConfigs.filter(
                      (config) =>
                        settings.hiddenColumns.includes(config._id) ||
                        (groupBy === "status" &&
                          displayOptions.closedTasks &&
                          config.value === "done"),
                    );

                    const hiddenOtherGroups = settings.hiddenColumns
                      .filter(
                        (id) => !taskStatusConfigs.find((c) => c._id === id),
                      )
                      .map((id) => {
                        if (groupBy === "assignee") {
                          if (id === "unassigned")
                            return {
                              id,
                              label: "Unassigned",
                              color: "#9ca3af",
                            };
                          const member = members.find((m) => m.userId === id);
                          return member
                            ? { id, label: member.name, color: "#6366f1" }
                            : null;
                        }
                        if (groupBy === "priority") {
                          if (id === "priority-none")
                            return {
                              id,
                              label: "No Priority",
                              color: "#9ca3af",
                            };
                          const priority = taskPriorityConfigs.find(
                            (p) => p._id === id,
                          );
                          return priority
                            ? {
                                id,
                                label: priority.label,
                                color: priority.color || "#6366f1",
                              }
                            : null;
                        }
                        return null;
                      })
                      .filter(Boolean) as {
                      id: string;
                      label: string;
                      color: string;
                    }[];

                    const allHidden = [
                      ...hiddenStatusConfigs.map((c) => ({
                        id: c._id,
                        label: c.label,
                        color: c.color,
                        isClosedTask: c.value === "done",
                      })),
                      ...hiddenOtherGroups.map((g) => ({
                        ...g,
                        isClosedTask: false,
                      })),
                    ];

                    if (allHidden.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground py-2">
                          No hidden groups
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-1">
                        {allHidden.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => {
                              if (
                                group.isClosedTask &&
                                displayOptions.closedTasks
                              ) {
                                setDisplayOptions((prev) => ({
                                  ...prev,
                                  closedTasks: false,
                                }));
                              } else {
                                const { showColumn } =
                                  useKanbanSettingsStore.getState();
                                showColumn(projectId, group.id);
                              }
                            }}
                            data-testid={`kanban-unhide-column-option-${group.id}`}
                            className="w-full flex items-center justify-between p-2 rounded hover:bg-muted text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: group.color || "#6366f1",
                                }}
                              />
                              <span className="text-primary">
                                {group.label}
                              </span>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">
                              Unhide
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-auto px-4 py-2 h-full">
          {columns.length === 0 ? (
            <EmptyKanbanState />
          ) : (
            <div className="flex gap-4 items-stretch w-max min-h-full">
              <KanbanProvider
                data={kanbanTasks}
                columns={columns}
                onDragEnd={handleDragEnd}
              >
                {(column) => (
                  <KanbanBoard
                    key={column.id}
                    id={column.id}
                    data-testid={`kanban-column-${column.id}`}
                    className="w-80 h-full flex flex-col shrink-0 bg-muted border-none shadow-none divide-y-0 overflow-visible rounded-t-lg"
                    style={{ borderTop: `4px solid ${column.color}` }}
                  >
                    {/* Column Header */}
                    <KanbanHeader className="border-none py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* ✅ Inline Editing for Column Name */}
                          {editingColumnName === column.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editedColumnName}
                                onChange={(e) =>
                                  setEditedColumnName(e.target.value)
                                }
                                className="h-8 w-40 text-xs font-semibold uppercase"
                                autoFocus
                                data-testid={`kanban-column-name-input-${column.id}`}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveColumnName(column.id);
                                  }
                                  if (e.key === "Escape") {
                                    handleCancelEditColumnName();
                                  }
                                }}
                                onBlur={() => handleSaveColumnName(column.id)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveColumnName(column.id)}
                                className="h-8 w-8 p-0"
                                data-testid={`kanban-column-name-save-btn-${column.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelEditColumnName()}
                                className="h-8 w-8 p-0"
                                data-testid={`kanban-column-name-cancel-btn-${column.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3
                                className="font-semibold text-xs text-foreground uppercase tracking-wide truncate cursor-pointer hover:underline"
                                data-testid={`kanban-column-name-text-${column.id}`}
                                onClick={() =>
                                  handleStartEditColumnName(column.id)
                                }
                              >
                                {column.name}
                              </h3>
                            </>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            data-testid={`kanban-column-hide-eye-btn-${column.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              hideColumn(projectId, column.id);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {/* ✅ Complete More Options Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="More options"
                                data-testid={`kanban-column-more-trigger-${column.id}`}
                              >
                                <MoreHorizontalIcon className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 p-1.5 border-b-5 border-b-primary"
                            >
                              {/* Rename Status */}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStartEditColumnName(column.id)
                                }
                                className="text-xs"
                                data-testid={`kanban-column-rename-btn-${column.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-2" />
                                Rename Status
                              </DropdownMenuItem>

                              {/* Change Color - Submenu */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                  className="text-xs"
                                  data-testid={`kanban-column-color-submenu-trigger-${column.id}`}
                                >
                                  <Palette className="w-3.5 h-3.5 mr-2" />
                                  Assign color to Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-40">
                                  {colorOptions.map((color) => (
                                    <DropdownMenuItem
                                      key={color.value}
                                      onClick={() =>
                                        handleChangeColumnColor(
                                          column.id,
                                          color.value,
                                        )
                                      }
                                      data-testid={`kanban-column-color-option-${column.id}-${color.name.toLowerCase()}`}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      <div
                                        className="w-4 h-4 rounded-full border border-input"
                                        style={{ backgroundColor: color.value }}
                                      />
                                      <span>{color.name}</span>
                                      {column.color === color.value && (
                                        <Check className="w-4 h-4 ml-auto text-blue-600" />
                                      )}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              {/* Duplicate Status - Submenu */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                  className="text-xs"
                                  data-testid={`kanban-column-duplicate-submenu-trigger-${column.id}`}
                                >
                                  <Copy className="w-3.5 h-3.5 mr-2" />
                                  Duplicate Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDuplicateColumn(column.id)
                                    }
                                    className="text-xs"
                                    data-testid={`kanban-column-duplicate-btn-${column.id}`}
                                  >
                                    Duplicate tasks
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDuplicateColumn(column.id)
                                    }
                                    className="text-xs"
                                    data-testid={`kanban-column-duplicate-without-tasks-btn-${column.id}`}
                                  >
                                    Duplicate without tasks
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              <DropdownMenuSeparator />

                              {/* Hide Status */}
                              <DropdownMenuItem
                                onClick={() => hideColumn(projectId, column.id)}
                                className="text-xs"
                                data-testid={`kanban-column-hide-btn-${column.id}`}
                              >
                                <EyeOff className="w-3.5 h-3.5 mr-2" />
                                Hide Status
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Move Status - Submenu */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-xs">
                                  <LogOut className="w-3.5 h-3.5 mr-2" />
                                  Move Status to
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem className="text-xs">
                                    Move to top
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs">
                                    Move to bottom
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              <DropdownMenuSeparator />

                              {/* Export Status */}
                              <DropdownMenuItem className="text-xs">
                                <FolderUp className="w-3.5 h-3.5 mr-2" />
                                Export Status
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Complete All Tasks */}
                              <DropdownMenuItem
                                onClick={() => handleArchiveAllTasks(column.id)}
                                className="text-xs"
                                data-testid={`kanban-column-complete-all-btn-${column.id}`}
                              >
                                <CheckCheck className="w-3.5 h-3.5 mr-2" />
                                Complete all tasks
                              </DropdownMenuItem>

                              {/* Archive Status */}
                              <DropdownMenuItem className="text-xs">
                                <Archive className="w-3.5 h-3.5 mr-2" />
                                Archive Status
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Delete Status */}
                              <DropdownMenuItem
                                onClick={() => handleDeleteColumn(column.id)}
                                disabled={!canDeleteColumn(column.id)}
                                className="text-red-600 focus:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                data-testid={`kanban-column-delete-btn-${column.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Delete Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Plus"
                            data-testid={`kanban-column-add-task-trigger-${column.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTask(column.id);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </KanbanHeader>

                    {/* Cards Container */}
                    <KanbanCards
                      id={column.id}
                      className="gap-2"
                      data-testid={`kanban-column-cards-${column.id}`}
                      footer={
                        <>
                          {/* Show Add Task Card INSIDE KanbanCards */}
                          {addingTaskInColumn === column.id && (
                            <AddTaskCard
                              columnName={column.name}
                              onSave={() => handleSaveNewTask(column.id)}
                              onCancel={handleCancelAddTask}
                            />
                          )}

                          {/* Add Task Button at bottom of column */}
                          <div className="px-2 pb-2">
                            <Button
                              variant="outline"
                              size="lg"
                              className="flex justify-start items-center gap-2 border-l-4 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors py-2 px-3 rounded-md w-full h-8"
                              style={{ borderLeftColor: `${column.color}80` }}
                              onClick={() => handleAddTask(column.id)}
                              disabled={addingTaskInColumn === column.id}
                              data-testid={`kanban-column-add-task-bottom-btn-${column.id}`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Task
                            </Button>
                          </div>
                        </>
                      }
                    >
                      {(task) => {
                        // Get the full task data
                        const fullTask = projectTasks.find(
                          (t) => t.id === task.id,
                        );
                        if (!fullTask) return null;

                        // Get subtasks for this parent task that are in the same column
                        const taskSubtasks = subtasks.filter((st) => {
                          if (st.parentTaskId !== task.id) return false;
                          const subtaskStatus =
                            st.status || taskStatusConfigs[0]?.value || "";
                          const config = taskStatusConfigs.find(
                            (c) => c.value === subtaskStatus,
                          );
                          return config?._id === task.column;
                        });

                        const hasSubtasks = taskSubtasks.length > 0;
                        const isAddingSubtask =
                          addingSubtaskToTask === fullTask.id;

                        return (
                          <KanbanCard
                            key={task.id}
                            id={task.id}
                            name={task.name}
                            column={task.column}
                            onClick={() => handleTaskClick(fullTask.id)}
                            className={cn(
                              "px-2 py-0 border-none gap-2 shadow-none bg-transparent ring-0",
                              hasSubtasks && "p-2 bg-muted rounded-lg",
                            )}
                          >
                            {/* Parent Task */}
                            <CustomKanbanCard
                              task={fullTask}
                              projectId={projectId}
                              onClick={() => handleTaskClick(fullTask.id)}
                              showSubtasks={true}
                              onAddSubtaskClick={() =>
                                handleStartAddSubtask(fullTask.id)
                              }
                              isAddingSubtask={
                                addingSubtaskToTask === fullTask.id
                              }
                              isSubtasksExpanded={expandedTasks.has(
                                fullTask.id,
                              )}
                              onToggleSubtasks={() =>
                                handleToggleSubtasks(fullTask.id)
                              }
                              hideChevron={displayOptions.collapsedSubtasks}
                              wrapText={displayOptions.wrapText}
                              showParentId={displayOptions.subtaskParentId}
                            />

                            {/* Add Subtask Card - Show when adding */}
                            {isAddingSubtask && (
                              <AddSubtaskCard
                                onSave={() => handleSaveNewSubtask(fullTask.id)}
                                onCancel={handleCancelAddSubtask}
                              />
                            )}

                            {/* Subtasks nested under parent - Only show when expanded and global collapse is off */}
                            {!displayOptions.collapsedSubtasks &&
                              expandedTasks.has(fullTask.id) &&
                              taskSubtasks.map((subtask) => (
                                <div
                                  key={subtask.id}
                                  className={cn("ml-6")}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* <CustomKanbanCard
                                  task={subtask} */}
                                  <SubtaskKanbanCard // ← subscribes to store directly, always fresh
                                    subtaskId={subtask.id}
                                    projectId={projectId}
                                    parentTaskId={fullTask.id}
                                    onClick={() => handleTaskClick(subtask.id)}
                                    wrapText={displayOptions.wrapText}
                                    showParentId={
                                      displayOptions.subtaskParentId
                                    }
                                  />
                                </div>
                              ))}
                          </KanbanCard>
                        );
                      }}
                    </KanbanCards>
                  </KanbanBoard>
                )}
              </KanbanProvider>
              {/* ✅ Add Group Button/Card - OUTSIDE KanbanProvider */}
              <div className="self-start">
                {isCreatingNewGroup ? (
                  <AddGroupCard
                    onSave={handleSaveNewGroup}
                    onCancel={handleCancelCreateGroup}
                  />
                ) : (
                  <button
                    onClick={handleStartCreateGroup}
                    data-testid="kanban-add-group-btn"
                    className="w-80 bg-card rounded-lg hover:bg-muted p-2 transition-colors flex items-center justify-start gap-2 text-muted-foreground hover:text-foreground font-medium text-xs"
                  >
                    <Plus className="w-5 h-5" />
                    Add Group
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Add this TaskDetailView component */}
        <TaskDetailView
          task={selectedTask}
          projectId={projectId}
          open={isTaskDetailOpen}
          onOpenChange={handleCloseTaskDetail}
          isSubtask={!!(selectedTask as any)?.parentTaskId} // hides subtask section
        />
      </div>
    </DndProvider>
  );
};

export default KanbanView;
