// components/projects/views/ProjectOverview/StatusHistoryModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Share2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import { StatusHistoryEntry } from '@/lib/api/projects-api'
import { ProjectStatusConfig } from '@/stores/projects-store'
import { cn } from '@/lib/utils'

interface StatusHistoryModalProps {
  open: boolean
  onClose: () => void
  projectName: string
  projectStatusConfigs: ProjectStatusConfig[]
  history: StatusHistoryEntry[]
  currentStatusValue: string
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
  currentStatusValue,
  projectLeader
}: StatusHistoryModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
  const currentStatusConfig = getStatusConfig(currentStatusValue)
  const newestEntry = history[0]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] md:max-w-[85vw] md:w-[85vw] p-0 flex flex-col overflow-hidden bg-background border rounded-lg shadow-2xl transition-all duration-300">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Status of {projectName}
                </h2>
                {projectLeader && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={projectLeader.avatar || undefined} />
                    <AvatarFallback className="text-[10px] font-bold">
                      {projectLeader.name?.slice(0, 2).toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                )}
                {currentStatusConfig && (
                  <Badge
                    className="h-5 text-[10px] font-bold capitalize border px-2 py-0"
                    style={{
                      backgroundColor: currentStatusConfig.color + '15',
                      color: currentStatusConfig.color,
                      borderColor: currentStatusConfig.color + '30'
                    }}
                  >
                    {currentStatusConfig.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Content Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
          
          {/* Main Rounded Box */}
          <div className="border rounded-2xl bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-muted/5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Status history
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground italic">
                  No status updates recorded
                </div>
              ) : (
                history.map((entry) => {
                  const isExpanded = expandedId === entry._id
                  const config = getStatusConfig(entry.status)
                  return (
                    <div
                      key={entry._id}
                      className={cn(
                        "rounded-xl border transition-all duration-200 overflow-hidden bg-card border-l-4",
                        isExpanded ? "border-primary/50 shadow-sm scale-[1.005]" : "border-border hover:bg-muted/10"
                      )}
                      style={{ borderLeftColor: config?.color }}
                    >
                      {/* Card Header Row (Click to toggle) */}
                      <button
                        onClick={() => toggleEntry(entry._id)}
                        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-muted/5"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                              {entry.changedBy ? entry.changedBy.slice(0, 2).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="block text-xs font-bold text-foreground">
                              Status Update
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {format(new Date(entry.changedAt), 'PPp')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {config && (
                            <Badge
                              className="h-5 text-[10px] capitalize px-2 py-0 border font-semibold"
                              style={{
                                backgroundColor: config.color + '15',
                                color: config.color,
                                borderColor: config.color + '20'
                              }}
                            >
                              {config.label}
                            </Badge>
                          )}
                          <div className="text-muted-foreground/60 transition-colors">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </button>

                      {/* Card Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t space-y-3 bg-muted/[0.02]">
                          
                          {/* Summary */}
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Summary
                            </h4>
                            <div className="p-3.5 rounded-lg bg-muted/25 border border-muted/30">
                              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
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

      </DialogContent>
    </Dialog>
  )
}
