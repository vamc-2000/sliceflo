'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { usePortfoliosStore } from '@/stores/portfolios-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  existingPortfolioIds: string[]
}

export default function LinkProjectPortfolioDialog({
  open,
  onClose,
  projectId,
  existingPortfolioIds,
}: Props) {
  const { attachPortfoliosToProject } = useProjectsStore()
  const { portfolios, fetchPortfolios } = usePortfoliosStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const router = useRouter()

  const { workspaceMembers, currentWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (open) {
      fetchPortfolios(currentWorkspace?.id)
      setSelectedIds(new Set())
      setQuery('')
    }
  }, [open, currentWorkspace?.id])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Filter out already-linked portfolios
  const availablePortfolios = portfolios
    .filter((p) => p.id && !existingPortfolioIds.includes(p.id))
    .filter((p) =>
      (p.name ?? '').toLowerCase().includes(query.toLowerCase())
    )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Link Project to Portfolios</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 w-full">
          {/* Search Input */}
          <div className="relative w-full">
            <Input
              placeholder="Search for portfolio name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10 placeholder:text-muted-foreground text-foreground w-full border border-border rounded-md h-9 text-xs bg-card"
            />
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </span>
          </div>

          {/* Table */}
          <div className="w-full border border-border rounded-md relative">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_60px] px-3 py-2 text-xs font-semibold items-center text-primary">
              <div />
              <div className="pr-2">Portfolios</div>
              <div className="grid place-items-center pl-0 pr-4">Leader</div>
            </div>

            {/* Table Rows */}
            <div className="max-h-65 overflow-y-auto text-xs text-muted-foreground">
              {availablePortfolios.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No portfolios available to link
                </div>
              ) : (
                availablePortfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className="grid grid-cols-[40px_1fr_60px] h-9 items-center px-3 border-t text-xs"
                  >
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedIds.has(portfolio.id!)}
                        onCheckedChange={() => toggleSelect(portfolio.id!)}
                      />
                    </div>
                    <div className="pr-2 h-full flex items-center text-xs">
                      <span className="truncate">{portfolio.name}</span>
                    </div>
                    <div className="grid place-items-center pl-2">
                      {(() => {
                        const leaderId = portfolio.owner || portfolio.leaders?.[0]
                        const leader = leaderId ? workspaceMembers.find(m => m.userId === leaderId) : null
                        return (
                          <Avatar className="h-6 w-6">
                            {leader?.profilePicture ? (
                              <AvatarImage src={leader.profilePicture} />
                            ) : null}
                            <AvatarFallback>
                              {leader?.name?.charAt(0)?.toUpperCase() || '—'}
                            </AvatarFallback>
                          </Avatar>
                        )
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            className='border-input text-muted-foreground w-40 h-9 text-xs hover:bg-primary hover:text-primary-foreground'
            onClick={() => router.push(`/project/${projectId}/create-portfolio`)}
          >
            Create new portfolio
          </Button>

          <Button
            disabled={selectedIds.size === 0}
            onClick={() => {
              attachPortfoliosToProject(projectId, Array.from(selectedIds))
              onClose()
            }}
            className="bg-primary text-primary-foreground w-40 h-9 text-xs"
          >
            Assign portfolio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
