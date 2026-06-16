"use client";

import React from "react";
import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import tunnel from "tunnel-rat";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const t = tunnel();

export type { DragEndEvent } from "@dnd-kit/core";

type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
} & Record<string, unknown>;

type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  activeCardId: string | null;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
});

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>;

export const KanbanBoard = ({
  id,
  children,
  className,
  style,
  ...props
}: KanbanBoardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-40 divide-y overflow-hidden rounded-md border bg-secondary text-xs shadow-sm transition-all",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
  onCardClick?: () => void;
  disabled?: boolean;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  children,
  className,
  onCardClick,
  disabled,
}: KanbanCardProps<T>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps;

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Don't trigger if clicking interactive elements
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest('[role="button"]') ||
      target.closest("a")
    ) {
      return;
    }

    onCardClick?.();
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="touch-none">
        <Card
          {...(!disabled ? listeners : {})}
          {...(!disabled ? attributes : {})}
          onClick={handleClick}
          className={cn(
            "cursor-pointer gap-4 rounded-md p-3 shadow-sm transition-all",
            !disabled && "cursor-grab",
            isDragging && "cursor-grabbing opacity-30",
            className,
          )}
        >
          {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              "cursor-grabbing gap-4 rounded-md p-3 shadow-sm ring-2 ring-primary",
              className,
            )}
          >
            {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
          </Card>
        </t.In>
      )}
    </>
  );
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    children: (item: T) => ReactNode;
    id: string;
    footer?: ReactNode;
  };

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  id,
  footer,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === id);
  const items = filteredData.map((item) => item.id);

  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const { over } = useDndContext();
  const isOverThisColumn =
    isOver || (over && (over.id === id || items.includes(over.id as string)));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-0 flex flex-col transition-all rounded-md",
        isOverThisColumn && "ring-2 ring-primary bg-secondary/50",
      )}
    >
      <ScrollArea className="flex-grow overflow-hidden">
        <SortableContext items={items}>
          <div
            className={cn("flex flex-col gap-2 p-2", className)}
            {...(props as any)}
          >
            {filteredData.map(children)}
            {footer}
          </div>
        </SortableContext>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div
    className={cn("m-0 p-2 font-semibold text-sm", className)}
    {...(props as any)}
  />
);

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, "children"> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = data.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(event.active.id as string);
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);
    const overItem = data.find((item) => item.id === over.id);

    if (!activeItem) {
      return;
    }

    const activeColumn = activeItem.column;
    const overColumn =
      overItem?.column ||
      columns.find((col) => col.id === over.id)?.id ||
      columns[0]?.id;

    if (activeColumn !== overColumn) {
      let newData = [...data];
      const activeIndex = newData.findIndex((item) => item.id === active.id);
      let overIndex = newData.findIndex((item) => item.id === over.id);

      newData[activeIndex].column = overColumn;

      if (overIndex === -1) {
        const columnTasks = newData.filter(
          (item) => item.column === overColumn && item.id !== active.id,
        );
        if (columnTasks.length > 0) {
          const lastColumnTask = columnTasks[columnTasks.length - 1];
          overIndex = newData.findIndex(
            (item) => item.id === lastColumnTask.id,
          );
        } else {
          overIndex = newData.length;
        }
      }

      newData = arrayMove(newData, activeIndex, overIndex);

      onDataChange?.(newData);
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);

    onDragEnd?.(event);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    let newData = [...data];

    const oldIndex = newData.findIndex((item) => item.id === active.id);
    let newIndex = newData.findIndex((item) => item.id === over.id);

    if (newIndex === -1) {
      const overColumn =
        columns.find((col) => col.id === over.id)?.id || columns[0]?.id;
      const columnTasks = newData.filter(
        (item) => item.column === overColumn && item.id !== active.id,
      );
      if (columnTasks.length > 0) {
        const lastColumnTask = columnTasks[columnTasks.length - 1];
        newIndex = newData.findIndex((item) => item.id === lastColumnTask.id);
      } else {
        newIndex = newData.length;
      }
    }

    newData = arrayMove(newData, oldIndex, newIndex);

    onDataChange?.(newData);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {};

      return `Picked up the card "${name}" from the "${column}" column`;
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dragged the card "${name}" over the "${newColumn}" column`;
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dropped the card "${name}" into the "${newColumn}" column`;
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};

      return `Cancelled dragging the card "${name}"`;
    },
  };

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
        {...(props as any)}
      >
        <div className={cn("flex flex-row items-stretch gap-4", className)}>
          {columns.map((column) => children(column))}
        </div>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              <t.Out />
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
};
