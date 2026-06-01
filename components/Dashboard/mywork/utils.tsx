
"use client";

import { cn } from "@/lib/utils";

export const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancel: "bg-red-100 text-red-700 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
      STATUS_STYLES[status] ?? STATUS_STYLES.pending
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { low: "bg-green-500", medium: "bg-yellow-500", high: "bg-red-500" };
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full shrink-0", colors[priority])} />
      <span className="capitalize text-[11px] font-medium text-muted-foreground">{priority}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; className: string }> = {
    urgent: { label: "Urgent", className: "bg-red-100 text-red-600 border-red-200" },
    high: { label: "High", className: "bg-orange-100 text-orange-600 border-orange-200" },
    medium: { label: "Medium", className: "bg-yellow-100 text-yellow-600 border-yellow-200" },
    low: { label: "Low", className: "bg-blue-100 text-blue-600 border-blue-200" },
  };
  const p = map[priority] ?? map.low;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", p.className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{p.label}
    </span>
  );
}
