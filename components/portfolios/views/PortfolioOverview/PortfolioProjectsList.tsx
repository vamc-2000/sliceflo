'use client'

import React from 'react'
import { Project } from '@/stores/projects-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PortfolioProjectActionsMenu from './PortfolioProjectActionsMenu'
import { iconComponentMap } from '@/components/ColorIconPicker'

interface PortfolioProjectsListProps {
  projects: (Project & { tasksCount: number })[]
  portfolioId: string
  onDetachProject: (projectId: string) => void
}

const PortfolioProjectsList: React.FC<PortfolioProjectsListProps> = ({
  projects,
  portfolioId,
  onDetachProject,
}) => {
  const router = useRouter()

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const iconData = project.icon;
        const color = project.color || "#3B82F6";
        const IconComp = iconData?.type === 'icon' && iconData.name ? iconComponentMap[iconData.name] : null;

        return (
          <div
            key={project.id}
            className="flex items-center justify-between rounded-lg border border-l-4 border-l-primary bg-white px-5 py-3 hover:bg-muted/30 transition group/item"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-md flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: color ? `${color}20` : '#EBF1FA' }}
              >
                {iconData?.type === 'file' && iconData.presignedUrl ? (
                  <img src={iconData.presignedUrl} alt={project.name} className="w-full h-full object-cover" />
                ) : IconComp ? (
                  <IconComp size={20} color={color} />
                ) : (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: color }}
                  >
                    {project.name?.charAt(0) ?? 'P'}
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
              <Link
                href={`/project/${project.id}`}
                className="text-sm font-medium hover:underline truncate block"
              >
                {project.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {project.tasksCount} Tasks
              </span>
            </div>
          </div>
          <PortfolioProjectActionsMenu
            onDetach={() => onDetachProject(project.id!)}
          />
        </div>
        )
      })}
    </div>
  )
}

export default PortfolioProjectsList
