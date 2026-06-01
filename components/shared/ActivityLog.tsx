'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useActivityLogStore } from '@/stores/activity-log-store'
import { TeamActivityLogItem } from '@/types/activity-log.types'

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityType = 'team' | 'project' | 'portfolio' | 'task'

interface ActivityLogProps {
  /** What kind of entity this log is scoped to */
  entityType: EntityType
  /** The ID of that entity */
  entityId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateLabel(dateStr: string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const d = new Date(dateStr)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, yesterday)) return 'Yesterday'

  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000) // seconds

  if (diff < 60) return 'Just now'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `${m} minute${m > 1 ? 's' : ''} ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `${h} hour${h > 1 ? 's' : ''} ago`
  }
  const days = Math.floor(diff / 86400)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

/** Group logs into an ordered array of { label, date, items } */
function groupByDate(logs: TeamActivityLogItem[]) {
  const map = new Map<string, { label: string; date: string; items: TeamActivityLogItem[] }>()

  for (const log of logs) {
    const raw = log.time || log.createdAt
    const d = new Date(raw)
    // Key: ISO date string yyyy-mm-dd for stable grouping
    const key = d.toISOString().slice(0, 10)

    if (!map.has(key)) {
      map.set(key, { label: getDateLabel(raw), date: key, items: [] })
    }
    map.get(key)!.items.push(log)
  }

  // Sort groups newest first
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActivityItemProps {
  log: TeamActivityLogItem
  isLast: boolean
}

function ActivityItem({ log, isLast }: ActivityItemProps) {
  const raw = log.time || log.createdAt
  const relTime = getRelativeTime(raw)
  const actorName = log.actor?.name ?? 'Someone'
  const avatarSrc = log.actor?.avatar ?? ''
  const initials = actorName.charAt(0).toUpperCase()

  // Split message to bold any word wrapped in **...**
  // Or just show actor bold + rest of message
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        {/* Dot */}
        <div className="relative flex items-center justify-center h-5 w-5 flex-shrink-0">
          {/* Glow */}
          <span className="absolute h-5 w-5 rounded-full bg-[#FF8D28]/50 blur-sm" />

          {/* Main orange dot */}
          <span className="relative z-10 h-2.5 w-2.5 rounded-full bg-[#FF8D28]" />
        </div>

        {/* Content */}
        <div className="flex-1 py-1">
          <p className="text-sm text-foreground leading-snug">
            <span className="font-semibold">{actorName}</span>{' '}
            {log.message}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{relTime}</p>
        </div>
      </div>

      {/* Gap & Connector line strictly between items */}
      {!isLast ? (
        <div className="flex w-5 justify-center py-1">
          <div className="w-[1.6px] h-3 bg-[#FF8D28] rounded-full" />
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  )
}

interface DateGroupProps {
  label: string
  items: TeamActivityLogItem[]
  defaultOpen?: boolean
}

function DateGroup({ label, items, defaultOpen = true }: DateGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full flex items-center justify-between px-4 py-2.5
          text-sm font-medium text-muted-foreground          
          transition-colors rounded-lg cursor-pointer
          ${!open ? 'border border-[#8E8E93]/50 rounded-xl' : ''}
        `}
      >
        <span>{label}</span>
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />
          )}
        </div>
      </button>

      {/* Items */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${open ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
        `}
      >
        <div
          className={`
            transform transition-all duration-300 ease-in-out
            ${open ? 'translate-y-0 scale-100' : '-translate-y-2 scale-[0.98]'}
            pl-4
          `}
        >
          {items.map((log, idx) => (
            <ActivityItem
              key={log._id}
              log={log}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-muted" />
            <div className="w-px h-10 bg-muted" />
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ActivityLog({ entityType, entityId }: ActivityLogProps) {
  const activityLogs = useActivityLogStore((s) => s.activityLogs)
  const loading = useActivityLogStore((s) => s.loading)
  const {
    fetchTeamActivityLogs,
    fetchProjectActivityLogs,
    fetchPortfolioActivityLogs,
    fetchTaskActivityLogs,
    fetchActivityLogs,
    clearLogs,
  } = useActivityLogStore()

  useEffect(() => {
    if (!entityId) return
    clearLogs()

    switch (entityType) {
      case 'team':
        fetchTeamActivityLogs(entityId)
        break
      case 'project':
        fetchProjectActivityLogs(entityId)
        break
      case 'portfolio':
        fetchPortfolioActivityLogs(entityId)
        break
      case 'task':
        fetchTaskActivityLogs(entityId)
        break
    }
  }, [entityType, entityId])

  const groups = useMemo(() => groupByDate(activityLogs), [activityLogs])

  if (loading) return <ActivitySkeleton />

  if (!activityLogs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-lg">📋</span>
        </div>
        <p className="text-sm font-medium text-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground">
          Actions on this {entityType} will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 -mt-2 pb-2">
      {groups.map((group, idx) => (
        <DateGroup
          key={group.date}
          label={group.label}
          items={group.items}
          // Open the two most recent groups by default, rest collapsed
          defaultOpen={idx < 2}
        />
      ))}
    </div>
  )
}
