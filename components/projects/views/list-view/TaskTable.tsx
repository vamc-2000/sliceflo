// components/list-view/TaskTable.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar as UIAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuPortal,
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
  PopoverClose,
} from "@/components/ui/popover";
import { CalendarPicker } from "@/components/CalendarPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Target,
  Repeat,
  Trash2,
  User,
  Flag,
  ChevronsLeftRight,
  Info,
  LayoutTemplate,
  Link2,
  Ban,
  XOctagon,
  CircleArrowLeft,
  CircleArrowRight,
  SkipBack,
  SkipForward,
  GitMerge,
  Users,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Pencil,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isWithinInterval, isFuture } from "date-fns";
import {
  formatLocalDate,
  convertSelectedDateToUTC,
  convertUTCToCalendarDate,
} from "@/utils/timezone-utils";
import {
  getRelationshipIcon,
  getRelationshipIconColor,
  getRelationshipLabel,
} from "@/utils/relationship-utils";
import { useTasksStore, SYSTEM_FIELDS } from "@/stores/tasks-store";
import { Task, ColumnConfig } from "@/types/task.types";
import { CustomFieldDropdown } from "@/components/projects/views/list-view/common/CustomFieldDropdown";
import { TaskDetailView } from "@/components/projects/TaskDetailView";
import { ListFieldVisibilityPopup } from "@/components/projects/views/list-view/common/ListFieldVisibilityPopup";
import { useProjectsStore, TaskTypeConfig } from "@/stores/projects-store";
import { formatTaskId } from "@/utils/task-utils";
import { formatCycleName } from "@/utils/cycle-utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "@/components/ui/sonner";
import DuplicateTaskDialog from "@/components/projects/DuplicateTaskDialog";
import { useGoalsStore } from "@/stores/goals-store";
import { ConvertToSubtaskDialog } from "@/components/projects/ConvertToSubtaskDialog";
import { EditCustomFieldPopup } from "./common/EditCustomFieldPopup";
import { MemberAvatar } from "../../MemberAvatar";
import { RelationshipDetailDialog } from "./common/RelationshipDetailDialog";
import { iconComponentMap } from "@/components/ColorIconPicker";
interface TaskTableProps {
  groupId: string;
  projectId: string;
  hideFields: string[];
  groupBy?: string;
  filteredTasks?: Task[];
  groupName?: string;
  groupMemberId?: string;
  groupFieldId?: string;
  columnConfigs?: ColumnConfig[];
  displayOptions?: {
    collapsedSubtasks: boolean;
    closedTasks: boolean;
    wrapText: boolean;
    subtaskParentId: boolean;
  };
  groupColor?: string;
  activeSortConfig?: {
    fieldId: string;
    fieldType: string;
    direction: "asc" | "desc";
    order: number;
  }[];
  onSortChange?: (fieldId: string, fieldType: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  clearSelection?: boolean;
  defaultCycleId?: string;
}

// ── Priority flag ────────────────────────────────────────────────────────────
function PriorityFlag({
  priority,
  color,
}: {
  priority?: string;
  color?: string;
}) {
  if (!priority) {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted">
        <Flag className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  const bg = color || "#9CA3AF";
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

function ResizeHandle({
  columnId,
  onResize,
  onDoubleClick,
}: ResizeHandleProps) {
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

export function TaskTable({
  groupId,
  projectId,
  hideFields,
  groupBy = "status",
  filteredTasks,
  groupName,
  groupMemberId,
  groupFieldId,
  columnConfigs = [],
  displayOptions = {
    collapsedSubtasks: false,
    closedTasks: false,
    wrapText: false,
    subtaskParentId: false,
  },
  groupColor = "#3B82F6",
  activeSortConfig = [],
  onSortChange,
  onSelectionChange,
  clearSelection,
  defaultCycleId,
}: TaskTableProps) {
  // At the top of TaskTable, add this helper:
  const getSortIcon = (fieldId: string, fieldType: string) => {
    const active = activeSortConfig.find((s) => s.fieldId === fieldId);
    if (!active) {
      return (
        <ChevronsUpDown
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-muted rounded p-0.5"
          onClick={() => onSortChange?.(fieldId, fieldType)}
        />
      );
    }
    const Icon = active.direction === "asc" ? ArrowUp : ArrowDown;
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
    tasks,
    subtasks: storeSubtasks,
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
    removeTaskRelationship,
    convertTaskToSubtask,
    getTasksByProject,
  } = useTasksStore();
  const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
  const goals = useGoalsStore((state) => state.goals);

  // ✅ ADD THIS LINE — makes TaskTable re-render when any field is toggled
  const systemFieldVisibility = useTasksStore(
    (state) => state.systemFieldVisibility,
  );

  React.useEffect(() => {
    let lastDragEvent: DragEvent | null = null;
    let animationFrameId: number | null = null;

    const handleDragOver = (e: DragEvent) => {
      lastDragEvent = e;
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    const handleDragEndOrDrop = () => {
      lastDragEvent = null;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const scrollLoop = () => {
      if (!lastDragEvent) {
        animationFrameId = null;
        return;
      }

      const clientY = lastDragEvent.clientY;
      const clientX = lastDragEvent.clientX;

      const containers = document.querySelectorAll(".drag-scroll-container");
      containers.forEach((container) => {
        const rect = container.getBoundingClientRect();

        if (clientX >= rect.left && clientX <= rect.right) {
          const threshold = 60;
          const maxSpeed = 15;

          if (clientY >= rect.top && clientY <= rect.bottom) {
            if (clientY - rect.top < threshold) {
              const intensity = (threshold - (clientY - rect.top)) / threshold;
              container.scrollTop -= intensity * maxSpeed;
            } else if (rect.bottom - clientY < threshold) {
              const intensity =
                (threshold - (rect.bottom - clientY)) / threshold;
              container.scrollTop += intensity * maxSpeed;
            }
          }
        }
      });

      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragend", handleDragEndOrDrop);
    window.addEventListener("drop", handleDragEndOrDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragend", handleDragEndOrDrop);
      window.removeEventListener("drop", handleDragEndOrDrop);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const handleMoveTaskToGroup = async (taskId: string) => {
    const originalTask = tasks.find((t) => t.id === taskId);
    if (!originalTask) return;

    const updates: Partial<Task> = {};

    if (groupBy === "status" && groupName && groupName !== "Untitled") {
      const config = taskStatusConfigs.find((c) => c.label === groupName);
      const newStatus = config?.value ?? groupName;
      if (originalTask.status !== newStatus) {
        updates.status = newStatus;
      }
    } else if (
      groupBy === "priority" &&
      groupName &&
      groupName !== "Untitled"
    ) {
      if (originalTask.priority !== groupName) {
        updates.priority = groupName;
      }
    } else if (groupBy === "assignee") {
      const newAssignee =
        groupName === "Unassigned"
          ? ""
          : members.find((m) => m.name === groupName)?.userId || "";
      if (originalTask.assignee !== newAssignee) {
        updates.assignee = newAssignee;
      }
    } else if (groupBy === "dueDate") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (groupId === "date-today") {
        const todayStr = today.toISOString();
        if (originalTask.endDate !== todayStr) updates.endDate = todayStr;
      } else if (groupId === "date-no-date") {
        if (originalTask.endDate) updates.endDate = "";
      }
    } else if (groupBy?.startsWith("custom-") && groupFieldId) {
      const newValue = groupName === "No Value" || !groupName ? "" : groupName;
      const customFieldValues = { ...(originalTask.customFieldValues || {}) };
      if (customFieldValues[groupFieldId] !== newValue) {
        customFieldValues[groupFieldId] = newValue;
        updates.customFieldValues = customFieldValues;
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateTask(taskId, updates);
      toast("success", { title: `Task moved to group: ${groupName}` });
    }
  };

  const [{ isOverTable }, tableDropRef] = useDrop({
    accept: "TASK_ROW",
    drop: (item: { taskId: string; sourceGroupId: string }, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;
      if (item.sourceGroupId !== groupId) {
        handleMoveTaskToGroup(item.taskId);
      }
    },
    collect: (monitor) => ({
      isOverTable: !!monitor.isOver({ shallow: true }),
    }),
  });

  const project = projects.find((p) => p.id === projectId);
  const allCycles = project?.cycles || [];
  const activeOrUpcomingCycles = React.useMemo(() => {
    const now = new Date();
    return allCycles.filter((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      const isActive = isWithinInterval(now, { start, end });
      const isUpcoming = isFuture(start);
      return isActive || isUpcoming;
    });
  }, [allCycles]);
  const projectSlug = project?.slug ?? "TASK";
  const customFields = getTaskCustomFields(projectId);
  const taskTypes = getTaskTypesByProject(projectId);
  const taskStatusConfigs = getTaskStatusConfigs(projectId);
  const taskPriorityConfigs = getTaskPriorityConfigs(projectId);
  const members = workspaceMembers.filter((wm) =>
    project?.members?.some((pm) => pm.userId === wm.userId),
  );

  const [showAddTask, setShowAddTask] = useState(false);
  const [isAddTaskRowHovered, setIsAddTaskRowHovered] = useState(false);
  const [showTaskTypeMenu, setShowTaskTypeMenu] = useState(false);
  const [taskTypeMenuCoords, setTaskTypeMenuCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const chevronButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedAddTaskType, setSelectedAddTaskType] = useState("task");
  const [addingSubtaskToTask, setAddingSubtaskToTask] = useState<string | null>(
    null,
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    () => new Set(),
  );

  // Add near other useState declarations (around line 342)
  const [copiedTaskItem, setCopiedTaskItem] = useState<"link" | "id" | null>(
    null,
  );
  const [copiedSubtaskItem, setCopiedSubtaskItem] = useState<
    "link" | "id" | null
  >(null);

  // Task delete confirmation
  const [deleteTaskConfirmId, setDeleteTaskConfirmId] = useState<string | null>(
    null,
  );
  // Subtask delete confirmation
  const [deleteSubtaskConfirmId, setDeleteSubtaskConfirmId] = useState<
    string | null
  >(null);

  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");

  const getFilteredMembers = () => {
    const query = assigneeSearchQuery.startsWith("@")
      ? assigneeSearchQuery.slice(1)
      : assigneeSearchQuery;
    if (!query) return members;
    return members.filter((member) =>
      member.name.toLowerCase().includes(query.toLowerCase()),
    );
  };

  const DEFAULT_COL_WIDTH = 150;
  const MIN_COL_WIDTH = 100;
  const MAX_COL_WIDTH = 500;

  const TASK_COL_DEFAULT_WIDTH = 300;

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      const defaults: Record<string, number> = {};
      // pre-seed with defaults for all known column ids
      (columnConfigs ?? []).forEach((c) => {
        // Task column gets a wider default than regular columns
        defaults[c.id] =
          c.id === "task" ? TASK_COL_DEFAULT_WIDTH : DEFAULT_COL_WIDTH;
      });
      return defaults;
    },
  );

  // Ref always holds the latest widths so handleColumnResize can read
  // current values without closures going stale during rapid mouse-move
  const columnWidthsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    columnWidthsRef.current = columnWidths;
  }, [columnWidths]);

  const handleColumnResize = useCallback(
    (columnId: string, deltaX: number) => {
      // Compute next width OUTSIDE the setState updater so we can also
      // call updateColumnWidth without triggering "update during render".
      const prev = columnWidthsRef.current;
      const next = Math.min(
        MAX_COL_WIDTH,
        Math.max(MIN_COL_WIDTH, (prev[columnId] ?? DEFAULT_COL_WIDTH) + deltaX),
      );
      // Update ref immediately so rapid events always base on latest value
      columnWidthsRef.current = { ...prev, [columnId]: next };
      setColumnWidths(columnWidthsRef.current);
      updateColumnWidth(columnId, next); // persist to store — now outside setState
    },
    [updateColumnWidth],
  );

  const handleColumnToggleCollapse = useCallback(
    (columnId: string) => {
      // Task column resets to its wider default; all others use DEFAULT_COL_WIDTH
      const resetWidth =
        columnId === "task" ? TASK_COL_DEFAULT_WIDTH : DEFAULT_COL_WIDTH;
      columnWidthsRef.current = {
        ...columnWidthsRef.current,
        [columnId]: resetWidth,
      };
      setColumnWidths(columnWidthsRef.current);
      updateColumnWidth(columnId, resetWidth);
    },
    [updateColumnWidth],
  );

  useEffect(() => {
    if (!showTaskTypeMenu) return;
    const handleClick = () => setShowTaskTypeMenu(false);
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTaskTypeMenu]);

  useEffect(() => {
    if (displayOptions.collapsedSubtasks) {
      setExpandedTasks(new Set());
    } else {
      // Initialize only if empty, or only add tasks that actually have subtasks and aren't in the set
      setExpandedTasks((prev) => {
        const next = new Set(prev);
        const validIds = new Set((filteredTasks || []).map((t) => t.id));

        // Remove IDs that are no longer in the filtered list
        Array.from(next).forEach((id) => {
          if (!validIds.has(id)) next.delete(id);
        });

        // Auto-expand tasks that HAVE subtasks ONLY if they were not explicitly collapsed by user before
        // But to keep it simple and follow "only respective box expand",
        // we might just want to expand tasks that have subtasks initially if they are new.
        (filteredTasks || []).forEach((task) => {
          if (getSubtasksByTask(task.id)?.length > 0) {
            // If it's a newly appeared task with subtasks, we might want to expand it.
            // But if it was already there, we respect its current state in 'prev'.
          }
        });

        return next;
      });
    }
  }, [displayOptions.collapsedSubtasks, filteredTasks, getSubtasksByTask]);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");

  const handleRenameStart = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenamingName(currentName);
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenamingName("");
  };

  const handleRenameSave = async (id: string, isSubtask: boolean = false) => {
    if (!renamingName.trim()) {
      handleRenameCancel();
      return;
    }
    try {
      if (isSubtask) {
        await updateSubtask(id, { name: renamingName.trim() });
      } else {
        await updateTask(id, { name: renamingName.trim() });
      }
      toast("success", { title: "Name updated successfully" });
    } catch (error) {
      toast("error", { title: "Failed to update name" });
    } finally {
      handleRenameCancel();
    }
  };

  const [newTaskData, setNewTaskData] = useState({
    name: "",
    taskType: "task",
    assignee: "",
    startDate: new Date() as Date | undefined,
    endDate: undefined as Date | undefined,
    priority: "" as string,
    status: "" as string,
    cycleId: undefined as string | null | undefined,
    customFieldValues: {} as Record<string, string | string[]>,
  });

  const [newSubtaskData, setNewSubtaskData] = useState({
    name: "",
    taskType: "task",
    assignee: "",
    priority: "" as string,
    status: "" as string,
    cycleId: undefined as string | null | undefined,
    startDate: new Date() as Date | undefined,
    endDate: undefined as Date | undefined,
    customFieldValues: {} as Record<string, string | string[]>,
  });

  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const [selectedSubtaskForDetail, setSelectedSubtaskForDetail] =
    useState<Task | null>(null);
  const [showSubtaskDetail, setShowSubtaskDetail] = useState(false);

  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriorityName, setNewPriorityName] = useState("");

  const [convertToSubtaskTaskId, setConvertToSubtaskTaskId] = useState<
    string | null
  >(null);

  // ── Relationship Dialog state ──────────────────────────────────────
  const [relDialogOpen, setRelDialogOpen] = useState(false);
  const [relDialogTaskId, setRelDialogTaskId] = useState<string | null>(null);
  const [relDialogType, setRelDialogType] = useState<string>("relates-to");
  const [relDialogTargetId, setRelDialogTargetId] = useState<string>("");
  const [relDialogIsSubtask, setRelDialogIsSubtask] = useState(false);

  const RELATIONSHIP_TYPES = [
    {
      value: "relates-to",
      label: "Relates to",
      icon: Link2,
      color: "text-blue-500",
    },
    {
      value: "duplicate-of",
      label: "Duplicate of",
      icon: Copy,
      color: "text-purple-500",
    },
    {
      value: "blocked-by",
      label: "Blocked by",
      icon: Ban,
      color: "text-red-500",
    },
    {
      value: "blocking",
      label: "Blocking",
      icon: XOctagon,
      color: "text-orange-500",
    },
    {
      value: "starts-before",
      label: "Starts Before",
      icon: CircleArrowLeft,
      color: "text-green-500",
    },
    {
      value: "starts-after",
      label: "Starts After",
      icon: CircleArrowRight,
      color: "text-teal-500",
    },
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

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  const [duplicateTaskId, setDuplicateTaskId] = useState<string | null>(null);
  const [duplicateSubtaskId, setDuplicateSubtaskId] = useState<string | null>(
    null,
  );
  const [hoveredRelKey, setHoveredRelKey] = useState<string | null>(null);

  const renderRelationshipIcons = (item: any, isSubtask: boolean) => {
    const taskRels = getTaskRelationships(item.id);
    if (!taskRels || !taskRels.length) return null;
    const seenTypes = new Set<string>();
    const uniqueRels = taskRels.filter((rel) => {
      if (seenTypes.has(rel.type)) return false;
      seenTypes.add(rel.type);
      return true;
    });
    return uniqueRels.map((rel) => {
      const RelIcon = getRelationshipIcon(rel.type);
      const targetTask =
        tasks.find((t) => t.id === rel.targetTaskId) ||
        storeSubtasks.find((st) => st.id === rel.targetTaskId);

      if (!targetTask) {
        return (
          <RelIcon
            key={rel.type}
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              getRelationshipIconColor(rel.type),
            )}
            title={getRelationshipLabel(rel.type)}
          />
        );
      }

      const relKey = `${item.id}-${rel.type}`;

      return (
        <Popover
          key={rel.type}
          open={hoveredRelKey === relKey}
          onOpenChange={(open) => !open && setHoveredRelKey(null)}
        >
          <PopoverTrigger asChild>
            <div
              className="cursor-pointer inline-block align-middle"
              onMouseEnter={() => setHoveredRelKey(relKey)}
              onMouseLeave={() => setHoveredRelKey(null)}
            >
              <RelIcon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  getRelationshipIconColor(rel.type),
                )}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-auto p-0 shadow-2xl bg-card z-[100]"
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
    });
  };

  const duplicateTask = useTasksStore((s) => s.duplicateTask);

  useEffect(() => {
    if (clearSelection) {
      setSelectedTaskIds(new Set());
    }
  }, [clearSelection]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
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
      setSelectedTaskIds(new Set(groupTasks.map((t) => t.id)));
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
    updates: {
      name: string;
      priority?: string;
      endDate?: string;
      assignee?: string;
    },
  ) => {
    if (!convertToSubtaskTaskId) return;
    await convertTaskToSubtask(convertToSubtaskTaskId, parentTaskId, updates);
    setConvertToSubtaskTaskId(null);
    toast("success", { title: "Task converted to subtask" });
  };

  const getGroupPrefillData = () => {
    const prefill: Partial<typeof newTaskData> = {};

    prefill.startDate = new Date();

    if (defaultCycleId) {
      prefill.cycleId = defaultCycleId;
    }
    if (groupBy === "status" && groupName && groupName !== "Untitled") {
      const config = taskStatusConfigs.find((c) => c.label === groupName);
      prefill.status = config?.value ?? groupName;
    }
    if (groupBy === "priority" && groupName && groupName !== "Untitled") {
      prefill.priority = groupName;
    }
    if (groupBy === "assignee" && groupName && groupName !== "Unassigned") {
      const member = members.find((m) => m.name === groupName);
      if (member) prefill.assignee = member.userId;
    }
    if (groupBy === "taskType" && groupName && groupName !== "Untitled") {
      const type = taskTypes.find((t) => t.label === groupName);
      if (type) prefill.taskType = type.value;
    }
    if (groupBy === "cycle" && groupName && groupName !== "Untitled") {
      const cycle = project?.cycles?.find((c) => c.name === groupName);
      if (cycle) prefill.cycleId = cycle.id;
    }

    return prefill;
  };

  const groupTasks = filteredTasks || [];

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

  const handleSaveTask = async () => {
    if (!newTaskData.name.trim()) return;
    console.log("Saving new task with data:", newTaskData);
    console.log("Saving new task with data status:", newTaskData.status);
    // ✅ Fix — only override if user hasn't explicitly chosen one
    let status = newTaskData.status || undefined;
    if (
      !status &&
      groupBy === "status" &&
      groupName &&
      groupName !== "Untitled"
    ) {
      const config = taskStatusConfigs.find((c) => c.label === groupName);
      status = config?.value;
    }
    const allowedStatuses = taskStatusConfigs.map((c) => c.value);
    if (status && !allowedStatuses.includes(status)) {
      status = taskStatusConfigs[0]?.value || "backlog";
    }
    let priority = newTaskData.priority || undefined;
    if (groupBy === "priority" && groupName && groupName !== "Untitled")
      priority = groupName;
    let assignee = newTaskData.assignee || undefined;
    if (groupBy === "assginee" && groupName && groupName !== "Unassigned") {
      // ✅ Find member by name and use their userId
      const member = members.find((m) => m.name === groupName);
      assignee = member?.userId; // Use userId instead of name
    }
    // ✅ Fix — prefer inline picker, fall back to chevron-menu selection
    let taskType = newTaskData.taskType || selectedAddTaskType;
    if (groupBy === "taskType" && groupName && groupName !== "Untitled") {
      const type = taskTypes.find((t) => t.label === groupName);
      taskType = type?.value || newTaskData.taskType || selectedAddTaskType;
    }

    let customFieldValues = { ...newTaskData.customFieldValues };
    if (
      groupBy.startsWith("custom-") &&
      groupFieldId &&
      typeof groupName === "string" &&
      groupName !== "No Value"
    ) {
      customFieldValues[groupFieldId] = groupName;
    }
    let cycleId = newTaskData.cycleId;
    if (
      cycleId === undefined &&
      groupBy === "cycle" &&
      groupName &&
      groupName !== "Untitled"
    ) {
      const cycle = project?.cycles?.find((c) => c.name === groupName);
      if (cycle) cycleId = cycle.id;
    }
    console.log("Final status value for new task:", status);

    const capturedData = { ...newTaskData, cycleId }; // snapshot before reset
    const capturedTaskType = taskType; // capture before reset

    // Close input row immediately
    setNewTaskData({
      name: "",
      taskType: "task",
      assignee: "",
      startDate: new Date(),
      endDate: undefined,
      priority: "",
      status: "",
      cycleId: undefined,
      customFieldValues: {},
    });
    setSelectedAddTaskType("task");
    setShowTaskTypeMenu(false);
    setShowAddTask(false);

    const onConfirmed =
      capturedTaskType === "milestone"
        ? (realId: string) => {
            // Swap tempId → realId so the row stays open under the real task
            setExpandedTasks((prev) => {
              const next = new Set(prev);
              next.delete(tempId); // remove stale tempId
              next.add(realId); // add real id
              return next;
            });
            setAddingSubtaskToTask(realId); // update to real id
          }
        : undefined;

    const tempId = await addTask(
      {
        projectId,
        name: capturedData.name,
        taskType,
        assignee,
        startDate: capturedData.startDate
          ? convertSelectedDateToUTC(capturedData.startDate)
          : undefined,
        endDate: capturedData.endDate
          ? convertSelectedDateToUTC(capturedData.endDate)
          : undefined,
        priority,
        status,
        cycleId: capturedData.cycleId,
        completed: false,
        customFieldValues,
      },
      onConfirmed,
    );

    // Open subtask row immediately with tempId while API is in flight
    if (capturedTaskType === "milestone" && tempId) {
      setNewSubtaskData({
        name: "",
        taskType: "task",
        status: status || "",
        assignee: assignee || "",
        priority: priority || "",
        cycleId: undefined,
        endDate: capturedData.endDate
          ? new Date(capturedData.endDate)
          : undefined,
        startDate: new Date(),
        customFieldValues: {},
      });
      setExpandedTasks((prev) => new Set([...prev, tempId]));
      setAddingSubtaskToTask(tempId);
    }
  };

  const handleSaveSubtask = async (parentTaskId: string) => {
    if (!newSubtaskData.name.trim()) return;
    const parentTask = groupTasks.find((t) => t.id === parentTaskId);
    let status = newSubtaskData.status || undefined;
    if (
      !status &&
      groupBy === "status" &&
      groupName &&
      groupName !== "Untitled"
    ) {
      const config = taskStatusConfigs.find((c) => c.label === groupName);
      status = config?.value;
    }
    if (!status && parentTask?.status) {
      status = parentTask.status;
    }
    const allowedStatuses = taskStatusConfigs.map((c) => c.value);
    if (status && !allowedStatuses.includes(status)) {
      status = parentTask?.status || taskStatusConfigs[0]?.value || "backlog";
    }
    let priority = newSubtaskData.priority || undefined;
    if (groupBy === "priority" && groupName && groupName !== "Untitled")
      priority = groupName;
    let assignee = newSubtaskData.assignee || undefined;
    if (groupBy === "assginee" && groupName && groupName !== "Unassigned") {
      // ✅ Find member by name and use their userId
      const member = members.find((m) => m.name === groupName);
      assignee = member?.userId; // Use userId instead of name
    }
    let customFieldValues = { ...newSubtaskData.customFieldValues };
    if (
      groupBy.startsWith("custom-") &&
      groupFieldId &&
      typeof groupName === "string" &&
      groupName !== "No Value"
    ) {
      customFieldValues[groupFieldId] = groupName;
    }
    let cycleId = newSubtaskData.cycleId;
    if (cycleId === undefined && parentTask?.cycleId) {
      cycleId = parentTask.cycleId;
    }
    if (cycleId === undefined && defaultCycleId) {
      cycleId = defaultCycleId;
    }
    console.log("Final status value for new subtask:", status);

    const capturedSubtask = { ...newSubtaskData, cycleId };

    // ✅ Close the input row IMMEDIATELY — don't wait for API
    setNewSubtaskData({
      name: "",
      taskType: "task",
      assignee: "",
      startDate: new Date(),
      endDate: undefined,
      priority: "",
      status: "",
      cycleId: undefined,
      customFieldValues: {},
    });
    setAddingSubtaskToTask(null); // ← closes the subtask input row instantly

    // Now call addSubtask with the snapshot — returns tempId immediately
    await addSubtask({
      name: capturedSubtask.name,
      taskType: capturedSubtask.taskType || "task",
      parentTaskId,
      projectId,
      assignee: capturedSubtask.assignee || undefined,
      startDate: capturedSubtask.startDate
        ? convertSelectedDateToUTC(capturedSubtask.startDate)
        : undefined,
      endDate: capturedSubtask.endDate
        ? convertSelectedDateToUTC(capturedSubtask.endDate)
        : undefined,
      priority: capturedSubtask.priority || undefined,
      status: capturedSubtask.status || undefined,
      cycleId: capturedSubtask.cycleId,
      completed: false,
      customFieldValues: capturedSubtask.customFieldValues || {},
    });
  };

  const handleAddStatus = async (
    name: string,
    taskId?: string,
    isSubtask?: boolean,
    subtaskId?: string,
  ) => {
    if (!name.trim()) return;
    await addTaskStatusConfig(projectId, {
      label: name,
      color: "#6B7280",
      value: name.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    if (taskId && !isSubtask) updateTask(taskId, { status: name.trim() });
    else if (subtaskId) updateSubtask(subtaskId, { status: name.trim() });
    setNewStatusName("");
    setIsAddingStatus(false);
  };

  const handleAddPriority = async (
    name: string,
    taskId?: string,
    isSubtask?: boolean,
    subtaskId?: string,
  ) => {
    if (!name.trim()) return;
    const value = name.trim().toLowerCase().replace(/\s+/g, "_");
    await addTaskPriorityConfig(projectId, {
      label: name.trim(),
      value,
      description: "",
      color: "#6B7280",
      order: taskPriorityConfigs.length + 1,
    });
    if (taskId && !isSubtask) updateTask(taskId, { priority: value });
    else if (subtaskId) updateSubtask(subtaskId, { priority: value });
    setNewPriorityName("");
    setIsAddingPriority(false);
  };

  const handleCopyTaskLink = async (taskId: string) => {
    try {
      const url = `${window.location.origin}/task/${taskId}`;
      await navigator.clipboard.writeText(url);
      setCopiedTaskItem("link");
      toast("success", { title: "Task link copied!" });
      setTimeout(() => setCopiedTaskItem(null), 2000);
    } catch {
      toast("error", { title: "Failed to copy link" });
    }
  };

  const handleCopyTaskId = async (taskId: string) => {
    try {
      await navigator.clipboard.writeText(taskId);
      setCopiedTaskItem("id");
      toast("success", { title: "Task ID copied!" });
      setTimeout(() => setCopiedTaskItem(null), 2000);
    } catch {
      toast("error", { title: "Failed to copy ID" });
    }
  };

  const handleCopySubtaskLink = async (subtaskId: string) => {
    try {
      const url = `${window.location.origin}/task/${subtaskId}`;
      await navigator.clipboard.writeText(url);
      setCopiedSubtaskItem("link");
      toast("success", { title: "Subtask link copied!" });
      setTimeout(() => setCopiedSubtaskItem(null), 2000);
    } catch {
      toast("error", { title: "Failed to copy link" });
    }
  };

  const handleCopySubtaskId = async (subtaskId: string) => {
    try {
      await navigator.clipboard.writeText(subtaskId);
      setCopiedSubtaskItem("id");
      toast("success", { title: "Subtask ID copied!" });
      setTimeout(() => setCopiedSubtaskItem(null), 2000);
    } catch {
      toast("error", { title: "Failed to copy ID" });
    }
  };

  // ── Column visibility / freeze helpers ───────────────────────────────────
  const getVisibleColumnConfigs = () => {
    if (!columnConfigs || columnConfigs.length === 0) return [];
    return columnConfigs.filter((c) => c.pinned !== false);
  };

  const visibleColumnConfigs = getVisibleColumnConfigs();

  const shouldShowField = (fieldKey: string, fieldLabel: string) => {
    if (fieldKey === "id" || fieldKey === "task") return true;
    const key = `${projectId}-list-${fieldKey}`;
    const legacyKey = `${projectId}-${fieldKey}`;

    // If we have a specific setting for this field in this view, use it!
    if (systemFieldVisibility[key] !== undefined)
      return systemFieldVisibility[key];

    const systemFieldIds = [
      "id",
      "task",
      "taskType",
      "status",
      "cycle",
      "assignee",
      "startDate",
      "endDate",
      "priority",
    ];
    const isSystemField = systemFieldIds.includes(fieldKey);

    if (isSystemField) {
      if (systemFieldVisibility[legacyKey] !== undefined)
        return systemFieldVisibility[legacyKey];

      // List Default: Everything except Type, Cycle, and Start Date
      if (
        fieldKey === "taskType" ||
        fieldKey === "startDate" ||
        fieldKey === "cycle"
      )
        return false;

      const field = SYSTEM_FIELDS.find((f) => f.id === fieldKey);
      return field?.defaultVisible ?? true;
    } else {
      // Custom fields in List default to visible
      const columnConfig = columnConfigs.find((c) => c.id === fieldKey);
      return columnConfig?.pinned ?? true;
    }
  };

  const getColumnStyle = (
    columnId: string,
    isHeader: boolean = false,
    rowGroupColor?: string,
    isSubtask: boolean = false,
  ): React.CSSProperties => {
    const columnConfig = visibleColumnConfigs?.find((c) => c.id === columnId);
    const alwaysFrozenColumns = {
      drag: { width: DRAG_COL_WIDTH, order: -2 },
      checkbox: { width: CHECKBOX_COL_WIDTH, order: -1 },
      id: { width: ID_COL_WIDTH, order: 0 },
      task: {
        width: Math.max(columnWidths["task"] ?? TASK_COL_DEFAULT_WIDTH, 150),
        order: 1,
      },
    };
    if (alwaysFrozenColumns[columnId as keyof typeof alwaysFrozenColumns]) {
      const config =
        alwaysFrozenColumns[columnId as keyof typeof alwaysFrozenColumns];
      let leftOffset = 0;
      if (columnId === "checkbox") leftOffset = DRAG_COL_WIDTH;
      if (columnId === "id") leftOffset = DRAG_COL_WIDTH + CHECKBOX_COL_WIDTH;
      if (columnId === "task")
        leftOffset = DRAG_COL_WIDTH + CHECKBOX_COL_WIDTH + ID_COL_WIDTH;

      const baseStyle: React.CSSProperties = {
        position: "sticky",
        left: `${leftOffset}px`,
        zIndex: isHeader ? 25 : 15,
        backgroundColor: isHeader ? "var(--background)" : "var(--card)",
        minWidth: `${config.width}px`,
        width: `${config.width}px`,
        maxWidth: `${config.width}px`,
        boxShadow: "inset -1px 0 0 var(--border)",
      };

      // ← The drag cell carries the group-color left accent border
      if (columnId === "drag" && rowGroupColor) {
        // baseStyle.boxShadow = `inset 4px 0 0 0 ${rowGroupColor}`;
        const offset = isSubtask ? 12 : 0;
        baseStyle.boxShadow = `inset -1px 0 0 var(--border), inset 4px 0 0 ${offset}px ${rowGroupColor}`;
      }

      return baseStyle;
    }
    if (
      columnConfig &&
      columnConfig.columnFreezed &&
      !alwaysFrozenColumns[columnId as keyof typeof alwaysFrozenColumns]
    ) {
      const taskWidth = Math.max(columnWidths["task"] ?? 260, 150);
      const baseOffset =
        DRAG_COL_WIDTH + CHECKBOX_COL_WIDTH + ID_COL_WIDTH + taskWidth;
      const frozenBefore = visibleColumnConfigs
        .filter(
          (c) =>
            c.columnFreezed &&
            c.columnOrder < columnConfig.columnOrder &&
            !alwaysFrozenColumns[c.id as keyof typeof alwaysFrozenColumns],
        )
        .sort((a, b) => a.columnOrder - b.columnOrder);
      let leftOffset = baseOffset;
      frozenBefore.forEach((c) => {
        leftOffset += columnWidths[c.id] ?? DEFAULT_COL_WIDTH;
      });
      const w = columnWidths[columnId] ?? DEFAULT_COL_WIDTH;
      return {
        position: "sticky",
        left: `${leftOffset}px`,
        zIndex: isHeader ? 20 : 10,
        backgroundColor: isHeader ? "var(--header)" : "var(--card)",
        minWidth: `${w}px`,
        width: `${w}px`,
        maxWidth: `${w}px`,
        boxShadow: "inset -1px 0 0 var(--border), 2px 0 4px rgba(0,0,0,0.04)",
      };
    }
    let w = columnWidths[columnId] ?? DEFAULT_COL_WIDTH;
    w = Math.max(w, MIN_COL_WIDTH);
    return {
      minWidth: `${w}px`,
      width: `${w}px`,
      maxWidth: `${w}px`,
      boxShadow: "inset -1px 0 0 var(--border)",
    };
  };

  const shouldShowColumn = (columnId: string): boolean => {
    // Check all columnConfigs (not just pinned-filtered ones)
    // so hidden custom fields are properly excluded from body rows
    const columnConfig = columnConfigs.find((c) => c.id === columnId);
    if (!columnConfig) return true; // not a managed column, always show (system fields)
    return columnConfig.pinned !== false; // explicitly hidden → false
  };

  const getTableHeaders = () => {
    const defaultHeaders = [
      {
        key: "taskType",
        label: "Type",
        fixed: false,
        type: "text",
        isCustom: false,
      },
      {
        key: "status",
        label: "Status",
        fixed: false,
        type: "select-one",
        isCustom: false,
      },
      {
        key: "cycle",
        label: "Cycle",
        fixed: false,
        type: "select-one",
        isCustom: false,
      },
      {
        key: "assignee",
        label: "Assignee",
        fixed: false,
        type: "people",
        isCustom: false,
      },
      {
        key: "startDate",
        label: "Start Date",
        fixed: false,
        type: "date",
        isCustom: false,
      },
      {
        key: "endDate",
        label: "Due Date",
        fixed: false,
        type: "date",
        isCustom: false,
      },
      {
        key: "priority",
        label: "Priority",
        fixed: false,
        type: "select-one",
        isCustom: false,
      },
    ];
    const customHeaders = customFields.map((field) => ({
      key: field.id,
      label: field.name,
      fixed: false,
      type: field.type,
      isCustom: true,
    }));
    let allHeaders = [...defaultHeaders, ...customHeaders];
    allHeaders = allHeaders.filter((h) => shouldShowField(h.key, h.label));
    return allHeaders;
  };

  const headers = getTableHeaders();

  // Lookup priority option color
  const getPriorityColor = (priorityValue?: string): string | undefined => {
    if (!priorityValue) return undefined;
    return taskPriorityConfigs.find((p) => p.value === priorityValue)?.color;
  };

  // Format date nicely: "10 Dec"
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const formatted = formatLocalDate(dateStr);
    return formatted === "—" ? dateStr : formatted;
  };

  // ── Shared cell styles ────────────────────────────────────────────────────
  const headerCellCls =
    "!h-9 font-semibold text-muted-foreground uppercase tracking-wide px-3 py-0 select-none";
  const bodyCellCls = "!h-9 px-3 py-0";
  const DRAG_COL_WIDTH = 40;
  const CHECKBOX_COL_WIDTH = 62;
  const ID_COL_WIDTH = 120;
  const taskCheckboxClass =
    "size-4 shrink-0 rounded flex items-center justify-center [&_[data-slot=checkbox-indicator]]:flex [&_[data-slot=checkbox-indicator]]:items-center [&_[data-slot=checkbox-indicator]]:justify-center [&_[data-slot=checkbox-indicator]_svg]:size-2.5";

  const renderCheckboxColumnContent = (
    checkbox: React.ReactNode,
    expandToggle?: React.ReactNode,
    isSubtask: boolean = false,
  ) => (
    <div
      className={cn(
        "relative flex h-9 w-full items-center",
        isSubtask ? "pl-8" : "pl-6",
      )}
    >
      <div className="absolute left-2 top-1/2 z-[1] flex h-4 w-4 -translate-y-1/2 items-center justify-center">
        {expandToggle ?? <div className="h-4 w-4" aria-hidden />}
      </div>
      <div className="flex h-4 w-4 items-center justify-center shrink-0">
        {checkbox}
      </div>
    </div>
  );

  const renderTaskTypeVisual = (
    type?: TaskTypeConfig | null,
    className = "w-4 h-4",
  ) => {
    if (!type) return null;

    const wrapperClass = `${className} shrink-0 flex items-center justify-center`;

    if (type.icon?.type === "file" && type.icon?.presignedUrl) {
      return (
        <div className={wrapperClass}>
          <img
            src={type.icon.presignedUrl}
            alt={type.label}
            className={`${className} object-contain shrink-0`}
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
            className={`${className} object-contain shrink-0`}
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
              className={`${className} shrink-0`}
              color={type.icon.color || type.color || "#3B82F6"}
            />
          </div>
        );
      }
    }

    return (
      <div className={wrapperClass}>
        <LayoutTemplate
          className={`${className} shrink-0`}
          color={type.color || "#6B7280"}
        />
      </div>
    );
  };

  return (
    <>
      <div
        ref={tableDropRef as any}
        className={cn(
          "relative rounded-sm transition-all duration-200",
          isOverTable &&
            "bg-primary/5 border-2 border-dashed border-primary/50",
        )}
      >
        <div className="overflow-x-auto rounded-tl-sm w-full">
          <Table className="relative border-y border-border text-xs min-w-full">
            {/* ── Column Headers ─────────────────────────────────────────── */}
            <TableHeader>
              <TableRow
                className="bg-card hover:bg-card border-b border-border"
                // style={{ borderLeft: `4px solid ${groupColor}` }}
              >
                {/* Drag handle */}
                <TableHead
                  className={headerCellCls}
                  style={getColumnStyle("drag", true, groupColor)}
                />
                {/* Checkbox */}
                <TableHead
                  className={cn(headerCellCls, "!px-0")}
                  style={getColumnStyle("checkbox", true)}
                >
                  <div className="flex h-9 w-full items-center pl-6">
                    <div className="flex h-4 w-4 items-center justify-center shrink-0">
                      <Checkbox
                        checked={
                          groupTasks.length > 0 &&
                          selectedTaskIds.size === groupTasks.length
                        }
                        onCheckedChange={toggleSelectAll}
                        className={taskCheckboxClass}
                      />
                    </div>
                  </div>
                </TableHead>
                {/* ✅ ID Column Header (frozen) */}
                {shouldShowField("id", "ID") && (
                  <TableHead
                    className={`${headerCellCls} text-center`}
                    style={getColumnStyle("id", true)}
                  >
                    ID
                  </TableHead>
                )}
                {shouldShowField("task", "Task") && (
                  <TableHead
                    className={`${headerCellCls} text-center relative group`}
                    style={getColumnStyle("task", true)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Task</span>
                      {getSortIcon("task", "text")}
                    </div>
                    <ResizeHandle
                      columnId="task"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
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
                      {header.isCustom &&
                        (() => {
                          const fieldData = getTaskCustomFieldById(
                            projectId,
                            header.key,
                          );
                          return fieldData ? (
                            <EditCustomFieldPopup
                              projectId={projectId}
                              field={fieldData}
                            />
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
                  className={cn("w-12 text-center !h-9")}
                  style={{
                    position: "sticky",
                    right: 0,
                    zIndex: 20,
                    backgroundColor: "var(--background)",
                    borderLeft: "1px solid var(--border)",
                    boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
                    padding: 0,
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
                    <DraggableTaskRow
                      task={task}
                      groupId={groupId}
                      groupColor={groupColor}
                      projectId={projectId}
                      projectSlug={projectSlug}
                      taskSubtasks={taskSubtasks}
                      isExpanded={isExpanded}
                      hasSubtasks={hasSubtasks}
                      toggleTaskExpansion={toggleTaskExpansion}
                      selectedTaskIds={selectedTaskIds}
                      toggleTaskSelection={toggleTaskSelection}
                      renamingId={renamingId}
                      renamingName={renamingName}
                      setRenamingName={setRenamingName}
                      handleRenameStart={handleRenameStart}
                      handleRenameSave={handleRenameSave}
                      handleRenameCancel={handleRenameCancel}
                      displayOptions={displayOptions}
                      setNewSubtaskData={setNewSubtaskData}
                      setAddingSubtaskToTask={setAddingSubtaskToTask}
                      setSelectedTaskForDetail={setSelectedTaskForDetail}
                      setShowTaskDetail={setShowTaskDetail}
                      setIsDetailLoading={setIsDetailLoading}
                      fetchTaskById={fetchTaskById}
                      renderRelationshipIcons={renderRelationshipIcons}
                      shouldShowField={shouldShowField}
                      getColumnStyle={getColumnStyle}
                      taskTypes={taskTypes}
                      renderTaskTypeVisual={renderTaskTypeVisual}
                      updateTask={updateTask}
                      taskStatusConfigs={taskStatusConfigs}
                      isAddingStatus={isAddingStatus}
                      newStatusName={newStatusName}
                      setNewStatusName={setNewStatusName}
                      setIsAddingStatus={setIsAddingStatus}
                      handleAddStatus={handleAddStatus}
                      activeOrUpcomingCycles={activeOrUpcomingCycles}
                      formatCycleName={formatCycleName}
                      project={project}
                      members={members}
                      assigneeSearchQuery={assigneeSearchQuery}
                      setAssigneeSearchQuery={setAssigneeSearchQuery}
                      getFilteredMembers={getFilteredMembers}
                      formatDate={formatDate}
                      convertSelectedDateToUTC={convertSelectedDateToUTC}
                      taskPriorityConfigs={taskPriorityConfigs}
                      getPriorityColor={getPriorityColor}
                      isAddingPriority={isAddingPriority}
                      newPriorityName={newPriorityName}
                      setNewPriorityName={setNewPriorityName}
                      setIsAddingPriority={setIsAddingPriority}
                      handleAddPriority={handleAddPriority}
                      customFields={customFields}
                      getTaskCustomFieldById={getTaskCustomFieldById}
                      updateTaskCustomField={updateTaskCustomField}
                      setDuplicateSubtaskId={setDuplicateSubtaskId}
                      setDuplicateTaskId={setDuplicateTaskId}
                      setConvertToSubtaskTaskId={setConvertToSubtaskTaskId}
                      openRelDialog={openRelDialog}
                      RELATIONSHIP_TYPES={RELATIONSHIP_TYPES}
                      setDeleteTaskConfirmId={setDeleteTaskConfirmId}
                      goals={goals}
                      taskCheckboxClass={taskCheckboxClass}
                      bodyCellCls={bodyCellCls}
                      onMoveTask={(draggedTaskId) =>
                        handleMoveTaskToGroup(draggedTaskId)
                      }
                      renderCheckboxColumnContent={renderCheckboxColumnContent}
                      formatTaskId={formatTaskId}
                      handleCopyTaskLink={handleCopyTaskLink}
                      handleCopyTaskId={handleCopyTaskId}
                      handleConvertTaskType={handleConvertTaskType}
                    />

                    {/* ── Subtask Rows ────────────────────────────────────── */}
                    {isExpanded &&
                      taskSubtasks.map((subtask) => (
                        <TableRow
                          key={subtask.id}
                          className="group bg-card hover:bg-card border-b border-border transition-colors"
                        >
                          <TableCell
                            className={bodyCellCls}
                            style={getColumnStyle("drag", false, groupColor)}
                          />
                          <TableCell
                            className={cn(bodyCellCls, "!px-0")}
                            style={getColumnStyle("checkbox", false)}
                          >
                            {renderCheckboxColumnContent(
                              <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={(checked) =>
                                  updateSubtask(subtask.id, {
                                    completed: checked as boolean,
                                  })
                                }
                                className={taskCheckboxClass}
                              />,
                              undefined,
                              true,
                            )}
                          </TableCell>
                          {/* ✅ Subtask ID (frozen) */}
                          <TableCell
                            className={cn(bodyCellCls, "text-center")}
                            style={getColumnStyle("id", false)}
                          >
                            <span className="text-muted-foreground">
                              {formatTaskId(projectSlug, subtask.taskNumber)}
                            </span>
                          </TableCell>
                          <TableCell
                            className={cn(bodyCellCls, "overflow-hidden")}
                            style={getColumnStyle("task", false)}
                          >
                            <div className="flex items-center gap-1.5 pl-4 min-w-0 w-full overflow-hidden">
                              <div className="flex flex-col min-w-0 flex-1 w-full">
                                {displayOptions.subtaskParentId &&
                                  task.taskNumber && (
                                    <span className="text-xs text-muted-foreground leading-tight">
                                      {formatTaskId(
                                        projectSlug,
                                        task.taskNumber,
                                      )}
                                    </span>
                                  )}
                                {renamingId === subtask.id ? (
                                  <Input
                                    value={renamingName}
                                    onChange={(e) =>
                                      setRenamingName(e.target.value)
                                    }
                                    onBlur={() =>
                                      handleRenameSave(subtask.id, true)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleRenameSave(subtask.id, true);
                                      if (e.key === "Escape")
                                        handleRenameCancel();
                                    }}
                                    className="h-7 w-full flex-1 py-1 px-2 text-xs focus-visible:ring-1 focus-visible:ring-blue-400"
                                    autoFocus
                                  />
                                ) : displayOptions.wrapText ? (
                                  /* ── SINGLE-LINE (TRUNCATE) MODE: flex with icons at the right ── */
                                  <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
                                    <span
                                      className={cn(
                                        "text-xs text-foreground min-w-0 flex-1 truncate",
                                        subtask.completed &&
                                          "line-through text-muted-foreground",
                                      )}
                                      onDoubleClick={() =>
                                        handleRenameStart(
                                          subtask.id,
                                          subtask.name || "",
                                        )
                                      }
                                      title={subtask.name}
                                    >
                                      {subtask.name}
                                    </span>

                                    {/* Subtask actions & icons container pushed to the right */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {/* hover action to open subtask detail */}
                                      {renamingId !== subtask.id && (
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-muted-foreground"
                                            onClick={async () => {
                                              const subtaskAsTask: Task = {
                                                ...subtask,
                                                parentTaskId:
                                                  subtask.parentTaskId,
                                                subtasks: [],
                                                relationships: [],
                                              };
                                              setSelectedSubtaskForDetail(
                                                subtaskAsTask,
                                              );
                                              setShowSubtaskDetail(true);
                                            }}
                                          >
                                            <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                                          </button>
                                        </div>
                                      )}

                                      {/* Relationship Icons */}
                                      {renderRelationshipIcons(subtask, true)}
                                    </div>
                                  </div>
                                ) : (
                                  /* ── MULTI-LINE (WRAP) MODE: inline flow with icons at sentence end ── */
                                  <div
                                    className={cn(
                                      "text-xs text-foreground whitespace-normal break-words w-full overflow-hidden",
                                      subtask.completed &&
                                        "line-through text-muted-foreground",
                                    )}
                                    onDoubleClick={() =>
                                      handleRenameStart(
                                        subtask.id,
                                        subtask.name || "",
                                      )
                                    }
                                  >
                                    <span>{subtask.name}</span>

                                    {/* hover action to open subtask detail inline */}
                                    {renamingId !== subtask.id && (
                                      <span className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 align-middle">
                                        <button
                                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-muted-foreground inline-flex"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const subtaskAsTask: Task = {
                                              ...subtask,
                                              parentTaskId:
                                                subtask.parentTaskId,
                                              subtasks: [],
                                              relationships: [],
                                            };
                                            setSelectedSubtaskForDetail(
                                              subtaskAsTask,
                                            );
                                            setShowSubtaskDetail(true);
                                          }}
                                        >
                                          <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                                        </button>
                                      </span>
                                    )}

                                    {/* Relationship Icons inline */}
                                    <span className="inline-flex items-center gap-1 ml-1.5 align-middle">
                                      {renderRelationshipIcons(subtask, true)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Subtask Task Type Cell */}
                          {shouldShowField("taskType", "Type") && (
                            <TableCell
                              className="!p-0 text-center"
                              style={{
                                ...getColumnStyle("taskType", false),
                                height: "1px",
                              }}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  className="w-full h-full"
                                >
                                  <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden px-3 gap-2">
                                    {(() => {
                                      const selectedType =
                                        taskTypes.find(
                                          (t) =>
                                            t.value ===
                                            (subtask.taskType || "task"),
                                        ) || null;

                                      if (!selectedType) return <span>—</span>;

                                      return (
                                        <>
                                          {renderTaskTypeVisual(
                                            selectedType,
                                            "w-3 h-3",
                                          )}
                                          <span className="truncate">
                                            {selectedType.label}
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                  {taskTypes.map((type) => (
                                    <DropdownMenuItem
                                      key={type._id}
                                      onSelect={() =>
                                        updateSubtask(subtask.id, {
                                          taskType: type.value,
                                        })
                                      }
                                      className="p-0 focus:bg-transparent"
                                    >
                                      <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                        {renderTaskTypeVisual(type, "w-3 h-3")}
                                        <span className="truncate">
                                          {type.label}
                                        </span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}

                          {/* Subtask Status */}
                          {shouldShowField("status", "Status") && (
                            <TableCell
                              className="!p-0 text-center"
                              style={{
                                ...getColumnStyle("status", false),
                                height: "1px",
                              }}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  className="w-full h-full"
                                >
                                  <button
                                    className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden px-3"
                                    style={{
                                      backgroundColor:
                                        taskStatusConfigs.find(
                                          (c) => c.value === subtask.status,
                                        )?.color || "#c4c4c4",
                                    }}
                                  >
                                    <span className="truncate w-full text-center">
                                      {taskStatusConfigs.find(
                                        (c) => c.value === subtask.status,
                                      )?.label || "—"}
                                    </span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                  {taskStatusConfigs.map((config) => (
                                    <DropdownMenuItem
                                      key={config._id}
                                      onSelect={() =>
                                        updateSubtask(subtask.id, {
                                          status: config.value,
                                        })
                                      }
                                      className="p-0 focus:bg-transparent"
                                    >
                                      <div
                                        className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3"
                                        style={{
                                          backgroundColor:
                                            config.color || "#c4c4c4",
                                        }}
                                      >
                                        <span className="truncate w-full text-center">
                                          {config.label}
                                        </span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                  {taskStatusConfigs.length > 0 && (
                                    <DropdownMenuSeparator />
                                  )}
                                  {isAddingStatus ? (
                                    <div className="flex gap-1 p-0 h-9 focus:bg-transparent items-center justify-center bg-muted rounded-xs">
                                      <Input
                                        value={newStatusName}
                                        onChange={(e) =>
                                          setNewStatusName(e.target.value)
                                        }
                                        placeholder="Status name"
                                        className="h-9 rounded-xs"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter")
                                            handleAddStatus(
                                              newStatusName,
                                              undefined,
                                              true,
                                              subtask.id,
                                            );
                                          if (e.key === "Escape") {
                                            setIsAddingStatus(false);
                                            setNewStatusName("");
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        className="h-9 rounded-xs"
                                        onClick={() =>
                                          handleAddStatus(
                                            newStatusName,
                                            undefined,
                                            true,
                                            subtask.id,
                                          )
                                        }
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  ) : (
                                    <DropdownMenuItem
                                      onSelect={() => setIsAddingStatus(true)}
                                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add Status
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      updateSubtask(subtask.id, {
                                        status: undefined,
                                      })
                                    }
                                    className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                  >
                                    Clear
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}

                          {/* Subtask Cycle */}
                          {shouldShowField("cycle", "Cycle") && (
                            <TableCell
                              className="!p-0 text-center"
                              style={{
                                ...getColumnStyle("cycle", false),
                                height: "1px",
                              }}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  className="w-full h-full"
                                >
                                  <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:bg-muted overflow-hidden px-3">
                                    <span className="truncate w-full text-center flex items-center justify-center">
                                      {subtask.cycle
                                        ? formatCycleName(
                                            subtask.cycle.name,
                                            subtask.cycle.cycleNumber,
                                          )
                                        : (() => {
                                            const c = project?.cycles?.find(
                                              (c) => c.id === subtask.cycleId,
                                            );
                                            return c ? (
                                              formatCycleName(
                                                c.name,
                                                c.cycleNumber,
                                              )
                                            ) : (
                                              <RefreshCw className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                                            );
                                          })()}
                                    </span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                  {activeOrUpcomingCycles.map((c) => (
                                    <DropdownMenuItem
                                      key={c.id}
                                      onSelect={() =>
                                        updateSubtask(subtask.id, {
                                          cycleId: c.id,
                                        })
                                      }
                                      className="p-0 focus:bg-transparent"
                                    >
                                      <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 bg-muted hover:bg-muted">
                                        <span className="truncate w-full text-center">
                                          {formatCycleName(
                                            c.name,
                                            c.cycleNumber,
                                          )}
                                        </span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                  {activeOrUpcomingCycles.length === 0 && (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                      No cycles available
                                    </div>
                                  )}
                                  {activeOrUpcomingCycles.length > 0 && (
                                    <DropdownMenuSeparator />
                                  )}
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      updateSubtask(subtask.id, {
                                        cycleId: null,
                                      })
                                    }
                                    className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                  >
                                    Clear
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}

                          {/* Subtask Assignee */}
                          {shouldShowField("assignee", "Assignee") && (
                            <TableCell
                              className="!p-0 text-center"
                              style={{
                                ...getColumnStyle("assignee", false),
                                height: "1px",
                              }}
                            >
                              <DropdownMenu
                                onOpenChange={(open) => {
                                  if (!open) setAssigneeSearchQuery("");
                                }}
                              >
                                <DropdownMenuTrigger
                                  asChild
                                  className="w-full h-full"
                                >
                                  <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                                    {(() => {
                                      const m = members.find(
                                        (m) => m.userId === subtask.assignee,
                                      );
                                      return (
                                        <MemberAvatar
                                          size="md"
                                          name={m?.name}
                                          src={m?.profilePicture}
                                        />
                                      );
                                    })()}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                  <div
                                    className="px-1 pb-2"
                                    onKeyDown={(e) => e.stopPropagation()}
                                  >
                                    <Input
                                      placeholder="Type @ or name..."
                                      value={assigneeSearchQuery}
                                      onChange={(e) =>
                                        setAssigneeSearchQuery(e.target.value)
                                      }
                                      className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                                      autoFocus
                                    />
                                  </div>
                                  {getFilteredMembers().length === 0 ? (
                                    <div className="text-center py-2 text-xs text-muted-foreground">
                                      No members found
                                    </div>
                                  ) : (
                                    getFilteredMembers().map((member) => (
                                      <DropdownMenuItem
                                        key={member.userId}
                                        onSelect={() =>
                                          updateSubtask(subtask.id, {
                                            assignee: member.userId,
                                          })
                                        }
                                        className="p-0 focus:bg-transparent"
                                      >
                                        <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                          <MemberAvatar
                                            size="sm"
                                            name={member.name}
                                            src={member.profilePicture}
                                          />
                                          <span className="truncate">
                                            {member.name}
                                          </span>
                                        </div>
                                      </DropdownMenuItem>
                                    ))
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      updateSubtask(subtask.id, {
                                        assignee: undefined,
                                      })
                                    }
                                    className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                  >
                                    Clear
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}

                          {/* ✅ Subtask Start Date */}
                          {shouldShowField("startDate", "Start Date") && (
                            <TableCell
                              className={cn(bodyCellCls, "text-center")}
                              style={getColumnStyle("startDate", false)}
                            >
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                    {subtask.startDate ? (
                                      <span className="font-medium">
                                        {formatDate(subtask.startDate)}
                                      </span>
                                    ) : (
                                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                    )}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-2 border-0 border-b-[5px] border-primary"
                                  align="center"
                                >
                                  <CalendarPicker
                                    selectedDate={
                                      subtask.startDate
                                        ? convertUTCToCalendarDate(
                                            subtask.startDate,
                                          )
                                        : undefined
                                    }
                                    onDateSelect={(date) => {
                                      if (date) {
                                        const updates: any = {
                                          startDate:
                                            convertSelectedDateToUTC(date),
                                        };
                                        if (
                                          subtask.endDate &&
                                          new Date(subtask.endDate) < date
                                        ) {
                                          updates.endDate = undefined;
                                        }
                                        updateSubtask(subtask.id, updates);
                                        document
                                          .getElementById(
                                            `close-sub-start-${subtask.id}`,
                                          )
                                          ?.click();
                                      }
                                    }}
                                  />
                                  <PopoverClose
                                    id={`close-sub-start-${subtask.id}`}
                                    className="hidden"
                                  />
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          )}

                          {/* ✅ Subtask Due Date */}
                          {shouldShowField("endDate", "Due Date") && (
                            <TableCell
                              className={cn(bodyCellCls, "text-center")}
                              style={getColumnStyle("endDate", false)}
                            >
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                    {subtask.endDate ? (
                                      <span className="font-medium">
                                        {formatDate(subtask.endDate)}
                                      </span>
                                    ) : (
                                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                    )}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-2 border-0 border-b-[5px] border-primary"
                                  align="center"
                                >
                                  <CalendarPicker
                                    selectedDate={
                                      subtask.endDate
                                        ? convertUTCToCalendarDate(
                                            subtask.endDate,
                                          )
                                        : undefined
                                    }
                                    onDateSelect={(date) => {
                                      if (date) {
                                        updateSubtask(subtask.id, {
                                          endDate:
                                            convertSelectedDateToUTC(date),
                                        });
                                        document
                                          .getElementById(
                                            `close-sub-end-${subtask.id}`,
                                          )
                                          ?.click();
                                      }
                                    }}
                                    disabled={(date) => {
                                      const startLocal =
                                        convertUTCToCalendarDate(
                                          subtask.startDate,
                                        );
                                      return startLocal
                                        ? date <
                                            new Date(
                                              startLocal.setHours(0, 0, 0, 0),
                                            )
                                        : false;
                                    }}
                                  />
                                  <PopoverClose
                                    id={`close-sub-end-${subtask.id}`}
                                    className="hidden"
                                  />
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          )}

                          {/* Subtask Priority */}
                          {shouldShowField("priority", "Priority") && (
                            <TableCell
                              className="!p-0 text-center"
                              style={{
                                ...getColumnStyle("priority", false),
                                height: "1px",
                              }}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  className="w-full h-full"
                                >
                                  <button
                                    className="w-full h-full flex items-center justify-center gap-8 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
                                    style={{
                                      backgroundColor: `${getPriorityColor(subtask.priority) || "#9CA3AF"}33`,
                                    }}
                                  >
                                    <span
                                      className={cn(
                                        "truncate text-xs font-medium",
                                        subtask.priority
                                          ? "text-foreground"
                                          : "text-muted-foreground",
                                      )}
                                    >
                                      {taskPriorityConfigs.find(
                                        (p) => p.value === subtask.priority,
                                      )?.label || "—"}
                                    </span>
                                    <Flag
                                      className="h-3.5 w-3.5 flex-shrink-0"
                                      style={{
                                        color:
                                          getPriorityColor(subtask.priority) ||
                                          "#9CA3AF",
                                      }}
                                    />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                  {taskPriorityConfigs.map((option) => (
                                    <DropdownMenuItem
                                      key={option._id}
                                      onSelect={() =>
                                        updateSubtask(subtask.id, {
                                          priority: option.value,
                                        })
                                      }
                                      className="p-0 focus:bg-transparent"
                                    >
                                      <div
                                        className="w-full h-9 flex items-center justify-between gap-2 rounded-xs text-xs font-medium transition-opacity hover:opacity-90 px-3 text-foreground"
                                        style={{
                                          backgroundColor: `${option.color || "#9CA3AF"}33`,
                                        }}
                                      >
                                        <span className="truncate">
                                          {option.label}
                                        </span>
                                        <Flag
                                          className="h-3.5 w-3.5 flex-shrink-0"
                                          style={{
                                            color: option.color || "#9CA3AF",
                                          }}
                                        />
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                  {taskPriorityConfigs.length > 0 && (
                                    <DropdownMenuSeparator />
                                  )}
                                  {isAddingPriority ? (
                                    <div className="flex gap-1 p-0 h-9 focus:bg-transparent items-center justify-center bg-muted rounded-xs">
                                      <Input
                                        value={newPriorityName}
                                        onChange={(e) =>
                                          setNewPriorityName(e.target.value)
                                        }
                                        placeholder="Priority name"
                                        className="h-9 rounded-xs"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter")
                                            handleAddPriority(
                                              newPriorityName,
                                              undefined,
                                              true,
                                              subtask.id,
                                            );
                                          if (e.key === "Escape") {
                                            setIsAddingPriority(false);
                                            setNewPriorityName("");
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        className="h-9 rounded-xs"
                                        onClick={() =>
                                          handleAddPriority(
                                            newPriorityName,
                                            undefined,
                                            true,
                                            subtask.id,
                                          )
                                        }
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  ) : (
                                    <DropdownMenuItem
                                      onSelect={() => setIsAddingPriority(true)}
                                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add Priority
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      updateSubtask(subtask.id, {
                                        priority: undefined,
                                      })
                                    }
                                    className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                  >
                                    Clear
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}

                          {/* Subtask Custom Fields */}
                          {customFields.map((field) => {
                            const fieldData = getTaskCustomFieldById(
                              projectId,
                              field.id,
                            );
                            if (!shouldShowField(field.id, field.name))
                              return <React.Fragment key={field.id} />;
                            return fieldData ? (
                              <TableCell
                                key={field.id}
                                className={cn(
                                  bodyCellCls,
                                  (field.type === "select-one" ||
                                    field.type === "select-many" ||
                                    field.type === "label" ||
                                    field.type === "people" ||
                                    field.type === "rating") &&
                                    "overflow-hidden",
                                  "text-center",
                                )}
                                style={{
                                  ...getColumnStyle(field.id, false),
                                  height:
                                    field.type === "select-one" ||
                                    field.type === "select-many" ||
                                    field.type === "label" ||
                                    field.type === "people"
                                      ? "1px"
                                      : undefined,
                                  padding:
                                    field.type === "select-one" ||
                                    field.type === "select-many" ||
                                    field.type === "label" ||
                                    field.type === "people"
                                      ? "0px"
                                      : undefined,
                                }}
                              >
                                <CustomFieldDropdown
                                  field={fieldData}
                                  value={
                                    subtask.customFieldValues?.[field.id] ||
                                    (field.type === "select-many" ? [] : "")
                                  }
                                  onUpdate={(value) =>
                                    updateSubtaskCustomField(
                                      subtask.id,
                                      field.id,
                                      value,
                                    )
                                  }
                                  task={subtask}
                                />
                              </TableCell>
                            ) : (
                              <React.Fragment key={field.id} />
                            );
                          })}

                          {/* Subtask actions */}
                          <TableCell
                            className={cn("w-12 text-center")}
                            style={{
                              position: "sticky",
                              right: 0,
                              zIndex: 10,
                              backgroundColor: "var(--background)",
                              borderLeft: "1px solid var(--border)",
                              boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
                              padding: 0,
                              margin: 0,
                            }}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground transition-all">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="border-b-[5px] border-b-primary p-1.5 min-w-[210px]"
                              >
                                {/* Sharing & Permissions header */}
                                <DropdownMenuItem className="px-2 py-1.5 justify-center text-xs font-semibold bg-primary text-primary-foreground rounded-md mb-1 cursor-pointer">
                                  Sharing &amp; Permissions
                                </DropdownMenuItem>

                                {/* Rename Subtask */}
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-xs"
                                  onSelect={() =>
                                    handleRenameStart(
                                      subtask.id,
                                      subtask.name || "",
                                    )
                                  }
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  Rename Subtask
                                </DropdownMenuItem>

                                {/* Duplicate */}
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-xs"
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
                                  className="gap-2 cursor-pointer text-xs"
                                  onSelect={() =>
                                    window.open(`/task/${subtask.id}`, "_blank")
                                  }
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open in new tab
                                </DropdownMenuItem>

                                {/* Copy Subtask Info */}
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="gap-2 text-xs">
                                    <Link className="h-3.5 w-3.5" />
                                    Copy Subtask Info
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="border-b-[5px] border-b-primary">
                                    {/* Subtask Link */}
                                    <DropdownMenuItem
                                      onClick={handleCopySubtaskLink.bind(
                                        null,
                                        subtask.id,
                                      )}
                                      className="cursor-pointer text-xs"
                                    >
                                      Subtask Link
                                    </DropdownMenuItem>

                                    {/* Subtask ID */}
                                    <DropdownMenuItem
                                      onClick={handleCopySubtaskId.bind(
                                        null,
                                        subtask.id,
                                      )}
                                      className="cursor-pointer text-xs"
                                    >
                                      Subtask ID
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator className="px-2 py-0" />

                                {/* Move to other group */}
                                {/* <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="gap-2">
                                  <MoveRight className="h-3.5 w-3.5" />
                                  Move to other group
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="border-b-[5px] border-b-primary">
                                  <DropdownMenuItem>Move to top</DropdownMenuItem>
                                  <DropdownMenuItem>Move to bottom</DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub> */}

                                {/* Tie to Goal */}
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="gap-2 text-xs">
                                    <Target className="h-3.5 w-3.5" />
                                    Tie to Goal
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="border-b-[5px] border-b-primary w-52 max-h-64 overflow-y-auto">
                                    {goals.length === 0 ? (
                                      <DropdownMenuItem
                                        disabled
                                        className="text-xs"
                                      >
                                        No goals found
                                      </DropdownMenuItem>
                                    ) : (
                                      goals.map((goal) => (
                                        <DropdownMenuItem
                                          key={goal.id}
                                          className="cursor-pointer gap-2 text-xs"
                                          onSelect={() => {
                                            console.log(
                                              "Tied subtask to goal:",
                                              {
                                                subtaskId: subtask.id,
                                                subtaskName: subtask.name,
                                                goalId: goal.id,
                                                goalTitle: goal.title,
                                              },
                                            );
                                          }}
                                        >
                                          <span
                                            className="h-5 w-5 rounded-md shrink-0 flex items-center justify-center text-foreground text-xs"
                                            style={{
                                              backgroundColor:
                                                goal.color ?? "#6366f1",
                                            }}
                                          >
                                            {goal.title
                                              ?.charAt(0)
                                              ?.toUpperCase()}
                                          </span>
                                          <span className="truncate">
                                            {goal.title}
                                          </span>
                                        </DropdownMenuItem>
                                      ))
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator className="px-2 py-0" />

                                {/* Convert to */}
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="gap-2 text-xs">
                                    <Repeat className="h-3.5 w-3.5" />
                                    Convert to
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="border-b-[5px] border-b-primary">
                                    {taskTypes.map((type) => (
                                      <DropdownMenuItem
                                        key={type._id}
                                        className="gap-2 cursor-pointer text-xs text-muted-foreground"
                                        onSelect={() =>
                                          handleConvertSubtaskType(
                                            subtask.id,
                                            type.value,
                                          )
                                        }
                                      >
                                        {renderTaskTypeVisual(
                                          type,
                                          "h-3.5 w-3.5",
                                        )}
                                        <span>{type.label}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                {/* Set subtask relationships */}
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="gap-2 text-xs">
                                    <GitMerge className="h-3.5 w-3.5" />
                                    Set subtask relationships
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="border-b-[5px] border-b-primary">
                                    {RELATIONSHIP_TYPES.map(
                                      ({ value, label, icon: Icon, color }) => (
                                        <DropdownMenuItem
                                          key={value}
                                          className="gap-2 cursor-pointer text-xs"
                                          onSelect={() =>
                                            openRelDialog(
                                              subtask.id,
                                              value,
                                              true,
                                            )
                                          }
                                        >
                                          <Icon
                                            className={cn("h-3.5 w-3.5", color)}
                                          />
                                          {label}
                                        </DropdownMenuItem>
                                      ),
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                {/* Merge duplicate subtasks */}
                                {/* <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Merge className="h-3.5 w-3.5" />
                                Merge duplicate subtasks
                              </DropdownMenuItem> */}

                                {/* Add reminder */}
                                {/* <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Bell className="h-3.5 w-3.5" />
                                Add reminder
                              </DropdownMenuItem> */}

                                {/* Log time */}
                                {/* <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Clock className="h-3.5 w-3.5" />
                                Log time
                              </DropdownMenuItem> */}

                                <DropdownMenuSeparator className="px-2 py-0" />

                                {/* Delete Subtask */}
                                <DropdownMenuItem
                                  className="gap-2 text-red-600 focus:text-red-600 cursor-pointer text-xs"
                                  onSelect={() =>
                                    setDeleteSubtaskConfirmId(subtask.id)
                                  }
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
                    {isExpanded && addingSubtaskToTask === task.id && (
                      /* INPUT state — shown after clicking "Add Subtask" */
                      <TableRow className="bg-card hover:bg-card border-b border-border">
                        <TableCell
                          style={getColumnStyle(
                            "drag",
                            false,
                            `${groupColor}44`,
                          )}
                        />
                        <TableCell
                          className={cn(bodyCellCls, "!px-0")}
                          style={getColumnStyle("checkbox", false)}
                        >
                          {renderCheckboxColumnContent(
                            <div className="size-4 shrink-0 rounded border-2 border-input" />,
                            undefined,
                            true,
                          )}
                        </TableCell>
                        {/* ✅ ID placeholder (frozen) */}
                        <TableCell
                          className={cn(bodyCellCls, "text-center")}
                          style={getColumnStyle("id", false)}
                        >
                          <span className="text-muted-foreground">Auto</span>
                        </TableCell>
                        <TableCell
                          className={bodyCellCls}
                          style={getColumnStyle("task", false)}
                        >
                          <div className="pl-2">
                            <Input
                              value={newSubtaskData.name}
                              onChange={(e) =>
                                setNewSubtaskData({
                                  ...newSubtaskData,
                                  name: e.target.value,
                                })
                              }
                              placeholder={
                                newSubtaskData.taskType === "milestone"
                                  ? "Enter milestone name…"
                                  : "Enter sub task name…"
                              }
                              className="border-0 pl-0 shadow-none focus-visible:ring-0 h-8 text-xs bg-transparent w-full"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSaveSubtask(task.id);
                                if (e.key === "Escape") {
                                  setAddingSubtaskToTask(null);
                                  setNewSubtaskData({
                                    name: "",
                                    taskType: "task",
                                    assignee: "",
                                    startDate: new Date(),
                                    endDate: undefined,
                                    priority: "",
                                    status: "",
                                    cycleId: undefined,
                                    customFieldValues: {},
                                  });
                                }
                              }}
                            />
                          </div>
                        </TableCell>

                        {/* ✅ Inline field pickers for subtask add row */}
                        {headers.map((h) => {
                          // ── Task Type ────────────────────────────────────────────
                          if (h.key === "taskType") {
                            const selType = taskTypes.find(
                              (t) => t.value === newSubtaskData.taskType,
                            );
                            return (
                              <TableCell
                                key={h.key}
                                className="!p-0 text-center"
                                style={{
                                  ...getColumnStyle(h.key, false),
                                  height: "1px",
                                }}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    className="w-full h-full"
                                  >
                                    <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden px-3 gap-2">
                                      {selType ? (
                                        <>
                                          {renderTaskTypeVisual(
                                            selType,
                                            "w-3 h-3",
                                          )}
                                          <span className="truncate">
                                            {selType.label}
                                          </span>
                                        </>
                                      ) : (
                                        <span>—</span>
                                      )}
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                    {taskTypes.map((type) => (
                                      <DropdownMenuItem
                                        key={type._id}
                                        onSelect={() =>
                                          setNewSubtaskData((prev) => ({
                                            ...prev,
                                            taskType: type.value,
                                          }))
                                        }
                                        className="p-0 focus:bg-transparent"
                                      >
                                        <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                          {renderTaskTypeVisual(
                                            type,
                                            "w-3 h-3",
                                          )}
                                          <span className="truncate">
                                            {type.label}
                                          </span>
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          }

                          // ── Status ───────────────────────────────────────────────
                          if (h.key === "status") {
                            const selStatus = taskStatusConfigs.find(
                              (s) => s.value === newSubtaskData.status,
                            );
                            return (
                              <TableCell
                                key={h.key}
                                className="!p-0 text-center"
                                style={{
                                  ...getColumnStyle(h.key, false),
                                  height: "1px",
                                }}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    className="w-full h-full"
                                  >
                                    <button
                                      className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden px-3"
                                      style={{
                                        backgroundColor:
                                          selStatus?.color || "#c4c4c4",
                                      }}
                                    >
                                      <span className="truncate w-full text-center">
                                        {selStatus?.label || "—"}
                                      </span>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                    {taskStatusConfigs.map((config) => (
                                      <DropdownMenuItem
                                        key={config._id}
                                        onSelect={() =>
                                          setNewSubtaskData((prev) => ({
                                            ...prev,
                                            status: config.value,
                                          }))
                                        }
                                        className="p-0 focus:bg-transparent"
                                      >
                                        <div
                                          className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3"
                                          style={{
                                            backgroundColor:
                                              config.color || "#c4c4c4",
                                          }}
                                        >
                                          <span className="truncate w-full text-center">
                                            {config.label}
                                          </span>
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          }

                          // ── Cycle ────────────────────────────────────────────────
                          if (h.key === "cycle") {
                            const selCycle = project?.cycles?.find(
                              (c) => c.id === newSubtaskData.cycleId,
                            );
                            return (
                              <TableCell
                                key={h.key}
                                className="!p-0 text-center"
                                style={{
                                  ...getColumnStyle(h.key, false),
                                  height: "1px",
                                }}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    className="w-full h-full"
                                  >
                                    <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:bg-muted overflow-hidden px-3">
                                      <span className="truncate w-full text-center flex items-center justify-center">
                                        {selCycle ? (
                                          formatCycleName(
                                            selCycle.name,
                                            selCycle.cycleNumber,
                                          )
                                        ) : (
                                          <RefreshCw className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                                        )}
                                      </span>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                    {activeOrUpcomingCycles.map((c) => (
                                      <DropdownMenuItem
                                        key={c.id}
                                        onSelect={() =>
                                          setNewSubtaskData((prev) => ({
                                            ...prev,
                                            cycleId: c.id,
                                          }))
                                        }
                                        className="p-0 focus:bg-transparent"
                                      >
                                        <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 bg-muted hover:bg-muted">
                                          <span className="truncate w-full text-center">
                                            {formatCycleName(
                                              c.name,
                                              c.cycleNumber,
                                            )}
                                          </span>
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                    {activeOrUpcomingCycles.length === 0 && (
                                      <div className="p-2 text-xs text-muted-foreground text-center">
                                        No cycles available
                                      </div>
                                    )}
                                    {activeOrUpcomingCycles.length > 0 && (
                                      <DropdownMenuSeparator />
                                    )}
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setNewSubtaskData((prev) => ({
                                          ...prev,
                                          cycleId: null,
                                        }))
                                      }
                                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                    >
                                      Clear
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          }

                          // ── Assignee ─────────────────────────────────────────────
                          if (h.key === "assignee") {
                            const selectedMember = members.find(
                              (m) => m.userId === newSubtaskData.assignee,
                            );
                            return (
                              <TableCell
                                key={h.key}
                                className="!p-0 text-center"
                                style={{
                                  ...getColumnStyle(h.key, false),
                                  height: "1px",
                                }}
                              >
                                <DropdownMenu
                                  onOpenChange={(open) => {
                                    if (!open) setAssigneeSearchQuery("");
                                  }}
                                >
                                  <DropdownMenuTrigger
                                    asChild
                                    className="w-full h-full"
                                  >
                                    <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                                      <MemberAvatar
                                        size="md"
                                        name={selectedMember?.name}
                                        src={selectedMember?.profilePicture}
                                      />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                    <div
                                      className="px-1 pb-2"
                                      onKeyDown={(e) => e.stopPropagation()}
                                    >
                                      <Input
                                        placeholder="Type @ or name..."
                                        value={assigneeSearchQuery}
                                        onChange={(e) =>
                                          setAssigneeSearchQuery(e.target.value)
                                        }
                                        className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                                        autoFocus
                                      />
                                    </div>
                                    {getFilteredMembers().length === 0 ? (
                                      <div className="text-center py-2 text-xs text-muted-foreground">
                                        No members found
                                      </div>
                                    ) : (
                                      getFilteredMembers().map((member) => (
                                        <DropdownMenuItem
                                          key={member.userId}
                                          onSelect={() =>
                                            setNewSubtaskData((prev) => ({
                                              ...prev,
                                              assignee: member.userId,
                                            }))
                                          }
                                          className="p-0 focus:bg-transparent"
                                        >
                                          <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                            <MemberAvatar
                                              size="sm"
                                              name={member.name}
                                              src={member.profilePicture}
                                            />
                                            <span className="truncate">
                                              {member.name}
                                            </span>
                                          </div>
                                        </DropdownMenuItem>
                                      ))
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setNewSubtaskData((prev) => ({
                                          ...prev,
                                          assignee: "",
                                        }))
                                      }
                                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                    >
                                      Clear
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          }

                          // ── Start Date ───────────────────────────────────────────
                          if (h.key === "startDate") {
                            return (
                              <TableCell
                                key={h.key}
                                className={cn(bodyCellCls, "text-center")}
                                style={getColumnStyle(h.key, false)}
                              >
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                      {newSubtaskData.startDate ? (
                                        <span className="font-medium">
                                          {formatLocalDate(
                                            newSubtaskData.startDate,
                                          )}
                                        </span>
                                      ) : (
                                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                      )}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-2 border-0 border-b-[5px] border-primary"
                                    align="center"
                                  >
                                    <CalendarPicker
                                      selectedDate={newSubtaskData.startDate}
                                      onDateSelect={(date) => {
                                        setNewSubtaskData((prev) => {
                                          const updates: any = {
                                            ...prev,
                                            startDate: date,
                                          };
                                          if (
                                            date &&
                                            prev.endDate &&
                                            prev.endDate < date
                                          ) {
                                            updates.endDate = undefined;
                                          }
                                          return updates;
                                        });
                                        document
                                          .getElementById("close-add-sub-start")
                                          ?.click();
                                      }}
                                    />
                                    {newSubtaskData.startDate && (
                                      <div className="border-t border-border p-2">
                                        <button
                                          className="w-full text-xs text-muted-foreground hover:text-muted-foreground py-1 rounded hover:bg-muted"
                                          onClick={() => {
                                            setNewSubtaskData((prev) => ({
                                              ...prev,
                                              startDate: undefined,
                                            }));
                                            document
                                              .getElementById(
                                                "close-add-sub-start",
                                              )
                                              ?.click();
                                          }}
                                        >
                                          Clear date
                                        </button>
                                      </div>
                                    )}
                                    <PopoverClose
                                      id="close-add-sub-start"
                                      className="hidden"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          }

                          // ── End Date ─────────────────────────────────────────────
                          if (h.key === "endDate") {
                            return (
                              <TableCell
                                key={h.key}
                                className={cn(bodyCellCls, "text-center")}
                                style={getColumnStyle(h.key, false)}
                              >
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                      {newSubtaskData.endDate ? (
                                        <span className="font-medium">
                                          {formatLocalDate(
                                            newSubtaskData.endDate,
                                          )}
                                        </span>
                                      ) : (
                                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                      )}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-2 border-0 border-b-[5px] border-primary"
                                    align="center"
                                  >
                                    <CalendarPicker
                                      selectedDate={newSubtaskData.endDate}
                                      onDateSelect={(date) => {
                                        setNewSubtaskData((prev) => ({
                                          ...prev,
                                          endDate: date,
                                        }));
                                        document
                                          .getElementById("close-add-sub-end")
                                          ?.click();
                                      }}
                                      disabled={(date) =>
                                        newSubtaskData.startDate
                                          ? date <
                                            new Date(
                                              new Date(
                                                newSubtaskData.startDate,
                                              ).setHours(0, 0, 0, 0),
                                            )
                                          : false
                                      }
                                    />
                                    {newSubtaskData.endDate && (
                                      <div className="border-t border-border p-2">
                                        <button
                                          className="w-full text-xs text-muted-foreground hover:text-muted-foreground py-1 rounded hover:bg-muted"
                                          onClick={() => {
                                            setNewSubtaskData((prev) => ({
                                              ...prev,
                                              endDate: undefined,
                                            }));
                                            document
                                              .getElementById(
                                                "close-add-sub-end",
                                              )
                                              ?.click();
                                          }}
                                        >
                                          Clear date
                                        </button>
                                      </div>
                                    )}
                                    <PopoverClose
                                      id="close-add-sub-end"
                                      className="hidden"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          }

                          // ── Priority ─────────────────────────────────────────────
                          if (h.key === "priority") {
                            return (
                              <TableCell
                                key={h.key}
                                className="!p-0 text-center"
                                style={{
                                  ...getColumnStyle(h.key, false),
                                  height: "1px",
                                }}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    className="w-full h-full"
                                  >
                                    <button
                                      className="w-full h-full flex items-center justify-center gap-8 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
                                      style={{
                                        backgroundColor: `${getPriorityColor(newSubtaskData.priority) || "#9CA3AF"}33`,
                                      }}
                                    >
                                      <span
                                        className={cn(
                                          "truncate text-xs font-medium",
                                          newSubtaskData.priority
                                            ? "text-foreground"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {taskPriorityConfigs.find(
                                          (p) =>
                                            p.value === newSubtaskData.priority,
                                        )?.label || "—"}
                                      </span>
                                      <Flag
                                        className="h-3.5 w-3.5 flex-shrink-0"
                                        style={{
                                          color:
                                            getPriorityColor(
                                              newSubtaskData.priority,
                                            ) || "#9CA3AF",
                                        }}
                                      />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                                    {taskPriorityConfigs.map((option) => (
                                      <DropdownMenuItem
                                        key={option._id}
                                        onSelect={() =>
                                          setNewSubtaskData((prev) => ({
                                            ...prev,
                                            priority: option.value,
                                          }))
                                        }
                                        className="p-0 focus:bg-transparent"
                                      >
                                        <div
                                          className="w-full h-9 flex items-center justify-between gap-2 rounded-xs text-xs font-medium transition-opacity hover:opacity-90 px-3 text-foreground"
                                          style={{
                                            backgroundColor: `${option.color || "#9CA3AF"}33`,
                                          }}
                                        >
                                          <span className="truncate">
                                            {option.label}
                                          </span>
                                          <Flag
                                            className="h-3.5 w-3.5 flex-shrink-0"
                                            style={{
                                              color: option.color || "#9CA3AF",
                                            }}
                                          />
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                    {taskPriorityConfigs.length > 0 && (
                                      <DropdownMenuSeparator />
                                    )}
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setNewSubtaskData((prev) => ({
                                          ...prev,
                                          priority: "",
                                        }))
                                      }
                                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                                    >
                                      Clear
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          }

                          // ── Default: empty cell for custom fields ────────────────
                          return (
                            <TableCell
                              key={h.key}
                              className={bodyCellCls}
                              style={getColumnStyle(h.key, false)}
                            />
                          );
                        })}

                        {/* Save / Cancel */}
                        <TableCell
                          className={cn(bodyCellCls, "w-12")}
                          style={{
                            position: "sticky",
                            right: 0,
                            zIndex: 10,
                            backgroundColor: "var(--background)",
                            borderLeft: "1px solid var(--border)",
                            boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
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
                                setNewSubtaskData({
                                  name: "",
                                  taskType: "task",
                                  assignee: "",
                                  startDate: new Date(),
                                  endDate: undefined,
                                  priority: "",
                                  status: "",
                                  cycleId: undefined,
                                  customFieldValues: {},
                                });
                              }}
                              className="px-2 py-1 border border-border rounded hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}

              {/* ── Add Task Prompt Row (shows button, replaces with input on click) ── */}
              {!showAddTask ? (
                <TableRow
                  className="bg-card hover:bg-card border-b border-border"
                  onMouseEnter={() => setIsAddTaskRowHovered(true)}
                  onMouseLeave={() => setIsAddTaskRowHovered(false)}
                >
                  <TableCell
                    style={getColumnStyle("drag", false, `${groupColor}44`)}
                  />
                  <TableCell style={getColumnStyle("checkbox", false)} />
                  <TableCell style={getColumnStyle("id", false)} />
                  <TableCell
                    style={getColumnStyle("task", false)}
                    className={bodyCellCls}
                  >
                    <div className="flex items-center gap-1 pl-4">
                      <div
                        className={cn(
                          "flex items-center rounded-sm transition-all group",
                          isAddTaskRowHovered || showTaskTypeMenu
                            ? "border border-primary/30"
                            : "border border-transparent",
                        )}
                      >
                        {/* + Add Task button */}
                        <button
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 transition-colors text-xs",
                            isAddTaskRowHovered || showTaskTypeMenu
                              ? "text-primary/60"
                              : "text-muted-foreground",
                          )}
                          onClick={() => {
                            setNewTaskData((prev) => ({
                              ...prev,
                              ...getGroupPrefillData(),
                            }));
                            setShowAddTask(true);
                            setShowTaskTypeMenu(false);
                          }}
                        >
                          <Plus
                            className={cn(
                              "h-3 w-3",
                              isAddTaskRowHovered || showTaskTypeMenu
                                ? "text-primary/60"
                                : "text-muted-foreground",
                            )}
                          />
                          Add Task
                        </button>

                        {/* Dropdown Menu for Task Type Selection */}
                        {/* Dropdown Menu for Task Type Selection */}
                        <DropdownMenu
                          open={showTaskTypeMenu}
                          onOpenChange={setShowTaskTypeMenu}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "px-1 py-0.5 border-l border-primary/30 text-muted-foreground group-hover:text-primary/60 transition-colors outline-none",
                                !(isAddTaskRowHovered || showTaskTypeMenu) &&
                                  "invisible",
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ChevronUp className="h-3 w-3" />
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
                                  key={type._id}
                                  onClick={() => {
                                    const prefill = getGroupPrefillData();
                                    setSelectedAddTaskType(type.value);
                                    setNewTaskData((prev) => ({
                                      ...prev,
                                      ...prefill,
                                      taskType: type.value,
                                    }));
                                    setShowTaskTypeMenu(false);
                                    setShowAddTask(true);
                                  }}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  {renderTaskTypeVisual(type, "w-4 h-4")}
                                  <span>{type.label}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenuPortal>
                        </DropdownMenu>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                /* ── Add Task Input Row (replaces button row in same spot) ── */
                <TableRow className="bg-card hover:bg-card border-b border-border">
                  {/* Color accent bar — same as task rows */}
                  <TableCell
                    style={getColumnStyle("drag", false, `${groupColor}44`)}
                  />

                  {/* Checkbox placeholder — mirrors subtask row exactly */}
                  <TableCell
                    className={cn(bodyCellCls, "!px-0")}
                    style={getColumnStyle("checkbox", false)}
                  >
                    {renderCheckboxColumnContent(
                      <div className="size-4 shrink-0 rounded border-2 border-input" />,
                    )}
                  </TableCell>

                  {/* ✅ ID placeholder (frozen) */}
                  <TableCell
                    className={cn(bodyCellCls, "text-center")}
                    style={getColumnStyle("id", false)}
                  >
                    <span className="text-muted-foreground">Auto</span>
                  </TableCell>

                  {/* Task name input */}
                  <TableCell
                    className={bodyCellCls}
                    style={getColumnStyle("task", false)}
                  >
                    <Input
                      value={newTaskData.name}
                      onChange={(e) =>
                        setNewTaskData({ ...newTaskData, name: e.target.value })
                      }
                      placeholder={
                        newTaskData.taskType === "milestone"
                          ? "Enter milestone name…"
                          : "Enter task name…"
                      }
                      className="border-0 pl-0 shadow-none focus-visible:ring-0 h-8 text-xs bg-transparent w-full"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTask();
                        if (e.key === "Escape") {
                          setShowAddTask(false);
                          setNewTaskData({
                            name: "",
                            taskType: "task",
                            assignee: "",
                            startDate: new Date(),
                            endDate: undefined,
                            priority: "",
                            status: "",
                            cycleId: undefined,
                            customFieldValues: {},
                          });
                          setSelectedAddTaskType("task");
                          setShowTaskTypeMenu(false);
                        }
                      }}
                    />
                  </TableCell>

                  {/* ✅ Inline field pickers for system fields in add-task row */}
                  {headers.map((h) => {
                    // ── Task Type ────────────────────────────────────────────
                    if (h.key === "taskType") {
                      const selectedType =
                        taskTypes.find(
                          (t) => t.value === (newTaskData.taskType || "task"),
                        ) || null;

                      return (
                        <TableCell
                          key={h.key}
                          className="!p-0 text-center"
                          style={{
                            ...getColumnStyle(h.key, false),
                            height: "1px",
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              className="w-full h-full"
                            >
                              <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden px-3 gap-2">
                                {selectedType ? (
                                  <>
                                    {renderTaskTypeVisual(
                                      selectedType,
                                      "w-3 h-3",
                                    )}
                                    <span className="truncate">
                                      {selectedType.label}
                                    </span>
                                  </>
                                ) : (
                                  <span>—</span>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                              {taskTypes.map((type) => (
                                <DropdownMenuItem
                                  key={type._id}
                                  onSelect={() =>
                                    setNewTaskData((prev) => ({
                                      ...prev,
                                      taskType: type.value,
                                    }))
                                  }
                                  className="p-0 focus:bg-transparent"
                                >
                                  <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                    {renderTaskTypeVisual(type, "w-3 h-3")}
                                    <span className="truncate">
                                      {type.label}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      );
                    }

                    // ── Status ───────────────────────────────────────────────
                    if (h.key === "status") {
                      const selectedStatus = taskStatusConfigs.find(
                        (s) => s.value === newTaskData.status,
                      );
                      return (
                        <TableCell
                          key={h.key}
                          className="!p-0 text-center"
                          style={{
                            ...getColumnStyle(h.key, false),
                            height: "1px",
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              className="w-full h-full"
                            >
                              <button
                                className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden px-3"
                                style={{
                                  backgroundColor:
                                    selectedStatus?.color || "#c4c4c4",
                                }}
                              >
                                <span className="truncate w-full text-center">
                                  {selectedStatus?.label || "—"}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                              {taskStatusConfigs.map((config) => (
                                <DropdownMenuItem
                                  key={config._id}
                                  onSelect={() =>
                                    setNewTaskData((prev) => ({
                                      ...prev,
                                      status: config.value,
                                    }))
                                  }
                                  className="p-0 focus:bg-transparent"
                                >
                                  <div
                                    className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3"
                                    style={{
                                      backgroundColor:
                                        config.color || "#c4c4c4",
                                    }}
                                  >
                                    <span className="truncate w-full text-center">
                                      {config.label}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      );
                    }

                    // ── Cycle ────────────────────────────────────────────────
                    if (h.key === "cycle") {
                      const selCycle = project?.cycles?.find(
                        (c) => c.id === newTaskData.cycleId,
                      );
                      return (
                        <TableCell
                          key={h.key}
                          className="!p-0 text-center"
                          style={{
                            ...getColumnStyle(h.key, false),
                            height: "1px",
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              className="w-full h-full"
                            >
                              <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:bg-muted overflow-hidden px-3">
                                <span className="truncate w-full text-center flex items-center justify-center">
                                  {selCycle ? (
                                    formatCycleName(
                                      selCycle.name,
                                      selCycle.cycleNumber,
                                    )
                                  ) : (
                                    <RefreshCw className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                                  )}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                              {activeOrUpcomingCycles.map((c) => (
                                <DropdownMenuItem
                                  key={c.id}
                                  onSelect={() =>
                                    setNewTaskData((prev) => ({
                                      ...prev,
                                      cycleId: c.id,
                                    }))
                                  }
                                  className="p-0 focus:bg-transparent"
                                >
                                  <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 bg-muted hover:bg-muted">
                                    <span className="truncate w-full text-center">
                                      {formatCycleName(c.name, c.cycleNumber)}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                              {activeOrUpcomingCycles.length === 0 && (
                                <div className="p-2 text-xs text-muted-foreground text-center">
                                  No cycles available
                                </div>
                              )}
                              {activeOrUpcomingCycles.length > 0 && (
                                <DropdownMenuSeparator />
                              )}
                              <DropdownMenuItem
                                onSelect={() =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    cycleId: null,
                                  }))
                                }
                                className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                              >
                                Clear
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      );
                    }

                    // ── Assignee ─────────────────────────────────────────────
                    if (h.key === "assignee") {
                      const selectedMember = members.find(
                        (m) => m.userId === newTaskData.assignee,
                      );
                      return (
                        <TableCell
                          key={h.key}
                          className="!p-0 text-center"
                          style={{
                            ...getColumnStyle(h.key, false),
                            height: "1px",
                          }}
                        >
                          <DropdownMenu
                            onOpenChange={(open) => {
                              if (!open) setAssigneeSearchQuery("");
                            }}
                          >
                            <DropdownMenuTrigger
                              asChild
                              className="w-full h-full"
                            >
                              <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                                <MemberAvatar
                                  size="md"
                                  name={selectedMember?.name}
                                  src={selectedMember?.profilePicture}
                                />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                              <div
                                className="px-1 pb-2"
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <Input
                                  placeholder="Type @ or name..."
                                  value={assigneeSearchQuery}
                                  onChange={(e) =>
                                    setAssigneeSearchQuery(e.target.value)
                                  }
                                  className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                                  autoFocus
                                />
                              </div>
                              {getFilteredMembers().length === 0 ? (
                                <div className="text-center py-2 text-xs text-muted-foreground">
                                  No members found
                                </div>
                              ) : (
                                getFilteredMembers().map((member) => (
                                  <DropdownMenuItem
                                    key={member.userId}
                                    onSelect={() =>
                                      setNewTaskData((prev) => ({
                                        ...prev,
                                        assignee: member.userId,
                                      }))
                                    }
                                    className="p-0 focus:bg-transparent"
                                  >
                                    <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                      <MemberAvatar
                                        size="sm"
                                        name={member.name}
                                        src={member.profilePicture}
                                      />
                                      <span className="truncate">
                                        {member.name}
                                      </span>
                                    </div>
                                  </DropdownMenuItem>
                                ))
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    assignee: "",
                                  }))
                                }
                                className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                              >
                                Clear
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      );
                    }

                    // ── Start Date ───────────────────────────────────────────
                    if (h.key === "startDate") {
                      return (
                        <TableCell
                          key={h.key}
                          className={cn(bodyCellCls, "text-center")}
                          style={getColumnStyle(h.key, false)}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                {newTaskData.startDate ? (
                                  <span className="font-medium">
                                    {formatLocalDate(newTaskData.startDate)}
                                  </span>
                                ) : (
                                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-2 border-0 border-b-[5px] border-primary"
                              align="center"
                            >
                              <CalendarPicker
                                selectedDate={newTaskData.startDate}
                                onDateSelect={(date) => {
                                  setNewTaskData((prev) => {
                                    const updates: any = {
                                      ...prev,
                                      startDate: date,
                                    };
                                    if (
                                      date &&
                                      prev.endDate &&
                                      prev.endDate < date
                                    ) {
                                      updates.endDate = undefined;
                                    }
                                    return updates;
                                  });
                                  document
                                    .getElementById("close-add-task-start")
                                    ?.click();
                                }}
                              />
                              {newTaskData.startDate && (
                                <div className="border-t border-border p-2">
                                  <button
                                    className="w-full text-xs text-muted-foreground hover:text-muted-foreground py-1 rounded hover:bg-muted"
                                    onClick={() => {
                                      setNewTaskData((prev) => ({
                                        ...prev,
                                        startDate: undefined,
                                      }));
                                      document
                                        .getElementById("close-add-task-start")
                                        ?.click();
                                    }}
                                  >
                                    Clear date
                                  </button>
                                </div>
                              )}
                              <PopoverClose
                                id="close-add-task-start"
                                className="hidden"
                              />
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      );
                    }

                    // ── End Date ─────────────────────────────────────────────
                    if (h.key === "endDate") {
                      return (
                        <TableCell
                          key={h.key}
                          className={cn(bodyCellCls, "text-center")}
                          style={getColumnStyle(h.key, false)}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                {newTaskData.endDate ? (
                                  <span className="font-medium">
                                    {formatLocalDate(newTaskData.endDate)}
                                  </span>
                                ) : (
                                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-2 border-0 border-b-[5px] border-primary"
                              align="center"
                            >
                              <CalendarPicker
                                selectedDate={newTaskData.endDate}
                                onDateSelect={(date) => {
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    endDate: date,
                                  }));
                                  document
                                    .getElementById("close-add-task-end")
                                    ?.click();
                                }}
                                disabled={(date) =>
                                  newTaskData.startDate
                                    ? date <
                                      new Date(
                                        new Date(
                                          newTaskData.startDate,
                                        ).setHours(0, 0, 0, 0),
                                      )
                                    : false
                                }
                              />
                              {newTaskData.endDate && (
                                <div className="border-t border-border p-2">
                                  <button
                                    className="w-full text-xs text-muted-foreground hover:text-muted-foreground py-1 rounded hover:bg-muted"
                                    onClick={() => {
                                      setNewTaskData((prev) => ({
                                        ...prev,
                                        endDate: undefined,
                                      }));
                                      document
                                        .getElementById("close-add-task-end")
                                        ?.click();
                                    }}
                                  >
                                    Clear date
                                  </button>
                                </div>
                              )}
                              <PopoverClose
                                id="close-add-task-end"
                                className="hidden"
                              />
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      );
                    }

                    // ── Priority ─────────────────────────────────────────────
                    if (h.key === "priority") {
                      return (
                        <TableCell
                          key={h.key}
                          className="!p-0 text-center"
                          style={{
                            ...getColumnStyle(h.key, false),
                            height: "1px",
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              className="w-full h-full"
                            >
                              <button
                                className="w-full h-full flex items-center justify-center gap-8 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
                                style={{
                                  backgroundColor: `${getPriorityColor(newTaskData.priority) || "#9CA3AF"}33`,
                                }}
                              >
                                <span
                                  className={cn(
                                    "truncate text-xs font-medium",
                                    newTaskData.priority
                                      ? "text-foreground"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {taskPriorityConfigs.find(
                                    (p) => p.value === newTaskData.priority,
                                  )?.label || "—"}
                                </span>
                                <Flag
                                  className="h-3.5 w-3.5 flex-shrink-0"
                                  style={{
                                    color:
                                      getPriorityColor(newTaskData.priority) ||
                                      "#9CA3AF",
                                  }}
                                />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
                              {taskPriorityConfigs.map((option) => (
                                <DropdownMenuItem
                                  key={option._id}
                                  onSelect={() =>
                                    setNewTaskData((prev) => ({
                                      ...prev,
                                      priority: option.value,
                                    }))
                                  }
                                  className="p-0 focus:bg-transparent"
                                >
                                  <div
                                    className="w-full h-9 flex items-center justify-between gap-2 rounded-xs text-xs font-medium transition-opacity hover:opacity-90 px-3 text-foreground"
                                    style={{
                                      backgroundColor: `${option.color || "#9CA3AF"}33`,
                                    }}
                                  >
                                    <span className="truncate">
                                      {option.label}
                                    </span>
                                    <Flag
                                      className="h-3.5 w-3.5 flex-shrink-0"
                                      style={{
                                        color: option.color || "#9CA3AF",
                                      }}
                                    />
                                  </div>
                                </DropdownMenuItem>
                              ))}
                              {taskPriorityConfigs.length > 0 && (
                                <DropdownMenuSeparator />
                              )}
                              <DropdownMenuItem
                                onSelect={() =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    priority: "",
                                  }))
                                }
                                className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                              >
                                Clear
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      );
                    }

                    // ── Default: empty cell for custom fields ────────────────
                    return (
                      <TableCell
                        key={h.key}
                        className={bodyCellCls}
                        style={getColumnStyle(h.key, false)}
                      />
                    );
                  })}

                  {/* Save / Cancel */}
                  <TableCell
                    className={cn(bodyCellCls, "w-12")}
                    style={{
                      position: "sticky",
                      right: 0,
                      zIndex: 10,
                      backgroundColor: "var(--background)",
                      borderLeft: "1px solid var(--border)",
                      boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
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
                          setNewTaskData({
                            name: "",
                            taskType: "task",
                            assignee: "",
                            startDate: new Date(),
                            endDate: undefined,
                            priority: "",
                            status: "",
                            cycleId: undefined,
                            customFieldValues: {},
                          });
                          setSelectedAddTaskType("task");
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
        </div>

        {/* ✅ ADD THIS — sticky overlay, always visible top-right */}
        {/* <div
          className="absolute top-0 right-0 flex items-center justify-center bg-card border-b border-l border-border"
          style={{
            height: '36px', 
            width: '40px',
            zIndex: 30,           
          }}
        >
          <ListFieldVisibilityPopup projectId={projectId} />
        </div> */}

        {/* ── Convert to Subtask Dialog ─────────────────────────────────── */}
        {/* <Dialog open={showConvertToSubtaskDialog} onOpenChange={setShowConvertToSubtaskDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Convert to Subtask</DialogTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Task: {convertingTaskId && groupTasks.find(t => t.id === convertingTaskId)?.name}
              </div>
              {convertSubtaskData.originalSubtasksCount > 0 && (
                <div className="text-blue-600 mt-1 flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  {convertSubtaskData.originalSubtasksCount} subtask{convertSubtaskData.originalSubtasksCount > 1 ? 's' : ''} will be moved to the selected task
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select parent task</Label>
                <Select value={selectedParentTaskId} onValueChange={setSelectedParentTaskId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupTasks.filter(t => t.id !== convertingTaskId).map(task => (
                      <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={convertSubtaskData.name}
                onChange={(e) => setConvertSubtaskData({ ...convertSubtaskData, name: e.target.value })}
                placeholder="Subtask name…"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleConfirmConvertToSubtask}
                className="bg-primary hover:bg-primary/90"
                disabled={!selectedParentTaskId || !convertSubtaskData.name.trim()}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}

        {/* ── Set Relationship Dialog ──────────────────────────────────── */}
        <Dialog open={relDialogOpen} onOpenChange={setRelDialogOpen}>
          <DialogContent className="sm:max-w-md border-b-[5px] border-b-primary">
            <DialogHeader>
              <DialogTitle>Relationship</DialogTitle>
              <DialogDescription>
                See what this task depends on and what depends on it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Task info row — matches popup top row */}
              {relDialogTaskId &&
                (() => {
                  const projectTasks = getTasksByProject(projectId);
                  const allTasks = [
                    ...projectTasks,
                    ...projectTasks.flatMap((t) => getSubtasksByTask(t.id)),
                  ];
                  const t = allTasks.find((t) => t.id === relDialogTaskId);
                  if (!t) return null;
                  return (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/40 min-w-0">
                      <GitMerge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {formatTaskId(projectSlug, t.taskNumber)}
                      </span>
                      <span className="text-xs font-medium truncate block flex-1 min-w-0 max-w-[220px]">
                        {t.name}
                      </span>
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
                        const rel = RELATIONSHIP_TYPES.find(
                          (r) => r.value === relDialogType,
                        );
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
                  <SelectContent className="border-b-[5px] border-b-primary">
                    {RELATIONSHIP_TYPES.map(
                      ({ value, label, icon: Icon, color }) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <Icon className={cn("h-3.5 w-3.5", color)} />
                            {label}
                          </span>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Target task selector */}
              <Select
                value={relDialogTargetId}
                onValueChange={setRelDialogTargetId}
              >
                <SelectTrigger className="w-full overflow-hidden [&>span]:truncate">
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 border-b-[5px] border-b-primary">
                  {(() => {
                    const projectTasks = getTasksByProject(projectId);
                    const allTasks = [
                      ...projectTasks,
                      ...projectTasks.flatMap((pt) => getSubtasksByTask(pt.id)),
                    ];
                    return allTasks
                      .filter((t) => t.id !== relDialogTaskId)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center gap-2 max-w-full overflow-hidden">
                            <span className="text-xs text-muted-foreground shrink-0 font-medium">
                              {formatTaskId(projectSlug, t.taskNumber)}
                            </span>
                            <span className="truncate max-w-[260px]">
                              {t.name}
                            </span>
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
                className="bg-primary hover:bg-primary/90"
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
        {duplicateTaskId &&
          (() => {
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
        {duplicateSubtaskId &&
          (() => {
            // Get subtask name from your subtasks list
            const allSubtasks = groupTasks.flatMap(
              (t) => getSubtasksByTask(t.id), // or however you access subtasks
            );
            const subtask = allSubtasks.find(
              (s) => s.id === duplicateSubtaskId,
            )!;
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
            taskToConvert={
              groupTasks.find((t) => t.id === convertToSubtaskTaskId) ?? null
            }
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
      </div>
    </>
  );
}

// ── DraggableTaskRow Component ──
interface DraggableTaskRowProps {
  task: Task;
  groupId: string;
  groupColor: string;
  projectId: string;
  projectSlug: string;
  taskSubtasks: any[];
  isExpanded: boolean;
  hasSubtasks: boolean;
  toggleTaskExpansion: (taskId: string) => void;
  selectedTaskIds: Set<string>;
  toggleTaskSelection: (taskId: string) => void;
  renamingId: string | null;
  renamingName: string;
  setRenamingName: React.Dispatch<React.SetStateAction<string>>;
  handleRenameStart: (id: string, currentName: string) => void;
  handleRenameSave: (id: string, isSubtask?: boolean) => Promise<void>;
  handleRenameCancel: () => void;
  displayOptions: any;
  setNewSubtaskData: React.Dispatch<React.SetStateAction<any>>;
  setAddingSubtaskToTask: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTaskForDetail: React.Dispatch<React.SetStateAction<Task | null>>;
  setShowTaskDetail: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDetailLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchTaskById: (id: string) => Promise<Task | null>;
  renderRelationshipIcons: (item: any, isSubtask: boolean) => React.ReactNode;
  shouldShowField: (fieldKey: string, fieldLabel: string) => boolean;
  getColumnStyle: (
    columnId: string,
    isHeader?: boolean,
    rowGroupColor?: string,
    isSubtask?: boolean,
  ) => React.CSSProperties;
  taskTypes: any[];
  renderTaskTypeVisual: (type: any, className?: string) => React.ReactNode;
  updateTask: (id: string, updates: Partial<Task>) => void | Promise<any>;
  taskStatusConfigs: any[];
  isAddingStatus: boolean;
  newStatusName: string;
  setNewStatusName: React.Dispatch<React.SetStateAction<string>>;
  setIsAddingStatus: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddStatus: (
    name: string,
    taskId?: string,
    isSubtask?: boolean,
    subtaskId?: string,
  ) => Promise<void>;
  activeOrUpcomingCycles: any[];
  formatCycleName: (name: string, num?: number) => string;
  project: any;
  members: any[];
  assigneeSearchQuery: string;
  setAssigneeSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  getFilteredMembers: () => any[];
  formatDate: (dateStr?: string) => string | null;
  convertSelectedDateToUTC: (date: Date) => string;
  taskPriorityConfigs: any[];
  getPriorityColor: (priorityValue?: string) => string | undefined;
  isAddingPriority: boolean;
  newPriorityName: string;
  setNewPriorityName: React.Dispatch<React.SetStateAction<string>>;
  setIsAddingPriority: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddPriority: (
    name: string,
    taskId?: string,
    isSubtask?: boolean,
    subtaskId?: string,
  ) => Promise<void>;
  customFields: any[];
  getTaskCustomFieldById: (projectId: string, fieldId: string) => any;
  updateTaskCustomField: (
    taskId: string,
    fieldId: string,
    value: any,
  ) => Promise<void>;
  setDuplicateSubtaskId: React.Dispatch<React.SetStateAction<string | null>>;
  setDuplicateTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  setConvertToSubtaskTaskId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  openRelDialog: (taskId: string, type: string, isSubtask: boolean) => void;
  RELATIONSHIP_TYPES: any[];
  setDeleteTaskConfirmId: React.Dispatch<React.SetStateAction<string | null>>;
  goals: any[];
  taskCheckboxClass: string;
  bodyCellCls: string;
  onMoveTask: (taskId: string) => void;
  renderCheckboxColumnContent: (
    checkbox: React.ReactNode,
    expandToggle?: React.ReactNode,
    isSubtask?: boolean,
  ) => React.ReactNode;
  formatTaskId: (projectSlug: string, taskNumber?: number) => string;
  handleCopyTaskLink: (taskId: string) => void;
  handleCopyTaskId: (taskId: string) => void;
  handleConvertTaskType: (taskId: string, type: string) => void | Promise<void>;
}

const DraggableTaskRow: React.FC<DraggableTaskRowProps> = ({
  task,
  groupId,
  groupColor,
  projectId,
  projectSlug,
  taskSubtasks,
  isExpanded,
  hasSubtasks,
  toggleTaskExpansion,
  selectedTaskIds,
  toggleTaskSelection,
  renamingId,
  renamingName,
  setRenamingName,
  handleRenameStart,
  handleRenameSave,
  handleRenameCancel,
  displayOptions,
  setNewSubtaskData,
  setAddingSubtaskToTask,
  setSelectedTaskForDetail,
  setShowTaskDetail,
  setIsDetailLoading,
  fetchTaskById,
  renderRelationshipIcons,
  shouldShowField,
  getColumnStyle,
  taskTypes,
  renderTaskTypeVisual,
  updateTask,
  taskStatusConfigs,
  isAddingStatus,
  newStatusName,
  setNewStatusName,
  setIsAddingStatus,
  handleAddStatus,
  activeOrUpcomingCycles,
  formatCycleName,
  project,
  members,
  assigneeSearchQuery,
  setAssigneeSearchQuery,
  getFilteredMembers,
  formatDate,
  convertSelectedDateToUTC,
  taskPriorityConfigs,
  getPriorityColor,
  isAddingPriority,
  newPriorityName,
  setNewPriorityName,
  setIsAddingPriority,
  handleAddPriority,
  customFields,
  getTaskCustomFieldById,
  updateTaskCustomField,
  setDuplicateSubtaskId,
  setDuplicateTaskId,
  setConvertToSubtaskTaskId,
  openRelDialog,
  RELATIONSHIP_TYPES,
  setDeleteTaskConfirmId,
  goals,
  taskCheckboxClass,
  bodyCellCls,
  onMoveTask,
  renderCheckboxColumnContent,
  formatTaskId,
  handleCopyTaskLink,
  handleCopyTaskId,
  handleConvertTaskType,
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, dragRef, dragPreview] = useDrag({
    type: "TASK_ROW",
    item: { taskId: task.id, sourceGroupId: groupId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [{ isOver }, dropRef] = useDrop({
    accept: "TASK_ROW",
    drop: (item: { taskId: string; sourceGroupId: string }) => {
      if (item.taskId !== task.id) {
        onMoveTask(item.taskId);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  dragPreview(dropRef(rowRef));

  return (
    <TableRow
      ref={rowRef}
      key={task.id}
      className={cn(
        "group bg-card hover:bg-card border-b border-border transition-colors",
        isDragging && "opacity-40",
        isOver &&
          "bg-primary/10 border-t border-b border-dashed border-primary",
      )}
    >
      {/* Drag handle */}
      <TableCell
        ref={dragRef as any}
        className={cn(bodyCellCls, "w-10 cursor-grab active:cursor-grabbing")}
        style={getColumnStyle("drag", false, groupColor)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </TableCell>

      {/* Checkbox + expand */}
      <TableCell
        className={cn(bodyCellCls, "!px-0")}
        style={getColumnStyle("checkbox", false)}
      >
        {renderCheckboxColumnContent(
          <Checkbox
            checked={selectedTaskIds.has(task.id)}
            onCheckedChange={() => toggleTaskSelection(task.id)}
            className={taskCheckboxClass}
          />,
          <button
            type="button"
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground",
              !hasSubtasks && "invisible",
            )}
            onClick={() => toggleTaskExpansion(task.id)}
            disabled={!hasSubtasks}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>,
        )}
      </TableCell>

      {/* ✅ ID Column (frozen, always visible) */}
      {shouldShowField("id", "ID") && (
        <TableCell
          className={cn(bodyCellCls, "text-center")}
          style={getColumnStyle("id", false)}
        >
          <span className="text-muted-foreground">
            {formatTaskId(projectSlug, task.taskNumber)}
          </span>
        </TableCell>
      )}

      {/* Task Name */}
      {shouldShowField("task", "Task") && (
        <TableCell
          className={cn(bodyCellCls, "overflow-hidden")}
          style={getColumnStyle("task", false)}
        >
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {renamingId === task.id ? (
              <Input
                value={renamingName}
                onChange={(e) => setRenamingName(e.target.value)}
                onBlur={() => handleRenameSave(task.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSave(task.id);
                  if (e.key === "Escape") handleRenameCancel();
                }}
                className="h-7 w-full flex-1 py-1 px-2 text-xs focus-visible:ring-1 focus-visible:ring-blue-400 min-w-0"
                autoFocus
              />
            ) : displayOptions.wrapText ? (
              /* ── SINGLE-LINE (TRUNCATE) MODE: flex with icons at the right ── */
              <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
                <span
                  className={cn(
                    "text-xs text-foreground min-w-0 flex-1 truncate",
                    task.completed && "line-through text-muted-foreground",
                  )}
                  onDoubleClick={() =>
                    handleRenameStart(task.id, task.name || "")
                  }
                  title={task.name}
                >
                  {task.name}
                </span>

                {/* Actions & Icons container pushed to the right */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Hover actions */}
                  {renamingId !== task.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-0.5"
                        onClick={() => {
                          setNewSubtaskData((prev: any) => ({
                            ...prev,
                            status: task.status || "",
                            startDate: new Date(),
                            endDate: task.endDate
                              ? new Date(task.endDate)
                              : undefined,
                            cycleId: task.cycleId ?? undefined,
                          }));
                          setAddingSubtaskToTask(task.id);
                          if (!isExpanded) toggleTaskExpansion(task.id);
                        }}
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Sub Task
                      </button>
                      <button
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-muted-foreground"
                        onClick={async () => {
                          setSelectedTaskForDetail(task);
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
                  )}

                  {/* Relationship Icons */}
                  {renderRelationshipIcons(task, false)}
                </div>
              </div>
            ) : (
              /* ── MULTI-LINE (WRAP) MODE: inline flow with icons at sentence end ── */
              <div
                className={cn(
                  "text-xs text-foreground whitespace-normal break-words w-full overflow-hidden",
                  task.completed && "line-through text-muted-foreground",
                )}
                onDoubleClick={() =>
                  handleRenameStart(task.id, task.name || "")
                }
              >
                <span>{task.name}</span>

                {/* Hover actions inline */}
                {renamingId !== task.id && (
                  <span className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 align-middle">
                    <button
                      className="px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 rounded inline-flex items-center gap-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewSubtaskData((prev: any) => ({
                          ...prev,
                          status: task.status || "",
                          startDate: new Date(),
                          endDate: task.endDate
                            ? new Date(task.endDate)
                            : undefined,
                          cycleId: task.cycleId ?? undefined,
                        }));
                        setAddingSubtaskToTask(task.id);
                        if (!isExpanded) toggleTaskExpansion(task.id);
                      }}
                    >
                      <Plus className="h-2.5 w-2.5" />
                      Sub Task
                    </button>
                    <button
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-muted-foreground inline-flex"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSelectedTaskForDetail(task);
                        setShowTaskDetail(true);
                        setIsDetailLoading(true);
                        const fresh = await fetchTaskById(task.id);
                        if (fresh) setSelectedTaskForDetail(fresh);
                        setIsDetailLoading(false);
                      }}
                    >
                      <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                    </button>
                  </span>
                )}

                {/* Relationship Icons inline */}
                <span className="inline-flex items-center gap-1 ml-1.5 align-middle">
                  {renderRelationshipIcons(task, false)}
                </span>
              </div>
            )}
          </div>
        </TableCell>
      )}

      {/* ── Dynamic data cells ─────────────────────────────── */}

      {/* Task Type Cell */}
      {shouldShowField("taskType", "Type") && (
        <TableCell
          className="!p-0 text-center"
          style={{ ...getColumnStyle("taskType", false), height: "1px" }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-full h-full">
              <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden px-3 gap-2">
                {(() => {
                  const selectedType =
                    taskTypes.find(
                      (t) => t.value === (task.taskType || "task"),
                    ) || null;

                  if (!selectedType) return <span>—</span>;

                  return (
                    <>
                      {renderTaskTypeVisual(selectedType, "w-3 h-3")}
                      <span className="truncate">{selectedType.label}</span>
                    </>
                  );
                })()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
              {taskTypes.map((type) => (
                <DropdownMenuItem
                  key={type._id}
                  onSelect={() => updateTask(task.id, { taskType: type.value })}
                  className="p-0 focus:bg-transparent"
                >
                  <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                    {renderTaskTypeVisual(type, "w-3 h-3")}
                    <span className="truncate">{type.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}

      {/* Status */}
      {shouldShowField("status", "Status") && (
        <TableCell
          className="!p-0 text-center"
          style={{ ...getColumnStyle("status", false), height: "1px" }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-full h-full">
              <button
                className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden px-3"
                style={{
                  backgroundColor:
                    taskStatusConfigs.find((c) => c.value === task.status)
                      ?.color || "#c4c4c4",
                }}
              >
                <span className="truncate w-full text-center">
                  {taskStatusConfigs.find((c) => c.value === task.status)
                    ?.label || "—"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
              {taskStatusConfigs.map((config) => (
                <DropdownMenuItem
                  key={config._id}
                  onSelect={() => updateTask(task.id, { status: config.value })}
                  className="p-0 focus:bg-transparent"
                >
                  <div
                    className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3"
                    style={{ backgroundColor: config.color || "#c4c4c4" }}
                  >
                    <span className="truncate w-full text-center">
                      {config.label}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              {taskStatusConfigs.length > 0 && <DropdownMenuSeparator />}
              {isAddingStatus ? (
                <div className="flex gap-1 p-0 h-9 focus:bg-transparent items-center justify-center bg-muted rounded-xs">
                  <Input
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    placeholder="Status name"
                    className="h-9 rounded-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleAddStatus(newStatusName, task.id);
                      if (e.key === "Escape") {
                        setIsAddingStatus(false);
                        setNewStatusName("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-9 rounded-xs"
                    onClick={() => handleAddStatus(newStatusName, task.id)}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <DropdownMenuItem
                  onSelect={() => setIsAddingStatus(true)}
                  className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Status
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => updateTask(task.id, { status: undefined })}
                className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
              >
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}

      {/* Cycle */}
      {shouldShowField("cycle", "Cycle") && (
        <TableCell
          className="!p-0 text-center"
          style={{ ...getColumnStyle("cycle", false), height: "1px" }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-full h-full">
              <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:bg-muted overflow-hidden px-3">
                <span className="truncate w-full text-center flex items-center justify-center">
                  {task.cycle
                    ? formatCycleName(task.cycle.name, task.cycle.cycleNumber)
                    : (() => {
                        const c = project?.cycles?.find(
                          (c: any) => c.id === task.cycleId,
                        );
                        return c ? (
                          formatCycleName(c.name, c.cycleNumber)
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                        );
                      })()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
              {activeOrUpcomingCycles.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onSelect={() => updateTask(task.id, { cycleId: c.id })}
                  className="p-0 focus:bg-transparent"
                >
                  <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 bg-muted hover:bg-muted">
                    <span className="truncate w-full text-center">
                      {formatCycleName(c.name, c.cycleNumber)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              {activeOrUpcomingCycles.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  No cycles available
                </div>
              )}
              {activeOrUpcomingCycles.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onSelect={() => updateTask(task.id, { cycleId: null })}
                className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
              >
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}

      {/* Assignee */}
      {shouldShowField("assignee", "Assignee") && (
        <TableCell
          className="!p-0 text-center"
          style={{ ...getColumnStyle("assignee", false), height: "1px" }}
        >
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open) setAssigneeSearchQuery("");
            }}
          >
            <DropdownMenuTrigger asChild className="w-full h-full">
              <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                {(() => {
                  const m = members.find((m) => m.userId === task.assignee);
                  return (
                    <MemberAvatar
                      size="md"
                      name={m?.name}
                      src={m?.profilePicture}
                    />
                  );
                })()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
              <div className="px-1 pb-2" onKeyDown={(e) => e.stopPropagation()}>
                <Input
                  placeholder="Type @ or name..."
                  value={assigneeSearchQuery}
                  onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                  className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                  autoFocus
                />
              </div>
              {getFilteredMembers().length === 0 ? (
                <div className="text-center py-2 text-xs text-muted-foreground">
                  No members found
                </div>
              ) : (
                getFilteredMembers().map((member) => (
                  <DropdownMenuItem
                    key={member.userId}
                    onSelect={() =>
                      updateTask(task.id, { assignee: member.userId })
                    }
                    className="p-0 focus:bg-transparent"
                  >
                    <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                      <MemberAvatar
                        size="sm"
                        name={member.name}
                        src={member.profilePicture}
                      />
                      <span className="truncate">{member.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => updateTask(task.id, { assignee: undefined })}
                className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
              >
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}

      {/* ✅ Start Date (separate from Due Date) */}
      {shouldShowField("startDate", "Start Date") && (
        <TableCell
          className={cn(bodyCellCls, "text-center")}
          style={getColumnStyle("startDate", false)}
        >
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                {task.startDate ? (
                  <span className="font-medium">
                    {formatDate(task.startDate)}
                  </span>
                ) : (
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2 border-0 border-b-[5px] border-primary"
              align="center"
            >
              <CalendarPicker
                selectedDate={
                  task.startDate
                    ? convertUTCToCalendarDate(task.startDate)
                    : undefined
                }
                onDateSelect={(date) => {
                  if (date) {
                    const updates: any = {
                      startDate: convertSelectedDateToUTC(date),
                    };
                    if (task.endDate && new Date(task.endDate) < date) {
                      updates.endDate = undefined;
                    }
                    updateTask(task.id, updates);
                    document.getElementById(`close-start-${task.id}`)?.click();
                  }
                }}
              />
              <PopoverClose id={`close-start-${task.id}`} className="hidden" />
            </PopoverContent>
          </Popover>
        </TableCell>
      )}

      {/* ✅ Due Date (End Date) */}
      {shouldShowField("endDate", "Due Date") && (
        <TableCell
          className={cn(bodyCellCls, "text-center")}
          style={getColumnStyle("endDate", false)}
        >
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                {task.endDate ? (
                  <span className="font-medium">
                    {formatDate(task.endDate)}
                  </span>
                ) : (
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2 border-0 border-b-[5px] border-primary"
              align="center"
            >
              <CalendarPicker
                selectedDate={
                  task.endDate
                    ? convertUTCToCalendarDate(task.endDate)
                    : undefined
                }
                onDateSelect={(date) => {
                  if (date) {
                    updateTask(task.id, {
                      endDate: convertSelectedDateToUTC(date),
                    });
                    document.getElementById(`close-end-${task.id}`)?.click();
                  }
                }}
                disabled={(date) => {
                  const startLocal = convertUTCToCalendarDate(task.startDate);
                  return startLocal
                    ? date < new Date(startLocal.setHours(0, 0, 0, 0))
                    : false;
                }}
              />
              <PopoverClose id={`close-end-${task.id}`} className="hidden" />
            </PopoverContent>
          </Popover>
        </TableCell>
      )}

      {/* Priority */}
      {shouldShowField("priority", "Priority") && (
        <TableCell
          className="!p-0 text-center"
          style={{ ...getColumnStyle("priority", false), height: "1px" }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-full h-full">
              <button
                className="w-full h-full flex items-center justify-center gap-8 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
                style={{
                  backgroundColor: `${getPriorityColor(task.priority) || "#9CA3AF"}33`,
                }}
              >
                <span
                  className={cn(
                    "truncate text-xs font-medium",
                    task.priority ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {taskPriorityConfigs.find((p) => p.value === task.priority)
                    ?.label || "—"}
                </span>
                <Flag
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{
                    color: getPriorityColor(task.priority) || "#9CA3AF",
                  }}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary">
              {taskPriorityConfigs.map((option) => (
                <DropdownMenuItem
                  key={option._id}
                  onSelect={() =>
                    updateTask(task.id, { priority: option.value })
                  }
                  className="p-0 focus:bg-transparent"
                >
                  <div
                    className="w-full h-9 flex items-center justify-between gap-2 rounded-xs text-xs font-medium transition-opacity hover:opacity-90 px-3 text-foreground"
                    style={{
                      backgroundColor: `${option.color || "#9CA3AF"}33`,
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    <Flag
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: option.color || "#9CA3AF" }}
                    />
                  </div>
                </DropdownMenuItem>
              ))}
              {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
              {isAddingPriority ? (
                <div className="flex gap-1 p-0 h-9 focus:bg-transparent items-center justify-center bg-muted rounded-xs">
                  <Input
                    value={newPriorityName}
                    onChange={(e) => setNewPriorityName(e.target.value)}
                    placeholder="Priority name"
                    className="h-9 rounded-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleAddPriority(newPriorityName, task.id);
                      if (e.key === "Escape") {
                        setIsAddingPriority(false);
                        setNewPriorityName("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-9 rounded-xs"
                    onClick={() => handleAddPriority(newPriorityName, task.id)}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <DropdownMenuItem
                  onSelect={() => setIsAddingPriority(true)}
                  className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Priority
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => updateTask(task.id, { priority: undefined })}
                className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
              >
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}

      {/* Custom Fields */}
      {customFields.map((field) => {
        const fieldData = getTaskCustomFieldById(projectId, field.id);
        if (!shouldShowField(field.id, field.name))
          return <React.Fragment key={field.id} />;
        return fieldData ? (
          <TableCell
            key={field.id}
            className={cn(
              bodyCellCls,
              (field.type === "select-one" ||
                field.type === "select-many" ||
                field.type === "label" ||
                field.type === "people" ||
                field.type === "rating") &&
                "overflow-hidden",
              "text-center",
            )}
            style={{
              ...getColumnStyle(field.id, false),
              height:
                field.type === "select-one" ||
                field.type === "select-many" ||
                field.type === "label" ||
                field.type === "people"
                  ? "1px"
                  : undefined,
              padding:
                field.type === "select-one" ||
                field.type === "select-many" ||
                field.type === "label" ||
                field.type === "people"
                  ? "0px"
                  : undefined,
            }}
          >
            <CustomFieldDropdown
              field={fieldData}
              value={
                task.customFieldValues?.[field.id] ||
                (field.type === "select-many" ? [] : "")
              }
              onUpdate={(value) =>
                updateTaskCustomField(task.id, field.id, value)
              }
              task={task}
            />
          </TableCell>
        ) : (
          <React.Fragment key={field.id} />
        );
      })}

      {/* Row actions */}
      <TableCell
        className={cn("w-12 text-center")}
        style={{
          position: "sticky",
          right: 0,
          zIndex: 10,
          backgroundColor: "var(--background)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
          padding: 0,
          margin: 0,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground transition-all">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-b-[5px] border-b-primary p-1.5 min-w-[210px]"
          >
            {/* Sharing & Permissions — dark header row */}
            <DropdownMenuItem className="px-2 py-1.5 justify-center text-xs font-semibold bg-primary text-primary-foreground rounded-md mb-1 cursor-pointer">
              Sharing &amp; Permissions
            </DropdownMenuItem>

            {/* Rename Task */}
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onSelect={() => handleRenameStart(task.id, task.name || "")}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              Rename Task
            </DropdownMenuItem>

            {/* Duplicate */}
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
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
              className="gap-2 cursor-pointer text-xs"
              onSelect={() => window.open(`/task/${task.id}`, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </DropdownMenuItem>

            {/* Copy Task Info submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 text-xs">
                <Link className="h-3.5 w-3.5" />
                Copy Task Info
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="border-b-[5px] border-b-primary">
                {/* Task Link */}
                <DropdownMenuItem
                  onClick={handleCopyTaskLink.bind(null, task.id)}
                  className="cursor-pointer text-xs"
                >
                  Task Link
                </DropdownMenuItem>

                {/* Task ID */}
                <DropdownMenuItem
                  onClick={handleCopyTaskId.bind(null, task.id)}
                  className="cursor-pointer text-xs"
                >
                  Task ID
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="px-2 py-0" />

            {/* Tie to Goal submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 text-xs">
                <Target className="h-3.5 w-3.5" />
                Tie to Goal
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="border-b-[5px] border-b-primary w-52 max-h-64 overflow-y-auto">
                {goals.length === 0 ? (
                  <DropdownMenuItem disabled className="text-xs">
                    No goals found
                  </DropdownMenuItem>
                ) : (
                  goals.map((goal) => (
                    <DropdownMenuItem
                      key={goal.id}
                      className="cursor-pointer gap-2 text-xs"
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
                        className="h-5 w-5 rounded-md shrink-0 flex items-center justify-center text-foreground text-xs"
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
              <DropdownMenuSubTrigger className="gap-2 text-xs">
                <Repeat className="h-3.5 w-3.5" />
                Convert to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="border-b-[5px] border-b-primary">
                {taskTypes.map((type) => (
                  <DropdownMenuItem
                    key={type._id}
                    className="gap-2 cursor-pointer text-xs text-muted-foreground"
                    onSelect={() => handleConvertTaskType(task.id, type.value)}
                  >
                    {renderTaskTypeVisual(type, "h-3.5 w-3.5")}
                    {type.label}
                  </DropdownMenuItem>
                ))}
                {/* ── Hardcoded Subtask option — only when task has NO subtasks ── */}
                {taskSubtasks.length === 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer text-xs"
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
              <DropdownMenuSubTrigger className="gap-2 text-xs">
                <GitMerge className="h-3.5 w-3.5" />
                Set task relationships
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="border-b-[5px] border-b-primary">
                {RELATIONSHIP_TYPES.map(
                  ({ value, label, icon: Icon, color }) => (
                    <DropdownMenuItem
                      key={value}
                      className="gap-2 cursor-pointer text-xs"
                      onSelect={() => openRelDialog(task.id, value, false)}
                    >
                      <Icon className={cn("h-3.5 w-3.5", color)} />
                      {label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="px-2 py-0" />

            {/* Delete Task — opens confirmation modal */}
            <DropdownMenuItem
              className="gap-2 text-red-600 focus:text-red-600 cursor-pointer text-xs"
              onSelect={() => setDeleteTaskConfirmId(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
