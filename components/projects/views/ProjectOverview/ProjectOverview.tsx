// components/projects/views/ProjectOverview/ProjectOverview.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useProjectsStore } from "@/stores/projects-store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Plus, Edit, UserPlus, Flag, FolderClosed, Target } from "lucide-react";
import ProjectMembersDisplay from "./ProjectMembersDisplay";
import ProjectViewersDisplay from "./ProjectViewersDisplay";
import TeamsDisplay from "./TeamsDisplay";
import RightPanel from "./RightPanel";
import Image from "next/image";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
// import AddMilestoneDialog from './AddMilestoneDialog'
// import AddToPortfolioDialog from './AddToPortfolioDialog'
import InviteProjectMembersDialog from "@/components/projects/views/ProjectOverview/InviteProjectMembersDialog";
import InviteProjectViewersDialog from "@/components/projects/views/ProjectOverview/InviteProjectViewersDialog";
import LinkProjectPortfolioDialog from "@/components/projects/LinkProjectPortfolioDialog";
import ProjectPortfoliosList from "@/components/projects/views/ProjectOverview/ProjectPortfoliosList";
import ProjectMilestonesList from "@/components/projects/views/ProjectOverview/ProjectMilestonesList";
import { QuickTaskCreation } from "@/components/projects/QuickTaskCreation";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useTasksStore } from "@/stores/tasks-store";
import { getRelationshipIcon } from "@/utils/relationship-utils";
import { cn } from "@/lib/utils";
import { convertSelectedDateToUTC } from "@/utils/timezone-utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, History, Paperclip } from "lucide-react";
import StatusHistoryModal from "./StatusHistoryModal";

const getStatusStyles = (color?: string) => {
  const baseColor = color || "#c4c4c4";
  if (baseColor.startsWith("#") && baseColor.length === 7) {
    return {
      backgroundColor: `${baseColor}33`, // 20% opacity background
      color: baseColor,
    };
  }
  return {
    backgroundColor: baseColor,
    color: "#fff",
  };
};

interface ProjectOverviewProps {
  project?: any;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project: passedProject,
  activeTab = "properties",
  onTabChange,
}) => {
  const router = useRouter();
  const { currentWorkspace, workspaceMembers } = useWorkspaceStore();
  const {
    removeMembersFromProject,
    removeViewersFromProject,
    detachPortfoliosFromProject,
    fetchProjectStatusHistory,
    postProjectStatusHistory,
  } = useProjectsStore();
  const { portfolios } = usePortfoliosStore();
  const { user: profile } = useProfileStore();
  const { tasks, fetchTasks, addTask, deleteTask } = useTasksStore();

  const projectId = passedProject?.id;
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.id === passedProject?.id),
  );
  const fetchProjectById = useProjectsStore((state) => state.fetchProjectById);
  const updateProject = useProjectsStore((state) => state.updateProject);

  const [openProjectMembersDialog, setOpenProjectMembersDialog] =
    useState(false);
  const [openProjectViewersDialog, setOpenProjectViewersDialog] =
    useState(false);
  const [openTeamsDialog, setOpenTeamsDialog] = useState(false);
  const [openMilestoneCreation, setOpenMilestoneCreation] = useState(false);
  const [milestoneCreationDate, setMilestoneCreationDate] = useState(
    new Date(),
  );
  const [openPortfolioDialog, setOpenPortfolioDialog] = useState(false);
  const [openGoalsDialog, setOpenGoalsDialog] = useState(false);

  // Status Update state variables
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Fetch tasks for the project
  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  // Fetch project status history on mount / project change if not loaded yet, or when history modal opens
  useEffect(() => {
    const hasHistory = !!project?.statusHistory;
    if (projectId && (!hasHistory || isHistoryOpen)) {
      fetchProjectStatusHistory(projectId);
    }
  }, [
    projectId,
    isHistoryOpen,
    fetchProjectStatusHistory,
    !!project?.statusHistory,
  ]);

  // Calculate relationship metrics
  const relationshipMetrics = useMemo(() => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);

    const counts = {
      "relates-to": 0,
      "duplicate-of": 0,
      "blocked-by": 0,
      blocking: 0,
      "starts-before": 0,
      "starts-after": 0,
      // 'finishes-before': 0,
      // 'finishes-after': 0,
    };

    projectTasks.forEach((task) => {
      if (task.relationships) {
        task.relationships.forEach((rel) => {
          if (counts[rel.type] !== undefined) {
            counts[rel.type]++;
          }
        });
      }
    });

    return [
      {
        label: "Relates To",
        count: counts["relates-to"],
        color: "#3b82f6",
        icon: getRelationshipIcon("relates-to"),
      },
      {
        label: "Duplicate Of",
        count: counts["duplicate-of"],
        color: "#6366f1",
        icon: getRelationshipIcon("duplicate-of"),
      },
      {
        label: "Blocked By",
        count: counts["blocked-by"],
        color: "#ef4444",
        icon: getRelationshipIcon("blocked-by"),
      },
      {
        label: "Blocking",
        count: counts["blocking"],
        color: "#f97316",
        icon: getRelationshipIcon("blocking"),
      },
      {
        label: "Starts Before",
        count: counts["starts-before"],
        color: "#10b981",
        icon: getRelationshipIcon("starts-before"),
      },
      {
        label: "Starts After",
        count: counts["starts-after"],
        color: "#14b8a6",
        icon: getRelationshipIcon("starts-after"),
      },
      // { label: 'Finishes Before', count: counts['finishes-before'], color: '#d97706', icon: getRelationshipIcon('finishes-before') },
      // { label: 'Finishes After', count: counts['finishes-after'], color: '#84cc16', icon: getRelationshipIcon('finishes-after') },
    ];
  }, [tasks, projectId]);

  // project members
  const projectMembers = project?.members || [];
  // console.log('Project Members in project overview:', projectMembers);
  // project viewers
  const projectViewersIds = (project?.viewers || [])
    .map((v: any) => (typeof v === "string" ? v : v.userId))
    .filter(Boolean) as string[];
  // console.log('Project Viewers in project overview:', projectViewersIds);

  // Handle removing a member from the project
  const handleRemoveMember = async (userId: string) => {
    if (!project || !projectId) return;

    try {
      // Store function expects array of userIds (matches API userIds parameter)
      await removeMembersFromProject(projectId, [userId]);
      // Store handles toast and state update
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  // Handle removing a viewer from the project
  const handleRemoveViewer = async (userId: string) => {
    if (!project || !projectId) return;

    try {
      // Store function expects array of viewerIds (matches API viewerIds parameter)
      await removeViewersFromProject(projectId, [userId]);
      // Store handles toast and state update
    } catch (error) {
      console.error("Failed to remove viewer:", error);
    }
  };

  const handleRemoveTeam = async (userId: string) => {
    console.log("temporary team remove", userId);
  };

  const handleDetachPortfolio = (id: string) => {
    if (!project || !projectId) return;
    detachPortfoliosFromProject(projectId, [id]);
  };

  const linkedPortfoliosList = portfolios.filter((p) =>
    project?.linkedPortfolios?.includes(p.id),
  );
  const hasLinkedPortfolios = linkedPortfoliosList.length > 0;

  const projectMilestones = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.projectId === projectId &&
          t.taskType === "milestone" &&
          !t.parentTaskId,
      ),
    [tasks, projectId],
  );
  const hasMilestones = projectMilestones.length > 0;

  const openAddMilestone = () => {
    setMilestoneCreationDate(new Date());
    setOpenMilestoneCreation(true);
  };

  const handleCreateMilestone = (taskData: {
    projectId: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    assignee?: string;
    priority?: string;
    status?: string;
    taskType?: string;
  }) => {
    setOpenMilestoneCreation(false);
    addTask({
      projectId: taskData.projectId,
      name: taskData.name,
      description: taskData.description,
      taskType: taskData.taskType || "milestone",
      startDate: convertSelectedDateToUTC(taskData.startDate),
      endDate: taskData.endDate
        ? convertSelectedDateToUTC(taskData.endDate)
        : undefined,
      assignee: taskData.assignee,
      priority: taskData.priority,
      status: taskData.status,
      completed: false,
    });
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    await deleteTask(milestoneId);
  };

  const statusConfigs = useMemo(() => {
    return project?.projectStatusConfig || [];
  }, [project]);

  const enterEditMode = () => {
    const currentStatus =
      project?.currentProjectUpdate || statusConfigs[0]?.value || "";
    setSelectedStatus(currentStatus);
    setStatusMessage("");
    setIsEditingStatus(true);
  };

  const handleStatusButtonClick = (statusValue: string) => {
    setSelectedStatus(statusValue);
    setStatusMessage("");
    setIsEditingStatus(true);
  };

  const handlePostUpdate = async () => {
    if (!selectedStatus || !projectId) return;
    try {
      await postProjectStatusHistory(projectId, selectedStatus, statusMessage);
      setIsEditingStatus(false);
      setStatusMessage("");
    } catch (err) {
      console.error("Failed to post status update:", err);
    }
  };

  const resolvedLeader = useMemo(() => {
    const leaderId = project?.leaders?.[0];
    if (!leaderId || !workspaceMembers) return undefined;
    const member = workspaceMembers.find((m) => m.userId === leaderId);
    if (!member) return undefined;
    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";
    const avatarUrl = member.profilePicture
      ? member.profilePicture.startsWith("http")
        ? member.profilePicture
        : `${s3BaseUrl}/${member.profilePicture}`
      : "";
    return {
      name: member.name || member.email || "Unknown",
      avatar: avatarUrl,
    };
  }, [project?.leaders, workspaceMembers]);

  return (
    <div className="h-full w-full overflow-hidden text-xs">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex h-full w-full"
      >
        {/* Left Section - Scrollable */}
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="flex-1 overflow-y-auto space-y-4 p-4 h-full">
            {/* Relationship Health Section */}
            <div>
              <div>
                <h3 className="text-sm font-semibold">Relationship Health</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Overview of task dependencies, blockers, and connections.
                  Identify risks in the project workflow
                </p>
              </div>
              <Card className="p-3">
                <CardContent className="space-y-3 px-0">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {relationshipMetrics.map(
                      ({ label, count, color, icon: Icon }) => (
                        <div
                          key={label}
                          className="rounded-lg p-2 text-white"
                          style={{ backgroundColor: color }}
                        >
                          <span className="block text-xs font-semibold truncate">
                            {label}
                          </span>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-sm font-bold">{count}</span>
                            <Icon className="h-4 w-4 opacity-50" />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Update Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Status Update
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Summarize progress, blockers, and next steps. Keeps
                    stakeholders aligned without meetings
                  </p>
                </div>
              </div>
              <Card className="p-3">
                <CardContent className="space-y-3 px-0 pb-0">
                  {isEditingStatus ? (
                    <div className="flex flex-col gap-3">
                      {/* Status Dropdown Trigger */}
                      <div className="flex items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 hover:opacity-90 text-xs font-semibold capitalize flex items-center gap-1.5 rounded-sm cursor-pointer"
                              style={getStatusStyles(
                                statusConfigs.find(
                                  (c: any) => c.value === selectedStatus,
                                )?.color,
                              )}
                            >
                              <span>
                                {statusConfigs.find(
                                  (c: any) => c.value === selectedStatus,
                                )?.label ||
                                  selectedStatus ||
                                  "Select status"}
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-40 p-2 space-y-1"
                          >
                            {statusConfigs.map((level: any) => (
                              <DropdownMenuItem
                                key={level.value}
                                onClick={() => setSelectedStatus(level.value)}
                                className="p-0 focus:bg-transparent"
                              >
                                <div
                                  className="w-full h-9 flex items-center justify-center rounded-xs text-xs font-semibold transition-opacity hover:opacity-90 px-3 cursor-pointer"
                                  style={getStatusStyles(level.color)}
                                >
                                  <span>{level.label}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Textarea */}
                      <Textarea
                        placeholder="Write a project status update..."
                        value={statusMessage}
                        onChange={(e) => setStatusMessage(e.target.value)}
                        className="min-h-[80px] text-xs focus-visible:ring-primary"
                      />

                      {/* Actions row */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingStatus(false)}
                            className="h-8 px-3 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handlePostUpdate}
                            disabled={!selectedStatus || !statusMessage.trim()}
                            className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Post update
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : project?.statusHistory &&
                    project.statusHistory.length > 0 ? (
                    (() => {
                      const latestStatus = project.statusHistory[0];
                      const latestStatusConfig = statusConfigs.find(
                        (c: any) => c.value === latestStatus.status,
                      );
                      return (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            {/* Status Badge Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 rounded-sm hover:opacity-90 text-xs font-semibold capitalize flex items-center gap-1.5 cursor-pointer"
                                  style={getStatusStyles(
                                    latestStatusConfig?.color,
                                  )}
                                >
                                  <span>
                                    {latestStatusConfig?.label ||
                                      latestStatus.status}
                                  </span>
                                  <ChevronDown className="h-3.5 w-3.5 opacity-75" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-40 p-2 space-y-1"
                              >
                                {statusConfigs.map((level: any) => (
                                  <DropdownMenuItem
                                    key={level.value}
                                    onClick={() =>
                                      handleStatusButtonClick(level.value)
                                    }
                                    className="p-0 focus:bg-transparent"
                                  >
                                    <div
                                      className="w-full h-9 flex items-center justify-center rounded-xs text-xs font-semibold transition-opacity hover:opacity-90 px-3 cursor-pointer"
                                      style={getStatusStyles(
                                        level.color,
                                      )}
                                    >
                                      <span>{level.label}</span>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Actions Links */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                              <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="hover:underline hover:text-foreground font-semibold text-[#737373] cursor-pointer"
                              >
                                See all
                              </button>
                              <span className="text-muted-foreground/30 font-light">
                                |
                              </span>
                              <button
                                onClick={enterEditMode}
                                className="hover:underline hover:text-foreground font-semibold text-[#737373] cursor-pointer"
                              >
                                New update
                              </button>
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className="mt-1 text-sm text-foreground leading-relaxed">
                            {latestStatus.message || "No description provided."}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {statusConfigs.map((config: any) => {
                          return (
                            <Button
                              key={config._id || config.value}
                              variant="ghost"
                              className="h-12 transition-all duration-200 flex items-center justify-center rounded-md font-semibold text-xs relative hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm hover:opacity-90"
                              style={getStatusStyles(config.color)}
                              onClick={() =>
                                handleStatusButtonClick(config.value)
                              }
                            >
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={enterEditMode}
                        className="flex items-center justify-center w-full py-4 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Post project status update
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Collaborators Section */}
            <div>
              <div>
                <h3 className="text-sm font-semibold">Team Roster</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Manage people assigned to this project. Add or remove
                  collaborators and set their access level.
                </p>
              </div>
              <Card>
                <CardContent className="flex justify-around items-center px-6 py-2">
                  {/* Members */}
                  <div>
                    {project ? (
                      <ProjectMembersDisplay
                        projectMembers={projectMembers}
                        onAddMember={() => setOpenProjectMembersDialog(true)}
                        onRemoveMember={handleRemoveMember}
                        projectId={projectId}
                        leaderIds={project?.leaders || []}
                        currentUserId={profile?.id}
                      />
                    ) : (
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full bg-muted animate-pulse"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Viewers */}
                  <div>
                    {project ? (
                      <ProjectViewersDisplay
                        viewerIds={projectViewersIds}
                        onAddViewer={() => setOpenProjectViewersDialog(true)}
                        onRemoveViewer={handleRemoveViewer}
                        projectId={projectId}
                      />
                    ) : (
                      <div className="flex gap-2">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full bg-muted animate-pulse"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team */}
                  <div>
                    {project ? (
                      <TeamsDisplay
                        teams={[]}
                        //temparory onadd onremove
                        onAddTeam={() => setOpenTeamsDialog(true)}
                        onRemoveTeam={handleRemoveTeam}
                        projectId={projectId}
                      />
                    ) : (
                      <div className="flex gap-2">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full bg-muted animate-pulse"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Milestones Section */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Milestones</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Define key checkpoints. Each milestone drives accountability
                    and tracks phase completion.
                  </p>
                </div>
                {hasMilestones && (
                  <button
                    onClick={openAddMilestone}
                    className="flex items-center justify-center h-8 w-8 text-muted-foreground cursor-pointer"
                    aria-label="Add milestone"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>

              <Card
                className={`rounded-lg transition-shadow ${
                  hasMilestones
                    ? "border-0 shadow-none bg-transparent py-0"
                    : "border-l-4 border-l-primary shadow-sm hover:shadow-md"
                }`}
              >
                <CardContent className={hasMilestones ? "p-0" : "px-4 py-2"}>
                  {hasMilestones ? (
                    <ProjectMilestonesList
                      milestones={projectMilestones}
                      projectId={projectId}
                      onDeleteMilestone={handleDeleteMilestone}
                    />
                  ) : (
                    <div className="flex items-center gap-25">
                      <Image
                        src="/images/projects/milestones-illustration.svg"
                        alt="milestones illustration"
                        width={100}
                        height={100}
                        className="object-contain"
                      />
                      <button
                        data-testid="projectoverview-milestone-btn"
                        onClick={openAddMilestone}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                          <Flag size={18} />
                        </span>
                        <span className="text-xs">Add Milestone</span>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Portfolios Section */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Portfolios</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Connect to a portfolio (optional). Inherits portfolio,
                    reporting, and governance.
                  </p>
                </div>
                {hasLinkedPortfolios && (
                  <button
                    onClick={() => setOpenPortfolioDialog(true)}
                    className="flex items-center justify-center h-8 w-8 text-muted-foreground cursor-pointer"
                    aria-label="Add portfolio"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>

              <Card
                className={`rounded-lg transition-shadow ${
                  hasLinkedPortfolios
                    ? "border-0 shadow-none bg-transparent py-0"
                    : "border-l-4 border-l-primary shadow-sm hover:shadow-md"
                }`}
              >
                <CardContent
                  className={hasLinkedPortfolios ? "p-0" : "px-4 py-2"}
                >
                  {hasLinkedPortfolios ? (
                    <ProjectPortfoliosList
                      portfolios={linkedPortfoliosList}
                      projectId={projectId}
                      onDetachPortfolio={handleDetachPortfolio}
                    />
                  ) : (
                    <div className="flex items-center gap-25">
                      <Image
                        src="/images/projects/portfolios-illustration.svg"
                        alt="portfolios illustration"
                        width={100}
                        height={100}
                        className="object-contain"
                      />
                      <button
                        data-testid="projectoverview-create-portfolio-btn"
                        onClick={() =>
                          router.push(`/project/${projectId}/create-portfolio`)
                        }
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                          <Plus size={18} />
                        </span>
                        <span className="text-xs">Create new Portfolio</span>
                      </button>
                      <button
                        data-testid="projectoverview-existiing-portfolio-btn"
                        onClick={() => setOpenPortfolioDialog(true)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                          <FolderClosed size={18} />
                        </span>
                        <span className="text-xs">Add existing Portfolio</span>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Goals Section */}
            <div>
              <div>
                <h3 className="text-sm font-semibold">Goals</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Attach one or more goals. Every goal tied to this project has
                  a clear owner and progress metric.
                </p>
              </div>
              <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md">
                <CardContent className="px-4 py-2">
                  <div className="flex items-center gap-25">
                    <Image
                      src="/images/projects/goals-illustration.svg"
                      alt="goals illustration"
                      width={100}
                      height={100}
                      className="object-contain"
                    />
                    <button
                      data-testid="projectoverview-create-goal-btn"
                      onClick={() => setOpenGoalsDialog(true)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                        <Target size={18} />
                      </span>
                      <span className="text-xs">Create new Goal</span>
                    </button>
                    <button
                      data-testid="projectoverview-existiing-goal-btn"
                      onClick={() => setOpenGoalsDialog(true)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                        <Target size={18} />
                      </span>
                      <span className="text-xs">Add existing Goal</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-[2px] bg-muted hover:bg-muted-foreground/50 transition-all" />

        {/* Right Panel - Fixed */}
        <ResizablePanel defaultSize={30} minSize={20} className="border-l">
          <div className="h-full">
            <RightPanel
              project={project}
              workspaceId={currentWorkspace?.id}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <InviteProjectMembersDialog
        open={openProjectMembersDialog}
        onClose={() => setOpenProjectMembersDialog(false)}
        projectId={projectId}
        projectName={project?.name || ""}
        existingMemberIds={projectMembers.map((m: any) => m.userId)}
        onMembersUpdate={() => fetchProjectById(projectId)}
      />

      <InviteProjectViewersDialog
        open={openProjectViewersDialog}
        onClose={() => setOpenProjectViewersDialog(false)}
        projectId={projectId}
        projectName={project?.name || ""}
        existingViewerIds={projectViewersIds}
        onViewersUpdate={() => fetchProjectById(projectId)}
      />

      <LinkProjectPortfolioDialog
        open={openPortfolioDialog}
        onClose={() => setOpenPortfolioDialog(false)}
        projectId={projectId}
        existingPortfolioIds={project?.linkedPortfolios || []}
      />

      <QuickTaskCreation
        selectedDate={milestoneCreationDate}
        open={openMilestoneCreation}
        projectId={projectId}
        projectName={project?.name || "Project"}
        initialTaskType="milestone"
        onClose={() => setOpenMilestoneCreation(false)}
        onCreateTask={handleCreateMilestone}
      />

      <StatusHistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        projectName={project?.name || "Project"}
        projectStatusConfigs={statusConfigs}
        history={project?.statusHistory || []}
        currentUpdateValue={project?.currentProjectUpdate || ""}
        projectLeader={resolvedLeader}
      />
    </div>
  );
};

export default ProjectOverview;
