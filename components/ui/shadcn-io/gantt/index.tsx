"use client";

import {
  DndContext,
  MouseSensor,
  useDraggable,
  useSensor,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { useMouse, useThrottle, useWindowScroll } from "@uidotdev/usehooks";
import {
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInWeeks,
  differenceInMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfWeek,
  getWeek,
  format,
  formatDate,
  formatDistance,
  getDate,
  getDaysInMonth,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  differenceInQuarters,
  differenceInYears,
  addQuarters,
  addYears,
} from "date-fns";
import { atom, useAtom } from "jotai";
import throttle from "lodash.throttle";
import { PlusIcon, TrashIcon } from "lucide-react";
import type {
  CSSProperties,
  FC,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  RefObject,
} from "react";
import {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "@/components/ui/card";
import { isWeekend } from "@/utils/timezone-utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

const draggingAtom = atom(false);
const scrollXAtom = atom(0);

export const useGanttDragging = () => useAtom(draggingAtom);
export const useGanttScrollX = () => useAtom(scrollXAtom);

export interface GanttStatus {
  id: string;
  name: string;
  color: string;
}

export interface GanttFeature {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: GanttStatus;
  lane?: string; // Optional: features with the same lane will share a row
  color?: string; // Phase color or other custom color
}

export interface GanttMarkerProps {
  id: string;
  date: Date;
  label: string;
}

export type Range =
  | "daily"
  | "weekly"
  | "sprint"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

export type TimelineData = {
  year: number;
  quarters: {
    months: {
      days: number;
    }[];
  }[];
}[];

export interface GanttContextProps {
  zoom: number;
  range: Range;
  columnWidth: number;
  sidebarWidth: number;
  headerHeight: number;
  rowHeight: number;
  onAddItem: ((date: Date) => void) | undefined;
  placeholderLength: number;
  timelineData: TimelineData;
  ref: RefObject<HTMLDivElement | null> | null;
  scrollToFeature?: (feature: GanttFeature) => void;
  weekendDays?: number[];
}

const getsDaysIn = (range: Range) => {
  let fn: (date: Date | number | string) => number = (
    _date: Date | number | string,
  ) => 1;

  if (range === "weekly") fn = (date: Date | number | string) => 7;
  else if (range === "sprint") fn = (date: Date | number | string) => 14;
  else if (range === "monthly") {
    fn = getDaysInMonth as any;
  } else if (range === "quarterly") {
    fn = (date: Date | number | string) => {
      const start = startOfQuarter(date);
      const end = endOfMonth(addMonths(start, 2));
      return differenceInDays(end, start) + 1;
    };
  } else if (range === "half-yearly") {
    fn = (date: Date | number | string) => {
      const dt = new Date(date);
      const isFirstHalf = dt.getMonth() < 6;
      const start = new Date(dt.getFullYear(), isFirstHalf ? 0 : 6, 1);
      const end = endOfMonth(
        new Date(dt.getFullYear(), isFirstHalf ? 5 : 11, 1),
      );
      return differenceInDays(end, start) + 1;
    };
  } else if (range === "yearly") {
    fn = (date: Date | number | string) => {
      const dt = new Date(date);
      const start = startOfYear(dt);
      const end = endOfMonth(new Date(dt.getFullYear(), 11, 1));
      return differenceInDays(end, start) + 1;
    };
  }

  return fn;
};

const getAbsoluteColIndex = (date: Date, range: Range) => {
  const isWeekly = range === "weekly";
  const daysPerCol = isWeekly ? 7 : 14;

  const baselineYear = 2000;
  let totalPriorColumns = 0;
  let currentDate = new Date(baselineYear, 0, 1);
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth();

  while (
    currentDate.getFullYear() < targetYear ||
    currentDate.getMonth() < targetMonth
  ) {
    const daysInM = getDaysInMonth(currentDate);
    const colsInM = Math.ceil(daysInM / daysPerCol);
    totalPriorColumns += colsInM;
    currentDate = addMonths(currentDate, 1);
  }

  const dayOfMonth = date.getDate();
  const colIndex = Math.floor((dayOfMonth - 1) / daysPerCol);
  return totalPriorColumns + colIndex;
};

const getDifferenceIn = (range: Range) => {
  let fn: (
    later: Date | number | string,
    earlier: Date | number | string,
  ) => number = differenceInDays as any;

  if (range === "weekly" || range === "sprint") {
    fn = (later: Date | number | string, earlier: Date | number | string) => {
      return (
        getAbsoluteColIndex(new Date(later), range) -
        getAbsoluteColIndex(new Date(earlier), range)
      );
    };
  } else if (range === "monthly") {
    fn = differenceInMonths as any;
  } else if (range === "quarterly") {
    fn = differenceInQuarters as any;
  } else if (range === "half-yearly") {
    fn = (
      dateLeft: Date | number | string,
      dateRight: Date | number | string,
    ) => {
      return Math.floor(differenceInMonths(dateLeft, dateRight) / 6);
    };
  } else if (range === "yearly") {
    fn = differenceInYears as any;
  }

  return fn;
};

const getInnerDifferenceIn = (range: Range) => {
  let fn: (
    later: Date | number | string,
    earlier: Date | number | string,
  ) => number = differenceInHours as any;

  if (range === "weekly" || range === "sprint") fn = differenceInDays as any;
  else if (
    range === "monthly" ||
    range === "quarterly" ||
    range === "half-yearly" ||
    range === "yearly"
  ) {
    fn = differenceInDays as any;
  }

  return fn;
};

const getStartOf = (range: Range) => {
  let fn: (date: Date | number | string) => Date = startOfDay as any;

  if (range === "monthly") {
    fn = startOfMonth as any;
  } else if (range === "quarterly") {
    fn = startOfQuarter as any;
  } else if (range === "half-yearly") {
    fn = (date: Date | number | string) => {
      const dt = new Date(date);
      return new Date(dt.getFullYear(), dt.getMonth() < 6 ? 0 : 6, 1);
    };
  } else if (range === "yearly") {
    fn = startOfYear as any;
  }

  return fn;
};

const getEndOf = (range: Range) => {
  let fn: (date: Date | number | string) => Date = endOfDay as any;

  if (range === "monthly") {
    fn = endOfMonth as any;
  } else if (range === "quarterly") {
    fn = (date: Date | number | string) =>
      endOfMonth(addMonths(startOfQuarter(date), 2)) as any;
  } else if (range === "half-yearly") {
    fn = (date: Date | number | string) => {
      const dt = new Date(date);
      return endOfMonth(
        new Date(dt.getFullYear(), dt.getMonth() < 6 ? 5 : 11, 1),
      );
    };
  } else if (range === "yearly") {
    fn = (date: Date | number | string) => {
      const dt = new Date(date);
      return endOfMonth(new Date(dt.getFullYear(), 11, 1));
    };
  }

  return fn;
};

const getAddRange = (range: Range) => {
  let fn: (date: Date | number | string, amount: number) => Date =
    addDays as any;

  if (range === "weekly" || range === "sprint") fn = addWeeks as any;
  else if (range === "monthly") {
    fn = addMonths as any;
  } else if (range === "quarterly") {
    fn = addQuarters as any;
  } else if (range === "half-yearly") {
    fn = (date: Date | number | string, amount: number) =>
      addMonths(date, amount * 6);
  } else if (range === "yearly") {
    fn = addYears as any;
  }

  return fn;
};

const getDateByMousePosition = (context: GanttContextProps, mouseX: number) => {
  const timelineStartDate = new Date(context.timelineData[0].year, 0, 1);
  const columnWidth = (context.columnWidth * context.zoom) / 100;

  if (context.range === "weekly" || context.range === "sprint") {
    const isWeekly = context.range === "weekly";
    const daysPerCol = isWeekly ? 7 : 14;

    const colIndex = Math.floor(mouseX / columnWidth);
    let pixelOffsetInCol = mouseX % columnWidth;
    if (pixelOffsetInCol < 0) pixelOffsetInCol += columnWidth;

    let remainingCols = colIndex;
    let currentDate = new Date(
      timelineStartDate.getFullYear(),
      timelineStartDate.getMonth(),
      1,
    );

    let loopCount = 0;
    while (loopCount < 240) {
      const daysInM = getDaysInMonth(currentDate);
      const colsInM = Math.ceil(daysInM / daysPerCol);
      if (remainingCols < colsInM) {
        const monthColIndex = remainingCols;
        const startDayOfColumn = 1 + monthColIndex * daysPerCol;
        const pixelsPerDay = columnWidth / daysPerCol;
        const dayOffsetInColumn = Math.floor(
          pixelOffsetInCol / pixelsPerDay + 0.001,
        );
        const day = Math.min(daysInM, startDayOfColumn + dayOffsetInColumn);
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      }
      remainingCols -= colsInM;
      currentDate = addMonths(currentDate, 1);
      loopCount++;
    }
  }

  const offset = Math.floor(mouseX / columnWidth);
  const daysIn = getsDaysIn(context.range);
  const addRange = getAddRange(context.range);
  const month = addRange(timelineStartDate, offset);
  const daysInMonth = daysIn(month);
  const pixelsPerDay = Math.round(columnWidth / daysInMonth);
  const dayOffset = Math.floor((mouseX % columnWidth) / pixelsPerDay);
  const actualDate = addDays(month, dayOffset);

  return actualDate;
};

const createInitialTimelineData = (today: Date) => {
  const data: TimelineData = [];

  data.push(
    { year: today.getFullYear() - 1, quarters: new Array(4).fill(null) },
    { year: today.getFullYear(), quarters: new Array(4).fill(null) },
    { year: today.getFullYear() + 1, quarters: new Array(4).fill(null) },
  );

  for (const yearObj of data) {
    yearObj.quarters = new Array(4).fill(null).map((_, quarterIndex) => ({
      months: new Array(3).fill(null).map((_, monthIndex) => {
        const month = quarterIndex * 3 + monthIndex;
        return {
          days: getDaysInMonth(new Date(yearObj.year, month, 1)),
        };
      }),
    }));
  }

  return data;
};

export const getOffset = (
  date: Date,
  timelineStartDate: Date,
  context: GanttContextProps,
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;
  const differenceIn = getDifferenceIn(context.range);

  if (context.range === "weekly" || context.range === "sprint") {
    const fullColumns = differenceIn(date, timelineStartDate);
    const innerOffset = calculateInnerOffset(
      date,
      context.range,
      parsedColumnWidth,
    );
    return fullColumns * parsedColumnWidth + innerOffset;
  }

  const startOf = getStartOf(context.range);
  const daysIn = getsDaysIn(context.range);

  const fullColumns = differenceIn(startOf(date), timelineStartDate);

  if (context.range === "daily") {
    return parsedColumnWidth * fullColumns;
  }

  // Calculate pixel offset within the current column (e.g. within a quarter or year)
  const startOfColumn = startOf(date);
  const daysSinceStart = differenceInDays(date, startOfColumn);
  const totalDaysInColumn = daysIn(date);
  const pixelsPerDay = parsedColumnWidth / totalDaysInColumn;

  return fullColumns * parsedColumnWidth + daysSinceStart * pixelsPerDay;
};

export const getWidth = (
  startAt: Date,
  endAt: Date | null,
  context: GanttContextProps,
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;

  if (!endAt) {
    return parsedColumnWidth * 2;
  }

  if (context.range === "weekly" || context.range === "sprint") {
    const timelineStart = new Date(context.timelineData[0].year, 0, 1);
    const startOffset = getOffset(startAt, timelineStart, context);
    const nextDay = addDays(endAt, 1);
    const endOffset = getOffset(nextDay, timelineStart, context);
    return Math.max(
      parsedColumnWidth / (context.range === "weekly" ? 7 : 14),
      endOffset - startOffset,
    );
  }

  const differenceIn = getDifferenceIn(context.range);
  const daysIn = getsDaysIn(context.range);
  const startOf = getStartOf(context.range);

  if (context.range === "daily") {
    const delta = differenceIn(endAt, startAt) + 1; // +1 for inclusive end day
    return parsedColumnWidth * (delta ? delta : 1);
  }

  if (isSameDay(startAt, endAt)) {
    const daysInColumn = daysIn(startAt);
    return parsedColumnWidth / daysInColumn;
  }

  if (isSameDay(startOf(startAt), startOf(endAt))) {
    const daysDelta = differenceInDays(endAt, startAt);
    const daysInColumn = daysIn(startAt);
    return daysDelta * (parsedColumnWidth / daysInColumn);
  }

  // Multi-column spanning
  const startOfColumnStart = startOf(startAt);
  const startOfColumnEnd = startOf(endAt);

  const fullRangeOffset = differenceIn(startOfColumnEnd, startOfColumnStart);

  const daysInStartColumn = daysIn(startAt);
  const startRangeOffset =
    daysInStartColumn - differenceInDays(startAt, startOfColumnStart);
  const pixelsPerDayInStartColumn = parsedColumnWidth / daysInStartColumn;

  const daysInEndColumn = daysIn(endAt);
  const endRangeOffset = differenceInDays(endAt, startOf(endAt));
  const pixelsPerDayInEndColumn = parsedColumnWidth / daysInEndColumn;

  return (
    (fullRangeOffset - 1) * parsedColumnWidth +
    startRangeOffset * pixelsPerDayInStartColumn +
    endRangeOffset * pixelsPerDayInEndColumn
  );
};

const calculateInnerOffset = (
  date: Date,
  range: Range,
  columnWidth: number,
) => {
  if (range === "weekly" || range === "sprint") {
    const daysPerCol = range === "weekly" ? 7 : 14;
    const dayOfMonth = date.getDate();
    const colIndex = Math.floor((dayOfMonth - 1) / daysPerCol);
    const startDayOfColumn = 1 + colIndex * daysPerCol;
    const daysSinceStart = dayOfMonth - startDayOfColumn;
    return (daysSinceStart / daysPerCol) * columnWidth;
  }

  const startOf = getStartOf(range);
  const daysIn = getsDaysIn(range);

  const startOfRange = startOf(date);
  const totalRangeDays = daysIn(date);
  const daysSinceStart = differenceInDays(date, startOfRange);

  return (daysSinceStart / totalRangeDays) * columnWidth;
};

export const GanttContext = createContext<GanttContextProps>({
  zoom: 100,
  range: "monthly",
  columnWidth: 50,
  headerHeight: 36,
  sidebarWidth: 300,
  rowHeight: 36,
  onAddItem: undefined,
  placeholderLength: 2,
  timelineData: [],
  ref: null,
  scrollToFeature: undefined,
  weekendDays: [0, 6],
});

export interface GanttContentHeaderProps {
  renderHeaderItem: (index: number) => ReactNode;
  title: string;
  columns: number;
}

export const GanttContentHeader: FC<GanttContentHeaderProps> = ({
  title,
  columns,
  renderHeaderItem,
}) => {
  const id = useId();

  return (
    <div
      className="sticky top-0 z-20 grid w-full shrink-0 grid-rows-2 bg-muted/50 border-b"
      style={{ height: "var(--gantt-header-height)" }}
    >
      <div className="flex items-center px-4 border-b">
        <div
          className="sticky inline-flex whitespace-nowrap font-medium text-slate-500 text-[10px] uppercase tracking-wider"
          style={{
            left: "var(--gantt-sidebar-width)",
          }}
        >
          {title}
        </div>
      </div>
      <div
        className="grid w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            className="shrink-0 border-border/50 border-r py-1 text-center text-xs flex items-center justify-center font-medium text-slate-600"
            key={`${id}-${index}`}
          >
            {renderHeaderItem(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters
      .flatMap((quarter) => quarter.months)
      .map((month, index) => (
        <div className="relative flex flex-col" key={`${year.year}-${index}`}>
          <GanttContentHeader
            columns={month.days}
            renderHeaderItem={(item: number) => (
              <div className="flex items-center justify-center gap-1">
                <p>
                  {format(addDays(new Date(year.year, index, 1), item), "d")}
                </p>
                <p className="text-muted-foreground">
                  {format(
                    addDays(new Date(year.year, index, 1), item),
                    "EEEEEE",
                  )}
                </p>
              </div>
            )}
            title={format(new Date(year.year, index, 1), "MMMM yyyy")}
          />
        </div>
      )),
  );
};

const WeeklyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters
      .flatMap((quarter) => quarter.months)
      .map((month, monthIndex) => {
        // Calculate weeks in this month
        const firstDayOfMonth = new Date(year.year, monthIndex, 1);
        const daysInMonth = month.days;

        // Calculate number of weeks (roughly)
        const weeks = Math.ceil(daysInMonth / 7);

        return (
          <div
            className="relative flex flex-col"
            key={`${year.year}-${monthIndex}`}
          >
            <GanttContentHeader
              columns={weeks}
              renderHeaderItem={(item: number) => {
                // Calculate the start date of each week
                const weekStartDate = addDays(
                  new Date(year.year, monthIndex, 1),
                  item * 7,
                );

                // Get the actual week start (Monday) and end (Sunday)
                const weekStart = startOfWeek(weekStartDate, {
                  weekStartsOn: 1,
                }); // 1 = Monday
                const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });

                // Get week number
                const weekNumber = getWeek(weekStartDate, { weekStartsOn: 1 });

                return (
                  <div className="flex items-center justify-between h-full px-2">
                    <p className="text-xs">
                      {format(weekStart, "d")}-{format(weekEnd, "d")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      W{weekNumber}
                    </p>
                  </div>
                );
              }}
              title={format(new Date(year.year, monthIndex, 1), "MMMM yyyy")}
            />
          </div>
        );
      }),
  );
};

const SprintHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return (
    <>
      {gantt.timelineData.map((year) =>
        year.quarters
          .flatMap((quarter) => quarter.months)
          .map((month, monthIndex) => {
            const firstDayOfMonth = new Date(year.year, monthIndex, 1);
            const daysInMonth = month.days;

            // Number of 14-day sprints in this month (ceil to cover whole month)
            const sprints = Math.ceil(daysInMonth / 14);

            return (
              <div
                key={`${year.year}-${monthIndex}`}
                className="relative flex flex-col"
              >
                <GanttContentHeader
                  title={format(firstDayOfMonth, "MMMM yyyy")}
                  columns={sprints}
                  renderHeaderItem={(item) => {
                    // item is 0..sprints-1
                    const sprintIndex = item; // zero-based
                    const sprintStartDate = addDays(
                      firstDayOfMonth,
                      sprintIndex * 14,
                    );

                    // clamp sprint end to month end
                    const rawSprintEnd = addDays(sprintStartDate, 13);
                    const monthEnd = endOfMonth(firstDayOfMonth);
                    const sprintEndDate =
                      rawSprintEnd > monthEnd ? monthEnd : rawSprintEnd;

                    const sprintNumberInYear =
                      Math.floor(
                        differenceInDays(
                          sprintStartDate,
                          new Date(year.year, 0, 1),
                        ) / 14,
                      ) + 1;

                    return (
                      <div className="flex items-center justify-between h-full px-2">
                        <p className="text-xs">
                          {format(sprintStartDate, "d")}-
                          {format(sprintEndDate, "d")}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Sprint {sprintNumberInYear}
                        </p>
                      </div>
                    );
                  }}
                />
              </div>
            );
          }),
      )}
    </>
  );
};

const MonthlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) => (
    <div className="relative flex flex-col" key={year.year}>
      <GanttContentHeader
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
        renderHeaderItem={(item: number) => (
          <p>{format(new Date(year.year, item, 1), "MMM")}</p>
        )}
        title={`${year.year}`}
      />
    </div>
  ));
};

const QuarterlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) => (
    <div className="relative flex flex-col" key={year.year}>
      <GanttContentHeader
        columns={4}
        renderHeaderItem={(item: number) => <p>Q{item + 1}</p>}
        title={`${year.year}`}
      />
    </div>
  ));
};

const HalfYearlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) => (
    <div className="relative flex flex-col" key={year.year}>
      <GanttContentHeader
        columns={2}
        renderHeaderItem={(item: number) => (
          <p>
            H{item + 1} ({item === 0 ? "Jan-Jun" : "Jul-Dec"})
          </p>
        )}
        title={`${year.year}`}
      />
    </div>
  ));
};

const YearlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return (
    <div className="relative flex flex-col">
      <GanttContentHeader
        columns={gantt.timelineData.length}
        renderHeaderItem={(item: number) => (
          <p>{gantt.timelineData[item].year}</p>
        )}
        title="Timeline"
      />
    </div>
  );
};

const headers: Record<Range, FC> = {
  daily: DailyHeader,
  weekly: WeeklyHeader,
  sprint: SprintHeader,
  monthly: MonthlyHeader,
  quarterly: QuarterlyHeader,
  "half-yearly": HalfYearlyHeader,
  yearly: YearlyHeader,
};

export const GanttVerticalGrid: FC = () => {
  const gantt = useContext(GanttContext);
  const Grid = verticalGrids[gantt.range];

  return (
    <div className="absolute inset-0 z-0 h-full w-max flex pointer-events-none">
      <Grid />
    </div>
  );
};

export interface GanttHeaderProps {
  className?: string;
}

export const GanttHeader: FC<GanttHeaderProps> = ({ className }) => {
  const gantt = useContext(GanttContext);
  const Header = headers[gantt.range];

  return (
    <div
      className={cn(
        "sticky top-0 z-[40] flex h-[var(--gantt-header-height)] w-max bg-muted/50 shadow-sm border-b",
        className,
      )}
    >
      <Header />
    </div>
  );
};

export interface GanttSidebarItemProps {
  feature: GanttFeature;
  onSelectItem?: (id: string) => void;
  className?: string;
}

export const GanttSidebarItem: FC<GanttSidebarItemProps> = ({
  feature,
  onSelectItem,
  className,
}) => {
  const gantt = useContext(GanttContext);
  const tempEndAt =
    feature.endAt && isSameDay(feature.startAt, feature.endAt)
      ? addDays(feature.endAt, 1)
      : feature.endAt;
  const duration = tempEndAt
    ? formatDistance(feature.startAt, tempEndAt)
    : `${formatDistance(feature.startAt, new Date())} so far`;

  const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      // Scroll to the feature in the timeline
      gantt.scrollToFeature?.(feature);
      // Call the original onSelectItem callback
      onSelectItem?.(feature.id);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter") {
      // Scroll to the feature in the timeline
      gantt.scrollToFeature?.(feature);
      // Call the original onSelectItem callback
      onSelectItem?.(feature.id);
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2.5 p-2.5 text-xs hover:bg-secondary",
        className,
      )}
      key={feature.id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{
        height: "var(--gantt-row-height)",
      }}
    >
      {/* <Checkbox onCheckedChange={handleCheck} className="shrink-0" /> */}
      <div
        className="pointer-events-none h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: feature.status.color,
        }}
      />
      <p className="pointer-events-none flex-1 truncate text-left font-medium">
        {feature.name}
      </p>
      <p className="pointer-events-none text-muted-foreground">{duration}</p>
    </div>
  );
};

export const GanttSidebarHeader: FC = () => (
  <div
    className="sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2.5 border-border/50 border-b bg-backdrop/90 p-2.5 font-medium text-muted-foreground text-xs backdrop-blur-sm"
    style={{ height: "var(--gantt-header-height)" }}
  >
    {/* <Checkbox className="shrink-0" /> */}
    <p className="flex-1 truncate text-left">Issues</p>
    <p className="shrink-0">Duration</p>
  </div>
);

export interface GanttSidebarGroupProps {
  children: ReactNode;
  name: string;
  className?: string;
}

export const GanttSidebarGroup: FC<GanttSidebarGroupProps> = ({
  children,
  name,
  className,
}) => (
  <div className={className}>
    <p
      className="w-full truncate p-2.5 text-left font-medium text-muted-foreground text-xs"
      style={{ height: "var(--gantt-row-height)" }}
    >
      {name}
    </p>
    <div className="divide-y divide-border/50">{children}</div>
  </div>
);

export interface GanttSidebarProps {
  children: ReactNode;
  className?: string;
}

export const GanttSidebar: FC<GanttSidebarProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "sticky left-0 z-30 h-max min-h-full overflow-clip border-border/50 border-r bg-background/90 backdrop-blur-md",
      className,
    )}
    data-roadmap-ui="gantt-sidebar"
  >
    <GanttSidebarHeader />
    <div className="space-y-4">{children}</div>
  </div>
);

export interface GanttAddFeatureHelperProps {
  top: number;
  className?: string;
}

export const GanttAddFeatureHelper: FC<GanttAddFeatureHelperProps> = ({
  top,
  className,
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();

  const handleClick = () => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    const currentDate = getDateByMousePosition(gantt, x);

    gantt.onAddItem?.(currentDate);
  };

  return (
    <div
      className={cn(
        "absolute top-0 w-full px-0.5 pointer-events-none",
        className,
      )}
      ref={mouseRef}
      style={{
        marginTop: -gantt.rowHeight / 2,
        transform: `translateY(${top}px)`,
      }}
    >
      <button
        className="flex h-full w-full items-center justify-center rounded-md border border-dashed p-2 pointer-events-auto"
        onClick={handleClick}
        type="button"
      >
        <PlusIcon
          className="pointer-events-none select-none text-muted-foreground"
          size={16}
        />
      </button>
    </div>
  );
};

export interface GanttColumnProps {
  index: number;
  isColumnSecondary?: (item: number) => boolean;
}

export const GanttColumn: FC<GanttColumnProps> = ({
  index,
  isColumnSecondary,
}) => {
  const gantt = useContext(GanttContext);
  const [dragging] = useGanttDragging();
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();
  const [hovering, setHovering] = useState(false);
  const [windowScroll] = useWindowScroll();

  const handleMouseEnter = () => setHovering(true);
  const handleMouseLeave = () => setHovering(false);

  const top = useThrottle(
    mousePosition.y -
      (mouseRef.current?.getBoundingClientRect().y ?? 0) -
      (windowScroll.y ?? 0),
    10,
  );

  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden border-b border-border/50",
        isColumnSecondary?.(index) ? "bg-muted-foreground/10" : "bg-transparent",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={mouseRef}
      role="button"
      tabIndex={0}
    >
      {!dragging && hovering && gantt.onAddItem ? (
        <GanttAddFeatureHelper top={top} />
      ) : null}
    </div>
  );
};

export interface GanttColumnsProps {
  columns: number;
  isColumnSecondary?: (item: number) => boolean;
}

export const GanttColumns: FC<GanttColumnsProps> = ({
  columns,
  isColumnSecondary,
}) => {
  const id = useId();

  return (
    <div
      className="divide grid h-full w-full divide-x divide-border/50 pointer-events-none"
      style={{
        gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <GanttColumn
          index={index}
          isColumnSecondary={isColumnSecondary}
          key={`${id}-${index}`}
        />
      ))}
    </div>
  );
};

const verticalGrids: Record<Range, FC> = {
  daily: () => {
    const gantt = useContext(GanttContext);
    return gantt.timelineData.map((year) =>
      year.quarters
        .flatMap((q) => q.months)
        .map((m, monthIndex) => (
          <GanttColumns
            key={`${year.year}-${monthIndex}`}
            columns={m.days}
            isColumnSecondary={(colIndex) => {
              const date = new Date(year.year, monthIndex, colIndex + 1);
              return isWeekend(date);
            }}
          />
        )),
    );
  },
  weekly: () => {
    const gantt = useContext(GanttContext);
    return gantt.timelineData.map((year) =>
      year.quarters
        .flatMap((q) => q.months)
        .map((m, i) => (
          <GanttColumns
            key={`${year.year}-${i}`}
            columns={Math.ceil(m.days / 7)}
          />
        )),
    );
  },
  sprint: () => {
    const gantt = useContext(GanttContext);
    return gantt.timelineData.map((year) =>
      year.quarters
        .flatMap((q) => q.months)
        .map((m, i) => (
          <GanttColumns
            key={`${year.year}-${i}`}
            columns={Math.ceil(m.days / 14)}
          />
        )),
    );
  },
  monthly: () => {
    const gantt = useContext(GanttContext);
    return gantt.timelineData.map((year) => (
      <GanttColumns key={year.year} columns={12} />
    ));
  },
  quarterly: () => {
    const gantt = useContext(GanttContext);
    return gantt.timelineData.map((year) => (
      <GanttColumns key={year.year} columns={4} />
    ));
  },
  "half-yearly": () => {
    const gantt = useContext(GanttContext);
    return gantt.timelineData.map((year) => (
      <GanttColumns key={year.year} columns={2} />
    ));
  },
  yearly: () => {
    const gantt = useContext(GanttContext);
    return <GanttColumns columns={gantt.timelineData.length} />;
  },
};

export interface GanttCreateMarkerTriggerProps {
  onCreateMarker: (date: Date) => void;
  className?: string;
}

export const GanttCreateMarkerTrigger: FC<GanttCreateMarkerTriggerProps> = ({
  onCreateMarker,
  className,
}) => {
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();
  const [windowScroll] = useWindowScroll();
  const x = useThrottle(
    mousePosition.x -
      (mouseRef.current?.getBoundingClientRect().x ?? 0) -
      (windowScroll.x ?? 0),
    10,
  );

  const date = getDateByMousePosition(gantt, x);

  const handleClick = () => onCreateMarker(date);

  return (
    <div
      className={cn(
        "group pointer-events-none absolute top-0 left-0 h-full w-full select-none overflow-visible",
        className,
      )}
      ref={mouseRef}
    >
      <div
        className="-ml-2 pointer-events-auto sticky top-6 z-20 flex w-4 flex-col items-center justify-center gap-1 overflow-visible opacity-0 group-hover:opacity-100"
        style={{ transform: `translateX(${x}px)` }}
      >
        <button
          className="z-50 inline-flex h-4 w-4 items-center justify-center rounded-full bg-card"
          onClick={handleClick}
          type="button"
        >
          <PlusIcon className="text-muted-foreground" size={12} />
        </button>
        <div className="whitespace-nowrap rounded-full border border-border/50 bg-background/90 px-2 py-1 text-foreground text-xs backdrop-blur-lg">
          {formatDate(date, "MMM dd, yyyy")}
        </div>
      </div>
    </div>
  );
};

export interface GanttFeatureDragHelperProps {
  featureId: GanttFeature["id"];
  direction: "left" | "right";
  date: Date | null;
}

export const GanttFeatureDragHelper: FC<GanttFeatureDragHelperProps> = ({
  direction,
  featureId,
  date,
}) => {
  const [, setDragging] = useGanttDragging();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `feature-drag-helper-${featureId}`,
  });

  const isPressed = Boolean(attributes["aria-pressed"]);

  useEffect(() => setDragging(isPressed), [isPressed, setDragging]);

  return (
    <div
      className={cn(
        "group -translate-y-1/2 !cursor-col-resize absolute top-1/2 z-[3] h-full w-6 rounded-md outline-none",
        direction === "left" ? "-left-2.5" : "-right-2.5",
      )}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-[80%] w-1 rounded-sm bg-muted-foreground opacity-0 transition-all",
          direction === "left" ? "left-2.5" : "right-2.5",
          direction === "left" ? "group-hover:left-0" : "group-hover:right-0",
          isPressed && (direction === "left" ? "left-0" : "right-0"),
          "group-hover:opacity-100",
          isPressed && "opacity-100",
        )}
      />
      {date && (
        <div
          className={cn(
            "-translate-x-1/2 absolute top-10 hidden whitespace-nowrap rounded-lg border border-border/50 bg-background/90 px-2 py-1 text-foreground text-xs backdrop-blur-lg group-hover:block",
            isPressed && "block",
          )}
        >
          {format(date, "MMM dd, yyyy")}
        </div>
      )}
    </div>
  );
};

export type GanttFeatureItemCardProps = Pick<GanttFeature, "id" | "color"> & {
  children?: ReactNode;
  hideLabels?: boolean;
  disabled?: boolean;
};

export const GanttFeatureItemCard: FC<GanttFeatureItemCardProps> = ({
  id,
  color,
  children,
  hideLabels,
  disabled,
}) => {
  const [, setDragging] = useGanttDragging();
  const { attributes, listeners, setNodeRef } = useDraggable({ id, disabled });
  const isPressed = Boolean(attributes["aria-pressed"]);

  useEffect(() => {
    if (!disabled) {
      setDragging(isPressed);
    }
  }, [isPressed, setDragging, disabled]);

  return (
    <Card
      className={cn(
        "h-full w-full rounded-md p-2 text-xs shadow-none",
        hideLabels && "p-1 [&>div>*]:hidden",
      )}
      style={{ backgroundColor: color || "white" }}
    >
      <div
        className={cn(
          "flex h-full w-full items-center justify-between gap-2 text-left font-medium",
          isPressed && !disabled && "cursor-grabbing",
          !disabled && "cursor-grab",
          hideLabels && "invisible",
        )}
        {...(!disabled ? attributes : {})}
        {...(!disabled ? listeners : {})}
        ref={!disabled ? setNodeRef : undefined}
      >
        {children}
      </div>
    </Card>
  );
};

export type GanttFeatureItemProps = GanttFeature & {
  onMove?: (id: string, startDate: Date, endDate: Date | null) => void;
  children?: ReactNode;
  className?: string;
  hideLabels?: boolean; // Dynamic hide
  disabled?: boolean;
};

export const GanttFeatureItem: FC<GanttFeatureItemProps> = ({
  onMove,
  children,
  className,
  hideLabels = false, // Default to false for backward compatibility
  disabled,
  ...feature
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData],
  );
  const [startAt, setStartAt] = useState<Date>(feature.startAt);
  const [endAt, setEndAt] = useState<Date | null>(feature.endAt);

  useEffect(() => {
    setStartAt(feature.startAt);
    setEndAt(feature.endAt);
  }, [feature.startAt, feature.endAt]);

  // Memoize expensive calculations
  const width = useMemo(
    () => getWidth(startAt, endAt, gantt),
    [startAt, endAt, gantt],
  );
  const offset = useMemo(
    () => getOffset(startAt, timelineStartDate, gantt),
    [startAt, timelineStartDate, gantt],
  );

  const addRange = useMemo(() => getAddRange(gantt.range), [gantt.range]);
  const [mousePosition] = useMouse<HTMLDivElement>();

  const [previousMouseX, setPreviousMouseX] = useState(0);
  const [previousStartAt, setPreviousStartAt] = useState(startAt);
  const [previousEndAt, setPreviousEndAt] = useState(endAt);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const handleItemDragStart = useCallback(() => {
    setPreviousMouseX(mousePosition.x);
    setPreviousStartAt(startAt);
    setPreviousEndAt(endAt);
  }, [mousePosition.x, startAt, endAt]);

  const handleItemDragMove = useCallback(() => {
    const currentDate = getDateByMousePosition(gantt, mousePosition.x);
    const originalDate = getDateByMousePosition(gantt, previousMouseX);
    const delta =
      gantt.range === "daily"
        ? getDifferenceIn(gantt.range)(currentDate, originalDate)
        : getInnerDifferenceIn(gantt.range)(currentDate, originalDate);
    const newStartDate = addDays(previousStartAt, delta);
    const newEndDate = previousEndAt ? addDays(previousEndAt, delta) : null;

    setStartAt(newStartDate);
    setEndAt(newEndDate);
  }, [gantt, mousePosition.x, previousMouseX, previousStartAt, previousEndAt]);

  const onDragEnd = useCallback(
    () => onMove?.(feature.id, startAt, endAt),
    [onMove, feature.id, startAt, endAt],
  );

  const handleLeftDragMove = useCallback(() => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    const newStartAt = getDateByMousePosition(gantt, x);

    setStartAt(newStartAt);
  }, [gantt, mousePosition.x, scrollX]);

  const handleRightDragMove = useCallback(() => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    const newEndAt = getDateByMousePosition(gantt, x);

    setEndAt(newEndAt);
  }, [gantt, mousePosition.x, scrollX]);

  return (
    <div
      className={cn("relative flex w-max min-w-full py-0.5", className)}
      style={{ height: "var(--gantt-row-height)" }}
    >
      <div
        className="pointer-events-auto absolute top-0.5"
        style={{
          height: "calc(var(--gantt-row-height) - 4px)",
          width: Math.round(width),
          left: Math.round(offset),
        }}
      >
        {onMove && !disabled && (
          <DndContext
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={onDragEnd}
            onDragMove={handleLeftDragMove}
            sensors={[mouseSensor]}
          >
            <GanttFeatureDragHelper
              date={startAt}
              direction="left"
              featureId={feature.id}
            />
          </DndContext>
        )}
        <DndContext
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={onDragEnd}
          onDragMove={handleItemDragMove}
          onDragStart={handleItemDragStart}
          sensors={[mouseSensor]}
        >
          <GanttFeatureItemCard
            id={feature.id}
            hideLabels={hideLabels}
            color={feature.color}
            disabled={disabled}
          >
            {children ?? (
              <p className="flex-1 truncate text-xs">{feature.name}</p>
            )}
          </GanttFeatureItemCard>
        </DndContext>
        {onMove && !disabled && (
          <DndContext
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={onDragEnd}
            onDragMove={handleRightDragMove}
            sensors={[mouseSensor]}
          >
            <GanttFeatureDragHelper
              date={endAt ?? addRange(startAt, 2)}
              direction="right"
              featureId={feature.id}
            />
          </DndContext>
        )}
      </div>
    </div>
  );
};

export interface GanttFeatureListGroupProps {
  children: ReactNode;
  className?: string;
}

export const GanttFeatureListGroup: FC<GanttFeatureListGroupProps> = ({
  children,
  className,
}) => <div className={className}>{children}</div>;

export interface GanttFeatureRowProps {
  features: GanttFeature[];
  onMove?: (id: string, startAt: Date, endAt: Date | null) => void;
  children?: (feature: GanttFeature) => ReactNode;
  className?: string;
}

export const GanttFeatureRow: FC<GanttFeatureRowProps> = ({
  features,
  onMove,
  children,
  className,
}) => {
  // Sort features by start date to handle potential overlaps
  const sortedFeatures = [...features].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );

  // Calculate sub-row positions for overlapping features using a proper algorithm
  const featureWithPositions = [];
  const subRowEndTimes: Date[] = []; // Track when each sub-row becomes free

  for (const feature of sortedFeatures) {
    let subRow = 0;

    // Find the first sub-row that's free (doesn't overlap)
    while (
      subRow < subRowEndTimes.length &&
      subRowEndTimes[subRow] > feature.startAt
    ) {
      subRow++;
    }

    // Update the end time for this sub-row
    if (subRow === subRowEndTimes.length) {
      subRowEndTimes.push(feature.endAt);
    } else {
      subRowEndTimes[subRow] = feature.endAt;
    }

    featureWithPositions.push({ ...feature, subRow });
  }

  const maxSubRows = Math.max(1, subRowEndTimes.length);

  return (
    <div
      className={cn("relative", className)}
      style={{
        height: `calc(${maxSubRows} * var(--gantt-row-height))`,
        minHeight: "var(--gantt-row-height)",
      }}
    >
      {featureWithPositions.map((feature) => (
        <div
          className="absolute w-full"
          key={feature.id}
          style={{
            top: `calc(${feature.subRow} * var(--gantt-row-height))`,
            height: "var(--gantt-row-height)",
          }}
        >
          <GanttFeatureItem {...feature} onMove={onMove}>
            {children ? (
              children(feature)
            ) : (
              <p className="flex-1 truncate text-xs">{feature.name}</p>
            )}
          </GanttFeatureItem>
        </div>
      ))}
    </div>
  );
};

export interface GanttFeatureListProps {
  className?: string;
  children: ReactNode;
}

export const GanttFeatureList: FC<GanttFeatureListProps> = ({
  className,
  children,
}) => (
  <div className={cn("relative top-0 left-0 w-max", className)}>
    <GanttVerticalGrid />
    <div className="relative z-10 w-max">{children}</div>
  </div>
);

export const GanttMarker: FC<
  GanttMarkerProps & {
    onRemove?: (id: string) => void;
    className?: string;
  }
> = memo(({ label, date, id, onRemove, className }) => {
  const gantt = useContext(GanttContext);
  const differenceIn = useMemo(
    () => getDifferenceIn(gantt.range),
    [gantt.range],
  );
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData],
  );

  // Memoize expensive calculations
  const offset = useMemo(
    () => differenceIn(date, timelineStartDate),
    [differenceIn, date, timelineStartDate],
  );
  const innerOffset = useMemo(
    () =>
      calculateInnerOffset(
        date,
        gantt.range,
        (gantt.columnWidth * gantt.zoom) / 100,
      ),
    [date, gantt.range, gantt.columnWidth, gantt.zoom],
  );

  const handleRemove = useCallback(() => onRemove?.(id), [onRemove, id]);

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group pointer-events-auto sticky top-0 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded-b-md bg-card px-2 py-1 text-foreground text-xs",
              className,
            )}
          >
            {label}
            <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
              {formatDate(date, "MMM dd, yyyy")}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onRemove ? (
            <ContextMenuItem
              className="flex items-center gap-2 text-destructive"
              onClick={handleRemove}
            >
              <TrashIcon size={16} />
              Remove marker
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      <div className={cn("h-full w-px bg-card", className)} />
    </div>
  );
});

GanttMarker.displayName = "GanttMarker";

export interface GanttProviderProps {
  zoom?: number;
  range?: Range;
  startDate?: Date;
  onAddItem?: (date: Date) => void;
  children?: ReactNode;
  className?: string;
  weekendDays?: number[];
  containerRef?: RefObject<HTMLDivElement | null>;
  headerHeight?: number;
  rowHeight?: number;
}

export const GanttProvider: FC<GanttProviderProps> = ({
  zoom = 100,
  range = "monthly",
  startDate,
  onAddItem,
  children,
  className,
  weekendDays = [0, 6],
  containerRef,
  headerHeight: propHeaderHeight,
  rowHeight: propRowHeight,
}) => {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = (containerRef ||
    internalScrollRef) as RefObject<HTMLDivElement>;
  const [timelineData, setTimelineData] = useState<TimelineData>(
    createInitialTimelineData(startDate || new Date()),
  );
  const [, setScrollX] = useGanttScrollX();
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const headerHeight = propHeaderHeight ?? 36;
  const rowHeight = propRowHeight ?? 36;
  let columnWidth = 50;
  if (range === "weekly") {
    columnWidth = 100;
  } else if (range === "sprint") {
    columnWidth = 140;
  } else if (range === "monthly") {
    columnWidth = 150;
  } else if (range === "quarterly") {
    columnWidth = 100;
  } else if (range === "half-yearly") {
    columnWidth = 200;
  } else if (range === "yearly") {
    columnWidth = 400;
  }

  // Memoize CSS variables to prevent unnecessary re-renders
  const cssVariables = useMemo(
    () =>
      ({
        "--gantt-zoom": `${zoom}`,
        "--gantt-column-width": `${(zoom / 100) * columnWidth}px`,
        "--gantt-header-height": `${headerHeight}px`,
        "--gantt-row-height": `${rowHeight}px`,
        "--gantt-sidebar-width": `${sidebarWidth}px`,
      }) as CSSProperties,
    [zoom, columnWidth, sidebarWidth],
  );

  useEffect(() => {
    if (scrollRef.current) {
      // Calculate today's position
      const today = new Date();
      const timelineStartDate = new Date(
        timelineData[0]?.year ?? today.getFullYear(),
        0,
        1,
      );

      // Calculate offset for today
      const todayOffset = getOffset(today, timelineStartDate, {
        zoom,
        range,
        columnWidth,
        sidebarWidth,
        headerHeight,
        rowHeight,
        onAddItem,
        placeholderLength: 2,
        timelineData,
        ref: scrollRef,
      });

      // Scroll to today's position (with some padding to show context)
      scrollRef.current.scrollLeft = Math.max(0, todayOffset - 50);
      setScrollX(scrollRef.current.scrollLeft);
    }
  }, [
    setScrollX,
    timelineData,
    zoom,
    range,
    columnWidth,
    sidebarWidth,
    headerHeight,
    rowHeight,
    onAddItem,
  ]);

  // Re-center timeline when startDate changes
  useEffect(() => {
    if (!startDate || !scrollRef.current) return;

    const timelineStartDate = new Date(
      timelineData[0]?.year ?? startDate.getFullYear(),
      0,
      1,
    );

    const offset = getOffset(startDate, timelineStartDate, {
      zoom,
      range,
      columnWidth,
      sidebarWidth,
      headerHeight,
      rowHeight,
      onAddItem,
      placeholderLength: 2,
      timelineData,
      ref: scrollRef,
    });

    scrollRef.current.scrollLeft = Math.max(0, offset - 50);
    setScrollX(scrollRef.current.scrollLeft);
  }, [
    startDate,
    timelineData,
    zoom,
    range,
    columnWidth,
    sidebarWidth,
    headerHeight,
    rowHeight,
    onAddItem,
    setScrollX,
  ]);

  // Update sidebar width when DOM is ready
  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebarElement = scrollRef.current?.querySelector(
        '[data-roadmap-ui="gantt-sidebar"]',
      );
      const newWidth = sidebarElement ? 300 : 0;
      setSidebarWidth(newWidth);
    };

    // Update immediately
    updateSidebarWidth();

    // Also update on resize or when children change
    const observer = new MutationObserver(updateSidebarWidth);
    if (scrollRef.current) {
      observer.observe(scrollRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleScrollThrottled = useMemo(
    () =>
      throttle(() => {
        const scrollElement = scrollRef.current;
        if (!scrollElement) {
          return;
        }

        setScrollX(scrollElement.scrollLeft);

        const { scrollLeft, clientWidth, scrollWidth } = scrollElement;

        if (scrollLeft === 0) {
          // Extend timelineData to the past
          const firstYear = timelineData.at(0)?.year;

          if (!firstYear) {
            return;
          }

          const newTimelineData: TimelineData = [];
          newTimelineData.push({
            year: firstYear - 1,
            quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
              months: new Array(3).fill(null).map((_, monthIndex) => {
                const month = quarterIndex * 3 + monthIndex;
                return {
                  days: getDaysInMonth(new Date(firstYear, month, 1)),
                };
              }),
            })),
          });

          setTimelineData([...newTimelineData, ...timelineData]);

          // Scroll a bit forward so it's not at the very start
          scrollElement.scrollLeft = scrollElement.clientWidth;
          setScrollX(scrollElement.scrollLeft);
        } else if (scrollLeft + clientWidth >= scrollWidth) {
          // Extend timelineData to the future
          const lastYear = timelineData.at(-1)?.year;

          if (!lastYear) {
            return;
          }

          const newTimelineData: TimelineData = [...timelineData];
          newTimelineData.push({
            year: lastYear + 1,
            quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
              months: new Array(3).fill(null).map((_, monthIndex) => {
                const month = quarterIndex * 3 + monthIndex;
                return {
                  days: getDaysInMonth(new Date(lastYear, month, 1)),
                };
              }),
            })),
          });

          setTimelineData(newTimelineData);

          // Scroll a bit back so it's not at the very end
          scrollElement.scrollLeft =
            scrollElement.scrollWidth - scrollElement.clientWidth;
          setScrollX(scrollElement.scrollLeft);
        }
      }, 100),
    [timelineData, setTimelineData, setScrollX, scrollRef],
  );

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScrollThrottled);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScrollThrottled);
      }
    };
  }, [handleScrollThrottled, scrollRef]);

  const scrollToFeature = useCallback(
    (feature: GanttFeature) => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      // Calculate timeline start date from timelineData
      const timelineStartDate = new Date(timelineData[0].year, 0, 1);

      // Calculate the horizontal offset for the feature's start date
      const offset = getOffset(feature.startAt, timelineStartDate, {
        zoom,
        range,
        columnWidth,
        sidebarWidth,
        headerHeight,
        rowHeight,
        onAddItem,
        placeholderLength: 2,
        timelineData,
        ref: scrollRef,
      });

      // Scroll to align the feature's start with the right side of the sidebar
      const targetScrollLeft = Math.max(0, offset - 50);

      scrollElement.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    },
    [
      timelineData,
      zoom,
      range,
      columnWidth,
      sidebarWidth,
      headerHeight,
      rowHeight,
      onAddItem,
      scrollRef,
    ],
  );

  return (
    <GanttContext.Provider
      value={{
        zoom,
        range,
        headerHeight,
        columnWidth,
        sidebarWidth,
        rowHeight,
        onAddItem,
        timelineData,
        placeholderLength: 2,
        ref: scrollRef,
        scrollToFeature,
        weekendDays,
      }}
    >
      <div
        className={cn(
          "gantt relative grid h-full w-full flex-none select-none overflow-auto rounded-sm bg-secondary",
          range,
          className,
        )}
        ref={internalScrollRef}
        style={{
          ...cssVariables,
          gridTemplateColumns: "var(--gantt-sidebar-width) 1fr",
        }}
      >
        {children}
      </div>
    </GanttContext.Provider>
  );
};

export interface GanttTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const GanttTimeline = forwardRef<HTMLDivElement, GanttTimelineProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-full w-full flex-none overflow-auto bg-muted/50",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

GanttTimeline.displayName = "GanttTimeline";

export interface GanttTodayProps {
  className?: string;
}

export const GanttToday: FC<GanttTodayProps> = ({ className }) => {
  const label = "Today";
  const date = useMemo(() => new Date(), []);
  const gantt = useContext(GanttContext);
  const differenceIn = useMemo(
    () => getDifferenceIn(gantt.range),
    [gantt.range],
  );
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData],
  );

  // Memoize expensive calculations
  const offset = useMemo(
    () => differenceIn(date, timelineStartDate),
    [differenceIn, date, timelineStartDate],
  );
  const innerOffset = useMemo(
    () =>
      calculateInnerOffset(
        date,
        gantt.range,
        (gantt.columnWidth * gantt.zoom) / 100,
      ),
    [date, gantt.range, gantt.columnWidth, gantt.zoom],
  );

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-[50] flex h-full select-none flex-col items-center justify-start overflow-visible"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <div
        className={cn(
          "group pointer-events-auto sticky top-1 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded bg-yellow-400 px-2 py-0.5 text-white font-bold text-[10px] shadow-md z-[51]",
          className,
        )}
      >
        {label}
        <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
          {formatDate(date, "MMM dd, yyyy")}
        </span>
      </div>
      <div className={cn("h-full w-0.5 bg-yellow-500 shadow-sm", className)} />
    </div>
  );
};

// Demo - uses function to generate dates at runtime to avoid SSR/client mismatch
function createDemoData() {
  const today = new Date();
  const statuses: GanttStatus[] = [
    { id: "1", name: "Planned", color: "#6B7280" },
    { id: "2", name: "In Progress", color: "#F59E0B" },
    { id: "3", name: "Done", color: "#10B981" },
  ];

  const features: GanttFeature[] = [
    {
      id: "1",
      name: "Design System Setup",
      startAt: addDays(today, -30),
      endAt: addDays(today, -10),
      status: statuses[2],
    },
    {
      id: "2",
      name: "Component Library",
      startAt: addDays(today, -15),
      endAt: addDays(today, 15),
      status: statuses[1],
    },
    {
      id: "3",
      name: "Documentation",
      startAt: addDays(today, 5),
      endAt: addDays(today, 35),
      status: statuses[0],
    },
    {
      id: "4",
      name: "API Integration",
      startAt: addDays(today, -5),
      endAt: addDays(today, 25),
      status: statuses[1],
    },
    {
      id: "5",
      name: "Testing & QA",
      startAt: addDays(today, 20),
      endAt: addDays(today, 45),
      status: statuses[0],
    },
    {
      id: "6",
      name: "Launch Preparation",
      startAt: addDays(today, 40),
      endAt: addDays(today, 55),
      status: statuses[0],
    },
  ];

  const markers = [
    {
      id: "m1",
      date: addDays(today, -20),
      label: "Kickoff",
      className: "bg-blue-100 text-blue-900",
    },
    {
      id: "m2",
      date: addDays(today, 30),
      label: "Beta Release",
      className: "bg-purple-100 text-purple-900",
    },
    {
      id: "m3",
      date: addDays(today, 50),
      label: "Launch",
      className: "bg-green-100 text-green-900",
    },
  ];

  return { features, markers };
}

export function GanttDemo() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<{
    features: GanttFeature[];
    markers: typeof demoMarkers;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    setData(createDemoData());
  }, []);

  const handleMoveFeature = useCallback(
    (id: string, startAt: Date, endAt: Date | null) => {
      if (!endAt) return;
      setData((prev) =>
        prev
          ? {
              ...prev,
              features: prev.features.map((feature) =>
                feature.id === id ? { ...feature, startAt, endAt } : feature,
              ),
            }
          : null,
      );
    },
    [],
  );

  // Prevent SSR to avoid dnd-kit hydration mismatch
  if (!mounted || !data) {
    return <div className="h-screen w-screen bg-muted/50 animate-pulse" />;
  }

  return (
    <div className="h-screen w-screen">
      <GanttProvider className="border rounded-lg" range="monthly" zoom={100}>
        <GanttSidebar>
          <GanttSidebarGroup name="Product Roadmap">
            {data.features.map((feature) => (
              <GanttSidebarItem feature={feature} key={feature.id} />
            ))}
          </GanttSidebarGroup>
        </GanttSidebar>
        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            <GanttFeatureListGroup>
              {data.features.map((feature) => (
                <GanttFeatureItem
                  key={feature.id}
                  onMove={handleMoveFeature}
                  {...feature}
                >
                  <p className="flex-1 truncate text-xs">{feature.name}</p>
                </GanttFeatureItem>
              ))}
            </GanttFeatureListGroup>
          </GanttFeatureList>
          {data.markers.map((marker) => (
            <GanttMarker key={marker.id} {...marker} />
          ))}
          <GanttToday />
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}

const demoMarkers: {
  id: string;
  date: Date;
  label: string;
  className: string;
}[] = [];
