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
      bg: "bg-[#E5E7EB]", // Darker blue-grey / slate background as in mockup
      border: "border-gray-300",
      text: "text-[#001F3F] font-semibold",
      icon: "text-[#001F3F]",
      dots: "text-[#001F3F]"
    },
    upcoming: {
      bg: "bg-[#F3F4F6]", // Very light blue-grey / slate as in mockup
      border: "border-gray-200",
      text: "text-gray-600 font-semibold",
      icon: "text-gray-500",
      dots: "text-gray-400"
    },
    completed: {
      bg: "bg-[#E8F5E9]", // Light green/emerald as in mockup
      border: "border-emerald-100",
      text: "text-[#10B981] font-semibold",
      icon: "text-[#10B981]",
      dots: "text-[#10B981]"
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
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/60 shadow-sm">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500">
                {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
              </span>
            </div>

            {/* Task Count Badge */}
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/60 shadow-sm">
              <Link2 className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500">
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
                type === "active" ? "text-[#001F3F]" : "text-gray-400 opacity-40 group-hover:opacity-100",
                type === "completed" && "text-[#10B981]"
              )}
            >
              <MoreHorizontal className="h-4 w-4 font-bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(cycle)}>
              Edit Cycle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(cycle.id)}
            >
              Delete Cycle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
