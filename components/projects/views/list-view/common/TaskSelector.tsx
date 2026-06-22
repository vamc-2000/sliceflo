// components/list-view/common/TaskSelector.tsx
"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Task } from "@/types/task.types";
import { formatTaskId } from "@/utils/task-utils";
import { useProjectsStore } from "@/stores/projects-store";

interface TaskSelectorProps {
  tasks: Task[];
  currentTaskId: string;
  onSelect: (taskId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  "data-testid"?: string;
}

export function TaskSelector({
  tasks,
  currentTaskId,
  onSelect,
  open,
  onOpenChange,
  "data-testid": dataTestId,
}: TaskSelectorProps) {
  const { projects } = useProjectsStore();
  const [searchQuery, setSearchQuery] = useState("");

  const availableTasks = tasks.filter((t) => t.id !== currentTaskId);

  // Find the project of the current tasks to format Task ID (e.g. XYZ-12)
  const project = projects.find((p) => p.id === tasks[0]?.projectId);
  const projectSlug = project?.slug ?? "TASK";

  const filteredTasks = availableTasks.filter((task) => {
    const taskIdStr = formatTaskId(projectSlug, task.taskNumber);
    const query = searchQuery.toLowerCase();
    return (
      task.name.toLowerCase().includes(query) ||
      taskIdStr.toLowerCase().includes(query)
    );
  });

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setSearchQuery("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border border-input bg-background text-foreground hover:bg-muted"
          data-testid={dataTestId}
        >
          Select Task
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[300px] p-0 border-0 border-b-[5px] border-b-primary bg-background"
        align="start"
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                // Prevent dropdown closing or navigating on space/enter key press
                if (e.key === " " || e.key === "Enter") {
                  e.stopPropagation();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const taskIdStr = formatTaskId(projectSlug, task.taskNumber);
              return (
                <DropdownMenuItem
                  key={task.id}
                  onSelect={() => {
                    onSelect(task.id);
                    onOpenChange(false);
                  }}
                  className="cursor-pointer text-xs flex items-center gap-2 px-2 py-1.5 rounded-sm"
                  data-testid={`task-detail-relation-selector-option-${task.id}`}
                >
                  <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                    {taskIdStr}
                  </span>
                  <span className="truncate font-medium flex-1 min-w-0">
                    {task.name}
                  </span>
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No tasks found.
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
