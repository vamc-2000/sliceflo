'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/stores/projects-store'
import { useTeamStore } from '@/stores/teams-store'
import ProjectActionsMenu from './ProjectActionsMenu'
import { toast } from '@/components/ui/sonner'
import ConfirmationModal from '@/components/ConfirmationModal'

interface ProjectsListProps {
  teamId: string
  projects: (Project & { tasksCount: number })[]
}

const ProjectsList: React.FC<ProjectsListProps> = ({ teamId, projects }) => {
  const router = useRouter()
  const [isDetachModalOpen, setIsDetachModalOpen] = React.useState(false)
  const [projectToDetach, setProjectToDetach] = React.useState<string | null>(null)
  const [isDetaching, setIsDetaching] = React.useState(false)

  const detachProjectFromTeam = useTeamStore(
    (state) => state.detachProjectFromTeam
  )

  const handleDetachClick = (
    e: React.MouseEvent | undefined,
    projectId: string
  ) => {
    e?.stopPropagation()
    setProjectToDetach(projectId)
    setIsDetachModalOpen(true)
  }

  const handleConfirmDetach = async () => {
    if (!projectToDetach) return

    setIsDetaching(true)
    try {
      await detachProjectFromTeam(teamId, projectToDetach)
      toast('success', { title: 'Project detached successfully' })
    } catch (error) {
      toast('error', { title: 'Failed to detach project' })
    } finally {
      setIsDetaching(false)
      setIsDetachModalOpen(false)
      setProjectToDetach(null)
    }
  }

  if (projects.length === 0) {
    return <div data-testid="empty-projects-list" className="text-muted-foreground text-sm italic py-4">no projects</div>
  }

  return (
    <div 
      data-testid="projects-list-container"
      className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar"
    >
      {projects.map((project) => {
        if (!project.id) return null

        const projectId = project.id

        return (
          <div
            key={projectId}
            data-testid={`project-row-${projectId}`}
            className="flex items-center justify-between rounded-lg border border-l-4 border-l-primary bg-card text-card-foreground px-5 py-3 hover:bg-muted/50 transition cursor-pointer mr-1"
            onClick={() => router.push(`/project/${projectId}`)}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {project.name?.charAt(0) ?? 'P'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {project.name}
                </span>

                <span className="text-xs text-muted-foreground">
                  {project.tasksCount} Tasks
                </span>
              </div>
            </div>

            <ProjectActionsMenu
              data-testid={`project-actions-menu-${projectId}`}
              onEdit={() => console.log('Edit project', projectId)}
              onDetach={(e) => handleDetachClick(e, projectId)}
            />
          </div>
        )
      })}

      <ConfirmationModal
        data-testid="modal-detach-project"
        open={isDetachModalOpen}
        onClose={() => setIsDetachModalOpen(false)}
        title="Detach Project"
        description="Are you sure you want to detach this project from the team? This action can be undone by linking the project again."
        confirmLabel="Detach"
        onConfirm={handleConfirmDetach}
        loading={isDetaching}
        loadingLabel="Detaching..."
      />
    </div>
  )
}

export default ProjectsList
