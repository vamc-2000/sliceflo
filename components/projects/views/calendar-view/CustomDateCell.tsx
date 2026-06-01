// components/projects/views/calendar-view/CustomDateCell.tsx
import { useState } from "react";
import { Plus } from "lucide-react";

interface CustomDateCellProps {
  value: Date;
  children: React.ReactNode;
  onAddTask: (date: Date) => void;
  weekendDays: number[];
  onDrop?: (date: Date) => void;
}

export function CustomDateCell({
  value,
  children,
  onAddTask,
  weekendDays = [0, 6],
  onDrop
}: CustomDateCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Check if the date is weekend using the passed weekendDays prop
  const dayOfWeek = value.getDay();
  const isWeekend = weekendDays.includes(dayOfWeek);
  // const isSunday = dayOfWeek === 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (onDrop) {
      onDrop(value);
    }
  };

  return (
    <div
      className="custom-date-cell-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isWeekend ? 'var(--muted)' : 'transparent',
        boxSizing: 'border-box'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Original calendar cell content */}
      {children}

      {/* Transparent overlay that captures hover but allows clicks through */}
      <div
        className="hover-capture-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 5
        }}
      />

      {/* Plus button - Show on non-weekend cells */}
      {isHovered && !isWeekend && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddTask(value);
          }}
          className="absolute bottom-1 right-1 h-6 w-6 rounded bg-primary hover:bg-primary text-primary-foreground flex items-center justify-center shadow-md transition-all hover:scale-110"
          style={{
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          aria-label="Add task"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}

      {/* Drop indicator */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-primary border-dashed rounded pointer-events-none z-5">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
}
