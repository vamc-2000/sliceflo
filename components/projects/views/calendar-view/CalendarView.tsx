// components/projects/views/calendar-view/calendarView.tsx

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, parseISO, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns";
import { convertSelectedDateToUTC, isWeekend, getWeekendDaysIndices } from "@/utils/timezone-utils";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
// ✅ Import the DnD HOC
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
// ✅ Import DnD styles
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useTasksStore } from '@/stores/tasks-store';
import { Task, Subtask } from '@/types/task.types';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    SlidersVertical,
    Layers,
    Users,
    Search,
    SlidersHorizontal,
    LayoutGrid,
    List,
    Calendar as CalendarIcon,
    Plus,
    GripVertical,
    MoreHorizontal,
    ChevronsRight,
    Settings,
} from 'lucide-react';
import { CalendarEventHoverCard } from './CalendarEventHoverCard';
import { TaskDetailView } from '@/components/projects/TaskDetailView';
import { useProjectsStore } from "@/stores/projects-store";
import { useProfileStore } from '@/stores/profile-store';
import ProjectMembersSection from "@/components/projects/ProjectMembersSection";
import { QuickTaskCreation } from '../../QuickTaskCreation';
import { CustomDateCell } from './CustomDateCell';
import { CustomCalendarPicker } from './CustomCalendarPicker';
import { cn } from "@/lib/utils";
import { CalendarDayEventCard } from './CalendarDayEventCard';
import { useWorkspaceStore } from "@/stores/workspace-store";

const localizer = momentLocalizer(moment);

// ✅ Define the CalendarEvent interface
interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: {
        task: Task | Subtask;
        status: string | undefined;
        priority: string | undefined;
        assignee: string | undefined;
        isSubtask: boolean;           // ← Add this
        parentTaskId: string | undefined;  // ← Add this
    };
}

// ✅ Create typed DnDCalendar with proper event type
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface CalendarViewProps {
    projectId: string;
}

interface FilterState {
    assignees: string[];
    statuses: string[];
    priorities: string[];
}

const transformTasksToEvents = (tasks: Task[], subtasks: Subtask[]) => {
    // Transform tasks
    const taskEvents = tasks
        .filter(task => task.startDate || task.endDate)
        .map(task => ({
            id: task.id,
            title: task.name,
            start: new Date(task.startDate ?? task.endDate!),
            end: (() => {
                const baseDate = task.endDate
                    ? new Date(new Date(task.endDate).getTime() + 1)  // +1ms so RBC includes this day
                    : new Date(task.startDate!);
                baseDate.setHours(23, 59, 59, 999);
                return baseDate;
            })(),
            allDay: true,
            resource: {
                task: task,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee,
                isSubtask: false,
                parentTaskId: undefined,
            },
        }));

    // Transform subtasks
    const subtaskEvents = subtasks
        .filter(subtask => subtask.startDate || subtask.endDate)
        .map(subtask => ({
            id: subtask.id,
            title: subtask.name,
            start: new Date(subtask.startDate ?? subtask.endDate!),
            end: (() => {
                const baseDate = subtask.endDate
                    ? new Date(subtask.endDate)
                    : new Date(subtask.startDate!);
                baseDate.setHours(23, 59, 59, 999);
                return baseDate;
            })(),
            allDay: true,
            resource: {
                task: subtask, // Subtask has same structure as Task
                status: subtask.status,
                priority: subtask.priority,
                assignee: subtask.assignee,
                isSubtask: true,
                parentTaskId: subtask.parentTaskId,
            },
        }));

    // Combine and return both
    return [...taskEvents, ...subtaskEvents];
};

const eventStyleGetter = (
    event: any,
    view: View | 'sprint',
    priorityConfigs: Array<{ value: string; color: string }> = [],
    statusConfigs: Array<{ value: string; color: string }> = []
) => {
    if (view === 'day') {
        return {
            style: {
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0,
                boxShadow: 'none',
            },
        };
    }

    const task = event.resource.task;

    const statusColor = task.status
        ? statusConfigs.find((s) => s.value === task.status)?.color
        : undefined;
    const priorityColor = task.priority
        ? priorityConfigs.find((p) => p.value === task.priority)?.color
        : undefined;
    const borderColor = statusColor || priorityColor || '#34C759';

    return {
        style: {
            backgroundColor: 'var(--card)',
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: '4px',
            border: '1px solid var(--border)',
            borderLeftWidth: '4px',
            borderLeftColor: borderColor,
            color: 'var(--foreground)',
            padding: '4px 8px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
    };
};

// Add this BEFORE the CustomToolbar component definition
const getCalendarLabel = (view: View | 'sprint', date: Date) => {
    if (view === 'sprint') {
        const { start, end } = getSprintRange(date);
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else if (view === Views.WEEK) {
        const start = startOfWeek(date, { weekStartsOn: 0 });
        const end = endOfWeek(date, { weekStartsOn: 0 });

        if (start.getMonth() === end.getMonth()) {
            return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
        } else {
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
    } else if (view === Views.DAY) {
        return format(date, 'EEEE, MMM d, yyyy');
    } else {
        // Month view
        return format(date, 'MMMM yyyy');
    }
};

// Custom Toolbar Component - WITH LEFT SIDE CONTROLS
const CustomToolbar = ({
    label,
    onNavigate,
    onView,
    view,
    date,
    onShowUnscheduled,
    showUnscheduled,
    unscheduledCount,
    // Props for left side controls
    searchQuery,
    onSearchChange,
    filters,
    projectMembers,
    isMembersOpen,
    setIsMembersOpen,
    onAddMembers,
    onRemoveMember,
    projectId
}: any) => {
    return (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-card">
            {/* Header with Settings */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <div className="relative flex ">
                        <Input
                            placeholder="Search"
                            className="pl-2 pr-8 rounded text-xs"
                            data-testid="calendar-search-input"
                        />
                        <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Members Button */}
                    <Popover open={isMembersOpen} onOpenChange={setIsMembersOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded cursor-pointer gap-2 text-xs"
                                data-testid="calendar-members-trigger"
                            >
                                <img src="/icons/users.svg" className="h-4 w-4 hidden" alt="users" />
                                <Users className="h-4 w-4" />
                                Members
                                {projectMembers.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {projectMembers.length}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-2 border border-b-[5px] border-b-primary" align="start">
                            <ProjectMembersSection
                                projectId={projectId}
                                members={projectMembers}
                                onAddMembers={onAddMembers}
                                onRemoveMember={onRemoveMember}
                                onInviteClick={() => {
                                    setIsMembersOpen(false);
                                    // setIsInviteDialogOpen(true);
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Group By Dropdown */}
                    {/* <DropdownMenu open={showGroupByDropdown} onOpenChange={setShowGroupByDropdown}> */}
                    {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="secondary" className="gap-2 rounded cursor-pointer">
                                <Layers className="h-4 w-4" />
                                Group by: <span className="capitalize">{groupBy}</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </DropdownMenu> */}

                    {/* <div className="flex items-center gap-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            className={`rounded cursor-pointer`}
                        // className={`rounded cursor-pointer ${showSortOptions ? "bg-[#001F3F] text-white hover:bg-[#001F3F]" : ""}`}
                        // onClick={() => setShowSortOptions(!showSortOptions)}
                        >
                            <SlidersVertical className="h-4 w-4" />
                        </Button>
                    </div> */}
                </div>
            </div >

            {/* RIGHT SIDE: Navigation + View Toggles + Settings */}
            <div className="flex items-center gap-1">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        onNavigate('TODAY');
                        if (view === 'sprint') {
                            // Force immediate date update for sprint view
                            onNavigate('DATE', new Date());
                        }
                    }}
                    className="h-8 px-2 rounded text-xs font-medium"
                    data-testid="calendar-today-btn"
                >
                    Today
                </Button>

                {/* Navigation Controls with Custom Calendar Picker */}
                <div className="flex items-center gap-1">
                    <Button
                        onClick={() => onNavigate('PREV')}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-testid="calendar-prev-btn"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 px-3 text-xs font-semibold hover:bg-muted flex items-center gap-1"
                                data-testid="calendar-datepicker-trigger"
                            >
                                {label}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="center">
                            <CustomCalendarPicker
                                selectedDate={date}
                                onDateSelect={(newDate) => {
                                    onNavigate('DATE', newDate);
                                }}
                                view={view === 'sprint' ? 'sprint' : view as any}
                                currentLabel={label}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        onClick={() => onNavigate('NEXT')}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-testid="calendar-next-btn"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>


                {/* View Toggle Buttons */}
                <div className="h-8 flex items-center gap-1 bg-muted rounded p-1">
                    <Button
                        variant={view === Views.MONTH ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onView(Views.MONTH)}
                        className={cn(
                            "h-7 px-2 rounded text-xs",
                            view === Views.MONTH
                                ? "bg-primary shadow-sm text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="calendar-view-month-btn"
                    >
                        Month
                    </Button>
                    <Button
                        variant={view === 'sprint' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onView('sprint')}
                        className={cn(
                            "h-7 px-2 rounded  text-xs",
                            view === 'sprint'
                                ? "bg-primary shadow-sm text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="calendar-view-sprint-btn"
                    >
                        Sprint
                    </Button>
                    <Button
                        variant={view === Views.WEEK ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onView(Views.WEEK)}
                        className={cn(
                            "h-7 px-2 rounded  text-xs",
                            view === Views.WEEK
                                ? "bg-primary shadow-sm text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="calendar-view-week-btn"
                    >
                        Week
                    </Button>
                    <Button
                        variant={view === Views.DAY ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onView(Views.DAY)}
                        className={cn(
                            "h-7 px-2 rounded text-xs",
                            view === Views.DAY
                                ? "bg-primary shadow-sm text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="calendar-view-day-btn"
                    >
                        Day
                    </Button>
                </div>

                <Button
                    variant={showUnscheduled ? "default" : "secondary"}
                    size="sm"
                    onClick={onShowUnscheduled}
                    className={cn(
                        "h-8 px-2 rounded text-xs flex justify-center items-center gap-1",
                        showUnscheduled
                            ? "bg-primary shadow-sm text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid="calendar-unscheduled-toggle-btn"
                >
                    Unscheduled
                    <Badge
                        className={cn(
                            "bg-transparent text-xs mt-0.5 px-1.5",
                            showUnscheduled
                                ? "bg-brand-orange text-foreground"
                                : "text-primary"
                        )}>
                        {unscheduledCount}
                    </Badge>
                </Button>

                {/* Settings Icon */}
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" data-testid="calendar-settings-btn">
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

// Unscheduled Tasks Panel
const UnscheduledTasksPanel = ({
    tasks,
    onTaskClick,
    onSchedule,
    onShowUnscheduled,
}: {
    tasks: Task[],
    onTaskClick: (task: Task) => void,
    onSchedule: (taskId: string) => void,
    onShowUnscheduled: () => void,
}) => {
    return (
        <div className="w-80 border-l border-border bg-muted flex flex-col p-4 gap-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground">Unscheduled Tasks</h3>
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={onShowUnscheduled}
                    className="bg-transparent"
                    data-testid="calendar-unscheduled-panel-close-btn"
                >
                    <ChevronsRight className="h-4 w-4 text-foreground" />
                </Button>
            </div>
            <div className="border border-border bg-card rounded-md">
                <div className="flex items-center justify-around text-xs text-muted-foreground border-b border-border p-2">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        // checked={task.completed}
                        onChange={() => { }}
                    />
                    <span>Tasks</span>
                    <span>Action</span>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {tasks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                            No unscheduled tasks
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    data-testid={`calendar-unscheduled-task-item-${task.id}`}
                                    className="group flex items-center gap-2 p-2 rounded hover:bg-muted cursor-move border border-transparent hover:border-border transition-all"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.dataTransfer.setData('taskId', task.id);
                                        // Store taskId globally for drop handler
                                        (window as any).draggedTaskId = task.id;

                                        // Optional: Create a custom drag image
                                        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                                        dragImage.style.opacity = '0.5';
                                        document.body.appendChild(dragImage);
                                        e.dataTransfer.setDragImage(dragImage, 0, 0);
                                        setTimeout(() => document.body.removeChild(dragImage), 0);
                                    }}
                                    onDragEnd={() => {
                                        // Clean up
                                        (window as any).draggedTaskId = null;
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-input"
                                        checked={task.completed}
                                        onChange={() => { }}
                                        data-testid={`calendar-unscheduled-task-checkbox-${task.id}`}
                                    />

                                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" data-testid={`calendar-unscheduled-task-grip-${task.id}`} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {task.status && (
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            )}
                                            <span className="text-xs text-foreground truncate">
                                                {task.name}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onSchedule(task.id)}
                                        className="h-7 px-2 text-xs"
                                        data-testid={`calendar-unscheduled-task-schedule-btn-${task.id}`}
                                    >
                                        Schedule
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add this custom header component before the CalendarView function
const CustomHeader = ({
    date,
    label,
    shouldColorBg = false,
}: {
    date: Date;
    label: string;
    shouldColorBg?: boolean;
}) => {
    const isWeekendDay = isWeekend(date);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const parentHeader = containerRef.current.closest('.rbc-header');
            if (parentHeader) {
                if (isWeekendDay && shouldColorBg) {
                    parentHeader.classList.add('rbc-weekend-bg');
                } else {
                    parentHeader.classList.remove('rbc-weekend-bg');
                }
            }
        }
    }, [isWeekendDay, shouldColorBg]);

    return (
        <div ref={containerRef} className="flex flex-col items-center py-1 w-full h-full justify-center">
            <span className={cn(
                "font-medium text-xs",
                isWeekendDay && "text-primary"
            )}>
                {label}
            </span>
            {isWeekendDay && (
                <span className="text-xs text-muted-foreground font-normal mt-0.5">
                    Weekend
                </span>
            )}
        </div>
    );
};

/**
 * Calculate sprint start and end dates (14 days)
 * Sprint starts from the given date
 */
const getSprintRange = (date: Date) => {
    const start = startOfDay(date);
    const end = endOfDay(addDays(start, 13)); // 14 days total (0-13)
    return { start, end };
};

/**
 * Generate array of dates for sprint view
 */
const getSprintDates = (date: Date) => {
    const { start } = getSprintRange(date);
    const dates = [];
    for (let i = 0; i < 14; i++) {
        dates.push(addDays(start, i));
    }
    return dates;
};

interface SpanEvent {
    event: CalendarEvent;
    startCol: number;  // index in sprintDates (0-13)
    endCol: number;    // index in sprintDates (0-13)
}

const buildSpanRows = (events: CalendarEvent[], sprintDates: Date[]): SpanEvent[][] => {
    if (sprintDates.length === 0) return [];
    const sprintStart = startOfDay(sprintDates[0]);
    const sprintEnd = startOfDay(sprintDates[sprintDates.length - 1]);

    // Filter events to only keep those that overlap with the active sprint range
    const activeEvents = events.filter(event => {
        const eventStart = startOfDay(event.start);
        const eventEnd = startOfDay(event.end);
        return eventEnd >= sprintStart && eventStart <= sprintEnd;
    });

    const spanEvents: SpanEvent[] = activeEvents.map(event => {
        const eventStart = startOfDay(event.start);
        const eventEnd = startOfDay(event.end);

        let startCol = 0;
        let endCol = 0;

        // Find start index
        if (eventStart < sprintStart) {
            startCol = 0;
        } else {
            startCol = sprintDates.findIndex(d => startOfDay(d).getTime() === eventStart.getTime());
            if (startCol === -1) startCol = 0;
        }

        // Find end index
        if (eventEnd > sprintEnd) {
            endCol = sprintDates.length - 1;
        } else {
            endCol = sprintDates.findIndex(d => startOfDay(d).getTime() === eventEnd.getTime());
            if (endCol === -1) endCol = sprintDates.length - 1;
        }

        return { event, startCol, endCol };
    });

    // Pack into rows so events don't overlap vertically
    const rows: SpanEvent[][] = [];

    spanEvents.forEach(spanEvent => {
        // Find the first row where this event fits (no column overlap)
        const rowIndex = rows.findIndex(row =>
            !row.some(e => e.startCol <= spanEvent.endCol && e.endCol >= spanEvent.startCol)
        );

        if (rowIndex === -1) {
            rows.push([spanEvent]); // new row
        } else {
            rows[rowIndex].push(spanEvent);
        }
    });

    return rows;
};

// Replace the entire SprintView component with this version:
const SprintView = ({
    events,
    date,
    onSelectEvent,
    onAddQuickTask,
    weekendDays,
    draggedTaskId,
    onEventHover,
    onEventHoverEnd,
    taskPriorityConfigs,
    taskStatusConfigs,
}: {
    events: CalendarEvent[];
    date: Date;
    onSelectEvent: (event: CalendarEvent) => void;
    onAddQuickTask: (date: Date) => void;
    weekendDays: number[];
    draggedTaskId?: string | null;
    onEventHover?: (event: CalendarEvent, position: { x: number; y: number }) => void;
    onEventHoverEnd?: () => void;
    taskPriorityConfigs?: Array<{ _id: string; value: string; label: string; color: string }>;
    taskStatusConfigs?: Array<{ value: string; color: string }>;
}) => {
    const sprintDates = getSprintDates(date);
    const { start: sprintStart, end: sprintEnd } = getSprintRange(date);
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    const [resizingEvent, setResizingEvent] = useState<{
        eventId: string;
        edge: 'left' | 'right';
        originalStartCol: number;
        originalEndCol: number;
        startX: number;
    } | null>(null);

    const colWidth = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // tracks current col positions during drag for visual preview only
    const resizePreview = useRef<{ startCol: number; endCol: number } | null>(null);
    const didResizeRef = useRef(false);
    const [resizePreviewState, setResizePreviewState] = useState<{
        eventId: string;
        startCol: number;
        endCol: number;
    } | null>(null);

    const allEvents = events; // already filtered to sprint range via transformTasksToEvents

    const spanRows = useMemo(() => buildSpanRows(allEvents, sprintDates), [allEvents, sprintDates]);

    const handleResizeMouseDown = (
        e: React.MouseEvent,
        event: CalendarEvent,
        startCol: number,
        endCol: number,
        edge: 'left' | 'right'
    ) => {
        e.preventDefault();
        e.stopPropagation();

        // Calculate column width from container
        const container = containerRef.current;
        if (container) {
            colWidth.current = container.offsetWidth / 14;
        }

        setResizingEvent({
            eventId: event.id,
            edge,
            originalStartCol: startCol,
            originalEndCol: endCol,
            startX: e.clientX,
        });
    };

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingEvent) return;

        const deltaX = e.clientX - resizingEvent.startX;
        const deltaCols = Math.round(deltaX / colWidth.current);

        let newStartCol = resizingEvent.originalStartCol;
        let newEndCol = resizingEvent.originalEndCol;

        if (resizingEvent.edge === 'right') {
            newEndCol = Math.max(resizingEvent.originalStartCol, Math.min(13, resizingEvent.originalEndCol + deltaCols));
        } else {
            newStartCol = Math.min(resizingEvent.originalEndCol, Math.max(0, resizingEvent.originalStartCol + deltaCols));
        }

        // Store in ref (no re-render) AND state (triggers visual update)
        resizePreview.current = { startCol: newStartCol, endCol: newEndCol };
        setResizePreviewState({ eventId: resizingEvent.eventId, startCol: newStartCol, endCol: newEndCol });
        didResizeRef.current = true;
    }, [resizingEvent]);

    const handleResizeMouseUp = useCallback(() => {
        if (resizingEvent && resizePreview.current) {
            const { startCol, endCol } = resizePreview.current;
            const newStartDate = sprintDates[startCol];
            const newEndDate = sprintDates[endCol];

            if (newStartDate && newEndDate) {
                const { updateTask, updateSubtask, tasks, subtasks } = useTasksStore.getState();
                const task = tasks.find(t => t.id === resizingEvent.eventId);
                const subtask = !task ? subtasks.find(s => s.id === resizingEvent.eventId) : null;

                const updates = {
                    startDate: convertSelectedDateToUTC(newStartDate),
                    endDate: convertSelectedDateToUTC(newEndDate),
                };

                if (subtask) updateSubtask(resizingEvent.eventId, updates);
                else updateTask(resizingEvent.eventId, updates);
            }
        }

        // Clear all resize state
        resizePreview.current = null;
        setResizePreviewState(null);
        setResizingEvent(null);
    }, [resizingEvent, sprintDates]);

    useEffect(() => {
        if (resizingEvent) {
            window.addEventListener('mousemove', handleResizeMouseMove);
            window.addEventListener('mouseup', handleResizeMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [resizingEvent, handleResizeMouseMove, handleResizeMouseUp]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-card border border-border">
            {/* Column Headers */}
            <div className="grid border-b border-border bg-card" style={{ gridTemplateColumns: `repeat(14, 1fr)` }}>
                {sprintDates.map((currentDate) => {
                    const isWeekendDay = isWeekend(currentDate);
                    const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (
                        <div
                            key={format(currentDate, 'yyyy-MM-dd')}
                            className={cn("text-center py-3 border-r border-border last:border-r-0 px-1", isWeekendDay && "rbc-weekend-bg")}
                        >
                            <div className={cn("text-xs font-medium whitespace-nowrap", isToday && "text-primary font-bold")}>
                                {format(currentDate, 'dd EEE')}
                            </div>
                            {isWeekendDay && <div className="text-xs text-muted-foreground mt-0.5">Weekend</div>}
                        </div>
                    );
                })}
            </div>

            {/* Events + Drop zones area */}
            <div className="flex-1 overflow-y-auto relative" ref={containerRef}>

                {/* Layer 1 (bottom): Background columns - purely visual */}
                <div
                    className="absolute inset-0 grid pointer-events-none"
                    style={{ gridTemplateColumns: `repeat(14, 1fr)` }}
                >
                    {sprintDates.map((d) => {
                        const isWeekendDay = isWeekend(d);
                        const dateKey = format(d, 'yyyy-MM-dd');
                        return (
                            <div
                                key={dateKey}
                                className={cn(
                                    "border-r border-border last:border-r-0 h-full",
                                    isWeekendDay && "rbc-weekend-bg",
                                    dragOverDate === dateKey && "bg-primary/10"
                                )}
                            />
                        );
                    })}
                </div>

                {/* Layer 2: Drop zones - behind task cards */}
                <div
                    className="absolute inset-0 grid"
                    style={{ gridTemplateColumns: `repeat(14, 1fr)`, zIndex: 1 }}
                >
                    {sprintDates.map((currentDate) => {
                        const dateKey = format(currentDate, 'yyyy-MM-dd');
                        const isWeekendDay = isWeekend(currentDate);
                        return (
                            <div
                                key={dateKey}
                                className={cn(
                                    "relative group",
                                    dragOverDate === dateKey && "ring-2 ring-primary ring-inset"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateKey); }}
                                onDragLeave={(e) => {
                                    // Only clear if leaving to outside this cell
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                        setDragOverDate(null);
                                    }
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const taskId = (window as any).draggedTaskId;
                                    if (taskId) {
                                        const { updateTask, updateSubtask, tasks, subtasks } = useTasksStore.getState();

                                        // Find the task to get its current dates
                                        const task = tasks.find(t => t.id === taskId);
                                        const subtask = !task ? subtasks.find(s => s.id === taskId) : null;
                                        const item = task || subtask;

                                        if (item) {
                                            const oldStart = item.startDate ? new Date(item.startDate) : null;
                                            const oldEnd = item.endDate ? new Date(item.endDate) : null;

                                            // Preserve duration if both dates exist
                                            let newEnd: string | undefined = undefined;
                                            if (oldStart && oldEnd) {
                                                const duration = oldEnd.getTime() - oldStart.getTime();
                                                newEnd = convertSelectedDateToUTC(new Date(currentDate.getTime() + duration));
                                            }

                                            const updates = {
                                                startDate: convertSelectedDateToUTC(currentDate),
                                                ...(newEnd ? { endDate: newEnd } : {}),
                                            };

                                            if (subtask) {
                                                updateSubtask(taskId, updates);
                                            } else {
                                                updateTask(taskId, updates);
                                            }
                                        }

                                        (window as any).draggedTaskId = null;
                                    }
                                    setDragOverDate(null);
                                }}
                            >
                                {/* Quick task + button */}
                                {!isWeekendDay && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute bottom-2 right-1 h-6 w-6 p-0 rounded bg-primary text-primary-foreground flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 hover:bg-primary"
                                        style={{ zIndex: 10 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddQuickTask(currentDate);
                                        }}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Layer 3 (top): Span event rows - fully interactive */}
                <div
                    className="relative p-1 space-y-1"
                    style={{ zIndex: 2, pointerEvents: 'none' }}
                >
                    {spanRows.map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="relative"
                            style={{ height: '24px' }}
                        >
                            {row.map(({ event, startCol, endCol }) => {
                                const task = event.resource.task;
                                const statusColor = task.status
                                    ? taskStatusConfigs?.find((s) => s.value === task.status)?.color
                                    : undefined;
                                const priorityColor = task.priority
                                    ? taskPriorityConfigs?.find((p) => p.value === task.priority)?.color
                                    : undefined;
                                const borderColor = statusColor || priorityColor || '#34C759';
                                const cfg = taskPriorityConfigs?.find(p => p.value === task.priority);
                                const spanCols = endCol - startCol + 1;

                                return (
                                    <div
                                        key={event.id}
                                        className="absolute top-0 bottom-0 px-0.5"
                                        style={(() => {
                                            const isResizing = resizePreviewState?.eventId === event.id;
                                            const displayStartCol = isResizing ? resizePreviewState!.startCol : startCol;
                                            const displayEndCol = isResizing ? resizePreviewState!.endCol : endCol;
                                            const displaySpan = displayEndCol - displayStartCol + 1;
                                            return {
                                                left: `${(displayStartCol / 14) * 100}%`,
                                                width: `${(displaySpan / 14) * 100}%`,
                                                pointerEvents: 'auto' as const,
                                                zIndex: isResizing ? 10 : 3,
                                                transition: resizingEvent ? 'none' : 'left 0.1s, width 0.1s',
                                            };
                                        })()}
                                    >
                                        <div
                                            draggable={!resizingEvent}
                                            onClick={() => {
                                                if (didResizeRef.current) {
                                                    didResizeRef.current = false; // consume and reset
                                                    return;
                                                }
                                                onSelectEvent(event);
                                            }}
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                e.dataTransfer.effectAllowed = 'move';
                                                e.dataTransfer.setData('taskId', event.id);
                                                (window as any).draggedTaskId = event.id;
                                                (window as any).draggedEvent = event;  // ← store full event too
                                                const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                                                dragImage.style.opacity = '0.5';
                                                dragImage.style.width = e.currentTarget.offsetWidth + 'px';
                                                document.body.appendChild(dragImage);
                                                e.dataTransfer.setDragImage(dragImage, 0, 0);
                                                setTimeout(() => document.body.removeChild(dragImage), 0);
                                            }}
                                            onDragEnd={() => {
                                                (window as any).draggedTaskId = null;
                                                (window as any).draggedEvent = null;  // ← clean up
                                            }}
                                            onMouseMove={(e) => {
                                                e.stopPropagation();
                                                onEventHover?.(event, { x: e.clientX, y: e.clientY });
                                            }}
                                            onMouseLeave={() => onEventHoverEnd?.()}
                                            className="group/event h-full text-xs px-2 cursor-pointer rounded border-l-[3px] bg-card hover:bg-muted shadow-sm flex items-center gap-1 overflow-visible relative"
                                            style={{ borderLeftColor: borderColor }}
                                        >
                                            {/* LEFT resize handle */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/event:opacity-100 flex items-center justify-center z-10"
                                                onMouseDown={(e) => handleResizeMouseDown(e, event, startCol, endCol, 'left')}
                                            >
                                                <div className="w-0.5 h-3 bg-muted-foreground rounded" />
                                            </div>

                                            <span className="font-medium text-foreground truncate px-2">{event.title}</span>
                                            {/* {cfg && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] h-4 shrink-0 ml-auto"
                                                    style={{
                                                        backgroundColor: `${cfg.color}20`,
                                                        borderColor: cfg.color,
                                                        color: cfg.color
                                                    }}
                                                >
                                                    {cfg.label}
                                                </Badge>
                                            )} */}

                                            {/* RIGHT resize handle */}
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/event:opacity-100 flex items-center justify-center z-10"
                                                onMouseDown={(e) => handleResizeMouseDown(e, event, startCol, endCol, 'right')}
                                            >
                                                <div className="w-0.5 h-3 bg-muted-foreground rounded" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

// Custom Event Component with Hover Support
const CustomEvent = ({
    event,
    onHover,
    onHoverEnd
}: {
    event: any;
    onHover: (event: any, position: { x: number; y: number }) => void;
    onHoverEnd: () => void;
}) => {
    const task = event.resource.task;

    // Track mouse position as it moves over the element
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        onHover(event, {
            x: e.clientX,  // Use cursor X position
            y: e.clientY   // Use cursor Y position
        });
    };

    return (
        <div
            className="h-full w-full px-1 overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={onHoverEnd}
            title=""
        >
            <span className="text-xs font-medium truncate block">
                {event.title}
            </span>
        </div>
    );
};

export function CalendarView({ projectId }: CalendarViewProps) {
    const {
        projects,
        addMembersToProject,
        removeMembersFromProject,
        getTaskPriorityConfigs,
        getTaskStatusConfigs,
    } = useProjectsStore();
    const { workspaceMembers } = useWorkspaceStore();
    const { tasks, getTasksByProject, fetchTasks, subtasks, updateTask, updateSubtask, getSubtasksByTask } = useTasksStore();
    const { user: profile } = useProfileStore();
    const [view, setView] = useState<View | 'sprint'>(Views.MONTH);
    const [date, setDate] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
    const [showUnscheduled, setShowUnscheduled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<FilterState>({
        assignees: [],
        statuses: [],
        priorities: [],
    });

    const currentProject = projects.find(p => p.id === projectId);
    const projectMembers = workspaceMembers.filter(wm =>
        currentProject?.members?.some(pm => pm.userId === wm.userId)
    );
    const taskPriorityConfigs = getTaskPriorityConfigs(projectId);
    const taskStatusConfigs = getTaskStatusConfigs(projectId);

    useEffect(() => {
        if (!projectId) return;

        // Only fetch if tasks aren't already loaded for this project
        const existingTasks = getTasksByProject(projectId); // from store
        if (existingTasks.length === 0) {
            fetchTasks(projectId).catch((error) => {
                console.error('Failed to load tasks:', error);
            });
        }
    }, [projectId]);

    const [isMembersOpen, setIsMembersOpen] = useState(false);

    // Inside the CalendarView component, add these state variables
    const [quickTaskDate, setQuickTaskDate] = useState<Date>(new Date());
    const [showQuickTaskPopup, setShowQuickTaskPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
    const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Hover handlers for event cards
    const handleEventHover = useCallback((event: CalendarEvent, position: { x: number; y: number }) => {
        // Don't show hover card if task detail view is already open
        if (isTaskDetailOpen) {
            return;
        }

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredEvent(event);
            setHoverPosition(position);
        }, 300);
    }, [isTaskDetailOpen]);

    const handleEventHoverEnd = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredEvent(null);
        }, 100);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    const weekendDays = useMemo(() => {
        return getWeekendDaysIndices();
    }, [profile?.preferences?.weekendDays]);

    const dayPropGetter = useCallback((date: Date) => {
        if (isWeekend(date)) {
            return {
                className: "rbc-weekend-bg"
            };
        }
        return {};
    }, [profile?.preferences?.weekendDays]);

    const slotPropGetter = useCallback((date: Date) => {
        if (isWeekend(date)) {
            return {
                className: "rbc-weekend-bg"
            };
        }
        return {};
    }, [profile?.preferences?.weekendDays]);

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        setDate(new Date());
    }, []);

    // Add handler for creating quick task
    const handleAddQuickTask = (date: Date) => {
        setQuickTaskDate(date);
        setShowQuickTaskPopup(true);
    };

    // Add handler for creating the task
    const handleCreateQuickTask = (taskData: {
        projectId: string;
        name: string;
        description?: string;
        startDate: Date;
        endDate?: Date;
        assignee?: string;
        priority?: string;
        status?: string;
    }) => {
        // 1. Close popup IMMEDIATELY — don't wait for API
        setShowQuickTaskPopup(false);
        setQuickTaskDate(new Date());

        // 2. Get addTask from store and call it non-blocking
        const { addTask } = useTasksStore.getState();

        addTask(
            {
                projectId: taskData.projectId,
                name: taskData.name,
                description: taskData.description,
                startDate: convertSelectedDateToUTC(taskData.startDate),
                endDate: taskData.endDate ? convertSelectedDateToUTC(taskData.endDate) : convertSelectedDateToUTC(taskData.startDate),
                priority: taskData.priority || undefined,
                assignee: taskData.assignee || undefined,
                status: taskData.status || undefined,
                completed: false,
            },
            // onConfirmed: fires after real API id arrives (optional, for logging/tracking)
            (_realId: string) => {
                // nothing needed — store already updates state reactively
            },
        );
    };

    const handleSelectEvent = useCallback((event: any) => {
        // Clear hover card immediately when clicking
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setHoveredEvent(null);

        // Open task detail
        const task = event.resource.task;
        setSelectedTask(task);
        setIsTaskDetailOpen(true);
    }, []);

    const handleSelectSlot = useCallback(({ start }: { start: Date; end: Date }) => {
        // Handle creating new task on date click
        console.log('Selected slot:', start);
    }, []);

    const handleCloseTaskDetail = useCallback((open: boolean) => {
        setIsTaskDetailOpen(open);
        if (!open) {
            setSelectedTask(null);
            // Clear any lingering hover state
            setHoveredEvent(null);
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        }
    }, []);

    const handleAddMembers = async (members: Array<{ userId: string; role: string }>) => {
        await addMembersToProject(projectId, members);
    };

    const handleRemoveMember = async (userId: string) => {
        await removeMembersFromProject(projectId, [userId]);
    };

    const handleScheduleTask = (taskId: string) => {
        const today = convertSelectedDateToUTC(new Date());
        updateTask(taskId, {
            startDate: today,
            endDate: today,  // This is the due date field
        });
    };

    const handleEventDrop = ({ event, start, end }: any) => {
        const originalStart = new Date(event.start);
        const originalEnd = new Date(event.end);

        // Calculate original duration in ms
        const duration = originalEnd.getTime() - originalStart.getTime();

        const newStart = new Date(start);
        // Shift end by same duration to preserve the span
        const newEnd = new Date(newStart.getTime() + duration);

        // Adjust for RBC allDay exclusive end (+1ms offset we added in transform)
        // Subtract 1ms since we added +1ms in transformTasksToEvents
        const adjustedEnd = event.allDay
            ? new Date(newEnd.getTime() - 1)
            : newEnd;

        if (event.resource.isSubtask) {
            updateSubtask(event.id, {
                startDate: convertSelectedDateToUTC(newStart),
                endDate: convertSelectedDateToUTC(adjustedEnd),
            });
        } else {
            updateTask(event.id, {
                startDate: convertSelectedDateToUTC(newStart),
                endDate: convertSelectedDateToUTC(adjustedEnd),
            });
        }
    };

    const handleEventResize = ({ event, start, end }: any) => {
        const newStart = new Date(start);
        const newEnd = new Date(end);

        // Subtract the +1ms offset we added in transformTasksToEvents for allDay events
        const adjustedEnd = event.allDay
            ? new Date(newEnd.getTime() - 1)
            : newEnd;

        if (event.resource.isSubtask) {
            updateSubtask(event.id, {
                startDate: convertSelectedDateToUTC(newStart),
                endDate: convertSelectedDateToUTC(adjustedEnd),
            });
        } else {
            updateTask(event.id, {
                startDate: convertSelectedDateToUTC(newStart),
                endDate: convertSelectedDateToUTC(adjustedEnd),
            });
        }
    };

    // ✅ Fixed onDrillDown handler - manually change both view and date
    const handleDrillDown = useCallback((date: Date, view: View) => {
        // Manually set the date first
        setDate(date);
        // Then set the view to DAY
        setView(Views.DAY);
    }, []);

    const handleSprintNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => {
        if (view === 'sprint') {
            if (action === 'PREV') {
                setDate(addDays(date!, -14)); // Go back 14 days
            } else if (action === 'NEXT') {
                setDate(addDays(date!, 14)); // Go forward 14 days
            } else if (action === 'TODAY') {
                setDate(new Date());
            } else if (action === 'DATE' && newDate) {
                setDate(newDate);
            }
        }
    }, [view, date]);

    // Add this after handleSprintNavigate (around line 1050)
    const handleNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => {
        if (view === 'sprint') {
            handleSprintNavigate(action, newDate);
        } else {
            // Handle navigation for month/week/day views
            if (action === 'TODAY') {
                setDate(new Date());
            } else if (action === 'PREV') {
                // Navigate to previous period based on current view
                if (view === Views.MONTH) {
                    setDate(new Date(date!.getFullYear(), date!.getMonth() - 1, 1));
                } else if (view === Views.WEEK) {
                    setDate(addDays(date!, -7));
                } else if (view === Views.DAY) {
                    setDate(addDays(date!, -1));
                }
            } else if (action === 'NEXT') {
                // Navigate to next period based on current view
                if (view === Views.MONTH) {
                    setDate(new Date(date!.getFullYear(), date!.getMonth() + 1, 1));
                } else if (view === Views.WEEK) {
                    setDate(addDays(date!, 7));
                } else if (view === Views.DAY) {
                    setDate(addDays(date!, 1));
                }
            } else if (action === 'DATE' && newDate) {
                setDate(newDate);
            }
        }
    }, [view, date, handleSprintNavigate]);

    const projectTasks = useMemo(() => {
        return tasks.filter((task) => task.projectId === projectId);
    }, [tasks, projectId]);

    const scheduledTasks = useMemo(() => {
        return projectTasks.filter(task => task.endDate);
    }, [projectTasks]);

    const unscheduledTasks = useMemo(() => {
        return projectTasks.filter(task => !task.endDate);
    }, [projectTasks]);

    const events = useMemo(() => {
        // Filter subtasks that belong to tasks in the current project
        const projectTaskIds = projectTasks.map(t => t.id);
        const projectSubtasks = subtasks.filter(st =>
            st.parentTaskId && projectTaskIds.includes(st.parentTaskId)
        );

        return transformTasksToEvents(projectTasks, projectSubtasks);
    }, [projectTasks, subtasks, projectTasks]);

    const filteredEvents = useMemo(() => {
        let filtered = events;

        if (searchQuery) {
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filters.assignees.length > 0) {
            filtered = filtered.filter(event =>
                event.resource.assignee && filters.assignees.includes(event.resource.assignee)
            );
        }

        if (filters.statuses.length > 0) {
            filtered = filtered.filter(event =>
                event.resource.status && filters.statuses.includes(event.resource.status)
            );
        }

        if (filters.priorities.length > 0) {
            filtered = filtered.filter(event =>
                event.resource.priority && filters.priorities.includes(event.resource.priority)
            );
        }

        return filtered;
    }, [events, filters, searchQuery]);


    if (!isMounted || !date) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading calendar...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Render toolbar for ALL views */}
            <CustomToolbar
                label={getCalendarLabel(view, date || new Date())}
                onNavigate={handleNavigate}
                onView={(newView: any) => setView(newView)}
                view={view}
                date={date || new Date()}
                onShowUnscheduled={() => setShowUnscheduled(!showUnscheduled)}
                showUnscheduled={showUnscheduled}
                unscheduledCount={unscheduledTasks.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={filters}
                projectMembers={projectMembers}
                isMembersOpen={isMembersOpen}
                setIsMembersOpen={setIsMembersOpen}
                onAddMembers={handleAddMembers}
                onRemoveMember={handleRemoveMember}
                projectId={projectId}
            />
            {/* Calendar Content - No separate header needed */}
            <div className="flex flex-1 overflow-hidden p-0">
                {/* Conditionally render Sprint View or Calendar */}
                {view === 'sprint' ? (
                    // Sprint view should also show toolbar, so wrap it:
                    <div className="flex-1 flex flex-col overflow-hidden px-4 py-2">
                        <SprintView
                            events={filteredEvents}
                            date={date || new Date()}
                            onSelectEvent={handleSelectEvent}
                            onAddQuickTask={handleAddQuickTask}
                            weekendDays={weekendDays}
                            draggedTaskId={draggedTaskId}
                            onEventHover={handleEventHover}
                            onEventHoverEnd={handleEventHoverEnd}
                            taskPriorityConfigs={taskPriorityConfigs}
                            taskStatusConfigs={taskStatusConfigs}
                        />
                    </div>
                ) : (
                    // Calendar
                    <div className="flex-1 relative overflow-auto"
                        onDragOver={(e) => {
                            e.preventDefault(); // Allow drop
                            e.dataTransfer.dropEffect = 'move';
                        }}
                    >
                        <DnDCalendar
                            localizer={localizer}
                            events={filteredEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', minHeight: 600 }}
                            view={view as View}
                            onView={(newView: View) => setView(newView as View | 'sprint')}
                            date={date}
                            dayPropGetter={dayPropGetter}
                            slotPropGetter={slotPropGetter}
                            onNavigate={(newDate, newView) => {
                                setDate(newDate);
                            }}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            // ✅ Add onDrillDown handler
                            onDrillDown={handleDrillDown}
                            selectable
                            eventPropGetter={(event) => eventStyleGetter(event, view, taskPriorityConfigs, taskStatusConfigs)}
                            // ✅ Format configuration for Day view header
                            formats={{
                                dayHeaderFormat: 'dddd, MMMM D', // e.g., "Wednesday, January 28"
                                timeGutterFormat: 'h A', // e.g., "8 AM"
                            }}
                            components={{
                                toolbar: () => null,
                                dateCellWrapper: (props: any) => (
                                    <CustomDateCell
                                        value={props.value}
                                        onAddTask={handleAddQuickTask}
                                        weekendDays={weekendDays}
                                        onDrop={(date) => {
                                            // Handle drop on specific date cell
                                            const taskId = (window as any).draggedTaskId;
                                            if (taskId) {
                                                updateTask(taskId, {
                                                    startDate: convertSelectedDateToUTC(date),
                                                });
                                                (window as any).draggedTaskId = null;
                                            }
                                        }}
                                    >
                                        {props.children}
                                    </CustomDateCell>
                                ),
                                // ADD THIS - Custom event component with hover
                                // event: (props: any) => (
                                //     <CustomEvent
                                //         event={props.event}
                                //         onHover={handleEventHover}
                                //         onHoverEnd={handleEventHoverEnd}
                                //     />
                                // ),
                                event: (props: any) => {
                                    const event = props.event as CalendarEvent;

                                    // Only use custom card for DAY view
                                    if (view === 'day') {
                                        return (
                                            <CalendarDayEventCard
                                                task={event.resource.task}
                                                projectId={projectId}
                                                onClick={() => handleSelectEvent(event)}
                                                isSubtask={event.resource.isSubtask}
                                                parentTaskId={event.resource.parentTaskId}
                                            />
                                        );
                                    }

                                    // For week and month views, use CustomEvent with hover
                                    return (
                                        <CustomEvent
                                            event={event}
                                            onHover={handleEventHover}
                                            onHoverEnd={handleEventHoverEnd}
                                        />
                                    );
                                },
                                // Custom headers for all views
                                month: {
                                    header: (props: any) => (
                                        <CustomHeader
                                            date={props.date}
                                            label={props.label}
                                            shouldColorBg={true}
                                        />
                                    ),
                                },
                                week: {
                                    header: (props: any) => (
                                        <CustomHeader
                                            date={props.date}
                                            label={props.label}
                                            shouldColorBg={true}
                                        />
                                    ),
                                },
                                day: {
                                    header: (props: any) => (
                                        <CustomHeader
                                            date={props.date}
                                            label={props.label}
                                            shouldColorBg={true}
                                        />
                                    ),
                                },
                            }}
                            // // Enable drag and drop
                            onEventDrop={handleEventDrop}
                            onEventResize={handleEventResize}
                            draggableAccessor={() => true}
                            resizable
                            resizableAccessor={() => true}
                        />
                    </div>
                )}

                {/* Then update the render condition */}
                {showQuickTaskPopup && (
                    <QuickTaskCreation
                        selectedDate={quickTaskDate}
                        open={showQuickTaskPopup}
                        projectId={projectId}
                        projectName={currentProject?.name || "Project name"}  // ✅ Use actual project name
                        onClose={() => setShowQuickTaskPopup(false)}
                        onCreateTask={handleCreateQuickTask}
                    />
                )}

                {/* Unscheduled Tasks Panel */}
                {showUnscheduled && (
                    <UnscheduledTasksPanel
                        tasks={unscheduledTasks}
                        onTaskClick={setSelectedTask}
                        onSchedule={handleScheduleTask}
                        onShowUnscheduled={() => setShowUnscheduled(!showUnscheduled)}
                    />
                )}
            </div>

            {/* Task Detail Dialog */}
            {
                isTaskDetailOpen && selectedTask && (
                    <TaskDetailView
                        task={selectedTask}
                        projectId={projectId}
                        open={isTaskDetailOpen}
                        onOpenChange={handleCloseTaskDetail}
                        isSubtask={!!(selectedTask as any)?.parentTaskId}  // subtasks have parentTaskId
                    />
                )
            }
            {/* Render hover card when hovering over events - but NOT when detail view is open */}
            {hoveredEvent && !isTaskDetailOpen && (
                <CalendarEventHoverCard
                    task={hoveredEvent.resource.task}
                    position={hoverPosition}
                    isSubtask={hoveredEvent.resource.isSubtask}
                    parentTaskId={hoveredEvent.resource.parentTaskId}
                />
            )}

            {/* Custom Styles */}
            <style jsx global>{`
  .rbc-weekend-bg {
    background-color: color-mix(in oklch, var(--muted-foreground) 10%, var(--card)) !important;
  }

  /* Base calendar container */
  .rbc-month-view {
    padding: 0.5rem 1rem;
    border: 0px solid var(--border);
    background-color: var(--background);
  }

  .rbc-time-view {
    padding: 1rem;
  }

  /* Remove padding from toolbar */
  .rbc-toolbar {
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Remove ALL default borders completely */
  .rbc-month-row,
  .rbc-day-bg,
  .rbc-header,
  .rbc-month-header,
  .rbc-row,
  .rbc-row-bg {
    border: none !important;
  }

  /* ===== MONTH VIEW STYLES ===== */
  .rbc-header {
    border-top: 1px solid var(--border) !important;
    border-bottom: 1px solid var(--border) !important;
    border-right: 1px solid var(--border) !important;
    color: var(--foreground);
    background-color: var(--card);
  }

  .rbc-month-header .rbc-header:first-child {
    border-left: 1px solid var(--border) !important;
  }

  .rbc-day-bg {
    border-bottom: 1px solid var(--border) !important;
    border-right: 1px solid var(--border) !important;
    background-color: var(--card);
  }

  .rbc-row-bg .rbc-day-bg:nth-child(7n + 1) {
    border-left: 1px solid var(--border) !important;
  }

  .rbc-month-view .rbc-month-row:first-child .rbc-row-bg .rbc-day-bg {
    border-top: 1px solid var(--border) !important;
  }

  .rbc-month-view .rbc-day-bg:hover {
    background-color: var(--muted);
    transition: background-color 0.2s ease;
  }

  /* ===== WEEK AND DAY VIEW STYLES ===== */
  .rbc-time-view .rbc-time-content {
    display: none !important;
  }

  .rbc-time-view {
    padding: 0.5rem 1rem;
    border: 0px solid var(--border) !important;
    background-color: var(--background);
  }

  .rbc-time-view .rbc-header {
    border-bottom: 2px solid var(--border) !important;
    border-right: 1px solid var(--border) !important;
    color: var(--foreground);
    background-color: var(--card);
  }

  .rbc-time-view .rbc-day-slot {
    border-right: 1px solid var(--border) !important;
    min-height: calc(100vh - 250px) !important;
    padding: 8px !important;
    background-color: var(--card);
  }

  .rbc-time-view .rbc-day-slot:last-child {
    border-right: 1px solid var(--border) !important;
  }

  .rbc-time-view .rbc-allday-cell {
    min-height: calc(100vh - 250px) !important;
    height: auto !important;
    max-height: none !important;
    overflow-y: auto !important;
  }

  /* Default event styling for time views */
  .rbc-time-view .rbc-event {
    position: relative !important;
    margin: 4px !important;
    border-radius: 4px;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .rbc-time-view .rbc-event-content {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  /* ===== DAY VIEW - TRANSPARENT WRAPPER FOR CUSTOM CARD ===== */
  .rbc-time-view-day .rbc-event {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 4px !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  .rbc-time-view-day .rbc-event-content {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* Position and z-index management */
  .rbc-date-cell {
    position: relative;
    z-index: 1;
    pointer-events: auto;
  }

  .rbc-event {
    position: relative;
    z-index: 2;
    pointer-events: auto;
  }

  .rbc-day-bg.relative {
    position: relative !important;
  }

  .custom-date-cell-wrapper {
    pointer-events: auto !important;
  }

  .rbc-row-content {
    pointer-events: none;
  }

  .rbc-event,
  .rbc-event-content {
    pointer-events: auto !important;
  }

  .rbc-time-header-cell-single-day {
    display: flex !important;
  }

  .calendar-nav-label {
    min-width: 200px;
    justify-content: space-between;
  }

  .calendar-nav-label:hover {
    background-color: var(--muted);
  }

/* ===== RESIZE HANDLES - LEFT & RIGHT ===== */

  /* Make resizable a positioning context */
  .rbc-addons-dnd-resizable {
    cursor: move !important;
    position: relative !important;
  }

  /* Anchors are absolutely positioned — zero layout impact, no gaps */
  .rbc-addons-dnd-resize-ew-anchor {
    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 8px !important;
    background: transparent !important;
    cursor: ew-resize !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 0 !important;
    transition: opacity 0.15s !important;
    z-index: 5 !important;
  }

  /* Left anchor at left edge */
  .rbc-addons-dnd-resize-ew-anchor:first-child {
    left: 0 !important;
  }

  /* Right anchor at right edge */
  .rbc-addons-dnd-resize-ew-anchor:last-child {
    right: 0 !important;
  }

  .rbc-event:hover .rbc-addons-dnd-resize-ew-anchor {
    opacity: 1 !important;
  }

  /* Kill RBC's inner icon */
  .rbc-addons-dnd-resize-ew-anchor * {
    display: none !important;
  }

  /* Clean single bar */
  .rbc-addons-dnd-resize-ew-anchor::after {
    content: '' !important;
    display: block !important;
    width: 3px !important;
    height: 12px !important;
    background: var(--muted-foreground) !important;
    border-radius: 2px !important;
    opacity: 0.7 !important;
  }

  /* Remove event padding so anchors can reach true edges */
  .rbc-month-view .rbc-event,
  .rbc-time-view .rbc-event {
    padding: 2px 0 !important;
  }

  /* Restore padding on content only so text isn't flush */
  .rbc-addons-dnd-resizable > .rbc-event-content {
    padding: 2px 5px !important;
    overflow: hidden !important;
    min-width: 0 !important;
  }

  /* ===== CURSOR STYLES FOR DRAGGING ===== */
  
  /* Show move cursor on calendar events */
  .rbc-event {
    cursor: move !important;
  }

  .rbc-event:hover {
    cursor: move !important;
  }

  .rbc-addons-dnd-dragging {
    cursor: move !important;
  }

  .rbc-addons-dnd-drag-source {
    cursor: move !important;
  }

  .rbc-addons-dnd-dragging .rbc-event {
    cursor: move !important;
    opacity: 0.5 !important;
  }

  .rbc-event-content {
    cursor: move !important;
  }

  body.dragging,
  body.dragging * {
    cursor: move !important;
  }

  .rbc-addons-dnd-drag-preview {
    cursor: move !important;
    opacity: 0.7 !important;
  }

  /* ===== SHOW MORE LINK STYLING ===== */
  
  .rbc-show-more {
    color: var(--primary) !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    text-decoration: none !important;
    font-size: 12px !important;
    padding: 2px 4px !important;
    border-radius: 4px !important;
    transition: all 0.2s ease !important;
  }

  .rbc-show-more:hover {
    background-color: var(--muted) !important;
    text-decoration: underline !important;
  }

  .rbc-row-segment .rbc-show-more {
    cursor: pointer !important;
    pointer-events: auto !important;
  }

  .rbc-row-content .rbc-show-more {
    pointer-events: auto !important;
  }

  /* Sprint View Specific Styles */
  .sprint-view-container {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background-color: var(--border);
  }

  .sprint-date-cell {
    background-color: var(--card);
    min-height: 120px;
    padding: 8px;
    position: relative;
  }

  .sprint-date-cell:hover {
    background-color: var(--muted);
  }

  .sprint-date-cell.weekend {
    background-color: var(--muted);
  }

  .sprint-task-item {
    font-size: 12px;
    padding: 4px 6px;
    border-radius: 4px;
    border-left: 2px solid;
    background-color: var(--card);
    color: var(--foreground);
    margin-bottom: 4px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .sprint-task-item:hover {
    background-color: var(--muted);
    transform: translateX(2px);
  }

  .rbc-off-range-bg {
    background-color: var(--muted) !important;
  }

  .rbc-today {
    background-color: var(--accent) !important;
  }

  .rbc-date-cell {
    color: var(--foreground);
  }

  .rbc-date-cell.rbc-now {
    color: var(--primary);
    font-weight: 600;
  }

  /* Drag and drop styles */
  .cursor-move {
    cursor: move !important;
  }
  
  [draggable="true"] {
    cursor: move;
  }
  
  body.dragging * {
    cursor: move !important;
  }

  /* Add hover card animation styles */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(10px, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(10px, -50%) scale(1);
    }
  }

  .animate-in {
    animation: fadeIn 0.2s ease-out;
  }
  
  /* Ensure events are hoverable in week/month */
  .rbc-month-view .rbc-event,
  .rbc-time-view-week .rbc-event {
    overflow: visible !important;
  }
  
  .rbc-month-view .rbc-event-content,
  .rbc-time-view-week .rbc-event-content {
    overflow: hidden;
  }

  /* Day view events need visible overflow for custom card */
  .rbc-time-view-day .rbc-event,
  .rbc-time-view-day .rbc-event-content {
    overflow: visible !important;
  }
`}</style>

        </div >
    );
}
