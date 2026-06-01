// components/ProjectActionsMenu.tsx
'use client'

import React from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import {Pencil, Copy, Trash2,} from 'lucide-react'


interface ProjectActionsMenuProps {
    onEdit?: () => void
    onDetach?: (e?: React.MouseEvent) => void
}

export default function ProjectActionsMenu({
    onEdit,
    onDetach,
}: ProjectActionsMenuProps) {
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

            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className='border-0 border-b-[2px] border-primary rounded-lg'>
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        onDetach?.(e);
                    }}
                    className="flex items-center gap-2 text-destructive"
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className='text-xs'>Detach</span>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
