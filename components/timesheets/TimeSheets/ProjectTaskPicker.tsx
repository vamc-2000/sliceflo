"use client"

import { useState, useEffect } from "react";
import {
  Command,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useProfileStore } from "@/stores/profile-store";
import { ChevronDown, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTaskId } from "@/utils/task-utils";

interface ProjectTaskPickerProps {
  selectedProjectId?: string | null;
  selectedTaskId?: string | null;
  onSelect: (projectId: string, taskId: string) => void;
}

export default function ProjectTaskPicker({
  selectedProjectId: initialProjectId = null,
  selectedTaskId: initialTaskId = null,
  onSelect,
}: ProjectTaskPickerProps) {
  const { user } = useProfileStore();
  const { projects } = useProjectsStore();
  const { tasks } = useTasksStore();
  const fetchTasks = useTasksStore(state => state.fetchTasks);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);

  // Sync initial props to state when they change
  useEffect(() => {
    setSelectedProjectId(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    setSelectedTaskId(initialTaskId);
  }, [initialTaskId]);

  // Fetch tasks for all projects on mount
  useEffect(() => {
    projects.forEach(project => {
      if (project.id) fetchTasks(project.id);
    });
  }, [projects, fetchTasks]);

  return (
    <Command className="overflow-hidden">
      {/* <div className="relative">
        <Search
          className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <CommandInput
          placeholder="Search"
          className="
            bg-muted
            rounded-md
            h-10
            pl-3 pr-9
            
            text-sm
            placeholder:text-muted-foreground
            focus-visible:ring-2
            focus-visible:ring-primary
            [&>svg]:!hidden
            [&>svg:first-child]:!hidden
            [data-slot='input-wrapper']>svg:!hidden
          "
        />
      </div> */}


      {/* <CommandList className="p-2 max-h-[300px] overflow-y-auto overscroll-contain"> */}
      {/* <ScrollArea className="h-[300px]"> */}
      <CommandList className="overflow-hidden">
        <ScrollArea
          className="h-[300px] p-3"
          onWheelCapture={(e) => {
            e.stopPropagation();
          }}
        >

          <Accordion type="single" collapsible className="space-y-2">
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id && (t.assignee === user?.id || (t as any).assigneeId === user?.id));

              return (
                <AccordionItem key={project.id} value={project.id!}>
                  <AccordionTrigger
                    data-testid={`project-picker-accordion-${project.id}`}
                    onClick={() => setSelectedProjectId(project.id!)}
                    className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 hover:no-underline cursor-pointer"
                  >

                    {/* LEFT */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                          h-4 w-4 rounded-full border-2 flex items-center justify-center
                          transition-colors
                          ${selectedProjectId === project.id
                            ? "border-primary"
                            : "border-muted-foreground"
                          }
                        `}
                      >
                        {selectedProjectId === project.id && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <span className="text-xs">
                        {project.name}
                      </span>
                    </div>

                  </AccordionTrigger>
                  <AccordionContent className="pl-5 space-y-3 mt-2">
                    <RadioGroup
                      value={selectedTaskId || undefined}
                      onValueChange={(taskId) => {
                        setSelectedTaskId(taskId);
                        onSelect(project.id!, taskId);
                      }}
                    >
                      {projectTasks.map((task) => (
                        <label
                          data-testid={`project-picker-task-${task.id}`}
                          key={task.id}
                          className={`
                            grid grid-cols-[20px_120px_1fr] items-center
                            gap-3 cursor-pointer w-full
                            rounded-lg border px-2 py-2
                            transition-colors
                            hover:bg-muted/50
                            ${selectedTaskId === task.id ? "border-primary bg-primary/5" : "border-border"}
                          `}
                        >
                          {/* Hidden radio */}
                          <RadioGroupItem
                            value={task.id}
                            className="sr-only"
                          />

                          {/* Custom radio */}
                          <div
                            className={`
                              h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0
                              transition-colors
                              ${selectedTaskId === task.id
                                ? "border-primary"
                                : "border-muted-foreground"
                              }
                            `}
                          >
                            {selectedTaskId === task.id && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>

                          {/* Task ID Column */}
                          <div className="text-xs font-medium bg-muted px-2 py-1 rounded-md text-center whitespace-nowrap">
                            {formatTaskId(project.slug || "TASK", task.taskNumber)}
                          </div>

                          {/* Task Name Column */}
                          <div
                            className="truncate text-xs text-foreground"
                            title={task.name}
                          >
                            {task.name}
                          </div>
                        </label>
                      ))}

                    </RadioGroup>
                    {projectTasks.length === 0 && (
                      <div className="text-sm text-muted-foreground italic pl-1">
                        No tasks found
                      </div>
                    )}
                  </AccordionContent>

                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </CommandList>
    </Command>
  );
}
