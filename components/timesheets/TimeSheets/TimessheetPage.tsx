"use client";

import { EmptyTimesheetEntries } from "./EmptyTimesheetEntry";
import { AddTimesheetEntryModal } from "./AddTimesheetEntryModal";
import { TimesheetBody } from "./TimesheetBody";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { format } from "date-fns"; // For date formatting
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";

export default function TimessheetPage({
  open,
  setOpen,
  selectedWeek,
  prefillDate: externalPrefillDate,
  mode,
  setMode,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  selectedWeek: { start: Date; end: Date };
  prefillDate?: Date;
  mode?: "task" | "freetext";
  setMode?: (mode: "task" | "freetext") => void;
}) {
  const {
    timesheets,
    fetchTimesheets,
    isTimesheetsLoading,
    weekStartFilter
  } = useTimesheetStore();

  const [prefillDate, setPrefillDate] = useState<Date | undefined>(undefined);

  // Resolve: per-date button (internal) takes priority over DateHeader button (external)
  const resolvedPrefillDate = prefillDate ?? externalPrefillDate;

  // Filter timesheets for selected week
  // Compare as "yyyy-MM-dd" strings to avoid timezone-shift issues
  // (new Date("2026-03-23") is UTC midnight, which shifts to the previous day in IST +5:30)
  const filteredTimesheets = timesheets.filter((timesheet) => {
    const entryDateStr = timesheet.date; // already "yyyy-MM-dd"
    const startStr = format(selectedWeek.start, "yyyy-MM-dd");
    const endStr = format(selectedWeek.end, "yyyy-MM-dd");
    return entryDateStr >= startStr && entryDateStr <= endStr;
  });

  // Set week filter and fetch on week change
  useEffect(() => {
    const weekStartIso = format(selectedWeek.start, "yyyy-MM-dd");
    fetchTimesheets({
      weekStart: weekStartIso,
      page: 1,
      limit: 50,
      status: undefined // Clear explicit "Draft" status to fetch "Pending" as well
    });
  }, [selectedWeek.start, fetchTimesheets]);

  const hasEntries = filteredTimesheets.length > 0;

  if (isTimesheetsLoading) {
    return (
      <div data-testid="timesheet-loading" className="flex flex-col items-center justify-center h-full text-center p-12">
        <Loader
          message="Loading timesheets..."
          size="md"
        />
      </div>
    );
  }

  return (
    <div data-testid="timesheet-page-container" className="h-full min-h-0 flex flex-col overflow-hidden">
      {!hasEntries ? (
        <EmptyTimesheetEntries onAddEntry={(m) => {
          setMode?.(m || "task");
          setOpen(true);
        }} />
      ) : (
        <div data-testid="timesheet-entries-container" className="flex-1 min-h-0 overflow-y-auto p-2">
          <TimesheetBody
            entries={filteredTimesheets}
            onAddEntry={(date) => {
              setPrefillDate(date);
              setMode?.("task");
              setOpen(true);
            }}
          />
        </div>
      )}

      <AddTimesheetEntryModal
        open={open}
        onClose={() => {
          setOpen(false);
          setPrefillDate(undefined);
          setMode?.("task");
        }}
        prefillDate={resolvedPrefillDate}
        mode={mode}
      />
    </div>
  );
}
