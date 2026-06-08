'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, ChevronLeft, Loader2 } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { useTasksStore } from '@/stores/tasks-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { MemberAvatar } from '../MemberAvatar'
import { Task, Subtask } from '@/types/task.types'
import { formatCycleName } from '@/utils/cycle-utils'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  cycleId: string
  onCreateNewTaskClick?: () => void
}

export default function LinkCycleTasksDialog({
  open,
  onClose,
  projectId,
  cycleId,
  onCreateNewTaskClick,
}: Props) {
  const { projects, getTaskStatusConfigs } = useProjectsStore()
  const { tasks, subtasks, assignTasksToCycle, fetchTasks } = useTasksStore()
  const { workspaceMembers } = useWorkspaceStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<string>>(new Set())
  const [isLinking, setIsLinking] = useState(false)

  const project = projects.find((p) => p.id === projectId)
  const projectSlug = project?.slug || 'TASK'
  const statusConfigs = getTaskStatusConfigs(projectId)

  useEffect(() => {
    if (open) {
      fetchTasks(projectId, true)
      setSelectedIds(new Set())
      setQuery('')
      setCollapsedParentIds(new Set())
    }
  }, [open, projectId])

  const toggleCollapse = (parentId: string) => {
    setCollapsedParentIds((prev) => {
      const next = new Set(prev)
      next.has(parentId) ? next.delete(parentId) : next.add(parentId)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    // Check if the id is a subtask
    const subtask = subtasks.find((st) => st.id === id)
    
    if (subtask) {
      const parentId = subtask.parentTaskId
      const parent = tasks.find((t) => t.id === parentId)
      // Parent already has a cycle → treat it as unavailable to re-link
      const isParentInActiveCycle = parent ? !!parent.cycleId : false

      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (parentId && !isParentInActiveCycle) {
          // Parent is NOT in the active cycle. Selecting/deselecting this subtask
          // will toggle the entire group (parent and all its subtasks)
          const children = subtasks.filter((st) => st.parentTaskId === parentId)
          const isParentSelected = prev.has(parentId)
          if (isParentSelected) {
            next.delete(parentId)
            children.forEach((child) => next.delete(child.id))
          } else {
            next.add(parentId)
            children.forEach((child) => next.add(child.id))
          }
        } else {
          // Parent is already in the active cycle (or doesn't exist). Just toggle the subtask itself.
          next.has(id) ? next.delete(id) : next.add(id)
        }
        return next
      })
    } else {
      // It is a root task
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

  // Filter tasks and subtasks in the project that are not currently in the active cycle, grouped/nested
  const availableTasks = useMemo(() => {
    const list: (Task | Subtask)[] = []
    
    // Only show tasks that have NO cycle assigned — a task can only belong to one cycle
    const rootTasks = tasks.filter((t) => t.projectId === projectId && !t.cycleId)
    const subTasks = subtasks.filter((st) => st.projectId === projectId && !st.cycleId)

    // Helper to check match
    const matchesQuery = (item: Task | Subtask) => {
      if (!query) return true
      const matchesName = (item.name ?? '').toLowerCase().includes(query.toLowerCase())
      const matchesId = `${projectSlug}-${item.taskNumber}`.toLowerCase().includes(query.toLowerCase())
      return matchesName || matchesId
    }

    // Map parent IDs to their available subtasks
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

    // Process root tasks first
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

    // Process remaining available subtasks whose parents are not in rootTasks
    // (e.g. parent is already in the active cycle, or missing)
    subTasks.forEach((child) => {
      if (!addedIds.has(child.id)) {
        const parentId = child.parentTaskId
        const parent = tasks.find((t) => t.id === parentId)
        
        if (matchesQuery(child)) {
          if (parent && parent.projectId === projectId && parent.cycleId !== cycleId && parent.cycle?.id !== cycleId) {
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
  }, [tasks, subtasks, projectId, cycleId, query, projectSlug])

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

  const isAllSelected = useMemo(() => {
    return availableTasks.length > 0 && availableTasks.every((t) => selectedIds.has(t.id))
  }, [availableTasks, selectedIds])

  const isSomeSelected = useMemo(() => {
    return availableTasks.some((t) => selectedIds.has(t.id)) && !isAllSelected
  }, [availableTasks, selectedIds, isAllSelected])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(availableTasks.map((t) => t.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleLinkTasks = async () => {
    if (selectedIds.size === 0 || isLinking) return;
    setIsLinking(true);
    try {
      await assignTasksToCycle(projectId, cycleId, Array.from(selectedIds));
      onClose()
    } catch (err) {
      console.error('Failed to link tasks to cycle', err)
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full border-b-[5px] border-b-primary">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Add Existing Tasks to Cycle</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select tasks from the project to add to the current cycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 w-full">
          {/* Search Input */}
          <div className="relative w-full">
            <Input
              placeholder="Search by task name or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10 placeholder:text-muted-foreground text-foreground w-full border border-border rounded-md h-9 text-xs bg-card"
              data-testid="link-cycle-tasks-search-input"
            />
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </span>
          </div>

          {/* Table */}
          <div className="w-full border border-border rounded-md relative">
            {/* Table Header */}
            <div className="grid grid-cols-[55px_80px_1fr_100px_40px] px-3 py-2 text-xs font-semibold items-center text-primary border-b bg-muted/40">
              <div className="flex items-center pl-6">
                <Checkbox
                  checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  data-testid="link-cycle-tasks-select-all"
                />
              </div>
              <div>ID</div>
              <div className="pr-2">Task Name</div>
              <div className="text-center">Status</div>
              <div className="text-center">Assignee</div>
            </div>

            {/* Table Rows */}
            <div className="max-h-60 overflow-y-auto text-xs text-muted-foreground divide-y">
              {visibleTasks.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No tasks available to add
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
                      className={`grid grid-cols-[55px_80px_1fr_100px_40px] h-9 items-center px-3 hover:bg-muted/30 text-xs ${
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
                            data-testid={`link-cycle-tasks-collapse-btn-${task.id}`}
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
                          data-testid={`link-cycle-tasks-checkbox-${task.id}`}
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
                        {task.cycle?.name && (
                          <span className="ml-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {formatCycleName(task.cycle.name, task.cycle.cycleNumber)}
                          </span>
                        )}
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

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            className="border-input text-muted-foreground w-40 h-9 text-xs"
            onClick={onCreateNewTaskClick}
            data-testid="link-cycle-tasks-create-btn"
          >
            Create new task
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 text-xs"
              onClick={onClose}
              data-testid="link-cycle-tasks-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              disabled={selectedIds.size === 0 || isLinking}
              onClick={handleLinkTasks}
              variant="default"
              className="h-9 text-xs"
              data-testid="link-cycle-tasks-submit-btn"
            >
              {isLinking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Adding...
                </span>
              ) : (
                <>Add Selected Tasks ({selectedIds.size})</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
