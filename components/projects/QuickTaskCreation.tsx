// components/projects/QuickTaskCreation.tsx

import { useState, useEffect, useMemo } from "react";
import {
  X, Calendar as CalendarIcon, Flag, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore, getTaskTypeDisplayImage } from "@/stores/projects-store";
import { useTeamStore } from "@/stores/teams-store"; // ✅ Added team store
import { cn } from "@/lib/utils";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { MemberAvatar } from "./MemberAvatar";

interface QuickTaskCreationProps {
  selectedDate?: Date;
  open: boolean;
  projectId?: string; // ✅ Made optional
  teamId?: string; // ✅ Added teamId
  projectName?: string;
  initialTaskName?: string;
  initialAssigneeId?: string; // ✅ Added initialAssigneeId
  /** When set, locks or pre-selects the task type (e.g. "milestone") */
  initialTaskType?: string;
  onClose: () => void;
  onCreateTask: (taskData: {
    projectId: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    assignee?: string;
    priority?: string;
    status?: string;
    taskType?: string;
  }) => void;
}

export function QuickTaskCreation({
  selectedDate,
  open,
  projectId,
  teamId,
  projectName = "Project name",
  initialTaskName = "",
  initialAssigneeId = "", // ✅ Added default
  initialTaskType = "task",
  onClose,
  onCreateTask,
}: QuickTaskCreationProps) {
  const { projects, getTaskStatusConfigs, fetchProjectById, getTaskPriorityConfigs, getTaskTypesByProject } = useProjectsStore();
  const { teams } = useTeamStore();
  const { workspaceMembers } = useWorkspaceStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);
  const [taskName, setTaskName] = useState(initialTaskName);
  const [taskDescription, setTaskDescription] = useState("");
  const [startDate, setStartDate] = useState(selectedDate || new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(initialAssigneeId || undefined);
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState(initialTaskType);
  const [isTaskTypeOpen, setIsTaskTypeOpen] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  const taskStatusConfigs = getTaskStatusConfigs(selectedProjectId || "");
  const taskPriorityConfigs = getTaskPriorityConfigs(selectedProjectId || "");
  const taskTypes = getTaskTypesByProject(selectedProjectId || "");
  const selectedTaskTypeConfig = taskTypes.find((t) => t.value === selectedTaskType);
  const isMilestone = selectedTaskType === "milestone";
  const lockTaskType = initialTaskType === "milestone";

  const mentionableMembers = useMemo(() => {
    if (!project?.members || !workspaceMembers) return [];
    const projectUserIds = new Set(project.members.map(m => m.userId));
    return workspaceMembers
      .filter(m => projectUserIds.has(m.userId))
      .map(m => ({
        id: m.userId,
        name: m.name,
        avatar: m.avatar || m.profilePicture || ''
      }));
  }, [project?.members, workspaceMembers]);

  const team = teams.find((t: any) => t.id === teamId);
  const teamMembers = useMemo(() => {
    return team?.teamMembers?.map(m => ({
      userId: m.userId || m.id,
      name: m.name,
      avatar: m.avatar,
      profilePicture: m.avatar
    })) || [];
  }, [team]);

  const members = useMemo(() => {
    if (project) {
      const projectUserIds = new Set<string>();
      if (project.members) {
        project.members.forEach(m => projectUserIds.add(m.userId));
      }
      return workspaceMembers.filter(m => projectUserIds.has(m.userId));
    }
    return workspaceMembers.length > 0 ? workspaceMembers : teamMembers;
  }, [project, workspaceMembers, teamMembers]);

  // Filter projects by team and initial assignee if provided
  const filteredProjects = useMemo(() => {
    let result = projects;

    if (teamId) {
      const team = teams.find((t: any) => t.id === teamId);
      if (team) {
        result = result.filter(p => team.projectIds?.includes(p.id as string));
      }
    }

    if (initialAssigneeId) {
      result = result.filter(p => p.members?.some(m => m.userId === initialAssigneeId));
    }

    return result;
  }, [teamId, projects, teams, initialAssigneeId]);

  useEffect(() => {
    setSelectedProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    setSelectedTaskType(initialTaskType);
  }, [initialTaskType, open]);

  // Auto-select if only one project is available and nothing is selected yet
  useEffect(() => {
    if (!selectedProjectId && filteredProjects.length === 1) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && (taskStatusConfigs.length === 0 || taskPriorityConfigs.length === 0)) {
      fetchProjectById(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectById]);

  useEffect(() => {
    if (initialTaskName) {
      setTaskName(initialTaskName);
    }
  }, [initialTaskName]);

  useEffect(() => {
    if (initialAssigneeId) {
      setSelectedAssignee(initialAssigneeId);
    }
  }, [initialAssigneeId]);

  useEffect(() => {
    setStartDate(selectedDate || new Date());
  }, [selectedDate]);

  const handleCreate = () => {
    if (taskName.trim() && selectedProjectId) {
      onCreateTask({
        projectId: selectedProjectId,
        name: taskName,
        description: taskDescription.trim() || undefined,
        startDate: startDate,
        endDate: endDate,
        assignee: selectedAssignee,
        priority: selectedPriority,
        status: selectedStatus,
        taskType: selectedTaskType,
      });
      setTaskName(initialTaskName);
      setTaskDescription("");
      setSelectedAssignee(undefined);
      setSelectedPriority(undefined);
      setSelectedStatus(undefined);
      setStartDate(selectedDate || new Date());
      setEndDate(undefined);
      onClose();
    }
  };

  const assignedMember = members.find((m) => m.userId === selectedAssignee);
  const selectedPriorityOption = taskPriorityConfigs.find((p) => p.value === selectedPriority);
  const selectedStatusOption = taskStatusConfigs.find(
    (c) => c.value === selectedStatus
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        {/* <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" /> */}

        {/* Content - Reduced width and height */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "w-[80vw] max-w-[750px]",
            "max-h-[75vh] overflow-hidden",
            "bg-card shadow-lg border-0",
            "rounded-lg",
            // "data-[state=open]:animate-in data-[state=closed]:animate-out",
            // "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            // "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            // "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            // "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "border-b-[5px] border-b-primary"
          )}
        >
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>
              {isMilestone ? "Create New Milestone" : "Create New Task"}
            </DialogPrimitive.Title>
          </VisuallyHidden.Root>
          {/* Header */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground">
              {isMilestone ? "Milestone" : "Task"} / {taskName || (isMilestone ? "New milestone" : "New task")}{" "}
              {project ? `(${project.name})` : ""}
            </h2>
            <DialogPrimitive.Close asChild>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-muted-foreground transition-colors"
                data-testid="quick-task-close-btn"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Main Content */}
          <div className="flex max-h-[calc(75vh-120px)] overflow-y-auto">
            {/* Left Section */}
            <div className="flex-1 p-5 space-y-3">
              {/* Task Name */}
              <Input
                placeholder={isMilestone ? "Milestone name...." : "Task name...."}
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleCreate();
                  if (e.key === "Escape") onClose();
                }}
                autoFocus
                className="border-0 border-b border-border rounded-none shadow-none px-0 focus-visible:ring-0 focus-visible:border-ring text-sm"
                data-testid="quick-task-name-input"
              />

              {/* ProseMirror Editor - Reduced height */}
              <div className="border border-border rounded-lg overflow-hidden">
                <ProseMirrorEditor
                  initialContent={taskDescription}
                  mentionableMembers={mentionableMembers}
                  onBlur={setTaskDescription}
                  placeholder="Enter task description..."
                  className="min-h-[100px]"
                  editable={true}
                />
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-[200px] p-4 space-y-2.5 ">
              {/* Task type */}
              {taskTypes.length > 0 && (
                <Popover open={isTaskTypeOpen} onOpenChange={setIsTaskTypeOpen}>
                  <PopoverTrigger asChild>
                    <button
                      disabled={lockTaskType}
                      className={cn(
                        "w-full px-3 py-2 bg-card border border-border rounded-lg text-left text-xs text-muted-foreground hover:border-input transition-colors",
                        lockTaskType && "opacity-80 cursor-default"
                      )}
                      data-testid="quick-task-type-trigger"
                    >
                      {selectedTaskTypeConfig ? (
                        <span className="flex items-center gap-2">
                          {getTaskTypeDisplayImage(selectedTaskTypeConfig) ? (
                            <img
                              src={getTaskTypeDisplayImage(selectedTaskTypeConfig)!}
                              alt=""
                              className="h-4 w-4 object-contain shrink-0"
                            />
                          ) : null}
                          <span className="truncate">{selectedTaskTypeConfig.label}</span>
                        </span>
                      ) : (
                        "Type"
                      )}
                    </button>
                  </PopoverTrigger>
                  {!lockTaskType && (
                    <PopoverContent className="w-42.5 p-2 border-0 border-b-[5px] border-b-primary bg-card" align="start">
                      {taskTypes.map((type) => (
                        <button
                          key={type._id || type.value}
                          onClick={() => {
                            setSelectedTaskType(type.value);
                            setIsTaskTypeOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-xs"
                          data-testid={`quick-task-type-option-${type.value}`}
                        >
                          {getTaskTypeDisplayImage(type) ? (
                            <img src={getTaskTypeDisplayImage(type)!} alt="" className="h-4 w-4 object-contain" />
                          ) : null}
                          {type.label}
                        </button>
                      ))}
                    </PopoverContent>
                  )}
                </Popover>
              )}

              {/* Project Selection (Visible when projectId is not provided via props OR when teamId is provided) */}
              {(!projectId || teamId) && (
                <Popover open={isProjectOpen} onOpenChange={setIsProjectOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-left text-xs text-muted-foreground hover:border-input transition-colors" data-testid="quick-task-project-trigger">
                      {project ? (
                        <span className="truncate">{project.name}</span>
                      ) : (
                        <span className="text-red-500">Select Project</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[170px] p-2 border-0 border-b-[5px] border-b-primary bg-card" align="start">
                    <div className="max-h-60 overflow-y-auto">
                      {filteredProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setIsProjectOpen(false);
                            // Reset selections when project changes
                            setSelectedStatus(undefined);
                            setSelectedPriority(undefined);
                            // setSelectedAssignee(undefined);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded hover:bg-muted text-xs",
                            selectedProjectId === p.id && "bg-blue-50 text-blue-600 font-medium"
                          )}
                          data-testid={`quick-task-project-option-${p.id}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Status */}
              <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-left text-xs text-muted-foreground hover:border-input transition-colors" data-testid="quick-task-status-trigger">
                    {selectedStatusOption ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: selectedStatusOption.color }}
                        />
                        <span className="truncate">{selectedStatusOption.label}</span>
                      </span>
                    ) : (
                      "Status"
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-42.5 p-2 border-0 border-b-[5px] border-b-primary bg-card" align="start">
                  {taskStatusConfigs.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-2">Loading statuses...</p>
                  ) : (
                    taskStatusConfigs.map((config) => (
                      <button
                        key={config._id}
                        onClick={() => {
                          setSelectedStatus(config.value);
                          setIsStatusOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-xs"
                        data-testid={`quick-task-status-option-${config.value}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>

              {/* Priority */}
              <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-left text-xs text-muted-foreground hover:border-input transition-colors" data-testid="quick-task-priority-trigger">
                    {selectedPriorityOption ? (
                      <span className="flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selectedPriorityOption.color }} />
                        <span className="truncate">{selectedPriorityOption.label}</span>
                      </span>
                    ) : (
                      "Priority"
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-42.5 p-2 border-0 border-b-[5px] border-b-primary bg-card" align="start">
                  {taskPriorityConfigs.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-muted-foreground italic">No priorities configured</p>
                  ) : (
                    taskPriorityConfigs.map((priority) => (
                      <button
                        key={priority._id}
                        onClick={() => {
                          setSelectedPriority(priority.value);
                          setIsPriorityOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs"
                        data-testid={`quick-task-priority-option-${priority.value}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: priority.color }} />
                        <span style={{ color: priority.color }}>{priority.label}</span>
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>

              {/* Assignee */}
              <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-left text-xs text-muted-foreground hover:border-input transition-colors" data-testid="quick-task-assignee-trigger">
                    {assignedMember ? (
                      <span className="flex items-center gap-2">
                        <MemberAvatar
                          name={assignedMember.name}
                          src={assignedMember.avatar || assignedMember.profilePicture}
                        />
                        <span className="truncate">{assignedMember.name}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Assignee</span>
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-42.5 p-2 border-0 border-b-[5px] border-b-primary bg-card" align="start">
                  {members.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => {
                        setSelectedAssignee(member.userId);
                        setIsAssigneeOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-xs"
                      data-testid={`quick-task-assignee-option-${member.userId}`}
                    >
                      <MemberAvatar
                        name={member.name}
                        src={member.avatar || member.profilePicture}
                      />
                      {member.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Start Date Picker */}
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-left text-xs text-muted-foreground hover:border-input transition-colors flex items-center gap-2" data-testid="quick-task-start-date-trigger">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{startDate ? format(startDate, "MMM d, yyyy") : "Start Date"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        if (endDate && endDate < date) {
                          setEndDate(undefined);
                        }
                      }
                      setIsStartCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Due Date Picker */}
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-left text-xs text-muted-foreground hover:border-input transition-colors flex items-center gap-2" data-testid="quick-task-due-date-trigger">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{endDate ? format(endDate, "MMM d, yyyy") : "Due Date"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setIsEndCalendarOpen(false);
                    }}
                    disabled={(date) => (startDate ? date < new Date(new Date(startDate).setHours(0, 0, 0, 0)) : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex justify-end bg-card">
            <Button
              onClick={handleCreate}
              disabled={!taskName.trim() || !selectedProjectId}
              className="bg-muted text-foreground hover:bg-muted-foreground/30 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="quick-task-submit-btn"
            >
              Done
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
