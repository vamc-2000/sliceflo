'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EllipsisVertical, Trash2 } from 'lucide-react'

interface ProjectPortfolioActionsMenuProps {
  onDetach?: () => void
}

export default function ProjectPortfolioActionsMenu({
  onDetach,
}: ProjectPortfolioActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <EllipsisVertical className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="border-0 border-b-[5px] border-b-primary rounded-lg bg-popover"
      >
        <DropdownMenuItem
          onClick={onDetach}
          className="flex items-center gap-2 text-destructive text-xs"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span>Detach</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
