// "use client"

// import * as React from "react"

// import { Calendar } from "@/components/ui/calendar"

// export default function CalendarHeader() {
//   const [date, setDate] = React.useState<Date | undefined>(new Date())

//   return (
//     <Calendar
//       mode="single"
//       selected={date}
//       onSelect={setDate}
//       className="rounded-md border-0 shadow-none"
//       captionLayout="dropdown"
//     />
//   )
// }

"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  addDays,
  nextSaturday,
  nextSunday,
  format,
} from "date-fns";

export default function CalendarHeader() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const shortcuts = [
    { label: "Today", value: new Date() },
    { label: "Tomorrow", value: addDays(new Date(), 1) },
    { label: "This weekend", value: nextSaturday(new Date()) },
    { label: "Next week", value: addDays(new Date(), 7) },
    { label: "Next weekend", value: nextSunday(new Date()) },
    { label: "2 weeks", value: addDays(new Date(), 14) },
    { label: "4 weeks", value: addDays(new Date(), 28) },
  ];

  return (
    <div className="flex gap-4 p-4">
      {/* LEFT SHORTCUT LIST */}
      <div className="w-40 border-r pr-4">
        {shortcuts.map((item) => (
          <div
            key={item.label}
            className="py-1.5 px-2 text-sm rounded-lg hover:bg-accent cursor-pointer"
            onClick={() => setDate(item.value)}
          >
            {item.label}
          </div>
        ))}

        {/* <div className="pt-3 text-sm text-blue-600 cursor-pointer hover:underline">
          Set Recurring
        </div> */}
      </div>

      {/* RIGHT CALENDAR */}
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md"
      />
    </div>
  );
}
