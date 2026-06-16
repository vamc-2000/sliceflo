"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import {
  useProjectsStore,
  getProfilePictureUrl,
} from "@/stores/projects-store";
import { useProfileStore } from "@/stores/profile-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";
import {
  GanttProvider,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureItem,
  GanttToday,
  GanttCreateMarkerTrigger,
  GanttMarker,
  type GanttFeature,
  type GanttMarkerProps,
  type Range,
} from "@/components/ui/shadcn-io/gantt";
import { transformProjectToGanttFeature } from "@/lib/gantt-helpers";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  EyeIcon,
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
  ArrowRight,
  ArrowUpDown,
  Funnel,
  Monitor,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDown01,
  ArrowDown10,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { PortfolioGanttTable } from "./PortfolioGanttTable";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarPicker } from "@/components/CalendarPicker";
import LinkPortfolioProjectDialog from "../PortfolioOverview/LinkPortfolioProjectDialog";

interface SortField {
  id: string;
  fieldName: string;
  fieldType: string;
  isSelected: boolean;
  direction: "asc" | "desc" | null;
  order: number;
}

interface FilterCriteria {
  id: string;
  field: string;
  condition: string;
  value: any;
}

interface GanttViewProps {
  portfolioId: string;
}

export function GanttView({ portfolioId }: GanttViewProps) {
  const { portfolios } = usePortfoliosStore();
  const { projects, updateProjectDates } = useProjectsStore();
  const { user: profile } = useProfileStore();
  const { projectPhases, workspaceMembers } = useWorkspaceStore();

  const portfolioLeaders = useMemo(() => {
    const portfolioVal = portfolios.find((p) => p.id === portfolioId);
    const projectIdsVal = portfolioVal?.projects || [];
    const unfilteredProjects = projects.filter((p) =>
      projectIdsVal.includes(p.id!),
    );
    const leaderIds = new Set<string>();
    unfilteredProjects.forEach((p) => {
      if (p.leaders) {
        p.leaders.forEach((id) => leaderIds.add(id));
      }
      if (p.projectLeader) {
        leaderIds.add(p.projectLeader);
      }
    });
    return workspaceMembers.filter((m) => leaderIds.has(m.userId));
  }, [portfolios, projects, portfolioId, workspaceMembers]);

  const portfolioMembers = useMemo(() => {
    const portfolioVal = portfolios.find((p) => p.id === portfolioId);
    const projectIdsVal = portfolioVal?.projects || [];
    const unfilteredProjects = projects.filter((p) =>
      projectIdsVal.includes(p.id!),
    );
    const memberIds = new Set<string>();
    unfilteredProjects.forEach((p) => {
      if (p.members) {
        p.members.forEach((m) => memberIds.add(m.userId));
      }
    });
    return workspaceMembers.filter((m) => memberIds.has(m.userId));
  }, [portfolios, projects, portfolioId, workspaceMembers]);

  // Configuration
  const weekendDays = useMemo(() => {
    if (!profile?.preferences?.weekendDays) return [0, 6];
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return profile.preferences.weekendDays.map(
      (day: string) => dayMap[day] ?? 0,
    );
  }, [profile?.preferences?.weekendDays]);

  // View state
  const [range, setRange] = useState<Range>("monthly"); // Default to monthly as requested
  const [zoom, setZoom] = useState(100);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openLinkProjectDialog, setOpenLinkProjectDialog] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sort, Filter, and Display states
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterConfig, setFilterConfig] = useState<FilterCriteria[]>([]);
  const [displayOptions, setDisplayOptions] = useState({
    closedProjects: true,
    hideEmptyGroups: false,
  });

  const [sortFields, setSortFields] = useState<SortField[]>(() => [
    {
      id: "id",
      fieldName: "ID",
      fieldType: "number",
      isSelected: false,
      direction: null,
      order: 0,
    },
    {
      id: "name",
      fieldName: "Project Name",
      fieldType: "text",
      isSelected: false,
      direction: null,
      order: 0,
    },
    {
      id: "phase",
      fieldName: "Phase",
      fieldType: "select-one",
      isSelected: false,
      direction: null,
      order: 0,
    },
    {
      id: "update",
      fieldName: "Update",
      fieldType: "select-one",
      isSelected: false,
      direction: null,
      order: 0,
    },
    {
      id: "leader",
      fieldName: "Leader",
      fieldType: "user",
      isSelected: false,
      direction: null,
      order: 0,
    },
    {
      id: "members",
      fieldName: "Members",
      fieldType: "users",
      isSelected: false,
      direction: null,
      order: 0,
    },
    {
      id: "viewers",
      fieldName: "Viewers",
      fieldType: "users",
      isSelected: false,
      direction: null,
      order: 0,
    },
    {
      id: "priority",
      fieldName: "Priority",
      fieldType: "select-one",
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
      id: "progress",
      fieldName: "Progress",
      fieldType: "number",
      isSelected: false,
      direction: null,
      order: 0,
    },
  ]);

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
          : field,
      );

      // Reassign order for selected fields
      const selectedFields = updatedFields.filter((f) => f.isSelected);
      selectedFields.forEach((field, index) => {
        field.order = index;
      });

      return updatedFields;
    });
  };

  const hasSelectedSortFields = sortFields.some((field) => field.isSelected);

  // Handle direction selection
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

  // Clear all sort functionality
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

    dragRef(dropRef(ref));

    return (
      <div
        ref={ref}
        className={`grid grid-cols-[20px_1fr_20px] items-center px-2 py-1 mr-3 hover:bg-muted rounded ${isDragging ? "opacity-50" : ""}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="text-xs font-medium text-primary truncate max-w-[80px]">
          {field.fieldName}
        </span>
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

  // Get active sort configuration
  const getActiveSortConfig = () => {
    return sortFields
      .filter((f) => f.isSelected && f.direction)
      .sort((a, b) => a.order - b.order)
      .map((f) => ({
        fieldId: f.id,
        fieldName: f.fieldName,
        fieldType: f.fieldType,
        direction: f.direction!,
        order: f.order,
      }));
  };

  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  };

  const getMemberNames = (userIds: string | string[]) => {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return "";
    const firstUser = workspaceMembers.find((m) => m.userId === ids[0]);
    return firstUser?.name || "";
  };

  const getFieldValueForFilter = (project: any, fieldId: string): any => {
    if (fieldId === "id") return project.slug || "";
    if (fieldId === "name") return project.name || "";
    if (fieldId === "phase") return project.phase || "";
    if (fieldId === "update")
      return (
        project.statusHistory?.[0]?.status || project.currentProjectUpdate || ""
      );
    if (fieldId === "leader") {
      return project.leaders?.length
        ? project.leaders
        : project.projectLeader
          ? [project.projectLeader]
          : [];
    }
    if (fieldId === "members") {
      return (project.members || []).map((m: any) => m.userId);
    }
    if (fieldId === "viewers") {
      return project.viewers || [];
    }
    if (fieldId === "priority") return project.priority || "";
    if (fieldId === "startDate") return project.startDate || "";
    if (fieldId === "endDate") return project.endDate || "";
    if (fieldId === "progress") return project.progress || 0;
    return null;
  };

  const matchesFilterCriteria = (
    project: any,
    criteria: FilterCriteria,
  ): boolean => {
    const fieldValue = getFieldValueForFilter(project, criteria.field);
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
        if (
          criteria.field === "leader" ||
          criteria.field === "members" ||
          criteria.field === "viewers"
        ) {
          const ids = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
          return ids.some(
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

  const sortProjects = (projectsList: any[]) => {
    const activeSorts = getActiveSortConfig();
    if (activeSorts.length === 0) return projectsList;

    return [...projectsList].sort((a, b) => {
      for (const sort of activeSorts) {
        const valA = getFieldValueForFilter(a, sort.fieldId);
        const valB = getFieldValueForFilter(b, sort.fieldId);

        if (valA === valB) continue;
        if (valA === null || valA === undefined || valA === "") return 1;
        if (valB === null || valB === undefined || valB === "") return -1;

        let comparison = 0;
        if (sort.fieldType === "number") {
          comparison = Number(valA) - Number(valB);
        } else if (sort.fieldType === "date") {
          comparison = new Date(valA).getTime() - new Date(valB).getTime();
        } else if (sort.fieldType === "user" || sort.fieldType === "users") {
          const nameA = getMemberNames(valA);
          const nameB = getMemberNames(valB);
          comparison = nameA.localeCompare(nameB);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }

        if (comparison !== 0) {
          return sort.direction === "asc" ? comparison : -comparison;
        }
      }
      return 0;
    });
  };

  // Vertical scroll synchronization
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

  const portfolio = portfolios.find((p) => p.id === portfolioId);
  const projectsList = portfolio?.projects || [];

  const portfolioProjects = useMemo(() => {
    let result = projects.filter((p) => projectsList.includes(p.id!));

    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply closed projects display option
    if (!displayOptions.closedProjects) {
      result = result.filter((p) => {
        const displayUpdate = (
          p.statusHistory?.[0]?.status ||
          p.currentProjectUpdate ||
          ""
        ).toLowerCase();
        return displayUpdate !== "completed";
      });
    }

    // Apply active filters
    if (filterConfig.length > 0) {
      result = result.filter((p) =>
        filterConfig.every((criteria) => matchesFilterCriteria(p, criteria)),
      );
    }

    // Apply sorting
    return sortProjects(result);
  }, [
    projects,
    portfolio?.projects,
    searchQuery,
    filterConfig,
    displayOptions.closedProjects,
    sortFields,
  ]);

  const ganttFeatures = useMemo(() => {
    return portfolioProjects
      .map((p) => {
        const phase = projectPhases
          .flatMap((pp) => [pp, ...(pp.children || [])])
          .find((pp) => pp.value === p.phase);
        // Return white (#ffffff) if no phase color is found
        return transformProjectToGanttFeature(p, phase?.color || "#ffffff");
      })
      .filter((f): f is GanttFeature => !!f);
  }, [portfolioProjects, projectPhases]);

  // Handlers
  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) return;
    updateProjectDates(id, startAt.toISOString(), endAt.toISOString());
  };

  const handleNavigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setCurrentDate(new Date());
      return;
    }
    const delta = direction === "prev" ? -1 : 1;
    const newDate = new Date(currentDate);
    if (range === "daily") newDate.setDate(newDate.getDate() + delta);
    else if (range === "weekly") newDate.setDate(newDate.getDate() + delta * 7);
    else if (range === "monthly") newDate.setMonth(newDate.getMonth() + delta);
    else if (range === "quarterly")
      newDate.setMonth(newDate.getMonth() + delta * 3);
    else if (range === "half-yearly")
      newDate.setMonth(newDate.getMonth() + delta * 6);
    else if (range === "yearly")
      newDate.setFullYear(newDate.getFullYear() + delta);
    setCurrentDate(newDate);
  };

  const getDateLabel = () => {
    if (range === "daily") return format(currentDate, "MMMM d, yyyy");
    if (range === "weekly") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = addDays(start, 6);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    if (range === "monthly") return format(currentDate, "MMMM yyyy");
    if (range === "quarterly")
      return `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`;
    if (range === "half-yearly")
      return `H${Math.floor(currentDate.getMonth() / 6) + 1} ${currentDate.getFullYear()}`;
    if (range === "yearly") return format(currentDate, "yyyy");
    return format(currentDate, "MMMM yyyy");
  };

  // Sidebar Resizing Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(800, Math.max(300, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full h-full flex flex-col bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-2 pr-8 rounded text-xs"
              />
              <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSortOptions(!showSortOptions)}
                className={`rounded cursor-pointer text-xs ${showSortOptions ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
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
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        Sort
                        {hasSelectedSortFields && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                            {sortFields.filter((f) => f.isSelected).length}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className={`p-0 transition-all duration-200 border-b-[5px] border-b-primary ${
                        hasSelectedSortFields ? "w-155" : "w-105"
                      }`}
                    >
                      <div className="flex items-center justify-between px-4 py-3">
                        <h3 className="text-sm font-semibold text-primary">
                          Sort fields by
                        </h3>
                      </div>
                      <div
                        className={`grid ${hasSelectedSortFields ? "grid-cols-2" : "grid-cols-1"} divide-x`}
                      >
                        {/* Column 1: Available fields */}
                        <div className="px-2 py-1">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            Project fields
                          </h4>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {sortFields.map((field) => (
                              <div
                                key={field.id}
                                onClick={() => handleFieldSelection(field.id)}
                                className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                              >
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
                                    field.isSelected
                                      ? "bg-primary border-primary"
                                      : "border-input"
                                  }`}
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
                                <span className="text-xs font-medium text-primary">
                                  {field.fieldName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Column 2: My Sort */}
                        {hasSelectedSortFields && (
                          <div className="px-2 py-1">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                              My Sort
                            </h4>
                            <div className="space-y-1">
                              <div className="flex flex-col gap-1 px-0">
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
                          </div>
                        )}
                      </div>
                      {hasSelectedSortFields && (
                        <div className="px-4 py-2 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleClearAllSort}
                            className="justify-start bg-muted text-foreground hover:bg-primary hover:text-primary-foreground text-xs w-full"
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
                      className="px-2 py-2 border-b-[5px] border-b-primary w-50"
                    >
                      <div className="space-y-1 mb-1">
                        {/* Leader Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-primary text-xs">Leader</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-64 max-h-64 overflow-y-auto p-1">
                            {portfolioLeaders.map((member) => (
                              <DropdownMenuItem
                                key={member.userId}
                                onClick={() => {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "leader",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "leader"
                                          ? { ...f, value: member.userId }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substring(2, 9),
                                        field: "leader",
                                        condition: "contains",
                                        value: member.userId,
                                      },
                                    ];
                                  });
                                }}
                                className="flex items-center gap-2 p-2 cursor-pointer text-xs"
                              >
                                {member.profilePicture ? (
                                  <img
                                    src={
                                      getProfilePictureUrl(
                                        member.profilePicture,
                                      ) || "/images/default-avatar.png"
                                    }
                                    alt={member.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-primary">
                                    {getInitials(member.name)}
                                  </div>
                                )}
                                <span>{member.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        {/* Member Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-primary text-xs">Member</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-64 max-h-64 overflow-y-auto p-1">
                            {portfolioMembers.map((member) => (
                              <DropdownMenuItem
                                key={member.userId}
                                onClick={() => {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "members",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "members"
                                          ? { ...f, value: member.userId }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substring(2, 9),
                                        field: "members",
                                        condition: "contains",
                                        value: member.userId,
                                      },
                                    ];
                                  });
                                }}
                                className="flex items-center gap-2 p-2 cursor-pointer text-xs"
                              >
                                {member.profilePicture ? (
                                  <img
                                    src={
                                      getProfilePictureUrl(
                                        member.profilePicture,
                                      ) || "/images/default-avatar.png"
                                    }
                                    alt={member.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-primary">
                                    {getInitials(member.name)}
                                  </div>
                                )}
                                <span>{member.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        {/* Phase Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-primary text-xs">Phase</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 p-2">
                            {projectPhases
                              .flatMap((p) => [p, ...(p.children || [])])
                              .map((phase) => (
                                <DropdownMenuItem
                                  key={phase.value}
                                  onClick={() => {
                                    setFilterConfig((prev) => {
                                      const existing = prev.find(
                                        (f) => f.field === "phase",
                                      );
                                      if (existing)
                                        return prev.map((f) =>
                                          f.field === "phase"
                                            ? { ...f, value: phase.value }
                                            : f,
                                        );
                                      return [
                                        ...prev,
                                        {
                                          id: Math.random()
                                            .toString(36)
                                            .substring(2, 9),
                                          field: "phase",
                                          condition: "is",
                                          value: phase.value,
                                        },
                                      ];
                                    });
                                  }}
                                  className="flex items-center gap-2 cursor-pointer text-xs"
                                >
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: phase.color || "#3B82F6",
                                    }}
                                  />
                                  <span className="text-xs font-medium">
                                    {phase.label}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        {/* Update Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-primary text-xs">Update</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 p-2">
                            {[
                              {
                                value: "active",
                                label: "Active",
                                color: "#10B981",
                              },
                              {
                                value: "planning",
                                label: "Planning",
                                color: "#3B82F6",
                              },
                              {
                                value: "on-hold",
                                label: "On Hold",
                                color: "#F59E0B",
                              },
                              {
                                value: "completed",
                                label: "Completed",
                                color: "#6B7280",
                              },
                            ].map((cfg) => (
                              <DropdownMenuItem
                                key={cfg.value}
                                onClick={() => {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "update",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "update"
                                          ? { ...f, value: cfg.value }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substring(2, 9),
                                        field: "update",
                                        condition: "is",
                                        value: cfg.value,
                                      },
                                    ];
                                  });
                                }}
                                className="flex items-center gap-2 cursor-pointer text-xs"
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

                        {/* Priority Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-primary text-xs">
                              Priority
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 p-2">
                            {[
                              {
                                value: "urgent",
                                label: "Urgent",
                                color: "#EF4444",
                              },
                              {
                                value: "high",
                                label: "High",
                                color: "#F59E0B",
                              },
                              {
                                value: "medium",
                                label: "Medium",
                                color: "#3B82F6",
                              },
                              { value: "low", label: "Low", color: "#9CA3AF" },
                            ].map((cfg) => (
                              <DropdownMenuItem
                                key={cfg.value}
                                onClick={() => {
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
                                          .substring(2, 9),
                                        field: "priority",
                                        condition: "is",
                                        value: cfg.value,
                                      },
                                    ];
                                  });
                                }}
                                className="flex items-center gap-2 cursor-pointer text-xs"
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
                          <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-primary text-xs">
                              Due Date
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              onSelect={(date) => {
                                if (date) {
                                  setFilterConfig((prev) => {
                                    const existing = prev.find(
                                      (f) => f.field === "endDate",
                                    );
                                    if (existing)
                                      return prev.map((f) =>
                                        f.field === "endDate"
                                          ? { ...f, value: date.toISOString() }
                                          : f,
                                      );
                                    return [
                                      ...prev,
                                      {
                                        id: Math.random()
                                          .toString(36)
                                          .substring(2, 9),
                                        field: "endDate",
                                        condition: "date-equals",
                                        value: date.toISOString(),
                                      },
                                    ];
                                  });
                                }
                              }}
                              initialFocus
                            />
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </div>

                      {filterConfig.length > 0 && (
                        <>
                          <Separator className="my-1" />
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
                      >
                        <Monitor className="h-4 w-4" />
                        Display
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 px-4 py-2 border-b-[5px] border-b-primary">
                      {/* Closed Projects */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="closed-projects"
                          className="text-xs cursor-pointer text-primary"
                        >
                          Closed Projects
                        </Label>
                        <Switch
                          id="closed-projects"
                          checked={displayOptions.closedProjects}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              closedProjects: !!checked,
                            }))
                          }
                        />
                      </div>

                      {/* Hide Empty Groups */}
                      <div className="flex items-center justify-between py-2">
                        <Label
                          htmlFor="hide-empty-groups"
                          className="text-xs cursor-pointer text-primary"
                        >
                          Hide Empty Groups
                        </Label>
                        <Switch
                          id="hide-empty-groups"
                          checked={displayOptions.hideEmptyGroups}
                          onCheckedChange={(checked) =>
                            setDisplayOptions((prev) => ({
                              ...prev,
                              hideEmptyGroups: !!checked,
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

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleNavigate("today")}
              className="h-8 px-2 rounded text-xs font-medium"
            >
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => handleNavigate("prev")}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-xs font-semibold hover:bg-muted flex items-center gap-1"
                  >
                    {getDateLabel()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-2 border-0 border-b-[5px] border-primary"
                  align="center"
                >
                  <CalendarPicker
                    selectedDate={currentDate}
                    onDateSelect={setCurrentDate}
                    range={range as any}
                    currentLabel={getDateLabel()}
                  />
                </PopoverContent>
              </Popover>
              <Button
                onClick={() => handleNavigate("next")}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-8 flex items-center gap-1 bg-muted rounded p-1 ml-4">
              {(
                ["monthly", "quarterly", "half-yearly", "yearly"] as Range[]
              ).map((r) => {
                const labels: Record<string, string> = {
                  // daily: 'Day',
                  // weekly: 'Week',
                  monthly: "Month",
                  quarterly: "Quarter",
                  "half-yearly": "Half Year",
                  yearly: "Year",
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
                  >
                    {labels[r]}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 h-full flex border rounded-lg mx-4 my-2 overflow-hidden shadow-sm">
          {/* Sidebar */}
          <div
            className="h-full flex-shrink-0 border-r bg-background relative"
            style={{ width: sidebarWidth }}
          >
            <div className="h-full">
              <PortfolioGanttTable
                ref={listRef}
                projects={portfolioProjects}
                portfolioId={portfolioId}
                onScroll={handleListScroll}
                onAddProject={() => setOpenLinkProjectDialog(true)}
              />
            </div>
            {/* Resizer */}
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-10 transition-colors",
                isResizing ? "bg-blue-500" : "hover:bg-blue-500/30",
              )}
            />
          </div>

          {/* Timeline */}
          <div className="flex-1 min-h-0 relative">
            <GanttProvider
              range={range}
              startDate={currentDate}
              zoom={zoom}
              headerHeight={36}
              rowHeight={36}
              className="h-full w-full overflow-hidden"
              weekendDays={weekendDays}
              containerRef={timelineRef}
            >
              <div className="absolute inset-0 flex flex-col">
                <GanttTimeline
                  ref={timelineRef}
                  className="flex-1 overflow-auto scroll-container"
                  onScroll={handleTimelineScroll}
                >
                  <GanttHeader />
                  <GanttFeatureList className="space-y-0">
                    {portfolioProjects.map((project) => {
                      const feature = ganttFeatures.find(
                        (f) => f.id === project.id,
                      );
                      return feature ? (
                        <GanttFeatureItem
                          key={feature.id}
                          {...feature}
                          onMove={handleMoveFeature}
                          hideLabels={false}
                          disabled={true}
                        />
                      ) : (
                        <div
                          key={project.id}
                          style={{ height: 36 }}
                          className="border-b border-gray-100/50"
                        />
                      );
                    })}
                    <div
                      style={{ height: 36 }}
                      className="border-b border-gray-100/50 w-full"
                    />
                  </GanttFeatureList>
                  <GanttToday />
                </GanttTimeline>
              </div>
            </GanttProvider>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 z-20 flex overflow-hidden rounded-md border bg-card shadow-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                disabled={zoom >= 200}
                className="h-9 w-9"
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
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <LinkPortfolioProjectDialog
          open={openLinkProjectDialog}
          onClose={() => setOpenLinkProjectDialog(false)}
          portfolioId={portfolioId}
          existingProjectIds={portfolio?.projects || []}
        />
      </div>
    </DndProvider>
  );
}
