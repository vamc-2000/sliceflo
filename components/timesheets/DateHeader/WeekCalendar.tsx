// components/timesheets/DateHeader/WeekCalendar.tsx
"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  startOfWeek,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  isToday,
  format,
} from "date-fns";
import CustomCalendarHeader from "./CustomCalendarHeader";
import { AnimatePresence, motion, easeOut, easeIn, type Variants } from "framer-motion";

interface WeekCalendarProps {
  selectedYear?: number;
  selectedWeek?: { start: Date; end: Date };
  onWeekSelect?: (week: { start: Date; end: Date }) => void;
}

type ViewMode = "days" | "months" | "years";

type Direction = "left" | "right";

export function WeekCalendar({
  selectedYear,
  selectedWeek,
  onWeekSelect,
}: WeekCalendarProps) {
  const [selectedWeekStart, setSelectedWeekStart] = React.useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday — matches backend weekStart
  );

  const [view, setView] = React.useState<ViewMode>("days");

  const [month, setMonth] = React.useState<Date>(() => new Date());
  const [direction, setDirection] = React.useState<Direction>("right");

  const slideVariants: Variants = {
    initial: (direction: "left" | "right") => ({
      opacity: 0,
      x: direction === "right" ? 40 : -40,
      scale: 0.98,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: easeOut,
      },
    },
    exit: (direction: "left" | "right") => ({
      opacity: 0,
      x: direction === "right" ? -40 : 40,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: easeIn,
      },
    }),
  };

  //  Sync with parent selectedWeek
  React.useEffect(() => {
    if (selectedWeek?.start) {
      setSelectedWeekStart(selectedWeek.start);
      setMonth(new Date(selectedWeek.start.getFullYear(), selectedWeek.start.getMonth(), 1));
    }
  }, [selectedWeek]);

  // ⚠️ No onWeekSelect in useEffect (avoid infinite loop)

  React.useEffect(() => {
    if (selectedYear !== undefined) {
      const newMonth = new Date(selectedYear, month.getMonth(), 1);
      setMonth(newMonth);
    }
  }, [selectedYear]);

  const handleSelectDate = (date?: Date) => {
    if (!date) return;

    const targetDate = selectedYear
      ? new Date(selectedYear, date.getMonth(), date.getDate())
      : date;

    const newStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
    const newEnd = endOfWeek(newStart, { weekStartsOn: 1 });

    setSelectedWeekStart(newStart);
    onWeekSelect?.({ start: newStart, end: newEnd });
  };

  const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 }); // Monday

  return (
    <div data-testid="week-calendar" className="w-fit rounded-lg bg-background">
      <CustomCalendarHeader
        month={month}
        setMonth={setMonth}
        view={view}
        setView={setView}
        setDirection={setDirection}
      />

      <AnimatePresence mode="wait">
        {view === "days" && (
          <motion.div
            data-testid="week-calendar-view-days"
            key={`days-${month.toISOString()}`}
            variants={slideVariants}
            custom={direction}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Calendar
              data-testid="week-calendar-days-grid"
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={undefined}
              onSelect={() => { }}
              onDayClick={handleSelectDate}

              className="p-0"

              classNames={{
                root: "p-0",

                // removes the vertical gap stack
                months: "flex flex-col gap-0 mt-0",
                month: "space-y-0",

                caption: "hidden",
                caption_label: "hidden",
                nav: "hidden",

                table: "mt-0",
                head: "h-8",
                head_row: "h-8",
                head_cell: "h-8 text-xs",

                row: "mt-0",
                day_today: "!bg-transparent !text-inherit !ring-0",
              }}

              modifiers={{
                selectedWeek: (date) =>
                  !!(
                    selectedWeekStart &&
                    weekEnd &&
                    isWithinInterval(date, {
                      start: selectedWeekStart,
                      end: weekEnd,
                    })
                  ),
                weekStart: (date) =>
                  !!(selectedWeekStart && isSameDay(date, selectedWeekStart)),
                weekEnd: (date) => !!(weekEnd && isSameDay(date, weekEnd)),
                todayInSelectedWeek: (date) =>
                  !!(
                    isToday(date) &&
                    selectedWeekStart &&
                    weekEnd &&
                    isWithinInterval(date, {
                      start: selectedWeekStart,
                      end: weekEnd,
                    })
                  ),
              }}
              modifiersClassNames={{
                selectedWeek: "rounded-full bg-orange-200 dark:bg-orange-800/50 text-foreground",
                weekStart: "!rounded-full !bg-orange-500 !text-primary-foreground",
                weekEnd: "!rounded-full !bg-orange-500 !text-primary-foreground",
                todayInSelectedWeek:
                  "!bg-orange-200 dark:bg-orange-800/50 !text-foreground !rounded-full !ring-0 !shadow-lg",
              }}
            />
          </motion.div>
        )}


        {view === "months" && (
          <motion.div
            data-testid="week-calendar-view-months"
            key={`months-${month.getFullYear()}`}
            variants={slideVariants}
            custom={direction}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid grid-cols-3 gap-3 p-4"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <button
                data-testid={`btn-calendar-month-${i}`}
                key={i}
                className="rounded-md p-3 hover:bg-gray-200"
                onClick={() => {
                  setMonth(new Date(month.getFullYear(), i, 1));
                  setView("days");
                }}
              >
                {format(new Date(0, i), "MMM")}
              </button>
            ))}
          </motion.div>
        )}

        {view === "years" && (
          <motion.div
            data-testid="week-calendar-view-years"
            key={`years-${Math.floor(month.getFullYear() / 12)}`}
            variants={slideVariants}
            custom={direction}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid grid-cols-3 gap-3 p-4"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const year = month.getFullYear() - 6 + i;
              return (
                <button
                  data-testid={`btn-calendar-year-${year}`}
                  key={year}
                  className="rounded-md p-3 hover:bg-gray-200"
                  onClick={() => {
                    setMonth(new Date(year, month.getMonth(), 1));
                    setView("days");
                  }}
                >
                  {year}
                </button>
              );
            })}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
