// components/portfolios/views/kanban-view/KanbanView.tsx
"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  KanbanCard,
  type DragEndEvent,
} from "@/components/ui/shadcn-io/kanban";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore, getProfilePictureUrl } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useKanbanSettingsStore } from "@/stores/kanban-settings-store";
import { PortfolioKanbanCard } from "./KanbanCard";
import LinkPortfolioProjectDialog from "../PortfolioOverview/LinkPortfolioProjectDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  Layers,
  SlidersVertical,
  EyeOff,
  ChevronDown,
  Check,
  Eye,
  X,
  Plus,
  Link as LinkIcon,
  ChevronUp,
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
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PortfolioViewersSection from "../../PortfolioViewersSection";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

interface KanbanViewProps {
  portfolioId: string;
}

type KanbanColumn = {
  id: string;
  name: string;
  color: string;
  value: string;
};

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

export function KanbanView({ portfolioId }: KanbanViewProps) {
  const router = useRouter();
  const portfolios = usePortfoliosStore((state) => state.portfolios);
  const projects = useProjectsStore((state) => state.projects);
  const { currentWorkspace, projectPhases, addProjectPhase, workspaceMembers } = useWorkspaceStore();

  const portfolio = portfolios.find((p) => p.id === portfolioId);
  const portfolioProjectIds = portfolio?.projects || [];

  const portfolioProjects = useMemo(() => {
    return projects.filter((p) => portfolioProjectIds.includes(p.id!));
  }, [projects, portfolioProjectIds]);

  const portfolioLeaders = useMemo(() => {
    const leaderIds = new Set<string>();
    portfolioProjects.forEach((p) => {
      if (p.leaders) {
        p.leaders.forEach((id) => leaderIds.add(id));
      }
      if (p.projectLeader) {
        leaderIds.add(p.projectLeader);
      }
    });
    return workspaceMembers.filter((m) => leaderIds.has(m.userId));
  }, [portfolioProjects, workspaceMembers]);

  const portfolioMembers = useMemo(() => {
    const memberIds = new Set<string>();
    portfolioProjects.forEach((p) => {
      if (p.members) {
        p.members.forEach((m) => memberIds.add(m.userId));
      }
    });
    return workspaceMembers.filter((m) => memberIds.has(m.userId));
  }, [portfolioProjects, workspaceMembers]);
  const {
    updateProjectPhase,
    updateProjectStatus,
    addProject,
  } = useProjectsStore();

  const { getSettings, hideColumn, showColumn } = useKanbanSettingsStore();
  const settings = getSettings(portfolioId);

  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"phase" | "status">("phase");
  const [openLinkProjectDialog, setOpenLinkProjectDialog] = useState(false);

  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [addingProjectInColumn, setAddingProjectInColumn] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");

  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);
  const [editedColumnName, setEditedColumnName] = useState("");

  // Sort, Filter, and Display states
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterConfig, setFilterConfig] = useState<FilterCriteria[]>([]);
  const [displayOptions, setDisplayOptions] = useState({
    closedProjects: true,
    hideEmptyGroups: false,
  });

  const [sortFields, setSortFields] = useState<SortField[]>(() => [
    { id: 'id', fieldName: 'ID', fieldType: 'number', isSelected: false, direction: null, order: 0 },
    { id: 'name', fieldName: 'Project Name', fieldType: 'text', isSelected: false, direction: null, order: 0 },
    { id: 'phase', fieldName: 'Phase', fieldType: 'select-one', isSelected: false, direction: null, order: 0 },
    { id: 'update', fieldName: 'Update', fieldType: 'select-one', isSelected: false, direction: null, order: 0 },
    { id: 'leader', fieldName: 'Leader', fieldType: 'user', isSelected: false, direction: null, order: 0 },
    { id: 'members', fieldName: 'Members', fieldType: 'users', isSelected: false, direction: null, order: 0 },
    { id: 'viewers', fieldName: 'Viewers', fieldType: 'users', isSelected: false, direction: null, order: 0 },
    { id: 'priority', fieldName: 'Priority', fieldType: 'select-one', isSelected: false, direction: null, order: 0 },
    { id: 'startDate', fieldName: 'Start Date', fieldType: 'date', isSelected: false, direction: null, order: 0 },
    { id: 'endDate', fieldName: 'Due Date', fieldType: 'date', isSelected: false, direction: null, order: 0 },
    { id: 'progress', fieldName: 'Progress', fieldType: 'number', isSelected: false, direction: null, order: 0 },
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
        <span className="text-xs font-medium text-primary truncate max-w-[80px]">{field.fieldName}</span>
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

  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase();
  };

  const getMemberNames = (userIds: string | string[]) => {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return '';
    const firstUser = workspaceMembers.find(m => m.userId === ids[0]);
    return firstUser?.name || '';
  };

  const getFieldValueForFilter = (project: any, fieldId: string): any => {
    if (fieldId === 'id') return project.slug || '';
    if (fieldId === 'name') return project.name || '';
    if (fieldId === 'phase') return project.phase || '';
    if (fieldId === 'update') return project.statusHistory?.[0]?.status || project.currentProjectUpdate || '';
    if (fieldId === 'leader') {
      return project.leaders?.length ? project.leaders : (project.projectLeader ? [project.projectLeader] : []);
    }
    if (fieldId === 'members') {
      return (project.members || []).map((m: any) => m.userId);
    }
    if (fieldId === 'viewers') {
      return project.viewers || [];
    }
    if (fieldId === 'priority') return project.priority || '';
    if (fieldId === 'startDate') return project.startDate || '';
    if (fieldId === 'endDate') return project.endDate || '';
    if (fieldId === 'progress') return project.progress || 0;
    return null;
  };

  const matchesFilterCriteria = (project: any, criteria: FilterCriteria): boolean => {
    const fieldValue = getFieldValueForFilter(project, criteria.field);
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
        if (criteria.field === 'leader' || criteria.field === 'members' || criteria.field === 'viewers') {
          const ids = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
          return ids.some(val => String(val).toLowerCase() === String(filterValue || '').toLowerCase());
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

  const sortProjects = (projectsList: any[]) => {
    const activeSorts = getActiveSortConfig();
    if (activeSorts.length === 0) return projectsList;

    return [...projectsList].sort((a, b) => {
      for (const sort of activeSorts) {
        const valA = getFieldValueForFilter(a, sort.fieldId);
        const valB = getFieldValueForFilter(b, sort.fieldId);

        if (valA === valB) continue;
        if (valA === null || valA === undefined || valA === '') return 1;
        if (valB === null || valB === undefined || valB === '') return -1;

        let comparison = 0;
        if (sort.fieldType === 'number') {
          comparison = Number(valA) - Number(valB);
        } else if (sort.fieldType === 'date') {
          comparison = new Date(valA).getTime() - new Date(valB).getTime();
        } else if (sort.fieldType === 'user' || sort.fieldType === 'users') {
          const nameA = getMemberNames(valA);
          const nameB = getMemberNames(valB);
          comparison = nameA.localeCompare(nameB);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  };

  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) => portfolioProjectIds.includes(p.id!));

    // Apply search query
    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply closed projects display option
    if (!displayOptions.closedProjects) {
      result = result.filter((p) => {
        const displayUpdate = (p.statusHistory?.[0]?.status || p.currentProjectUpdate || "").toLowerCase();
        return displayUpdate !== 'completed';
      });
    }

    // Apply active filters
    if (filterConfig.length > 0) {
      result = result.filter((p) =>
        filterConfig.every((criteria) => matchesFilterCriteria(p, criteria))
      );
    }

    // Apply sorting
    return sortProjects(result);
  }, [projects, portfolioProjectIds, searchQuery, filterConfig, displayOptions.closedProjects, sortFields]);


  const columns: KanbanColumn[] = useMemo(() => {
    let rawCols: KanbanColumn[] = [];
    if (groupBy === "status") {
      rawCols = [
        { id: "active", name: "Active", value: "active", color: "#10B981" },
        { id: "archived", name: "Archived", value: "archived", color: "#6B7280" },
      ];
    } else {
      const phases = projectPhases.flatMap((p) => [p, ...(p.children || [])]);
      rawCols = phases.map((phase) => ({
        id: phase.value,
        name: phase.label,
        value: phase.value,
        color: phase.color || "#3B82F6",
      }));
    }

    // Add "No value" column if there are unassigned projects
    const hasUnassigned = filteredProjects.some(p => {
      if (groupBy === "status") return !p.status;
      return !p.phase;
    });

    if (hasUnassigned) {
      rawCols.push({ id: "unassigned", name: "No value", value: "unassigned", color: "#9CA3AF" });
    }

    return rawCols.filter(c => !settings.hiddenColumns.includes(c.id));
  }, [groupBy, projectPhases, settings.hiddenColumns, filteredProjects]);

  const kanbanData = useMemo(() => {
    return filteredProjects.map((p) => {
      let columnId = "unassigned";
      if (groupBy === "status") {
        columnId = p.status?.toLowerCase() || "unassigned";
      } else {
        columnId = p.phase || "unassigned";
      }
      return {
        id: p.id!,
        name: p.name,
        column: columnId,
        project: p,
      };
    });
  }, [filteredProjects, groupBy]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const projectId = active.id as string;
    const newColumnId = over.id as string;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    if (groupBy === "status") {
      await updateProjectStatus(projectId, newColumnId as any);
    } else {
      await updateProjectPhase(projectId, newColumnId);
    }
  };

  const handleAddProject = (columnId: string) => {
    router.push(`/portfolio/${portfolioId}/create-project`);
  };

  const handleStartEditColumnName = (columnId: string) => {
    const col = columns.find(c => c.id === columnId);
    if (col) {
      setEditingColumnName(columnId);
      setEditedColumnName(col.name);
    }
  };

  const handleStartCreateGroup = () => {
    setIsCreatingNewGroup(true);
    setNewGroupName("");
  };

  const handleSaveNewGroup = async () => {
    if (newGroupName.trim() && currentWorkspace?.id) {
      const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)].value;
      await addProjectPhase(currentWorkspace.id, {
        label: newGroupName.trim(),
        color: randomColor,
      });
      setIsCreatingNewGroup(false);
      setNewGroupName("");
    }
  };

  const handleCancelCreateGroup = () => {
    setIsCreatingNewGroup(false);
    setNewGroupName("");
  };

  const AddGroupCard = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void; }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);
    return (
      <div className="w-80 bg-card rounded-lg border-2 border-dashed border-input p-4">
        <div className="mb-3">
          <label className="text-xs font-medium text-foreground mb-2 block">Group Name</label>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              else if (e.key === 'Escape') onCancel();
            }}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} className="flex-1"><Check className="w-4 h-4 mr-2" />Create</Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="flex-1"><X className="w-4 h-4 mr-2" />Cancel</Button>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-1">
            <div className="relative flex">
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-2 pr-8 rounded text-xs w-[240px]"
              />
              <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="gap-2 rounded cursor-pointer text-xs">
                  <Layers className="h-4 w-4" />
                  Group by: <span className="capitalize">{groupBy}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 border-b-5 border-b-primary p-1">
                <DropdownMenuItem onClick={() => setGroupBy("phase")} className="cursor-pointer text-sm">Phase</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("status")} className="cursor-pointer text-sm">Status</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                <DropdownMenu open={activeDropdown === 'sort'} onOpenChange={(open) => setActiveDropdown(open ? 'sort' : null)}>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort
                      {hasSelectedSortFields && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                          {sortFields.filter(f => f.isSelected).length}
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
                      <h3 className="text-sm font-semibold text-primary">Sort fields by</h3>
                    </div>
                    <div className={`grid ${hasSelectedSortFields ? "grid-cols-2" : "grid-cols-1"} divide-x`}>
                      {/* Column 1: Available fields */}
                      <div className="px-2 py-1">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Project fields</h4>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {sortFields.map((field) => (
                            <div
                              key={field.id}
                              onClick={() => handleFieldSelection(field.id)}
                              className="grid grid-cols-[20px_1fr] items-center px-2 py-1 hover:bg-muted rounded cursor-pointer"
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
                                  field.isSelected ? "bg-primary border-primary" : "border-input"
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
                              <span className="text-xs font-medium text-primary">{field.fieldName}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: My Sort */}
                      {hasSelectedSortFields && (
                        <div className="px-2 py-1">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">My Sort</h4>
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
                <DropdownMenu open={activeDropdown === 'filter'} onOpenChange={(open) => setActiveDropdown(open ? 'filter' : null)}>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                      <Funnel className="h-4 w-4" />
                      Filter
                      {filterConfig.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                          {filterConfig.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="px-2 py-2 border-b-[5px] border-b-primary w-50">
                    <div className="space-y-1 mb-1">
                      {/* Leader Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                          <span className="text-primary text-xs">Leader</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64 max-h-64 overflow-y-auto p-1">
                          {portfolioLeaders.map(member => (
                            <DropdownMenuItem
                              key={member.userId}
                              onClick={() => {
                                  setFilterConfig(prev => {
                                    const existing = prev.find(f => f.field === 'leader');
                                    if (existing) return prev.map(f => f.field === 'leader' ? { ...f, value: member.userId } : f);
                                    return [...prev, { id: Math.random().toString(36).substring(2, 9), field: 'leader', condition: 'contains', value: member.userId }];
                                  });
                              }}
                              className="flex items-center gap-2 p-2 cursor-pointer text-xs"
                            >
                              {member.profilePicture ? (
                                <img
                                  src={getProfilePictureUrl(member.profilePicture) || '/images/default-avatar.png'}
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
                          {portfolioMembers.map(member => (
                            <DropdownMenuItem
                              key={member.userId}
                              onClick={() => {
                                  setFilterConfig(prev => {
                                    const existing = prev.find(f => f.field === 'members');
                                    if (existing) return prev.map(f => f.field === 'members' ? { ...f, value: member.userId } : f);
                                    return [...prev, { id: Math.random().toString(36).substring(2, 9), field: 'members', condition: 'contains', value: member.userId }];
                                  });
                              }}
                              className="flex items-center gap-2 p-2 cursor-pointer text-xs"
                            >
                              {member.profilePicture ? (
                                <img
                                  src={getProfilePictureUrl(member.profilePicture) || '/images/default-avatar.png'}
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
                        <DropdownMenuSubTrigger
                          disabled={groupBy === 'phase'}
                          className={cn("flex items-center justify-between text-xs cursor-pointer", groupBy === 'phase' && "opacity-50 cursor-not-allowed")}
                        >
                          <span className="text-primary text-xs">Phase</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48 p-2">
                          {projectPhases.flatMap(p => [p, ...(p.children || [])]).map(phase => (
                            <DropdownMenuItem
                              key={phase.value}
                              onClick={() => {
                                  setFilterConfig(prev => {
                                    const existing = prev.find(f => f.field === 'phase');
                                    if (existing) return prev.map(f => f.field === 'phase' ? { ...f, value: phase.value } : f);
                                    return [...prev, { id: Math.random().toString(36).substring(2, 9), field: 'phase', condition: 'is', value: phase.value }];
                                  });
                              }}
                              className="flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: phase.color || '#3B82F6' }} />
                              <span className="text-xs font-medium">{phase.label}</span>
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
                            { value: 'active', label: 'Active', color: '#10B981' },
                            { value: 'planning', label: 'Planning', color: '#3B82F6' },
                            { value: 'on-hold', label: 'On Hold', color: '#F59E0B' },
                            { value: 'completed', label: 'Completed', color: '#6B7280' }
                          ].map(cfg => (
                            <DropdownMenuItem
                              key={cfg.value}
                              onClick={() => {
                                  setFilterConfig(prev => {
                                    const existing = prev.find(f => f.field === 'update');
                                    if (existing) return prev.map(f => f.field === 'update' ? { ...f, value: cfg.value } : f);
                                    return [...prev, { id: Math.random().toString(36).substring(2, 9), field: 'update', condition: 'is', value: cfg.value }];
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

                      {/* Priority Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                          <span className="text-primary text-xs">Priority</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48 p-2">
                          {[
                            { value: 'urgent', label: 'Urgent', color: '#EF4444' },
                            { value: 'high', label: 'High', color: '#F59E0B' },
                            { value: 'medium', label: 'Medium', color: '#3B82F6' },
                            { value: 'low', label: 'Low', color: '#9CA3AF' }
                          ].map(cfg => (
                            <DropdownMenuItem
                              key={cfg.value}
                              onClick={() => {
                                  setFilterConfig(prev => {
                                    const existing = prev.find(f => f.field === 'priority');
                                    if (existing) return prev.map(f => f.field === 'priority' ? { ...f, value: cfg.value } : f);
                                    return [...prev, { id: Math.random().toString(36).substring(2, 9), field: 'priority', condition: 'is', value: cfg.value }];
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
                        <DropdownMenuSubTrigger className="flex items-center justify-between text-xs cursor-pointer">
                          <span className="text-primary text-xs">Due Date</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            onSelect={(date) => {
                              if (date) {
                                  setFilterConfig(prev => {
                                    const existing = prev.find(f => f.field === 'endDate');
                                    if (existing) return prev.map(f => f.field === 'endDate' ? { ...f, value: date.toISOString() } : f);
                                    return [...prev, { id: Math.random().toString(36).substring(2, 9), field: 'endDate', condition: 'date-equals', value: date.toISOString() }];
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
                <DropdownMenu open={activeDropdown === 'display'} onOpenChange={(open) => setActiveDropdown(open ? 'display' : null)}>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                      <Monitor className="h-4 w-4" />
                      Display
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 px-4 py-2 border-b-[5px] border-b-primary">
                    {/* Closed Projects */}
                    <div className="flex items-center justify-between py-2">
                      <Label htmlFor="closed-projects" className="text-xs cursor-pointer text-primary">
                        Closed Projects
                      </Label>
                      <Switch
                        id="closed-projects"
                        checked={displayOptions.closedProjects}
                        onCheckedChange={(checked) =>
                          setDisplayOptions(prev => ({ ...prev, closedProjects: !!checked }))
                        }
                      />
                    </div>

                    {/* Hide Empty Groups */}
                    <div className="flex items-center justify-between py-2">
                      <Label htmlFor="hide-empty-groups" className="text-xs cursor-pointer text-primary">
                        Hide Empty Groups
                      </Label>
                      <Switch
                        id="hide-empty-groups"
                        checked={displayOptions.hideEmptyGroups}
                        onCheckedChange={(checked) =>
                          setDisplayOptions(prev => ({ ...prev, hideEmptyGroups: !!checked }))
                        }
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2 rounded text-xs">
                  <EyeOff className="h-4 w-4" />
                  {settings.hiddenColumns.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#F68C1F] text-white rounded-full">
                      {settings.hiddenColumns.length}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3 border-b-5 border-b-primary">
                <h3 className="text-sm font-semibold mb-3">Unhide Group</h3>
                {settings.hiddenColumns.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No hidden groups</p>
                ) : (
                  <div className="space-y-1">
                    {settings.hiddenColumns.map(colId => (
                      <button
                        key={colId}
                        onClick={() => showColumn(portfolioId, colId)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-muted text-sm transition-colors capitalize"
                      >
                        <span>{colId.replace(/-/g, ' ')}</span>
                        <Check className="h-4 w-4 text-blue-600" />
                      </button>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="flex gap-4 items-stretch w-max min-h-full">
            <KanbanProvider
              columns={columns}
              data={kanbanData}
              onDragEnd={handleDragEnd}
            >
              {(column) => (
                <KanbanBoard key={column.id} id={column.id} className="w-80 h-full flex flex-col shrink-0 bg-muted border-none shadow-none ring-0 divide-y-0 overflow-visible rounded-t-lg" style={{ borderTop: `4px solid ${column.color}` }}>
                  <KanbanHeader className="border-none py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {editingColumnName === column.id ? (
                          <Input
                            value={editedColumnName}
                            onChange={(e) => setEditedColumnName(e.target.value)}
                            onBlur={() => setEditingColumnName(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingColumnName(null)}
                            className="h-8 w-40 text-xs font-semibold uppercase"
                            autoFocus
                          />
                        ) : (
                          <>
                             <h3 className="font-semibold text-xs text-foreground uppercase tracking-wide truncate cursor-pointer hover:underline" onClick={() => handleStartEditColumnName(column.id)}>{column.name}</h3>
                             <Badge variant="secondary" className="px-1.5 py-0 h-5 text-xs bg-muted text-muted-foreground border-none font-bold">
                               {kanbanData.filter(item => item.column === column.id).length}
                             </Badge>
                            </>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => hideColumn(portfolioId, column.id)}><Eye className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </KanbanHeader>

                  <KanbanCards id={column.id} className="gap-2">
                    {(item) => (
                      <KanbanCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        column={item.column}
                        onCardClick={() => router.push(`/project/${item.id}`)}
                        className="px-2 py-0 border-none bg-transparent shadow-none ring-0 h-auto"
                      >
                        <PortfolioKanbanCard project={item.project as any} groupColor={column.color} />
                      </KanbanCard>
                    )}
                  </KanbanCards>

                  <div className="px-4 pb-4">
                    <div
                      className="flex items-center justify-between border border-input text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md w-full h-8 overflow-hidden bg-card"
                      style={{ borderLeft: `4px solid ${column.color}80` }}
                    >
                      <button
                        className="flex-1 flex items-center justify-start gap-2 h-full px-3 text-left focus:outline-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer"
                        onClick={() => handleAddProject(column.id)}
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>Add Project</span>
                      </button>
                      <div className="h-4 w-px bg-border shrink-0" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="h-full px-2 flex items-center justify-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] focus:outline-none shrink-0 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          side="top"
                          className="bg-card border border-border border-b-[5px] border-b-primary rounded-md shadow-lg min-w-[170px] p-0"
                        >
                          <DropdownMenuItem
                            onClick={() => router.push(`/portfolio/${portfolioId}/create-project`)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground cursor-pointer rounded-none focus:bg-muted"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add new project</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setOpenLinkProjectDialog(true)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground cursor-pointer rounded-none border-t border-border focus:bg-muted"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span>Add existing project</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </KanbanBoard>
              )}
            </KanbanProvider>
          </div>
        </div>

        <LinkPortfolioProjectDialog
          open={openLinkProjectDialog}
          onClose={() => setOpenLinkProjectDialog(false)}
          portfolioId={portfolioId}
          existingProjectIds={portfolioProjectIds}
        />
      </div>
    </DndProvider>
  );
}
