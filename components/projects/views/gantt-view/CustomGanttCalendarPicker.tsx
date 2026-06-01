// components/projects/views/gantt-view/CustomGanttCalendarPicker.tsx
"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, easeOut, easeIn, type Variants } from "framer-motion";
import { format, addWeeks, addDays } from "date-fns";

type PickerMode = "date-grid" | "month-grid" | "year-grid";
type GanttRange = "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly" | "sprint";

interface CustomGanttCalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  range: GanttRange;
  currentLabel?: string;
}

export function CustomGanttCalendarPicker({ 
  selectedDate, 
  onDateSelect, 
  range,
  currentLabel 
}: CustomGanttCalendarPickerProps) {
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

  // Sync month state with selectedDate
  React.useEffect(() => {
    setMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  // Calculate header label based on range and picker mode
  const getHeaderLabel = () => {
    // For daily/weekly/sprint - show the current label when in date selection mode
    if ((range === 'daily' || range === 'weekly' || range === 'sprint') && pickerMode === 'date-grid' && currentLabel) {
      return currentLabel;
    }
    
    // For daily/weekly/sprint in month/year selection mode
    if (range === 'daily' || range === 'weekly' || range === 'sprint') {
      if (pickerMode === "month-grid") {
        return format(month, "yyyy");
      } else if (pickerMode === "year-grid") {
        const centerYear = month.getFullYear();
        return `${centerYear - 6} – ${centerYear + 5}`;
      } else {
        return format(month, "MMMM yyyy");
      }
    }
    
    // For monthly/quarterly
    if (pickerMode === "date-grid") {
      return format(month, "MMMM yyyy");
    } else if (pickerMode === "month-grid") {
      return format(month, "yyyy");
    } else if (pickerMode === "year-grid") {
      const centerYear = month.getFullYear();
      return `${centerYear - 6} – ${centerYear + 5}`;
    }
    
    return format(month, "MMMM yyyy");
  };

  const handleDateSelect = (date?: Date) => {
    if (!date) return;
    onDateSelect(date);
  };

  const handleLeftArrowClick = () => {
    setDirection("left");

    if (range === 'daily') {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      onDateSelect(prevDay);
      setMonth(new Date(prevDay.getFullYear(), prevDay.getMonth(), 1));
    } else if (range === 'weekly') {
      const prevWeek = addWeeks(selectedDate, -1);
      onDateSelect(prevWeek);
      setMonth(new Date(prevWeek.getFullYear(), prevWeek.getMonth(), 1));
    } else if (range === 'sprint') {
      const prevSprint = addDays(selectedDate, -14);
      onDateSelect(prevSprint);
      setMonth(new Date(prevSprint.getFullYear(), prevSprint.getMonth(), 1));
    } else {
      if (pickerMode === "date-grid") {
        if (range === 'monthly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
        } else if (range === 'quarterly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() - 3, 1));
        } else if (range === 'half-yearly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() - 6, 1));
        } else if (range === 'yearly') {
          setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
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

    if (range === 'daily') {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      onDateSelect(nextDay);
      setMonth(new Date(nextDay.getFullYear(), nextDay.getMonth(), 1));
    } else if (range === 'weekly') {
      const nextWeek = addWeeks(selectedDate, 1);
      onDateSelect(nextWeek);
      setMonth(new Date(nextWeek.getFullYear(), nextWeek.getMonth(), 1));
    } else if (range === 'sprint') {
      const nextSprint = addDays(selectedDate, 14);
      onDateSelect(nextSprint);
      setMonth(new Date(nextSprint.getFullYear(), nextSprint.getMonth(), 1));
    } else {
      if (pickerMode === "date-grid") {
        if (range === 'monthly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
        } else if (range === 'quarterly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() + 3, 1));
        } else if (range === 'half-yearly') {
          setMonth(new Date(month.getFullYear(), month.getMonth() + 6, 1));
        } else if (range === 'yearly') {
          setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
        }
      } else if (pickerMode === "month-grid") {
        setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
      } else if (pickerMode === "year-grid") {
        setMonth(new Date(month.getFullYear() + 12, month.getMonth(), 1));
      }
    }
  };

  const handleHeaderClick = () => {
    // For monthly/quarterly/sprint, allow full picker mode cycling
    if (range === 'monthly' || range === 'quarterly' || range === 'half-yearly' || range === 'yearly' || range === 'sprint') {
      if (pickerMode === "date-grid") {
        setPickerMode("month-grid");
      } else if (pickerMode === "month-grid") {
        setPickerMode("year-grid");
      } else if (pickerMode === "year-grid") {
        setPickerMode("date-grid");
      }
    } else if (range === 'daily' || range === 'weekly') {
      // For daily/weekly, clicking header toggles between date picker and month picker
      if (pickerMode === "date-grid") {
        setPickerMode("month-grid");
      } else if (pickerMode === "month-grid") {
        setPickerMode("date-grid");
      }
    }
  };

  return (
    <div className="w-fit rounded-lg">
      {/* Custom Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-0">
        {/* LEFT ARROW */}
        <button
          onClick={handleLeftArrowClick}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* HEADER LABEL */}
        <button
          className="font-medium text-xs hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          onClick={handleHeaderClick}
        >
          {getHeaderLabel()}
        </button>

        {/* RIGHT ARROW */}
        <button
          onClick={handleRightArrowClick}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
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
                className="rounded-md p-3 hover:bg-gray-200 text-xs transition-colors"
                onClick={() => {
                  const newDate = new Date(month.getFullYear(), i, 1);
                  setMonth(newDate);
                  
                  // For monthly/quarterly/half-yearly/yearly, selecting a month should update the selected date
                  if (range === 'monthly' || range === 'quarterly' || range === 'half-yearly' || range === 'yearly') {
                    onDateSelect(newDate);
                  }
                  
                  setPickerMode("date-grid");
                }}
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
                  className="rounded-md p-3 hover:bg-gray-200 text-xs transition-colors"
                  onClick={() => {
                    setMonth(new Date(year, month.getMonth(), 1));
                    setPickerMode("month-grid");
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