"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { DataTable } from "@/components/layout/DataTable";
import { ChevronsLeftRight, Ellipsis, Pencil, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AddTimesheetEntryModal } from "../TimeSheets/AddTimesheetEntryModal";
import { TimesheetWithUser } from "@/types/timesheet.types";
import { toast } from "sonner";
import { FaRegCirclePlay } from "react-icons/fa6";
import { PiCaretUpDownBold } from "react-icons/pi";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useTimesheetSettingsStore } from "@/stores/timesheet-settings.store";
import { getLocalDateParts } from "@/utils/timezone-utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { useTasksStore } from "@/stores/tasks-store";
import { Task } from "@/types/task.types";
import { TaskDetailView } from "@/components/projects/TaskDetailView";
import { useProjectsStore } from "@/stores/projects-store";
import { formatTaskId } from "@/utils/task-utils";

export interface TimesheetEntry {
    id: string;
    projectId: string;
    projectName: string;
    taskId: string;
    taskName: string;
    taskIdStr?: string;
    date?: Date;
    startTime?: string;
    endTime?: string;
    durationMinutes: number;
    durationHours: number;
    durationMinutesRemainder: number;
    billable: boolean;
    notes?: string;
    mon?: number;
    tue?: number;
    wed?: number;
    thu?: number;
    fri?: number;
    sat?: number;
    sun?: number;
    total?: number;
    originalEntry: TimesheetWithUser;
}

interface Props {
    selectedWeek: { start: Date; end: Date };
}

type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export default function FilledTimeEntries({ selectedWeek }: Props) {
    // Use `timesheets` (TimesheetWithUser[]) — the store has no `entries` field
    const storeTimesheets = useTimesheetStore((state) => state.timesheets);
    const tasks = useTasksStore((state) => state.tasks);
    const projects = useProjectsStore((state) => state.projects);
    const { capacityType, hours } = useTimesheetSettingsStore();
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeRow, setActiveRow] = useState<TimesheetEntry | null>(null);

    const { deleteTimesheet } = useTimesheetStore();

    // Build a taskId → taskName lookup from the tasks store
    const taskNameMap = new Map(tasks.map((t) => [t.id, t.name]));
    const projectSlugMap = useMemo(() => new Map(projects.map((p) => [p.id!, p.slug])), [projects]);

    const dayNames: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    const capacityPerDay =
        capacityType === "daily"
            ? Number(hours)
            : Number(hours) / 7;

    const maxIndicators = Math.min(Math.ceil(capacityPerDay), 12);

    const orderedDays: DayKey[] = [];
    const weekDates = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(selectedWeek.start);
        date.setDate(date.getDate() + index);
        orderedDays.push(dayNames[date.getDay()]);
        return date;
    });

    const parseLocalDate = (dateString: string) => {
        const dateStr = dateString.split("T")[0];
        const [year, month, dayPart] = dateStr.split("-");
        return new Date(Number(year), Number(month) - 1, Number(dayPart));
    };

    // Filter timesheets to only those within the selected week
    const filteredEntries = storeTimesheets.filter((entry) => {
        if (!entry.date) return false;
        return isWithinInterval(parseLocalDate(entry.date), {
            start: startOfDay(selectedWeek.start),
            end: endOfDay(selectedWeek.end),
        });
    });

    // Pivot: group by taskId, accumulating hours per day-of-week column
    const tableData: TimesheetEntry[] = Object.values(
        filteredEntries.reduce((acc, entry) => {
            const entryDate = parseLocalDate(entry.date!);
            const dayKey = dayNames[entryDate.getDay()]; // "sun" | "mon" | …

            if (!acc[entry.taskId]) {
                const task = tasks.find(t => t.id === entry.taskId);
                const projectSlug = projectSlugMap.get(entry.projectId) || "TASK";
                const taskIdStr = task ? formatTaskId(projectSlug, task.taskNumber) : "";

                acc[entry.taskId] = {
                    id: entry.id,
                    projectId: entry.projectId,
                    projectName: "",
                    taskId: entry.taskId,
                    // Resolve task name from tasks store; fall back to taskId
                    taskName: taskNameMap.get(entry.taskId) ?? entry.taskId,
                    taskIdStr: taskIdStr,
                    durationMinutes: 0,
                    durationHours: 0,
                    durationMinutesRemainder: 0,
                    billable: false,
                    total: 0,
                    originalEntry: entry,
                } as TimesheetEntry;
            }

            // timeSpentMinutes → hours (may be fractional, e.g. 90 min = 1.5 h)
            const entryHours = (entry.timeSpentMinutes ?? 0) / 60;

            acc[entry.taskId][dayKey] =
                ((acc[entry.taskId][dayKey] as number) || 0) + entryHours;

            acc[entry.taskId].total = (acc[entry.taskId].total || 0) + entryHours;
            acc[entry.taskId].durationHours =
                (acc[entry.taskId].durationHours || 0) + entryHours;
            acc[entry.taskId].durationMinutes =
                (acc[entry.taskId].durationMinutes || 0) + (entry.timeSpentMinutes ?? 0);

            return acc;
        }, {} as Record<string, TimesheetEntry>)
    );

    const dayTotals: Record<DayKey, number> = orderedDays.reduce((acc, day) => {
        acc[day] = tableData.reduce((sum, row) => {
            // Safer indexing for optional day properties
            const dayValue = row[day as keyof TimesheetEntry];
            return sum + (typeof dayValue === "number" ? dayValue : 0);
        }, 0);
        return acc;
    }, {} as Record<DayKey, number>);

    const grandTotal = orderedDays.reduce((sum, day) => {
        return sum + (dayTotals[day] || 0);
    }, 0);

    const getCapacityColor = (used: number, capacity: number) => {
        if (capacity === 0) return "bg-muted text-foreground";

        const ratio = used / capacity;

        if (ratio > 1) {
            return "bg-red-500 text-primary-foreground";
        }

        if (ratio >= 0.8) {
            return "bg-yellow-400 text-foreground";
        }

        return "bg-primary/10 text-foreground";
    };

    const handleDelete = async () => {
        if (!activeRow) return;
        try {
            const success = await deleteTimesheet(activeRow.originalEntry.id);
            if (success) {
                toast.success("Timesheet entry deleted successfully");
            } else {
                toast.error("Failed to delete timesheet entry");
            }
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast.error("An error occurred while deleting the entry");
        } finally {
            setOpenDeleteModal(false);
            setActiveRow(null);
        }
    };

    const dayColumns: ColumnDef<TimesheetEntry>[] = orderedDays.map((day, index) => {
        const date = weekDates[index];

        return {
            accessorKey: day,
            header: () => (
                <div className="flex flex-col gap-1 py-2">
                    {/* Day name */}
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground text-left font-medium">
                            {day.charAt(0).toUpperCase() + day.slice(1)},
                        </span>

                        <span className="text-sm font-medium text-muted-foreground">
                            {(() => {
                                const parts = getLocalDateParts(date);
                                if (!parts) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                return new Date(parts.year, parts.month, parts.day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            })()}
                        </span>
                    </div>

                    {/* Hours bubble */}
                    <span
                        className={`h-7 w-7 rounded-full text-[12px] font-medium flex items-center justify-center
                            ${dayTotals[day] > 0
                                ? "bg-[#E3EFFF] dark:bg-primary/10 text-foreground"
                                : "bg-muted text-foreground"
                            }
                        `}
                    >
                        {parseFloat(dayTotals[day].toFixed(1))}h
                    </span>

                    {/* Indicators */}
                    <div className="flex gap-1 justify-start">
                        {Array.from({ length: maxIndicators }).map((_, i) => {
                            const isFilled = i < dayTotals[day];
                            const isOverflow = dayTotals[day] > capacityPerDay;

                            return (
                                <span
                                    key={i}
                                    className={`h-2 w-2 rounded-[1px]
                                        ${!isFilled
                                            ? "bg-[#D9D9D9] dark:bg-[#FFFFFF]/50"
                                            : isOverflow
                                                ? "bg-red-500"
                                                : dayTotals[day] >= capacityPerDay * 0.8
                                                    ? "bg-green-600"
                                                    : "bg-primary"
                                        }
                                    `}
                                />
                            );
                        })}
                    </div>
                </div>
            ),

            cell: ({ row }) => {
                const value = row.original[day as keyof TimesheetEntry] as number || 0;
                const hasHours = value > 0;

                return (
                    <div className="flex justify-center">
                        <span
                            className={`rounded-md px-9 py-3 text-xs font-medium transition-colors
                                ${hasHours
                                    ? "bg-[#E3EFFF] dark:bg-primary/10 text-foreground"
                                    : "bg-muted text-foreground"
                                }
                            `}
                        >
                            {parseFloat(value.toFixed(1))}h
                        </span>
                    </div>
                );
            },
        };
    });

    const totalColumn: ColumnDef<TimesheetEntry> = {
        accessorKey: "total",
        header: () => (
            <div className="flex flex-col items-center gap-2 py-2">
                <span className="text-sm font-medium text-gray-600">Total</span>

                <span
                    className={`h-7 w-7 rounded-full text-[12px] font-medium flex items-center justify-center
                            ${grandTotal > 0
                            ? "bg-[#E3EFFF] dark:bg-primary/10 text-foreground"
                            : "bg-muted text-foreground"
                        }
                    `}
                >
                    {parseFloat(grandTotal.toFixed(1))}h
                </span>
            </div>
        ),

        cell: ({ row }) => {
            const total = row.original.total || 0;

            return (
                <div className="flex justify-center">
                    <span
                        className={`rounded-md px-11 py-3 text-xs font-semibold
                                ${total > 0 ? "bg-[#E3EFFF] dark:bg-primary/10 text-foreground" : "bg-muted text-foreground"}
                                `}
                    >
                        {parseFloat(total.toFixed(1))}h
                    </span>
                </div>
            );
        }
    };

    const columns: ColumnDef<TimesheetEntry>[] = [
        {
            accessorKey: "taskName",
            header: "Task",
            cell: ({ row }) => (
                <div className="group flex items-center justify-between w-full min-w-0">
                    {/* Left: Play + Task name */}
                    <div className="flex items-center pr-4 min-w-0 flex-1 max-w-[220px]">
                        <div className="flex flex-col items-start leading-tight text-left w-full gap-1">
                            {row.original.taskIdStr && (
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium shrink-0">
                                    {row.original.taskIdStr}
                                </span>
                            )}
                            <span
                                className="text-sm font-medium truncate w-full"
                                title={row.original.taskName}
                            >
                                {row.original.taskName}
                            </span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-0">
                        {/* <Button
                            variant="ghost"
                            className="h-7 w-7 p-0 flex items-center justify-center"
                        >
                            <FaRegCirclePlay className="h-6 w-6 text-muted-foreground" />
                        </Button> */}

                        <Button
                            variant="ghost"
                            className="h-7 w-7 p-0 flex items-center justify-center hover:bg-primary/10 cursor-pointer"
                            onClick={() => {
                                const task = tasks.find(
                                    (t) => t.id === row.original.taskId
                                );

                                if (!task) return;

                                setSelectedTaskForDetail(task);
                                setShowTaskDetail(true);
                            }}
                        >
                            <ChevronsLeftRight className="h-4 w-4 text-foreground hover:text-foreground/80 rotate-[135deg]" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-7 w-7 p-0 flex items-center justify-center cursor-pointer"
                                >
                                    <Ellipsis className="h-6 w-6 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start" className="w-36 border-0 border-b-[5px] border-primary rounded-lg">
                                <DropdownMenuItem
                                    className="text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        setActiveRow(row.original);
                                        setIsEditModalOpen(true);
                                    }}
                                    disabled={row.original.originalEntry.status === "Pending" || row.original.originalEntry.status === "Approved"}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Entry
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        setActiveRow(row.original);
                                        setOpenDeleteModal(true);
                                    }}
                                    disabled={row.original.originalEntry.status === "Pending" || row.original.originalEntry.status === "Approved"}
                                >
                                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                    Remove 
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            ),
        },
        ...dayColumns,
        totalColumn,
    ];

    return (
        <>
            <div className="h-full overflow-auto px-1">
                <DataTable
                    columns={columns}
                    data={tableData}
                    emptyMessage="No time entries for this week"
                    enableGlobalFilter={false}
                    hidePagination={true}
                    headerRowClassName="bg-[#F6FAFF] hover:bg-[#E3EFFF] dark:bg-muted dark:hover:bg-muted"
                />
            </div>
            <TaskDetailView
                task={selectedTaskForDetail}
                projectId={selectedTaskForDetail?.projectId || ""}
                open={showTaskDetail}
                onOpenChange={setShowTaskDetail}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                open={openDeleteModal}
                onClose={() => setOpenDeleteModal(false)}
                title="Are you sure you want to remove this entry?"
                description="Removing entry is permanent and cannot be undone."
                confirmLabel="Remove"
                onConfirm={handleDelete}
            />

            {/* Edit Modal */}
            {activeRow && (
                <AddTimesheetEntryModal
                    open={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setActiveRow(null);
                    }}
                    initialData={activeRow.originalEntry as any}
                />
            )}
        </>
    );
}