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
import { Label } from "@/components/ui/label";
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
  ListChecks,
  Merge,
  Bell,
  Upload,
  Save,
  X,
  Clock,
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
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SYSTEM_FIELDS, useTasksStore } from "@/stores/tasks-store";
import { useDraftsStore } from "@/stores/drafts-store";
import { DraftResponse } from "@/lib/api/drafts-api";
import { Task, ColumnConfig } from '@/types/task.types';
import { DraftDetailView } from "@/components/drafts/DraftDetailView";
import {
  getTaskTypeIcon,
  getTaskTypeIconColor,
  getDefaultTaskTypeIcon,
  useProjectsStore,
  getProfilePictureUrl,
  DEFAULT_BACKEND_TYPE_IMAGES,
  TaskTypeConfig,
} from "@/stores/projects-store";
import { iconComponentMap } from "@/components/ColorIconPicker";
import { formatTaskId } from '@/utils/task-utils';
import { useWorkspaceStore } from "@/stores/workspace-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "@/components/ui/sonner";
import DuplicateDraftTaskDialog from "./DuplicateDraftTaskDialog";
import { useGoalsStore } from "@/stores/goals-store";
import { ConvertToSubtaskDialog } from "@/components/projects/ConvertToSubtaskDialog";
import { DraftFieldVisibilityPopup } from "@/components/drafts/common/DraftFieldVisibilityPopup";

const renderDraftTaskTypeVisual = (
  type?: TaskTypeConfig | null,
  className = "w-4 h-4"
) => {
  if (!type) return null;

  const wrapperClass = `${className} shrink-0 flex items-center justify-center`;

  if (type.value === 'subtask') {
    return (
      <div className={wrapperClass}>
        <ListChecks
          className={`${className} shrink-0`}
          color={type.color || "#6B7280"}
        />
      </div>
    );
  }

  if (type.value === 'archive') {
    return (
      <div className={wrapperClass}>
        <Archive
          className={`${className} shrink-0`}
          color={type.color || "#6B7280"}
        />
      </div>
    );
  }

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

const getResolvedTaskType = (typeValue: string, taskTypesList: TaskTypeConfig[]): TaskTypeConfig => {
  const existing = taskTypesList.find(t => t.value === typeValue);
  if (existing) return existing;

  return {
    _id: typeValue,
    value: typeValue,
    label: typeValue === 'subtask' ? 'Sub Task' : (typeValue.charAt(0).toUpperCase() + typeValue.slice(1)),
    description: '',
    color: typeValue === 'milestone' ? '#ef4444' : '#6B7280',
    order: 0,
    displayImage: DEFAULT_BACKEND_TYPE_IMAGES[typeValue] || null,
  };
};

const getDraftTaskTypes = (taskTypesList: TaskTypeConfig[]): TaskTypeConfig[] => {
  const defaults = ['task', 'milestone', 'approval', 'meeting', 'archive', 'subtask'];
  const list = [...taskTypesList];

  defaults.forEach(defValue => {
    if (!list.some(t => t.value === defValue)) {
      list.push({
        _id: defValue,
        value: defValue,
        label: defValue === 'subtask' ? 'Sub Task' : (defValue.charAt(0).toUpperCase() + defValue.slice(1)),
        description: '',
        color: '#6B7280',
        order: 0,
        displayImage: DEFAULT_BACKEND_TYPE_IMAGES[defValue] || null,
      });
    }
  });

  return list;
};

interface DraftTaskTableProps {
  tasks?: Task[];
  groupColor?: string;
  activeSortConfig?: { fieldId: string; fieldType: string; direction: 'asc' | 'desc'; order: number }[];
  onSortChange?: (fieldId: string, fieldType: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedTaskIds?: Set<string>;
  setSelectedTaskIds?: (ids: Set<string>) => void;
  clearSelection?: boolean;
  onDraftTask?: () => void;
}

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
      <div className={`${dim} rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground`}>
        <User className="h-3 w-3" />
      </div>
    );
  }

  return (
    <UIAvatar className={cn(dim, "border shrink-0")}>
      {src && <AvatarImage src={src} className="object-cover" />}
      <AvatarFallback
        className="font-semibold text-primary-foreground bg-muted-foreground"
        style={{ backgroundColor: name ? getAvatarColor(name) : undefined }}
      >
        {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-3 w-3" />}
      </AvatarFallback>
    </UIAvatar>
  );
}

//   Priority flag  
function PriorityFlag({ priority, color }: { priority?: string; color?: string }) {
  if (!priority) {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted">
        <Flag className="h-4 w-4 text-muted-foreground" />
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
      title="Drag to resize   Double-click to toggle collapse"
      className="group absolute right-0 top-0 h-full w-3 cursor-col-resize z-30 flex justify-end"
    >
      <div className="w-1 h-full bg-transparent group-hover:bg-blue-400 group-active:bg-blue-600 transition-colors" />
    </div>
  );
}


export function DraftTaskTable({
  tasks,
  groupColor = '#3B82F6',
  activeSortConfig = [],
  onSortChange,
  onSelectionChange,
  selectedTaskIds = new Set(),
  setSelectedTaskIds,
  clearSelection,
  onDraftTask
}: DraftTaskTableProps) {
  const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
  const { addTask: createRealTask, addSubtask: createRealSubtask } = useTasksStore();
  const {
    projects,
    getTaskTypesByProject,
    getTaskStatusConfigs,
    addTaskStatusConfig,
    getTaskCustomFields,
    getTaskCustomFieldById,
    getTaskPriorityConfigs,
    addTaskPriorityConfig,
    getMembersByProject,
  } = useProjectsStore();

  const groupTasks = (tasks || []).map(t => ({
    ...t,
    name: (t as any).title || (t as any).name,
    assignee: (t as any).assigneeId || (t as any).assignee,
    endDate: (t as any).dueDate || (t as any).endDate,
    projectId: (t as any).projectId || "DRAFT",
    completed: (t as any).completed || false,
    order: (t as any).order || 0,
    attachmentIds: (t as any).attachments || [],
    attachments: (t as any).attachments || [],
  }));
  const groupName = 'Drafts' as string;
  const groupBy = 'none' as string;
  const groupFieldId = 'none' as string;
  const hideFields: string[] = [];

  // Use the first project's configs as defaults for drafts if available, or empty arrays
  const defaultProjectId = projects[0]?.id || "";
  const columnConfigs: ColumnConfig[] = [
    { id: 'name', fieldName: 'Task Name', columnOrder: 0, columnFreezed: false, pinned: true, isSystemColumn: true },
    { id: 'status', fieldName: 'Status', columnOrder: 1, columnFreezed: false, pinned: true, isSystemColumn: true },
    { id: 'priority', fieldName: 'Priority', columnOrder: 2, columnFreezed: false, pinned: true, isSystemColumn: true },
    { id: 'assignee', fieldName: 'Assignee', columnOrder: 3, columnFreezed: false, pinned: true, isSystemColumn: true },
    { id: 'endDate', fieldName: 'Due Date', columnOrder: 4, columnFreezed: false, pinned: true, isSystemColumn: true },
  ];
  const taskStatusConfigs = getTaskStatusConfigs(defaultProjectId) || [];
  const taskPriorityConfigs = getTaskPriorityConfigs(defaultProjectId) || [];
  const taskTypes = getTaskTypesByProject(defaultProjectId) || [];
  const projectSlug = projects[0]?.slug || 'TASK';
  const project = projects[0] || null;

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

  //   Local state for field visibility (dont use task store state)
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    'id': false,
    'taskType': false,
    'startDate': false,
    'status': true,
    'assignee': true,
    'endDate': true,
    'priority': true,
    'task': true, // always show
  });

  const toggleField = (fieldId: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const {
    saveDraft,
    deleteDraft,
    getSubtasksByDraft,
    getDraftById,
    drafts,
  } = useDraftsStore();



  const getSubtasksByTask = useCallback((id: string) => {
    return getSubtasksByDraft(id).map(d => ({
      ...d,
      name: d.title,
      assignee: d.assigneeId,
      endDate: d.dueDate,
      projectId: d.projectId || "DRAFT",
      completed: false,
      order: 0,
      attachmentIds: d.attachments || [],
      attachments: d.attachments || [],
    }));
  }, [getSubtasksByDraft]);

  const updateTask = useCallback(async (id: string, updates: any) => {
    const workspaceId = currentWorkspace?.id;
    if (!workspaceId) return;
    await saveDraft({
      id,
      workspaceId,
      projectId: updates.projectId,
      title: updates.name,
      description: updates.description,
      assigneeId: updates.assignee,
      priority: updates.priority,
      status: updates.status,
      startDate: updates.startDate,
      dueDate: updates.endDate,
      taskType: updates.taskType,
    });
  }, [currentWorkspace?.id, saveDraft]);

  const deleteTask = useCallback(async (id: string) => {
    const workspaceId = currentWorkspace?.id;
    if (!workspaceId) return;
    await deleteDraft(id, workspaceId);
  }, [currentWorkspace?.id, deleteDraft]);

  const handleMoveToProject = useCallback(async (draft: DraftResponse) => {
    if (!draft.projectId || draft.projectId === 'DRAFT') {
      toast('error', { title: "Please select a project first" });
      return;
    }

    try {
      if (draft.taskType === 'subtask' && draft.parentTaskId) {
        await createRealSubtask({
          projectId: draft.projectId,
          parentTaskId: draft.parentTaskId,
          name: draft.title,
          description: draft.description || '',
          assignee: draft.assigneeId,
          priority: draft.priority,
          status: draft.status,
          startDate: draft.startDate,
          endDate: draft.dueDate,
          taskType: draft.taskType as any,
          labelIds: draft.tags || [],
          attachmentIds: (draft.attachments || []).map((a: any) => typeof a === 'string' ? a : a.id),
          customFieldValues: {},
          completed: false,
        });
        await deleteDraft(draft.id, draft.workspaceId);
        toast('success', { title: `Draft "${draft.title}" moved to project successfully` });
      } else {
        // Moving a root task - check for subtasks
        const draftSubtasks = getSubtasksByDraft(draft.id);

        const onRootConfirmed = async (realParentId: string) => {
          // Move each subtask to the new project task
          for (const subDraft of draftSubtasks) {
            try {
              await createRealSubtask({
                projectId: draft.projectId!,
                parentTaskId: realParentId,
                name: subDraft.title,
                description: subDraft.description || '',
                assignee: subDraft.assigneeId,
                priority: subDraft.priority,
                status: subDraft.status,
                startDate: subDraft.startDate,
                endDate: subDraft.dueDate,
                taskType: subDraft.taskType as any,
                labelIds: subDraft.tags || [],
                attachmentIds: (subDraft.attachments || []).map((a: any) => typeof a === 'string' ? a : a.id),
                customFieldValues: {},
                completed: false,
              });
              await deleteDraft(subDraft.id, subDraft.workspaceId);
            } catch (err) {
              console.error(`Failed to move subtask ${subDraft.id}:`, err);
            }
          }
        };

        await createRealTask({
          projectId: draft.projectId,
          name: draft.title,
          description: draft.description || '',
          assignee: draft.assigneeId,
          priority: draft.priority,
          status: draft.status,
          startDate: draft.startDate,
          endDate: draft.dueDate,
          taskType: draft.taskType as any,
          labelIds: draft.tags || [],
          attachmentIds: (draft.attachments || []).map((a: any) => typeof a === 'string' ? a : a.id),
          customFieldValues: {},
          completed: false,
        }, onRootConfirmed);

        await deleteDraft(draft.id, draft.workspaceId);

        if (draftSubtasks.length > 0) {
          toast('success', { title: `Draft "${draft.title}" and ${draftSubtasks.length} subtask(s) moved to project successfully` });
        } else {
          toast('success', { title: `Draft "${draft.title}" moved to project successfully` });
        }
      }
    } catch (error) {
      console.error("Failed to move draft to project:", error);
      toast('error', { title: "Failed to move draft to project" });
    }
  }, [createRealTask, createRealSubtask, deleteDraft, getSubtasksByDraft]);

  const updateSubtask = updateTask;
  const deleteSubtask = deleteTask;

  const addSubtask = useCallback(async (subtask: any, onConfirmed?: (id: string) => void) => {
    console.log("addsubtask", subtask)
    const workspaceId = currentWorkspace?.id;
    if (!workspaceId) return "";
    const id = await saveDraft({
      workspaceId,
      projectId: subtask.projectId,
      title: subtask.name,
      parentTaskId: subtask.parentTaskId,
      taskType: subtask.taskType || 'subtask',
      assigneeId: subtask.assignee,
      priority: subtask.priority,
      status: subtask.status,
      startDate: subtask.startDate,
      dueDate: subtask.endDate,
    });
    if (onConfirmed) onConfirmed(id);
    return id;
  }, [currentWorkspace?.id, saveDraft]);

  const addTask = useCallback(async (taskData: any, onConfirmed?: (id: string) => void) => {
    const workspaceId = currentWorkspace?.id;
    if (!workspaceId) return "";
    const id = await saveDraft({
      workspaceId,
      projectId: taskData.projectId,
      title: taskData.name,
      taskType: taskData.taskType || 'task',
      assigneeId: taskData.assignee,
      priority: taskData.priority,
      status: taskData.status,
      startDate: taskData.startDate,
      dueDate: taskData.endDate,
    });
    if (onConfirmed) onConfirmed(id);
    return id;
  }, [currentWorkspace?.id, saveDraft]);

  const updateColumnWidth = useCallback((columnId: string, width: number) => { }, []);
  const convertTaskToSubtask = useCallback(async () => { }, []);
  const duplicateTask = useCallback(async (id: string, newName?: string) => {
    let original = groupTasks.find(t => t.id === id);
    if (!original) {
      for (const t of groupTasks) {
        const subtasks = getSubtasksByDraft(t.id);
        const found = subtasks.find(s => s.id === id);
        if (found) {
          original = found as any;
          break;
        }
      }
    }

    if (!original || !currentWorkspace?.id) return "";

    const payload = {
      workspaceId: currentWorkspace.id,
      projectId: original.projectId,
      title: newName || `${(original as any).title || (original as any).name} (Copy)`,
      description: (original as any).description,
      assigneeId: (original as any).assigneeId || (original as any).assignee,
      priority: original.priority,
      status: original.status,
      taskType: original.taskType as "task" | "subtask",
      parentTaskId: original.parentTaskId,
      startDate: original.startDate,
      dueDate: (original as any).dueDate || (original as any).endDate,
      tags: (original as any).tags || [],
      attachments: (original as any).attachments || [],
    };

    const newId = await saveDraft(payload);

    if (original.taskType === 'task') {
      const subtasks = getSubtasksByDraft(id);
      for (const sub of subtasks) {
        await saveDraft({
          workspaceId: currentWorkspace.id,
          projectId: sub.projectId,
          title: sub.title,
          description: sub.description,
          assigneeId: sub.assigneeId,
          priority: sub.priority,
          status: sub.status,
          taskType: sub.taskType as "task" | "subtask",
          parentTaskId: newId,
          startDate: sub.startDate,
          dueDate: sub.dueDate,
          tags: sub.tags,
          attachments: sub.attachments,
        });
      }
    }

    toast('success', { title: "Draft duplicated successfully" });
    return newId;
  }, [currentWorkspace?.id, groupTasks, saveDraft, getSubtasksByDraft]);
  const goals = useGoalsStore(state => state.goals);

  //   ADD THIS LINE   makes TaskTable re-render when any field is toggled
  const systemFieldVisibility = {} as any;



  const customFields = [] as any[];
  const members = workspaceMembers;

  const [showAddTask, setShowAddTask] = useState(false);
  const [isAddTaskRowHovered, setIsAddTaskRowHovered] = useState(false);
  const [showTaskTypeMenu, setShowTaskTypeMenu] = useState(false);
  const [taskTypeMenuCoords, setTaskTypeMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const chevronButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedAddTaskType, setSelectedAddTaskType] = useState('task');
  const [addingSubtaskToTask, setAddingSubtaskToTask] = useState<string | null>(null);
  const displayOptions = {
    collapsedSubtasks: false,
    closedTasks: false,
    wrapText: false,
    subtaskParentId: false,
  };
  const projectId = projects[0]?.id || "DRAFT";
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => new Set());

  // Task delete confirmation
  const [deleteTaskConfirmId, setDeleteTaskConfirmId] = useState<string | null>(null);
  // Subtask delete confirmation  
  const [deleteSubtaskConfirmId, setDeleteSubtaskConfirmId] = useState<string | null>(null);
  // Bulk delete confirmation
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);


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
      setExpandedTasks(prev => prev.size === 0 ? prev : new Set());
    } else {
      const validIds = new Set((tasks || []).map(t => t.id));
      const tasksWithSubtasks = (tasks || [])
        .filter(task => getSubtasksByTask(task.id)?.length > 0)
        .map(task => task.id);

      setExpandedTasks(prev => {
        const next = new Set([
          ...Array.from(prev).filter(id => validIds.has(id)),
          ...tasksWithSubtasks,
        ]);

        if (next.size === prev.size && Array.from(next).every(id => prev.has(id))) {
          return prev;
        }
        return next;
      });
    }
  }, [displayOptions.collapsedSubtasks, tasks, getSubtasksByTask]);

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
    taskType: 'subtask',
    assignee: '',
    priority: '' as string,
    status: '' as string,
    startDate: new Date() as Date | undefined,
    endDate: undefined as Date | undefined,
    customFieldValues: {} as Record<string, string | string[]>,
  });

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const [selectedSubtaskForDetail, setSelectedSubtaskForDetail] = useState<any | null>(null);
  const [showSubtaskDetail, setShowSubtaskDetail] = useState(false);

  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriorityName, setNewPriorityName] = useState('');

  const [duplicateTaskId, setDuplicateTaskId] = useState<string | null>(null);
  const [duplicateSubtaskId, setDuplicateSubtaskId] = useState<string | null>(null);

  const toggleTaskSelection = (taskId: string) => {
    if (!setSelectedTaskIds) return;
    const next = new Set(selectedTaskIds);
    const isSelected = next.has(taskId);

    // Get subtasks for this task (if it is a parent)
    const taskSubtasks = getSubtasksByTask(taskId) || [];
    const subtaskIds = taskSubtasks.map(s => s.id);

    if (isSelected) {
      next.delete(taskId);
      subtaskIds.forEach(id => next.delete(id));
    } else {
      next.add(taskId);
      subtaskIds.forEach(id => next.add(id));
    }
    setSelectedTaskIds(next);
  };

  const toggleSelectAll = () => {
    if (!setSelectedTaskIds) return;

    // Total pool of selectable items: all parent tasks + all their subtasks
    const allSelectableIds = groupTasks.flatMap(t => [t.id, ...(getSubtasksByTask(t.id)?.map(s => s.id) || [])]);

    if (selectedTaskIds.size >= allSelectableIds.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(allSelectableIds));
    }
  };

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedTaskIds));
  }, [selectedTaskIds]);


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
    console.log('Saving new task with data:', newTaskData);
    console.log('Saving new task with data status:', newTaskData.status);
    //   Fix   only override if user hasn't explicitly chosen one
    let status = newTaskData.status || undefined;
    if (!status && groupBy === 'status' && groupName && groupName !== 'Untitled') {
      const config = taskStatusConfigs.find(c => c.label === groupName);
      status = config?.value ?? groupName;
    }
    let priority = newTaskData.priority || undefined;
    if (groupBy === 'priority' && groupName && groupName !== 'Untitled') priority = groupName;
    let assignee = newTaskData.assignee || undefined;
    if (groupBy === 'assginee' && groupName && groupName !== 'Unassigned') {
      //   Find member by name and use their userId
      const member = workspaceMembers.find(m => m.name === groupName);
      assignee = member?.userId; // Use userId instead of name
    }
    //   Fix   prefer inline picker, fall back to chevron-menu selection
    let taskType = newTaskData.taskType || selectedAddTaskType;
    if (groupBy === 'taskType' && groupName && groupName !== 'Untitled') {
      const type = taskTypes.find(t => t.label === groupName);
      taskType = type?.value || newTaskData.taskType || selectedAddTaskType;
    }

    let customFieldValues = { ...newTaskData.customFieldValues };
    if (groupBy.startsWith('custom-') && groupFieldId && typeof groupName === 'string' && groupName !== 'No Value') {
      customFieldValues[groupFieldId] = groupName;
    }
    console.log('Final status value for new task:', status);

    const capturedData = { ...newTaskData };  // snapshot before reset
    const capturedTaskType = taskType; // capture before reset

    // Close input row immediately
    setNewTaskData({ name: '', taskType: 'task', assignee: '', startDate: new Date(), endDate: undefined, priority: '', status: '', customFieldValues: {} });
    setSelectedAddTaskType('task');
    setShowTaskTypeMenu(false);
    setShowAddTask(false);

    const onConfirmed = capturedTaskType === 'milestone'
      ? (realId: string) => {
        // Swap tempId -> realId so the row stays open under the real task
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
        startDate: capturedData.startDate ? capturedData.startDate.toISOString() : undefined,
        endDate: capturedData.endDate ? capturedData.endDate.toISOString() : undefined,
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
    console.log("subtask", newSubtaskData)
    if (!newSubtaskData.name.trim()) return;
    const parentTask = groupTasks.find(t => t.id === parentTaskId);
    let status = newSubtaskData.status || undefined;
    if (!status && groupBy === 'status' && groupName && groupName !== 'Untitled') {
      const config = taskStatusConfigs.find(c => c.label === groupName);
      status = config?.value ?? groupName;
    }
    if (!status && parentTask?.status) {
      status = parentTask.status;
    }
    let priority = newSubtaskData.priority || undefined;
    if (groupBy === 'priority' && groupName && groupName !== 'Untitled') priority = groupName;
    let assignee = newSubtaskData.assignee || undefined;
    if (groupBy === 'assginee' && groupName && groupName !== 'Unassigned') {
      //   Find member by name and use their userId
      const member = workspaceMembers.find(m => m.name === groupName);
      assignee = member?.userId; // Use userId instead of name
    }
    let customFieldValues = { ...newSubtaskData.customFieldValues };
    if (groupBy.startsWith('custom-') && groupFieldId && typeof groupName === 'string' && groupName !== 'No Value') {
      customFieldValues[groupFieldId] = groupName;
    }
    console.log('Final status value for new subtask:', status);

    const capturedSubtask = { ...newSubtaskData };

    //   Close the input row IMMEDIATELY   don't wait for API
    setNewSubtaskData({
      name: '',
      taskType: 'subtask',
      assignee: '',
      startDate: new Date(),
      endDate: undefined,
      priority: '',
      status: '',
      customFieldValues: {},
    });
    setAddingSubtaskToTask(null); //   closes the subtask input row instantly

    // Now call addSubtask with the snapshot   returns tempId immediately
    await addSubtask({
      name: capturedSubtask.name,
      taskType: capturedSubtask.taskType || 'subtask',
      parentTaskId,
      projectId,
      assignee: capturedSubtask.assignee || undefined,
      startDate: capturedSubtask.startDate?.toISOString(),
      endDate: capturedSubtask.endDate?.toISOString(),
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


  //   Column visibility / freeze helpers  
  const getVisibleColumnConfigs = () => {
    if (!columnConfigs || columnConfigs.length === 0) return [];
    return columnConfigs.filter(c => c.pinned !== false);
  };

  const visibleColumnConfigs = getVisibleColumnConfigs();

  const shouldShowField = (fieldKey: string, fieldLabel: string) => {
    //   System fields are controlled by systemFieldVisibility, NOT columnConfigs.pinned
    const systemFieldIds = ['id', 'task', 'taskType', 'status', 'assignee', 'startDate', 'endDate', 'priority'];
    const isSystemField = systemFieldIds.includes(fieldKey);

    if (!isSystemField) {
      // Custom fields: use columnConfigs pinned check
      if (!shouldShowColumn(fieldKey)) return false;
    }

    if (hideFields.includes(fieldLabel)) return false;

    if (systemFieldIds.includes(fieldKey)) {
      const field = SYSTEM_FIELDS.find(f => f.id === fieldKey);
      const isVisible = visibleFields[fieldKey] ?? (field?.defaultVisible ?? true);
      if (!isVisible) return false;
    }

    return true;
  };

  const getColumnStyle = (columnId: string, isHeader: boolean = false, rowGroupColor?: string, isSubtask: boolean = false): React.CSSProperties => {
    const columnConfig = visibleColumnConfigs?.find(c => c.id === columnId);
    const alwaysFrozenColumns = {
      'checkbox': { width: 48, order: -1 },
      'projectSlug': { width: 100, order: 0 },
      'task': { width: columnWidths['task'] ?? 250, order: 1 },
      'project': { width: 140, order: 2 }
    };
    if (alwaysFrozenColumns[columnId as keyof typeof alwaysFrozenColumns]) {
      const config = alwaysFrozenColumns[columnId as keyof typeof alwaysFrozenColumns];
      let leftOffset = 0;
      if (columnId === 'projectSlug') leftOffset = 48;
      if (columnId === 'task') leftOffset = 48 + 100;
      if (columnId === 'project') leftOffset = 48 + 100 + (columnWidths['task'] ?? 250);

      const baseStyle: React.CSSProperties = {
        position: 'sticky',
        left: `${leftOffset}px`,
        zIndex: isHeader ? 25 : 15,
        backgroundColor: isHeader ? 'var(--card)' : 'var(--background)',
        minWidth: `${config.width}px`,
        width: `${config.width}px`,
        boxShadow: 'inset -1px 0 0 var(--border)',
      };

      // The checkbox cell carries the group-color left accent border
      if (columnId === 'checkbox') {
        const borderCol = rowGroupColor;
        baseStyle.boxShadow = `inset -1px 0 0 var(--border), inset 4px 0 0 0px ${borderCol}`;
      }

      return baseStyle;
    }
    if (columnConfig && columnConfig.columnFreezed && !columnConfig.isSystemColumn) {
      const baseOffset = 48 + 100 + (columnWidths['task'] ?? 250) + 140; // checkbox + slug + task + project
      const frozenBefore = visibleColumnConfigs
        .filter(c => c.columnFreezed && c.columnOrder < columnConfig.columnOrder && !c.isSystemColumn)
        .sort((a, b) => a.columnOrder - b.columnOrder);
      let leftOffset = baseOffset;
      frozenBefore.forEach((c) => { 
        leftOffset += (columnWidths[c.id] ?? DEFAULT_COL_WIDTH); 
      });
      const w = columnWidths[columnId] ?? DEFAULT_COL_WIDTH;
      return {
        position: 'sticky',
        left: `${leftOffset}px`,
        zIndex: isHeader ? 20 : 10,
        backgroundColor: isHeader ? 'var(--card)' : 'var(--background)',
        minWidth: `${w}px`,
        width: `${w}px`,
        boxShadow: 'inset -1px 0 0 var(--border), 2px 0 4px rgba(0,0,0,0.04)',
      };
    }
    const w = columnWidths[columnId] ?? DEFAULT_COL_WIDTH;
    return { minWidth: `${w}px`, width: `${w}px`, boxShadow: 'inset -1px 0 0 var(--border)' };
  };

  const shouldShowColumn = (columnId: string): boolean => {
    // Check all columnConfigs (not just pinned-filtered ones)
    // so hidden custom fields are properly excluded from body rows
    const columnConfig = columnConfigs.find(c => c.id === columnId);
    if (!columnConfig) return true; // not a managed column, always show (system fields)
    return columnConfig.pinned !== false; // explicitly hidden   false
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

    return defaultHeaders.filter(h => shouldShowField(h.key, h.label));
  };

  const headers = getTableHeaders();

  // Lookup priority option color
  const getPriorityColor = (priorityValue?: string, configs: any[] = taskPriorityConfigs): string | undefined => {
    if (!priorityValue) return undefined;
    return configs.find(p => p.value === priorityValue)?.color;
  };



  // Format date nicely: "10 Dec"
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'd MMM');
    } catch {
      return dateStr;
    }
  };

  //   Shared cell styles  
  const headerCellCls = "!h-9 font-semibold text-xs text-muted-foreground uppercase tracking-wide px-3 py-0 select-none border-r border-border bg-card";
  const bodyCellCls = "!h-9 px-3 py-0 text-xs border-r border-border";

  return (
    <>
      <div className="relative">
        <div className="overflow-x-auto rounded-tl-sm">
          <Table className="relative border-y border-border text-xs">

            {/*   Column Headers   */}
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                {/* Checkbox */}
                <TableHead className={headerCellCls} style={getColumnStyle('checkbox', true, groupColor)}>
                  <div className="flex items-center pl-1">
                    <Checkbox
                      checked={(() => {
                        const totalSelectable = groupTasks.length + groupTasks.reduce((acc, t) => acc + (getSubtasksByTask(t.id)?.length || 0), 0);
                        return totalSelectable > 0 && selectedTaskIds.size >= totalSelectable;
                      })()}
                      onCheckedChange={toggleSelectAll}
                      className="rounded"
                    />
                  </div>
                </TableHead>

                {/* Slug */}
                <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle('projectSlug', true)}>
                  <span className="truncate">Project ID</span>
                  <ResizeHandle
                    columnId="projectSlug"
                    onResize={handleColumnResize}
                    onDoubleClick={handleColumnToggleCollapse}
                  />
                </TableHead>

                {/* Task Name */}
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

                {/* Project */}
                <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle('project', true)}>
                  <span className="truncate">Project</span>
                  <ResizeHandle
                    columnId="project"
                    onResize={handleColumnResize}
                    onDoubleClick={handleColumnToggleCollapse}
                  />
                </TableHead>

                {/* Dynamic columns */}
                {headers.map((header) => (
                  <TableHead
                    key={header.key}
                    style={getColumnStyle(header.key, true)}
                    className={cn(headerCellCls, "text-center relative group")}
                  >
                    <div className="flex items-center gap-1 justify-center">
                      <span className="truncate">{header.label}</span>
                      {getSortIcon(header.key, header.type)}
                    </div>
                    <ResizeHandle
                      columnId={header.key}
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                ))}

                {/* Actions Column Header (sticky) */}
                <TableHead
                  className={cn("w-[140px] text-center text-xs !h-9")}
                  style={{
                    position: 'sticky',
                    right: 0,
                    zIndex: 20,
                    backgroundColor: 'var(--card)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  <div className="flex items-center justify-center w-full relative">
                    <span className="pr-6">Actions</span>
                    <div className="absolute right-0">
                      <DraftFieldVisibilityPopup
                        visibleFields={visibleFields}
                        onToggle={toggleField}
                      />
                    </div>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/*   Task Rows   */}
              {groupTasks.map((task) => {
                const draftProjectId = (task as any).projectId as string | undefined;
                const project = projects.find((p) => p.id === draftProjectId);
                const projectSlug = project?.slug ?? 'TASK';
                const taskTypes = getTaskTypesByProject(draftProjectId ?? '');
                const taskStatusConfigs = getTaskStatusConfigs(draftProjectId ?? '');
                const taskPriorityConfigs = getTaskPriorityConfigs(draftProjectId ?? '');
                const members = draftProjectId ? getMembersByProject(draftProjectId) : workspaceMembers;
                const customFields: any[] = [];

                const taskSubtasks = getSubtasksByTask(task.id);
                const isExpanded = expandedTasks.has(task.id);
                const hasSubtasks = taskSubtasks.length > 0;

                return (
                  <React.Fragment key={task.id}>
                    {/*   Main Task Row   */}
                    <TableRow
                      key={task.id}
                      className="group hover:bg-muted/50 dark:hover:bg-blue-950/20 border-b border-border transition-colors"
                    // style={{ borderLeft: `4px solid ${groupColor}` }}
                    >

                      {/* Checkbox + expand */}
                      <TableCell className={bodyCellCls} style={getColumnStyle('checkbox', false, groupColor)}>
                        <div className="flex items-center gap-1">
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

                      {/* Slug Cell */}
                      <TableCell className={cn(bodyCellCls, "text-center text-muted-foreground text-xs")} style={getColumnStyle('projectSlug', false)}>
                        {projectSlug}
                      </TableCell>

                      {/* Task Name */}
                      <TableCell
                        className={cn(bodyCellCls, displayOptions.wrapText ? "max-w-xs" : "max-w-[260px]")}
                        style={getColumnStyle('task', false)}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              "text-xs text-foreground min-w-0 flex-1",
                              // drafts have no completed state
                              displayOptions.wrapText ? "truncate" : "whitespace-normal break-words"
                            )}
                          >
                            {task.name}
                          </span>
                          {/* Hover actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              className="px-1.5 py-0.5 text-primary hover:bg-muted rounded flex items-center gap-0.5"
                              onClick={() => {
                                setNewSubtaskData(prev => ({
                                  ...prev,
                                  status: task.status || '',
                                  taskType: 'subtask',
                                  endDate: task.endDate ? new Date(task.endDate) : undefined,
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
                                setSelectedTaskForDetail(task);
                                setShowTaskDetail(true);
                                setIsDetailLoading(true);
                                const fresh = await getDraftById(task.id, currentWorkspace?.id || "");
                                if (fresh) {
                                  setSelectedTaskForDetail(fresh);
                                }
                                setIsDetailLoading(false);
                              }}
                            >
                              <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                            </button>
                          </div>

                        </div>
                      </TableCell>

                      {/* Project Cell */}
                      <TableCell className={cn(bodyCellCls, "text-left font-medium")} style={getColumnStyle('project', false)}>
                        {project?.name || 'No Project'}
                      </TableCell>

                      {/* Task Type Cell */}
                      {shouldShowField('taskType', 'Type') && (
                        <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('taskType', false), height: '1px' }}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild className="w-full h-full">
                              <button className="w-full h-full flex items-center justify-center gap-2 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2 hover:bg-muted">
                                {(() => {
                                  const typeValue = task.taskType || 'task';
                                  const selectedType = getResolvedTaskType(typeValue, taskTypes);

                                  return (
                                    <>
                                      {renderDraftTaskTypeVisual(selectedType, "w-3.5 h-3.5")}
                                      <span className="truncate text-xs font-medium text-foreground">
                                        {selectedType.label}
                                      </span>
                                    </>
                                  );
                                })()}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                              {getDraftTaskTypes(taskTypes).map((type) => (
                                <DropdownMenuItem key={type._id} onSelect={() => updateTask(task.id, { taskType: type.value })} className="p-0 focus:bg-transparent">
                                  <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium transition-colors hover:bg-muted px-3 bg-muted text-foreground">
                                    {renderDraftTaskTypeVisual(type, "w-3.5 h-3.5")}
                                    <span className="truncate">{type.label}</span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}

                      {/* Status */}
                      {shouldShowField('status', 'Status') && (
                        <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('status', false), height: '1px' }}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild className="w-full h-full">
                              <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden px-3"
                                style={{ backgroundColor: taskStatusConfigs.find(c => c.value === task.status)?.color || '#c4c4c4' }}>
                                <span className="truncate w-full text-center">
                                  {taskStatusConfigs.find(c => c.value === task.status)?.label || '—'}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                              {taskStatusConfigs.map(config => (
                                <DropdownMenuItem key={config._id} onSelect={() => updateTask(task.id, { status: config.value })} className="p-0 focus:bg-transparent">
                                  <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3"
                                    style={{ backgroundColor: config.color || '#c4c4c4' }}>
                                    <span className="truncate w-full text-center">{config.label}</span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                              {taskStatusConfigs.length > 0 && <DropdownMenuSeparator />}
                              {isAddingStatus ? (
                                <div className="flex gap-1 p-2">
                                  <Input value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Status name" className="h-6" autoFocus
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
                        <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('assignee', false), height: '1px' }}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild className="w-full h-full">
                              <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                                {(() => {
                                  const m = members.find(m => m.userId === task.assignee);
                                  return <Avatar name={m?.name} src={getProfilePictureUrl(m?.avatar)} />;
                                })()}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                              <DropdownMenuItem onSelect={() => updateTask(task.id, { assignee: undefined })} className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs">
                                Clear
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {members.map(member => (
                                <DropdownMenuItem key={member.userId} onSelect={() => updateTask(task.id, { assignee: member.userId })} className="p-0 focus:bg-transparent">
                                  <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                    <Avatar name={member.name} src={getProfilePictureUrl(member.avatar)} size="sm" />
                                    <span className="truncate">{member.name}</span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}

                      {/*   Start Date (separate from Due Date) */}
                      {shouldShowField('startDate', 'Start Date') && (
                        <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('startDate', false)}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                {task.startDate ? (
                                  <span className="font-medium">{formatDate(task.startDate)}</span>
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                              <Calendar
                                mode="single"
                                selected={task.startDate ? new Date(task.startDate) : undefined}
                                onSelect={(date) => {
                                  if (date) updateTask(task.id, { startDate: date.toISOString() });
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      )}

                      {/*   Due Date (End Date) */}
                      {shouldShowField('endDate', 'Due Date') && (
                        <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('endDate', false)}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                {task.endDate ? (
                                  <span className="font-medium">{formatDate(task.endDate)}</span>
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                              <Calendar
                                mode="single"
                                selected={task.endDate ? new Date(task.endDate) : undefined}
                                onSelect={(date) => {
                                  if (date) updateTask(task.id, { endDate: date.toISOString() });
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
                        <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('priority', false), height: '1px' }}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild className="w-full h-full">
                              <button className="w-full h-full flex items-center justify-center gap-2 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
                                style={{ backgroundColor: `${getPriorityColor(task.priority, taskPriorityConfigs) || '#9CA3AF'}33` }}>
                                <span className={cn("truncate text-xs font-medium", task.priority ? "text-foreground" : "text-muted-foreground")}>
                                  {taskPriorityConfigs.find(p => p.value === task.priority)?.label || '—'}
                                </span>
                                <Flag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: getPriorityColor(task.priority, taskPriorityConfigs) || '#9CA3AF' }} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                              {taskPriorityConfigs.map(option => (
                                <DropdownMenuItem key={option._id} onSelect={() => updateTask(task.id, { priority: option.value })} className="p-0 focus:bg-transparent">
                                  <div className="w-full h-9 flex items-center justify-between gap-2 rounded-xs text-xs font-medium transition-opacity hover:opacity-90 px-3 text-foreground"
                                    style={{ backgroundColor: `${option.color || '#9CA3AF'}33` }}>
                                    <span className="truncate">{option.label}</span>
                                    <Flag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: option.color || '#9CA3AF' }} />
                                  </div>
                                </DropdownMenuItem>
                              ))}
                              {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                              {isAddingPriority ? (
                                <div className="flex gap-1 p-2">
                                  <Input value={newPriorityName} onChange={(e) => setNewPriorityName(e.target.value)} placeholder="Priority name" className="h-6" autoFocus
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


                      {/* Row actions */}
                      <TableCell
                        className={cn("w-[140px] text-center")}
                        style={{
                          position: 'sticky',
                          right: 0,
                          zIndex: 10,
                          backgroundColor: 'var(--card)',
                          borderLeft: '1px solid var(--border)',
                          boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        <div className="flex items-center justify-between w-full pl-1 pr-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-1 text-xs"
                            onClick={() => handleMoveToProject(task as unknown as DraftResponse)}
                          >
                            Move to project
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground transition-all flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-b-[5px] border-b-primary p-1.5 min-w-[210px]">
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs"
                                onSelect={() => setDuplicateTaskId(task.id)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => setDeleteTaskConfirmId(task.id)}
                                className="gap-2 cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && taskSubtasks.map((subtask) => {
                      const subtaskProjectId = (subtask as any).projectId as string | undefined;
                      const project = projects.find((p) => p.id === subtaskProjectId);
                      const projectSlug = project?.slug ?? 'TASK';
                      const taskTypes = getTaskTypesByProject(subtaskProjectId ?? '');
                      const taskStatusConfigs = getTaskStatusConfigs(subtaskProjectId ?? '');
                      const taskPriorityConfigs = getTaskPriorityConfigs(subtaskProjectId ?? '');
                      const members = subtaskProjectId ? getMembersByProject(subtaskProjectId) : workspaceMembers;
                      const customFields: any[] = [];
                      return (
                        <TableRow
                          key={subtask.id}
                          className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/20 border-b border-border transition-colors"
                        >
                          {/* Subtask Checkbox */}
                          <TableCell className={bodyCellCls} style={getColumnStyle('checkbox', false, groupColor, true)}>
                            <div className="flex items-center pl-6">
                              <Checkbox
                                checked={selectedTaskIds.has(subtask.id)}
                                onCheckedChange={() => toggleTaskSelection(subtask.id)}
                                className="rounded"
                              />
                            </div>
                          </TableCell>

                          {/* Subtask Slug */}
                          <TableCell className={cn(bodyCellCls, "text-center text-muted-foreground")} style={getColumnStyle('projectSlug', false)}>
                            {projectSlug}
                          </TableCell>

                          {/* Subtask Task Name */}
                          <TableCell className={bodyCellCls} style={getColumnStyle('task', false)}>
                            <div className="flex items-center gap-2 min-w-0 group/sub">
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className={cn("text-sm text-foreground")}>
                                  {subtask.name}
                                </span>
                              </div>

                              {/* hover action to open subtask detail */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                  onClick={async () => {
                                    setSelectedSubtaskForDetail(subtask);
                                    setShowSubtaskDetail(true);
                                  }}
                                >
                                  <ChevronsLeftRight className="h-4 w-4 rotate-135" />
                                </button>
                              </div>

                            </div>
                          </TableCell>

                          {/* Subtask Project Cell */}
                          <TableCell className={cn(bodyCellCls, "text-left font-medium")} style={getColumnStyle('project', false)}>
                            {project?.name || 'No Project'}
                          </TableCell>

                          {/* Subtask Task Type Cell */}
                          {shouldShowField('taskType', 'Type') && (
                            <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('taskType', false), height: '1px' }}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild className="w-full h-full">
                                  <button className="w-full h-full flex items-center justify-center gap-2 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2 hover:bg-muted">
                                    {(() => {
                                      const typeValue = subtask.taskType || 'task';
                                      const selectedType = getResolvedTaskType(typeValue, taskTypes);
                                      return (
                                        <>
                                          {renderDraftTaskTypeVisual(selectedType, "w-3.5 h-3.5")}
                                          <span className="truncate text-xs font-medium text-foreground">
                                            {selectedType.label}
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                                  {getDraftTaskTypes(taskTypes).map((type) => (
                                    <DropdownMenuItem key={type._id} onSelect={async () => {
                                      try {
                                        await updateSubtask(subtask.id, { taskType: type.value });
                                      } catch {}
                                    }} className="p-0 focus:bg-transparent">
                                      <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium transition-colors hover:bg-muted px-3 bg-muted text-foreground">
                                        {renderDraftTaskTypeVisual(type, "w-3.5 h-3.5")}
                                        <span className="truncate">{type.label}</span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}


                          {/* Subtask Status */}
                          {shouldShowField('status', 'Status') && (
                            <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('status', false), height: '1px' }}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild className="w-full h-full">
                                  <button className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden px-3"
                                    style={{ backgroundColor: taskStatusConfigs.find(c => c.value === subtask.status)?.color || '#c4c4c4' }}>
                                    <span className="truncate w-full text-center">
                                      {taskStatusConfigs.find(c => c.value === subtask.status)?.label || '—'}
                                    </span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                                  {taskStatusConfigs.map(config => (
                                    <DropdownMenuItem key={config._id} onSelect={() => updateSubtask(subtask.id, { status: config.value })} className="p-0 focus:bg-transparent">
                                      <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3"
                                        style={{ backgroundColor: config.color || '#c4c4c4' }}>
                                        <span className="truncate w-full text-center">{config.label}</span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => updateSubtask(subtask.id, { status: undefined })} className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs">Clear</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}

                          {/* Subtask Assignee */}
                          {shouldShowField('assignee', 'Assignee') && (
                            <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('assignee', false), height: '1px' }}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild className="w-full h-full">
                                  <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                                    {(() => {
                                      const m = members.find(m => m.userId === subtask.assignee);
                                      return <Avatar name={m?.name} src={getProfilePictureUrl(m?.avatar)} />;
                                    })()}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                                  <DropdownMenuItem onSelect={() => updateSubtask(subtask.id, { assignee: undefined })} className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs">
                                    Clear
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {members.map(member => (
                                    <DropdownMenuItem key={member.userId} onSelect={() => updateSubtask(subtask.id, { assignee: member.userId })} className="p-0 focus:bg-transparent">
                                      <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground">
                                        <Avatar name={member.name} src={getProfilePictureUrl(member.avatar)} size="sm" />
                                        <span className="truncate">{member.name}</span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}

                          {/*   Subtask Start Date */}
                          {shouldShowField('startDate', 'Start Date') && (
                            <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('startDate', false)}>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                    {subtask.startDate ? (
                                      <span className="font-medium">{formatDate(subtask.startDate)}</span>
                                    ) : (
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                    )}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center">
                                  <Calendar
                                    mode="single"
                                    selected={subtask.startDate ? new Date(subtask.startDate) : undefined}
                                    onSelect={(date) => {
                                      if (date) updateSubtask(subtask.id, { startDate: date.toISOString() });
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          )}

                          {/*   Subtask Due Date */}
                          {shouldShowField('endDate', 'Due Date') && (
                            <TableCell className={cn(bodyCellCls, "text-center")} style={getColumnStyle('endDate', false)}>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                    {subtask.endDate ? (
                                      <span className="font-medium">{formatDate(subtask.endDate)}</span>
                                    ) : (
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                    )}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center">
                                  <Calendar
                                    mode="single"
                                    selected={subtask.endDate ? new Date(subtask.endDate) : undefined}
                                    onSelect={(date) => {
                                      if (date) updateSubtask(subtask.id, { endDate: date.toISOString() });
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
                            <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('priority', false), height: '1px' }}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild className="w-full h-full">
                                  <button className="w-full h-full flex items-center justify-center gap-2 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
                                    style={{ backgroundColor: `${getPriorityColor(subtask.priority, taskPriorityConfigs) || '#9CA3AF'}33` }}>
                                    <span className={cn("truncate text-xs font-medium", subtask.priority ? "text-foreground" : "text-muted-foreground")}>
                                      {taskPriorityConfigs.find(p => p.value === subtask.priority)?.label || '—'}
                                    </span>
                                    <Flag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: getPriorityColor(subtask.priority, taskPriorityConfigs) || '#9CA3AF' }} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                                  {taskPriorityConfigs.map(option => (
                                    <DropdownMenuItem key={option._id} onSelect={() => updateSubtask(subtask.id, { priority: option.value })} className="p-0 focus:bg-transparent">
                                      <div className="w-full h-9 flex items-center justify-between gap-2 rounded-xs text-xs font-medium transition-opacity hover:opacity-90 px-3 text-foreground"
                                        style={{ backgroundColor: `${option.color || '#9CA3AF'}33` }}>
                                        <span className="truncate">{option.label}</span>
                                        <Flag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: option.color || '#9CA3AF' }} />
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                  {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                                  <DropdownMenuItem onSelect={() => updateSubtask(subtask.id, { priority: undefined })}>Clear</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}


                          {/* Subtask actions */}
                          <TableCell
                            className={cn("w-[140px] text-center")}
                            style={{
                              position: 'sticky',
                              right: 0,
                              zIndex: 10,
                              backgroundColor: 'var(--card)',
                              borderLeft: '1px solid var(--border)',
                              boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                              padding: 0,
                              margin: 0,
                            }}
                          >
                            <div className="flex items-center justify-between w-full pl-2 pr-1">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 px-2 text-[10px]"
                                onClick={() => handleMoveToProject(subtask as unknown as DraftResponse)}
                              >
                                Move to project
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 pl-2 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground transition-all flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="border-b-[5px] border-b-primary p-1.5 min-w-[210px]">
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer text-xs"
                                    onSelect={() => setDuplicateSubtaskId(subtask.id)}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() => setDeleteSubtaskConfirmId(subtask.id)}
                                    className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/*   Add Subtask Row   prompt OR input, toggles in-place   */}
                    {isExpanded && (
                      addingSubtaskToTask === task.id && (
                        /* INPUT state   shown after clicking "Add Subtask" */
                        <TableRow className="border-b border-border">
                          {/* Add Subtask Checkbox Placeholder */}
                          <TableCell className={bodyCellCls} style={getColumnStyle('checkbox', false, `${groupColor}44`)}>
                            <div className="flex items-center justify-end gap-1">
                              <div className="w-4 h-4 invisible" /> {/* expand-toggle spacer */}
                              <div className="w-4 h-4 rounded border-2 border-border flex-shrink-0" />
                            </div>
                          </TableCell>

                          {/* Add Subtask Slug Placeholder */}
                          <TableCell style={getColumnStyle('projectSlug', false)} />

                          <TableCell className={bodyCellCls} style={getColumnStyle('task', false)}>
                            <div className="pl-2">
                              <Input
                                value={newSubtaskData.name}
                                onChange={(e) => setNewSubtaskData({ ...newSubtaskData, name: e.target.value })}
                                placeholder="Enter sub task name..."
                                className="border-0 pl-0 shadow-none focus-visible:ring-0 h-8 text-sm bg-transparent w-full"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSubtask(task.id);
                                  if (e.key === 'Escape') {
                                    setAddingSubtaskToTask(null);
                                    setNewSubtaskData({ name: '', taskType: 'subtask', assignee: '', startDate: new Date(), endDate: undefined, priority: '', status: '', customFieldValues: {} });
                                  }
                                }}
                              />
                            </div>
                          </TableCell>

                          {/* Add Subtask Project Placeholder */}
                          <TableCell style={getColumnStyle('project', false)} />

                          {/*   Inline field pickers for subtask add row */}
                          {headers.map(h => {

                            //   Task Type  
                            if (h.key === 'taskType') {
                              return (
                                <TableCell key={h.key} className="!p-0 text-center" style={{ ...getColumnStyle(h.key, false), height: '1px' }}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild className="w-full h-full">
                                      <button className="w-full h-full flex items-center justify-center gap-2 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2 hover:bg-muted">
                                        {(() => {
                                          const typeValue = newSubtaskData.taskType || 'task';
                                          const selectedType = getResolvedTaskType(typeValue, taskTypes);
                                          return (
                                            <>
                                              {renderDraftTaskTypeVisual(selectedType, "w-3.5 h-3.5")}
                                              <span className="truncate text-xs font-medium text-foreground">
                                                {selectedType.label}
                                              </span>
                                            </>
                                          );
                                        })()}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                                      {getDraftTaskTypes(taskTypes).map((type) => (
                                        <DropdownMenuItem key={type._id} onSelect={() => setNewSubtaskData(prev => ({ ...prev, taskType: type.value }))} className="p-0 focus:bg-transparent">
                                          <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium transition-colors hover:bg-muted px-3 bg-muted text-foreground">
                                            {renderDraftTaskTypeVisual(type, "w-3.5 h-3.5")}
                                            <span className="truncate">{type.label}</span>
                                          </div>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              );
                            }

                            //   Status  
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
                                          <span className="text-muted-foreground">-</span>
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

                            //   Assignee  
                            if (h.key === 'assignee') {
                              const selectedMember = members.find(m => m.userId === newSubtaskData.assignee);
                              return (
                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="inline-flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                        <Avatar name={selectedMember?.name} src={selectedMember?.avatar} />
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
                                          <Avatar name={member.name} src={member.avatar} />
                                          <span className="ml-2">{member.name}</span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              );
                            }

                            //   Start Date  
                            if (h.key === 'startDate') {
                              return (
                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="text-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                        {newSubtaskData.startDate ? (
                                          <span className="font-medium">{format(newSubtaskData.startDate, 'd MMM')}</span>
                                        ) : (
                                          <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                        )}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="center">
                                      <Calendar
                                        mode="single"
                                        selected={newSubtaskData.startDate}
                                        onSelect={(date) => setNewSubtaskData(prev => ({ ...prev, startDate: date ?? undefined }))}
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

                            //   End Date  
                            if (h.key === 'endDate') {
                              return (
                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="text-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors">
                                        {newSubtaskData.endDate ? (
                                          <span className="font-medium">{format(newSubtaskData.endDate, 'd MMM')}</span>
                                        ) : (
                                          <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                                        )}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="center">
                                      <Calendar
                                        mode="single"
                                        selected={newSubtaskData.endDate}
                                        onSelect={(date) => setNewSubtaskData(prev => ({ ...prev, endDate: date ?? undefined }))}
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

                            //   Priority  
                            if (h.key === 'priority') {
                              return (
                                <TableCell key={h.key} className={cn(bodyCellCls, "text-center")} style={getColumnStyle(h.key, false)}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="inline-flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                        <PriorityFlag
                                          priority={newSubtaskData.priority}
                                          color={getPriorityColor(newSubtaskData.priority, taskPriorityConfigs)}
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

                            //   Default: empty cell for custom fields  
                            return <TableCell key={h.key} className={bodyCellCls} style={getColumnStyle(h.key, false)} />;
                          })}

                          {/* Save / Cancel */}
                          <TableCell
                            className={cn(bodyCellCls, "w-12")}
                            style={{
                              position: 'sticky',
                              right: 0,
                              zIndex: 10,
                              backgroundColor: 'var(--card)',
                              borderLeft: '1px solid var(--border)',
                              boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                              padding: 0,
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
                                  setNewSubtaskData({ name: '', taskType: 'subtask', assignee: '', startDate: new Date(), endDate: undefined, priority: '', status: '', customFieldValues: {} });
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

              {/*   Add Task Button Row   */}
              <TableRow
                className="bg-card hover:bg-card border-b border-border"
                onMouseEnter={() => setIsAddTaskRowHovered(true)}
                onMouseLeave={() => setIsAddTaskRowHovered(false)}
                onClick={onDraftTask}
              >
                <TableCell className="p-0" style={getColumnStyle('checkbox', false, `${groupColor}44`)} />
                <TableCell style={getColumnStyle('projectSlug', false)} className={bodyCellCls} />
                <TableCell
                  className={bodyCellCls}
                  style={getColumnStyle('task', false)}
                  colSpan={headers.length + 3}
                >
                  <div className="flex items-center gap-1 pl-4">
                    <div className={cn(
                      "flex items-center rounded-sm transition-all",
                      isAddTaskRowHovered ? "border border-primary/30" : "border border-transparent"
                    )}>
                      <button
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 transition-colors text-xs",
                          isAddTaskRowHovered ? "text-primary/60" : "text-muted-foreground"
                        )}
                      >
                        <Plus className={cn("h-3 w-3", isAddTaskRowHovered ? "text-primary/60" : "text-muted-foreground")} />
                        Draft a task
                      </button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <DraftDetailView
          draft={selectedTaskForDetail}
          projectId={selectedTaskForDetail?.projectId || ""}
          open={showTaskDetail}
          onOpenChange={(open) => {
            setShowTaskDetail(open);
            if (!open) setIsDetailLoading(false);
          }}
        />

        <DraftDetailView
          draft={selectedSubtaskForDetail}
          projectId={selectedSubtaskForDetail?.projectId || ""}
          open={showSubtaskDetail}
          onOpenChange={(open) => {
            setShowSubtaskDetail(open);
            if (!open) setSelectedSubtaskForDetail(null);
          }}
          isSubDraft={true}
        />

        {/* Duplicate Task Dialog */}
        {duplicateTaskId && (() => {
          const task = groupTasks.find((t) => t.id === duplicateTaskId)!;
          return (
            <DuplicateDraftTaskDialog
              open={!!duplicateTaskId}
              onClose={() => {
                setDuplicateTaskId(null);
                setDuplicateSubtaskId(null);
              }}
              originalTaskName={task.name}
              title="Duplicate draft task"
              onDuplicate={async (newName) => {
                await duplicateTask(duplicateTaskId, newName);
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
            <DuplicateDraftTaskDialog
              open={!!duplicateSubtaskId}
              onClose={() => {
                setDuplicateSubtaskId(null);
                setDuplicateTaskId(null);
              }}
              originalTaskName={subtask?.name ?? "Subtask"}
              title="Duplicate draft subtask"
              onDuplicate={async (newName) => {
                await duplicateTask(duplicateSubtaskId, newName);
              }}
            />
          );
        })()}

        {/* Task Delete Confirmation */}
        <ConfirmationModal
          open={!!deleteTaskConfirmId}
          onClose={() => setDeleteTaskConfirmId(null)}
          title="Delete Task"
          description="Are you sure you want to delete this draft task? This action cannot be undone."
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
          description="Are you sure you want to delete this draft subtask? This action cannot be undone."
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
