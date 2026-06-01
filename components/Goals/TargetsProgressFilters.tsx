"use client";

interface TargetsProgressFiltersProps {
  targetCounts: {
    number: number;
    boolean: number;
    currency: number;
    boards: number;
  };
  totalTargets: number;
  selectedFilter: string | null;
  onFilterChange: (value: string | null) => void;
}

export function TargetsProgressFilters({
  targetCounts,
  totalTargets,
  selectedFilter,
  onFilterChange,
}: TargetsProgressFiltersProps) {
  const getPercentage = (count: number) =>
    totalTargets > 0 ? (count / totalTargets) * 100 : 0;

  const renderFilter = (
    label: string,
    typeKey: "number" | "boolean" | "currency" | "boards",
    barColor: string,
    textColor: string,
    hoverBg: string,
    activeBg: string
  ) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`${textColor} font-medium`}>{label}</span>
        <div className="flex items-center gap-1">
          <span className="font-medium">
            {targetCounts[typeKey]}/{totalTargets}
          </span>
          <button
            type="button"
            onClick={() =>
              onFilterChange(selectedFilter === typeKey ? null : typeKey)
            }
            className={`p-1 rounded transition-colors ${hoverBg} ${
              selectedFilter === typeKey ? activeBg : ""
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={textColor}
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${getPercentage(targetCounts[typeKey])}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-4 gap-4 pt-3">
      {renderFilter(
        "Number",
        "number",
        "bg-gray-500",
        "text-gray-600",
        "hover:bg-gray-100",
        "bg-gray-200"
      )}

      {renderFilter(
        "True / False",
        "boolean",
        "bg-orange-500",
        "text-orange-500",
        "hover:bg-orange-50",
        "bg-orange-100"
      )}

      {renderFilter(
        "Currency",
        "currency",
        "bg-green-500",
        "text-green-600",
        "hover:bg-green-50",
        "bg-green-100"
      )}

      {renderFilter(
        "Boards",
        "boards",
        "bg-yellow-800",
        "text-yellow-800",
        "hover:bg-yellow-50",
        "bg-yellow-100"
      )}
    </div>
  );
}
