'use client'

import React, { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Plus, UserPlus } from 'lucide-react'
import Image from 'next/image'
import ViewAllMembersModal from './ViewAllMemberModal'

import { getAvatarColor } from '@/utils/avatar-utils';

interface InviteMember {
  id: string
  name: string
  avatar?: string | null
  initials: string
}

interface TeamMembersDisplayProps {
  teamMembers: InviteMember[]
  onAddMember: () => void
  onViewAll?: () => void
}

const TeamMembersDisplay: React.FC<TeamMembersDisplayProps> = ({
  teamMembers,
  onAddMember,
  onViewAll
}) => {
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  return (
    <div className="flex items-center w-full">
      {teamMembers.length > 1 ? (
        <>
          {/* Left: Avatars */}
          <div className="flex items-center -space-x-2">
            {teamMembers.slice(0, 5).map((m) => (
              <Avatar key={m.id} className="h-10 w-10 border-2 border-background">
                <AvatarImage src={m.avatar || ''} alt={m.name} />
                <AvatarFallback className={`${getAvatarColor(m.id)} text-white`}>
                  {m.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <button
            data-testid="teamoverview-create-member-btn"
            onClick={onAddMember}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-muted ml-2">
              <UserPlus size={18} />
            </span>
          </button>

          {/* Right: View all */}
          <button
            onClick={() => setIsViewAllOpen(true)}
            className="ml-auto text-xs font-medium text-muted-foreground underline underline-offset-4 hover:opacity-80 cursor-pointer"
          >
            View all
          </button>
        </>
      ) : (
        <div className="flex items-center gap-4">
          <Image
            src="/images/teams/amico.svg"
            alt="Projects illustration"
            width={120}
            height={120}
            className="object-contain"
          />
          <button
            data-testid="teamoverview-create-member-btn"
            onClick={onAddMember}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
              <UserPlus size={18} />
            </span>
            <span className='text-xs'>Add Team Member</span>
          </button>
        </div>
      )}

      <ViewAllMembersModal
        open={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        members={teamMembers}
      />
    </div>
  )
}

export default TeamMembersDisplay
