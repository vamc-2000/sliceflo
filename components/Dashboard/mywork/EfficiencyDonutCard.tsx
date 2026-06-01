
// "use client";

// import { useState } from "react";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// import { EFFICIENCY_MONTHS, EFFICIENCY_DONUT } from "./dashboard-data";

// export function EfficiencyDonutCard() {
//   const [month, setMonth] = useState("January");
//   const data = EFFICIENCY_DONUT[month];

//   const size = 180;
//   const radius = 70;
//   const stroke = 18;
//   const cx = size / 2;
//   const cy = size / 2;
//   const circumference = 2 * Math.PI * radius;

//   let currentOffset = 0;
//   const segments = data.segments.map((s) => {
//     const dash = (s.value / 100) * circumference;
//     const gap = circumference - dash;
//     const offset = currentOffset;
//     currentOffset -= dash;
//     return { ...s, dash, gap, offset };
//   });

//   return (
//     <div className="flex flex-col gap-3">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-xs text-muted-foreground">January – June 2026</p>
//           <p className="text-sm font-bold mt-0.5">Project Efficiency</p>
//         </div>
//         <Select value={month} onValueChange={setMonth}>
//           <SelectTrigger className="h-8 w-32 text-xs gap-1">
//             <span className="h-3 w-3 rounded-sm bg-gray-800 inline-block shrink-0" />
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             {EFFICIENCY_MONTHS.map((m) => (
//               <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="flex items-center justify-center py-2">
//         <div className="relative">
//           <svg width={size} height={size} className="-rotate-90">
//             <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
//             {segments.map((s, i) => (
//               <circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} strokeLinecap="round" />
//             ))}
//           </svg>
//           <div className="absolute inset-0 flex flex-col items-center justify-center">
//             <span className="text-3xl font-bold leading-none">{data.total}</span>
//             <span className="text-xs text-muted-foreground mt-1">Visitors</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useMemo } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTasksStore } from "@/stores/tasks-store";

export function EfficiencyDonutCard() {
  const tasks = useTasksStore((s) => s.tasks);
    const [month, setMonth] = useState(() => {
    return new Date().toLocaleDateString("en-US", { month: "long" });
  });


  const normalize = (s: string) => s?.toLowerCase().replace(/-/g, " ") ?? "";

  // Build donut data from real tasks
  const donutDataByMonth = useMemo(() => {
    const monthMap: Record<string, {
      total: number;
      completed: number;
      inprogress: number;
      todo: number;
      overdue: number;
    }> = {};

    tasks.forEach((task) => {
      if (!task.createdAt) return;

      const monthKey = new Date(task.createdAt).toLocaleDateString("en-US", { month: "long" });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { total: 0, completed: 0, inprogress: 0, todo: 0, overdue: 0 };
      }

      const status = task.status?.toLowerCase().trim() ?? "";
      monthMap[monthKey].total += 1;

      if (status === "done" || status === "wont_do") {
        monthMap[monthKey].completed += 1;
      } else if (status === "inprogress" || status === "review") {
        monthMap[monthKey].inprogress += 1;
      } else if (status === "todo" || status === "backlog") {
        monthMap[monthKey].todo += 1;
      }
      // unknown statuses (abc, xyz) → counted in total but no segment
    });

    return monthMap;
  }, [tasks]);

  // Available months from real data (sorted by calendar order)
  const MONTH_ORDER = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const availableMonths = MONTH_ORDER.filter((m) => donutDataByMonth[m]);

  // Current month data
  const raw = donutDataByMonth[month];
  const total = raw?.total ?? 0;

  const segments = raw
    ? [
      { color: "#1f2937", value: raw.completed, label: "Completed" },
      { color: "#6b7280", value: raw.inprogress, label: "In Progress" },
      { color: "#d1d5db", value: raw.todo, label: "Todo" },
      { color: "#ef4444", value: raw.overdue, label: "Overdue" },
    ]
    : [];

  // SVG donut calculation
  const size = 180;
  const radius = 70;
  const stroke = 18;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const svgSegments = segments.map((s) => {
    const percent = total > 0 ? (s.value / total) * 100 : 0;
    const dash = (percent / 100) * circumference;
    const gap = circumference - dash;
    const offset = currentOffset;
    currentOffset -= dash;
    return { ...s, dash, gap, offset };
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Task breakdown by month</p>
          <p className="text-sm font-bold mt-0.5">Project Efficiency</p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-8 w-32 text-xs gap-1">
            <span className="h-3 w-3 rounded-sm bg-gray-800 inline-block shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.length > 0
              ? availableMonths.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))
              : MONTH_ORDER.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Donut */}
      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
            {total === 0 ? (
              // Empty state ring
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
            ) : (
              svgSegments.map((s, i) => (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={-s.offset}
                  strokeLinecap="round"
                />
              ))
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold leading-none">{total}</span>
            <span className="text-xs text-muted-foreground mt-1">Tasks</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-1.5 px-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-xs font-medium ml-auto">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <p className="text-center text-xs text-muted-foreground">No tasks for {month}</p>
      )}
    </div>
  );
}