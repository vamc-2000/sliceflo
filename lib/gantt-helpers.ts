import { Task, Subtask } from '@/types/task.types';
import { Project, TaskStatusConfig } from '@/stores/projects-store';
import { GanttFeature, GanttStatus } from '@/components/ui/shadcn-io/gantt';
import { addDays } from 'date-fns';

const parseDateSafe = (dateString: string): Date => {
  const d = new Date(dateString) // JS parses UTC, converts to LOCAL time
  // getFullYear/Month/Date use LOCAL timezone — so IST "2026-03-09T18:30Z" → Mar 10 ✅
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

const parseEndDateSafe = (dateString: string): Date => {
  const d = new Date(dateString)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  // plain midnight — getWidth's +1 handles the inclusive end column
}

// Status color mapping
const statusColorMap: Record<string, string> = {
  'todo': '#6B7280',
  'in-progress': '#F59E0B',
  'completed': '#10B981',
  'on-hold': '#001F3F',
  // Project statuses
  'active': '#10B981',
  'planning': '#3B82F6',
  'on-track': '#10B981',
  'at-risk': '#F59E0B',
  'off-track': '#EF4444',
  'archived': '#6B7280',
};

// Priority color mapping
const priorityColorMap: Record<string, string> = {
  'urgent': '#EF4444',
  'high': '#EF4444',
  'medium': '#F59E0B',
  'low': '#10B981',
};

export const transformTaskToGanttFeature = (
  task: Task,
  subtask?: Subtask,
  statusConfigs?: TaskStatusConfig[]
): GanttFeature | null => {
  const item = subtask || task;

  // // Only show tasks/subtasks with both start and end dates
  // if (!item.startDate || !item.endDate) return null;

  // ✅ TEMPORARY FIX: If no startDate at all, skip this task
  if (!item.startDate) return null;

  // ✅ TEMPORARY FIX: If only startDate exists, use it for endDate too
  const startDate = item.startDate;
  const endDate = item.endDate || item.startDate; // Use startDate as endDate if missing

  const statusConfig = statusConfigs?.find(c => c.value === item.status);
  const status: GanttStatus = {
    id: item.status || 'default',
    name: item.status || 'No Status',
    color: statusConfig?.color || statusColorMap[item.status || ''] || priorityColorMap[item.priority || ''] || '#6B7280',
  };

  return {
    id: item.id,
    name: item.name,
    startAt: parseDateSafe(startDate),
    endAt: parseEndDateSafe(endDate),
    status,
    lane: subtask ? task.id : undefined, // Group subtasks under parent task
    color: status.color, // Default to status color
  };
};

export const transformProjectToGanttFeature = (
  project: Project,
  color?: string // Optional custom color (e.g. Phase color)
): GanttFeature | null => {
  if (!project.startDate) return null;

  const startDate = project.startDate;
  const endDate = project.endDate || project.startDate;

  const status: GanttStatus = {
    id: project.status || 'default',
    name: project.status || 'No Status',
    color: statusColorMap[project.status || ''] || priorityColorMap[project.priority || ''] || '#6B7280',
  };

  return {
    id: project.id!,
    name: project.name,
    startAt: parseDateSafe(startDate),
    endAt: parseEndDateSafe(endDate),
    status,
    color: color || status.color, // Use phase color if provided
  };
};

export const groupTasksByProject = (
  tasks: Task[],
  subtasks: Subtask[]
): Record<string, GanttFeature[]> => {
  const grouped: Record<string, GanttFeature[]> = {};

  tasks.forEach(task => {
    const projectId = task.projectId;

    if (!grouped[projectId]) {
      grouped[projectId] = [];
    }

    // Add main task if it has dates
    const taskFeature = transformTaskToGanttFeature(task);
    if (taskFeature) {
      grouped[projectId].push(taskFeature);
    }

    // Add subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      const taskSubtasks = subtasks.filter(st =>
        task.subtasks?.includes(st.id)
      );

      taskSubtasks.forEach(subtask => {
        const subtaskFeature = transformTaskToGanttFeature(task, subtask);
        if (subtaskFeature) {
          grouped[projectId].push(subtaskFeature);
        }
      });
    }
  });

  return grouped;
};
