"use client";

import { ColumnDef } from "@tanstack/react-table";
import { getWeek } from "date-fns";
import clsx from "clsx";
import { ApprovalRow } from "@/types/timesheet.types";
import { useState, useEffect, useMemo } from "react";
import { useTimesheetStore } from "@/stores/timesheet-store";
import type { TimesheetWithUser } from "@/types/timesheet.types";
import EmptyApprovals from "./EmptyApprovals";
import { DataTableForTS } from "./DataTableForTS";
import { Loader } from "@/components/Loader";

// ─── Helper: map a TimesheetWithUser entry → ApprovalRow ──────────────────────

function minutesToHrsMin(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function mapToApprovalRow(entries: TimesheetWithUser[]): ApprovalRow {
    const first = entries[0];
    const totalMinutes = entries.reduce((sum, e) => sum + e.timeSpentMinutes, 0);
    const trackedHrs = minutesToHrsMin(totalMinutes);

    const status: ApprovalRow["status"] =
        first.status === "Rejected" ? "Rejected" :
            first.status === "Approved" ? "Approved" :
                first.status === "Pending" ? "Pending" :
                    "Partially Approved";



    const weekStartObj = new Date(first.weekStart);
    const weekNumber = getWeek(weekStartObj, {
        weekStartsOn: 1,
        firstWeekContainsDate: 4,
    });
    const details = `Week ${weekNumber} Timesheet`;

    const WEEKLY_CAPACITY_MINS = 40 * 60;
    const weeklyOvercapacityMins = Math.max(0, totalMinutes - WEEKLY_CAPACITY_MINS);

    return {
        details,
        tracked: trackedHrs,
        capacity: "40h",
        billable: "—",
        overcapacity: weeklyOvercapacityMins > 0 ? minutesToHrsMin(weeklyOvercapacityMins) : "—",
        status,

        userId: first.userId,
        weekStart: first.weekStart,
        approverIds: first.approverIds || [],
    };
}


const MID_COL_WIDTH = 120;

export const getApprovalColumns = (
    onDetailsClick: (row: ApprovalRow) => void
): ColumnDef<ApprovalRow>[] => [
        {
            accessorKey: "details",
            header: () => (
                <div className="w-50">
                    <span className="text-foreground">Details</span>
                </div>
            ),
            size: 200,
            minSize: 200,
            maxSize: 200,
            cell: ({ row }) => (
                <div className="flex items-center px-0">
                    <span
                        className="truncate text-foreground font-medium cursor-pointer hover:underline"
                        onClick={() => onDetailsClick(row.original)}
                    >
                        {row.original.details}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "tracked",
            header: () => <div className="text-center text-foreground">Tracked</div>,
            size: MID_COL_WIDTH,
            minSize: MID_COL_WIDTH,
            maxSize: MID_COL_WIDTH,
            cell: ({ getValue }) => <span className="text-center block">{getValue() as string}</span>,
        },
        {
            accessorKey: "capacity",
            header: () => <div className="text-center text-foreground">Capacity</div>,
            size: MID_COL_WIDTH,
            minSize: MID_COL_WIDTH,
            maxSize: MID_COL_WIDTH,
            cell: ({ getValue }) => <span className="text-center block">{getValue() as string}</span>,
        },
        {
            accessorKey: "billable",
            header: () => <div className="text-center text-foreground">Billable</div>,
            size: MID_COL_WIDTH,
            minSize: MID_COL_WIDTH,
            maxSize: MID_COL_WIDTH,
            cell: ({ getValue }) => <span className="text-center block">{getValue() as string}</span>,
        },
        {
            accessorKey: "overcapacity",
            header: () => <div className="text-center text-foreground">Overcapacity</div>,
            size: MID_COL_WIDTH,
            minSize: MID_COL_WIDTH,
            maxSize: MID_COL_WIDTH,
            cell: ({ getValue }) => <span className="text-center block">{getValue() as string}</span>,
        },
        {
            accessorKey: "status",
            header: () => (
                <div className="text-center text-foreground">Status</div>
            ),
            size: 170,
            minSize: 170,
            maxSize: 170, // important
            cell: ({ row, getValue }) => {
                const status = getValue() as ApprovalRow["status"];
                return (
                    <div className="flex justify-center items-center">
                        <div
                            className={clsx(
                                "inline-flex items-center justify-center",
                                "w-37.5 h-7",
                                "rounded-sm text-xs font-medium",
                                status === "Approved" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                                status === "Rejected" && "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400",
                                status === "Pending" && "bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400",
                                status === "Partially Approved" && "bg-muted text-muted-foreground"
                            )}
                        >
                            {status}
                        </div>
                    </div>
                );
            },
        },
    ];

const STATUSES = ["All", "Pending", "Approved", "Rejected"];

export default function ApprovalsPage({ onNavigateToTimesheet }: { onNavigateToTimesheet?: (weekStart: string) => void }) {
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const timesheets = useTimesheetStore((state) => state.timesheets);
    const isLoading = useTimesheetStore((state) => state.isTimesheetsLoading);
    const fetchTimesheets = useTimesheetStore((state) => state.fetchTimesheets);

    // Fetch Approved and Rejected timesheets separately.
    // This allows the network tab to show specific status filters
    // while the 'append' flag ensures we store both in the state.
    useEffect(() => {
        const loadData = async () => {
            // Fetch Approved, Rejected and Pending without any date filtering
            await fetchTimesheets({ status: "Approved", weekStart: undefined });
            await fetchTimesheets({ status: "Rejected", weekStart: undefined, append: true });
            await fetchTimesheets({ status: "Pending", weekStart: undefined, append: true });
        };
        loadData();
    }, [fetchTimesheets]);

    const approvalRows = useMemo<ApprovalRow[]>(() => {
        const groups: Record<string, TimesheetWithUser[]> = {};

        timesheets
            .filter((t) => t.status === "Approved" || t.status === "Rejected" || t.status === "Pending")
            .forEach((t) => {
                const key = `${t.userId}_${t.weekStart}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            });

        return Object.values(groups)
            .map(mapToApprovalRow)
            .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    }, [timesheets]);

    const columns = useMemo(() => getApprovalColumns(
        (row) => {
            if (onNavigateToTimesheet) {
                onNavigateToTimesheet(row.weekStart);
            }
        }
    ), [onNavigateToTimesheet]);

    const statusButtons = (
        <div className="inline-flex rounded-sm bg-muted p-1">
            {STATUSES.map((status) => {
                const isAll = status === "All";
                const isActive = isAll
                    ? statusFilter === null
                    : statusFilter === status;

                return (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(isAll ? null : status)}
                        className={clsx(
                            "px-4 h-7 text-sm font-medium transition rounded-sm text-muted-foreground cursor-pointer",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-foreground hover:bg-muted/80"
                        )}
                    >
                        {status}
                    </button>
                );
            })}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
                <Loader
                    message="Loading approvals..."
                    size="md"
                />
            </div>
        );
    }

    if (!approvalRows.length) {
        return (
            <EmptyApprovals />
        );
    }

    return (
        <>
            <div className="px-1 py-2">
                <DataTableForTS
                    columns={columns}
                    data={approvalRows}
                    searchPlaceholder="Search"
                    enableGlobalFilter
                    filterColumn="status"
                    externalFilterValue={statusFilter}
                    toolbarActions={statusButtons}
                />
            </div>
        </>
    );
}