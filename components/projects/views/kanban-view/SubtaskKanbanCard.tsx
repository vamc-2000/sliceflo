// components/projects/views/kanban-view/SubtaskKanbanCard.tsx
'use client';

import { useTasksStore } from '@/stores/tasks-store';
import { CustomKanbanCard } from './KanbanCard';

interface SubtaskKanbanCardProps {
  subtaskId: string;
  projectId: string;
  parentTaskId: string;
  onClick: () => void;
  wrapText?: boolean;
  showParentId?: boolean;
}

export const SubtaskKanbanCard = ({
  subtaskId,
  projectId,
  parentTaskId,
  onClick,
  wrapText = false,
  showParentId = false,
}: SubtaskKanbanCardProps) => {
  // ✅ Read directly from store by ID — always fresh, always reactive
  const subtask = useTasksStore(state =>
    state.subtasks.find(st => st.id === subtaskId)
  );

  if (!subtask) return null;

  return (
    <CustomKanbanCard
      task={subtask}
      projectId={projectId}
      onClick={onClick}
      showSubtasks={false}
      parentTaskId={parentTaskId}
      isSubtask={true}
      wrapText={wrapText}
      showParentId={showParentId}
    />
  );
};