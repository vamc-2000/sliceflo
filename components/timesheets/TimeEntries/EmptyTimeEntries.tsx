"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getLocalDateParts } from "@/utils/timezone-utils";

interface Props {
    selectedWeek: { start: Date; end: Date };
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function EmptyTimeEntries({ selectedWeek }: Props) {
    const weekHeaders = [
        "Task",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
        "Total",
    ];

    const weekDates = days.map((_, index) => {
        const date = new Date(selectedWeek.start);
        date.setDate(date.getDate() + index);
        return date;
    });

    return (
        <div data-testid="empty-time-entries" className="p-1 h-full">
            <div className="h-full flex flex-col">
                {/* Table wrapper */}
                <div className="flex-1 overflow-y-auto">
                    <div 
                        data-testid="empty-time-entries-table-wrapper"
                        className="rounded-md border border-border overflow-hidden"
                    >
                        <Table>
                            {/* Header */}
                            <TableHeader >
                                <TableRow className="hover:bg-transparent">
                                    {/* Task */}
                                    <TableHead className="text-muted-foreground font-normal min-w-35 border-r border-border">
                                        Task
                                    </TableHead>

                                    {/* Days */}
                                    {weekDates.map((date, index) => (
                                        <TableHead
                                            key={index}
                                            data-testid={`empty-time-entries-day-${days[index].toLowerCase()}`}
                                            className="text-muted-foreground font-normal text-center border-r border-border pb-5 pt-2"
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground text-left font-medium">
                                                    {days[index]},
                                                </span>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {(() => {
                                                        const parts = getLocalDateParts(date);
                                                        if (!parts) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                                        return new Date(parts.year, parts.month, parts.day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                                    })()}
                                                </span>
                                            </div>
                                            <span className="h-7 w-7 rounded-full text-foreground text-[12px] font-medium flex text-left">
                                                0h
                                            </span>
                                        </TableHead>
                                    ))}

                                    {/* Total */}
                                    <TableHead className="text-foreground font-normal text-left min-w-25 pb-5 pt-2">
                                        <span className="text-xs text-muted-foreground text-left font-medium">
                                            Total
                                        </span>
                                        <span className="h-7 w-7 rounded-full text-foreground text-[12px] font-medium flex text-left">
                                            0h
                                        </span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>


                            {/* Empty state row */}
                            <TableBody>
                                <TableRow data-testid="empty-time-entries-row" className="hover:bg-transparent">
                                    <TableCell colSpan={weekHeaders.length} className="py-35">
                                        <div data-testid="empty-time-entries-state" className="flex flex-col items-center justify-center gap-3">
                                            <div className="relative h-16 w-16">
                                                <Image
                                                    src="/images/Timesheet/entry-log.svg"
                                                    alt="Timer"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>

                                            <div className="text-center space-y-1">
                                                <p className="text-sm font-medium text-foreground">
                                                    No time entries for this week
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Add time entries to track your work hours
                                                </p>
                                            </div>

                                            <div className="flex flex-row items-center justify-center gap-3">
                                                <Button data-testid="btn-add-task" className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-lg">
                                                    + Add Task
                                                </Button>

                                                <Button data-testid="btn-add-free-text" className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-lg">
                                                    + Add free text
                                                </Button>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}










