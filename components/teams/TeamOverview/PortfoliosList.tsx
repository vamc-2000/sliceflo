'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Portfolio } from '@/stores/portfolios-store'
import { useTeamStore } from '@/stores/teams-store'
import ProjectActionsMenu from './ProjectActionsMenu'
import { toast } from '@/components/ui/sonner'
import ConfirmationModal from '@/components/ConfirmationModal'

interface PortfoliosListProps {
  teamId: string
  portfolios: Portfolio[]
}

const PortfoliosList: React.FC<PortfoliosListProps> = ({ teamId, portfolios }) => {
  const router = useRouter()
  const [isDetachModalOpen, setIsDetachModalOpen] = React.useState(false)
  const [portfolioToDetach, setPortfolioToDetach] = React.useState<string | null>(null)
  const [isDetaching, setIsDetaching] = React.useState(false)

  const detachPortfolioFromTeam = useTeamStore(
    (state) => state.detachPortfolioFromTeam
  )

  const handleDetachClick = (
    e: React.MouseEvent | undefined,
    portfolioId: string
  ) => {
    e?.stopPropagation()
    setPortfolioToDetach(portfolioId)
    setIsDetachModalOpen(true)
  }

  const handleConfirmDetach = async () => {
    if (!portfolioToDetach) return

    setIsDetaching(true)
    try {
      await detachPortfolioFromTeam(teamId, portfolioToDetach)
      toast('success', { title: 'Portfolio detached successfully' })
    } catch (error) {
      toast('error', { title: 'Failed to detach portfolio' })
    } finally {
      setIsDetaching(false)
      setIsDetachModalOpen(false)
      setPortfolioToDetach(null)
    }
  }

  if (portfolios.length === 0) {
    return <div className="text-muted-foreground text-sm italic py-4">no portfolios</div>
  }

  return (
    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
      {portfolios.map((portfolio) => {
        if (!portfolio.id) return null

        const portfolioId = portfolio.id

        return (
          <div
            key={portfolioId}
            className="flex items-center justify-between rounded-lg border border-l-4 border-l-primary bg-card text-card-foreground px-5 py-3 hover:bg-muted/50 transition cursor-pointer mr-1"
            onClick={() => router.push(`/portfolio/${portfolioId}`)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="h-9 w-9 rounded-md flex items-center justify-center"
                style={{ backgroundColor: portfolio.color || '#DBEAFE' }}
              >
                <span className="text-sm font-semibold" style={{ color: portfolio.color ? '#FFFFFF' : '#2563EB' }}>
                  {portfolio.name?.charAt(0) ?? 'P'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {portfolio.name}
                </span>

                <span className="text-xs text-muted-foreground">
                  {portfolio.projectCount ?? 0} Projects
                </span>
              </div>
            </div>

            <ProjectActionsMenu
              onEdit={() => console.log('Edit portfolio', portfolioId)}
              onDetach={(e) => handleDetachClick(e, portfolioId)}
            />
          </div>
        )
      })}

      <ConfirmationModal
        open={isDetachModalOpen}
        onClose={() => setIsDetachModalOpen(false)}
        title="Detach Portfolio"
        description="Are you sure you want to detach this portfolio from the team?"
        confirmLabel="Detach"
        onConfirm={handleConfirmDetach}
        loading={isDetaching}
        loadingLabel="Detaching..."
      />
    </div>
  )
}

export default PortfoliosList
