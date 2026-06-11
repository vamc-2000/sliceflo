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
import { Project, useProjectsStore, getProfilePictureUrl } from "@/stores/projects-store";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { formatLocalDate } from "@/utils/timezone-utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Input } from "@/components/ui/input";

const getAvatarColor = (name: string): string => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name?: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase();
};

const AvatarGroup = ({
  users,
  max = 3,
  label,
  projectId,
  type,
  project,
  projectUsers,
}: {
  users: any[];
  max?: number;
  label?: string;
  projectId: string;
  type: "leader" | "member" | "viewer";
  project: Project;
  projectUsers: any[];
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    updateProjectLeaders,
    addMembersToProject,
    removeMembersFromProject,
  } = useProjectsStore();

  const leaderIds = useMemo(() => {
    return project.leaders?.length
      ? project.leaders
      : (project.projectLeader ? [project.projectLeader] : []);
  }, [project.leaders, project.projectLeader]);

  const memberIds = useMemo(() => {
    return (project.members || []).map(m => m.userId);
  }, [project.members]);

  const filteredProjectUsers = useMemo(() => {
    const query = searchQuery.startsWith("@") ? searchQuery.slice(1) : searchQuery;
    if (!query) return projectUsers;
    return projectUsers.filter(member =>
      member && member.name && member.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [searchQuery, projectUsers]);

  const handleToggleUser = async (userId: string) => {
    if (type === "viewer") return; // read-only
    if (type === "leader") {
      const isLeader = leaderIds.includes(userId);
      let newLeaders: string[];
      if (isLeader) {
        newLeaders = leaderIds.filter(id => id !== userId);
      } else {
        newLeaders = [...leaderIds, userId];
      }
      try {
        await updateProjectLeaders(projectId, newLeaders);
      } catch (err) {
        console.error("Failed to update project leaders", err);
      }
    } else {
      const isMember = memberIds.includes(userId);
      try {
        if (isMember) {
          await removeMembersFromProject(projectId, [userId]);
        } else {
          await addMembersToProject(projectId, [{ userId, role: "member" }]);
        }
      } catch (err) {
        console.error("Failed to update project members", err);
      }
    }
  };

  const visibleUsers = users.slice(0, max);
  const overflowCount = users.length - max;

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setSearchQuery(""); }}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
          {visibleUsers.length > 0 ? (
            visibleUsers.map((u, i) => (
              <Avatar key={u.userId || i} className="h-6 w-6 relative" style={{ zIndex: max - i }}>
                {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} className="object-cover" />}
                <AvatarFallback
                  className="text-white text-[10px] font-semibold"
                  style={{ backgroundColor: getAvatarColor(u.name || "?") }}
                >
                  {getInitials(u.name)}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground">
              <User className="h-3 w-3" />
            </div>
          )}
          {overflowCount > 0 && (
            <div className="h-6 min-w-[24px] rounded-full bg-muted flex items-center justify-center relative z-0 px-1">
              <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">+{overflowCount}</span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-4 w-[200px] space-y-1" align="start" onClick={(e) => e.stopPropagation()}>
        {label && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1 px-2.5">{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="px-1 pb-2">
          <Input
            placeholder="Type @ or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {filteredProjectUsers.length === 0 ? (
            <div className="text-center py-2 text-xs text-muted-foreground">
              No members found
            </div>
          ) : (
            filteredProjectUsers.map((member) => {
              const isSelected = type === "leader"
                ? leaderIds.includes(member.userId)
                : memberIds.includes(member.userId);

              return (
                <DropdownMenuItem
                  key={member.userId}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleToggleUser(member.userId);
                  }}
                  className="p-0 focus:bg-transparent"
                >
                  <div className={cn(
                    "w-full h-9 flex items-center justify-between rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-transparent text-foreground cursor-pointer",
                    isSelected && "bg-muted/50"
                  )}>
                    <div className="flex items-center gap-3 truncate">
                      <Avatar className="h-6 w-6 shrink-0">
                        {member.profilePicture && (
                          <AvatarImage src={getProfilePictureUrl(member.profilePicture)} className="object-cover" />
                        )}
                        <AvatarFallback
                          className="text-white text-[10px] font-semibold bg-muted-foreground"
                          style={{ backgroundColor: getAvatarColor(member.name || "?") }}
                        >
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{member.name}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
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
  const displayUpdate = project.statusHistory?.[0]?.status || project.currentProjectUpdate || "On Track";

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

  const projectViewers = useMemo(() => {
    return (project.viewers || []).map((v: any) => {
      const id = typeof v === "string" ? v : v.userId;
      return workspaceMembers.find(m => m.userId === id);
    }).filter((m): m is NonNullable<typeof m> => !!m);
  }, [project.viewers, workspaceMembers]);


  const assignedPhase = useMemo(() => {
    return projectPhases
      .flatMap(p => [p, ...(p.children || [])])
      .find(p => p.value === project.phase);
  }, [project.phase, projectPhases]);

  const dateRangeStr = useMemo(() => {
    if (!project.startDate && !project.endDate) return null;
    const start = project.startDate ? formatLocalDate(project.startDate) : "";
    const end = project.endDate ? formatLocalDate(project.endDate) : "";
    const hasStart = start && start !== "—";
    const hasEnd = end && end !== "—";
    if (hasStart && hasEnd) return `${start} - ${end}`;
    return hasStart ? start : (hasEnd ? end : null);
  }, [project.startDate, project.endDate]);

  return (
    <div
      className={cn(
        "group relative rounded-lg bg-card p-2 shadow-sm border border-border border-l-4 hover:shadow-md transition-shadow cursor-pointer"
      )}
      style={{ borderLeftColor: groupColor }}
    >
      {/* <div className="p-4 flex flex-col gap-3"> */}
      {/* Top row: Leader Avatar, Slug, Priority, Status, Menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Leader Avatar */}
          <AvatarGroup
            users={leaders}
            label="Project Leaders"
            projectId={project.id!}
            type="leader"
            project={project}
            projectUsers={leaders}
          />

          {/* Slug Badge */}
          <Link href={`/project/${project.id}`} onClick={(e) => e.stopPropagation()}>
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 rounded-sm hover:underline bg-muted text-muted-foreground"
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
                      <div className="h-6 w-6 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
                    <Flag className="h-4 w-4 text-muted-foreground" />
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
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-muted text-sm"
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
                  className="w-full flex items-center px-2 py-1 rounded hover:bg-muted text-sm text-muted-foreground"
                >
                  Clear priority
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Status Pill (Phase or Status) */}
          <Badge
            variant="secondary"
            className={"text-xs px-2 py-0 h-5 truncate"}
            style={{
              backgroundColor: `${groupColor}20`,
              color: groupColor
            }}
          >
            <span className="truncate">{assignedPhase?.label || ""}</span>
          </Badge>
        </div>

        <div>
          <MoreHorizontal className="h-4 w-4" />
        </div>
      </div>

      {/* Project Name */}
      <Link
        href={`/project/${project.id}`}
        className="text-xs  text-foreground hover:underline mb-2 line-clamp-2 transition-colors block"
        onClick={(e) => e.stopPropagation()}
      >
        {project.name}
      </Link>

      {/* Bottom row: Calendar, Tag, Members */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {/* Date Range Badge */}
          {dateRangeStr && (
            <Badge
              variant="secondary"
              className="text-xs font-normal h-6 px-2 py-0.5 flex items-center gap-1 bg-muted text-muted-foreground hover:bg-muted"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="mt-0.5 whitespace-nowrap">{dateRangeStr}</span>
            </Badge>
          )}

          {/* Tag Icon */}
          <Badge variant="secondary" className="h-6 w-6 p-1 flex items-center justify-center rounded-sm">
            <Tag className="h-4 w-4" />
          </Badge>
        </div>

        {/* Member Avatars */}
        <AvatarGroup
          users={projectMembers}
          label="Project Members"
          projectId={project.id!}
          type="member"
          project={project}
          projectUsers={projectMembers}
        />
      </div>
      {/* </div> */}
    </div>
  );
}
