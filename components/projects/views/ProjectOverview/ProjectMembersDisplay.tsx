// components/projects/views/ProjectOverview/ProjectMembersDisplay.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserPlus } from 'lucide-react'
import Image from 'next/image'
import ViewAllMembersModal from './ViewAllMembersModal'
import { useWorkspaceStore } from '@/stores/workspace-store'

interface ProjectMember {
    id: string
    name: string
    avatar: string | undefined
    initials: string
    role: string
    email: string
}

interface ProjectMemberRaw {
    userId: string
    role: string
}

interface ProjectMembersDisplayProps {
    projectMembers: ProjectMemberRaw[] // Now matches your actual data structure
    onAddMember: () => void
    onRemoveMember: (userId: string) => Promise<void>
    projectId: string
    leaderIds?: string[]
    currentUserId?: string
}

const ProjectMembersDisplay: React.FC<ProjectMembersDisplayProps> = ({
    projectMembers = [],
    onAddMember,
    onRemoveMember,
    projectId,
    leaderIds = [],
    currentUserId,
}) => {
    const [isViewAllOpen, setIsViewAllOpen] = useState(false)

    const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore()

    // Fetch workspace members on mount
    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchWorkspaceMembers(currentWorkspace.id)
        }
    }, [currentWorkspace?.id, fetchWorkspaceMembers])

    // Get S3 base URL for profile pictures
    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || ""

    // Helper function to get full profile picture URL
    const getProfilePictureUrl = (profilePicture?: string | null) => {
        if (!profilePicture) return undefined
        if (profilePicture.startsWith('http')) return profilePicture
        return `${s3BaseUrl}/${profilePicture}`
    }
    // console.log("workspaceMembers:", workspaceMembers);

    // Resolve member details from workspace members using userId
    const resolvedMembers = useMemo<ProjectMember[]>(() => {
        return projectMembers
            .map((Member) => {
                const member = workspaceMembers.find(
                    (m) => m.userId === Member.userId
                )

                if (!member) return null

                return {
                    id: member.userId,
                    name: member.name || 'Unknown',
                    email: member.email,
                    avatar: getProfilePictureUrl(member.profilePicture),
                    initials:
                        member.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase() || '??',
                    role: member.role,
                }
            })
            .filter((m): m is ProjectMember => m !== null)
    }, [projectMembers, workspaceMembers])

    return (
        <div className="flex w-full">
            {resolvedMembers.length > 0 ? (
                <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center -space-x-2">
                        <h1 className='ml-auto text-xs font-medium text-muted-foreground'>Members</h1>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                        {/* Avatars */}
                        <div className="flex items-center -space-x-2">
                            {resolvedMembers.slice(0, 5).map((m) => (
                                <Avatar key={m.id} className="h-9 w-9 border-2 border-background">
                                    <AvatarImage src={m.avatar || ''} alt={m.name} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                        {m.initials}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>

                        {/* UserPlus add button */}
                        <button
                            data-testid="projectoverview-add-member-btn"
                            onClick={onAddMember}
                            className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted hover:bg-muted/80 transition-colors"
                        >
                            <UserPlus size={18} className="text-muted-foreground" />
                        </button>
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
                <div className="flex gap-2">
                    <Image
                        src="/images/projects/members-illustration.svg"
                        alt="Members illustration"
                        width={100}
                        height={100}
                        className="object-contain"
                    />
                    <button
                        data-testid="projectoverview-create-member-btn"
                        onClick={onAddMember}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                            <UserPlus size={18} />
                        </span>
                        <span>Members</span>
                    </button>
                </div>
            )}

            <ViewAllMembersModal
                isOpen={isViewAllOpen}
                onClose={() => setIsViewAllOpen(false)}
                members={resolvedMembers}
                title="Project Members"
                type="members"
                onRemove={onRemoveMember}
                projectId={projectId}
                leaderIds={leaderIds}
                currentUserId={currentUserId}
            />
        </div>
    )
}

export default ProjectMembersDisplay
