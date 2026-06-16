// components/portfolios/views/PortfolioOverview/PortfolioCalendarPicker.tsx
"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, easeOut, easeIn, type Variants } from "framer-motion";
import { format } from "date-fns";

type PickerMode = "date-grid" | "month-grid" | "year-grid";

interface PortfolioCalendarPickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

export function PortfolioCalendarPicker({ selectedDate, onDateSelect, disabled }: PortfolioCalendarPickerProps) {
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
      setMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  let headerLabel = "";
  if (pickerMode === "date-grid") {
    headerLabel = format(month, "MMMM yyyy");
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

  return (
    <div className="w-fit rounded-lg">
      <div className="flex items-center justify-between px-3 pt-2 pb-0">
        <button
          onClick={() => {
            setDirection("left");
            if (pickerMode === "date-grid") {
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
            } else if (pickerMode === "month-grid") {
              setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
            } else if (pickerMode === "year-grid") {
              setMonth(new Date(month.getFullYear() - 12, month.getMonth(), 1));
            }
          }}
          data-testid="calendar-picker-prev-btn"
        >
          <ChevronLeft />
        </button>

        <button
          className="font-medium"
          onClick={() => {
            if (pickerMode === "date-grid") {
              setPickerMode("month-grid");
            } else if (pickerMode === "month-grid") {
              setPickerMode("year-grid");
            } else if (pickerMode === "year-grid") {
              setPickerMode("date-grid");
            }
          }}
          data-testid="calendar-picker-mode-btn"
        >
          {headerLabel}
        </button>

        <button
          onClick={() => {
            setDirection("right");
            if (pickerMode === "date-grid") {
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
            } else if (pickerMode === "month-grid") {
              setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
            } else if (pickerMode === "year-grid") {
              setMonth(new Date(month.getFullYear() + 12, month.getMonth(), 1));
            }
          }}
          data-testid="calendar-picker-next-btn"
        >
          <ChevronRight />
        </button>
      </div>

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
              disabled={disabled}
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
