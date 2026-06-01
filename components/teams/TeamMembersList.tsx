// TeamMembersList.tsx
'use client'

import React from 'react'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TeamMember } from '@/types/teams.types' // adjust the path

interface TeamMembersListProps {
  members: TeamMember[]
  onOpenDialog: () => void
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  members,
  onOpenDialog,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {members.slice(0, 7).map(member => (
          <Avatar
            key={member.id}
            className="w-8 h-8 border-2 border-background hover:scale-110 transition-transform cursor-pointer"
          >
            {member.avatar ? (
              <AvatarImage src={member.avatar} alt={member.name ?? ''} />
            ) : (
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {member.initials}
              </AvatarFallback>
            )}
          </Avatar>
        ))}

        {members.length > 7 && (
          <Avatar className="w-8 h-8 bg-primary text-primary-foreground text-xs font-semibold">
            <AvatarFallback className="bg-primary text-primary-foreground">
              +{members.length - 7}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <Button
        variant="link"
        size="sm"
        className="underline text-xs text-muted-foreground hover:text-foreground ml-auto"
        onClick={onOpenDialog}
      >
        View All
      </Button>
    </div>
  )
}
