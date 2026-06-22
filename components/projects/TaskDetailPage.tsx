// components/projects/TaskDetailPage.tsx
// Full-page standalone version of TaskDetailView for shareable /task/[id] URLs.
// Contains the EXACT same logic as TaskDetailView — just without the Dialog/Overlay shell.

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarPicker } from "@/components/CalendarPicker";
import {
  X as XIcon,
  Calendar as CalendarIcon,
  Check,
  User,
  Flag,
  Tag,
  Plus,
  MoreHorizontal,
  Pin,
  Share2,
  ChevronRight,
  ChevronDown,
  FileText,
  History,
  LayoutTemplate,
  Hash,
  Link2,
  Copy,
  Ban,
  XOctagon,
  CircleArrowLeft,
  CircleArrowRight,
  SkipBack,
  SkipForward,
  ExternalLink,
  GitBranch,
  LoaderCircle,
} from "lucide-react";
import {
  getRelationshipIcon,
  getRelationshipIconColor,
  getRelationshipLabel,
} from "@/utils/relationship-utils";
import {
  formatLocalDate,
  convertSelectedDateToUTC,
  convertUTCToCalendarDate,
} from "@/utils/timezone-utils";
import { MemberAvatar } from "./MemberAvatar";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore, TaskTypeConfig } from "@/stores/projects-store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { iconComponentMap } from "@/components/ColorIconPicker";
import { Task, TaskRelationship } from "@/types/task.types";
import { cn } from "@/lib/utils";
import { RelationshipDropdown } from "./views/list-view/common/RelationshipDropdown";
import { TaskSelector } from "./views/list-view/common/TaskSelector";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { useDocStore } from "@/stores/useDoc-store";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskDetailCustomFieldDropdown } from "./views/list-view/common/TaskDetailCustomFieldDropdown";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { FieldTypeSelectContent } from "./views/list-view/common/FieldTypeSelectContent";
import { formatTaskId } from "@/utils/task-utils";
import { TaskAttachments } from "./TaskAttachments";
import { SubtaskTable } from "./SubtaskTable";
import { toast } from "@/components/ui/sonner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LabelPicker } from "@/components/shared/labels/LabelPicker";
import { LabelBadge } from "@/components/shared/labels/LabelBadge";
import SharedActivityLog from "@/components/shared/ActivityLog";
import DiscussionPage from "../disucssions/DiscussionPage";
import { getCustomFieldIcon } from "./TaskDetailView";

interface TaskDetailPageProps {
  task: Task;
  isSubtask?: boolean;
  projectId: string;
  onOpenInProject?: () => void;
}

export function TaskDetailPage({
  task: initialTask,
  isSubtask = false,
  projectId,
  onOpenInProject,
}: TaskDetailPageProps) {
  // ── Stores (identical to TaskDetailView) ─────────────────────────────
  const {
    tasks,
    subtasks,
    updateTask,
    addTaskRelationship,
    removeTaskRelationship,
    getTaskRelationships,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    getSubtasksByTask,
    addTaskDocument,
    removeTaskDocument,
  } = useTasksStore();

  const {
    projects,
    getTaskTypesByProject,
    getTaskStatusConfigs,
    getTaskCustomFields,
    getTaskCustomFieldById,
    getTaskPriorityConfigs,
  } = useProjectsStore();

  const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
  const { documents } = useDocStore();
  const allDocs = Array.from(documents.values());

  // ── Live task from store (same pattern as TaskDetailView) ─────────────
  const storeTask =
    tasks.find((t) => t.id === initialTask.id) ??
    (subtasks.find((st) => st.id === initialTask.id) as unknown as
      | Task
      | undefined);
  const currentTask = storeTask ?? initialTask;
  const isMilestone = currentTask.taskType === "milestone";
  const taskSubtasks = getSubtasksByTask(currentTask.id);

  // Auto-open subtask input when milestone has no subtasks
  useEffect(() => {
    if (
      !isSubtask &&
      currentTask.taskType === "milestone" &&
      taskSubtasks.length === 0 &&
      !isAddingSubtask // ← don't re-open if user dismissed it
    ) {
      setIsAddingSubtask(true);
    }
  }, [currentTask.id, currentTask.taskType, isSubtask]);

  const projectTasks = [
    ...tasks.filter((t) => t.projectId === projectId),
    ...subtasks
      .filter((st) => st.projectId === projectId)
      .map((st) => ({
        ...st,
        subtasks: [] as string[],
        relationships: [] as TaskRelationship[],
      })),
  ] as Task[];

  const relationships = getTaskRelationships(currentTask.id);

  // ── Derived values ────────────────────────────────────────────────────
  const currentProject = projects.find((p) => p.id === projectId);
  const projectSlug = currentProject?.slug ?? "TASK";
  const taskTypes = getTaskTypesByProject(projectId);
  const taskStatusConfigs = getTaskStatusConfigs(projectId);
  const customFields = getTaskCustomFields(projectId);
  const taskPriorityConfigs = getTaskPriorityConfigs(projectId);
  const CUSTOM_FIELDS_PREVIEW_COUNT = 4;

  const mentionableMembers = (currentProject?.members || []).map((member) => {
    const wm = workspaceMembers.find((m) => m.userId === member.userId);
    return {
      id: member.userId,
      name: wm?.name || member.userId,
      profilePictureUrl: wm?.avatar,
    };
  });

  const getMemberName = (userId?: string) => {
    if (!userId) return null;
    return workspaceMembers.find((m) => m.userId === userId)?.name || null;
  };

  const getPriorityColor = (priorityValue?: string) =>
    taskPriorityConfigs.find((p) => p.value === priorityValue)?.color ||
    undefined;

  // ── State (identical to TaskDetailView) ───────────────────────────────
  const [showAllCustomFields, setShowAllCustomFields] = useState(false);
  const [showAddFieldPopover, setShowAddFieldPopover] = useState(false);
  // const [activeTab, setActiveTab] = useState<"properties" | "progress" | "activity">("properties");
  const [activeTab, setActiveTab] = useState<"properties" | "activity">(
    "properties",
  );
  const [selectedRelationType, setSelectedRelationType] = useState<
    string | null
  >(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [isReadOnly] = useState(false);
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);
  const [selectedDocsForTask, setSelectedDocsForTask] = useState<Set<string>>(
    new Set(),
  );
  const [docTreeExpanded, setDocTreeExpanded] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLinkedDocs, setExpandedLinkedDocs] = useState<Set<string>>(
    new Set(),
  );

  // Collapsible sections state
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);
  const [isCustomFieldsExpanded, setIsCustomFieldsExpanded] = useState(true);
  const [isTaskDetailsExpanded, setIsTaskDetailsExpanded] = useState(true);

  const handleCopyTaskLink = async () => {
    try {
      const url = `${window.location.origin}/task/${currentTask.id}`;
      await navigator.clipboard.writeText(url);
      toast("success", { title: "Task link copied!" });
    } catch {
      toast("error", { title: "Failed to copy link" });
    }
  };

  const handleCopyTaskId = async () => {
    try {
      await navigator.clipboard.writeText(currentTask.id);
      toast("success", { title: "Task ID copied!" });
    } catch {
      toast("error", { title: "Failed to copy ID" });
    }
  };

  const handleCopyFormattedTaskId = async () => {
    try {
      await navigator.clipboard.writeText(formatTaskId(projectSlug, currentTask.taskNumber));
      toast("success", { title: `${formatTaskId(projectSlug, currentTask.taskNumber)} copied!` });
    } catch {
      toast("error", { title: "Failed to copy ID" });
    }
  };

  // ── Handlers (identical to TaskDetailView) ────────────────────────────
  const handleUpdateTask = (updates: Partial<Task>) => {
    if (isSubtask) updateSubtask(currentTask.id, updates);
    else updateTask(currentTask.id, updates);
  };

  const handleSelectLabel = (labelId: string) => {
    const currentLabels = currentTask.labelIds || [];
    if (!currentLabels.includes(labelId)) {
      handleUpdateTask({ labelIds: [...currentLabels, labelId] });
    }
  };

  const handleRemoveLabel = (labelId: string) => {
    const currentLabels = currentTask.labelIds || [];
    handleUpdateTask({
      labelIds: currentLabels.filter((id) => id !== labelId),
    });
  };

  const handleSelectRelationType = (type: string) => {
    setSelectedRelationType(type);
    setShowTaskSelector(true);
  };

  const handleSelectTask = async (targetTaskId: string) => {
    if (selectedRelationType) {
      await addTaskRelationship(currentTask.id, {
        type: selectedRelationType as any,
        targetTaskId,
      });
      setSelectedRelationType(null);
      setShowTaskSelector(false);
    }
  };

  const handleRemoveRelationship = async (id: string) =>
    removeTaskRelationship(currentTask.id, id);

  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return;

    // Capture before reset
    const capturedName = newSubtaskName;

    // 1. Close input row IMMEDIATELY
    setNewSubtaskName("");
    setIsAddingSubtask(false);

    // 2. Fire store — optimistic insert + API retry in background
    addSubtask({
      parentTaskId: currentTask.id,
      projectId: currentTask.projectId,
      name: capturedName,
      status: currentTask.status, // inherit parent status
      startDate: new Date().toISOString(),
      completed: false,
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask(subtaskId);
  };

  const handleToggleSubtaskComplete = (
    subtaskId: string,
    completed: boolean,
  ) => {
    updateSubtask(subtaskId, { completed });
  };

  const handleToggleDocSelect = (docId: string) => {
    setSelectedDocsForTask((prev) => {
      const next = new Set(prev);
      const isSelecting = !next.has(docId);
      const toggle = (id: string, sel: boolean) => {
        sel ? next.add(id) : next.delete(id);
        allDocs
          .filter((d) => d.parentId === id)
          .forEach((c) => toggle(c.id, sel));
      };
      toggle(docId, isSelecting);
      return next;
    });
  };

  const handleAddSelectedDocs = () => {
    selectedDocsForTask.forEach((id) => addTaskDocument(currentTask.id, id));
    setSelectedDocsForTask(new Set());
    setIsDocSelectorOpen(false);
  };

  const getDocCreator = (docId: string): any => {
    const doc = documents.get(docId);
    if (!doc) return null;
    if (doc.createdBy) return doc.createdBy;
    if (doc.parentId) return getDocCreator(doc.parentId);
    return null;
  };

  const getSubPageCount = (docId: string): number =>
    allDocs
      .filter((d) => d.parentId === docId)
      .reduce((n, c) => n + 1 + getSubPageCount(c.id), 0);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("success", { title: "Link copied to clipboard!" });
    } catch {
      toast("error", { title: "Failed to copy link" });
    }
  };

  // ── Doc selector popover (identical to TaskDetailView) ────────────────
  const renderDocSelectorContent = () => (
    <PopoverContent className="w-80 p-0" align="start">
      <div className="p-4 border-b">
        <h3 className="text-xs font-semibold">Select Document</h3>
      </div>
      <ScrollArea className="h-[300px] p-4">
        <div className="space-y-1">
          {allDocs
            .filter((d) => !d.parentId)
            .map((doc) => {
              const isExpanded = docTreeExpanded.has(doc.id);
              const hasChildren = allDocs.some((d) => d.parentId === doc.id);
              const renderTree = (d: any, level = 0) => {
                const isLinked = (currentTask.linkedDocuments || []).includes(
                  d.id,
                );
                return (
                  <div key={d.id} className="space-y-1">
                    <div
                      className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => {
                        if (level === 0 && hasChildren)
                          setDocTreeExpanded((p) => {
                            const n = new Set(p);
                            n.has(d.id) ? n.delete(d.id) : n.add(d.id);
                            return n;
                          });
                      }}
                    >
                      {level === 0 && (
                        <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
                          {hasChildren ? (
                            isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )
                          ) : null}
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex items-center gap-2 flex-1 min-w-0",
                          level > 0 && "pl-6",
                        )}
                      >
                        {!d.parentId ? (
                          <img
                            src="/images/docsidebar.svg"
                            alt="doc"
                            className="w-3.5 h-3.5 shrink-0"
                          />
                        ) : (
                          <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "text-xs truncate",
                            isLinked && "text-muted-foreground",
                          )}
                        >
                          {d.title}
                        </span>
                        {isLinked && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            Linked
                          </span>
                        )}
                      </div>
                      <Checkbox
                        checked={isLinked || selectedDocsForTask.has(d.id)}
                        disabled={isLinked}
                        onCheckedChange={() => {
                          if (!isLinked) handleToggleDocSelect(d.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          isLinked && "opacity-50 cursor-not-allowed",
                        )}
                      />
                    </div>
                    {isExpanded &&
                      hasChildren &&
                      allDocs
                        .filter((c) => c.parentId === d.id)
                        .map((c) => renderTree(c, level + 1))}
                  </div>
                );
              };
              return renderTree(doc);
            })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button
          className="w-full h-8 bg-primary hover:bg-primary/90"
          onClick={handleAddSelectedDocs}
          disabled={selectedDocsForTask.size === 0}
        >
          Add Selected
        </Button>
      </div>
    </PopoverContent>
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
      <div
        className={`${wrapperClass} rounded-sm`}
        style={{ backgroundColor: `${type.color || "#6B7280"}20` }}
      >
        <span
          className="text-[10px] leading-none font-semibold"
          style={{ color: type.color || "#6B7280" }}
        >
          {type.label?.charAt(0)?.toUpperCase() || "T"}
        </span>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-card">
      {/* ── TOP BAR (replaces DialogPrimitive header + close button) ── */}
      <div className="flex-none bg-card flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <Breadcrumbs />
          {isSubtask && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              Subtask
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Created {formatLocalDate(currentTask.createdAt)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="task-detail-more-btn"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {/* <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="task-detail-branch-btn"
          >
            <GitBranch className="h-4 w-4" />
          </Button> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="task-detail-share-btn"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-b-[5px] border-b-primary"
            >
              <DropdownMenuItem
                onClick={handleCopyTaskLink}
                className="cursor-pointer"
                data-testid="task-detail-copy-link-btn"
              >
                {isMilestone ? "Milestone Link" : "Task Link"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyTaskId}
                className="cursor-pointer"
                data-testid="task-detail-copy-id-btn"
              >
                {isMilestone ? "Milestone ID" : "Task ID"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onOpenInProject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenInProject}
              className="gap-1.5 text-muted-foreground h-8"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Two-column area */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex flex-1 overflow-hidden"
      >
        {/* LEFT PANEL */}
        <ResizablePanel
          defaultSize={70}
          className="flex flex-col overflow-hidden bg-card"
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
            {/* Task Title and Type */}
            <div className="flex flex-col gap-1.5 shrink-0">
              {/* Meta row: type selector + task ID + copy — above the title */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-testid="task-detail-type-select-trigger"
                      className="h-7 px-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {(() => {
                        const selectedType =
                          taskTypes.find(
                            (t) => t.value === (currentTask.taskType || "task"),
                          ) || null;

                        if (!selectedType) {
                          return (
                            <>
                              <span className="text-xs text-primary-foreground">
                                Task
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 text-primary-foreground opacity-70" />
                            </>
                          );
                        }

                        return (
                          <>
                            {renderTaskTypeVisual(
                              selectedType,
                              "w-3 h-3 text-primary-foreground",
                            )}
                            <span className="text-xs text-primary-foreground">
                              {selectedType.label}
                            </span>
                            <ChevronDown className="h-3 w-3 text-primary-foreground opacity-70" />
                          </>
                        );
                      })()}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[50] bg-background"
                  >
                    {taskTypes.map((type) => (
                      <DropdownMenuItem
                        key={type._id || type.value}
                        onSelect={() =>
                          handleUpdateTask({ taskType: type.value })
                        }
                        className="p-0 focus:bg-transparent"
                        data-testid={`task-detail-type-option-${type.value}`}
                      >
                        <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground cursor-pointer">
                          {renderTaskTypeVisual(type, "h-3 w-3")}
                          <span className="truncate">{type.label}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Real Task ID + Copy — merged */}
                <button
                  onClick={handleCopyFormattedTaskId}
                  title={isMilestone ? "Copy milestone ID" : "Copy task ID"}
                  data-testid="task-detail-copy-full-id-btn"
                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted hover:bg-muted/80 px-2 py-1.5 rounded cursor-pointer transition-colors group"
                >
                  {formatTaskId(projectSlug, currentTask.taskNumber)}
                  <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Task Title — full width below meta row */}
              <h1 className="text-sm leading-tight">{currentTask.name}</h1>
            </div>
            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Description</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <History className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <ProseMirrorEditor
                initialContent={currentTask?.description || ""}
                mentionableMembers={mentionableMembers}
                onBlur={(content) => handleUpdateTask({ description: content })}
                placeholder={
                  isMilestone
                    ? "Add milestone description with footnote support..."
                    : "Add task description with footnote support..."
                }
                className="task-description-editor"
                editable={!isReadOnly}
                data-testid="task-detail-description-editor"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {relationships.length === 0 && !selectedRelationType && (
                <RelationshipDropdown
                  variant="action"
                  onSelectType={handleSelectRelationType}
                  data-testid="task-detail-relation-dropdown"
                />
              )}
              {!isSubtask && taskSubtasks.length === 0 && !isAddingSubtask && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs rounded h-8"
                  onClick={() => setIsAddingSubtask(true)}
                  data-testid="task-detail-add-subtask-action-btn"
                >
                  <Plus className="h-3 w-3 mr-1" /> Subtask
                </Button>
              )}
              {(currentTask.linkedDocuments || []).length === 0 && (
                <Popover
                  open={isDocSelectorOpen}
                  onOpenChange={setIsDocSelectorOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs rounded h-8"
                      data-testid="task-detail-add-doc-btn"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Document
                    </Button>
                  </PopoverTrigger>
                  {renderDocSelectorContent()}
                </Popover>
              )}
              {/* <Button variant="secondary" size="sm" className="text-xs rounded h-8"><Plus className="h-3 w-3 mr-1" />Whiteboard</Button> */}
            </div>

            <DiscussionPage
              entityType="task"
              entityId={currentTask.id}
              mentionableMembers={mentionableMembers}
            />

            {/* Linked Documents */}
            {(currentTask.linkedDocuments || []).length > 0 && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">Linked Documents</h3>
                  <Popover
                    open={isDocSelectorOpen}
                    onOpenChange={setIsDocSelectorOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8"
                        data-testid="task-detail-add-doc-section-btn"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Document
                      </Button>
                    </PopoverTrigger>
                    {renderDocSelectorContent()}
                  </Popover>
                </div>
                <div className="space-y-3">
                  {(currentTask.linkedDocuments || []).map((docId) => {
                    const doc = documents.get(docId);
                    if (!doc) return null;
                    const pageCount = getSubPageCount(doc.id);
                    const creator = getDocCreator(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className="flex flex-col border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between p-4">
                          <Link
                            href={`/docs/${doc.id}`}
                            className="flex items-center gap-4 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                          >
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                              {!doc.parentId ? (
                                <img
                                  src="/images/docsidebar.svg"
                                  alt="doc"
                                  className="w-6 h-6"
                                />
                              ) : (
                                <FileText className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                                {doc.title}
                              </h4>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {!doc.parentId && (
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {pageCount} Pages
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  Last updated on:{" "}
                                  {doc.updatedAt
                                    ? new Date(doc.updatedAt).toLocaleString(
                                        "en-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                          hour12: true,
                                        },
                                      )
                                    : "Unknown"}
                                </span>
                              </div>
                            </div>
                          </Link>
                          <div className="flex items-center gap-3">
                            {!doc.parentId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() =>
                                  setExpandedLinkedDocs((p) => {
                                    const n = new Set(p);
                                    n.has(doc.id)
                                      ? n.delete(doc.id)
                                      : n.add(doc.id);
                                    return n;
                                  })
                                }
                                data-testid={`task-detail-expand-doc-btn-${doc.id}`}
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    expandedLinkedDocs.has(doc.id) &&
                                      "rotate-180",
                                  )}
                                />
                              </Button>
                            )}
                            {creator && (
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0 bg-muted flex items-center justify-center relative group/creator">
                                {creator.profilePictureUrl ? (
                                  <img
                                    src={creator.profilePictureUrl}
                                    alt={creator.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {creator.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                )}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-primary-foreground text-[10px] rounded opacity-0 group-hover/creator:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                  {creator.name}
                                </div>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeTaskDocument(currentTask.id, doc.id)
                              }
                              className="h-8 px-6 rounded-full bg-muted text-muted-foreground border-none hover:bg-red-50 hover:text-red-600 transition-all font-medium text-xs"
                              data-testid={`task-detail-unlink-doc-btn-${doc.id}`}
                            >
                              Unlink
                            </Button>
                          </div>
                        </div>
                        {!doc.parentId && expandedLinkedDocs.has(doc.id) && (
                          <div className="px-4 pb-4 space-y-2 border-t pt-3 mt-1">
                            {pageCount > 0 ? (
                              allDocs
                                .filter((d) => d.parentId === doc.id)
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center gap-3 pl-4"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
                                    <span className="text-xs text-muted-foreground">
                                      {p.title}
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <div className="px-4 py-2 text-[10px] text-muted-foreground italic pl-8">
                                No pages found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Relationships */}
            {(selectedRelationType || relationships.length > 0) && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">Relationships</h3>
                  <div className="flex items-center gap-2">
                    <RelationshipDropdown
                      variant="section"
                      onSelectType={handleSelectRelationType}
                      data-testid="task-detail-relation-section-dropdown"
                    />
                    {relationships.length === 0 && selectedRelationType && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setSelectedRelationType(null);
                          setShowTaskSelector(false);
                        }}
                        data-testid="task-detail-relation-cancel-btn"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {selectedRelationType && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <span className="text-xs text-muted-foreground">
                      Select task for{" "}
                      {getRelationshipLabel(selectedRelationType)}
                    </span>
                    <TaskSelector
                      tasks={projectTasks.filter(
                        (t) => t.id !== currentTask.id,
                      )}
                      currentTaskId={currentTask.id}
                      onSelect={handleSelectTask}
                      open={showTaskSelector}
                      onOpenChange={setShowTaskSelector}
                      data-testid="task-detail-relation-task-selector"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRelationType(null);
                        setShowTaskSelector(false);
                      }}
                      data-testid="task-detail-relation-cancel-btn"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {relationships.length > 0 && (
                  <div className="space-y-2">
                    {relationships.map((rel) => {
                      const target = projectTasks.find(
                        (t) => t.id === rel.targetTaskId,
                      );
                      const RelIcon = getRelationshipIcon(rel.type);
                      return (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <RelIcon
                              className={cn(
                                "h-4 w-4",
                                getRelationshipIconColor(rel.type),
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">
                                {getRelationshipLabel(rel.type)}
                              </span>
                              <span className="text-xs font-medium">
                                {target?.name || "Unknown Task"}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleRemoveRelationship(rel.id)}
                            data-testid={`task-detail-relation-remove-btn-${rel.id}`}
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Subtasks */}
            {!isSubtask && (isAddingSubtask || taskSubtasks.length > 0) && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">Subtasks</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8"
                      onClick={() => setIsAddingSubtask(true)}
                      disabled={isAddingSubtask}
                      data-testid="task-detail-add-subtask-btn"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Subtask
                    </Button>
                    {taskSubtasks.length === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setIsAddingSubtask(false);
                          setNewSubtaskName("");
                        }}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Subtasks Table with Inline Add */}
                <SubtaskTable
                  taskSubtasks={taskSubtasks}
                  projectSlug={projectSlug}
                  projectId={projectId}
                  workspaceMembers={workspaceMembers}
                  currentProject={currentProject}
                  updateSubtask={updateSubtask}
                  handleToggleSubtaskComplete={handleToggleSubtaskComplete}
                  handleDeleteSubtask={handleDeleteSubtask}
                  isAddingSubtask={isAddingSubtask}
                  setIsAddingSubtask={setIsAddingSubtask}
                  newSubtaskName={newSubtaskName}
                  setNewSubtaskName={setNewSubtaskName}
                  handleAddSubtask={handleAddSubtask}
                  taskStatusConfigs={taskStatusConfigs}
                  taskPriorityConfigs={taskPriorityConfigs}
                />
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-[2px] bg-muted hover:bg-muted-foreground/50 transition-all" />

        {/* RIGHT SIDEBAR */}
        <ResizablePanel
          defaultSize={30}
          minSize={20}
          maxSize={45}
          className="w-[320px] flex flex-col shrink-0"
        >
          {/* Full-width pill tab switcher */}
          <div className="bg-muted py-1 px-2 flex items-center gap-1">
            {(["properties", "activity"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                data-testid={`task-detail-tab-${tab}`}
                className={`
                                    flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                                    ${
                                      activeTab === tab
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }
                                `}
              >
                {tab === "activity" ? "Activity Log" : "Properties"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "properties" && (
              <div>
                {/* Task Details collapsible section */}
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setIsTaskDetailsExpanded(!isTaskDetailsExpanded)
                    }
                  >
                    <h3 className="text-xs font-semibold">Task Details</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 pointer-events-none"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isTaskDetailsExpanded ? "rotate-180" : "rotate-0",
                        )}
                      />
                    </Button>
                  </div>

                  <div
                    className={cn(
                      "transition-all duration-300 ease-in-out overflow-hidden space-y-1",
                      isTaskDetailsExpanded
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0 pointer-events-none !mt-0",
                    )}
                  >
                    {/* STATUS */}
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                        <LoaderCircle className="h-4 w-4" />
                        Status
                      </Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          className="w-[160px] h-8"
                        >
                          <button
                            className="flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden px-3 cursor-pointer"
                            style={{
                              backgroundColor: (() => {
                                const config = taskStatusConfigs.find(
                                  (s) =>
                                    s.value === currentTask.status ||
                                    s.label === currentTask.status,
                                );
                                return config?.color || "#c4c4c4";
                              })(),
                            }}
                            data-testid="task-detail-status-trigger"
                          >
                            <span className="truncate w-full text-center">
                              {(() => {
                                const config = taskStatusConfigs.find(
                                  (s) =>
                                    s.value === currentTask.status ||
                                    s.label === currentTask.status,
                                );
                                return (
                                  config?.label || currentTask.status || "—"
                                );
                              })()}
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[50] bg-background"
                        >
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdateTask({ status: undefined })
                            }
                            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                          >
                            Clear
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {taskStatusConfigs.map((config) => (
                            <DropdownMenuItem
                              key={config._id}
                              onSelect={() =>
                                handleUpdateTask({ status: config.value })
                              }
                              className="p-0 focus:bg-transparent"
                            >
                              <div
                                className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-semibold transition-opacity hover:opacity-90 px-3 cursor-pointer"
                                style={{
                                  backgroundColor: config.color || "#9CA3AF",
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
                    </div>
                    {/* PRIORITY */}
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                        <Flag className="h-4 w-4" />
                        Priority
                      </Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          className="w-[160px] h-8"
                        >
                          <button
                            className="flex items-center justify-center gap-2 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2 cursor-pointer"
                            style={{
                              backgroundColor: (() => {
                                const config = taskPriorityConfigs.find(
                                  (p) => p.value === currentTask.priority,
                                );
                                return config
                                  ? `${config.color}33`
                                  : "transparent";
                              })(),
                            }}
                            data-testid="task-detail-priority-trigger"
                          >
                            {currentTask.priority ? (
                              <>
                                <span className="truncate text-xs font-medium text-foreground">
                                  {(() => {
                                    const config = taskPriorityConfigs.find(
                                      (p) => p.value === currentTask.priority,
                                    );
                                    return config?.label || currentTask.priority;
                                  })()}
                                </span>
                                <Flag
                                  className="h-3.5 w-3.5 flex-shrink-0"
                                  style={{
                                    color: (() => {
                                      const config = taskPriorityConfigs.find(
                                        (p) => p.value === currentTask.priority,
                                      );
                                      return config?.color || "#9CA3AF";
                                    })(),
                                  }}
                                />
                              </>
                            ) : (
                              <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[50] bg-background"
                        >
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdateTask({ priority: undefined })
                            }
                            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                          >
                            Clear
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {taskPriorityConfigs.map((option) => (
                            <DropdownMenuItem
                              key={option._id}
                              onSelect={() =>
                                handleUpdateTask({ priority: option.value })
                              }
                              className="p-0 focus:bg-transparent"
                            >
                              <div
                                className="w-full h-9 flex items-center justify-between gap-2 rounded-xs text-xs font-medium transition-opacity hover:opacity-90 px-3 text-foreground cursor-pointer"
                                style={{
                                  backgroundColor: `${option.color || "#9CA3AF"}33`,
                                }}
                              >
                                <span className="truncate">
                                  {option.label || option.value}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* START DATE */}
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                        <CalendarIcon className="h-4 w-4" />
                        Start Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild className="w-[160px] h-8">
                          <button
                            className={cn(
                              "flex items-center justify-center rounded-xs text-xs font-medium transition-colors bg-muted hover:bg-muted/85 px-3 cursor-pointer",
                              !currentTask.startDate && "text-muted-foreground",
                            )}
                            data-testid="task-detail-start-date-trigger"
                          >
                            {currentTask.startDate
                              ? formatLocalDate(currentTask.startDate)
                              : <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-2 border-0 border-b-[5px] border-b-primary z-[50]"
                          align="end"
                        >
                          <CalendarPicker
                            selectedDate={convertUTCToCalendarDate(
                              currentTask.startDate,
                            )}
                            onDateSelect={(date) => {
                              if (date) {
                                const newStartDateStr =
                                  convertSelectedDateToUTC(date);
                                const updates: any = {
                                  startDate: newStartDateStr,
                                };
                                const endLocal = convertUTCToCalendarDate(
                                  currentTask.endDate,
                                );
                                if (endLocal && endLocal < date) {
                                  updates.endDate = undefined;
                                }
                                handleUpdateTask(updates);
                              }
                            }}
                          />
                          {currentTask.startDate && (
                            <div className="p-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-red-500"
                                onClick={() =>
                                  handleUpdateTask({ startDate: undefined })
                                }
                              >
                                Clear date
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* DUE DATE */}
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                        <CalendarIcon className="h-4 w-4" />
                        Due Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild className="w-[160px] h-8">
                          <button
                            className={cn(
                              "flex items-center justify-center rounded-xs text-xs font-medium transition-colors bg-muted hover:bg-muted/85 px-3 cursor-pointer",
                              !currentTask.endDate && "text-muted-foreground",
                            )}
                            data-testid="task-detail-due-date-trigger"
                          >
                            {currentTask.endDate
                              ? formatLocalDate(currentTask.endDate)
                              : <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-2 border-0 border-b-[5px] border-b-primary z-[50]"
                          align="end"
                        >
                          <CalendarPicker
                            selectedDate={convertUTCToCalendarDate(
                              currentTask.endDate,
                            )}
                            onDateSelect={(date) => {
                              if (date)
                                handleUpdateTask({
                                  endDate: convertSelectedDateToUTC(date),
                                });
                            }}
                            disabled={(date) => {
                              const startLocal = convertUTCToCalendarDate(
                                currentTask.startDate,
                              );
                              return startLocal
                                ? date <
                                    new Date(startLocal.setHours(0, 0, 0, 0))
                                : false;
                            }}
                          />
                          {currentTask.endDate && (
                            <div className="p-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-red-500"
                                onClick={() =>
                                  handleUpdateTask({ endDate: undefined })
                                }
                              >
                                Clear date
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* ASSIGNEE — uses workspaceMembers like TaskTable */}
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                        <User className="h-4 w-4" />
                        Assignee
                      </Label>
                      <DropdownMenu
                        onOpenChange={(open) => {
                          if (!open) setAssigneeSearchQuery("");
                        }}
                      >
                        <DropdownMenuTrigger
                          asChild
                          className="w-[160px] h-8"
                        >
                          <button
                            className="flex items-center justify-center cursor-pointer bg-muted hover:bg-muted/85 transition-colors overflow-hidden rounded-xs"
                            data-testid="task-detail-assignee-trigger"
                          >
                            {currentTask.assignee ? (
                              (() => {
                                const member = workspaceMembers.find(
                                  (m) => m.userId === currentTask.assignee,
                                );
                                const name =
                                  member?.name || currentTask.assignee;
                                return (
                                  <MemberAvatar
                                    size="md"
                                    name={name}
                                    src={
                                      member?.avatar || member?.profilePicture
                                    }
                                  />
                                );
                              })()
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[50] bg-background"
                        >
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
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {workspaceMembers
                              .filter((wm) =>
                                currentProject?.members?.some(
                                  (pm) => pm.userId === wm.userId,
                                ),
                              )
                              .filter((wm) => {
                                if (!assigneeSearchQuery) return true;
                                const query = assigneeSearchQuery
                                  .toLowerCase()
                                  .replace(/^@/, "");
                                return wm.name?.toLowerCase().includes(query);
                              }).length === 0 ? (
                              <div className="text-center py-2 text-xs text-muted-foreground">
                                No members found
                              </div>
                            ) : (
                              workspaceMembers
                                .filter((wm) =>
                                  currentProject?.members?.some(
                                    (pm) => pm.userId === wm.userId,
                                  ),
                                )
                                .filter((wm) => {
                                  if (!assigneeSearchQuery) return true;
                                  const query = assigneeSearchQuery
                                    .toLowerCase()
                                    .replace(/^@/, "");
                                  return wm.name
                                    ?.toLowerCase()
                                    .includes(query);
                                })
                                .map((member) => (
                                  <DropdownMenuItem
                                    key={member.userId}
                                    onSelect={() =>
                                      handleUpdateTask({
                                        assignee: member.userId,
                                      })
                                    }
                                    className="p-0 focus:bg-transparent"
                                  >
                                    <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground cursor-pointer">
                                      <MemberAvatar
                                        size="sm"
                                        name={member.name}
                                        src={
                                          member.avatar ||
                                          member.profilePicture
                                        }
                                      />
                                      <span className="truncate">
                                        {member.name}
                                      </span>
                                    </div>
                                  </DropdownMenuItem>
                                ))
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdateTask({ assignee: undefined })
                            }
                            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                          >
                            Clear
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <Separator className="my-2" />
                {/* CUSTOM FIELDS SECTION */}
                <div className="space-y-2">
                  {/* Section header with Add button & Collapse toggle */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsCustomFieldsExpanded(!isCustomFieldsExpanded)}
                  >
                    <h3 className="text-xs font-semibold tracking-wide">
                      Custom Fields
                    </h3>
                    <div className="flex items-center gap-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Popover
                          open={showAddFieldPopover}
                          onOpenChange={setShowAddFieldPopover}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title="Add custom field"
                              data-testid="task-detail-add-custom-field-trigger"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[300px] p-0 flex flex-col"
                            align="end"
                            style={{ height: "480px" }}
                          >
                            <FieldTypeSelectContent
                              projectId={projectId}
                              onFieldCreated={() =>
                                setShowAddFieldPopover(false)
                              }
                              onBack={() => setShowAddFieldPopover(false)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 pointer-events-none"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isCustomFieldsExpanded ? "rotate-180" : "rotate-0",
                          )}
                        />
                      </Button>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "transition-all duration-300 ease-in-out overflow-hidden space-y-2",
                      isCustomFieldsExpanded
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0 pointer-events-none !mt-0",
                    )}
                  >
                    {customFields.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No custom fields yet
                      </p>
                    ) : (
                      <>
                        {(showAllCustomFields
                          ? customFields
                          : customFields.slice(0, CUSTOM_FIELDS_PREVIEW_COUNT)
                        ).map((field) => {
                          const fd = getTaskCustomFieldById(
                            projectId,
                            field.id,
                          );
                          if (!fd) return null;
                          const IconComponent = getCustomFieldIcon(field.type);
                          return (
                            <div
                              key={field.id}
                              className="flex items-center justify-between py-1"
                            >
                              <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0 max-w-[45%]">
                                <IconComponent className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{field.name}</span>
                              </Label>
                              <div
                                className="w-[160px]"
                                data-testid={`task-detail-custom-field-dropdown-${field.id}`}
                              >
                                <TaskDetailCustomFieldDropdown
                                  field={fd}
                                  value={
                                    currentTask.customFieldValues?.[field.id] ||
                                    (field.type === "select-many" ||
                                    field.type === "label"
                                      ? []
                                      : "")
                                  }
                                  onUpdate={(v) =>
                                    handleUpdateTask({
                                      customFieldValues: {
                                        ...currentTask.customFieldValues,
                                        [field.id]: v,
                                      },
                                    })
                                  }
                                  task={currentTask}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {customFields.length > CUSTOM_FIELDS_PREVIEW_COUNT && (
                          <button
                            onClick={() => setShowAllCustomFields((p) => !p)}
                            className="w-full flex items-center gap-1.5 py-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            data-testid="task-detail-custom-field-toggle-show-all"
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                showAllCustomFields && "rotate-180",
                              )}
                            />
                            {showAllCustomFields
                              ? "Show less"
                              : `Show ${customFields.length - CUSTOM_FIELDS_PREVIEW_COUNT} more field${customFields.length - CUSTOM_FIELDS_PREVIEW_COUNT > 1 ? "s" : ""}`}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <Separator className="my-2" />
                {/* Labels */}
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
                  >
                    <h3 className="text-sm font-semibold">Labels</h3>
                    <div className="flex items-center gap-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <LabelPicker
                          selectedLabelIds={currentTask.labelIds || []}
                          onSelect={handleSelectLabel}
                          onRemove={handleRemoveLabel}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            data-testid="task-detail-label-picker-trigger"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </LabelPicker>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 pointer-events-none"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isLabelsExpanded ? "rotate-180" : "rotate-0",
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "transition-all duration-300 ease-in-out overflow-hidden space-y-2",
                      isLabelsExpanded
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0 pointer-events-none !mt-0",
                    )}
                  >
                    <div className="flex flex-wrap gap-2">
                      {currentTask.labelIds &&
                      currentTask.labelIds.length > 0 ? (
                        currentTask.labelIds.map((labelId) => {
                          const label = currentWorkspace?.labels?.find(
                            (l) => l.id === labelId,
                          );
                          if (!label) return null;
                          return (
                            <LabelBadge
                              key={labelId}
                              label={label}
                              onRemove={() => handleRemoveLabel(labelId)}
                              removeButtonTestId={`task-detail-label-remove-${labelId}`}
                            />
                          );
                        })
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          No labels assigned yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Separator className="my-2" />
                <TaskAttachments
                  taskId={currentTask.id}
                  attachments={currentTask.attachments ?? []}
                />
              </div>
            )}
            {activeTab === "activity" && (
              <div className="space-y-4">
                <SharedActivityLog
                  entityType="task"
                  entityId={currentTask.id}
                />
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
