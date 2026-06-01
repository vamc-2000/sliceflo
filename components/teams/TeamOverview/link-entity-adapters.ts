import { useMemo, useCallback } from 'react'
import { useProjectsStore } from '@/stores/projects-store'
import { useGoalsStore } from '@/stores/goals-store'
import { useTeamStore } from '@/stores/teams-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { usePortfoliosStore } from '@/stores/portfolios-store'
import { toast } from '@/components/ui/sonner'

export type LinkEntityType = 'project' | 'goal' | 'portfolio'

export interface LinkableEntity {
    id: string
    name: string
    leader?: string
}

interface LinkEntityAdapter {
    title: string
    entities: LinkableEntity[]
    fetch: () => void | Promise<void>
    link: (entityId: string) => void | Promise<void>
}

export function useLinkEntityAdapter(
    type: LinkEntityType,
    teamId?: string,
    teamProjectIds?: string[]
): LinkEntityAdapter {
    const { assignProjectToTeam, assignGoalToTeam, assignPortfolioToTeam } = useTeamStore()

    const { projects, fetchProjects } = useProjectsStore()
    const { goals, fetchGoals } = useGoalsStore()
    const { portfolios, fetchPortfolios } = usePortfoliosStore()
    const currentWorkspace = useWorkspaceStore(
        state => state.currentWorkspace
    )

    const workspaceId = currentWorkspace?.id

    const title = useMemo(() => {
        if (type === 'project') return 'Project'
        if (type === 'goal') return 'Goal'
        return 'Portfolio'
    }, [type])

    const entities = useMemo(() => {
        if (type === 'project') {
            return projects
                .filter(p => p.id && typeof p.id === 'string')
                .filter(p => {
                    if (!teamId) return true;
                    const teamStore = useTeamStore.getState();
                    const team = teamStore.teams.find(t => t.id === teamId);
                    return !team?.projectIds?.includes(p.id!);
                })
                .map(p => ({
                    id: p.id!,
                    name: p.name ?? 'Untitled Project',
                    leader: p.leaders?.[1] || p.leaders?.[0] || p.projectLeader,
                }))
        }

        if (type === 'portfolio') {
            return portfolios
                .filter(p => p.id && typeof p.id === 'string')
                .filter(p => {
                    if (!teamId) return true;
                    const teamStore = useTeamStore.getState();
                    const team = teamStore.teams.find(t => t.id === teamId);
                    
                    // Check both portfolioIds and portfolios (for safety)
                    const isLinkedById = team?.portfolioIds?.includes(p.id!);
                    const isLinkedByObj = team?.portfolios?.some(tp => (typeof tp === 'string' ? tp === p.id : tp.id === p.id));
                    
                    return !isLinkedById && !isLinkedByObj;
                })
                .map(p => ({
                    id: p.id!,
                    name: p.name ?? 'Untitled Portfolio',
                    leader: p.leaders?.[0] || p.owner,
                }))
        }

        return goals
            .filter(
                (g): g is typeof g & { id: string } =>
                    typeof g.id === 'string'
            )
            .map(g => ({
                id: g.id,
                name: g.title ?? 'Untitled Goal',
                leader: g.owners?.[0] || (typeof g.createdBy === 'string' ? g.createdBy : g.createdBy?.id),
            }))
    }, [type, projects, goals, teamId])

    const fetch = useCallback(async () => {
        if (type === 'project') {
            await fetchProjects()
        } else if (type === 'portfolio') {
            await fetchPortfolios(workspaceId)
        } else {
            if (workspaceId) {
                await fetchGoals(workspaceId)
            }
        }
    }, [type, workspaceId, fetchProjects, fetchGoals])

    const link = useCallback(async (entityId: string) => {
        if (!teamId) return
        if (type === 'project') {
            await assignProjectToTeam(teamId, entityId)
        } else if (type === 'portfolio') {
            await assignPortfolioToTeam(teamId, entityId)
        } else {
            await assignGoalToTeam(teamId, entityId)
        }
    }, [type, teamId, assignProjectToTeam, assignGoalToTeam, assignPortfolioToTeam])

    return useMemo(() => ({
        title,
        entities,
        fetch,
        link,
    }), [title, entities, fetch, link])
}
