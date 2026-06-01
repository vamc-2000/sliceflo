// components/projects/views/calendar-view/CalendarEventHoverCard.tsx

'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Flag, User, MoreHorizontalIcon, MessageSquare } from 'lucide-react';
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from '@/stores/projects-store'
import { useTasksStore } from '@/stores/tasks-store';
import { cn } from '@/lib/utils';
import { Task, Subtask } from '@/types/task.types';
import { formatTaskId } from '@/utils/task-utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import {
    getRelationshipIcon,
    getRelationshipIconColor,
    getRelationshipLabel
} from '@/utils/relationship-utils';
import { RelationshipDetailDialog } from '../list-view/common/RelationshipDetailDialog';

interface CalendarEventHoverCardProps {
    task: Task | Subtask;
    position: { x: number; y: number };
    isSubtask?: boolean;
    parentTaskId?: string;
}

export const CalendarEventHoverCard = ({ task, position, isSubtask = false, parentTaskId }: CalendarEventHoverCardProps) => {
    const { workspaceMembers } = useWorkspaceStore();
    const { projects, getTaskStatusConfigs, getTaskPriorityConfigs } = useProjectsStore();
    const currentProject = projects.find(p => p.id === task.projectId);
    const members = workspaceMembers.filter(wm =>
        currentProject?.members?.some(pm => pm.userId === wm.userId)
    );
    const projectSlug = currentProject?.slug ?? 'TASK';
    const taskStatusConfigs = getTaskStatusConfigs(task.projectId);
    const taskPriorityConfigs = getTaskPriorityConfigs(task.projectId);
    const { tasks, subtasks, getTaskRelationships, updateTask, updateSubtask } = useTasksStore();
    const [hoveredRelType, setHoveredRelType] = useState<string | null>(null);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);

    const parentTask = isSubtask && parentTaskId
        ? tasks.find(t => t.id === parentTaskId)
        : null;

    const assignedMember = task.assignee
        ? members.find(m => m.userId === task.assignee)
        : null;

    const priorityOption = task.priority
        ? taskPriorityConfigs.find(p => p.value === task.priority)
        : null;

    const statusOption = task.status
        ? taskStatusConfigs.find(c => c.value === task.status || c.label === task.status)
        : null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    };

    const getDaysRemaining = (date?: string) => {
        if (!date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDateOrDaysRemaining = (startDate?: string) => {
        if (!startDate) return null;
        const daysRemaining = getDaysRemaining(startDate);
        if (daysRemaining === null) return null;
        if (daysRemaining < 0) {
            return {
                text: `${Math.abs(daysRemaining)} days ago`,
                isOverdue: true,
                isDueSoon: false
            };
        } else {
            return {
                text: formatDate(startDate),
                isOverdue: false,
                isDueSoon: daysRemaining === 0
            };
        }
    };

    const handlePriorityChange = (priorityValue: string) => {
        if (isSubtask) {
            updateSubtask(task.id, { priority: priorityValue });
        } else {
            updateTask(task.id, { priority: priorityValue });
        }
        setIsPriorityOpen(false);
    };


    const borderColor = statusOption?.color
        || priorityOption?.color
        || '#34C759';

    return (
        <div
            className="fixed z-[9999] pointer-events-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(15px, 15px)',
            }}
        >
            <div
                className={cn(
                    "rounded-lg bg-card p-2 shadow-md border border-border border-l-4 w-3xs pointer-events-auto"
                )}
                style={{ borderLeftColor: borderColor }}
            >
                {/* Top row: Avatar, Task ID, Priority - ALWAYS SHOW */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        {/* Avatar - ALWAYS show (with or without assignee) */}
                        {assignedMember ? (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                                    {assignedMember.name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-muted">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                        )}

                        <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5 rounded-sm"
                            style={{
                                backgroundColor: `${borderColor}20`,
                                color: borderColor
                            }}
                        >
                            {formatTaskId(projectSlug, task.taskNumber)}
                        </Badge>

                        {/* Parent Task Badge for Subtasks */}
                        {isSubtask && parentTask && (
                            <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border-none"
                            >
                                {formatTaskId(projectSlug, parentTask.taskNumber)}
                            </Badge>
                        )}

                        <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
                            <PopoverTrigger asChild>
                                <div className="cursor-pointer">
                                    {priorityOption ? (
                                        <Badge
                                            variant="secondary"
                                            className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: `${priorityOption.color}20`,
                                                color: priorityOption.color
                                            }}
                                        >
                                            <Flag className="h-4 w-4" />
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-xs px-1 h-6 gap-1 text-muted-foreground bg-muted border-none rounded-full"
                                        >
                                            <Flag className="h-4 w-4" />
                                        </Badge>
                                    )}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-36 p-2" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1">
                                    {taskPriorityConfigs.length === 0 ? (
                                        <p className="px-2 py-2 text-xs text-muted-foreground italic">No priorities configured</p>
                                    ) : (
                                        taskPriorityConfigs.map((priority) => (
                                            <button
                                                key={priority._id}
                                                onClick={() => handlePriorityChange(priority.value)}
                                                style={{ color: priority.color }}
                                                className="w-full flex justify-between items-center gap-2 px-2 py-1 rounded hover:bg-muted text-xs transition-colors"
                                            >
                                                <span>{priority.label}</span>
                                                <Badge
                                                    variant="secondary"
                                                    className="h-6 w-6 p-0 rounded-full flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: `${priority.color}20`,
                                                        color: priority.color
                                                    }}
                                                >
                                                    <Flag className="h-4 w-4" />
                                                </Badge>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Relationship Icons */}
                        {(() => {
                            const taskRels = getTaskRelationships(task.id);
                            const seenTypes = new Set<string>();
                            const uniqueRels = taskRels.filter(rel => {
                                if (seenTypes.has(rel.type)) return false;
                                seenTypes.add(rel.type);
                                return true;
                            });
                            return uniqueRels.map(rel => {
                                const RelIcon = getRelationshipIcon(rel.type);
                                const targetTask = tasks.find(t => t.id === rel.targetTaskId) ||
                                    subtasks.find(st => st.id === rel.targetTaskId);

                                if (!targetTask) {
                                    return (
                                        <RelIcon
                                            key={rel.type}
                                            className={cn("h-3.5 w-3.5 shrink-0", getRelationshipIconColor(rel.type))}
                                            title={getRelationshipLabel(rel.type)}
                                        />
                                    );
                                }

                                return (
                                    <Popover
                                        key={rel.type}
                                        open={hoveredRelType === rel.type}
                                        onOpenChange={(open) => !open && setHoveredRelType(null)}
                                    >
                                        <PopoverTrigger asChild>
                                            <div
                                                className="cursor-pointer"
                                                onMouseEnter={() => setHoveredRelType(rel.type)}
                                                onMouseLeave={() => setHoveredRelType(null)}
                                            >
                                                <RelIcon
                                                    className={cn("h-3.5 w-3.5 shrink-0", getRelationshipIconColor(rel.type))}
                                                />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            side="right"
                                            align="start"
                                            className="w-auto p-0 shadow-2xl bg-card z-[100]"
                                        >
                                            <RelationshipDetailDialog
                                                sourceTask={task}
                                                relType={rel.type}
                                                targetTask={targetTask}
                                                projectSlug={projectSlug}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                );
                            });
                        })()}
                    </div>

                    <div>
                        <MoreHorizontalIcon className="h-4 w-4" />
                    </div>
                </div>

                {/* Task Name - ALWAYS show */}
                <h3 className="text-sm text-foreground mb-3 line-clamp-2">
                    {task.name}
                </h3>


                {/* Bottom row: Date - Show if exists, otherwise show placeholder */}
                <div className="flex items-center gap-2">
                    {/* <div className="flex justify-center items-center gap-1 h-6 w-6 text-gray-400 bg-gray-100 rounded-full">
                        <MessageSquare className="h-4 w-4" />
                    </div> */}

                    {task.startDate && (
                        <Badge
                            variant="secondary"
                            className="text-xs font-normal h-6 px-2 py-0.5 flex items-center gap-1 bg-muted text-muted-foreground border-none"
                        >
                            <CalendarIcon className="h-3 w-3" />
                            <span className="mt-0.5">{formatDate(task.startDate)}</span>
                        </Badge>
                    )}

                    {task.startDate && task.endDate && <span className="text-muted-foreground text-xs font-bold">-</span>}

                    {task.endDate ? (
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-xs font-normal h-6 px-2 py-0.5 flex items-center gap-1 border-none",
                                getDaysRemaining(task.endDate) !== null && getDaysRemaining(task.endDate)! < 0
                                    ? "bg-red-50 text-red-600"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="h-3 w-3" />
                            <span className="mt-0.5">{formatDate(task.endDate)}</span>
                        </Badge>
                    ) : !task.startDate && (
                        <Badge
                            variant="outline"
                            className="text-xs gap-1 px-1.5 h-6 text-muted-foreground bg-muted border-none rounded-full"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};
