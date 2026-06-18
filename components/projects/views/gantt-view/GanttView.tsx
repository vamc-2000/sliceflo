// components/projects/views/gantt-view/GanttView.tsx
"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useTasksStore } from "@/stores/tasks-store";
import { Task, Subtask } from "@/types/task.types";
import { useProjectsStore } from "@/stores/projects-store";
import { useProfileStore } from "@/stores/profile-store";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  GanttCreateMarkerTrigger,
  GanttMarker,
  type GanttFeature,
  type GanttMarkerProps,
  type Range,
} from "@/components/ui/shadcn-io/gantt";
import { transformTaskToGanttFeature } from "@/lib/gantt-helpers";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  EyeIcon,
  LinkIcon,
  TrashIcon,
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  Search,
  Users,
  Layers,
  SlidersVertical,
  EyeOff,
  ChevronDown,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowDown01,
  ArrowDown10,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowUpDown,
  Funnel,
  Pin,
  Monitor,
  GripVertical,
  Share2,
  Check,
  Cable,
} from "lucide-react";
import ProjectMembersSection from "@/components/projects/ProjectMembersSection";
import { GanttTaskTable } from "@/components/projects/views/gantt-view/GanttTaskTable";
import {
  convertSelectedDateToUTC,
  formatLocalDate,
  getWeekendDaysIndices,
} from "@/utils/timezone-utils";
import { GanttFieldVisibilityPopup } from "@/components/projects/views/gantt-view/GanttFieldVisibilityPopup";
import { CalendarPicker } from "@/components/CalendarPicker";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import AssigneeDropdown from "../list-view/filters/AssigneeDropdown";
import AdvancedFiltersNew, {
  FilterCriteria,
} from "../list-view/filters/AdvancedFiltersNew";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  GanttContext,
  getOffset,
  getWidth,
} from "@/components/ui/shadcn-io/gantt";
import {
  getRelationshipIcon,
  getRelationshipLabel,
  getRelationshipIconColor,
} from "@/utils/relationship-utils";
import { RelationshipDetailDialog } from "../list-view/common/RelationshipDetailDialog";

const getRelationshipStrokeColor = (type: string): string => {
  switch (type) {
    case "blocking":
      return "#ef4444";
    case "blocked-by":
      return "#f97316";
    case "relates-to":
      return "#3b82f6";
    case "duplicate-of":
      return "#a855f7";
    case "is-duplicated-by":
      return "#ec4899";
    case "parent-of":
      return "#10b981";
    case "child-of":
      return "#14b8a6";
    case "precedes":
      return "#6366f1";
    case "follows":
      return "#8b5cf6";
    default:
      return "#94a3b8";
  }
};

interface GanttConnectorPath {
  id: string;
  d: string;
  color: string;
  type: string;
  iconX: number;
  iconY: number;
  sourceTask: Task | Subtask;
  targetTask?: Task | Subtask;
}

const GanttConnectorRelationshipIcon = ({
  conn,
  projectSlug,
}: {
  conn: GanttConnectorPath;
  projectSlug: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const RelIcon = getRelationshipIcon(conn.type);
  const label = getRelationshipLabel(conn.type);

  const iconStyle: React.CSSProperties = {
    width: 20,
    height: 20,
    borderRadius: "50%",
    backgroundColor: "var(--card)",
    border: `1.5px solid ${conn.color}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    cursor: conn.targetTask ? "pointer" : "default",
    pointerEvents: "auto",
  };

  if (!conn.targetTask) {
    return (
      <foreignObject
        x={conn.iconX - 10}
        y={conn.iconY - 10}
        width={20}
        height={20}
        style={{ overflow: "visible", pointerEvents: "auto" }}
      >
        <div title={label} style={iconStyle}>
          <RelIcon size={10} style={{ color: conn.color, flexShrink: 0 }} />
        </div>
      </foreignObject>
    );
  }

  return (
    <foreignObject
      x={conn.iconX - 10}
      y={conn.iconY - 10}
      width={20}
      height={20}
      style={{ overflow: "visible", pointerEvents: "auto" }}
    >
      <Popover
        open={isHovered}
        onOpenChange={(open) => {
          if (!open) setIsHovered(false);
        }}
      >
        <PopoverTrigger asChild>
          <div
            style={iconStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <RelIcon
              size={10}
              className={cn("shrink-0", getRelationshipIconColor(conn.type))}
              style={{ color: conn.color }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="w-auto p-0 shadow-2xl bg-card z-[100]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <RelationshipDetailDialog
            sourceTask={conn.sourceTask}
            relType={conn.type}
            targetTask={conn.targetTask}
            projectSlug={projectSlug}
          />
        </PopoverContent>
      </Popover>
    </foreignObject>
  );
};

const GanttConnectors = ({
  allTaskFeatures,
  projectSlug,
}: {
  allTaskFeatures: any[];
  projectSlug: string;
}) => {
  const gantt = useContext(GanttContext);
  const { getTaskRelationships, tasks, subtasks } = useTasksStore();
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData],
  );

  const connectors = useMemo(() => {
    const paths: GanttConnectorPath[] = [];

    allTaskFeatures.forEach((sourceFeature, sourceIndex) => {
      if (!sourceFeature.ganttFeature) return;

      const sourceItem = sourceFeature.subtask || sourceFeature.task;
      if (!sourceItem) return;

      const relationships = getTaskRelationships(sourceItem.id);
      if (!relationships?.length) return;

      relationships.forEach((rel) => {
        const targetIndex = allTaskFeatures.findIndex(
          (f) => f.id === rel.targetTaskId,
        );
        if (targetIndex === -1) return;

        const targetFeature = allTaskFeatures[targetIndex];
        if (!targetFeature.ganttFeature) return;

        const targetTask =
          tasks.find((t) => t.id === rel.targetTaskId) ||
          subtasks.find((st) => st.id === rel.targetTaskId);

        const sourceX =
          getOffset(
            sourceFeature.ganttFeature.startAt,
            timelineStartDate,
            gantt,
          ) +
          getWidth(
            sourceFeature.ganttFeature.startAt,
            sourceFeature.ganttFeature.endAt,
            gantt,
          );
        const sourceY = sourceIndex * gantt.rowHeight + gantt.rowHeight / 2;

        const targetX = getOffset(
          targetFeature.ganttFeature.startAt,
          timelineStartDate,
          gantt,
        );
        const targetY = targetIndex * gantt.rowHeight + gantt.rowHeight / 2;

        const dy = targetY - sourceY;

        let d = "";
        let iconX: number;
        let iconY: number;

        if (Math.abs(dy) < 5) {
          d = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
          iconX = (sourceX + targetX) / 2;
          iconY = sourceY;
        } else {
          const midX = sourceX + Math.max(20, (targetX - sourceX) / 2);
          d = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
          iconX = midX;
          iconY = (sourceY + targetY) / 2;
        }

        paths.push({
          id: `${rel.id}-${sourceFeature.id}-${targetFeature.id}`,
          d,
          color: getRelationshipStrokeColor(rel.type),
          type: rel.type,
          iconX,
          iconY,
          sourceTask: sourceItem,
          targetTask,
        });
      });
    });

    return paths;
  }, [
    allTaskFeatures,
    gantt,
    timelineStartDate,
    getTaskRelationships,
    tasks,
    subtasks,
  ]);

  const totalWidth = useMemo(() => {
    const parsedColumnWidth = (gantt.columnWidth * gantt.zoom) / 100;
    return gantt.timelineData.length * parsedColumnWidth;
  }, [gantt.timelineData, gantt.columnWidth, gantt.zoom]);

  const totalHeight = allTaskFeatures.length * gantt.rowHeight;

  if (connectors.length === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
        zIndex: 100,
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orientation="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>
      {connectors.map((conn) => (
        <path
          key={conn.id}
          d={conn.d}
          fill="none"
          stroke={conn.color}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          className="opacity-100 transition-opacity"
          style={{ color: conn.color }}
        />
      ))}
      {connectors.map((conn) => (
        <GanttConnectorRelationshipIcon
          key={`icon-${conn.id}`}
          conn={conn}
          projectSlug={projectSlug}
        />
      ))}
    </svg>
  );
};

const toLocalISOString = (date: Date): string => {
  return convertSelectedDateToUTC(date);
};

interface SortField {
  id: string;
  fieldName: string;
  fieldType: string;
  isSelected: boolean;
  direction: "asc" | "desc" | null;
  order: number;
}

interface GanttViewProps {
  projectId: string;
  initialFilters?: FilterCriteria[];
}

export function GanttView({ projectId, initialFilters }: GanttViewProps) {
  const {
    tasks,
    getTasksByProject,
    fetchTasks,
    subtasks,
    updateTask,
    updateSubtask,
    deleteTask,
    deleteSubtask,
    columnConfigs,
  } = useTasksStore();

  const {
    projects,
    addMembersToProject,
    removeMembersFromProject,
    getTaskStatusConfigs,
  } = useProjectsStore();

  const { user: profile } = useProfileStore();
  const { currentWorkspace } = useWorkspaceStore();

  const weekendDays = useMemo(() => {
    return getWeekendDaysIndices();
  }, [profile?.preferences?.weekendDays]);

  const [range, setRange] = useState<Range>("daily");
  const [zoom, setZoom] = useState(100);
  const [showConnectors, setShowConnectors] = useState(true);
  const [markers, setMarkers] = useState<GanttMarkerProps[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingSubtaskToTask, setAddingSubtaskToTask] = useState<string | null>(
    null,
  );
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sort state
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sortFields, setSortFields] = useState<SortField[]>([]);

  // Filter state
  const [filterConfig, setFilterConfig] = useState<FilterCriteria[]>(
    initialFilters || [],
  );

  // Display state
  const [displayOptions, setDisplayOptions] = useState({
    collapsedSubtasks: false,
    closedTasks: true,
    wrapText: true,
    subtaskParentId: false,
  });

  // Initialize sort fields
  const { getTaskCustomFields } = useProjectsStore();
  const customFields = useMemo(
    () => getTaskCustomFields(projectId),
    [projectId, getTaskCustomFields],
  );

  useEffect(() => {
    const defaultFields = [
      { id: "id", fieldName: "ID", fieldType: "text" },
      { id: "task", fieldName: "Task", fieldType: "text" },
      { id: "taskType", fieldName: "Type", fieldType: "text" },
      { id: "status", fieldName: "Status", fieldType: "select-one" },
      { id: "cycle", fieldName: "Cycle", fieldType: "select-one" },
      { id: "priority", fieldName: "Priority", fieldType: "select-one" },
      { id: "startDate", fieldName: "Start Date", fieldType: "date" },
      { id: "endDate", fieldName: "Due Date", fieldType: "date" },
      { id: "assignee", fieldName: "Assignee", fieldType: "people" },
    ];

    const customFieldsData = customFields.map((field) => ({
      id: field.id,
      fieldName: field.name,
      fieldType: field.type,
    }));

    const allFieldIds = [...defaultFields, ...customFieldsData];

    setSortFields((prev) => {
      if (prev.length === 0) {
        return allFieldIds.map((field) => ({
          ...field,
          isSelected: false,
          direction: null,
          order: 0,
        }));
      }

      const existingIds = prev.map((f) => f.id);
      const newFields = allFieldIds
        .filter((field) => !existingIds.includes(field.id))
        .map((field) => ({
          ...field,
          isSelected: false,
          direction: null,
          order: 0,
        }));

      const validIds = allFieldIds.map((f) => f.id);
      const stillValidFields = prev.filter((f) => validIds.includes(f.id));

      return [...stillValidFields, ...newFields];
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
          : field,
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
              ? "bg-muted text-primary-text"
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
              ? "bg-muted text-primary-text"
              : "text-muted-foreground"
          } ${!isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {icons.desc}
        </button>
      </div>
    );
  };

  const hasSelectedSortFields = sortFields.some((field) => field.isSelected);

  // Draggable Sort Field Component (Same as ListView)
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
        <span className="text-xs font-medium text-primary-text">
          {field.fieldName}
        </span>
        {getSortIcon(field)}
      </div>
    );
  };

  const { toggleColumnFreeze } = useTasksStore();

  const handleFreezeToggle = (fieldId: string) => {
    const sortedFields = [...columnConfigs].sort(
      (a, b) => a.columnOrder - b.columnOrder,
    );
    const targetField = sortedFields.find((field) => field.id === fieldId);

    if (!targetField) return;

    const targetColumnOrder = targetField.columnOrder;
    const currentFreezeState = targetField.columnFreezed;

    if (!currentFreezeState) {
      sortedFields.forEach((field) => {
        if (field.columnOrder <= targetColumnOrder) {
          toggleColumnFreeze(field.id, true);
        }
      });
    } else {
      sortedFields.forEach((field) => {
        if (field.columnOrder < targetColumnOrder) {
          toggleColumnFreeze(field.id, true);
        } else {
          toggleColumnFreeze(field.id, false);
        }
      });
    }
  };

  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    timelineRef.current.scrollTop = e.currentTarget.scrollTop;
  }, []);

  const handleTimelineScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!listRef.current) return;
      listRef.current.scrollTop = e.currentTarget.scrollTop;
    },
    [],
  );

  const toggleTaskExpansion = useCallback(
    (taskId: string) => {
      setExpandedTasks((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(taskId)) {
          newSet.delete(taskId);
          if (addingSubtaskToTask === taskId) {
            setAddingSubtaskToTask(null);
          }
        } else {
          newSet.add(taskId);
        }
        return newSet;
      });
    },
    [addingSubtaskToTask],
  );

  const handleAddingSubtaskToTaskChange = useCallback(
    (taskId: string | null) => {
      setAddingSubtaskToTask(taskId);
      if (taskId) {
        setExpandedTasks((prev) => {
          const next = new Set(prev);
          next.add(taskId);
          return next;
        });
      }
    },
    [],
  );

  const project = projects.find((p) => p.id === projectId);
  const projectMembers = project?.members || [];

  useEffect(() => {
    if (!projectId) return;
    const existingTasks = getTasksByProject(projectId);
    if (existingTasks.length === 0) {
      fetchTasks(projectId).catch((error) =>
        console.error("Failed to load tasks:", error),
      );
    }

    // Initialize expanded tasks
    const tasksWithSubtasks = existingTasks
      .filter((task) => task.subtasks && task.subtasks.length > 0)
      .map((task) => task.id);
    setExpandedTasks(new Set(tasksWithSubtasks));
  }, [projectId]);

  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    const minWidth = 300;
    const maxWidth = 800;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => setIsResizing(false);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    const { columnConfigs, initializeColumnConfigs } = useTasksStore.getState();
    if (columnConfigs.length === 0) {
      initializeColumnConfigs(projectId);
    }
  }, [projectId]);

  const handleAddMembers = async (
    members: Array<{ userId: string; role: string }>,
  ) => {
    await addMembersToProject(projectId, members);
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMembersFromProject(projectId, [userId]);
  };

  const projectTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.projectId === projectId);

    // Apply Display Options - Closed Tasks
    if (displayOptions.closedTasks) {
      filtered = filtered.filter((t) => !t.completed && t.status !== "done");
    }

    // Apply Filters
    if (filterConfig.length > 0) {
      filtered = filtered.filter((task) => {
        return filterConfig.every((criteria) => {
          const fieldValue = (() => {
            if (criteria.field === "name" || criteria.field === "task")
              return task.name;
            if (criteria.field === "status") return task.status;
            if (criteria.field === "cycle") return task.cycleId;
            if (criteria.field === "priority") return task.priority;
            if (criteria.field === "assignee") return task.assignee;
            if (criteria.field === "labels") {
              const labelIds = task.labelIds || [];
              const labels = task.labels || [];
              const idsFromLabels = (labels as any[]).map((l) =>
                typeof l === "string" ? l : l.id || l.name,
              );
              return [...labelIds, ...idsFromLabels];
            }
            if (criteria.field === "startDate") return task.startDate;
            if (criteria.field === "endDate" || criteria.field === "dueDate")
              return task.endDate;
            return task.customFieldValues?.[criteria.field];
          })();

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
            case "date-equals": {
              if (!fieldValue || !filterValue) return false;
              return (
                new Date(fieldValue as string).toDateString() ===
                new Date(filterValue as string).toDateString()
              );
            }
            case "date-is-today": {
              if (!fieldValue) return false;
              return (
                new Date(fieldValue as string).toDateString() ===
                new Date().toDateString()
              );
            }
            case "date-is-this-week": {
              if (!fieldValue) return false;
              const today = new Date();
              const taskDate = new Date(fieldValue as string);
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(endOfWeek.getDate() + 6);
              return taskDate >= startOfWeek && taskDate <= endOfWeek;
            }
            case "date-is-this-month": {
              if (!fieldValue) return false;
              const today = new Date();
              const taskDate = new Date(fieldValue as string);
              return (
                taskDate.getMonth() === today.getMonth() &&
                taskDate.getFullYear() === today.getFullYear()
              );
            }
            case "date-is-before":
              return (
                fieldValue &&
                new Date(fieldValue as string) < new Date(filterValue as string)
              );
            case "date-is-after":
              return (
                fieldValue &&
                new Date(fieldValue as string) > new Date(filterValue as string)
              );
            case "date-is-between": {
              if (!fieldValue || !filterValue) return false;
              const [start, end] = String(filterValue).split(" - ");
              const taskDate = new Date(fieldValue as string);
              return taskDate >= new Date(start) && taskDate <= new Date(end);
            }
            case "greater-than":
              return Number(fieldValue) > Number(filterValue);
            case "less-than":
              return Number(fieldValue) < Number(filterValue);
            case "equals":
              return fieldValue == filterValue;
            case "not-equals":
              return fieldValue != filterValue;
            default:
              return true;
          }
        });
      });
    }

    // Apply Sorting
    const activeSorts = sortFields
      .filter((f) => f.isSelected && f.direction)
      .sort((a, b) => a.order - b.order);

    if (activeSorts.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of activeSorts) {
          let valA: any, valB: any;

          if (
            [
              "id",
              "task",
              "taskType",
              "status",
              "cycle",
              "assignee",
              "startDate",
              "endDate",
              "priority",
            ].includes(sort.id)
          ) {
            const fieldMap: Record<string, keyof Task> = {
              id: "taskNumber",
              task: "name",
              taskType: "taskType",
              status: "status",
              cycle: "cycleId",
              assignee: "assignee",
              startDate: "startDate",
              endDate: "endDate",
              priority: "priority",
            };
            const key = fieldMap[sort.id] || (sort.id as keyof Task);
            valA = a[key];
            valB = b[key];
          } else {
            valA = a.customFieldValues?.[sort.id];
            valB = b.customFieldValues?.[sort.id];
          }

          if (valA === valB) continue;
          if (valA == null) return 1;
          if (valB == null) return -1;

          const comparison = valA < valB ? -1 : 1;
          return sort.direction === "asc" ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [tasks, projectId, sortFields, displayOptions, filterConfig]);

  // Subtask collapse/expand logic parity with ListView
  useEffect(() => {
    if (displayOptions.collapsedSubtasks) {
      setExpandedTasks(new Set());
    } else {
      const validIds = new Set((projectTasks || []).map((t) => t.id));
      const tasksWithSubtasks = (projectTasks || [])
        .filter((task) => task.subtasks && task.subtasks.length > 0)
        .map((task) => task.id);

      setExpandedTasks(
        (prev) =>
          new Set([
            ...Array.from(prev).filter((id) => validIds.has(id)), // keep existing valid expanded rows
            ...tasksWithSubtasks, // add tasks that have subtasks
          ]),
      );
    }
  }, [displayOptions.collapsedSubtasks, projectTasks]);

  const taskStatusConfigs = useMemo(
    () => getTaskStatusConfigs(projectId),
    [projectId, getTaskStatusConfigs],
  );
  const taskPriorityConfigs = useMemo(
    () => useProjectsStore.getState().getTaskPriorityConfigs(projectId),
    [projectId],
  );

  const allTaskFeatures = useMemo(() => {
    const features: Array<{
      id: string;
      name: string;
      task: Task | undefined;
      subtask?: any;
      hasDate: boolean;
      ganttFeature?: GanttFeature;
      isPlaceholder?: boolean;
    }> = [];

    projectTasks.forEach((task) => {
      const ganttFeature = transformTaskToGanttFeature(
        task,
        undefined,
        taskStatusConfigs,
      );
      features.push({
        id: task.id,
        name: task.name,
        task: task,
        hasDate: !!ganttFeature,
        ganttFeature: ganttFeature || undefined,
      });

      const isExpanded = expandedTasks.has(task.id);
      if (isExpanded) {
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach((subtaskId) => {
            const subtask = subtasks.find((st) => st.id === subtaskId);
            if (subtask) {
              const subtaskGanttFeature = transformTaskToGanttFeature(
                task,
                subtask,
                taskStatusConfigs,
              );
              features.push({
                id: subtask.id,
                name: ` ↳ ${subtask.name}`,
                task: task,
                subtask: subtask,
                hasDate: !!subtaskGanttFeature,
                ganttFeature: subtaskGanttFeature || undefined,
              });
            }
          });
        }

        // Add placeholder row if subtask is being added
        if (addingSubtaskToTask === task.id) {
          features.push({
            id: `adding-subtask-${task.id}`,
            name: "Add Subtask Placeholder",
            task: task,
            hasDate: false,
            isPlaceholder: true,
          });
        }
      }
    });

    // Add mandatory footer placeholder row to match the "Add Task" row in the table
    features.push({
      id: "footer-add-task-placeholder",
      name: "Add Task Footer Placeholder",
      task: undefined,
      hasDate: false,
      isPlaceholder: true,
    });

    return features;
  }, [
    projectTasks,
    subtasks,
    taskStatusConfigs,
    expandedTasks,
    addingSubtaskToTask,
    showAddTask,
  ]);

  const handleMoveFeature = useCallback(
    (id: string, startAt: Date, endAt: Date | null) => {
      if (!endAt) return;
      const task = tasks.find((t) => t.id === id);
      const subtask = subtasks.find((st) => st.id === id);
      if (task) {
        updateTask(id, {
          startDate: toLocalISOString(startAt),
          endDate: toLocalISOString(endAt),
        });
      } else if (subtask) {
        updateSubtask(id, {
          startDate: toLocalISOString(startAt),
          endDate: toLocalISOString(endAt),
        });
      }
    },
    [tasks, subtasks, updateTask, updateSubtask],
  );

  const handleCreateMarker = useCallback((date: Date) => {
    const newMarker: GanttMarkerProps = {
      id: `marker-${Date.now()}`,
      date,
      label: format(date, "MMM dd, yyyy"),
    };
    setMarkers((prev) => [...prev, newMarker]);
  }, []);

  const handleRemoveMarker = useCallback(
    (id: string) => setMarkers((prev) => prev.filter((m) => m.id !== id)),
    [],
  );

  // const handleAddFeature = useCallback((date: Date) => console.log(`Add feature at: ${date.toISOString()}`), []);

  const getDateLabel = () => {
    if (range === "daily") return format(currentDate, "MMMM d, yyyy");
    if (range === "weekly") {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
    if (range === "monthly") return format(currentDate, "MMMM yyyy");
    if (range === "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${quarter} ${currentDate.getFullYear()}`;
    }
    if (range === "sprint") {
      const sprintStart = new Date(currentDate);
      const sprintEnd = addDays(sprintStart, 13);
      return `${format(sprintStart, "MMM d")} - ${format(sprintEnd, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  };

  const handleNavigate = (direction: "prev" | "next" | "today") => {
    const newDate = new Date(currentDate);
    if (direction === "today") {
      setCurrentDate(new Date());
      return;
    }
    const delta = direction === "prev" ? -1 : 1;
    if (range === "daily") newDate.setDate(newDate.getDate() + delta);
    else if (range === "weekly") newDate.setDate(newDate.getDate() + delta * 7);
    else if (range === "monthly") newDate.setMonth(newDate.getMonth() + delta);
    else if (range === "quarterly")
      newDate.setMonth(newDate.getMonth() + delta * 3);
    else if (range === "sprint")
      newDate.setDate(newDate.getDate() + delta * 14);
    setCurrentDate(newDate);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full h-full flex flex-col bg-background">
        <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="relative flex ">
              <Input
                placeholder="Search"
                className="pl-2 pr-8 rounded text-xs"
                data-testid="gantt-search-input"
              />
              <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
            </div>
            <Popover open={isMembersOpen} onOpenChange={setIsMembersOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded cursor-pointer gap-2 text-xs"
                  data-testid="gantt-members-trigger"
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
              <PopoverContent
                className="w-[320px] p-2 border border-b-[5px] border-b-primary"
                align="start"
              >
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

            {/* Group By - Disabled for Gantt */}
            {/* <Button size="sm" variant="secondary" className="gap-2 rounded cursor-not-allowed opacity-50" disabled>
                            <Layers className="h-4 w-4" />
                            Group by: <span className="capitalize">none</span>
                        </Button> */}

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
                data-testid="gantt-sort-filter-toggle"
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
                        data-testid="gantt-sort-trigger"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className={`p-0 transition-all duration-200 border-0 border-b-[5px] border-b-primary ${hasSelectedSortFields ? "w-[620px]" : "w-[420px]"}`}
                    >
                      <div className="flex items-center justify-between px-4 py-3">
                        <h3 className="text-xs font-semibold text-primary-text">
                          Sort fields by
                        </h3>
                      </div>
                      <div
                        className={`grid ${hasSelectedSortFields ? "grid-cols-3" : "grid-cols-2"} divide-x`}
                      >
                        <div className="p-2">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            Default fields
                          </h4>
                          <div className="space-y-0.5">
                            {sortFields
                              .filter((f) =>
                                [
                                  "id",
                                  "task",
                                  "taskType",
                                  "status",
                                  "cycle",
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
                                  className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                                >
                                  <div
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${field.isSelected ? "bg-primary border-primary" : "border-input"}`}
                                  >
                                    {field.isSelected && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-xs font-medium text-primary-text">
                                    {field.fieldName}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div className="p-2">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            Custom fields
                          </h4>
                          <div className="space-y-0.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                            {sortFields.filter(
                              (f) =>
                                ![
                                  "id",
                                  "task",
                                  "taskType",
                                  "status",
                                  "cycle",
                                  "assignee",
                                  "startDate",
                                  "endDate",
                                  "priority",
                                ].includes(f.id),
                            ).length > 0 ? (
                              sortFields
                                .filter(
                                  (f) =>
                                    ![
                                      "id",
                                      "task",
                                      "taskType",
                                      "status",
                                      "cycle",
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
                                    className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                                  >
                                    <div
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${field.isSelected ? "bg-primary border-primary" : "border-input"}`}
                                    >
                                      {field.isSelected && (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      )}
                                    </div>
                                    <span className="text-xs font-medium text-primary-text truncate">
                                      {field.fieldName}
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <p className="text-[10px] text-muted-foreground px-2 py-4 italic">
                                No custom fields
                              </p>
                            )}
                          </div>
                        </div>
                        {hasSelectedSortFields && (
                          <div className="p-2">
                            <h4 className="text-xs font-semibold text-[#6E7C87] mb-2 px-2">
                              My Sort
                            </h4>
                            <div className="space-y-0.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                              {sortFields
                                .filter((field) => field.isSelected)
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
                        )}
                      </div>
                      {hasSelectedSortFields && (
                        <div className="px-4 py-2 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleClearAllSort}
                            className="justify-start bg-muted text-foreground hover:bg-primary hover:text-primary-foreground text-xs"
                            data-testid="gantt-sort-clear-btn"
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
                    onOpenChange={(open) =>
                      setActiveDropdown(open ? "filter" : null)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 rounded cursor-pointer text-xs"
                        data-testid="gantt-filter-trigger"
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
                      className="px-2 py-2 border-0 border-b-[5px] border-b-primary w-50 "
                    >
                      {/* Quick Filters */}
                      <div className="space-y-1 mb-1 ">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs">
                            <span className="text-primary-text text-xs">
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

                        {/* Priority Filter */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs">
                            <span className="text-primary-text text-xs">
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

                        {/* Status Filter */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs">
                            <span className="text-primary-text text-xs">
                              Status
                            </span>
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

                        {/* Due Date Filter */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs">
                            <span className="text-primary-text text-xs">
                              Due Date
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-auto p-2 border-0 border-b-[5px] border-b-primary">
                            <CalendarPicker
                              selectedDate={(() => {
                                const existing = filterConfig.find(
                                  (f) => f.field === "dueDate",
                                );
                                return existing
                                  ? new Date(existing.value)
                                  : undefined;
                              })()}
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

                        {/* Labels Filter */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs">
                            <span className="text-primary-text text-xs">
                              Labels
                            </span>
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
                      </div>

                      <Separator className="my-1 bg-[#C7C7CC] h-1" />

                      <DropdownMenuItem
                        onSelect={() => {
                          setShowAdvancedFilters(true);
                        }}
                        className="text-xs"
                      >
                        <span className="text-primary-text text-xs">
                          Advanced Filters
                        </span>
                      </DropdownMenuItem>

                      {filterConfig.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => setFilterConfig([])}
                            data-testid="gantt-filter-clear-btn"
                          >
                            Clear All Filters
                          </Button>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Freeze Fields */}
                  {/* <Button size="sm" variant="ghost" className="gap-2 rounded cursor-not-allowed opacity-50 text-xs" disabled>
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
                        data-testid="gantt-display-trigger"
                      >
                        <Monitor className="h-4 w-4" />
                        Display
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 border-0 border-b-[5px] border-b-primary">
                      {/* Collapsed Subtasks */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="collapsed-subtasks"
                          className="text-xs cursor-pointer text-primary-text"
                        >
                          Collapsed Subtasks
                        </Label>
                        <Switch
                          id="collapsed-subtasks"
                          checked={displayOptions.collapsedSubtasks}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              collapsedSubtasks: !!checked,
                            }))
                          }
                          data-testid="gantt-display-collapsed-subtasks-switch"
                        />
                      </div>

                      {/* Closed Tasks */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="closed-tasks"
                          className="text-xs cursor-pointer text-primary-text"
                        >
                          Closed Tasks
                        </Label>
                        <Switch
                          id="closed-tasks"
                          checked={displayOptions.closedTasks}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              closedTasks: !!checked,
                            }))
                          }
                          data-testid="gantt-display-closed-tasks-switch"
                        />
                      </div>

                      {/* Wrap Text */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="wrap-text"
                          className="text-xs cursor-pointer text-primary-text"
                        >
                          Wrap Text
                        </Label>
                        <Switch
                          id="wrap-text"
                          checked={displayOptions.wrapText}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              wrapText: !!checked,
                            }))
                          }
                          data-testid="gantt-display-wrap-text-switch"
                        />
                      </div>

                      {/* Subtask Parent ID */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="subtask-parent-id"
                          className="text-xs cursor-pointer text-primary-text"
                        >
                          Subtask parent ID
                        </Label>
                        <Switch
                          id="subtask-parent-id"
                          checked={displayOptions.subtaskParentId}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              subtaskParentId: !!checked,
                            }))
                          }
                          data-testid="gantt-display-subtask-parent-id-switch"
                        />
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Connectors Toggle */}
            <div
              onClick={() => setShowConnectors((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 h-8 px-2 rounded border transition-colors duration-150 cursor-pointer select-none",
                showConnectors
                  ? "border-primary bg-primary/10 text-primary-text dark:border-primary-foreground/30 dark:bg-primary-foreground/10"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border",
              )}
              data-testid="gantt-connectors-toggle"
            >
              <Cable className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Connectors</span>
              <Switch
                id="connectors-toggle"
                checked={showConnectors}
                onCheckedChange={setShowConnectors}
                onClick={(e) => e.stopPropagation()}
                className="scale-75 origin-right pointer-events-none"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleNavigate("today")}
              className="h-8 px-2 rounded text-xs font-medium"
              data-testid="gantt-nav-today"
            >
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => handleNavigate("prev")}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="gantt-nav-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-xs font-semibold hover:bg-muted flex items-center gap-1"
                    data-testid="gantt-nav-datepicker-btn"
                  >
                    {getDateLabel()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-2 border-0 border-b-[5px] border-b-primary"
                  align="center"
                >
                  <CalendarPicker
                    selectedDate={currentDate}
                    onDateSelect={(newDate) => setCurrentDate(newDate)}
                    range={range}
                    currentLabel={getDateLabel()}
                  />
                </PopoverContent>
              </Popover>
              <Button
                onClick={() => handleNavigate("next")}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="gantt-nav-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-8 flex items-center gap-1 bg-muted rounded p-1 ml-4">
              {(["daily", "weekly", "sprint", "monthly"] as Range[]).map(
                (r) => {
                  const labels: Record<string, string> = {
                    daily: "Day",
                    weekly: "Week",
                    sprint: "Sprint",
                    monthly: "Month",
                  };
                  return (
                    <Button
                      key={r}
                      variant={range === r ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setRange(r)}
                      className={cn(
                        "h-7 px-2 rounded text-xs",
                        range === r
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      data-testid={`gantt-range-${r}`}
                    >
                      {labels[r]}
                    </Button>
                  );
                },
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 h-full flex border rounded-lg mx-4 my-2 overflow-hidden shadow-sm">
          <div
            className="h-full flex-shrink-0 border-r bg-background relative"
            style={{ width: sidebarWidth }}
          >
            <div className="h-full">
              <GanttTaskTable
                ref={listRef}
                onScroll={handleListScroll}
                tasks={projectTasks}
                projectId={projectId}
                columnConfigs={columnConfigs}
                displayOptions={displayOptions}
                expandedTasks={expandedTasks}
                onToggleExpansion={toggleTaskExpansion}
                addingSubtaskToTask={addingSubtaskToTask}
                onAddingSubtaskToTaskChange={handleAddingSubtaskToTaskChange}
                showAddTask={showAddTask}
                onShowAddTaskChange={setShowAddTask}
              />
            </div>
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "absolute top-0 right-0 w-1 h-full cursor-col-resize",
                "hover:bg-blue-500 hover:w-1.5 transition-all outline-none",
                isResizing && "bg-blue-500 w-1.5",
              )}
            />
          </div>

          <div className="flex-1 min-h-0 relative">
            <GanttProvider
              range={range as Range}
              startDate={currentDate}
              zoom={zoom}
              headerHeight={36}
              rowHeight={36}
              // onAddItem={handleAddFeature}
              className="h-full w-full overflow-hidden"
              weekendDays={weekendDays}
              containerRef={timelineRef}
            >
              <div className="absolute inset-0 flex flex-col">
                <GanttTimeline
                  ref={timelineRef}
                  onScroll={handleTimelineScroll}
                  className="flex-1 overflow-auto scroll-container"
                >
                  <GanttHeader />
                  <GanttFeatureList className="space-y-0">
                    {allTaskFeatures.map((feature) =>
                      feature.ganttFeature ? (
                        <GanttFeatureItem
                          key={`${feature.id}-${feature.ganttFeature?.startAt.getTime()}-${feature.ganttFeature?.endAt?.getTime()}`}
                          {...feature.ganttFeature}
                          onMove={handleMoveFeature}
                          hideLabels={true}
                        />
                      ) : (
                        <div
                          key={feature.id}
                          style={{ height: "var(--gantt-row-height)" }}
                          className="border-b border-border/50"
                        />
                      ),
                    )}
                    {showConnectors && (
                      <GanttConnectors
                        allTaskFeatures={allTaskFeatures}
                        projectSlug={project?.slug ?? "TASK"}
                      />
                    )}
                  </GanttFeatureList>
                  {markers.map((marker) => (
                    <GanttMarker
                      key={marker.id}
                      {...marker}
                      onRemove={handleRemoveMarker}
                    />
                  ))}
                  <GanttToday />
                  {/* <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} /> */}
                </GanttTimeline>
              </div>
            </GanttProvider>
            <div className="absolute bottom-6 right-6 z-20 flex overflow-hidden rounded-md border bg-card shadow-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                disabled={zoom >= 200}
                className="h-9 w-9"
                data-testid="gantt-zoom-in-btn"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="w-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.max(100, z - 10))}
                disabled={zoom <= 100}
                className="h-9 w-9"
                data-testid="gantt-zoom-out-btn"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AdvancedFiltersNew
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={(filterBlock) => {
          // Convert FilterBlock to FilterCriteria[] for the projectTasks memo
          // For now, just use the top-level children
          setFilterConfig(filterBlock.children);
        }}
        currentFilterBlock={
          filterConfig.length > 0
            ? {
                id: "current",
                operator: "AND",
                children: filterConfig as any,
              }
            : null
        }
        projectId={projectId}
      />
    </DndProvider>
  );
}
