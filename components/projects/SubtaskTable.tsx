// components/projects/SubtaskTable.tsx

"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  X as XIcon,
  Calendar as CalendarIcon,
  Check,
  Flag,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import {
  formatLocalDate,
  convertSelectedDateToUTC,
  convertUTCToCalendarDate,
} from "@/utils/timezone-utils";
import { formatTaskId } from "@/utils/task-utils";
import { cn } from "@/lib/utils";

interface SubtaskTableProps {
  taskSubtasks: any[];
  projectSlug: string;
  projectId: string;
  workspaceMembers: any[];
  currentProject: any;
  updateSubtask: (id: string, updates: any) => void;
  handleToggleSubtaskComplete: (id: string, completed: boolean) => void;
  handleDeleteSubtask: (id: string) => void;
  isAddingSubtask: boolean;
  setIsAddingSubtask: (val: boolean) => void;
  newSubtaskName: string;
  setNewSubtaskName: (val: string) => void;
  handleAddSubtask: (draftData?: any) => void;
  taskStatusConfigs: any[];
  taskPriorityConfigs: any[];
}

export function SubtaskTable({
  taskSubtasks,
  projectSlug,
  projectId,
  workspaceMembers,
  currentProject,
  updateSubtask,
  handleToggleSubtaskComplete,
  handleDeleteSubtask,
  isAddingSubtask,
  setIsAddingSubtask,
  newSubtaskName,
  setNewSubtaskName,
  handleAddSubtask,
  taskStatusConfigs,
  taskPriorityConfigs,
}: SubtaskTableProps) {
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");

  // Draft local states for inline add subtask row
  const [newSubtaskStatus, setNewSubtaskStatus] = useState("backlog");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState("");
  const [newSubtaskStartDate, setNewSubtaskStartDate] = useState<string | undefined>(undefined);
  const [newSubtaskEndDate, setNewSubtaskEndDate] = useState<string | undefined>(undefined);
  const [newSubtaskPriority, setNewSubtaskPriority] = useState("");

  const getPriorityColor = (priorityValue?: string) => {
    const priority = taskPriorityConfigs.find((p) => p.value === priorityValue);
    return priority?.color;
  };

  const handleSaveSubtask = () => {
    if (!newSubtaskName.trim()) return;
    handleAddSubtask({
      name: newSubtaskName,
      status: newSubtaskStatus || "backlog",
      assignee: newSubtaskAssignee || undefined,
      startDate: newSubtaskStartDate || undefined,
      endDate: newSubtaskEndDate || undefined,
      priority: newSubtaskPriority || undefined,
    });
    // Reset local draft fields
    setNewSubtaskStatus("backlog");
    setNewSubtaskAssignee("");
    setNewSubtaskStartDate(undefined);
    setNewSubtaskEndDate(undefined);
    setNewSubtaskPriority("");
  };

  const handleCancelSubtask = () => {
    setIsAddingSubtask(false);
    setNewSubtaskName("");
    setNewSubtaskStatus("backlog");
    setNewSubtaskAssignee("");
    setNewSubtaskStartDate(undefined);
    setNewSubtaskEndDate(undefined);
    setNewSubtaskPriority("");
  };

  return (
    <div className="border border-border rounded-sm overflow-x-auto w-full relative">
      <Table className="text-xs table-fixed" style={{ minWidth: "1006px", width: "1006px" }}>
        <TableHeader>
          <TableRow className="h-9 border-b border-border bg-card hover:bg-card">
            {/* 1. Checkbox Column (Sticky Left) */}
            <TableHead
              className="sticky left-0 bg-card z-30 px-3 py-0 h-9 align-middle text-center select-none"
              style={{
                width: "48px",
                minWidth: "48px",
                maxWidth: "48px",
                boxShadow: "inset 4px 0 0 0 #c4c4c4, inset -1px 0 0 0 var(--border)",
              }}
            >
              <div className="flex items-center justify-center h-full w-full">
                <Checkbox
                  checked={
                    taskSubtasks.length > 0 &&
                    taskSubtasks.every((st) => st.completed)
                  }
                  disabled={taskSubtasks.length === 0}
                  onCheckedChange={(checked) => {
                    taskSubtasks.forEach((st) =>
                      handleToggleSubtaskComplete(st.id, checked as boolean)
                    );
                  }}
                  className="size-4 shrink-0 rounded flex items-center justify-center [&_[data-slot=checkbox-indicator]]:flex [&_[data-slot=checkbox-indicator]]:items-center [&_[data-slot=checkbox-indicator]]:justify-center [&_[data-slot=checkbox-indicator]_svg]:size-2.5"
                  data-testid="task-detail-subtask-checkbox-all"
                />
              </div>
            </TableHead>

            {/* 2. ID Column (Sticky Left) */}
            <TableHead
              className="sticky left-[48px] bg-card z-30 text-center px-3 py-0 h-9 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground select-none"
              style={{
                width: "80px",
                minWidth: "80px",
                maxWidth: "80px",
                boxShadow: "inset -1px 0 0 0 var(--border)",
              }}
            >
              <div className="flex items-center justify-center w-full">ID</div>
            </TableHead>

            {/* 3. TASK Column (Sticky Left) */}
            <TableHead
              className="sticky left-[128px] bg-card z-30 text-left px-3 py-0 h-9 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground select-none"
              style={{
                width: "250px",
                minWidth: "250px",
                maxWidth: "250px",
                boxShadow: "inset -1px 0 0 0 var(--border), 2px 0 4px rgba(0,0,0,0.04)",
              }}
            >
              Task
            </TableHead>

            {/* 4. STATUS Column */}
            <TableHead
              className="text-center px-3 py-0 h-9 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-border bg-card select-none"
              style={{
                width: "120px",
                minWidth: "120px",
                maxWidth: "120px",
              }}
            >
              <div className="flex items-center justify-center w-full">Status</div>
            </TableHead>

            {/* 5. ASSIGNEE Column */}
            <TableHead
              className="text-center px-3 py-0 h-9 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-border bg-card select-none"
              style={{
                width: "130px",
                minWidth: "130px",
                maxWidth: "130px",
              }}
            >
              <div className="flex items-center justify-center w-full">Assignee</div>
            </TableHead>

            {/* 6. START DATE Column */}
            <TableHead
              className="text-center px-3 py-0 h-9 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-border bg-card select-none"
              style={{
                width: "110px",
                minWidth: "110px",
                maxWidth: "110px",
              }}
            >
              <div className="flex items-center justify-center w-full">Start Date</div>
            </TableHead>

            {/* 7. END DATE Column */}
            <TableHead
              className="text-center px-3 py-0 h-9 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-border bg-card select-none"
              style={{
                width: "110px",
                minWidth: "110px",
                maxWidth: "110px",
              }}
            >
              <div className="flex items-center justify-center w-full">End Date</div>
            </TableHead>

            {/* 8. PRIORITY Column */}
            <TableHead
              className="text-center px-3 py-0 h-9 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-border bg-card select-none"
              style={{
                width: "110px",
                minWidth: "110px",
                maxWidth: "110px",
              }}
            >
              <div className="flex items-center justify-center w-full">Priority</div>
            </TableHead>

            {/* 9. Actions Column (Sticky Right) */}
            <TableHead
              className="sticky right-0 bg-card z-30 px-3 py-0 h-9 align-middle text-center select-none"
              style={{
                width: "48px",
                minWidth: "48px",
                maxWidth: "48px",
                boxShadow: "inset 1px 0 0 0 var(--border), -2px 0 4px rgba(0,0,0,0.04)",
              }}
            >
              {/* Empty header for actions */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Existing Subtasks */}
          {taskSubtasks.map((subtask) => {
            const statusColor =
              taskStatusConfigs.find((c) => c.value === subtask.status)
                ?.color || "#c4c4c4";

             return (
              <TableRow
                key={subtask.id}
                className="bg-card hover:bg-muted border-b border-border transition-colors h-9 group"
              >
                {/* 1. Checkbox */}
                <TableCell
                  className="sticky left-0 bg-card group-hover:bg-muted transition-colors px-3 py-0 h-9 align-middle text-center z-10"
                  style={{
                    width: "48px",
                    minWidth: "48px",
                    maxWidth: "48px",
                    boxShadow: `inset 4px 0 0 0 ${statusColor}, inset -1px 0 0 0 var(--border)`,
                  }}
                >
                  <div className="flex items-center justify-center h-full w-full">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={(checked) =>
                        handleToggleSubtaskComplete(subtask.id, checked as boolean)
                      }
                      className="size-4 shrink-0 rounded flex items-center justify-center [&_[data-slot=checkbox-indicator]]:flex [&_[data-slot=checkbox-indicator]]:items-center [&_[data-slot=checkbox-indicator]]:justify-center [&_[data-slot=checkbox-indicator]_svg]:size-2.5"
                      data-testid={`task-detail-subtask-checkbox-${subtask.id}`}
                    />
                  </div>
                </TableCell>

                {/* 2. ID */}
                <TableCell
                  className="sticky left-[48px] bg-card group-hover:bg-muted transition-colors px-3 py-0 h-9 align-middle text-xs text-muted-foreground text-center z-10"
                  style={{
                    width: "80px",
                    minWidth: "80px",
                    maxWidth: "80px",
                    boxShadow: "inset -1px 0 0 0 var(--border)",
                  }}
                >
                  {formatTaskId(projectSlug, subtask.taskNumber)}
                </TableCell>

                {/* 3. Task Name */}
                <TableCell
                  className="sticky left-[128px] bg-card group-hover:bg-muted transition-colors px-3 py-0 h-9 align-middle text-xs z-10"
                  style={{
                    width: "250px",
                    minWidth: "250px",
                    maxWidth: "250px",
                    boxShadow: "inset -1px 0 0 0 var(--border), 2px 0 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <span
                    className={cn(
                      subtask.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {subtask.name}
                  </span>
                </TableCell>

                {/* 4. Status Dropdown */}
                <TableCell
                  className="p-0 h-9 align-middle text-center border-r border-border"
                  style={{
                    width: "120px",
                    minWidth: "120px",
                    maxWidth: "120px",
                  }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-full h-full flex items-center justify-center text-foreground text-xs font-semibold transition-opacity hover:opacity-90 overflow-hidden px-3"
                        style={{
                          backgroundColor: statusColor,
                        }}
                      >
                        <span className="truncate w-full text-center">
                          {taskStatusConfigs.find((c) => c.value === subtask.status)
                            ?.label || "—"}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[60] bg-background">
                      {taskStatusConfigs.map((config) => (
                        <DropdownMenuItem
                          key={config._id}
                          onSelect={() =>
                            updateSubtask(subtask.id, { status: config.value })
                          }
                          className="p-0 focus:bg-transparent"
                        >
                          <div
                            className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 cursor-pointer"
                            style={{
                              backgroundColor: config.color || "#c4c4c4",
                            }}
                          >
                            <span className="truncate w-full text-center">
                              {config.label}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      {taskStatusConfigs.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onSelect={() =>
                          updateSubtask(subtask.id, { status: undefined })
                        }
                        className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                      >
                        Clear
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                {/* 5. Assignee Dropdown */}
                <TableCell
                  className="p-0 h-9 align-middle text-center border-r border-border"
                  style={{
                    width: "130px",
                    minWidth: "130px",
                    maxWidth: "130px",
                  }}
                >
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (!open) setAssigneeSearchQuery("");
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <button className="w-full h-full flex justify-center items-center gap-2 hover:bg-muted/50 px-2 transition-colors min-w-0">
                        {subtask.assignee ? (
                          (() => {
                            const member = workspaceMembers.find(
                              (m) => m.userId === subtask.assignee
                            );
                            const name = member?.name || subtask.assignee;
                            return (
                              <div className="flex items-center gap-2 min-w-0 truncate">
                                <MemberAvatar
                                  size="sm"
                                  name={name}
                                  src={member?.avatar || member?.profilePicture}
                                />
                              </div>
                            );
                          })()
                        ) : (
                          <MemberAvatar size="sm" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[60] bg-background">
                      <div
                        className="px-1 pb-2"
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Input
                          placeholder="Type @ or name..."
                          value={assigneeSearchQuery}
                          onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                          className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {workspaceMembers
                          .filter((wm) =>
                            currentProject?.members?.some(
                              (pm: any) => pm.userId === wm.userId
                            )
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
                                (pm: any) => pm.userId === wm.userId
                              )
                            )
                            .filter((wm) => {
                              if (!assigneeSearchQuery) return true;
                              const query = assigneeSearchQuery
                                .toLowerCase()
                                .replace(/^@/, "");
                              return wm.name?.toLowerCase().includes(query);
                            })
                            .map((member) => (
                              <DropdownMenuItem
                                key={member.userId}
                                onSelect={() =>
                                  updateSubtask(subtask.id, {
                                    assignee: member.userId,
                                  })
                                }
                                className="p-0 focus:bg-transparent"
                              >
                                <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground cursor-pointer">
                                  <MemberAvatar
                                    size="sm"
                                    name={member.name}
                                    src={member.profilePicture}
                                  />
                                  <span className="truncate">{member.name}</span>
                                </div>
                              </DropdownMenuItem>
                            ))
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() =>
                          updateSubtask(subtask.id, { assignee: undefined })
                        }
                        className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                      >
                        Clear
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                {/* 6. Start Date Popover */}
                <TableCell
                  className="p-0 h-9 align-middle text-center border-r border-border"
                  style={{
                    width: "110px",
                    minWidth: "110px",
                    maxWidth: "110px",
                  }}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full h-full flex items-center justify-center gap-1.5 hover:bg-muted/50 px-2 cursor-pointer transition-colors text-xs font-semibold text-muted-foreground hover:text-foreground">
                        {subtask.startDate ? (
                          formatLocalDate(subtask.startDate)
                        ) : (
                          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-2 border-0 border-b-[5px] border-b-primary z-[60] bg-background"
                      align="center"
                    >
                      <CalendarPicker
                        selectedDate={
                          subtask.startDate
                            ? convertUTCToCalendarDate(subtask.startDate)
                            : undefined
                        }
                        onDateSelect={(date) => {
                          if (date) {
                            const updates: any = {
                              startDate: convertSelectedDateToUTC(date),
                            };
                            if (
                              subtask.endDate &&
                              new Date(subtask.endDate) < date
                            ) {
                              updates.endDate = undefined;
                            }
                            updateSubtask(subtask.id, updates);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>

                {/* 7. End Date Popover */}
                <TableCell
                  className="p-0 h-9 align-middle text-center border-r border-border"
                  style={{
                    width: "110px",
                    minWidth: "110px",
                    maxWidth: "110px",
                  }}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full h-full flex items-center justify-center gap-1.5 hover:bg-muted/50 px-2 cursor-pointer transition-colors text-xs font-semibold text-muted-foreground hover:text-foreground">
                        {subtask.endDate ? (
                          formatLocalDate(subtask.endDate)
                        ) : (
                          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-2 border-0 border-b-[5px] border-b-primary z-[60] bg-background"
                      align="center"
                    >
                      <CalendarPicker
                        selectedDate={
                          subtask.endDate
                            ? convertUTCToCalendarDate(subtask.endDate)
                            : undefined
                        }
                        onDateSelect={(date) => {
                          if (date) {
                            updateSubtask(subtask.id, {
                              endDate: convertSelectedDateToUTC(date),
                            });
                          }
                        }}
                        disabled={(date) => {
                          const startLocal = subtask.startDate
                            ? convertUTCToCalendarDate(subtask.startDate)
                            : null;
                          return startLocal
                            ? date < new Date(startLocal.setHours(0, 0, 0, 0))
                            : false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>

                {/* 8. Priority Dropdown */}
                <TableCell
                  className="p-0 h-9 align-middle text-center border-r border-border"
                  style={{
                    width: "110px",
                    minWidth: "110px",
                    maxWidth: "110px",
                  }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-full h-full flex items-center justify-center gap-1.5 text-foreground text-xs font-semibold hover:bg-muted/50 px-2 transition-colors min-w-0"
                        style={{
                          backgroundColor: subtask.priority
                            ? `${getPriorityColor(subtask.priority) || "#9CA3AF"}33`
                            : undefined,
                        }}
                      >
                        {taskPriorityConfigs.find((p) => p.value === subtask.priority)
                          ?.label && (
                          <span className="truncate text-xs font-semibold">
                            {taskPriorityConfigs.find((p) => p.value === subtask.priority)?.label}
                          </span>
                        )}
                        <Flag
                          className="h-3.5 w-3.5 flex-shrink-0"
                          style={{
                            color: getPriorityColor(subtask.priority) || "#9CA3AF",
                          }}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[60] bg-background">
                      {taskPriorityConfigs.map((option) => (
                        <DropdownMenuItem
                          key={option._id}
                          onSelect={() =>
                            updateSubtask(subtask.id, { priority: option.value })
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
                      {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onSelect={() =>
                          updateSubtask(subtask.id, { priority: undefined })
                        }
                        className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                      >
                        Clear
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                {/* 9. Actions */}
                <TableCell
                  className="sticky right-0 bg-card group-hover:bg-muted transition-colors p-0 h-9 align-middle text-center z-10"
                  style={{
                    width: "48px",
                    minWidth: "48px",
                    maxWidth: "48px",
                    boxShadow: "inset 1px 0 0 0 var(--border), -2px 0 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-full rounded-none hover:bg-muted/50"
                        data-testid={`task-detail-subtask-menu-trigger-${subtask.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="text-red-600"
                        data-testid={`task-detail-subtask-delete-btn-${subtask.id}`}
                      >
                        Delete Subtask
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Inline Add Subtask Row (Now placed below the existing subtasks list) */}
          {isAddingSubtask && (
            <TableRow className="bg-card border-b border-border hover:bg-muted transition-colors h-9 group">
              {/* 1. Checkbox */}
              <TableCell
                className="sticky left-0 bg-card group-hover:bg-muted transition-colors p-0 h-9 align-middle text-center z-10"
                style={{
                  width: "48px",
                  minWidth: "48px",
                  maxWidth: "48px",
                  boxShadow: "inset 4px 0 0 0 #c4c4c4, inset -1px 0 0 0 var(--border)",
                }}
              >
                <div className="flex items-center justify-center h-full w-full">
                  <Checkbox
                    className="size-4 shrink-0 rounded flex items-center justify-center opacity-50"
                    disabled
                  />
                </div>
              </TableCell>

              {/* 2. ID */}
              <TableCell
                className="sticky left-[48px] bg-card group-hover:bg-muted transition-colors p-0 h-9 align-middle text-xs text-muted-foreground text-center z-10"
                style={{
                  width: "80px",
                  minWidth: "80px",
                  maxWidth: "80px",
                  boxShadow: "inset -1px 0 0 0 var(--border)",
                }}
              >
                <span className="opacity-50">Auto</span>
              </TableCell>

              {/* 3. Task Input */}
              <TableCell
                className="sticky left-[128px] bg-card group-hover:bg-muted transition-colors px-3 py-0 h-9 align-middle z-10"
                style={{
                  width: "250px",
                  minWidth: "250px",
                  maxWidth: "250px",
                  boxShadow: "inset -1px 0 0 0 var(--border), 2px 0 4px rgba(0,0,0,0.04)",
                }}
              >
                <Input
                  value={newSubtaskName}
                  onChange={(e) => setNewSubtaskName(e.target.value)}
                  placeholder="Type subtask name..."
                  className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubtaskName.trim()) {
                      handleSaveSubtask();
                    } else if (e.key === "Escape") {
                      handleCancelSubtask();
                    }
                  }}
                  autoFocus
                  data-testid="task-detail-subtask-new-input"
                />
              </TableCell>

              {/* 4. Status (Fully Editable Draft Field) */}
              <TableCell
                className="p-0 h-9 align-middle text-center border-r border-border"
                style={{
                  width: "120px",
                  minWidth: "120px",
                  maxWidth: "120px",
                }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full h-full flex items-center justify-center text-foreground text-xs font-semibold transition-opacity hover:opacity-90 overflow-hidden px-3"
                      style={{
                        backgroundColor:
                          taskStatusConfigs.find((c) => c.value === newSubtaskStatus)
                            ?.color || "#c4c4c4",
                      }}
                    >
                      <span className="truncate w-full text-center">
                        {taskStatusConfigs.find((c) => c.value === newSubtaskStatus)
                          ?.label || "—"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[60] bg-background">
                    {taskStatusConfigs.map((config) => (
                      <DropdownMenuItem
                        key={config._id}
                        onSelect={() => setNewSubtaskStatus(config.value)}
                        className="p-0 focus:bg-transparent"
                      >
                        <div
                          className="w-full h-9 flex items-center justify-center rounded-xs text-foreground text-xs font-medium transition-opacity hover:opacity-90 px-3 cursor-pointer"
                          style={{
                            backgroundColor: config.color || "#c4c4c4",
                          }}
                        >
                          <span className="truncate w-full text-center">
                            {config.label}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {taskStatusConfigs.length > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onSelect={() => setNewSubtaskStatus("")}
                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                    >
                      Clear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

              {/* 5. Assignee (Fully Editable Draft Field) */}
              <TableCell
                className="p-0 h-9 align-middle text-center border-r border-border"
                style={{
                  width: "130px",
                  minWidth: "130px",
                  maxWidth: "130px",
                }}
              >
                <DropdownMenu
                  onOpenChange={(open) => {
                    if (!open) setAssigneeSearchQuery("");
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button className="w-full h-full flex justify-center items-center gap-2 hover:bg-muted/50 px-2 transition-colors min-w-0">
                      {newSubtaskAssignee ? (
                        (() => {
                          const member = workspaceMembers.find(
                            (m) => m.userId === newSubtaskAssignee
                          );
                          const name = member?.name || newSubtaskAssignee;
                          return (
                            <div className="flex items-center gap-2 min-w-0 truncate">
                              <MemberAvatar
                                size="sm"
                                name={name}
                                src={member?.avatar || member?.profilePicture}
                              />
                            </div>
                          );
                        })()
                      ) : (
                        <MemberAvatar size="sm" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[60] bg-background">
                    <div
                      className="px-1 pb-2"
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Input
                        placeholder="Type @ or name..."
                        value={assigneeSearchQuery}
                        onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                        className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {workspaceMembers
                        .filter((wm) =>
                          currentProject?.members?.some(
                            (pm: any) => pm.userId === wm.userId
                          )
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
                              (pm: any) => pm.userId === wm.userId
                            )
                          )
                          .filter((wm) => {
                            if (!assigneeSearchQuery) return true;
                            const query = assigneeSearchQuery
                              .toLowerCase()
                              .replace(/^@/, "");
                            return wm.name?.toLowerCase().includes(query);
                          })
                          .map((member) => (
                            <DropdownMenuItem
                              key={member.userId}
                              onSelect={() => setNewSubtaskAssignee(member.userId)}
                              className="p-0 focus:bg-transparent"
                            >
                              <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-muted text-foreground cursor-pointer">
                                <MemberAvatar
                                  size="sm"
                                  name={member.name}
                                  src={member.profilePicture}
                                />
                                <span className="truncate">{member.name}</span>
                              </div>
                            </DropdownMenuItem>
                          ))
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setNewSubtaskAssignee("")}
                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                    >
                      Clear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

              {/* 6. Start Date (Fully Editable Draft Field) */}
              <TableCell
                className="p-0 h-9 align-middle text-center border-r border-border"
                style={{
                  width: "110px",
                  minWidth: "110px",
                  maxWidth: "110px",
                }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full h-full flex items-center justify-center gap-1.5 hover:bg-muted/50 px-2 cursor-pointer transition-colors text-xs font-semibold text-muted-foreground hover:text-foreground">
                      {newSubtaskStartDate ? (
                        formatLocalDate(newSubtaskStartDate)
                      ) : (
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-2 border-0 border-b-[5px] border-b-primary z-[60] bg-background"
                    align="center"
                  >
                    <CalendarPicker
                      selectedDate={
                        newSubtaskStartDate
                          ? convertUTCToCalendarDate(newSubtaskStartDate)
                          : undefined
                      }
                      onDateSelect={(date) => {
                        if (date) {
                          const startUtc = convertSelectedDateToUTC(date);
                          setNewSubtaskStartDate(startUtc);
                          if (
                            newSubtaskEndDate &&
                            new Date(newSubtaskEndDate) < date
                          ) {
                            setNewSubtaskEndDate(undefined);
                          }
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </TableCell>

              {/* 7. End Date (Fully Editable Draft Field) */}
              <TableCell
                className="p-0 h-9 align-middle text-center border-r border-border"
                style={{
                  width: "110px",
                  minWidth: "110px",
                  maxWidth: "110px",
                }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full h-full flex items-center justify-center gap-1.5 hover:bg-muted/50 px-2 cursor-pointer transition-colors text-xs font-semibold text-muted-foreground hover:text-foreground">
                      {newSubtaskEndDate ? (
                        formatLocalDate(newSubtaskEndDate)
                      ) : (
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-2 border-0 border-b-[5px] border-b-primary z-[60] bg-background"
                    align="center"
                  >
                    <CalendarPicker
                      selectedDate={
                        newSubtaskEndDate
                          ? convertUTCToCalendarDate(newSubtaskEndDate)
                          : undefined
                      }
                      onDateSelect={(date) => {
                        if (date) {
                          setNewSubtaskEndDate(convertSelectedDateToUTC(date));
                        }
                      }}
                      disabled={(date) => {
                        const startLocal = newSubtaskStartDate
                          ? convertUTCToCalendarDate(newSubtaskStartDate)
                          : null;
                        return startLocal
                          ? date < new Date(startLocal.setHours(0, 0, 0, 0))
                          : false;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </TableCell>

              {/* 8. Priority (Fully Editable Draft Field) */}
              <TableCell
                className="p-0 h-9 align-middle text-center border-r border-border"
                style={{
                  width: "110px",
                  minWidth: "110px",
                  maxWidth: "110px",
                }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full h-full flex items-center justify-center gap-1.5 text-foreground text-xs font-semibold hover:bg-muted/50 px-2 transition-colors min-w-0"
                      style={{
                        backgroundColor: newSubtaskPriority
                          ? `${getPriorityColor(newSubtaskPriority) || "#9CA3AF"}33`
                          : undefined,
                      }}
                    >
                      {taskPriorityConfigs.find((p) => p.value === newSubtaskPriority)
                        ?.label && (
                        <span className="truncate text-xs font-semibold">
                          {taskPriorityConfigs.find((p) => p.value === newSubtaskPriority)?.label}
                        </span>
                      )}
                      <Flag
                        className="h-3.5 w-3.5 flex-shrink-0"
                        style={{
                          color: getPriorityColor(newSubtaskPriority) || "#9CA3AF",
                        }}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-b-primary z-[60] bg-background">
                    {taskPriorityConfigs.map((option) => (
                      <DropdownMenuItem
                        key={option._id}
                        onSelect={() => setNewSubtaskPriority(option.value)}
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
                    {taskPriorityConfigs.length > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onSelect={() => setNewSubtaskPriority("")}
                      className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
                    >
                      Clear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

              {/* 9. Actions */}
              <TableCell
                className="sticky right-0 bg-card group-hover:bg-muted transition-colors p-0 h-9 align-middle text-center z-10"
                style={{
                  width: "48px",
                  minWidth: "48px",
                  maxWidth: "48px",
                  boxShadow: "inset 1px 0 0 0 var(--border), -2px 0 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center justify-center gap-0.5">
                  <button
                    onClick={handleSaveSubtask}
                    disabled={!newSubtaskName.trim()}
                    className="h-5 w-5 flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 rounded-sm transition-colors shrink-0 disabled:opacity-50"
                    title="Save (Enter)"
                    data-testid="task-detail-subtask-new-save-btn"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleCancelSubtask}
                    className="h-5 w-5 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-sm transition-colors shrink-0"
                    title="Cancel (Esc)"
                    data-testid="task-detail-subtask-new-cancel-btn"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* "+ Add Subtask" Row (always positioned at the bottom of the table) */}
          {!isAddingSubtask && (
            <TableRow
              className="group border-b border-border transition-colors hover:bg-muted cursor-pointer h-9"
              onClick={() => setIsAddingSubtask(true)}
              data-testid="task-detail-subtask-add-row"
            >
              {/* 1. Checkbox area */}
              <TableCell
                className="sticky left-0 bg-card group-hover:bg-muted transition-colors p-0 text-center h-9 align-middle z-10"
                style={{
                  width: "48px",
                  minWidth: "48px",
                  maxWidth: "48px",
                  boxShadow: "inset 4px 0 0 0 #c4c4c4, inset -1px 0 0 0 var(--border)",
                }}
              />
              {/* 2. ID area */}
              <TableCell
                className="sticky left-[48px] bg-card group-hover:bg-muted transition-colors p-0 h-9 align-middle text-center z-10"
                style={{
                  width: "80px",
                  minWidth: "80px",
                  maxWidth: "80px",
                  boxShadow: "inset -1px 0 0 0 var(--border)",
                }}
              />
              {/* 3. Task / Add Subtask button */}
              <TableCell
                className="sticky left-[128px] bg-card group-hover:bg-muted transition-colors px-3 py-0 h-9 align-middle z-10"
                style={{
                  width: "250px",
                  minWidth: "250px",
                  maxWidth: "250px",
                  boxShadow: "inset -1px 0 0 0 var(--border), 2px 0 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Subtask</span>
                </div>
              </TableCell>
              {/* 4. Status */}
              <TableCell
                className="p-0 h-9 align-middle text-center"
                style={{
                  width: "120px",
                  minWidth: "120px",
                  maxWidth: "120px",
                }}
              />
              {/* 5. Assignee */}
              <TableCell
                className="p-0 h-9 align-middle text-center"
                style={{
                  width: "130px",
                  minWidth: "130px",
                  maxWidth: "130px",
                }}
              />
              {/* 6. Start Date */}
              <TableCell
                className="p-0 h-9 align-middle text-center"
                style={{
                  width: "110px",
                  minWidth: "110px",
                  maxWidth: "110px",
                }}
              />
              {/* 7. End Date */}
              <TableCell
                className="p-0 h-9 align-middle text-center"
                style={{
                  width: "110px",
                  minWidth: "110px",
                  maxWidth: "110px",
                }}
              />
              {/* 8. Priority */}
              <TableCell
                className="p-0 h-9 align-middle text-center"
                style={{
                  width: "110px",
                  minWidth: "110px",
                  maxWidth: "110px",
                }}
              />
              {/* 9. Actions */}
              <TableCell
                className="sticky right-0 bg-card group-hover:bg-muted transition-colors p-0 h-9 align-middle text-center z-10"
                style={{
                  width: "48px",
                  minWidth: "48px",
                  maxWidth: "48px",
                }}
              />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
