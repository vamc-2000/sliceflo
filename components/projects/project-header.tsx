// components/projects/project-header.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { formatLocalDate } from "@/utils/timezone-utils";
import {
  MoreHorizontal,
  Calendar,
  Settings,
  List,
  Grid3x3,
  Flag,
  Users,
  SquareKanban,
  ChartGantt,
  Pencil,
  Copy,
  Palette,
  Layers,
  MoreVertical,
  Link,
  Activity,
  History,
  FolderPlus,
  Upload,
  Archive,
  Trash2,
  ChevronRight,
  Check,
  X,
  Download,
  FileJson,
  FileText,
  Printer,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ViewTabs } from "./view-tabs";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTeamStore } from "@/stores/teams-store";
import ProjectViewersSection from "./ProjectViewersSection";
import ProjectInviteDialog from "./ProjectInviteDialog";
import { ProjectIconAvatar } from "./ProjectIconAvatar";
import { cn } from "@/lib/utils";
import ColorIconPicker, {
  IconData,
  iconLibrary,
} from "@/components/ColorIconPicker";
import { uploadIcon, uploadFile, deleteUpload } from "@/lib/api/uploads-api";
import { toast } from "@/components/ui/sonner";
import { TestLoaderDropdown } from "@/components/TestLoader";
import DuplicateProjectDialog from "@/components/projects/DuplicateProjectDialog";
import { DefaultTaskValuesDialog } from "@/components/projects/DefaultTaskValuesDialog";
import { CreateTaskByEmailDialog } from "@/components/projects/CreateTaskByEmailDialog";
import { ImportDialog } from "@/components/projects/ImportDialog";
import ArchiveProjectModal from "@/components/projects/ArchiveProjectModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useImpler } from "@impler/react";
import { useImportStore } from "@/stores/import-store";
import { useTasksStore } from "@/stores/tasks-store";

interface ProjectHeaderProps {
  projectName: string;
  update?: string;
  // viewers?: number;
  projectId: string;
  onCollapseAllGroups?: (() => void) | null;
  onExpandAllGroups?: (() => void) | null;
  onToggleHideEmptyGroups?: (() => void) | null;
  collapsedGroupsCount?: number;
  totalGroupsCount?: number;
  allGroupsCollapsed?: boolean;
  hideEmptyGroups?: boolean;
  onExportCSV?: (() => void) | null;
  onExportExcel?: (() => void) | null;
  onPrint?: (() => void) | null;
  onActivityLogClick?: () => void;
}

export function ProjectHeader({
  projectName,
  update,
  // viewers= 1,
  projectId,
  onCollapseAllGroups,
  onExpandAllGroups,
  onToggleHideEmptyGroups,
  collapsedGroupsCount = 0,
  totalGroupsCount = 0,
  allGroupsCollapsed = false,
  hideEmptyGroups = false,
  onExportCSV,
  onExportExcel,
  onPrint,
  onActivityLogClick,
}: ProjectHeaderProps) {
  const router = useRouter();
  const {
    projects,
    fetchProjectById,
    addViewersToProject,
    removeViewersFromProject,
    // updateProjectPriority,
    // updateProjectDates,
    // duplicateProject,
    renameProject, // ✅ Now async with API call
    updateProjectStatus, // ✅ Now async with API call
    updateProjectIcon, // ✅ NEW
    archiveProject, // ✅ NEW
    deleteProject, // ✅ NEW
    isLoading,
    getProjectPriorityConfigs,
  } = useProjectsStore();

  const { fetchWorkspaceMembers, workspaceMembers, currentWorkspace } =
    useWorkspaceStore();
  const { fetchTeams, teams } = useTeamStore();

  const project = projects.find((p) => p.id === projectId);
  const latestStatus = project?.statusHistory?.[0];
  const displayUpdate =
    latestStatus?.status || project?.currentProjectUpdate || update;
  const statusConfigs = project?.projectStatusConfig || [];
  const displayUpdateConfig = statusConfigs.find(
    (c: any) => c.value === displayUpdate,
  );

  // console.log("Project data in project header:", project);
  const viewers = (project?.viewers || [])
    .map((v: any) => (typeof v === "string" ? v : v.userId))
    .filter(Boolean) as string[];
  // console.log("Project viewers in project header:", viewers);

  // state for icon picker
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIconData, setSelectedIconData] = useState<IconData | null>(
    null,
  );
  const [isUpdatingIcon, setIsUpdatingIcon] = useState(false);

  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project?.name || "");

  // const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  // const [defaultTaskValuesOpen, setDefaultTaskValuesOpen] = useState(false);
  // const [createTaskByEmailOpen, setCreateTaskByEmailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  

  const handleCopyProjectLink = async () => {
    try {
      const url = `${window.location.origin}/project/${projectId}`;
      await navigator.clipboard.writeText(url);
      toast("success", { title: "Project link copied!" });
    } catch {
      toast("error", { title: "Failed to copy link" });
    }
  };

  const handleCopyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(projectId);
      toast("success", { title: "Project ID copied!" });
    } catch {
      toast("error", { title: "Failed to copy ID" });
    }
  };

  const handleArchiveConfirm = async () => {
    setArchiving(true);
    await archiveProject(projectId);
    setArchiving(false);
    setShowArchiveModal(false);
    router.push("/settings?tab=workspace&section=cleanup");
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
    }

    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
      fetchTeams();
    }
  }, [projectId, currentWorkspace?.id]);

  // ✅ Handle icon file upload (for image type)
  const handleIconUpload = async (
    file: File,
  ): Promise<{ id: string; url?: string }> => {
    try {
      const result = await uploadFile(file);
      console.log("Icon upload result:", result);
      return result;
    } catch (error) {
      console.error("Icon upload error:", error);
      toast("error", { title: "Failed to upload icon" });
      throw error;
    }
  };

  // ✅ ADD THIS - Handle icon delete
  const handleIconDelete = async (uploadId: string): Promise<void> => {
    try {
      console.log("🗑️ Deleting icon upload from header, ID:", uploadId);

      await deleteUpload(uploadId);

      console.log("✅ Icon deleted successfully");

      toast("success", { title: "Icon deleted" });
    } catch (error: any) {
      console.error("❌ Icon delete failed:", error);
      toast("error", { title: error?.message || "Failed to delete icon" });
      throw error;
    }
  };

  // ✅ Handle icon selection from picker
  const handleIconSelect = async (iconData: IconData) => {
    // Prevent multiple submissions
    if (isUpdatingIcon) return;

    setIsUpdatingIcon(true);
    try {
      let finalIconId: string | null = null;

      console.log("🔄 Processing icon selection...", {
        type: iconData.type,
        hasIconId: !!iconData.iconId,
        hasImageId: !!iconData.imageId,
      });

      // For icon type (from library)
      if (iconData.type === "icon") {
        console.log("📤 Uploading icon from library...");

        const iconUploadResult = await uploadIcon({
          icon: {
            name: iconData.icon || "default",
            color: iconData.color,
          },
        });

        finalIconId = iconUploadResult.id;
        console.log("✅ Icon library uploaded, ID:", finalIconId);
      }
      // For image type
      else if (iconData.type === "file") {
        if (iconData.imageId) {
          finalIconId = iconData.imageId;
          console.log("✅ Using uploaded image ID:", finalIconId);
        } else {
          console.error("❌ Image selected but no upload ID found");
          toast("error", {
            title: "Image upload incomplete. Please try uploading again.",
          });
          return;
        }
      }

      // Update project icon via API
      if (finalIconId) {
        console.log("🔄 Updating project icon via API...");

        await updateProjectIcon(projectId, finalIconId);

        console.log("✅ Project icon updated successfully");

        setSelectedIconData(iconData);
        setShowIconPicker(false);

        toast("success", { title: "Project icon updated!" });
      } else {
        console.error("❌ Failed to get final icon ID");
        toast("error", { title: "Failed to get icon ID" });
      }
    } catch (error: any) {
      console.error("❌ Error selecting icon:", error);
      toast("error", {
        title: error?.message || "Failed to update project icon",
      });
    } finally {
      setIsUpdatingIcon(false);
    }
  };

  const handleAddViewers = async (viewerIds: string[]) => {
    await addViewersToProject(projectId, viewerIds);
  };

  const handleRemoveViewers = async (viewerIds: string[]) => {
    await removeViewersFromProject(projectId, viewerIds);
  };

  const handleSendInvite = async (emails: string[]) => {
    // Implement email invitation logic here
    console.log("Send invites to:", emails);
    // You can integrate with your backend email service
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === project?.name) {
      setIsRenaming(false);
      return;
    }

    try {
      await renameProject(projectId, newName.trim());
      setIsRenaming(false);
    } catch (error) {
      // Error already handled in store
      setNewName(project?.name || "");
    }
  };

  // const handleStatusChange = async (newStatus: "active" | "planning" | "completed" | "on-hold") => {
  //     try {
  //         await updateProjectStatus(projectId, newStatus);
  //     } catch (error) {
  //         // Error already handled in store
  //     }
  // };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      setDeleteDialogOpen(false);
      router.push("/dashboard");
    } catch (error) {
      toast("error", { title: "Failed to delete project." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (
    newName: string,
    mode: string,
    selectedFieldIds?: string[],
  ) => {
    try {
      const newProjectId = await useProjectsStore
        .getState()
        .duplicateProject(projectId, newName, mode, selectedFieldIds);
      toast("success", { title: "Project duplicated successfully!" });
      if (newProjectId) {
        router.push(`/project/${newProjectId}`); // ← navigate to new project
      }
    } catch (error) {
      toast("error", { title: "Failed to duplicate project." });
      throw error;
    }
  };

  // if (isLoading) {
  //     return <div>Loading project...</div>;
  // }


      // ── Impler import callback ──────────────────────────────────────────────────
    const { addImportRecord } = useImportStore();
    const { addProject } = useProjectsStore();
   const { addTask } = useTasksStore();
    const formatImportDate = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

    // const onDataImported = useCallback(async (uploadData: any) => {
    //     const uploadId = uploadData?._id ?? uploadData?.id;
    //     const validRecords = uploadData?.validRecords ?? 0;
    //     const totalRecords = uploadData?.totalRecords ?? 0;

    //     if (!uploadId || validRecords === 0) {
    //         toast('error', { title: "No valid records found in the imported file." });
    //         return;
    //     }

    //     try {
    //         const response = await fetch(
    //             `/api/impler/rows?uploadId=${uploadId}`
    //         );
    //         const result = await response.json();
    //         const rows: Record<string, any>[] = result?.data ?? result?.records ?? result ?? [];

    //         if (!rows.length) {
    //             addImportRecord({
    //                 type: "Spreadsheet",
    //                 status: "Completed",
    //                 statusColor: "success",
    //                 importedNumber: `${validRecords} of ${totalRecords} records uploaded`,
    //                 expiryDate: formatImportDate(new Date()),
    //                 projectIds: [],
    //             });
    //             toast('success', { title: `${validRecords} records uploaded!` });
    //             return;
    //         }

    //         const now = new Date();
    //         const importedProjectIds: string[] = [];
    //         let successCount = 0;

    //         for (const row of rows) {
    //             try {
    //                 const rawName = row.name || row.Name || row["Project Name"] || `Imported-${Date.now()}`;
    //                 const projectPayload = {
    //                     name: rawName,
    //                     description: row.description || row.Description || "",
    //                     status: (row.status || "active").toLowerCase(),
    //                     priority: (row.priority || "medium").toLowerCase(),
    //                     slug: rawName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50),
    //                 };
    //                 const pid = await addProject(projectPayload as any);
    //                 importedProjectIds.push(pid);
    //                 successCount++;
    //             } catch (err) {
    //                 console.error("Failed row:", row, err);
    //             }
    //         }

    //         addImportRecord({
    //             type: "Spreadsheet",
    //             status: successCount === rows.length ? "Completed" : successCount > 0 ? "Ongoing" : "Failed",
    //             statusColor: successCount === rows.length ? "success" : successCount > 0 ? "warning" : "error",
    //             importedNumber: `${successCount} of ${rows.length} projects imported`,
    //             expiryDate: formatImportDate(now),
    //             projectIds: importedProjectIds,
    //         });

    //         if (successCount > 0) {
    //             toast('success', { title: `${successCount} project${successCount > 1 ? "s" : ""} imported successfully!` });
    //         } else {
    //             toast('error', { title: "No projects created. Check column names in your file." });
    //         }
    //     } catch (err) {
    //         console.error("Failed to fetch rows from Impler:", err);
    //         addImportRecord({
    //             type: "Spreadsheet",
    //             status: "Completed",
    //             statusColor: "success",
    //             importedNumber: `${validRecords} of ${totalRecords} records uploaded`,
    //             expiryDate: formatImportDate(new Date()),
    //             projectIds: [],
    //         });
    //         toast('success', { title: `${validRecords} records uploaded successfully!` });
    //     }
    // }, [addProject, addImportRecord]);

    // ── Impler hook ─────────────────────────────────────────────────────────────
    
    
        const onDataImported = useCallback(async (uploadData: any) => {
        const uploadId = uploadData?._id ?? uploadData?.id;
        const validRecords = uploadData?.validRecords ?? 0;
        const totalRecords = uploadData?.totalRecords ?? 0;

        if (!uploadId || validRecords === 0) {
            toast('error', { title: "No valid records found in the imported file." });
            return;
        }

        try {
            const response = await fetch(
                `https://api.impler.io/v1/upload/${uploadId}/rows?limit=1000&page=1`,
                {
                    headers: {
                        "x-access-token": process.env.NEXT_PUBLIC_IMPLER_ACCESS_TOKEN!,
                    },
                }
            );
            const result = await response.json();
            const rows: Record<string, any>[] = result?.data ?? result?.records ?? result ?? [];

            if (!rows.length) {
                addImportRecord({
                    type: "Spreadsheet",
                    status: "Completed",
                    statusColor: "success",
                    importedNumber: `${validRecords} of ${totalRecords} records uploaded`,
                    expiryDate: formatImportDate(new Date()),
                    projectIds: [projectId],
                });
                toast('success', { title: `${validRecords} records uploaded!` });
                return;
            }

            const now = new Date();
            let successCount = 0;

            const getRowValue = (row: any, keys: string[]) => {
                for (const key of keys) {
                    if (row[key] !== undefined) return row[key];
                    const foundKey = Object.keys(row).find(
                        (k) => k.trim().toLowerCase() === key.trim().toLowerCase()
                    );
                    if (foundKey && row[foundKey] !== undefined) return row[foundKey];
                }
                return undefined;
            };

            for (const row of rows) {
                try {
                    // Fuzzy lookup to match headers like "TASK", "Description content", "STATUS", "PRIORITY "
                    const rawName = getRowValue(row, ["task", "title", "name"]) || `Imported Task-${Date.now()}`;
                    const rawDesc = getRowValue(row, ["description", "description content", "desc"]) || "";
                    const rawStatus = getRowValue(row, ["status", "state"]) || "todo";
                    const rawPriority = getRowValue(row, ["priority"]) || "medium";
                    const rawType = getRowValue(row, ["type", "taskType", "task type"]) || "task";
                    const rawStartDate = getRowValue(row, ["startDate", "start date"]) || null;
                    const rawEndDate = getRowValue(row, ["endDate", "end date", "dueDate", "due date"]) || null;
                    const rawAssignee = getRowValue(row, ["assignee", "assigneeId"]) || "";

                    const taskPayload = {
                        projectId: projectId,
                        name: rawName,
                        description: rawDesc,
                        status: String(rawStatus).toLowerCase(),
                        priority: String(rawPriority).toLowerCase(),
                        taskType: String(rawType).toLowerCase(),
                        startDate: rawStartDate,
                        endDate: rawEndDate,
                        assignee: rawAssignee,
                        customFieldValues: {},
                    };

                    console.log("Importing Task Payload:", taskPayload);

                    // 2. Call addTask to save in the store & DB
                    await addTask(taskPayload as any);
                    successCount++;
                } catch (err) {
                    console.error("Failed row:", row, err);
                }
            }

            addImportRecord({
                type: "Spreadsheet",
                status: successCount === rows.length ? "Completed" : successCount > 0 ? "Ongoing" : "Failed",
                statusColor: successCount === rows.length ? "success" : successCount > 0 ? "warning" : "error",
                importedNumber: `${successCount} of ${rows.length} tasks imported`,
                expiryDate: formatImportDate(now),
                projectIds: [projectId],
            });

            if (successCount > 0) {
                toast('success', { title: `${successCount} task${successCount > 1 ? "s" : ""} imported successfully!` });
            } else {
                toast('error', { title: "No tasks created. Check column names in your file." });
            }
        } catch (err) {
            console.error("Failed to fetch rows from Impler:", err);
            addImportRecord({
                type: "Spreadsheet",
                status: "Failed",
                statusColor: "error",
                importedNumber: `0 of ${totalRecords} tasks imported`,
                expiryDate: formatImportDate(new Date()),
                projectIds: [projectId],
            });
            toast('error', { title: "Import failed to fetch parsed rows." });
        }
    }, [projectId, addTask, addImportRecord]);

    const { showWidget, isImplerInitiated } = useImpler({
        projectId:        process.env.NEXT_PUBLIC_IMPLER_PROJECT_ID!,
        templateId:       process.env.NEXT_PUBLIC_IMPLER_TEMPLATE_ID!,
        accessToken:      process.env.NEXT_PUBLIC_IMPLER_ACCESS_TOKEN!,
        onUploadComplete: onDataImported,
        onWidgetClose:    () => console.log("Impler widget closed"),
    });

  if (!project) {
    return <div>Project not found</div>;
  }

  // const statusConfig = {
  //     active: { label: "On Track", color: "bg-green-100 text-green-700" },
  //     planning: { label: "Planning", color: "bg-blue-100 text-blue-700" },
  //     completed: { label: "Completed", color: "bg-gray-100 text-gray-700" },
  //     "on-hold": { label: "On Hold", color: "bg-yellow-100 text-yellow-700" },
  //     archived: { label: "Archived", color: "bg-red-100 text-red-700" },
  // } as const;

  // const config = statusConfig[(project.status || "active") as keyof typeof statusConfig];

  // Dynamic priority config from store
  const projectPriorityConfigs = getProjectPriorityConfigs(projectId);

  // Build a lookup map by value for the trigger button
  const priorityConfigMap = projectPriorityConfigs.reduce(
    (acc, p) => {
      acc[p.value] = p;
      return acc;
    },
    {} as Record<
      string,
      {
        _id: string;
        value: string;
        label: string;
        color: string;
        order: number;
      }
    >,
  );

  // Current project priority matched config
  const currentPriorityConfig =
    priorityConfigMap[project.priority || ""] ?? null;

  return (
    <>
      <div className="border-b border-border bg-background">
        {/* Main Header Row */}
        <div className="flex items-center justify-between px-4 py-1">
          {/* Left Section - Project Info, Status & Actions */}
          <div className="flex items-center gap-2">
            {/* Project Name & Icon */}
            <div className="flex items-center gap-3">
              {/* <div
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-lg"
                                style={{ backgroundColor: project.color || "#9333ea" }}
                            > */}
              {/* {project.name.charAt(0).toUpperCase()} */}
              {/* </div> */}
              {/* <Avatar className="h-10 w-10 bg-red-500 rounded-md">
                                {renderProjectHeaderIcon(project)}
                            </Avatar> */}
              {/* <ProjectIconAvatar
                                project={project}
                                size="lg"
                            /> */}
              <button
                onClick={() => setShowIconPicker(true)}
                disabled={isUpdatingIcon} // ✅ Disable during update
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Change project icon"
                data-testid="project-header-icon-picker-btn"
              >
                <ProjectIconAvatar project={project} size="md" />
                {isUpdatingIcon && (
                  <Loader2 className="h-4 w-4 animate-spin absolute -right-2 -top-2" />
                )}
              </button>

              {/* Icon Picker Dialog - Add at the end of component, before closing tags */}
              <ColorIconPicker
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                onSelect={handleIconSelect}
                currentIcon={
                  project?.icon?.type === "file"
                    ? project?.icon?.presignedUrl // ✅ for image type use presignedUrl
                    : project?.icon?.name || null // ✅ for icon type use name
                }
                currentColor={project?.icon?.color || "#6366f1"}
                currentType={project?.icon?.type || "icon"}
                onUpload={handleIconUpload}
                onDelete={handleIconDelete}
              />

              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 w-64"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRename();
                      }
                      if (e.key === "Escape") {
                        setNewName(project.name);
                        setIsRenaming(false);
                      }
                    }}
                    data-testid="project-header-rename-input"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      renameProject(projectId, newName);
                      setIsRenaming(false);
                    }}
                    data-testid="project-header-rename-confirm"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setNewName(project.name);
                      setIsRenaming(false);
                    }}
                    data-testid="project-header-rename-cancel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h1
                  className="text-lg font-semibold text-foreground"
                  data-testid="project-header-name"
                >
                  {project.name}
                </h1>
              )}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-border" />

            {/* Status Badge & Viewers */}
            <div className="flex items-center gap-2">
              {/* Priority Dropdown */}
              {/* <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        style={{
                                            backgroundColor: currentPriorityConfig ? currentPriorityConfig.color + '20' : '#f3f4f6',
                                        }}
                                    >
                                        <Flag
                                            className="h-4 w-4"
                                            style={{ color: currentPriorityConfig ? currentPriorityConfig.color : '#6b7280' }}
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40">
                                    <DropdownMenuItem onClick={() => updateProjectPriority(projectId, '' as any)}>
                                        Clear
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {projectPriorityConfigs.length === 0 ? (
                                        <div className="px-2 py-2 text-xs text-gray-400 italic">
                                            No priorities configured
                                        </div>
                                    ) : (
                                        projectPriorityConfigs.map((option) => (
                                            <DropdownMenuItem
                                                key={option._id}
                                                className="justify-between"
                                                onClick={() => updateProjectPriority(projectId, option.value as any)}
                                            >
                                                <span>{option.label}</span>
                                                <div
                                                    className="h-5 w-5 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: option.color + '20' }}
                                                >
                                                    <Flag className="h-3 w-3" style={{ color: option.color }} />
                                                </div>
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu> */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor:
                    (currentPriorityConfig?.color || "#6b7280") + "15",
                }}
                data-testid="project-header-priority"
              >
                <Flag
                  className="h-4 w-4"
                  style={{
                    color: currentPriorityConfig
                      ? currentPriorityConfig.color
                      : "#6b7280",
                  }}
                />
              </div>

              {/* Calendar Date Range Picker */}
              {/* <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    {project.startDate && project.endDate ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 bg-muted-foreground/30 hover:bg-muted-foreground/40 text-xs px-2"
                                        >
                                            {format(new Date(project.startDate), "dd/MM/yyyy")} - {format(new Date(project.endDate), "dd/MM/yyyy")}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/40"
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    )}
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                        mode="range"
                                        min={1}
                                        selected={{
                                            from: project.startDate ? new Date(project.startDate) : undefined,
                                            to: project.endDate ? new Date(project.endDate) : undefined,
                                        }}
                                        onSelect={(range) => {
                                            if (range?.from && range?.to && range.from !== range.to) {
                                                updateProjectDates(
                                                    projectId,
                                                    range.from.toISOString(),
                                                    range.to.toISOString()
                                                );
                                                setIsCalendarOpen(false);
                                            }
                                        }}
                                        numberOfMonths={2}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover> */}
              <div
                className={`h-8 bg-muted-foreground/20 text-xs px-2 flex items-center gap-1 ${project.startDate && project.endDate
                    ? "rounded-md"
                    : "rounded-full"
                  }`}
                data-testid="project-header-dates"
              >
                <Calendar className="h-4 w-4" />
                {project.startDate && project.endDate && (
                  <span className="mt-0.5">
                    {formatLocalDate(project.startDate)} -{" "}
                    {formatLocalDate(project.endDate)}
                  </span>
                )}
              </div>

              {/* Status Badge - Make it updatable */}
              {/* <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "capitalize",
                                                status === "active" && "bg-green-100 text-green-700",
                                                status === "planning" && "bg-blue-100 text-blue-700",
                                                status === "completed" && "bg-purple-100 text-purple-700",
                                                status === "on-hold" && "bg-orange-100 text-orange-700"
                                            )}
                                        >
                                            {status}
                                        </Badge>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 mr-2">
                                            Active
                                        </Badge>
                                        Active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("planning")}>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 mr-2">
                                            Planning
                                        </Badge>
                                        Planning
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 mr-2">
                                            Completed
                                        </Badge>
                                        Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("on-hold")}>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 mr-2">
                                            On Hold
                                        </Badge>
                                        On Hold
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu> */}
              <div
                className={cn(
                  "inline-flex items-center px-2 py-1 h-8 text-xs font-medium rounded-md capitalize",
                  !displayUpdateConfig && "bg-muted text-muted-foreground",
                )}
                style={
                  displayUpdateConfig
                    ? {
                      backgroundColor: displayUpdateConfig.color + "15",
                      color: displayUpdateConfig.color,
                    }
                    : undefined
                }
                data-testid="project-header-update"
              >
                {displayUpdateConfig?.label || displayUpdate || "No update"}
              </div>

              {/* Viewers */}
              <Popover open={isViewersOpen} onOpenChange={setIsViewersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8 text-xs"
                    data-testid="project-header-viewers-btn"
                  >
                    <Users className="h-4 w-4" />
                    Viewers {viewers.length > 0 && `(${viewers.length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[320px] p-2 border border-b-[5px] border-b-primary bg-popover"
                  align="start"
                >
                  <ProjectViewersSection
                    projectId={projectId}
                    viewers={viewers}
                    onAddViewers={handleAddViewers}
                    onRemoveViewers={handleRemoveViewers}
                    onInviteClick={() => {
                      setIsViewersOpen(false);
                      setIsInviteDialogOpen(true);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded h-8 w-8"
                  data-testid="project-header-more-options-trigger"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="border-b-4 border-b-primary p-1.5"
              >
                <DropdownMenuItem
                  className="p-1.5 justify-center text-xs font-medium bg-primary text-primary-foreground rounded-md"
                  data-testid="project-header-menu-permissions"
                >
                  Sharing & Permissions
                </DropdownMenuItem>
                <TestLoaderDropdown />

                <DropdownMenuItem
                  onClick={() => setIsRenaming(true)}
                  className="text-xs"
                  data-testid="project-header-menu-rename"
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Rename
                </DropdownMenuItem>
                {/* 
                                <DropdownMenuItem
                                    onClick={() => setDuplicateDialogOpen(true)}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate Project
                                </DropdownMenuItem> */}

                {/* <DropdownMenuItem className="justify-between">
                                    <div className="flex items-center">
                                        <Palette className="mr-4 h-4 w-4" />
                                        Assign color & icon
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </DropdownMenuItem> */}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    className="text-xs"
                    data-testid="project-header-menu-group-actions"
                  >
                    <Layers className="mr-2 h-3.5 w-3.5" />
                    Group actions
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary min-w-[200px] p-1.5">
                    {/* Collapse / Expand — label flips based on allGroupsCollapsed */}
                    <DropdownMenuItem
                      onClick={() =>
                        allGroupsCollapsed
                          ? onExpandAllGroups?.()
                          : onCollapseAllGroups?.()
                      }
                      disabled={totalGroupsCount === 0}
                      className="text-xs"
                      data-testid="project-header-menu-group-toggle"
                    >
                      {allGroupsCollapsed
                        ? "Expand all groups"
                        : "Collapse all groups"}
                    </DropdownMenuItem>
                    {/* Hide / Show empty groups — label flips based on hideEmptyGroups */}
                    <DropdownMenuItem
                      onClick={() => onToggleHideEmptyGroups?.()}
                      disabled={totalGroupsCount === 0}
                      className="text-xs"
                      data-testid="project-header-menu-group-empty-toggle"
                    >
                      {hideEmptyGroups
                        ? "Show empty groups"
                        : "Hide empty groups"}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="mx-2 my-0" />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    className="text-xs"
                    data-testid="project-header-menu-more-actions"
                  >
                    <MoreVertical className="mr-2 h-3.5 w-3.5" />
                    More actions
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary p-1.5">
                    <DropdownMenuItem
                      className="text-xs"
                      data-testid="project-header-menu-more-templates"
                    >
                      Templates
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs"
                      data-testid="project-header-menu-more-automatons"
                    >
                      Automatons
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs"
                      data-testid="project-header-menu-more-integrations"
                    >
                      Integrations
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    className="text-xs"
                    data-testid="project-header-menu-copy-info"
                  >
                    <Link className="mr-2 h-3.5 w-3.5" />
                    Copy Project Info
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary p-1.5">
                    <DropdownMenuItem
                      onClick={handleCopyProjectLink}
                      className="cursor-pointer text-xs"
                      data-testid="project-header-menu-copy-link"
                    >
                      Project Link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCopyProjectId}
                      className="cursor-pointer text-xs"
                      data-testid="project-header-menu-copy-id"
                    >
                      Project ID
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Project settings
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="border-b-4 border-b-primary">
                                        <DropdownMenuItem
                                            onClick={() => setDefaultTaskValuesOpen(true)}
                                            className="cursor-pointer"
                                        >
                                            Default task values
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setCreateTaskByEmailOpen(true)}
                                            className="cursor-pointer"
                                        >
                                            Create task via email
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub> */}

                {/* redirect overview page */}
                {/* <DropdownMenuItem className="justify-between">
                                    <div className="flex items-center">
                                        <Settings className="mr-4 h-4 w-4" />
                                        Project settings
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </DropdownMenuItem> */}

                {/* <DropdownMenuItem className="justify-between">
                                    <div className="flex items-center">
                                        <Grid3x3 className="mr-4 h-4 w-4" />
                                        Templates
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </DropdownMenuItem> */}

                {/* <DropdownMenuItem onClick={() => onActivityLogClick?.()}>
                                    <Activity className="mr-2 h-4 w-4" />
                                    Activity log
                                </DropdownMenuItem> */}

                {/* <DropdownMenuItem>
                                    <History className="mr-2 h-4 w-4" />
                                    Version history
                                </DropdownMenuItem> */}

                {/* <DropdownMenuSeparator className="mx-2 my-0" /> */}

                {/* <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <FolderPlus className="mr-2 h-4 w-4" />
                                        Add to
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="border-b-4 border-b-primary">
                                        <DropdownMenuItem>
                                            Portfolio
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            Team
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            Goal
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub> */}

                <DropdownMenuSeparator className="mx-2 my-0" />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs" data-testid="project-header-menu-import-export">
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Import / Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary min-w-[160px]">
                    {/* Import — opens Impler widget */}
                    <DropdownMenuItem
                      onClick={() => showWidget({})}
                      className="cursor-pointer text-xs"
                      disabled={!isImplerInitiated}
                      data-testid="project-header-menu-import"
                    >
                      {isImplerInitiated ? "Import" : "Loading..."}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer text-xs" data-testid="project-header-menu-export">
                        Export
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="border-b-4 border-b-primary min-w-[140px]">
                        <DropdownMenuItem
                          onClick={() => { onPrint?.(); }}
                          className="flex items-center gap-2.5 cursor-pointer text-xs"
                          data-testid="project-header-menu-export-pdf"
                        >
                          <Image src="/images/pdf.svg" alt="PDF" width={16} height={16} className="object-contain" />
                          PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { onExportCSV?.(); }}
                          className="flex items-center gap-2.5 cursor-pointer text-xs"
                          data-testid="project-header-menu-export-csv"
                        >
                          <Image src="/images/csv.svg" alt="CSV" width={16} height={16} className="object-contain" />
                          CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { onExportExcel?.(); }}
                          className="flex items-center gap-2.5 cursor-pointer text-xs"
                          data-testid="project-header-menu-export-excel"
                        >
                          <Image src="/images/excel.svg" alt="Excel" width={16} height={16} className="object-contain" />
                          Excel
                        </DropdownMenuItem>

                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="mx-2 my-0" />

                <DropdownMenuItem
                  onClick={() => setShowArchiveModal(true)}
                  className="text-xs"
                  data-testid="project-header-menu-archive"
                >
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  Archive Project
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive text-xs"
                  onClick={handleDelete}
                  disabled={isLoading}
                  data-testid="project-header-menu-delete"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete project
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <ViewTabs projectId={projectId} />
          </div>
        </div>
        {/* Project Invite Dialog */}
        <ProjectInviteDialog
          open={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          projectId={projectId}
          projectName={project?.name || ""}
          onSendInvite={handleSendInvite}
        />

        {/* <DuplicateProjectDialog
                    open={duplicateDialogOpen}
                    onClose={() => setDuplicateDialogOpen(false)}
                    originalProjectName={projectName}
                    projectId={project?.id ?? ""}
                    customFields={project?.customFields ?? []}
                    onDuplicate={handleDuplicate}
                /> */}

        {/* Default Task Values
                <DefaultTaskValuesDialog
                    open={defaultTaskValuesOpen}
                    onClose={() => setDefaultTaskValuesOpen(false)}
                    projectId={projectId}
                />

                Create Task via Email
                <CreateTaskByEmailDialog
                    open={createTaskByEmailOpen}
                    onClose={() => setCreateTaskByEmailOpen(false)}
                    projectId={projectId}
                /> */}

        {/* Import Dialog */}
        <ImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          projectId={projectId}
        />

        {/* Archive Project Modal */}
        <ArchiveProjectModal
          open={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          title="Archive Project"
          confirmLabel="Archive"
          description={`Are you sure you want to archive "${project?.name ?? "this project"}"? It will be moved to the cleanup section and can be restored later.`}
          onConfirm={handleArchiveConfirm}
          loading={archiving}
        />

        {/* Delete Project Dialog */}
        <ConfirmationModal
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          title="Delete Project"
          description={`Are you sure you want to delete "${projectName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          loading={isDeleting}
        />
      </div>
    </>
  );
}
