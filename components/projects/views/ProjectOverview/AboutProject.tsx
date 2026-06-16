"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import {
  Hash,
  Plus,
  Flag,
  User,
  X,
  FileText,
  SquareArrowOutUpRight,
  Calendar as CalendarIcon,
  Users,
  Hexagon,
  BadgeCent,
  Upload,
  Paperclip,
  Check,
  ChevronDown,
  Type,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useDocStore } from "@/stores/useDoc-store";
import { useTasksStore } from "@/stores/tasks-store";
import { LabelPicker } from "@/components/shared/labels/LabelPicker";
import { LabelBadge } from "@/components/shared/labels/LabelBadge";
import { Tag } from "lucide-react";
import { uploadFile, getUpload } from "@/lib/api/uploads-api";
import { updateDocument as updateDocumentApi } from "@/lib/api/documents-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarPicker } from "@/components/CalendarPicker";
import { Separator } from "@/components/ui/separator";
import {
  formatLocalDate,
  convertSelectedDateToUTC,
  convertUTCToCalendarDate,
} from "@/utils/timezone-utils";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";
import AttachFileModal from "@/components/disucssions/AttachFileModal";
import { ProjectAttachments } from "./ProjectAttachments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePortfoliosStore } from "@/stores/portfolios-store";

interface AboutProjectProps {
  projectDescription?: string;
  projectName?: string;
  projectLeader?: {
    name?: string;
    avatar?: string | null;
  };
  projectPriority?: string;
  projectStatus?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  projectId?: string;
  workspaceId?: string;
  customFieldValues?: Record<string, string>;
}

import { FileAttachment } from "@/types/attachment.types";

export default function AboutProject({
  projectDescription = "",
  projectName = "",
  projectLeader = {},
  projectPriority = "medium",
  projectStatus = "active",
  projectStartDate,
  projectEndDate,
  projectId,
  workspaceId,
  customFieldValues = {},
}: AboutProjectProps) {
  const [content, setContent] = useState(projectDescription);
  const [charCount, setCharCount] = useState(0);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);

  const [isLinkedItemsExpanded, setIsLinkedItemsExpanded] = useState(false);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false);
  const [isAboutProjectExpanded, setIsAboutProjectExpanded] = useState(false);
  const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);
  const [isProjectDetailsExpanded, setIsProjectDetailsExpanded] =
    useState(true);
  const [isCustomFieldsExpanded, setIsCustomFieldsExpanded] = useState(false);
  const [openPopoverFieldId, setOpenPopoverFieldId] = useState<string | null>(
    null,
  );
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [leaderSearchQuery, setLeaderSearchQuery] = useState("");

  const { user: profile } = useProfileStore();
  const {
    projects,
    updateProject,
    updateProjectPriority,
    updateProjectDates,
    updateProjectCustomFieldValue,
    updateProjectPhase,
    attachUploadsToProject,
    removeUploadsFromProject,
    getProjectPriorityConfigs,
    updateProjectLabels,
    updateProjectLeaders,
  } = useProjectsStore();
  const { portfolios, fetchPortfolios } = usePortfoliosStore();
  const {
    documents,
    addProjectToDocument,
    removeProjectFromDocument,
    fetchRootDocuments,
  } = useDocStore();

  const {
    workspaceCustomFieldsConfig,
    currentWorkspace,
    workspaceMembers,
    projectPhases,
    fetchWorkspaceCustomFieldsConfig,
  } = useWorkspaceStore();

  const { tasks, fetchTasks } = useTasksStore();

  const resolvedWorkspaceId = workspaceId || currentWorkspace?.id || "";
  const workspaceCustomFields =
    workspaceCustomFieldsConfig[resolvedWorkspaceId] || [];

  // Get current project
  const currentProject = projects.find((p) => p.id === projectId);

  const projectCustomFieldValues = currentProject?.customFieldValues ?? {};

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRootDocuments();
  }, [fetchRootDocuments]);

  const [projectAttachments, setProjectAttachments] = useState<
    FileAttachment[]
  >([]);
  const visibleAttachments = showAll
    ? projectAttachments
    : projectAttachments.slice(0, 2);

  // Sync attachments from the store to component state
  useEffect(() => {
    const projAttachmentsList = currentProject?.attachments || [];
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const taskAttachmentsList = projectTasks.flatMap(
      (t) => t.attachments || [],
    );

    const allAttachments = [...projAttachmentsList, ...taskAttachmentsList];

    if (!allAttachments.length) {
      setProjectAttachments([]);
      return;
    }

    const resolved = allAttachments
      .filter(Boolean)
      .map((att: any, index: number) => {
        const isString = typeof att === "string";
        const attId = isString ? att : att.id || att._id;

        // Use fileName from project store or name/id as fallback
        const fileName = isString
          ? attId
          : att.fileName || att.name || att.id || "Unknown";

        const uploaderId = !isString
          ? typeof att.uploadedBy === "string"
            ? att.uploadedBy
            : att.uploadedBy?.id || att.uploadedBy?._id || att.uploadedBy
          : "";

        const uploader = workspaceMembers.find((m) => m.userId === uploaderId);

        return {
          id: attId || `unknown-${index}`,
          name: fileName,
          size:
            !isString && att.fileSize
              ? `${Math.round(att.fileSize / 1024)} KB`
              : "0 KB",
          type: !isString ? att.mimeType || "unknown" : "unknown",
          uploadedOn:
            !isString && att.createdAt ? formatLocalDate(att.createdAt) : "",
          uploadedBy: {
            name: uploader?.name || "Unknown",
            id: uploaderId,
          },
        };
      });

    setProjectAttachments(resolved as FileAttachment[]);
  }, [currentProject?.attachments, tasks, projectId, workspaceMembers]);

  // Get current project's linked docs
  const linkedDocs = useMemo(() => {
    if (!projectId) return [];
    return Array.from(documents.values()).filter(
      (doc) => doc.linkedProjects?.includes(projectId) && !doc.parentId,
    );
  }, [documents, projectId]);

  // Get available docs not yet linked
  const availableDocs = useMemo(() => {
    if (!projectId) return [];
    return Array.from(documents.values()).filter(
      (doc) => !doc.linkedProjects?.includes(projectId) && !doc.parentId,
    );
  }, [documents, projectId]);

  useMemo(() => {
    if (currentProject) {
      console.log("[AboutProject Date Debug]:", {
        projectId,
        rawStartDate: currentProject.startDate,
        rawEndDate: currentProject.endDate,
        timeZone: profile?.preferences?.timeZone,
        dateFormat: profile?.preferences?.dateFormat,
        calendarStartDate: currentProject.startDate
          ? convertUTCToCalendarDate(currentProject.startDate)
          : undefined,
        calendarEndDate: currentProject.endDate
          ? convertUTCToCalendarDate(currentProject.endDate)
          : undefined,
      });
    }
  }, [
    currentProject?.startDate,
    currentProject?.endDate,
    profile?.preferences?.timeZone,
  ]);

  const getTextLength = (html: string): number => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent?.trim().length || 0;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setCharCount(getTextLength(newContent));
  };

  const mentionableMembers = useMemo(() => {
    if (!currentProject?.members || !workspaceMembers) return [];

    // Create a set of project member user IDs for efficient lookup
    const projectUserIds = new Set(currentProject.members.map((m) => m.userId));

    // Filter workspace members to only those who are in the project
    return workspaceMembers
      .filter((m) => projectUserIds.has(m.userId))
      .map((m) => ({
        id: m.userId,
        name: m.name,
        avatar: m.avatar || m.profilePicture || "",
      }));
  }, [currentProject?.members, workspaceMembers]);

  const filteredLeaders = useMemo(() => {
    return workspaceMembers.filter((m) => {
      if (!leaderSearchQuery) return true;
      const q = leaderSearchQuery.startsWith("@")
        ? leaderSearchQuery.slice(1)
        : leaderSearchQuery;
      return m.name.toLowerCase().includes(q.toLowerCase());
    });
  }, [workspaceMembers, leaderSearchQuery]);

  useEffect(() => {
    if (projectDescription) {
      setContent(projectDescription);
      setCharCount(getTextLength(projectDescription));
    }
  }, [projectDescription]);

  useEffect(() => {
    if (resolvedWorkspaceId && workspaceCustomFields.length === 0) {
      // Already imported: fetchWorkspaceCustomFieldsConfig
      // Add to destructuring from useWorkspaceStore:
      fetchWorkspaceCustomFieldsConfig(resolvedWorkspaceId);
    }
  }, [resolvedWorkspaceId]);
  const handleAttachFiles = async (files: File[]) => {
    if (!projectId) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadFile(file));
      const results = await Promise.all(uploadPromises);

      const uploadIds = results.map((r) => r.id);
      await attachUploadsToProject(projectId, uploadIds);

      setIsAttachModalOpen(false);
    } catch (error: any) {
      toast("error", { title: error?.message || "Failed to upload files" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const uploadData = await getUpload(id);
      if (uploadData.presignedUrl) {
        const response = await fetch(uploadData.presignedUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = (uploadData as any).fileName || "file";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
    } catch (error) {
      console.error("Failed to download file:", error);
      toast("error", { title: "Failed to download file" });
    }
  };

  const handleView = async (id: string) => {
    try {
      const uploadData = await getUpload(id);
      if (uploadData.presignedUrl) {
        window.open(uploadData.presignedUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to view file:", error);
      toast("error", { title: "Failed to view file" });
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!projectId) return;
    try {
      await removeUploadsFromProject(projectId, [attachmentId]);
    } catch (error) {
      toast("error", { title: "Failed to delete attachment" });
      throw error;
    }
  };

  const handleAddDocument = async (docId: string) => {
    if (projectId) {
      addProjectToDocument(docId, projectId);
      try {
        const doc = documents.get(docId);
        if (doc) {
          const currentProjects = doc.linkedProjects || [];
          if (!currentProjects.includes(projectId)) {
            await updateDocumentApi(docId, {
              linkedProjects: [...currentProjects, projectId],
            });
          }
        }
      } catch (err: any) {
        toast("error", { title: err?.message ?? "Failed to link document" });
      }
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    if (projectId) {
      removeProjectFromDocument(docId, projectId);
      try {
        const doc = documents.get(docId);
        if (doc) {
          const currentProjects = doc.linkedProjects || [];
          await updateDocumentApi(docId, {
            linkedProjects: currentProjects.filter((id) => id !== projectId),
          });
        }
      } catch (err: any) {
        toast("error", { title: err?.message ?? "Failed to unlink document" });
      }
    }
  };

  // Update handlers
  const handleUpdateStatus = (status: string) => {
    if (projectId) {
      updateProject(projectId, { status: status as any });
    }
  };

  const handleUpdatePriority = (priority: string) => {
    if (projectId) {
      updateProjectPriority(projectId, priority);
    }
  };

  const handleUpdateStartDate = (date: Date | undefined) => {
    if (projectId && date) {
      const utcStr = convertSelectedDateToUTC(date);
      updateProjectDates(projectId, utcStr, currentProject?.endDate);
    }
  };

  const handleUpdateEndDate = (date: Date | undefined) => {
    if (projectId && date) {
      console.log("selected date is ", date);
      const utcStr = convertSelectedDateToUTC(date);
      console.log("new date is ", utcStr);
      updateProjectDates(projectId, currentProject?.startDate, utcStr);
    }
  };

  const handleUpdateLeader = (userId: string) => {
    if (!projectId || !currentProject) return;

    const currentLeaders = currentProject.leaders || [];
    const isLeader =
      currentLeaders.includes(userId) ||
      currentProject.projectLeader === userId;

    if (isLeader) {
      // Prevent self-leader removal
      if (userId === profile?.id) {
        toast("error", { title: "You cannot remove yourself as a leader" });
        return;
      }
      const newLeaders = currentLeaders.filter((id) => id !== userId);
      updateProjectLeaders(projectId, newLeaders);
    } else {
      const newLeaders = [...currentLeaders, userId];
      updateProjectLeaders(projectId, newLeaders);
    }
  };

  const assignedLabels = useMemo(() => {
    const workspaceLabels = currentWorkspace?.labels || [];
    const projectLabelIds =
      currentProject?.labelIds ||
      currentProject?.labels?.map((l) => l.id) ||
      [];
    return workspaceLabels.filter((label) =>
      projectLabelIds.includes(label.id),
    );
  }, [currentProject, currentWorkspace]);

  const handleSelectLabel = async (labelId: string) => {
    if (!projectId) return;
    const currentIds = assignedLabels.map((l) => l.id);
    if (!currentIds.includes(labelId)) {
      const newLabelIds = [...currentIds, labelId];
      await updateProjectLabels(projectId, newLabelIds);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!projectId) return;
    const newLabelIds = assignedLabels
      .filter((l) => l.id !== labelId)
      .map((l) => l.id);
    await updateProjectLabels(projectId, newLabelIds);
  };

  const statusColors = {
    active: "bg-green-100 text-green-700",
    planning: "bg-blue-100 text-blue-700",
    "on-hold": "bg-orange-100 text-orange-700",
    completed: "bg-muted text-foreground",
  };

  // Get avatar color
  const getAvatarColor = (name: string): string => {
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Priority options — from project config, fallback to empty
  const projectPriorityConfigs = projectId
    ? getProjectPriorityConfigs(projectId)
    : [];

  const priorityLevels =
    projectPriorityConfigs.length > 0
      ? projectPriorityConfigs.map((p) => ({
          value: p.value,
          label: p.label,
          color: p.color, // use raw hex color
        }))
      : [];

  const assignedPhase =
    projectPhases
      .flatMap((p) => [p, ...(p.children || [])])
      .find((p) => p.value === currentProject?.phase) ?? null;

  return (
    <div className="space-y-3">
      {/* Project Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Project Details</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              setIsProjectDetailsExpanded(!isProjectDetailsExpanded)
            }
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isProjectDetailsExpanded ? "rotate-180" : "rotate-0",
              )}
            />
          </Button>
        </div>

        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden space-y-2",
            isProjectDetailsExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none !mt-0",
          )}
        >
          {/* ✅ State - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <Hexagon className="h-4 w-4" />
              Phase
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 transition-opacity hover:opacity-90 overflow-hidden px-2 rounded-xs flex items-center justify-center text-xs font-semibold w-[150px] cursor-pointer text-foreground",
                    !assignedPhase && "text-muted-foreground bg-secondary",
                  )}
                  style={
                    assignedPhase
                      ? {
                          backgroundColor: assignedPhase.color || "#c4c4c4",
                        }
                      : {}
                  }
                >
                  {assignedPhase ? (
                    <span className="truncate w-full text-center">
                      {assignedPhase.label}
                    </span>
                  ) : (
                    <Hexagon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary bg-background"
              >
                <DropdownMenuItem
                  onClick={() => projectId && updateProjectPhase(projectId, "")}
                  className="p-0 focus:bg-transparent"
                >
                  <div className="w-full h-9 flex items-center justify-center rounded-xs text-xs font-semibold hover:bg-muted transition-colors px-3 bg-muted text-muted-foreground cursor-pointer">
                    Clear
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {projectPhases.map((phase) => (
                  <React.Fragment key={phase._id}>
                    <DropdownMenuItem
                      onClick={() =>
                        projectId && updateProjectPhase(projectId, phase.value)
                      }
                      className="p-0 focus:bg-transparent"
                    >
                      <div
                        className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-semibold transition-opacity hover:opacity-90 px-3 cursor-pointer"
                        style={{ backgroundColor: phase.color || "#c4c4c4" }}
                      >
                        <span className="truncate w-full text-center">
                          {phase.label}
                        </span>
                      </div>
                    </DropdownMenuItem>
                    {phase.children?.map((child) => (
                      <DropdownMenuItem
                        key={child._id}
                        onClick={() =>
                          projectId &&
                          updateProjectPhase(projectId, child.value)
                        }
                        className="p-0 focus:bg-transparent"
                      >
                        <div
                          className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-semibold transition-opacity hover:opacity-90 pl-6 pr-3 cursor-pointer mt-1"
                          style={{ backgroundColor: child.color || "#c4c4c4" }}
                        >
                          <span className="truncate w-full text-center">
                            {child.label}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ✅ Priority - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <Flag className="h-4 w-4" />
              Priority
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 transition-opacity hover:opacity-90 overflow-hidden px-2 rounded-xs flex items-center justify-center text-xs font-medium w-[150px] cursor-pointer",
                    !projectPriority && "text-muted-foreground bg-secondary",
                  )}
                  style={
                    projectPriority
                      ? {
                          backgroundColor: (() => {
                            const matched = projectPriorityConfigs.find(
                              (p) => p.value === projectPriority,
                            );
                            return matched ? matched.color + "33" : "#e5e7eb33";
                          })(),
                        }
                      : {}
                  }
                >
                  {projectPriority ? (
                    (() => {
                      const matched = projectPriorityConfigs.find(
                        (p) => p.value === projectPriority,
                      );
                      return (
                        <div className="flex items-center justify-between w-full gap-2 px-1">
                          <span className="text-foreground">
                            {matched ? matched.label : projectPriority}
                          </span>
                          <Flag
                            className="h-3.5 w-3.5 flex-shrink-0"
                            style={{
                              color: matched ? matched.color : "#6b7280",
                            }}
                          />
                        </div>
                      );
                    })()
                  ) : (
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary"
              >
                {priorityLevels.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-muted-foreground italic">
                    No priorities configured
                  </div>
                ) : (
                  priorityLevels.map((level) => (
                    <DropdownMenuItem
                      key={level.value}
                      onSelect={() => handleUpdatePriority(level.value)}
                      className="h-9 text-xs font-medium rounded-xs cursor-pointer px-2 flex items-center justify-between gap-2 w-full focus:opacity-80"
                      style={{
                        backgroundColor: `${level.color}33`,
                      }}
                    >
                      <span className="text-foreground">{level.label}</span>
                      <Flag
                        className="h-3.5 w-3.5 flex-shrink-0"
                        style={{ color: level.color }}
                      />
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ✅ Start Date - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <CalendarIcon className="h-4 w-4" />
              Start Date
            </Label>
            <Popover
              open={isStartDatePopoverOpen}
              onOpenChange={setIsStartDatePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-8 px-3 font-normal hover:bg-muted text-xs w-[150px] flex items-center justify-center rounded-xs cursor-pointer",
                    !currentProject?.startDate && "text-muted-foreground",
                  )}
                >
                  {currentProject?.startDate ? (
                    formatLocalDate(currentProject.startDate)
                  ) : (
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2 border-0 border-b-[5px] border-primary"
                align="end"
              >
                <CalendarPicker
                  selectedDate={
                    currentProject?.startDate
                      ? convertUTCToCalendarDate(currentProject.startDate)
                      : undefined
                  }
                  onDateSelect={(date) => {
                    handleUpdateStartDate(date);
                    setIsStartDatePopoverOpen(false);
                  }}
                  disabled={(date) => {
                    const endDateCal = currentProject?.endDate
                      ? convertUTCToCalendarDate(currentProject.endDate)
                      : undefined;
                    return endDateCal ? date > endDateCal : false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ✅ End Date - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <CalendarIcon className="h-4 w-4" />
              End Date
            </Label>
            <Popover
              open={isEndDatePopoverOpen}
              onOpenChange={setIsEndDatePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-8 px-3 font-normal hover:bg-muted text-xs w-[150px] flex items-center justify-center rounded-xs cursor-pointer",
                    !currentProject?.endDate && "text-muted-foreground",
                  )}
                >
                  {currentProject?.endDate ? (
                    formatLocalDate(currentProject.endDate)
                  ) : (
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2 border-0 border-b-[5px] border-primary"
                align="end"
              >
                <CalendarPicker
                  selectedDate={
                    currentProject?.endDate
                      ? convertUTCToCalendarDate(currentProject.endDate)
                      : undefined
                  }
                  onDateSelect={(date) => {
                    handleUpdateEndDate(date);
                    setIsEndDatePopoverOpen(false);
                  }}
                  disabled={(date) => {
                    const startDateCal = currentProject?.startDate
                      ? convertUTCToCalendarDate(currentProject.startDate)
                      : undefined;
                    return startDateCal ? date < startDateCal : false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ✅ Leader - Multi-Avatar Display */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <User className="h-4 w-4" />
              Leaders
            </Label>
            <DropdownMenu
              onOpenChange={(open) => {
                if (!open) setLeaderSearchQuery("");
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-8 px-2 hover:bg-muted flex items-center justify-center gap-1 text-xs w-[150px] rounded-xs cursor-pointer",
                    (!currentProject?.leaders ||
                      currentProject.leaders.length === 0) &&
                      !currentProject?.projectLeader &&
                      "text-muted-foreground",
                  )}
                >
                  {(() => {
                    const leaderIds = currentProject?.leaders?.length
                      ? currentProject.leaders
                      : currentProject?.projectLeader
                        ? [currentProject.projectLeader]
                        : [];

                    if (leaderIds.length === 0) {
                      return <User className="h-4 w-4 text-muted-foreground" />;
                    }

                    return (
                      <div className="flex -space-x-2 overflow-hidden">
                        {leaderIds.map((id, i) => {
                          const m = workspaceMembers.find(
                            (member) => member.userId === id,
                          );
                          return (
                            <Avatar
                              key={id}
                              className="h-6 w-6 border-0"
                              style={{ zIndex: 10 - i }}
                              title={m?.name}
                            >
                              {m?.profilePicture && (
                                <AvatarImage src={m.profilePicture} />
                              )}
                              <AvatarFallback
                                className="text-white text-xs font-semibold"
                                style={{
                                  backgroundColor: getAvatarColor(
                                    m?.name || "U",
                                  ),
                                }}
                              >
                                {m?.name?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                    );
                  })()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary"
              >
                <div
                  className="px-1 pb-2"
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Input
                    placeholder="Type @ or name..."
                    value={leaderSearchQuery}
                    onChange={(e) => setLeaderSearchQuery(e.target.value)}
                    className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredLeaders.length === 0 ? (
                    <div className="text-center py-2 text-xs text-muted-foreground">
                      No members found
                    </div>
                  ) : (
                    filteredLeaders.map((member) => {
                      const isLeader =
                        (currentProject?.leaders || []).includes(
                          member.userId,
                        ) || currentProject?.projectLeader === member.userId;
                      return (
                        <DropdownMenuItem
                          key={member.userId}
                          onSelect={() => handleUpdateLeader(member.userId)}
                          className="p-0 focus:bg-transparent"
                        >
                          <div className="w-full h-9 flex items-center justify-between rounded-xs text-xs font-medium hover:bg-muted transition-colors px-2 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border-0">
                                {member.profilePicture && (
                                  <AvatarImage src={member.profilePicture} />
                                )}
                                <AvatarFallback
                                  className="text-white text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: getAvatarColor(
                                      member.name,
                                    ),
                                  }}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[100px]">
                                {member.name}
                              </span>
                            </div>
                            {isLeader && (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Workspace Custom Fields - Left-Right Alignment */}
      {workspaceCustomFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Custom Fields</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCustomFieldsExpanded(!isCustomFieldsExpanded)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isCustomFieldsExpanded ? "rotate-180" : "rotate-0",
                )}
              />
            </Button>
          </div>

          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden space-y-2",
              isCustomFieldsExpanded
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0 pointer-events-none !mt-0",
            )}
          >
            {workspaceCustomFields.map((field) => {
              const fieldId = field._id || "";
              const fieldKey = field.name || field.label || "";
              const currentValue = projectCustomFieldValues[fieldKey] ?? "";

              // Pick the icon matching the field type
              const FieldIcon =
                field.type === "text"
                  ? Type
                  : field.type === "number"
                    ? Hash
                    : field.type === "date"
                      ? CalendarCheck
                      : field.type === "dropdown"
                        ? CheckCircle2
                        : Hash;

              return (
                <div
                  key={fieldId}
                  className="flex items-center justify-between"
                >
                  <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                    <FieldIcon className="h-4 w-4" />
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>

                  {/* text — string value */}
                  {field.type === "text" && (
                    <div className="relative w-[150px]">
                      <Input
                        placeholder=" "
                        defaultValue={currentValue}
                        onBlur={(e) =>
                          projectId &&
                          updateProjectCustomFieldValue(
                            projectId,
                            fieldId,
                            fieldKey,
                            e.target.value,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-8 w-full text-xs rounded-xs peer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
                        <Type className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* number — send as number, not string */}
                  {field.type === "number" && (
                    <div className="relative w-[150px]">
                      <Input
                        type="number"
                        placeholder=" "
                        defaultValue={currentValue}
                        onBlur={(e) =>
                          projectId &&
                          updateProjectCustomFieldValue(
                            projectId,
                            fieldId,
                            fieldKey,
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-8 w-full text-xs rounded-xs peer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* date — send as ISO date string */}
                  {field.type === "date" && (
                    <Popover
                      open={openPopoverFieldId === fieldId}
                      onOpenChange={(open) =>
                        setOpenPopoverFieldId(open ? fieldId : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className={cn(
                            "h-8 px-3 font-normal hover:bg-muted text-xs w-[150px] flex items-center justify-center rounded-xs cursor-pointer",
                            !currentValue && "text-muted-foreground",
                          )}
                        >
                          {currentValue ? (
                            formatLocalDate(currentValue)
                          ) : (
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-auto p-2 border-0 border-b-[5px] border-primary"
                      >
                        <CalendarPicker
                          selectedDate={
                            currentValue
                              ? convertUTCToCalendarDate(currentValue)
                              : undefined
                          }
                          onDateSelect={(date) => {
                            if (date && projectId) {
                              updateProjectCustomFieldValue(
                                projectId,
                                fieldId,
                                fieldKey,
                                convertSelectedDateToUTC(date),
                              );
                              setOpenPopoverFieldId(null);
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* dropdown — send option value string */}
                  {field.type === "dropdown" &&
                    field.options &&
                    field.options.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 px-3 text-xs w-[150px] flex items-center justify-center rounded-xs cursor-pointer hover:opacity-90 transition-opacity",
                              !currentValue &&
                                "text-muted-foreground bg-secondary",
                            )}
                            style={
                              currentValue
                                ? { backgroundColor: "hsl(var(--muted))" }
                                : {}
                            }
                          >
                            <span className="truncate">
                              {currentValue ? (
                                field.options.find(
                                  (o) => o.value === currentValue,
                                )?.label || currentValue
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                              )}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary bg-background"
                        >
                          <DropdownMenuItem
                            onSelect={() =>
                              projectId &&
                              updateProjectCustomFieldValue(
                                projectId,
                                fieldId,
                                fieldKey,
                                "",
                              )
                            }
                            className="p-0 focus:bg-transparent"
                          >
                            <div className="w-full h-9 flex items-center justify-center rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-muted-foreground">
                              Clear
                            </div>
                          </DropdownMenuItem>
                          {field.options.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onSelect={() =>
                                projectId &&
                                updateProjectCustomFieldValue(
                                  projectId,
                                  fieldId,
                                  fieldKey,
                                  option.value,
                                )
                              }
                              className="p-0 focus:bg-transparent"
                            >
                              <div className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted">
                                {option.label}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                  {/* fallback for unknown types */}
                  {!["text", "number", "date", "dropdown"].includes(
                    field.type,
                  ) && <span className="text-xs text-muted-foreground">—</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Separator className="my-4" />

      {/* Labels */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Labels</Label>
          <div className="flex items-center gap-1">
            <LabelPicker
              selectedLabelIds={assignedLabels.map((l) => l.id)}
              onSelect={handleSelectLabel}
              onRemove={handleRemoveLabel}
            >
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3 w-3" />
              </Button>
            </LabelPicker>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
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
            "transition-all duration-300 ease-in-out overflow-hidden",
            isLabelsExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none !mt-0",
          )}
        >
          <div className="flex flex-wrap gap-2">
            {assignedLabels.length > 0 ? (
              assignedLabels.map((label) => (
                <LabelBadge
                  key={label.id}
                  label={label}
                  onRemove={handleRemoveLabel}
                />
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic">
                No labels assigned yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* About this Project */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">About this Project</Label>
          <div className="flex items-center gap-2">
            {charCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {charCount} chars
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsAboutProjectExpanded(!isAboutProjectExpanded)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isAboutProjectExpanded ? "rotate-180" : "rotate-0",
                )}
              />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isAboutProjectExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none !mt-0",
          )}
        >
          <TooltipProvider>
            <ProseMirrorEditor
              initialContent={content}
              mentionableMembers={mentionableMembers}
              onBlur={(newContent) => {
                if (projectId) {
                  updateProject(projectId, { description: newContent });
                }
              }}
              placeholder="Add project description..."
            />
          </TooltipProvider>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Linked Items Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Linked Items</Label>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0">
                {linkedDocs.length > 0 && (
                  <>
                    <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                      Linked Documents
                    </div>
                    {/* linked docs */}
                    <div className="max-h-48 overflow-y-auto p-2">
                      {linkedDocs.map((doc) => (
                        <DropdownMenuItem
                          key={doc.id}
                          className="cursor-pointer flex items-center justify-between group px-2 py-2 hover:bg-muted"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="truncate text-xs">
                              {doc.title}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDocument(doc.id);
                            }}
                          >
                            <X className="w-3 h-3 text-red-500" />
                          </Button>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <div className="h-px bg-border" />
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted cursor-pointer text-xs text-foreground mx-1 my-1">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      <span>Link Docs</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="right"
                    className="w-56 p-0"
                  >
                    {availableDocs.length > 0 ? (
                      <>
                        {/* Fixed header outside scroll */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                          Available Documents
                        </div>
                        {/* Single scroll container */}
                        <div className="max-h-52 overflow-y-auto">
                          {availableDocs.map((doc) => (
                            <DropdownMenuItem
                              key={doc.id}
                              onClick={() => handleAddDocument(doc.id)}
                              className="cursor-pointer px-2 py-2"
                            >
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span className="truncate">{doc.title}</span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-xs text-muted-foreground text-center">
                        No documents available to link
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {linkedDocs.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground italic">
                    No documents linked yet
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsLinkedItemsExpanded(!isLinkedItemsExpanded)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isLinkedItemsExpanded ? "rotate-180" : "rotate-0",
                )}
              />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isLinkedItemsExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none !mt-0",
          )}
        >
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {linkedDocs.length > 0 ? (
              linkedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between p-2 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium truncate">
                      {doc.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/docs/${doc.id}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <SquareArrowOutUpRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="h-6 w-6 text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic">
                No items linked yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Attachments */}
      <div className="space-y-3 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">Attachments</Label>

            {projectAttachments.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {projectAttachments.length} items
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {projectAttachments.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(true)}
                className="p-2 rounded-md bg-muted hover:bg-muted transition"
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isAttachmentsExpanded ? "rotate-180" : "rotate-0",
                )}
              />
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isAttachmentsExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none !mt-0",
          )}
        >
          {projectAttachments.length === 0 ? (
            <div
              className="rounded-lg p-6 text-center bg-muted cursor-pointer hover:bg-muted transition"
              onClick={() => setIsAttachModalOpen(true)}
              role="button"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-brand-orange" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium">Upload sources</p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or{" "}
                    <span className="text-brand-orange cursor-pointer">
                      choose file
                    </span>{" "}
                    to upload
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
                showAll ? "max-h-250 opacity-100" : "max-h-50 opacity-100"
              }`}
            >
              {visibleAttachments.map((file) => (
                <ProjectAttachments
                  key={file.id}
                  file={file}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}

              {projectAttachments.length > 2 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-muted-foreground text-center font-medium hover:underline"
                  >
                    {showAll
                      ? "Show less"
                      : `Show more (${projectAttachments.length - 2})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <AttachFileModal
          open={isAttachModalOpen}
          onClose={() => setIsAttachModalOpen(false)}
          onAttach={handleAttachFiles}
        />
      </div>
    </div>
  );
}
