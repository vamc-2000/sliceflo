// components/projects/views/kanban-view/KanbanCard.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    MessageSquare,
    Paperclip,
    ChevronRight,
    ChevronDown,
    MoreHorizontalIcon,
    Plus,
    Flag,
    User,
    UserPlus2,
    Network,
    Check,
    X,
    ChevronUp,
    Link2,
    Copy,
    Ban,
    XOctagon,
    CircleArrowLeft,
    CircleArrowRight,
    SkipBack,
    SkipForward
} from 'lucide-react';
import { useTasksStore } from '@/stores/tasks-store';
import { Task, Subtask } from '@/types/task.types';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatTaskId } from '@/utils/task-utils';
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from "@/stores/projects-store";
import {
    getRelationshipIcon,
    getRelationshipIconColor,
    getRelationshipLabel
} from '@/utils/relationship-utils';
import { RelationshipDetailDialog } from '../list-view/common/RelationshipDetailDialog';


interface CustomKanbanCardProps {
    task: Task | Subtask;
    projectId: string;
    showAvatar?: boolean;
    showDates?: boolean;
    showPriority?: boolean;
    showSubtasks?: boolean;
    parentTaskId?: string;
    onClick?: () => void;
    isSubtask?: boolean;
    onAddSubtaskClick?: () => void;
    isAddingSubtask?: boolean;
    isSubtasksExpanded?: boolean;
    onToggleSubtasks?: () => void;
    hideChevron?: boolean;
    wrapText?: boolean;
    showParentId?: boolean;
    isHoverPreview?: boolean;
}

export const CustomKanbanCard = ({
    task,
    projectId,
    showAvatar = true,
    showDates = true,
    showPriority = true,
    showSubtasks = false,
    parentTaskId,
    onClick,
    isSubtask = false,
    onAddSubtaskClick,
    isAddingSubtask = false,
    isSubtasksExpanded = true,
    onToggleSubtasks,
    hideChevron = false,
    wrapText = false,
    showParentId = false,
    isHoverPreview = false
}: CustomKanbanCardProps) => {
    const { projects, getTaskPriorityConfigs, getTaskStatusConfigs } = useProjectsStore();
    const taskPriorityConfigs = getTaskPriorityConfigs(projectId);
    const taskStatusConfigs = getTaskStatusConfigs(projectId);
    const currentStatus = (task as any).status || (taskStatusConfigs[0]?.value ?? '');
    const statusConfig = taskStatusConfigs.find(c => c.value === currentStatus);
    const statusColor = statusConfig?.color ?? '#6B7280';
    const {
        tasks,
        subtasks: storeSubtasks,
        getSubtasksByTask,
        updateTask,
        updateSubtask,
        addSubtask,
        getTaskRelationships
    } = useTasksStore();
    const { workspaceMembers } = useWorkspaceStore();

    const currentProject = projects.find(p => p.id === projectId);
    // ✅ Filter workspace members to only those who are in this project
    const members = workspaceMembers.filter(wm =>
        currentProject?.members?.some(pm => pm.userId === wm.userId)
    );
    const projectSlug = currentProject?.slug ?? 'TASK';
    // State for inline editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(task.name);
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);
    const [hoveredRelType, setHoveredRelType] = useState<string | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // ✅ Add new state for subtask input
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [showSubtaskInput, setShowSubtaskInput] = useState(false);
    const subtaskInputRef = useRef<HTMLInputElement>(null);

    const currentIsTask = !isSubtask;
    console.log('isSubtask prop:', isSubtask, '| currentIsTask computed:', currentIsTask, '| task.id:', task.id);

    const subtasks = showSubtasks && currentIsTask ? getSubtasksByTask(task.id) : [];

    const assignedMember = task.assignee
        ? members.find(m => m.userId === task.assignee) ?? null
        : null;


    const priorityOption = task.priority
        ? taskPriorityConfigs.find(p => p.value === task.priority)
        : null;

    const parentTask = useMemo(() => {
        if (!isSubtask || !parentTaskId) return null;
        return tasks.find(t => t.id === parentTaskId);
    }, [isSubtask, parentTaskId, tasks]);

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

    const startDateStr = useMemo(() => {
        return task.startDate ? format(new Date(task.startDate), 'MMM d') : null;
    }, [task.startDate]);

    const endDateStr = useMemo(() => {
        return task.endDate ? format(new Date(task.endDate), 'MMM d') : null;
    }, [task.endDate]);

    useEffect(() => {
        setEditedName(task.name);
    }, [task.name]);

    // Handle name editing
    const handleStartEditName = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingName(true);
        setEditedName(task.name);
    };

    const handleSaveName = () => {
        if (editedName.trim() && editedName !== task.name) {
            if (currentIsTask) {
                updateTask(task.id, { name: editedName.trim() });
            } else {
                updateSubtask(task.id, { name: editedName.trim() });
            }
        }
        setIsEditingName(false);
    };

    const handleCancelEditName = () => {
        setEditedName(task.name);
        setIsEditingName(false);
    };

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        if (showSubtaskInput && subtaskInputRef.current) {
            subtaskInputRef.current.focus();
        }
    }, [showSubtaskInput]);

    // Handle assignee change
    const handleAssigneeChange = (userId: string) => {
        if (currentIsTask) updateTask(task.id, { assignee: userId });
        else updateSubtask(task.id, { assignee: userId });
        setIsAssigneeOpen(false);
    };

    // Handle priority change
    const handlePriorityChange = (priorityValue: string) => {
        if (currentIsTask) {
            updateTask(task.id, { priority: priorityValue });
        } else {
            updateSubtask(task.id, { priority: priorityValue });
        }
        setIsPriorityOpen(false);
    };

    // Handle date change
    // Handle date change
    // Handle date changes
    const handleStartDateChange = (date: Date | undefined) => {
        const dateString = date?.toISOString();
        if (currentIsTask) {
            updateTask(task.id, { startDate: dateString });
        } else {
            updateSubtask(task.id, { startDate: dateString });
        }
        setIsStartDateOpen(false);
    };

    const handleEndDateChange = (date: Date | undefined) => {
        const dateString = date?.toISOString();
        if (currentIsTask) {
            updateTask(task.id, { endDate: dateString });
        } else {
            updateSubtask(task.id, { endDate: dateString });
        }
        setIsEndDateOpen(false);
    };

    // ✅ Add handler for Add Subtask button
    const handleAddSubtaskClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIsTask && onAddSubtaskClick) {
            onAddSubtaskClick();
        }
    };

    const handleToggleSubtasks = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSubtasks) {
            onToggleSubtasks();
        }
    };


    return (
        <div
            onClick={(e) => {
                e.stopPropagation();   // ✅ prevent bubbling to KanbanCard wrapper
                if (!isEditingName) onClick?.();
            }}
            className={cn(
                "group relative rounded-lg bg-card p-2 shadow-sm border border-border border-l-4 hover:shadow-md transition-shadow cursor-pointer",
                isHoverPreview && "pointer-events-none hover:shadow-sm"
            )}
            style={{ borderLeftColor: statusColor }}
        >


            {/* Top row: Avatar, Task ID, Priority */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                    {/* Avatar with dropdown */}
                    <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <div className={cn("cursor-pointer", isHoverPreview && "pointer-events-none")}>
                                {showAvatar && (
                                    assignedMember ? (
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignedMember.profilePicture || assignedMember.avatar} />
                                            <AvatarFallback className="text-xs bg-blue-100">
                                                {assignedMember.name
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted transition-colors">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )
                                )}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Assign to</div>
                                {members.map(member => (
                                    <button
                                        key={member.userId}
                                        onClick={() => handleAssigneeChange(member.userId)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs"
                                    >
                                        <Avatar className="h-5 w-5">                      {/* ✅ Avatar wrapper */}
                                            <AvatarImage src={member.profilePicture || member.avatar} />
                                            <AvatarFallback className="text-xs bg-blue-100">
                                                {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{member.name}</span>
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0.5 rounded-sm"
                        /* style={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor
                        }} */
                    >
                        {formatTaskId(projectSlug, task.taskNumber)}
                    </Badge>

                    {/* Parent task indicator for subtasks */}
                    {isSubtask && showParentId && parentTask && (
                        <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground"
                        >
                            {formatTaskId(projectSlug, parentTask.taskNumber)}
                        </Badge>
                    )}

                    {/* Priority with dropdown */}
                    <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <div className={cn("cursor-pointer", isHoverPreview && "pointer-events-none")}>
                                {showPriority && priorityOption ? (
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
                                    <div className="h-6 w-6 rounded-full flex items-center justify-center bg-muted transition-colors">
                                        <Flag className="h-4 w-4 text-muted-foreground" />
                                    </div>
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
                                            className="w-full flex justify-between items-center gap-2 px-2 py-1 rounded hover:bg-muted text-xs"
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
                    {!isHoverPreview && (() => {
                        const taskRels = getTaskRelationships(task.id);
                        const seenTypes = new Set<string>();
                        const uniqueRels = taskRels.filter(rel => {
                            if (seenTypes.has(rel.type)) return false;
                            seenTypes.add(rel.type);
                            return true;
                        });
                        return uniqueRels.map(rel => {
                            const RelIcon = getRelationshipIcon(rel.type);
                            // Search in both tasks and subtasks
                            const targetTask = tasks.find(t => t.id === rel.targetTaskId) ||
                                storeSubtasks.find(st => st.id === rel.targetTaskId);

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
                    {!isHoverPreview && <MoreHorizontalIcon className="h-4 w-4" />}
                </div>
            </div>

            {/* Task Name - Inline Editable */}
            {isEditingName ? (
                <Input
                    ref={nameInputRef}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                            handleSaveName();
                        } else if (e.key === 'Escape') {
                            handleCancelEditName();
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm mb-3 border-primary"
                />
            ) : (
                <h4
                    className={cn(
                        "text-xs text-foreground mb-2 hover:text-primary transition-colors cursor-pointer",
                        wrapText ? "truncate" : "whitespace-normal",
                        isHoverPreview && "pointer-events-none hover:text-foreground"
                    )}
                    onClick={!isHoverPreview ? handleStartEditName : undefined}
                >
                    {wrapText && task.name.length > 25
                        ? task.name.substring(0, 25) + "..."
                        : task.name}
                </h4>
            )}

            {/* Bottom row: Subtasks count, Comments, Attachments, Date */}
            <div className="flex items-center gap-1">
                {/* <div className="flex justify-center items-center gap-1 h-6 w-6 text-muted-foreground bg-muted rounded-full">
                    <MessageSquare className="h-4 w-4" />
                    <span>0</span>
                </div> */}

                {/* Start Date with picker */}
                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <div className={cn("cursor-pointer", isHoverPreview && "pointer-events-none")}>
                            {showDates && startDateStr ? (
                                <Badge
                                    variant="secondary"
                                    className="text-xs font-normal h-6 px-2 py-0.5 flex items-center gap-1 bg-muted text-muted-foreground hover:bg-muted"
                                >
                                    <CalendarIcon className="h-3 w-3" />
                                    <span className="mt-0.5">{startDateStr}</span>
                                </Badge>
                            ) : (
                                <div className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted transition-colors hover:bg-muted" title="Add start date">
                                    <CalendarIcon className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                        <Calendar
                            mode="single"
                            selected={task.startDate ? new Date(task.startDate) : undefined}
                            onSelect={handleStartDateChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {startDateStr && endDateStr && <span className="text-muted-foreground text-xs font-bold px-0">-</span>}

                {/* End Date with picker */}
                <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <div className={cn("cursor-pointer", isHoverPreview && "pointer-events-none")}>
                            {showDates && endDateStr ? (
                                <Badge
                                    variant="secondary"
                                    className="text-xs font-normal h-6 px-2 py-0.5 flex items-center gap-1 bg-muted text-muted-foreground hover:bg-muted"
                                >
                                    <CalendarIcon className="h-3 w-3" />
                                    <span className="mt-0.5">{endDateStr}</span>
                                </Badge>
                            ) : (
                                <div className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground bg-muted transition-colors hover:bg-muted" title="Add end date">
                                    <CalendarIcon className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                        <Calendar
                            mode="single"
                            selected={task.endDate ? new Date(task.endDate) : undefined}
                            onSelect={handleEndDateChange}
                            disabled={(dt) => (task.startDate ? dt < new Date(new Date(task.startDate).setHours(0, 0, 0, 0)) : false)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Bottom section: Add Subtask Button OR Subtasks Count */}
            {showSubtasks && currentIsTask && !isSubtask && (
                <div className="w-full flex items-center justify-between mt-2">
                    {/* Add Subtask Button */}
                    {onAddSubtaskClick && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAddSubtaskClick}
                            disabled={isAddingSubtask}
                            className="h-6 justify-start gap-1 px-2 font-normal"
                        >
                            <Network className="h-4 w-4 rotate-270" />
                            <span className='mt-0.5'>Add Subtask</span>
                        </Button>
                    )}

                    {/* Subtasks Count Badge - Right aligned with toggle */}
                    {subtasks.length > 0 && !hideChevron && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-1.5 rounded-md bg-[#FF9500]/10"
                            onClick={handleToggleSubtasks}
                        >
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-brand-orange text-xs font-medium text-foreground">
                                {subtasks.length}
                            </div>
                            {isSubtasksExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                            ) : (
                                <ChevronDown className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
