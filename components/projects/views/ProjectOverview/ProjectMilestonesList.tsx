'use client'

import React from 'react'
import Link from 'next/link'
import { formatLocalDate } from '@/utils/timezone-utils'
import { Flag } from 'lucide-react'
import { Task } from '@/types/task.types'
import { useTasksStore } from '@/stores/tasks-store'
import {
  useProjectsStore,
  getTaskTypeDisplayImage,
  TaskTypeConfig,
} from '@/stores/projects-store'
import ProjectMilestoneActionsMenu from './ProjectMilestoneActionsMenu'

interface ProjectMilestonesListProps {
  milestones: Task[]
  projectId: string
  onDeleteMilestone: (milestoneId: string) => void
}

const formatDueDate = (dateStr?: string) => {
  if (!dateStr) return null
  const formatted = formatLocalDate(dateStr);
  return formatted === "—" ? null : formatted;
}

const MilestoneTypeIcon = ({
  taskType,
  statusColor,
}: {
  taskType?: TaskTypeConfig | null
  statusColor: string
}) => {
  const displayImage = getTaskTypeDisplayImage(taskType ?? null)

  return (
    <div
      className="h-8 w-8 rounded-md flex items-center justify-center overflow-hidden shrink-0"
      style={{ backgroundColor: statusColor }}
    >
      {displayImage ? (
        <img src={displayImage} alt={taskType?.label ?? 'Milestone'} className="w-5 h-5 object-contain" />
      ) : (
        <Flag className="h-4 w-4 text-background" />
      )}
    </div>
  )
}

const PriorityFlag = ({ color, label }: { color?: string; label?: string }) => {
  const flagColor = color ?? '#9CA3AF'
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full shrink-0"
      style={{ backgroundColor: `${flagColor}20` }}
      title={label}
    >
      <Flag className="h-3 w-3" style={{ color: flagColor }} />
    </span>
  )
}

const ProjectMilestonesList: React.FC<ProjectMilestonesListProps> = ({
  milestones,
  projectId,
  onDeleteMilestone,
}) => {
  const { getSubtasksByTask } = useTasksStore()
  const { getTaskStatusConfigs, getTaskPriorityConfigs, getTaskTypesByProject } =
    useProjectsStore()

  const taskStatusConfigs = getTaskStatusConfigs(projectId)
  const taskPriorityConfigs = getTaskPriorityConfigs(projectId)
  const taskTypes = getTaskTypesByProject(projectId)
  const milestoneType =
    taskTypes.find((t) => t.value === 'milestone') ??
    taskTypes.find((t) => t.label?.toLowerCase() === 'milestone') ??
    null

  return (
    <div className="space-y-2">
      {milestones.map((milestone) => {
        const subtaskCount = getSubtasksByTask(milestone.id).length
        const statusCfg = taskStatusConfigs.find((s) => s.value === milestone.status)
        console.log("statusConfig", statusCfg)
        const statusLabel = statusCfg?.label ?? milestone.status ?? 'No Status'
        console.log("statusLabel", statusLabel)
        const statusColor = statusCfg?.color ?? '#6B7280'
        console.log("statusColor", statusColor)
        const priorityCfg = taskPriorityConfigs.find((p) => p.value === milestone.priority)
        const dueFormatted = formatDueDate(milestone.endDate)

        return (
          <div
            key={milestone.id}
            className="flex items-center justify-between rounded-lg border border-l-4 border-l-primary bg-card px-3 py-2 hover:bg-muted/30 transition group/item"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MilestoneTypeIcon taskType={milestoneType} statusColor={statusColor} />
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/task/${milestone.id}`}
                  className="text-xs font-medium hover:underline truncate block text-foreground"
                >
                  {milestone.name}
                </Link>
                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate min-w-0">
                  <span className="shrink-0">
                    {subtaskCount} Task{subtaskCount !== 1 ? 's' : ''}
                  </span>
                  <span className="shrink-0">/</span>
                  <span className="truncate shrink min-w-0" style={{ color: statusColor }}>
                    {statusLabel}
                  </span>
                  {priorityCfg && (
                    <>
                      <span className="shrink-0">/</span>
                      <PriorityFlag color={priorityCfg.color} label={priorityCfg.label} />
                    </>
                  )}
                  {dueFormatted && (
                    <>
                      <span className="shrink-0">/</span>
                      <span className="truncate shrink min-w-0">Due on {dueFormatted}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <ProjectMilestoneActionsMenu
              onOpen={() => {
                window.open(`/task/${milestone.id}`, '_blank')
              }}
              onDelete={() => onDeleteMilestone(milestone.id)}
            />
          </div>
        )
      })}
    </div>
  )
}

export default ProjectMilestonesList
