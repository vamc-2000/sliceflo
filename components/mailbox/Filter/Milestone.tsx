"use client";

import { FC } from "react";

interface MilestoneProps {
  onSelect: (value: string) => void;
}

const Milestone: FC<MilestoneProps> = ({ onSelect }) => {
  return (
    <div className="w-50 p-2 flex flex-col rounded-lg text-xs">
      <button
        className="text-left px-3 py-1 rounded hover:bg-muted text-foreground font-medium"
        onClick={() => onSelect("Milestone 1")}
      >
        Milestone 1
      </button>

      <button
        className="text-left px-3 py-1 rounded hover:bg-muted text-foreground font-medium"
        onClick={() => onSelect("Milestone 2")}
      >
        Milestone 2
      </button>

      <button
        className="text-left px-3 py-1 rounded hover:bg-muted text-foreground font-medium"
        onClick={() => onSelect("Milestone 3")}
      >
        Milestone 3
      </button>
    </div>
  );
};

export default Milestone;
