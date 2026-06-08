"use client";

import { useState, useEffect } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTeamStore } from "@/stores/teams-store";
import { useGoalsStore } from "@/stores/goals-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { DashboardSection } from "@/components/Goals/DashboardSection";
import { DashboardItemCard } from "@/components/Goals/DashboardItemCard";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { WorkloadPieChart } from "@/components/Dashboard/mywork/WorkloadPieChart";
import { MyWorkPanel } from "@/components/Dashboard/mywork/MyWorkPanel";
import { AssignedToMe } from "@/components/Dashboard/mywork/AssignedToMe";
import { WorkloadRightSidebar } from "@/components/Dashboard/mywork/WorkloadRightSidebar";
import { RecentProjectsTable } from "@/components/Dashboard/mywork/RecentProjectsTable";
import { StatsOverview } from "@/components/Dashboard/mywork/StatsOverview";

export default function ProjectDashboardPage() {
  const router = useRouter();
  const { projects, fetchProjects, fetchProjectById } = useProjectsStore();
  const { fetchTasks, tasks } = useTasksStore();
  const { fetchTeams, teams } = useTeamStore();
  const { fetchGoals, goals } = useGoalsStore();
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { myWork, fetchMyWork } = useProfileStore();
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  // Fetch initial non-days-dependent data
  useEffect(() => {
    const init = async () => {
      await fetchProjects();
      const allProjects = useProjectsStore.getState().projects;

      const workspaceId = currentWorkspace?.id;

      // Fetch details and tasks for each project
      await Promise.all([
        ...allProjects.map((p) => p.id ? fetchProjectById(p.id) : Promise.resolve()),
        ...allProjects.map((p) => p.id ? fetchTasks(p.id, true) : Promise.resolve()),
        fetchTeams(),
        workspaceId ? fetchGoals(workspaceId) : Promise.resolve(),
        workspaceId ? fetchWorkspaceMembers(workspaceId) : Promise.resolve(),
      ]);

      setIsLoading(false);
    };
    init();
  }, [fetchProjects, fetchProjectById, fetchTasks, fetchTeams, fetchGoals, currentWorkspace?.id, fetchWorkspaceMembers]);

  useEffect(() => {
    fetchMyWork(days);
  }, [days, fetchMyWork]);

  const getGoalCreatorInfo = (goal: any) => {
    const owner = goal.owners?.[0] || goal.createdBy;
    if (typeof owner === 'object' && owner) {
      return {
        name: owner.name || "Unknown",
        image: owner.profilePictureUrl || owner.profilePicture || owner.avatar || undefined,
      };
    }

    if (typeof owner === 'string' && workspaceMembers.length > 0) {
      const member = workspaceMembers.find((m: any) => m.userId === owner || m.id === owner || m._id === owner);
      if (member) {
        return {
          name: member.name || "Unknown",
          image: member.profilePicture || member.avatar || (member as any).profilePictureUrl || undefined,
        };
      }
    }

    return { name: "Unknown", image: undefined };
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">
      {/*Fixed Header */}
      <div className="shrink-0 bg-background border-b z-10">
        <div className="flex items-center justify-between px-10 py-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">My Work</h1>
            {myWork?.period && (
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Showing work from <span className="text-foreground">{format(new Date(myWork.period.since), "MMM d, yyyy")}</span> to <span className="text-foreground">{format(new Date(myWork.period.until), "MMM d, yyyy")}</span> ({myWork.period.days} Days)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Timeframe:</span>
            <Select value={String(days)} onValueChange={(val) => setDays(Number(val))}>
              <SelectTrigger size="sm" className="w-[130px] text-xs font-medium">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="10">Last 10 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="60">Last 60 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-3">

          <WorkloadPieChart />

          {/* ── Row 2: Task Panel ── */}
          <div className="grid grid-cols-[1fr_260px] rounded-2xl border bg-background">
            {/* CENTER — MyWork + AssignedToMe */}
            <div className="border-r flex flex-col h-[400px]">
              <div className="flex-1 overflow-hidden px-5 py-4 flex flex-col">
                <AssignedToMe />
              </div>
            </div>

            {/*  My Projects + Recents (Sidebar) */}
            <div className="h-[400px] flex flex-col overflow-hidden">
              <div className="px-4 py-4 flex-1 flex flex-col overflow-hidden">
                <WorkloadRightSidebar />
              </div>
            </div>
          </div>

      
          {/*  Row 4: Mentions + Achievement */}
          <StatsOverview
            projects={projects}
            tasks={(myWork?.tasks?.list || []).map((t) => ({
              ...t,
              name: t.title,
              assignee: t.assigneeId || user?.id,
              completed: ["done", "completed", "wont_do"].includes(t.status?.toLowerCase().trim() ?? ""),
            })) as any}
            teams={(myWork?.teams || []).map((team) => ({
              ...team,
              teamMembers: [{ userId: user?.id, id: user?.id }]
            })) as any}
            goals={(myWork?.goals?.list || []).map((g) => ({
              ...g,
              title: g.title || g.description
            })) as any}
            user={user}
            className="mb-4"
          />

          {/* Recent Projects Table */}
          <RecentProjectsTable />
        </div>
      </div>
    </div>
  );
}
