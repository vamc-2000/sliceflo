// components/list-view/TaskGroup.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Palette,
  Copy,
  Trash2,
  Plus,
  EyeOff,
  CheckCheck,
  FolderInput,
  Upload,
  Archive,
  Check,
  X,
  ChevronRight,
  LogOut,
  CheckCheckIcon,
  Eye,
  FolderUp,
} from "lucide-react";
import { TaskTable } from "./TaskTable";
import { useTasksStore } from "@/stores/tasks-store";
import { Task, ColumnConfig } from '@/types/task.types';
import { FilterBlock } from "@/components/projects/views/list-view/filters/AdvancedFiltersNew";
import { useProjectsStore } from "@/stores/projects-store";
import ConfirmationModal from "@/components/ConfirmationModal";

interface SortConfig {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  direction: "asc" | "desc";
  order: number;
}

interface TaskGroupProps {
  group: {
    id: string;
    name: string;
    projectId: string;
    order: number;
    color?: string;
    icon?: string;
    isUntitled?: boolean;
    optionId?: string;
    memberId?: string;
    fieldId?: string;
  };
  projectId: string;
  hideFields?: string[];
  groupBy?: string;
  sortConfig?: SortConfig[];
  filterBlock?: FilterBlock | null;
  columnConfigs?: ColumnConfig[];
  displayOptions?: {
    collapsedSubtasks: boolean;
    closedTasks: boolean;
    wrapText: boolean;
    subtaskParentId: boolean;
  };
  isCollapsed?: boolean;
  activeSortConfig?: SortConfig[];
  onSortChange?: (fieldId: string, fieldType: string) => void;
  onToggleCollapse?: () => void;
  onAddNewGroup?: () => void;
  onDeleteGroup?: (groupId: string, groupName: string) => void;
  onHideGroup?: (groupId: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  clearSelection?: boolean;
}

export function TaskGroup({
  group,
  projectId,
  hideFields = [],
  groupBy = 'status',
  sortConfig = [],
  filterBlock = null,
  columnConfigs = [],
  displayOptions = {
    collapsedSubtasks: false,
    closedTasks: false,
    wrapText: false,
    subtaskParentId: false,
  },
  isCollapsed = false,
  activeSortConfig = [],
  onSortChange,
  onToggleCollapse,
  onAddNewGroup,
  onDeleteGroup,
  onHideGroup,
  onSelectionChange,
  clearSelection,
}: TaskGroupProps) {
  const {
    tasks
  } = useTasksStore();

  const {
    getTaskTypesByProject,
    getTaskStatusConfigs,
    addTaskStatusConfig,
    updateTaskStatusConfig,
    deleteTaskStatusConfig,
    getTaskCustomFields,
    updateTaskCustomFieldOptions,
    deleteTaskCustomFieldOption,
    getTaskPriorityConfigs,
    addTaskPriorityConfig,
    updateTaskPriorityConfig,
    deleteTaskPriorityConfig,
  } = useProjectsStore();
  const customFields = getTaskCustomFields(projectId);
  const taskTypes = getTaskTypesByProject(projectId);
  const taskStatusConfigs = getTaskStatusConfigs(projectId);
  const taskPriorityConfigs = getTaskPriorityConfigs(projectId);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Color palette
  const COLOR_PALETTE = [
    '#FF3B30', '#FF9500', '#34C759', '#FFCC00', '#00C7BE', '#007AFF',
    '#5856D6', '#AF52DE', '#FF2D55', '#001F3F', '#A2845E',
  ];

  const getGroupByLabel = () => {
    if (groupBy === 'status') return 'Status';
    if (groupBy === 'priority') return 'Priority';
    if (groupBy === 'assginee') return 'Assginee';
    if (groupBy === 'dueDate') return 'Date';
    if (groupBy === 'taskType') return 'Type';
    if (groupBy?.startsWith('custom-')) {
      const fieldId = groupBy.replace('custom-', '');
      const field = customFields?.find((f) => f.id === fieldId);
      return field?.name || 'Field';
    }
    return 'Group';
  };

  const canAddGroup = () => {
    return groupBy === 'status' || groupBy === 'priority' || groupBy?.startsWith('custom-');
  };

  const handleColorSelect = async (color: string) => {
    setMenuOpen(false);   // ← closes the whole dropdown immediately
    if (groupBy === 'status') {
      await updateTaskStatusConfig(projectId, group.id, { color });
    } else if (groupBy === 'priority' && group.optionId) {
      await updateTaskPriorityConfig(projectId, group.optionId, { color });
    }
  };

  const handleDuplicateGroup = async () => {
    const duplicatedName = `${group.name} Copy`;

    if (groupBy === 'status') {
      const original = taskStatusConfigs.find((c) => c._id === group.id);
      if (original) {
        await addTaskStatusConfig(projectId, {
          label: duplicatedName,
          color: original.color,
          value: duplicatedName.toLowerCase().replace(/\s+/g, '_'),
        });
      }
    } else if (groupBy === 'priority' && group.optionId) {
      const originalOption = taskPriorityConfigs.find((opt) => opt._id === group.optionId);
      if (originalOption) {
        const value = duplicatedName.toLowerCase().replace(/\s+/g, '_');
        await addTaskPriorityConfig(projectId, {
          label: duplicatedName,
          value,
          description: '',
          color: originalOption.color,
          order: taskPriorityConfigs.length + 1,
        });
      }
    } else if (groupBy === 'taskType') {
      // ✅ ADD THIS - Duplicate task type
      const taskType = taskTypes.find(t => t.label === group.name);
      if (taskType) {
        const { addTaskTypeToProject } = useProjectsStore.getState();
        const value = duplicatedName.toLowerCase().replace(/\s+/g, '-');
        addTaskTypeToProject(projectId, {
          value,
          label: duplicatedName,
          description: taskType.description,
          color: taskType.color,
          order: taskTypes.length + 1,
        });
      }
    } else if (groupBy?.startsWith('custom-') && group.fieldId) {
      const field = customFields.find((f) => f.id === group.fieldId);
      if (field && !field.options.includes(duplicatedName)) {
        const updatedOptions = [...field.options, duplicatedName];
        updateTaskCustomFieldOptions(projectId, group.fieldId, updatedOptions);  // ← new
      }
    }
  };

  const handleExportCSV = () => {
    if (sortedAndFilteredTasks.length === 0) return;

    const headers = ["Task Name", "Status", "Priority", "Assignee", "Start Date", "Due Date",
      ...customFields.map((f) => f.name),
    ];

    const rows = sortedAndFilteredTasks.map((task) => [
      task.name,
      task.status ?? "",
      task.priority ?? "",
      task.assignee ?? "",
      task.startDate ?? "",
      task.endDate ?? "",
      ...customFields.map((f) => task.customFieldValues?.[f.id] ?? ""),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${group.name}-tasks-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportExcel = () => {
    if (sortedAndFilteredTasks.length === 0) return;

    const headers = ["Task Name", "Status", "Priority", "Assignee", "Start Date", "Due Date",
      ...customFields.map((f) => f.name),
    ];

    const rows = sortedAndFilteredTasks.map((task) => [
      task.name,
      task.status ?? "",
      task.priority ?? "",
      task.assignee ?? "",
      task.startDate ?? "",
      task.endDate ?? "",
      ...customFields.map((f) => task.customFieldValues?.[f.id] ?? ""),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => String(cell).replace(/"/g, '""')).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${group.name}-tasks-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    if (sortedAndFilteredTasks.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = sortedAndFilteredTasks
      .map(
        (task) => `
      <tr>
        <td>${task.name}</td>
        <td>${task.status ?? "-"}</td>
        <td>${task.priority ?? "-"}</td>
        <td>${task.assignee ?? "-"}</td>
        <td>${task.startDate ?? "-"}</td>
        <td>${task.endDate ?? "-"}</td>
        ${customFields.map((f) => `<td>${task.customFieldValues?.[f.id] ?? "-"}</td>`).join("")}
      </tr>`
      )
      .join("");

    printWindow.document.write(`
    <!DOCTYPE html><html><head>
    <title>${group.name} Tasks</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h2 { color: var(--primary); }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { background: var(--primary); color: var(--primary-foreground); padding: 8px; text-align: left; }
      td { border: 1px solid #ddd; padding: 8px; }
      tr:nth-child(even) { background: #f2f2f2; }
    </style>
    </head><body>
    <h2>${group.name} — Tasks</h2>
    <p>Exported on ${new Date().toLocaleString()}</p>
    <table>
      <thead><tr>
        <th>Task Name</th><th>Status</th><th>Priority</th>
        <th>Assignee</th><th>Start Date</th><th>Due Date</th>
        ${customFields.map((f) => `<th>${f.name}</th>`).join("")}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>
  `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };


  const canDeleteGroup = () => {
    if (group.isUntitled) return false;
    if (groupBy?.startsWith('custom-') && group.name === 'No Value') return false;
    if (groupBy === 'dueDate') return false;
    if (groupBy === 'assignee') return false;
    // ✅ System task types cannot be deleted, but custom ones can
    if (groupBy === 'taskType') {
      const taskType = taskTypes.find(t => t.label === group.name);
      return taskType ? !taskType._id.startsWith('system-') : false;
    }
    return true;
  };

  // AFTER — opener just opens the modal, executor does the work
  const handleDeleteGroup = () => {
    if (!canDeleteGroup()) return;
    setMenuOpen(false);          // close dropdown first
    setDeleteConfirmOpen(true);  // then open confirmation modal
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (groupBy === 'status') {
        await deleteTaskStatusConfig(projectId, group.id);
      } else if (groupBy === 'priority' && group.optionId) {
        await deleteTaskPriorityConfig(projectId, group.optionId);
      } else if (groupBy === 'taskType') {
        const taskType = taskTypes.find(t => t.label === group.name);
        if (taskType && !taskType._id.startsWith('system-')) {
          const { deleteTaskTypeFromProject } = useProjectsStore.getState();
          deleteTaskTypeFromProject(projectId, taskType._id);
        }
      } else if (groupBy?.startsWith('custom-') && group.fieldId) {
        deleteTaskCustomFieldOption(projectId, group.fieldId, group.name);
      }
      if (onDeleteGroup) {
        onDeleteGroup(group.id, group.name);
      }
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTaskType = async (name: string) => {
    if (!name.trim()) return;

    try {
      const { addTaskTypeToProject } = useProjectsStore.getState();
      const value = name.toLowerCase().replace(/\s+/g, '-');
      const order = taskTypes.length + 1;

      await addTaskTypeToProject(projectId, {
        value,
        label: name.trim(),
        description: `Custom ${name.trim()} type`,
        color: '#6366f1', // Default color
        order,
      });
    } catch (error) {
      console.error('Failed to add task type:', error);
    }
  };

  // Filter tasks based on groupBy option
  const getFilteredTasks = () => {
    const allProjectTasks = tasks.filter((t) => t.projectId === projectId);

    if (groupBy === 'status') {
      if (group.isUntitled) return allProjectTasks;
      const config = taskStatusConfigs.find((c) => c._id === group.id);
      if (!config) return [];
      // task.status is stored as config.label (e.g. "Backlog") — match either way
      return allProjectTasks.filter(
        (t) => t.status === config.value
      );
    }

    if (groupBy === 'assignee') {
      if (group.id === 'unassigned') return allProjectTasks.filter((t) => !t.assignee);
      const memberName = group.name;
      return allProjectTasks.filter((t) => t.assignee === memberName);
    }

    if (groupBy === 'priority') {
      if (group.isUntitled) return allProjectTasks.filter((t) => !t.priority);
      const priorityId = group.id.replace('priority-', '');
      const priorityConfig = taskPriorityConfigs.find((opt) => opt._id === priorityId);
      if (!priorityConfig) return [];
      return allProjectTasks.filter((t) => t.priority === priorityConfig.value);
    }

    if (groupBy === 'dueDate') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (group.id === 'overdue') {
        return allProjectTasks.filter((t) => {
          if (!t.endDate) return false;
          const d = new Date(t.endDate);
          d.setHours(0, 0, 0, 0);
          return d < today;
        });
      }
      if (group.id === 'today') {
        return allProjectTasks.filter((t) => {
          if (!t.endDate) return false;
          const d = new Date(t.endDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
      }
      if (group.id === 'upcoming') {
        return allProjectTasks.filter((t) => {
          if (!t.endDate) return false;
          const d = new Date(t.endDate);
          d.setHours(0, 0, 0, 0);
          return d > today;
        });
      }
      if (group.id === 'no-date') {
        return allProjectTasks.filter((t) => !t.endDate);
      }
      return [];
    }

    if (groupBy?.startsWith('custom-')) {
      const fieldId = groupBy.replace('custom-', '');
      if (group.name === 'No Value') {
        return allProjectTasks.filter((t) => !t.customFieldValues?.[fieldId]);
      }
      return allProjectTasks.filter((t) => t.customFieldValues?.[fieldId] === group.name);
    }

    return allProjectTasks;
  };

  const sortTasks = (taskList: Task[]): Task[] => {
    if (!sortConfig || sortConfig.length === 0) return taskList;
    const activeSorts = [...sortConfig].sort((a, b) => a.order - b.order);
    return [...taskList].sort((a, b) => {
      for (const sort of activeSorts) {
        let aVal: any;
        let bVal: any;
        if (sort.fieldId === 'task' || sort.fieldId === 'name') { aVal = a.name; bVal = b.name; }
        else if (sort.fieldId === 'taskType') { aVal = a.taskType; bVal = b.taskType; }
        else if (sort.fieldId === 'status') { aVal = a.status; bVal = b.status; }
        else if (sort.fieldId === 'cycle') { aVal = a.cycleId; bVal = b.cycleId; }
        else if (sort.fieldId === 'priority') { aVal = a.priority; bVal = b.priority; }
        else if (sort.fieldId === 'startDate') { aVal = a.startDate; bVal = b.startDate; }
        else if (sort.fieldId === 'endDate') { aVal = a.endDate; bVal = b.endDate; }
        else if (sort.fieldId === 'assignee') { aVal = a.assignee; bVal = b.assignee; }
        else { aVal = a.customFieldValues?.[sort.fieldId]; bVal = b.customFieldValues?.[sort.fieldId]; }
        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';
        if (sort.fieldType === 'date') {
          const aDate = aVal ? new Date(aVal).getTime() : 0;
          const bDate = bVal ? new Date(bVal).getTime() : 0;
          if (aDate !== bDate) return sort.direction === 'asc' ? aDate - bDate : bDate - aDate;
        } else {
          const comparison = String(aVal).localeCompare(String(bVal));
          if (comparison !== 0) return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  };

  const applyFilters = (taskList: Task[]): Task[] => {
    if (!filterBlock || !filterBlock.children || filterBlock.children.length === 0) return taskList;

    const getFieldValue = (task: Task, fieldId: string) => {
      if (fieldId === 'dueDate') fieldId = 'endDate';
      if (fieldId === 'labels') {
        const labelIds = task.labelIds || [];
        const labels = task.labels || [];
        const idsFromLabels = (labels as any[]).map(l => (typeof l === 'string' ? l : l.id || l.name));
        return [...labelIds, ...idsFromLabels];
      }
      if (fieldId === 'cycle') return task.cycleId;
      return task.customFieldValues?.[fieldId] ?? (task as any)[fieldId];
    };

    const matchesCriteria = (task: Task, criteria: any) => {
      const fieldValue = getFieldValue(task, criteria.field);
      const filterValue = criteria.value;

      switch (criteria.condition) {
        case "is": return fieldValue === filterValue;
        case "is-not": return fieldValue !== filterValue;
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
          return new Date(fieldValue).toDateString() === new Date(filterValue).toDateString();
        }
        case "date-is-today": {
          if (!fieldValue) return false;
          return new Date(fieldValue).toDateString() === new Date().toDateString();
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
          return taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear();
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

        default: return true;
      }
    };

    return taskList.filter((task) => {
      if (filterBlock.operator === 'AND') {
        return filterBlock.children.every((criteria: any) => matchesCriteria(task, criteria));
      } else {
        return filterBlock.children.some((criteria: any) => matchesCriteria(task, criteria));
      }
    });
  };

  const handleSaveGroupName = async () => {
    if (!editedName.trim()) {
      setEditedName(group.name);
      setIsEditingName(false);
      return;
    }
    if (group.isUntitled) {
      if (groupBy === 'status') {
        await addTaskStatusConfig(projectId, {
          label: editedName,
          color: '#6B7280',
          value: editedName.trim().toLowerCase().replace(/\s+/g, '_'),
        });
      }
    } else {
      if (groupBy === 'status') {
        await updateTaskStatusConfig(projectId, group.id, { label: editedName });
      } else if (groupBy === 'priority' && group.optionId) {
        await updateTaskPriorityConfig(projectId, group.optionId, { label: editedName.trim() });
      } else if (groupBy === 'taskType') {
        const taskType = taskTypes.find(t => t.label === group.name);
        if (taskType && !taskType._id.startsWith('system-')) {
          const { updateTaskTypeInProject } = useProjectsStore.getState();
          updateTaskTypeInProject(projectId, taskType._id, { label: editedName.trim() });
        } else {
          alert('System task types cannot be renamed');
          setEditedName(group.name);
        }
      }
    }
    setIsEditingName(false);
  };

  const groupTasks = getFilteredTasks();
  const totalSubtasks = groupTasks.reduce((acc, task) => acc + (task.subtasks?.length || 0), 0);
  const filteredGroupTasks = applyFilters(groupTasks);
  const tasksWithClosedFilter = displayOptions.closedTasks
    ? filteredGroupTasks.filter(task => !task.completed && task.status !== 'done')
    : filteredGroupTasks;
  const sortedAndFilteredTasks = sortTasks(tasksWithClosedFilter);

  // Determine the group accent color
  const accentColor = group.color || '#6366f1';

  return (
    <div className="flex flex-col gap-2 overflow-hidden w-full">
      {/* ── Group Header ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-muted rounded-md w-full"
      >
        {/* Left: chevron + dot + name + menu + count badge */}
        <div className="flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronDown
              className="h-4 w-4 transition-transform duration-200"
              style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Status dot */}
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />

          {/* Editable name */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-7 text-xs font-semibold w-40 py-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGroupName();
                  if (e.key === 'Escape') { setEditedName(group.name); setIsEditingName(false); }
                }}
              />
              <button onClick={handleSaveGroupName} className="text-green-600 hover:text-green-700 p-0.5">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { setEditedName(group.name); setIsEditingName(false); }} className="text-red-400 hover:text-red-600 p-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <h3 className="text-xs font-semibold text-foreground leading-none">{group.name}</h3>
          )}

          {/* Task count badge */}
          <span className="text-xs text-muted-foreground ml-1">
            {groupTasks.length} {groupTasks.length === 1 ? 'Task' : 'Tasks'}
            {totalSubtasks > 0 && ` / ${totalSubtasks} subtask${totalSubtasks !== 1 ? 's' : ''}`}
          </span>

          {/* ··· menu */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border-b-[5px] border-b-primary p-1.5">
              {canAddGroup() && onAddNewGroup && (
                <DropdownMenuItem onClick={onAddNewGroup} className="gap-2 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Add {getGroupByLabel()}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsEditingName(true)} className="gap-2 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                Rename {getGroupByLabel()}
              </DropdownMenuItem>

              {/* Assign color — DropdownMenuSub stays open on hover, no cursor-leave issue */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-xs">
                  <Palette className="h-3.5 w-3.5" />
                  Assign color
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="p-3 border-b-[5px] border-b-primary w-auto"
                  sideOffset={2}
                >
                  {/* Title row */}
                  <p className="text-xs font-semibold mb-3">Assign color to group</p>
                  {/* Color grid — 2 rows matching the image */}
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring ring-offset-background"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {/* <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-xs">
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate {getGroupByLabel()}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="border-b-[5px] border-b-primary"
                >
                  <DropdownMenuItem onClick={handleDuplicateGroup} className="text-xs">Duplicate tasks</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicateGroup} className="text-xs">Duplicate tasks & updates</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub> */}
              <DropdownMenuSeparator className="mx-2 my-0" />
              <DropdownMenuItem onClick={() => onHideGroup?.(group.id)} className="gap-2 text-xs">
                <Eye className="h-3.5 w-3.5" />
                Hide {getGroupByLabel()}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-2 my-0" />
              {/* <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-xs">
                  <LogOut className="h-3.5 w-3.5" />
                  Move {getGroupByLabel()} to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="border-b-[5px] border-b-primary"
                >
                  <DropdownMenuItem className="text-xs">Move to top</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">Move to bottom</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub> */}
              {/* <DropdownMenuSeparator className="mx-2 my-0" /> */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-xs">
                  <FolderUp className="h-3.5 w-3.5" />
                  Export {getGroupByLabel()}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="border-b-[5px] border-b-primary min-w-[140px]">
                  <DropdownMenuItem
                    onClick={() => handlePrint()}
                    className="flex items-center gap-2.5 cursor-pointer text-xs"
                  >
                    <Image src="/images/pdf.svg" alt="PDF" width={20} height={20} className="object-contain" />
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportCSV()}
                    className="flex items-center gap-2.5 cursor-pointer text-xs"
                  >
                    <Image src="/images/csv.svg" alt="CSV" width={20} height={20} className="object-contain" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportExcel()}
                    className="flex items-center gap-2.5 cursor-pointer text-xs"
                  >
                    <Image src="/images/excel.svg" alt="Excel" width={20} height={20} className="object-contain" />
                    Excel
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator className="mx-2 my-0" />
              {/* <DropdownMenuItem className="gap-2 text-xs">
                <Archive className="h-3.5 w-3.5" />
                Archive {getGroupByLabel()}
              </DropdownMenuItem> */}
              <DropdownMenuItem
                className="gap-2 text-xs text-red-600 focus:text-red-600"
                onClick={handleDeleteGroup}
                disabled={!canDeleteGroup()}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {getGroupByLabel()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Task Table ───────────────────────────────────────────── */}
      {!isCollapsed && (
        <TaskTable
          groupId={group.id}
          projectId={projectId}
          hideFields={hideFields}
          groupBy={groupBy}
          filteredTasks={sortedAndFilteredTasks}
          groupName={group.name}
          groupMemberId={group.memberId}
          groupFieldId={group.fieldId}
          columnConfigs={columnConfigs}
          displayOptions={displayOptions}
          groupColor={accentColor}
          activeSortConfig={activeSortConfig}
          onSortChange={onSortChange}
          onSelectionChange={onSelectionChange}
          clearSelection={clearSelection}
        />
      )}

      {/* Delete Group Confirmation */}
      <ConfirmationModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={`Delete ${getGroupByLabel()}`}
        description={`Are you sure you want to delete "${group.name}"? Tasks with this value will be cleared.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}