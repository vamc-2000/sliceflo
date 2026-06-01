import { format } from "date-fns";

export function formatDateWithSuffix(dateStr: string | Date): string {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;

    if (isNaN(date.getTime())) {
        return "-";
    }

    const day = date.getDate();

    const daySuffix =
        day % 10 === 1 && day !== 11
            ? "st"
            : day % 10 === 2 && day !== 12
              ? "nd"
              : day % 10 === 3 && day !== 13
                ? "rd"
                : "th";
    return `${day}${daySuffix} ${format(date, "MMMM yyyy")}`;
}