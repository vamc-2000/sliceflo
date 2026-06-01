'use client'

import React from 'react'
import { Portfolio } from '@/stores/portfolios-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProjectPortfolioActionsMenu from './ProjectPortfolioActionsMenu'
import { iconComponentMap } from '@/components/ColorIconPicker'

interface ProjectPortfoliosListProps {
  portfolios: Portfolio[]
  projectId: string
  onDetachPortfolio: (portfolioId: string) => void
}

const ProjectPortfoliosList: React.FC<ProjectPortfoliosListProps> = ({
  portfolios,
  projectId,
  onDetachPortfolio,
}) => {
  const router = useRouter()

  return (
    <div className="space-y-2">
      {portfolios.map((portfolio) => {
        const iconData = portfolio.icon;
        const color = portfolio.color || "#3B82F6";
        const IconComp = iconData?.type === 'icon' && iconData.name ? iconComponentMap[iconData.name] : null;

        return (
          <div
            key={portfolio.id}
            className="flex items-center justify-between rounded-lg border border-l-4 border-l-primary bg-card px-3 py-2 hover:bg-muted/30 transition group/item"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-md flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: color ? `${color}20` : '#EBF5FF' }}
              >
                {iconData?.type === 'file' && iconData.presignedUrl ? (
                  <img src={iconData.presignedUrl} alt={portfolio.name} className="w-full h-full object-cover" />
                ) : IconComp ? (
                  <IconComp size={18} color={color} />
                ) : (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: color }}
                  >
                    {portfolio.name?.charAt(0) ?? 'P'}
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/portfolio/${portfolio.id}`}
                  className="text-xs font-medium hover:underline truncate block text-foreground"
                >
                  {portfolio.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  Portfolio
                </span>
              </div>
            </div>
            <ProjectPortfolioActionsMenu
              onDetach={() => onDetachPortfolio(portfolio.id)}
            />
          </div>
        )
      })}
    </div>
  )
}

export default ProjectPortfoliosList
