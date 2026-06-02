"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { type DateRange } from "react-day-picker";
import { format, isValid } from "date-fns";
import { Calendar1, X } from "lucide-react";

export default function RangeCalendar({
    value,
    onChange,
}: {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
}) {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Track which month to show on the calendar
    const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(
        value?.from ?? new Date()
    );

    // Sync input strings when value prop changes (e.g., selection or external reset)
    useEffect(() => {
        setFromDate(value?.from ? format(value.from, "yyyy-MM-dd") : "");
        setToDate(value?.to ? format(value.to, "yyyy-MM-dd") : "");
        if (value?.from) {
            setCalendarMonth(value.from);
        }
    }, [value]);

    const handleDayClick = (day: Date) => {
        const from = value?.from;
        const to = value?.to;

        // If range already exists → start new range
        if (from && to) {
            onChange({ from: day, to: undefined });
            return;
        }

        // If no start date
        if (!from) {
            onChange({ from: day, to: undefined });
            return;
        }

        // If same date clicked twice
        if (day.getTime() === from.getTime()) {
            onChange({ from: day, to: day });
            return;
        }

        // Select end date
        if (day < from) {
            onChange({ from: day, to: from });
        } else {
            onChange({ from: from, to: day });
        }
    };

    const isActive = !!value?.from || !!value?.to;

    return (
        <div data-testid="range-calendar-container" className="flex flex-col gap-3 p-2 border-0 border-b-5 border-primary rounded-xl">
            {/* Start + End Date Fields */}
            <div data-testid="range-calendar-inputs" className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <Calendar1 className={`absolute left-2 top-1/2 -translate-y-1/2 size-5 p-[3px] rounded bg-background ${fromDate ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} />
                    <Input
                        data-testid="range-calendar-start-input"
                        placeholder="Start date"
                        className="pl-8"
                        value={fromDate}
                        onChange={(e) => {
                            setFromDate(e.target.value);
                            const parsed = new Date(e.target.value);
                            if (isValid(parsed)) {
                                onChange({ from: parsed, to: value?.to });
                            }
                        }}
                    />
                    {fromDate && (
                        <X
                            data-testid="range-calendar-clear-start"
                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground size-3.5"
                            onClick={() => {
                                setFromDate("");
                                onChange({ from: undefined, to: value?.to });
                            }}
                        />
                    )}
                </div>

                <div className="relative">
                    <Calendar1 className={`absolute left-2 top-1/2 -translate-y-1/2 size-5 p-[3px] rounded bg-background ${toDate ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} />
                    <Input
                        data-testid="range-calendar-end-input"
                        placeholder="End date"
                        className="pl-8"
                        value={toDate}
                        onChange={(e) => {
                            setToDate(e.target.value);
                            const parsed = new Date(e.target.value);
                            if (isValid(parsed)) {
                                onChange({ from: value?.from, to: parsed });
                            }
                        }}
                    />
                    {toDate && (
                        <X
                            data-testid="range-calendar-clear-end"
                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground size-3.5"
                            onClick={() => {
                                setToDate("");
                                onChange({ from: value?.from, to: undefined });
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Calendar */}
            <Calendar
                data-testid="range-calendar-picker"
                key={`${value?.from?.toISOString() ?? "none"}-${value?.to?.toISOString() ?? "none"}`}
                mode="range"
                numberOfMonths={2}
                selected={value}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                showOutsideDays={false}
                className="rounded-lg border shadow-sm"
                modifiersClassNames={{
                    today: "bg-[#F68C1F] text-white font-semibold rounded-full hover:bg-primary/90",
                }}
                onDayClick={handleDayClick}
            />
        </div>
    );
}
