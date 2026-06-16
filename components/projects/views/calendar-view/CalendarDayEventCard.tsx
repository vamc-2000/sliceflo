// components/projects/views/calendar-view/CalendarDayEventCard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  MessageSquare,
  Flag,
  User,
  MoreHorizontalIcon,
} from "lucide-react";
import { useTasksStore } from "@/stores/tasks-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarPicker } from "@/components/CalendarPicker";
import { cn } from "@/lib/utils";
import { Task, Subtask } from "@/types/task.types";
import { useProjectsStore } from "@/stores/projects-store";
import { formatTaskId } from "@/utils/task-utils";
import {
  formatLocalDate,
  convertSelectedDateToUTC,
  convertUTCToCalendarDate,
} from "@/utils/timezone-utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  getRelationshipIcon,
  getRelationshipIconColor,
  getRelationshipLabel,
} from "@/utils/relationship-utils";
import { RelationshipDetailDialog } from "../list-view/common/RelationshipDetailDialog";

interface CalendarDayEventCardProps {
  task: Task | Subtask;
  projectId: string;
  onClick?: () => void;
  isSubtask?: boolean;
  parentTaskId?: string;
}

export const CalendarDayEventCard = ({
  task,
  projectId,
  onClick,
  isSubtask = false,
  parentTaskId,
}: CalendarDayEventCardProps) => {
  const { updateTask, updateSubtask, tasks, subtasks, getTaskRelationships } =
    useTasksStore();
  const { workspaceMembers } = useWorkspaceStore();
  const { projects, getTaskPriorityConfigs, getTaskStatusConfigs } =
    useProjectsStore();
  const currentProject = projects.find((p) => p.id === projectId);
  const members = workspaceMembers.filter((wm) =>
    currentProject?.members?.some((pm) => pm.userId === wm.userId),
  );
  const projectSlug = currentProject?.slug ?? "TASK";
  const taskPriorityConfigs = getTaskPriorityConfigs(projectId);
  const taskStatusConfigs = getTaskStatusConfigs(projectId);

  const liveTask = isSubtask
    ? (subtasks.find((st) => st.id === task.id) ?? task)
    : (tasks.find((t) => t.id === task.id) ?? task);

  // State for inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(liveTask.name);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [hoveredRelType, setHoveredRelType] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(liveTask.name);
  }, [liveTask.name]);

  // assignedMember — replace task.assignee:
  const assignedMember = liveTask.assignee
    ? members.find((m) => m.userId === liveTask.assignee)
    : null;

  // priorityOption — replace task.priority:
  const priorityOption = liveTask.priority
    ? taskPriorityConfigs.find((p) => p.value === liveTask.priority)
    : null;

  const parentTask =
    isSubtask && parentTaskId ? tasks.find((t) => t.id === parentTaskId) : null;

  // ✅ Use correct updater based on whether it's a subtask
  const updateItem = (updates: Record<string, any>) => {
    if (isSubtask) {
      updateSubtask(task.id, updates);
    } else {
      updateTask(task.id, updates);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return formatLocalDate(date);
  };

  const getDaysRemaining = (date?: string) => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDateOrDaysRemaining = (startDate?: string) => {
    if (!startDate) return null;
    const daysRemaining = getDaysRemaining(startDate);
    if (daysRemaining === null) return null;

    if (daysRemaining < 0) {
      return {
        text: `${Math.abs(daysRemaining)} days ago`,
        isOverdue: true,
        isDueSoon: false,
      };
    } else {
      return {
        text: formatDate(startDate),
        isOverdue: false,
        isDueSoon: daysRemaining === 0,
      };
    }
  };

  const handleStartEditName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
    setEditedName(liveTask.name);
  };

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== liveTask.name) {
      updateItem({ name: editedName.trim() }); // ✅
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setEditedName(liveTask.name);
    setIsEditingName(false);
  };

  const handleAssigneeChange = (memberId: string) => {
    updateItem({ assignee: memberId }); // ✅
    setIsAssigneeOpen(false);
  };

  const handlePriorityChange = (priority: string) => {
    updateItem({ priority }); // ✅
    setIsPriorityOpen(false);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      updateItem({ startDate: convertSelectedDateToUTC(date) });
      setIsStartDateOpen(false);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      updateItem({ endDate: convertSelectedDateToUTC(date) });
      setIsEndDateOpen(false);
    }
  };

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const getBorderColor = (task: Task | Subtask) => {
    const statusColor = task.status
      ? taskStatusConfigs.find((s) => s.value === task.status)?.color
      : undefined;
    const priorityColor = task.priority
      ? taskPriorityConfigs.find((p) => p.value === task.priority)?.color
      : undefined;
    return statusColor || priorityColor || "#34C759";
  };

  return (
    <div
      className="rounded-lg bg-card p-2 shadow-sm border border-border border-l-4 hover:shadow-md transition-shadow"
      onClick={onClick}
      style={{ borderLeftColor: getBorderColor(liveTask) }}
      data-testid={`calendar-event-card-${task.id}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Avatar with Popover */}
          <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
              <div
                className="cursor-pointer"
                data-testid={`calendar-event-card-assignee-trigger-${task.id}`}
              >
                {assignedMember ? (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                      {assignedMember.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-48 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Assign to
                </div>
                {members.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => handleAssigneeChange(member.userId)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs"
                    data-testid={`calendar-event-card-assignee-option-${member.userId}-${task.id}`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Task ID Badge */}
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 rounded-sm"
            // style={{
            //   backgroundColor: `${getBorderColor(liveTask)}20`,
            //   color: getBorderColor(liveTask),
            // }}
            data-testid={`calendar-event-card-id-badge-${task.id}`}
          >
            {formatTaskId(projectSlug, task.taskNumber)}
          </Badge>

          {/* Parent Task ID Badge - Only for subtasks */}
          {isSubtask && parentTask && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border-none"
              data-testid={`calendar-event-card-parent-id-badge-${task.id}`}
            >
              {formatTaskId(projectSlug, parentTask.taskNumber)}
            </Badge>
          )}

          {/* Priority with Popover */}
          <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
              <div
                className="cursor-pointer"
                data-testid={`calendar-event-card-priority-trigger-${task.id}`}
              >
                {priorityOption ? (
                  <Badge
                    variant="secondary"
                    className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${priorityOption.color}20`,
                      color: priorityOption.color,
                    }}
                  >
                    <Flag className="h-4 w-4" />
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="h-6 w-6 p-0 rounded-full flex items-center justify-center bg-muted border-border"
                  >
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </Badge>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-36 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                {taskPriorityConfigs.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-muted-foreground italic">
                    No priorities configured
                  </p>
                ) : (
                  taskPriorityConfigs.map((priority) => (
                    <button
                      key={priority._id}
                      onClick={() => {
                        handlePriorityChange(priority.value);
                        setIsPriorityOpen(false);
                      }}
                      style={{ color: priority.color }}
                      className="w-full flex justify-between items-center gap-2 px-2 py-1 rounded hover:bg-muted text-xs transition-colors"
                      data-testid={`calendar-event-card-priority-option-${priority.value}-${task.id}`}
                    >
                      <span>{priority.label}</span>
                      <Badge
                        variant="secondary"
                        className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${priority.color}20`,
                          color: priority.color,
                        }}
                      >
                        <Flag className="h-4 w-4" />
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Relationship Icons */}
          {(() => {
            const taskRels = getTaskRelationships(liveTask.id);
            const seenTypes = new Set<string>();
            const uniqueRels = taskRels.filter((rel) => {
              if (seenTypes.has(rel.type)) return false;
              seenTypes.add(rel.type);
              return true;
            });
            return uniqueRels.map((rel) => {
              const RelIcon = getRelationshipIcon(rel.type);
              const targetTask =
                tasks.find((t) => t.id === rel.targetTaskId) ||
                subtasks.find((st) => st.id === rel.targetTaskId);

              if (!targetTask) {
                return (
                  <RelIcon
                    key={rel.type}
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      getRelationshipIconColor(rel.type),
                    )}
                    title={getRelationshipLabel(rel.type)}
                  />
                );
              }

              return (
                <Popover
                  key={rel.type}
                  open={hoveredRelType === rel.type}
                  onOpenChange={(open) => !open && setHoveredRelType(null)}
                >
                  <PopoverTrigger asChild>
                    <div
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredRelType(rel.type)}
                      onMouseLeave={() => setHoveredRelType(null)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RelIcon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          getRelationshipIconColor(rel.type),
                        )}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-auto p-0 shadow-2xl bg-card z-[100]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RelationshipDetailDialog
                      sourceTask={liveTask}
                      relType={rel.type}
                      targetTask={targetTask}
                      projectSlug={projectSlug}
                    />
                  </PopoverContent>
                </Popover>
              );
            });
          })()}
        </div>

        {/* More Options */}
        <div data-testid={`calendar-event-card-more-btn-${task.id}`}>
          <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Task Name - Editable */}
      {isEditingName ? (
        <Input
          ref={nameInputRef}
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              handleSaveName();
            } else if (e.key === "Escape") {
              handleCancelEditName();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-sm mb-3 border-primary text-foreground"
          data-testid={`calendar-event-card-name-input-${task.id}`}
        />
      ) : (
        <h4
          className="text-sm text-foreground mb-3 line-clamp-2 hover:text-primary transition-colors cursor-pointer"
          onClick={handleStartEditName}
          data-testid={`calendar-event-card-name-text-${task.id}`}
        >
          {liveTask.name}
        </h4>
      )}

      {/* Bottom row */}
      <div className="flex items-center gap-2">
        {/* <div className="flex justify-center items-center gap-1 h-6 w-6 text-gray-400 bg-gray-100 rounded-full">
                    <MessageSquare className="h-4 w-4" />
                </div> */}

        {/* Start Date with Popover */}
        <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div
              className="cursor-pointer"
              data-testid={`calendar-event-card-startdate-trigger-${task.id}`}
            >
              {liveTask.startDate ? (
                <Badge
                  variant="secondary"
                  className="text-xs h-6 px-2 py-0.5 flex items-center gap-1 bg-muted text-muted-foreground border-none font-normal hover:bg-muted"
                >
                  <CalendarIcon className="h-3 w-3" />
                  <span className="mt-0.5">
                    {formatDate(liveTask.startDate)}
                  </span>
                </Badge>
              ) : (
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                  title="Add start date"
                >
                  <CalendarIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-2 border-0 border-b-[5px] border-primary"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <CalendarPicker
              selectedDate={
                liveTask.startDate
                  ? convertUTCToCalendarDate(liveTask.startDate)
                  : undefined
              }
              onDateSelect={handleStartDateChange}
            />
          </PopoverContent>
        </Popover>

        {liveTask.startDate && liveTask.endDate && (
          <span className="text-muted-foreground text-xs font-bold">-</span>
        )}

        {/* End Date (Due Date) with Popover */}
        <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div
              className="cursor-pointer"
              data-testid={`calendar-event-card-enddate-trigger-${task.id}`}
            >
              {liveTask.endDate ? (
                (() => {
                  const dateInfo = formatDateOrDaysRemaining(liveTask.endDate);
                  return dateInfo ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs h-6 px-2 py-0.5 flex items-center gap-1 font-normal border-none",
                        dateInfo.isOverdue && "bg-red-50 text-red-600",
                        dateInfo.isDueSoon && "bg-orange-50 text-orange-600",
                        !dateInfo.isOverdue &&
                          !dateInfo.isDueSoon &&
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="h-3 w-3" />
                      <span className="mt-0.5">{dateInfo.text}</span>
                    </Badge>
                  ) : null;
                })()
              ) : (
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                  title="Add end date"
                >
                  <CalendarIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-2 border-0 border-b-[5px] border-primary"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <CalendarPicker
              selectedDate={
                liveTask.endDate
                  ? convertUTCToCalendarDate(liveTask.endDate)
                  : undefined
              }
              onDateSelect={handleEndDateChange}
              disabled={(dt) => {
                const startLocal = convertUTCToCalendarDate(liveTask.startDate);
                return startLocal
                  ? dt < new Date(startLocal.setHours(0, 0, 0, 0))
                  : false;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
