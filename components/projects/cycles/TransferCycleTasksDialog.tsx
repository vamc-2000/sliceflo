'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, ChevronLeft, Loader2, ArrowRight } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { useTasksStore } from '@/stores/tasks-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { MemberAvatar } from '../MemberAvatar'
import { Task, Subtask } from '@/types/task.types'
import { formatCycleName } from '@/utils/cycle-utils'
import { isFuture, isWithinInterval } from 'date-fns'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  sourceCycleId: string
  defaultTargetCycleId?: string
}

export default function TransferCycleTasksDialog({
  open,
  onClose,
  projectId,
  sourceCycleId,
  defaultTargetCycleId = '',
}: Props) {
  const { projects, getTaskStatusConfigs } = useProjectsStore()
  const { tasks, subtasks, assignTasksToCycle, removeTasksFromCycle, fetchTasks } = useTasksStore()
  const { workspaceMembers } = useWorkspaceStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<string>>(new Set())
  const [isTransferring, setIsTransferring] = useState(false)
  
  // Mapping of taskId -> targetCycleId
  const [taskCycles, setTaskCycles] = useState<Record<string, string>>({})

  const project = projects.find((p) => p.id === projectId)
  const projectSlug = project?.slug || 'TASK'
  const statusConfigs = getTaskStatusConfigs(projectId)
  const allCycles = project?.cycles || []
  
  const activeOrUpcomingCycles = useMemo(() => {
    const now = new Date()
    return allCycles.filter((c) => {
      const start = new Date(c.startDate)
      const end = new Date(c.endDate)
      const isActive = isWithinInterval(now, { start, end })
      const isUpcoming = isFuture(start)
      return isActive || isUpcoming
    })
  }, [allCycles])

  const sourceCycle = allCycles.find(c => c.id === sourceCycleId)

  // Load project tasks
  useEffect(() => {
    if (open) {
      fetchTasks(projectId, true)
      setQuery('')
      setCollapsedParentIds(new Set())
    }
  }, [open, projectId, fetchTasks])

  // Initialize taskCycles map and select all incomplete tasks by default
  useEffect(() => {
    if (open) {
      const initialCycles: Record<string, string> = {}
      
      // Filter tasks belonging to the source cycle
      const sourceTasks = tasks.filter(t => 
        t.projectId === projectId && 
        (t.cycleId === sourceCycleId || t.cycle?.id === sourceCycleId)
      )
      const sourceSubtasks = subtasks.filter(st => 
        st.projectId === projectId && 
        (st.cycleId === sourceCycleId || st.cycle?.id === sourceCycleId)
      )

      sourceTasks.forEach(t => {
        initialCycles[t.id] = sourceCycleId
      })
      sourceSubtasks.forEach(st => {
        initialCycles[st.id] = sourceCycleId
      })
      
      setTaskCycles(initialCycles)
      setSelectedIds(new Set())
    }
  }, [open, sourceCycleId, tasks, subtasks, projectId, defaultTargetCycleId])

  // Individual cycle change
  const handleCycleChange = (taskId: string, targetCycleId: string) => {
    setTaskCycles(prev => ({
      ...prev,
      [taskId]: targetCycleId
    }))
  }

  // Bulk cycle change for checked tasks
  const handleBulkCycleChange = (targetCycleId: string) => {
    setTaskCycles(prev => {
      const next = { ...prev }
      selectedIds.forEach(id => {
        next[id] = targetCycleId
      })
      return next
    })
  }

  const toggleCollapse = (parentId: string) => {
    setCollapsedParentIds((prev) => {
      const next = new Set(prev)
      next.has(parentId) ? next.delete(parentId) : next.add(parentId)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    const subtask = subtasks.find((st) => st.id === id)
    if (subtask) {
      const parentId = subtask.parentTaskId
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        const isSelected = prev.has(id)
        const children = subtasks.filter((st) => st.parentTaskId === id)
        
        if (isSelected) {
          next.delete(id)
          children.forEach((child) => next.delete(child.id))
        } else {
          next.add(id)
          children.forEach((child) => next.add(child.id))
        }
        return next
      })
    }
  }

  const toggleAll = () => {
    const allTaskIds = availableTasks.map(t => t.id)
    if (selectedIds.size === allTaskIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allTaskIds))
    }
  }

  // Filter tasks in the project that belong to the source cycle
  const availableTasks = useMemo(() => {
    const list: (Task | Subtask)[] = []
    
    const rootTasks = tasks.filter(t => 
      t.projectId === projectId && 
      (t.cycleId === sourceCycleId || t.cycle?.id === sourceCycleId) &&
      t.completed !== true &&
      t.status?.toLowerCase().trim() !== "done" &&
      t.status?.toLowerCase().trim() !== "completed"
    )
    const subTasks = subtasks.filter(st => 
      st.projectId === projectId && 
      (st.cycleId === sourceCycleId || st.cycle?.id === sourceCycleId) &&
      st.completed !== true &&
      st.status?.toLowerCase().trim() !== "done" &&
      st.status?.toLowerCase().trim() !== "completed"
    )

    const matchesQuery = (item: Task | Subtask) => {
      if (!query) return true
      const matchesName = (item.name ?? '').toLowerCase().includes(query.toLowerCase())
      const matchesId = `${projectSlug}-${item.taskNumber}`.toLowerCase().includes(query.toLowerCase())
      return matchesName || matchesId
    }

    const subtasksByParent = new Map<string, Subtask[]>()
    subTasks.forEach((st) => {
      if (st.parentTaskId) {
        if (!subtasksByParent.has(st.parentTaskId)) {
          subtasksByParent.set(st.parentTaskId, [])
        }
        subtasksByParent.get(st.parentTaskId)!.push(st)
      }
    })

    const addedIds = new Set<string>()

    rootTasks.forEach((root) => {
      const children = subtasksByParent.get(root.id) || []
      const rootMatches = matchesQuery(root)
      const matchingChildren = children.filter(matchesQuery)

      if (rootMatches || matchingChildren.length > 0) {
        if (!addedIds.has(root.id)) {
          list.push(root)
          addedIds.add(root.id)
        }
        children.forEach((child) => {
          if (!addedIds.has(child.id)) {
            list.push(child)
            addedIds.add(child.id)
          }
        })
      }
    })

    subTasks.forEach((child) => {
      if (!addedIds.has(child.id)) {
        const parentId = child.parentTaskId
        const parent = tasks.find((t) => t.id === parentId)
        
        if (matchesQuery(child)) {
          if (parent && parent.projectId === projectId && (parent.cycleId === sourceCycleId || parent.cycle?.id === sourceCycleId)) {
            if (!addedIds.has(parent.id)) {
              list.push(parent)
              addedIds.add(parent.id)
            }
          }
          list.push(child)
          addedIds.add(child.id)
        }
      }
    })

    return list
  }, [tasks, subtasks, projectId, sourceCycleId, query, projectSlug])

  const parentHasSubtasks = (parentId: string) => {
    return availableTasks.some((t) => (t as Subtask).parentTaskId === parentId)
  }

  const visibleTasks = useMemo(() => {
    return availableTasks.filter((task) => {
      const isSubtask = !!(task as Subtask).parentTaskId
      if (isSubtask) {
        const parentId = (task as Subtask).parentTaskId
        if (parentId && collapsedParentIds.has(parentId)) {
          return false
        }
      }
      return true
    })
  }, [availableTasks, collapsedParentIds])

  const handleTransfer = async () => {
    if (selectedIds.size === 0 || isTransferring) return
    setIsTransferring(true)
    try {
      const tasksByCycle: Record<string, string[]> = {}
      const removePromises: Promise<void>[] = []
      const assignPromises: Promise<void>[] = []
      
      selectedIds.forEach(taskId => {
        const targetCycleId = taskCycles[taskId] || ''
        const originalTask = tasks.find(t => t.id === taskId) || subtasks.find(st => st.id === taskId)
        const originalCycleId = originalTask?.cycleId || originalTask?.cycle?.id || ''
        
        if (targetCycleId !== originalCycleId) {
          if (targetCycleId) {
            if (!tasksByCycle[targetCycleId]) {
              tasksByCycle[targetCycleId] = []
            }
            tasksByCycle[targetCycleId].push(taskId)
          } else if (originalCycleId) {
            removePromises.push(removeTasksFromCycle(projectId, originalCycleId, [taskId]))
          }
        }
      })
      
      Object.entries(tasksByCycle).forEach(([targetCycleId, taskIds]) => {
        assignPromises.push(assignTasksToCycle(projectId, targetCycleId, taskIds))
      })
      
      await Promise.all([...removePromises, ...assignPromises])
      onClose()
    } catch (err) {
      console.error('Failed to transfer tasks', err)
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full border-b-[5px] border-b-primary">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <span>Transfer Tasks from completed Cycle</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose new cycles for the remaining tasks in this completed cycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 w-full">
          {/* Top Search & Bulk Edit Controls */}
          <div className="flex gap-2 items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Input
                placeholder="Search by task name or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10 placeholder:text-muted-foreground text-foreground w-full border border-border rounded-md h-9 text-xs bg-card"
              />
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </span>
            </div>

            {/* Bulk Cycle Action Dropdown */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-md h-9">
                <span className="text-[10px] font-bold text-primary whitespace-nowrap">
                  Set selected ({selectedIds.size}) to:
                </span>
                <select
                  onChange={(e) => handleBulkCycleChange(e.target.value)}
                  className="bg-background border border-primary/20 rounded px-1.5 py-0.5 text-[10px] font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  defaultValue=""
                >
                  <option value="" disabled hidden>Select cycle</option>
                  <option value="">No Cycle</option>
                  {activeOrUpcomingCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatCycleName(c.name, c.cycleNumber)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="w-full border border-border rounded-md relative">
            {/* Table Header */}
            <div className="grid grid-cols-[45px_70px_1fr_100px_100px_40px] px-3 py-2 text-xs font-semibold items-center text-primary border-b bg-muted/40">
              <div className="flex items-center">
                <Checkbox
                  checked={availableTasks.length > 0 && selectedIds.size === availableTasks.length}
                  onCheckedChange={toggleAll}
                />
              </div>
              <div>ID</div>
              <div className="pr-2">Task Name</div>
              <div>Cycle</div>
              <div className="text-center">Status</div>
              <div className="text-center">Assignee</div>
            </div>

            {/* Table Rows */}
            <div className="max-h-60 overflow-y-auto text-xs text-muted-foreground divide-y">
              {visibleTasks.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No remaining tasks to transfer
                </div>
              ) : (
                visibleTasks.map((task) => {
                  const statusConfig = statusConfigs.find(s => s.value === task.status)
                  const assigneeMember = workspaceMembers.find(m => m.userId === task.assignee)
                  const taskCode = `${projectSlug.toUpperCase()}-${task.taskNumber}`
                  const isSubtask = !!(task as Subtask).parentTaskId
                  const hasChildren = !isSubtask && parentHasSubtasks(task.id)

                  return (
                    <div
                      key={task.id}
                      className={`grid grid-cols-[45px_70px_1fr_100px_100px_40px] h-9 items-center px-3 hover:bg-muted/30 text-xs ${
                        isSubtask ? 'bg-muted/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 pl-0.5">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleCollapse(task.id)
                            }}
                            className="hover:bg-muted rounded p-0.5 text-muted-foreground flex items-center justify-center w-4 h-4"
                          >
                            {collapsedParentIds.has(task.id) ? (
                              <ChevronLeft className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <Checkbox
                          checked={selectedIds.has(task.id)}
                          onCheckedChange={() => toggleSelect(task.id)}
                        />
                      </div>
                      <div className="font-semibold text-muted-foreground">
                        {taskCode}
                      </div>
                      <div className={`pr-2 truncate text-foreground font-medium flex items-center ${isSubtask ? 'pl-4' : ''}`}>
                        {isSubtask && (
                          <span className="text-muted-foreground mr-1.5 border-l-2 border-b-2 border-border w-2 h-2 inline-block -mt-1" />
                        )}
                        <span className="truncate">{task.name}</span>
                      </div>
                      <div className="pr-1.5">
                        <select
                          value={taskCycles[task.id] ?? ""}
                          onChange={(e) => handleCycleChange(task.id, e.target.value)}
                          className="w-full bg-background border border-border rounded px-1 py-0.5 text-[10px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">No Cycle</option>
                          {sourceCycle && (taskCycles[task.id] === sourceCycleId) && (
                            <option value={sourceCycleId}>
                              {formatCycleName(sourceCycle.name, sourceCycle.cycleNumber)}
                            </option>
                          )}
                          {activeOrUpcomingCycles.map((c) => (
                            <option key={c.id} value={c.id}>
                              {formatCycleName(c.name, c.cycleNumber)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-center">
                        {statusConfig ? (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-white truncate max-w-[80px]"
                            style={{ backgroundColor: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <MemberAvatar size="sm" name={assigneeMember?.name} src={assigneeMember?.profilePicture} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            className="h-9 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={selectedIds.size === 0 || isTransferring}
            onClick={handleTransfer}
            variant="default"
            className="h-9 text-xs"
          >
            {isTransferring ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Transferring...
              </span>
            ) : (
              <>Transfer Selected Tasks ({selectedIds.size})</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
