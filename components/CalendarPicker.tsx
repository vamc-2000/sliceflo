"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  easeOut,
  easeIn,
  type Variants,
} from "framer-motion";
import { format, addWeeks, addDays } from "date-fns";
import { cn } from "@/lib/utils";

type PickerMode = "date-grid" | "month-grid" | "year-grid";
type CalendarView = 'month' | 'week' | 'day' | 'sprint';
type GanttRange = "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly" | "sprint";

interface CalendarPickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  view?: CalendarView;
  range?: GanttRange;
  currentLabel?: string;
  className?: string;
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  disabled,
  view,
  range,
  currentLabel,
  className,
}: CalendarPickerProps) {
  const [pickerMode, setPickerMode] = React.useState<PickerMode>("date-grid");
  const [month, setMonth] = React.useState(selectedDate || new Date());
  const [direction, setDirection] = React.useState<"left" | "right">("right");

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

  React.useEffect(() => {
    if (selectedDate) {
      setMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }
  }, [selectedDate]);

  let headerLabel = "";
  if (pickerMode === "date-grid") {
    if ((view === 'day' || view === 'week' || range === 'daily' || range === 'weekly' || range === 'sprint') && currentLabel) {
      headerLabel = currentLabel;
    } else {
      headerLabel = format(month, "MMMM yyyy");
    }
  } else if (pickerMode === "month-grid") {
    headerLabel = format(month, "yyyy");
  } else if (pickerMode === "year-grid") {
    const centerYear = month.getFullYear();
    headerLabel = `${centerYear - 6} – ${centerYear + 5}`;
  }

  const handleDateSelect = (date?: Date) => {
    if (!date) return;
    onDateSelect(date);
  };

  const handleLeftArrowClick = () => {
    setDirection("left");

    const activeView = view || (range === 'daily' ? 'day' : range === 'weekly' ? 'week' : range === 'sprint' ? 'sprint' : 'month');

    if (activeView === 'day') {
      if (selectedDate) {
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        onDateSelect(prevDay);
        setMonth(new Date(prevDay.getFullYear(), prevDay.getMonth(), 1));
      }
    } else if (activeView === 'week') {
      if (selectedDate) {
        const prevWeek = addWeeks(selectedDate, -1);
        onDateSelect(prevWeek);
        setMonth(new Date(prevWeek.getFullYear(), prevWeek.getMonth(), 1));
      }
    } else if (activeView === 'sprint') {
      if (selectedDate) {
        const prevSprint = addDays(selectedDate, -14);
        onDateSelect(prevSprint);
        setMonth(new Date(prevSprint.getFullYear(), prevSprint.getMonth(), 1));
      }
    } else {
      if (pickerMode === "date-grid") {
        if (range === 'quarterly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() - 3, 1));
        } else if (range === 'half-yearly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() - 6, 1));
        } else if (range === 'yearly') {
          setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
        } else {
          setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
        }
      } else if (pickerMode === "month-grid") {
        setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
      } else if (pickerMode === "year-grid") {
        setMonth(new Date(month.getFullYear() - 12, month.getMonth(), 1));
      }
    }
  };

  const handleRightArrowClick = () => {
    setDirection("right");

    const activeView = view || (range === 'daily' ? 'day' : range === 'weekly' ? 'week' : range === 'sprint' ? 'sprint' : 'month');

    if (activeView === 'day') {
      if (selectedDate) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        onDateSelect(nextDay);
        setMonth(new Date(nextDay.getFullYear(), nextDay.getMonth(), 1));
      }
    } else if (activeView === 'week') {
      if (selectedDate) {
        const nextWeek = addWeeks(selectedDate, 1);
        onDateSelect(nextWeek);
        setMonth(new Date(nextWeek.getFullYear(), nextWeek.getMonth(), 1));
      }
    } else if (activeView === 'sprint') {
      if (selectedDate) {
        const nextSprint = addDays(selectedDate, 14);
        onDateSelect(nextSprint);
        setMonth(new Date(nextSprint.getFullYear(), nextSprint.getMonth(), 1));
      }
    } else {
      if (pickerMode === "date-grid") {
        if (range === 'quarterly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() + 3, 1));
        } else if (range === 'half-yearly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() + 6, 1));
        } else if (range === 'yearly') {
          setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
        } else {
          setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
        }
      } else if (pickerMode === "month-grid") {
        setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
      } else if (pickerMode === "year-grid") {
        setMonth(new Date(month.getFullYear() + 12, month.getMonth(), 1));
      }
    }
  };

  const handleHeaderClick = () => {
    if (pickerMode === "date-grid") {
      setPickerMode("month-grid");
    } else if (pickerMode === "month-grid") {
      setPickerMode("year-grid");
    } else if (pickerMode === "year-grid") {
      setPickerMode("date-grid");
    }
  };

  return (
    <div className={cn(
      "w-[224px]",
      "rounded-lg overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between px-3 h-10">
        <button
          onClick={handleLeftArrowClick}
          className="p-1 rounded hover:bg-muted transition-colors"
          data-testid="calendar-picker-prev-btn"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          className="font-medium text-xs hover:bg-muted px-2 py-1 rounded transition-colors"
          onClick={handleHeaderClick}
          data-testid="calendar-picker-mode-btn"
        >
          {headerLabel}
        </button>

        <button
          onClick={handleRightArrowClick}
          className="p-1 rounded hover:bg-muted transition-colors"
          data-testid="calendar-picker-next-btn"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {pickerMode === "date-grid" && (
            <motion.div
              key={`date-grid-${month.toISOString()}`}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex items-center justify-center pt-2"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
                disabled={disabled}
                className="p-0"
                classNames={{
                  root: "p-0",
                  months: "flex flex-col gap-0 mt-0",
                  month: "space-y-0",
                  month_caption: "hidden",
                  caption: "hidden",
                  caption_label: "hidden",
                  nav: "hidden",
                  table: "mt-0",
                  head: "h-8",
                  head_row: "h-8",
                  head_cell: "h-8 text-xs",
                  row: "mt-0",
                  day: "text-xs",
                  day_button: "text-xs",
                  day_today: "!bg-transparent !text-inherit !ring-0 mt-0",
                }}
              />
            </motion.div>
          )}

          {pickerMode === "month-grid" && (
            <motion.div
              key={`month-grid-${month.getFullYear()}`}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid grid-cols-3 gap-2 p-3 w-full"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <button
                  key={i}
                  className="rounded-md p-3 hover:bg-muted text-foreground text-xs"
                  onClick={() => {
                    const newDate = new Date(month.getFullYear(), i, 1);
                    setMonth(newDate);

                    const isGanttRangeSelect = range === 'monthly' || range === 'quarterly' || range === 'half-yearly' || range === 'yearly';
                    if (isGanttRangeSelect) {
                      onDateSelect(newDate);
                    }

                    setPickerMode("date-grid");
                  }}
                  data-testid={`calendar-picker-month-option-${i}`}
                >
                  {format(new Date(0, i), "MMM")}
                </button>
              ))}
            </motion.div>
          )}

          {pickerMode === "year-grid" && (
            <motion.div
              key={`year-grid-${Math.floor(month.getFullYear() / 12)}`}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid grid-cols-3 gap-2 p-3 w-full"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const year = month.getFullYear() - 6 + i;
                return (
                  <button
                    key={year}
                    className="rounded-md p-3 hover:bg-muted text-foreground text-xs"
                    onClick={() => {
                      setMonth(new Date(year, month.getMonth(), 1));
                      setPickerMode("month-grid");
                    }}
                    data-testid={`calendar-picker-year-option-${year}`}
                  >
                    {year}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

