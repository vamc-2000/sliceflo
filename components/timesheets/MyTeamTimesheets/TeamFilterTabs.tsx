// TeamFilterTabs.tsx
"use client";

import { TeamFilter } from "@/app/(pages)/timesheet/create/page";

const FILTER_OPTIONS: { label: string; value: TeamFilter; count?: number }[] = [
  { label: "All", value: "all" },
  { label: "Awaiting Approval", value: "awaiting_approval" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function TeamFilterTabs({
  value,
  onChange,
}: {
  value: TeamFilter;
  onChange: (v: TeamFilter) => void;
}) {
  return (
    <div data-testid="team-filter-tabs" className="flex items-center gap-1 bg-gray-200 rounded-lg p-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          data-testid={`btn-team-filter-${opt.value}`}
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium
            transition-colors whitespace-nowrap
            ${value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-background/60"
            }
          `}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              data-testid={`badge-team-filter-${opt.value}`}
              className={`text-xs rounded-full px-1.5 py-0.5 leading-none
                ${value === opt.value
                  ? "bg-background/20 text-primary-foreground"
                  : "bg-gray-400/30 text-gray-600"
                }`}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}