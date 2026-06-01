// components/list-view/common/TaskSelector.tsx
"use client";

import React, { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from '@/types/task.types';

interface TaskSelectorProps {
  tasks: Task[];
  currentTaskId: string;
  onSelect: (taskId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskSelector({
  tasks,
  currentTaskId,
  onSelect,
  open,
  onOpenChange,
}: TaskSelectorProps) {
  const availableTasks = tasks.filter((t) => t.id !== currentTaskId);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Select Task
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search tasks..." />
          <CommandEmpty>No task found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {availableTasks.map((task) => (
              <CommandItem
                key={task.id}
                onSelect={() => {
                  onSelect(task.id);
                  onOpenChange(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    "opacity-0"
                  )}
                />
                {task.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
