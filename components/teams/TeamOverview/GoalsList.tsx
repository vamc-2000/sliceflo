'use client'

import { Button } from '@/components/ui/button'
import { ChevronRight, EllipsisVertical } from 'lucide-react'
import React from 'react'
import { Project } from '@/stores/projects-store'
import { useRouter } from 'next/navigation'
import ProjectActionsMenu from './ProjectActionsMenu'

interface GoalsListProps {
  projects: (Project & { tasksCount: number })[]
}

const GoalsList: React.FC<GoalsListProps> = ({ projects }) => {
  const router = useRouter()

  return (
    <div className="-mx-4 space-y-2">
      {projects.map(project => (
        <div
          key={project.id}
          className="flex items-center justify-between rounded-lg border border-l-4 border-l-primary bg-white px-5 py-3 hover:bg-muted/50 transition"
          onClick={() => router.push(`/project/${project.id}`)}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">
                {project.name?.charAt(0) ?? 'P'}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium">{project.name}</span>
              <span className="text-xs text-muted-foreground">
                {project.tasksCount} Tasks
              </span>
            </div>
          </div>
          <ProjectActionsMenu
            onEdit={() => console.log('Edit project', project.id)}
            onDetach={() => console.log('Detach project', project.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default GoalsList
