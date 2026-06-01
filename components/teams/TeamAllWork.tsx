
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronUp, Plus, PanelsTopLeft, Target, LayoutDashboard, Filter, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useTeamStore } from '@/stores/teams-store';
import { useTasksStore } from '@/stores/tasks-store';
import { Task } from '@/types/task.types'
import { formatTaskId } from '@/utils/task-utils';
import { useProjectsStore } from '@/stores/projects-store';
import { iconComponentMap } from '@/components/ColorIconPicker';
import { IoFolderOpenSharp } from 'react-icons/io5';

import { getAvatarColor, getInitials } from '@/utils/avatar-utils';
import { TeamWorkTaskTable } from './TeamAllWork/TeamWorkTaskTable';

const ProjectIcon = ({ project, size = 16 }: { project: any, size?: number }) => {
  const name = project?.name || 'Unknown';
  const firstLetter = name.charAt(0).toUpperCase();

  // If no icon/image is provided, use the first letter as fallback
  if (!project || (!project.icon && !project.iconId)) {
    return (
      <div
        className="flex items-center justify-center rounded bg-primary text-primary-foreground font-bold leading-none shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.65 }}
      >
        {firstLetter}
      </div>
    );
  }

  const { icon, color = '#3B82F6' } = project;

  if (icon?.type === 'file' && icon?.presignedUrl) {
    return (
      <img
        src={icon.presignedUrl}
        alt={project.name}
        className="rounded-md object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  const IconComponent = (icon?.name && iconComponentMap[icon.name]) ? iconComponentMap[icon.name] : null;

  if (!IconComponent) {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold leading-none shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.65 }}
      >
        {firstLetter}
      </div>
    );
  }
  return (
    <IconComponent
      size={size}
      color={icon?.color || color}
      className="shrink-0"
    />
  );
};

interface MemberWithTasks {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  tasks: Task[];
}

export default function TeamAllWork() {
  const { activeTeamId, fetchTeamById, teams, loading, getTasksByProject } = useTeamStore();
  const { tasks } = useTasksStore();
  const { projects, } = useProjectsStore();
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const router = useRouter();

  const teamId = activeTeamId || (teams.length > 0 ? teams[0].id : null);

  // Fetch team + tasks when teamId changes
  React.useEffect(() => {
    if (teamId) {
      getTasksByProject(teamId); // ✅ NEW: Fetches tasks for all team projects
    }
  }, [teamId, getTasksByProject]);

  const activeTeam = useMemo(
    () => teams.find(t => t.id === activeTeamId),
    [teams, activeTeamId]
  );

  const allowedProjectIds = useMemo(() => {
    if (!activeTeam) return [];
    if (Array.isArray(activeTeam.projectIds) && activeTeam.projectIds.length > 0) {
      return activeTeam.projectIds.map(String);
    }
    if (Array.isArray((activeTeam as any).projects) && (activeTeam as any).projects.length > 0) {
      return (activeTeam as any).projects
        .map((p: any) => String(p?.id || p?.projectId || ""))
        .filter(Boolean);
    }
    return [];
  }, [activeTeam]);

  const teamProjects = useMemo(() => {
    return projects.filter((p) => p.id && allowedProjectIds.includes(String(p.id)));
  }, [projects, allowedProjectIds]);

  const teamScopedTasks = useMemo(() => {
    return tasks.filter((task) => allowedProjectIds.includes(String(task.projectId)));
  }, [tasks, allowedProjectIds]);

  const getTaskStatusConfig = (projectId: string, statusValue: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.taskStatusConfig?.find((cfg: any) => cfg.value === statusValue);
  };

  const getTaskPriorityConfig = (projectId: string, priorityValue: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project?.taskPriorityConfig?.find((cfg: any) => cfg.value === priorityValue);
  };

  // Given this member's tasks, return an array of { status, label, color, count }
  // ✅ Aggregate from ALL projects this member has tasks in
  const getMemberStatusStats = (memberTasks: Task[]) => {
    if (!memberTasks.length) return [];

    // Get ALL unique status configs from projects this member works on
    const relevantProjects = Array.from(new Set(memberTasks.map(task => task.projectId)))
      .map(projectId => projects.find(p => p.id === projectId))
      .filter(Boolean);

    const allStatusConfigs = relevantProjects.flatMap(p => p?.taskStatusConfig || []);

    // Dedupe by value, prefer first occurrence
    const uniqueConfigs = allStatusConfigs.reduce((acc, cfg) => {
      if (!acc.find(s => s.value === cfg.value)) acc.push(cfg);
      return acc;
    }, [] as any[]);

    // Determine counts for each status present in tasks
    const taskStatusFrequencies = memberTasks.reduce((acc, task) => {
      const status = task.status || 'To Do';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Combine configs with actual task statuses (handling those without config)
    const stats = Object.entries(taskStatusFrequencies).map(([statusValue, count]) => {
      const config = uniqueConfigs.find(c => c.value === statusValue);

      // Default color logic
      let color = config?.color;
      if (!color) {
        const lowerStatus = statusValue.toLowerCase();
        if (lowerStatus.includes('done') || lowerStatus.includes('complete')) color = '#10b981'; // green
        else if (lowerStatus.includes('progress') || lowerStatus.includes('working')) color = '#f59e0b'; // amber
        else if (lowerStatus.includes('todo') || lowerStatus.includes('backlog') || lowerStatus.includes('scope')) color = '#64748b'; // slate
        else if (lowerStatus.includes('risk') || lowerStatus.includes('error') || lowerStatus.includes('block')) color = '#ef4444'; // red
        else color = '#3b82f6'; // blue default
      }

      return {
        value: statusValue,
        label: config?.label || statusValue,
        color,
        count,
      };
    });

    // Sort: To Do types first, then In Progress, then Done, then others
    return stats.sort((a, b) => {
      const getPriority = (val: string) => {
        const v = val.toLowerCase();
        if (v.includes('todo') || v.includes('backlog')) return 1;
        if (v.includes('progress') || v.includes('working')) return 2;
        if (v.includes('done') || v.includes('complete')) return 3;
        return 4;
      };
      return getPriority(a.value) - getPriority(b.value);
    });
  };

  // ✅ Remove .map() transformation - use real fields directly
  const membersWithTasks: MemberWithTasks[] = useMemo(() => {
    if (!activeTeam?.teamMembers) return [];

    return activeTeam.teamMembers.map((member: any) => {
      const memberTasks = teamScopedTasks.filter(
        (task) =>
          String(task.assignee) === String(member.id) ||
          String((task as any).assigneeId || "") === String(member.id)
      );

      return {
        id: member.id,
        name: member.name || "Unnamed",
        role: member.role || "Member",
        avatar: member.avatar || undefined,
        initials:
          member.initials || getInitials(member.name),
        tasks: memberTasks,
      };
    });
  }, [activeTeam?.teamMembers, teamScopedTasks]);

  const filterOptions = useMemo(() => {
    const projectIds = new Set<string>();
    const userIds = new Set<string>();
    const statuses = new Set<string>();
    const priorities = new Set<string>();

    teamScopedTasks.forEach((t) => {
      if (t.projectId) projectIds.add(String(t.projectId));
      if (t.assignee) userIds.add(String(t.assignee));
      if ((t as any).assigneeId) userIds.add(String((t as any).assigneeId));
      if (t.status) statuses.add(t.status);
      if (t.priority) priorities.add(t.priority);
    });

    return {
      projects: teamProjects.filter((p) => !!p.id && projectIds.has(String(p.id))),
      users:
        activeTeam?.teamMembers?.filter(
          (member: any) => !!member.id && userIds.has(String(member.id))
        ) || [],
      statuses: Array.from(statuses),
      priorities: Array.from(priorities),
    };
  }, [teamScopedTasks, teamProjects, activeTeam]);

  const filteredMembersWithTasks = useMemo(() => {
    let result = membersWithTasks.map(m => {
      let mTasks = m.tasks;

      if (selectedProjectId) mTasks = mTasks.filter(t => t.projectId === selectedProjectId);
      if (selectedStatus) mTasks = mTasks.filter(t => t.status === selectedStatus);
      if (selectedPriority) mTasks = mTasks.filter(t => t.priority === selectedPriority);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        mTasks = mTasks.filter(t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
      }

      return { ...m, tasks: mTasks };
    });

    const isAnyFilterActive = !!(selectedProjectId || selectedStatus || selectedPriority || searchQuery || selectedUserId);

    if (selectedUserId) {
      result = result.filter(m => m.id === selectedUserId);
    }

    if (isAnyFilterActive) {
      result = result.filter(m => m.tasks.length > 0);
    }

    return result;
  }, [membersWithTasks, selectedProjectId, selectedUserId, selectedStatus, selectedPriority, searchQuery]);

  const activeFilterCount = [selectedProjectId, selectedUserId, selectedStatus, selectedPriority].filter(Boolean).length;

  const toggleMember = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
      case 'low':
        return 'bg-green-100 dark:bg-emerald-950/30 text-green-600 dark:text-emerald-400 border-green-200 dark:border-emerald-900/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const isLoading = loading;
  // const memberStatusStats = getMemberStatusStats(member.tasks);

  // Get projectSlug from EACH task's project
  const getProjectSlug = (taskProjectId: string) => {
    const proj = projects.find(p => p.id === taskProjectId)
    return proj?.slug ?? 'TASK'
  }

  if (!activeTeam) {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Loading team work...
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No active team found.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-3 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Create Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-0 py-2 rounded-md flex items-center text-sm">
                <Plus />
                Create
                <span className="h-4 w-px bg-white/30 ml-1" />
                <ChevronDown size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-35 p-2 border-b-5 border-b-primary rounded-b-lg bg-popover text-popover-foreground border-border" align="start">
              <button className="flex items-center gap-2 w-full text-left px-1 py-2 text-sm text-foreground hover:bg-muted rounded transition-colors">
                <LayoutDashboard className="h-4 w-4" />
                Portfolio
              </button>

              <button
                className="flex items-center gap-2 w-full text-left px-1 py-2 text-sm text-foreground hover:bg-muted rounded transition-colors"
                onClick={() => router.push(`/teams/${teamId}/create-project`)}
              >
                <PanelsTopLeft className="h-4 w-4" />
                Project
              </button>

              <button
                className="flex items-center gap-2 w-full text-left px-1 py-2 text-foreground text-sm hover:bg-muted rounded transition-colors"
                onClick={() => router.push(`/teams/${teamId}/create-goal`)}
              >
                <Target className="h-4 w-4" />
                Goals
              </button>
            </PopoverContent>
          </Popover>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-muted text-muted-foreground hover:bg-muted/85 hover:text-foreground">
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filter</span>
                {/* <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-xs">
                  {activeFilterCount}
                </Badge> */}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeFilterCount}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">

              {/* User Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={`
                    relative flex items-center gap-2 pl-3 text-foreground
                    ${selectedUserId !== null ? 'bg-muted' : ''}
                  `}
                >
                  {/* ✅ Left indicator for active filter */}
                  {selectedUserId !== null && (
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                  )}
                  <span>User</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">
                    <DropdownMenuItem
                      onClick={() => setSelectedUserId(null)}
                      className={`
                        relative flex items-center gap-2 pl-3
                        ${selectedUserId === null ? 'bg-muted' : ''}
                      `}
                    >
                      {/* ✅ Left indicator */}
                      {selectedUserId === null && (
                        <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                      )}
                      All Users
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.users.map(user => (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`
                          relative flex items-center gap-2 pl-3
                          ${selectedUserId === user.id ? 'bg-muted' : ''}
                        `}
                      >
                        {/* ✅ Left indicator */}
                        {selectedUserId === user.id && (
                          <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                        )}
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className={`${getAvatarColor(user.id)} text-white shrink-0`}>{user.initials}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Projects Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={`
                    relative flex items-center gap-2 pl-3 text-foreground
                    ${selectedProjectId !== null ? 'bg-muted' : ''}
                  `}
                >
                  {/* ✅ Left indicator for active filter */}
                  {selectedProjectId !== null && (
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                  )}
                  <span>Projects</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">
                    <DropdownMenuItem
                      onClick={() => setSelectedProjectId(null)}
                      className={`
                        relative flex items-center gap-2 pl-3
                        ${selectedProjectId === null ? 'bg-muted' : ''}
                      `}
                    >
                      {/* ✅ Left indicator */}
                      {selectedProjectId === null && (
                        <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                      )}
                      All Projects
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.projects.map(project => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id ?? null)}
                        className={`
                          relative flex items-center gap-2 pl-3
                          ${selectedProjectId === project.id ? 'bg-muted' : ''}
                        `}
                      >
                        {/* ✅ Left indicator */}
                        {selectedProjectId === project.id && (
                          <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                        )}

                        <ProjectIcon project={project} />
                        <span>{project.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Status Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={`
                    relative flex items-center gap-2 pl-3 text-foreground
                    ${selectedStatus !== null ? 'bg-muted' : ''}
                  `}
                >
                  {/* ✅ Left indicator for active filter */}
                  {selectedStatus !== null && (
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                  )}
                  <span>Status</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus(null)}
                      className={`
                        relative flex items-center gap-2 pl-3
                        ${selectedStatus === null ? 'bg-muted' : ''}
                      `}
                    >
                      {/* ✅ Left indicator */}
                      {selectedStatus === null && (
                        <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                      )}
                      All status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.statuses.map(status => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`
                          relative flex items-center gap-2 pl-3
                          ${selectedStatus === status ? 'bg-muted' : ''}
                        `}
                      >
                        {/* ✅ Left indicator */}
                        {selectedStatus === status && (
                          <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                        )}
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Priority Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={`
                    relative flex items-center gap-2 pl-3 text-foreground
                    ${selectedPriority !== null ? 'bg-muted' : ''}
                  `}
                >
                  {/* ✅ Left indicator for active filter */}
                  {selectedPriority !== null && (
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                  )}
                  <span>Priority</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">
                    <DropdownMenuItem
                      onClick={() => setSelectedPriority(null)}
                      className={`
                        relative flex items-center gap-2 pl-3
                        ${selectedPriority === null ? 'bg-muted' : ''}
                      `}
                    >
                      {/* ✅ Left indicator */}
                      {selectedPriority === null && (
                        <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                      )}
                      All Priority
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.priorities.map(priority => (
                      <DropdownMenuItem
                        key={priority}
                        onClick={() => setSelectedPriority(priority)}
                        className={`
                          relative flex items-center gap-2 pl-3 capitalize
                          ${selectedPriority === priority ? 'bg-muted' : ''}
                        `}
                      >
                        {/* ✅ Left indicator */}
                        {selectedPriority === priority && (
                          <span className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r-sm transition-all duration-200" />
                        )}
                        {priority}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="w-full flex items-center justify-center rounded-md text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer font-medium px-3 py-2 mt-1"
                    onClick={() => {
                      setSelectedProjectId(null);
                      setSelectedUserId(null);
                      setSelectedStatus(null);
                      setSelectedPriority(null);
                    }}
                  >
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto space-y-1 ">
        {filteredMembersWithTasks.map((member) => {
          const memberStatusStats = getMemberStatusStats(member.tasks);

          return (
            <Card key={member.id} className="border-l-4 border-l-primary overflow-hidden py-3!">
              {/* Member Header */}
              <div
                onClick={() => toggleMember(member.id)}
                className="px-2 py-0 flex items-center cursor-pointer"
              >
                {/* Left side: Avatar + Name */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className={`${getAvatarColor(member.id)} text-white shrink-0`}>{member.initials}</AvatarFallback>
                  </Avatar>

                  <div>
                    <h6 className="font-semibold text-foreground">{member.name}</h6>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>

                {/* Right side: Badges + Chevron */}
                <div className="ml-auto flex items-center gap-4">
                  <div className="hidden md:flex flex-wrap justify-end items-center gap-2 max-w-155">
                    {memberStatusStats.map(stat => (
                      <Badge
                        key={stat.value}
                        variant="outline"
                        style={{
                          backgroundColor: `${stat.color}15`, // slightly lighter bg
                          color: stat.color,
                          borderColor: `${stat.color}40`, // softer border
                        }}
                        className="text-xs font-semibold px-2 py-1.5 flex items-center gap-1.5 whitespace-nowrap rounded-[3.5px]"
                      >
                        {stat.label}
                        <span
                          style={{
                            backgroundColor: '#ffffff',
                            color: stat.color,
                            borderColor: stat.color,
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] border shrink-0"
                        >
                          {stat.count}
                        </span>
                      </Badge>
                    ))}
                  </div>

                  <button
                    // onClick={(e) => e.stopPropagation()}
                    onClick={() => toggleMember(member.id)}
                    className="hover:bg-muted rounded px-2 py-2 transition-colors"
                  >
                    {expandedMembers.has(member.id) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Tasks Table - Shown when expanded */}
              {expandedMembers.has(member.id) && (
                <div className="max-h-[420px] overflow-auto rounded-md border border-border relative">
                  <TeamWorkTaskTable
                    isTeamView
                    groupId={member.id}
                    filteredTasks={member.tasks}
                    hideFields={[]}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}