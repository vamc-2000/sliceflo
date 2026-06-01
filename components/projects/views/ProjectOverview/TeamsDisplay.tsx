'use client'

import React, { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Plus, UserPlus } from 'lucide-react'
import Image from 'next/image'
import ViewAllMembersModal from './ViewAllMembersModal'

interface Team {
  id: string
  name: string
  avatar: string | undefined
  initials: string
}

interface TeamsDisplayProps {
  teams: Team[]
  onAddTeam: () => void
  onRemoveTeam: (userId: string) => Promise<void>
  projectId: string
}

const TeamsDisplay: React.FC<TeamsDisplayProps> = ({
  teams,
  onAddTeam,
  onRemoveTeam,
  projectId
}) => {
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  return (
    <div className="flex w-full">
      {teams.length > 0 ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center -space-x-2">
            <h1 className='ml-auto text-xs font-medium text-muted-foreground'>Teams</h1>
          </div>
          {/* Avatars */}
          <div className="flex items-center -space-x-2">
            {teams.slice(0, 5).map((m) => (
              <Avatar key={m.id} className="h-9 w-9 border-2 border-background">
                <AvatarImage src={m.avatar || ''} alt={m.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {m.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {/* View all */}
          <button
            onClick={() => setIsViewAllOpen(true)}
            className="ml-auto text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-80"
          >
            View all
          </button>
        </div>
      ) : (
        <>
          <Image
            src="/images/projects/teams-illustration.svg"
            alt="Teams illustration"
            width={100}
            height={100}
            className="object-contain"
          />
          <button
            data-testid="teamoverview-create-member-btn"
            onClick={onAddTeam}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
              <UserPlus size={18} />
            </span>
            <span>Teams</span>
          </button>
        </>
      )}

      <ViewAllMembersModal
        isOpen={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        members={teams}
        title="Teams"
        type="viewers"
        onRemove={onRemoveTeam}
        projectId={projectId}
      />
    </div>
  )
}

export default TeamsDisplay
