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
  portfolioId: string
  existingProjectIds: string[]
}

export default function LinkPortfolioProjectDialog({
  open,
  onClose,
  portfolioId,
  existingProjectIds,
}: Props) {
  const { projects, fetchProjects } = useProjectsStore()
  const { addProjectsToPortfolio } = usePortfoliosStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const router = useRouter()

  const { workspaceMembers } = useWorkspaceStore()

  useEffect(() => {
    if (open) {
      fetchProjects()
      setSelectedIds(new Set())
      setQuery('')
    }
  }, [open])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Filter out already-linked projects
  const availableProjects = projects
    .filter((p) => p.id && !existingProjectIds.includes(p.id))
    .filter((p) =>
      (p.name ?? '').toLowerCase().includes(query.toLowerCase())
    )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Link Projects to Portfolio</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 w-full">
          {/* Search Input */}
          <div className="relative w-full">
            <Input
              placeholder="Search for project name"
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
              <div className="pr-2">Projects</div>
              <div className="grid place-items-center pl-0 pr-4">Leader</div>
            </div>

            {/* Table Rows */}
            <div className="max-h-65 overflow-y-auto text-xs text-muted-foreground">
              {availableProjects.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No projects available to link
                </div>
              ) : (
                availableProjects.map((project) => (
                  <div
                    key={project.id}
                    className="grid grid-cols-[40px_1fr_60px] h-9 items-center px-3 border-t text-xs"
                  >
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedIds.has(project.id!)}
                        onCheckedChange={() => toggleSelect(project.id!)}
                      />
                    </div>
                    <div className="pr-2 h-full flex items-center text-xs">
                      <span className="truncate">{project.name}</span>
                    </div>
                    <div className="grid place-items-center pl-2">
                      {(() => {
                        const leaderId = project.projectLeader || project.leaders?.[0]
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
            onClick={() => router.push(`/portfolio/${portfolioId}/create-project`)}
          >
            Create new project
          </Button>

          <Button
            disabled={selectedIds.size === 0}
            onClick={() => {
              addProjectsToPortfolio(portfolioId, Array.from(selectedIds))
              onClose()
            }}
            className="bg-primary text-primary-foreground w-40 h-9 text-xs"
          >
            Assign project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
