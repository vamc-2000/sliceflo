import {
  ArrowRight,
  Flag,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Archive,
  Plus,
  ChevronUp,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatLocalDate } from "@/utils/timezone-utils";
import { Project } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore, getProfilePictureUrl } from "@/stores/projects-store";
import { PortfolioIconAvatar } from "../../PortfolioIconAvatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  PortfolioFieldVisibilityPopup,
  ALL_PORTFOLIO_FIELDS,
} from "../list-view/common/PortfolioFieldVisibilityPopup";
import { useRouter } from "next/navigation";
import { forwardRef, useState, useRef } from "react";

const getAvatarColor = (name: string): string => {
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
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
}: {
  users: any[];
  max?: number;
  label?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!users || users.length === 0)
    return <span className="text-gray-400">—</span>;
  const visibleUsers = users.slice(0, max);
  const overflowCount = users.length - max;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.startsWith("@") ? searchQuery.slice(1) : searchQuery;
    return u.name?.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (!open) setSearchQuery("");
    }}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
          {visibleUsers.map((u, i) => (
            <Avatar
              key={u.userId || i}
              className="h-6 w-6 relative"
              style={{ zIndex: max - i }}
            >
              {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} className="object-cover" />}
              <AvatarFallback
                className="text-white text-[10px] font-semibold"
                style={{ backgroundColor: getAvatarColor(u.name || "?") }}
              >
                {getInitials(u.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && (
            <div className="h-6 min-w-[24px] rounded-full bg-muted flex items-center justify-center relative z-0 px-1">
              <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                +{overflowCount}
              </span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="p-4 w-[200px] space-y-1">
        <div className="px-1 pb-2" onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="Type @ or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-2 text-xs text-muted-foreground">
              No members found
            </div>
          ) : (
            filteredUsers.map((u, i) => (
              <DropdownMenuItem
                key={u.userId || i}
                onSelect={(e) => {
                  e.preventDefault();
                }}
                className="p-0 focus:bg-transparent"
              >
                <div className="w-full h-9 flex items-center justify-between gap-1.5 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-2 cursor-pointer bg-secondary text-foreground">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Avatar className="h-5 w-5 shrink-0">
                      {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} className="object-cover" />}
                      <AvatarFallback
                        className="text-white text-[9px] font-semibold bg-muted-foreground"
                        style={{ backgroundColor: getAvatarColor(u.name || "?") }}
                      >
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{u.name}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PriorityFlag = ({
  priority,
  color,
}: {
  priority?: string;
  color?: string;
}) => {
  const bg = color || "#9CA3AF";
  return (
    <div
      className="w-full h-full flex items-center justify-center gap-8 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
      style={{ backgroundColor: `${bg}33` }}
    >
      <span className={cn("truncate text-xs font-medium", priority ? "text-foreground" : "text-muted-foreground")}>
        {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "—"}
      </span>
      <Flag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: bg }} />
    </div>
  );
};

interface PortfolioGanttTableProps {
  projects: Project[];
  portfolioId: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onAddProject?: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return format(
      new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      "d MMM",
    );
  } catch {
    return dateStr;
  }
};

export const PortfolioGanttTable = forwardRef<
  HTMLDivElement,
  PortfolioGanttTableProps
>(({ projects, portfolioId, onScroll, onAddProject }, ref) => {
  const router = useRouter();
  const { workspaceMembers, projectPhases } = useWorkspaceStore();
  const { fieldVisibility } = usePortfoliosStore();
  const { archiveProject, deleteProject } = useProjectsStore();

  const columnWidths: Record<string, number> = {
    id: 80,
    name: 260,
    phase: 150,
    update: 150,
    leader: 150,
    members: 150,
    viewers: 150,
    priority: 150,
    startDate: 150,
    endDate: 150,
  };

  const getColumnStyle = (columnId: string): React.CSSProperties => {
    const w = columnWidths[columnId] ?? 150;
    return {
      minWidth: `${w}px`,
      width: `${w}px`,
      maxWidth: `${w}px`,
    };
  };

  const [isAddProjectRowHovered, setIsAddProjectRowHovered] = useState(false);
  const [showAddProjectMenu, setShowAddProjectMenu] = useState(false);
  const [addProjectMenuCoords, setAddProjectMenuCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const chevronButtonRef = useRef<HTMLButtonElement>(null);

  const key = `${portfolioId}-gantt`;
  const defaultVisible = ["id", "name", "phase"];
  const currentVisibleIds =
    (portfolioId && fieldVisibility[key]) || defaultVisible;
  const isVisible = (fieldId: string) => currentVisibleIds.includes(fieldId);

  const getLeader = (userId?: string) => {
    if (!userId) return null;
    return workspaceMembers.find((m) => m.userId === userId);
  };

  const getMemberDetails = (
    memberRefs: Array<{ userId: string; role: string }> = [],
  ) => {
    return memberRefs
      .map((mem) => workspaceMembers.find((m) => m.userId === mem.userId))
      .filter(Boolean);
  };

  const getViewerDetails = (viewerRefs: any[] = []) => {
    return viewerRefs
      .map((v) => {
        const id = typeof v === "string" ? v : v.userId;
        return workspaceMembers.find((m) => m.userId === id);
      })
      .filter((m): m is NonNullable<typeof m> => !!m);
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700 hover:bg-green-200",
    planning: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    "on-hold": "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    completed: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  const getPhase = (phaseValue?: string) => {
    if (!phaseValue) return null;
    return projectPhases
      .flatMap((p) => [p, ...(p.children || [])])
      .find((p) => p.value === phaseValue);
  };

  const getPriorityColor = (project: Project) => {
    if (!project.priority) return undefined;
    const config = project.projectPriorityConfig?.find(
      (c) => c.value === project.priority,
    );
    if (config) return config.color;

    const fallbacks: Record<string, string> = {
      urgent: "#EF4444",
      high: "#F59E0B",
      medium: "#3B82F6",
      low: "#9CA3AF",
    };
    return fallbacks[project.priority.toLowerCase()] || fallbacks.low;
  };

  const headerCellCls =
    "h-9 px-3 py-0 text-center align-middle font-semibold text-muted-foreground uppercase tracking-wide text-xs border-r bg-card last:border-r-0 select-none";
  const bodyCellCls =
    "h-9 px-0 py-0 align-middle border-r last:border-r-0 whitespace-nowrap overflow-hidden text-center";

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="w-full h-full overflow-auto rounded-tl-lg bg-background border-r scrollbar-thin"
    >
      <table className="w-full border-collapse table-auto min-w-max text-xs relative">
        <thead className="sticky top-0 z-20 bg-card shadow-sm">
          <tr className="h-9 border-b">
            {isVisible("id") && (
              <th className={headerCellCls} style={getColumnStyle("id")}>ID</th>
            )}
            {isVisible("name") && (
              <th className={cn(headerCellCls, "text-left")} style={getColumnStyle("name")}>
                Project
              </th>
            )}
            {isVisible("phase") && (
              <th className={headerCellCls} style={getColumnStyle("phase")}>Phase</th>
            )}
            {isVisible("update") && (
              <th className={headerCellCls} style={getColumnStyle("update")}>Update</th>
            )}
            {isVisible("leader") && (
              <th className={headerCellCls} style={getColumnStyle("leader")}>Leader</th>
            )}
            {isVisible("members") && (
              <th className={headerCellCls} style={getColumnStyle("members")}>Members</th>
            )}
            {isVisible("viewers") && (
              <th className={headerCellCls} style={getColumnStyle("viewers")}>Viewers</th>
            )}
            {isVisible("priority") && (
              <th className={headerCellCls} style={getColumnStyle("priority")}>Priority</th>
            )}
            {isVisible("startDate") && (
              <th className={headerCellCls} style={getColumnStyle("startDate")}>Start Date</th>
            )}
            {isVisible("endDate") && (
              <th className={headerCellCls} style={getColumnStyle("endDate")}>Due Date</th>
            )}

            <th
              className="w-10 px-2 text-center align-middle bg-card sticky right-0 z-30 border-l"
              style={{ boxShadow: "-2px 0 4px rgba(0,0,0,0.02)" }}
            >
              <PortfolioFieldVisibilityPopup
                portfolioId={portfolioId}
                viewType="gantt"
              />
            </th>
          </tr>
        </thead>
        <tbody className="bg-background">
          {projects.map((project, index) => {
            const leaderIds = project.leaders?.length
              ? project.leaders
              : project.projectLeader
                ? [project.projectLeader]
                : [];
            const projectLeaders = leaderIds
              .map((id) => getLeader(id))
              .filter((m): m is NonNullable<typeof m> => !!m);
            const assignedPhase = getPhase(project.phase);
            const projectMembers = getMemberDetails(project.members);
            const projectViewers = getViewerDetails(project.viewers);

            return (
              <tr
                key={project.id}
                className="border-b hover:bg-muted/30 h-9 group transition-colors relative"
              >
                {isVisible("id") && (
                  <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("id")}>
                    <Link
                      href={`/project/${project.id}`}
                      className="hover:underline font-medium text-gray-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.slug || index + 1}
                    </Link>
                  </td>
                )}

                {isVisible("name") && (
                  <td
                    className={cn(bodyCellCls, "px-4 text-left")}
                    style={getColumnStyle("name")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 shrink-0">
                        <PortfolioIconAvatar
                          portfolio={project as any}
                          size="sm"
                        />
                      </div>
                      <Link
                        href={`/project/${project.id}`}
                        className="text-xs font-medium truncate hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.name}
                      </Link>
                    </div>
                  </td>
                )}

                {isVisible("phase") && (
                  <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("phase")}>
                    {assignedPhase ? (
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: assignedPhase.color || "#3B82F6",
                          }}
                        />
                        <span className="text-xs font-medium truncate">
                          {assignedPhase.label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}

                {isVisible("update") &&
                  (() => {
                    const displayUpdate =
                      project.statusHistory?.[0]?.status ||
                      project.currentProjectUpdate ||
                      "";
                    const updateConfigs = project.projectStatusConfig || [];
                    const updateConfig = updateConfigs.find(
                      (c: any) => c.value === displayUpdate,
                    );
                    return (
                      <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("update")}>
                        <Badge
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-medium h-5",
                            !updateConfig &&
                              "bg-gray-100 text-gray-700 hover:bg-gray-200",
                          )}
                          variant="secondary"
                          style={
                            updateConfig
                              ? {
                                  backgroundColor: updateConfig.color + "15",
                                  color: updateConfig.color,
                                }
                              : undefined
                          }
                        >
                          {updateConfig?.label || displayUpdate || "No update"}
                        </Badge>
                      </td>
                    );
                  })()}

                {isVisible("leader") && (
                  <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("leader")}>
                    <AvatarGroup
                      users={projectLeaders}
                      label="Project Leaders"
                    />
                  </td>
                )}

                {isVisible("members") && (
                  <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("members")}>
                    <AvatarGroup
                      users={projectMembers}
                      label="Project Members"
                    />
                  </td>
                )}

                {isVisible("viewers") && (
                  <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("viewers")}>
                    <AvatarGroup
                      users={projectViewers}
                      label="Project Viewers"
                    />
                  </td>
                )}

                {isVisible("priority") && (
                  <td className={cn(bodyCellCls, "!p-0 text-center")} style={{ ...getColumnStyle("priority"), height: '1px' }}>
                    <PriorityFlag
                      priority={project.priority}
                      color={getPriorityColor(project)}
                    />
                  </td>
                )}

                {isVisible("startDate") && (
                  <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("startDate")}>
                    {project.startDate ? (
                      <span className="text-xs text-gray-700">
                        {formatLocalDate(project.startDate)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}

                {isVisible("endDate") && (
                  <td className={cn(bodyCellCls, "text-center")} style={getColumnStyle("endDate")}>
                    {project.endDate ? (
                      <span className="text-xs text-gray-700">
                        {formatLocalDate(project.endDate)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}

                <td
                  className="w-10 px-2 text-center sticky right-0 z-10 bg-card group-hover:bg-[#f8f9fa] border-l"
                  style={{ boxShadow: "-2px 0 4px rgba(0,0,0,0.02)" }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuContent
                        align="end"
                        className="w-[180px] border-b-4 border-b-primary z-[50]"
                      >
                        <DropdownMenuItem
                          onClick={() => router.push(`/project/${project.id}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          Open project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => archiveProject(project.id!)}
                        >
                          <Archive className="h-3.5 w-3.5 mr-2" />
                          Archive project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteProject(project.id!)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuPortal>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
          <tr
            className="border-b h-9 group transition-colors relative"
            onMouseEnter={() => setIsAddProjectRowHovered(true)}
            onMouseLeave={() => {
              setIsAddProjectRowHovered(false);
              setShowAddProjectMenu(false);
            }}
          >
            {isVisible("id") && <td className={bodyCellCls} style={getColumnStyle("id")} />}
            {isVisible("name") && (
              <td className={cn(bodyCellCls, "px-4 text-left")} style={getColumnStyle("name")}>
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "flex items-center rounded-sm transition-all group",
                      isAddProjectRowHovered || showAddProjectMenu
                        ? "border border-primary/30"
                        : "border border-transparent",
                    )}
                  >
                    <button
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 transition-colors text-xs focus:outline-none",
                        isAddProjectRowHovered || showAddProjectMenu
                          ? "text-primary/60"
                          : "text-muted-foreground",
                      )}
                      onClick={() =>
                        router.push(`/portfolio/${portfolioId}/create-project`)
                      }
                    >
                      <Plus
                        className={cn(
                          "h-3 w-3",
                          isAddProjectRowHovered || showAddProjectMenu
                            ? "text-primary/60"
                            : "text-muted-foreground",
                        )}
                      />
                      Add New Project
                    </button>

                    {(isAddProjectRowHovered || showAddProjectMenu) && (
                      <div className="relative">
                        <button
                          ref={chevronButtonRef}
                          className="px-1 py-0.5 border-l border-primary/30 text-muted-foreground hover:text-primary/60 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              !showAddProjectMenu &&
                              chevronButtonRef.current
                            ) {
                              const rect =
                                chevronButtonRef.current.getBoundingClientRect();
                              const dropdownHeight = 84; // Approx height for 2 items
                              setAddProjectMenuCoords({
                                top: rect.top - dropdownHeight - 4,
                                left: rect.left,
                              });
                            }
                            setShowAddProjectMenu((prev) => !prev);
                          }}
                        >
                          <ChevronUp className="h-3 w-3 text-primary/60" />
                        </button>

                        {showAddProjectMenu && addProjectMenuCoords && (
                          <div
                            style={{
                              position: "fixed",
                              top: addProjectMenuCoords.top,
                              left: addProjectMenuCoords.left,
                              zIndex: 9999,
                            }}
                            className="bg-card border border-border border-b-[5px] border-b-primary rounded-md shadow-lg min-w-[170px] overflow-hidden"
                          >
                            <button
                              onClick={() => {
                                setShowAddProjectMenu(false);
                                router.push(
                                  `/portfolio/${portfolioId}/create-project`,
                                );
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                            >
                              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Add new project</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowAddProjectMenu(false);
                                onAddProject?.();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left border-t border-border"
                            >
                              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Add existing project</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
});

PortfolioGanttTable.displayName = "PortfolioGanttTable";
