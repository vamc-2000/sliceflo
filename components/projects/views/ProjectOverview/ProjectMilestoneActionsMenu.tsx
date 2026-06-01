'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EllipsisVertical, ExternalLink, Trash2 } from 'lucide-react'

interface ProjectMilestoneActionsMenuProps {
  onOpen?: () => void
  onDelete?: () => void
}

export default function ProjectMilestoneActionsMenu({
  onOpen,
  onDelete,
}: ProjectMilestoneActionsMenuProps) {
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
        {onOpen && (
          <DropdownMenuItem
            onClick={onOpen}
            className="flex items-center gap-2 text-xs"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open milestone</span>
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={onDelete}
            className="flex items-center gap-2 text-destructive text-xs"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span>Delete</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
