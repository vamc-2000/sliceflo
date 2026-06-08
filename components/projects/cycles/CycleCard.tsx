"use client";

import { Cycle, useProjectsStore } from "@/stores/projects-store";
import { format } from "date-fns";
import { Calendar, MoreHorizontal, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { formatCycleName } from "@/utils/cycle-utils";
import { toast } from "@/components/ui/sonner";
import { useTasksStore } from "@/stores/tasks-store";

interface CycleCardProps {
  cycle: Cycle;
  onEdit: (cycle: Cycle) => void;
  onDelete: (cycleId: string) => void;
  type: "active" | "upcoming" | "completed";
  hideBadges?: boolean;
  onTransferTasks?: (cycleId: string) => void;
}

export function CycleCard({ cycle, onEdit, onDelete, type, hideBadges = false, onTransferTasks }: CycleCardProps) {
  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);

  const router = useRouter();
  const { updateCycle, projects } = useProjectsStore();
  const { tasks } = useTasksStore();

  const project = projects.find(p => p.id === cycle.projectId);

  const cycleTasks = tasks.filter(task => {
    return task.projectId === cycle.projectId &&
      (task.cycleId === cycle.id || task.cycle?.id === cycle.id);
  });

  const totalCount = cycleTasks.length;

  const incompleteTasks = cycleTasks.filter(task => {
    if (task.completed === true) return false;
    const status = task.status?.toLowerCase().trim() ?? "";
    if (status === "done" || status === "completed") return false;
    return true;
  });

  const incompleteCount = incompleteTasks.length;

  const handleStartToday = async () => {
    try {
      const oldStart = new Date(cycle.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const offsetMs = today.getTime() - oldStart.getTime();
      const newEnd = new Date(new Date(cycle.endDate).getTime() + offsetMs);

      await updateCycle(cycle.projectId, cycle.id, {
        startDate: today.toISOString(),
        endDate: newEnd.toISOString()
      });
    } catch (error) {
      console.error("Failed to start cycle today:", error);
    }
  };

  const themes = {
    active: {
      bg: "bg-primary/10",
      border: "border-primary/20",
      text: "text-primary font-semibold",
      icon: "text-primary",
      dots: "text-primary"
    },
    upcoming: {
      bg: "bg-muted",
      border: "border-border",
      text: "text-muted-foreground font-semibold",
      icon: "text-muted-foreground",
      dots: "text-muted-foreground"
    },
    completed: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400 font-semibold",
      icon: "text-emerald-600 dark:text-emerald-400",
      dots: "text-emerald-600 dark:text-emerald-400"
    }
  };

  const currentTheme = themes[type];

  return (
    <div
      onClick={() => router.push(`/project/${cycle.projectId}/cycles/${cycle.id}`)}
      className={cn(
        "group flex items-center justify-between p-1.5 rounded-lg border transition-all hover:brightness-95 cursor-pointer",
        currentTheme.bg,
        currentTheme.border
      )}
      data-testid={`cycle-card-${cycle.id}`}
    >
      <div className="flex items-center gap-3 flex-1 pl-2">
        <h3 className={cn("text-xs tracking-tight", currentTheme.text)}>
          {formatCycleName(cycle.name, cycle.cycleNumber)}
        </h3>
      </div>

      <div className="flex items-center gap-3">
        {!hideBadges && (
          <>
            {type === "completed" && incompleteCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm", currentTheme.text)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log(`Transfer ${incompleteCount} tasks for cycle ${cycle.name} (${cycle.id})`, incompleteTasks);
                  if (onTransferTasks) {
                    onTransferTasks(cycle.id);
                  }
                }}
              >
                Transfer {incompleteCount} tasks
              </Button>
            )}

            {/* Date Range Badge */}
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border shadow-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground">
                {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
              </span>
            </div>

            {/* Task Count Badge */}
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border shadow-sm">
              <Link2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground">
                {totalCount} tasks
              </span>
            </div>
          </>
        )}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-7 w-7 p-0 transition-opacity flex items-center justify-center",
                type === "active" ? "text-primary" : "text-muted-foreground",
                type === "completed" && "text-emerald-600 dark:text-emerald-400"
              )}
              onClick={(e) => e.stopPropagation()}
              data-testid={`cycle-card-menu-trigger-${cycle.id}`}
            >
              <MoreHorizontal className="h-4 w-4 font-bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {type !== "completed" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(cycle);
                }}
                data-testid={`cycle-card-edit-${cycle.id}`}
              >
                Edit Cycle
              </DropdownMenuItem>
            )}

            {type === "upcoming" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartToday();
                }}
                data-testid={`cycle-card-start-today-${cycle.id}`}
              >
                Start cycle today
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/project/${cycle.projectId}/cycles/${cycle.id}`, '_blank');
              }}
              data-testid={`cycle-card-open-tab-${cycle.id}`}
            >
              Open in new tab
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/project/${cycle.projectId}/cycles/${cycle.id}`);
                toast("success", {
                  title: "Link copied",
                  description: "Cycle link has been copied to your clipboard."
                });
              }}
              data-testid={`cycle-card-copy-link-${cycle.id}`}
            >
              Copy cycle link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
