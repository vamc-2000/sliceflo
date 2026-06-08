"use client";

import {
  MoreHorizontal,
  Settings,
  RefreshCcw,
  ListTodo,
  LayoutPanelLeft,
  Trash2,
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GoalTarget } from "@/types/goal.types";
import { Checkbox } from "@/components/ui/checkbox";
import { iconLibrary } from "@/components/ColorIconPicker";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { useState, useMemo, useEffect } from "react";
import { useTeamStore } from "@/stores/teams-store";
import { UpdateTargetModal } from "./UpdateTargetModal";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "@/components/ui/sonner";
import { useGoalsStore } from "@/stores/goals-store";
import { useProfileStore } from "@/stores/profile-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore } from "@/stores/projects-store";
import ConfirmationModal from "../ConfirmationModal";
import { TARGET_TYPE_COLORS } from "@/types/goal.types";
import { Loader } from "../Loader";



interface TargetsSectionProps {
  goalId: string;
  targets: GoalTarget[];
  onOpenCreateTarget: () => void;
  // onOpenUpdateTarget: (target: GoalTarget) => void;
  onOpenEditTarget: (target: GoalTarget) => void;
  isLoading?: boolean;
}

export function TargetsSection({ goalId, targets, onOpenCreateTarget, onOpenEditTarget, isLoading }: TargetsSectionProps) {
  const { deleteTarget, targetsByGoal, updateTarget, currentGoal, goals } = useGoalsStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { projects } = useProjectsStore();
  const currentUser = useProfileStore((state) => state.user);
  const { workspaceMembers } = useWorkspaceStore();
  const { tasks } = useTasksStore();
  const { teams: allTeams, fetchTeams } = useTeamStore();

  useEffect(() => {
    if (allTeams.length === 0) {
      fetchTeams().catch(console.error);
    }
  }, [allTeams.length, fetchTeams]);

  // Find project IDs associated with the current goal's teams
  const goalProjectIds = useMemo(() => {
    const targetGoal = goals.find(g => g.id === goalId) || currentGoal;
    if (!targetGoal) return null;

    const goalTeamIds = new Set<string>();
    
    if (Array.isArray(targetGoal.assignedTeams)) {
      targetGoal.assignedTeams.forEach(id => {
        if (id) goalTeamIds.add(String(id));
      });
    }
    if (Array.isArray(targetGoal.teams)) {
      targetGoal.teams.forEach((t: any) => {
        const teamId = typeof t === 'object' ? (t?.id || t?._id) : t;
        if (teamId) goalTeamIds.add(String(teamId));
      });
    }

    if (goalTeamIds.size === 0) {
      return null;
    }

    const linkedProjectIds = new Set<string>();
    allTeams.forEach(team => {
      const teamIdStr = String(team.id);
      if (goalTeamIds.has(teamIdStr)) {
        if (Array.isArray(team.projectIds)) {
          team.projectIds.forEach(pId => linkedProjectIds.add(String(pId)));
        }
        if (Array.isArray(team.projects)) {
          team.projects.forEach((p: any) => {
            const pId = typeof p === 'object' ? (p.id || p._id) : p;
            if (pId) linkedProjectIds.add(String(pId));
          });
        }
      }
    });

    return linkedProjectIds;
  }, [goalId, goals, currentGoal, allTeams]);

  const filteredProjects = useMemo(() => {
    if (!goalProjectIds) return projects;
    return projects.filter(p => p.id && goalProjectIds.has(String(p.id)));
  }, [projects, goalProjectIds]);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<GoalTarget | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<GoalTarget | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedTargetIds, setExpandedTargetIds] = useState<Set<string>>(new Set());
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set());
  const [taskSearch, setTaskSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");

  const currentUserId = currentUser?._id || currentUser?.id;

  const isGoalOwner = currentGoal?.owners?.some((o: any) => {
    const oId = typeof o === 'string' ? o : (o.userId || o._id || o.id);
    return oId === currentUserId;
  });

  const handleToggleTaskLink = async (targetId: string, taskId: string, shouldLink: boolean) => {
    const target = targets.find(t => t.id === targetId);
    if (!target) return;

    const existingIds = target.linkedTaskIds || [];
    let newIds: string[];

    if (shouldLink) {
      if (existingIds.includes(taskId)) return;
      newIds = [...existingIds, taskId];
    } else {
      newIds = existingIds.filter(id => id !== taskId);
    }

    try {
      await updateTarget(goalId, targetId, {
        linkedTaskIds: newIds
      }, currentWorkspace?.id);
      toast("success", { title: "Success", description: shouldLink ? "Task linked" : "Task unlinked" });
    } catch (error) {
      toast("error", { title: "Error", description: "Failed to update task links" });
    }
  };

  const handleToggleBoardLink = async (targetId: string, projectId: string, shouldLink: boolean) => {
    const target = targets.find(t => t.id === targetId);
    if (!target) return;

    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const projectTaskIds = projectTasks.map(t => t.id).filter(Boolean) as string[];

    const existingIds = target.linkedTaskIds || [];
    let newIds: string[];

    if (shouldLink) {
      newIds = [...new Set([...existingIds, ...projectTaskIds])];
    } else {
      newIds = existingIds.filter(id => !projectTaskIds.includes(id));
    }

    if (newIds.length === existingIds.length && shouldLink) {
      toast("error", { title: "Error", description: "All tasks from this project are already linked" });
      return;
    }

    try {
      await updateTarget(goalId, targetId, {
        linkedTaskIds: newIds
      }, currentWorkspace?.id);
      toast("success", { title: "Success", description: shouldLink ? "Project tasks linked" : "Project tasks removed" });
    } catch (error) {
      toast("error", { title: "Error", description: "Failed to update project links" });
    }
  };

  const toggleBoardExpand = (projectId: string) => {
    setExpandedBoards(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const getProjectAvatar = (project: any) => {
    if (!project?.icon) return null;
    if (project.icon.type === "file") return { type: "image", src: project.icon.presignedUrl };
    if (project.icon.type === "icon") return { type: "icon", name: project.icon.name, color: project.icon.color ?? "#6B7280" };
    return null;
  };

  const toggleTargetNotes = (targetId: string) => {
    setExpandedTargetIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });
  };

  const getTargetUserId = (item: any): string => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      return item.userId || item._id || item.id || "";
    }
    return "";
  };

  const liveTargets = targets;

  function formatRelativeTime(iso?: string) {
    if (!iso) return "—";
    const date = new Date(iso);

    if (isToday(date)) return "today";
    if (isYesterday(date)) return "yesterday";

    return formatDistanceToNow(date, { addSuffix: true }); // e.g. "2 hours ago"
  }

  const handleOpenUpdateTarget = (target: GoalTarget) => {
    setActiveTarget(target);
    setIsUpdateModalOpen(true);
  };

  const handleConfirmDeleteTarget = async () => {
    if (!targetToDelete) return;

    const goalIdForDelete = liveTargets[0]?.goalId || targets[0]?.goalId;
    if (!goalIdForDelete) {
      toast("error", { title: "Error", description: "Goal id not found for this target." });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTarget(goalIdForDelete, targetToDelete);
      setIsDeleteDialogOpen(false);
      setTargetToDelete(null);
      toast("success", { title: "Success", description: "Target deleted successfully." });
    } catch (error) {
      console.error("Failed to delete target:", error);
      toast("error", { title: "Error", description: "Failed to delete target." });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center py-20 w-full bg-card rounded-2xl border border-border" data-testid="targets-loading-state">
        <Loader message="Refreshing targets..." size="md" />
      </div>
    );
  }

  return (
    <div className="mt-7" data-testid="targets-section-container">
      {liveTargets.length > 0 && (
        <div className="flex items-center justify-between mb-2 sticky top-0 bg-background z-10 py-2 border-b border-transparent data-[stuck]:border-border" data-testid="targets-header">
          <h2 className="text-lg font-semibold text-foreground" data-testid="targets-title">
            Targets
          </h2>

          <Button
            variant="default"
            size="sm"
            onClick={onOpenCreateTarget}
            className="text-sm bg-primary text-primary-foreground hover:opacity-90 border-0"
          >
            + Add Target
          </Button>

        </div>
      )}


      <div className="bg-transparent p-1" data-testid="targets-list-container">
        {liveTargets.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center" data-testid="no-targets-empty-state">
            <img
              src="/images/Target.svg"
              alt="No Targets"
              className="w-64 h-auto object-contain mb-3 opacity-70 filter brightness-100 dark:brightness-75"
              data-testid="no-targets-image"
            />

            <Button
              onClick={onOpenCreateTarget}
              className="bg-primary text-primary-foreground hover:opacity-90 px-6 py-2 rounded-lg font-medium"
              data-testid="create-first-target-button"
            >
              Create Target
            </Button>

          </div>
        ) : (
          <div className="space-y-3" data-testid="targets-list">
            {liveTargets
              .filter((t): t is GoalTarget => t && typeof t.type === "string")
              .map((t, index) => {
                const isNumber = t.type === "number";
                const isCurrency = t.type === "currency";
                const isBoolean = t.type === "boolean";
                const isTask = t.type === "task";

                let current = 0;
                let target = 1;
                if (isNumber || isCurrency) {
                  const value = t.value as any;

                  if (value && typeof value === "object") {
                    const startField = Number(value.start ?? 0);
                    const endField = Number(value.end ?? 100);
                    const currentField = Number(value.current ?? startField);

                    current = currentField;
                    target = endField;
                  }


                  if (t.notes && t.notes.length > 0) {
                    const lastNote = t.notes[t.notes.length - 1];
                    if (lastNote.number !== undefined) {
                      current = Number(lastNote.number);
                    }
                  }


                  if (!Number.isFinite(current)) current = 0;
                  if (!Number.isFinite(target) || target <= 0) target = 1;

                } else if (isBoolean) {
                  current = t.value ? 1 : 0;
                  target = 1;
                } else if (isTask) {
                  const linkedIds = t.linkedTaskIds || [];
                  const relatedTasks = tasks.filter(task => linkedIds.includes(task.id));
                  current = relatedTasks.filter(task => task.completed).length;
                  target = linkedIds.length || 1;
                }

                const notes = t.notes && t.notes.length > 0 ? [...t.notes].reverse() : [];

                const safeCurrent = Number.isFinite(current) ? current : 0;
                const safeTarget = Number.isFinite(target) && target > 0 ? target : 1;
                const progressPercent = Math.min(100, Math.floor((safeCurrent / safeTarget) * 100));



                const targetOwnerId = getTargetUserId(t.assignedTo);
                const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
                const isTargetOwner = assignees.some(item => getTargetUserId(item) === currentUserId);
                const canManage = isGoalOwner || isTargetOwner;

                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border shadow-sm bg-card overflow-hidden"
                    data-testid={`target-item-${t.id}`}
                  >
                    <div className="px-5 pt-4 pb-3" data-testid={`target-content-${t.id}`}>
                      {/* title + menu */}
                      <div className="flex items-start justify-between" data-testid={`target-header-${t.id}`}>
                        <div className="flex items-center gap-2" data-testid={`target-title-container-${t.id}`}>
                          <div className="w-0.75 h-4 bg rounded-full bg-primary/40" data-testid={`target-status-bar-${t.id}`} />
                          <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-medium text-foreground/80" data-testid={`target-title-${t.id}`}>
                              {t.label}
                            </h3>
                            {t.type === "task" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTargetNotes(t.id);
                                }}
                                className="text-[12px] text-muted-foreground/60 hover:text-primary transition-colors border-b border-dashed border-muted-foreground/40 pb-0"
                              >
                                {t.linkedTaskIds?.length || 0} tasks
                              </button>
                            )}
                            {t.type !== "task" && (
                              <span className="text-[11px] text-muted-foreground/50 font-normal">
                                {t.type === "number"
                                  ? " (Number)"
                                  : t.type === "boolean"
                                    ? " (True/False)"
                                    : t.type === "currency"
                                      ? " (Currency)"
                                      : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManage && (
                          <DropdownMenu data-testid={`target-menu-${t.id}`}>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                data-testid={`target-more-button-${t.id}`}
                                aria-haspopup="true"
                              >
                                <MoreHorizontal size={18} />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-44 rounded-xl shadow-lg border border-border bg-popover text-popover-foreground"
                              data-testid={`target-menu-content-${t.id}`}
                            >
                              {canManage && (
                                <DropdownMenuItem
                                  className="text-xs py-2 flex items-center gap-2"
                                  onClick={() => onOpenEditTarget(t)}
                                  data-testid={`target-settings-item-${t.id}`}
                                >
                                  <Settings className="w-4 h-4 text-muted-foreground" />
                                  <span>Target settings</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator data-testid={`target-menu-separator-1-${t.id}`} />

                              {(isNumber || isCurrency || isBoolean) && canManage && (
                                <DropdownMenuItem
                                  className="text-xs items-center gap-2"
                                  onClick={() => {
                                    setSelectedTarget(t);
                                    setUpdateModalOpen(true);
                                  }}
                                  data-testid={`target-send-update-item-${t.id}`}
                                >
                                  <RefreshCcw className="w-4 h-4 text-muted-foreground" />
                                  <span>Send Update</span>
                                </DropdownMenuItem>
                              )}

                              {!isNumber && !isCurrency && !isBoolean && canManage && (
                                <>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="text-xs py-2" data-testid={`target-add-task-trigger-${t.id}`}>
                                      <ListTodo className="w-4 h-4 text-muted-foreground" />
                                      <span>Add Task</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                      <DropdownMenuSubContent className="w-[280px] p-0 shadow-xl border border-border" alignOffset={-4}>
                                        <div className="p-2 border-b border-border bg-muted/20">
                                          <Input
                                            placeholder="Search tasks..."
                                            className="h-8 text-[11px] bg-background"
                                            value={taskSearch}
                                            onChange={(e) => setTaskSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-0.5">
                                          {(() => {
                                            const assigneeIds = new Set<string>();
                                            if (t.assignedTo) {
                                              const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
                                              assignees.forEach(item => {
                                                const uId = getTargetUserId(item);
                                                if (uId) assigneeIds.add(uId);
                                              });
                                            }

                                            const projectsToShow = filteredProjects.filter(project =>
                                              tasks.some(task =>
                                                task.projectId === project.id &&
                                                task.name.toLowerCase().includes(taskSearch.toLowerCase()) &&
                                                (assigneeIds.size === 0 || (task.assignee && assigneeIds.has(task.assignee)))
                                              )
                                            );

                                            return projectsToShow.map(project => {
                                              const projectTasks = tasks.filter(task =>
                                                task.projectId === project.id &&
                                                task.name.toLowerCase().includes(taskSearch.toLowerCase()) &&
                                                (assigneeIds.size === 0 || (task.assignee && assigneeIds.has(task.assignee)))
                                              );
                                              const isExpanded = expandedBoards.has(project.id || "");
                                              const isFullyLinked = projectTasks.length > 0 && projectTasks.every(task => t.linkedTaskIds?.includes(task.id));
                                              const isPartiallyLinked = projectTasks.length > 0 && !isFullyLinked && projectTasks.some(task => t.linkedTaskIds?.includes(task.id));

                                              return (
                                                <div key={project.id} className="flex flex-col">
                                                  {/* Project task list dropdown */}
                                                  <DropdownMenuItem
                                                    className="text-[12px] py-2 px-2 cursor-pointer flex items-center justify-between hover:bg-muted rounded-md group"
                                                    onSelect={(e) => {
                                                      e.preventDefault();
                                                      handleToggleBoardLink(t.id, project.id || "", !isFullyLinked);
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                      {/* Chevron expand toggle */}
                                                      <div
                                                        className="p-0.5 hover:bg-muted-foreground/10 rounded-sm transition-colors"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          e.preventDefault();
                                                          toggleBoardExpand(project.id || "");
                                                        }}
                                                      >
                                                        <ChevronDown
                                                          className={cn(
                                                            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                                                            !isExpanded && "-rotate-90"
                                                          )}
                                                        />
                                                      </div>

                                                      {/* Project avatar */}
                                                      {(() => {
                                                        const avatar = getProjectAvatar(project);
                                                        return (
                                                          <div
                                                            className="w-4 h-4 rounded-sm shrink-0 flex items-center justify-center overflow-hidden"
                                                            style={{
                                                              backgroundColor:
                                                                avatar?.type === "icon"
                                                                  ? avatar.color + "20"
                                                                  : project.color
                                                                    ? project.color + "20"
                                                                    : "#3B82F620",
                                                            }}
                                                          >
                                                            {avatar?.type === "image" ? (
                                                              <img src={avatar.src} alt={project.name} className="w-full h-full object-cover" />
                                                            ) : avatar?.type === "icon" ? (
                                                              (() => {
                                                                const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
                                                                if (iconObj) {
                                                                  const IconComponent = iconObj.icon;
                                                                  return <IconComponent size={10} color={avatar.color} />;
                                                                }
                                                                return (
                                                                  <span className="text-[8px] font-bold" style={{ color: project.color ?? "#3B82F6" }}>
                                                                    {project.name?.charAt(0).toUpperCase()}
                                                                  </span>
                                                                );
                                                              })()
                                                            ) : (
                                                              <span className="text-[8px] font-bold" style={{ color: project.color ?? "#3B82F6" }}>
                                                                {project.name?.charAt(0).toUpperCase()}
                                                              </span>
                                                            )}
                                                          </div>
                                                        );
                                                      })()}
                                                      <span className="truncate flex-1 font-medium">{project.name}</span>
                                                    </div>
                                                    {/* Task count + project-level checkbox */}
                                                    <div className="flex-shrink-0 ml-2 flex items-center gap-2">
                                                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {projectTasks.length}
                                                      </span>
                                                      <Checkbox
                                                        checked={isFullyLinked}
                                                        className={cn(
                                                          "h-4 w-4 data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]",
                                                          isPartiallyLinked && "opacity-50"
                                                        )}
                                                      />
                                                    </div>
                                                  </DropdownMenuItem>

                                                  {/* Expanded individual tasks */}
                                                  {isExpanded && (
                                                    <div className="ml-6 pl-2 border-l border-border mt-0.5 mb-1 space-y-0.5">
                                                      {projectTasks.map(task => {
                                                        const isLinked = t.linkedTaskIds?.includes(task.id);
                                                        return (
                                                          <DropdownMenuItem
                                                            key={task.id}
                                                            className="text-[11px] py-1.5 px-2 cursor-pointer flex items-center justify-between hover:bg-muted rounded-md"
                                                            onSelect={(e) => {
                                                              e.preventDefault();
                                                              handleToggleTaskLink(t.id, task.id, !isLinked);
                                                            }}
                                                          >
                                                            <span className="truncate flex-1 text-muted-foreground hover:text-foreground">
                                                              {task.name}
                                                            </span>
                                                            <Checkbox
                                                              checked={isLinked}
                                                              className="h-4 w-4 data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#82C43C]"
                                                            />
                                                          </DropdownMenuItem>
                                                        );
                                                      })}
                                                      {projectTasks.length === 0 && (
                                                        <div className="px-2 py-2 text-[10px] text-muted-foreground italic">No tasks</div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            });
                                          })()}
                                          {tasks.length === 0 && (
                                            <div className="px-2 py-4 text-[11px] text-muted-foreground text-center italic">
                                              No tasks available
                                            </div>
                                          )}
                                          <div className="h-1" />
                                        </div>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                </>
                              )}

                              <DropdownMenuSeparator data-testid={`target-menu-separator-2-${t.id}`} />

                              {canManage && (
                                <DropdownMenuItem
                                  className="text-xs py-2 text-red-600 focus:text-red-600"
                                  onClick={() => {
                                    setTargetToDelete(t.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  data-testid={`target-delete-item-${t.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              )}


                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <UpdateTargetModal
                        isOpen={updateModalOpen}
                        onClose={() => {
                          setUpdateModalOpen(false);
                          setSelectedTarget(null);
                        }}
                        target={selectedTarget}
                      />

                      <ConfirmationModal
                        open={isDeleteDialogOpen}
                        onClose={() => {
                          setIsDeleteDialogOpen(false);
                          setTargetToDelete(null);
                        }}
                        title="Are you sure want to delete this target?"
                        confirmLabel="Delete target"
                        onConfirm={handleConfirmDeleteTarget}
                        loading={isDeleting}
                      />




                      {/* avatars + INR row */}
                      <div className="mt-3 flex items-center justify-between gap-4 overflow-hidden" data-testid={`target-stats-row-${t.id}`}>
                        <div className="flex-1 min-w-0" data-testid={`target-avatars-container-${t.id}`}>

                          <div className="flex -space-x-1.5 mb-1.5" data-testid={`target-avatars-${t.id}`}>
                            {(() => {
                              console.log(`[Target ${t.id}] data:`, t);
                              const assignees = Array.isArray(t.assignedTo)
                                ? t.assignedTo
                                : t.assignedTo
                                  ? [t.assignedTo]
                                  : [];

                              if (assignees.length === 0) {
                                return (
                                  <div
                                    className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center shadow-sm"
                                    title="No owner assigned"
                                  >
                                    <span className="text-[10px] text-muted-foreground">?</span>
                                  </div>
                                );
                              }

                              return (
                                <>
                                  {assignees.map((item, idx) => {
                                    const userId = getTargetUserId(item);
                                    const member = workspaceMembers.find(m => m.userId === userId || m._id === userId || m.id === userId);
                                    const initials = (member?.name || member?.email || "?").charAt(0).toUpperCase();

                                    // Proper image source handling similar to GoalDetailPage
                                    const profilePic = member?.profilePicture || member?.avatar;
                                    const picUrl = profilePic && profilePic.startsWith('http')
                                      ? profilePic
                                      : profilePic
                                        ? `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${profilePic}`
                                        : null;

                                    return (
                                      <div key={`${t.id}-assignee-${idx}`} className="relative group">
                                        {picUrl ? (
                                          <img
                                            src={picUrl}
                                            className="w-6 h-6 rounded-full border-2 border-card object-cover shadow-sm"
                                            alt={member?.name || "Assignee"}
                                            title={member?.name || member?.email}
                                          />
                                        ) : (
                                          <div
                                            className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] text-muted-foreground font-bold shadow-sm"
                                            title={member?.name || member?.email || "Unknown"}
                                          >
                                            {initials}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-muted-foreground/60 truncate" data-testid={`target-due-date-${t.id}`}>
                            <span className="font-semibold text-muted-foreground/80">
                              Due:
                            </span>{" "}
                            <span className="font-semibold text-foreground/70">
                              {(() => {
                                if (!t.endDate) return "No date set";
                                const d = new Date(t.endDate);
                                if (isNaN(d.getTime())) return "Invalid date";
                                return format(d, "MMM d, yyyy");
                              })()}
                            </span>
                          </p>
                        </div>




                        {/* RIGHT SIDE — fix this block */}
                        <div className="flex flex-col  items-end gap-1.5 shrink-0" data-testid={`target-progress-row-${t.id}`}>

                          {/* Row 1: LABEL label + count */}
                          <div className="flex items-center justify-between w-36 gap-2">
                            <span className="uppercase tracking-wide text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 bg-muted rounded" data-testid={`target-type-badge-${t.id}`}>
                              {t.type === "currency" ? (t.unit || "INR") : t.type === "boolean" ? "Y/N" : t.type === "task" ? "tasks" : "NUM"}
                            </span>
                            <span className="text-[10px] font-bold text-foreground/80" data-testid={`target-progress-text-${t.id}`}>
                              {safeCurrent}/{safeTarget}
                            </span>
                          </div>

                          {/* Row 2: Progress bar full width */}
                          <div className="w-36 h-0.5 bg-muted rounded-full overflow-hidden" data-testid={`target-progress-track-${t.id}`}>
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${progressPercent}%` }}
                              data-testid={`target-progress-fill-${t.id}`}
                              role="progressbar"
                              aria-valuenow={progressPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>

                          {/* Row 3: Icon button centered below bar */}
                          <div className="flex justify-between w-36 mt-1">
                            <button
                              type="button"
                              onClick={() => toggleTargetNotes(t.id)}
                              className="relative flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-[10px]"
                              data-testid={`target-notification-button-${t.id}`}
                            >
                              {t.notes && t.notes.length > 0 && (
                                <span
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold border border-background shadow-sm"
                                  data-testid={`target-notification-badge-${t.id}`}
                                >
                                  {t.notes.length}
                                </span>
                              )}

                              {/* Up/Down arrow icon based on expandedTargetIds */}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                {expandedTargetIds.has(t.id) ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                )}
                              </svg>
                            </button>
                          </div>

                        </div>
                      </div>

                    </div>

                    {/* Task list / Notes area */}
                    {expandedTargetIds.has(t.id) && (
                      <div
                        className="bg-muted/5 px-5 py-3 text-xs border-t border-border space-y-4"
                        data-testid={`target-expanded-content-${t.id}`}
                      >
                        {/* 1. Task List (for task targets) */}
                        {t.type === "task" && (
                          <div className="space-y-3" data-testid={`target-tasks-list-${t.id}`}>
                            {(() => {
                              const linkedIds = t.linkedTaskIds || [];
                              const relatedTasks = tasks.filter(task => linkedIds.includes(task.id));

                              if (relatedTasks.length === 0) {
                                return <p className="text-[11px] text-muted-foreground italic">No tasks linked.</p>;
                              }

                              return relatedTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between group py-1 px-1 rounded-md hover:bg-muted/30 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={cn(
                                        "w-2.5 h-2.5 rounded-sm flex-shrink-0",
                                        task.status === "completed" ? "bg-[#82C43C]" : "bg-muted-foreground/30"
                                      )}
                                      title={task.status || "Task"}
                                    />
                                    <span className={cn(
                                      "text-[13px] font-medium",
                                      task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground/80"
                                    )}>
                                      {task.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={true}
                                      disabled={!canManage}
                                      className="h-4 w-4 data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#82C43C] disabled:opacity-50"
                                      onCheckedChange={(checked) => {
                                        if (!checked && canManage) {
                                          handleToggleTaskLink(t.id, task.id, false);
                                        }
                                      }}
                                      title={canManage ? "Unlink Task" : "Only owners can unlink tasks"}
                                    />
                                    {/* <Trash2
                                      checked={true}
                                      className="h-4 w-4 data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#82C43C]"
                                      onCheckedChange={(checked) => {
                                        if (!checked) {
                                          handleToggleTaskLink(t.id, task.id, false);
                                        }
                                      }}
                                      title="Unlink Task"
                                    /> */}

                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}

                        {/* 2. Notes area (original logic) */}
                        {(notes.length > 0) && (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              {(() => {
                                // Get start/end from target value for percentage calculation
                                const tValue = t.value as any;
                                const tStart = Number(tValue?.start ?? 0);
                                const tEnd = Number(tValue?.end ?? 1);
                                const tRange = tEnd - tStart;

                                const calcPercent = (num: number) => {
                                  if (tRange <= 0) return 0;
                                  return Math.min(100, Math.max(0, Math.round(((num - tStart) / tRange) * 100)));
                                };

                                const renderUser = (user: any) => {
                                  if (!user) return "—";
                                  if (typeof user === "object") {
                                    return user.name || user.email || user.username || "—";
                                  }
                                  const userId = String(user);
                                  const currentUserId = currentUser?._id || currentUser?.id;
                                  if (currentUserId && userId === currentUserId) {
                                    return currentUser?.name || currentUser?.email || userId;
                                  }
                                  return userId;
                                };


                                return notes.map((n, idx) => {
                                  const percent = n.number !== undefined ? calcPercent(n.number) : undefined;
                                  const timeDisplay = formatRelativeTime(n.createdAt);
                                  return (
                                    <div
                                      key={n._id ?? idx}
                                      className="flex items-center justify-between border-t border-border pt-2 first:border-t-0 first:pt-0"
                                      data-testid={`target-note-item-${t.id}-${idx}`}
                                    >
                                      <p className="text-[11px] text-muted-foreground">
                                        <span className="font-medium">Note:</span>{" "}
                                        {n.note}
                                        {percent !== undefined && (
                                          <> ({percent}% achieved {timeDisplay})</>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground/60">
                                        {timeDisplay}, by{" "}
                                        <span className="text-primary font-medium">
                                          {renderUser(n.createdBy)}
                                        </span>
                                      </p>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}



                    {/* bottom colored bar */}
                    <div
                      className="h-1 w-full rounded-b-xl"
                      style={{
                        borderBottom: `3px solid ${TARGET_TYPE_COLORS[t.type] ?? '#9BB2DC'}`
                      }}
                      data-testid={`target-colored-bar-${t.id}`}
                    />

                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>

  );
}
