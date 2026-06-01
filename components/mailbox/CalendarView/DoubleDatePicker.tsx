"use client";

import { useState } from "react";
import { Calendar1 } from "lucide-react";
import FullDatePickerPanel from "./FullDatePickerPanel";
import { format } from "date-fns";

export default function DoubleDatePicker({
  startDate,
  dueDate,
  onStartChange,
  onDueChange,
}: {
  startDate: Date | undefined;
  dueDate: Date | undefined;
  onStartChange: (d: Date | undefined) => void;
  onDueChange: (d: Date | undefined) => void;
}) {
  const [tab, setTab] = useState<"start" | "due">("due");

  const handleDateChange = (date: Date | undefined) => {
    if (tab === "start") {
      onStartChange(date);
    } else {
      onDueChange(date);
    }
  };

  return (
    <div className="w-full">
      {/* TOP TABS */}
      <div className="flex gap-3 p-2 border-b">
        <button
          className={`flex-1 px-2 py-2 text-sm font-medium flex items-center justify-between gap-2
            bg-muted rounded-md border border-border
            ${tab === "start" ? "ring-1 ring-primary" : ""}`}
          onClick={() => setTab("start")}
        >
          <div className="flex items-center gap-2">
            <Calendar1 size={14} />
            {startDate ? (
              <span className="text-foreground">{format(startDate, "dd MMM yyyy")}</span>
            ) : (
              <span className="text-muted-foreground">Start date</span>
            )}
          </div>
        </button>

        <button
          className={`flex-1 px-2 py-2 text-sm font-medium flex items-center justify-between gap-2
            bg-muted rounded-md border border-border
            ${tab === "due" ? "ring-1 ring-primary" : ""}`}
          onClick={() => setTab("due")}
        >
          <div className="flex items-center gap-2">
            <Calendar1 size={14} />
            {dueDate ? (
              <span className="text-foreground">{format(dueDate, "dd MMM yyyy")}</span>
            ) : (
              <span className="text-muted-foreground">End date</span>
            )}
          </div>          
        </button>
      </div>

      {/* DATE PICKER PANEL MUST BE OUTSIDE THE TABS DIV */}
      <FullDatePickerPanel
        value={tab === "start" ? startDate : dueDate}
        startDate={startDate}
        dueDate={dueDate}
        tab={tab}
        onChange={handleDateChange}
      />
    </div>
  );
}
