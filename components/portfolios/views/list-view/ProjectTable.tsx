"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from '@/stores/projects-store';
import { useWorkspaceStore } from "@/stores/workspace-store";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, User, Clock, Flag, Hash, CheckCircle2, Plus, MoreHorizontal, Settings, Trash2, Archive, ExternalLink, Pencil, GripVertical, Link as LinkIcon, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useProjectsStore } from "@/stores/projects-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { PortfolioFieldVisibilityPopup, ALL_PORTFOLIO_FIELDS } from "./common/PortfolioFieldVisibilityPopup";

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
            <DropdownMenuLabel className="text-xs text-gray-500 font-normal py-1 px-2.5">{label}</DropdownMenuLabel>
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

interface ProjectTableProps {
  projects: Project[];
  portfolioId?: string;
  groupColor?: string;
  viewType?: "list" | "table" | "gantt";
  onAddProject?: () => void;
}

export function ProjectTable({ projects, portfolioId, groupColor = "#3B82F6", viewType = "list", onAddProject }: ProjectTableProps) {
  const router = useRouter();
  const { workspaceMembers, projectPhases } = useWorkspaceStore();
  const { renameProject, archiveProject, deleteProject } = useProjectsStore();
  const { removeProjectFromPortfolio, fieldVisibility } = usePortfoliosStore();

  const [isAddProjectRowHovered, setIsAddProjectRowHovered] = useState(false);
  const [showAddProjectMenu, setShowAddProjectMenu] = useState(false);
  const [addProjectMenuCoords, setAddProjectMenuCoords] = useState<{ top: number, left: number } | null>(null);
  const chevronButtonRef = React.useRef<HTMLButtonElement>(null);

  const key = `${portfolioId}-${viewType}`;
  const defaultVisible = viewType === "gantt"
    ? ["id", "name", "phase"]
    : ALL_PORTFOLIO_FIELDS.map((f: { id: string }) => f.id);

  const currentVisibleIds = (portfolioId && fieldVisibility[key]) || defaultVisible;
  const isVisible = (fieldId: string) => currentVisibleIds.includes(fieldId);

  // Confirmation Modal states
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToArchive, setProjectToArchive] = useState<string | null>(null);
  const [projectToRemove, setProjectToRemove] = useState<string | null>(null);

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

  const headerCellCls = "h-9 font-semibold text-gray-500 uppercase tracking-wide px-3 select-none border-r border-gray-200";
  const bodyCellCls = "px-3 py-2.5 border-r border-gray-200";

  const getDragColumnStyle = (isHeader: boolean, customColor?: string): React.CSSProperties => {
    return {
      position: 'sticky',
      left: 0,
      zIndex: isHeader ? 20 : 10,
      minWidth: '40px',
      width: '40px',
      boxShadow: `inset 4px 0 0 0 ${customColor || groupColor}`,
      backgroundColor: isHeader ? '#F9FAFB' : 'white',
      borderRight: '1px solid #E5E7EB',
      padding: 0,
    };
  };

  return (
    <>
      <div className="relative">
        <div className="overflow-x-auto rounded-tl-sm">
          <Table className="relative border-y border-gray-200 text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-gray-200">
                <TableHead className={headerCellCls} style={getDragColumnStyle(true)} />
                {isVisible("id") && <TableHead className={`${headerCellCls} text-center`}>ID</TableHead>}
                {isVisible("name") && (
                  <TableHead className={`${headerCellCls} text-left`}>
                    <div className="flex items-center gap-2">
                      Project
                    </div>
                  </TableHead>
                )}
                {isVisible("phase") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Phase
                    </div>
                  </TableHead>
                )}
                {isVisible("status") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Status
                    </div>
                  </TableHead>
                )}
                {isVisible("leader") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Leader
                    </div>
                  </TableHead>
                )}
                {isVisible("members") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Members
                    </div>
                  </TableHead>
                )}
                {isVisible("viewers") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Viewers
                    </div>
                  </TableHead>
                )}
                {isVisible("priority") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Priority
                    </div>
                  </TableHead>
                )}
                {isVisible("startDate") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Start Date
                    </div>
                  </TableHead>
                )}
                {isVisible("endDate") && (
                  <TableHead className={`${headerCellCls} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      Due Date
                    </div>
                  </TableHead>
                )}

                {/* ✅ Actions Column Header (sticky) */}
                <TableHead
                  className={cn("w-12 text-center")}
                  style={{
                    position: 'sticky',
                    right: 0,
                    zIndex: 20,
                    backgroundColor: 'white',
                    borderLeft: '1px solid #E5E7EB',
                    boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                    padding: 4,
                    margin: 0,
                  }}
                >
                  {portfolioId && <PortfolioFieldVisibilityPopup portfolioId={portfolioId} viewType={viewType} />}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                  <TableRow
                    key={project.id || index}
                    className="group hover:bg-gray-50 transition-colors h-11 border-b border-gray-100 last:border-0"
                  >
                    <TableCell className="p-0" style={getDragColumnStyle(false)}>
                      <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab mx-auto" />
                    </TableCell>

                    {isVisible("id") && (
                      <TableCell
                        className={cn(bodyCellCls, "text-center")}
                      >
                        <Link
                          href={`/project/${project.id}`}
                          className="hover:underline font-medium text-gray-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.slug || (index + 1)}
                        </Link>
                      </TableCell>
                    )}

                    {isVisible("name") && (
                      <TableCell
                        className={cn(bodyCellCls, "text-left")}
                      >
                        <Link
                          href={`/project/${project.id}`}
                          className="hover:underline font-medium truncate max-w-[200px] block text-[#001F3F]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.name || "Untitled Project"}
                        </Link>
                      </TableCell>
                    )}

                    {isVisible("phase") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        {assignedPhase ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: assignedPhase.color || '#3B82F6' }} />
                            <span className="text-gray-700 font-medium truncate">{assignedPhase.label}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    )}

                    {isVisible("status") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        <Badge
                          className={cn("px-2 py-0.5 text-[11px] font-medium h-5", statusColors[project.status as string] || statusColors.active)}
                          variant="secondary"
                        >
                          {String(project.status || 'Active').toUpperCase()}
                        </Badge>
                      </TableCell>
                    )}

                    {isVisible("leader") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        <AvatarGroup users={projectLeaders} label="Project Leaders" />
                      </TableCell>
                    )}

                    {isVisible("members") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        <AvatarGroup users={projectMembers} label="Project Members" />
                      </TableCell>
                    )}

                    {isVisible("viewers") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        <AvatarGroup users={projectViewers} label="Project Viewers" />
                      </TableCell>
                    )}

                    {isVisible("priority") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        <PriorityFlag
                          priority={project.priority}
                          color={getPriorityColor(project)}
                        />
                      </TableCell>
                    )}

                    {isVisible("startDate") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        {project.startDate ? (
                          <span className="text-gray-700">{format(new Date(project.startDate), 'd MMM')}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    )}

                    {isVisible("endDate") && (
                      <TableCell className={`${bodyCellCls} text-center`}>
                        {project.endDate ? (
                          <span className="text-gray-700">{format(new Date(project.endDate), 'd MMM')}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    )}
                    {/* Row actions sticky cell */}
                    <TableCell
                      className={cn("w-12 text-center")}
                      style={{
                        position: 'sticky',
                        right: 0,
                        zIndex: 10,
                        backgroundColor: 'white',
                        borderLeft: '1px solid #E5E7EB',
                        boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] p-1 border-b-5 border-b-[#001F3F]">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); project.id && router.push(`/project/${project.id}`); }}
                            className="py-2"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                            Open project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {portfolioId && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); project.id && setProjectToRemove(project.id); }}
                              className="py-2"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Remove from portfolio
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); project.id && setProjectToArchive(project.id); }}
                            className="py-2"
                          >
                            <Archive className="h-3.5 w-3.5 mr-2" />
                            Archive project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); project.id && setProjectToDelete(project.id); }}
                            className="text-red-500 focus:text-red-500 py-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Add Project row */}
              <TableRow
                className="group border-b border-gray-100"
                onMouseEnter={() => setIsAddProjectRowHovered(true)}
                onMouseLeave={() => {
                  setIsAddProjectRowHovered(false);
                  setShowAddProjectMenu(false);
                }}
              >
                <TableCell className="p-0" style={getDragColumnStyle(false, `${groupColor}44`)} />
                <TableCell className={`${bodyCellCls} text-transparent`} />
                <TableCell className={bodyCellCls} colSpan={currentVisibleIds.length + 1}>
                  <div className="flex items-center gap-1 pl-4">
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
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add new project</span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddProjectMenu(false);
                                  onAddProject?.();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left border-t border-gray-50"
                              >
                                <LinkIcon className="h-3.5 w-3.5" />
                                <span>Add existing project</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>

            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={Boolean(projectToRemove)}
        onClose={() => setProjectToRemove(null)}
        onConfirm={() => {
          if (portfolioId && projectToRemove) {
            removeProjectFromPortfolio(portfolioId, projectToRemove);
            setProjectToRemove(null);
          }
        }}
        title="Remove from Portfolio"
        description="Are you sure you want to remove this project from the portfolio? This will not delete the project."
        confirmLabel="Remove"
      // variant="danger"
      />

      <ConfirmationModal
        open={Boolean(projectToArchive)}
        onClose={() => setProjectToArchive(null)}
        onConfirm={async () => {
          if (projectToArchive) {
            await archiveProject(projectToArchive);
            setProjectToArchive(null);
          }
        }}
        title="Archive Project"
        description="Are you sure you want to archive this project?"
        confirmLabel="Archive"
      // variant="warning"
      />

      <ConfirmationModal
        open={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={async () => {
          if (projectToDelete) {
            await deleteProject(projectToDelete);
            setProjectToDelete(null);
          }
        }}
        title="Delete Project"
        description="Are you sure you want to permanently delete this project? This action cannot be undone."
        confirmLabel="Delete"
      // variant="danger"
      />
    </>
  );
}
