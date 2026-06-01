
'use client'

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import AddIcon from '@/public/images/Overview/membersplus'
import WarningAmberIcon from '@/public/images/Overview/traingle'
import { useParams } from 'next/navigation'
import { useTeamStore } from '@/stores/teams-store'
import { Avatar, AvatarImage, AvatarFallback, } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XIcon, UserPlus2, Plus, Triangle, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import RightPanel from './TeamOverview/RightPanel'
import InviteTeamMembersDialog from './InviteTeamMembersDialog'
import TeamMembersDisplay from './TeamOverview/TeamMembersDisplay'
import { useRouter } from 'next/navigation'
import { Project, useProjectsStore } from '@/stores/projects-store'
import { useTasksStore } from '@/stores/tasks-store';
import LoadingSkeleton from './TeamOverview/LoadingSkeleton'
import ProjectsList from './TeamOverview/ProjectsList'
import EmptyProjectsState from './TeamOverview/EmptyProjectState'
import LinkEntityDialog from './TeamOverview/LinkEntityDialog'
import { useGoalsStore } from '@/stores/goals-store'
import EmptyGoalsState from './TeamOverview/EmptyGoalState'
import GoalsList from './TeamOverview/GoalsList'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { usePortfoliosStore } from '@/stores/portfolios-store'
import PortfoliosList from './TeamOverview/PortfoliosList'
import EmptyPortfolioState from './TeamOverview/EmptyPortfolioState'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface TeamOverviewProps {
  team?: any;
}

interface InviteMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
  profilePictureUrl?: string | null;
  initials: string;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({ team: passedTeam }) => {
  const [openMembersDialog, setOpenMembersDialog] = useState(false)
  const [isLocalProjectsLoading, setIsLocalProjectsLoading] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState<null | 'project' | 'goal' | 'portfolio'>(null)
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const router = useRouter();
  const workspaceId = currentWorkspace?.id

  const teamId = passedTeam?.id;

  const projects = useProjectsStore(state => state.projects);
  const isProjectsLoading = useProjectsStore(state => state.isLoading);

  const goals = useGoalsStore(state => state.goals);
  const isGoalsLoading = useGoalsStore(state => state.isLoading);
  const fetchGoals = useGoalsStore(state => state.fetchGoals);

  const portfolios = usePortfoliosStore(state => state.portfolios);
  const isPortfoliosLoading = usePortfoliosStore(state => state.isLoading);
  const fetchPortfolios = usePortfoliosStore(state => state.fetchPortfolios);

  const team = useTeamStore(state =>
    state.teams.find(t => t.id === passedTeam?.id)
  );
  const fetchTeamById = useTeamStore(state => state.fetchTeamById);

  const teamProjectIds = team?.projectIds ?? [];
  // ✅ Fix — fetch tasks for each team project with projectId
  const tasks = useTasksStore(state => state.tasks);
  const fetchTasks = useTasksStore(state => state.fetchTasks);
  const tasksFetchingRef = useRef<Set<string>>(new Set())

  const fetchTeamTasks = useCallback(async (projectIds: string[]) => {
    const newIds = projectIds.filter(id => !tasksFetchingRef.current.has(id))

    for (const projectId of newIds) {
      tasksFetchingRef.current.add(projectId)
      try {
        await fetchTasks(projectId)
      } catch (error) {
        console.error(`Failed to fetch tasks for project ${projectId}:`, error)
      } finally {
        tasksFetchingRef.current.delete(projectId)
      }
    }
  }, [fetchTasks])

  const teamProjectIdsKey = teamProjectIds.join(',');

  useEffect(() => {
    if (teamProjectIds?.length > 0) {
      fetchTeamTasks(teamProjectIds)
    }
  }, [teamProjectIdsKey, fetchTeamTasks]) // Stable deps only

  const teamGoalIds = team?.goals ?? [];

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchGoals(currentWorkspace.id);
      fetchPortfolios(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchGoals, fetchPortfolios]);

  useEffect(() => {
    if (teamId) {
      // Only fetch if not already in store or if we want to refresh
      // But avoid unconditional fetch inside useEffect that triggers re-render
      fetchTeamById(teamId);
    }
  }, [teamId, fetchTeamById]);

  const teamMembers: InviteMember[] =
    team?.teamMembers?.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      initials: m.email?.[0]?.toUpperCase() ?? m.name?.[0]?.toUpperCase() ?? '',
    })) ?? [];

  const enrichedTeamProjects = useMemo(() => {
    return teamProjectIds
      ?.map(projectId => {
        const project = projects.find(p => p.id === projectId)
        if (!project) return null

        const projectTasks = tasks.filter(t => t.projectId === projectId)
        return {
          ...project,
          tasksCount: projectTasks.length,
        }
      })
      ?.filter((project): project is Project & { tasksCount: number } =>
        Boolean(project && typeof (project as any).tasksCount === 'number')
      ) ?? []
  }, [
    teamProjectIds?.join(','),
    projects,
    tasks, // zustand/shallow will help here if you use it globally
  ])

  const teamMemberIds = team?.members?.map(m => m.id) ?? [];

  const enrichedTeamGoals = useMemo(() => {
    if (!teamMemberIds.length) return [];

    return goals.filter(goal =>
      goal.assignedTo?.some(userId =>
        teamMemberIds.includes(userId)
      )
    );
  }, [goals, teamMemberIds]);

  const teamPortfolioIds = team?.portfolioIds ?? [];
  const teamPortfoliosRaw = team?.portfolios ?? [];
  const hasPortfolios = teamPortfolioIds.length > 0 || teamPortfoliosRaw.length > 0;

  const enrichedTeamPortfolios = useMemo(() => {
    const ids = new Set([
      ...teamPortfolioIds,
      ...teamPortfoliosRaw.map(p => (typeof p === 'string' ? p : p.id))
    ].filter(Boolean));

    return Array.from(ids).map(id => {
      const portfolio = portfolios.find(p => p.id === id)
      if (portfolio) return portfolio;

      const raw = teamPortfoliosRaw.find(p => (typeof p === 'string' ? p === id : p.id === id));
      return typeof raw === 'object' ? raw : null;
    }).filter(Boolean);
  }, [teamPortfolioIds, teamPortfoliosRaw, portfolios]);

  useEffect(() => {
    const shouldBeLoading = teamProjectIds.length > 0 && enrichedTeamProjects.length === 0;
    if (shouldBeLoading !== isLocalProjectsLoading) {
      setIsLocalProjectsLoading(shouldBeLoading);
    }
  }, [teamProjectIds.length, enrichedTeamProjects.length, isLocalProjectsLoading]);

  const hasProjects = enrichedTeamProjects.length > 0;

  const showTeamProjectsLoading = isProjectsLoading ||
    isLocalProjectsLoading ||
    (teamProjectIds?.some(id => tasksFetchingRef.current.has(id)) ?? false)

  const showGoalsLoading = isGoalsLoading;
  const hasGoals = enrichedTeamGoals.length > 0;
  // console.log("Has goals", hasGoals);

  return (
    <div
      data-testid="team-overview-container"
      className="pl-2 pr-0 mt-0 h-full pb-0 bg-background text-foreground"
    >
      <ResizablePanelGroup direction="horizontal" className="flex h-full w-full bg-background">
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className='h-full space-y-4 overflow-y-auto pb-8 pr-4 pt-2 bg-background'>
            {/* Team Members Section */}
            <div className="ml-1">
              <div className="flex flex-col ">
                <h3 className="font-semibold text-sm text-foreground mb-0">Team Members</h3>
                <p className="text-xs text-muted-foreground mb-1">
                  Manage roster. Add or remove people to control collaboration and access
                </p>

                <Card className="rounded-lg transition-shadow bg-card text-card-foreground border-border border-l-4 border-l-primary shadow-sm hover:shadow-md">
                  <CardContent className="px-4">
                    {team ? (
                      <TeamMembersDisplay
                        teamMembers={teamMembers}
                        onAddMember={() => setOpenMembersDialog(true)}
                        data-testid="btn-add-team-member"
                      />
                    ) : (
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Connected Portfolios Section */}
            <div className="ml-1">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-sm text-foreground mb-0">Portfolios</h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    Link portfolios to this team. Portfolio visibility and permissions inherit team settings.
                  </p>
                </div>

                {hasPortfolios && (
                  <button
                    data-testid="btn-add-portfolio"
                    onClick={() => setOpenLinkDialog('portfolio')}
                    className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    aria-label="Add portfolio"
                  >
                    <Plus size={25} />
                  </button>
                )}
              </div>

              <Card
                className={`rounded-lg transition-shadow bg-card text-card-foreground border-border
                ${hasPortfolios ? 'border-0 shadow-none bg-transparent py-0 text-foreground' : 'border-l-4 border-l-primary shadow-sm hover:shadow-md'}
              `}
              >
                <CardContent className={hasPortfolios ? "p-0" : "px-4"}>
                  {
                    enrichedTeamPortfolios.length === 0 ? (
                      <EmptyPortfolioState
                        data-testid="empty-portfolios-state"
                        teamId={teamId}
                        onAddExistingPortfolio={() => setOpenLinkDialog('portfolio')}
                        onCreateNewPortfolio={() => router.push(`/teams/${teamId}/create-portfolio`)}
                      />
                    ) : (
                      <PortfoliosList data-testid="list-portfolios" teamId={teamId} portfolios={enrichedTeamPortfolios} />
                    )}
                </CardContent>
              </Card>
            </div>

            {/* Connected Projects Section */}
            <div className="ml-1">
              {/* HEADER ROW ONLY */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-sm text-foreground mb-0">Projects</h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    Link projects to this team. Enables cross-project reporting and aligned resourcing.
                  </p>
                </div>

                {hasProjects && (
                  <button
                    data-testid="btn-add-project"
                    onClick={() => setOpenLinkDialog('project')}
                    className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    aria-label="Add project"
                  >
                    <Plus size={25} />
                  </button>
                )}
              </div>

              {/* CARD — untouched */}
              <Card
                className={`rounded-lg transition-shadow bg-card text-card-foreground border-border
                ${hasProjects ? 'border-0 shadow-none bg-transparent py-0 text-foreground' : 'border-l-4 border-l-primary shadow-sm hover:shadow-md'}
              `}
              >
                <CardContent className={hasProjects ? "p-0" : "px-4"}>
                  {
                    enrichedTeamProjects.length === 0 ? (
                      <EmptyProjectsState
                        data-testid="empty-projects-state"
                        teamId={teamId}
                        onAddExistingProject={() => setOpenLinkDialog('project')}
                        onCreateNewProject={() => router.push(`/teams/${teamId}/create-project`)}
                      />
                    ) : (
                      <ProjectsList data-testid="list-projects" teamId={teamId} projects={enrichedTeamProjects} />
                    )}
                </CardContent>
              </Card>
            </div>

            {/* Goals Section */}
            <div className="ml-1">
              <div className="flex items-start justify-between mb-1">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-sm text-foreground mb-0">
                    Goals
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    Link goals to this team. Every goal gets a clear owner and progress tracking
                  </p>
                </div>

                {hasGoals && (
                  <button
                    data-testid="btn-add-goal"
                    onClick={() => setOpenLinkDialog('goal')}
                    className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Add goal"
                  >
                    <Plus size={25} />
                  </button>
                )}
              </div>
              <Card className="rounded-lg transition-shadow bg-card text-card-foreground border-border border-l-4 border-l-primary shadow-sm hover:shadow-md">
                <CardContent className="px-4">
                  {showGoalsLoading ? (
                    <LoadingSkeleton />
                  ) : enrichedTeamGoals.length === 0 ? (
                    <EmptyGoalsState data-testid="empty-goals-state" teamId={teamId} onAddExistingGoal={() => setOpenLinkDialog('goal')} />
                  ) : null
                    //  : (
                    //  <GoalsList goals={enrichedTeamGoals} />
                    // )
                  }

                  {showGoalsLoading && <LoadingSkeleton />}

                  {/* {!showGoalsLoading && enrichedTeamGoals.length === 0 && (
                  <EmptyGoalsState teamId={teamId} onAddExistingGoal={() => setOpenLinkDialog('goal')} />
                )} */}

                  {/* {!showGoalsLoading && enrichedTeamGoals.length > 0 && (
                      <GoalsList goals={enrichedTeamGoals} />
                    )} */}
                </CardContent>
              </Card>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-[2px] bg-border hover:bg-muted-foreground/40 transition-all" />

        <ResizablePanel defaultSize={30} minSize={20} className="pl-0 bg-background">
          <div className="h-full bg-background">
            <RightPanel team={team} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Members Dialog */}
      <InviteTeamMembersDialog
        data-testid="modal-invite-team-members"
        open={openMembersDialog}
        onClose={() => setOpenMembersDialog(false)}
        teamID={passedTeam?.id}
        teamName={team?.name || ""}
        existingMembers={teamMembers}
        onMembersUpdate={() => fetchTeamById(teamId)}
      />

      {
        openLinkDialog && (
          <LinkEntityDialog
            data-testid={`modal-link-${openLinkDialog}`}
            open
            type={openLinkDialog}
            teamId={teamId}
            teamProjectIds={openLinkDialog === 'project' ? teamProjectIds : undefined}
            // workspaceId={workspaceId} 
            onClose={() => setOpenLinkDialog(null)}
            onCreateNew={() => {
              const type = openLinkDialog;
              setOpenLinkDialog(null);
              router.push(`/teams/${teamId}/create-${type}`);
            }}
          />
        )
      }
    </div >
  )
}

export default TeamOverview
