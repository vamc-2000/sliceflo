"use client";

import { Cycle } from "@/stores/projects-store";
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

interface CycleCardProps {
  cycle: Cycle;
  onEdit: (cycle: Cycle) => void;
  onDelete: (cycleId: string) => void;
  type: "active" | "upcoming" | "completed";
  hideBadges?: boolean;
}

export function CycleCard({ cycle, onEdit, onDelete, type, hideBadges = false }: CycleCardProps) {
  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);

  const router = useRouter();

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
          {cycle.name}
        </h3>
      </div>

      <div className="flex items-center gap-3">
        {!hideBadges && (
          <>
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
                {cycle.taskCount || 0} tasks
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
                type === "active" ? "text-primary" : "text-muted-foreground opacity-40 group-hover:opacity-100",
                type === "completed" && "text-emerald-600 dark:text-emerald-400"
              )}
              data-testid={`cycle-card-menu-trigger-${cycle.id}`}
            >
              <MoreHorizontal className="h-4 w-4 font-bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(cycle)} data-testid={`cycle-card-edit-${cycle.id}`}>
              Edit Cycle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(cycle.id)}
              data-testid={`cycle-card-delete-${cycle.id}`}
            >
              Delete Cycle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
