// components/projects/views/calendar-view/CustomCalendarPicker.tsx
"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, easeOut, easeIn, type Variants } from "framer-motion";
import { startOfWeek, endOfWeek, format, addWeeks } from "date-fns";

type PickerMode = "date-grid" | "month-grid" | "year-grid";

interface CustomCalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  view?: 'month' | 'week' | 'day' | 'sprint';
  currentLabel?: string;
}

export function CustomCalendarPicker({ selectedDate, onDateSelect, view = 'month', currentLabel }: CustomCalendarPickerProps) {
  const [pickerMode, setPickerMode] = React.useState<PickerMode>("date-grid");
  const [month, setMonth] = React.useState(selectedDate);
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

  // Add this after the state declarations
  React.useEffect(() => {
    // Sync month state with selectedDate when it changes
    setMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  // Calculate header label based on view and picker mode
  let headerLabel = "";

  if ((view === 'day' || view === 'week') && pickerMode === 'date-grid' && currentLabel) {
    // Day/Week view in date selection mode: show the day/week label
    headerLabel = currentLabel;
  } else if (view === 'day' || view === 'week') {
    // Day/Week view in month/year selection mode: show month/year label
    if (pickerMode === "month-grid") {
      headerLabel = format(month, "yyyy");
    } else if (pickerMode === "year-grid") {
      const centerYear = month.getFullYear();
      headerLabel = `${centerYear - 6} – ${centerYear + 5}`;
    } else {
      // Fallback to month name when picking dates
      headerLabel = format(month, "MMMM yyyy");
    }
  } else {
    // Month/Sprint view: Show based on picker mode
    if (pickerMode === "date-grid") {
      headerLabel = format(month, "MMMM yyyy");
    } else if (pickerMode === "month-grid") {
      headerLabel = format(month, "yyyy");
    } else if (pickerMode === "year-grid") {
      const centerYear = month.getFullYear();
      headerLabel = `${centerYear - 6} – ${centerYear + 5}`;
    }
  }

  const handleDateSelect = (date?: Date) => {
    if (!date) return;
    onDateSelect(date);
  };

  return (
    <div className="w-fit rounded-lg">
      {/* Custom Header - Matching CustomCalendarHeader */}
      <div className="flex items-center justify-between px-3 pt-2 pb-0">
        {/* LEFT ARROW */}
        <button
          onClick={() => {
            setDirection("left");

            if (view === 'day') {
              // Navigate to previous day
              const prevDay = new Date(selectedDate);
              prevDay.setDate(prevDay.getDate() - 1);
              onDateSelect(prevDay);
              // Also update the month if needed for calendar grid
              setMonth(new Date(prevDay.getFullYear(), prevDay.getMonth(), 1));
            } else if (view === 'week') {
              // Navigate to previous week
              const prevWeek = addWeeks(selectedDate, -1);
              onDateSelect(prevWeek);
              // Also update the month if needed for calendar grid
              setMonth(new Date(prevWeek.getFullYear(), prevWeek.getMonth(), 1));
            } else {
              // Month/Sprint navigation based on picker mode
              if (pickerMode === "date-grid") {
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
              } else if (pickerMode === "month-grid") {
                setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
              } else if (pickerMode === "year-grid") {
                setMonth(new Date(month.getFullYear() - 12, month.getMonth(), 1));
              }
            }
          }}
          data-testid="calendar-picker-prev-btn"
        >
          <ChevronLeft />
        </button>

        {/* HEADER LABEL */}
        <button
          className="font-medium"
          onClick={() => {
            // Only allow picker mode switching in month/sprint calendar view
            // For day/week, clicking the label can switch to month-grid to pick a different month
            if (view === 'month' || view === 'sprint') {
              if (pickerMode === "date-grid") {
                setPickerMode("month-grid");
              } else if (pickerMode === "month-grid") {
                setPickerMode("year-grid");
              } else if (pickerMode === "year-grid") {
                setPickerMode("date-grid");
              }
            } else if (view === 'day' || view === 'week') {
              // For day/week view, clicking header shows month picker
              if (pickerMode === "date-grid") {
                setPickerMode("month-grid");
              } else if (pickerMode === "month-grid") {
                setPickerMode("date-grid");
              }
            }
          }}
          data-testid="calendar-picker-mode-btn"
        >
          {headerLabel}
        </button>

        {/* RIGHT ARROW */}
        <button
          onClick={() => {
            setDirection("right");

            if (view === 'day') {
              // Navigate to next day
              const nextDay = new Date(selectedDate);
              nextDay.setDate(nextDay.getDate() + 1);
              onDateSelect(nextDay);
              // Also update the month if needed for calendar grid
              setMonth(new Date(nextDay.getFullYear(), nextDay.getMonth(), 1));
            } else if (view === 'week') {
              // Navigate to next week
              const nextWeek = addWeeks(selectedDate, 1);
              onDateSelect(nextWeek);
              // Also update the month if needed for calendar grid
              setMonth(new Date(nextWeek.getFullYear(), nextWeek.getMonth(), 1));
            } else {
              // Month/Sprint navigation based on picker mode
              if (pickerMode === "date-grid") {
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
              } else if (pickerMode === "month-grid") {
                setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
              } else if (pickerMode === "year-grid") {
                setMonth(new Date(month.getFullYear() + 12, month.getMonth(), 1));
              }
            }
          }}
          data-testid="calendar-picker-next-btn"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Calendar Views with Animation */}
      <AnimatePresence mode="wait">
        {pickerMode === "date-grid" && (
          <motion.div
            key={`date-grid-${month.toISOString()}`}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
              className="p-0"
              classNames={{
                root: "p-0",
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
            className="grid grid-cols-3 gap-3 p-4"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <button
                key={i}
                className="rounded-md p-3 hover:bg-muted text-foreground"
                onClick={() => {
                  setMonth(new Date(month.getFullYear(), i, 1));
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
            className="grid grid-cols-3 gap-3 p-4"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const year = month.getFullYear() - 6 + i;
              return (
                <button
                  key={year}
                  className="rounded-md p-3 hover:bg-muted text-foreground"
                  onClick={() => {
                    setMonth(new Date(year, month.getMonth(), 1));
                    setPickerMode("date-grid");
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
  );
}
