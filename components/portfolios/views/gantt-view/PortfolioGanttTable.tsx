import { ArrowRight, Flag, MoreHorizontal, ExternalLink, Trash2, Archive, Plus, ChevronUp, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Project } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import { PortfolioIconAvatar } from "../../PortfolioIconAvatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { PortfolioFieldVisibilityPopup, ALL_PORTFOLIO_FIELDS } from "../list-view/common/PortfolioFieldVisibilityPopup";
import { useRouter } from "next/navigation";
import { forwardRef, useState, useRef } from 'react';

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
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
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
      <DropdownMenuContent align="center">
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

const PriorityFlag = ({ priority, color }: { priority?: string; color?: string }) => {
  if (!priority) {
    return (
      <div className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center mx-auto">
        <Flag className="h-3 w-3 text-gray-300" />
      </div>
    );
  }
  const bg = color || '#9CA3AF';
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center mx-auto"
      style={{ backgroundColor: `${bg}22`, border: `1.5px solid ${bg}` }}
      title={priority}
    >
      <Flag className="h-3 w-3" style={{ color: bg }} fill={bg} />
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
    return format(new Date(d.getFullYear(), d.getMonth(), d.getDate()), 'd MMM');
  } catch {
    return dateStr;
  }
};

export const PortfolioGanttTable = forwardRef<HTMLDivElement, PortfolioGanttTableProps>(({
  projects,
  portfolioId,
  onScroll,
  onAddProject,
}, ref) => {
  const router = useRouter();
  const { workspaceMembers, projectPhases } = useWorkspaceStore();
  const { fieldVisibility } = usePortfoliosStore();
  const { archiveProject, deleteProject } = useProjectsStore();

  const [isAddProjectRowHovered, setIsAddProjectRowHovered] = useState(false);
  const [showAddProjectMenu, setShowAddProjectMenu] = useState(false);
  const [addProjectMenuCoords, setAddProjectMenuCoords] = useState<{ top: number, left: number } | null>(null);
  const chevronButtonRef = useRef<HTMLButtonElement>(null);

  const key = `${portfolioId}-gantt`;
  const defaultVisible = ["id", "name", "phase"];
  const currentVisibleIds = (portfolioId && fieldVisibility[key]) || defaultVisible;
  const isVisible = (fieldId: string) => currentVisibleIds.includes(fieldId);

  const getLeader = (userId?: string) => {
    if (!userId) return null;
    return workspaceMembers.find(m => m.userId === userId);
  };

  const getMemberDetails = (memberRefs: Array<{ userId: string; role: string }> = []) => {
    return memberRefs.map(mem => workspaceMembers.find(m => m.userId === mem.userId)).filter(Boolean);
  };

  const getViewerDetails = (viewerRefs: any[] = []) => {
    return viewerRefs.map(v => {
      const id = typeof v === 'string' ? v : v.userId;
      return workspaceMembers.find(m => m.userId === id);
    }).filter((m): m is NonNullable<typeof m> => !!m);
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
      .flatMap(p => [p, ...(p.children || [])])
      .find(p => p.value === phaseValue);
  };

  const getPriorityColor = (project: Project) => {
    if (!project.priority) return undefined;
    const config = project.projectPriorityConfig?.find(c => c.value === project.priority);
    if (config) return config.color;

    const fallbacks: Record<string, string> = {
      urgent: "#EF4444",
      high: "#F59E0B",
      medium: "#3B82F6",
      low: "#9CA3AF"
    };
    return fallbacks[project.priority.toLowerCase()] || fallbacks.low;
  };

  const headerCellCls = "h-[60px] px-4 text-center align-middle font-medium text-muted-foreground uppercase text-sm border-r bg-white last:border-r-0";
  const bodyCellCls = "px-4 h-[48px] align-middle border-r last:border-r-0";

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="w-full h-full overflow-auto rounded-tl-lg bg-background border-r scrollbar-thin"
    >
      <table className="w-full border-collapse table-auto min-w-max text-sm">
        <thead className="sticky top-0 z-20 bg-white shadow-sm">
          <tr className="h-[60px] border-b">
            {isVisible("id") && <th className={cn(headerCellCls, "min-w-[70px]")}>ID</th>}
            {isVisible("name") && (
              <th className={cn(headerCellCls, "text-left min-w-[250px]")}>
                Project
              </th>
            )}
            {isVisible("phase") && <th className={cn(headerCellCls, "min-w-[140px]")}>Phase</th>}
            {isVisible("status") && <th className={cn(headerCellCls, "min-w-[120px]")}>Status</th>}
            {isVisible("leader") && <th className={cn(headerCellCls, "min-w-[100px]")}>Leader</th>}
            {isVisible("members") && <th className={cn(headerCellCls, "min-w-[120px]")}>Members</th>}
            {isVisible("viewers") && <th className={cn(headerCellCls, "min-w-[120px]")}>Viewers</th>}
            {isVisible("priority") && <th className={cn(headerCellCls, "min-w-[100px]")}>Priority</th>}
            {isVisible("startDate") && <th className={cn(headerCellCls, "min-w-[110px]")}>Start Date</th>}
            {isVisible("endDate") && <th className={cn(headerCellCls, "min-w-[110px]")}>Due Date</th>}

            <th
              className="w-10 px-2 text-center align-middle bg-white sticky right-0 z-30 border-l"
              style={{ boxShadow: '-2px 0 4px rgba(0,0,0,0.02)' }}
            >
              <PortfolioFieldVisibilityPopup portfolioId={portfolioId} viewType="gantt" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {projects.map((project, index) => {
            const leaderIds = project.leaders?.length
              ? project.leaders
              : (project.projectLeader ? [project.projectLeader] : []);
            const projectLeaders = leaderIds
              .map(id => getLeader(id))
              .filter((m): m is NonNullable<typeof m> => !!m);
            const assignedPhase = getPhase(project.phase);
            const projectMembers = getMemberDetails(project.members);
            const projectViewers = getViewerDetails(project.viewers);

            return (
              <tr
                key={project.id}
                className="border-b hover:bg-muted/30 h-[48px] group transition-colors"
              >
                {isVisible("id") && (
                  <td
                    className={cn(bodyCellCls, "text-center")}
                  >
                    <Link
                      href={`/project/${project.id}`}
                      className="hover:underline font-medium text-gray-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.slug || (index + 1)}
                    </Link>
                  </td>
                )}

                {isVisible("name") && (
                  <td
                    className={cn(bodyCellCls, "min-w-[250px]")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 shrink-0">
                        <PortfolioIconAvatar portfolio={project as any} size="sm" />
                      </div>
                      <Link
                        href={`/project/${project.id}`}
                        className="text-sm font-medium truncate hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.name}
                      </Link>
                    </div>
                  </td>
                )}

                {isVisible("phase") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    {assignedPhase ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: assignedPhase.color || '#3B82F6' }} />
                        <span className="text-sm font-medium text-gray-700 truncate">{assignedPhase.label}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}

                {isVisible("status") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    <Badge
                      className={cn("px-2 py-0.5 text-[10px] font-medium h-5", statusColors[project.status as string] || statusColors.active)}
                      variant="secondary"
                    >
                      {String(project.status || 'Active').toUpperCase()}
                    </Badge>
                  </td>
                )}

                {isVisible("leader") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    <AvatarGroup users={projectLeaders} label="Project Leaders" />
                  </td>
                )}

                {isVisible("members") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    <AvatarGroup users={projectMembers} label="Project Members" />
                  </td>
                )}

                {isVisible("viewers") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    <AvatarGroup users={projectViewers} label="Project Viewers" />
                  </td>
                )}

                {isVisible("priority") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    <PriorityFlag
                      priority={project.priority}
                      color={getPriorityColor(project)}
                    />
                  </td>
                )}

                {isVisible("startDate") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    {project.startDate ? (
                      <span className="text-sm text-gray-700">{format(new Date(project.startDate), 'd MMM')}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}

                {isVisible("endDate") && (
                  <td className={cn(bodyCellCls, "text-center")}>
                    {project.endDate ? (
                      <span className="text-sm text-gray-700">{format(new Date(project.endDate), 'd MMM')}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}

                <td
                  className="w-10 px-2 text-center sticky right-0 z-10 bg-white group-hover:bg-[#f8f9fa] border-l"
                  style={{ boxShadow: '-2px 0 4px rgba(0,0,0,0.02)' }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuContent align="end" className="w-[180px] border-b-4 border-b-[#001F3F] z-[50]">
                        <DropdownMenuItem onClick={() => router.push(`/project/${project.id}`)}>
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          Open project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => archiveProject(project.id!)}>
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
            className="border-b h-[48px] group transition-colors"
            onMouseEnter={() => setIsAddProjectRowHovered(true)}
            onMouseLeave={() => {
              setIsAddProjectRowHovered(false);
              setShowAddProjectMenu(false);
            }}
          >
            {isVisible("id") && <td className={bodyCellCls} />}
            {isVisible("name") && (
              <td className={cn(bodyCellCls, "min-w-[250px]")}>
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "flex items-center rounded-sm transition-all group",
                      (isAddProjectRowHovered || showAddProjectMenu) ? "border border-[#001F3F]/30" : "border border-transparent"
                    )}
                  >
                    <button
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 transition-colors text-sm focus:outline-none",
                        (isAddProjectRowHovered || showAddProjectMenu) ? "text-[#001F3F]/60" : "text-gray-400"
                      )}
                      onClick={() => router.push(`/portfolio/${portfolioId}/create-project`)}
                    >
                      <Plus className={cn("h-3 w-3", (isAddProjectRowHovered || showAddProjectMenu) ? "text-[#001F3F]/60" : "text-gray-400")} />
                      Add New Project
                    </button>

                    {(isAddProjectRowHovered || showAddProjectMenu) && (
                      <div className="relative">
                        <button
                          ref={chevronButtonRef}
                          className="px-1 py-0.5 border-l border-[#001F3F]/30 text-gray-400 hover:text-[#001F3F]/60 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!showAddProjectMenu && chevronButtonRef.current) {
                              const rect = chevronButtonRef.current.getBoundingClientRect();
                              const dropdownHeight = 84; // Approx height for 2 items
                              setAddProjectMenuCoords({
                                top: rect.top - dropdownHeight - 4,
                                left: rect.left,
                              });
                            }
                            setShowAddProjectMenu(prev => !prev);
                          }}
                        >
                          <ChevronUp className="h-3 w-3 text-[#001F3F]/60" />
                        </button>

                        {showAddProjectMenu && addProjectMenuCoords && (
                          <div
                            style={{
                              position: 'fixed',
                              top: addProjectMenuCoords.top,
                              left: addProjectMenuCoords.left,
                              zIndex: 9999,
                            }}
                            className="bg-white border border-gray-200 border-b-[5px] border-b-[#001F3F] rounded-md shadow-lg min-w-[170px] overflow-hidden"
                          >
                            <button
                              onClick={() => {
                                setShowAddProjectMenu(false);
                                router.push(`/portfolio/${portfolioId}/create-project`);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                            >
                              <Plus className="h-3.5 w-3.5 text-gray-400" />
                              <span>Add new project</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowAddProjectMenu(false);
                                onAddProject?.();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left border-t border-gray-50"
                            >
                              <LinkIcon className="h-3.5 w-3.5 text-gray-400" />
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
