"use client";

import React, { useState, useRef, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from '@/stores/projects-store';
import { useWorkspaceStore } from "@/stores/workspace-store";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, User, Clock, Flag, Hash, CheckCircle2, Plus, MoreHorizontal, Settings, Trash2, Archive, ExternalLink, Pencil, GripVertical, Link as LinkIcon, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useProjectsStore, getProfilePictureUrl } from "@/stores/projects-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "@/components/ui/sonner";
import { PortfolioFieldVisibilityPopup, ALL_PORTFOLIO_FIELDS } from "./common/PortfolioFieldVisibilityPopup";

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

const AvatarGroup = ({ users, max = 3, label }: { users: any[], max?: number, label?: string }) => {
  if (!users || users.length === 0) return <span className="text-gray-400">—</span>;
  const visibleUsers = users.slice(0, max);
  const overflowCount = users.length - max;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
          {visibleUsers.map((u, i) => (
            <Avatar key={u.userId || i} className="h-6 w-6  relative" style={{ zIndex: max - i }}>
              {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} />}
              <AvatarFallback
                className="text-white text-[10px] font-semibold"
                style={{ backgroundColor: getAvatarColor(u.name || "?") }}
              >
                {getInitials(u.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && (
            <div className="h-6 min-w-[24px] rounded-full bg-gray-50 flex items-center justify-center relative z-0 px-1">
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
              <Avatar className="h-6 w-6">
                {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} />}
                <AvatarFallback
                  className="text-white text-[10px] font-semibold"
                  style={{ backgroundColor: getAvatarColor(u.name || "?") }}
                >
                  {getInitials(u.name)}
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

interface ResizeHandleProps {
  columnId: string;
  onResize: (columnId: string, deltaX: number) => void;
  onDoubleClick: (columnId: string) => void;
}

function ResizeHandle({ columnId, onResize, onDoubleClick }: ResizeHandleProps) {
  const startX = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX.current;
      startX.current = ev.clientX;
      onResize(columnId, delta);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onDoubleClick(columnId)}
      title="Drag to resize   Double-click to toggle collapse"
      className="group absolute right-0 top-0 h-full w-3 cursor-col-resize z-30 flex justify-end"
    >
      <div className="w-1 h-full bg-transparent group-hover:bg-blue-400 group-active:bg-blue-600 transition-colors" />
    </div>
  );
}

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
  const {
    updateProjectLeaders,
    addMembersToProject,
    removeMembersFromProject
  } = useProjectsStore();
  const { removeProjectFromPortfolio, fieldVisibility } = usePortfoliosStore();

  const [isAddProjectRowHovered, setIsAddProjectRowHovered] = useState(false);
  const [showAddProjectMenu, setShowAddProjectMenu] = useState(false);

  const [leaderSearchQuery, setLeaderSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [viewerSearchQuery, setViewerSearchQuery] = useState('');

  const getFilteredLeaderMembers = (projectUsers: any[]) => {
    const query = leaderSearchQuery.startsWith('@') ? leaderSearchQuery.slice(1) : leaderSearchQuery;
    if (!query) return projectUsers;
    return projectUsers.filter(member =>
      member && member.name && member.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getFilteredMemberMembers = (projectUsers: any[]) => {
    const query = memberSearchQuery.startsWith('@') ? memberSearchQuery.slice(1) : memberSearchQuery;
    if (!query) return projectUsers;
    return projectUsers.filter(member =>
      member && member.name && member.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getFilteredViewerMembers = (projectUsers: any[]) => {
    const query = viewerSearchQuery.startsWith('@') ? viewerSearchQuery.slice(1) : viewerSearchQuery;
    if (!query) return projectUsers;
    return projectUsers.filter(member =>
      member && member.name && member.name.toLowerCase().includes(query.toLowerCase())
    );
  };

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

  const DEFAULT_COL_WIDTH = 150;
  const MIN_COL_WIDTH = 60;
  const MAX_COL_WIDTH = 500;

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    return {
      id: 80,
      name: 300,
      phase: 150,
      update: 150,
      leader: 150,
      members: 150,
      viewers: 150,
      priority: 150,
      startDate: 150,
      endDate: 150,
      progress: 150,
    };
  });

  const handleColumnResize = useCallback((columnId: string, deltaX: number) => {
    setColumnWidths(prev => {
      const next = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, (prev[columnId] ?? DEFAULT_COL_WIDTH) + deltaX));
      return { ...prev, [columnId]: next };
    });
  }, []);

  const handleColumnToggleCollapse = useCallback((columnId: string) => {
    setColumnWidths(prev => ({ ...prev, [columnId]: DEFAULT_COL_WIDTH }));
  }, []);

  const handleUpdateLeader = async (projectId: string, currentLeaderIds: string[], userId: string) => {
    const isLeader = currentLeaderIds.includes(userId);
    let newLeaders: string[];
    if (isLeader) {
      newLeaders = currentLeaderIds.filter(id => id !== userId);
    } else {
      newLeaders = [...currentLeaderIds, userId];
    }
    try {
      await updateProjectLeaders(projectId, newLeaders);
      toast("success", { title: "Project leaders updated successfully!" });
    } catch (err: any) {
      toast("error", { title: "Failed to update project leaders" });
    }
  };

  const handleUpdateMember = async (projectId: string, currentMembers: any[], userId: string) => {
    const isMember = currentMembers.some(m => m.userId === userId);
    try {
      if (isMember) {
        await removeMembersFromProject(projectId, [userId]);
      } else {
        await addMembersToProject(projectId, [{ userId, role: 'member' }]);
      }
    } catch (err: any) {
      // Error handling toast is inside the store
    }
  };

  const getColumnStyle = (columnId: string, isHeader: boolean = false): React.CSSProperties => {
    const w = columnWidths[columnId] ?? DEFAULT_COL_WIDTH;
    const baseStyle: React.CSSProperties = {
      minWidth: `${w}px`,
      width: `${w}px`,
      maxWidth: `${w}px`,
      boxShadow: 'inset -1px 0 0 var(--border)',
    };

    if (columnId === 'id') {
      return {
        ...baseStyle,
        position: 'sticky',
        left: '39px',
        zIndex: isHeader ? 30 : 20,
        borderRight: '1px solid var(--border)',
      };
    }

    if (columnId === 'name') {
      const leftOffset = isVisible("id") ? 39 + (columnWidths['id'] ?? 80) : 39;
      return {
        ...baseStyle,
        position: 'sticky',
        left: `${leftOffset - 1}px`,
        zIndex: isHeader ? 30 : 20,
        boxShadow: 'inset -1px 0 0 var(--border), 2px 0 4px rgba(0,0,0,0.04)',
      };
    }

    return baseStyle;
  };

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

  const getPhaseColor = (phaseLabel: string, phaseColor?: string): string => {
    if (phaseColor) return phaseColor;
    const val = phaseLabel.toLowerCase();
    const fallbacks: Record<string, string> = {
      draft: "#6B7280",      // Gray
      planning: "#3B82F6",   // Blue
      execution: "#F59E0B",  // Amber
      monitoring: "#06B6D4", // Cyan
      completed: "#10B981",  // Green
      cancelled: "#EF4444",  // Red
    };
    return fallbacks[val] || "#3B82F6";
  };

  const PriorityFlag = ({ priority, color }: { priority?: string; color?: string }) => {
    const bg = color || '#9CA3AF';
    return (
      <div className="w-full h-full flex items-center justify-center gap-8 rounded-xs transition-opacity hover:opacity-90 overflow-hidden px-2"
        style={{ backgroundColor: `${bg}33` }}>
        <span className={cn("truncate text-xs font-medium", priority ? "text-foreground" : "text-muted-foreground")}>
          {priority ? (priority.charAt(0).toUpperCase() + priority.slice(1)) : '—'}
        </span>
        <Flag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: bg }} />
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

  const headerCellCls = "!h-9 font-semibold text-muted-foreground uppercase tracking-wide px-3 py-0 select-none border-r border-border bg-card";
  const bodyCellCls = "!h-9 px-3 py-0 border-r border-border";

  const getDragColumnStyle = (isHeader: boolean, customColor?: string): React.CSSProperties => {
    return {
      position: 'sticky',
      left: 0,
      zIndex: isHeader ? 30 : 20,
      minWidth: '40px',
      width: '40px',
      maxWidth: '40px',
      boxShadow: `inset 4px 0 0 0 ${customColor || groupColor}, inset -1px 0 0 var(--border)`,
      borderRight: '1px solid var(--border)',
      padding: 0,
    };
  };

  return (
    <>
      <div className="relative w-full">
        <div className="overflow-x-auto rounded-tl-sm w-full">
          <Table className="relative border-y border-border text-xs min-w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="!h-9 select-none border-r border-border bg-muted p-0" style={getDragColumnStyle(true)} />
                {isVisible("id") && (
                  <TableHead className={cn(headerCellCls, "text-center relative group bg-card")} style={getColumnStyle("id", true)}>
                    ID
                    <ResizeHandle
                      columnId="id"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("name") && (
                  <TableHead className={cn(headerCellCls, "text-left relative group bg-card")} style={getColumnStyle("name", true)}>
                    <div className="flex items-center gap-2">
                      Project
                    </div>
                    <ResizeHandle
                      columnId="name"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("phase") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("phase", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Phase
                    </div>
                    <ResizeHandle
                      columnId="phase"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("update") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("update", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Update
                    </div>
                    <ResizeHandle
                      columnId="update"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("leader") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("leader", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Leader
                    </div>
                    <ResizeHandle
                      columnId="leader"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("members") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("members", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Members
                    </div>
                    <ResizeHandle
                      columnId="members"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("viewers") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("viewers", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Viewers
                    </div>
                    <ResizeHandle
                      columnId="viewers"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("priority") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("priority", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Priority
                    </div>
                    <ResizeHandle
                      columnId="priority"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("startDate") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("startDate", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Start Date
                    </div>
                    <ResizeHandle
                      columnId="startDate"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("endDate") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("endDate", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Due Date
                    </div>
                    <ResizeHandle
                      columnId="endDate"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}
                {isVisible("progress") && (
                  <TableHead className={`${headerCellCls} text-center relative group`} style={getColumnStyle("progress", true)}>
                    <div className="flex items-center justify-center gap-2">
                      Progress
                    </div>
                    <ResizeHandle
                      columnId="progress"
                      onResize={handleColumnResize}
                      onDoubleClick={handleColumnToggleCollapse}
                    />
                  </TableHead>
                )}

                {/* ✅ Actions Column Header (sticky) */}
                <TableHead
                  className={cn("w-12 text-center !h-9 bg-card")}
                  style={{
                    position: 'sticky',
                    right: 0,
                    zIndex: 30,
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                    padding: 0,
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

                const projectUsers: typeof workspaceMembers = [];
                const seenIds = new Set<string>();
                [...projectLeaders, ...projectMembers, ...projectViewers].forEach(u => {
                  if (u && !seenIds.has(u.userId)) {
                    seenIds.add(u.userId);
                    projectUsers.push(u);
                  }
                });

                return (
                  <TableRow
                    key={project.id || index}
                    className="group hover:bg-muted transition-colors border-b border-border last:border-0"
                  >
                    <TableCell className="p-0 bg-card group-hover:bg-muted" style={getDragColumnStyle(false)}>
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab mx-auto" />
                    </TableCell>

                    {isVisible("id") && (
                      <TableCell
                        className={cn(bodyCellCls, "text-center bg-card group-hover:bg-muted")}
                        style={getColumnStyle("id", false)}
                      >
                        <Link
                          href={`/project/${project.id}`}
                          className="hover:underline font-medium text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.slug || (index + 1)}
                        </Link>
                      </TableCell>
                    )}

                    {isVisible("name") && (
                      <TableCell
                        className={cn(bodyCellCls, "text-left bg-card group-hover:bg-muted")}
                        style={getColumnStyle("name", false)}
                      >
                        <Link
                          href={`/project/${project.id}`}
                          className="hover:underline font-medium truncate max-w-[200px] block text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.name || "Untitled Project"}
                        </Link>
                      </TableCell>
                    )}

                    {isVisible("phase") && (
                      <TableCell className="!p-0 text-center" style={{ ...getColumnStyle("phase", false), height: '1px' }}>
                        {assignedPhase ? (
                          <div
                            className="w-full h-full flex items-center justify-center rounded-xs text-xs font-medium px-3 transition-opacity hover:opacity-90 overflow-hidden"
                            style={{
                              backgroundColor: `${getPhaseColor(assignedPhase.label, assignedPhase.color)}33`,
                              color: getPhaseColor(assignedPhase.label, assignedPhase.color),
                            }}
                          >
                            <span className="truncate w-full text-center">
                              {assignedPhase.label}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center px-3">
                            <span className="text-muted-foreground">—</span>
                          </div>
                        )}
                      </TableCell>
                    )}

                    {isVisible("update") && (
                      (() => {
                        const displayUpdate = project.statusHistory?.[0]?.status || project.currentProjectUpdate || "";
                        const updateConfigs = project.projectStatusConfig || [];
                        const updateConfig = updateConfigs.find((c: any) => c.value === displayUpdate);
                        const color = updateConfig?.color || '#6B7280';
                        return (
                          <TableCell className="!p-0 text-center" style={{ ...getColumnStyle("update", false), height: '1px' }}>
                            <div
                              className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-xs font-medium px-3 transition-opacity hover:opacity-90 overflow-hidden"
                              style={{
                                backgroundColor: color + "33",
                                color: color,
                              }}
                            >
                              <span className="truncate w-full text-center">
                                {updateConfig?.label || displayUpdate || "No update"}
                              </span>
                            </div>
                          </TableCell>
                        );
                      })()
                    )}

                    {isVisible("leader") && (
                      <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('leader', false), height: '1px' }}>
                        <DropdownMenu onOpenChange={(open) => {
                          if (!open) setLeaderSearchQuery('');
                        }}>
                          <DropdownMenuTrigger asChild className="w-full h-full">
                            <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                              <div className="flex items-center justify-center -space-x-2">
                                {projectLeaders.length > 0 ? (
                                  projectLeaders.slice(0, 3).map((u, i) => {
                                    if (!u) return null;
                                    return (
                                      <Avatar key={u.userId || i} className="h-6 w-6 relative" style={{ zIndex: 10 - i }}>
                                        {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} className="object-cover" />}
                                        <AvatarFallback
                                          className="text-white text-[10px] font-semibold bg-muted-foreground"
                                          style={{ backgroundColor: getAvatarColor(u.name || "?") }}
                                        >
                                          {getInitials(u.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    );
                                  })
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground">
                                    <User className="h-3 w-3" />
                                  </div>
                                )}
                                {projectLeaders.length > 3 && (
                                  <div className="h-6 min-w-[24px] rounded-full bg-gray-50 flex items-center justify-center relative z-0 px-1">
                                    <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">+{projectLeaders.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                            <div className="px-1 pb-2" onKeyDown={(e) => e.stopPropagation()}>
                              <Input
                                placeholder="Type @ or name..."
                                value={leaderSearchQuery}
                                onChange={(e) => setLeaderSearchQuery(e.target.value)}
                                className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                                autoFocus
                              />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {getFilteredLeaderMembers(projectMembers).length === 0 ? (
                                <div className="text-center py-2 text-xs text-muted-foreground">
                                  No members found
                                </div>
                              ) : (
                                getFilteredLeaderMembers(projectMembers).map(member => {
                                  const isLeader = leaderIds.includes(member.userId);
                                  return (
                                    <DropdownMenuItem
                                      key={member.userId}
                                      onSelect={(e) => {
                                        e.preventDefault();
                                      }}
                                      className="p-0 focus:bg-transparent"
                                    >
                                      <div className={cn(
                                        "w-full h-9 flex items-center justify-between rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-transparent text-foreground",
                                        isLeader && "bg-muted/50"
                                      )}>
                                        <div className="flex items-center gap-3 truncate">
                                          <Avatar className="h-6 w-6 shrink-0">
                                            {member.profilePicture && <AvatarImage src={getProfilePictureUrl(member.profilePicture)} className="object-cover" />}
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
                      </TableCell>
                    )}

                    {isVisible("members") && (
                      <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('members', false), height: '1px' }}>
                        <DropdownMenu onOpenChange={(open) => {
                          if (!open) setMemberSearchQuery('');
                        }}>
                          <DropdownMenuTrigger asChild className="w-full h-full">
                            <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                              <div className="flex items-center justify-center -space-x-2">
                                {projectMembers.length > 0 ? (
                                  projectMembers.slice(0, 3).map((u, i) => {
                                    if (!u) return null;
                                    return (
                                      <Avatar key={u.userId || i} className="h-6 w-6 relative" style={{ zIndex: 10 - i }}>
                                        {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} className="object-cover" />}
                                        <AvatarFallback
                                          className="text-white text-[10px] font-semibold bg-muted-foreground"
                                          style={{ backgroundColor: getAvatarColor(u.name || "?") }}
                                        >
                                          {getInitials(u.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    );
                                  })
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground">
                                    <User className="h-3 w-3" />
                                  </div>
                                )}
                                {projectMembers.length > 3 && (
                                  <div className="h-6 min-w-[24px] rounded-full bg-gray-50 flex items-center justify-center relative z-0 px-1">
                                    <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">+{projectMembers.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                            <div className="px-1 pb-2" onKeyDown={(e) => e.stopPropagation()}>
                              <Input
                                placeholder="Type @ or name..."
                                value={memberSearchQuery}
                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                                autoFocus
                              />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {getFilteredMemberMembers(projectMembers).length === 0 ? (
                                <div className="text-center py-2 text-xs text-muted-foreground">
                                  No members found
                                </div>
                              ) : (
                                getFilteredMemberMembers(projectMembers).map(member => {
                                  const isMember = project.members?.some(m => m.userId === member.userId);
                                  return (
                                    <DropdownMenuItem
                                      key={member.userId}
                                      onSelect={(e) => {
                                        e.preventDefault();
                                      }}
                                      className="p-0 focus:bg-transparent"
                                    >
                                      <div className={cn(
                                        "w-full h-9 flex items-center justify-between rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-transparent text-foreground",
                                        isMember && "bg-muted/50"
                                      )}>
                                        <div className="flex items-center gap-3 truncate">
                                          <Avatar className="h-6 w-6 shrink-0">
                                            {member.profilePicture && <AvatarImage src={getProfilePictureUrl(member.profilePicture)} className="object-cover" />}
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
                      </TableCell>
                    )}

                    {isVisible("viewers") && (
                      <TableCell className="!p-0 text-center" style={{ ...getColumnStyle('viewers', false), height: '1px' }}>
                        <DropdownMenu onOpenChange={(open) => {
                          if (!open) setViewerSearchQuery('');
                        }}>
                          <DropdownMenuTrigger asChild className="w-full h-full">
                            <button className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
                              <div className="flex items-center justify-center -space-x-2">
                                {projectViewers.length > 0 ? (
                                  projectViewers.slice(0, 3).map((u, i) => {
                                    if (!u) return null;
                                    return (
                                      <Avatar key={u.userId || i} className="h-6 w-6 relative" style={{ zIndex: 10 - i }}>
                                        {u.profilePicture && <AvatarImage src={getProfilePictureUrl(u.profilePicture)} className="object-cover" />}
                                        <AvatarFallback
                                          className="text-white text-[10px] font-semibold bg-muted-foreground"
                                          style={{ backgroundColor: getAvatarColor(u.name || "?") }}
                                        >
                                          {getInitials(u.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    );
                                  })
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground">
                                    <User className="h-3 w-3" />
                                  </div>
                                )}
                                {projectViewers.length > 3 && (
                                  <div className="h-6 min-w-[24px] rounded-full bg-gray-50 flex items-center justify-center relative z-0 px-1">
                                    <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">+{projectViewers.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="p-4 w-[200px] space-y-1">
                            <div className="px-1 pb-2" onKeyDown={(e) => e.stopPropagation()}>
                              <Input
                                placeholder="Type @ or name..."
                                value={viewerSearchQuery}
                                onChange={(e) => setViewerSearchQuery(e.target.value)}
                                className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                                autoFocus
                              />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {getFilteredViewerMembers(projectMembers).length === 0 ? (
                                <div className="text-center py-2 text-xs text-muted-foreground">
                                  No members found
                                </div>
                              ) : (
                                getFilteredViewerMembers(projectMembers).map(member => {
                                  const isViewer = project.viewers?.includes(member.userId);
                                  return (
                                    <DropdownMenuItem
                                      key={member.userId}
                                      onSelect={(e) => {
                                        e.preventDefault();
                                      }}
                                      className="p-0 focus:bg-transparent"
                                    >
                                      <div className={cn(
                                        "w-full h-9 flex items-center justify-between rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 bg-transparent text-foreground",
                                        isViewer && "bg-muted/50"
                                      )}>
                                        <div className="flex items-center gap-3 truncate">
                                          <Avatar className="h-6 w-6 shrink-0">
                                            {member.profilePicture && <AvatarImage src={getProfilePictureUrl(member.profilePicture)} className="object-cover" />}
                                            <AvatarFallback
                                              className="text-white text-[10px] font-semibold bg-muted-foreground"
                                              style={{ backgroundColor: getAvatarColor(member.name || "?") }}
                                            >
                                              {getInitials(member.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate">{member.name}</span>
                                        </div>
                                        {isViewer && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                                      </div>
                                    </DropdownMenuItem>
                                  );
                                })
                              )}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}

                    {isVisible("priority") && (
                      <TableCell className="!p-0 text-center" style={{ ...getColumnStyle("priority", false), height: '1px' }}>
                        <PriorityFlag
                          priority={project.priority}
                          color={getPriorityColor(project)}
                        />
                      </TableCell>
                    )}

                    {isVisible("startDate") && (
                      <TableCell className={`${bodyCellCls} text-center`} style={getColumnStyle("startDate", false)}>
                        {project.startDate ? (
                          <span className="text-foreground">{format(new Date(project.startDate), 'd MMM')}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}

                    {isVisible("endDate") && (
                      <TableCell className={`${bodyCellCls} text-center`} style={getColumnStyle("endDate", false)}>
                        {project.endDate ? (
                          <span className="text-foreground">{format(new Date(project.endDate), 'd MMM')}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}

                    {isVisible("progress") && (
                      <TableCell className={`${bodyCellCls} text-center`} style={getColumnStyle("progress", false)}>
                        <span className="text-muted-foreground">—</span>
                      </TableCell>
                    )}
                    {/* Row actions sticky cell */}
                    <TableCell
                      className={cn("w-12 text-center bg-card group-hover:bg-muted")}
                      style={{
                        position: 'sticky',
                        right: 0,
                        zIndex: 20,
                        borderLeft: '1px solid var(--border)',
                        boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[190px] p-1 border-b-5 border-b-primary">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); project.id && router.push(`/project/${project.id}`); }}
                            className="py-2 text-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Open project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {portfolioId && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); project.id && setProjectToRemove(project.id); }}
                              className="py-2 text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Remove from portfolio
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); project.id && setProjectToArchive(project.id); }}
                            className="py-2 text-xs"
                          >
                            <Archive className="h-3.5 w-3.5 mr-1" />
                            Archive project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); project.id && setProjectToDelete(project.id); }}
                            className="text-red-500 focus:text-red-500 py-2 text-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
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
                className="group border-b border-border bg-card hover:bg-card"
                onMouseEnter={() => setIsAddProjectRowHovered(true)}
                onMouseLeave={() => setIsAddProjectRowHovered(false)}
              >
                <TableCell className="p-0 bg-card" style={getDragColumnStyle(false, `${groupColor}44`)} />
                {isVisible("id") && (
                  <TableCell className={cn(bodyCellCls, "text-transparent bg-card")} style={getColumnStyle("id", false)} />
                )}
                <TableCell
                  className={cn(bodyCellCls, "bg-card")}
                  style={getColumnStyle("name", false)}
                >
                  <div className="flex items-center gap-1 pl-4">
                    <div
                      className={cn(
                        "flex items-center rounded-sm transition-all group",
                        (isAddProjectRowHovered || showAddProjectMenu) ? "border border-primary/30" : "border border-transparent"
                      )}
                    >
                      <button
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 transition-colors text-xs focus:outline-none",
                          (isAddProjectRowHovered || showAddProjectMenu) ? "text-primary/60" : "text-muted-foreground"
                        )}
                        onClick={() => router.push(`/portfolio/${portfolioId}/create-project`)}
                      >
                        <Plus className={cn("h-3 w-3", (isAddProjectRowHovered || showAddProjectMenu) ? "text-primary/60" : "text-muted-foreground")} />
                        Add New Project
                      </button>

                      <DropdownMenu open={showAddProjectMenu} onOpenChange={setShowAddProjectMenu}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "px-1 py-0.5 border-l border-primary/30 text-muted-foreground group-hover:text-primary/60 transition-colors outline-none",
                              !(isAddProjectRowHovered || showAddProjectMenu) && "invisible"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuContent
                            align="start"
                            side="top"
                            className="bg-card border border-border border-b-[5px] border-b-primary rounded-md shadow-lg min-w-[170px] z-[9999] p-0"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                setShowAddProjectMenu(false);
                                router.push(`/portfolio/${portfolioId}/create-project`);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground cursor-pointer rounded-none focus:bg-muted"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add new project</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setShowAddProjectMenu(false);
                                onAddProject?.();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground cursor-pointer rounded-none border-t border-border focus:bg-muted"
                            >
                              <LinkIcon className="h-3.5 w-3.5" />
                              <span>Add existing project</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenuPortal>
                      </DropdownMenu>
                    </div>
                  </div>
                </TableCell>
                {isVisible("phase") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("phase", false)} />
                )}
                {isVisible("update") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("update", false)} />
                )}
                {isVisible("leader") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("leader", false)} />
                )}
                {isVisible("members") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("members", false)} />
                )}
                {isVisible("viewers") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("viewers", false)} />
                )}
                {isVisible("priority") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("priority", false)} />
                )}
                {isVisible("startDate") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("startDate", false)} />
                )}
                {isVisible("endDate") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("endDate", false)} />
                )}
                {isVisible("progress") && (
                  <TableCell className={cn(bodyCellCls, "bg-card")} style={getColumnStyle("progress", false)} />
                )}
                {/* Actions column sticky cell at the end */}
                <TableCell
                  className={cn("w-12 text-center bg-card")}
                  style={{
                    position: 'sticky',
                    right: 0,
                    zIndex: 20,
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-2px 0 4px rgba(0,0,0,0.04)',
                    padding: 0,
                    margin: 0,
                  }}
                />
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
