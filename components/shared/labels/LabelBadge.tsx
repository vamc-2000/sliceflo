import React from "react";
import { X } from "lucide-react";

interface LabelBadgeProps {
  label: {
    id: string;
    name: string;
    color: string;
  };
  onRemove?: (id: string) => void;
  className?: string;
}

export const LabelBadge: React.FC<LabelBadgeProps> = ({
  label,
  onRemove,
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${className}`}
      style={{
        backgroundColor: `${label.color}15`,
        color: label.color,
        border: `1px solid ${label.color}30`,
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label.id);
          }}
          className="hover:bg-foreground/10 rounded-full p-0.5 transition-colors text-current"
          aria-label={`Remove ${label.name} label`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
