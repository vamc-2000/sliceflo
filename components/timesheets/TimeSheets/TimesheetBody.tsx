"use client";

import { useMemo, useState } from "react";
import { DataTable } from "../../layout/DataTable";
import { timesheetColumns } from "./Timesheet-columns";
import { Button } from "@/components/ui/button";
import { TimesheetWithUser } from "@/types/timesheet.types";
import { EmptyTimesheetEntries } from "./EmptyTimesheetEntry";
import { ChevronDown } from "lucide-react";
import { useTimesheetSettingsStore } from "@/stores/timesheet-settings.store";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore } from "@/stores/projects-store";

interface TimesheetBodyProps {
  onAddEntry: (date?: Date) => void;
  entries: TimesheetWithUser[];
}

export function TimesheetBody({ onAddEntry, entries }: TimesheetBodyProps) {
  const { capacityType, hours } = useTimesheetSettingsStore();
  const [openDate, setOpenDate] = useState<string | null>(null);

  // Store lookups for task and project names
  const { tasks } = useTasksStore();
  const { projects } = useProjectsStore();

  // Build lookup maps for O(1) access
  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks]
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id!, p])),
    [projects]
  );

  const isFrozen = useMemo(() => {
    if (entries.length === 0) return false;
    // Disable buttons ONLY if every entry in the week is either "Pending" (without rejectedAt) or "Approved"
    return entries.every(e =>
      (e.status === "Pending" && !e.rejectedAt) || e.status === "Approved"
    );
  }, [entries]);

  const dailyCapacityHours = Number(
    capacityType === "daily"
      ? hours
      : (Number(hours) / 7).toFixed(1)
  );

  const formatDuration = (minutes?: number): string => {
    if (!minutes || minutes <= 0) return "-";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs && mins) return `${hrs}h ${mins}m`;
    if (hrs) return `${hrs}h`;
    return `${mins}m`;
  };

  const toggleDay = (date: string) => {
    setOpenDate((prev) => (prev === date ? null : date));
  };

  /* ---------------- Group by day ---------------- */
  const groupedByDate = useMemo(() => {
    return entries.reduce<Record<string, TimesheetWithUser[]>>((acc, entry) => {
      if (!entry.date) return acc;
      const key = entry.date; // Use "YYYY-MM-DD" directly
      acc[key] ??= [];
      acc[key].push(entry);
      return acc;
    }, {});
  }, [entries]);

  const sortedGroupedByDate = useMemo(() => {
    return Object.entries(groupedByDate).sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime() // latest first
    );
  }, [groupedByDate]);

  if (entries.length === 0) {
    return <EmptyTimesheetEntries onAddEntry={onAddEntry} />;
  }

  return (
    // <div className="h-full min-h-0">
    <div className="flex flex-col">
      {/* {Object.entries(groupedByDate).map(([date, dayEntries]) => { */}
      {sortedGroupedByDate.map(([date, dayEntries]) => {
        const totalMinutes = dayEntries.reduce(
          (sum, entry) => sum + (entry.timeSpentMinutes ?? 0),
          0
        );

        const totalHours = totalMinutes / 60;
        const usageRatio = dailyCapacityHours
          ? totalHours / dailyCapacityHours
          : 0;

        const capacityStyles =
          usageRatio > 1
            ? "bg-destructive/10 text-destructive border border-destructive/30"   // exceeded
            : usageRatio >= 0.8
              ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" // near
              : "bg-muted text-muted-foreground";                                  // normal

        const isOpen = openDate === date;

        return (
          <div
            key={date}
            className="mt-2 rounded-lg border border-border border-l-[5px] border-l-primary"
          >
            {/* HEADER */}
            <button
              type="button"
              onClick={() => toggleDay(date)}
              className="flex w-full items-center justify-between px-3 py-2 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Month + Day badges */}
                <div className="flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center w-13">
                    <span className="text-xs font-semibold bg-muted text-muted-foreground rounded-t-md px-2 py-1 w-full text-center">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="mt-0 text-sm font-semibold bg-primary text-primary-foreground rounded-b-md px-2 py-1 w-full text-center">
                      {new Date(date + "T00:00:00").getDate()}
                    </span>
                  </div>
                </div>

                {/* Date + tasks */}
                <div>
                  <h2 className="text-sm font-semibold">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Total tasks: {dayEntries.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${capacityStyles}`}
                >
                  {formatDuration(totalMinutes)} / {dailyCapacityHours}H
                </div>

                <ChevronDown
                  className={`h-5 w-5 text-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                    }`}
                  strokeWidth={2.5}
                />

              </div>

            </button>

            {/* CONTENT */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
              <div className="overflow-hidden px-3 pb-3">
                <DataTable
                  columns={timesheetColumns}
                  data={dayEntries.map((entry) => {
                    const task = taskMap.get(entry.taskId);
                    const project = projectMap.get(entry.projectId);
                    return {
                      task: task?.name ?? entry.taskId ?? "-",
                      projectName: project?.name,
                      description: entry.notes ?? entry.freetext ?? "",
                      billable: false,
                      tags: [],
                      startTime: "-",
                      endTime: "-",
                      trackedTime: formatDuration(entry.timeSpentMinutes),
                      originalEntry: entry,
                    };
                  })}
                  enableGlobalFilter={false}
                  hidePagination={true}
                  headerRowClassName="bg-[#F6FAFF] hover:bg-[#E3EFFF] dark:bg-muted dark:hover:bg-muted"
                />

                <div className="mt-3">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                    onClick={() => onAddEntry(new Date(date + "T00:00:00"))}
                    disabled={isFrozen}
                  >
                    + Add Entry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

  );
}