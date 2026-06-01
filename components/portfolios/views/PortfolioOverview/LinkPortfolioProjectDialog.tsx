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
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Link Projects to Portfolio</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 w-full">
          {/* Search Input */}
          <div className="relative w-full">
            <Input
              placeholder="Search for project name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10 placeholder-[#8E8E93] text-black w-full border-6 border-[#E5E5EA] rounded-md h-10 bg-white"
            />
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-[#8E8E93]" />
            </span>
          </div>

          {/* Table */}
          <div className="w-full border-6 border-[#E5E5EA] rounded-md relative">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_60px] px-3 py-2 text-sm font-medium items-center text-[#001F3F]">
              <div />
              <div className="pr-2">Projects</div>
              <div className="grid place-items-center pl-0 pr-4">Leader</div>
            </div>

            {/* Table Rows */}
            <div className="max-h-65 overflow-y-auto text-sm text-[#8E8E93]">
              {availableProjects.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  No projects available to link
                </div>
              ) : (
                availableProjects.map((project) => (
                  <div
                    key={project.id}
                    className="grid grid-cols-[40px_1fr_60px] h-11 items-center px-3 border-t"
                  >
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedIds.has(project.id!)}
                        onCheckedChange={() => toggleSelect(project.id!)}
                      />
                    </div>
                    <div className="pr-2 h-full flex items-center text-sm">
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
            className='border-[#8E8E93] text-[#8E8E93] w-40 hover:bg-[#001F3F] hover:text-white'
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
            className="bg-[#001F3F] text-white w-40"
          >
            Assign project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
