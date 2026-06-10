// components/projects/views/ProjectOverview/StatusHistoryModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { MemberAvatar } from '@/components/projects/MemberAvatar'
import {
  ArrowLeft,
  Share2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { formatLocalDateTime } from '@/utils/timezone-utils'
import { StatusHistoryEntry } from '@/lib/api/projects-api'
import { ProjectStatusConfig } from '@/stores/projects-store'
import { cn } from '@/lib/utils'

interface StatusHistoryModalProps {
  open: boolean
  onClose: () => void
  projectName: string
  projectStatusConfigs: ProjectStatusConfig[]
  history: StatusHistoryEntry[]
  currentUpdateValue: string
  projectLeader?: {
    name?: string
    avatar?: string | null
  }
}

export default function StatusHistoryModal({
  open,
  onClose,
  projectName,
  projectStatusConfigs,
  history = [],
  currentUpdateValue,
  projectLeader
}: StatusHistoryModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore()

  useEffect(() => {
    if (open && currentWorkspace?.id && workspaceMembers.length === 0) {
      fetchWorkspaceMembers(currentWorkspace.id)
    }
  }, [open, currentWorkspace?.id, workspaceMembers.length, fetchWorkspaceMembers])

  // Set default expanded entry to the newest status history entry when modal opens
  useEffect(() => {
    if (open) {
      if (history && history.length > 0) {
        if (!expandedId || !history.some(e => e._id === expandedId)) {
          setExpandedId(history[0]._id)
        }
      } else {
        setExpandedId(null)
      }
    } else {
      setExpandedId(null)
    }
  }, [history, open, expandedId])

  const getStatusConfig = (val: string) => {
    return projectStatusConfigs.find(c => c.value === val)
  }

  const toggleEntry = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Find info for header displaying the current project status
  const currentUpdateConfig = getStatusConfig(currentUpdateValue)
  const newestEntry = history[0]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[550px] gap-0 top-4 right-0 bottom-4 h-[calc(100vh-2rem)] p-0 flex flex-col overflow-hidden bg-background rounded-l-xl border shadow-2xl transition-all duration-300 [&>button]:hidden">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-7 w-7 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm font-bold tracking-tight text-foreground">
                  Status of {projectName}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Status update history log for {projectName}
                </SheetDescription>
                {projectLeader && (
                  <MemberAvatar
                    name={projectLeader.name}
                    src={projectLeader.avatar}
                    size="sm"
                  />
                )}
                {currentUpdateConfig && (
                  <Badge
                    className="h-4 text-[9px] font-semibold capitalize px-1.5 py-0"
                    style={{
                      backgroundColor: currentUpdateConfig.color + '15',
                      color: currentUpdateConfig.color
                    }}
                  >
                    {currentUpdateConfig.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body Scroll Area */}
        <div className="flex-1 p-4 bg-muted/5 flex flex-col overflow-hidden">
          
          {/* Main Rounded Box */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b bg-muted/5 flex-shrink-0">
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider">
                Status history
              </h3>
            </div>
            
            <div className="p-2 space-y-2.5 flex-1 overflow-y-auto min-h-0">
              {history.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  No status updates recorded
                </div>
              ) : (
                history.map((entry) => {
                  const isExpanded = expandedId === entry._id
                  const config = getStatusConfig(entry.status)
                  const member = workspaceMembers.find(
                    (m) => m.userId === entry.changedBy || m.id === entry.changedBy || m._id === entry.changedBy
                  )
                  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || ""
                  const avatarUrl = member?.profilePicture
                    ? (member.profilePicture.startsWith('http') ? member.profilePicture : `${s3BaseUrl}/${member.profilePicture}`)
                    : undefined
                  const displayName = member?.name || entry.changedBy || 'Unknown'

                  return (
                    <div
                      key={entry._id}
                      className={cn(
                        "rounded-lg border transition-all duration-200 overflow-hidden bg-card",
                        isExpanded ? "border-l-4 border-l-primary shadow-sm" : "border-border hover:bg-muted/10"
                      )}
                    >
                      {/* Card Header Row (Click to toggle) */}
                      <button
                        onClick={() => toggleEntry(entry._id)}
                        className="w-full flex items-center justify-between p-2 text-left transition-colors hover:bg-muted/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar
                            name={displayName}
                            src={avatarUrl}
                            size="sm"
                          />
                          <div>
                            <span className="block text-xs font-semibold text-foreground">
                              Status Update
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {formatLocalDateTime(entry.changedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {config && (
                            <Badge
                              className="h-4.5 text-[9px] capitalize px-1.5 py-0 font-medium"
                              style={{
                                backgroundColor: config.color + '15',
                                color: config.color
                              }}
                            >
                              {config.label}
                            </Badge>
                          )}
                          <div className="text-muted-foreground/60 transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>
                      </button>

                      {/* Card Expanded Content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t space-y-2 bg-muted/[0.02]">
                          
                          {/* Summary */}
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Summary
                            </h4>
                            <div className="p-2.5 rounded-md bg-muted/25 border border-muted/30">
                              <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">
                                {entry.message || 'No description provided.'}
                              </p>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

      </SheetContent>
    </Sheet>
  )
}
