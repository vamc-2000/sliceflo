"use client";

import { Loader } from "@/components/Loader";
import EmptyTimeEntries from "./EmptyTimeEntries";
import FilledTimeEntries from "./FilledTimeEntries";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { isWithinInterval, startOfDay, endOfDay, format } from "date-fns";
import { useEffect } from "react";

interface Props {
  selectedWeek: { start: Date; end: Date };
}

export default function TimeEntriesBody({ selectedWeek }: Props) {
  const entries = useTimesheetStore((state) => state.timesheets);
  const isLoading = useTimesheetStore((state) => state.isTimesheetsLoading);

  const fetchTimesheets = useTimesheetStore((state) => state.fetchTimesheets);

  useEffect(() => {
    const weekStartIso = format(selectedWeek.start, "yyyy-MM-dd");
    fetchTimesheets({
      weekStart: weekStartIso,
      page: 1,
      status: undefined // Clear the "Draft" filter to include "Pending" entries
    });
  }, [selectedWeek.start, fetchTimesheets]);

  const parseLocalDate = (dateString: string) => {
    const dateStr = dateString.split("T")[0];
    const [year, month, dayPart] = dateStr.split("-");
    return new Date(Number(year), Number(month) - 1, Number(dayPart));
  };

  const weekEntries = entries.filter((entry) => {
    if (!entry.date) return false;

    return isWithinInterval(parseLocalDate(entry.date), {
      start: startOfDay(selectedWeek.start),
      end: endOfDay(selectedWeek.end),
    });
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Loader
          message="Loading timesheets..."
          size="md"
        />
      </div>
    );
  }

  // 2️⃣ Empty state for selected week
  if (weekEntries.length === 0) {
    return <EmptyTimeEntries selectedWeek={selectedWeek} />;
  }

  // 3️⃣ Filled entries
  return <FilledTimeEntries selectedWeek={selectedWeek} />;
}

