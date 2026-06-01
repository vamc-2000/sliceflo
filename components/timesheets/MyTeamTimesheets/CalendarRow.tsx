"use client";

import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MyTimesheetView, TeamFilter, TeamView } from "@/app/(pages)/timesheet/create/page";

import { useTimesheetStore } from "@/stores/timesheet-store";
import { WeekCalendar } from "../DateHeader/WeekCalendar";
import { Calendar, List } from "lucide-react";
import { format, getWeek } from "date-fns";
import TeamFilterTabs from "./TeamFilterTabs";

interface DateHeaderProps {
    onAddEntry?: () => void;
    selectedWeek: { start: Date; end: Date };
    setSelectedWeek: (week: { start: Date; end: Date }) => void;
    myView: MyTimesheetView;
    view: TeamView;
    setView: (view: TeamView) => void;
    teamFilter: TeamFilter;
    setTeamFilter: (f: TeamFilter) => void;
}

export function CalendarRow({ onAddEntry, selectedWeek, setSelectedWeek, myView, view, setView, teamFilter, setTeamFilter }: DateHeaderProps) {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    const [openApproval, setOpenApproval] = useState(false);

    const { timesheets } = useTimesheetStore();
    const fetchTimesheets = useTimesheetStore((state) => state.fetchTimesheets);

    const weekNumber = useMemo(() => {
        if (!selectedWeek) return null;
        return getWeek(selectedWeek.start, {
            weekStartsOn: 1,        // Monday
            firstWeekContainsDate: 4,
        });
    }, [selectedWeek]);

    useEffect(() => {
        const weekStart = format(selectedWeek.start, "yyyy-MM-dd");

        fetchTimesheets({
            weekStart,
            status: "Pending",
            page: 1,
            limit: 50,
        });
    }, [selectedWeek.start, fetchTimesheets]);
    const formatShortDate = (date: Date) =>
        new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        }).format(date);

    const shiftWeek = (direction: "prev" | "next") => {

        const delta = direction === "next" ? 7 : -7;

        const newStart = new Date(selectedWeek.start);
        newStart.setDate(newStart.getDate() + delta);

        const newEnd = new Date(selectedWeek.end);
        newEnd.setDate(newEnd.getDate() + delta);

        setSelectedWeek({ start: newStart, end: newEnd });
    };

    const today = new Date();

    return (
        <div className="flex items-center justify-between bg-background px-6 py-1">
            {/* Left */}
            <div className="flex items-center gap-1.5 text-foreground">               {/* Left chevron */}
                <button
                    onClick={() => shiftWeek("prev")}
                    disabled={!selectedWeek}
                    className="p-0.5 disabled:opacity-40"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Date text → opens calendar */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="font-medium px-1">
                            {selectedWeek
                                ? `${formatShortDate(selectedWeek.start)} - ${formatShortDate(selectedWeek.end)}`
                                : "Select week"}
                        </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-3" align="start">
                        <WeekCalendar
                            selectedYear={currentYear}
                            selectedWeek={selectedWeek}
                            onWeekSelect={(week) => {
                                setSelectedWeek(week);
                                setCurrentYear(week.start.getFullYear());
                            }}
                        />
                    </PopoverContent>
                </Popover>

                {/* Right chevron */}
                <button
                    onClick={() => shiftWeek("next")}
                    disabled={!selectedWeek}
                    className="p-0.5 disabled:opacity-40"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {weekNumber && (
                    <span className="text-[15px] font-medium bg-primary/10 text-foreground px-2 py-0.5 rounded-full">
                        Week {weekNumber}
                    </span>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">

                {/* Filter pills — LEFT side */}
                <TeamFilterTabs value={teamFilter} onChange={setTeamFilter} />


            </div>

        </div>
    );
}
