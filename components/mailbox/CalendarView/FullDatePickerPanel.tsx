"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  addDays,
  nextSaturday,
  nextSunday,
  format,
} from "date-fns";

export default function FullDatePickerPanel({
  value,
  onChange,
  startDate,
  dueDate,
  tab,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  startDate?: Date | undefined;
  dueDate?: Date | undefined;
  tab: "start" | "due";
}) {
  const [date, setDate] = useState<Date | undefined>(value);

  const selectedRange = startDate && dueDate ? { from: startDate, to: dueDate } : undefined;

  const formatDay = (d: Date) => format(d, "EE");          // e.g. "Friday"
  const formatShortDate = (d: Date) => format(d, "dd, EEE MMM");  // e.g. "Nov 29"

  const shortcuts = [
    { label: "Today", value: new Date(), show: "date" },
    { label: "Later", value: addDays(new Date(), 0), show: "date" },
    { label: "Tomorrow", value: addDays(new Date(), 1), show: "date" },
    { label: "This weekend", value: nextSaturday(new Date()), show: "date" },
    { label: "Next week", value: addDays(new Date(), 7), show: "date" },

    // These should show formatted date
    { label: "Next weekend", value: nextSunday(new Date()), show: "date" },
    { label: "2 weeks", value: addDays(new Date(), 14), show: "date" },
    { label: "4 weeks", value: addDays(new Date(), 28), show: "date" },
  ].map((s) => ({
    ...s,
    display:
      s.show === "day" ? formatDay(s.value) : formatShortDate(s.value),
  }));

  const onSelectShortcut = (value: Date) => {
    setDate(value);
    onChange(value);
  };

  return (
    <div className="flex w-full items-start">
      {/* LEFT SIDE SHORTCUTS */}
      <div className="w-[273px] border-r pl-2 pt-2.5 flex flex-col gap-1">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={() => onSelectShortcut(s.value)}
            className="text-left px-2 py-2 rounded-md hover:bg-gray-100 text-sm flex justify-between"
          >
            <span>{s.label}</span>
            <span className="text-gray-500">{s.display}</span>
          </button>
        ))}
      </div>

      {/* RIGHT SIDE CALENDAR */}
      <div className="flex-1 p-3 pt-0">
        <div className="-mt-1">
          <Calendar
            mode="range"
            // selected={startDate && dueDate ? { from: startDate, to: dueDate } : undefined}
            selected={
  tab === "start"
    ? (startDate ? { from: startDate, to: startDate } : { from: new Date(), to: new Date() })
    : (dueDate ? { from: dueDate, to: dueDate } : { from: new Date(), to: new Date() })
}

            onSelect={(range) => {
              // When user selects a date in "Start" tab, pick `from`
              // When user selects a date in "Due" tab, pick `to`
              if (!range) return;
              if (tab === "start") {
                onChange(range.from ?? undefined);
              } else {
                onChange(range.to ?? undefined);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
