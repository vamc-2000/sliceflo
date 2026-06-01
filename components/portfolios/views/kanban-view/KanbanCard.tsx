"use client";

import { useMemo, useState } from "react";
import { KanbanCard } from "@/components/ui/shadcn-io/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Calendar as CalendarIcon,
  Flag,
  Tag,
  MoreHorizontal,
  Plus,
  User,
  Check
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Project, useProjectsStore } from "@/stores/projects-store";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useWorkspaceStore } from "@/stores/workspace-store";

const getAvatarColor = (name: string): string => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const AvatarGroup = ({ users, max = 3, label }: { users: any[], max?: number, label?: string }) => {
  if (!users || users.length === 0) return <span className="text-gray-400">—</span>;
  const visibleUsers = users.slice(0, max);
  const overflowCount = users.length - max;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
          {visibleUsers.map((u, i) => (
            <Avatar key={u.userId || i} className="h-6 w-6 border-2 border-white relative" style={{ zIndex: max - i }}>
              {u.profilePicture && <AvatarImage src={u.profilePicture} />}
              <AvatarFallback
                className="text-white text-[10px] font-semibold"
                style={{ backgroundColor: getAvatarColor(u.name || "?") }}
              >
                {u.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && (
            <div className="h-6 min-w-[24px] rounded-full border-2 border-white bg-gray-50 flex items-center justify-center relative z-0 px-1">
              <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">+{overflowCount}</span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {label && (
          <>
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-gray-500 font-normal outline-none">{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="max-h-60 overflow-y-auto">
          {users.map((u, i) => (
            <DropdownMenuItem key={u.userId || i} className="flex items-center gap-2 pointer-events-none">
              <Avatar className="h-6 w-6 border">
                {u.profilePicture && <AvatarImage src={u.profilePicture} />}
                <AvatarFallback
                  className="text-white text-[10px] font-semibold"
                  style={{ backgroundColor: getAvatarColor(u.name || "?") }}
                >
                  {u.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{u.name}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface PortfolioKanbanCardProps {
  project: Project;
  groupColor: string;
}

export function PortfolioKanbanCard({ project, groupColor }: PortfolioKanbanCardProps) {
  const { projectPhases, workspaceMembers } = useWorkspaceStore();
  const { getTaskPriorityConfigs, updateProject } = useProjectsStore();

  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const taskPriorityConfigs = getTaskPriorityConfigs(project.id!);

  const leaderIds = project.leaders?.length
    ? project.leaders
    : (project.projectLeader ? [project.projectLeader] : []);
  const leaders = leaderIds
    .map(id => workspaceMembers.find(m => m.userId === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  const projectMembers = useMemo(() => {
    return (project.members || [])
      .map(pm => workspaceMembers.find(wm => wm.userId === pm.userId))
      .filter(Boolean);
  }, [project.members, workspaceMembers]);

  const assignedPhase = useMemo(() => {
    return projectPhases
      .flatMap(p => [p, ...(p.children || [])])
      .find(p => p.value === project.phase);
  }, [project.phase, projectPhases]);

  const dateRangeStr = useMemo(() => {
    if (!project.startDate && !project.endDate) return null;
    const start = project.startDate ? format(new Date(project.startDate), "MMM d") : "";
    const end = project.endDate ? format(new Date(project.endDate), "MMM d") : "";
    if (start && end) return `${start} - ${end}`;
    return start || end;
  }, [project.startDate, project.endDate]);

  return (
    <div
      className={cn(
        "group relative rounded-lg bg-white p-2 shadow-sm border border-gray-200 border-l-4 hover:shadow-md transition-shadow cursor-pointer"
      )}
      style={{ borderLeftColor: groupColor }}
    >
      {/* <div className="p-4 flex flex-col gap-3"> */}
      {/* Top row: Leader Avatar, Slug, Priority, Status, Menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Leader Avatar */}
          <AvatarGroup users={leaders} label="Project Leaders" />

          {/* Slug Badge */}
          <Link href={`/project/${project.id}`} onClick={(e) => e.stopPropagation()}>
            <Badge
              variant="secondary"
              className="text-sm px-2 py-0.5 rounded-sm hover:underline"
              style={{
                backgroundColor: `${groupColor}20`,
                color: groupColor
              }}
            >
              {project.slug || "PROJ"}
            </Badge>
          </Link>

          {/* Priority Flag Dropdown */}
          <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
            <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); setIsPriorityOpen(true); }}>
              <div className="cursor-pointer">
                {project.priority ? (
                  (() => {
                    const priority = taskPriorityConfigs.find(p => p.value === project.priority);
                    return priority ? (
                      <Badge
                        variant="secondary"
                        className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${priority.color}20`,
                          color: priority.color
                        }}
                      >
                        <Flag className="h-4 w-4" />
                      </Badge>
                    ) : (
                      <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                        <Flag className="h-4 w-4 text-gray-400" />
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Flag className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-2" align="start" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-1">
                {taskPriorityConfigs.map(priority => (
                  <button
                    key={priority._id}
                    onClick={() => {
                      updateProject(project.id!, { priority: priority.value });
                      setIsPriorityOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 text-sm"
                    style={{ color: priority.color }}
                  >
                    <span>{priority.label}</span>
                    <Badge
                      variant="secondary"
                      className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${priority.color}20`,
                        color: priority.color
                      }}
                    >
                      <Flag className="h-4 w-4" />
                    </Badge>
                  </button>
                ))}
                <button
                  onClick={() => {
                    updateProject(project.id!, { priority: undefined });
                    setIsPriorityOpen(false);
                  }}
                  className="w-full flex items-center px-2 py-1 rounded hover:bg-gray-100 text-sm text-gray-500"
                >
                  Clear priority
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Status Pill (Phase or Status) */}
          <Badge
            variant="secondary"
            className={"text-sm px-2 py-0 h-5 truncate"}
            style={{
              backgroundColor: `${groupColor}20`,
              color: groupColor
            }}
          >
            <span className="truncate">{assignedPhase?.label || project.status || "On track"}</span>
          </Badge>
        </div>

        <div>
          <MoreHorizontal className="h-4 w-4" />
        </div>
      </div>

      {/* Project Name */}
      <Link
        href={`/project/${project.id}`}
        className="text-base font-bold text-gray-900 hover:underline mb-2 line-clamp-2 transition-colors block"
        onClick={(e) => e.stopPropagation()}
      >
        {project.name}
      </Link>

      {/* Bottom row: Calendar, Tag, Members */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {/* Date Range Badge */}
          {dateRangeStr && (
            <Badge variant="secondary" className="flex items-center gap-1.5 h-6 px-2 py-1 rounded-sm">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm whitespace-nowrap">{dateRangeStr}</span>
            </Badge>
          )}

          {/* Tag Icon */}
          <Badge variant="secondary" className="h-6 w-6 p-1 flex items-center justify-center rounded-sm">
            <Tag className="h-4 w-4" />
          </Badge>
        </div>

        {/* Member Avatars */}
        <AvatarGroup users={projectMembers} label="Project Members" />
      </div>
      {/* </div> */}
    </div>
  );
}
