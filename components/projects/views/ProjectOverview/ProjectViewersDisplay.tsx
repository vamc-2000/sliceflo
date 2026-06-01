// components/projects/views/ProjectOverview/ProjectViewersDisplay.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Eye, UserPlus } from 'lucide-react'
import Image from 'next/image'
import ViewAllMembersModal from './ViewAllMembersModal'
import { useWorkspaceStore } from '@/stores/workspace-store'

interface ViewerMember {
    id: string
    name: string
    avatar: string | undefined
    initials: string
    email: string
}

interface ProjectViewersDisplayProps {
    viewerIds: string[] // Changed from projectViewers to viewerIds
    onAddViewer: () => void
    onRemoveViewer: (userId: string) => Promise<void>
    projectId: string
}

const ProjectViewersDisplay: React.FC<ProjectViewersDisplayProps> = ({
    viewerIds = [],
    onAddViewer,
    onRemoveViewer,
    projectId,
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
        // If it's already a full URL, return as is
        if (profilePicture.startsWith('http')) return profilePicture
        // Otherwise, prepend S3 base URL
        return `${s3BaseUrl}/${profilePicture}`
    }

    // Resolve viewer details from workspace members (similar to ProjectViewersSection)
    const projectViewers = useMemo(() => {
        return viewerIds
            .map((viewerId) => {
                const member = workspaceMembers.find((m) => m.userId === viewerId)
                if (!member) return null

                return {
                    id: member.userId,
                    name: member.name || 'Unknown',
                    email: member.email,
                    avatar: getProfilePictureUrl(member.profilePicture),
                    initials: member.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "??",
                }
            })
            .filter((v): v is ViewerMember => v !== null)
    }, [viewerIds, workspaceMembers, s3BaseUrl])
    // console.log("Project Viewers in ProjectViewersDisplay:", projectViewers);

    return (
        <div className="flex w-full">
            {projectViewers.length > 0 ? (
                <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center -space-x-2">
                        <h1 className='ml-auto text-xs font-medium text-muted-foreground'>Viewers</h1>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                        {/* Avatars */}
                        <div className="flex items-center -space-x-2">
                            {projectViewers.slice(0, 5).map((v: any) => (
                                <Avatar key={v.id} className="h-9 w-9 border-2 border-background">
                                    <AvatarImage src={v.avatar || ''} alt={v.name} />
                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                        {v.initials}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>

                        {/* UserPlus add button */}
                        <button
                            data-testid="projectoverview-add-viewer-btn"
                            onClick={onAddViewer}
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
                        src="/images/projects/viewers-illustration.svg"
                        alt="Viewers illustration"
                        width={100}
                        height={100}
                        className="object-contain"
                    />
                    <button
                        data-testid="projectoverview-add-viewer-btn"
                        onClick={onAddViewer}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                            <Eye size={18} />
                        </span>
                        <span>Viewers</span>
                    </button>
                </div>
            )}

            <ViewAllMembersModal
                isOpen={isViewAllOpen}
                onClose={() => setIsViewAllOpen(false)}
                members={projectViewers}
                title="Project Viewers"
                type="viewers"
                onRemove={onRemoveViewer}
                projectId={projectId}
            />
        </div>
    )
}

export default ProjectViewersDisplay
