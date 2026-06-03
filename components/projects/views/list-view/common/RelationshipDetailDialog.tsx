import React from 'react';
import { format } from 'date-fns';
import {
  GitMerge,
  ChevronRight,
  Link2,
  Copy,
  Ban,
  XOctagon,
  CircleArrowLeft,
  CircleArrowRight,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, Subtask } from '@/types/task.types';
import { formatTaskId } from '@/utils/task-utils';

interface RelationshipDetailDialogProps {
  sourceTask: Task | Subtask;
  relType: string;
  targetTask: Task | Subtask;
  projectSlug: string;
}

export const RELATIONSHIP_TYPES = [
  { value: "relates-to", label: "Relates to", icon: Link2, color: "text-blue-500" },
  { value: "duplicate-of", label: "Duplicate of", icon: Copy, color: "text-purple-500" },
  { value: "blocked-by", label: "Blocked by", icon: Ban, color: "text-red-500" },
  { value: "blocking", label: "Blocking", icon: XOctagon, color: "text-orange-500" },
  { value: "starts-before", label: "Starts Before", icon: CircleArrowLeft, color: "text-green-500" },
  { value: "starts-after", label: "Starts After", icon: CircleArrowRight, color: "text-teal-500" },
  // { value: "finishes-before", label: "Finishes Before", icon: SkipBack, color: "text-yellow-600" },
  // { value: "finishes-after", label: "Finishes After", icon: SkipForward, color: "text-lime-600" },
];

export const RelationshipDetailDialog: React.FC<RelationshipDetailDialogProps> = ({
  sourceTask,
  relType,
  targetTask,
  projectSlug,
}) => {
  const rel = RELATIONSHIP_TYPES.find(r => r.value === relType);
  const RelIcon = rel?.icon || Link2;
  const relColor = rel?.color || "text-muted-foreground";
  const relLabel = rel?.label || relType;

  return (
    <div
      className="w-[380px] p-4 space-y-2 bg-card rounded-lg border-b-[5px] border-b-primary shadow-xl"
      data-testid="relationship-detail-dialog"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold leading-none tracking-tight text-primary">Relationship</h3>
        <p className="text-xs text-muted-foreground">
          See what this task depends on and what depends on it.
        </p>
      </div>

      <div className="space-y-2 py-1">
        {/* Source Task info row — matches snippet lines 3240-3259 */}
        <div className="flex items-center gap-2 p-2 border rounded-lg min-w-0">
          <GitMerge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
            {formatTaskId(projectSlug, sourceTask.taskNumber)}
          </span>
          <span className="text-xs font-medium truncate block flex-1 min-w-0">{sourceTask.name}</span>
          {sourceTask.startDate && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {format(new Date(sourceTask.startDate), "MM/dd/yy")}
            </span>
          )}
          {sourceTask.endDate && (
            <>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground shrink-0">
                {format(new Date(sourceTask.endDate), "MM/dd/yy")}
              </span>
            </>
          )}
        </div>

        {/* Relationship type indicator — matches snippet lines 3264-3293 logic */}
        <div className="flex items-center gap-2 pl-3 border-l-2 border-amber-400">
          <div className="flex items-center gap-1.5 px-2 py-1 border rounded bg-card text-[10px] font-semibold">
            <RelIcon className={cn("h-3 w-3", relColor)} />
            {relLabel}
          </div>
        </div>

        {/* Target Task info — matches snippet lines 3304-3311 structure but as a display box */}
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-card min-w-0">
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <GitMerge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
              {formatTaskId(projectSlug, targetTask.taskNumber)}
            </span>
            <span className="text-xs font-medium truncate block flex-1 min-w-0">{targetTask.name}</span>
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {targetTask.startDate && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {format(new Date(targetTask.startDate), "MM/dd/yy")}
              </span>
            )}
            {targetTask.startDate && targetTask.endDate && (
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            )}
            {targetTask.endDate && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {format(new Date(targetTask.endDate), "MM/dd/yy")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
