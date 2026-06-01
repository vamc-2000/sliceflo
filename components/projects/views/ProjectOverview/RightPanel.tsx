// components/projects/views/ProjectOverview/RightPanel.tsx
'use client'

import React from 'react'

import AboutProject from './AboutProject'
import ActivityLog from '@/components/shared/ActivityLog'

interface RightPanelProps {
  project: any
  workspaceId?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const RightPanel: React.FC<RightPanelProps> = ({
  project,
  workspaceId,
  activeTab = 'properties',
  onTabChange,
}) => {
  const leader = project?.leaders?.[0] || project?.members?.[0]

  const leaderWithAvatar = leader
    ? {
      ...leader,
      avatar: leader.avatar || leader.profilePictureUrl || '',
    }
    : undefined

  const tabs = [
    { value: 'properties', label: 'Properties' },
    { value: 'activity', label: 'Activity Log' },
  ]

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Full-width pill tab switcher */}
      <div className="bg-muted py-1 px-2 flex items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => onTabChange?.(tab.value)}
            className={`
              flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
              ${activeTab === tab.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === 'properties' && (
          <AboutProject
            projectId={project?.id}
            projectDescription={project?.description || ''}
            workspaceId={workspaceId}
            projectName={project?.name || ''}
            projectLeader={leaderWithAvatar}
            projectPriority={project?.priority}
            projectStatus={project?.status}
            projectStartDate={project?.startDate}
            projectEndDate={project?.endDate}
            customFieldValues={project?.customFieldValues ?? {}}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityLog entityType="project" entityId={project?.id} />
        )}
      </div>
    </div>
  )
}

export default RightPanel
